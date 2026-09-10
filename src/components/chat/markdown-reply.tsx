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
import { createRecipe, type RecipeWritePayload } from "@/lib/api/recipes";
import { buildRecipeSlug } from "@/lib/recipe-slug";
import { NutritionBlock } from "@/components/recipe/recipe-view-content";

/** Appends the HTTP status to the message when available, so the status is
 * visible right in the UI without needing to open DevTools. */
function formatSaveError(err: unknown): string {
  if (err instanceof ApiError) return `${err.message} (HTTP ${err.status})`;
  if (err instanceof Error) return err.message;
  return "";
}

function logCreateRecipeAttempt(label: string, payload: RecipeWritePayload, err: unknown) {
  console.error(
    `[chat save-recipe] ${label} failed`,
    "\nPayload sent:",
    JSON.stringify(payload, null, 2),
    "\nStatus:",
    err instanceof ApiError ? err.status : "n/a",
    "\nResponse detail:",
    err instanceof ApiError ? JSON.stringify(err.detail, null, 2) : "n/a",
    "\nError object:",
    err,
  );
}

/** The backend's ingredient-to-nutrition-catalog matching step is occasionally
 * flaky — the exact same ingredient lines can fail once and then succeed on
 * an immediate retry, so absorb one retry here before surfacing an error.
 * Logs the exact payload + response detail for both attempts so a failure can
 * be diagnosed from the browser console without guessing. */
async function createRecipeWithRetry(payload: RecipeWritePayload): Promise<ApiRecipe> {
  try {
    return await createRecipe(payload);
  } catch (firstErr) {
    logCreateRecipeAttempt("first attempt", payload, firstErr);
    await new Promise((resolve) => setTimeout(resolve, 600));
    try {
      return await createRecipe(payload);
    } catch (secondErr) {
      logCreateRecipeAttempt("retry", payload, secondErr);
      throw secondErr;
    }
  }
}

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

const INGREDIENTS_HEADING_KEYWORDS = ["ingredient", "nguyên liệu"];
const DIRECTIONS_HEADING_KEYWORDS = [
  "direction",
  "instruction",
  "cooking step",
  "step",
  "cách làm",
  "cách nấu",
  "các bước",
  "hướng dẫn",
];

/** A heading line in these replies is either colon-terminated ("Ingredients
 * (Servings: 3):", bolded or emoji-prefixed) or a short ALL-CAPS standalone
 * line ("INGREDIENTS (SERVINGS: 3)", "COOKING STEPS") — everything else
 * (nutrition figures, ingredient/step lines) is mixed-case and has neither
 * shape. Language/decoration-agnostic on purpose: the backend's exact
 * phrasing varies by locale and by turn. */
function isHeadingLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 70) return false;
  if (/:[\s*_]*$/.test(trimmed)) return true;
  const letters = trimmed.replace(/[^A-Za-zÀ-ỹ]/g, "");
  return letters.length >= 3 && letters === letters.toUpperCase() && letters !== letters.toLowerCase();
}

