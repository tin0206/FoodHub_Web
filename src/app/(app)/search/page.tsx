"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useDarkMode } from "@/lib/use-dark-mode";
import { useLang } from "@/lib/use-lang";
import { getLang } from "@/lib/i18n";
import { useStrings } from "@/lib/use-strings";
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

const PAGE_SIZE = 30;

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

// ─── Persisted filter/pagination state (survives navigating to a recipe and back) ──

const SEARCH_STATE_KEY = "fh_search_state";

interface StoredSearchState {
  query: string;
  selectedCategory: string | null;
  page: number;
}

function loadSearchState(): StoredSearchState {
  if (typeof window === "undefined") return { query: "", selectedCategory: null, page: 0 };
  try {
    const raw = sessionStorage.getItem(SEARCH_STATE_KEY);
    if (!raw) return { query: "", selectedCategory: null, page: 0 };
    const parsed = JSON.parse(raw) as Partial<StoredSearchState>;
    return {
      query: typeof parsed.query === "string" ? parsed.query : "",
      selectedCategory: typeof parsed.selectedCategory === "string" ? parsed.selectedCategory : null,
      page: typeof parsed.page === "number" && parsed.page >= 0 ? parsed.page : 0,
    };
  } catch {
    return { query: "", selectedCategory: null, page: 0 };
  }
}

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
  const t = useStrings();
  const lang = useLang();
  const [query, setQuery] = useState(() => loadSearchState().query);
  const [debouncedQuery, setDebouncedQuery] = useState(() => loadSearchState().query.trim());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => loadSearchState().selectedCategory);
  const [dietaryOptions, setDietaryOptions] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<ApiRecipe[] | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [page, setPage] = useState(() => loadSearchState().page);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const [dietaryReady, setDietaryReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasFilter = debouncedQuery.trim() !== "" || selectedCategory !== null;

  // Persist filter + pagination so returning from a recipe detail (or a fresh
  // tab reopen within the same session) restores exactly where the user left off.
  useEffect(() => {
    const state: StoredSearchState = { query, selectedCategory, page };
    sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state));
  }, [query, selectedCategory, page]);

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
    const controller = new AbortController();
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
          skip: page * PAGE_SIZE,
          limit: PAGE_SIZE,
          lang: getLang(),
          signal: controller.signal,
        });
        if (cancelled) return;
        const currentUserId = getCurrentUser()?.id;
        const catalogOnly = result.recipes.filter(
          (r) => r.created_by == null || String(r.created_by) !== currentUserId,
        );
        setRecipes(catalogOnly);
        setTotalCount(result.totalCount);
        setHasNextPage(page * PAGE_SIZE + result.recipes.length < result.totalCount);
      } catch (err) {
        if (cancelled) return;
        setRecipes([]);
        setHasNextPage(false);
        setLoadError(errorMessage(err, t.unableToSearch));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    debouncedQuery,
    selectedCategory,
    dietaryOptions,
    retryToken,
    dietaryReady,
    page,
    lang,
  ]);

  // Scroll results back into view whenever the page changes.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  function toggleCategory(category: string) {
    setPage(0);
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
      .filter((d) => !mealTypeLabels.has(d) && !HIDDEN_CATEGORIES.has(d))
      .map((d): [string, string] => [DIETARY_EMOJI[d] ?? "🍽️", d]),
  ];

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto p-4 md:p-6">
      <h1
        className="text-xl font-bold mb-0.5"
        style={{ color: "var(--tm-text)" }}
      >
        {t.searchRecipesTitle}
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
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder={t.searchHint}
          className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{
            backgroundColor: dark ? "#1E1E1E" : "white",
            boxShadow: panelShadow(dark),
            color: "var(--tm-text)",
          }}
        />
      </div>

      {/* Category chips — wait until every option is fetched so the row doesn't
          pop in twice (meal types immediately, dietary labels a moment later). */}
      <p className="text-xs mb-2.5" style={{ color: "var(--tm-text-3)" }}>
        {t.popularCategories}
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        {!dietaryReady
          ? Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className="inline-block rounded-full animate-pulse"
                style={{
                  width: 76 + (i % 3) * 18,
                  height: 28,
                  backgroundColor: dark ? "#1E1E1E" : "var(--tm-subtle)",
                }}
              />
            ))
          : categoryChips.map(([emoji, label]) => {
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
                  {t.categoryDisplay(label)}
                </button>
              );
            })}
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs" style={{ color: "var(--tm-text-3)" }}>
          {hasFilter ? "Results" : t.recentRecipes}
        </p>
        <p className="text-xs font-medium" style={{ color: "#059669" }}>
          {t.resultCount(totalCount)}
        </p>
      </div>

      {loadError && (
        <div
          className="rounded-xl px-3.5 py-2.5 mb-3 text-xs flex items-center justify-between gap-2"
          style={{ backgroundColor: "#F43F5E14", color: "#F43F5E" }}
        >
          <span>{loadError}</span>
          <button
            onClick={() => setRetryToken((n) => n + 1)}
            className="font-semibold shrink-0 underline"
          >
            {t.retry}
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
        <>
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

          {(page > 0 || hasNextPage) && (
            <div className="flex items-center justify-between mt-5">
              <p className="text-xs" style={{ color: "var(--tm-text-3)" }}>
                Page {page + 1} of {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                  className="flex items-center gap-1 text-xs font-semibold px-3.5 py-2 rounded-full disabled:opacity-40"
                  style={{ backgroundColor: dark ? "#1E1E1E" : "white", color: "var(--tm-text-2)", boxShadow: panelShadow(dark) }}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasNextPage || loading}
                  className="flex items-center gap-1 text-xs font-semibold px-3.5 py-2 rounded-full text-white disabled:opacity-40"
                  style={{ backgroundColor: "#059669" }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
