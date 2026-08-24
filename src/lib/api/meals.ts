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

// ─── Meal plan ──────────────────────────────────────────────────────────────

export interface MealPlanItem {
  id: number;
  recipe_id: number;
  servings: number;
  recipe?: ApiRecipe;
}

export interface MealSlot {
  id: number;
  slot_key: string;
  label: string;
  sort_order: number;
  items: MealPlanItem[];
}

export interface MealPlan {
  id: number;
  plan_date: string;
  slots: MealSlot[];
}

const MAIN_SLOT_KEYS = new Set(["breakfast", "lunch", "dinner"]);

/** Main slots (breakfast/lunch/dinner) can't be deleted — only extra slots can. */
export function isMainSlot(slotKey: string): boolean {
  return MAIN_SLOT_KEYS.has(slotKey);
}

export async function getMealPlan(date: string, lang?: string): Promise<MealPlan> {
  return apiFetch<MealPlan>(`/meal-plans/${date}`, { query: { lang } });
}

/** No PATCH exists — every mutation (add/remove item, change servings) resends the whole plan. */
export async function replaceMealPlan(
  plan: MealPlan,
  date?: string,
  lang?: string,
): Promise<MealPlan> {
  const planDate = date ?? plan.plan_date;
  return apiFetch<MealPlan>(`/meal-plans/${planDate}`, {
    method: "PUT",
    query: { lang },
    body: {
      slots: plan.slots.map((slot) => ({
        slot_key: slot.slot_key,
        label: slot.label,
        sort_order: slot.sort_order,
        items: slot.items.map((item) => ({
          recipe_id: item.recipe_id,
          servings: item.servings,
        })),
      })),
    },
  });
}

export async function addExtraMealSlot(
  date: string,
  label: string,
  lang?: string,
): Promise<MealPlan> {
  return apiFetch<MealPlan>(`/meal-plans/${date}/slots`, {
    method: "POST",
    query: { lang },
    body: { label },
  });
}

/** Some deployments return 204 (no body) — callers should re-fetch the plan when this resolves to undefined. */
export async function deleteMealSlot(
  date: string,
  slotId: number,
  lang?: string,
): Promise<MealPlan | undefined> {
  return apiFetch<MealPlan | undefined>(`/meal-plans/${date}/slots/${slotId}`, {
    method: "DELETE",
    query: { lang },
  });
}

// ─── Shopping list ──────────────────────────────────────────────────────────

export interface ShoppingListSource {
  recipe_id: number;
  recipe_title: string;
  servings: number;
  line: string;
}

export interface ShoppingListItem {
  key: string;
  name: string;
  quantity_text: string;
  sources: ShoppingListSource[];
}

export interface ShoppingListGroup {
  aisle_key: string;
  aisle: string;
  items: ShoppingListItem[];
}

export interface ShoppingList {
  plan_date: string;
  status: "pending" | "ready";
  groups: ShoppingListGroup[];
}

export async function getShoppingList(date: string, lang?: string): Promise<ShoppingList> {
  return apiFetch<ShoppingList>(`/meal-plans/${date}/shopping-list`, { query: { lang } });
}
