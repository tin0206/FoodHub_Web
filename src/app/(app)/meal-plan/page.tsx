'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Minus, X, ClipboardList, UtensilsCrossed, Trash2 } from 'lucide-react'
import { ApiError } from '@/lib/api-client'
import {
  getMealPlan, replaceMealPlan, addExtraMealSlot, deleteMealSlot, isMainSlot, localIsoDate, slotDisplayLabel,
  type MealPlan, type MealSlot, type MealPlanItem,
} from '@/lib/api/meals'
import type { ApiRecipe } from '@/lib/api/types'
import { getLang } from '@/lib/i18n'
import { buildRecipeSlug } from '@/lib/recipe-slug'
import { useDarkMode } from '@/lib/use-dark-mode'
import { useLang } from '@/lib/use-lang'
import { useStrings } from '@/lib/use-strings'
import { RecipeImageHeader } from '@/components/recipe/recipe-image-header'
import { RecipePickerDialog } from '@/components/meal-plan/recipe-picker-dialog'
import LoadingOverlay from '@/components/loading-overlay'

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback
  if (err instanceof Error) return err.message
  return fallback
}

// ─── Serving stepper button ─────────────────────────────────────────────────

function ServingButton({ icon, onClick }: { icon: ReactNode; onClick?: () => void }) {
  const enabled = !!onClick
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
      style={{ backgroundColor: enabled ? '#0596691F' : 'var(--tm-subtle)', color: enabled ? '#059669' : 'var(--tm-text-3)' }}
    >
      {icon}
    </button>
  )
}

// ─── Meal item row ───────────────────────────────────────────────────────────

function MealItemRow({
  item, onRemove, onServings, onOpen,
}: { item: MealPlanItem; onRemove: () => void; onServings: (servings: number) => void; onOpen: () => void }) {
  const dark = useDarkMode()
  const t = useStrings()
  const panelBorder = dark ? '#2A2A2A' : 'var(--tm-border-i)'
  const servingsLabel = item.servings % 1 === 0 ? item.servings.toFixed(0) : String(item.servings)

  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2" style={{ borderTop: `1px solid ${panelBorder}` }}>
      <button
        type="button"
        onClick={onOpen}
        className="w-11 h-11 rounded-lg overflow-hidden shrink-0"
        aria-label="View recipe"
      >
        <RecipeImageHeader
          imageUrl={item.recipe?.image_url}
          cardId={item.recipe_id}
          labels={item.recipe?.dietary_restrictions}
          height={44}
        />
      </button>
      <div className="flex-1 min-w-0">
        <button type="button" onClick={onOpen} className="block w-full text-left">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--tm-text)' }}>
            {item.recipe?.title ?? `#${item.recipe_id}`}
          </p>
        </button>
        <div className="flex items-center gap-1.5 mt-1">
          <ServingButton icon={<Minus size={13} />} onClick={item.servings > 1 ? () => onServings(item.servings - 1) : undefined} />
          <span className="text-xs font-medium w-16 text-center" style={{ color: 'var(--tm-text-3)' }}>
            {servingsLabel} {t.servingsSuffix}
          </span>
          <ServingButton icon={<Plus size={13} />} onClick={() => onServings(item.servings + 1)} />
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ color: 'var(--tm-text-3)' }}
        aria-label="Remove dish"
      >
        <X size={15} />
      </button>
    </div>
  )
}

// ─── Slot card ────────────────────────────────────────────────────────────────

