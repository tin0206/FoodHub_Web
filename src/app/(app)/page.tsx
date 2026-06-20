'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Plus, X, Eye } from 'lucide-react'
import { useDarkMode } from '@/lib/use-dark-mode'
import { toSlug, storeRecipe } from '@/lib/recipe-slug'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Recipe {
  id: string
  name: string
  ingredients: string
  steps: string
  labels: string[]
  cookingMinutes: number
  calories: number
}

type View = 'list' | 'add'

// ─── Constants ────────────────────────────────────────────────────────────────

const CARD_COLORS = [
  '#FFF7ED', '#EFF6FF', '#F0FDF4', '#FDF4FF', '#FFF1F2', '#FEFCE8',
]

const AVAILABLE_LABELS = [
  'Vegetarian', 'Vegan', 'Healthy', 'Italian', 'Asian', 'Mexican',
  'Comfort Food', 'High Protein', 'Keto', 'Low Carb', 'Quick', 'Dessert',
]

const INITIAL_RECIPES: Recipe[] = [
  {
    id: '1',
    name: 'Quinoa Buddha Bowl',
    ingredients: '1 cup quinoa\n1 avocado\n1 carrot\nSpinach\nTahini sauce',
    steps: 'Cook quinoa.\nSlice vegetables.\nAssemble bowl and drizzle sauce.',
    labels: ['Vegetarian', 'Healthy'],
    cookingMinutes: 25,
    calories: 420,
  },
  {
    id: '2',
    name: 'Classic Italian Pasta',
    ingredients: '200g pasta\nTomato sauce\nGarlic\nParmesan\nBasil',
    steps: 'Boil pasta.\nSimmer sauce with garlic.\nToss and top with parmesan.',
    labels: ['Italian', 'Comfort Food'],
    cookingMinutes: 30,
    calories: 550,
  },
  {
    id: '3',
    name: 'Grilled Chicken & Veggies',
    ingredients: '2 chicken breasts\nBell pepper\nZucchini\nOlive oil\nSalt & pepper',
    steps: 'Season chicken.\nGrill chicken and veggies.\nSlice and serve warm.',
    labels: ['High Protein', 'Keto'],
    cookingMinutes: 35,
    calories: 600,
  },
]

function ingredientSummary(raw: string): string {
  const items = raw.split('\n').map(s => s.trim()).filter(Boolean)
  if (items.length <= 3) return items.join(', ')
  return `${items.slice(0, 3).join(', ')}, ...`
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const dark = useDarkMode()
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div
        className="w-[68px] h-[68px] rounded-[18px] flex items-center justify-center mb-3"
        style={{ backgroundColor: dark ? '#1E293B' : '#E5E7EB' }}
      >
        <BookOpen size={34} color={dark ? '#94A3B8' : '#6B7280'} />
      </div>
      <p className="text-[17px] font-bold mb-1" style={{ color: 'var(--tm-text)' }}>No recipes yet</p>
      <p className="text-xs text-center mb-3.5 max-w-[240px]" style={{ color: 'var(--tm-text-3)' }}>
        Add your own recipes and share your culinary creations
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white"
        style={{ backgroundColor: '#10B981' }}
      >
        <Plus size={16} />
        Add your first recipe
      </button>
    </div>
  )
}

// ─── Recipe card ──────────────────────────────────────────────────────────────

