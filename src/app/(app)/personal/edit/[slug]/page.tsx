'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock, Users, ShoppingBasket, ListOrdered, Tag, Info } from 'lucide-react'
import { ApiError, resolveMediaUrl } from '@/lib/api-client'
import { getRecipe, createRecipe, updateRecipe, uploadRecipeImage } from '@/lib/api/recipes'
import { getCurrentUser } from '@/lib/auth'
import type { ApiRecipe } from '@/lib/api/types'
import { getOrEstimateMeta, setRecipeMeta, estimateStats } from '@/lib/recipe-meta'
import { getLang } from '@/lib/i18n'
import { parseRecipeIdFromSlug, buildRecipeSlug } from '@/lib/recipe-slug'
import { recipeCardTheme } from '@/components/recipe/recipe-card-theme'
import { SectionCard } from '@/components/recipe/section-card'
import { LabelChips } from '@/components/recipe/label-chips'
import { LineListEditor } from '@/components/recipe/line-list-editor'
import { PhotoPicker } from '@/components/recipe/photo-picker'
import { inlineInputClass } from '@/components/recipe/form-styles'
import LoadingOverlay from '@/components/loading-overlay'
import { useDarkMode } from '@/lib/use-dark-mode'
import { useStrings } from '@/lib/use-strings'

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback
  if (err instanceof Error) return err.message
  return fallback
}

const UNMAPPED_INGREDIENTS_PREFIX = 'Could not map these ingredient lines to the catalog.'

/** Pulls the offending lines out of the backend's catalog-mapping error, e.g.
 * "Could not map these ingredient lines to the catalog. Rephrase in English: 4 kaffir lime leaves; 4 white fish fillets" */
function parseUnmappedIngredientLines(message: string): string[] | null {
  if (!message.startsWith(UNMAPPED_INGREDIENTS_PREFIX)) return null
  const marker = 'Rephrase in English:'
  const idx = message.indexOf(marker)
  if (idx === -1) return null
  return message
    .slice(idx + marker.length)
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
}

