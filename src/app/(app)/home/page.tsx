"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Plus,
  X,
  ImagePlus,
  Clock,
  Flame,
  ShoppingBasket,
  ListOrdered,
  Tag,
  ArrowLeft,
  Utensils,
} from "lucide-react";
import { useDarkMode } from "@/lib/use-dark-mode";
import { hasAccessToken } from "@/lib/auth";
import { ApiError, resolveMediaUrl } from "@/lib/api-client";
import {
  listRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  uploadRecipeImage,
} from "@/lib/api/recipes";
import type { ApiRecipe } from "@/lib/api/types";
import { ConfirmDialog } from "@/components/confirm-dialog";
import LoadingOverlay from "@/components/loading-overlay";
import {
  RecipeCard,
  type RecipeCardData,
} from "@/components/recipe/recipe-card";
import {
  recipeCardTheme,
  type RecipeCardTheme,
} from "@/components/recipe/recipe-card-theme";
import {
  getRecipeMeta,
  setRecipeMeta,
  type RecipeMeta,
} from "@/lib/recipe-meta";

const DEFAULT_ACCENT = "#059669";

// ─── Constants ────────────────────────────────────────────────────────────────

const AVAILABLE_LABELS = [
  "Dairy Free",
  "Egg Free",
  "Gluten Free",
  "Nut Free",
  "Vegan",
  "Vegetarian",
  "Pescetarian",
  "Healthy",
  "Italian",
  "Comfort Food",
  "High Protein",
  "Keto",
  "Quick Meal",
  "Meal Prep",
  "Breakfast",
];

type View = "list" | "add" | "detail";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// The API has no cooking-time/calorie fields (confirmed against the live backend —
// only estimated_servings). Recipes created in this app cache the real values the
// user typed (see recipe-meta.ts); anything else (catalog recipes, other devices)
// falls back to a rough estimate so the card still reads like the mobile design.
function estimateStats(recipe: ApiRecipe): RecipeMeta {
  const steps = recipe.directions.length || 1;
  const ingredientCount = recipe.ingredients.length || 1;
  const cookingMinutes = Math.min(
    120,
    Math.max(10, 8 * steps + 2 * ingredientCount),
  );
  const servings =
    recipe.estimated_servings ?? Math.max(1, Math.round(ingredientCount / 3));
  return { cookingMinutes, calories: servings * 200 };
}

function toCardData(recipe: ApiRecipe): RecipeCardData {
  const meta = getRecipeMeta(recipe.id) ?? estimateStats(recipe);
  return {
    id: recipe.id,
    name: recipe.title,
    imageUrl: recipe.image_url,
    labels: recipe.dietary_restrictions,
    cookingMinutes: meta.cookingMinutes,
    calories: meta.calories,
  };
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof Error) return err.message;
  return fallback;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Shared bits ──────────────────────────────────────────────────────────────

function panelShadow(dark: boolean) {
  return dark
    ? "0 8px 20px rgba(0,0,0,0.28)"
    : "0 3px 10px rgba(12,26,20,0.06)";
}

