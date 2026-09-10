import { apiFetch } from "@/lib/api-client";
import type { ApiRecipe, ApiUser } from "@/lib/api/types";

export interface AdminLabelCount {
  label: string;
  count: number;
}

export interface AdminDailyCount {
  /** "YYYY-MM-DD" */
  date: string;
  count: number;
}

export interface AdminTopRecipeEntry {
  recipe: ApiRecipe;
  favorite_count: number;
  view_count: number;
  score: number;
}

export interface AdminAiUsageStat {
  request_type: string;
  total: number;
  failed: number;
  /** 0..1 */
  fail_rate: number;
}

export interface AdminActiveUsersPoint {
  /** "YYYY-MM-DD" for the daily series, "YYYY-MM-DD" (week start) for the weekly series. */
  period: string;
  active_users: number;
}

export interface AdminMealPlanAdoption {
  total_users: number;
  users_with_meal_plans: number;
  total_meal_plans: number;
  users_with_suggestions: number;
  total_suggestions: number;
  /** 0..1 */
  adoption_rate: number;
}

export interface AdminTopUserEntry {
  user: ApiUser;
  recipes_created: number;
  favorites_count: number;
  chat_sessions: number;
  score: number;
}

export interface AdminAnalytics {
  /** Top 10 by (favorites + views) in the last 30 days. */
  top_recipes: AdminTopRecipeEntry[];
  /** Top 5 dietary labels, weighted by how often favorited recipes carry them. */
  popular_recipes: AdminLabelCount[];
  /** Sparse — only contains days that actually had signups. Zero-fill client-side. */
  daily_signups: AdminDailyCount[];
  /** Per AI feature, last 30 days. */
  ai_usage: AdminAiUsageStat[];
  /** Sparse — last 14 days. Zero-fill client-side. */
  daily_active_users: AdminActiveUsersPoint[];
  /** Sparse — last 8 weeks. Zero-fill client-side. */
  weekly_active_users: AdminActiveUsersPoint[];
  /** Dietary-label distribution across the whole catalog (not just favorited recipes). */
  dietary_restriction_distribution: AdminLabelCount[];
  meal_plan_adoption: AdminMealPlanAdoption;
  /** Top 10 by (recipes created + favorites given + chat sessions started). */
  top_users: AdminTopUserEntry[];
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  return apiFetch<AdminAnalytics>("/admin/analytics");
}
