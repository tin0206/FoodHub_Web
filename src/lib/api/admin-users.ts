import { apiFetch } from "@/lib/api-client";
import type { ApiRecipe, ApiUser } from "@/lib/api/types";

export interface AdminUserDetail {
  user: ApiUser;
  recipes_count: number;
  saved_count: number;
}

export interface AdminUserUpdate {
  full_name?: string | null;
  username?: string;
  email?: string;
  role?: string;
  is_active?: boolean;
  age?: number | null;
  weight?: number | null;
  calorie_target?: number | null;
  protein_target?: number | null;
  dietary_restrictions?: string[];
  primary_goal?: string | null;
}

export interface AdminUserCreate {
  email: string;
  username: string;
  password: string;
  full_name?: string | null;
  role: string;
  is_active: boolean;
  age?: number | null;
  weight?: number | null;
  calorie_target?: number | null;
  protein_target?: number | null;
  dietary_restrictions: string[];
  primary_goal?: string | null;
  language: string;
  notify_recommendations: boolean;
  notify_new_features: boolean;
  notify_weekly_summary: boolean;
  theme?: string;
}

export async function listAdminUsers(params?: {
  skip?: number;
  limit?: number;
  q?: string;
  role?: string;
  active?: boolean;
}): Promise<ApiUser[]> {
  return apiFetch<ApiUser[]>("/admin/users", {
    query: {
      skip: params?.skip ?? 0,
      limit: params?.limit ?? 50,
      q: params?.q?.trim() || undefined,
      role: params?.role || undefined,
      active: params?.active,
    },
  });
}

export async function getAdminUser(userId: number): Promise<AdminUserDetail> {
  return apiFetch<AdminUserDetail>(`/admin/users/${userId}`);
}

export async function updateAdminUser(
  userId: number,
  body: AdminUserUpdate,
): Promise<ApiUser> {
  return apiFetch<ApiUser>(`/admin/users/${userId}`, {
    method: "PATCH",
    body,
  });
}

export async function createAdminUser(body: AdminUserCreate): Promise<ApiUser> {
  return apiFetch<ApiUser>("/admin/users", {
    method: "POST",
    body,
  });
}

export async function getAdminUserRecipes(
  userId: number,
  params?: { skip?: number; limit?: number },
): Promise<ApiRecipe[]> {
  return apiFetch<ApiRecipe[]>(`/admin/users/${userId}/recipes`, {
    query: { skip: params?.skip ?? 0, limit: params?.limit ?? 100 },
  });
}

export async function getAdminUserFavorites(
  userId: number,
  params?: { skip?: number; limit?: number },
): Promise<ApiRecipe[]> {
  return apiFetch<ApiRecipe[]>(`/admin/users/${userId}/favorites`, {
    query: { skip: params?.skip ?? 0, limit: params?.limit ?? 100 },
  });
}
