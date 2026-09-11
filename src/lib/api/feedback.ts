import { apiFetch } from "@/lib/api-client";

export type FeedbackStatus = "open" | "in_progress" | "resolved";
export type FeedbackCategory = "bug" | "feature" | "general" | "complaint";

export const FEEDBACK_CATEGORIES: FeedbackCategory[] = ["bug", "feature", "general", "complaint"];

export interface ApiFeedback {
  id: number;
  category: string;
  message: string;
  rating: number | null;
  status: FeedbackStatus;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackCreate {
  category: FeedbackCategory;
  message: string;
  rating?: number | null;
}

export async function listMyFeedback(): Promise<ApiFeedback[]> {
  return apiFetch<ApiFeedback[]>("/feedback");
}

export async function submitFeedback(body: FeedbackCreate): Promise<ApiFeedback> {
  return apiFetch<ApiFeedback>("/feedback", {
    method: "POST",
    body,
  });
}
