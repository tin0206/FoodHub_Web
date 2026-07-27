"use client";

import { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  Heart,
  Bot,
  UserPlus,
  ShieldCheck,
} from "lucide-react";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import { useDarkMode } from "@/lib/use-dark-mode";
import {
  ADMIN_ACCENT_LIGHT,
  ADMIN_ACCENT_DARK,
  CATEGORICAL,
  SUCCESS_TEXT,
  OVERVIEW_STATS,
  RECENT_ACTIVITY,
} from "@/lib/admin";

const STAT_ICONS = [Users, BookOpen, Heart, Bot];
const ACTIVITY_ICONS = [UserPlus, BookOpen, Heart, Bot];

export default function AdminOverviewPage() {
  const isDark = useDarkMode();
  const accent = isDark ? ADMIN_ACCENT_DARK : ADMIN_ACCENT_LIGHT;
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* Greeting */}
      <div
        className="rounded-2xl p-4 mb-5 flex items-center justify-between"
        style={{
          background: `linear-gradient(135deg, ${accent}, #4a3aa7)`,
          boxShadow: `0 6px 16px ${accent}59`,
        }}
      >
        <div>
          <p className="text-xs text-white/80">Welcome back,</p>
          <p className="text-xl font-extrabold text-white tracking-tight">
            {user?.name ?? "Admin"}
          </p>
          <span className="inline-block mt-2 text-[11px] font-semibold text-white px-2.5 py-1 rounded-full bg-white/20">
            Administrator
          </span>
        </div>
        <div className="rounded-full bg-white/20 flex items-center justify-center shrink-0" style={{ width: 52, height: 52 }}>
          <ShieldCheck size={28} color="white" />
        </div>
      </div>

      {/* Stat tiles */}
      <p className="text-sm font-bold mb-2" style={{ color: "var(--tm-text)" }}>
        Overview
      </p>
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {OVERVIEW_STATS.map((stat, i) => {
          const Icon = STAT_ICONS[i];
          const color = isDark ? CATEGORICAL[stat.colorIndex].dark : CATEGORICAL[stat.colorIndex].light;
          const successColor = isDark ? SUCCESS_TEXT.dark : SUCCESS_TEXT.light;
          return (
            <div
              key={stat.label}
              className="rounded-2xl p-3 flex flex-col justify-between gap-2"
              style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${color}1F` }}
                >
                  <Icon size={15} color={color} />
                </div>
                <span
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${successColor}1A`, color: successColor }}
                >
                  {stat.trend}
                </span>
              </div>
              <div>
                <p className="text-[22px] font-extrabold tracking-tight" style={{ color: "var(--tm-text)" }}>
                  {stat.value}
                </p>
                <p className="text-[11px]" style={{ color: "var(--tm-text-2)" }}>
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent activity */}
      <p className="text-sm font-bold mb-2" style={{ color: "var(--tm-text)" }}>
        Recent Activity
      </p>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }}
      >
        {RECENT_ACTIVITY.map((item, i) => {
          const Icon = ACTIVITY_ICONS[item.colorIndex % ACTIVITY_ICONS.length];
          const color = isDark ? CATEGORICAL[item.colorIndex].dark : CATEGORICAL[item.colorIndex].light;
          return (
            <div
              key={item.id}
              className="flex items-center gap-2.5 px-3.5 py-2.5"
              style={{ borderTop: i > 0 ? "1px solid var(--tm-border-i)" : undefined }}
            >
              <div
                className="rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${color}1F`, width: 34, height: 34 }}
              >
                <Icon size={16} color={color} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: "var(--tm-text)" }}>
                  {item.title}
                </p>
                <p className="text-[11px]" style={{ color: "var(--tm-text-2)" }}>
                  {item.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
