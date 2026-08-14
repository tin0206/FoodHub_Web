import { apiFetch } from "@/lib/api-client";
import type { ApiRecipe } from "@/lib/api/types";

export interface AdminLabelCount {
  label: string;
  count: number;
}

export interface AdminDailyCount {
  /** "YYYY-MM-DD" */
  date: string;
  count: number;
}

export interface AdminAnalytics {
  /** Most-favorited recipes among those created in the last 30 days. No count included. */
  top_recipes: ApiRecipe[];
  /** Dietary-label popularity, weighted by how often favorited recipes carry that label. */
  popular_recipes: AdminLabelCount[];
  /** Sparse — only contains days that actually had signups. Zero-fill client-side. */
  daily_signups: AdminDailyCount[];
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  return apiFetch<AdminAnalytics>("/admin/analytics");
}
