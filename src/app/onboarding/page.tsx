"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, Calendar, Weight, Target, Leaf } from "lucide-react";
import { getCurrentUser, updateCachedUser, isAdminRole } from "@/lib/auth";
import { apiUpdateMe } from "@/lib/api/auth";
import { ApiError } from "@/lib/api-client";
import type { UserProfileUpdate } from "@/lib/api/types";
import { getStrings } from "@/lib/strings";
import { setLang, type Lang } from "@/lib/i18n";
import { PRIMARY_GOALS, DIETARY_TAGS } from "@/components/profile-editor";
import { AuthField } from "@/components/auth/auth-widgets";
import { FlagIcon } from "@/components/flag-icon";
import { authDisplay, authSans } from "../auth-fonts";
import "../auth.css";

const TOTAL_STEPS = 3;

function isPositiveNumber(v: string): boolean {
  if (!v.trim()) return true;
  const n = Number(v);
  return !isNaN(n) && n > 0;
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function OnboardingPage() {
  const router = useRouter();
  // Independent of the app's global language setting — a brand-new user hasn't
  // chosen one yet, so this always starts in English regardless of whatever a
  // previous session left in localStorage, with its own toggle to switch it.
  const [uiLang, setUiLang] = useState<Lang>("en");
  const t = getStrings(uiLang);

  const [authChecked, setAuthChecked] = useState(false);
  const [step, setStep] = useState(1);

  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [ageError, setAgeError] = useState("");
  const [weightError, setWeightError] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    if (isAdminRole(user.role)) {
      router.replace("/admin");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  function goHome() {
    // Carry whichever language the user picked here into the rest of the app —
    // even on Skip, so they don't land in a different language than they just read.
    setLang(uiLang);
    router.replace("/home");
  }

  function validateAboutStep(): boolean {
    const ageErr = !isPositiveNumber(age) ? t.mustBePositiveNumber : "";
    const weightErr = !isPositiveNumber(weight) ? t.mustBePositiveNumber : "";
    setAgeError(ageErr);
    setWeightError(weightErr);
    return !ageErr && !weightErr;
  }

  function toggleDietary(tag: string) {
    setDietaryRestrictions((prev) =>
      prev.includes(tag) ? prev.filter((d) => d !== tag) : [...prev, tag],
    );
  }

  function handleNext() {
    if (step === 1 && !validateAboutStep()) return;
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function handleBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleFinish() {
    if (!validateAboutStep()) {
      setStep(1);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: UserProfileUpdate = {
        age: age.trim() ? Number(age) : null,
        weight: weight.trim() ? Number(weight) : null,
        primary_goal: primaryGoal || null,
        dietary_restrictions: dietaryRestrictions,
        language: uiLang,
      };
      const updated = await apiUpdateMe(payload);
      updateCachedUser(updated);
      goHome();
    } catch (err) {
      setError(errorMessage(err, t.unableToSaveProfile));
    } finally {
      setSaving(false);
    }
  }

  if (!authChecked) return null;

  return (
    <div className={`${authDisplay.variable} ${authSans.variable} auth-root`}>
      <div className="flex items-center justify-between mb-7" style={{ width: "100%", maxWidth: "34rem" }}>
        <span className="auth-brand" style={{ margin: 0 }}>
          <ChefHat size={22} color="#059669" />
          <span>FoodHub</span>
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full p-0.5" style={{ border: "1px solid var(--a-line)" }}>
            {([["en", "us"], ["vi", "vn"]] as const).map(([code, country]) => {
              const active = uiLang === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setUiLang(code)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors"
                  style={active ? { backgroundColor: "#059669", color: "#fff" } : { color: "var(--a-muted)" }}
                  aria-pressed={active}
                >
                  <FlagIcon country={country} size={14} />
                  {code.toUpperCase()}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={goHome} className="auth-link text-sm">
            {t.onboardingSkip}
          </button>
        </div>
      </div>

      <div className="auth-card" style={{ maxWidth: "34rem" }}>
        <h1 className="auth-heading">{t.onboardingWelcomeTitle}</h1>
        <p className="auth-sub">{t.onboardingWelcomeSubtitle}</p>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1.5 rounded-full transition-colors"
              style={{ backgroundColor: i < step ? "#059669" : "var(--a-line)" }}
            />
          ))}
        </div>
        <p className="text-xs font-semibold mb-5" style={{ color: "#059669" }}>
          {t.onboardingStepOf(step, TOTAL_STEPS)}
        </p>

        {error && <p className="auth-error-banner mb-3">{error}</p>}

        {step === 1 && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} color="#059669" />
              <p className="text-sm font-bold" style={{ color: "var(--a-ink)" }}>{t.onboardingStepAboutTitle}</p>
            </div>
            <p className="text-xs mb-4" style={{ color: "var(--a-muted)" }}>{t.onboardingStepAboutSubtitle}</p>
            <div className="grid grid-cols-2 gap-3">
              <AuthField
                label={t.ageLabel}
                icon={Calendar}
                type="text"
                inputMode="numeric"
                value={age}
                onChange={(e) => { setAge(e.target.value); if (ageError) setAgeError(""); }}
                placeholder="28"
                error={ageError}
              />
              <AuthField
                label={t.weightLabel}
                icon={Weight}
                type="text"
                inputMode="numeric"
                value={weight}
                onChange={(e) => { setWeight(e.target.value); if (weightError) setWeightError(""); }}
                placeholder="60"
                error={weightError}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target size={16} color="#059669" />
              <p className="text-sm font-bold" style={{ color: "var(--a-ink)" }}>{t.onboardingStepGoalTitle}</p>
            </div>
            <p className="text-xs mb-4" style={{ color: "var(--a-muted)" }}>{t.onboardingStepGoalSubtitle}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRIMARY_GOALS.map((goal) => {
                const active = primaryGoal === goal;
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setPrimaryGoal(active ? "" : goal)}
                    className="py-2.5 px-3 rounded-lg border text-sm text-left transition-colors"
                    style={{
                      backgroundColor: active ? "#ECFDF5" : "#fff",
                      borderColor: active ? "#059669" : "var(--a-line)",
                      color: active ? "#059669" : "var(--a-ink)",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {t.goalDisplay(goal)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Leaf size={16} color="#059669" />
              <p className="text-sm font-bold" style={{ color: "var(--a-ink)" }}>{t.onboardingStepDietaryTitle}</p>
            </div>
            <p className="text-xs mb-4" style={{ color: "var(--a-muted)" }}>{t.onboardingStepDietarySubtitle}</p>
            <div className="flex flex-wrap gap-2">
              {DIETARY_TAGS.map((tag) => {
                const active = dietaryRestrictions.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleDietary(tag)}
                    className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                    style={{
                      backgroundColor: active ? "#ECFDF5" : "#fff",
                      borderColor: active ? "#059669" : "var(--a-line)",
                      color: active ? "#059669" : "var(--a-ink)",
                    }}
                  >
                    {t.dietaryTagDisplay(tag)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-xs mt-5" style={{ color: "var(--a-muted)" }}>{t.onboardingChangeLaterHint}</p>

        <div className="flex gap-2 mt-5">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 h-12 rounded-full text-sm font-semibold border"
              style={{ borderColor: "var(--a-line)", color: "var(--a-muted)", background: "#fff" }}
            >
              {t.onboardingBack}
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button type="button" onClick={handleNext} className="auth-btn-primary flex-1" style={{ width: "auto" }}>
              {t.onboardingContinue}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={saving}
              className="auth-btn-primary flex-1"
              style={{ width: "auto" }}
            >
              {saving ? <span className="auth-spinner" /> : t.onboardingFinish}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
