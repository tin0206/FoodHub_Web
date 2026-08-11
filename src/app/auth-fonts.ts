import { Fraunces, Outfit } from "next/font/google";

export const authDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-auth-display",
  weight: ["500", "600", "700"],
});

export const authSans = Outfit({
  subsets: ["latin"],
  variable: "--font-auth-sans",
  weight: ["400", "500", "600", "700"],
});