function lineMatchesAny(line: string, keywords: string[]): boolean {
  // Normalize first — Vietnamese text from the API can arrive NFD-decomposed
  // (e.g. "ệ" as "e" + combining marks) even though these keyword literals are
  // stored NFC-composed, which would otherwise make `.includes()` silently miss.
  const lower = line.normalize("NFC").toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

/** Strips a leading "- ", "* ", "• " or "1. "/"2) " marker when present — the
 * backend doesn't always bullet/number these lines, so plain lines pass through as-is. */
function stripLinePrefix(line: string): string {
  return line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim();
}

/** A markdown horizontal rule ("---", "***", "___", optionally spaced) that
 * the AI sometimes drops between sections — never a real ingredient/step. */
function isThematicBreak(line: string): boolean {
  const compact = line.replace(/\s+/g, "");
  return compact.length >= 3 && /^[-*_]+$/.test(compact);
}

/** Detects the AI's "single recipe detail" reply shape — a heading line naming
 * the ingredients section (one item per line, bulleted or not), then a heading
 * line naming the steps/directions section — used both for the first pick out
 * of a recommendation list and for a follow-up edit like "make it vegetarian".
 * Works regardless of language (English/Vietnamese) or decoration (markdown
 * bold, emoji prefixes, plain text), since the backend's phrasing varies. */
export function parseRecipeDetailReply(markdown: string): ParsedRecipeDetail | null {
  const lines = markdown.split(/\r?\n/);
  const ingredientsIdx = lines.findIndex(
    (l) => isHeadingLine(l) && lineMatchesAny(l, INGREDIENTS_HEADING_KEYWORDS),
  );
  const directionsIdx = lines.findIndex(
    (l) => isHeadingLine(l) && lineMatchesAny(l, DIRECTIONS_HEADING_KEYWORDS),
  );
  if (ingredientsIdx === -1 || directionsIdx === -1) return null;

  function sectionAfter(headingIdx: number): string[] {
    const items: string[] = [];
    for (let i = headingIdx + 1; i < lines.length; i++) {
      if (isHeadingLine(lines[i])) break;
      if (isThematicBreak(lines[i])) continue;
      const item = stripLinePrefix(lines[i]);
      if (item) items.push(item);
    }
    return items;
  }

  const ingredients = sectionAfter(ingredientsIdx);
  const directions = sectionAfter(directionsIdx);

  if (ingredients.length === 0) return null;
  return { ingredients, directions };
}

function normalizeIngredientLine(s: string): string {
  return s.normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");
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

type SaveState = "idle" | "saving" | "saved" | "error";

/** The "Add to personal recipe" button, shared by the recipe-preview modal and
 * the inline diff card — always creates a real owned copy under /personal
 * (never a plain favorite/bookmark), swapping to a "View saved recipe" link
 * once done. */
function SaveToPersonalControls({
  saveState,
  savedRecipeId,
  recipeTitle,
  errorMessage,
  onSave,
}: {
  saveState: SaveState;
  savedRecipeId: number | null;
  recipeTitle: string;
  errorMessage: string;
  onSave: () => void;
}) {
  const t = useStrings();
  if (saveState === "saved" && savedRecipeId != null) {
    return (
      <Link
        href={`/personal/${buildRecipeSlug(savedRecipeId, recipeTitle)}`}
        className="block text-center text-xs font-bold py-2.5 rounded-lg text-white"
        style={{ backgroundColor: "#059669" }}
      >
        {t.viewSavedRecipeLabel}
      </Link>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={onSave}
        disabled={saveState === "saving"}
        className="w-full text-xs font-bold py-2.5 rounded-lg text-white disabled:opacity-60"
        style={{ backgroundColor: "#059669" }}
      >
        {saveState === "saving" ? t.savingRecipeButton : t.addToPersonalRecipeButton}
      </button>
      {saveState === "error" && (
        <p className="text-[11px] mt-1.5 text-center" style={{ color: "#F43F5E" }}>
          {errorMessage || t.unableToSaveRecipeFromChat}
        </p>
      )}
    </>
  );
}

function RecipePreviewModal({
  recipeId,
  titleHint,
  token,
  onClose,
  onLoaded,
  canSaveRecipes = false,
  cachedRecipe = null,
}: {
  recipeId: string;
  titleHint: string;
  token?: string;
  onClose: () => void;
  onLoaded?: (recipe: ApiRecipe) => void;
  canSaveRecipes?: boolean;
  /** Already embedded in an earlier chat `recipes[]` list — skip the fetch entirely. */
  cachedRecipe?: ApiRecipe | null;
}) {
  const t = useStrings();
  const lang = useLang();
  const [loading, setLoading] = useState(!cachedRecipe);
  const [error, setError] = useState("");
  const [recipe, setRecipe] = useState<ApiRecipe | null>(cachedRecipe);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedRecipeId, setSavedRecipeId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState("");

  async function handleAddToMyRecipes() {
    if (!recipe || saveState === "saving") return;
    setSaveState("saving");
    setSaveError("");
    try {
      const created = await createRecipeWithRetry({
        title: recipe.title,
        ingredients: recipe.ingredients,
        directions: recipe.directions,
        dietary_restrictions: recipe.dietary_restrictions,
        estimated_servings: recipe.estimated_servings,
        image_url: recipe.image_url,
      });
      setSavedRecipeId(created.id);
      setSaveState("saved");
    } catch (err) {
      setSaveError(formatSaveError(err));
      setSaveState("error");
    }
  }

  useEffect(() => {
    if (cachedRecipe) {
      setRecipe(cachedRecipe);
      setLoading(false);
      onLoaded?.(cachedRecipe);
      return;
    }
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
  }, [recipeId, token, lang, cachedRecipe]);

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

            {canSaveRecipes && (
              <div className="pt-1">
                <SaveToPersonalControls
                  saveState={saveState}
                  savedRecipeId={savedRecipeId}
                  recipeTitle={recipe.title}
                  errorMessage={saveError}
                  onSave={() => void handleAddToMyRecipes()}
                />
              </div>
            )}
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
  recipeCache,
  onRecipeOpened,
  canSaveRecipes = false,
  savedRecipeId: persistedSavedRecipeId,
  onRecipeSaved,
  isFreshReferenceView = false,
}: {
  text: string;
  /** Optional Bearer for opening recipe detail in demo guest session */
  authToken?: string;
  /** The recipe the user most recently opened in this chat — the source of
   * truth for the title/image when saving an edited version from a reply. */
  referencedRecipe?: ApiRecipe | null;
  /** Every full recipe the AI has embedded in a `recipes[]` list so far this
   * session, keyed by id — the chat API sends the same shape as `GET
   * /recipes/{id}` (image_url included), so CTA images and the preview modal
   * never need a separate fetch once a recipe has appeared in a list. */
  recipeCache?: Record<number, ApiRecipe>;
  onRecipeOpened?: (recipe: ApiRecipe) => void;
  /** Only the authenticated /recs chat has a personal library to save into. */
  canSaveRecipes?: boolean;
  /** Restores the "saved" state after a page reload/navigation — this message
   * already produced this recipe id, so re-show "View saved recipe" instead of
   * a blank "Add to personal recipe" button. */
  savedRecipeId?: number;
  onRecipeSaved?: (recipeId: number) => void;
  /** True when this reply is just the first full view of a freshly-picked
   * recipe (nothing was asked to change yet) — skip the ingredient diff/
   * "changes highlighted" framing and show a plain save button instead. */
  isFreshReferenceView?: boolean;
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

  const [saveState, setSaveState] = useState<SaveState>(persistedSavedRecipeId != null ? "saved" : "idle");
  const [savedRecipeId, setSavedRecipeId] = useState<number | null>(persistedSavedRecipeId ?? null);
  const [saveError, setSaveError] = useState("");

  async function handleSaveEdited() {
    if (!parsedDetail || !referencedRecipe || saveState === "saving") return;
    setSaveState("saving");
    setSaveError("");
    try {
      const created = await createRecipeWithRetry({
        title: referencedRecipe.title,
        ingredients: parsedDetail.ingredients,
        directions: parsedDetail.directions.length ? parsedDetail.directions : referencedRecipe.directions,
        dietary_restrictions: referencedRecipe.dietary_restrictions,
        estimated_servings: referencedRecipe.estimated_servings,
        image_url: referencedRecipe.image_url,
      });
      setSavedRecipeId(created.id);
      setSaveState("saved");
      onRecipeSaved?.(created.id);
    } catch (err) {
      setSaveError(formatSaveError(err));
      setSaveState("error");
    }
  }

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
        // Diff/"changes highlighted" framing is temporarily disabled — always
        // show the plain save action regardless of fresh-view vs edit.
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--tm-border-i, #E5E7EB)" }}>
          <SaveToPersonalControls
            saveState={saveState}
            savedRecipeId={savedRecipeId}
            recipeTitle={referencedRecipe.title}
            errorMessage={saveError}
            onSave={() => void handleSaveEdited()}
          />
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
              const numericLinkId = link.recipeId ? Number(link.recipeId) : NaN;
              const imageUrl = Number.isFinite(numericLinkId) ? recipeCache?.[numericLinkId]?.image_url : null;
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
          canSaveRecipes={canSaveRecipes}
          cachedRecipe={recipeCache?.[Number(openLink.recipeId)] ?? null}
        />
      )}
    </div>
  );
});
