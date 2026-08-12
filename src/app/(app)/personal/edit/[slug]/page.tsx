'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock, Flame, ShoppingBasket, ListOrdered, Tag } from 'lucide-react'
import { ApiError, resolveMediaUrl } from '@/lib/api-client'
import { getRecipe, updateRecipe, uploadRecipeImage } from '@/lib/api/recipes'
import type { ApiRecipe } from '@/lib/api/types'
import { getOrEstimateMeta, setRecipeMeta } from '@/lib/recipe-meta'
import { parseRecipeIdFromSlug, buildRecipeSlug } from '@/lib/recipe-slug'
import { recipeCardTheme } from '@/components/recipe/recipe-card-theme'
import { SectionCard } from '@/components/recipe/section-card'
import { LabelChips } from '@/components/recipe/label-chips'
import { LineListEditor } from '@/components/recipe/line-list-editor'
import { PhotoPicker } from '@/components/recipe/photo-picker'
import { inlineInputClass } from '@/components/recipe/form-styles'
import LoadingOverlay from '@/components/loading-overlay'
import { useDarkMode } from '@/lib/use-dark-mode'

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback
  if (err instanceof Error) return err.message
  return fallback
}

export default function EditPersonalRecipePage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const dark = useDarkMode()

  const [recipe, setRecipe] = useState<ApiRecipe | null | undefined>(undefined)
  const [loadError, setLoadError] = useState('')

  const [title, setTitle] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [imageCleared, setImageCleared] = useState(false)
  const [minutes, setMinutes] = useState('')
  const [calories, setCalories] = useState('')
  const [ingredients, setIngredients] = useState<string[]>([''])
  const [steps, setSteps] = useState<string[]>([''])
  const [labels, setLabels] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const id = parseRecipeIdFromSlug(params.slug)
    if (id == null) {
      router.replace('/home')
      return
    }
    let cancelled = false
    getRecipe(id)
      .then(r => {
        if (cancelled) return
        setRecipe(r)
        const meta = getOrEstimateMeta(r)
        setTitle(r.title)
        setImagePreview(resolveMediaUrl(r.image_url))
        setMinutes(String(meta.cookingMinutes))
        setCalories(String(meta.calories))
        setIngredients(r.ingredients.length ? r.ingredients : [''])
        setSteps(r.directions.length ? r.directions : [''])
        setLabels(new Set(r.dietary_restrictions))
      })
      .catch(err => {
        if (cancelled) return
        setRecipe(null)
        setLoadError(errorMessage(err, 'Unable to load recipe.'))
      })
    return () => {
      cancelled = true
    }
  }, [params.slug, router])

  function toggleLabel(label: string) {
    setLabels(prev => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }

  function handlePickImage(file: File) {
    setImageFile(file)
    setImageCleared(false)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleClearImage() {
    setImageFile(null)
    setImagePreview('')
    setImageCleared(true)
  }

  async function handleSave() {
    if (!recipe || saving) return
    const cleanIngredients = ingredients.map(s => s.trim()).filter(Boolean)
    const cleanSteps = steps.map(s => s.trim()).filter(Boolean)
    const mins = Number.parseInt(minutes, 10)
    const cals = Number.parseInt(calories, 10)
    if (
      !title.trim() || cleanIngredients.length === 0 || cleanSteps.length === 0 ||
      !Number.isFinite(mins) || mins <= 0 || !Number.isFinite(cals) || cals <= 0
    ) {
      setError('Title, time, calories, ingredients and instructions are required.')
      return
    }
    setError('')
    setSaving(true)
    try {
      const updated = await updateRecipe(recipe.id, {
        title: title.trim(),
        ingredients: cleanIngredients,
        directions: cleanSteps,
        dietary_restrictions: [...labels],
        ...(imageCleared && !imageFile ? { image_url: null } : {}),
      })
      setRecipeMeta(updated.id, { cookingMinutes: mins, calories: cals })

      let finalId = updated.id
      if (imageFile) {
        try {
          await uploadRecipeImage(updated.id, imageFile)
        } catch {
          setError('Changes saved, but the photo could not be uploaded.')
        }
      }
      router.push(`/personal/${buildRecipeSlug(finalId, updated.title)}`)
    } catch (err) {
      setError(errorMessage(err, 'Unable to save changes.'))
    } finally {
      setSaving(false)
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
        <p className="text-sm" style={{ color: '#DC2626' }}>{loadError || 'Recipe not found.'}</p>
      </div>
    )
  }

  const theme = recipeCardTheme(recipe.id, recipe.dietary_restrictions)

  return (
    <div className="h-full p-3">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-1 pb-3 shrink-0">
          <button
            onClick={() => router.push(`/personal/${buildRecipeSlug(recipe.id, recipe.title)}`)}
            className="p-1"
            style={{ color: 'var(--tm-text-2)' }}
          >
            <ArrowLeft size={18} />
          </button>
          <p className="text-sm font-semibold truncate flex-1" style={{ color: 'var(--tm-text)' }}>
            Edit recipe
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-1 pb-3">
          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

          <div className="space-y-2.5">
            <PhotoPicker preview={imagePreview} onPick={handlePickImage} onClear={handleClearImage} theme={theme} />
            <SectionCard title="Name" accent={theme.start}>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Recipe name…"
                className={`text-[17px] font-bold tracking-tight ${inlineInputClass}`}
                style={{ color: 'var(--tm-text)' }}
              />
            </SectionCard>
            <SectionCard accent={theme.start}>
              <div className="flex items-center flex-wrap gap-2">
                <Clock size={16} color={theme.start} />
                <input
                  type="number"
                  value={minutes}
                  onChange={e => setMinutes(e.target.value)}
                  placeholder="0"
                  className={inlineInputClass}
                  style={{ width: 56, color: 'var(--tm-text)' }}
                />
                <span className="text-xs" style={{ color: 'var(--tm-text-3)' }}>min</span>
                <span className="w-3" />
                <Flame size={16} color={theme.start} />
                <input
                  type="number"
                  value={calories}
                  onChange={e => setCalories(e.target.value)}
                  placeholder="0"
                  className={inlineInputClass}
                  style={{ width: 56, color: 'var(--tm-text)' }}
                />
                <span className="text-xs" style={{ color: 'var(--tm-text-3)' }}>cal</span>
              </div>
            </SectionCard>
            <SectionCard icon={<ShoppingBasket size={15} />} title="Ingredients" accent={theme.start}>
              <LineListEditor values={ingredients} onChange={setIngredients} placeholder={i => `Ingredient ${i + 1}`} addLabel="Add ingredient" accent={theme.start} />
            </SectionCard>
            <SectionCard icon={<ListOrdered size={15} />} title="Instructions" accent={theme.start}>
              <LineListEditor values={steps} onChange={setSteps} placeholder={i => `Step ${i + 1}…`} variant="number" addLabel="Add step" accent={theme.start} />
            </SectionCard>
            <SectionCard icon={<Tag size={15} />} title="Labels" accent={theme.start}>
              <LabelChips selected={labels} onToggle={toggleLabel} accent={theme.start} />
            </SectionCard>
          </div>
        </div>

        <div className="border-t px-1 pt-3 shrink-0" style={{ borderColor: 'var(--tm-border)' }}>
          <div className="flex gap-2.5">
            <button
              onClick={() => router.push(`/personal/${buildRecipeSlug(recipe.id, recipe.title)}`)}
              className="flex-1 py-2.5 border rounded-full text-sm font-semibold"
              style={{ borderColor: dark ? '#3A3A3A' : 'var(--tm-border-i)', color: 'var(--tm-text-2)', backgroundColor: dark ? '#1E1E1E' : '#F3F4F6' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: theme.start }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
      {saving && <LoadingOverlay />}
    </div>
  )
}
