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
  /** "YYYY-MM-DD" */
  period: string;
  active_users: number;
}

export interface AdminResponseTimePoint {
  /** "YYYY-MM-DD" */
  period: string;
  avg_duration_ms: number;
  count: number;
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
  /** Sparse — last 14 days, same window as daily_active_users. Zero-fill client-side. */
  response_time_trend: AdminResponseTimePoint[];
  /** Dietary-label distribution across the whole catalog (not just favorited recipes). */
  dietary_restriction_distribution: AdminLabelCount[];
  meal_plan_adoption: AdminMealPlanAdoption;
  /** Top 10 by (recipes created + favorites given + chat sessions started). */
  top_users: AdminTopUserEntry[];
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  return apiFetch<AdminAnalytics>("/admin/analytics");
}

export interface AdminAiRequestLogEntry {
  id: string;
  request_type: string;
  status: string;
  duration_ms: number | null;
  /** Always null for now — backend doesn't track this yet. */
  token_usage: number | null;
  /** Always null for now — backend doesn't track this yet. */
  provider: string | null;
  error_message: string | null;
  created_at: string;
  user_id: number;
}

export async function getAdminAiRequests(params?: {
  skip?: number;
  limit?: number;
  status?: string;
  request_type?: string;
}): Promise<AdminAiRequestLogEntry[]> {
  return apiFetch<AdminAiRequestLogEntry[]>("/admin/ai-requests", {
    query: {
      skip: params?.skip ?? 0,
      limit: params?.limit ?? 50,
      status: params?.status || undefined,
      request_type: params?.request_type || undefined,
    },
  });
}
