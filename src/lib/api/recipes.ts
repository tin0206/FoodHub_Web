import { apiFetch, apiUpload } from "@/lib/api-client";
import type {
  ApiRecipe,
  IngredientCatalogEntry,
  RecipeSearchResult,
} from "@/lib/api/types";

export {
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  type RecipeWritePayload,
} from "@/lib/api/admin-recipes";

export async function listRecipes(params?: {
  mine?: boolean;
  skip?: number;
  limit?: number;
  q?: string;
  lang?: string;
}): Promise<ApiRecipe[]> {
  return apiFetch<ApiRecipe[]>("/recipes", {
    query: {
      mine: params?.mine,
      skip: params?.skip ?? 0,
      limit: params?.limit ?? 100,
      q: params?.q?.trim() || undefined,
      lang: params?.lang,
    },
  });
}

export async function searchRecipes(params?: {
  q?: string;
  dietaryRestriction?: string;
  skip?: number;
  limit?: number;
  mine?: boolean;
  lang?: string;
  /** Override Bearer token — e.g. a guest demo session for public browsing. */
  token?: string;
}): Promise<RecipeSearchResult> {
  const res = await apiFetch<{ total_count: number; recipes: ApiRecipe[] }>(
    "/recipes/search",
    {
      query: {
        q: params?.q?.trim() || undefined,
        dietary_restriction: params?.dietaryRestriction || undefined,
        skip: params?.skip ?? 0,
        limit: params?.limit ?? 50,
        mine: params?.mine,
        lang: params?.lang,
      },
      token: params?.token,
    },
  );
  return { totalCount: res.total_count, recipes: res.recipes };
}

export async function getDietaryRestrictions(): Promise<string[]> {
  const res = await apiFetch<{ dietary_restrictions: string[] }>(
    "/recipes/dietary-restrictions",
    { auth: false },
  );
  return res.dietary_restrictions;
}

/** Catalog ingredient lookup for the ingredient picker (mapped_id + amount + unit). */
export async function searchIngredients(
  q: string,
  limit = 8,
): Promise<IngredientCatalogEntry[]> {
  if (!q.trim()) return [];
  const res = await apiFetch<{ ingredients: IngredientCatalogEntry[] }>(
    "/ingredients/search",
    { query: { q: q.trim(), limit } },
  );
  return res.ingredients;
}

/** Uploads a recipe photo. Endpoint/response shape inferred from REST convention — verify against the API. */
export async function uploadRecipeImage(
  recipeId: number,
  file: File,
): Promise<string> {
  const res = await apiUpload<{ image_url: string }>(
    `/recipes/${recipeId}/image`,
    file,
  );
  return res.image_url;
}
