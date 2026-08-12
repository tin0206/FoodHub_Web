import { apiFetch } from "@/lib/api-client";
import type { ApiUser, TokenResponse, UserProfileUpdate } from "@/lib/api/types";

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
}): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/auth/signup", {
    method: "POST",
    auth: false,
    body: {
      email: input.email,
      password: input.password,
      full_name: input.full_name || undefined,
    },
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

export async function apiForgotPassword(email: string): Promise<void> {
  await apiFetch<void>("/auth/forgot-password", {
    method: "POST",
    auth: false,
    body: { email },
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
