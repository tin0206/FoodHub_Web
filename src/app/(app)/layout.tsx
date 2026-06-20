"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, logout } from "@/lib/auth";
import { applyTheme } from "@/lib/theme";
import { ChefHat, Home, Search, Heart, User, LogOut } from "lucide-react";

function AutoAwesomeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
      <path fill="currentColor" d="m19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25zm0 6l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25zm-7.5-5.5L9 4L6.5 9.5L1 12l5.5 2.5L9 20l2.5-5.5L17 12zm-1.51 3.49L9 15.17l-.99-2.18L5.83 12l2.18-.99L9 8.83l.99 2.18l2.18.99z" />
    </svg>
  );
}

type NavItem = { href: string; label: string; icon: (size?: number) => ReactNode };

const NAV: NavItem[] = [
  { href: "/",          label: "Home",      icon: (s = 16) => <Home size={s} /> },
  { href: "/search",    label: "Search",    icon: (s = 16) => <Search size={s} /> },
  { href: "/recs",      label: "Recs",      icon: (s = 16) => <AutoAwesomeIcon size={s} /> },
  { href: "/favorites", label: "Favorites", icon: (s = 16) => <Heart size={s} /> },
  { href: "/profile",   label: "Profile",   icon: (s = 16) => <User size={s} /> },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!getCurrentUser()) router.replace("/login");
  }, [router]);

  // Restore saved theme on every page load
  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem('fh_profile') ?? '{}')
      applyTheme(profile.theme === 'dark')
    } catch {}
  }, []);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--tm-bg)' }}>

      {/* ── Sidebar — md and up ── */}
      <aside
        className="hidden md:flex flex-col w-44 shrink-0 border-r"
        style={{ backgroundColor: 'var(--tm-surface)', borderColor: 'var(--tm-border-s)' }}
      >
        <div
          className="flex items-center justify-between px-4 h-14 border-b shrink-0"
          style={{ borderColor: 'var(--tm-border-s)' }}
        >
          <div className="flex items-center gap-2">
            <ChefHat size={20} color="#059669" />
            <span className="text-sm font-bold" style={{ color: 'var(--tm-text)' }}>FoodHub</span>
          </div>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                style={{
                  backgroundColor: active ? '#ECFDF5' : 'transparent',
                  color: active ? '#059669' : 'var(--tm-text-2)',
                  fontWeight: active ? 500 : 400,
                }}
              >
                {item.icon(16)}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t py-3 px-2 shrink-0" style={{ borderColor: 'var(--tm-border-s)' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors hover:opacity-80"
            style={{ color: 'var(--tm-text-2)' }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-hidden pb-14 md:pb-0">{children}</main>

      {/* ── Bottom bar — below md ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t flex items-center justify-around h-14"
        style={{ backgroundColor: 'var(--tm-surface)', borderColor: 'var(--tm-border-s)' }}
      >
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1 transition-colors"
              style={{ color: active ? '#059669' : 'var(--tm-text-3)' }}
            >
              {item.icon(22)}
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
