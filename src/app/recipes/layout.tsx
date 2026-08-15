import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Outfit } from "next/font/google";
import Link from "next/link";
import { ChefHat } from "lucide-react";
import { ForceLightTheme } from "@/components/force-light-theme";
import "../landing.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-landing-display",
  weight: ["500", "600", "700"],
});

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-landing-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Recipes — FoodHub",
  description:
    "Search FoodHub's recipe library and view full recipe details — no account required.",
};

export default function RecipesPublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={`${display.variable} ${sans.variable} landing-root`}>
      <ForceLightTheme>
        <header className="landing-subheader">
          <Link href="/" className="landing-subbrand">
            <ChefHat size={20} strokeWidth={2.25} />
            <span>FoodHub</span>
          </Link>
          <nav className="landing-nav" aria-label="Primary">
            <Link href="/login" className="landing-subnav-link">
              Sign in
            </Link>
            <Link href="/signup" className="landing-subnav-cta">
              Create account
            </Link>
          </nav>
        </header>

        <main className="landing-subpage-main">{children}</main>

        <footer className="landing-footer">
          <span className="landing-footer-brand">FoodHub</span>
          <span className="landing-footer-meta">Cook smarter · Eat better</span>
        </footer>
      </ForceLightTheme>
    </div>
  );
}
