"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AVAILABLE_LABELS, ADMIN_ACCENT_LIGHT, ADMIN_ACCENT_DARK } from "@/lib/admin";
import { useDarkMode } from "@/lib/use-dark-mode";
import { useStrings } from "@/lib/use-strings";
import type { Strings } from "@/lib/strings";
import { ApiError } from "@/lib/api-client";
import {
  createAdminUser,
  updateAdminUser,
  type AdminUserCreate,
  type AdminUserUpdate,
} from "@/lib/api/admin-users";
import type { ApiUser } from "@/lib/api/types";

const DEFAULT_PASSWORD = "123456";

function FieldCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-3.5" style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }}>
      <label className="block text-[11px] font-bold mb-1.5" style={{ color: "var(--tm-text-2)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function getPasswordError(val: string, t: Strings): string {
  if (!val) return t.adminPasswordRequired;
  if (val.length < 6) return t.adminPasswordTooShort;
  return "";
}

export function AdminUserForm({ initial }: { initial?: ApiUser }) {
  const router = useRouter();
  const isDark = useDarkMode();
  const accent = isDark ? ADMIN_ACCENT_DARK : ADMIN_ACCENT_LIGHT;
  const t = useStrings();

  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [passwordError, setPasswordError] = useState("");
  const [role, setRole] = useState(initial?.role ?? "user");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [age, setAge] = useState(initial?.age ? String(initial.age) : "");
  const [weight, setWeight] = useState(initial?.weight ? String(initial.weight) : "");
  const [calorieTarget, setCalorieTarget] = useState(
    initial?.calorie_target ? String(initial.calorie_target) : "",
  );
  const [proteinTarget, setProteinTarget] = useState(
    initial?.protein_target ? String(initial.protein_target) : "",
  );
  const [primaryGoal, setPrimaryGoal] = useState(initial?.primary_goal ?? "");
  const [restrictions, setRestrictions] = useState<Set<string>>(
    new Set(initial?.dietary_restrictions ?? []),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleRestriction(label: string) {
    setRestrictions((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  function toNumberOrNull(v: string): number | null {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) && v.trim() !== "" ? n : null;
  }

  async function handleSave() {
    if (saving) return;
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    if (!trimmedUsername || !trimmedEmail) {
      setError(t.adminUsernameEmailRequired);
      return;
    }
    if (!initial) {
      const pwErr = getPasswordError(password, t);
      setPasswordError(pwErr);
      if (pwErr) {
        setError(pwErr);
        return;
      }
    }

    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      if (initial) {
        const payload: AdminUserUpdate = {
          full_name: fullName.trim() || null,
          username: trimmedUsername,
          email: trimmedEmail,
          role,
          is_active: isActive,
          age: toNumberOrNull(age),
          weight: toNumberOrNull(weight),
          calorie_target: toNumberOrNull(calorieTarget),
          protein_target: toNumberOrNull(proteinTarget),
          primary_goal: primaryGoal.trim() || null,
          dietary_restrictions: [...restrictions],
        };
        const updated = await updateAdminUser(initial.id, payload);
        router.push(`/admin/users/${updated.id}`);
      } else {
        const payload: AdminUserCreate = {
          email: trimmedEmail,
          username: trimmedUsername,
          password,
          full_name: fullName.trim() || null,
          role,
          is_active: isActive,
          age: toNumberOrNull(age),
          weight: toNumberOrNull(weight),
          calorie_target: toNumberOrNull(calorieTarget),
          protein_target: toNumberOrNull(proteinTarget),
          dietary_restrictions: [...restrictions],
          primary_goal: primaryGoal.trim() || null,
          language: "en",
          notify_recommendations: true,
          notify_new_features: true,
          notify_weekly_summary: true,
        };
        const created = await createAdminUser(payload);
        setSuccess(t.adminUserCreatedSuccess(created.username));
        setFullName("");
        setUsername("");
        setEmail("");
        setPassword(DEFAULT_PASSWORD);
        setPasswordError("");
        setRole("user");
        setIsActive(true);
        setAge("");
        setWeight("");
        setCalorieTarget("");
        setProteinTarget("");
        setPrimaryGoal("");
        setRestrictions(new Set());
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : t.adminFailedSaveUser,
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full text-sm bg-transparent focus:outline-none py-1";
  const inputStyle = { color: "var(--tm-text)" } as const;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs font-semibold mb-3"
        style={{ color: "var(--tm-text-2)" }}
      >
        <ArrowLeft size={14} /> {t.back}
      </button>

      <div className="space-y-2.5">
        <FieldCard label={t.adminFullNameFieldLabel}>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            className={inputClass}
            style={inputStyle}
          />
        </FieldCard>

        <div className="grid grid-cols-2 gap-2.5">
          <FieldCard label={t.adminUsernameFieldLabel}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="janedoe"
              className={inputClass}
              style={inputStyle}
            />
          </FieldCard>
          <FieldCard label={t.adminEmailFieldLabel}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className={inputClass}
              style={inputStyle}
            />
          </FieldCard>
        </div>

        {!initial && (
          <FieldCard label={t.adminPasswordFieldLabel}>
            <input
              type="text"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(getPasswordError(e.target.value, t));
              }}
              onBlur={() => setPasswordError(getPasswordError(password, t))}
              placeholder={t.adminPasswordHint}
              className={inputClass}
              style={inputStyle}
            />
            {passwordError && (
              <p className="text-[11px] mt-1" style={{ color: "#d03b3b" }}>
                {passwordError}
              </p>
            )}
          </FieldCard>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <FieldCard label={t.adminRoleFieldLabel}>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={inputClass}
              style={inputStyle}
            >
              <option value="user">{t.userRoleLabel}</option>
              <option value="admin">{t.adminRoleLabel}</option>
            </select>
          </FieldCard>
          <FieldCard label={t.adminStatusFieldLabel}>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold py-1"
              style={{ color: isActive ? "#10B981" : "#F43F5E" }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isActive ? "#10B981" : "#F43F5E" }} />
              {isActive ? t.active : t.inactive}
            </button>
          </FieldCard>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <FieldCard label={t.adminAgeFieldLabel}>
            <input
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 28"
              className={inputClass}
              style={inputStyle}
            />
          </FieldCard>
          <FieldCard label={t.adminWeightFieldLabel}>
            <input
              value={weight}
              onChange={(e) => setWeight(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="e.g. 65"
              className={inputClass}
              style={inputStyle}
            />
          </FieldCard>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <FieldCard label={t.adminCalorieTargetFieldLabel}>
            <input
              value={calorieTarget}
              onChange={(e) => setCalorieTarget(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 2000"
              className={inputClass}
              style={inputStyle}
            />
          </FieldCard>
          <FieldCard label={t.adminProteinTargetFieldLabel}>
            <input
              value={proteinTarget}
              onChange={(e) => setProteinTarget(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 120"
              className={inputClass}
              style={inputStyle}
            />
          </FieldCard>
        </div>

        <FieldCard label={t.adminPrimaryGoalFieldLabel}>
          <input
            value={primaryGoal}
            onChange={(e) => setPrimaryGoal(e.target.value)}
            placeholder={t.adminPrimaryGoalHint}
            className={inputClass}
            style={inputStyle}
          />
        </FieldCard>

        <FieldCard label={t.adminDietaryRestrictionsFieldLabel}>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {AVAILABLE_LABELS.map((label) => {
              const selected = restrictions.has(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleRestriction(label)}
                  className="text-[10.5px] px-2.5 py-1 rounded-full border transition-colors"
                  style={{
                    backgroundColor: selected ? accent : "var(--tm-subtle)",
                    color: selected ? "white" : "var(--tm-text-2)",
                    borderColor: selected ? accent : "var(--tm-border-i)",
                  }}
                >
                  {t.dietaryTagDisplay(label)}
                </button>
              );
            })}
          </div>
        </FieldCard>

        {success && (
          <p className="text-xs font-medium" style={{ color: "#10B981" }}>
            {success}
          </p>
        )}

        {error && (
          <p className="text-xs font-medium" style={{ color: "#d03b3b" }}>
            {error}
          </p>
        )}

        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 h-11 rounded-xl text-sm font-bold border-2"
            style={{ backgroundColor: "var(--tm-surface)", color: "var(--tm-text)", borderColor: "var(--tm-border-i)" }}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex-1 h-11 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: accent }}
          >
            {saving ? t.saving : initial ? t.adminSaveUserChanges : t.adminAddUserCta}
          </button>
        </div>
      </div>
    </div>
  );
}
