"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, Sparkles } from "lucide-react";
import { useDarkMode } from "@/lib/use-dark-mode";
import { useLang } from "@/lib/use-lang";
import { useStrings } from "@/lib/use-strings";
import { ADMIN_ACCENT_LIGHT, ADMIN_ACCENT_DARK } from "@/lib/admin";
import { hasAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { getAdminAiRequests, type AdminAiRequestLogEntry } from "@/lib/api/admin-analytics";

const PAGE_SIZE = 20;
const STATUSES = ["", "pending", "processing", "completed", "failed", "cancelled"];
const REQUEST_TYPES = ["", "chat", "dish", "ingredients", "meal_suggest", "shopping_list", "map_aisles"];

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "#F59E0B19", fg: "#B45309" },
  processing: { bg: "#2563EB19", fg: "#1D4ED8" },
  completed: { bg: "#10B98119", fg: "#059669" },
  failed: { bg: "#F43F5E19", fg: "#F43F5E" },
  cancelled: { bg: "#6B728019", fg: "#6B7280" },
};

function StatusBadge({ status, label }: { status: string; label: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.cancelled;
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {label}
    </span>
  );
}

export default function AdminAiRequestsPage() {
  const isDark = useDarkMode();
  const lang = useLang();
  const accent = isDark ? ADMIN_ACCENT_DARK : ADMIN_ACCENT_LIGHT;
  const t = useStrings();

  const [items, setItems] = useState<AdminAiRequestLogEntry[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
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
      const data = await getAdminAiRequests({
        skip,
        limit: PAGE_SIZE + 1,
        status: statusFilter || undefined,
        request_type: typeFilter || undefined,
      });
      setHasNext(data.length > PAGE_SIZE);
      setItems(data.slice(0, PAGE_SIZE));
    } catch (err) {
      setItems([]);
      setHasNext(false);
      setError(err instanceof ApiError ? err.message : t.adminFailedLoadAiRequests);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, page, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function setStatusAndReset(next: string) {
    setPage(0);
    setStatusFilter(next);
  }

  function setTypeAndReset(next: string) {
    setPage(0);
    setTypeFilter(next);
  }

  const rangeStart = page * PAGE_SIZE + 1;
  const rangeEnd = page * PAGE_SIZE + (items?.length ?? 0);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Link
        href="/admin/analytics"
        className="flex items-center gap-1.5 text-xs font-semibold mb-3"
        style={{ color: "var(--tm-text-2)" }}
      >
        <ArrowLeft size={14} /> {t.adminBackToAnalytics}
      </Link>

      <div className="flex items-center justify-between mb-3 gap-2">
        <p className="text-sm font-bold" style={{ color: "var(--tm-text)" }}>
          {t.adminAiRequestsTitle}
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
            {STATUSES.map((s) => {
              const active = statusFilter === s;
              return (
                <button
                  key={s || "all"}
                  type="button"
                  onClick={() => setStatusAndReset(s)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: active ? accent : "var(--tm-subtle)",
                    color: active ? "#fff" : "var(--tm-text-2)",
                  }}
                >
                  {s ? t.aiRequestStatusDisplay(s) : t.filterAll}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--tm-text-3)" }}>
            {t.adminAiRequestTypeFieldLabel}
          </p>
          <div className="flex gap-2 flex-wrap">
            {REQUEST_TYPES.map((rt) => {
              const active = typeFilter === rt;
              return (
                <button
                  key={rt || "all"}
                  type="button"
                  onClick={() => setTypeAndReset(rt)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: active ? accent : "var(--tm-subtle)",
                    color: active ? "#fff" : "var(--tm-text-2)",
                  }}
                >
                  {rt ? t.aiRequestTypeDisplay(rt) : t.filterAll}
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
          <Sparkles size={28} color="var(--tm-text-3)" />
          <p className="text-sm font-semibold" style={{ color: "var(--tm-text)" }}>
            {t.adminNoAiRequestsFound}
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
            {items.map((item, i) => (
              <div
                key={item.id}
                className="px-3.5 py-3"
                style={{ borderTop: i > 0 ? "1px solid var(--tm-border-i)" : undefined }}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[13px] font-semibold truncate" style={{ color: "var(--tm-text)" }}>
                    {t.aiRequestTypeDisplay(item.request_type)}
                  </span>
                  <StatusBadge status={item.status} label={t.aiRequestStatusDisplay(item.status)} />
                </div>
                <div className="flex items-center gap-3 flex-wrap text-[11px]" style={{ color: "var(--tm-text-2)" }}>
                  <span>
                    {t.adminAiRequestUserLabel} #{item.user_id}
                  </span>
                  <span>
                    {t.adminAiRequestDurationLabel}: {item.duration_ms != null ? `${item.duration_ms} ms` : "—"}
                  </span>
                  <span>
                    {t.adminAiRequestTokenUsageLabel}: {item.token_usage ?? t.adminAiRequestNotTrackedYet}
                  </span>
                  <span>
                    {t.adminAiRequestProviderLabel}: {item.provider ?? t.adminAiRequestNotTrackedYet}
                  </span>
                  <span>{new Date(item.created_at).toLocaleString(lang === "vi" ? "vi-VN" : "en-US")}</span>
                </div>
                {item.error_message && (
                  <p className="text-[11px] mt-1.5" style={{ color: "#F43F5E" }}>
                    {t.adminAiRequestErrorLabel}: {item.error_message}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3 gap-2">
            <p className="text-[11px]" style={{ color: "var(--tm-text-3)" }}>
              {t.adminShowingAiRequests(rangeStart, rangeEnd, hasNext)}
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
