"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { searchRecipes } from "@/lib/api/recipes";
import { getTodaySuggestions } from "@/lib/api/meals";
import type { ApiRecipe } from "@/lib/api/types";
import { getLang } from "@/lib/i18n";
import { useStrings } from "@/lib/use-strings";
import { RecipeImageHeader } from "@/components/recipe/recipe-image-header";

/** Add-dish picker for a meal plan slot — today's suggestions first, falls back to search. */
export function RecipePickerDialog({
  onPick, onClose,
}: { onPick: (recipe: ApiRecipe) => void; onClose: () => void }) {
  const t = useStrings();
  const [suggestions, setSuggestions] = useState<ApiRecipe[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<ApiRecipe[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTodaySuggestions({ lang: getLang() })
      .then((data) => {
        if (cancelled || data.status !== "ready") return;
        setSuggestions([...data.breakfast, ...data.lunch, ...data.dinner]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults(null);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    setSearching(true);
    searchRecipes({ q: debouncedQuery, limit: 20, lang: getLang(), signal: controller.signal })
      .then((res) => {
        if (!cancelled) setResults(res.recipes);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [debouncedQuery]);

  const showingSearch = debouncedQuery !== "";
  const list = showingSearch ? results ?? [] : suggestions;

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
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl flex flex-col"
        style={{ backgroundColor: "var(--tm-surface)", maxHeight: "80vh" }}
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
          <div className="relative">
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
              placeholder={t.addFromSearch}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none"
              style={{ backgroundColor: "var(--tm-subtle)", color: "var(--tm-text)" }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {!showingSearch && suggestions.length > 0 && (
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--tm-text-3)" }}>
              {t.recommendedRecipesTitle}
            </p>
          )}
          {showingSearch && searching ? (
            <p className="px-2 py-6 text-xs text-center" style={{ color: "var(--tm-text-3)" }}>{t.loading}</p>
          ) : list.length === 0 ? (
            <p className="px-2 py-6 text-xs text-center" style={{ color: "var(--tm-text-3)" }}>
              {showingSearch ? t.noSearchResultsShort : t.noSuggestionsForMeal}
            </p>
          ) : (
            list.map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                onClick={() => onPick(recipe)}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors"
                style={{ color: "var(--tm-text)" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--tm-subtle)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0">
                  <RecipeImageHeader imageUrl={recipe.image_url} cardId={recipe.id} labels={recipe.dietary_restrictions} height={44} />
                </div>
                <span className="text-sm truncate">{recipe.title}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
