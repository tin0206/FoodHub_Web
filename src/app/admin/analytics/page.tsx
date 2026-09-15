"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Eye, Heart, RefreshCw } from "lucide-react";
import { useDarkMode } from "@/lib/use-dark-mode";
import { useLang } from "@/lib/use-lang";
import { useStrings } from "@/lib/use-strings";
import { hasAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { getAdminAnalytics, type AdminAnalytics } from "@/lib/api/admin-analytics";
import { getRecipe } from "@/lib/api/admin-recipes";
import { ADMIN_ACCENT_LIGHT, ADMIN_ACCENT_DARK, avatarColor, avatarInitials } from "@/lib/admin";
import type { Lang } from "@/lib/i18n";
import { TrendLineChart, ColumnBarChart, RankedBarChart } from "@/components/admin/charts";

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

function shortDateLabel(dateStr: string, lang: Lang): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

/** 1,284 / 12.9K — compact for the big numbers, exact under 1,000. */
function formatCompact(n: number): string {
  if (n < 1000) return n.toLocaleString("en-US");
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function formatPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-3.5 ${className}`}
      style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }}
    >
      {children}
    </div>
  );
}

function SectionHeading({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <div className="mb-2">
      <p className="text-sm font-bold" style={{ color: "var(--tm-text)" }}>
        {children}
      </p>
      {subtitle && (
        <p className="text-[11px] mt-0.5" style={{ color: "var(--tm-text-3)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs" style={{ color: "var(--tm-text-2)" }}>
      {children}
    </p>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-2.5" style={{ backgroundColor: "var(--tm-subtle)" }}>
      <p className="text-[10.5px] font-medium mb-1 leading-tight" style={{ color: "var(--tm-text-2)" }}>
        {label}
      </p>
      <p className="text-base font-bold" style={{ color: "var(--tm-text)" }}>
        {value}
      </p>
    </div>
  );
}

/** Fill carries the ratio; the unfilled track is a lighter step of the same hue. */
function Meter({ fraction, color }: { fraction: number; color: string }) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: `${color}22` }}>
      <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, backgroundColor: color }} />
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
    const recipes = data?.top_recipes.map((e) => e.recipe) ?? [];
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

  const activeDays = lastNDays(14);
  const activeByDay = new Map((data?.daily_active_users ?? []).map((d) => [d.period, d.active_users]));
  const dailyActiveCounts = activeDays.map((d) => activeByDay.get(d) ?? 0);

  const responseTimeByDay = new Map(
    (data?.response_time_trend ?? []).map((d) => [d.period, { avg: d.avg_duration_ms, count: d.count }]),
  );
  const responseTimeCounts = activeDays.map((d) => responseTimeByDay.get(d) ?? { avg: 0, count: 0 });
  const responseTimeAvgs = responseTimeCounts.map((d) => d.avg);

  const adoption = data?.meal_plan_adoption;

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-5">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Top recipes */}
        <section>
          <SectionHeading>{t.adminTopRecipesHeading}</SectionHeading>
          <Card>
            {data && data.top_recipes.length === 0 ? (
              <EmptyNote>{t.adminNoTopRecipes}</EmptyNote>
            ) : (
              <div className="space-y-1">
                {(data?.top_recipes ?? []).map((entry, i) => (
                  <Link
                    key={entry.recipe.id}
                    href={`/admin/recipes/${entry.recipe.id}`}
                    className="flex items-center gap-2.5 py-1.5 hover:opacity-90 transition-opacity"
                  >
                    <span
                      className="w-5 text-[11px] font-bold shrink-0"
                      style={{ color: i === 0 ? "#c98500" : "var(--tm-text-2)" }}
                    >
                      #{i + 1}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span
                        className="block text-xs font-semibold truncate"
                        style={{ color: "var(--tm-text)" }}
                      >
                        {viTitles[entry.recipe.id] ?? entry.recipe.title}
                      </span>
                      <span className="flex items-center gap-2.5 mt-0.5">
                        <span
                          className="flex items-center gap-1 text-[10.5px]"
                          style={{ color: "var(--tm-text-3)" }}
                        >
                          <Heart size={11} /> {entry.favorite_count}
                        </span>
                        <span
                          className="flex items-center gap-1 text-[10.5px]"
                          style={{ color: "var(--tm-text-3)" }}
                        >
                          <Eye size={11} /> {entry.view_count}
                        </span>
                      </span>
                    </span>
                    <ChevronRight size={14} color="var(--tm-text-3)" className="shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* Top users */}
        <section>
          <SectionHeading>{t.adminTopUsersHeading}</SectionHeading>
          <Card>
            {data && data.top_users.length === 0 ? (
              <EmptyNote>{t.adminNoTopUsers}</EmptyNote>
            ) : (
              <div className="space-y-1">
                {(data?.top_users ?? []).map((entry, i) => {
                  const name = entry.user.full_name || entry.user.username;
                  const color = avatarColor(name, isDark);
                  return (
                    <Link
                      key={entry.user.id}
                      href={`/admin/users/${entry.user.id}`}
                      className="flex items-center gap-2.5 py-1.5 hover:opacity-90 transition-opacity"
                    >
                      <span
                        className="w-5 text-[11px] font-bold shrink-0"
                        style={{ color: i === 0 ? "#c98500" : "var(--tm-text-2)" }}
                      >
                        #{i + 1}
                      </span>
                      <div
                        className="rounded-full flex items-center justify-center font-bold shrink-0 text-[10px]"
                        style={{ width: 26, height: 26, backgroundColor: `${color}26`, color }}
                      >
                        {avatarInitials(name)}
                      </div>
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-semibold truncate" style={{ color: "var(--tm-text)" }}>
                          {name}
                        </span>
                        <span className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10.5px]" style={{ color: "var(--tm-text-3)" }}>
                            {t.adminRecipesCreatedShort(entry.recipes_created)}
                          </span>
                          <span className="text-[10.5px]" style={{ color: "var(--tm-text-3)" }}>
                            {t.adminFavoritesCountLabel(entry.favorites_count)}
                          </span>
                          <span className="text-[10.5px]" style={{ color: "var(--tm-text-3)" }}>
                            {t.adminChatSessionsShort(entry.chat_sessions)}
                          </span>
                        </span>
                      </span>
                      <ChevronRight size={14} color="var(--tm-text-3)" className="shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </section>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Popular labels among favorited recipes */}
        <section>
          <SectionHeading>{t.adminPopularLabelsHeading}</SectionHeading>
          <Card>
            {data && data.popular_recipes.length === 0 ? (
              <EmptyNote>{t.adminNoFavoritesYet}</EmptyNote>
            ) : (
              <RankedBarChart
                items={data?.popular_recipes ?? []}
                color={accent}
                isDark={isDark}
                labelFor={t.categoryDisplay}
              />
            )}
          </Card>
        </section>

        {/* Dietary label distribution across the whole catalog */}
        <section>
          <SectionHeading>{t.adminDietaryDistributionHeading}</SectionHeading>
          <Card>
            {data && data.dietary_restriction_distribution.length === 0 ? (
              <EmptyNote>{t.adminNoDietaryDistribution}</EmptyNote>
            ) : (
              <RankedBarChart
                items={data?.dietary_restriction_distribution ?? []}
                color={accent}
                isDark={isDark}
                labelFor={t.categoryDisplay}
              />
            )}
          </Card>
        </section>
      </div>

      {/* Active users */}
      <section>
        <SectionHeading>{t.adminActiveUsersHeading}</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <p className="text-[11px] font-semibold mb-2" style={{ color: "var(--tm-text-2)" }}>
              {t.adminDailyActiveLabel}
            </p>
            <TrendLineChart
              values={dailyActiveCounts}
              labels={activeDays.map((d) => shortDateLabel(d, lang))}
              color={accent}
              isDark={isDark}
              tooltipLabel={(i, v) => `${shortDateLabel(activeDays[i], lang)}: ${v}`}
            />
          </Card>
          <Card>
            <p className="text-[11px] font-semibold mb-2" style={{ color: "var(--tm-text-2)" }}>
              {t.adminResponseTimeLabel}
            </p>
            <TrendLineChart
              values={responseTimeAvgs}
              labels={activeDays.map((d) => shortDateLabel(d, lang))}
              color={accent}
              isDark={isDark}
              tooltipLabel={(i) => t.adminResponseTimeTooltip(responseTimeCounts[i].avg, responseTimeCounts[i].count)}
            />
          </Card>
        </div>
      </section>

      {/* New signups */}
      <section>
        <SectionHeading>{t.adminNewUsersHeading}</SectionHeading>
        <Card>
          <ColumnBarChart
            values={signupCounts}
            labels={days.map((d) => dayLabel(d, lang))}
            color={accent}
            isDark={isDark}
          />
        </Card>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
        {/* Meal plan adoption */}
        <section className="flex flex-col">
          <SectionHeading>{t.adminMealPlanAdoptionHeading}</SectionHeading>
          <Card className="flex-1">
            {!adoption ? (
              <EmptyNote>{t.loading}</EmptyNote>
            ) : (
              <>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs font-medium" style={{ color: "var(--tm-text-2)" }}>
                    {t.adminAdoptionRateLabel}
                  </span>
                  <span className="text-lg font-bold" style={{ color: accent }}>
                    {formatPercent(adoption.adoption_rate)}
                  </span>
                </div>
                <Meter fraction={adoption.adoption_rate} color={accent} />
                <p className="text-[10.5px] mt-1.5" style={{ color: "var(--tm-text-3)" }}>
                  {t.adminAdoptionRateDescription}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-3.5">
                  <StatTile label={t.adminTotalUsersLabel} value={formatCompact(adoption.total_users)} />
                  <StatTile
                    label={t.adminUsersWithMealPlansLabel}
                    value={formatCompact(adoption.users_with_meal_plans)}
                  />
                  <StatTile label={t.adminTotalMealPlansLabel} value={formatCompact(adoption.total_meal_plans)} />
                  <StatTile
                    label={t.adminUsersWithSuggestionsLabel}
                    value={formatCompact(adoption.users_with_suggestions)}
                  />
                </div>
              </>
            )}
          </Card>
        </section>

        {/* AI feature usage */}
        <section className="flex flex-col">
          <SectionHeading>{t.adminAiUsageHeading}</SectionHeading>
          <Card className="flex-1 flex flex-col">
            <p className="text-[11px] mb-2.5" style={{ color: "var(--tm-text-3)" }}>
              {t.adminAiUsageSubtitle}
            </p>
            {data && data.ai_usage.length === 0 ? (
              <EmptyNote>{t.adminNoAiUsage}</EmptyNote>
            ) : (
              <>
                <RankedBarChart
                  items={(data?.ai_usage ?? []).map((u) => ({ label: u.request_type, count: u.total }))}
                  color={accent}
                  isDark={isDark}
                  labelFor={t.aiRequestTypeDisplay}
                  tooltipLabel={(i) => {
                    const u = data!.ai_usage[i];
                    const failPct = u.failed > 0 ? formatPercent(u.fail_rate) : null;
                    return t.adminAiUsageTooltip(u.total, failPct);
                  }}
                />
                <Link
                  href="/admin/ai-requests"
                  className="flex items-center justify-center gap-1 text-xs font-semibold mt-3 py-2 rounded-lg"
                  style={{ backgroundColor: `${accent}1F`, color: accent }}
                >
                  {t.adminViewAllAiRequests}
                  <ChevronRight size={14} />
                </Link>
              </>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
