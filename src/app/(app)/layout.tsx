"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, logout, isAdminRole } from "@/lib/auth";
import { applyTheme, readStoredTheme } from "@/lib/theme";
import { setLang } from "@/lib/i18n";
import { useStrings } from "@/lib/use-strings";
import { ChefHat, Home, Search, Heart, User, LogOut, ShieldCheck } from "lucide-react";
import { authDisplay, authSans } from "../auth-fonts";

function AutoAwesomeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
      <path fill="currentColor" d="m19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25zm0 6l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25zm-7.5-5.5L9 4L6.5 9.5L1 12l5.5 2.5L9 20l2.5-5.5L17 12zm-1.51 3.49L9 15.17l-.99-2.18L5.83 12l2.18-.99L9 8.83l.99 2.18l2.18.99z" />
    </svg>
  );
}

type NavItem = { href: string; label: string; icon: (size?: number) => ReactNode };

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useStrings();
  const [isAdmin, setIsAdmin] = useState(false);

  const NAV: NavItem[] = [
    { href: "/home",      label: t.navHome,      icon: (s = 16) => <Home size={s} /> },
    { href: "/search",    label: t.navSearch,    icon: (s = 16) => <Search size={s} /> },
    { href: "/recs",      label: t.navRecs,      icon: (s = 16) => <AutoAwesomeIcon size={s} /> },
    { href: "/favorites", label: t.navFavorites, icon: (s = 16) => <Heart size={s} /> },
    { href: "/profile",   label: t.navProfile,   icon: (s = 16) => <User size={s} /> },
  ];

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    setIsAdmin(isAdminRole(user.role));
    // Boot the app in the user's saved language before Profile ever loads.
    if (user.language) setLang(user.language === "vi" ? "vi" : "en");
    applyTheme(user.theme ? user.theme === "dark" : readStoredTheme());
  }, [router]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  function isActive(href: string) {
    return href === "/home" ? pathname === "/home" : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div
      className={`${authDisplay.variable} ${authSans.variable} flex h-screen overflow-hidden`}
      style={{ backgroundColor: 'var(--tm-bg)', fontFamily: 'var(--font-auth-sans), system-ui, sans-serif' }}
    >

      {/* ── Sidebar — md and up ── */}
      <aside
        className="hidden md:flex flex-col w-56 shrink-0 border-r"
        style={{ backgroundColor: 'var(--tm-surface)', borderColor: 'var(--tm-border-s)' }}
      >
        <div className="flex items-center gap-2.5 px-5 h-16 shrink-0">
          <Link href="/home" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(5,150,105,0.12)' }}
            >
              <ChefHat size={17} color="#059669" />
            </span>
            <span
              className="text-[17px] font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-auth-display), Georgia, serif', color: 'var(--tm-text)' }}
            >
              FoodHub
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-full text-sm font-medium transition-colors"
                style={{
                  backgroundColor: active ? '#059669' : 'transparent',
                  color: active ? '#ffffff' : 'var(--tm-text-2)',
                  boxShadow: active ? '0 6px 16px rgba(5,150,105,0.28)' : 'none',
                }}
              >
                {item.icon(16)}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4 pt-3 shrink-0 space-y-1" style={{ borderTop: '1px solid var(--tm-border-s)' }}>
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-full text-sm font-medium transition-colors"
              style={{
                backgroundColor: pathname.startsWith('/admin') ? 'rgba(5,150,105,0.12)' : 'transparent',
                color: pathname.startsWith('/admin') ? '#059669' : 'var(--tm-text-2)',
              }}
            >
              <ShieldCheck size={16} />
              {t.navAdmin}
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-full text-sm font-medium text-left transition-colors hover:text-[#DC2626]"
            style={{ color: 'var(--tm-text-2)' }}
          >
            <LogOut size={16} />
            {t.logOut}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-hidden pb-16 md:pb-0 flex flex-col min-h-0">{children}</main>

      {/* ── Bottom bar — below md ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 px-2"
        style={{
          backgroundColor: 'var(--tm-surface)',
          borderTop: '1px solid var(--tm-border-s)',
          boxShadow: '0 -8px 20px rgba(12,26,20,0.06)',
        }}
      >
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-colors"
              style={{
                color: active ? '#059669' : 'var(--tm-text-3)',
                backgroundColor: active ? 'rgba(5,150,105,0.1)' : 'transparent',
              }}
            >
              {item.icon(20)}
              <span className="text-[10px] font-semibold leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
