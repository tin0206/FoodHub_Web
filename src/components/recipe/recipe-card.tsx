"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Clock, Flame, Users } from "lucide-react";
import { useDarkMode } from "@/lib/use-dark-mode";
import { recipeCardTheme } from "./recipe-card-theme";
import { RecipeImageHeader } from "./recipe-image-header";

export interface RecipeCardData {
  id: string | number;
  name: string;
  imageUrl?: string | null;
  labels: string[];
  cookingMinutes?: number | null;
  calories?: number | null;
  servings?: number | null;
}

export function RecipeCard({
  recipe,
  onTap,
  onAction,
  footer,
  className,
}: {
  recipe: RecipeCardData;
  onTap?: () => void;
  onAction?: () => void;
  footer?: ReactNode;
  className?: string;
}) {
  const dark = useDarkMode();
  const theme = recipeCardTheme(recipe.id, recipe.labels);

  const stats: { icon: LucideIcon; text: string; color?: string }[] = [];
  if (recipe.cookingMinutes != null)
    stats.push({ icon: Clock, text: `${recipe.cookingMinutes} min` });
  if (recipe.calories != null) {
    stats.push({
      icon: Flame,
      text: `${recipe.calories} cal`,
      color: "#EF4444",
    });
  } else if (recipe.servings != null) {
    stats.push({ icon: Users, text: `Serves ${recipe.servings}` });
  }

  const cardClass = `rounded-[20px] overflow-hidden ${className ?? ""}`;
  const cardStyle = {
    backgroundColor: "var(--tm-surface)",
    boxShadow: dark
      ? "0 6px 14px rgba(0,0,0,0.45)"
      : `0 6px 18px ${theme.start}2E`,
  };

  const inner = (
    <>
      <RecipeImageHeader
        imageUrl={recipe.imageUrl}
        cardId={recipe.id}
        labels={recipe.labels}
        height={180}
      />
      <div className="px-3 pt-2.5 pb-2.5">
        <div className="flex items-start gap-2.5">
          <p
            className="flex-1 font-extrabold text-[16px] leading-tight tracking-tight line-clamp-2 text-left"
            style={{ color: "var(--tm-text)" }}
          >
            {recipe.name}
          </p>
          {onAction && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAction();
              }}
              className="w-9.5 h-9.5 rounded-full flex items-center justify-center shrink-0"
              style={{
                width: 38,
                height: 38,
                background: `linear-gradient(135deg, ${theme.start}, ${theme.end})`,
                boxShadow: `0 4px 10px ${theme.start}66`,
              }}
              aria-label="Open recipe"
            >
              <ArrowRight size={17} color="white" />
            </button>
          )}
        </div>

        {stats.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1">
            {stats.map((s, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && (
                  <span
                    className="w-px h-2.5"
                    style={{ backgroundColor: "var(--tm-border-i)" }}
                  />
                )}
                <s.icon size={12} color={s.color ?? "var(--tm-text-3)"} />
                <span
                  className="text-[11px] font-medium"
                  style={{ color: "var(--tm-text-2)" }}
                >
                  {s.text}
                </span>
              </span>
            ))}
          </div>
        )}

        {recipe.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {recipe.labels.map((label) => (
              <span
                key={label}
                className="text-[10.5px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${theme.start}${dark ? "26" : "14"}`,
                  color: dark ? `${theme.start}E6` : theme.end,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {footer && <div className="mt-2.5">{footer}</div>}
      </div>
    </>
  );

  if (onTap) {
    return (
      // A <button> can't contain the nested action <button>, so this is a div
      // wearing button semantics instead of a real <button>.
      <div
        role="button"
        tabIndex={0}
        onClick={onTap}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTap();
          }
        }}
        className={`w-full text-left cursor-pointer ${cardClass}`}
        style={cardStyle}
      >
        {inner}
      </div>
    );
  }

  return (
    <div className={cardClass} style={cardStyle}>
      {inner}
    </div>
  );
}
