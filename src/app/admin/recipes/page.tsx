"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useDarkMode } from "@/lib/use-dark-mode";
import { useStrings } from "@/lib/use-strings";
import { ADMIN_ACCENT_LIGHT, ADMIN_ACCENT_DARK } from "@/lib/admin";
import { hasAccessToken } from "@/lib/auth";
import { ApiError, resolveMediaUrl } from "@/lib/api-client";
import { listAdminRecipes } from "@/lib/api/admin-recipes";
import type { ApiRecipe, RecipeVisibility } from "@/lib/api/types";
import { AisleMapCard } from "@/components/admin/aisle-map-card";

type VisibilityFilter = "" | RecipeVisibility;

const PAGE_SIZE = 20;

export default function AdminRecipesPage() {
  const isDark = useDarkMode();
  const accent = isDark ? ADMIN_ACCENT_DARK : ADMIN_ACCENT_LIGHT;
  const t = useStrings();
  const [recipes, setRecipes] = useState<ApiRecipe[] | null>(null);
  const [filter, setFilter] = useState<VisibilityFilter>("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    if (!hasAccessToken()) {
      setRecipes([]);
      setHasNext(false);
      setError(t.adminNoTokenRecipes);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      if (debouncedQuery) {
        // Prefer server-side `q`; also filter client-side for older APIs that ignore it
        const data = await listAdminRecipes({
          skip: 0,
          limit: 200,
          visibility: filter || undefined,
          q: debouncedQuery,
        });
        const q = debouncedQuery.toLowerCase();
        const filtered = data.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            String(r.id).includes(debouncedQuery) ||
            (r.ingredients ?? []).some((line) =>
              line.toLowerCase().includes(q),
            ),
        );
        const start = page * PAGE_SIZE;
        setHasNext(filtered.length > start + PAGE_SIZE);
        setRecipes(filtered.slice(start, start + PAGE_SIZE));
      } else {
        const skip = page * PAGE_SIZE;
        const data = await listAdminRecipes({
          skip,
          limit: PAGE_SIZE + 1,
          visibility: filter || undefined,
        });
        setHasNext(data.length > PAGE_SIZE);
        setRecipes(data.slice(0, PAGE_SIZE));
      }
    } catch (err) {
      setRecipes([]);
      setHasNext(false);
      if (err instanceof ApiError) {
        setError(err.status === 403 ? t.adminRoleRequiredRecipesList : err.message);
      } else {
        setError(err instanceof Error ? err.message : t.adminFailedLoadRecipes);
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page, debouncedQuery, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function setFilterAndReset(next: VisibilityFilter) {
    setPage(0);
    setFilter(next);
  }

  const rangeStart = page * PAGE_SIZE + 1;
  const rangeEnd = page * PAGE_SIZE + (recipes?.length ?? 0);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-3 gap-2">
        <p className="text-sm font-bold" style={{ color: "var(--tm-text)" }}>
          {t.adminRecipesTitle}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg"
            style={{ backgroundColor: `${accent}1F`, color: accent }}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : undefined} />
            {t.refresh}
          </button>
          <Link
            href="/admin/recipes/new"
            className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-lg"
            style={{ backgroundColor: accent }}
          >
            <Plus size={14} /> {t.adminNewRecipe}
          </Link>
        </div>
      </div>

      <AisleMapCard />

      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2 mb-3"
        style={{
          backgroundColor: "var(--tm-surface)",
          border: "1px solid var(--tm-border-i)",
        }}
      >
        <Search size={16} color="var(--tm-text-3)" className="shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.adminSearchRecipesHint}
          className="flex-1 min-w-0 bg-transparent outline-none text-sm"
          style={{ color: "var(--tm-text)" }}
          aria-label={t.adminSearchRecipesHint}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--tm-subtle)", color: "var(--tm-text-2)" }}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        {(
          [
            { value: "" as VisibilityFilter, label: t.filterAll },
            { value: "public" as VisibilityFilter, label: t.filterPublic },
            { value: "private" as VisibilityFilter, label: t.filterPrivate },
          ]
        ).map((opt) => {
          const active = filter === opt.value;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => setFilterAndReset(opt.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{
                backgroundColor: active ? accent : "var(--tm-subtle)",
                color: active ? "#fff" : "var(--tm-text-2)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div
          className="rounded-2xl p-4 mb-3 text-sm"
          style={{
            backgroundColor: "#F43F5E14",
            color: "#F43F5E",
            border: "1px solid #F43F5E33",
          }}
        >
          {error}
        </div>
      )}

      {loading && recipes === null ? (
        <p className="text-sm" style={{ color: "var(--tm-text-2)" }}>
          Loading recipes…
        </p>
      ) : recipes && recipes.length === 0 && !error ? (
        <div
          className="rounded-2xl p-8 flex flex-col items-center text-center gap-2"
          style={{
            backgroundColor: "var(--tm-surface)",
            border: "1px solid var(--tm-border-i)",
          }}
        >
          <BookOpen size={28} color="var(--tm-text-3)" />
          <p className="text-sm font-semibold" style={{ color: "var(--tm-text)" }}>
            {t.adminNoRecipesFound}
          </p>
          <p className="text-xs" style={{ color: "var(--tm-text-2)" }}>
            {debouncedQuery ? t.adminTryAnotherSearch : t.adminTryAnotherVisibilityFilter}
          </p>
        </div>
      ) : recipes && recipes.length > 0 ? (
        <>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--tm-surface)",
              border: "1px solid var(--tm-border-i)",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {recipes.map((r, i) => {
              const isPublic = r.visibility === "public";
              return (
                <Link
                  key={r.id}
                  href={`/admin/recipes/${r.id}`}
                  className="flex items-center gap-3 px-3.5 py-3 hover:opacity-90 transition-opacity"
                  style={{
                    borderTop: i > 0 ? "1px solid var(--tm-border-i)" : undefined,
                  }}
                >
                  {r.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveMediaUrl(r.image_url)}
                      alt=""
                      className="w-11 h-11 rounded-lg object-cover shrink-0"
                      style={{ width: 44, height: 44 }}
                    />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        width: 44,
                        height: 44,
                        backgroundColor: `${accent}1A`,
                      }}
                    >
                      <BookOpen size={16} color={accent} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[13px] font-semibold truncate"
                      style={{ color: "var(--tm-text)" }}
                    >
                      {r.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: isPublic
                            ? `${accent}1A`
                            : "var(--tm-subtle)",
                          color: isPublic ? accent : "var(--tm-text-2)",
                        }}
                      >
                        {isPublic ? <Eye size={11} /> : <EyeOff size={11} />}
                        {isPublic ? t.publicLabel : t.privateLabel}
                      </span>
                      <span
                        className="text-[11px]"
                        style={{ color: "var(--tm-text-3)" }}
                      >
                        #{r.id}
                        {r.locale ? ` · ${r.locale}` : ""}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-3 gap-2">
            <p className="text-[11px]" style={{ color: "var(--tm-text-3)" }}>
              {t.adminShowingRecipes(rangeStart, rangeEnd, hasNext, debouncedQuery)}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0 || loading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-40"
                style={{
                  backgroundColor: "var(--tm-subtle)",
                  color: "var(--tm-text-2)",
                }}
              >
                <ChevronLeft size={14} /> {t.prev}
              </button>
              <button
                type="button"
                disabled={!hasNext || loading}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-40"
                style={{ backgroundColor: `${accent}1F`, color: accent }}
              >
                {t.next} <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
