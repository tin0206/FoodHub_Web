"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useDarkMode } from "@/lib/use-dark-mode";
import { hasAccessToken, getCurrentUser } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { searchRecipes, getDietaryRestrictions } from "@/lib/api/recipes";
import type { ApiRecipe } from "@/lib/api/types";
import { getOrEstimateMeta } from "@/lib/recipe-meta";
import { buildRecipeSlug } from "@/lib/recipe-slug";
import {
  RecipeCard,
  type RecipeCardData,
} from "@/components/recipe/recipe-card";

// ─── Constants (mirrors mobile SearchScreen) ─────────────────────────────────

const MEAL_TYPE_CATEGORIES: [string, string][] = [
  ["🌅", "Breakfast"],
  ["🥗", "Lunch"],
  ["🍝", "Dinner"],
  ["⚡", "Quick Meals"],
];

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

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof TypeError && /fetch/i.test(err.message)) {
    return "Could not reach the server. Please try again.";
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

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

// ─── Shared bits (mirrors home/page.tsx styling) ─────────────────────────────

function panelShadow(dark: boolean) {
  return dark
    ? "0 8px 20px rgba(0,0,0,0.28)"
    : "0 3px 10px rgba(12,26,20,0.06)";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const dark = useDarkMode();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dietaryOptions, setDietaryOptions] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<ApiRecipe[] | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const [dietaryReady, setDietaryReady] = useState(false);

  const hasFilter = debouncedQuery.trim() !== "" || selectedCategory !== null;

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
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!dietaryReady) return;
    if (!hasAccessToken()) {
      setRecipes([]);
      setLoading(false);
      setLoadError("No API token. Please sign in again.");
      return;
    }
    let cancelled = false;
    async function run() {
      setLoading(true);
      setLoadError("");
      try {
        const dietary =
          selectedCategory && dietaryOptions.includes(selectedCategory)
            ? selectedCategory
            : undefined;
        const q =
          debouncedQuery ||
          (selectedCategory && !dietary ? selectedCategory : undefined);
        const result = await searchRecipes({
          q,
          dietaryRestriction: dietary,
          limit: hasFilter ? 100 : 50,
        });
        if (cancelled) return;
        const currentUserId = getCurrentUser()?.id;
        const catalogOnly = result.recipes.filter(
          (r) => r.created_by == null || String(r.created_by) !== currentUserId,
        );
        setRecipes(catalogOnly);
        setTotalCount(
          result.totalCount - (result.recipes.length - catalogOnly.length),
        );
      } catch (err) {
        if (cancelled) return;
        setRecipes([]);
        setLoadError(errorMessage(err, "Unable to search recipes."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [
    debouncedQuery,
    selectedCategory,
    dietaryOptions,
    retryToken,
    dietaryReady,
  ]);

  function toggleCategory(category: string) {
    setSelectedCategory((prev) => (prev === category ? null : category));
  }

  function openDetail(recipe: ApiRecipe) {
    router.push(`/search/${buildRecipeSlug(recipe.id, recipe.title)}`);
  }

  const mealTypeLabels = new Set(
    MEAL_TYPE_CATEGORIES.map(([, label]) => label),
  );
  const categoryChips: [string, string][] = [
    ...MEAL_TYPE_CATEGORIES,
    ...dietaryOptions
      .filter((d) => !mealTypeLabels.has(d))
      .map((d): [string, string] => [DIETARY_EMOJI[d] ?? "🍽️", d]),
  ];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <h1
        className="text-xl font-bold mb-0.5"
        style={{ color: "var(--tm-text)" }}
      >
        Search Recipes
      </h1>
      <p className="text-sm mb-4" style={{ color: "var(--tm-text-2)" }}>
        Find the perfect recipe for your next meal
      </p>

      {/* Search bar */}
      <div className="relative mb-5">
        <span
          className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none"
          style={{ color: "var(--tm-text-3)" }}
        >
          <Search size={16} />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by recipe name or ingredient…"
          className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{
            backgroundColor: dark ? "#1E1E1E" : "white",
            boxShadow: panelShadow(dark),
            color: "var(--tm-text)",
          }}
        />
      </div>

      {/* Category chips */}
      <p className="text-xs mb-2.5" style={{ color: "var(--tm-text-3)" }}>
        Popular categories
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        {categoryChips.map(([emoji, label]) => {
          const active = selectedCategory === label;
          return (
            <button
              key={label}
              onClick={() => toggleCategory(label)}
              className="flex items-center gap-1.5 text-[11.5px] font-medium px-3 py-1.5 rounded-full transition-colors"
              style={
                active
                  ? {
                      backgroundColor: "#059669",
                      color: "white",
                      boxShadow: "0 4px 12px rgba(5,150,105,0.3)",
                    }
                  : {
                      backgroundColor: dark ? "#1E1E1E" : "white",
                      color: "var(--tm-text-2)",
                      boxShadow: panelShadow(dark),
                    }
              }
            >
              <span>{emoji}</span>
              {label}
            </button>
          );
        })}
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs" style={{ color: "var(--tm-text-3)" }}>
          {hasFilter ? "Results" : "Recent recipes"}
        </p>
        {hasFilter && (
          <p className="text-xs font-medium" style={{ color: "#059669" }}>
            {totalCount} result{totalCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {loadError && (
        <div
          className="rounded-xl px-3.5 py-2.5 mb-3 text-xs flex items-center justify-between gap-2"
          style={{ backgroundColor: "#F43F5E14", color: "#F43F5E" }}
        >
          <span>{loadError}</span>
          <button
            onClick={() => setRetryToken((t) => t + 1)}
            className="font-semibold shrink-0 underline"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <p
          className="text-sm py-10 text-center"
          style={{ color: "var(--tm-text-2)" }}
        >
          Searching…
        </p>
      ) : recipes && recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search size={32} color="var(--tm-text-3)" className="mb-3" />
          <p
            className="text-sm font-medium mb-1"
            style={{ color: "var(--tm-text)" }}
          >
            No recipes found
          </p>
          <p className="text-xs" style={{ color: "var(--tm-text-3)" }}>
            Try a different search term or category
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {(recipes ?? []).map((recipe) => (
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
