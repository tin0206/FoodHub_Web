"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageSquare } from "lucide-react";
import { useDarkMode } from "@/lib/use-dark-mode";
import { useStrings } from "@/lib/use-strings";
import { hasAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { listFavorites, deleteFavorite, updateFavorite } from "@/lib/api/favorites";
import type { ApiFavorite } from "@/lib/api/types";
import { getOrEstimateMeta } from "@/lib/recipe-meta";
import { buildRecipeSlug } from "@/lib/recipe-slug";
import { RecipeCard, type RecipeCardData } from "@/components/recipe/recipe-card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { NoteDialog } from "@/components/note-dialog";
import { recipeCardTheme } from "@/components/recipe/recipe-card-theme";
import LoadingOverlay from "@/components/loading-overlay";

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof TypeError && /fetch/i.test(err.message)) {
    return "Could not reach the server. Please try again.";
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

function toCardData(favorite: ApiFavorite): RecipeCardData {
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

export default function FavoritesPage() {
  const dark = useDarkMode();
  const router = useRouter();
  const t = useStrings();
  const [favorites, setFavorites] = useState<ApiFavorite[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const [noteTarget, setNoteTarget] = useState<ApiFavorite | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ApiFavorite | null>(null);
  const [removing, setRemoving] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!hasAccessToken()) {
      setFavorites([]);
      setLoading(false);
      setLoadError("No API token. Please sign in again.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    listFavorites()
      .then((favs) => {
        if (!cancelled) setFavorites(favs);
      })
      .catch((err) => {
        if (cancelled) return;
        setFavorites([]);
        setLoadError(errorMessage(err, t.unableToLoadFavorites));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  function openDetail(favorite: ApiFavorite) {
    router.push(`/favorites/${buildRecipeSlug(favorite.recipe.id, favorite.recipe.title)}`);
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
      <div className="flex items-center gap-2 mb-0.5">
        <Heart size={20} fill="#E11D48" color="#E11D48" />
        <h1 className="text-xl font-bold" style={{ color: "var(--tm-text)" }}>{t.favoritesTitle}</h1>
      </div>
      <p className="text-sm mb-4" style={{ color: "var(--tm-text-2)" }}>
        {t.savedRecipesWithNotes}
      </p>

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

      {(loadError || actionError) && (
        <div
          className="rounded-xl px-3.5 py-2.5 mb-3 text-xs flex items-center justify-between gap-2"
          style={{ backgroundColor: "#F43F5E14", color: "#F43F5E" }}
        >
          <span>{loadError || actionError}</span>
          <button
            onClick={() => {
              setActionError("");
              if (loadError) setRetryToken((n) => n + 1);
            }}
            className="font-semibold shrink-0 underline"
          >
            {loadError ? t.retry : "Dismiss"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm py-10 text-center" style={{ color: "var(--tm-text-2)" }}>
          Loading favorites…
        </p>
      ) : favorites && favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart size={32} color="var(--tm-text-3)" className="mb-3" />
          <p className="text-sm font-medium mb-1" style={{ color: "var(--tm-text)" }}>
            {t.noFavoritesYet}
          </p>
          <p className="text-xs" style={{ color: "var(--tm-text-3)" }}>
            Save recipes from Search to see them here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {(favorites ?? []).map((favorite) => {
            const hasNote = (favorite.note ?? "").trim() !== "";
            return (
              <RecipeCard
                key={favorite.id}
                recipe={toCardData(favorite)}
                onTap={() => openDetail(favorite)}
                onAction={() => openDetail(favorite)}
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
