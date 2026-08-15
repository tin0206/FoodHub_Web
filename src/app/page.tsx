import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import Link from "next/link";
import { ChefHat } from "lucide-react";
import { DemoChatPanel } from "@/components/chat/demo-chat-panel";
import { AuthRedirect } from "@/components/auth-redirect";
import "./landing.css";

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
  title: "FoodHub — Cook smarter with AI",
  description:
    "FoodHub helps you discover recipes, manage dietary goals, and chat with an AI cooking companion.",
};

export default function LandingPage() {
  return (
    <div className={`${display.variable} ${sans.variable} landing-root`}>
      <AuthRedirect />
      <header className="landing-header">
        <Link href="/" className="landing-brand">
          <ChefHat size={22} strokeWidth={2.25} />
          <span>FoodHub</span>
        </Link>
        <nav className="landing-nav" aria-label="Primary">
          <Link href="/recipes" className="landing-nav-link">
            Recipes
          </Link>
          <Link href="/login" className="landing-nav-link">
            Sign in
          </Link>
          <a href="#demo" className="landing-nav-cta">
            Demo
          </a>
        </nav>
      </header>

      <main>
        <section className="landing-hero" aria-label="Introduction">
          <div className="landing-hero-media" aria-hidden="true" />
          <div className="landing-hero-scrim" aria-hidden="true" />
          <div className="landing-hero-content">
            <p className="landing-brand-mark">FoodHub</p>
            <h1 className="landing-headline">
              Your AI companion for everyday cooking
            </h1>
            <p className="landing-lede">
              Discover recipes that fit your goals, chat for ideas, and keep
              favorites in one place—built for home cooks who want clarity, not
              clutter.
            </p>
            <div className="landing-cta-row">
              <a href="#demo" className="landing-btn-primary">
                Try the demo
              </a>
              <Link href="/login" className="landing-btn-secondary">
                Sign in
              </Link>
            </div>
          </div>
        </section>

        <section
          id="demo"
          className="landing-demo"
          aria-labelledby="landing-demo-title"
        >
          <div className="landing-demo-intro">
            <h2 id="landing-demo-title" className="landing-section-title">
              Try the AI companion
            </h2>
          </div>
          <div className="landing-demo-frame">
            <DemoChatPanel embedded />
          </div>
        </section>

        <section
          className="landing-section landing-section-alt"
          aria-labelledby="landing-library-title"
        >
          <h2 id="landing-library-title" className="landing-section-title">
            A recipe library that respects your plate
          </h2>
          <p className="landing-section-copy">
            Browse, save favorites, and tailor preferences so recommendations
            stay useful—whether you cook for energy, balance, or pure comfort.
          </p>
          <div className="landing-cta-row landing-cta-row-section">
            <Link href="/recipes" className="landing-btn-primary">
              Browse recipes
            </Link>
            <Link href="/signup" className="landing-btn-outline">
              Create an account
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <span className="landing-footer-brand">FoodHub</span>
        <span className="landing-footer-meta">Cook smarter · Eat better</span>
      </footer>
    </div>
  );
}
