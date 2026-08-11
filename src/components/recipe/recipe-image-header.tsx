"use client";

import { Utensils } from "lucide-react";
import { resolveMediaUrl } from "@/lib/api-client";
import { recipeCardTheme } from "./recipe-card-theme";

export function RecipeImageHeader({
  imageUrl,
  cardId,
  labels,
  height = 120,
}: {
  imageUrl?: string | null;
  cardId: string | number;
  labels?: string[];
  height?: number;
}) {
  const resolved = resolveMediaUrl(imageUrl);

  if (resolved) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={resolved} alt="" className="w-full object-cover" style={{ height }} />
    );
  }

  const theme = recipeCardTheme(cardId, labels);
  return (
    <div
      className="w-full flex items-center justify-center"
      style={{ height, background: `linear-gradient(135deg, ${theme.start}, ${theme.end})` }}
    >
      <Utensils size={28} color="rgba(255,255,255,0.85)" />
    </div>
  );
}
