'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Clock, Flame, MessageSquare, Eye } from 'lucide-react'
import { useDarkMode } from '@/lib/use-dark-mode'
import { toSlug, storeRecipe } from '@/lib/recipe-slug'

interface FavoriteRecipe {
  id: string
  name: string
  tags: string[]
  cookingMinutes: number
  calories: number
  note?: string
  ingredients?: string
  steps?: string
}

const CARD_COLORS = ['#FFF7ED', '#EFF6FF', '#F0FDF4', '#FFF1F2']

const INITIAL_FAVORITES: FavoriteRecipe[] = [
  {
    id: 'f1',
    name: 'Quinoa Buddha Bowl',
    tags: ['Vegetarian', 'Healthy'],
    cookingMinutes: 25,
    calories: 420,
    note: 'Great for meal prep! Double the tahini dressing.',
    ingredients: '2 cups quinoa\n1 cup chickpeas\n1/2 avocado\nTahini dressing\nMixed greens',
    steps: 'Cook quinoa per package.\nRoast chickpeas at 200°C for 20 min.\nAssemble bowl with greens, quinoa, chickpeas.\nTop with avocado and tahini.',
  },
  {
    id: 'f2',
    name: 'Grilled Chicken & Veggies',
    tags: ['High Protein', 'Keto'],
    cookingMinutes: 35,
    calories: 450,
    ingredients: '2 chicken breasts\nBell pepper\nZucchini\nOlive oil\nSalt and pepper',
    steps: 'Season the chicken.\nGrill chicken and vegetables.\nSlice chicken.\nServe warm with veggies.',
  },
  {
    id: 'f3',
    name: 'Berry Oatmeal Bowl',
    tags: ['Breakfast', 'Healthy'],
    cookingMinutes: 10,
    calories: 320,
    ingredients: 'Rolled oats\nMixed berries\nHoney\nAlmond milk\nChia seeds',
    steps: 'Cook oats with almond milk.\nTop with berries and chia seeds.\nDrizzle honey and serve.',
  },
]

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="border rounded-xl p-3.5" style={{ backgroundColor: 'var(--tm-surface)', borderColor: 'var(--tm-border)' }}>
      <p className="text-xl font-bold mb-0.5" style={{ color: 'var(--tm-text)' }}>{value}</p>
      <p className="text-xs" style={{ color: 'var(--tm-text-3)' }}>{label}</p>
    </div>
  )
}

function FavoriteCard({
  recipe,
  index,
  isEditing,
  onView,
  onStartEdit,
  onSaveNote,
  onCancelEdit,
  onRemove,
}: {
  recipe: FavoriteRecipe
  index: number
  isEditing: boolean
  onView: () => void
  onStartEdit: () => void
  onSaveNote: (note: string) => void
  onCancelEdit: () => void
  onRemove: () => void
}) {
  const dark = useDarkMode()
  const cardBg = dark ? '#0B1B38' : CARD_COLORS[index % CARD_COLORS.length]
  const cardBorder = dark ? '#274A73' : 'var(--tm-border)'
  const tagBg = dark ? '#102647' : 'var(--tm-surface)'
  const tagBorder = dark ? '#274A73' : 'var(--tm-border)'
  const tagText = dark ? '#CBD5E1' : 'var(--tm-text-2)'
  const [noteInput, setNoteInput] = useState(recipe.note ?? '')

  useEffect(() => {
    if (isEditing) setNoteInput(recipe.note ?? '')
  }, [isEditing, recipe.note])

  return (
    <div className="border rounded-xl p-4" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
      <div className="flex items-start justify-between mb-1.5">
        <p className="font-bold text-sm flex-1 mr-2" style={{ color: 'var(--tm-text)' }}>{recipe.name}</p>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onView} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors" style={{ color: '#059669' }}>
            <Eye size={13} /> View
          </button>
          <button onClick={onRemove} className="hover:opacity-70 transition-opacity">
            <Heart size={18} fill="#EF4444" color="#EF4444" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-2.5">
        <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--tm-text-3)' }}>
          <Clock size={11} /> {recipe.cookingMinutes} min
        </span>
        <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--tm-text-3)' }}>
          <Flame size={11} /> {recipe.calories} cal
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {recipe.tags.map(tag => (
          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full border" style={{ backgroundColor: tagBg, color: tagText, borderColor: tagBorder }}>{tag}</span>
        ))}
      </div>

      {/* Note bubble */}
      {recipe.note && !isEditing && (
        <div
          className="rounded-lg px-3 py-2 mb-2.5 text-xs leading-relaxed"
          style={{ backgroundColor: '#FEF9C3', color: '#92400E', border: '1px solid #FDE68A' }}
        >
          {recipe.note}
        </div>
      )}

      {/* Inline note editor */}
      {isEditing ? (
        <div>
          <textarea
            value={noteInput}
            onChange={e => setNoteInput(e.target.value)}
            rows={2}
            placeholder="Add a personal note..."
            className="w-full px-2.5 py-2 border rounded-lg text-xs resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            style={{ backgroundColor: 'var(--tm-surface)', borderColor: 'var(--tm-border-i)', color: 'var(--tm-text-2)' }}
          />
          <div className="flex gap-2 mt-1.5">
            <button
              onClick={onCancelEdit}
              className="flex-1 py-1.5 border rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
              style={{ borderColor: 'var(--tm-border-i)', color: 'var(--tm-text-2)' }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSaveNote(noteInput)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ backgroundColor: '#059669' }}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onStartEdit}
          className="flex items-center gap-1.5 text-xs border rounded-lg px-3 py-1.5 transition-colors"
          style={{ backgroundColor: 'var(--tm-surface)', borderColor: 'var(--tm-border)', color: 'var(--tm-text-2)' }}
        >
          <MessageSquare size={12} />
          {recipe.note ? 'Edit Note' : 'Add Note'}
        </button>
      )}
    </div>
  )
}


