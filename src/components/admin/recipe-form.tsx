"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Clock, Flame, ShoppingBasket, ListOrdered, Tag, ImagePlus } from "lucide-react";
import { ADMIN_ACCENT_LIGHT, ADMIN_ACCENT_DARK, AVAILABLE_LABELS, saveAdminRecipe, type AdminRecipe } from "@/lib/admin";
import { useDarkMode } from "@/lib/use-dark-mode";

function FieldCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-3.5"
      style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }}
    >
      {children}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AdminRecipeForm({ initial }: { initial?: AdminRecipe }) {
  const router = useRouter();
  const isDark = useDarkMode();
  const accent = isDark ? ADMIN_ACCENT_DARK : ADMIN_ACCENT_LIGHT;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [minutes, setMinutes] = useState(initial ? String(initial.cookingMinutes) : "");
  const [calories, setCalories] = useState(initial ? String(initial.calories) : "");
  const [ingredients, setIngredients] = useState<string[]>(
    initial && initial.ingredientLines.length > 0 ? initial.ingredientLines : [""],
  );
  const [steps, setSteps] = useState<string[]>(
    initial && initial.stepLines.length > 0 ? initial.stepLines : [""],
  );
  const [labels, setLabels] = useState<Set<string>>(new Set(initial?.labels ?? []));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateAt(list: string[], set: (v: string[]) => void, i: number, value: string) {
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

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImageUrl(await readFileAsDataUrl(file));
  }

  async function handleSave() {
    if (saving) return;
    const trimmedTitle = title.trim();
    const cleanIngredients = ingredients.map((s) => s.trim()).filter(Boolean);
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean);
    const minutesNum = Number.parseInt(minutes, 10);
    const caloriesNum = Number.parseInt(calories, 10);

    if (
      !trimmedTitle ||
      cleanIngredients.length === 0 ||
      cleanSteps.length === 0 ||
      !Number.isFinite(minutesNum) ||
      !Number.isFinite(caloriesNum) ||
      minutesNum <= 0 ||
      caloriesNum <= 0
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    setError(null);
    setSaving(true);
    const saved = saveAdminRecipe({
      id: initial?.id,
      title: trimmedTitle,
      cookingMinutes: minutesNum,
      calories: caloriesNum,
      ingredientLines: cleanIngredients,
      stepLines: cleanSteps,
      labels: [...labels],
      imageUrl: imageUrl || undefined,
    });
    router.push(`/admin/recipes/${saved.id}`);
  }

  const inputStyle = { color: "var(--tm-text)" } as const;
  const hintStyle = { color: "var(--tm-text-3)" } as const;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="space-y-2.5">
        <FieldCard>
          <div className="flex items-center gap-1.5 mb-2">
            <ImagePlus size={15} color={accent} />
            <span className="text-[13px] font-bold" style={{ color: "var(--tm-text)" }}>Photo</span>
          </div>
          {imageUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Recipe" className="w-full h-40 object-cover rounded-xl" />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                aria-label="Remove photo"
              >
                <X size={14} color="white" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-28 rounded-xl flex flex-col items-center justify-center gap-1.5 border border-dashed"
              style={{ borderColor: "var(--tm-border-i)", color: "var(--tm-text-3)" }}
            >
              <ImagePlus size={22} />
              <span className="text-xs font-medium">Upload a photo</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </FieldCard>

        <FieldCard>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Recipe name…"
            className="w-full text-[17px] font-bold bg-transparent focus:outline-none tracking-tight"
            style={inputStyle}
          />
        </FieldCard>

        <FieldCard>
          <div className="flex items-center gap-2 flex-wrap">
            <Clock size={16} color={accent} />
            <input
              value={minutes}
              onChange={(e) => setMinutes(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0"
              className="w-14 text-sm bg-transparent focus:outline-none"
              style={inputStyle}
            />
            <span className="text-xs" style={hintStyle}>min</span>
            <span className="w-4" />
            <Flame size={16} color={accent} />
            <input
              value={calories}
              onChange={(e) => setCalories(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0"
              className="w-14 text-sm bg-transparent focus:outline-none"
              style={inputStyle}
            />
            <span className="text-xs" style={hintStyle}>cal</span>
          </div>
        </FieldCard>

        <FieldCard>
          <div className="flex items-center gap-1.5 mb-2">
            <ShoppingBasket size={15} color={accent} />
            <span className="text-[13px] font-bold" style={{ color: "var(--tm-text)" }}>Ingredients</span>
          </div>
          <div className="space-y-1.5">
            {ingredients.map((val, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />
                <input
                  value={val}
                  onChange={(e) => updateAt(ingredients, setIngredients, i, e.target.value)}
                  placeholder={`Ingredient ${i + 1}`}
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
            <Plus size={14} /> Add ingredient
          </button>
        </FieldCard>

        <FieldCard>
          <div className="flex items-center gap-1.5 mb-2">
            <ListOrdered size={15} color={accent} />
            <span className="text-[13px] font-bold" style={{ color: "var(--tm-text)" }}>Instructions</span>
          </div>
          <div className="space-y-1.5">
            {steps.map((val, i) => (
              <div key={i} className="flex items-start gap-2">
                <span
                  className="w-5.5 h-5.5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                  style={{ backgroundColor: `${accent}2E`, color: accent }}
                >
                  {i + 1}
                </span>
                <textarea
                  value={val}
                  onChange={(e) => updateAt(steps, setSteps, i, e.target.value)}
                  placeholder={`Step ${i + 1}…`}
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
            <Plus size={14} /> Add step
          </button>
        </FieldCard>

        <FieldCard>
          <div className="flex items-center gap-1.5 mb-2">
            <Tag size={15} color={accent} />
            <span className="text-[13px] font-bold" style={{ color: "var(--tm-text)" }}>Labels</span>
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
            style={{ backgroundColor: "var(--tm-subtle)", color: "var(--tm-text)" }}
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
            {initial ? "Save Changes" : "Save Recipe"}
          </button>
        </div>
      </div>
    </div>
  );
}
