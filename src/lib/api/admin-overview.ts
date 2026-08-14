import { apiFetch } from "@/lib/api-client";
import type { ApiRecipe, ApiUser } from "@/lib/api/types";

export interface AdminActivityUser {
  type: "user";
  created_at: string;
  user: ApiUser;
}

export interface AdminActivityRecipe {
  type: "recipe";
  created_at: string;
  recipe: ApiRecipe;
}

export type AdminActivity = AdminActivityUser | AdminActivityRecipe;

export interface AdminOverview {
  total_users: number;
  total_recipes: number;
  recent_activities: AdminActivity[];
}

export async function getAdminOverview(): Promise<AdminOverview> {
  return apiFetch<AdminOverview>("/admin/overview");
}
