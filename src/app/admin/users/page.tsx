"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  Shield,
  User as UserIcon,
  X,
} from "lucide-react";
import { useDarkMode } from "@/lib/use-dark-mode";
import { useStrings } from "@/lib/use-strings";
import type { Strings } from "@/lib/strings";
import {
  ADMIN_ACCENT_LIGHT,
  ADMIN_ACCENT_DARK,
  avatarInitials,
  avatarColor,
} from "@/lib/admin";
import { hasAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { listAdminUsers } from "@/lib/api/admin-users";
import type { ApiUser } from "@/lib/api/types";

type UserFilter = "" | "admin" | "active" | "inactive";

const PAGE_SIZE = 20;

function RoleBadge({ role, accent, t }: { role: string; accent: string; t: Strings }) {
  const isAdmin = role === "admin";
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
      style={{
        backgroundColor: isAdmin ? `${accent}21` : "#10B98119",
        color: isAdmin ? accent : "#10B981",
      }}
    >
      {isAdmin ? <Shield size={10} /> : <UserIcon size={10} />}
      {isAdmin ? t.adminRoleLabel : t.userRoleLabel}
    </span>
  );
}

export default function AdminUsersPage() {
  const isDark = useDarkMode();
  const accent = isDark ? ADMIN_ACCENT_DARK : ADMIN_ACCENT_LIGHT;
  const t = useStrings();
  const FILTERS: { value: UserFilter; label: string }[] = [
    { value: "", label: t.filterAll },
    { value: "admin", label: t.filterAdmin },
    { value: "active", label: t.filterActive },
    { value: "inactive", label: t.filterInactive },
  ];
  const [users, setUsers] = useState<ApiUser[] | null>(null);
  const [filter, setFilter] = useState<UserFilter>("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    if (!hasAccessToken()) {
      setUsers([]);
      setHasNext(false);
      setError(t.adminNoTokenUsers);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const role = filter === "admin" ? "admin" : undefined;
      const active =
        filter === "active" ? true : filter === "inactive" ? false : undefined;

      if (debouncedQuery) {
        // Backend `q` only matches email/full_name — also filter client-side by
        // username so "@handle" searches still work.
        const data = await listAdminUsers({
          skip: 0,
          limit: 200,
          role,
          active,
          q: debouncedQuery,
        });
        const q = debouncedQuery.toLowerCase();
        const filtered = data.filter(
          (u) =>
            u.full_name?.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.username.toLowerCase().includes(q),
        );
        const start = page * PAGE_SIZE;
        setHasNext(filtered.length > start + PAGE_SIZE);
        setUsers(filtered.slice(start, start + PAGE_SIZE));
      } else {
        const skip = page * PAGE_SIZE;
        const data = await listAdminUsers({
          skip,
          limit: PAGE_SIZE + 1,
          role,
          active,
        });
        setHasNext(data.length > PAGE_SIZE);
        setUsers(data.slice(0, PAGE_SIZE));
      }
    } catch (err) {
      setUsers([]);
      setHasNext(false);
      if (err instanceof ApiError) {
        setError(err.status === 403 ? t.adminRoleRequiredUsersList : err.message);
      } else {
        setError(err instanceof Error ? err.message : t.adminFailedLoadUsers);
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page, debouncedQuery, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function setFilterAndReset(next: UserFilter) {
    setPage(0);
    setFilter(next);
  }

  const rangeStart = page * PAGE_SIZE + 1;
  const rangeEnd = page * PAGE_SIZE + (users?.length ?? 0);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-3 gap-2">
        <p className="text-sm font-bold" style={{ color: "var(--tm-text)" }}>
          {t.adminUsersTitle}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg"
            style={{ backgroundColor: `${accent}1F`, color: accent }}
            disabled={loading}
          >
            <RefreshCw
              size={14}
              className={loading ? "animate-spin" : undefined}
            />
            {t.refresh}
          </button>
          <Link
            href="/admin/users/new"
            className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-lg"
            style={{ backgroundColor: accent }}
          >
            <Plus size={14} /> {t.adminAddUser}
          </Link>
        </div>
      </div>

      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2 mb-3"
        style={{
          backgroundColor: "var(--tm-surface)",
          border: "1px solid var(--tm-border-i)",
        }}
      >
        <Search size={16} color="var(--tm-text-3)" className="shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.adminSearchUsersHint}
          className="flex-1 min-w-0 bg-transparent outline-none text-sm"
          style={{ color: "var(--tm-text)" }}
          aria-label={t.adminSearchUsersHint}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "var(--tm-subtle)",
              color: "var(--tm-text-2)",
            }}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        {FILTERS.map((opt) => {
          const active = filter === opt.value;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => setFilterAndReset(opt.value)}
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

      {error && (
        <div
          className="rounded-2xl p-4 mb-3 text-sm"
          style={{
            backgroundColor: "#F43F5E14",
            color: "#F43F5E",
            border: "1px solid #F43F5E33",
          }}
        >
          {error}
        </div>
      )}

      {loading && users === null ? (
        <p className="text-sm" style={{ color: "var(--tm-text-2)" }}>
          Loading users…
        </p>
      ) : users && users.length === 0 && !error ? (
        <div
          className="rounded-2xl p-8 flex flex-col items-center text-center gap-2"
          style={{
            backgroundColor: "var(--tm-surface)",
            border: "1px solid var(--tm-border-i)",
          }}
        >
          <UserIcon size={28} color="var(--tm-text-3)" />
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--tm-text)" }}
          >
            {t.adminNoUsersFound}
          </p>
          <p className="text-xs" style={{ color: "var(--tm-text-2)" }}>
            {debouncedQuery ? t.adminTryAnotherSearch : t.adminTryAnotherFilter}
          </p>
        </div>
      ) : users && users.length > 0 ? (
        <>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--tm-surface)",
              border: "1px solid var(--tm-border-i)",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {users.map((u, i) => {
              const name = u.full_name || u.username;
              const color = avatarColor(name, isDark);
              return (
                <Link
                  key={u.id}
                  href={`/admin/users/${u.id}`}
                  className="flex items-center gap-3 px-3.5 py-3 hover:opacity-90 transition-opacity"
                  style={{
                    borderTop:
                      i > 0 ? "1px solid var(--tm-border-i)" : undefined,
                  }}
                >
                  <div
                    className="rounded-full flex items-center justify-center font-bold shrink-0"
                    style={{
                      width: 42,
                      height: 42,
                      backgroundColor: `${color}26`,
                      color,
                    }}
                  >
                    {avatarInitials(name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p
                        className="text-[13px] font-semibold truncate"
                        style={{ color: "var(--tm-text)" }}
                      >
                        {name}
                      </p>
                      <RoleBadge role={u.role} accent={accent} t={t} />
                    </div>
                    <p
                      className="text-[11.5px] truncate"
                      style={{ color: "var(--tm-text-2)" }}
                    >
                      {u.email}
                    </p>
                  </div>
                  <span
                    className="flex items-center gap-1 text-[10px] font-semibold shrink-0"
                    style={{ color: u.is_active ? "#10B981" : "#F43F5E" }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: u.is_active ? "#10B981" : "#F43F5E",
                      }}
                    />
                    {u.is_active ? t.active : t.inactive}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-3 gap-2">
            <p className="text-[11px]" style={{ color: "var(--tm-text-3)" }}>
              {t.adminShowingUsers(rangeStart, rangeEnd, hasNext, debouncedQuery)}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0 || loading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-40"
                style={{
                  backgroundColor: "var(--tm-subtle)",
                  color: "var(--tm-text-2)",
                }}
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
