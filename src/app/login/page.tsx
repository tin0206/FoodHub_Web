"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login, loginWithGoogle, FieldError, getCurrentUser, getPostLoginPath } from "@/lib/auth";
import { requestGoogleAccessToken } from "@/lib/google-auth";
import { ChefHat, Mail, Lock } from "lucide-react";
import {
  AuthField,
  AuthPrimaryButton,
  AuthDivider,
  AuthSocialButton,
} from "@/components/auth/auth-widgets";
import { authDisplay, authSans } from "../auth-fonts";
import "../auth.css";

const isValidEmail = (v: string) => v.includes("@");

type Errors = { email: string; password: string };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [errors, setErrors] = useState<Errors>({ email: "", password: "" });
  const [credentialsInvalid, setCredentialsInvalid] = useState(false);

  useEffect(() => {
    const existing = getCurrentUser();
    if (existing) router.replace(getPostLoginPath(existing));
  }, [router]);

  function getEmailError(val = email) {
    if (!val.trim()) return "Please enter your email.";
    if (!isValidEmail(val)) return "Please enter a valid email.";
    return "";
  }

  function getPasswordError(val = password) {
    if (!val) return "Please enter your password.";
    if (val.length < 6) return "Password must be at least 6 characters.";
    return "";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const emailValue = email.trim();
    const passwordValue = password;

    const emailErr = getEmailError(emailValue);
    const passwordErr = getPasswordError(passwordValue);
    setErrors({ email: emailErr, password: passwordErr });
    if (emailErr || passwordErr) return;

    try {
      setLoading(true);
      setAuthError("");
      const user = await login({
        email: emailValue,
        password: passwordValue,
        rememberMe,
      });
      router.replace(getPostLoginPath(user));
    } catch (err: unknown) {
      if (err instanceof FieldError) {
        setErrors((prev) => ({ ...prev, [err.field]: err.message }));
        // Wrong email/password is ambiguous about which field is at fault —
        // highlight both instead of just the one the backend happened to name.
        if (err.field === "password") setCredentialsInvalid(true);
      } else {
        setAuthError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (loading || googleLoading) return;
    try {
      setGoogleLoading(true);
      setAuthError("");
      const accessToken = await requestGoogleAccessToken();
      const user = await loginWithGoogle(accessToken);
      router.replace(getPostLoginPath(user));
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
    }
  }

  const isLoading = loading || googleLoading;

  return (
    <div className={`${authDisplay.variable} ${authSans.variable} auth-root`}>
      <Link href="/" className="auth-brand">
        <ChefHat size={22} color="#059669" />
        <span>FoodHub</span>
      </Link>

      <div className="auth-card">
        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-sub">Sign in to continue to your account</p>

        <AuthSocialButton
          label="Continue with Google"
          onClick={handleGoogleSignIn}
          loading={googleLoading}
          disabled={isLoading}
        />
        <AuthDivider />

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          {authError && <p className="auth-error-banner">{authError}</p>}

          <AuthField
            label="Email address"
            icon={Mail}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setCredentialsInvalid(false);
              if (errors.email)
                setErrors((prev) => ({
                  ...prev,
                  email: getEmailError(e.target.value),
                }));
            }}
            onBlur={() =>
              setErrors((prev) => ({ ...prev, email: getEmailError() }))
            }
            placeholder="you@example.com"
            error={errors.email}
            invalid={credentialsInvalid}
          />

          <AuthField
            label="Password"
            icon={Lock}
            isPassword
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setCredentialsInvalid(false);
              if (errors.password)
                setErrors((prev) => ({
                  ...prev,
                  password: getPasswordError(e.target.value),
                }));
            }}
            onBlur={() =>
              setErrors((prev) => ({ ...prev, password: getPasswordError() }))
            }
            placeholder="••••••••"
            error={errors.password}
            invalid={credentialsInvalid}
          />

          <div className="auth-row-between">
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <Link href="/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          </div>

          <AuthPrimaryButton
            label="Sign in"
            loading={loading}
            disabled={isLoading}
          />
        </form>

        <p className="auth-switch">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="auth-link">
            Sign up
          </Link>
        </p>
        <p className="auth-switch">
          Just looking around?{" "}
          <Link href="/#demo" className="auth-link">
            Try the demo
          </Link>
        </p>
      </div>
    </div>
  );
}
