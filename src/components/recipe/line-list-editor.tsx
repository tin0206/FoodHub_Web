'use client'

import { Plus, X } from 'lucide-react'
import { useDarkMode } from '@/lib/use-dark-mode'
import { DEFAULT_ACCENT, inlineInputClass } from './form-styles'

export function LineListEditor({
  values,
  onChange,
  placeholder,
  variant = 'dot',
  addLabel = 'Add',
  accent = DEFAULT_ACCENT,
}: {
  values: string[]
  onChange: (next: string[]) => void
  placeholder: (i: number) => string
  variant?: 'dot' | 'number'
  addLabel?: string
  accent?: string
}) {
  const dark = useDarkMode()
  function update(i: number, v: string) {
    const next = [...values]
    next[i] = v
    onChange(next)
  }
  function remove(i: number) {
    onChange(values.filter((_, idx) => idx !== i))
  }
  return (
    <div>
      <div className="space-y-1.5">
        {values.map((v, i) => (
          <div key={i} className={variant === 'number' ? 'flex items-start gap-2' : 'flex items-center gap-2'}>
            {variant === 'number' ? (
              <span
                className="w-5.5 h-5.5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                style={{ backgroundColor: `${accent}${dark ? '2E' : '1A'}`, color: accent }}
              >
                {i + 1}
              </span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />
            )}
            {variant === 'number' ? (
              <textarea
                value={v}
                onChange={e => update(i, e.target.value)}
                placeholder={placeholder(i)}
                rows={1}
                className={`flex-1 text-[13px] resize-none ${inlineInputClass}`}
                style={{ color: 'var(--tm-text)' }}
              />
            ) : (
              <input
                value={v}
                onChange={e => update(i, e.target.value)}
                placeholder={placeholder(i)}
                className={`flex-1 text-[13px] ${inlineInputClass}`}
                style={{ color: 'var(--tm-text)' }}
              />
            )}
            {values.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className={variant === 'number' ? 'mt-1.5' : ''}
                style={{ color: 'var(--tm-text-3)' }}
                aria-label="Remove"
              >
                <X size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...values, ''])}
        className="mt-2 flex items-center gap-1 text-xs font-semibold"
        style={{ color: accent }}
      >
        <Plus size={13} /> {addLabel}
      </button>
    </div>
  )
}
