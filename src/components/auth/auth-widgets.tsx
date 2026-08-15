"use client";

import type { InputHTMLAttributes } from "react";
import { useId, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";

export function AuthDivider() {
  return (
    <div className="auth-divider">
      <span>or</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.9c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 009 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.68 9c0-.59.1-1.17.27-1.7V4.97H.9A9 9 0 000 9c0 1.45.35 2.83.9 4.03l3.05-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.9 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

export function AuthSocialButton({
  label,
  onClick,
  loading,
  disabled,
}: {
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="auth-btn-google">
      {loading ? <span className="auth-spinner auth-spinner-dark" /> : (
        <>
          <GoogleIcon />
          {label}
        </>
      )}
    </button>
  );
}

export function AuthPrimaryButton({ label, loading, disabled }: { label: string; loading?: boolean; disabled?: boolean }) {
  return (
    <button type="submit" disabled={disabled || loading} className="auth-btn-primary">
      {loading ? <span className="auth-spinner" /> : label}
    </button>
  );
}

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
  error?: string;
  /** Force the red "has-error" outline without a per-field message (e.g. both
   * fields on a "wrong email or password" response, where only one shows text). */
  invalid?: boolean;
  isPassword?: boolean;
}

export function AuthField({ label, icon: Icon, error, invalid, isPassword, type, ...inputProps }: AuthFieldProps) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const resolvedType = isPassword ? (reveal ? "text" : "password") : type;

  return (
    <div>
      <label htmlFor={id} className="auth-field-label">
        {label}
      </label>
      <div className="auth-field-wrap">
        <span className="auth-field-icon">
          <Icon size={17} />
        </span>
        <input id={id} type={resolvedType} {...inputProps} className={`auth-input${error || invalid ? " has-error" : ""}`} />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="auth-field-toggle"
            tabIndex={-1}
            aria-label={reveal ? "Hide password" : "Show password"}
          >
            {reveal ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {error && <p className="auth-field-error">{error}</p>}
    </div>
  );
}
