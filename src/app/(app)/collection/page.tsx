"use client";

import { type ReactNode, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Heart, MessageSquare, Plus } from "lucide-react";
import { useDarkMode } from "@/lib/use-dark-mode";
import { useLang } from "@/lib/use-lang";
import { getLang } from "@/lib/i18n";
import { useStrings } from "@/lib/use-strings";
import { hasAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { listRecipes } from "@/lib/api/recipes";
import { listFavorites, deleteFavorite, updateFavorite } from "@/lib/api/favorites";
import type { ApiFavorite, ApiRecipe } from "@/lib/api/types";
import { getOrEstimateMeta } from "@/lib/recipe-meta";
import { buildRecipeSlug } from "@/lib/recipe-slug";
import { RecipeCard, type RecipeCardData } from "@/components/recipe/recipe-card";
import { AddRecipePanel } from "@/components/recipe/add-recipe-panel";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { NoteDialog } from "@/components/note-dialog";
import { recipeCardTheme } from "@/components/recipe/recipe-card-theme";
import LoadingOverlay from "@/components/loading-overlay";

type Tab = "personal" | "favorites";

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof TypeError && /fetch/i.test(err.message)) {
    return "Could not reach the server. Please try again.";
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

function toPersonalCardData(recipe: ApiRecipe): RecipeCardData {
  const meta = getOrEstimateMeta(recipe);
  return {
    id: recipe.id,
    name: recipe.title,
    imageUrl: recipe.image_url,
    labels: recipe.dietary_restrictions,
    cookingMinutes: meta.cookingMinutes,
    servings: recipe.estimated_servings,
  };
}

function toFavoriteCardData(favorite: ApiFavorite): RecipeCardData {
  const meta = getOrEstimateMeta(favorite.recipe);
  return {
    id: favorite.recipe.id,
    name: favorite.recipe.title,
    imageUrl: favorite.recipe.image_url,
    labels: favorite.recipe.dietary_restrictions,
    cookingMinutes: meta.cookingMinutes,
    calories: meta.calories,
  };
}

function SummaryCard({
  value, label, icon, iconBg, iconColor,
}: {
  value: number; label: string; icon: ReactNode; iconBg: string; iconColor: string;
}) {
  return (
    <div
      className="flex items-center gap-3.5 rounded-xl px-5 py-4"
      style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border)" }}
    >
      <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold leading-none" style={{ color: "var(--tm-text)" }}>{value}</p>
        <p className="text-xs mt-1" style={{ color: "var(--tm-text-3)" }}>{label}</p>
      </div>
    </div>
  );
}

/** Minimal centered icon + text + subtext — same shape as the Favorites empty
 * state, with an optional CTA for tabs (like Personal) that have a create action. */
