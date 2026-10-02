import { apiFetch } from "@/lib/api-client";

export type RecipeSentiment = "up" | "down";
export type RecipeFeedbackSource = "chat" | "meal_suggestion" | "recipe_detail";

export interface RecipeFeedbackItem {
  recipe_id: number;
  sentiment: RecipeSentiment;
  source: string;
}

export async function listRecipeFeedback(recipeIds: number[]): Promise<RecipeFeedbackItem[]> {
  if (!recipeIds.length) return [];
  const data = await apiFetch<{ items: RecipeFeedbackItem[] }>("/recipe-feedback", {
    query: { recipe_ids: recipeIds.join(",") },
  });
  return data.items ?? [];
}

export async function submitRecipeFeedback(body: {
  recipe_id: number;
  sentiment: RecipeSentiment;
  source: RecipeFeedbackSource;
}): Promise<RecipeFeedbackItem> {
  return apiFetch<RecipeFeedbackItem>("/recipe-feedback", {
    method: "POST",
    body,
  });
}