export default function FavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([])
  const [loaded, setLoaded] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  function openDetail(recipe: FavoriteRecipe, index: number) {
    storeRecipe({
      id: recipe.id,
      name: recipe.name,
      ingredients: recipe.ingredients ?? '',
      steps: recipe.steps ?? '',
      labels: recipe.tags,
      cookingMinutes: recipe.cookingMinutes,
      calories: recipe.calories,
      cardColor: CARD_COLORS[index % CARD_COLORS.length],
      source: 'favorites',
    })
    router.push(`/recipe/${toSlug(recipe.name)}`)
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem('fh_favorites')
      setFavorites(stored ? JSON.parse(stored) : INITIAL_FAVORITES)
    } catch {
      setFavorites(INITIAL_FAVORITES)
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem('fh_favorites', JSON.stringify(favorites))
  }, [favorites, loaded])

  function saveNote(id: string, note: string) {
    setFavorites(prev => prev.map(f => f.id === id ? { ...f, note: note.trim() || undefined } : f))
    setEditingId(null)
  }

  function removeFavorite(id: string) {
    setFavorites(prev => prev.filter(f => f.id !== id))
    if (editingId === id) setEditingId(null)
  }

  if (!loaded) return null

  const stats = {
    total: favorites.length,
    withNotes: favorites.filter(f => f.note).length,
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Heart size={20} fill="#EF4444" color="#EF4444" />
        <h1 className="text-xl font-bold" style={{ color: 'var(--tm-text)' }}>Favorite Recipes</h1>
      </div>
      <p className="text-sm mb-5" style={{ color: 'var(--tm-text-2)' }}>Your saved recipes with personal notes</p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard value={stats.total} label="Total Saved" />
        <StatCard value={stats.withNotes} label="With Notes" />
      </div>

      {/* Cards */}
      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart size={40} color="#E5E7EB" className="mb-3" />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--tm-text)' }}>No favorites yet</p>
          <p className="text-xs" style={{ color: 'var(--tm-text-3)' }}>Save recipes from the Search page to see them here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {favorites.map((recipe, index) => (
            <FavoriteCard
              key={recipe.id}
              recipe={recipe}
              index={index}
              isEditing={editingId === recipe.id}
              onView={() => openDetail(recipe, index)}
              onStartEdit={() => setEditingId(recipe.id)}
              onSaveNote={note => saveNote(recipe.id, note)}
              onCancelEdit={() => setEditingId(null)}
              onRemove={() => removeFavorite(recipe.id)}
            />
          ))}
        </div>
      )}

    </div>
  )
}