function EmptyPanel({
  icon, title, subtitle, cta,
}: { icon: ReactNode; title: string; subtitle: string; cta?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon}
      <p className="text-sm font-medium mb-1 mt-3" style={{ color: "var(--tm-text)" }}>{title}</p>
      <p className="text-xs mb-3" style={{ color: "var(--tm-text-3)" }}>{subtitle}</p>
      {cta}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors"
      style={{
        backgroundColor: active ? "#059669" : "transparent",
        color: active ? "#ffffff" : "var(--tm-text-2)",
        boxShadow: active ? "0 4px 12px rgba(5,150,105,0.28)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function CollectionPageInner() {
  const dark = useDarkMode();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useStrings();
  const lang = useLang();

  const initialTab: Tab = searchParams.get("tab") === "favorites" ? "favorites" : "personal";
  const [tab, setTab] = useState<Tab>(initialTab);

  // ── Personal recipes ────────────────────────────────────────────────────
  const [recipes, setRecipes] = useState<ApiRecipe[] | null>(null);
  const [recipesError, setRecipesError] = useState("");
  const [showAddPanel, setShowAddPanel] = useState(false);

  useEffect(() => {
    if (!hasAccessToken()) {
      setRecipes([]);
      return;
    }
    let cancelled = false;
    listRecipes({ mine: true, lang: getLang() })
      .then((mine) => {
        if (!cancelled) setRecipes(mine);
      })
      .catch((err) => {
        if (cancelled) return;
        setRecipes([]);
        setRecipesError(errorMessage(err, t.unableToLoadRecipes));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // ── Favorites ────────────────────────────────────────────────────────────
  const [favorites, setFavorites] = useState<ApiFavorite[] | null>(null);
  const [favLoading, setFavLoading] = useState(true);
  const [favLoadError, setFavLoadError] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const [noteTarget, setNoteTarget] = useState<ApiFavorite | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ApiFavorite | null>(null);
  const [removing, setRemoving] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!hasAccessToken()) {
      setFavorites([]);
      setFavLoading(false);
      setFavLoadError("No API token. Please sign in again.");
      return;
    }
    let cancelled = false;
    setFavLoading(true);
    setFavLoadError("");
    listFavorites(getLang())
      .then((favs) => {
        if (!cancelled) setFavorites(favs);
      })
      .catch((err) => {
        if (cancelled) return;
        setFavorites([]);
        setFavLoadError(errorMessage(err, t.unableToLoadFavorites));
      })
      .finally(() => {
        if (!cancelled) setFavLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retryToken, lang]);

  function selectTab(next: Tab) {
    setTab(next);
    router.replace(next === "favorites" ? "/collection?tab=favorites" : "/collection");
  }

  function openPersonalDetail(recipe: ApiRecipe) {
    router.push(`/personal/${buildRecipeSlug(recipe.id, recipe.title)}`);
  }

  function openFavoriteDetail(favorite: ApiFavorite) {
    router.push(`/collection/${buildRecipeSlug(favorite.recipe.id, favorite.recipe.title)}`);
  }

  function handleRecipeSaved(recipe: ApiRecipe) {
    setRecipes((prev) => [recipe, ...(prev ?? [])]);
    setShowAddPanel(false);
  }

  async function saveNote(note: string) {
    if (!noteTarget) return;
    setSavingNote(true);
    try {
      const updated = await updateFavorite(noteTarget.id, note.trim() || null);
      setFavorites((prev) => prev?.map((f) => (f.id === updated.id ? updated : f)) ?? prev);
      setNoteTarget(null);
    } catch (err) {
      setActionError(errorMessage(err, "Unable to save note."));
    } finally {
      setSavingNote(false);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await deleteFavorite(removeTarget.id);
      setFavorites((prev) => prev?.filter((f) => f.id !== removeTarget.id) ?? prev);
      setRemoveTarget(null);
    } catch (err) {
      setActionError(errorMessage(err, "Unable to remove favorite."));
    } finally {
      setRemoving(false);
    }
  }

  const savedCount = favorites?.length ?? 0;
  const noteCount = favorites?.filter((f) => (f.note ?? "").trim() !== "").length ?? 0;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <h1 className="text-xl font-bold mb-0.5" style={{ color: "var(--tm-text)" }}>{t.collectionTitle}</h1>
      <p className="text-sm mb-4" style={{ color: "var(--tm-text-2)" }}>
        {tab === "personal" ? t.personalRecipesTabSubtitle : t.savedRecipesWithNotes}
      </p>

      <div
        className="flex items-center gap-1 p-1 rounded-full mb-4 max-w-sm"
        style={{ backgroundColor: "var(--tm-subtle)" }}
      >
        <TabButton active={tab === "personal"} onClick={() => selectTab("personal")}>
          {t.personalRecipesTitle}
        </TabButton>
        <TabButton active={tab === "favorites"} onClick={() => selectTab("favorites")}>
          {t.favoritesTitle}
        </TabButton>
      </div>

      {tab === "personal" ? (
        <>
          <div className="mb-5">
            <SummaryCard
              value={recipes?.length ?? 0}
              label={t.totalLabel}
              icon={<BookOpen size={18} />}
              iconBg={dark ? "#0F2A22" : "#ECFDF5"}
              iconColor="#059669"
            />
          </div>

          {recipesError && (
            <div className="rounded-xl px-3.5 py-2.5 mb-3 text-xs" style={{ backgroundColor: "#F43F5E14", color: "#F43F5E" }}>
              {recipesError}
            </div>
          )}

          {recipes && recipes.length > 0 && (
            <div className="flex justify-end mb-3">
              <button
                type="button"
                onClick={() => setShowAddPanel(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-white"
                style={{ backgroundColor: "#059669" }}
              >
                <Plus size={13} />
                {t.addRecipeCta}
              </button>
            </div>
          )}

          {recipes === null ? (
            <p className="text-sm py-10 text-center" style={{ color: "var(--tm-text-2)" }}>{t.loading}</p>
          ) : recipes.length === 0 ? (
            <EmptyPanel
              icon={<BookOpen size={32} color="var(--tm-text-3)" />}
              title={t.noRecipesYet}
              subtitle={t.noRecipesDesc}
              cta={
                <button
                  onClick={() => setShowAddPanel(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: "#059669" }}
                >
                  <Plus size={16} />
                  {t.addFirstRecipe}
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={toPersonalCardData(recipe)}
                  onTap={() => openPersonalDetail(recipe)}
                  onAction={() => openPersonalDetail(recipe)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <SummaryCard
              value={savedCount}
              label={t.savedLabel}
              icon={<Heart size={18} fill="#E11D48" color="#E11D48" />}
              iconBg={dark ? "#3A1420" : "#FEF2F2"}
              iconColor="#E11D48"
            />
            <SummaryCard
              value={noteCount}
              label={t.withNotesLabel}
              icon={<MessageSquare size={18} />}
              iconBg={dark ? "#2F2A18" : "#FFFBEB"}
              iconColor={dark ? "#FDE68A" : "#92400E"}
            />
          </div>

          {(favLoadError || actionError) && (
            <div
              className="rounded-xl px-3.5 py-2.5 mb-3 text-xs flex items-center justify-between gap-2"
              style={{ backgroundColor: "#F43F5E14", color: "#F43F5E" }}
            >
              <span>{favLoadError || actionError}</span>
              <button
                onClick={() => {
                  setActionError("");
                  if (favLoadError) setRetryToken((n) => n + 1);
                }}
                className="font-semibold shrink-0 underline"
              >
                {favLoadError ? t.retry : "Dismiss"}
              </button>
            </div>
          )}

          {favLoading ? (
            <p className="text-sm py-10 text-center" style={{ color: "var(--tm-text-2)" }}>{t.loading}</p>
          ) : favorites && favorites.length === 0 ? (
            <EmptyPanel
              icon={<Heart size={32} color="var(--tm-text-3)" />}
              title={t.noFavoritesYet}
              subtitle={t.savedFromSearchHint}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {(favorites ?? []).map((favorite) => {
                const hasNote = (favorite.note ?? "").trim() !== "";
                return (
                  <RecipeCard
                    key={favorite.id}
                    recipe={toFavoriteCardData(favorite)}
                    onTap={() => openFavoriteDetail(favorite)}
                    onAction={() => openFavoriteDetail(favorite)}
                    footer={
                      <div>
                        {hasNote && (
                          <div
                            className="flex items-start gap-1.5 rounded-lg px-2.5 py-2 mb-2.5 text-xs leading-relaxed"
                            style={{
                              backgroundColor: dark ? "#2F2A18" : "#FFFBEB",
                              border: `1px solid ${dark ? "#6B5C2B" : "#F2C94C"}`,
                              color: dark ? "#FDE68A" : "#92400E",
                            }}
                          >
                            <MessageSquare size={13} className="mt-0.5 shrink-0" />
                            <span>{favorite.note}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNoteTarget(favorite);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium border rounded-lg py-2"
                            style={{
                              backgroundColor: dark ? "#1E1E1E" : "#F3F4F6",
                              borderColor: dark ? "#2E2E2E" : "var(--tm-border-i)",
                              color: "var(--tm-text-2)",
                            }}
                          >
                            <MessageSquare size={13} />
                            {hasNote ? t.editNote : t.addNote}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRemoveTarget(favorite);
                            }}
                            className="w-9 h-9 flex items-center justify-center border rounded-lg shrink-0"
                            style={{
                              backgroundColor: dark ? "#1E1E1E" : "#F9FAFB",
                              borderColor: dark ? "#2E2E2E" : "var(--tm-border-i)",
                            }}
                            aria-label="Remove from favorites"
                          >
                            <Heart size={15} fill="#E11D48" color="#E11D48" />
                          </button>
                        </div>
                      </div>
                    }
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {showAddPanel && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowAddPanel(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg h-[85vh] sm:h-[80vh]"
          >
            <AddRecipePanel onCancel={() => setShowAddPanel(false)} onSave={handleRecipeSaved} />
          </div>
        </div>
      )}

      {noteTarget && (
        <NoteDialog
          title={t.myNote}
          initialNote={noteTarget.note ?? ""}
          accentColor={recipeCardTheme(noteTarget.recipe.id, noteTarget.recipe.dietary_restrictions).start}
          confirmLabel={t.saveNote}
          placeholder={t.writeNoteHint}
          onSave={saveNote}
          onCancel={() => setNoteTarget(null)}
        />
      )}
      {removeTarget && (
        <ConfirmDialog
          title={t.removeFromFavorites}
          message={t.removeConfirm(removeTarget.recipe.title)}
          confirmLabel={t.unfavoriteLabel}
          confirmColor="#DC2626"
          onConfirm={handleRemove}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
      {(savingNote || removing) && <LoadingOverlay />}
    </div>
  );
}

export default function CollectionPage() {
  return (
    <Suspense fallback={null}>
      <CollectionPageInner />
    </Suspense>
  );
}
