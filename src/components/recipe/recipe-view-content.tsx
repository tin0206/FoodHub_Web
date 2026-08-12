'use client'

import { Clock, Flame, ShoppingBasket, ListOrdered, Tag, Utensils } from 'lucide-react'
import { useDarkMode } from '@/lib/use-dark-mode'
import { resolveMediaUrl } from '@/lib/api-client'
import type { ApiRecipe } from '@/lib/api/types'
import type { RecipeMeta } from '@/lib/recipe-meta'
import type { RecipeCardTheme } from './recipe-card-theme'
import { SectionCard } from './section-card'

export function RecipeViewContent({
  recipe, theme, meta,
}: { recipe: ApiRecipe; theme: RecipeCardTheme; meta: RecipeMeta }) {
  const dark = useDarkMode()
  const image = resolveMediaUrl(recipe.image_url)

  return (
    <div>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={recipe.title} className="w-full h-44 object-cover rounded-xl mb-3" />
      ) : (
        <div
          className="w-full h-44 rounded-xl mb-3 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${theme.start}, ${theme.end})` }}
        >
          <Utensils size={32} color="rgba(255,255,255,0.9)" />
        </div>
      )}

      <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--tm-text)' }}>
        {recipe.title}
      </h1>

      <div className="flex items-center gap-4 mb-3 text-sm" style={{ color: 'var(--tm-text-2)' }}>
        <span className="flex items-center gap-1.5">
          <Clock size={14} color={theme.start} /> {meta.cookingMinutes} min
        </span>
        <span className="flex items-center gap-1.5">
          <Flame size={14} color={theme.start} /> {meta.calories} cal
        </span>
      </div>

      <div className="space-y-2.5">
        <SectionCard icon={<ShoppingBasket size={15} />} title="Ingredients" accent={theme.start}>
          <div className="space-y-2">
            {recipe.ingredients.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: theme.start }} />
                <p className="text-sm" style={{ color: 'var(--tm-text-2)' }}>{item}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard icon={<ListOrdered size={15} />} title="Instructions" accent={theme.start}>
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
          <SectionCard icon={<Tag size={15} />} title="Labels" accent={theme.start}>
            <div className="flex flex-wrap gap-2">
              {recipe.dietary_restrictions.map(label => (
                <span
                  key={label}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${theme.start}${dark ? '26' : '14'}`, color: dark ? `${theme.start}E6` : theme.end }}
                >
                  {label}
                </span>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  )
}
