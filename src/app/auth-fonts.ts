import { Fraunces, Be_Vietnam_Pro } from "next/font/google";

export const authDisplay = Fraunces({
  subsets: ["latin", "vietnamese"],
  variable: "--font-auth-display",
  weight: ["500", "600", "700"],
});

// Outfit has no "vietnamese" subset in Google Fonts, so Vietnamese diacritics
// (typed via Unikey etc.) would silently fall back to a mismatched system font.
// Be Vietnam Pro covers the same geometric-sans feel and supports Vietnamese.
export const authSans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  variable: "--font-auth-sans",
  weight: ["400", "500", "600", "700"],
});
