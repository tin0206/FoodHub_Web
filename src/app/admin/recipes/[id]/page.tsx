"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Clock, Flame, ShoppingBasket, ListOrdered, Tag, BookOpen } from "lucide-react";
import { useDarkMode } from "@/lib/use-dark-mode";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  ADMIN_ACCENT_LIGHT,
  ADMIN_ACCENT_DARK,
  getAdminRecipe,
  deleteAdminRecipe,
  type AdminRecipe,
} from "@/lib/admin";

export default function AdminRecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isDark = useDarkMode();
  const accent = isDark ? ADMIN_ACCENT_DARK : ADMIN_ACCENT_LIGHT;

  const [recipe, setRecipe] = useState<AdminRecipe | null | undefined>(undefined);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const found = getAdminRecipe(params.id);
    if (!found) {
      router.replace("/admin/recipes");
      return;
    }
    setRecipe(found);
  }, [params.id, router]);

  if (!recipe) return null;

  function handleDelete() {
    if (!recipe) return;
    deleteAdminRecipe(recipe.id);
    router.push("/admin/recipes");
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => router.push("/admin/recipes")}
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: "var(--tm-text-2)" }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/recipes/${recipe.id}/edit`}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg"
            style={{ backgroundColor: `${accent}1F`, color: accent }}
          >
            <Pencil size={13} /> Edit
          </Link>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg"
            style={{ backgroundColor: "#F43F5E19", color: "#F43F5E" }}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      {recipe.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-48 object-cover rounded-2xl mb-3" />
      ) : (
        <div
          className="w-full h-48 rounded-2xl mb-3 flex items-center justify-center"
          style={{ backgroundColor: `${accent}14` }}
        >
          <BookOpen size={36} color={accent} />
        </div>
      )}

      <h1 className="text-xl font-extrabold tracking-tight mb-2" style={{ color: "var(--tm-text)" }}>
        {recipe.title}
      </h1>

      <div className="flex items-center gap-4 mb-3">
        <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--tm-text-2)" }}>
          <Clock size={14} color={accent} /> {recipe.cookingMinutes} min
        </span>
        <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--tm-text-2)" }}>
          <Flame size={14} color={accent} /> {recipe.calories} cal
        </span>
      </div>

      {recipe.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {recipe.labels.map((label) => (
            <span key={label} className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${accent}1A`, color: accent }}>
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div className="rounded-2xl p-3.5" style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <ShoppingBasket size={15} color={accent} />
            <span className="text-[13px] font-bold" style={{ color: "var(--tm-text)" }}>Ingredients</span>
          </div>
          <ul className="space-y-1.5">
            {recipe.ingredientLines.map((line, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px]" style={{ color: "var(--tm-text)" }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: accent }} />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl p-3.5" style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <ListOrdered size={15} color={accent} />
            <span className="text-[13px] font-bold" style={{ color: "var(--tm-text)" }}>Instructions</span>
          </div>
          <ol className="space-y-2">
            {recipe.stepLines.map((line, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px]" style={{ color: "var(--tm-text)" }}>
                <span
                  className="w-5.5 h-5.5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ backgroundColor: `${accent}2E`, color: accent }}
                >
                  {i + 1}
                </span>
                <span className="pt-0.5">{line}</span>
              </li>
            ))}
          </ol>
        </div>

        {recipe.labels.length === 0 && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--tm-text-3)" }}>
            <Tag size={12} /> No labels
          </div>
        )}
      </div>

      {confirming && (
        <ConfirmDialog
          title="Delete recipe?"
          message={`"${recipe.title}" will be permanently removed.`}
          confirmLabel="Delete"
          confirmColor="#F43F5E"
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
