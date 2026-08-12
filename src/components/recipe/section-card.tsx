'use client'

import type { ReactNode } from 'react'
import { useDarkMode } from '@/lib/use-dark-mode'
import { DEFAULT_ACCENT, panelShadow } from './form-styles'

// Matches mobile's _AddSectionCard, but with a visible border added on top of the
// shadow — the page background and panel fill are close enough in tone on web that
// a shadow alone wasn't reading as a boundary.
export function SectionCard({
  icon,
  title,
  accent = DEFAULT_ACCENT,
  children,
}: {
  icon?: ReactNode
  title?: string
  accent?: string
  children: ReactNode
}) {
  const dark = useDarkMode()
  return (
    <div
      className="rounded-xl p-3"
      style={{
        backgroundColor: dark ? '#1E1E1E' : '#FFFFFF',
        border: `1px solid ${dark ? '#2E2E2E' : 'var(--tm-border-i)'}`,
        boxShadow: panelShadow(dark),
      }}
    >
      {(icon || title) && (
        <div className="flex items-center gap-1.5 mb-2">
          {icon && <span style={{ color: accent }}>{icon}</span>}
          {title && (
            <p className="text-[13px] font-bold" style={{ color: 'var(--tm-text)' }}>
              {title}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
