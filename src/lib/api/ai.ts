import { apiFetch, apiUpload, ApiError } from "@/lib/api-client";
import type {
  AiRequestDetail,
  ApiRecipe,
  ChatOption,
  ChatResponse,
  RagRecipe,
} from "@/lib/api/types";

const CHAT_TIMEOUT_MS = 200_000;
const VISION_TIMEOUT_MS = 90_000;

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

function parseOptions(value: unknown): ChatOption[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((json) => ({
      index: typeof json.index === "number" ? json.index : 0,
      label: typeof json.label === "string" ? json.label : "",
      rationale: typeof json.rationale === "string" ? json.rationale : "",
    }));
}

function requireCompleted(detail: AiRequestDetail): AiRequestDetail {
  if (detail.status === "failed") {
    throw new ApiError(detail.error_message?.trim() || "AI job failed.", 502);
  }
  if (detail.status !== "completed" || !detail.output_payload) {
    throw new ApiError("AI job completed without a result payload.", 500);
  }
  return detail;
}

function parseChatPayload(
  detail: AiRequestDetail,
  fallbackSessionId?: string | null,
): ChatResponse {
  const payload = { ...(detail.output_payload ?? {}) };
  if (!payload.task_id) payload.task_id = detail.task_id;
  const sessionId =
    (payload.session_id != null ? String(payload.session_id) : null) ??
    detail.session_id ??
    fallbackSessionId ??
    null;
  if (!payload.session_id && sessionId) {
    payload.session_id = sessionId;
  }
  if (!payload.phase) payload.phase = "gather";

  return {
    task_id: String(payload.task_id ?? detail.task_id),
    reply: String(payload.reply ?? ""),
    phase: String(payload.phase ?? "gather"),
    session_id: sessionId,
    recipes: parseRecipes(payload.recipes),
    options: parseOptions(payload.options),
    known_info:
      payload.known_info && typeof payload.known_info === "object"
        ? (payload.known_info as Record<string, unknown>)
        : {},
  };
}

export async function aiWelcome(input?: {
  sessionId?: string;
  dietaryRestrictions?: string[];
  primaryGoal?: string;
  ingredients?: string[];
  token?: string;
}): Promise<ChatResponse> {
  const detail = requireCompleted(
    await apiFetch<AiRequestDetail>("/ai/chat/welcome", {
      method: "POST",
      token: input?.token,
      timeoutMs: CHAT_TIMEOUT_MS,
      body: {
        ...(input?.sessionId ? { session_id: input.sessionId } : {}),
        dietary_restrictions: input?.dietaryRestrictions ?? [],
        ...(input?.primaryGoal ? { primary_goal: input.primaryGoal } : {}),
        ingredients: input?.ingredients ?? [],
      },
    }),
  );
  return parseChatPayload(detail, input?.sessionId ?? null);
}

export async function aiChat(input: {
  message: string;
  sessionId: string;
  dietaryRestrictions?: string[];
  primaryGoal?: string;
  ingredients?: string[];
  token?: string;
}): Promise<ChatResponse> {
  const detail = requireCompleted(
    await apiFetch<AiRequestDetail>("/ai/chat", {
      method: "POST",
      token: input.token,
      timeoutMs: CHAT_TIMEOUT_MS,
      body: {
        message: input.message,
        session_id: input.sessionId,
        dietary_restrictions: input.dietaryRestrictions ?? [],
        ...(input.primaryGoal ? { primary_goal: input.primaryGoal } : {}),
        ingredients: input.ingredients ?? [],
      },
    }),
  );
  return parseChatPayload(detail, input.sessionId);
}

/**
 * POST /ai/chat with `selected_option_index` (mirrors mobile's `AiService.selectOption()`).
 * Sends a placeholder message because the API requires a non-empty `message`.
 */
export async function aiSelectOption(input: {
  sessionId: string;
  selectedOptionIndex: number;
  dietaryRestrictions?: string[];
  primaryGoal?: string;
  token?: string;
}): Promise<ChatResponse> {
  const detail = requireCompleted(
    await apiFetch<AiRequestDetail>("/ai/chat", {
      method: "POST",
      token: input.token,
      timeoutMs: CHAT_TIMEOUT_MS,
      body: {
        session_id: input.sessionId,
        selected_option_index: input.selectedOptionIndex,
        message: ".",
        dietary_restrictions: input.dietaryRestrictions ?? [],
        ...(input.primaryGoal ? { primary_goal: input.primaryGoal } : {}),
      },
    }),
  );
  return parseChatPayload(detail, input.sessionId);
}

export interface DishMatch {
  rank: number;
  dishName: string;
  confidence: number;
  /** Full recipe for this match (title/image/ingredients/nutrition/…), when the backend resolved one. */
  recipe: ApiRecipe | null;
}

export interface DishRecognitionResult {
  dishName: string;
  results: DishMatch[];
  suggestedRecipes: string[];
  /** Relative `/media/...` path of the uploaded photo — resolve with `resolveMediaUrl`. */
  imageUrl: string;
}

export async function aiDetectDish(
  file: File,
  language: "en" | "vi" = "en",
): Promise<DishRecognitionResult> {
  const detail = requireCompleted(
    await apiUpload<AiRequestDetail>("/ai/dish-recognition", file, {
      fields: { language },
      timeoutMs: VISION_TIMEOUT_MS,
    }),
  );
  const payload = (detail.output_payload ?? {}) as Record<string, unknown>;
  const results = Array.isArray(payload.results)
    ? (payload.results as Record<string, unknown>[]).map((r) => ({
        rank: Number(r.rank ?? 0),
        dishName: String(r.dish_name ?? ""),
        confidence: Number(r.confidence ?? 0),
        recipe: r.recipe && typeof r.recipe === "object" ? (r.recipe as ApiRecipe) : null,
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

export async function aiDetectIngredients(
  file: File,
  language: "en" | "vi" = "en",
): Promise<IngredientsDetectionResult> {
  const detail = requireCompleted(
    await apiUpload<AiRequestDetail>("/ai/ingredients/detect", file, {
      fields: { language },
      timeoutMs: VISION_TIMEOUT_MS,
    }),
  );
  const payload = (detail.output_payload ?? {}) as Record<string, unknown>;
  return {
    ingredients: asStringList(payload.ingredients),
    imageUrl: typeof payload.image_url === "string" ? payload.image_url : "",
    annotatedImageUrl:
      typeof payload.annotated_image_url === "string"
        ? payload.annotated_image_url
        : "",
  };
}
