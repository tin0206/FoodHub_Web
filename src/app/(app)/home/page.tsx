'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Plus, X, Clock, Users, ShoppingBasket, ListOrdered, Tag, Heart, ChevronLeft, ChevronRight, RefreshCw, Loader2, CalendarDays } from 'lucide-react'
import { hasAccessToken } from '@/lib/auth'
import { ApiError } from '@/lib/api-client'
import { listRecipes, createRecipe, uploadRecipeImage } from '@/lib/api/recipes'
import { getTopFavorites } from '@/lib/api/favorites'
import { getTodaySuggestions, refreshTodaySuggestions, getMealPlan, localIsoDate, type MealSuggestion, type MealPlan } from '@/lib/api/meals'
import type { ApiRecipe, TopFavoriteRecipe } from '@/lib/api/types'
import { getLang } from '@/lib/i18n'
import LoadingOverlay from '@/components/loading-overlay'
import { RecipeCard, type RecipeCardData } from '@/components/recipe/recipe-card'
import { setRecipeMeta, getOrEstimateMeta, estimateStats } from '@/lib/recipe-meta'
import { buildRecipeSlug } from '@/lib/recipe-slug'
import { useDarkMode } from '@/lib/use-dark-mode'
import { useStrings } from '@/lib/use-strings'
import type { Strings } from '@/lib/strings'
import { SectionCard } from '@/components/recipe/section-card'
import { LabelChips } from '@/components/recipe/label-chips'
import { LineListEditor } from '@/components/recipe/line-list-editor'
import { PhotoPicker } from '@/components/recipe/photo-picker'
import { inlineInputClass } from '@/components/recipe/form-styles'
import { AddToPlanDialog } from '@/components/meal-plan/add-to-plan-dialog'

type View = 'list' | 'add'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting(t: Strings): string {
  const h = new Date().getHours()
  if (h < 12) return t.goodMorning
  if (h < 17) return t.goodAfternoon
  return t.goodEvening
}

function toCardData(recipe: ApiRecipe): RecipeCardData {
  const meta = getOrEstimateMeta(recipe)
  return {
    id: recipe.id,
    name: recipe.title,
    imageUrl: recipe.image_url,
    labels: recipe.dietary_restrictions,
    cookingMinutes: meta.cookingMinutes,
    calories: meta.calories,
  }
}

/** Personal Recipes shows min + servings instead of min + calories. */
function toPersonalCardData(recipe: ApiRecipe): RecipeCardData {
  const meta = getOrEstimateMeta(recipe)
  return {
    id: recipe.id,
    name: recipe.title,
    imageUrl: recipe.image_url,
    labels: recipe.dietary_restrictions,
    cookingMinutes: meta.cookingMinutes,
    servings: recipe.estimated_servings,
  }
}

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

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const dark = useDarkMode()
  const t = useStrings()
  return (
    <div className="py-8 flex flex-col items-center justify-center">
      <div
        className="w-17 h-17 rounded-[18px] flex items-center justify-center mb-3"
        style={{ backgroundColor: dark ? 'var(--tm-subtle)' : '#E5E7EB' }}
      >
        <BookOpen size={34} color={dark ? 'var(--tm-text-2)' : '#6B7280'} />
      </div>
      <p className="text-[17px] font-bold mb-1" style={{ color: 'var(--tm-text)' }}>{t.noRecipesYet}</p>
      <p className="text-xs text-center mb-3.5 max-w-60" style={{ color: 'var(--tm-text-3)' }}>
        {t.noRecipesDesc}
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white"
        style={{ backgroundColor: '#10B981' }}
      >
        <Plus size={16} />
        {t.addFirstRecipe}
      </button>
    </div>
  )
}

// ─── Home sections (Personal / Top / Recommended) ──────────────────────────────

// Shared card width so Personal/Top/Recommended rows line up at the same size.
const RECIPE_ROW_CARD_CLASS = 'w-68 shrink-0 snap-start'

function SectionHeading({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mb-2.5">
      <p className="text-sm font-bold" style={{ color: 'var(--tm-text)' }}>
        {title}
        {count != null && (
          <span className="font-medium" style={{ color: 'var(--tm-text-3)' }}> - {count}</span>
        )}
      </p>
    </div>
  )
}

/** Horizontal-scrolling strip of fixed-width cards — used for Personal/Top rows.
 * No visible scrollbar; navigated via the arrow buttons instead. Scrolls within
 * its own bounds only (no negative-margin bleed), so the page around it never
 * picks up a horizontal scrollbar of its own. */
