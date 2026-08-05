import { ApiError } from "@/lib/api-client";
import { apiLogin, apiSignup } from "@/lib/api/auth";

export const DEMO_CHAT_LIMIT = 10;

const FP_SEED_KEY = "fh_demo_fp_seed";
const DEMO_TOKEN_KEY = "fh_demo_access_token";
const DEMO_FP_KEY = "fh_demo_fingerprint";

function countKey(fingerprint: string) {
  return `fh_demo_chat_count_${fingerprint}`;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Stable-enough browser fingerprint (seed + UA/locale/screen/timezone). */
export async function getBrowserFingerprint(): Promise<string> {
  if (typeof window === "undefined") return "server";

  let seed = localStorage.getItem(FP_SEED_KEY);
  if (!seed) {
    seed =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(FP_SEED_KEY, seed);
  }

  const raw = [
    seed,
    navigator.userAgent,
    navigator.language,
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
  ].join("|");

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(raw),
  );
  return toHex(digest).slice(0, 24);
}

function demoCredentials(fingerprint: string) {
  const id = fingerprint.slice(0, 16);
  return {
    email: `d${id}@demo.foodhub.app`,
    password: `FhDemo!${fingerprint}`,
    full_name: "FoodHub Demo",
  };
}

export function getDemoAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(DEMO_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getDemoChatCount(fingerprint: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(countKey(fingerprint));
    const n = Number.parseInt(raw ?? "0", 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function getDemoChatsRemaining(fingerprint: string): number {
  return Math.max(0, DEMO_CHAT_LIMIT - getDemoChatCount(fingerprint));
}

export function incrementDemoChatCount(fingerprint: string): number {
  const next = getDemoChatCount(fingerprint) + 1;
  localStorage.setItem(countKey(fingerprint), String(next));
  return next;
}

/**
 * Auto sign-up / login a disposable demo user tied to this browser fingerprint.
 * Does not touch the main app session (`fh_access_token`).
 */
export async function ensureDemoSession(): Promise<{
  token: string;
  fingerprint: string;
  remaining: number;
}> {
  const fingerprint = await getBrowserFingerprint();
  const remaining = getDemoChatsRemaining(fingerprint);
  const cached = getDemoAccessToken();
  const cachedFp = localStorage.getItem(DEMO_FP_KEY);

  if (cached && cachedFp === fingerprint) {
    return { token: cached, fingerprint, remaining };
  }

  const { email, password, full_name } = demoCredentials(fingerprint);

  try {
    const res = await apiLogin({ email, password, remember_me: true });
    localStorage.setItem(DEMO_TOKEN_KEY, res.access_token);
    localStorage.setItem(DEMO_FP_KEY, fingerprint);
    return { token: res.access_token, fingerprint, remaining };
  } catch {
    // New browser / first visit — create guest account
  }

  try {
    const res = await apiSignup({ email, password, full_name });
    localStorage.setItem(DEMO_TOKEN_KEY, res.access_token);
    localStorage.setItem(DEMO_FP_KEY, fingerprint);
    return { token: res.access_token, fingerprint, remaining };
  } catch (signupErr) {
    if (
      signupErr instanceof ApiError &&
      (signupErr.status === 400 ||
        signupErr.message.toLowerCase().includes("already"))
    ) {
      const res = await apiLogin({ email, password, remember_me: true });
      localStorage.setItem(DEMO_TOKEN_KEY, res.access_token);
      localStorage.setItem(DEMO_FP_KEY, fingerprint);
      return { token: res.access_token, fingerprint, remaining };
    }
    throw signupErr;
  }
}
