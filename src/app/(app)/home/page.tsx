'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, ChevronLeft, ChevronRight, RefreshCw, Loader2, CalendarDays, UtensilsCrossed } from 'lucide-react'
import { hasAccessToken } from '@/lib/auth'
import { ApiError } from '@/lib/api-client'
import { getTopFavorites } from '@/lib/api/favorites'
import { getTodaySuggestions, refreshTodaySuggestions, getMealPlan, localIsoDate, type MealSuggestion, type MealPlan } from '@/lib/api/meals'
import type { ApiRecipe, TopFavoriteRecipe } from '@/lib/api/types'
import { getLang } from '@/lib/i18n'
import { RecipeCard, type RecipeCardData } from '@/components/recipe/recipe-card'
import { getOrEstimateMeta } from '@/lib/recipe-meta'
import { buildRecipeSlug } from '@/lib/recipe-slug'
import { useDarkMode } from '@/lib/use-dark-mode'
import { useLang } from '@/lib/use-lang'
import { useStrings } from '@/lib/use-strings'
import type { Strings } from '@/lib/strings'
import { AddToPlanDialog } from '@/components/meal-plan/add-to-plan-dialog'

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

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback
  if (err instanceof Error) return err.message
  return fallback
}

// ─── Home sections (Recommended / Top) ─────────────────────────────────────────

// Shared card width so Recommended/Top rows line up at the same size.
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

/** Horizontal-scrolling strip of fixed-width cards — used for the Top Recipes row.
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

/** Pulsing placeholder matching a RecipeCard's proportions, shown while today's
 * suggestions are still generating instead of collapsing all three meal rows
 * into one generic spinner. */
function SuggestionCardSkeleton() {
  return (
    <div
      className={`${RECIPE_ROW_CARD_CLASS} rounded-[20px] overflow-hidden animate-pulse`}
      style={{ backgroundColor: 'var(--tm-surface)', border: '1px solid var(--tm-border-i)' }}
    >
      <div style={{ height: 180, backgroundColor: 'var(--tm-subtle)' }} />
      <div className="px-3 pt-2.5 pb-3 space-y-2">
        <div className="h-4 rounded-full" style={{ backgroundColor: 'var(--tm-subtle)', width: '85%' }} />
        <div className="h-3 rounded-full" style={{ backgroundColor: 'var(--tm-subtle)', width: '45%' }} />
      </div>
    </div>
  )
}

function SuggestionMealRowSkeleton({ label }: { label: string }) {
  return (
    <div className="mb-3.5">
      <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--tm-text-2)' }}>{label}</p>
      <div className="flex gap-3 overflow-hidden">
        <SuggestionCardSkeleton />
        <SuggestionCardSkeleton />
      </div>
    </div>
  )
}

/** Dashed placeholder card for a meal slot with no suggestion yet — replaces a
 * bare line of gray text with something that actually looks intentional. */
function SuggestionEmptyCard({ text }: { text: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1.5 rounded-2xl text-center py-6"
      style={{ border: '1.5px dashed var(--tm-border-i)', backgroundColor: 'var(--tm-subtle)' }}
    >
      <UtensilsCrossed size={18} color="var(--tm-text-3)" />
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
        <SuggestionEmptyCard text={t.noSuggestionsForMeal} />
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const t = useStrings()
  const lang = useLang()
  const [topRecipes, setTopRecipes] = useState<TopFavoriteRecipe[] | null>(null)
  const [topLoadError, setTopLoadError] = useState('')
  const rowContainerRef = useRef<HTMLDivElement>(null)
  const [topVisibleLimit, setTopVisibleLimit] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<MealSuggestion | null>(null)
  const [suggestionsLoading, setSuggestionsLoading] = useState(true)
  const [suggestionsError, setSuggestionsError] = useState('')
  const suggestionDateRef = useRef(localIsoDate())
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [addToPlanRecipe, setAddToPlanRecipe] = useState<ApiRecipe | null>(null)

  async function loadTopRecipes() {
    if (!hasAccessToken()) {
      setTopRecipes([])
      return
    }
    setTopLoadError('')
    try {
      const top = await getTopFavorites(getLang())
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

  async function loadSuggestions(refresh = false) {
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
      setSuggestionsLoading(false)
      setSuggestionsError(data.status === 'failed' ? (data.error_message || t.suggestionsFailed) : '')
    } catch (err) {
      setSuggestionsLoading(false)
      setSuggestionsError(errorMessage(err, t.suggestionsFailed))
    }
  }

  useEffect(() => {
    loadTopRecipes()
    loadSuggestions()
    loadMealPlan()
    // Re-runs whenever the active language changes (Profile toggle, or a fresh
    // login applying the account's saved language) so recipe content refetches
    // in the right locale instead of staying in whatever it first loaded as.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

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

  /** Recommended-for-you / Top Recipes cards aren't owned by the user — open the
   * read-only search detail view instead of the edit/delete-capable personal one. */
  function openCatalogDetail(recipe: ApiRecipe) {
    router.push(`/search/${buildRecipeSlug(recipe.id, recipe.title)}`)
  }

  return (
    <>
    <div className="flex flex-col h-full p-3">
      {/* Greeting hero */}
      <div
        className="rounded-2xl p-4 mb-3 shrink-0"
        style={{ background: 'linear-gradient(135deg, #059669, #047857)', boxShadow: '0 6px 16px rgba(5,150,105,0.3)' }}
      >
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>{greeting(t)}</p>
        <p className="text-xl font-extrabold text-white tracking-tight">{t.homeTagline}</p>
      </div>

      <div ref={rowContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden pt-1 space-y-5">
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
          {suggestionsLoading ? (
            <>
              <SuggestionMealRowSkeleton label={t.breakfastLabel} />
              <SuggestionMealRowSkeleton label={t.lunchLabel} />
              <SuggestionMealRowSkeleton label={t.dinnerLabel} />
            </>
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
