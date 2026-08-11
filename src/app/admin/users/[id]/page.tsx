"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Shield,
  User as UserIcon,
  BookOpen,
  Heart,
  Ban,
  CheckCircle2,
  Tag,
  Cake,
  Weight,
  Flame,
  Flag,
  Hash,
  AtSign,
  Mail,
  CalendarDays,
  Utensils,
} from "lucide-react";
import { useDarkMode } from "@/lib/use-dark-mode";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  ADMIN_ACCENT_LIGHT,
  ADMIN_ACCENT_DARK,
  CATEGORICAL,
  getAdminUser,
  setAdminUserActive,
  avatarInitials,
  avatarColor,
  mockUserRecipes,
  type AdminUser,
} from "@/lib/admin";

type Tab = "profile" | "saved" | "recipes";

function InfoRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Hash;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className="flex items-center gap-2.5 py-2.5"
      style={{ borderTop: "1px solid var(--tm-border-i)" }}
    >
      <Icon size={14} color={accent} />
      <span className="text-xs flex-1" style={{ color: "var(--tm-text-2)" }}>
        {label}
      </span>
      <span
        className="text-xs font-semibold text-right"
        style={{ color: "var(--tm-text)" }}
      >
        {value}
      </span>
    </div>
  );
}

function InfoCard({
  title,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  icon: typeof Hash;
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
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-6.5 h-6.5 rounded-lg flex items-center justify-center"
          style={{ width: 26, height: 26, backgroundColor: `${accent}1A` }}
        >
          <Icon size={14} color={accent} />
        </div>
        <span
          className="text-[13px] font-bold"
          style={{ color: "var(--tm-text)" }}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function RecipeList({
  items,
  emptyLabel,
}: {
  items: ReturnType<typeof mockUserRecipes>;
  emptyLabel: string;
}) {
  const isDark = useDarkMode();
  if (items.length === 0) {
    return (
      <p
        className="text-center text-sm py-10"
        style={{ color: "var(--tm-text-2)" }}
      >
        {emptyLabel}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((r, i) => {
        const color = isDark
          ? CATEGORICAL[r.colorIndex].dark
          : CATEGORICAL[r.colorIndex].light;
        return (
          <div
            key={i}
            className="flex items-center gap-3 px-3.5 py-3 rounded-2xl"
            style={{
              backgroundColor: "var(--tm-surface)",
              border: "1px solid var(--tm-border-i)",
            }}
          >
            <div
              className="w-10.5 h-10.5 rounded-xl flex items-center justify-center shrink-0"
              style={{ width: 42, height: 42, backgroundColor: `${color}1F` }}
            >
              <Utensils size={18} color={color} />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-[13px] font-bold truncate"
                style={{ color: "var(--tm-text)" }}
              >
                {r.title}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                <span
                  className="flex items-center gap-1 text-[11px]"
                  style={{ color: "var(--tm-text-2)" }}
                >
                  <Heart size={11} /> {r.favorites}
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: "var(--tm-text-2)" }}
                >
                  {r.date}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const TABS: { key: Tab; label: (u: AdminUser) => string }[] = [
  { key: "profile", label: () => "Profile" },
  { key: "saved", label: (u) => `Saved (${u.savedCount})` },
  { key: "recipes", label: (u) => `Recipes (${u.recipeCount})` },
];

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isDark = useDarkMode();
  const accent = isDark ? ADMIN_ACCENT_DARK : ADMIN_ACCENT_LIGHT;

  const [user, setUser] = useState<AdminUser | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("profile");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const found = getAdminUser(params.id);
    if (!found) {
      router.replace("/admin/users");
      return;
    }
    setUser(found);
  }, [params.id, router]);

  if (!user) return null;

  function handleToggleActive() {
    if (!user) return;
    const next = !user.isActive;
    setAdminUserActive(user.id, next);
    setUser({ ...user, isActive: next });
    setConfirming(false);
  }

  const avatar = avatarColor(user.fullName, isDark);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => router.push("/admin/users")}
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: "var(--tm-text-2)" }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <Link
          href={`/admin/users/${user.id}/edit`}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg"
          style={{ backgroundColor: `${accent}1F`, color: accent }}
        >
          <Pencil size={13} /> Edit
        </Link>
      </div>

      {/* Profile summary */}
      <div
        className="rounded-2xl p-4 mb-4 flex items-start gap-3.5"
        style={{
          backgroundColor: "var(--tm-surface)",
          border: "1px solid var(--tm-border-i)",
        }}
      >
        <div
          className="rounded-full flex items-center justify-center font-bold text-lg shrink-0"
          style={{
            width: 54,
            height: 54,
            backgroundColor: `${avatar}26`,
            color: avatar,
          }}
        >
          {avatarInitials(user.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-[17px] font-extrabold tracking-tight truncate"
            style={{ color: "var(--tm-text)" }}
          >
            {user.fullName}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--tm-text-2)" }}>
            {user.email}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span
              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor:
                  user.role === "admin" ? `${accent}1F` : "#10B98119",
                color: user.role === "admin" ? accent : "#10B981",
              }}
            >
              {user.role === "admin" ? (
                <Shield size={11} />
              ) : (
                <UserIcon size={11} />
              )}
              {user.role === "admin" ? "Admin" : "User"}
            </span>
            <span
              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: "var(--tm-subtle)",
                color: user.isActive ? "#10B981" : "#F43F5E",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: user.isActive ? "#10B981" : "#F43F5E",
                }}
              />
              {user.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        <div
          className="flex flex-col items-end gap-1 shrink-0 text-[11px] font-semibold"
          style={{ color: "var(--tm-text-2)" }}
        >
          <span className="flex items-center gap-1">
            <BookOpen size={11} /> {user.recipeCount} recipes
          </span>
          <span className="flex items-center gap-1">
            <Heart size={11} /> {user.savedCount} saved
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-4 mb-4"
        style={{ borderBottom: "1px solid var(--tm-border-i)" }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className="text-xs font-bold pb-2.5 border-b-2 transition-colors"
            style={{
              color: tab === t.key ? accent : "var(--tm-text-2)",
              borderColor: tab === t.key ? accent : "transparent",
            }}
          >
            {t.label(user)}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="space-y-3">
          <InfoCard title="Account" icon={UserIcon} accent={accent}>
            <InfoRow
              icon={Hash}
              label="User ID"
              value={`#${user.id}`}
              accent={accent}
            />
            <InfoRow
              icon={AtSign}
              label="Username"
              value={user.username}
              accent={accent}
            />
            <InfoRow
              icon={Mail}
              label="Email"
              value={user.email}
              accent={accent}
            />
            <InfoRow
              icon={CalendarDays}
              label="Joined"
              value={user.createdAt}
              accent={accent}
            />
          </InfoCard>

          <InfoCard title="Nutrition Goals" icon={Flame} accent={accent}>
            <InfoRow
              icon={Cake}
              label="Age"
              value={user.age ? `${user.age} years` : "—"}
              accent={accent}
            />
            <InfoRow
              icon={Weight}
              label="Weight"
              value={user.weight ? `${user.weight} kg` : "—"}
              accent={accent}
            />
            <InfoRow
              icon={Flame}
              label="Calorie Target"
              value={user.calorieTarget ? `${user.calorieTarget} cal/day` : "—"}
              accent={accent}
            />
            <InfoRow
              icon={Flag}
              label="Primary Goal"
              value={user.primaryGoal ?? "—"}
              accent={accent}
            />
          </InfoCard>

          <InfoCard title="Dietary Restrictions" icon={Tag} accent={accent}>
            {user.dietaryRestrictions.length === 0 ? (
              <p className="text-xs pt-1" style={{ color: "var(--tm-text-2)" }}>
                None specified
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {user.dietaryRestrictions.map((tagName) => (
                  <span
                    key={tagName}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${accent}1A`, color: accent }}
                  >
                    {tagName}
                  </span>
                ))}
              </div>
            )}
          </InfoCard>

          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border"
            style={{
              color: user.isActive ? "#F43F5E" : "#10B981",
              borderColor: user.isActive ? "#F43F5E" : "#10B981",
            }}
          >
            {user.isActive ? <Ban size={16} /> : <CheckCircle2 size={16} />}
            {user.isActive ? "Deactivate Account" : "Activate Account"}
          </button>
        </div>
      )}

      {tab === "saved" && (
        <RecipeList
          items={mockUserRecipes(user, "saved")}
          emptyLabel="No saved recipes yet"
        />
      )}
      {tab === "recipes" && (
        <RecipeList
          items={mockUserRecipes(user, "created")}
          emptyLabel="No recipes created yet"
        />
      )}

      {confirming && (
        <ConfirmDialog
          title={`${user.isActive ? "Deactivate" : "Activate"} Account?`}
          message={
            user.isActive
              ? `${user.fullName} will lose access to the app.`
              : `${user.fullName} will regain access to the app.`
          }
          confirmLabel={user.isActive ? "Deactivate" : "Activate"}
          confirmColor={user.isActive ? "#F43F5E" : "#10B981"}
          onConfirm={handleToggleActive}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
