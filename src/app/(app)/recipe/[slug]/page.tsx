'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, Flame, ShoppingBasket, ListOrdered, Tag, Heart } from 'lucide-react'
import { useDarkMode } from '@/lib/use-dark-mode'
import { loadRecipe, storeRecipe, type RecipeForDetail } from '@/lib/recipe-slug'

// ─── constants ────────────────────────────────────────────────────────────────

const AVAILABLE_LABELS = [
  'Dairy Free', 'Egg Free', 'Gluten Free', 'Nut Free', 'Vegan', 'Vegetarian', 'Pescetarian',
  'Healthy', 'Italian', 'Comfort Food', 'High Protein', 'Keto', 'Quick Meal', 'Meal Prep', 'Breakfast',
]

// ─── helpers ─────────────────────────────────────────────────────────────────

function parseLines(s: string) {
  return s.split('\n').map(l => l.trim()).filter(Boolean)
}

// ─── sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  icon, title, children, panelBg, panelBorder,
}: {
  icon: React.ReactNode; title: string; children: React.ReactNode
  panelBg: string; panelBorder: string
}) {
  return (
    <div className="rounded-xl border p-3.5 mb-3" style={{ backgroundColor: panelBg, borderColor: panelBorder }}>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: '#059669' }}>{icon}</span>
        <p className="text-sm font-bold" style={{ color: 'var(--tm-text)' }}>{title}</p>
      </div>
      {children}
    </div>
  )
}


function CompletionOverlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2200)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div className="bg-white rounded-2xl px-8 py-7 flex flex-col items-center shadow-xl">
        <span className="text-5xl mb-3">🎉</span>
        <p className="text-lg font-bold" style={{ color: '#0F172A' }}>Completed!</p>
        <p className="text-sm mt-1" style={{ color: '#475569' }}>Great job, chef!</p>
      </div>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function RecipeDetailPage() {
  const router = useRouter()
  const dark = useDarkMode()

  const [recipe, setRecipe] = useState<RecipeForDetail | null>(null)

  // cooking mode
  const [cooking, setCooking] = useState(false)
  const [prepStage, setPrepStage] = useState(true)
  const [stepIndex, setStepIndex] = useState(0)
  const [showComplete, setShowComplete] = useState(false)

  // edit mode (home only)
  const [editMode, setEditMode] = useState(false)
  const [editIngredients, setEditIngredients] = useState('')
  const [editSteps, setEditSteps] = useState('')
  const [editMinutes, setEditMinutes] = useState('')
  const [editCalories, setEditCalories] = useState('')
  const [editLabels, setEditLabels] = useState<Set<string>>(new Set())
  const [editError, setEditError] = useState('')

  // love (search / favorites)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    const r = loadRecipe()
    if (!r) return
    setRecipe(r)
    // check if already in favorites
    try {
      const favs: Array<{ name: string }> = JSON.parse(localStorage.getItem('fh_favorites') ?? '[]')
      setIsSaved(favs.some(f => f.name === r.name))
    } catch {}
  }, [])

  if (!recipe) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--tm-text-3)' }}>
        Recipe not found.
      </div>
    )
  }

  const source = recipe.source ?? 'search'
  const showEdit = source === 'home'
  const showLove = source === 'search' || source === 'favorites'

  const ingredients = parseLines(recipe.ingredients)
  const steps = parseLines(recipe.steps)
  const totalStages = steps.length + 1
  const currentStage = prepStage ? 1 : stepIndex + 2
  const progress = currentStage / totalStages
  const canFinish = !prepStage && stepIndex === steps.length - 1

  const panelBg = dark ? '#102647' : 'var(--tm-bg)'
  const panelBorder = dark ? '#274A73' : 'var(--tm-border)'
  const headerBg = dark ? '#0B1B38' : 'var(--tm-surface)'
  const cardBg = dark ? '#07152D' : recipe.cardColor

  // ── cooking ──────────────────────────────────────────────────────────────────

  function startCooking() { setCooking(true); setPrepStage(true); setStepIndex(0) }

  function prevStep() {
    if (prepStage) return
    if (stepIndex === 0) setPrepStage(true)
    else setStepIndex(i => i - 1)
  }

  function nextStep() {
    if (prepStage) { setPrepStage(false); setStepIndex(0) }
    else if (stepIndex < steps.length - 1) setStepIndex(i => i + 1)
  }

  function finishCooking() { setCooking(false); setShowComplete(true) }

  // ── edit ─────────────────────────────────────────────────────────────────────

  function openEdit() {
    setEditIngredients(recipe.ingredients)
    setEditSteps(recipe.steps)
    setEditMinutes(String(recipe.cookingMinutes))
    setEditCalories(String(recipe.calories))
    setEditLabels(new Set(recipe.labels))
    setEditError('')
    setEditMode(true)
  }

  function cancelEdit() { setEditMode(false); setEditError('') }

  function saveEdit() {
    const mins = parseInt(editMinutes)
    const cals = parseInt(editCalories)
    if (!editIngredients.trim() || !editSteps.trim() || isNaN(mins) || mins <= 0 || isNaN(cals) || cals <= 0) {
      setEditError('Ingredients, instructions, cooking time and calories are required.')
      return
    }
    const updated: RecipeForDetail = {
      ...recipe,
      ingredients: editIngredients.trim(),
      steps: editSteps.trim(),
      cookingMinutes: mins,
      calories: cals,
      labels: [...editLabels],
    }
    // persist to fh_recipes
    try {
      const stored: Array<Record<string, unknown>> = JSON.parse(localStorage.getItem('fh_recipes') ?? '[]')
      const next = stored.map(r =>
        (r.id === recipe.id || r.name === recipe.name)
          ? { ...r, ingredients: updated.ingredients, steps: updated.steps, cookingMinutes: mins, calories: cals, labels: updated.labels }
          : r
      )
      localStorage.setItem('fh_recipes', JSON.stringify(next))
    } catch {}
    storeRecipe(updated)
    setRecipe(updated)
    setEditMode(false)
    setEditError('')
  }

  function toggleLabel(label: string) {
    setEditLabels(prev => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }

  // ── love ─────────────────────────────────────────────────────────────────────

  function addFavorite() {
    try {
      const favs: Array<Record<string, unknown>> = JSON.parse(localStorage.getItem('fh_favorites') ?? '[]')
      const entry = {
        id: recipe.id ?? crypto.randomUUID(),
        name: recipe.name, tags: recipe.labels,
        cookingMinutes: recipe.cookingMinutes, calories: recipe.calories,
        ingredients: recipe.ingredients, steps: recipe.steps,
      }
      localStorage.setItem('fh_favorites', JSON.stringify([...favs, entry]))
      setIsSaved(true)
    } catch {}
  }

  function removeFavorite() {
    try {
      const favs: Array<{ name: string }> = JSON.parse(localStorage.getItem('fh_favorites') ?? '[]')
      localStorage.setItem('fh_favorites', JSON.stringify(favs.filter(f => f.name !== recipe.name)))
      setIsSaved(false)
    } catch {}
  }

  function handleLovePress() {
    if (isSaved) removeFavorite()
    else addFavorite()
  }

  // ── field cls ────────────────────────────────────────────────────────────────
  const fieldCls = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent'
  const fieldStyle = { backgroundColor: headerBg, borderColor: panelBorder, color: 'var(--tm-text)' }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: cardBg }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 h-10 border-b shrink-0" style={{ backgroundColor: headerBg, borderColor: panelBorder }}>
        <button onClick={() => router.back()} className="p-1 hover:opacity-70 transition-opacity" style={{ color: 'var(--tm-text-2)' }}>
          <ArrowLeft size={16} />
        </button>
        <p className="text-sm font-semibold truncate flex-1" style={{ color: 'var(--tm-text)' }}>{recipe.name}</p>
      </div>

      {/* ── Content ── */}
      {cooking ? (
        /* ── Cooking mode ── */
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full rounded-xl border p-4 flex flex-col" style={{ backgroundColor: headerBg, borderColor: panelBorder }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#05966920' }}>
                {prepStage ? <ShoppingBasket size={18} color="#059669" /> : <ListOrdered size={18} color="#059669" />}
              </div>
              <div>
                <p className="text-base font-bold" style={{ color: 'var(--tm-text)' }}>
                  {prepStage ? 'Prepare ingredients' : 'Cooking step'}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--tm-text-3)' }}>{recipe.name}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold" style={{ color: '#059669' }}>
                {prepStage ? 'Preparation' : `Step ${stepIndex + 1} of ${steps.length}`}
              </p>
              <p className="text-xs font-semibold" style={{ color: 'var(--tm-text-3)' }}>{Math.round(progress * 100)}%</p>
            </div>
            <div className="h-2 rounded-full mb-4 overflow-hidden" style={{ backgroundColor: 'var(--tm-border)' }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress * 100}%`, backgroundColor: '#059669' }} />
            </div>

            <div className="flex-1 rounded-xl border p-3.5 overflow-y-auto" style={{ backgroundColor: panelBg, borderColor: panelBorder }}>
              {prepStage ? (
                <div>
                  <p className="text-sm font-bold mb-3" style={{ color: 'var(--tm-text)' }}>Ingredients</p>
                  <div className="space-y-2.5">
                    {ingredients.map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="mt-0.5 text-sm" style={{ color: '#059669' }}>✓</span>
                        <p className="text-sm" style={{ color: 'var(--tm-text-2)' }}>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-bold leading-snug mb-3" style={{ color: 'var(--tm-text)' }}>{steps[stepIndex]}</p>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} color="var(--tm-text-3)" />
                    <p className="text-xs" style={{ color: 'var(--tm-text-3)' }}>
                      Estimated: {Math.max(1, Math.round(recipe.cookingMinutes / steps.length))} min
                    </p>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs mt-3" style={{ color: 'var(--tm-text-3)' }}>
              {prepStage ? 'Review your ingredients, then tap Next to start cooking.' : 'Follow this step, then tap Next when you are ready.'}
            </p>
          </div>
        </div>
      ) : (
        /* ── Detail / Edit view ── */
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {editMode ? (
            /* ── Edit form ── */
            <div>
              {editError && <p className="text-xs text-red-500 mb-3">{editError}</p>}

              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--tm-text-2)' }}>Cooking time (min)</label>
                  <input type="text" value={editMinutes} onChange={e => setEditMinutes(e.target.value)} className={fieldCls} style={fieldStyle} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--tm-text-2)' }}>Calories (cal)</label>
                  <input type="text" value={editCalories} onChange={e => setEditCalories(e.target.value)} className={fieldCls} style={fieldStyle} />
                </div>
              </div>

              <SectionCard icon={<ShoppingBasket size={16} />} title="Ingredients" panelBg={panelBg} panelBorder={panelBorder}>
                <textarea
                  value={editIngredients}
                  onChange={e => setEditIngredients(e.target.value)}
                  rows={5}
                  placeholder="One ingredient per line"
                  className={fieldCls + ' resize-none'}
                  style={fieldStyle}
                />
              </SectionCard>

              <SectionCard icon={<ListOrdered size={16} />} title="Instructions" panelBg={panelBg} panelBorder={panelBorder}>
                <textarea
                  value={editSteps}
                  onChange={e => setEditSteps(e.target.value)}
                  rows={6}
                  placeholder="One instruction per line"
                  className={fieldCls + ' resize-none'}
                  style={fieldStyle}
                />
              </SectionCard>

              <SectionCard icon={<Tag size={16} />} title="Labels" panelBg={panelBg} panelBorder={panelBorder}>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_LABELS.map(label => {
                    const active = editLabels.has(label)
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleLabel(label)}
                        className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                        style={{
                          backgroundColor: active ? '#059669' : headerBg,
                          color: active ? 'white' : 'var(--tm-text-2)',
                          borderColor: active ? '#059669' : panelBorder,
                        }}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </SectionCard>
            </div>
          ) : (
            /* ── Normal view ── */
            <div>
              <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--tm-text)' }}>{recipe.name}</h1>

              <div className="flex items-center gap-5 mb-4">
                <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--tm-text-2)' }}>
                  <Clock size={14} color="#059669" /> {recipe.cookingMinutes} min
                </span>
                <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--tm-text-2)' }}>
                  <Flame size={14} color="#059669" /> {recipe.calories} cal
                </span>
              </div>

              <SectionCard icon={<ShoppingBasket size={16} />} title="Ingredients" panelBg={panelBg} panelBorder={panelBorder}>
                <div className="space-y-2">
                  {ingredients.map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#059669' }} />
                      <p className="text-sm" style={{ color: 'var(--tm-text-2)' }}>{item}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard icon={<ListOrdered size={16} />} title="Instructions" panelBg={panelBg} panelBorder={panelBorder}>
                <div className="space-y-3">
                  {steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span
                        className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5"
                        style={{ backgroundColor: dark ? '#274A73' : recipe.cardColor, color: '#059669' }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm" style={{ color: 'var(--tm-text-2)' }}>{step}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {recipe.labels.length > 0 && (
                <SectionCard icon={<Tag size={16} />} title="Labels" panelBg={panelBg} panelBorder={panelBorder}>
                  <div className="flex flex-wrap gap-2">
                    {recipe.labels.map(label => (
                      <span key={label} className="text-xs px-2.5 py-1 rounded-full border" style={{ backgroundColor: panelBg, borderColor: panelBorder, color: 'var(--tm-text-2)' }}>
                        {label}
                      </span>
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Bottom action bar ── */}
      <div className="border-t px-5 py-3 shrink-0" style={{ backgroundColor: headerBg, borderColor: panelBorder }}>
        {cooking ? (
          /* cooking buttons */
          <div className="flex gap-2">
            <button onClick={prevStep} disabled={prepStage}
              className="flex-1 py-2.5 border rounded-full text-sm font-medium transition-opacity disabled:opacity-40"
              style={{ borderColor: panelBorder, color: 'var(--tm-text-2)', backgroundColor: panelBg }}>
              Previous
            </button>
            <button onClick={nextStep} disabled={!prepStage && stepIndex >= steps.length - 1}
              className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ backgroundColor: '#059669' }}>
              Next
            </button>
            <button onClick={finishCooking} disabled={!canFinish}
              className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ backgroundColor: '#059669' }}>
              Finish
            </button>
          </div>
        ) : showEdit ? (
          /* home: Edit / Cancel + Save Changes / Start Cooking */
          <div className="flex gap-2.5">
            <button
              onClick={editMode ? cancelEdit : openEdit}
              className="flex-1 py-2.5 border rounded-full text-sm font-semibold"
              style={{ borderColor: panelBorder, color: 'var(--tm-text-2)', backgroundColor: panelBg }}>
              {editMode ? 'Cancel' : 'Edit'}
            </button>
            <button
              onClick={editMode ? saveEdit : startCooking}
              className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: '#059669' }}>
              {editMode ? 'Save Changes' : 'Start Cooking'}
            </button>
          </div>
        ) : showLove ? (
          /* search / favorites: Love + Start Cooking */
          <div className="flex gap-2.5">
            <button
              onClick={handleLovePress}
              className="flex-1 py-2.5 border rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
              style={{
                borderColor: isSaved ? '#FCA5A5' : panelBorder,
                color: isSaved ? '#DC2626' : 'var(--tm-text-2)',
                backgroundColor: panelBg,
              }}>
              <Heart size={15} fill={isSaved ? '#DC2626' : 'none'} color={isSaved ? '#DC2626' : 'var(--tm-text-2)'} />
              {isSaved ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={startCooking}
              className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: '#059669' }}>
              Start Cooking
            </button>
          </div>
        ) : (
          /* fallback: just Start Cooking */
          <button onClick={startCooking} className="w-full py-3 rounded-full text-base font-semibold text-white" style={{ backgroundColor: '#059669' }}>
            Start Cooking
          </button>
        )}
      </div>

      {/* ── Overlays ── */}
      {showComplete && <CompletionOverlay onClose={() => setShowComplete(false)} />}
    </div>
  )
}
