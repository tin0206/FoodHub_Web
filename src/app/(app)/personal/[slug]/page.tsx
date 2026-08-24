'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { ApiError } from '@/lib/api-client'
import { getRecipe, deleteRecipe } from '@/lib/api/recipes'
import type { ApiRecipe } from '@/lib/api/types'
import { getOrEstimateMeta } from '@/lib/recipe-meta'
import { parseRecipeIdFromSlug, buildRecipeSlug } from '@/lib/recipe-slug'
import { recipeCardTheme } from '@/components/recipe/recipe-card-theme'
import { RecipeViewContent } from '@/components/recipe/recipe-view-content'
import { ConfirmDialog } from '@/components/confirm-dialog'
import LoadingOverlay from '@/components/loading-overlay'
import { useDarkMode } from '@/lib/use-dark-mode'

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback
  if (err instanceof Error) return err.message
  return fallback
}

export default function PersonalRecipeDetailPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const dark = useDarkMode()

  const [recipe, setRecipe] = useState<ApiRecipe | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const id = parseRecipeIdFromSlug(params.slug)
    if (id == null) {
      router.replace('/home')
      return
    }
    let cancelled = false
    getRecipe(id)
      .then(r => {
        if (!cancelled) setRecipe(r)
      })
      .catch(err => {
        if (cancelled) return
        setRecipe(null)
        setError(errorMessage(err, 'Unable to load recipe.'))
      })
    return () => {
      cancelled = true
    }
  }, [params.slug, router])

  async function handleDelete() {
    if (!recipe) return
    setDeleting(true)
    try {
      await deleteRecipe(recipe.id)
      router.push('/home')
    } catch (err) {
      setError(errorMessage(err, 'Unable to delete recipe.'))
      setConfirmDelete(false)
      setDeleting(false)
    }
  }

  if (recipe === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: 'var(--tm-text-2)' }}>Loading recipe…</p>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="p-4">
        <p className="text-sm" style={{ color: '#DC2626' }}>{error || 'Recipe not found.'}</p>
      </div>
    )
  }

  const theme = recipeCardTheme(recipe.id, recipe.dietary_restrictions)
  const meta = getOrEstimateMeta(recipe)
  const panelBg = dark ? '#1E1E1E' : '#F3F4F6'
  const panelBorder = dark ? '#3A3A3A' : 'var(--tm-border-i)'

  return (
    <div className="h-full p-3">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-1 pb-3 shrink-0">
          <button onClick={() => router.back()} className="p-1" style={{ color: 'var(--tm-text-2)' }}>
            <ArrowLeft size={18} />
          </button>
          <p className="text-sm font-semibold truncate flex-1" style={{ color: 'var(--tm-text)' }}>
            {recipe.title}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-1 pb-3">
          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
          <RecipeViewContent recipe={recipe} theme={theme} meta={meta} />
        </div>

        <div className="border-t px-1 pt-3 shrink-0" style={{ borderColor: 'var(--tm-border)' }}>
          <div className="flex gap-2.5">
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex-1 py-2.5 border rounded-full text-sm font-semibold flex items-center justify-center gap-1.5"
              style={{ borderColor: '#DC262640', color: '#DC2626', backgroundColor: dark ? '#2A1416' : '#FEF2F2' }}
            >
              <Trash2 size={15} />
              Delete
            </button>
            <button
              onClick={() => router.push(`/personal/edit/${buildRecipeSlug(recipe.id, recipe.title)}`)}
              className="flex-1 py-2.5 border rounded-full text-sm font-semibold"
              style={{ borderColor: panelBorder, color: 'var(--tm-text-2)', backgroundColor: panelBg }}
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {deleting && <LoadingOverlay />}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete recipe?"
          message={`Delete "${recipe.title}" permanently?`}
          confirmLabel="Delete"
          confirmColor="#DC2626"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
