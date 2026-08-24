import { apiFetch } from "@/lib/api-client";
import type { ApiRecipe } from "@/lib/api/types";

export type MealSuggestionStatus = "pending" | "ready" | "failed";

/** GET/POST /meal-suggestions/today(/refresh) response — today's AI meal picks. */
export interface MealSuggestion {
  status: MealSuggestionStatus;
  suggestion_date: string;
  breakfast: ApiRecipe[];
  lunch: ApiRecipe[];
  dinner: ApiRecipe[];
  error_message: string | null;
}

/** `YYYY-MM-DD` in the user's local time — matches mobile's `localIsoDate()`.
 * Must NOT use `toISOString()`, which is UTC and can land on the wrong day. */
export function localIsoDate(date: Date = new Date()): string {
  const y = String(date.getFullYear()).padStart(4, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function getTodaySuggestions(params?: {
  lang?: string;
  suggestionDate?: string;
  signal?: AbortSignal;
}): Promise<MealSuggestion> {
  return apiFetch<MealSuggestion>("/meal-suggestions/today", {
    query: {
      lang: params?.lang,
      suggestion_date: params?.suggestionDate,
    },
    signal: params?.signal,
  });
}

export async function refreshTodaySuggestions(params?: {
  lang?: string;
  suggestionDate?: string;
  extraExcludeIds?: number[];
  signal?: AbortSignal;
}): Promise<MealSuggestion> {
  return apiFetch<MealSuggestion>("/meal-suggestions/today/refresh", {
    method: "POST",
    query: {
      lang: params?.lang,
      suggestion_date: params?.suggestionDate,
    },
    body: { extra_exclude_ids: params?.extraExcludeIds ?? [] },
    signal: params?.signal,
  });
}
