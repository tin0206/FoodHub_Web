const LIGHT = {
  '--tm-bg': '#F8FAFC',
  '--tm-surface': '#ffffff',
  '--tm-border': '#E5E7EB',
  '--tm-border-s': '#E2E8F0',
  '--tm-border-i': '#D1D5DB',
  '--tm-text': '#0F172A',
  '--tm-text-2': '#475569',
  '--tm-text-3': '#6B7280',
  '--tm-subtle': '#F3F4F6',
}

const DARK = {
  '--tm-bg': '#0F172A',
  '--tm-surface': '#1E293B',
  '--tm-border': '#334155',
  '--tm-border-s': '#334155',
  '--tm-border-i': '#475569',
  '--tm-text': '#F1F5F9',
  '--tm-text-2': '#94A3B8',
  '--tm-text-3': '#64748B',
  '--tm-subtle': '#1E293B',
}

export function applyTheme(dark: boolean) {
  const vars = dark ? DARK : LIGHT
  const root = document.documentElement
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v)
  }
  window.dispatchEvent(new CustomEvent('themechange', { detail: { dark } }))
}
