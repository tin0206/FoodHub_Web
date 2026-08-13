'use client'

import { AVAILABLE_LABELS } from '@/lib/dietary-labels'
import { useStrings } from '@/lib/use-strings'
import { DEFAULT_ACCENT } from './form-styles'

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
  return (
    <div className="flex flex-wrap gap-1.5">
      {AVAILABLE_LABELS.map(label => {
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
