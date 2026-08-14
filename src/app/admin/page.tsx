"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Users,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  UserPlus,
  ChevronRight,
} from "lucide-react";
import { getCurrentUser, hasAccessToken, type CurrentUser } from "@/lib/auth";
import { useDarkMode } from "@/lib/use-dark-mode";
import { ApiError } from "@/lib/api-client";
import { getAdminOverview, type AdminOverview } from "@/lib/api/admin-overview";
import { ADMIN_ACCENT_LIGHT, ADMIN_ACCENT_DARK, CATEGORICAL, relativeTime } from "@/lib/admin";

export default function AdminOverviewPage() {
  const isDark = useDarkMode();
  const accent = isDark ? ADMIN_ACCENT_DARK : ADMIN_ACCENT_LIGHT;
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const load = useCallback(async () => {
    if (!hasAccessToken()) {
      setOverview(null);
      setError(
        "No API token. Sign in with a real admin account (not Admin Bypass) to see live stats.",
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await getAdminOverview();
      setOverview(result);
    } catch (err) {
      setOverview(null);
      if (err instanceof ApiError) {
        setError(
          err.status === 403
            ? "Admin role required to view live stats."
            : err.message,
        );
      } else {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const tiles = overview
    ? [
        {
          label: "Total recipes",
          value: overview.total_recipes.toLocaleString(),
          icon: BookOpen,
          colorIndex: 2,
        },
        {
          label: "Total users",
          value: overview.total_users.toLocaleString(),
          icon: Users,
          colorIndex: 6,
        },
      ]
    : [];

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
        <div
          className="rounded-full bg-white/20 flex items-center justify-center shrink-0"
          style={{ width: 52, height: 52 }}
        >
          <ShieldCheck size={28} color="white" />
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold" style={{ color: "var(--tm-text)" }}>
          Overview
        </p>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50"
          style={{ backgroundColor: `${accent}1F`, color: accent }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : undefined} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          className="rounded-2xl p-4 mb-4 text-sm"
          style={{
            backgroundColor: "#F43F5E14",
            color: "#F43F5E",
            border: "1px solid #F43F5E33",
          }}
        >
          {error}
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {(loading && !overview ? Array.from({ length: 2 }) : tiles).map((stat, i) => {
          if (!stat) {
            return (
              <div
                key={i}
                className="rounded-2xl p-3 h-21 animate-pulse"
                style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }}
              />
            );
          }
          const { label, value, icon: Icon, colorIndex } = stat as (typeof tiles)[number];
          const color = isDark ? CATEGORICAL[colorIndex].dark : CATEGORICAL[colorIndex].light;
          return (
            <div
              key={label}
              className="rounded-2xl p-3 flex flex-col justify-between gap-2"
              style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${color}1F` }}
              >
                <Icon size={15} color={color} />
              </div>
              <div>
                <p className="text-[22px] font-extrabold tracking-tight" style={{ color: "var(--tm-text)" }}>
                  {value}
                </p>
                <p className="text-[11px]" style={{ color: "var(--tm-text-2)" }}>
                  {label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent activity — mixed feed of new users and new recipes */}
      <p className="text-sm font-bold mb-2" style={{ color: "var(--tm-text)" }}>
        Recent Activity
      </p>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }}
      >
        {overview && overview.recent_activities.length === 0 && (
          <p className="text-sm px-3.5 py-4" style={{ color: "var(--tm-text-2)" }}>
            No activity yet.
          </p>
        )}
        {(overview?.recent_activities ?? []).map((activity, i) => {
          const borderTop = i > 0 ? "1px solid var(--tm-border-i)" : undefined;

          if (activity.type === "user") {
            const { user: u } = activity;
            const color = isDark ? CATEGORICAL[0].dark : CATEGORICAL[0].light;
            return (
              <div
                key={`user-${u.id}`}
                className="flex items-center gap-2.5 px-3.5 py-2.5"
                style={{ borderTop }}
              >
                <div
                  className="rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}1F`, width: 34, height: 34 }}
                >
                  <UserPlus size={16} color={color} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: "var(--tm-text)" }}>
                    {u.full_name || u.username || u.email}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--tm-text-2)" }}>
                    New user joined {relativeTime(activity.created_at)}
                  </p>
                </div>
              </div>
            );
          }

          const { recipe: r } = activity;
          const isPublic = r.visibility === "public";
          const color = isDark ? CATEGORICAL[2].dark : CATEGORICAL[2].light;
          return (
            <Link
              key={`recipe-${r.id}`}
              href={`/admin/recipes/${r.id}`}
              className="flex items-center gap-2.5 px-3.5 py-2.5 hover:opacity-90 transition-opacity"
              style={{ borderTop }}
            >
              <div
                className="rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${color}1F`, width: 34, height: 34 }}
              >
                {isPublic ? <Eye size={16} color={color} /> : <EyeOff size={16} color={color} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold truncate" style={{ color: "var(--tm-text)" }}>
                  {r.title}
                </p>
                <p className="text-[11px]" style={{ color: "var(--tm-text-2)" }}>
                  Recipe added {relativeTime(activity.created_at)} · {isPublic ? "Public" : "Private"}
                </p>
              </div>
              <ChevronRight size={16} color="var(--tm-text-3)" className="shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