// Matches mobile's _AddSectionCard, but with a visible border added on top of the
// shadow — the page background and panel fill are close enough in tone on web that
// a shadow alone wasn't reading as a boundary.
function SectionCard({
  icon,
  title,
  accent = DEFAULT_ACCENT,
  children,
}: {
  icon?: React.ReactNode;
  title?: string;
  accent?: string;
  children: React.ReactNode;
}) {
  const dark = useDarkMode();
  return (
    <div
      className="rounded-xl p-3"
      style={{
        backgroundColor: dark ? "#1E1E1E" : "#FFFFFF",
        border: `1px solid ${dark ? "#2E2E2E" : "var(--tm-border-i)"}`,
        boxShadow: panelShadow(dark),
      }}
    >
      {(icon || title) && (
        <div className="flex items-center gap-1.5 mb-2">
          {icon && <span style={{ color: accent }}>{icon}</span>}
          {title && (
            <p
              className="text-[13px] font-bold"
              style={{ color: "var(--tm-text)" }}
            >
              {title}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

const inlineInputClass =
  "w-full bg-transparent focus:outline-none py-1 border-b-2 border-transparent focus:border-[#059669] transition-colors";

function LabelChips({
  selected,
  onToggle,
  accent = DEFAULT_ACCENT,
}: {
  selected: Set<string>;
  onToggle: (label: string) => void;
  accent?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {AVAILABLE_LABELS.map((label) => {
        const active = selected.has(label);
        return (
          <button
            key={label}
            type="button"
            onClick={() => onToggle(label)}
            className="text-[11px] px-2.5 py-1 rounded-full border transition-colors"
            style={{
              backgroundColor: active ? accent : "var(--tm-surface)",
              color: active ? "white" : "var(--tm-text-2)",
              borderColor: active ? accent : "var(--tm-border-i)",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function PhotoPicker({
  preview,
  onPick,
  onClear,
  theme,
}: {
  preview: string;
  onPick: (file: File) => void;
  onClear: () => void;
  theme?: RecipeCardTheme;
}) {
  const dark = useDarkMode();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onPick(file);
  }

  return (
    <div className="rounded-xl overflow-hidden">
      {preview ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative w-full h-35 block"
          style={{ height: 140 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="w-full h-full object-cover" />
          <span
            className="absolute inset-0 flex items-center justify-center gap-1.5"
            style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
          >
            <ImagePlus size={15} color="white" />
            <span className="text-xs font-semibold text-white">
              Change Photo
            </span>
          </span>
          <span
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="absolute top-2 right-2 w-6.5 h-6.5 rounded-full flex items-center justify-center"
            style={{ width: 26, height: 26, backgroundColor: "rgba(0,0,0,0.55)" }}
            role="button"
            aria-label="Remove photo"
          >
            <X size={13} color="white" />
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`w-full h-25 flex flex-col items-center justify-center gap-1 rounded-xl ${theme ? "" : "border-2 border-dashed"}`}
          style={
            theme
              ? {
                  height: 100,
                  background: `linear-gradient(135deg, ${theme.start}, ${theme.end})`,
                  color: "rgba(255,255,255,0.9)",
                }
              : {
                  height: 100,
                  backgroundColor: dark ? "#1E1E1E" : "#FAFBFA",
                  borderColor: dark ? "#3A3A3A" : "var(--tm-border-i)",
                  color: dark ? "#64748B" : "#9CA3AF",
                }
          }
        >
          <ImagePlus size={26} />
          <span className="text-xs">Add photo</span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

function LineListEditor({
  values,
  onChange,
  placeholder,
  variant = "dot",
  addLabel = "Add",
  accent = DEFAULT_ACCENT,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: (i: number) => string;
  variant?: "dot" | "number";
  addLabel?: string;
  accent?: string;
}) {
  const dark = useDarkMode();
  function update(i: number, v: string) {
    const next = [...values];
    next[i] = v;
    onChange(next);
  }
  function remove(i: number) {
    onChange(values.filter((_, idx) => idx !== i));
  }
  return (
    <div>
      <div className="space-y-1.5">
        {values.map((v, i) => (
          <div
            key={i}
            className={
              variant === "number"
                ? "flex items-start gap-2"
                : "flex items-center gap-2"
            }
          >
            {variant === "number" ? (
              <span
                className="w-5.5 h-5.5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                style={{
                  backgroundColor: `${accent}${dark ? "2E" : "1A"}`,
                  color: accent,
                }}
              >
                {i + 1}
              </span>
            ) : (
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: accent }}
              />
            )}
            {variant === "number" ? (
              <textarea
                value={v}
                onChange={(e) => update(i, e.target.value)}
                placeholder={placeholder(i)}
                rows={1}
                className={`flex-1 text-[13px] resize-none ${inlineInputClass}`}
                style={{ color: "var(--tm-text)" }}
              />
            ) : (
              <input
                value={v}
                onChange={(e) => update(i, e.target.value)}
                placeholder={placeholder(i)}
                className={`flex-1 text-[13px] ${inlineInputClass}`}
                style={{ color: "var(--tm-text)" }}
              />
            )}
            {values.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className={variant === "number" ? "mt-1.5" : ""}
                style={{ color: "var(--tm-text-3)" }}
                aria-label="Remove"
              >
                <X size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...values, ""])}
        className="mt-2 flex items-center gap-1 text-xs font-semibold"
        style={{ color: accent }}
      >
        <Plus size={13} /> {addLabel}
      </button>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const dark = useDarkMode();
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div
        className="w-17 h-17 rounded-[18px] flex items-center justify-center mb-3"
        style={{ backgroundColor: dark ? "#1E293B" : "#E5E7EB" }}
      >
        <BookOpen size={34} color={dark ? "#94A3B8" : "#6B7280"} />
      </div>
      <p
        className="text-[17px] font-bold mb-1"
        style={{ color: "var(--tm-text)" }}
      >
        No recipes yet
      </p>
      <p
        className="text-xs text-center mb-3.5 max-w-60"
        style={{ color: "var(--tm-text-3)" }}
      >
        Add your own recipes and share your culinary creations
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white"
        style={{ backgroundColor: "#10B981" }}
      >
        <Plus size={16} />
        Add your first recipe
      </button>
    </div>
  );
}

// ─── Add recipe panel ─────────────────────────────────────────────────────────

function AddRecipePanel({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (r: ApiRecipe) => void;
}) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState("");
  const [calories, setCalories] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [labels, setLabels] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleLabel(label: string) {
    setLabels((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  async function handlePickImage(file: File) {
    setImageFile(file);
    setImagePreview(await readFileAsDataUrl(file));
  }

  function handleClearImage() {
    setImageFile(null);
    setImagePreview("");
  }

  async function handleSave() {
    if (saving) return;
    const trimmedName = name.trim();
    const cleanIngredients = ingredients.map((s) => s.trim()).filter(Boolean);
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean);
    const mins = Number.parseInt(minutes, 10);
    const cals = Number.parseInt(calories, 10);

    if (
      !trimmedName ||
      cleanIngredients.length === 0 ||
      cleanSteps.length === 0 ||
      !Number.isFinite(mins) ||
      mins <= 0 ||
      !Number.isFinite(cals) ||
      cals <= 0
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      const created = await createRecipe({
        title: trimmedName,
        ingredients: cleanIngredients,
        directions: cleanSteps,
        dietary_restrictions: [...labels],
        estimated_servings: Math.min(12, Math.max(1, Math.round(cals / 200))),
      });
      setRecipeMeta(created.id, { cookingMinutes: mins, calories: cals });

      let finalRecipe = created;
      if (imageFile) {
        try {
          const imageUrl = await uploadRecipeImage(created.id, imageFile);
          finalRecipe = { ...created, image_url: imageUrl };
        } catch {
          // Recipe was created fine; just surface that the photo didn't attach.
          setError("Recipe saved, but the photo could not be uploaded.");
        }
      }
      onSave(finalRecipe);
    } catch (err) {
      setError(errorMessage(err, "Unable to save recipe."));
    } finally {
      setSaving(false);
    }
  }

  const dark = useDarkMode();

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "var(--tm-surface)",
        boxShadow: dark
          ? "0 12px 28px rgba(0,0,0,0.4)"
          : "0 8px 24px rgba(12,26,20,0.1)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2.5 shrink-0">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#0596691F" }}
        >
          <Plus size={16} color="#059669" />
        </span>
        <p
          className="text-[15px] font-extrabold tracking-tight flex-1"
          style={{ color: "var(--tm-text)" }}
        >
          New Recipe
        </p>
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: dark ? "#2A2A2A" : "#F3F4F6",
            border: `1px solid ${dark ? "#3A3A3A" : "var(--tm-border-i)"}`,
            color: "var(--tm-text-2)",
          }}
          aria-label="Cancel"
        >
          <X size={16} />
        </button>
      </div>
      <div style={{ borderTop: "1px solid var(--tm-border)" }} />

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3.5 space-y-2.5">
        {error && <p className="text-xs text-red-500">{error}</p>}

        {/* Photo */}
        <PhotoPicker
          preview={imagePreview}
          onPick={handlePickImage}
          onClear={handleClearImage}
        />

        {/* Name */}
        <SectionCard>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Recipe name…"
            className={`text-[17px] font-bold tracking-tight ${inlineInputClass}`}
            style={{ color: "var(--tm-text)" }}
          />
        </SectionCard>

        {/* Time + calories */}
        <SectionCard>
          <div className="flex items-center flex-wrap gap-2">
            <Clock size={16} color="#059669" />
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="0"
              className={inlineInputClass}
              style={{ width: 56, color: "var(--tm-text)" }}
            />
            <span className="text-xs" style={{ color: "var(--tm-text-3)" }}>
              min
            </span>
            <span className="w-3" />
            <Flame size={16} color="#059669" />
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="0"
              className={inlineInputClass}
              style={{ width: 56, color: "var(--tm-text)" }}
            />
            <span className="text-xs" style={{ color: "var(--tm-text-3)" }}>
              cal
            </span>
          </div>
        </SectionCard>

        {/* Ingredients */}
        <SectionCard icon={<ShoppingBasket size={15} />} title="Ingredients">
          <LineListEditor
            values={ingredients}
            onChange={setIngredients}
            placeholder={(i) => `Ingredient ${i + 1}`}
            addLabel="Add ingredient"
          />
        </SectionCard>

        {/* Instructions */}
        <SectionCard icon={<ListOrdered size={15} />} title="Instructions">
          <LineListEditor
            values={steps}
            onChange={setSteps}
            placeholder={(i) => `Step ${i + 1}…`}
            variant="number"
            addLabel="Add step"
          />
        </SectionCard>

        {/* Labels */}
        <SectionCard icon={<Tag size={15} />} title="Labels">
          <LabelChips selected={labels} onToggle={toggleLabel} />
        </SectionCard>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 px-3.5 pb-3.5 pt-2 shrink-0">
        <button
          onClick={onCancel}
          className="flex-1 h-11 rounded-xl text-sm font-semibold transition-colors"
          style={{
            backgroundColor: dark ? "#1E1E1E" : "#F3F4F6",
            border: `1px solid ${dark ? "#3A3A3A" : "var(--tm-border-i)"}`,
            color: "var(--tm-text)",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 h-11 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{
            backgroundColor: "#059669",
            boxShadow: "0 6px 16px rgba(5,150,105,0.3)",
          }}
        >
          Save Recipe
        </button>
      </div>
      {saving && <LoadingOverlay />}
    </div>
  );
}

// ─── Recipe detail panel (view + edit + delete) ──────────────────────────────

function RecipeDetailPanel({
  recipe,
  onBack,
  onUpdated,
  onDeleted,
}: {
  recipe: ApiRecipe;
  onBack: () => void;
  onUpdated: (r: ApiRecipe) => void;
  onDeleted: () => void;
}) {
  const dark = useDarkMode();
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(recipe.title);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageCleared, setImageCleared] = useState(false);
  const [minutes, setMinutes] = useState("");
  const [calories, setCalories] = useState("");
  const [ingredients, setIngredients] = useState<string[]>(
    recipe.ingredients.length ? recipe.ingredients : [""],
  );
  const [steps, setSteps] = useState<string[]>(
    recipe.directions.length ? recipe.directions : [""],
  );
  const [labels, setLabels] = useState<Set<string>>(
    new Set(recipe.dietary_restrictions),
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const image = resolveMediaUrl(recipe.image_url);
  const meta = getRecipeMeta(recipe.id) ?? estimateStats(recipe);
  const theme = recipeCardTheme(recipe.id, recipe.dietary_restrictions);
  const panelBg = dark ? "#1E1E1E" : "#F3F4F6";
  const panelBorder = dark ? "#3A3A3A" : "var(--tm-border-i)";

  function openEdit() {
    setTitle(recipe.title);
    setImageFile(null);
    setImagePreview(image);
    setImageCleared(false);
    setMinutes(String(meta.cookingMinutes));
    setCalories(String(meta.calories));
    setIngredients(recipe.ingredients.length ? recipe.ingredients : [""]);
    setSteps(recipe.directions.length ? recipe.directions : [""]);
    setLabels(new Set(recipe.dietary_restrictions));
    setError("");
    setEditMode(true);
  }

  async function handlePickImage(file: File) {
    setImageFile(file);
    setImagePreview(await readFileAsDataUrl(file));
    setImageCleared(false);
  }

  function handleClearImage() {
    setImageFile(null);
    setImagePreview("");
    setImageCleared(true);
  }

  function toggleLabel(label: string) {
    setLabels((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  async function saveEdit() {
    const cleanIngredients = ingredients.map((s) => s.trim()).filter(Boolean);
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean);
    const mins = Number.parseInt(minutes, 10);
    const cals = Number.parseInt(calories, 10);
    if (
      !title.trim() ||
      cleanIngredients.length === 0 ||
      cleanSteps.length === 0 ||
      !Number.isFinite(mins) ||
      mins <= 0 ||
      !Number.isFinite(cals) ||
      cals <= 0
    ) {
      setError(
        "Title, time, calories, ingredients and instructions are required.",
      );
      return;
    }
    setError("");
    setSaving(true);
    try {
      // The API has no cooking-time/calorie fields — only the local cache is updated for those.
      const updated = await updateRecipe(recipe.id, {
        title: title.trim(),
        ingredients: cleanIngredients,
        directions: cleanSteps,
        dietary_restrictions: [...labels],
        ...(imageCleared && !imageFile ? { image_url: null } : {}),
      });
      setRecipeMeta(updated.id, { cookingMinutes: mins, calories: cals });

      let finalRecipe = updated;
      if (imageFile) {
        try {
          const imageUrl = await uploadRecipeImage(updated.id, imageFile);
          finalRecipe = { ...updated, image_url: imageUrl };
        } catch {
          // Text fields saved fine; just surface that the photo didn't attach.
          setError("Changes saved, but the photo could not be uploaded.");
        }
      }
      onUpdated(finalRecipe);
      setEditMode(false);
    } catch (err) {
      setError(errorMessage(err, "Unable to save changes."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteRecipe(recipe.id);
      onDeleted();
    } catch (err) {
      setError(errorMessage(err, "Unable to delete recipe."));
      setConfirmDelete(false);
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-1 pb-3 shrink-0">
        <button
          onClick={editMode ? () => setEditMode(false) : onBack}
          className="p-1"
          style={{ color: "var(--tm-text-2)" }}
        >
          <ArrowLeft size={18} />
        </button>
        <p
          className="text-sm font-semibold truncate flex-1"
          style={{ color: "var(--tm-text)" }}
        >
          {editMode ? "Edit recipe" : recipe.title}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-1 pb-3">
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        {editMode ? (
          <div className="space-y-2.5">
            <PhotoPicker
              preview={imagePreview}
              onPick={handlePickImage}
              onClear={handleClearImage}
              theme={theme}
            />
            <SectionCard title="Name" accent={theme.start}>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Recipe name…"
                className={`text-[17px] font-bold tracking-tight ${inlineInputClass}`}
                style={{ color: "var(--tm-text)" }}
              />
            </SectionCard>
            <SectionCard accent={theme.start}>
              <div className="flex items-center flex-wrap gap-2">
                <Clock size={16} color={theme.start} />
                <input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="0"
                  className={inlineInputClass}
                  style={{ width: 56, color: "var(--tm-text)" }}
                />
                <span className="text-xs" style={{ color: "var(--tm-text-3)" }}>
                  min
                </span>
                <span className="w-3" />
                <Flame size={16} color={theme.start} />
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="0"
                  className={inlineInputClass}
                  style={{ width: 56, color: "var(--tm-text)" }}
                />
                <span className="text-xs" style={{ color: "var(--tm-text-3)" }}>
                  cal
                </span>
              </div>
            </SectionCard>
            <SectionCard
              icon={<ShoppingBasket size={15} />}
              title="Ingredients"
              accent={theme.start}
            >
              <LineListEditor
                values={ingredients}
                onChange={setIngredients}
                placeholder={(i) => `Ingredient ${i + 1}`}
                addLabel="Add ingredient"
                accent={theme.start}
              />
            </SectionCard>
            <SectionCard
              icon={<ListOrdered size={15} />}
              title="Instructions"
              accent={theme.start}
            >
              <LineListEditor
                values={steps}
                onChange={setSteps}
                placeholder={(i) => `Step ${i + 1}…`}
                variant="number"
                addLabel="Add step"
                accent={theme.start}
              />
            </SectionCard>
            <SectionCard icon={<Tag size={15} />} title="Labels" accent={theme.start}>
              <LabelChips selected={labels} onToggle={toggleLabel} accent={theme.start} />
            </SectionCard>
          </div>
        ) : (
          <div>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={recipe.title}
                className="w-full h-44 object-cover rounded-xl mb-3"
              />
            ) : (
              <div
                className="w-full h-44 rounded-xl mb-3 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${theme.start}, ${theme.end})`,
                }}
              >
                <Utensils size={32} color="rgba(255,255,255,0.9)" />
              </div>
            )}

            <h1
              className="text-xl font-bold mb-2"
              style={{ color: "var(--tm-text)" }}
            >
              {recipe.title}
            </h1>

            <div
              className="flex items-center gap-4 mb-3 text-sm"
              style={{ color: "var(--tm-text-2)" }}
            >
              <span className="flex items-center gap-1.5">
                <Clock size={14} color={theme.start} /> {meta.cookingMinutes}{" "}
                min
              </span>
              <span className="flex items-center gap-1.5">
                <Flame size={14} color={theme.start} /> {meta.calories} cal
              </span>
            </div>

            <div className="space-y-2.5">
              <SectionCard
                icon={<ShoppingBasket size={15} />}
                title="Ingredients"
                accent={theme.start}
              >
                <div className="space-y-2">
                  {recipe.ingredients.map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: theme.start }}
                      />
                      <p
                        className="text-sm"
                        style={{ color: "var(--tm-text-2)" }}
                      >
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                icon={<ListOrdered size={15} />}
                title="Instructions"
                accent={theme.start}
              >
                <div className="space-y-3">
                  {recipe.directions.map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span
                        className="shrink-0 w-5.5 h-5.5 rounded-full flex items-center justify-center text-[11px] font-bold"
                        style={{
                          backgroundColor: `${theme.start}${dark ? "2E" : "1A"}`,
                          color: theme.start,
                        }}
                      >
                        {i + 1}
                      </span>
                      <p
                        className="text-sm pt-0.5"
                        style={{ color: "var(--tm-text-2)" }}
                      >
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {recipe.dietary_restrictions.length > 0 && (
                <SectionCard
                  icon={<Tag size={15} />}
                  title="Labels"
                  accent={theme.start}
                >
                  <div className="flex flex-wrap gap-2">
                    {recipe.dietary_restrictions.map((label) => (
                      <span
                        key={label}
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: `${theme.start}${dark ? "26" : "14"}`,
                          color: dark ? `${theme.start}E6` : theme.end,
                        }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        className="border-t px-1 pt-3 shrink-0"
        style={{ borderColor: "var(--tm-border)" }}
      >
        <div className="flex gap-2.5">
          {editMode ? (
            <>
              <button
                onClick={() => setEditMode(false)}
                className="flex-1 py-2.5 border rounded-full text-sm font-semibold"
                style={{
                  borderColor: panelBorder,
                  color: "var(--tm-text-2)",
                  backgroundColor: panelBg,
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: theme.start }}
              >
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex-1 py-2.5 border rounded-full text-sm font-semibold"
                style={{
                  borderColor: "#DC262640",
                  color: "#DC2626",
                  backgroundColor: dark ? "#2A1416" : "#FEF2F2",
                }}
              >
                Delete
              </button>
              <button
                onClick={openEdit}
                className="flex-1 py-2.5 border rounded-full text-sm font-semibold"
                style={{
                  borderColor: panelBorder,
                  color: "var(--tm-text-2)",
                  backgroundColor: panelBg,
                }}
              >
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {saving && <LoadingOverlay />}
      {deleting && <LoadingOverlay />}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete recipe?"
          message={`Delete "${recipe.title}" permanently?`}
          confirmLabel="Delete"
          confirmColor="#DC2626"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [recipes, setRecipes] = useState<ApiRecipe[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [view, setView] = useState<View>("list");
  const [selected, setSelected] = useState<ApiRecipe | null>(null);

  async function loadRecipes() {
    if (!hasAccessToken()) {
      setRecipes([]);
      setLoadError("No API token. Please sign in again.");
      return;
    }
    setLoadError("");
    try {
      const mine = await listRecipes({ mine: true });
      setRecipes(mine);
    } catch (err) {
      setRecipes([]);
      setLoadError(errorMessage(err, "Unable to load recipes."));
    }
  }

  useEffect(() => {
    loadRecipes();
  }, []);

  function handleSaved(recipe: ApiRecipe) {
    setRecipes((prev) => [recipe, ...(prev ?? [])]);
    setView("list");
  }

  function openDetail(recipe: ApiRecipe) {
    setSelected(recipe);
    setView("detail");
  }

  function closeDetail() {
    setSelected(null);
    setView("list");
  }

  function handleUpdated(recipe: ApiRecipe) {
    setSelected(recipe);
    setRecipes((prev) =>
      (prev ?? []).map((r) =>
        r.id === recipe.id || r.id === selected?.id ? recipe : r,
      ),
    );
  }

  function handleDeleted() {
    setRecipes((prev) => (prev ?? []).filter((r) => r.id !== selected?.id));
    closeDetail();
  }

  if (recipes === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: "var(--tm-text-2)" }}>
          Loading recipes…
        </p>
      </div>
    );
  }

  if (view === "add") {
    return (
      <div className="h-full p-3">
        <AddRecipePanel onCancel={() => setView("list")} onSave={handleSaved} />
      </div>
    );
  }

  if (view === "detail" && selected) {
    return (
      <div className="h-full p-3">
        <RecipeDetailPanel
          recipe={selected}
          onBack={closeDetail}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-3">
      {/* Greeting hero */}
      <div
        className="rounded-2xl p-4 mb-3 shrink-0 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, #059669, #047857)",
          boxShadow: "0 6px 16px rgba(5,150,105,0.3)",
        }}
      >
        <div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.8)" }}>
            {greeting()}
          </p>
          <p className="text-xl font-extrabold text-white tracking-tight">
            My Recipes
          </p>
          <span
            className="inline-block mt-2.5 text-xs font-semibold text-white px-2.5 py-1 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
          >
            {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
          </span>
        </div>
        <button
          onClick={() => setView("add")}
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          aria-label="Add recipe"
        >
          <Plus size={24} color="white" />
        </button>
      </div>

      {loadError && (
        <div
          className="rounded-xl px-3.5 py-2.5 mb-3 text-xs shrink-0"
          style={{ backgroundColor: "#F43F5E14", color: "#F43F5E" }}
        >
          {loadError}
        </div>
      )}

      {recipes.length === 0 && !loadError ? (
        <EmptyState onAdd={() => setView("add")} />
      ) : (
        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pt-1 content-start">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={toCardData(recipe)}
              onTap={() => openDetail(recipe)}
              onAction={() => openDetail(recipe)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