function SlotCard({
  slot, onAdd, onRemoveItem, onServings, onOpenItem, onDeleteSlot,
}: {
  slot: MealSlot
  onAdd: () => void
  onRemoveItem: (item: MealPlanItem) => void
  onServings: (item: MealPlanItem, servings: number) => void
  onOpenItem: (item: MealPlanItem) => void
  onDeleteSlot?: () => void
}) {
  const dark = useDarkMode()
  const t = useStrings()
  const panelBorder = dark ? '#2A2A2A' : 'var(--tm-border-i)'

  return (
    <div className="rounded-2xl overflow-hidden border" style={{ backgroundColor: 'var(--tm-surface)', borderColor: panelBorder }}>
      <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-2.5">
        <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#0596691A' }}>
          <UtensilsCrossed size={15} color="#059669" />
        </span>
        <p className="text-sm font-bold flex-1 truncate" style={{ color: 'var(--tm-text)' }}>{slotDisplayLabel(slot, t)}</p>
        {onDeleteSlot && (
          <button
            type="button"
            onClick={onDeleteSlot}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ color: 'var(--tm-text-3)' }}
            aria-label="Delete meal"
          >
            <Trash2 size={15} />
          </button>
        )}
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg shrink-0"
          style={{ color: '#059669' }}
        >
          <Plus size={14} /> {t.addDish}
        </button>
      </div>
      <div style={{ borderTop: `1px solid ${panelBorder}` }} />
      {slot.items.length === 0 ? (
        <div className="px-3.5 py-3.5">
          <p className="text-xs" style={{ color: 'var(--tm-text-3)' }}>{t.emptyMealSlot}</p>
        </div>
      ) : (
        slot.items.map((item) => (
          <MealItemRow
            key={item.id}
            item={item}
            onRemove={() => onRemoveItem(item)}
            onServings={(s) => onServings(item, s)}
            onOpen={() => onOpenItem(item)}
          />
        ))
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MealPlanPage() {
  const router = useRouter()
  const dark = useDarkMode()
  const t = useStrings()
  const lang = useLang()
  const date = localIsoDate()

  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [pickerSlot, setPickerSlot] = useState<MealSlot | null>(null)
  const [addingSlot, setAddingSlot] = useState(false)
  const [extraLabel, setExtraLabel] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await getMealPlan(date, getLang())
      setPlan(data)
    } catch (err) {
      setError(errorMessage(err, t.unableToLoadMealPlan))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  async function save(nextPlan: MealPlan) {
    setSaving(true)
    try {
      const updated = await replaceMealPlan(nextPlan, date, getLang())
      setPlan(updated)
    } catch (err) {
      setError(errorMessage(err, t.unableToLoadMealPlan))
    } finally {
      setSaving(false)
    }
  }

  function openRecipe(item: MealPlanItem) {
    router.push(`/search/${buildRecipeSlug(item.recipe_id, item.recipe?.title ?? '')}`)
  }

  async function addRecipeToSlot(slot: MealSlot, recipe: ApiRecipe) {
    if (!plan) return
    setPickerSlot(null)
    const slots = plan.slots.map((s) =>
      s.slot_key === slot.slot_key
        ? { ...s, items: [...s.items, { id: 0, recipe_id: recipe.id, servings: 1 }] }
        : s,
    )
    await save({ ...plan, slots })
  }

  async function removeItem(slot: MealSlot, item: MealPlanItem) {
    if (!plan) return
    const slots = plan.slots.map((s) =>
      s.id === slot.id ? { ...s, items: s.items.filter((it) => it.id !== item.id) } : s,
    )
    await save({ ...plan, slots })
  }

  async function setServings(slot: MealSlot, item: MealPlanItem, servings: number) {
    if (!plan || servings < 1) return
    const slots = plan.slots.map((s) =>
      s.id === slot.id
        ? { ...s, items: s.items.map((it) => (it.id === item.id ? { ...it, servings } : it)) }
        : s,
    )
    await save({ ...plan, slots })
  }

  async function handleDeleteSlot(slot: MealSlot) {
    try {
      const result = await deleteMealSlot(date, slot.id, getLang())
      if (result) {
        setPlan(result)
      } else {
        await load()
      }
    } catch (err) {
      setError(errorMessage(err, t.unableToLoadMealPlan))
    }
  }

  async function handleAddExtraSlot() {
    const label = extraLabel.trim()
    if (!label) return
    setSaving(true)
    try {
      const updated = await addExtraMealSlot(date, label, getLang())
      setPlan(updated)
      setAddingSlot(false)
      setExtraLabel('')
    } catch (err) {
      setError(errorMessage(err, t.unableToLoadMealPlan))
    } finally {
      setSaving(false)
    }
  }

  const panelBorder = dark ? '#2A2A2A' : 'var(--tm-border-i)'

  return (
    <div className="h-full flex flex-col p-3">
      {/* Header */}
      <div
        className="rounded-2xl p-4 mb-3 shrink-0 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #059669, #047857)', boxShadow: '0 6px 16px rgba(5,150,105,0.3)' }}
      >
        <div>
          <p className="text-lg font-extrabold text-white tracking-tight">{t.todaysMealPlan}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>{date}</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/meal-plan/ingredients-detail')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-white shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          <ClipboardList size={14} /> {t.ingredientsDetail}
        </button>
      </div>

      {error && (
        <div className="rounded-xl px-3.5 py-2.5 mb-3 text-xs shrink-0" style={{ backgroundColor: '#F43F5E14', color: '#F43F5E' }}>
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {loading ? (
          <p className="text-sm py-10 text-center" style={{ color: 'var(--tm-text-2)' }}>{t.loading}</p>
        ) : (
          <>
            {(plan?.slots ?? []).map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                onAdd={() => setPickerSlot(slot)}
                onRemoveItem={(item) => removeItem(slot, item)}
                onServings={(item, servings) => setServings(slot, item, servings)}
                onOpenItem={(item) => openRecipe(item)}
                onDeleteSlot={isMainSlot(slot.slot_key) ? undefined : () => handleDeleteSlot(slot)}
              />
            ))}
            <button
              type="button"
              onClick={() => setAddingSlot(true)}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl border border-dashed text-sm font-semibold"
              style={{ borderColor: '#059669', backgroundColor: '#0596690F', color: '#059669' }}
            >
              <Plus size={15} /> {t.addExtraMeal}
            </button>
            <p className="text-xs pt-1 text-center" style={{ color: 'var(--tm-text-3)' }}>{t.mealPlanHint}</p>
          </>
        )}
      </div>

      {pickerSlot && (
        <RecipePickerDialog
          onPick={(recipe) => addRecipeToSlot(pickerSlot, recipe)}
          onClose={() => setPickerSlot(null)}
        />
      )}

      {addingSlot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setAddingSlot(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-5"
            style={{ backgroundColor: 'var(--tm-surface)' }}
          >
            <p className="text-base font-extrabold mb-4" style={{ color: 'var(--tm-text)' }}>{t.addExtraMeal}</p>
            <input
              autoFocus
              value={extraLabel}
              onChange={(e) => setExtraLabel(e.target.value)}
              placeholder={t.extraMealHint}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none"
              style={{ borderColor: panelBorder, color: 'var(--tm-text)', backgroundColor: 'var(--tm-bg)' }}
            />
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setAddingSlot(false)} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ color: 'var(--tm-text-2)' }}>
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleAddExtraSlot}
                disabled={!extraLabel.trim()}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: '#059669' }}
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {saving && <LoadingOverlay />}
    </div>
  )
}
