import { apiFetch } from "@/lib/api-client";
import type { ApiUser, TokenResponse, UserProfileUpdate } from "@/lib/api/types";

export type OtpDispatchResult = {
  message: string;
  /** Only populated in local/dev when email is not configured. */
  otp: string | null;
};

async function postOtpDispatch(
  path: string,
  body: object,
): Promise<OtpDispatchResult> {
  const res = await apiFetch<{ message: string; otp?: string | null }>(path, {
    method: "POST",
    auth: false,
    body,
  });
  return { message: res.message, otp: res.otp ?? null };
}

export async function apiLogin(input: {
  email: string;
  password: string;
  remember_me?: boolean;
}): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    auth: false,
    body: {
      email: input.email,
      password: input.password,
      remember_me: input.remember_me ?? false,
    },
  });
}

export async function apiSignup(input: {
  email: string;
  password: string;
  full_name?: string;
  language?: string;
}): Promise<OtpDispatchResult> {
  return postOtpDispatch("/auth/signup", {
    email: input.email,
    password: input.password,
    full_name: input.full_name || undefined,
    language: input.language,
  });
}

export async function apiResendSignupOtp(email: string): Promise<OtpDispatchResult> {
  return postOtpDispatch("/auth/signup/resend-otp", { email });
}

export async function apiVerifySignupOtp(input: {
  email: string;
  otp: string;
}): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/auth/signup/verify-otp", {
    method: "POST",
    auth: false,
    body: input,
  });
}

/** Web equivalent of mobile's Flutter-web Google flow — POSTs a client-obtained OAuth2 access_token. */
export async function apiGoogleAccessTokenLogin(accessToken: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/auth/google/access_token", {
    method: "POST",
    auth: false,
    body: { access_token: accessToken },
  });
}

export async function apiGetMe(): Promise<ApiUser> {
  return apiFetch<ApiUser>("/users/me");
}

export async function apiUpdateMe(payload: UserProfileUpdate): Promise<ApiUser> {
  return apiFetch<ApiUser>("/users/me", {
    method: "PATCH",
    body: payload,
  });
}

export async function apiForgotPassword(email: string): Promise<OtpDispatchResult> {
  return postOtpDispatch("/auth/forgot-password", { email });
}

export async function apiResetPassword(input: {
  email: string;
  otp: string;
  new_password: string;
}): Promise<void> {
  await apiFetch<void>("/auth/reset-password", {
    method: "POST",
    auth: false,
    body: input,
  });
}

export async function apiChangePassword(input: {
  current_password: string;
  new_password: string;
}): Promise<void> {
  await apiFetch<void>("/auth/change-password", {
    method: "POST",
    body: input,
  });
}
