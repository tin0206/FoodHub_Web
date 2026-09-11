"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, MessageSquareText } from "lucide-react";
import { useStrings } from "@/lib/use-strings";
import { useLang } from "@/lib/use-lang";
import { ApiError } from "@/lib/api-client";
import {
  submitFeedback,
  listMyFeedback,
  FEEDBACK_CATEGORIES,
  type ApiFeedback,
  type FeedbackCategory,
} from "@/lib/api/feedback";

const ACCENT = "#059669";

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? 0 : n)}
          aria-label={`${n} star`}
        >
          <Star
            size={26}
            color={n <= value ? "#F59E0B" : "var(--tm-border)"}
            fill={n <= value ? "#F59E0B" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          color={n <= rating ? "#F59E0B" : "var(--tm-border)"}
          fill={n <= rating ? "#F59E0B" : "none"}
        />
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const router = useRouter();
  const t = useStrings();
  const lang = useLang();

  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState<ApiFeedback[] | null>(null);
  const [historyError, setHistoryError] = useState("");

  async function loadHistory() {
    try {
      const data = await listMyFeedback();
      setHistory(data);
      setHistoryError("");
    } catch (err) {
      setHistory([]);
      setHistoryError(
        err instanceof ApiError ? err.message : t.feedbackFailedLoad,
      );
    }
  }

  useEffect(() => {
    void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit() {
    if (saving) return;
    if (!message.trim()) {
      setError(t.feedbackMessageRequired);
      return;
    }
    setError("");
    setSuccess(false);
    setSaving(true);
    try {
      await submitFeedback({
        category,
        message: message.trim(),
        rating: rating > 0 ? rating : null,
      });
      setMessage("");
      setRating(0);
      setCategory("general");
      setSuccess(true);
      await loadHistory();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.feedbackFailedSubmit);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "var(--tm-bg)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 h-14 border-b shrink-0"
        style={{
          backgroundColor: "var(--tm-surface)",
          borderColor: "var(--tm-border-s)",
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
          style={{ color: "var(--tm-text-2)" }}
          aria-label={t.back}
        >
          <ArrowLeft size={18} />
        </button>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#DBEAFE" }}
        >
          <MessageSquareText size={16} color="#2563EB" />
        </div>
        <div className="min-w-0">
          <p
            className="text-sm font-bold truncate"
            style={{ color: "var(--tm-text)" }}
          >
            {t.feedbackPageTitle}
          </p>
          <p
            className="text-[11px] truncate"
            style={{ color: "var(--tm-text-2)" }}
          >
            {t.feedbackPageSubtitle}
          </p>
        </div>
      </div>

      {/* Content — form pinned to a fixed-width column, history filling the rest. */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-5 items-start">
          {/* Submission form */}
          <div
            className="w-full lg:w-100 lg:shrink-0 rounded-2xl p-4"
            style={{
              backgroundColor: "var(--tm-surface)",
              border: "1px solid var(--tm-border)",
            }}
          >
            <div>
              <p
                className="text-xs font-medium mb-2"
                style={{ color: "var(--tm-text-2)" }}
              >
                {t.feedbackCategoryLabel}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {FEEDBACK_CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className="py-2.5 px-3 rounded-lg border text-sm text-left transition-colors"
                      style={{
                        backgroundColor: active
                          ? "#ECFDF5"
                          : "var(--tm-surface)",
                        borderColor: active ? ACCENT : "var(--tm-border)",
                        color: active ? ACCENT : "var(--tm-text-2)",
                        fontWeight: active ? 500 : 400,
                      }}
                    >
                      {t.feedbackCategoryDisplay(cat)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <p
                className="text-xs font-medium mb-2"
                style={{ color: "var(--tm-text-2)" }}
              >
                {t.feedbackRatingLabel}
              </p>
              <StarRating value={rating} onChange={setRating} />
            </div>

            <div className="mt-4">
              <label
                className="block text-xs font-medium mb-2"
                style={{ color: "var(--tm-text-2)" }}
              >
                {t.feedbackMessageLabel}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.feedbackMessagePlaceholder}
                rows={5}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                style={{
                  borderColor: "var(--tm-border-i)",
                  color: "var(--tm-text)",
                  backgroundColor: "var(--tm-surface)",
                }}
              />
            </div>

            {error && (
              <p
                className="text-xs font-medium mt-3"
                style={{ color: "#f87171" }}
              >
                {error}
              </p>
            )}
            {success && (
              <p
                className="text-xs font-medium mt-3"
                style={{ color: "#059669" }}
              >
                {t.feedbackSubmitSuccess}
              </p>
            )}

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={saving}
              className="w-full h-11 rounded-full text-sm font-bold text-white mt-4 disabled:opacity-60"
              style={{ backgroundColor: ACCENT }}
            >
              {saving ? t.saving : t.feedbackSubmitCta}
            </button>
          </div>

          {/* History */}
          <div className="w-full min-w-0 flex-1">
            <p
              className="text-sm font-bold mb-2"
              style={{ color: "var(--tm-text)" }}
            >
              {t.feedbackHistoryTitle}
            </p>

            {historyError && (
              <p className="text-xs mb-2" style={{ color: "#f87171" }}>
                {historyError}
              </p>
            )}

            {history === null ? (
              <p className="text-xs" style={{ color: "var(--tm-text-2)" }}>
                {t.loading}
              </p>
            ) : history.length === 0 ? (
              <div
                className="rounded-2xl p-8 flex flex-col items-center text-center gap-2"
                style={{
                  backgroundColor: "var(--tm-surface)",
                  border: "1px solid var(--tm-border-i)",
                }}
              >
                <MessageSquareText size={26} color="var(--tm-text-3)" />
                <p className="text-xs" style={{ color: "var(--tm-text-2)" }}>
                  {t.feedbackNoneYet}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl p-3.5"
                    style={{
                      backgroundColor: "var(--tm-surface)",
                      border: "1px solid var(--tm-border-i)",
                    }}
                  >
                    <span
                      className="block text-xs font-bold mb-1.5"
                      style={{ color: "var(--tm-text)" }}
                    >
                      {t.feedbackCategoryDisplay(item.category)}
                      <span
                        className="font-medium"
                        style={{ color: "var(--tm-text-3)" }}
                      >
                        {" - "}
                        {new Date(item.created_at).toLocaleString(
                          lang === "vi" ? "vi-VN" : "en-US",
                          {
                            dateStyle: "medium",
                            timeStyle: "short",
                          },
                        )}
                      </span>
                    </span>
                    {item.rating && (
                      <div className="mb-1.5">
                        <StarDisplay rating={item.rating} />
                      </div>
                    )}
                    <p
                      className="text-xs"
                      style={{ color: "var(--tm-text-2)" }}
                    >
                      {item.message}
                    </p>
                    {item.admin_reply && (
                      <div
                        className="mt-2.5 pt-2.5"
                        style={{ borderTop: "1px solid var(--tm-border-i)" }}
                      >
                        <p
                          className="text-[10.5px] font-bold mb-1"
                          style={{ color: ACCENT }}
                        >
                          {t.feedbackAdminReplyLabel}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--tm-text-2)" }}
                        >
                          {item.admin_reply}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
