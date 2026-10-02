"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import {
  submitRecipeFeedback,
  type RecipeFeedbackSource,
  type RecipeSentiment,
} from "@/lib/api/recipe-feedback";
import { useStrings } from "@/lib/use-strings";

export function RecipePreferenceBar({
  recipeId,
  source,
  reason,
  sentiment,
  onSentiment,
}: {
  recipeId: number;
  source: RecipeFeedbackSource;
  reason?: string | null;
  sentiment?: RecipeSentiment | null;
  onSentiment?: (sentiment: RecipeSentiment) => void;
}) {
  const t = useStrings();
  const [current, setCurrent] = useState<RecipeSentiment | null>(sentiment ?? null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (sentiment !== undefined) setCurrent(sentiment ?? null);
  }, [sentiment]);

  async function choose(next: RecipeSentiment) {
    if (pending) return;
    setPending(true);
    try {
      await submitRecipeFeedback({ recipe_id: recipeId, sentiment: next, source });
      setCurrent(next);
      onSentiment?.(next);
    } catch {
      // Keep the previous thumb if the request fails.
    } finally {
      setPending(false);
    }
  }

  function stop(event: { stopPropagation: () => void }) {
    event.stopPropagation();
  }

  return (
    <div onClick={stop} onKeyDown={stop}>
      {reason ? (
        <p className="text-[11px] leading-snug mb-1.5" style={{ color: "var(--tm-text-2)" }}>
          {reason}
        </p>
      ) : null}
      <div className="flex items-center gap-1.5">
        <ThumbButton
          label={t.thumbUp}
          active={current === "up"}
          disabled={pending}
          onClick={() => void choose("up")}
        >
          <ThumbsUp size={13} />
        </ThumbButton>
        <ThumbButton
          label={t.thumbDown}
          active={current === "down"}
          disabled={pending}
          onClick={() => void choose("down")}
        >
          <ThumbsDown size={13} />
        </ThumbButton>
      </div>
    </div>
  );
}

function ThumbButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-50"
      style={{
        backgroundColor: active ? "rgba(5,150,105,0.16)" : "var(--tm-subtle)",
        color: active ? "#059669" : "var(--tm-text-3)",
      }}
    >
      {children}
    </button>
  );
}
