"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, ChevronRight, Loader2, Moon, Sun, UtensilsCrossed, X } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { getMealPlan, replaceMealPlan, localIsoDate, slotDisplayLabel, type MealPlan, type MealSlot } from "@/lib/api/meals";
import { getLang } from "@/lib/i18n";
import type { ApiRecipe } from "@/lib/api/types";
import { useDarkMode } from "@/lib/use-dark-mode";
import { useStrings } from "@/lib/use-strings";
import { RecipeImageHeader } from "@/components/recipe/recipe-image-header";

function slotVisual(slotKey: string): { icon: LucideIcon; color: string } {
  switch (slotKey) {
    case "breakfast":
      return { icon: Sun, color: "#F59E0B" };
    case "lunch":
      return { icon: UtensilsCrossed, color: "#059669" };
    case "dinner":
      return { icon: Moon, color: "#6366F1" };
    default:
      return { icon: UtensilsCrossed, color: "#059669" };
  }
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof Error) return err.message;
  return fallback;
}

/** Popup for "+" on a recipe card — pick which meal-plan slot to add it to. */
export function AddToPlanDialog({
  recipe, onClose, onAdded,
}: { recipe: ApiRecipe; onClose: () => void; onAdded?: () => void }) {
  const dark = useDarkMode();
  const t = useStrings();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingSlotId, setAddingSlotId] = useState<number | null>(null);
  const [addedSlot, setAddedSlot] = useState<MealSlot | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMealPlan(localIsoDate(), getLang())
      .then((data) => {
        if (!cancelled) setPlan(data);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, t.unableToLoadMealPlan));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!addedSlot) return;
    const timer = window.setTimeout(onClose, 1400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addedSlot]);

  async function handlePick(slot: MealSlot) {
    if (!plan || addingSlotId != null) return;
    setAddingSlotId(slot.id);
    setError("");
    try {
      const slots = plan.slots.map((s) =>
        s.id === slot.id ? { ...s, items: [...s.items, { id: 0, recipe_id: recipe.id, servings: 1 }] } : s,
      );
      await replaceMealPlan({ ...plan, slots }, localIsoDate(), getLang());
      setAddedSlot(slot);
      onAdded?.();
    } catch (err) {
      setError(errorMessage(err, t.unableToLoadMealPlan));
    } finally {
      setAddingSlotId(null);
    }
  }

  const panelBorder = dark ? "#2A2A2A" : "var(--tm-border-i)";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--tm-surface)" }}
      >
        {addedSlot ? (
          <div className="flex flex-col items-center text-center px-6 py-10">
            <span
              className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: `${slotVisual(addedSlot.slot_key).color}1F` }}
            >
              <CheckCircle2 size={34} color={slotVisual(addedSlot.slot_key).color} />
            </span>
            <p className="text-sm font-bold" style={{ color: "var(--tm-text)" }}>
              {t.addedToPlanMessage(slotDisplayLabel(addedSlot, t))}
            </p>
            <p className="text-xs mt-1 truncate max-w-full" style={{ color: "var(--tm-text-3)" }}>
              {recipe.title}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                <RecipeImageHeader
                  imageUrl={recipe.image_url}
                  cardId={recipe.id}
                  labels={recipe.dietary_restrictions}
                  height={48}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px]" style={{ color: "var(--tm-text-3)" }}>{t.addToPlanLabel}</p>
                <p className="text-sm font-bold truncate" style={{ color: "var(--tm-text)" }}>{recipe.title}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ color: "var(--tm-text-2)" }}
                aria-label={t.cancel}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ borderTop: `1px solid ${panelBorder}` }} />

            <div className="p-3">
              {loading ? (
                <p className="text-sm py-6 text-center" style={{ color: "var(--tm-text-2)" }}>{t.loading}</p>
              ) : !plan ? (
                <p className="text-sm py-6 text-center" style={{ color: "#DC2626" }}>{error}</p>
              ) : (
                <div className="space-y-1.5">
                  {plan.slots.map((slot) => {
                    const isAdding = addingSlotId === slot.id;
                    const { icon: SlotIcon, color } = slotVisual(slot.slot_key);
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => handlePick(slot)}
                        disabled={addingSlotId != null}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors disabled:opacity-60"
                        style={{ backgroundColor: isAdding ? `${color}14` : "transparent" }}
                        onMouseEnter={(e) => {
                          if (!isAdding) e.currentTarget.style.backgroundColor = "var(--tm-subtle)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isAdding) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <span
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${color}1A` }}
                        >
                          <SlotIcon size={16} color={color} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold truncate" style={{ color: "var(--tm-text)" }}>
                            {slotDisplayLabel(slot, t)}
                          </span>
                        </span>
                        {isAdding ? (
                          <Loader2 size={16} className="animate-spin" color={color} />
                        ) : (
                          <ChevronRight size={16} color="var(--tm-text-3)" />
                        )}
                      </button>
                    );
                  })}
                  {error && <p className="text-xs mt-1 px-1" style={{ color: "#DC2626" }}>{error}</p>}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
