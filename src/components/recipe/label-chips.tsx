'use client'

import { useEffect, useState } from 'react'
import { getDietaryRestrictions } from '@/lib/api/recipes'
import { useStrings } from '@/lib/use-strings'
import { DEFAULT_ACCENT } from './form-styles'

const MEAL_TYPE_LABELS = ['Breakfast', 'Lunch', 'Dinner']
const HIDDEN_LABELS = new Set(['Quick Meal', 'Quick Meals'])

/** Same label vocabulary as Search's filter chips (same API call, same exclusions),
 * so a recipe tagged here always matches something a user can actually search by. */
export function LabelChips({
  selected,
  onToggle,
  accent = DEFAULT_ACCENT,
}: {
  selected: Set<string>
  onToggle: (label: string) => void
  accent?: string
}) {
  const t = useStrings()
  const [options, setOptions] = useState<string[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    getDietaryRestrictions()
      .then(opts => {
        if (!cancelled) setOptions(opts)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const labels = [
    ...MEAL_TYPE_LABELS,
    ...options.filter(d => !MEAL_TYPE_LABELS.includes(d) && !HIDDEN_LABELS.has(d)),
  ]

  if (!ready) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="inline-block rounded-full animate-pulse"
            style={{ width: 60 + (i % 3) * 14, height: 24, backgroundColor: 'var(--tm-subtle)' }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map(label => {
        const active = selected.has(label)
        return (
          <button
            key={label}
            type="button"
            onClick={() => onToggle(label)}
            className="text-[11px] px-2.5 py-1 rounded-full border transition-colors"
            style={{
              backgroundColor: active ? accent : 'var(--tm-surface)',
              color: active ? 'white' : 'var(--tm-text-2)',
              borderColor: active ? accent : 'var(--tm-border-i)',
            }}
          >
            {t.dietaryTagDisplay(label)}
          </button>
        )
      })}
    </div>
  )
}
