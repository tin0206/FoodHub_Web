"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MessageSquareText, RefreshCw, Star } from "lucide-react";
import { useDarkMode } from "@/lib/use-dark-mode";
import { useLang } from "@/lib/use-lang";
import { useStrings } from "@/lib/use-strings";
import { ADMIN_ACCENT_LIGHT, ADMIN_ACCENT_DARK, avatarInitials, avatarColor } from "@/lib/admin";
import { hasAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { listAdminFeedback, type AdminFeedbackItem } from "@/lib/api/admin-feedback";
import { FEEDBACK_CATEGORIES, type FeedbackStatus } from "@/lib/api/feedback";

type StatusFilter = FeedbackStatus | "";

const PAGE_SIZE = 20;

function StatusBadge({ status, t }: { status: FeedbackStatus; t: ReturnType<typeof useStrings> }) {
  const colors: Record<FeedbackStatus, { bg: string; fg: string }> = {
    open: { bg: "#F59E0B19", fg: "#B45309" },
    in_progress: { bg: "#2563EB19", fg: "#1D4ED8" },
    resolved: { bg: "#10B98119", fg: "#059669" },
  };
  const c = colors[status];
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {t.feedbackStatusDisplay(status)}
    </span>
  );
}

export default function AdminFeedbackPage() {
  const isDark = useDarkMode();
  const lang = useLang();
  const accent = isDark ? ADMIN_ACCENT_DARK : ADMIN_ACCENT_LIGHT;
  const t = useStrings();

  const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
    { value: "", label: t.filterAll },
    { value: "open", label: t.feedbackStatusDisplay("open") },
    { value: "in_progress", label: t.feedbackStatusDisplay("in_progress") },
    { value: "resolved", label: t.feedbackStatusDisplay("resolved") },
  ];
  const CATEGORY_FILTERS: { value: string; label: string }[] = [
    { value: "", label: t.filterAll },
    ...FEEDBACK_CATEGORIES.map((c) => ({ value: c, label: t.feedbackCategoryDisplay(c) })),
  ];

  const [items, setItems] = useState<AdminFeedbackItem[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!hasAccessToken()) {
      setItems([]);
      setHasNext(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const skip = page * PAGE_SIZE;
      const data = await listAdminFeedback({
        skip,
        limit: PAGE_SIZE + 1,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      });
      setHasNext(data.length > PAGE_SIZE);
      setItems(data.slice(0, PAGE_SIZE));
    } catch (err) {
      setItems([]);
      setHasNext(false);
      setError(err instanceof ApiError ? err.message : t.adminFailedLoadFeedback);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter, page, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function setStatusAndReset(next: StatusFilter) {
    setPage(0);
    setStatusFilter(next);
  }

  function setCategoryAndReset(next: string) {
    setPage(0);
    setCategoryFilter(next);
  }

  const rangeStart = page * PAGE_SIZE + 1;
  const rangeEnd = page * PAGE_SIZE + (items?.length ?? 0);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-3 gap-2">
        <p className="text-sm font-bold" style={{ color: "var(--tm-text)" }}>
          {t.adminFeedbackTitle}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg"
          style={{ backgroundColor: `${accent}1F`, color: accent }}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : undefined} />
          {t.refresh}
        </button>
      </div>

      <div
        className="rounded-2xl p-3 mb-3"
        style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }}
      >
        <div className="mb-2.5">
          <p className="text-[10.5px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--tm-text-3)" }}>
            {t.adminFeedbackStatusFieldLabel}
          </p>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((opt) => {
              const active = statusFilter === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setStatusAndReset(opt.value)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: active ? accent : "var(--tm-subtle)",
                    color: active ? "#fff" : "var(--tm-text-2)",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--tm-text-3)" }}>
            {t.feedbackCategoryLabel}
          </p>
          <div className="flex gap-2 flex-wrap">
            {CATEGORY_FILTERS.map((opt) => {
              const active = categoryFilter === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setCategoryAndReset(opt.value)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: active ? accent : "var(--tm-subtle)",
                    color: active ? "#fff" : "var(--tm-text-2)",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div
          className="rounded-2xl p-4 mb-3 text-sm"
          style={{ backgroundColor: "#F43F5E14", color: "#F43F5E", border: "1px solid #F43F5E33" }}
        >
          {error}
        </div>
      )}

      {loading && items === null ? (
        <p className="text-sm" style={{ color: "var(--tm-text-2)" }}>
          {t.loading}
        </p>
      ) : items && items.length === 0 && !error ? (
        <div
          className="rounded-2xl p-8 flex flex-col items-center text-center gap-2"
          style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }}
        >
          <MessageSquareText size={28} color="var(--tm-text-3)" />
          <p className="text-sm font-semibold" style={{ color: "var(--tm-text)" }}>
            {t.adminNoFeedbackFound}
          </p>
        </div>
      ) : items && items.length > 0 ? (
        <>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--tm-surface)",
              border: "1px solid var(--tm-border-i)",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {items.map((item, i) => {
              const name = item.user.full_name || item.user.username;
              const color = avatarColor(name, isDark);
              return (
                <Link
                  key={item.id}
                  href={`/admin/feedback/${item.id}`}
                  className="flex items-center gap-3 px-3.5 py-3 hover:opacity-90 transition-opacity"
                  style={{ borderTop: i > 0 ? "1px solid var(--tm-border-i)" : undefined }}
                >
                  <div
                    className="rounded-full flex items-center justify-center font-bold shrink-0"
                    style={{ width: 42, height: 42, backgroundColor: `${color}26`, color }}
                  >
                    {avatarInitials(name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-[13px] font-semibold truncate" style={{ color: "var(--tm-text)" }}>
                        {name}
                      </p>
                      <StatusBadge status={item.status} t={t} />
                    </div>
                    <p className="text-[11.5px] truncate" style={{ color: "var(--tm-text-2)" }}>
                      {t.feedbackCategoryDisplay(item.category)} · {item.message}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {item.rating && (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: "#B45309" }}>
                        <Star size={11} color="#F59E0B" fill="#F59E0B" />
                        {item.rating}
                      </span>
                    )}
                    <span className="text-[10px]" style={{ color: "var(--tm-text-3)" }}>
                      {new Date(item.created_at).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US")}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-3 gap-2">
            <p className="text-[11px]" style={{ color: "var(--tm-text-3)" }}>
              {t.adminShowingFeedback(rangeStart, rangeEnd, hasNext)}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0 || loading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-40"
                style={{ backgroundColor: "var(--tm-subtle)", color: "var(--tm-text-2)" }}
              >
                <ChevronLeft size={14} /> {t.prev}
              </button>
              <button
                type="button"
                disabled={!hasNext || loading}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-40"
                style={{ backgroundColor: `${accent}1F`, color: accent }}
              >
                {t.next} <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
