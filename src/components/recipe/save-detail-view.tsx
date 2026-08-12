"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { getRecipe } from "@/lib/api/recipes";
import { listFavorites, addFavorite, deleteFavorite } from "@/lib/api/favorites";
import type { ApiRecipe } from "@/lib/api/types";
import { getOrEstimateMeta } from "@/lib/recipe-meta";
import { recipeCardTheme } from "./recipe-card-theme";
import { RecipeViewContent } from "./recipe-view-content";
import { useDarkMode } from "@/lib/use-dark-mode";

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof TypeError && /fetch/i.test(err.message)) {
    return "Could not reach the server. Please try again.";
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

/** Recipe detail view with a Save/Saved footer toggle — shared by Search and Favorites detail routes. */
export function SaveDetailView({
  recipeId,
  onBack,
}: {
  recipeId: number;
  onBack: () => void;
}) {
  const dark = useDarkMode();
  const [recipe, setRecipe] = useState<ApiRecipe | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [favoriteId, setFavoriteId] = useState<number | null>(null);
  const [savePending, setSavePending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getRecipe(recipeId)
      .then((r) => {
        if (!cancelled) setRecipe(r);
      })
      .catch((err) => {
        if (cancelled) return;
        setRecipe(null);
        setError(errorMessage(err, "Unable to load recipe."));
      });
    listFavorites()
      .then((favs) => {
        if (cancelled) return;
        const match = favs.find((f) => f.recipe_id === recipeId);
        setFavoriteId(match ? match.id : null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  async function toggleSave() {
    if (!recipe || savePending) return;
    setSavePending(true);
    try {
      if (favoriteId != null) {
        await deleteFavorite(favoriteId);
        setFavoriteId(null);
      } else {
        const fav = await addFavorite(recipe.id);
        setFavoriteId(fav.id);
      }
    } catch (err) {
      setError(errorMessage(err, "Unable to update favorites."));
    } finally {
      setSavePending(false);
    }
  }

  if (recipe === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: "var(--tm-text-2)" }}>Loading recipe…</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="p-4">
        <p className="text-sm" style={{ color: "#DC2626" }}>{error || "Recipe not found."}</p>
      </div>
    );
  }

  const theme = recipeCardTheme(recipe.id, recipe.dietary_restrictions);
  const meta = getOrEstimateMeta(recipe);
  const isSaved = favoriteId != null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-1 pb-3 shrink-0">
        <button onClick={onBack} className="p-1" style={{ color: "var(--tm-text-2)" }}>
          <ArrowLeft size={18} />
        </button>
        <p className="text-sm font-semibold truncate flex-1" style={{ color: "var(--tm-text)" }}>
          {recipe.title}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-1 pb-3">
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <RecipeViewContent recipe={recipe} theme={theme} meta={meta} />
      </div>

      <div className="border-t px-1 pt-3 shrink-0" style={{ borderColor: "var(--tm-border)" }}>
        <button
          onClick={toggleSave}
          disabled={savePending}
          className="w-full py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 border disabled:opacity-60"
          style={
            isSaved
              ? { backgroundColor: dark ? "#2A1416" : "#FEF2F2", borderColor: "#DC262640", color: "#DC2626" }
              : { backgroundColor: theme.start, borderColor: theme.start, color: "white" }
          }
        >
          <Heart size={16} fill={isSaved ? "#DC2626" : "none"} color={isSaved ? "#DC2626" : "white"} />
          {isSaved ? "Saved" : "Save Recipe"}
        </button>
      </div>
    </div>
  );
}
