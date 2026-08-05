"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { BookOpen, X } from "lucide-react";
import { apiFetch, ApiError, resolveMediaUrl } from "@/lib/api-client";
import type { ApiRecipe, RagRecipe } from "@/lib/api/types";

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

export function mergeRecipeCtas(input: {
  fromMarkdown: RecipeLinkRef[];
  recipes?: RagRecipe[];
}): RecipeLinkRef[] {
  const out: RecipeLinkRef[] = [];
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();

  function add(title: string, id?: string | null) {
    const t = title.trim();
    if (!t) return;
    const keyId = (id ?? "").trim();
    if (keyId) {
      if (seenIds.has(keyId)) return;
      seenIds.add(keyId);
      out.push({ title: t, recipeId: keyId });
      seenTitles.add(t.toLowerCase());
      return;
    }
    if (seenTitles.has(t.toLowerCase())) return;
    seenTitles.add(t.toLowerCase());
    out.push({ title: t, recipeId: "" });
  }

  for (const link of input.fromMarkdown) {
    add(link.title, link.recipeId);
  }
  for (const r of input.recipes ?? []) {
    add(r.title, r.recipe_id);
  }
  return out;
}

function RecipePreviewModal({
  recipeId,
  titleHint,
  token,
  onClose,
}: {
  recipeId: string;
  titleHint: string;
  token?: string;
  onClose: () => void;
}) {
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
          throw new ApiError("This recipe id is not openable in the demo.", 400);
        }
        const data = await apiFetch<ApiRecipe>(`/recipes/${numericId}`, {
          token,
        });
        if (!cancelled) setRecipe(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
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
  }, [recipeId, token]);

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
        aria-label={titleHint || "Recipe details"}
        className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-4"
        style={{ backgroundColor: "var(--tm-surface, #fff)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3
            className="text-base font-bold leading-snug"
            style={{ color: "var(--tm-text, #0F172A)" }}
          >
            {recipe?.title || titleHint || "Recipe"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--tm-subtle, #F3F4F6)" }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {loading && (
          <p className="text-sm" style={{ color: "var(--tm-text-2, #475569)" }}>
            Loading recipe…
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
                    {label}
                  </span>
                ))}
              </div>
            )}
            <div>
              <p
                className="text-xs font-bold mb-1.5"
                style={{ color: "var(--tm-text, #0F172A)" }}
              >
                Ingredients
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
                Instructions
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

export function MarkdownReply({
  text,
  recipes = [],
  authToken,
}: {
  text: string;
  recipes?: RagRecipe[];
  /** Optional Bearer for opening recipe detail in demo guest session */
  authToken?: string;
}) {
  const { cleaned, ctas } = useMemo(() => {
    const extracted = extractRecipeMarkdownLinks(text);
    return {
      cleaned: extracted.markdown,
      ctas: mergeRecipeCtas({
        fromMarkdown: extracted.links,
        recipes,
      }),
    };
  }, [text, recipes]);

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
              // Should be rare after extract; still avoid broken relative /id links
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

      {ctas.length > 0 && (
        <div className="mt-3 pt-2" style={{ borderTop: "1px solid var(--tm-border-i, #E5E7EB)" }}>
          <p
            className="text-[11px] font-bold mb-2 tracking-wide"
            style={{ color: "var(--tm-text-3, #6B7280)" }}
          >
            Open recipe details
          </p>
          <div className="flex flex-col gap-2">
            {ctas.map((link) => (
              <button
                key={`${link.recipeId}-${link.title}`}
                type="button"
                disabled={!link.recipeId}
                onClick={() => link.recipeId && setOpenLink(link)}
                className="text-left text-[12px] font-semibold px-3 py-2 rounded-xl disabled:opacity-50"
                style={{
                  backgroundColor: "rgba(5,150,105,0.1)",
                  color: "#047857",
                  border: "1px solid rgba(5,150,105,0.22)",
                }}
              >
                {link.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {openLink && (
        <RecipePreviewModal
          recipeId={openLink.recipeId}
          titleHint={openLink.title}
          token={authToken}
          onClose={() => setOpenLink(null)}
        />
      )}
    </div>
  );
}
