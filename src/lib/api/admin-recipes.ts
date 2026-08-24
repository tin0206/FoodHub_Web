import { apiFetch } from "@/lib/api-client";
import type {
  ApiRecipe,
  ApiRecipeTranslation,
  RecipeTranslationUpsert,
  RecipeVisibility,
} from "@/lib/api/types";

export type RecipeWritePayload = {
  title: string;
  ingredients: string[];
  directions: string[];
  dietary_restrictions?: string[];
  estimated_servings?: number | null;
  image_url?: string | null;
};

export async function listAdminRecipes(params?: {
  skip?: number;
  limit?: number;
  visibility?: RecipeVisibility | "";
  q?: string;
  lang?: string;
}): Promise<ApiRecipe[]> {
  return apiFetch<ApiRecipe[]>("/admin/recipes", {
    query: {
      skip: params?.skip ?? 0,
      limit: params?.limit ?? 50,
      visibility: params?.visibility || undefined,
      q: params?.q?.trim() || undefined,
      lang: params?.lang,
    },
  });
}

/** Single recipe — admins can view private recipes via this endpoint. */
export async function getRecipe(
  recipeId: number,
  lang?: string,
  token?: string,
): Promise<ApiRecipe> {
  return apiFetch<ApiRecipe>(`/recipes/${recipeId}`, {
    query: { lang },
    token,
  });
}

export async function createRecipe(
  body: RecipeWritePayload,
): Promise<ApiRecipe> {
  return apiFetch<ApiRecipe>("/recipes", {
    method: "POST",
    body: {
      title: body.title,
      ingredients: body.ingredients,
      directions: body.directions,
      dietary_restrictions: body.dietary_restrictions ?? [],
      estimated_servings: body.estimated_servings ?? undefined,
      image_url: body.image_url || undefined,
    },
  });
}

export async function updateRecipe(
  recipeId: number,
  body: Partial<RecipeWritePayload>,
): Promise<ApiRecipe> {
  return apiFetch<ApiRecipe>(`/recipes/${recipeId}`, {
    method: "PATCH",
    body,
  });
}

export async function deleteRecipe(recipeId: number): Promise<void> {
  await apiFetch<void>(`/recipes/${recipeId}`, {
    method: "DELETE",
  });
}

export async function updateRecipeVisibility(
  recipeId: number,
  visibility: RecipeVisibility,
  lang?: string,
): Promise<ApiRecipe> {
  return apiFetch<ApiRecipe>(`/admin/recipes/${recipeId}/visibility`, {
    method: "PATCH",
    body: { visibility },
    query: { lang },
  });
}

export async function listRecipeTranslations(
  recipeId: number,
): Promise<ApiRecipeTranslation[]> {
  return apiFetch<ApiRecipeTranslation[]>(
    `/admin/recipes/${recipeId}/translations`,
  );
}

export async function upsertRecipeTranslation(
  recipeId: number,
  locale: string,
  body: RecipeTranslationUpsert,
): Promise<ApiRecipeTranslation> {
  return apiFetch<ApiRecipeTranslation>(
    `/admin/recipes/${recipeId}/translations/${locale}`,
    {
      method: "PUT",
      body,
    },
  );
}

export async function deleteRecipeTranslation(
  recipeId: number,
  locale: string,
): Promise<void> {
  await apiFetch<void>(`/admin/recipes/${recipeId}/translations/${locale}`, {
    method: "DELETE",
  });
}

// ─── Aisle mapping job ────────────────────────────────────────────────────

export type AisleMappingJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface AisleMappingJob {
  task_id: string;
  status: AisleMappingJobStatus;
  force: boolean;
  recipe_id?: number;
  total: number;
  processed: number;
  mapped: number;
  skipped: number;
  failed: number;
  error_message?: string;
}

export function isAisleJobActive(job: AisleMappingJob | undefined): boolean {
  return job?.status === "pending" || job?.status === "processing";
}

export interface AisleMappingStatus {
  total: number;
  mapped: number;
  missing: number;
  aisles: string[];
  already_running: boolean;
  job?: AisleMappingJob;
}

export async function getAisleMappingStatus(): Promise<AisleMappingStatus> {
  return apiFetch<AisleMappingStatus>("/admin/recipes/aisles");
}

export async function startAisleMapping(params?: {
  force?: boolean;
  recipeId?: number;
}): Promise<AisleMappingStatus> {
  return apiFetch<AisleMappingStatus>("/admin/recipes/map-aisles", {
    method: "POST",
    body: {
      force: params?.force ?? false,
      recipe_id: params?.recipeId,
    },
  });
}

export async function stopAisleMapping(): Promise<AisleMappingStatus> {
  return apiFetch<AisleMappingStatus>("/admin/recipes/map-aisles/stop", {
    method: "POST",
  });
}
