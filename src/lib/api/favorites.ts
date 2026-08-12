import { apiFetch } from "@/lib/api-client";
import type { ApiFavorite } from "@/lib/api/types";

export async function listFavorites(lang?: string): Promise<ApiFavorite[]> {
  return apiFetch<ApiFavorite[]>("/favorites", { query: { lang } });
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
