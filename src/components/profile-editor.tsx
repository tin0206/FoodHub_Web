"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Target, Bell, Palette, LogOut, KeyRound, UserRound } from "lucide-react";
import { logout, updateCachedUser } from "@/lib/auth";
import { apiGetMe, apiUpdateMe, apiChangePassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api-client";
import type { ApiUser, UserProfileUpdate } from "@/lib/api/types";
import { applyTheme } from "@/lib/theme";
import { useDarkMode } from "@/lib/use-dark-mode";
import { setLang, type Lang } from "@/lib/i18n";
import { useStrings } from "@/lib/use-strings";
import LoadingOverlay from "@/components/loading-overlay";
import { FlagIcon } from "@/components/flag-icon";

interface ProfileForm {
  fullName: string;
  age: string;
  weight: string;
  primaryGoal: string;
  calorieTarget: string;
  proteinTarget: string;
  dietaryRestrictions: string[];
  language: string;
  theme: string;
  notifyRecommendations: boolean;
  notifyNewFeatures: boolean;
  notifyWeeklySummary: boolean;
}

interface FieldErrors {
  age: string;
  weight: string;
  calorieTarget: string;
  proteinTarget: string;
}

const PRIMARY_GOALS = ["Balanced Nutrition", "Weight Loss", "Muscle Gain", "High Protein"];
const DIETARY_TAGS = ["Dairy Free", "Egg Free", "Gluten Free", "Nut Free", "Vegan", "Vegetarian", "Pescetarian"];
const NO_ERRORS: FieldErrors = { age: "", weight: "", calorieTarget: "", proteinTarget: "" };

function isPositiveNumber(v: string) {
  if (!v.trim()) return true; // optional
  const n = Number(v);
  return !isNaN(n) && n > 0;
}

function toForm(user: ApiUser): ProfileForm {
  return {
    fullName: user.full_name ?? "",
    age: user.age != null ? String(user.age) : "",
    weight: user.weight != null ? String(user.weight) : "",
    primaryGoal: user.primary_goal ?? "",
    calorieTarget: user.calorie_target != null ? String(user.calorie_target) : "",
    proteinTarget: user.protein_target != null ? String(user.protein_target) : "",
    dietaryRestrictions: user.dietary_restrictions ?? [],
    language: user.language || "en",
    theme: user.theme === "dark" ? "dark" : "light",
    notifyRecommendations: user.notify_recommendations ?? true,
    notifyNewFeatures: user.notify_new_features ?? true,
    notifyWeeklySummary: user.notify_weekly_summary ?? true,
  };
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof Error) return err.message;
  return fallback;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative w-10 h-6 rounded-full transition-colors shrink-0"
      style={{ backgroundColor: checked ? "#059669" : "var(--tm-border-i)" }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
  );
}

