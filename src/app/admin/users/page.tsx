"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus, ChevronRight } from "lucide-react";
import { useDarkMode } from "@/lib/use-dark-mode";
import {
  ADMIN_ACCENT_LIGHT,
  ADMIN_ACCENT_DARK,
  listAdminUsers,
  avatarInitials,
  avatarColor,
  type AdminUser,
} from "@/lib/admin";

const FILTERS = ["All", "Admin", "Active", "Inactive"] as const;
type Filter = (typeof FILTERS)[number];

function RoleBadge({ role, accent }: { role: AdminUser["role"]; accent: string }) {
  const isAdmin = role === "admin";
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
      style={{
        backgroundColor: isAdmin ? `${accent}21` : "#10B98119",
        color: isAdmin ? accent : "#10B981",
      }}
    >
      {isAdmin ? "Admin" : "User"}
    </span>
  );
}

export default function AdminUsersPage() {
  const isDark = useDarkMode();
  const accent = isDark ? ADMIN_ACCENT_DARK : ADMIN_ACCENT_LIGHT;
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  useEffect(() => {
    setUsers(listAdminUsers());
  }, []);

  const filtered = useMemo(() => {
    if (!users) return [];
    let list = users.filter((u) => {
      if (filter === "Admin") return u.role === "admin";
      if (filter === "Active") return u.isActive;
      if (filter === "Inactive") return !u.isActive;
      return true;
    });
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q),
      );
    }
    return list;
  }, [users, filter, query]);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold" style={{ color: "var(--tm-text)" }}>
            Users
          </p>
          {users && (
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${accent}1F`, color: accent }}
            >
              {users.length}
            </span>
          )}
        </div>
        <Link
          href="/admin/users/new"
          className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-lg"
          style={{ backgroundColor: accent }}
        >
          <Plus size={14} /> Add User
        </Link>
      </div>

      <div className="relative mb-2.5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--tm-text-3)" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, username…"
          className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm focus:outline-none"
          style={{ backgroundColor: "var(--tm-surface)", color: "var(--tm-text)", border: "1px solid var(--tm-border-i)" }}
        />
      </div>

      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-0.5">
        {FILTERS.map((f) => {
          const selected = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors"
              style={{
                backgroundColor: selected ? accent : "var(--tm-surface)",
                color: selected ? "white" : "var(--tm-text-2)",
                border: selected ? "none" : "1px solid var(--tm-border-i)",
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      {users === null ? null : filtered.length === 0 ? (
        <p className="text-center text-sm py-10" style={{ color: "var(--tm-text-2)" }}>
          No users found
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <Link
              key={u.id}
              href={`/admin/users/${u.id}`}
              className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl"
              style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }}
            >
              <div
                className="w-10.5 h-10.5 rounded-full flex items-center justify-center font-bold shrink-0"
                style={{ width: 42, height: 42, backgroundColor: `${avatarColor(u.fullName, isDark)}26`, color: avatarColor(u.fullName, isDark) }}
              >
                {avatarInitials(u.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-bold truncate" style={{ color: "var(--tm-text)" }}>
                    {u.fullName}
                  </p>
                  <RoleBadge role={u.role} accent={accent} />
                </div>
                <p className="text-[11.5px] truncate" style={{ color: "var(--tm-text-2)" }}>
                  {u.email}
                </p>
                <p className="text-[11px]" style={{ color: "var(--tm-text-3)" }}>
                  @{u.username}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[11px]" style={{ color: "var(--tm-text-2)" }}>
                  {u.recipeCount} recipes
                </span>
                <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: u.isActive ? "#10B981" : "#F43F5E" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: u.isActive ? "#10B981" : "#F43F5E" }} />
                  {u.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <ChevronRight size={16} color="var(--tm-text-3)" className="shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