export default function EditPersonalRecipePage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const dark = useDarkMode()
  const t = useStrings()

  const [recipe, setRecipe] = useState<ApiRecipe | null | undefined>(undefined)
  const [isOwner, setIsOwner] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [title, setTitle] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [imageCleared, setImageCleared] = useState(false)
  const [minutes, setMinutes] = useState('')
  const [servings, setServings] = useState('')
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
    // Loads once in whatever language is active right now — not kept reactive to later
    // language switches, since that would silently overwrite the user's in-progress edits.
    getRecipe(id, getLang())
      .then(r => {
        if (cancelled) return
        const currentUserId = getCurrentUser()?.id
        setIsOwner(r.created_by != null && String(r.created_by) === currentUserId)
        setRecipe(r)
        const meta = getOrEstimateMeta(r)
        setTitle(r.title)
        setImagePreview(resolveMediaUrl(r.image_url))
        setMinutes(String(meta.cookingMinutes))
        setServings(r.estimated_servings != null ? String(r.estimated_servings) : '')
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
    const servingsNum = servings.trim() ? Number.parseInt(servings, 10) : null
    if (
      !title.trim() || cleanIngredients.length === 0 || cleanSteps.length === 0 ||
      !Number.isFinite(mins) || mins <= 0 ||
      (servings.trim() && (!Number.isFinite(servingsNum) || (servingsNum as number) <= 0))
    ) {
      setError('Title, time, ingredients and instructions are required.')
      return
    }
    setError('')
    setSaving(true)
    const currentRecipe = recipe
    // Editing a recipe you don't own (a public/catalog recipe opened from Search or
    // Favorites) never patches the original — it creates a brand-new personal recipe
    // seeded from it, exactly like starting from a blank recipe with these values.
    async function saveWith(ingredientsToSave: string[]) {
      return isOwner
        ? updateRecipe(currentRecipe.id, {
            title: title.trim(),
            ingredients: ingredientsToSave,
            directions: cleanSteps,
            dietary_restrictions: [...labels],
            estimated_servings: servingsNum,
            ...(imageCleared && !imageFile ? { image_url: null } : {}),
          })
        : createRecipe({
            title: title.trim(),
            ingredients: ingredientsToSave,
            directions: cleanSteps,
            dietary_restrictions: [...labels],
            estimated_servings: servingsNum,
            // Carry over the original photo unless the user cleared it or picked a
            // replacement (a picked file is uploaded separately right after creation).
            ...(imageCleared || imageFile ? {} : { image_url: currentRecipe.image_url ?? undefined }),
          })
    }
    try {
      let updated: ApiRecipe
      try {
        updated = await saveWith(cleanIngredients)
      } catch (err) {
        // The backend maps free-text ingredient lines to its catalog and rejects lines
        // it can't recognize — rather than blocking the save, drop those specific lines
        // to a generic "Other" ingredient and retry once instead of losing the whole edit.
        const failedLines = err instanceof ApiError ? parseUnmappedIngredientLines(err.message) : null
        if (!failedLines) throw err
        const failedSet = new Set(failedLines.map(l => l.toLowerCase()))
        const finalIngredients = cleanIngredients.map(line => (failedSet.has(line.toLowerCase()) ? 'Other' : line))
        updated = await saveWith(finalIngredients)
        setIngredients(finalIngredients)
      }
      // Cooking time has no server equivalent — cache it locally. Calories are
      // seeded from the same rough estimate used before nutrition existed;
      // getOrEstimateMeta() prefers the real server-computed value once it's there.
      setRecipeMeta(updated.id, { cookingMinutes: mins, calories: estimateStats(updated).calories })

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
  const backHref = isOwner
    ? `/personal/${buildRecipeSlug(recipe.id, recipe.title)}`
    : `/search/${buildRecipeSlug(recipe.id, recipe.title)}`

  return (
    <div className="h-full p-3">
      {/* Capped like Profile's form column — on a wide desktop viewport, an uncapped
          width stretches the photo well past its native resolution and it looks soft/blown out. */}
      <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2 px-1 pb-3 shrink-0">
          <button
            onClick={() => router.push(backHref)}
            className="p-1"
            style={{ color: 'var(--tm-text-2)' }}
          >
            <ArrowLeft size={18} />
          </button>
          <p className="text-sm font-semibold truncate flex-1" style={{ color: 'var(--tm-text)' }}>
            {isOwner ? 'Edit recipe' : t.newPersonalRecipeTitle}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-1 pb-3">
          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

          {!isOwner && (
            <div
              className="flex items-start gap-2 rounded-xl px-3 py-2.5 mb-2.5 text-xs"
              style={{ backgroundColor: dark ? '#1E1E1E' : '#ECFDF5', color: dark ? 'var(--tm-text-2)' : '#047857' }}
            >
              <Info size={14} className="shrink-0 mt-0.5" />
              {t.forkRecipeNotice}
            </div>
          )}

          <div className="space-y-2.5">
            <PhotoPicker preview={imagePreview} onPick={handlePickImage} onClear={handleClearImage} theme={theme} size="lg" />
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
                <Users size={16} color={theme.start} />
                <input
                  type="number"
                  value={servings}
                  onChange={e => setServings(e.target.value)}
                  placeholder="0"
                  className={inlineInputClass}
                  style={{ width: 56, color: 'var(--tm-text)' }}
                />
                <span className="text-xs" style={{ color: 'var(--tm-text-3)' }}>servings</span>
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
              onClick={() => router.push(backHref)}
              className="flex-1 py-2.5 border rounded-full text-sm font-semibold"
              style={{ borderColor: dark ? '#3A3A3A' : 'var(--tm-border-i)', color: 'var(--tm-text-2)', backgroundColor: dark ? '#1E1E1E' : '#F3F4F6' }}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: theme.start }}
            >
              {isOwner ? t.saveChanges : t.saveAsNewRecipeLabel}
            </button>
          </div>
        </div>
      </div>
      {saving && <LoadingOverlay />}
    </div>
  )
}
