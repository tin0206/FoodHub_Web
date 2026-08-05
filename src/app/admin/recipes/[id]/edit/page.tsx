"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminRecipeForm } from "@/components/admin/recipe-form";
import { hasAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { getRecipe } from "@/lib/api/admin-recipes";
import type { ApiRecipe } from "@/lib/api/types";

export default function AdminRecipeEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
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
      setError("Sign in with a real admin account to edit recipes.");
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
                ? "Recipe not found."
                : err.message
              : "Failed to load recipe",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [recipeId, router]);

  if (loading) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <p className="text-sm" style={{ color: "var(--tm-text-2)" }}>
          Loading recipe…
        </p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <p className="text-sm" style={{ color: "#F43F5E" }}>
          {error || "Recipe not found."}
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