function SectionCard({
  children, icon, iconBg, title, subtitle,
}: {
  children: ReactNode; icon: ReactNode; iconBg: string; title: string; subtitle: string;
}) {
  return (
    <div className="border rounded-xl p-5 mb-4" style={{ backgroundColor: "var(--tm-surface)", borderColor: "var(--tm-border)" }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--tm-text)" }}>{title}</p>
          <p className="text-xs" style={{ color: "var(--tm-text-3)" }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent";

function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const t = useStrings();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!current || !next) {
      setError(t.fillAllFields);
      return;
    }
    if (next.length < 6) {
      setError(t.mustBeAtLeast6);
      return;
    }
    if (next !== confirm) {
      setError(t.passwordsDoNotMatch);
      return;
    }
    setError("");
    setSaving(true);
    try {
      await apiChangePassword({ current_password: current, new_password: next });
      setDone(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(errorMessage(err, t.unableToUpdatePassword));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl p-5"
        style={{ backgroundColor: "var(--tm-surface)" }}
      >
        <p className="text-base font-extrabold mb-4" style={{ color: "var(--tm-text)" }}>{t.changePasswordTitle}</p>
        {done ? (
          <p className="text-sm" style={{ color: "#059669" }}>{t.passwordUpdated}</p>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--tm-text-2)" }}>{t.currentPassword}</label>
                <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} style={{ borderColor: "var(--tm-border-i)", color: "var(--tm-text)", backgroundColor: "var(--tm-bg)" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--tm-text-2)" }}>{t.newPassword}</label>
                <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} style={{ borderColor: "var(--tm-border-i)", color: "var(--tm-text)", backgroundColor: "var(--tm-bg)" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--tm-text-2)" }}>{t.confirmNewPassword}</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} style={{ borderColor: "var(--tm-border-i)", color: "var(--tm-text)", backgroundColor: "var(--tm-bg)" }} />
              </div>
            </div>
            {error && <p className="mt-3 text-xs" style={{ color: "#f87171" }}>{error}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ color: "var(--tm-text-2)" }}>
                {t.cancel}
              </button>
              <button type="button" onClick={submit} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: "#059669" }}>
                {saving ? "…" : t.changePasswordTitle}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ProfileEditor() {
  const dark = useDarkMode();
  const router = useRouter();
  const t = useStrings();

  const [user, setUser] = useState<ApiUser | null | undefined>(undefined);
  const [loadError, setLoadError] = useState("");
  const [savedData, setSavedData] = useState<ProfileForm | null>(null);
  const [formData, setFormData] = useState<ProfileForm | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(NO_ERRORS);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [actionButtonsVisible, setActionButtonsVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomActionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetMe()
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        const form = toForm(u);
        setSavedData(form);
        setFormData(form);
        // Backend is the source of truth for the saved preference — sync the live app language to it.
        setLang(u.language === "vi" ? "vi" : "en");
        applyTheme(u.theme === "dark");
      })
      .catch((err) => {
        if (cancelled) return;
        setUser(null);
        setLoadError(errorMessage(err, t.unableToSaveProfile));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirrors the mobile app's scroll-tracking: the floating Cancel/Save bar only
  // shows while the real fixed Cancel/Save row is scrolled out of view.
  useEffect(() => {
    const root = scrollRef.current;
    const target = bottomActionsRef.current;
    if (!root || !target || !user) return;
    const observer = new IntersectionObserver(
      ([entry]) => setActionButtonsVisible(entry.isIntersecting),
      { root, threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [user]);

  function set<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setFormData((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function clearError(field: keyof FieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function toggleDietary(tag: string) {
    setFormData((prev) => {
      if (!prev) return prev;
      const has = prev.dietaryRestrictions.includes(tag);
      return {
        ...prev,
        dietaryRestrictions: has
          ? prev.dietaryRestrictions.filter((d) => d !== tag)
          : [...prev.dietaryRestrictions, tag],
      };
    });
  }

  function toggleTheme() {
    const next = !dark;
    applyTheme(next);
    set("theme", next ? "dark" : "light");
  }

  function selectLanguage(code: Lang) {
    set("language", code);
    setLang(code); // switch the live UI immediately, independent of Save
  }

  async function handleSave() {
    if (!formData) return;
    const errors: FieldErrors = {
      age: !isPositiveNumber(formData.age) ? t.mustBePositiveNumber : "",
      weight: !isPositiveNumber(formData.weight) ? t.mustBePositiveNumber : "",
      calorieTarget: !isPositiveNumber(formData.calorieTarget) ? t.mustBePositiveNumber : "",
      proteinTarget: !isPositiveNumber(formData.proteinTarget) ? t.mustBePositiveNumber : "",
    };
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setSaving(true);
    setSaveError("");
    try {
      const payload: UserProfileUpdate = {
        full_name: formData.fullName.trim() || null,
        age: formData.age.trim() ? Number(formData.age) : null,
        weight: formData.weight.trim() ? Number(formData.weight) : null,
        calorie_target: formData.calorieTarget.trim() ? Number(formData.calorieTarget) : null,
        protein_target: formData.proteinTarget.trim() ? Number(formData.proteinTarget) : null,
        dietary_restrictions: formData.dietaryRestrictions,
        primary_goal: formData.primaryGoal || null,
        language: formData.language,
        theme: formData.theme,
        notify_recommendations: formData.notifyRecommendations,
        notify_new_features: formData.notifyNewFeatures,
        notify_weekly_summary: formData.notifyWeeklySummary,
      };
      const updated = await apiUpdateMe(payload);
      setUser(updated);
      const form = toForm(updated);
      setSavedData(form);
      setFormData(form);
      updateCachedUser(updated);
      applyTheme(updated.theme === "dark");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
    } catch (err) {
      setSaveError(errorMessage(err, t.unableToSaveProfile));
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (savedData) {
      setFormData(savedData);
      setLang(savedData.language === "vi" ? "vi" : "en");
      applyTheme(savedData.theme === "dark");
    }
    setFieldErrors(NO_ERRORS);
    setSaveError("");
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: "var(--tm-text-2)" }}>Loading profile…</p>
      </div>
    );
  }

  if (!user || !formData) {
    return (
      <div className="p-4">
        <p className="text-sm" style={{ color: "#DC2626" }}>{loadError || t.unableToSaveProfile}</p>
      </div>
    );
  }

  const isDirty = JSON.stringify(formData) !== JSON.stringify(savedData);
  const inputStyle = { borderColor: "var(--tm-border-i)", color: "var(--tm-text)", backgroundColor: "var(--tm-surface)" };
  const labelStyle = { color: "var(--tm-text-2)" };
  const errStyle = { color: "#f87171" };

  const showFloatingActions = isDirty && !actionButtonsVisible;

  return (
    <>
      {saving && <LoadingOverlay />}
      <div ref={scrollRef} className="relative h-full overflow-y-auto" style={{ backgroundColor: "var(--tm-bg)" }}>
        <div className="p-4 md:p-6 pb-6 max-w-2xl mx-auto">
          {/* Avatar card */}
          <div
            className="w-full flex flex-col items-center rounded-2xl py-6 mb-4 border"
            style={{ backgroundColor: "var(--tm-surface)", borderColor: "var(--tm-border)" }}
          >
            <div
              className="w-17 h-17 rounded-full flex items-center justify-center"
              style={{ width: 68, height: 68, background: "linear-gradient(135deg, #059669, #047857)", boxShadow: "0 4px 14px rgba(5,150,105,0.35)" }}
            >
              <UserRound size={32} color="white" />
            </div>
            <p className="text-base font-bold mt-2.5" style={{ color: "var(--tm-text)" }}>
              {formData.fullName || t.yourProfile}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--tm-text-3)" }}>{user.email}</p>
          </div>

          {saveError && (
            <div className="rounded-xl px-3.5 py-2.5 mb-4 text-xs" style={{ backgroundColor: "#F43F5E14", color: "#F43F5E" }}>
              {saveError}
            </div>
          )}

          {/* Appearance */}
          <SectionCard icon={<Palette size={18} color="#7C3AED" />} iconBg="#EDE9FE" title={t.appearance} subtitle={t.settingsPreferences}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm" style={{ color: "var(--tm-text-2)" }}>{t.themeLabel}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--tm-text-3)" }}>
                  {dark ? t.darkMode : t.lightMode}
                </p>
              </div>
              <Toggle checked={dark} onChange={toggleTheme} />
            </div>
            <div className="pt-3" style={{ borderTop: "1px solid var(--tm-border)" }}>
              <p className="text-sm mb-2" style={{ color: "var(--tm-text-2)" }}>{t.languageLabel}</p>
              <div className="flex gap-2">
                {([["vi", "vn", t.langVietnamese], ["en", "us", t.langEnglish]] as const).map(([code, country, label]) => {
                  const active = formData.language === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => selectLanguage(code)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm transition-colors"
                      style={{
                        backgroundColor: active ? "#ECFDF5" : "var(--tm-surface)",
                        borderColor: active ? "#059669" : "var(--tm-border)",
                        color: active ? "#059669" : "var(--tm-text-2)",
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      <FlagIcon country={country} size={18} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </SectionCard>

          {/* Personal Information */}
          <SectionCard icon={<User size={18} color="#059669" />} iconBg="#ECFDF5" title={t.personalInformation} subtitle={t.updateProfileDetails}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>{t.fullNameLabel}</label>
                <input value={formData.fullName} onChange={(e) => set("fullName", e.target.value)} className={inputCls} style={inputStyle} placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>{t.emailLabel}</label>
                <input value={user.email} readOnly className={inputCls} style={{ ...inputStyle, backgroundColor: "var(--tm-subtle)", color: "var(--tm-text-3)" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>{t.ageLabel}</label>
                <input
                  type="text"
                  value={formData.age}
                  onChange={(e) => { set("age", e.target.value); clearError("age"); }}
                  className={inputCls}
                  style={{ ...inputStyle, borderColor: fieldErrors.age ? "#f87171" : "var(--tm-border-i)" }}
                  placeholder="28"
                />
                {fieldErrors.age && <p className="mt-1 text-xs" style={errStyle}>{fieldErrors.age}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>{t.weightLabel}</label>
                <input
                  type="text"
                  value={formData.weight}
                  onChange={(e) => { set("weight", e.target.value); clearError("weight"); }}
                  className={inputCls}
                  style={{ ...inputStyle, borderColor: fieldErrors.weight ? "#f87171" : "var(--tm-border-i)" }}
                  placeholder="75"
                />
                {fieldErrors.weight && <p className="mt-1 text-xs" style={errStyle}>{fieldErrors.weight}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowChangePassword(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border"
              style={{ borderColor: "var(--tm-border-i)", color: "var(--tm-text-2)", backgroundColor: "var(--tm-subtle)" }}
            >
              <KeyRound size={13} /> {t.changePasswordLabel}
            </button>
          </SectionCard>

          {/* Nutrition Goals */}
          <SectionCard icon={<Target size={18} color="#7C3AED" />} iconBg="#EDE9FE" title={t.nutritionGoals} subtitle={t.setDietaryObjectives}>
            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={labelStyle}>{t.primaryGoalLabel}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRIMARY_GOALS.map((goal) => {
                  const active = formData.primaryGoal === goal;
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => set("primaryGoal", goal)}
                      className="py-2.5 px-3 rounded-lg border text-sm text-left transition-colors"
                      style={{
                        backgroundColor: active ? "#ECFDF5" : "var(--tm-surface)",
                        borderColor: active ? "#059669" : "var(--tm-border)",
                        color: active ? "#059669" : "var(--tm-text-2)",
                        fontWeight: active ? 500 : 400,
                      }}
                    >
                      {t.goalDisplay(goal)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>{t.dailyCalorieTarget}</label>
                <input
                  type="text"
                  value={formData.calorieTarget}
                  onChange={(e) => { set("calorieTarget", e.target.value); clearError("calorieTarget"); }}
                  className={inputCls}
                  style={{ ...inputStyle, borderColor: fieldErrors.calorieTarget ? "#f87171" : "var(--tm-border-i)" }}
                  placeholder="2000"
                />
                {fieldErrors.calorieTarget && <p className="mt-1 text-xs" style={errStyle}>{fieldErrors.calorieTarget}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={labelStyle}>{t.targetProtein}</label>
                <input
                  type="text"
                  value={formData.proteinTarget}
                  onChange={(e) => { set("proteinTarget", e.target.value); clearError("proteinTarget"); }}
                  className={inputCls}
                  style={{ ...inputStyle, borderColor: fieldErrors.proteinTarget ? "#f87171" : "var(--tm-border-i)" }}
                  placeholder="120"
                />
                {fieldErrors.proteinTarget && <p className="mt-1 text-xs" style={errStyle}>{fieldErrors.proteinTarget}</p>}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium mb-2" style={labelStyle}>{t.dietaryRestrictionsLabel}</p>
              <div className="flex flex-wrap gap-2">
                {DIETARY_TAGS.map((tag) => {
                  const active = formData.dietaryRestrictions.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleDietary(tag)}
                      className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                      style={{
                        backgroundColor: active ? "#ECFDF5" : "var(--tm-surface)",
                        borderColor: active ? "#059669" : "var(--tm-border)",
                        color: active ? "#059669" : "var(--tm-text-2)",
                      }}
                    >
                      {t.dietaryTagDisplay(tag)}
                    </button>
                  );
                })}
              </div>
            </div>
          </SectionCard>

          {/* Notifications */}
          <SectionCard icon={<Bell size={18} color="#2563EB" />} iconBg="#DBEAFE" title={t.notifications} subtitle={t.manageNotificationPrefs}>
            <div className="space-y-4">
              {(
                [
                  ["notifyRecommendations", t.notifyRecipeRecommendations],
                  ["notifyNewFeatures", t.notifyFeaturesUpdates],
                  ["notifyWeeklySummary", t.notifyWeeklyNutritionSummary],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <p className="text-sm" style={{ color: "var(--tm-text-2)" }}>{label}</p>
                  <Toggle checked={formData[key]} onChange={(v) => set(key, v)} />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Cancel + Save changes */}
          <div ref={bottomActionsRef} className="flex gap-2 mt-3 mb-2">
            <button
              onClick={handleCancel}
              disabled={!isDirty}
              className="flex-1 h-11 border rounded-full text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{ borderColor: "var(--tm-border)", color: "var(--tm-text-2)", backgroundColor: "var(--tm-subtle)" }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="flex-1 h-11 rounded-full text-sm font-bold text-white transition-opacity disabled:opacity-40"
              style={{ backgroundColor: saveSuccess ? "#10B981" : "#059669" }}
            >
              {saveSuccess ? t.saved + "!" : t.saveChanges}
            </button>
          </div>

          {/* Log out */}
          <button
            onClick={handleLogout}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-full border text-sm font-bold transition-colors"
            style={{ backgroundColor: "#FFF1F2", borderColor: "#FCA5A5", color: "#DC2626" }}
          >
            <LogOut size={16} />
            {t.logOut}
          </button>
        </div>

        {/* Floating Cancel/Save bar — mirrors the mobile app's scroll-aware action bar,
            shown only while unsaved changes exist and the fixed bottom row is off-screen. */}
        <div
          className="absolute inset-x-0 bottom-20 md:bottom-6 flex justify-center px-4 z-40 transition-all duration-200"
          style={{
            opacity: showFloatingActions ? 1 : 0,
            transform: showFloatingActions ? "translateY(0)" : "translateY(12px)",
            pointerEvents: showFloatingActions ? "auto" : "none",
          }}
        >
          <div
            className="flex items-center gap-2.5 rounded-full px-3 py-3"
            style={{
              backgroundColor: "var(--tm-surface)",
              border: "1px solid var(--tm-border)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
            }}
          >
            <button
              onClick={handleCancel}
              className="px-6 h-12 rounded-full text-sm font-semibold"
              style={{ color: "var(--tm-text-2)" }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-7 h-12 rounded-full text-sm font-bold text-white disabled:opacity-60"
              style={{ backgroundColor: saveSuccess ? "#10B981" : "#059669" }}
            >
              {saveSuccess ? t.saved + "!" : t.saveChanges}
            </button>
          </div>
        </div>
      </div>
      {showChangePassword && <ChangePasswordDialog onClose={() => setShowChangePassword(false)} />}
    </>
  );
}
