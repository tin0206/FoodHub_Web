"use client";

import { useEffect, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { searchRecipes, getDietaryRestrictions } from "@/lib/api/recipes";
import type { ApiRecipe } from "@/lib/api/types";
import { getLang } from "@/lib/i18n";
import { getOrEstimateMeta } from "@/lib/recipe-meta";
import { useStrings } from "@/lib/use-strings";
import { RecipeCard, type RecipeCardData } from "@/components/recipe/recipe-card";

const PAGE_SIZE = 24;
// The API's `visibility` query param isn't honored server-side, so we over-fetch and
// filter to public recipes client-side — a meal plan slot can't hold someone else's private recipe.
const FETCH_LIMIT = 60;

const MEAL_TYPE_CATEGORIES: [string, string][] = [
  ["🌅", "Breakfast"],
  ["🥗", "Lunch"],
  ["🍝", "Dinner"],
];

const HIDDEN_CATEGORIES = new Set(["Quick Meal", "Quick Meals"]);

const DIETARY_EMOJI: Record<string, string> = {
  Alcoholic: "🍸",
  Beverage: "🥤",
  "Dairy Free": "🥛",
  "Gluten Free": "🌾",
  "Nut Free": "🥜",
  Pescetarian: "🐟",
  Vegan: "🌱",
  Vegetarian: "🥦",
};

function toCardData(recipe: ApiRecipe): RecipeCardData {
  const meta = getOrEstimateMeta(recipe);
  return {
    id: recipe.id,
    name: recipe.title,
    imageUrl: recipe.image_url,
    labels: recipe.dietary_restrictions,
    cookingMinutes: meta.cookingMinutes,
    calories: meta.calories,
  };
}

/** Add-dish picker for a meal plan slot — search + category filters, same UX as the Search page. */
export function RecipePickerDialog({
  onPick, onClose,
}: { onPick: (recipe: ApiRecipe) => void; onClose: () => void }) {
  const t = useStrings();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dietaryOptions, setDietaryOptions] = useState<string[]>([]);
  const [dietaryReady, setDietaryReady] = useState(false);
  const [results, setResults] = useState<ApiRecipe[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getDietaryRestrictions()
      .then((opts) => {
        if (!cancelled) setDietaryOptions(opts);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setDietaryReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!dietaryReady) return;
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    const dietary =
      selectedCategory && dietaryOptions.includes(selectedCategory) ? selectedCategory : undefined;
    const q = debouncedQuery || (selectedCategory && !dietary ? selectedCategory : undefined);
    searchRecipes({ q, dietaryRestriction: dietary, limit: FETCH_LIMIT, lang: getLang(), signal: controller.signal })
      .then((res) => {
        if (!cancelled) {
          setResults(res.recipes.filter((r) => r.visibility === "public").slice(0, PAGE_SIZE));
        }
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [debouncedQuery, selectedCategory, dietaryOptions, dietaryReady]);

  function toggleCategory(category: string) {
    setSelectedCategory((prev) => (prev === category ? null : category));
  }

  const mealTypeLabels = new Set(MEAL_TYPE_CATEGORIES.map(([, label]) => label));
  const categoryChips: [string, string][] = [
    ...MEAL_TYPE_CATEGORIES,
    ...dietaryOptions
      .filter((d) => !mealTypeLabels.has(d) && !HIDDEN_CATEGORIES.has(d))
      .map((d): [string, string] => [DIETARY_EMOJI[d] ?? "🍽️", d]),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl flex flex-col"
        style={{ backgroundColor: "var(--tm-surface)", maxHeight: "88vh" }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <p className="text-sm font-bold" style={{ color: "var(--tm-text)" }}>{t.addDish}</p>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ color: "var(--tm-text-2)" }}
            aria-label={t.cancel}
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 pb-3 shrink-0">
          <div className="relative mb-3">
            <span
              className="absolute inset-y-0 left-3 flex items-center pointer-events-none"
              style={{ color: "var(--tm-text-3)" }}
            >
              <Search size={14} />
            </span>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchHint}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none"
              style={{ backgroundColor: "var(--tm-subtle)", color: "var(--tm-text)" }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {!dietaryReady
              ? Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className="inline-block rounded-full animate-pulse"
                    style={{ width: 76 + (i % 3) * 18, height: 26, backgroundColor: "var(--tm-subtle)" }}
                  />
                ))
              : categoryChips.map(([emoji, label]) => {
                  const active = selectedCategory === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleCategory(label)}
                      className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors"
                      style={
                        active
                          ? { backgroundColor: "#059669", color: "white" }
                          : { backgroundColor: "var(--tm-subtle)", color: "var(--tm-text-2)" }
                      }
                    >
                      <span>{emoji}</span>
                      {t.categoryDisplay(label)}
                    </button>
                  );
                })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <p className="py-8 text-xs text-center" style={{ color: "var(--tm-text-3)" }}>{t.loading}</p>
          ) : !results || results.length === 0 ? (
            <p className="py-8 text-xs text-center" style={{ color: "var(--tm-text-3)" }}>{t.noSearchResultsShort}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {results.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={toCardData(recipe)}
                  onTap={() => onPick(recipe)}
                  onAction={() => onPick(recipe)}
                  actionIcon={Plus}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
