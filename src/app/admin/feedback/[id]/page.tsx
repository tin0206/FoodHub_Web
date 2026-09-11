"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  AtSign,
  MessageSquareText,
  Tag,
  Star,
  CalendarDays,
  ClipboardCheck,
  CheckCircle2,
  X,
} from "lucide-react";
import { useDarkMode } from "@/lib/use-dark-mode";
import { useLang } from "@/lib/use-lang";
import { useStrings } from "@/lib/use-strings";
import { ADMIN_ACCENT_LIGHT, ADMIN_ACCENT_DARK, avatarInitials, avatarColor } from "@/lib/admin";
import { hasAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { FormSection, SegmentedButtons } from "@/components/admin/form-controls";
import {
  getAdminFeedback,
  updateAdminFeedback,
  type AdminFeedbackItem,
} from "@/lib/api/admin-feedback";
import type { FeedbackStatus } from "@/lib/api/feedback";
import LoadingOverlay from "@/components/loading-overlay";

function InfoRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2.5 py-2.5" style={{ borderTop: "1px solid var(--tm-border-i)" }}>
      <Icon size={14} color={accent} />
      <span className="text-xs flex-1" style={{ color: "var(--tm-text-2)" }}>
        {label}
      </span>
      <span className="text-xs font-semibold text-right" style={{ color: "var(--tm-text)" }}>
        {value}
      </span>
    </div>
  );
}

export default function AdminFeedbackDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isDark = useDarkMode();
  const lang = useLang();
  const accent = isDark ? ADMIN_ACCENT_DARK : ADMIN_ACCENT_LIGHT;
  const t = useStrings();
  const feedbackId = Number(params.id);

  const [feedback, setFeedback] = useState<AdminFeedbackItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] = useState<FeedbackStatus>("open");
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(feedbackId)) {
      router.replace("/admin/feedback");
      return;
    }
    if (!hasAccessToken()) {
      setError(t.adminNoTokenGeneric);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const found = await getAdminFeedback(feedbackId);
      setFeedback(found);
      setStatus(found.status);
      setReply(found.admin_reply ?? "");
    } catch (err) {
      setFeedback(null);
      if (err instanceof ApiError) {
        setError(err.status === 404 ? t.adminFeedbackNotFound : err.message || t.adminFailedLoadFeedback);
      } else {
        setError(err instanceof Error ? err.message : t.adminFailedLoadFeedback);
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackId, router, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    if (!feedback || saving) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const body: { status?: FeedbackStatus; admin_reply?: string } = {};
      if (status !== feedback.status) body.status = status;
      const trimmedReply = reply.trim();
      if (trimmedReply && trimmedReply !== (feedback.admin_reply ?? "")) {
        body.admin_reply = trimmedReply;
      }
      const updated = await updateAdminFeedback(feedback.id, body);
      setFeedback(updated);
      setStatus(updated.status);
      setReply(updated.admin_reply ?? "");
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : t.adminFeedbackFailedSave);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <p className="text-sm" style={{ color: "var(--tm-text-2)" }}>
          {t.loading}
        </p>
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-3">
        <div className="rounded-2xl p-4 text-sm" style={{ backgroundColor: "#F43F5E14", color: "#F43F5E" }}>
          {error || t.adminFeedbackNotFound}
        </div>
        <Link href="/admin/feedback" className="text-xs font-semibold" style={{ color: accent }}>
          {t.adminBackToFeedback}
        </Link>
      </div>
    );
  }

  const submitter = feedback.user;
  const name = submitter.full_name || submitter.username;
  const avatar = avatarColor(name, isDark);
  const hasChanges = status !== feedback.status || reply.trim() !== (feedback.admin_reply ?? "");

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <button
        type="button"
        onClick={() => router.push("/admin/feedback")}
        className="flex items-center gap-1.5 text-xs font-semibold mb-3"
        style={{ color: "var(--tm-text-2)" }}
      >
        <ArrowLeft size={14} /> {t.adminBackToFeedback}
      </button>

      <div className="space-y-3">
        <FormSection title={t.adminFeedbackSubmittedByTitle} icon={UserIcon} accent={accent}>
          <Link href={`/admin/users/${submitter.id}`} className="flex items-center gap-3">
            <div
              className="rounded-full flex items-center justify-center font-bold shrink-0"
              style={{ width: 42, height: 42, backgroundColor: `${avatar}26`, color: avatar }}
            >
              {avatarInitials(name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold truncate" style={{ color: "var(--tm-text)" }}>
                {name}
              </p>
              <p className="text-[11.5px] truncate" style={{ color: "var(--tm-text-2)" }}>
                {submitter.email}
              </p>
            </div>
          </Link>
          <InfoRow icon={AtSign} label={t.adminUsernameLabel} value={submitter.username} accent={accent} />
          <InfoRow icon={Mail} label={t.emailLabel} value={submitter.email} accent={accent} />
        </FormSection>

        <FormSection title={t.adminFeedbackDetailsTitle} icon={MessageSquareText} accent={accent}>
          <InfoRow icon={Tag} label={t.feedbackCategoryLabel} value={t.feedbackCategoryDisplay(feedback.category)} accent={accent} />
          <InfoRow
            icon={Star}
            label={t.feedbackRatingLabel}
            value={feedback.rating ? `${feedback.rating} / 5` : "—"}
            accent={accent}
          />
          <InfoRow
            icon={CalendarDays}
            label={t.adminSubmittedOn}
            value={new Date(feedback.created_at).toLocaleString(lang === "vi" ? "vi-VN" : "en-US")}
            accent={accent}
          />
          <p className="text-sm mt-3 whitespace-pre-wrap" style={{ color: "var(--tm-text)" }}>
            {feedback.message}
          </p>
        </FormSection>

        <FormSection title={t.adminFeedbackStatusReplyTitle} icon={ClipboardCheck} accent={accent}>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--tm-text-2)" }}>
              {t.adminFeedbackStatusFieldLabel}
            </label>
            <SegmentedButtons
              options={[
                { value: "open", label: t.feedbackStatusDisplay("open") },
                { value: "in_progress", label: t.feedbackStatusDisplay("in_progress") },
                { value: "resolved", label: t.feedbackStatusDisplay("resolved") },
              ]}
              selected={status}
              onSelect={(v) => v && setStatus(v as FeedbackStatus)}
              accent={accent}
            />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--tm-text-2)" }}>
              {t.adminFeedbackReplyFieldLabel}
            </label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={t.adminFeedbackReplyPlaceholder}
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none resize-none"
              style={{ backgroundColor: "var(--tm-subtle)", color: "var(--tm-text)" }}
            />
            {!feedback.admin_reply && !reply && (
              <p className="text-[11px] mt-1" style={{ color: "var(--tm-text-3)" }}>
                {t.adminFeedbackNoReplyYet}
              </p>
            )}
          </div>

          {saveError && (
            <p className="text-xs font-medium" style={{ color: "#F43F5E" }}>
              {saveError}
            </p>
          )}
          {saveSuccess && (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold"
              style={{ backgroundColor: "#10B98119", color: "#10B981" }}
            >
              <CheckCircle2 size={15} className="shrink-0" />
              <span className="flex-1">{t.adminFeedbackSaveSuccess}</span>
              <button type="button" onClick={() => setSaveSuccess(false)}>
                <X size={14} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !hasChanges}
            className="w-full h-11 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: accent }}
          >
            {saving ? t.saving : t.adminFeedbackSaveCta}
          </button>
        </FormSection>
      </div>
      {saving && <LoadingOverlay />}
    </div>
  );
}
