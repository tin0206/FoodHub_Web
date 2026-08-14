"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, RefreshCw } from "lucide-react";
import { useDarkMode } from "@/lib/use-dark-mode";
import { useLang } from "@/lib/use-lang";
import { useStrings } from "@/lib/use-strings";
import { hasAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { getAdminAnalytics, type AdminAnalytics } from "@/lib/api/admin-analytics";
import { getRecipe } from "@/lib/api/admin-recipes";
import { ADMIN_ACCENT_LIGHT, ADMIN_ACCENT_DARK, CATEGORICAL } from "@/lib/admin";
import type { Lang } from "@/lib/i18n";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Last N calendar days (oldest first) as "YYYY-MM-DD", for zero-filling a sparse day-count series. */
function lastNDays(n: number): string[] {
  const out: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(today.getTime() - i * DAY_MS).toISOString().slice(0, 10));
  }
  return out;
}

function dayLabel(dateStr: string, lang: Lang): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", { weekday: "short" });
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-3.5"
      style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }}
    >
      {children}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-bold mb-2" style={{ color: "var(--tm-text)" }}>
      {children}
    </p>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs" style={{ color: "var(--tm-text-2)" }}>
      {children}
    </p>
  );
}

function ColumnChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 0);
  return (
    <div className="flex items-end justify-between gap-2" style={{ height: 96 }}>
      {data.map((v, i) => {
        const frac = max === 0 ? 0 : Math.max(v / max, v > 0 ? 0.08 : 0);
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full" title={`${v}`}>
            <span className="text-[10px] font-bold" style={{ color }}>
              {v}
            </span>
            <div
              className="w-full rounded-t-[4px]"
              style={{ maxWidth: 24, height: `${frac * 100}%`, backgroundColor: color }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const isDark = useDarkMode();
  const accent = isDark ? ADMIN_ACCENT_DARK : ADMIN_ACCENT_LIGHT;
  const lang = useLang();
  const t = useStrings();
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viTitles, setViTitles] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    if (!hasAccessToken()) {
      setData(null);
      setError(t.adminNoTokenAnalytics);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await getAdminAnalytics();
      setData(result);
    } catch (err) {
      setData(null);
      if (err instanceof ApiError) {
        setError(err.status === 403 ? t.adminRoleRequiredAnalytics : err.message);
      } else {
        setError(err instanceof Error ? err.message : t.adminFailedLoadAnalytics);
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  // Recipe titles come back in their own stored locale — when viewing in Vietnamese,
  // fetch each top recipe's "vi" translation (falls back to the original if untranslated).
  useEffect(() => {
    const recipes = data?.top_recipes ?? [];
    if (lang !== "vi" || recipes.length === 0) {
      setViTitles({});
      return;
    }
    let cancelled = false;
    Promise.all(
      recipes.map((r) =>
        getRecipe(r.id, "vi")
          .then((translated) => [r.id, translated.title] as const)
          .catch(() => [r.id, r.title] as const),
      ),
    ).then((entries) => {
      if (!cancelled) setViTitles(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [lang, data]);

  const days = lastNDays(7);
  const signupByDate = new Map((data?.daily_signups ?? []).map((d) => [d.date, d.count]));
  const signupCounts = days.map((d) => signupByDate.get(d) ?? 0);
  const maxLabelCount = data?.popular_recipes[0]?.count ?? 1;

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold" style={{ color: "var(--tm-text)" }}>
          {t.adminAnalyticsTitle}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50"
          style={{ backgroundColor: `${accent}1F`, color: accent }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : undefined} />
          {t.refresh}
        </button>
      </div>

      {error && (
        <div
          className="rounded-2xl p-4 text-sm"
          style={{ backgroundColor: "#F43F5E14", color: "#F43F5E", border: "1px solid #F43F5E33" }}
        >
          {error}
        </div>
      )}

      {/* Top recipes — most-favorited among recipes created in the last 30 days */}
      <section>
        <SectionHeading>{t.adminTopRecipesHeading}</SectionHeading>
        <Card>
          {data && data.top_recipes.length === 0 ? (
            <EmptyNote>{t.adminNoTopRecipes}</EmptyNote>
          ) : (
            <div className="space-y-1">
              {(data?.top_recipes ?? []).map((r, i) => (
                <Link
                  key={r.id}
                  href={`/admin/recipes/${r.id}`}
                  className="flex items-center gap-2.5 py-1.5 hover:opacity-90 transition-opacity"
                >
                  <span
                    className="w-5 text-[11px] font-bold shrink-0"
                    style={{ color: i === 0 ? "#c98500" : "var(--tm-text-2)" }}
                  >
                    #{i + 1}
                  </span>
                  <span
                    className="flex-1 min-w-0 text-xs font-semibold truncate"
                    style={{ color: "var(--tm-text)" }}
                  >
                    {viTitles[r.id] ?? r.title}
                  </span>
                  <ChevronRight size={14} color="var(--tm-text-3)" className="shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* Popular labels — from favorited recipes */}
      <section>
        <SectionHeading>{t.adminPopularLabelsHeading}</SectionHeading>
        <Card>
          {data && data.popular_recipes.length === 0 ? (
            <EmptyNote>{t.adminNoFavoritesYet}</EmptyNote>
          ) : (
            <div className="space-y-2.5">
              {(data?.popular_recipes ?? []).map((l, i) => {
                const color = isDark
                  ? CATEGORICAL[i % CATEGORICAL.length].dark
                  : CATEGORICAL[i % CATEGORICAL.length].light;
                const frac = l.count / maxLabelCount;
                return (
                  <div key={l.label} className="flex items-center gap-2.5">
                    <span
                      className="w-20 text-[11.5px] font-medium shrink-0 truncate"
                      style={{ color: "var(--tm-text-2)" }}
                    >
                      {t.categoryDisplay(l.label)}
                    </span>
                    <div
                      className="flex-1 h-5 rounded-md relative"
                      style={{ backgroundColor: "var(--tm-subtle)" }}
                      title={`${l.count}`}
                    >
                      <div
                        className="h-full rounded-md"
                        style={{ width: `${frac * 100}%`, backgroundColor: `${color}2E` }}
                      />
                    </div>
                    <span className="w-9 text-xs font-bold text-right shrink-0" style={{ color }}>
                      {l.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </section>

      {/* Weekly signups */}
      <section>
        <SectionHeading>{t.adminNewUsersHeading}</SectionHeading>
        <Card>
          <ColumnChart data={signupCounts} color={accent} />
          <div className="flex justify-between mt-2">
            {days.map((d) => (
              <span
                key={d}
                className="flex-1 text-center text-[10px] font-medium"
                style={{ color: "var(--tm-text-2)" }}
              >
                {dayLabel(d, lang)}
              </span>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
