"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AVAILABLE_LABELS,
  saveAdminUser,
  ADMIN_ACCENT_LIGHT,
  ADMIN_ACCENT_DARK,
  type AdminUser,
} from "@/lib/admin";
import { useDarkMode } from "@/lib/use-dark-mode";

function FieldCard({
  label,
  children,
}: {
  label: string;
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
      <label
        className="block text-[11px] font-bold mb-1.5"
        style={{ color: "var(--tm-text-2)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function AdminUserForm({ initial }: { initial?: AdminUser }) {
  const router = useRouter();
  const isDark = useDarkMode();
  const accent = isDark ? ADMIN_ACCENT_DARK : ADMIN_ACCENT_LIGHT;

  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [role, setRole] = useState<AdminUser["role"]>(initial?.role ?? "user");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [age, setAge] = useState(initial?.age ? String(initial.age) : "");
  const [weight, setWeight] = useState(
    initial?.weight ? String(initial.weight) : "",
  );
  const [calorieTarget, setCalorieTarget] = useState(
    initial?.calorieTarget ? String(initial.calorieTarget) : "",
  );
  const [proteinTarget, setProteinTarget] = useState(
    initial?.proteinTarget ? String(initial.proteinTarget) : "",
  );
  const [primaryGoal, setPrimaryGoal] = useState(initial?.primaryGoal ?? "");
  const [restrictions, setRestrictions] = useState<Set<string>>(
    new Set(initial?.dietaryRestrictions ?? []),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleRestriction(label: string) {
    setRestrictions((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  function toNumber(v: string): number | undefined {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) && v.trim() !== "" ? n : undefined;
  }

  async function handleSave() {
    if (saving) return;
    const trimmedName = fullName.trim();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedUsername || !trimmedEmail) {
      setError("Please fill in name, username, and email.");
      return;
    }
    setError(null);
    setSaving(true);
    saveAdminUser({
      id: initial?.id,
      fullName: trimmedName,
      username: trimmedUsername,
      email: trimmedEmail,
      role,
      isActive,
      age: toNumber(age),
      weight: toNumber(weight),
      calorieTarget: toNumber(calorieTarget),
      proteinTarget: toNumber(proteinTarget),
      primaryGoal: primaryGoal.trim() || undefined,
      dietaryRestrictions: [...restrictions],
    });
    router.push(initial ? `/admin/users/${initial.id}` : "/admin/users");
  }

  const inputClass = "w-full text-sm bg-transparent focus:outline-none py-1";
  const inputStyle = { color: "var(--tm-text)" } as const;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="space-y-2.5">
        <FieldCard label="Full name">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            className={inputClass}
            style={inputStyle}
          />
        </FieldCard>

        <div className="grid grid-cols-2 gap-2.5">
          <FieldCard label="Username">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="janedoe"
              className={inputClass}
              style={inputStyle}
            />
          </FieldCard>
          <FieldCard label="Email">
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

        <div className="grid grid-cols-2 gap-2.5">
          <FieldCard label="Role">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminUser["role"])}
              className={inputClass}
              style={inputStyle}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </FieldCard>
          <FieldCard label="Status">
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold py-1"
              style={{ color: isActive ? "#10B981" : "#F43F5E" }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: isActive ? "#10B981" : "#F43F5E" }}
              />
              {isActive ? "Active" : "Inactive"}
            </button>
          </FieldCard>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <FieldCard label="Age">
            <input
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="—"
              className={inputClass}
              style={inputStyle}
            />
          </FieldCard>
          <FieldCard label="Weight (kg)">
            <input
              value={weight}
              onChange={(e) =>
                setWeight(e.target.value.replace(/[^0-9.]/g, ""))
              }
              placeholder="—"
              className={inputClass}
              style={inputStyle}
            />
          </FieldCard>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <FieldCard label="Calorie target (cal/day)">
            <input
              value={calorieTarget}
              onChange={(e) =>
                setCalorieTarget(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="—"
              className={inputClass}
              style={inputStyle}
            />
          </FieldCard>
          <FieldCard label="Protein target (g/day)">
            <input
              value={proteinTarget}
              onChange={(e) =>
                setProteinTarget(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="—"
              className={inputClass}
              style={inputStyle}
            />
          </FieldCard>
        </div>

        <FieldCard label="Primary goal">
          <input
            value={primaryGoal}
            onChange={(e) => setPrimaryGoal(e.target.value)}
            placeholder="e.g. Build Muscle"
            className={inputClass}
            style={inputStyle}
          />
        </FieldCard>

        <FieldCard label="Dietary restrictions">
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
                  {label}
                </button>
              );
            })}
          </div>
        </FieldCard>

        {error && (
          <p className="text-xs font-medium" style={{ color: "#d03b3b" }}>
            {error}
          </p>
        )}

        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 h-11 rounded-xl text-sm font-semibold"
            style={{
              backgroundColor: "var(--tm-subtle)",
              color: "var(--tm-text)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-11 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: accent }}
          >
            {initial ? "Save Changes" : "Add User"}
          </button>
        </div>
      </div>
    </div>
  );
}
