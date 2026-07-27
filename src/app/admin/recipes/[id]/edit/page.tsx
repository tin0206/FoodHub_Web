"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminRecipeForm } from "@/components/admin/recipe-form";
import { getAdminRecipe, type AdminRecipe } from "@/lib/admin";

export default function EditAdminRecipePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<AdminRecipe | null | undefined>(undefined);

  useEffect(() => {
    const found = getAdminRecipe(params.id);
    if (!found) {
      router.replace("/admin/recipes");
      return;
    }
    setRecipe(found);
  }, [params.id, router]);

  if (!recipe) return null;

  return <AdminRecipeForm initial={recipe} />;
}
