"use client";

import { useCallback, useEffect, useState } from "react";
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
import { useLang } from "@/lib/use-lang";
import { useStrings } from "@/lib/use-strings";
import type { Strings } from "@/lib/strings";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { hasAccessToken } from "@/lib/auth";
import { ApiError, resolveMediaUrl } from "@/lib/api-client";
import {
  getAdminUser,
  updateAdminUser,
  getAdminUserRecipes,
  getAdminUserFavorites,
  type AdminUserDetail,
} from "@/lib/api/admin-users";
import type { ApiRecipe } from "@/lib/api/types";
import { ADMIN_ACCENT_LIGHT, ADMIN_ACCENT_DARK, avatarInitials, avatarColor } from "@/lib/admin";

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
    <div className="flex items-center gap-2.5 py-2.5" style={{ borderTop: "1px solid var(--tm-border-i)" }}>
      <Icon size={14} color={accent} />
      <span className="text-xs flex-1" style={{ color: "var(--tm-text-2)" }}>
        {label}
      </span>
      <span className="text-xs font-semibold text-right" style={{ color: "var(--tm-text)" }}>
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
    <div className="rounded-2xl p-3.5" style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6.5 h-6.5 rounded-lg flex items-center justify-center" style={{ width: 26, height: 26, backgroundColor: `${accent}1A` }}>
          <Icon size={14} color={accent} />
        </div>
        <span className="text-[13px] font-bold" style={{ color: "var(--tm-text)" }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function RecipeList({
  items,
  loading,
  emptyLabel,
  accent,
  t,
}: {
  items: ApiRecipe[] | null;
  loading: boolean;
  emptyLabel: string;
  accent: string;
  t: Strings;
}) {
  if (loading && items === null) {
    return (
      <p className="text-center text-sm py-10" style={{ color: "var(--tm-text-2)" }}>
        {t.loading}
      </p>
    );
  }
  if (!items || items.length === 0) {
    return (
      <p className="text-center text-sm py-10" style={{ color: "var(--tm-text-2)" }}>
        {emptyLabel}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((r) => (
        <Link
          key={r.id}
          href={`/admin/recipes/${r.id}`}
          className="flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }}
        >
          {r.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveMediaUrl(r.image_url)}
              alt=""
              className="w-10.5 h-10.5 rounded-xl object-cover shrink-0"
              style={{ width: 42, height: 42 }}
            />
          ) : (
            <div
              className="w-10.5 h-10.5 rounded-xl flex items-center justify-center shrink-0"
              style={{ width: 42, height: 42, backgroundColor: `${accent}1F` }}
            >
              <Utensils size={18} color={accent} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold truncate" style={{ color: "var(--tm-text)" }}>
              {r.title}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--tm-text-2)" }}>
              {r.visibility === "public" ? t.publicLabel : t.privateLabel}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isDark = useDarkMode();
  const accent = isDark ? ADMIN_ACCENT_DARK : ADMIN_ACCENT_LIGHT;
  const lang = useLang();
  const t = useStrings();
  const userId = Number(params.id);

  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("profile");
  const [confirming, setConfirming] = useState(false);
  const [toggling, setToggling] = useState(false);

  const [savedRecipes, setSavedRecipes] = useState<ApiRecipe[] | null>(null);
  const [savedLoading, setSavedLoading] = useState(false);
  const [createdRecipes, setCreatedRecipes] = useState<ApiRecipe[] | null>(null);
  const [createdLoading, setCreatedLoading] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(userId)) {
      router.replace("/admin/users");
      return;
    }
    if (!hasAccessToken()) {
      setError(t.adminNoTokenGeneric);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const found = await getAdminUser(userId);
      setDetail(found);
    } catch (err) {
      setDetail(null);
      if (err instanceof ApiError) {
        setError(err.status === 404 ? t.adminUserNotFound : err.message || t.adminFailedLoadUser);
      } else {
        setError(err instanceof Error ? err.message : t.adminFailedLoadUser);
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, router, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tab === "saved" && savedRecipes === null && !savedLoading && Number.isFinite(userId)) {
      setSavedLoading(true);
      getAdminUserFavorites(userId)
        .then(setSavedRecipes)
        .catch(() => setSavedRecipes([]))
        .finally(() => setSavedLoading(false));
    }
    if (tab === "recipes" && createdRecipes === null && !createdLoading && Number.isFinite(userId)) {
      setCreatedLoading(true);
      getAdminUserRecipes(userId)
        .then(setCreatedRecipes)
        .catch(() => setCreatedRecipes([]))
        .finally(() => setCreatedLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, userId]);

  async function handleToggleActive() {
    if (!detail) return;
    const next = !detail.user.is_active;
    setToggling(true);
    setConfirming(false);
    try {
      const updated = await updateAdminUser(detail.user.id, { is_active: next });
      setDetail({ ...detail, user: updated });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.adminFailedUpdateUser);
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <p className="text-sm" style={{ color: "var(--tm-text-2)" }}>
          {t.adminLoadingUser}
        </p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-3">
        {error && (
          <div className="rounded-2xl p-4 text-sm" style={{ backgroundColor: "#F43F5E14", color: "#F43F5E" }}>
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: "var(--tm-text-2)" }}
        >
          <ArrowLeft size={14} /> {t.adminBackToUsers}
        </button>
      </div>
    );
  }

  const { user, recipes_count, saved_count } = detail;
  const name = user.full_name || user.username;
  const avatar = avatarColor(name, isDark);

  const TABS: { key: Tab; label: string }[] = [
    { key: "profile", label: t.adminProfileTab },
    { key: "saved", label: t.adminSavedTab(saved_count) },
    { key: "recipes", label: t.adminRecipesTab(recipes_count) },
  ];

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: "var(--tm-text-2)" }}
        >
          <ArrowLeft size={14} /> {t.back}
        </button>
        <Link
          href={`/admin/users/${user.id}/edit`}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg"
          style={{ backgroundColor: `${accent}1F`, color: accent }}
        >
          <Pencil size={13} /> {t.edit}
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl p-3 mb-3 text-sm" style={{ backgroundColor: "#F43F5E14", color: "#F43F5E" }}>
          {error}
        </div>
      )}

      {/* Profile summary */}
      <div
        className="rounded-2xl p-4 mb-4 flex items-start gap-3.5"
        style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }}
      >
        <div
          className="rounded-full flex items-center justify-center font-bold text-lg shrink-0"
          style={{ width: 54, height: 54, backgroundColor: `${avatar}26`, color: avatar }}
        >
          {avatarInitials(name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-extrabold tracking-tight truncate" style={{ color: "var(--tm-text)" }}>
            {name}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--tm-text-2)" }}>
            {user.email}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span
              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: user.role === "admin" ? `${accent}1F` : "#10B98119",
                color: user.role === "admin" ? accent : "#10B981",
              }}
            >
              {user.role === "admin" ? <Shield size={11} /> : <UserIcon size={11} />}
              {user.role === "admin" ? t.adminRoleLabel : t.userRoleLabel}
            </span>
            <span
              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "var(--tm-subtle)", color: user.is_active ? "#10B981" : "#F43F5E" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: user.is_active ? "#10B981" : "#F43F5E" }} />
              {user.is_active ? t.active : t.inactive}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 text-[11px] font-semibold" style={{ color: "var(--tm-text-2)" }}>
          <span className="flex items-center gap-1">
            <BookOpen size={11} /> {t.adminRecipesCountStat(recipes_count)}
          </span>
          <span className="flex items-center gap-1">
            <Heart size={11} /> {t.adminSavedCountStat(saved_count)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-4" style={{ borderBottom: "1px solid var(--tm-border-i)" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className="text-xs font-bold pb-2.5 border-b-2 transition-colors"
            style={{ color: tab === t.key ? accent : "var(--tm-text-2)", borderColor: tab === t.key ? accent : "transparent" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="space-y-3">
          <InfoCard title={t.adminAccountCardTitle} icon={UserIcon} accent={accent}>
            <InfoRow icon={Hash} label={t.adminUserIdLabel} value={`#${user.id}`} accent={accent} />
            <InfoRow icon={AtSign} label={t.adminUsernameLabel} value={user.username} accent={accent} />
            <InfoRow icon={Mail} label={t.emailLabel} value={user.email} accent={accent} />
            <InfoRow
              icon={CalendarDays}
              label={t.adminJoinedLabel}
              value={user.created_at ? new Date(user.created_at).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US") : "—"}
              accent={accent}
            />
          </InfoCard>

          <InfoCard title={t.adminNutritionGoalsCardTitle} icon={Flame} accent={accent}>
            <InfoRow icon={Cake} label={t.ageLabel} value={user.age ? t.adminAgeYears(user.age) : "—"} accent={accent} />
            <InfoRow icon={Weight} label={t.weightLabel} value={user.weight ? t.adminWeightKg(user.weight) : "—"} accent={accent} />
            <InfoRow
              icon={Flame}
              label={t.dailyCalorieTarget}
              value={user.calorie_target ? t.adminCalorieDay(user.calorie_target) : "—"}
              accent={accent}
            />
            <InfoRow icon={Flag} label={t.primaryGoalLabel} value={user.primary_goal ? t.goalDisplay(user.primary_goal) : "—"} accent={accent} />
          </InfoCard>

          <InfoCard title={t.adminDietaryRestrictionsCardTitle} icon={Tag} accent={accent}>
            {user.dietary_restrictions.length === 0 ? (
              <p className="text-xs pt-1" style={{ color: "var(--tm-text-2)" }}>
                {t.adminNoneSpecified}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {user.dietary_restrictions.map((tagName) => (
                  <span
                    key={tagName}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${accent}1A`, color: accent }}
                  >
                    {t.dietaryTagDisplay(tagName)}
                  </span>
                ))}
              </div>
            )}
          </InfoCard>

          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={toggling}
            className="w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border disabled:opacity-60"
            style={{ color: user.is_active ? "#F43F5E" : "#10B981", borderColor: user.is_active ? "#F43F5E" : "#10B981" }}
          >
            {user.is_active ? <Ban size={16} /> : <CheckCircle2 size={16} />}
            {user.is_active ? t.adminDeactivateAccount : t.adminActivateAccount}
          </button>
        </div>
      )}

      {tab === "saved" && (
        <RecipeList items={savedRecipes} loading={savedLoading} emptyLabel={t.adminNoSavedRecipesYet} accent={accent} t={t} />
      )}
      {tab === "recipes" && (
        <RecipeList items={createdRecipes} loading={createdLoading} emptyLabel={t.adminNoCreatedRecipesYet} accent={accent} t={t} />
      )}

      {confirming && (
        <ConfirmDialog
          title={user.is_active ? t.adminDeactivateAccountTitle : t.adminActivateAccountTitle}
          message={
            user.is_active
              ? t.adminWillLoseAccess(name)
              : t.adminWillRegainAccess(name)
          }
          confirmLabel={user.is_active ? t.deactivateLabel : t.activateLabel}
          confirmColor={user.is_active ? "#F43F5E" : "#10B981"}
          onConfirm={() => void handleToggleActive()}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
