"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { searchRecipes, getDietaryRestrictions } from "@/lib/api/recipes";
import { ensureDemoSession } from "@/lib/demo-session";
import type { ApiRecipe } from "@/lib/api/types";
import { getOrEstimateMeta } from "@/lib/recipe-meta";
import { buildRecipeSlug } from "@/lib/recipe-slug";
import {
  RecipeCard,
  type RecipeCardData,
} from "@/components/recipe/recipe-card";

const PAGE_SIZE = 24;

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

export default function PublicRecipesPage() {
  const router = useRouter();
  const tokenRef = useRef<string | null>(null);

  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [sessionRetryToken, setSessionRetryToken] = useState(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    null,
  );
  const [dietaryOptions, setDietaryOptions] = useState<string[]>([]);
  const [dietaryReady, setDietaryReady] = useState(false);
  const [recipes, setRecipes] = useState<ApiRecipe[] | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  const hasFilter = debouncedQuery.trim() !== "" || selectedCategory !== null;

  // Guest browsing session — same disposable-account mechanism as the landing
  // page's AI demo, so recipe search/detail work without asking for sign-in.
  // Keyed on sessionRetryToken (not a startedRef "run once" flag) so a failed
  // attempt — e.g. a cold-started API — can be retried without a full reload.
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setSessionError("");
    (async () => {
      try {
        const session = await ensureDemoSession();
        if (cancelled) return;
        tokenRef.current = session.token;
        setReady(true);
      } catch (err) {
        if (cancelled) return;
        setReady(true);
        setSessionError(
          err instanceof Error
            ? err.message
            : "Could not start a browsing session. Is the API running?",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionRetryToken]);

  useEffect(() => {
    if (!ready || !tokenRef.current) return;
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
  }, [ready]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const token = tokenRef.current;
    if (!ready || !token) return;
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
        const result = await searchRecipes({
          q: debouncedQuery || (selectedCategory && !dietary ? selectedCategory : undefined),
          dietaryRestriction: dietary,
          skip: page * PAGE_SIZE,
          limit: PAGE_SIZE,
          token: token!,
          signal: controller.signal,
        });
        if (cancelled) return;
        setRecipes(result.recipes);
        setTotalCount(result.totalCount);
        setHasNextPage(
          page * PAGE_SIZE + result.recipes.length < result.totalCount,
        );
      } catch (err) {
        if (cancelled) return;
        setRecipes([]);
        setHasNextPage(false);
        setLoadError(errorMessage(err, "Unable to search recipes."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [ready, debouncedQuery, selectedCategory, dietaryOptions, page, retryToken]);

  useEffect(() => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page]);

  function toggleCategory(category: string) {
    setPage(0);
    setSelectedCategory((prev) => (prev === category ? null : category));
  }

  function openDetail(recipe: ApiRecipe) {
    router.push(`/recipes/${buildRecipeSlug(recipe.id, recipe.title)}`);
  }

  const mealTypeLabels = new Set(MEAL_TYPE_CATEGORIES.map(([, label]) => label));
  const categoryChips: [string, string][] = [
    ...MEAL_TYPE_CATEGORIES,
    ...dietaryOptions
      .filter((d) => !mealTypeLabels.has(d))
      .map((d): [string, string] => [DIETARY_EMOJI[d] ?? "🍽️", d]),
  ];

  return (
    <div className="landing-page-content" style={{ maxWidth: "72rem" }}>
      <h1
        className="landing-section-title"
        style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.1rem)" }}
      >
        Browse recipes
      </h1>
      <p className="landing-section-copy mb-6">
        Search FoodHub&apos;s recipe library and open any recipe for full
        ingredients and instructions — free to try, no account needed.
      </p>

      {!ready ? (
        <p className="text-sm py-10 text-center" style={{ color: "var(--tm-text-2)" }}>
          Starting your browsing session…
        </p>
      ) : sessionError ? (
        <div
          className="rounded-xl px-3.5 py-2.5 text-sm flex items-center justify-between gap-2"
          style={{ backgroundColor: "#F43F5E14", color: "#F43F5E" }}
        >
          <span>{sessionError}</span>
          <button
            onClick={() => setSessionRetryToken((n) => n + 1)}
            className="font-semibold shrink-0 underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Search bar */}
          <div className="relative mb-5 max-w-xl">
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
              placeholder="Search recipes, ingredients..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{
                backgroundColor: "white",
                boxShadow: "0 3px 10px rgba(12,26,20,0.06)",
                color: "var(--tm-text)",
              }}
            />
          </div>

          {/* Category chips — wait until every option is fetched so the row
              doesn't pop in twice (meal types immediately, dietary labels later). */}
          <div className="flex flex-wrap gap-2 mb-6">
            {!dietaryReady
              ? Array.from({ length: 6 }).map((_, i) => (
                  <span
                    key={i}
                    className="inline-block rounded-full animate-pulse"
                    style={{
                      width: 76 + (i % 3) * 18,
                      height: 28,
                      backgroundColor: "var(--tm-subtle)",
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
                              backgroundColor: "white",
                              color: "var(--tm-text-2)",
                              boxShadow: "0 3px 10px rgba(12,26,20,0.06)",
                            }
                      }
                    >
                      <span>{emoji}</span>
                      {label}
                    </button>
                  );
                })}
          </div>

          <div ref={resultsRef} className="flex items-center justify-between mb-3">
            <p className="text-xs" style={{ color: "var(--tm-text-3)" }}>
              {hasFilter ? "Results" : "All recipes"}
            </p>
            <p className="text-xs font-medium" style={{ color: "#059669" }}>
              {totalCount} recipe{totalCount === 1 ? "" : "s"}
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
                Retry
              </button>
            </div>
          )}

          {loading && recipes === null ? (
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
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
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
                <div className="flex items-center justify-between mt-6">
                  <p className="text-xs" style={{ color: "var(--tm-text-3)" }}>
                    Page {page + 1} of{" "}
                    {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0 || loading}
                      className="flex items-center gap-1 text-xs font-semibold px-3.5 py-2 rounded-full disabled:opacity-40"
                      style={{
                        backgroundColor: "white",
                        color: "var(--tm-text-2)",
                        boxShadow: "0 3px 10px rgba(12,26,20,0.06)",
                      }}
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
        </>
      )}
    </div>
  );
}
