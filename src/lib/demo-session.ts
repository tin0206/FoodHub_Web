import { ApiError } from "@/lib/api-client";
import { apiLogin, apiSignup, apiVerifySignupOtp } from "@/lib/api/auth";

const FP_SEED_KEY = "fh_demo_fp_seed";
const DEMO_TOKEN_KEY = "fh_demo_access_token";
const DEMO_FP_KEY = "fh_demo_fingerprint";

/** In-memory fallback when Safari blocks localStorage (ITP / private mode). */
const memoryStore = new Map<string, string>();

function storageGet(key: string): string | null {
  try {
    const value = localStorage.getItem(key);
    if (value != null) return value;
  } catch {
    // Safari iOS private browsing / ITP can throw on localStorage
  }
  return memoryStore.get(key) ?? null;
}

function storageSet(key: string, value: string): void {
  memoryStore.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    // Keep the in-memory copy so this page session still has credentials
  }
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Deterministic hex when Web Crypto is missing (HTTP / older iOS Safari). */
function fallbackHash(raw: string): string {
  let h1 = 2166136261;
  let h2 = 16777619;
  let h3 = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 16777619);
    h2 = Math.imul(h2 ^ c, 2246822519);
  }
  for (let i = raw.length - 1; i >= 0; i--) {
    h3 ^= raw.charCodeAt(i);
    h3 = Math.imul(h3, 16777619);
  }
  return (
    (h1 >>> 0).toString(16).padStart(8, "0") +
    (h2 >>> 0).toString(16).padStart(8, "0") +
    (h3 >>> 0).toString(16).padStart(8, "0")
  ).slice(0, 24);
}

async function hashFingerprint(raw: string): Promise<string> {
  try {
    const subtle = globalThis.crypto?.subtle;
    if (subtle?.digest) {
      const digest = await subtle.digest(
        "SHA-256",
        new TextEncoder().encode(raw),
      );
      return toHex(digest).slice(0, 24);
    }
  } catch {
    // Insecure context (http://LAN-IP on iPhone) has no crypto.subtle
  }
  return fallbackHash(raw);
}

/** Stable-enough browser fingerprint (seed + UA/locale/screen/timezone). */
export async function getBrowserFingerprint(): Promise<string> {
  if (typeof window === "undefined") return "server";

  let seed = storageGet(FP_SEED_KEY);
  if (!seed) {
    seed =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    storageSet(FP_SEED_KEY, seed);
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

  return hashFingerprint(raw);
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
  const token = storageGet(DEMO_TOKEN_KEY);
  return token && token.length > 0 ? token : null;
}

function persistDemoSession(token: string, fingerprint: string) {
  storageSet(DEMO_TOKEN_KEY, token);
  storageSet(DEMO_FP_KEY, fingerprint);
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
  const cachedFp = storageGet(DEMO_FP_KEY);

  if (cached && cachedFp === fingerprint) {
    return { token: cached, fingerprint };
  }

  const { email, password, full_name } = demoCredentials(fingerprint);

  try {
    const res = await apiLogin({ email, password, remember_me: true });
    persistDemoSession(res.access_token, fingerprint);
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
    persistDemoSession(res.access_token, fingerprint);
    return { token: res.access_token, fingerprint };
  } catch (signupErr) {
    if (
      signupErr instanceof ApiError &&
      (signupErr.status === 400 ||
        signupErr.message.toLowerCase().includes("already"))
    ) {
      const res = await apiLogin({ email, password, remember_me: true });
      persistDemoSession(res.access_token, fingerprint);
      return { token: res.access_token, fingerprint };
    }
    throw signupErr;
  }
}
