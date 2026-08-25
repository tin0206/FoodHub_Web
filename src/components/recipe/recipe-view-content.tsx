'use client'

import { useState } from 'react'
import { Clock, Flame, ShoppingBasket, ListOrdered, Tag, Users, Utensils } from 'lucide-react'
import { useDarkMode } from '@/lib/use-dark-mode'
import { useStrings } from '@/lib/use-strings'
import type { Strings } from '@/lib/strings'
import { resolveMediaUrl } from '@/lib/api-client'
import type { ApiRecipe, RecipeNutrition } from '@/lib/api/types'
import type { RecipeMeta } from '@/lib/recipe-meta'
import type { RecipeCardTheme } from './recipe-card-theme'
import { SectionCard } from './section-card'

const CALORIES_KEY = 'Calories (kcal)'
const PROTEIN_KEY = 'Protein (g)'
const CARBS_KEY = 'Carbohydrates (g)'
const FAT_KEY = 'Fat (g)'
const CORE_NUTRITION_KEYS = [CALORIES_KEY, PROTEIN_KEY, CARBS_KEY, FAT_KEY]

export function formatAmount(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '')
}

/** Prefers the server's pre-formatted nutrition display strings, then falls
 * back to composing from mapped_ingredients, then to the legacy text list. */
export function ingredientLines(recipe: ApiRecipe): string[] {
  if (recipe.nutrition?.ingredients?.length) {
    return recipe.nutrition.ingredients.map((i) => i.display_string)
  }
  if (recipe.mapped_ingredients?.length) {
    return recipe.mapped_ingredients.map(
      (m) => `${formatAmount(m.amount)} ${m.unit} ${m.natural_name || m.mapped_name}`,
    )
  }
  return recipe.ingredients
}

function macroChip(value: number | undefined, unitLabel: string, accent: string, dark: boolean) {
  return (
    <div
      className="flex-1 rounded-lg py-1.5 px-1 text-center"
      style={{ backgroundColor: `${accent}${dark ? '20' : '14'}` }}
    >
      <p className="text-[11px] font-bold truncate" style={{ color: 'var(--tm-text)' }}>
        {value != null ? `${formatAmount(value)} ${unitLabel}` : '—'}
      </p>
    </div>
  )
}

/** Mirrors the mobile app's nutrition block: a "Per serving" caption, a row of
 * four macro chips (calories/protein/carbs/fat), and any other nutrients the
 * server sends tucked behind a "More nutrition" toggle. */
function NutritionBlock({ nutrition, accent, t }: { nutrition: RecipeNutrition; accent: string; t: Strings }) {
  const dark = useDarkMode()
  const [showMore, setShowMore] = useState(false)
  const perServing = nutrition.per_serving
  const extraEntries = Object.entries(perServing).filter(([key]) => !CORE_NUTRITION_KEYS.includes(key))

  return (
    <div>
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--tm-text-2)' }}>
        {t.perServingLabel}
      </p>
      <div className="flex gap-2">
        {macroChip(perServing[CALORIES_KEY], t.calSuffix, accent, dark)}
        {macroChip(perServing[PROTEIN_KEY], `g ${t.proteinShort}`, accent, dark)}
        {macroChip(perServing[CARBS_KEY], `g ${t.carbsShort}`, accent, dark)}
        {macroChip(perServing[FAT_KEY], `g ${t.fatShort}`, accent, dark)}
      </div>
      {extraEntries.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="mt-2 text-xs font-semibold"
            style={{ color: accent }}
          >
            {showMore ? t.hideNutrition : t.moreNutrition}
          </button>
          {showMore && (
            <div className="mt-2 space-y-1">
              {extraEntries.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--tm-text-2)' }}>{key}</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--tm-text)' }}>
                    {formatAmount(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function RecipeViewContent({
  recipe, theme, meta, secondaryStat = 'all',
}: {
  recipe: ApiRecipe
  theme: RecipeCardTheme
  meta: RecipeMeta
  secondaryStat?: 'calories' | 'servings' | 'all'
}) {
  const dark = useDarkMode()
  const t = useStrings()
  const image = resolveMediaUrl(recipe.image_url)

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-6 lg:items-start">
      {/* Image + title/stats — capped width on wide screens so the photo scales by
          aspect ratio instead of stretching full-bleed and looking pixelated. */}
      <div className="lg:sticky lg:top-0">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={recipe.title} className="w-full aspect-4/3 object-cover rounded-2xl mb-3" />
        ) : (
          <div
            className="w-full aspect-4/3 rounded-2xl mb-3 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${theme.start}, ${theme.end})` }}
          >
            <Utensils size={40} color="rgba(255,255,255,0.9)" />
          </div>
        )}

        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--tm-text)' }}>
          {recipe.title}
        </h1>

        <div className="flex items-center gap-4 mb-3 lg:mb-0 text-sm flex-wrap" style={{ color: 'var(--tm-text-2)' }}>
          <span className="flex items-center gap-1.5">
            <Clock size={14} color={theme.start} /> {meta.cookingMinutes} {t.minSuffix}
          </span>
          {(secondaryStat === 'servings' || secondaryStat === 'all') && recipe.estimated_servings != null && (
            <span className="flex items-center gap-1.5">
              <Users size={14} color={theme.start} /> {recipe.estimated_servings} {t.servingsSuffix}
            </span>
          )}
          {(secondaryStat === 'calories' || secondaryStat === 'all') && (
            <span className="flex items-center gap-1.5">
              <Flame size={14} color={theme.start} /> {meta.calories} {t.calSuffix}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2.5 mt-3 lg:mt-0">
        <SectionCard icon={<ShoppingBasket size={15} />} title={t.ingredientsLabel} accent={theme.start}>
          <div className="space-y-2">
            {ingredientLines(recipe).map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: theme.start }} />
                <p className="text-sm" style={{ color: 'var(--tm-text-2)' }}>{item}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {recipe.nutrition && (
          <SectionCard icon={<Flame size={15} />} title={t.nutritionLabel} accent={theme.start}>
            <NutritionBlock nutrition={recipe.nutrition} accent={theme.start} t={t} />
          </SectionCard>
        )}

        <SectionCard icon={<ListOrdered size={15} />} title={t.instructionsLabel} accent={theme.start}>
          <div className="space-y-3">
            {recipe.directions.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span
                  className="shrink-0 w-5.5 h-5.5 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{ backgroundColor: `${theme.start}${dark ? '2E' : '1A'}`, color: theme.start }}
                >
                  {i + 1}
                </span>
                <p className="text-sm pt-0.5" style={{ color: 'var(--tm-text-2)' }}>{step}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {recipe.dietary_restrictions.length > 0 && (
          <SectionCard icon={<Tag size={15} />} title={t.labelsLabel} accent={theme.start}>
            <div className="flex flex-wrap gap-2">
              {recipe.dietary_restrictions.map(label => (
                <span
                  key={label}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${theme.start}${dark ? '26' : '14'}`, color: dark ? `${theme.start}E6` : theme.end }}
                >
                  {t.dietaryTagDisplay(label)}
                </span>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  )
}
