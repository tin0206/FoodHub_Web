"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Eye,
  EyeOff,
  Flame,
  ListOrdered,
  Pencil,
  ShoppingBasket,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useDarkMode } from "@/lib/use-dark-mode";
import { useStrings } from "@/lib/use-strings";
import { ADMIN_ACCENT_LIGHT, ADMIN_ACCENT_DARK } from "@/lib/admin";
import { hasAccessToken } from "@/lib/auth";
import { ApiError, resolveMediaUrl } from "@/lib/api-client";
import {
  deleteRecipe,
  deleteRecipeTranslation,
  getRecipe,
  listRecipeTranslations,
  updateRecipeVisibility,
  upsertRecipeTranslation,
} from "@/lib/api/admin-recipes";
import type {
  ApiRecipe,
  ApiRecipeTranslation,
  RecipeVisibility,
} from "@/lib/api/types";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ingredientLines } from "@/components/recipe/recipe-view-content";
import LoadingOverlay from "@/components/loading-overlay";
import { getOrEstimateMeta } from "@/lib/recipe-meta";

const LOCALES = ["en", "vi"] as const;

function linesToText(lines: string[]): string {
  return lines.join("\n");
}

function textToLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function AdminRecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isDark = useDarkMode();
  const accent = isDark ? ADMIN_ACCENT_DARK : ADMIN_ACCENT_LIGHT;
  const t = useStrings();
  const recipeId = Number(params.id);

  const [recipe, setRecipe] = useState<ApiRecipe | null>(null);
  const [translations, setTranslations] = useState<ApiRecipeTranslation[]>([]);
  const [locale, setLocale] = useState<string>("en");
  const [title, setTitle] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [directionsText, setDirectionsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmDeleteLocale, setConfirmDeleteLocale] = useState(false);
  const [confirmDeleteRecipe, setConfirmDeleteRecipe] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const existingLocales = useMemo(
    () => new Set(translations.map((t) => t.locale)),
    [translations],
  );

  const applyTranslationForm = useCallback(
    (list: ApiRecipeTranslation[], nextLocale: string, fallback?: ApiRecipe | null) => {
      const match = list.find((t) => t.locale === nextLocale);
      if (match) {
        setTitle(match.title);
        setIngredientsText(linesToText(match.ingredients));
        setDirectionsText(linesToText(match.directions));
        return;
      }
      if (fallback) {
        setTitle(fallback.title);
        setIngredientsText(linesToText(fallback.ingredients ?? []));
        setDirectionsText(linesToText(fallback.directions ?? []));
        return;
      }
      setTitle("");
      setIngredientsText("");
      setDirectionsText("");
    },
    [],
  );

  const load = useCallback(async () => {
    if (!Number.isFinite(recipeId)) {
      router.replace("/admin/recipes");
      return;
    }
    if (!hasAccessToken()) {
      setError(t.adminNoTokenGeneric);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    try {
      // Load recipe first — do not couple to translations (older APIs may 404 that route)
      const found = await getRecipe(recipeId);
      setRecipe(found);

      let tr: ApiRecipeTranslation[] = [];
      try {
        tr = await listRecipeTranslations(recipeId);
      } catch (trErr) {
        // Recipe still viewable; translations panel just starts empty
        if (trErr instanceof ApiError && trErr.status !== 404) {
          setNotice(
            trErr.status === 403
              ? t.adminTranslationsUnavailable
              : t.adminTranslationsLoadFailed(trErr.message),
          );
        }
      }

      setTranslations(tr);
      const initialLocale =
        tr.find((t) => t.locale === found.locale)?.locale ||
        tr[0]?.locale ||
        found.locale ||
        "en";
      setLocale(initialLocale);
      applyTranslationForm(tr, initialLocale, found);
    } catch (err) {
      setRecipe(null);
      setTranslations([]);
      if (err instanceof ApiError) {
        setError(err.status === 404 ? t.adminRecipeNotFound : err.message || t.adminFailedLoadRecipe);
      } else {
        setError(err instanceof Error ? err.message : t.adminFailedLoadRecipe);
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyTranslationForm, recipeId, router, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleLocaleChange(next: string) {
    setLocale(next);
    applyTranslationForm(translations, next, recipe);
    setNotice("");
  }

  async function handleToggleVisibility() {
    if (!recipe) return;
    const next: RecipeVisibility =
      recipe.visibility === "public" ? "private" : "public";
    setToggling(true);
    setNotice("");
    setError("");
    try {
      const updated = await updateRecipeVisibility(recipe.id, next);
      setRecipe(updated);
      setNotice(t.adminVisibilitySet(updated.visibility === "public" ? t.publicLabel : t.privateLabel));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.adminFailedUpdateVisibility);
    } finally {
      setToggling(false);
    }
  }

  async function handleSaveTranslation() {
    if (!recipe || !title.trim()) {
      setError(t.adminTranslationTitleRequired);
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const saved = await upsertRecipeTranslation(recipe.id, locale, {
        title: title.trim(),
        ingredients: textToLines(ingredientsText),
        directions: textToLines(directionsText),
      });
      const next = [
        ...translations.filter((t) => t.locale !== locale),
        saved,
      ].sort((a, b) => a.locale.localeCompare(b.locale));
      setTranslations(next);
      setNotice(t.adminTranslationSaved(locale));
      if (locale === recipe.locale) {
        setRecipe({
          ...recipe,
          title: saved.title,
          ingredients: saved.ingredients,
          directions: saved.directions,
        });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.adminFailedSaveTranslation);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTranslation() {
    if (!recipe) return;
    setSaving(true);
    setError("");
    setNotice("");
    setConfirmDeleteLocale(false);
    try {
      await deleteRecipeTranslation(recipe.id, locale);
      const next = translations.filter((t) => t.locale !== locale);
      setTranslations(next);
      setNotice(t.adminTranslationDeleted(locale));
      applyTranslationForm(next, locale, recipe);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.adminFailedDeleteTranslation);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRecipe() {
    if (!recipe) return;
    setDeleting(true);
    setError("");
    setConfirmDeleteRecipe(false);
    try {
      await deleteRecipe(recipe.id);
      router.push("/admin/recipes");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.adminFailedDeleteRecipe);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <p className="text-sm" style={{ color: "var(--tm-text-2)" }}>
          {t.adminLoadingRecipe}
        </p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-3">
        {error && (
          <div
            className="rounded-2xl p-4 text-sm"
            style={{ backgroundColor: "#F43F5E14", color: "#F43F5E" }}
          >
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: "var(--tm-text-2)" }}
        >
          <ArrowLeft size={14} /> {t.adminBackToRecipes}
        </button>
      </div>
    );
  }

  const isPublic = recipe.visibility === "public";
  const isCatalog = recipe.created_by == null;
  const canDelete = !isCatalog;
  const meta = getOrEstimateMeta(recipe);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: "var(--tm-text-2)" }}
        >
          <ArrowLeft size={14} /> {t.back}
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/admin/recipes/${recipe.id}/edit`}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg"
            style={{ backgroundColor: `${accent}1F`, color: accent }}
          >
            <Pencil size={13} /> {t.edit}
          </Link>
          {canDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDeleteRecipe(true)}
              disabled={deleting}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg"
              style={{ backgroundColor: "#F43F5E19", color: "#F43F5E" }}
            >
              <Trash2 size={13} /> {t.delete}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void handleToggleVisibility()}
            disabled={toggling}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg"
            style={{ backgroundColor: `${accent}1F`, color: accent }}
          >
            {isPublic ? <EyeOff size={13} /> : <Eye size={13} />}
            {toggling ? t.updating : isPublic ? t.adminMakePrivate : t.adminMakePublic}
          </button>
        </div>
      </div>

      {isCatalog && (
        <div
          className="rounded-2xl p-3 mb-3 text-xs"
          style={{ backgroundColor: "var(--tm-subtle)", color: "var(--tm-text-2)" }}
        >
          {t.adminCatalogNotice}
        </div>
      )}

      {error && (
        <div
          className="rounded-2xl p-3 mb-3 text-sm"
          style={{ backgroundColor: "#F43F5E14", color: "#F43F5E" }}
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          className="rounded-2xl p-3 mb-3 text-sm"
          style={{ backgroundColor: `${accent}14`, color: accent }}
        >
          {notice}
        </div>
      )}

      {recipe.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolveMediaUrl(recipe.image_url)}
          alt={recipe.title}
          className="w-full h-72 object-cover rounded-2xl mb-3"
        />
      ) : (
        <div
          className="w-full h-72 rounded-2xl mb-3 flex items-center justify-center"
          style={{ backgroundColor: `${accent}14` }}
        >
          <BookOpen size={44} color={accent} />
        </div>
      )}

      <h1
        className="text-xl font-extrabold tracking-tight mb-2"
        style={{ color: "var(--tm-text)" }}
      >
        {recipe.title}
      </h1>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: isPublic ? `${accent}1A` : "var(--tm-subtle)",
            color: isPublic ? accent : "var(--tm-text-2)",
          }}
        >
          {isPublic ? <Eye size={11} /> : <EyeOff size={11} />}
          {isPublic ? t.publicLabel : t.privateLabel}
        </span>
        <span className="text-xs" style={{ color: "var(--tm-text-3)" }}>
          #{recipe.id} · {t.adminLocaleLabel} {recipe.locale}
        </span>
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "var(--tm-subtle)", color: "var(--tm-text-2)" }}
        >
          <Clock size={11} /> {t.adminMinutesCount(meta.cookingMinutes)}
        </span>
        {recipe.estimated_servings != null && (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: "var(--tm-subtle)", color: "var(--tm-text-2)" }}
          >
            <Users size={11} /> {t.adminServingsCount(recipe.estimated_servings)}
          </span>
        )}
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "var(--tm-subtle)", color: "var(--tm-text-2)" }}
        >
          <Flame size={11} /> {t.adminCaloriesCount(meta.calories)}
        </span>
      </div>

      {(recipe.dietary_restrictions?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {recipe.dietary_restrictions.map((label) => (
            <span
              key={label}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${accent}1A`, color: accent }}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-3 mb-5">
        <div
          className="rounded-2xl p-3.5"
          style={{
            backgroundColor: "var(--tm-surface)",
            border: "1px solid var(--tm-border-i)",
          }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <ShoppingBasket size={15} color={accent} />
            <span className="text-[13px] font-bold" style={{ color: "var(--tm-text)" }}>
              {t.adminIngredientsHeading}
            </span>
          </div>
          <ul className="space-y-1.5">
            {ingredientLines(recipe).map((line, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-[13px]"
                style={{ color: "var(--tm-text)" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                  style={{ backgroundColor: accent }}
                />
                {line}
              </li>
            ))}
            {ingredientLines(recipe).length === 0 && (
              <li className="text-xs" style={{ color: "var(--tm-text-3)" }}>
                {t.adminNoIngredients}
              </li>
            )}
          </ul>
        </div>

        <div
          className="rounded-2xl p-3.5"
          style={{
            backgroundColor: "var(--tm-surface)",
            border: "1px solid var(--tm-border-i)",
          }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <ListOrdered size={15} color={accent} />
            <span className="text-[13px] font-bold" style={{ color: "var(--tm-text)" }}>
              {t.adminInstructionsHeading}
            </span>
          </div>
          <ol className="space-y-2">
            {(recipe.directions ?? []).map((line, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-[13px]"
                style={{ color: "var(--tm-text)" }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ backgroundColor: `${accent}2E`, color: accent }}
                >
                  {i + 1}
                </span>
                <span className="pt-0.5">{line}</span>
              </li>
            ))}
            {(recipe.directions ?? []).length === 0 && (
              <li className="text-xs" style={{ color: "var(--tm-text-3)" }}>
                {t.adminNoDirections}
              </li>
            )}
          </ol>
        </div>

        {(recipe.dietary_restrictions?.length ?? 0) === 0 && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--tm-text-3)" }}>
            <Tag size={12} /> {t.adminNoDietaryLabels}
          </div>
        )}
      </div>

      {/* Translations */}
      <div
        className="rounded-2xl p-3.5"
        style={{
          backgroundColor: "var(--tm-surface)",
          border: "1px solid var(--tm-border-i)",
        }}
      >
        <p className="text-[13px] font-bold mb-3" style={{ color: "var(--tm-text)" }}>
          {t.adminTranslationsHeading}
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {LOCALES.map((loc) => {
            const active = locale === loc;
            const exists = existingLocales.has(loc);
            return (
              <button
                key={loc}
                type="button"
                onClick={() => handleLocaleChange(loc)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{
                  backgroundColor: active ? accent : "var(--tm-subtle)",
                  color: active ? "#fff" : "var(--tm-text-2)",
                }}
              >
                {loc}
                {exists ? "" : t.adminNewLocaleSuffix}
              </button>
            );
          })}
        </div>

        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--tm-text-2)" }}>
          {t.adminTitleLabel}
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm mb-3 outline-none"
          style={{
            backgroundColor: "var(--tm-bg)",
            color: "var(--tm-text)",
            border: "1px solid var(--tm-border-i)",
          }}
        />

        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--tm-text-2)" }}>
          {t.adminIngredientsOnePerLine}
        </label>
        <textarea
          value={ingredientsText}
          onChange={(e) => setIngredientsText(e.target.value)}
          rows={5}
          className="w-full rounded-lg px-3 py-2 text-sm mb-3 outline-none resize-y"
          style={{
            backgroundColor: "var(--tm-bg)",
            color: "var(--tm-text)",
            border: "1px solid var(--tm-border-i)",
          }}
        />

        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--tm-text-2)" }}>
          {t.adminDirectionsOnePerLine}
        </label>
        <textarea
          value={directionsText}
          onChange={(e) => setDirectionsText(e.target.value)}
          rows={6}
          className="w-full rounded-lg px-3 py-2 text-sm mb-3 outline-none resize-y"
          style={{
            backgroundColor: "var(--tm-bg)",
            color: "var(--tm-text)",
            border: "1px solid var(--tm-border-i)",
          }}
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleSaveTranslation()}
            disabled={saving}
            className="text-xs font-bold text-white px-3 py-2 rounded-lg"
            style={{ backgroundColor: accent }}
          >
            {saving ? t.saving : t.adminSaveLocale(locale)}
          </button>
          {existingLocales.has(locale) && (
            <button
              type="button"
              onClick={() => setConfirmDeleteLocale(true)}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg"
              style={{ backgroundColor: "#F43F5E19", color: "#F43F5E" }}
            >
              <Trash2 size={13} /> {t.adminDeleteLocale(locale)}
            </button>
          )}
        </div>
      </div>

      {confirmDeleteLocale && (
        <ConfirmDialog
          title={t.adminDeleteTranslationTitle}
          message={t.adminDeleteTranslationMessage(locale, recipe.title)}
          confirmLabel={t.delete}
          confirmColor="#F43F5E"
          onConfirm={() => void handleDeleteTranslation()}
          onCancel={() => setConfirmDeleteLocale(false)}
        />
      )}

      {confirmDeleteRecipe && (
        <ConfirmDialog
          title={t.adminDeleteRecipeTitle}
          message={t.adminDeleteRecipeMessage(recipe.title)}
          confirmLabel={t.delete}
          confirmColor="#F43F5E"
          onConfirm={() => void handleDeleteRecipe()}
          onCancel={() => setConfirmDeleteRecipe(false)}
        />
      )}

      {(saving || toggling || deleting) && <LoadingOverlay />}
    </div>
  );
}
