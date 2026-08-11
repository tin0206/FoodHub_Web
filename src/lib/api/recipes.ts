import { apiFetch, apiUpload } from "@/lib/api-client";
import type { ApiRecipe } from "@/lib/api/types";

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
