import { ApiError, setAccessToken, getAccessToken } from "@/lib/api-client";
import { apiLogin, apiSignup, apiForgotPassword, apiResetPassword, apiGoogleAccessTokenLogin, apiResendSignupOtp, apiVerifySignupOtp, type OtpDispatchResult } from "@/lib/api/auth";
import { clearChatSession } from "@/lib/chat-session";
import type { ApiUser } from "@/lib/api/types";

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  language?: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role?: "admin" | "user";
  language?: string;
  theme?: string;
}

export class FieldError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message);
    this.name = "FieldError";
  }
}

export function isAdminRole(role: string | null | undefined): boolean {
  return (role ?? "").trim().toLowerCase() === "admin";
}

function mapApiUser(user: ApiUser): CurrentUser {
  const role = isAdminRole(user.role) ? "admin" : "user";
  return {
    id: String(user.id),
    name: user.full_name || user.username || user.email,
    email: user.email,
    role,
    language: user.language,
    theme: user.theme === "dark" ? "dark" : "light",
  };
}

/** Default post-auth destination — admins land in the dashboard, everyone else in the app. */
export function getPostLoginPath(user: CurrentUser): string {
  return isAdminRole(user.role) ? "/admin" : "/home";
}

/** Post sign-up destination — new (non-admin) accounts see the onboarding survey first. */
export function getPostSignupPath(user: CurrentUser): string {
  return isAdminRole(user.role) ? "/admin" : "/onboarding";
}

function persistSession(token: string, user: ApiUser): CurrentUser {
  setAccessToken(token);
  const current = mapApiUser(user);
  localStorage.setItem("fh_current_user", JSON.stringify(current));
  return current;
}

/** Login matched a pending_signups row; user must enter the email OTP. */
export class PendingSignupError extends Error {
  email: string;
  constructor(email: string, message?: string) {
    super(message || "Please verify your email before signing in.");
    this.name = "PendingSignupError";
    this.email = email;
  }
}

function mapAuthError(err: unknown, context?: { email?: string }): never {
  if (err instanceof ApiError) {
    const msg = err.message.toLowerCase();
    if (err.status === 401 || msg.includes("invalid email or password")) {
      throw new FieldError("password", "Incorrect email or password. Please try again.");
    }
    if (err.status === 400 && msg.includes("already registered")) {
      throw new FieldError("email", "An account with this email already exists.");
    }
    if (err.status === 403 && (msg.includes("not verified") || msg.includes("verify your email"))) {
      throw new PendingSignupError(context?.email || "", err.message);
    }
    if (err.status === 403) {
      throw new Error(err.message || "Account is inactive.");
    }
    throw new Error(err.message || "Authentication failed");
  }
  if (err instanceof Error) throw err;
  throw new Error("Authentication failed");
}

function wrapAuthError(err: unknown, fallback: string, context?: { email?: string }): never {
  if (err instanceof ApiError) mapAuthError(err, context);
  throw err instanceof Error ? err : new Error(fallback);
}

export async function login({
  email,
  password,
  rememberMe,
}: LoginCredentials): Promise<CurrentUser> {
  try {
    const res = await apiLogin({
      email,
      password,
      remember_me: rememberMe,
    });
    return persistSession(res.access_token, res.user);
  } catch (err) {
    wrapAuthError(err, "Authentication failed", { email });
  }
}

export async function signup({
  name,
  email,
  password,
  language,
}: SignupCredentials): Promise<OtpDispatchResult> {
  try {
    return await apiSignup({
      email,
      password,
      full_name: name,
      language,
    });
  } catch (err) {
    wrapAuthError(err, "Authentication failed", { email });
  }
}

export async function resendSignupOtp(email: string): Promise<OtpDispatchResult> {
  try {
    return await apiResendSignupOtp(email);
  } catch (err) {
    wrapAuthError(err, "Unable to send verification code.");
  }
}

export async function verifySignupOtp(input: {
  email: string;
  otp: string;
}): Promise<CurrentUser> {
  try {
    const res = await apiVerifySignupOtp(input);
    return persistSession(res.access_token, res.user);
  } catch (err) {
    wrapAuthError(err, "Unable to verify code.");
  }
}

export async function loginWithGoogle(accessToken: string): Promise<CurrentUser> {
  try {
    const res = await apiGoogleAccessTokenLogin(accessToken);
    return persistSession(res.access_token, res.user);
  } catch (err) {
    wrapAuthError(err, "Authentication failed");
  }
}

export async function forgotPassword(email: string): Promise<OtpDispatchResult> {
  try {
    return await apiForgotPassword(email);
  } catch (err) {
    wrapAuthError(err, "Unable to send reset code.");
  }
}

export async function resetPassword(input: {
  email: string;
  otp: string;
  newPassword: string;
}): Promise<void> {
  try {
    await apiResetPassword({
      email: input.email,
      otp: input.otp,
      new_password: input.newPassword,
    });
  } catch (err) {
    wrapAuthError(err, "Unable to reset password.");
  }
}

export function verifyEmailPath(
  email: string,
  otp?: string | null,
  next: "login" | "signup" = "login",
): string {
  const params = new URLSearchParams({ email, next });
  if (otp) params.set("otp", otp);
  return `/verify-email?${params.toString()}`;
}

/** Resend if possible, then always return the verify-email URL. */
export async function resumePendingSignup(email: string): Promise<string> {
  let otp: string | null = null;
  try {
    otp = (await resendSignupOtp(email)).otp;
  } catch {
    // User can resend on the OTP screen.
  }
  return verifyEmailPath(email, otp, "login");
}

/** Google-only account that never set a local password (has_password backend field). */
export function isGoogleOnlyUser(user: ApiUser): boolean {
  return user.google_id != null && user.has_password === false;
}

/** Refreshes the cached session (name/role) after a profile update, without touching the token. */
export function updateCachedUser(user: ApiUser): CurrentUser {
  const current = mapApiUser(user);
  localStorage.setItem("fh_current_user", JSON.stringify(current));
  return current;
}

export function getCurrentUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("fh_current_user") ?? "null");
  } catch {
    return null;
  }
}

export function hasAccessToken(): boolean {
  return !!getAccessToken();
}

export function logout(): void {
  setAccessToken(null);
  localStorage.removeItem("fh_current_user");
  clearChatSession();
}

/** Dev shortcut for mock Overview/Users only — no JWT, Recipes API & chat will fail. */
export function loginAsAdminBypass(): void {
  setAccessToken(null);
  const admin: CurrentUser = {
    id: "admin-demo",
    name: "Admin",
    email: "admin@foodhub.dev",
    role: "admin",
  };
  localStorage.setItem("fh_current_user", JSON.stringify(admin));
}
