"use client";

import { Check, X } from "lucide-react";
import { useStrings } from "@/lib/use-strings";

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11.5px]" style={{ color: met ? "#059669" : "var(--tm-text-3)" }}>
      {met ? <Check size={12} /> : <X size={12} />}
      {label}
    </div>
  );
}

/** Real-time password checklist — shown once the user starts typing a new password. */
export function PasswordRequirements({ password }: { password: string }) {
  const t = useStrings();
  if (!password) return null;

  const hasLength = password.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return (
    <div className="mt-2 space-y-1">
      <Requirement met={hasLength} label={t.pwReqLength} />
      <Requirement met={hasLetter} label={t.pwReqLetter} />
      <Requirement met={hasNumber} label={t.pwReqNumber} />
    </div>
  );
}

export function isPasswordValid(password: string): boolean {
  return password.length >= 6 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}