function RecipeRow({ children }: { children: React.ReactNode }) {
  const dark = useDarkMode()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  function updateArrows() {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    updateArrows()
    const el = scrollRef.current
    if (!el) return
    const onResize = () => updateArrows()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children])

  function scrollByAmount(dir: 1 | -1) {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  const arrowStyle = {
    backgroundColor: dark ? 'rgba(20,20,20,0.85)' : 'rgba(255,255,255,0.92)',
    boxShadow: dark ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(12,26,20,0.16)',
    color: 'var(--tm-text)',
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="no-scrollbar flex gap-3 overflow-x-auto overflow-y-hidden pb-1 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {children}
      </div>
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          aria-label="Scroll left"
          className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
          style={arrowStyle}
        >
          <ChevronLeft size={16} />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          aria-label="Scroll right"
          className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
          style={arrowStyle}
        >
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  )
}

function EmptyRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-2xl px-4 py-5"
      style={{ backgroundColor: 'var(--tm-subtle)' }}
    >
      {icon}
      <p className="text-xs" style={{ color: 'var(--tm-text-3)' }}>{text}</p>
    </div>
  )
}

/** One meal-type row (Breakfast/Lunch/Dinner) inside the Recommended for You section. */
function SuggestionMealRow({
  label, recipes, onOpen, onAddToPlan,
}: { label: string; recipes: ApiRecipe[]; onOpen: (r: ApiRecipe) => void; onAddToPlan: (r: ApiRecipe) => void }) {
  const t = useStrings()
  return (
    <div className="mb-3.5">
      <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--tm-text-2)' }}>{label}</p>
      {recipes.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--tm-text-3)' }}>{t.noSuggestionsForMeal}</p>
      ) : (
        <RecipeRow>
          {recipes.map(recipe => (
            <div key={recipe.id} className={RECIPE_ROW_CARD_CLASS}>
              <RecipeCard
                recipe={toCardData(recipe)}
                onTap={() => onOpen(recipe)}
                onAction={() => onOpen(recipe)}
                onAddToPlan={() => onAddToPlan(recipe)}
              />
            </div>
          ))}
        </RecipeRow>
      )}
    </div>
  )
}

// ─── Add recipe panel ─────────────────────────────────────────────────────────

