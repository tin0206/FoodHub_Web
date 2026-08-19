import { apiFetch } from "@/lib/api-client";
import type { ApiFavorite, TopFavoriteRecipe } from "@/lib/api/types";

export async function listFavorites(lang?: string): Promise<ApiFavorite[]> {
  return apiFetch<ApiFavorite[]>("/favorites", { query: { lang } });
}

/** Most-favorited recipes site-wide (top 10), for the home screen's "Top Recipes" row. */
export async function getTopFavorites(
  lang?: string,
): Promise<TopFavoriteRecipe[]> {
  return apiFetch<TopFavoriteRecipe[]>("/favorites/top-favorites", {
    query: { lang },
  });
}

export async function addFavorite(
  recipeId: number,
  note?: string,
): Promise<ApiFavorite> {
  return apiFetch<ApiFavorite>("/favorites", {
    method: "POST",
    body: { recipe_id: recipeId, note: note || undefined },
  });
}

export async function deleteFavorite(favoriteId: number): Promise<void> {
  await apiFetch<void>(`/favorites/${favoriteId}`, { method: "DELETE" });
}

export async function updateFavorite(
  favoriteId: number,
  note: string | null,
): Promise<ApiFavorite> {
  return apiFetch<ApiFavorite>(`/favorites/${favoriteId}`, {
    method: "PATCH",
    body: { note },
  });
}
