import { apiFetch } from "@/lib/api-client";
import type { ApiUser } from "@/lib/api/types";
import type { ApiFeedback, FeedbackStatus } from "@/lib/api/feedback";

export interface AdminFeedbackItem extends ApiFeedback {
  user: ApiUser;
}

export interface AdminFeedbackUpdate {
  status?: FeedbackStatus;
  admin_reply?: string;
}

export async function listAdminFeedback(params?: {
  skip?: number;
  limit?: number;
  status?: FeedbackStatus | "";
  category?: string;
}): Promise<AdminFeedbackItem[]> {
  return apiFetch<AdminFeedbackItem[]>("/admin/feedback", {
    query: {
      skip: params?.skip ?? 0,
      limit: params?.limit ?? 50,
      status: params?.status || undefined,
      category: params?.category || undefined,
    },
  });
}

export async function getAdminFeedback(feedbackId: number): Promise<AdminFeedbackItem> {
  return apiFetch<AdminFeedbackItem>(`/admin/feedback/${feedbackId}`);
}

export async function updateAdminFeedback(
  feedbackId: number,
  body: AdminFeedbackUpdate,
): Promise<AdminFeedbackItem> {
  return apiFetch<AdminFeedbackItem>(`/admin/feedback/${feedbackId}`, {
    method: "PATCH",
    body,
  });
}
