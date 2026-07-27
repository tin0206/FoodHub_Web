"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChefHat, LayoutDashboard, BarChart3, BookOpen, Users, LogOut, ArrowLeft } from "lucide-react";
import { useDarkMode } from "@/lib/use-dark-mode";
import { getCurrentUser, logout } from "@/lib/auth";
import { applyTheme } from "@/lib/theme";
import { ADMIN_ACCENT_LIGHT, ADMIN_ACCENT_DARK } from "@/lib/admin";

const TABS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, match: (p: string) => p === "/admin" },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, match: (p: string) => p.startsWith("/admin/analytics") },
  { href: "/admin/recipes", label: "Recipes", icon: BookOpen, match: (p: string) => p.startsWith("/admin/recipes") },
  { href: "/admin/users", label: "Users", icon: Users, match: (p: string) => p.startsWith("/admin/users") },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isDark = useDarkMode();
  const accent = isDark ? ADMIN_ACCENT_DARK : ADMIN_ACCENT_LIGHT;
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/");
      return;
    }
    setAllowed(true);
  }, [router]);

  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem("fh_profile") ?? "{}");
      applyTheme(profile.theme === "dark");
    } catch {}
  }, []);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  if (!allowed) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--tm-bg)" }}>
      {/* ── Sidebar — md and up ── */}
      <aside
        className="hidden md:flex flex-col w-52 shrink-0 border-r"
        style={{ backgroundColor: "var(--tm-surface)", borderColor: "var(--tm-border-s)" }}
      >
        <div className="flex items-center gap-2 px-4 h-14 border-b shrink-0" style={{ borderColor: "var(--tm-border-s)" }}>
          <ChefHat size={20} color={accent} />
          <span className="text-sm font-bold" style={{ color: "var(--tm-text)" }}>
            FoodHub Admin
          </span>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                style={{
                  backgroundColor: active ? `${accent}1F` : "transparent",
                  color: active ? accent : "var(--tm-text-2)",
                  fontWeight: active ? 500 : 400,
                }}
              >
                <Icon size={16} />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t py-3 px-2 shrink-0 space-y-0.5" style={{ borderColor: "var(--tm-border-s)" }}>
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
            style={{ color: "var(--tm-text-2)" }}
          >
            <ArrowLeft size={16} />
            Back to app
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors hover:opacity-80"
            style={{ color: "var(--tm-text-2)" }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto pb-14 md:pb-0">{children}</main>

      {/* ── Bottom bar — below md ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t flex items-center justify-around h-14"
        style={{ backgroundColor: "var(--tm-surface)", borderColor: "var(--tm-border-s)" }}
      >
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1 transition-colors"
              style={{ color: active ? accent : "var(--tm-text-3)" }}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
