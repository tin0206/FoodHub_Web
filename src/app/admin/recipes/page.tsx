"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Clock, Flame, BookOpen } from "lucide-react";
import { useDarkMode } from "@/lib/use-dark-mode";
import {
  ADMIN_ACCENT_LIGHT,
  ADMIN_ACCENT_DARK,
  listAdminRecipes,
  deleteAdminRecipe,
  type AdminRecipe,
} from "@/lib/admin";

export default function AdminRecipesPage() {
  const isDark = useDarkMode();
  const accent = isDark ? ADMIN_ACCENT_DARK : ADMIN_ACCENT_LIGHT;
  const [recipes, setRecipes] = useState<AdminRecipe[] | null>(null);

  useEffect(() => {
    setRecipes(listAdminRecipes());
  }, []);

  function handleDelete(id: string) {
    deleteAdminRecipe(id);
    setRecipes(listAdminRecipes());
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold" style={{ color: "var(--tm-text)" }}>
          Recipes
        </p>
        <Link
          href="/admin/recipes/new"
          className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-lg"
          style={{ backgroundColor: accent }}
        >
          <Plus size={14} /> New Recipe
        </Link>
      </div>

      {recipes === null ? null : recipes.length === 0 ? (
        <div
          className="rounded-2xl p-8 flex flex-col items-center text-center gap-2"
          style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }}
        >
          <BookOpen size={28} color="var(--tm-text-3)" />
          <p className="text-sm font-semibold" style={{ color: "var(--tm-text)" }}>
            No recipes yet
          </p>
          <p className="text-xs" style={{ color: "var(--tm-text-2)" }}>
            Recipes you add here are stored locally for this admin session.
          </p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }}
        >
          {recipes.map((r, i) => (
            <div
              key={r.id}
              className="flex items-center gap-3 px-3.5 py-3"
              style={{ borderTop: i > 0 ? "1px solid var(--tm-border-i)" : undefined }}
            >
              <Link href={`/admin/recipes/${r.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                {r.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.imageUrl} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" style={{ width: 44, height: 44 }} />
                ) : (
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                    style={{ width: 44, height: 44, backgroundColor: `${accent}1A` }}
                  >
                    <BookOpen size={16} color={accent} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold truncate" style={{ color: "var(--tm-text)" }}>
                    {r.title}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--tm-text-2)" }}>
                      <Clock size={11} /> {r.cookingMinutes} min
                    </span>
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--tm-text-2)" }}>
                      <Flame size={11} /> {r.calories} cal
                    </span>
                  </div>
                </div>
              </Link>
              <Link
                href={`/admin/recipes/${r.id}/edit`}
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--tm-subtle)", color: "var(--tm-text-2)" }}
                aria-label="Edit recipe"
              >
                <Pencil size={14} />
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(r.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--tm-subtle)", color: "#d03b3b" }}
                aria-label="Delete recipe"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
