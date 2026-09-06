'use client'

import { useState } from 'react'
import { Plus, X, Clock, Users, ShoppingBasket, ListOrdered, Tag } from 'lucide-react'
import { ApiError } from '@/lib/api-client'
import { createRecipe, uploadRecipeImage } from '@/lib/api/recipes'
import type { ApiRecipe } from '@/lib/api/types'
import { setRecipeMeta, estimateStats } from '@/lib/recipe-meta'
import { useDarkMode } from '@/lib/use-dark-mode'
import { useStrings } from '@/lib/use-strings'
import { SectionCard } from './section-card'
import { LabelChips } from './label-chips'
import { LineListEditor } from './line-list-editor'
import { PhotoPicker } from './photo-picker'
import { inlineInputClass } from './form-styles'
import LoadingOverlay from '@/components/loading-overlay'

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback
  if (err instanceof Error) return err.message
  return fallback
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Self-contained "new personal recipe" form — a rounded card meant to sit inside
 * a modal wrapper (the caller decides how it's presented). */
export function AddRecipePanel({
  onCancel, onSave,
}: { onCancel: () => void; onSave: (r: ApiRecipe) => void }) {
  const dark = useDarkMode()
  const t = useStrings()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [name, setName] = useState('')
  const [minutes, setMinutes] = useState('')
  const [servings, setServings] = useState('2')
  const [ingredients, setIngredients] = useState<string[]>([''])
  const [steps, setSteps] = useState<string[]>([''])
  const [labels, setLabels] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function toggleLabel(label: string) {
    setLabels(prev => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }

  async function handlePickImage(file: File) {
    setImageFile(file)
    setImagePreview(await readFileAsDataUrl(file))
  }

  function handleClearImage() {
    setImageFile(null)
    setImagePreview('')
  }

  async function handleSave() {
    if (saving) return
    const trimmedName = name.trim()
    const cleanIngredients = ingredients.map(s => s.trim()).filter(Boolean)
    const cleanSteps = steps.map(s => s.trim()).filter(Boolean)
    const mins = Number.parseInt(minutes, 10)
    const servingsNum = Number.parseInt(servings, 10)

    if (!trimmedName || cleanIngredients.length === 0 || cleanSteps.length === 0 ||
      !Number.isFinite(servingsNum) || servingsNum <= 0) {
      setError(t.fillAllFields)
      return
    }

    setError('')
    setSaving(true)
    try {
      const created = await createRecipe({
        title: trimmedName,
        ingredients: cleanIngredients,
        directions: cleanSteps,
        dietary_restrictions: [...labels],
        estimated_servings: servingsNum,
      })
      // Cooking time has no API field — cache it locally when the user gave one,
      // same fallback chain getOrEstimateMeta() already uses everywhere else.
      if (Number.isFinite(mins) && mins > 0) {
        setRecipeMeta(created.id, { cookingMinutes: mins, calories: estimateStats(created).calories })
      }

      let finalRecipe = created
      if (imageFile) {
        try {
          const imageUrl = await uploadRecipeImage(created.id, imageFile)
          finalRecipe = { ...created, image_url: imageUrl }
        } catch {
          // Recipe was created fine; just surface that the photo didn't attach.
          setError('Recipe saved, but the photo could not be uploaded.')
        }
      }
      onSave(finalRecipe)
    } catch (err) {
      setError(errorMessage(err, t.unableToSaveRecipe))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{ backgroundColor: 'var(--tm-surface)', boxShadow: dark ? '0 12px 28px rgba(0,0,0,0.4)' : '0 8px 24px rgba(12,26,20,0.1)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2.5 shrink-0">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#0596691F' }}>
          <Plus size={16} color="#059669" />
        </span>
        <p className="text-[15px] font-extrabold tracking-tight flex-1" style={{ color: 'var(--tm-text)' }}>{t.newRecipeTitle}</p>
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: dark ? '#2A2A2A' : '#F3F4F6', border: `1px solid ${dark ? '#3A3A3A' : 'var(--tm-border-i)'}`, color: 'var(--tm-text-2)' }}
          aria-label="Cancel"
        >
          <X size={16} />
        </button>
      </div>
      <div style={{ borderTop: '1px solid var(--tm-border)' }} />

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3.5 space-y-2.5">
        {error && <p className="text-xs text-red-500">{error}</p>}

        <PhotoPicker preview={imagePreview} onPick={handlePickImage} onClear={handleClearImage} />

        <SectionCard>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t.recipeNameHint}
            className={`text-[17px] font-bold tracking-tight ${inlineInputClass}`}
            style={{ color: 'var(--tm-text)' }}
          />
        </SectionCard>

        <SectionCard>
          <div className="flex items-center flex-wrap gap-2">
            <Clock size={16} color="#059669" />
            <input
              type="number"
              value={minutes}
              onChange={e => setMinutes(e.target.value)}
              placeholder="0"
              className={inlineInputClass}
              style={{ width: 56, color: 'var(--tm-text)' }}
            />
            <span className="text-xs" style={{ color: 'var(--tm-text-3)' }}>{t.minSuffix}</span>
            <span className="w-3" />
            <Users size={16} color="#059669" />
            <input
              type="number"
              value={servings}
              onChange={e => setServings(e.target.value)}
              placeholder="2"
              className={inlineInputClass}
              style={{ width: 56, color: 'var(--tm-text)' }}
            />
            <span className="text-xs" style={{ color: 'var(--tm-text-3)' }}>{t.servingsSuffix}</span>
          </div>
        </SectionCard>

        <SectionCard icon={<ShoppingBasket size={15} />} title={t.ingredientsLabel}>
          <LineListEditor values={ingredients} onChange={setIngredients} placeholder={t.ingredientHint} addLabel={t.addIngredient} />
        </SectionCard>

        <SectionCard icon={<ListOrdered size={15} />} title={t.instructionsLabel}>
          <LineListEditor values={steps} onChange={setSteps} placeholder={t.stepHint} variant="number" addLabel={t.addStep} />
        </SectionCard>

        <SectionCard icon={<Tag size={15} />} title={t.labelsLabel}>
          <LabelChips selected={labels} onToggle={toggleLabel} />
        </SectionCard>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 px-3.5 pb-3.5 pt-2 shrink-0">
        <button
          onClick={onCancel}
          className="flex-1 h-11 rounded-xl text-sm font-semibold transition-colors"
          style={{ backgroundColor: dark ? '#1E1E1E' : '#F3F4F6', border: `1px solid ${dark ? '#3A3A3A' : 'var(--tm-border-i)'}`, color: 'var(--tm-text)' }}
        >
          {t.cancel}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 h-11 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#059669', boxShadow: '0 6px 16px rgba(5,150,105,0.3)' }}
        >
          {t.saveRecipe}
        </button>
      </div>
      {saving && <LoadingOverlay />}
    </div>
  )
}
