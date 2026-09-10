"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  IdCard,
  ShieldCheck,
  UserRound,
  Flame,
  Leaf,
  User as UserIcon,
  Mail,
  AtSign,
  Lock,
  Cake,
  Weight,
  Dumbbell,
  Wheat,
  Droplet,
  CheckCircle2,
  X,
} from "lucide-react";
import { ADMIN_ACCENT_LIGHT, ADMIN_ACCENT_DARK } from "@/lib/admin";
import { GENDER_OPTIONS } from "@/components/profile-editor";
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
import LoadingOverlay from "@/components/loading-overlay";

const DEFAULT_PASSWORD = "123456";

const ADMIN_GOALS = [
  "Lose Weight",
  "Build Muscle",
  "Balanced Nutrition",
  "Improve Health",
  "Maintain Weight",
];

const ADMIN_DIETARY_OPTIONS = [
  "Vegan",
  "Vegetarian",
  "Gluten Free",
  "High Protein",
  "Keto",
  "Pescetarian",
  "Healthy",
  "Breakfast",
];

function getPasswordError(val: string, t: Strings): string {
  if (!val) return t.adminPasswordRequired;
  if (val.length < 6) return t.adminPasswordTooShort;
  return "";
}

function FormSection({
  title,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-3.5"
      style={{
        backgroundColor: "var(--tm-surface)",
        border: "1px solid var(--tm-border-i)",
      }}
    >
      <div className="flex items-center gap-2 mb-3.5">
        <div
          className="rounded-lg flex items-center justify-center shrink-0"
          style={{ width: 26, height: 26, backgroundColor: `${accent}1F` }}
        >
          <Icon size={14} color={accent} />
        </div>
        <span className="text-[13px] font-bold" style={{ color: "var(--tm-text)" }}>
          {title}
        </span>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function FieldInput({
  label,
  icon: Icon,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  error,
  suffix,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
  error?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div>
      <div
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
        style={{ backgroundColor: "var(--tm-subtle)" }}
      >
        <Icon size={16} color="var(--tm-text-2)" />
        <div className="min-w-0 flex-1">
          <label className="block text-[10.5px] font-semibold" style={{ color: "var(--tm-text-2)" }}>
            {label}
          </label>
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            className="w-full text-sm bg-transparent focus:outline-none"
            style={{ color: "var(--tm-text)" }}
          />
        </div>
        {suffix}
      </div>
      {error && (
        <p className="text-[11px] mt-1 pl-1" style={{ color: "#F43F5E" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function SegmentedButtons({
  options,
  selected,
  onSelect,
  accent,
  deselectable = false,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  accent: string;
  deselectable?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {options.map((option) => {
        const sel = selected === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(sel && deselectable ? "" : option.value)}
            className="flex-1 text-xs font-semibold py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: sel ? accent : "var(--tm-subtle)",
              color: sel ? "white" : "var(--tm-text-2)",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ChipPicker({
  options,
  isSelected,
  onToggle,
  accent,
  display,
}: {
  options: string[];
  isSelected: (value: string) => boolean;
  onToggle: (value: string) => void;
  accent: string;
  display: (value: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((value) => {
        const sel = isSelected(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className="text-[11.5px] font-semibold px-3 py-1.5 rounded-lg border transition-colors"
            style={{
              backgroundColor: sel ? accent : "var(--tm-subtle)",
              color: sel ? "white" : "var(--tm-text-2)",
              borderColor: "transparent",
            }}
          >
            {display(value)}
          </button>
        );
      })}
    </div>
  );
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
  const [gender, setGender] = useState(initial?.gender ?? "");
  const [calorieTarget, setCalorieTarget] = useState(
    initial?.calorie_target ? String(initial.calorie_target) : "",
  );
  const [proteinTarget, setProteinTarget] = useState(
    initial?.protein_target ? String(initial.protein_target) : "",
  );
  const [carbTarget, setCarbTarget] = useState(
    initial?.carb_target ? String(initial.carb_target) : "",
  );
  const [fatTarget, setFatTarget] = useState(
    initial?.fat_target ? String(initial.fat_target) : "",
  );
  const [primaryGoal, setPrimaryGoal] = useState<string | null>(initial?.primary_goal ?? null);
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
          gender: gender || null,
          calorie_target: toNumberOrNull(calorieTarget),
          protein_target: toNumberOrNull(proteinTarget),
          carb_target: toNumberOrNull(carbTarget),
          fat_target: toNumberOrNull(fatTarget),
          primary_goal: primaryGoal,
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
          gender: gender || null,
          calorie_target: toNumberOrNull(calorieTarget),
          protein_target: toNumberOrNull(proteinTarget),
          carb_target: toNumberOrNull(carbTarget),
          fat_target: toNumberOrNull(fatTarget),
          dietary_restrictions: [...restrictions],
          primary_goal: primaryGoal,
          language: "en",
          theme: "light",
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
        setGender("");
        setCalorieTarget("");
        setProteinTarget("");
        setCarbTarget("");
        setFatTarget("");
        setPrimaryGoal(null);
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

      <div className="space-y-3">
        <FormSection title={t.adminAccountInfoSectionTitle} icon={IdCard} accent={accent}>
          <FieldInput
            label={t.adminFullNameFieldLabel}
            icon={UserIcon}
            value={fullName}
            onChange={setFullName}
            placeholder="Jane Doe"
          />
          <FieldInput
            label={t.adminEmailFieldLabel}
            icon={Mail}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="jane@example.com"
          />
          <FieldInput
            label={t.adminUsernameFieldLabel}
            icon={AtSign}
            value={username}
            onChange={setUsername}
            placeholder="janedoe"
          />
          {!initial && (
            <FieldInput
              label={t.adminPasswordFieldLabel}
              icon={Lock}
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (passwordError) setPasswordError(getPasswordError(v, t));
              }}
              onBlur={() => setPasswordError(getPasswordError(password, t))}
              placeholder={t.adminPasswordHint}
              error={passwordError}
            />
          )}
        </FormSection>

        <FormSection title={t.adminRoleStatusSectionTitle} icon={ShieldCheck} accent={accent}>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs mb-1.5" style={{ color: "var(--tm-text-2)" }}>
                {t.adminRoleFieldLabel}
              </label>
              <SegmentedButtons
                options={[
                  { value: "user", label: t.userRoleLabel },
                  { value: "admin", label: t.adminRoleLabel },
                ]}
                selected={role}
                onSelect={(v) => v && setRole(v)}
                accent={accent}
              />
            </div>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className="flex flex-col items-end gap-1.5 shrink-0"
            >
              <span className="text-xs" style={{ color: "var(--tm-text-2)" }}>
                {t.adminStatusFieldLabel}
              </span>
              <span
                className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: isActive ? "#10B981" : "#F43F5E" }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isActive ? "#10B981" : "#F43F5E" }}
                />
                {isActive ? t.active : t.inactive}
              </span>
            </button>
          </div>
        </FormSection>

        <FormSection title={t.adminGenderFieldLabel} icon={UserRound} accent={accent}>
          <p className="text-xs -mt-1.5" style={{ color: "var(--tm-text-2)" }}>
            {t.adminOptionalLabel}
          </p>
          <SegmentedButtons
            options={GENDER_OPTIONS.map((option) => ({
              value: option,
              label: t.genderDisplay(option),
            }))}
            selected={gender}
            onSelect={setGender}
            accent={accent}
            deselectable
          />
        </FormSection>

        <FormSection title={t.adminNutritionGoalsCardTitle} icon={Flame} accent={accent}>
          <div className="grid grid-cols-2 gap-2.5">
            <FieldInput
              label={t.adminAgeFieldLabel}
              icon={Cake}
              value={age}
              onChange={(v) => setAge(v.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 28"
            />
            <FieldInput
              label={t.adminWeightFieldLabel}
              icon={Weight}
              value={weight}
              onChange={(v) => setWeight(v.replace(/[^0-9.]/g, ""))}
              placeholder="e.g. 65"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <FieldInput
              label={t.adminCalorieTargetFieldLabel}
              icon={Flame}
              value={calorieTarget}
              onChange={(v) => setCalorieTarget(v.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 2000"
            />
            <FieldInput
              label={t.adminProteinTargetFieldLabel}
              icon={Dumbbell}
              value={proteinTarget}
              onChange={(v) => setProteinTarget(v.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 120"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <FieldInput
              label={t.adminCarbTargetFieldLabel}
              icon={Wheat}
              value={carbTarget}
              onChange={(v) => setCarbTarget(v.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 200"
            />
            <FieldInput
              label={t.adminFatTargetFieldLabel}
              icon={Droplet}
              value={fatTarget}
              onChange={(v) => setFatTarget(v.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 60"
            />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--tm-text-2)" }}>
              {t.adminPrimaryGoalFieldLabel}
            </label>
            <ChipPicker
              options={ADMIN_GOALS}
              isSelected={(v) => primaryGoal === v}
              onToggle={(v) => setPrimaryGoal(primaryGoal === v ? null : v)}
              accent={accent}
              display={t.goalDisplay}
            />
          </div>
        </FormSection>

        <FormSection title={t.adminDietaryRestrictionsCardTitle} icon={Leaf} accent={accent}>
          <ChipPicker
            options={ADMIN_DIETARY_OPTIONS}
            isSelected={(v) => restrictions.has(v)}
            onToggle={toggleRestriction}
            accent={accent}
            display={t.dietaryTagDisplay}
          />
        </FormSection>

        {success && (
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold"
            style={{ backgroundColor: "#10B98119", color: "#10B981" }}
          >
            <CheckCircle2 size={15} className="shrink-0" />
            <span className="flex-1">{success}</span>
            <button type="button" onClick={() => setSuccess(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {error && (
          <p className="text-xs font-medium" style={{ color: "#F43F5E" }}>
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
      {saving && <LoadingOverlay />}
    </div>
  );
}