function AddRecipePanel({
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const t = useStrings()
  const [recipes, setRecipes] = useState<ApiRecipe[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [view, setView] = useState<View>('list')
  const [topRecipes, setTopRecipes] = useState<TopFavoriteRecipe[] | null>(null)
  const [topLoadError, setTopLoadError] = useState('')
  const rowContainerRef = useRef<HTMLDivElement>(null)
  const [topVisibleLimit, setTopVisibleLimit] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<MealSuggestion | null>(null)
  const [suggestionsLoading, setSuggestionsLoading] = useState(true)
  const [suggestionsError, setSuggestionsError] = useState('')
  const suggestionPollRef = useRef<number | null>(null)
  const suggestionDateRef = useRef(localIsoDate())
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [addToPlanRecipe, setAddToPlanRecipe] = useState<ApiRecipe | null>(null)

  async function loadRecipes() {
    if (!hasAccessToken()) {
      setRecipes([])
      setLoadError('No API token. Please sign in again.')
      return
    }
    setLoadError('')
    try {
      const mine = await listRecipes({ mine: true })
      setRecipes(mine)
    } catch (err) {
      setRecipes([])
      setLoadError(errorMessage(err, t.unableToLoadRecipes))
    }
  }

  async function loadTopRecipes() {
    if (!hasAccessToken()) {
      setTopRecipes([])
      return
    }
    setTopLoadError('')
    try {
      const top = await getTopFavorites()
      setTopRecipes(top)
    } catch (err) {
      setTopRecipes([])
      setTopLoadError(errorMessage(err, t.unableToLoadTopRecipes))
    }
  }

  async function loadMealPlan() {
    if (!hasAccessToken()) {
      setMealPlan(null)
      return
    }
    try {
      const plan = await getMealPlan(suggestionDateRef.current, getLang())
      setMealPlan(plan)
    } catch {
      setMealPlan(null)
    }
  }

  function stopSuggestionPoll() {
    if (suggestionPollRef.current != null) {
      window.clearInterval(suggestionPollRef.current)
      suggestionPollRef.current = null
    }
  }

  // Polls every 3s while the AI is still generating today's picks, same cadence
  // as mobile's Timer.periodic — cancels itself once status leaves "pending".
  async function pollSuggestionsOnce() {
    try {
      const next = await getTodaySuggestions({ lang: getLang(), suggestionDate: suggestionDateRef.current })
      setSuggestions(next)
      if (next.status === 'pending') return
      stopSuggestionPoll()
      setSuggestionsLoading(false)
      setSuggestionsError(next.status === 'failed' ? (next.error_message || t.suggestionsFailed) : '')
    } catch (err) {
      stopSuggestionPoll()
      setSuggestionsLoading(false)
      setSuggestionsError(errorMessage(err, t.suggestionsFailed))
    }
  }

  async function loadSuggestions(refresh = false) {
    stopSuggestionPoll()
    if (!hasAccessToken()) {
      setSuggestions(null)
      setSuggestionsLoading(false)
      return
    }
    setSuggestionsLoading(true)
    setSuggestionsError('')
    try {
      const data = refresh
        ? await refreshTodaySuggestions({ lang: getLang(), suggestionDate: suggestionDateRef.current })
        : await getTodaySuggestions({ lang: getLang(), suggestionDate: suggestionDateRef.current })
      setSuggestions(data)
      if (data.status === 'pending') {
        suggestionPollRef.current = window.setInterval(pollSuggestionsOnce, 3000)
        return
      }
      setSuggestionsLoading(false)
      setSuggestionsError(data.status === 'failed' ? (data.error_message || t.suggestionsFailed) : '')
    } catch (err) {
      setSuggestionsLoading(false)
      setSuggestionsError(errorMessage(err, t.suggestionsFailed))
    }
  }

  useEffect(() => {
    loadRecipes()
    loadTopRecipes()
    loadSuggestions()
    loadMealPlan()
    return () => stopSuggestionPoll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Top Recipes shows as many cards as fit in the row before it would need to
  // scroll, times 1.5 — giving a slight, intentional overflow so the arrow
  // nav has something to reveal, without dumping all (up to 10) fetched cards
  // in at once. The backend itself caps top-favorites at 10 regardless.
  useEffect(() => {
    const el = rowContainerRef.current
    if (!el) return
    function applyWidth(width: number) {
      // Card step must track RECIPE_ROW_CARD_CLASS: `w-68` (272px) + `gap-3` (12px).
      const cardStep = 272 + 12
      const visibleCount = Math.max(1, Math.floor(width / cardStep))
      setTopVisibleLimit(Math.ceil(visibleCount * 1.5))
    }
    applyWidth(el.clientWidth)
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) applyWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function handleSaved(recipe: ApiRecipe) {
    setRecipes(prev => [recipe, ...(prev ?? [])])
    setView('list')
  }

  function openDetail(recipe: ApiRecipe) {
    router.push(`/personal/${buildRecipeSlug(recipe.id, recipe.title)}`)
  }

  /** Recommended-for-you / Top Recipes cards aren't owned by the user — open the
   * read-only search detail view instead of the edit/delete-capable personal one. */
  function openCatalogDetail(recipe: ApiRecipe) {
    router.push(`/search/${buildRecipeSlug(recipe.id, recipe.title)}`)
  }

  if (recipes === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: 'var(--tm-text-2)' }}>Loading recipes…</p>
      </div>
    )
  }

  if (view === 'add') {
    return (
      <div className="h-full p-3">
        <AddRecipePanel onCancel={() => setView('list')} onSave={handleSaved} />
      </div>
    )
  }

  return (
    <>
    <div className="flex flex-col h-full p-3">
      {/* Greeting hero */}
      <div
        className="rounded-2xl p-4 mb-3 shrink-0 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #059669, #047857)', boxShadow: '0 6px 16px rgba(5,150,105,0.3)' }}
      >
        <div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>{greeting(t)}</p>
          <p className="text-xl font-extrabold text-white tracking-tight">{t.myRecipes}</p>
          <span className="inline-block mt-2.5 text-xs font-semibold text-white px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
            {t.recipeCount(recipes.length)}
          </span>
        </div>
        <button
          onClick={() => setView('add')}
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          aria-label="Add recipe"
        >
          <Plus size={24} color="white" />
        </button>
      </div>

      {loadError && (
        <div className="rounded-xl px-3.5 py-2.5 mb-3 text-xs shrink-0" style={{ backgroundColor: '#F43F5E14', color: '#F43F5E' }}>
          {loadError}
        </div>
      )}

      <div ref={rowContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden pt-1 space-y-5">
        {/* Personal Recipes */}
        <section>
          <SectionHeading title={t.personalRecipesTitle} count={recipes.length} />
          {recipes.length === 0 && !loadError ? (
            <EmptyState onAdd={() => setView('add')} />
          ) : (
            <RecipeRow>
              {recipes.map(recipe => (
                <div key={recipe.id} className={RECIPE_ROW_CARD_CLASS}>
                  <RecipeCard
                    recipe={toPersonalCardData(recipe)}
                    onTap={() => openDetail(recipe)}
                    onAction={() => openDetail(recipe)}
                  />
                </div>
              ))}
            </RecipeRow>
          )}
        </section>

        {/* Today's meal plan */}
        <section>
          <button
            type="button"
            onClick={() => router.push('/meal-plan')}
            className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left"
            style={{ backgroundColor: 'var(--tm-surface)', boxShadow: '0 3px 10px rgba(12,26,20,0.06)' }}
          >
            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#0596691A' }}>
              <CalendarDays size={18} color="#059669" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold truncate" style={{ color: 'var(--tm-text)' }}>{t.todaysMealPlan}</span>
              <span className="block text-xs mt-0.5" style={{ color: 'var(--tm-text-3)' }}>
                {t.mealPlanPreview(mealPlan?.slots.reduce((sum, s) => sum + s.items.length, 0) ?? 0)}
              </span>
            </span>
            <span className="text-xs font-bold shrink-0" style={{ color: '#059669' }}>{t.openMealPlan}</span>
          </button>
        </section>

        {/* Recommended for You — today's AI-generated meal picks */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-sm font-bold" style={{ color: 'var(--tm-text)' }}>{t.recommendedRecipesTitle}</p>
            <button
              type="button"
              onClick={() => loadSuggestions(true)}
              disabled={suggestionsLoading}
              aria-label={t.refreshSuggestions}
              title={t.refreshSuggestions}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
              style={{ backgroundColor: 'var(--tm-subtle)', color: 'var(--tm-text-2)' }}
            >
              <RefreshCw size={14} className={suggestionsLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          {suggestionsLoading && suggestions?.status !== 'pending' ? (
            <EmptyRow icon={<Loader2 size={18} className="animate-spin" color="var(--tm-text-3)" />} text={t.loading} />
          ) : suggestions?.status === 'pending' ? (
            <EmptyRow icon={<Loader2 size={18} className="animate-spin" color="var(--tm-text-3)" />} text={t.suggestionsPending} />
          ) : suggestionsError ? (
            <div className="flex items-center gap-2.5 rounded-2xl px-4 py-5" style={{ backgroundColor: 'var(--tm-subtle)' }}>
              <p className="text-xs flex-1" style={{ color: 'var(--tm-text-3)' }}>{suggestionsError}</p>
              <button
                type="button"
                onClick={() => loadSuggestions()}
                className="text-xs font-semibold shrink-0"
                style={{ color: '#059669' }}
              >
                {t.retry}
              </button>
            </div>
          ) : (
            <>
              <SuggestionMealRow label={t.breakfastLabel} recipes={suggestions?.breakfast ?? []} onOpen={openCatalogDetail} onAddToPlan={setAddToPlanRecipe} />
              <SuggestionMealRow label={t.lunchLabel} recipes={suggestions?.lunch ?? []} onOpen={openCatalogDetail} onAddToPlan={setAddToPlanRecipe} />
              <SuggestionMealRow label={t.dinnerLabel} recipes={suggestions?.dinner ?? []} onOpen={openCatalogDetail} onAddToPlan={setAddToPlanRecipe} />
            </>
          )}
        </section>

        {/* Top Recipes — most-favorited site-wide */}
        <section>
          <SectionHeading title={t.topRecipesTitle} />
          {topLoadError ? (
            <EmptyRow icon={<Heart size={18} color="var(--tm-text-3)" />} text={topLoadError} />
          ) : topRecipes === null ? (
            <EmptyRow icon={<Heart size={18} color="var(--tm-text-3)" />} text={t.loading} />
          ) : topRecipes.length === 0 ? (
            <EmptyRow icon={<Heart size={18} color="var(--tm-text-3)" />} text={t.noTopRecipesYet} />
          ) : (
            <RecipeRow>
              {topRecipes.slice(0, topVisibleLimit ?? topRecipes.length).map(fav => (
                <div key={fav.id} className={RECIPE_ROW_CARD_CLASS}>
                  <RecipeCard
                    recipe={toCardData(fav.recipe)}
                    onTap={() => openCatalogDetail(fav.recipe)}
                    onAction={() => openCatalogDetail(fav.recipe)}
                    onAddToPlan={() => setAddToPlanRecipe(fav.recipe)}
                    footer={
                      <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--tm-text-3)' }}>
                        <Heart size={11} color="#EF4444" fill="#EF4444" /> {fav.favorite_count}
                      </span>
                    }
                  />
                </div>
              ))}
            </RecipeRow>
          )}
        </section>
      </div>
    </div>
    {addToPlanRecipe && (
      <AddToPlanDialog
        recipe={addToPlanRecipe}
        onClose={() => setAddToPlanRecipe(null)}
        onAdded={() => loadMealPlan()}
      />
    )}
    </>
  )
}
