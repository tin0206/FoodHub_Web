"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminRecipeForm } from "@/components/admin/recipe-form";
import { hasAccessToken } from "@/lib/auth";
import { useStrings } from "@/lib/use-strings";
import { ApiError } from "@/lib/api-client";
import { getRecipe } from "@/lib/api/admin-recipes";
import type { ApiRecipe } from "@/lib/api/types";

export default function AdminRecipeEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const t = useStrings();
  const recipeId = Number(params.id);
  const [recipe, setRecipe] = useState<ApiRecipe | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(recipeId)) {
      router.replace("/admin/recipes");
      return;
    }
    if (!hasAccessToken()) {
      setError(t.adminSignInEditRecipes);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await getRecipe(recipeId);
        if (!cancelled) setRecipe(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.status === 404
                ? t.adminRecipeNotFound
                : err.message
              : t.adminFailedLoadRecipe,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId, router, t]);

  if (loading) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <p className="text-sm" style={{ color: "var(--tm-text-2)" }}>
          {t.adminLoadingRecipe}
        </p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <p className="text-sm" style={{ color: "#F43F5E" }}>
          {error || t.adminRecipeNotFound}
        </p>
      </div>
    );
  }

  return (
    <AdminRecipeForm
      initial={{
        id: recipe.id,
        title: recipe.title,
        ingredients: recipe.ingredients ?? [],
        directions: recipe.directions ?? [],
        dietary_restrictions: recipe.dietary_restrictions ?? [],
        estimated_servings: recipe.estimated_servings,
        image_url: recipe.image_url,
        created_by: recipe.created_by,
      }}
    />
  );
}