function RecipeCard({
  recipe,
  index,
  onView,
}: {
  recipe: Recipe
  index: number
  onView: () => void
}) {
  const dark = useDarkMode()
  const cardBg = dark ? '#0B1B38' : CARD_COLORS[index % CARD_COLORS.length]
  const cardBorder = dark ? '#274A73' : 'var(--tm-border)'
  const tagBg = dark ? '#102647' : 'var(--tm-surface)'
  const tagBorder = dark ? '#274A73' : 'var(--tm-border)'
  const tagText = dark ? '#CBD5E1' : 'var(--tm-text-2)'
  return (
    <div
      className="p-3 rounded-[12px] border"
      style={{ backgroundColor: cardBg, borderColor: cardBorder }}
    >
      <div className="flex items-start justify-between mb-1">
        <p className="font-bold text-sm flex-1 mr-2" style={{ color: 'var(--tm-text)' }}>{recipe.name}</p>
        <button
          onClick={onView}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors shrink-0"
          style={{ color: '#059669' }}
        >
          <Eye size={13} />
          View
        </button>
      </div>
      <p className="text-sm truncate mb-2" style={{ color: 'var(--tm-text-2)' }}>
        {ingredientSummary(recipe.ingredients)}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {recipe.labels.map(label => (
          <span
            key={label}
            className="text-[11px] px-2 py-0.5 rounded-full border"
            style={{ backgroundColor: tagBg, color: tagText, borderColor: tagBorder }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Add recipe form ──────────────────────────────────────────────────────────

function AddRecipeForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void
  onSave: (r: Recipe) => void
}) {
  const [name, setName] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [steps, setSteps] = useState('')
  const [cookingMinutes, setCookingMinutes] = useState('')
  const [calories, setCalories] = useState('')
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  function toggleLabel(label: string) {
    setSelectedLabels(prev => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }

  function handleSave() {
    const mins = parseInt(cookingMinutes)
    const cals = parseInt(calories)
    if (!name.trim() || !ingredients.trim() || !steps.trim() || isNaN(mins) || mins <= 0 || isNaN(cals) || cals <= 0) {
      setError('Please fill in all required fields.')
      return
    }
    onSave({
      id: crypto.randomUUID(),
      name: name.trim(),
      ingredients: ingredients.trim(),
      steps: steps.trim(),
      labels: [...selectedLabels],
      cookingMinutes: mins,
      calories: cals,
    })
  }

  const field = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent'

  return (
    <div className="flex flex-col h-full rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--tm-surface)', borderColor: 'var(--tm-border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--tm-border)' }}>
        <p className="text-sm font-bold" style={{ color: 'var(--tm-text)' }}>Add Recipe</p>
        <button onClick={onCancel} className="hover:text-gray-600 transition-colors" style={{ color: 'var(--tm-text-3)' }}>
          <X size={16} />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {error && <p className="text-xs text-red-500">{error}</p>}

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--tm-text)' }}>Recipe Name *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Spaghetti Bolognese"
            className={field}
            style={{ borderColor: 'var(--tm-border-i)' }}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--tm-text)' }}>Cooking time * (min)</label>
            <input
              type="number"
              value={cookingMinutes}
              onChange={e => setCookingMinutes(e.target.value)}
              placeholder="30"
              className={field}
              style={{ borderColor: 'var(--tm-border-i)' }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--tm-text)' }}>Calories * (cal)</label>
            <input
              type="number"
              value={calories}
              onChange={e => setCalories(e.target.value)}
              placeholder="500"
              className={field}
              style={{ borderColor: 'var(--tm-border-i)' }}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--tm-text)' }}>
            Ingredients * <span className="font-normal" style={{ color: 'var(--tm-text-3)' }}>(one per line)</span>
          </label>
          <textarea
            value={ingredients}
            onChange={e => setIngredients(e.target.value)}
            rows={4}
            placeholder={'1 cup rice\n2 eggs\n...'}
            className={field + ' resize-none'}
            style={{ borderColor: 'var(--tm-border-i)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--tm-text)' }}>
            Steps * <span className="font-normal" style={{ color: 'var(--tm-text-3)' }}>(one per line)</span>
          </label>
          <textarea
            value={steps}
            onChange={e => setSteps(e.target.value)}
            rows={4}
            placeholder={'Boil water.\nAdd rice.\n...'}
            className={field + ' resize-none'}
            style={{ borderColor: 'var(--tm-border-i)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--tm-text)' }}>Labels</label>
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_LABELS.map(label => {
              const selected = selectedLabels.has(label)
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleLabel(label)}
                  className="text-[11px] px-2.5 py-1 rounded-full border transition-colors"
                  style={{
                    backgroundColor: selected ? '#059669' : 'var(--tm-surface)',
                    color: selected ? 'white' : 'var(--tm-text-2)',
                    borderColor: selected ? '#059669' : 'var(--tm-border-i)',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-2 px-4 py-3 border-t shrink-0" style={{ borderColor: 'var(--tm-border)' }}>
        <button
          onClick={onCancel}
          className="flex-1 py-2 border rounded-lg text-sm font-medium transition-colors hover:bg-gray-50"
          style={{ borderColor: 'var(--tm-border-i)', color: 'var(--tm-text-2)' }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#059669' }}
        >
          Save
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState<View>('list')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('fh_recipes')
      setRecipes(stored ? JSON.parse(stored) : INITIAL_RECIPES)
    } catch {
      setRecipes(INITIAL_RECIPES)
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem('fh_recipes', JSON.stringify(recipes))
  }, [recipes, loaded])

  function addRecipe(recipe: Recipe) {
    setRecipes(prev => [...prev, recipe])
    setView('list')
  }

  function openDetail(index: number) {
    const recipe = recipes[index]
    storeRecipe({
      id: recipe.id,
      name: recipe.name,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      labels: recipe.labels,
      cookingMinutes: recipe.cookingMinutes,
      calories: recipe.calories,
      cardColor: CARD_COLORS[index % CARD_COLORS.length],
      source: 'home',
    })
    router.push(`/recipe/${toSlug(recipe.name)}`)
  }

  if (!loaded) return null

  // ── Add form ──
  if (view === 'add') {
    return (
      <div className="h-full p-3">
        <AddRecipeForm onCancel={() => setView('list')} onSave={addRecipe} />
      </div>
    )
  }

  // ── List view ──
  return (
    <div className="flex flex-col h-full p-3">
      {/* Header */}
      <div className="flex items-center mb-1 shrink-0">
        <BookOpen size={18} color="#059669" />
        <h1 className="text-base font-bold ml-2" style={{ color: 'var(--tm-text)' }}>My Recipes</h1>
        <div className="flex-1" />
        <button
          onClick={() => setView('add')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#059669' }}
        >
          <Plus size={15} />
          Add Recipe
        </button>
      </div>
      <p className="text-sm mb-2 shrink-0" style={{ color: 'var(--tm-text-2)' }}>
        Your personal recipe collection
      </p>

      {/* Content */}
      {recipes.length === 0 ? (
        <EmptyState onAdd={() => setView('add')} />
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2.5 pt-1">
          {recipes.map((recipe, index) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              index={index}
              onView={() => openDetail(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
