import type { UserProfileUpdate } from "@/lib/api/types";

const PROFILE_DRAFT_KEY = "fh_profile_draft_from_chat";

export type ProfileDraft = {
  proposed_profile: UserProfileUpdate;
  changed_fields: string[];
  created_at: string;
};

export function saveProfileDraft(
  proposed: UserProfileUpdate,
  changedFields: string[],
): void {
  if (typeof window === "undefined") return;
  if (!changedFields.length) return;
  const draft: ProfileDraft = {
    proposed_profile: proposed,
    changed_fields: changedFields,
    created_at: new Date().toISOString(),
  };
  sessionStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(draft));
}

export function loadProfileDraft(): ProfileDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PROFILE_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProfileDraft;
    if (!parsed?.proposed_profile || !Array.isArray(parsed.changed_fields)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearProfileDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PROFILE_DRAFT_KEY);
}
