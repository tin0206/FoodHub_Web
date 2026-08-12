"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Heart,
  ArrowLeft,
  Clock,
  Flame,
  ShoppingBasket,
  ListOrdered,
  Tag,
  Utensils,
} from "lucide-react";
import { useDarkMode } from "@/lib/use-dark-mode";
import { hasAccessToken, getCurrentUser } from "@/lib/auth";
import { ApiError, resolveMediaUrl } from "@/lib/api-client";
import { searchRecipes, getDietaryRestrictions } from "@/lib/api/recipes";
import {
  listFavorites,
  addFavorite,
  deleteFavorite,
} from "@/lib/api/favorites";
import type { ApiRecipe } from "@/lib/api/types";
import { getOrEstimateMeta } from "@/lib/recipe-meta";
import { recipeCardTheme } from "@/components/recipe/recipe-card-theme";
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

function SectionCard({
  icon,
  title,
  accent,
  children,
}: {
  icon?: React.ReactNode;
  title?: string;
  accent: string;
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

// ─── Recipe detail (view + save) ─────────────────────────────────────────────

function SearchRecipeDetail({
  recipe,
  isSaved,
  onToggleSave,
  onBack,
}: {
  recipe: ApiRecipe;
  isSaved: boolean;
  onToggleSave: () => void;
  onBack: () => void;
}) {
  const dark = useDarkMode();
  const theme = recipeCardTheme(recipe.id, recipe.dietary_restrictions);
  const meta = getOrEstimateMeta(recipe);
  const image = resolveMediaUrl(recipe.image_url);
  const panelBg = dark ? "#1E1E1E" : "#F3F4F6";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-1 pb-3 shrink-0">
        <button
          onClick={onBack}
          className="p-1"
          style={{ color: "var(--tm-text-2)" }}
        >
          <ArrowLeft size={18} />
        </button>
        <p
          className="text-sm font-semibold truncate flex-1"
          style={{ color: "var(--tm-text)" }}
        >
          {recipe.title}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-1 pb-3">
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
            <Clock size={14} color={theme.start} /> {meta.cookingMinutes} min
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
                  <p className="text-sm" style={{ color: "var(--tm-text-2)" }}>
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

      <div
        className="border-t px-1 pt-3 shrink-0"
        style={{ borderColor: "var(--tm-border)" }}
      >
        <button
          onClick={onToggleSave}
          className="w-full py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2"
          style={
            isSaved
              ? { backgroundColor: panelBg, color: "#DC2626" }
              : { backgroundColor: theme.start, color: "white" }
          }
        >
          <Heart
            size={16}
            fill={isSaved ? "#DC2626" : "none"}
            color={isSaved ? "#DC2626" : "white"}
          />
          {isSaved ? "Saved" : "Save Recipe"}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const dark = useDarkMode();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dietaryOptions, setDietaryOptions] = useState<string[]>([]);
  const [favoriteIdByRecipe, setFavoriteIdByRecipe] = useState<
    Record<number, number>
  >({});
  const [recipes, setRecipes] = useState<ApiRecipe[] | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<ApiRecipe | null>(null);
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

  async function loadFavoriteIds() {
    if (!hasAccessToken()) return;
    try {
      const favs = await listFavorites();
      setFavoriteIdByRecipe(
        Object.fromEntries(favs.map((f) => [f.recipe_id, f.id])),
      );
    } catch {}
  }

  useEffect(() => {
    loadFavoriteIds();
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
    setSelected(recipe);
  }

  async function toggleSave() {
    if (!selected) return;
    const recipe = selected;
    const favId = favoriteIdByRecipe[recipe.id];
    try {
      if (favId != null) {
        await deleteFavorite(favId);
        setFavoriteIdByRecipe((prev) => {
          const next = { ...prev };
          delete next[recipe.id];
          return next;
        });
      } else {
        const fav = await addFavorite(recipe.id);
        setFavoriteIdByRecipe((prev) => ({ ...prev, [recipe.id]: fav.id }));
      }
    } catch (err) {
      setLoadError(errorMessage(err, "Unable to update favorites."));
    }
  }

  if (selected) {
    return (
      <div className="h-full p-3">
        <SearchRecipeDetail
          recipe={selected}
          isSaved={favoriteIdByRecipe[selected.id] != null}
          onToggleSave={toggleSave}
          onBack={() => setSelected(null)}
        />
      </div>
    );
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
