import { ApiError } from "@/lib/api-client";
import { apiLogin, apiSignup, apiVerifySignupOtp } from "@/lib/api/auth";

const FP_SEED_KEY = "fh_demo_fp_seed";
const DEMO_TOKEN_KEY = "fh_demo_access_token";
const DEMO_FP_KEY = "fh_demo_fingerprint";

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

/**
 * Auto sign-up / login a disposable demo user tied to this browser fingerprint.
 * Does not touch the main app session (`fh_access_token`).
 */
export async function ensureDemoSession(): Promise<{
  token: string;
  fingerprint: string;
}> {
  const fingerprint = await getBrowserFingerprint();
  const cached = getDemoAccessToken();
  const cachedFp = localStorage.getItem(DEMO_FP_KEY);

  if (cached && cachedFp === fingerprint) {
    return { token: cached, fingerprint };
  }

  const { email, password, full_name } = demoCredentials(fingerprint);

  try {
    const res = await apiLogin({ email, password, remember_me: true });
    localStorage.setItem(DEMO_TOKEN_KEY, res.access_token);
    localStorage.setItem(DEMO_FP_KEY, fingerprint);
    return { token: res.access_token, fingerprint };
  } catch {
    // New browser / first visit — create guest account
  }

  try {
    const pending = await apiSignup({ email, password, full_name });
    if (!pending.otp) {
      throw new Error("Demo signup requires a verification code.");
    }
    const res = await apiVerifySignupOtp({ email, otp: pending.otp });
    localStorage.setItem(DEMO_TOKEN_KEY, res.access_token);
    localStorage.setItem(DEMO_FP_KEY, fingerprint);
    return { token: res.access_token, fingerprint };
  } catch (signupErr) {
    if (
      signupErr instanceof ApiError &&
      (signupErr.status === 400 ||
        signupErr.message.toLowerCase().includes("already"))
    ) {
      const res = await apiLogin({ email, password, remember_me: true });
      localStorage.setItem(DEMO_TOKEN_KEY, res.access_token);
      localStorage.setItem(DEMO_FP_KEY, fingerprint);
      return { token: res.access_token, fingerprint };
    }
    throw signupErr;
  }
}
