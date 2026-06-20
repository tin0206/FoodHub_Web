'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Clock, Flame, ChevronRight, Filter } from 'lucide-react'
import { useDarkMode } from '@/lib/use-dark-mode'
import { toSlug, storeRecipe } from '@/lib/recipe-slug'

interface SearchRecipe {
  id: string
  name: string
  ingredients: string
  steps: string
  tags: string[]
  categories: string[]
  cookingMinutes: number
  calories: number
}

const CARD_COLORS = ['#FFF7ED', '#EFF6FF', '#F0FDF4', '#FFF1F2']

const CATEGORIES = [
  'Breakfast', 'Lunch', 'Dinner', 'Vegan',
  'Quick Meals', 'High Protein', 'Gluten Free', 'Keto',
]

const RECIPES: SearchRecipe[] = [
  {
    id: 's1',
    name: 'Quinoa Buddha Bowl',
    ingredients: '2 cups quinoa\n1 cup chickpeas\n1/2 avocado\nTahini dressing\nMixed greens',
    steps: 'Cook quinoa per package.\nRoast chickpeas at 200°C for 20 min.\nAssemble bowl with greens, quinoa, chickpeas.\nTop with avocado and tahini.',
    tags: ['Vegetarian', 'Healthy'],
    categories: ['Lunch', 'Vegan', 'Quick Meals'],
    cookingMinutes: 25,
    calories: 420,
  },
  {
    id: 's2',
    name: 'Classic Italian Pasta',
    ingredients: '200g pasta\nTomato sauce\nGarlic\nParmesan\nFresh basil',
    steps: 'Boil pasta until al dente.\nSimmer sauce with garlic.\nToss pasta with sauce.\nTop with parmesan and basil.',
    tags: ['Italian'],
    categories: ['Dinner'],
    cookingMinutes: 30,
    calories: 580,
  },
  {
    id: 's3',
    name: 'Grilled Chicken & Veggies',
    ingredients: '2 chicken breasts\nBell pepper\nZucchini\nOlive oil\nSalt and pepper',
    steps: 'Season the chicken.\nGrill chicken and vegetables.\nSlice chicken.\nServe warm with veggies.',
    tags: ['High Protein'],
    categories: ['Lunch', 'High Protein', 'Keto'],
    cookingMinutes: 35,
    calories: 450,
  },
  {
    id: 's4',
    name: 'Fresh Garden Salad',
    ingredients: 'Lettuce\nCucumber\nCherry tomatoes\nOlive oil\nLemon juice',
    steps: 'Wash vegetables.\nChop all ingredients.\nMix dressing.\nToss and serve.',
    tags: ['Vegan'],
    categories: ['Lunch', 'Quick Meals', 'Gluten Free'],
    cookingMinutes: 15,
    calories: 280,
  },
]


function SearchRecipeCard({ recipe, index, onView }: { recipe: SearchRecipe; index: number; onView: () => void }) {
  const dark = useDarkMode()
  const cardBg = dark ? '#07152D' : CARD_COLORS[index % CARD_COLORS.length]
  const cardBorder = dark ? '#274A73' : 'var(--tm-border)'
  const tagBg = dark ? '#102647' : 'var(--tm-subtle)'
  const tagBorder = dark ? '#274A73' : 'var(--tm-border)'
  const tagText = dark ? '#CBD5E1' : 'var(--tm-text-3)'
  return (
    <div
      className="p-3.5 rounded-[14px] border cursor-pointer hover:shadow-sm transition-shadow"
      style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      onClick={onView}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm mb-1.5" style={{ color: '#059669' }}>{recipe.name}</p>
          <div className="flex items-center gap-4 mb-2">
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--tm-text-3)' }}>
              <Clock size={11} /> {recipe.cookingMinutes} min
            </span>
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--tm-text-3)' }}>
              <Flame size={11} /> {recipe.calories} cal
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full border" style={{ backgroundColor: tagBg, color: tagText, borderColor: tagBorder }}>{tag}</span>
            ))}
          </div>
        </div>
        <ChevronRight size={18} color="var(--tm-text-3)" className="shrink-0 mt-0.5" />
      </div>
    </div>
  )
}

export default function SearchPage() {
  const router = useRouter()
  const dark = useDarkMode()
  const [query, setQuery] = useState('')
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set())

  function toggleCategory(cat: string) {
    setActiveCategories(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  function openDetail(recipe: SearchRecipe, index: number) {
    storeRecipe({
      name: recipe.name,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      labels: recipe.tags,
      cookingMinutes: recipe.cookingMinutes,
      calories: recipe.calories,
      cardColor: CARD_COLORS[index % CARD_COLORS.length],
      source: 'search',
    })
    router.push(`/recipe/${toSlug(recipe.name)}`)
  }

  const isFiltering = !!query.trim() || activeCategories.size > 0

  const filtered = RECIPES.filter(r => {
    const q = query.trim().toLowerCase()
    const matchesQuery = !q || r.name.toLowerCase().includes(q) || r.ingredients.toLowerCase().includes(q)
    const matchesCat = activeCategories.size === 0 || r.categories.some(c => activeCategories.has(c))
    return matchesQuery && matchesCat
  })

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <h1 className="text-xl font-bold mb-0.5" style={{ color: 'var(--tm-text)' }}>Search Recipes</h1>
      <p className="text-sm mb-4" style={{ color: 'var(--tm-text-2)' }}>Find the perfect recipe for your next meal</p>

      {/* Search bar */}
      <div className="relative mb-5">
        <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none" style={{ color: 'var(--tm-text-3)' }}>
          <Search size={16} />
        </span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by recipe name, ingredients, or cuisine..."
          className="w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          style={{ backgroundColor: 'var(--tm-surface)', borderColor: 'var(--tm-border)', color: 'var(--tm-text)' }}
        />
        <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none" style={{ color: 'var(--tm-text-3)' }}>
          <Filter size={15} />
        </span>
      </div>

      {/* Category chips */}
      <div className="mb-5">
        <p className="text-xs mb-2.5" style={{ color: 'var(--tm-text-3)' }}>Popular categories</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => {
            const active = activeCategories.has(cat)
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className="text-[11px] px-3 py-1.5 rounded-full border transition-colors"
                style={{
                  backgroundColor: active ? '#059669' : (dark ? '#102647' : 'var(--tm-surface)'),
                  color: active ? 'white' : (dark ? '#CBD5E1' : 'var(--tm-text-2)'),
                  borderColor: active ? '#059669' : (dark ? '#274A73' : 'var(--tm-border)'),
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs" style={{ color: 'var(--tm-text-3)' }}>
          {isFiltering ? 'Results' : 'Recent recipes'}
        </p>
        {isFiltering && (
          <p className="text-xs font-medium" style={{ color: '#059669' }}>
            Showing {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search size={32} color="#D1D5DB" className="mb-3" />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--tm-text)' }}>No recipes found</p>
          <p className="text-xs" style={{ color: 'var(--tm-text-3)' }}>Try a different search term or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {filtered.map((recipe, index) => (
            <SearchRecipeCard
              key={recipe.id}
              recipe={recipe}
              index={index}
              onView={() => openDetail(recipe, RECIPES.indexOf(recipe))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
