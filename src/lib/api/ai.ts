import { apiFetch, apiUpload, ApiError } from "@/lib/api-client";
import type {
  AiRequestDetail,
  ApiRecipe,
  ChatOption,
  ChatResponse,
  ChatSessionDetail,
  ChatSessionListResponse,
} from "@/lib/api/types";
import { prepareVisionUpload } from "@/lib/vision-upload";

const CHAT_TIMEOUT_MS = 200_000;
/** Upload + dish AI (~60s server) + enrich — mobile Safari needs more headroom. */
const VISION_TIMEOUT_MS = 180_000;

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

/** The chat AI's `recipes[]` is the same full shape as `GET /recipes/{id}`
 * (image_url, nutrition, mapped_ingredients included) — parsed defensively
 * since it comes from an AI-assembled payload rather than the strict recipe
 * endpoint, but nothing here is dropped/summarized anymore. */
function parseChatRecipe(json: Record<string, unknown>): ApiRecipe | null {
  const rawId = json.id ?? json.recipe_id;
  const id = typeof rawId === "number" ? rawId : Number(rawId);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    title: (json.title as string) || (json.RecipeName as string) || "Untitled recipe",
    ingredients: asStringList(json.ingredients),
    mapped_ingredients: Array.isArray(json.mapped_ingredients)
      ? (json.mapped_ingredients as ApiRecipe["mapped_ingredients"])
      : undefined,
    nutrition:
      json.nutrition && typeof json.nutrition === "object"
        ? (json.nutrition as ApiRecipe["nutrition"])
        : null,
    directions: asStringList(json.directions),
    ner: asStringList(json.ner),
    estimated_servings:
      typeof json.estimated_servings === "number" ? json.estimated_servings : null,
    dietary_restrictions: asStringList(json.dietary_restrictions),
    image_url: typeof json.image_url === "string" ? json.image_url : null,
    visibility: json.visibility === "private" ? "private" : "public",
    created_by: typeof json.created_by === "number" ? json.created_by : null,
    created_at: (json.created_at as string) || "",
    updated_at: (json.updated_at as string) || "",
    locale: (json.locale as string) || "en",
  };
}

function parseRecipes(value: unknown): ApiRecipe[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map(parseChatRecipe)
    .filter((r): r is ApiRecipe => r !== null);
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
  const upload = await prepareVisionUpload(file);
  const detail = requireCompleted(
    await apiUpload<AiRequestDetail>("/ai/dish-recognition", upload, {
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
  const upload = await prepareVisionUpload(file);
  const detail = requireCompleted(
    await apiUpload<AiRequestDetail>("/ai/ingredients/detect", upload, {
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

// ─── Chat history (saved sessions) ─────────────────────────────────────────

/** GET /ai/sessions — the sidebar list of the user's past conversations. */
export async function listChatSessions(params?: {
  skip?: number;
  limit?: number;
  token?: string;
}): Promise<ChatSessionListResponse> {
  return apiFetch<ChatSessionListResponse>("/ai/sessions", {
    token: params?.token,
    query: { skip: params?.skip ?? 0, limit: params?.limit ?? 20 },
  });
}

/** GET /ai/sessions/{id} — reopens one conversation's full transcript. */
export async function getChatSession(
  sessionId: string,
  token?: string,
): Promise<ChatSessionDetail> {
  return apiFetch<ChatSessionDetail>(`/ai/sessions/${sessionId}`, { token });
}

export async function deleteChatSession(
  sessionId: string,
  token?: string,
): Promise<void> {
  await apiFetch<void>(`/ai/sessions/${sessionId}`, { method: "DELETE", token });
}
