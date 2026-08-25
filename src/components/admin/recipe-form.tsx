"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Plus,
  X,
  ShoppingBasket,
  ListOrdered,
  Tag,
  ImagePlus,
  Users,
} from "lucide-react";
import {
  ADMIN_ACCENT_LIGHT,
  ADMIN_ACCENT_DARK,
  AVAILABLE_LABELS,
} from "@/lib/admin";
import { useDarkMode } from "@/lib/use-dark-mode";
import { useStrings } from "@/lib/use-strings";
import { ApiError, resolveMediaUrl } from "@/lib/api-client";
import {
  createRecipe,
  updateRecipe,
  type RecipeWritePayload,
} from "@/lib/api/admin-recipes";
import { uploadRecipeImage } from "@/lib/api/recipes";
import type { ApiRecipe } from "@/lib/api/types";
import { PhotoPicker } from "@/components/recipe/photo-picker";
import LoadingOverlay from "@/components/loading-overlay";
import { getRecipeMeta, setRecipeMeta, estimateStats } from "@/lib/recipe-meta";

function FieldCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-3.5"
      style={{
        backgroundColor: "var(--tm-surface)",
        border: "1px solid var(--tm-border-i)",
      }}
    >
      {children}
    </div>
  );
}

export type RecipeFormInitial = Pick<
  ApiRecipe,
  | "id"
  | "title"
  | "ingredients"
  | "directions"
  | "dietary_restrictions"
  | "estimated_servings"
  | "image_url"
  | "created_by"
>;

