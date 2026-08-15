"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { getRecipe } from "@/lib/api/recipes";
import { ensureDemoSession } from "@/lib/demo-session";
import { parseRecipeIdFromSlug } from "@/lib/recipe-slug";
import { getOrEstimateMeta } from "@/lib/recipe-meta";
import { recipeCardTheme } from "@/components/recipe/recipe-card-theme";
import { RecipeViewContent } from "@/components/recipe/recipe-view-content";
import type { ApiRecipe } from "@/lib/api/types";

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function PublicRecipeDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const recipeId = parseRecipeIdFromSlug(params.slug);

  const [recipe, setRecipe] = useState<ApiRecipe | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (recipeId == null) {
      router.replace("/recipes");
      return;
    }

    let cancelled = false;
    setRecipe(undefined);
    setError("");
    (async () => {
      try {
        const session = await ensureDemoSession();
        if (cancelled) return;
        const found = await getRecipe(recipeId, undefined, session.token);
        if (!cancelled) setRecipe(found);
      } catch (err) {
        if (cancelled) return;
        setRecipe(null);
        setError(errorMessage(err, "Unable to load this recipe."));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recipeId, router, retryToken]);

  if (recipeId == null) return null;

  return (
    <div className="landing-page-content" style={{ maxWidth: "56rem" }}>
      <Link
        href="/recipes"
        className="landing-subnav-link inline-flex items-center gap-1.5 mb-4"
        style={{ padding: "0.4rem 0" }}
      >
        <ArrowLeft size={15} /> Back to recipes
      </Link>

      {recipe === undefined ? (
        <p className="text-sm py-10 text-center" style={{ color: "var(--tm-text-2)" }}>
          Loading recipe…
        </p>
      ) : !recipe ? (
        <div
          className="rounded-xl px-3.5 py-2.5 text-sm flex items-center justify-between gap-2"
          style={{ backgroundColor: "#F43F5E14", color: "#F43F5E" }}
        >
          <span>{error || "Recipe not found."}</span>
          {error && (
            <button
              onClick={() => setRetryToken((n) => n + 1)}
              className="font-semibold shrink-0 underline"
            >
              Retry
            </button>
          )}
        </div>
      ) : (
        <>
          <RecipeViewContent
            recipe={recipe}
            theme={recipeCardTheme(recipe.id, recipe.dietary_restrictions)}
            meta={getOrEstimateMeta(recipe)}
          />

          <div
            className="rounded-2xl mt-6 p-4 flex flex-wrap items-center justify-between gap-3"
            style={{ backgroundColor: "rgba(5,150,105,0.08)" }}
          >
            <p className="text-sm" style={{ color: "var(--lh-ink)" }}>
              Want to save this recipe and get personalized recommendations?
            </p>
            <Link href="/signup" className="landing-btn-primary">
              Create a free account
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
