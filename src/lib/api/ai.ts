import { apiFetch, apiUpload, ApiError } from "@/lib/api-client";
import type {
  AiJobAccepted,
  AiRequestDetail,
  ChatHistoryMessage,
  ChatResponse,
  RagRecipe,
} from "@/lib/api/types";

const POLL_INTERVAL_MS = 1000;
const CHAT_TIMEOUT_MS = 200_000;

type AuthOpts = { token?: string };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

function parseRecipes(value: unknown): RagRecipe[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((json) => ({
      recipe_id:
        json.recipe_id != null
          ? String(json.recipe_id)
          : json.id != null
            ? String(json.id)
            : null,
      title:
        (json.title as string) ||
        (json.RecipeName as string) ||
        "Untitled recipe",
      ingredients: asStringList(json.ingredients),
      directions: asStringList(json.directions),
      dietary_restrictions: asStringList(json.dietary_restrictions),
      estimated_servings:
        typeof json.estimated_servings === "number"
          ? json.estimated_servings
          : null,
    }));
}

function parseChatPayload(
  detail: AiRequestDetail,
  fallbackSessionId?: string | null,
): ChatResponse {
  const payload = { ...(detail.output_payload ?? {}) };
  if (!payload.task_id) payload.task_id = detail.task_id;
  if (!payload.session_id && fallbackSessionId) {
    payload.session_id = fallbackSessionId;
  }
  if (!payload.phase) payload.phase = "gather";

  return {
    task_id: String(payload.task_id ?? detail.task_id),
    reply: String(payload.reply ?? ""),
    phase: String(payload.phase ?? "gather"),
    session_id:
      payload.session_id != null
        ? String(payload.session_id)
        : fallbackSessionId ?? null,
    recipes: parseRecipes(payload.recipes),
    known_info:
      payload.known_info && typeof payload.known_info === "object"
        ? (payload.known_info as Record<string, unknown>)
        : {},
  };
}

async function getRequest(
  taskId: string,
  auth?: AuthOpts,
): Promise<AiRequestDetail> {
  return apiFetch<AiRequestDetail>(`/ai/requests/${taskId}`, {
    token: auth?.token,
  });
}

async function waitForResult(
  taskId: string,
  auth?: AuthOpts,
): Promise<AiRequestDetail> {
  const deadline = Date.now() + CHAT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const detail = await getRequest(taskId, auth);
    if (detail.status === "completed") {
      if (!detail.output_payload) {
        throw new ApiError("AI job completed without a result payload.", 500);
      }
      return detail;
    }
    if (detail.status === "failed") {
      throw new ApiError(
        detail.error_message?.trim() || "AI job failed.",
        500,
      );
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw new ApiError(
    `AI job timed out after ${CHAT_TIMEOUT_MS / 1000}s. Please try again.`,
    408,
  );
}

export async function aiWelcome(input?: {
  sessionId?: string;
  dietaryRestrictions?: string[];
  primaryGoal?: string;
  ingredients?: string[];
  token?: string;
}): Promise<ChatResponse> {
  const accepted = await apiFetch<AiJobAccepted>("/ai/chat/welcome", {
    method: "POST",
    token: input?.token,
    body: {
      ...(input?.sessionId ? { session_id: input.sessionId } : {}),
      dietary_restrictions: input?.dietaryRestrictions ?? [],
      ...(input?.primaryGoal ? { primary_goal: input.primaryGoal } : {}),
      ingredients: input?.ingredients ?? [],
    },
  });

  const detail = await waitForResult(accepted.task_id, { token: input?.token });
  return parseChatPayload(
    detail,
    accepted.session_id ?? input?.sessionId ?? null,
  );
}

export async function aiChat(input: {
  message: string;
  sessionId: string;
  conversationHistory?: ChatHistoryMessage[];
  dietaryRestrictions?: string[];
  primaryGoal?: string;
  ingredients?: string[];
  token?: string;
}): Promise<ChatResponse> {
  const accepted = await apiFetch<AiJobAccepted>("/ai/chat", {
    method: "POST",
    token: input.token,
    body: {
      message: input.message,
      session_id: input.sessionId,
      conversation_history: input.conversationHistory ?? [],
      dietary_restrictions: input.dietaryRestrictions ?? [],
      ...(input.primaryGoal ? { primary_goal: input.primaryGoal } : {}),
      ingredients: input.ingredients ?? [],
    },
  });

  const detail = await waitForResult(accepted.task_id, { token: input.token });
  return parseChatPayload(detail, accepted.session_id ?? input.sessionId);
}

export interface DishMatch {
  rank: number;
  dishName: string;
  confidence: number;
}

export interface DishRecognitionResult {
  dishName: string;
  results: DishMatch[];
  suggestedRecipes: string[];
  /** Relative `/media/...` path of the uploaded photo — resolve with `resolveMediaUrl`. */
  imageUrl: string;
}

export async function aiDetectDish(file: File): Promise<DishRecognitionResult> {
  const accepted = await apiUpload<AiJobAccepted>("/ai/dish-recognition", file);
  const detail = await waitForResult(accepted.task_id);
  const payload = (detail.output_payload ?? {}) as Record<string, unknown>;
  const results = Array.isArray(payload.results)
    ? (payload.results as Record<string, unknown>[]).map((r) => ({
        rank: Number(r.rank ?? 0),
        dishName: String(r.dish_name ?? ""),
        confidence: Number(r.confidence ?? 0),
      }))
    : [];
  return {
    dishName: String(payload.dish_name ?? results[0]?.dishName ?? ""),
    results,
    suggestedRecipes: asStringList(payload.suggested_recipes),
    imageUrl: typeof payload.image_url === "string" ? payload.image_url : "",
  };
}

export interface IngredientsDetectionResult {
  ingredients: string[];
  /** Relative `/media/...` path of the uploaded photo — resolve with `resolveMediaUrl`. */
  imageUrl: string;
  /** Same photo with detected ingredients annotated, when the backend provides one. */
  annotatedImageUrl: string;
}

export async function aiDetectIngredients(file: File): Promise<IngredientsDetectionResult> {
  const accepted = await apiUpload<AiJobAccepted>("/ai/ingredients/detect", file);
  const detail = await waitForResult(accepted.task_id);
  const payload = (detail.output_payload ?? {}) as Record<string, unknown>;
  return {
    ingredients: asStringList(payload.ingredients),
    imageUrl: typeof payload.image_url === "string" ? payload.image_url : "",
    annotatedImageUrl: typeof payload.annotated_image_url === "string" ? payload.annotated_image_url : "",
  };
}