export function AdminRecipeForm({ initial }: { initial?: RecipeFormInitial }) {
  const router = useRouter();
  const isDark = useDarkMode();
  const accent = isDark ? ADMIN_ACCENT_DARK : ADMIN_ACCENT_LIGHT;
  const t = useStrings();
  const isCatalog = initial != null && initial.created_by == null;

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(
    resolveMediaUrl(initial?.image_url ?? "") || "",
  );
  const [imageCleared, setImageCleared] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [minutes, setMinutes] = useState(
    initial ? String(getRecipeMeta(initial.id)?.cookingMinutes ?? "") : "",
  );
  const [servings, setServings] = useState(
    initial?.estimated_servings != null
      ? String(initial.estimated_servings)
      : "",
  );
  const [ingredients, setIngredients] = useState<string[]>(
    initial && initial.ingredients.length > 0 ? initial.ingredients : [""],
  );
  const [steps, setSteps] = useState<string[]>(
    initial && initial.directions.length > 0 ? initial.directions : [""],
  );
  const [labels, setLabels] = useState<Set<string>>(
    new Set(initial?.dietary_restrictions ?? []),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateAt(
    list: string[],
    set: (v: string[]) => void,
    i: number,
    value: string,
  ) {
    const next = [...list];
    next[i] = value;
    set(next);
  }

  function removeAt(list: string[], set: (v: string[]) => void, i: number) {
    set(list.filter((_, idx) => idx !== i));
  }

  function toggleLabel(label: string) {
    setLabels((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  function handlePickImage(file: File) {
    setImageFile(file);
    setImageCleared(false);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleClearImage() {
    setImageFile(null);
    setImagePreview("");
    setImageCleared(true);
  }

  async function handleSave() {
    if (saving) return;
    const trimmedTitle = title.trim();
    const cleanIngredients = ingredients.map((s) => s.trim()).filter(Boolean);
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean);
    const servingsNum = servings.trim()
      ? Number.parseInt(servings, 10)
      : null;
    const minutesNum = minutes.trim() ? Number.parseInt(minutes, 10) : null;

    if (
      !trimmedTitle ||
      cleanIngredients.length === 0 ||
      cleanSteps.length === 0
    ) {
      setError(t.adminRecipeFieldsRequired);
      return;
    }
    if (
      servings.trim() &&
      (!Number.isFinite(servingsNum) || (servingsNum as number) <= 0)
    ) {
      setError(t.adminServingsMustBePositive);
      return;
    }
    if (
      minutes.trim() &&
      (!Number.isFinite(minutesNum) || (minutesNum as number) <= 0)
    ) {
      setError(t.adminMinutesMustBePositive);
      return;
    }

    const payload: RecipeWritePayload = {
      title: trimmedTitle,
      ingredients: cleanIngredients,
      directions: cleanSteps,
      dietary_restrictions: [...labels],
      estimated_servings: servingsNum,
      ...(imageCleared && !imageFile ? { image_url: null } : {}),
    };

    setError(null);
    setSaving(true);
    try {
      if (initial) {
        const saved = await updateRecipe(initial.id, payload);
        // Cooking time has no API field — cache it locally, same fallback
        // chain getOrEstimateMeta() reads everywhere else.
        if (Number.isFinite(minutesNum) && (minutesNum as number) > 0) {
          setRecipeMeta(saved.id, { cookingMinutes: minutesNum as number, calories: estimateStats(saved).calories });
        }
        if (imageFile) {
          try {
            await uploadRecipeImage(saved.id, imageFile);
          } catch {
            setError(t.adminPhotoUploadFailed);
          }
        }
        if (saved.id !== initial.id) {
          // Catalog edit clones into a private copy
          router.replace(`/admin/recipes/${saved.id}`);
          return;
        }
        router.push(`/admin/recipes/${saved.id}`);
      } else {
        const created = await createRecipe(payload);
        if (Number.isFinite(minutesNum) && (minutesNum as number) > 0) {
          setRecipeMeta(created.id, { cookingMinutes: minutesNum as number, calories: estimateStats(created).calories });
        }
        if (imageFile) {
          try {
            await uploadRecipeImage(created.id, imageFile);
          } catch {
            setError(t.adminPhotoUploadFailed);
          }
        }
        router.push(`/admin/recipes/${created.id}`);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t.adminFailedSaveRecipe;
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = { color: "var(--tm-text)" } as const;
  const hintStyle = { color: "var(--tm-text-3)" } as const;

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

      {isCatalog && (
        <div
          className="rounded-2xl p-3 mb-3 text-xs"
          style={{ backgroundColor: `${accent}14`, color: accent }}
        >
          {t.adminCatalogFormNotice}
          <strong>{t.adminCatalogFormNoticeStrong}</strong>
          {t.adminCatalogFormNoticeSuffix}
        </div>
      )}

      <div className="space-y-2.5">
        <FieldCard>
          <div className="flex items-center gap-1.5 mb-2">
            <ImagePlus size={15} color={accent} />
            <span
              className="text-[13px] font-bold"
              style={{ color: "var(--tm-text)" }}
            >
              {t.adminPhotoLabel}
            </span>
          </div>
          <PhotoPicker preview={imagePreview} onPick={handlePickImage} onClear={handleClearImage} />
        </FieldCard>

        <FieldCard>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.adminRecipeNameHint}
            className="w-full text-[17px] font-bold bg-transparent focus:outline-none tracking-tight"
            style={inputStyle}
          />
        </FieldCard>

        <FieldCard>
          <div className="flex items-center gap-2 flex-wrap">
            <Clock size={16} color={accent} />
            <input
              value={minutes}
              onChange={(e) =>
                setMinutes(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="0"
              className="w-14 text-sm bg-transparent focus:outline-none"
              style={inputStyle}
            />
            <span className="text-xs" style={hintStyle}>
              {t.adminMinutesOptional}
            </span>
            <span className="w-2" />
            <Users size={16} color={accent} />
            <input
              value={servings}
              onChange={(e) =>
                setServings(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="0"
              className="w-14 text-sm bg-transparent focus:outline-none"
              style={inputStyle}
            />
            <span className="text-xs" style={hintStyle}>
              {t.adminServingsOptional}
            </span>
          </div>
        </FieldCard>

        <FieldCard>
          <div className="flex items-center gap-1.5 mb-2">
            <ShoppingBasket size={15} color={accent} />
            <span
              className="text-[13px] font-bold"
              style={{ color: "var(--tm-text)" }}
            >
              {t.adminIngredientsHeading}
            </span>
          </div>
          <div className="space-y-1.5">
            {ingredients.map((val, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: accent }}
                />
                <input
                  value={val}
                  onChange={(e) =>
                    updateAt(ingredients, setIngredients, i, e.target.value)
                  }
                  placeholder={t.adminIngredientHint(i)}
                  className="flex-1 text-[13px] bg-transparent focus:outline-none py-1"
                  style={inputStyle}
                />
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAt(ingredients, setIngredients, i)}
                    className="shrink-0"
                    style={{ color: "var(--tm-text-3)" }}
                    aria-label="Remove ingredient"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIngredients([...ingredients, ""])}
            className="mt-2 flex items-center gap-1 text-xs font-semibold"
            style={{ color: accent }}
          >
            <Plus size={14} /> {t.adminAddIngredient}
          </button>
        </FieldCard>

        <FieldCard>
          <div className="flex items-center gap-1.5 mb-2">
            <ListOrdered size={15} color={accent} />
            <span
              className="text-[13px] font-bold"
              style={{ color: "var(--tm-text)" }}
            >
              {t.adminInstructionsHeading}
            </span>
          </div>
          <div className="space-y-1.5">
            {steps.map((val, i) => (
              <div key={i} className="flex items-start gap-2">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                  style={{ backgroundColor: `${accent}2E`, color: accent }}
                >
                  {i + 1}
                </span>
                <textarea
                  value={val}
                  onChange={(e) =>
                    updateAt(steps, setSteps, i, e.target.value)
                  }
                  placeholder={t.adminStepHint(i)}
                  rows={1}
                  className="flex-1 text-[13px] bg-transparent focus:outline-none py-1 resize-none"
                  style={inputStyle}
                />
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAt(steps, setSteps, i)}
                    className="shrink-0 mt-1.5"
                    style={{ color: "var(--tm-text-3)" }}
                    aria-label="Remove step"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSteps([...steps, ""])}
            className="mt-2 flex items-center gap-1 text-xs font-semibold"
            style={{ color: accent }}
          >
            <Plus size={14} /> {t.adminAddStep}
          </button>
        </FieldCard>

        <FieldCard>
          <div className="flex items-center gap-1.5 mb-2">
            <Tag size={15} color={accent} />
            <span
              className="text-[13px] font-bold"
              style={{ color: "var(--tm-text)" }}
            >
              {t.adminDietaryLabelsHeading}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_LABELS.map((label) => {
              const selected = labels.has(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleLabel(label)}
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
            style={{
              backgroundColor: "var(--tm-surface)",
              color: "var(--tm-text)",
              borderColor: "var(--tm-border-i)",
            }}
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
            {saving
              ? t.saving
              : initial
                ? isCatalog
                  ? t.adminSaveAsPrivateCopy
                  : t.adminSaveRecipeChanges
                : t.adminSaveRecipeCta}
          </button>
        </div>
      </div>
      {saving && <LoadingOverlay />}
    </div>
  );
}
