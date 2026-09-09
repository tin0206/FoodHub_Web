"use client";

import { memo, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { BookOpen, ChevronRight, X } from "lucide-react";
import { apiFetch, ApiError, resolveMediaUrl } from "@/lib/api-client";
import { useStrings } from "@/lib/use-strings";
import { useLang } from "@/lib/use-lang";
import { getLang } from "@/lib/i18n";
import type { ApiRecipe } from "@/lib/api/types";
import { createRecipe } from "@/lib/api/recipes";
import { buildRecipeSlug } from "@/lib/recipe-slug";
import { NutritionBlock } from "@/components/recipe/recipe-view-content";

export type RecipeLinkRef = {
  title: string;
  recipeId: string;
};

const MD_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

/** Normalize `[Name](id)`, `[Name](/id)`, `[Name](/recipes/id)` → recipe id */
export function normalizeRecipeHref(href: string): string {
  const raw = href.trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return "";
  let path = raw.replace(/^\/+/, "");
  path = path.replace(/^recipes\//i, "");
  path = path.replace(/^api\/v1\/recipes\//i, "");
  path = path.split("?")[0].split("#")[0];
  return path.trim();
}

export function extractRecipeMarkdownLinks(markdown: string): {
  markdown: string;
  links: RecipeLinkRef[];
} {
  const links: RecipeLinkRef[] = [];
  const seen = new Set<string>();
  const cleaned = markdown.replace(
    MD_LINK_PATTERN,
    (_full, titleRaw: string, hrefRaw: string) => {
      const title = String(titleRaw).trim();
      const recipeId = normalizeRecipeHref(String(hrefRaw));
      if (title && recipeId && !seen.has(recipeId)) {
        seen.add(recipeId);
        links.push({ title, recipeId });
      }
      return title ? `**${title}**` : "";
    },
  );
  return { markdown: cleaned, links };
}

export interface ParsedRecipeDetail {
  ingredients: string[];
  directions: string[];
}

/** Detects the AI's "single recipe detail" reply shape (a numbered title, then
 * Nutrition, Ingredients and Cooking Steps sections) — used both for the first
 * pick out of a recommendation list and for a follow-up edit like "make it
 * vegetarian". Link-based recommendation lists never look like this. */
export function parseRecipeDetailReply(markdown: string): ParsedRecipeDetail | null {
  const ingredientsHeading = /\*\*Ingredients[^*\n]*\*\*:?/i.exec(markdown);
  const stepsHeading = /\*\*(?:Cooking Steps|Instructions|Directions)\*\*:?/i.exec(markdown);
  if (!ingredientsHeading || !stepsHeading) return null;

  function sectionAfter(start: number): string {
    const headingPattern = /\*\*[^*\n]+\*\*:?/g;
    headingPattern.lastIndex = start;
    const next = headingPattern.exec(markdown);
    const end = next ? next.index : markdown.length;
    return markdown.slice(start, end);
  }

  const ingredientsSection = sectionAfter(ingredientsHeading.index + ingredientsHeading[0].length);
  const stepsSection = sectionAfter(stepsHeading.index + stepsHeading[0].length);

  const ingredients = [...ingredientsSection.matchAll(/^[-*]\s+(.+)$/gm)].map((m) => m[1].trim());
  const directions = [...stepsSection.matchAll(/^\d+\.\s+(.+)$/gm)].map((m) => m[1].trim());

  if (ingredients.length === 0) return null;
  return { ingredients, directions };
}

function normalizeIngredientLine(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface IngredientDiffLine {
  text: string;
  changed: boolean;
}

/** Marks each ingredient line that has no (near-)match in the previously
 * referenced recipe — a plain normalized-string comparison is enough since the
 * AI regenerates whole lines rather than editing them in place. */
export function diffIngredientLines(current: string[], previous: string[]): IngredientDiffLine[] {
  const prevSet = new Set(previous.map(normalizeIngredientLine));
  return current.map((line) => ({ text: line, changed: !prevSet.has(normalizeIngredientLine(line)) }));
}

function RecipePreviewModal({
  recipeId,
  titleHint,
  token,
  onClose,
  onLoaded,
}: {
  recipeId: string;
  titleHint: string;
  token?: string;
  onClose: () => void;
  onLoaded?: (recipe: ApiRecipe) => void;
}) {
  const t = useStrings();
  const lang = useLang();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recipe, setRecipe] = useState<ApiRecipe | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const numericId = Number(recipeId);
        if (!Number.isFinite(numericId)) {
          throw new ApiError(t.recipeNotOpenableDemo, 400);
        }
        const data = await apiFetch<ApiRecipe>(`/recipes/${numericId}`, {
          query: { lang: getLang() },
          token,
        });
        if (!cancelled) {
          setRecipe(data);
          onLoaded?.(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : t.failedToLoadRecipe,
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
  }, [recipeId, token, lang]);

  const imageSrc = recipe?.image_url
    ? resolveMediaUrl(recipe.image_url)
    : "";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titleHint || t.recipeLabel}
        className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-4"
        style={{ backgroundColor: "var(--tm-surface, #fff)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3
            className="text-base font-bold leading-snug"
            style={{ color: "var(--tm-text, #0F172A)" }}
          >
            {recipe?.title || titleHint || t.recipeLabel}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--tm-subtle, #F3F4F6)" }}
            aria-label={t.close}
          >
            <X size={16} />
          </button>
        </div>

        {loading && (
          <p className="text-sm" style={{ color: "var(--tm-text-2, #475569)" }}>
            {t.loadingRecipe}
          </p>
        )}
        {error && (
          <p className="text-sm" style={{ color: "#F43F5E" }}>
            {error}
          </p>
        )}
        {!loading && !error && recipe && (
          <div className="space-y-3">
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt=""
                className="w-full h-40 object-cover rounded-xl"
              />
            ) : (
              <div
                className="w-full h-28 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(5,150,105,0.1)" }}
              >
                <BookOpen size={28} color="#059669" />
              </div>
            )}
            {(recipe.dietary_restrictions?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {recipe.dietary_restrictions.map((label) => (
                  <span
                    key={label}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "rgba(5,150,105,0.12)",
                      color: "#047857",
                    }}
                  >
                    {t.dietaryTagDisplay(label)}
                  </span>
                ))}
              </div>
            )}
            {recipe.nutrition && (
              <NutritionBlock nutrition={recipe.nutrition} accent="#059669" t={t} />
            )}
            <div>
              <p
                className="text-xs font-bold mb-1.5"
                style={{ color: "var(--tm-text, #0F172A)" }}
              >
                {t.ingredientsLabel}
              </p>
              <ul className="space-y-1">
                {(recipe.ingredients ?? []).map((line, i) => (
                  <li
                    key={i}
                    className="text-[13px] flex gap-2"
                    style={{ color: "var(--tm-text-2, #475569)" }}
                  >
                    <span className="mt-1.5 w-1 h-1 rounded-full shrink-0 bg-emerald-600" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p
                className="text-xs font-bold mb-1.5"
                style={{ color: "var(--tm-text, #0F172A)" }}
              >
                {t.instructionsLabel}
              </p>
              <ol className="space-y-2">
                {(recipe.directions ?? []).map((line, i) => (
                  <li
                    key={i}
                    className="text-[13px] flex gap-2"
                    style={{ color: "var(--tm-text-2, #475569)" }}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{
                        backgroundColor: "rgba(5,150,105,0.15)",
                        color: "#047857",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{line}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const MarkdownReply = memo(function MarkdownReply({
  text,
  authToken,
  referencedRecipe = null,
  onRecipeOpened,
  canSaveRecipes = false,
}: {
  text: string;
  /** Optional Bearer for opening recipe detail in demo guest session */
  authToken?: string;
  /** The recipe the user most recently opened in this chat — the source of
   * truth for the title/image when saving an edited version from a reply. */
  referencedRecipe?: ApiRecipe | null;
  onRecipeOpened?: (recipe: ApiRecipe) => void;
  /** Only the authenticated /recs chat has a personal library to save into. */
  canSaveRecipes?: boolean;
}) {
  const t = useStrings();
  // Only show the CTA list when this specific reply actually contains recipe
  // links (a recommendation list). A single-recipe detail reply (e.g. after
  // "let's go with 2") has no links in its text even though `recipes` may
  // still carry the same top-k context from the prior turn — don't fall back
  // to it, or the detail reply would wrongly show the list again underneath.
  const { cleaned, ctas } = useMemo(() => {
    const extracted = extractRecipeMarkdownLinks(text);
    return { cleaned: extracted.markdown, ctas: extracted.links };
  }, [text]);

  // A link-less reply that has Ingredients + Cooking Steps sections is a full
  // recipe detail — either the first pick from a list, or a follow-up edit
  // ("make it vegetarian"). Diff its ingredients against whichever recipe the
  // user last opened, and offer to save this version.
  const parsedDetail = useMemo(() => {
    if (ctas.length > 0) return null;
    return parseRecipeDetailReply(cleaned);
  }, [cleaned, ctas.length]);

  const ingredientDiff = useMemo(() => {
    if (!parsedDetail || !referencedRecipe) return null;
    return diffIngredientLines(parsedDetail.ingredients, referencedRecipe.ingredients ?? []);
  }, [parsedDetail, referencedRecipe]);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedRecipeId, setSavedRecipeId] = useState<number | null>(null);

  async function handleSaveEdited() {
    if (!parsedDetail || !referencedRecipe || saveState === "saving") return;
    setSaveState("saving");
    try {
      const created = await createRecipe({
        title: referencedRecipe.title,
        ingredients: parsedDetail.ingredients,
        directions: parsedDetail.directions.length ? parsedDetail.directions : referencedRecipe.directions,
        dietary_restrictions: referencedRecipe.dietary_restrictions,
        estimated_servings: referencedRecipe.estimated_servings,
        image_url: referencedRecipe.image_url,
      });
      setSavedRecipeId(created.id);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  // The chat API doesn't send an image for these recipe refs — fetch each one's
  // just to show a real photo instead of the generic book icon in the list.
  const [recipeImages, setRecipeImages] = useState<Record<string, string | null>>({});
  useEffect(() => {
    const idsToFetch = ctas
      .map((c) => c.recipeId)
      .filter((id) => id && !(id in recipeImages));
    if (idsToFetch.length === 0) return;
    let cancelled = false;
    Promise.all(
      idsToFetch.map(async (id) => {
        const numericId = Number(id);
        if (!Number.isFinite(numericId)) return [id, null] as const;
        try {
          const data = await apiFetch<ApiRecipe>(`/recipes/${numericId}`, { token: authToken });
          return [id, data.image_url ?? null] as const;
        } catch {
          return [id, null] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      setRecipeImages((prev) => {
        const next = { ...prev };
        for (const [id, url] of entries) next[id] = url;
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctas, authToken]);

  const [openLink, setOpenLink] = useState<RecipeLinkRef | null>(null);

  return (
    <div className="text-[13px] leading-relaxed" style={{ color: "var(--tm-text)" }}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          a: ({ href, children }) => {
            const recipeId = href ? normalizeRecipeHref(href) : "";
            if (recipeId) {
              return (
                <button
                  type="button"
                  className="underline font-medium"
                  style={{ color: "#059669" }}
                  onClick={() =>
                    setOpenLink({
                      title: String(children ?? "Recipe"),
                      recipeId,
                    })
                  }
                >
                  {children}
                </button>
              );
            }
            return (
              <a
                href={href}
                className="underline font-medium"
                style={{ color: "#059669" }}
                target="_blank"
                rel="noreferrer"
              >
                {children}
              </a>
            );
          },
          code: ({ children }) => (
            <code
              className="text-[12px] px-1 py-0.5 rounded"
              style={{ backgroundColor: "var(--tm-subtle)" }}
            >
              {children}
            </code>
          ),
        }}
      >
        {cleaned.trim() || " "}
      </ReactMarkdown>

      {parsedDetail && referencedRecipe && canSaveRecipes && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--tm-border-i, #E5E7EB)" }}>
          <p
            className="text-[11px] font-bold mb-2 tracking-wide"
            style={{ color: "var(--tm-text-3, #6B7280)" }}
          >
            {t.ingredientsInThisVersionLabel}
          </p>
          <ul className="space-y-1 mb-3">
            {(ingredientDiff ?? parsedDetail.ingredients.map((line) => ({ text: line, changed: false }))).map(
              (line, i) => (
                <li
                  key={i}
                  className="text-[12.5px] px-2.5 py-1.5 rounded-lg"
                  style={
                    line.changed
                      ? { backgroundColor: "rgba(5,150,105,0.16)", color: "var(--tm-text)", fontWeight: 600 }
                      : { color: "var(--tm-text-2)" }
                  }
                >
                  {line.text}
                </li>
              ),
            )}
          </ul>

          {saveState === "saved" && savedRecipeId != null ? (
            <Link
              href={`/personal/${buildRecipeSlug(savedRecipeId, referencedRecipe.title)}`}
              className="block text-center text-xs font-bold py-2 rounded-lg text-white"
              style={{ backgroundColor: "#059669" }}
            >
              {t.viewSavedRecipeLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => void handleSaveEdited()}
              disabled={saveState === "saving"}
              className="w-full text-xs font-bold py-2 rounded-lg text-white disabled:opacity-60"
              style={{ backgroundColor: "#059669" }}
            >
              {saveState === "saving" ? t.savingRecipeButton : t.saveRecipeFromChatButton}
            </button>
          )}
          {saveState === "error" && (
            <p className="text-[11px] mt-1.5" style={{ color: "#F43F5E" }}>
              {t.unableToSaveRecipeFromChat}
            </p>
          )}
        </div>
      )}

      {ctas.length > 0 && (
        <div className="mt-3 pt-2" style={{ borderTop: "1px solid var(--tm-border-i, #E5E7EB)" }}>
          <p
            className="text-[11px] font-bold mb-2 tracking-wide"
            style={{ color: "var(--tm-text-3, #6B7280)" }}
          >
            {t.openRecipeDetailsLabel}
          </p>
          <div className="flex flex-col gap-2.5">
            {ctas.map((link) => {
              const imageUrl = link.recipeId ? recipeImages[link.recipeId] : null;
              const resolvedImage = imageUrl ? resolveMediaUrl(imageUrl) : "";
              return (
              <button
                key={`${link.recipeId}-${link.title}`}
                type="button"
                disabled={!link.recipeId}
                onClick={() => link.recipeId && setOpenLink(link)}
                className="flex items-center gap-3 text-left px-3.5 py-3 rounded-2xl disabled:opacity-50 transition-colors hover:opacity-90"
                style={{
                  backgroundColor: "rgba(5,150,105,0.08)",
                  border: "1px solid rgba(5,150,105,0.22)",
                }}
              >
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ backgroundColor: "rgba(5,150,105,0.16)" }}
                >
                  {resolvedImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resolvedImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen size={18} color="#059669" />
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] font-bold leading-snug" style={{ color: "#047857" }}>
                    {link.title}
                  </span>
                  <span className="block text-[11px] mt-0.5" style={{ color: "var(--tm-text-3, #6B7280)" }}>
                    {t.tapToViewRecipe}
                  </span>
                </span>
                <ChevronRight size={18} color="#059669" className="shrink-0" />
              </button>
              );
            })}
          </div>
        </div>
      )}

      {openLink && (
        <RecipePreviewModal
          recipeId={openLink.recipeId}
          titleHint={openLink.title}
          token={authToken}
          onClose={() => setOpenLink(null)}
          onLoaded={onRecipeOpened}
        />
      )}
    </div>
  );
});
