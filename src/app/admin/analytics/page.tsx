"use client";

import { Heart } from "lucide-react";
import { useDarkMode } from "@/lib/use-dark-mode";
import {
  ADMIN_ACCENT_LIGHT,
  ADMIN_ACCENT_DARK,
  CATEGORICAL,
  TOP_RECIPES,
  LABEL_STATS,
  WEEKLY_SIGNUPS,
  WEEKLY_AI_SCANS,
  WEEK_DAYS,
} from "@/lib/admin";

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

function ColumnChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end justify-between gap-2" style={{ height: 96 }}>
      {data.map((v, i) => {
        const frac = max === 0 ? 0 : Math.max(v / max, 0.08);
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
  const orange = isDark ? CATEGORICAL[1].dark : CATEGORICAL[1].light;
  const maxFav = TOP_RECIPES[0]?.favorites ?? 1;
  const maxLabelCount = LABEL_STATS[0]?.count ?? 1;

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-5">
      {/* Top recipes */}
      <section>
        <SectionHeading>Most Favorited Recipes</SectionHeading>
        <Card>
          <div className="space-y-3">
            {TOP_RECIPES.map((r, i) => {
              const rank = i + 1;
              const frac = r.favorites / maxFav;
              return (
                <div key={r.title} className="flex items-center gap-2">
                  <span
                    className="w-5 text-[11px] font-bold shrink-0"
                    style={{ color: rank === 1 ? "#c98500" : "var(--tm-text-2)" }}
                  >
                    #{rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate mb-1" style={{ color: "var(--tm-text)" }}>
                      {r.title}
                    </p>
                    <div className="h-[5px] rounded-full" style={{ backgroundColor: "var(--tm-subtle)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${frac * 100}%`, backgroundColor: accent }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" title={`${r.favorites} favorites`}>
                    <Heart size={11} color="#e34948" fill="#e34948" />
                    <span className="text-xs font-bold" style={{ color: "var(--tm-text)" }}>
                      {r.favorites}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Popular labels */}
      <section>
        <SectionHeading>Popular Dietary Labels</SectionHeading>
        <Card>
          <div className="space-y-2.5">
            {LABEL_STATS.map((l) => {
              const color = isDark ? CATEGORICAL[l.colorIndex].dark : CATEGORICAL[l.colorIndex].light;
              const frac = l.count / maxLabelCount;
              return (
                <div key={l.label} className="flex items-center gap-2.5">
                  <span className="w-20 text-[11.5px] font-medium shrink-0 truncate" style={{ color: "var(--tm-text-2)" }}>
                    {l.label}
                  </span>
                  <div className="flex-1 h-5 rounded-md relative" style={{ backgroundColor: "var(--tm-subtle)" }} title={`${l.count}`}>
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
        </Card>
      </section>

      {/* Weekly signups */}
      <section>
        <SectionHeading>New Users — Last 7 Days</SectionHeading>
        <Card>
          <ColumnChart data={WEEKLY_SIGNUPS} color={accent} />
          <div className="flex justify-between mt-2">
            {WEEK_DAYS.map((d) => (
              <span key={d} className="flex-1 text-center text-[10px] font-medium" style={{ color: "var(--tm-text-2)" }}>
                {d}
              </span>
            ))}
          </div>
        </Card>
      </section>

      {/* AI scans */}
      <section>
        <SectionHeading>AI Scan Activity — Last 7 Days</SectionHeading>
        <Card>
          <ColumnChart data={WEEKLY_AI_SCANS} color={orange} />
          <div className="flex justify-between mt-2">
            {WEEK_DAYS.map((d) => (
              <span key={d} className="flex-1 text-center text-[10px] font-medium" style={{ color: "var(--tm-text-2)" }}>
                {d}
              </span>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
