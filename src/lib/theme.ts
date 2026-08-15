const LIGHT = {
  '--tm-bg': '#F4F7F5',
  '--tm-surface': '#ffffff',
  '--tm-border': '#E3E9E5',
  '--tm-border-s': '#E3E9E5',
  '--tm-border-i': '#D8E0DB',
  '--tm-text': '#0C1A14',
  '--tm-text-2': '#3D5248',
  '--tm-text-3': '#7C8983',
  '--tm-subtle': '#EEF2EF',
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

/** Reads the persisted theme: API-backed user cache, then the legacy local profile. */
export function readStoredTheme(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const user = JSON.parse(localStorage.getItem('fh_current_user') ?? 'null')
    if (user?.theme === 'dark') return true
    if (user?.theme === 'light') return false
    const profile = JSON.parse(localStorage.getItem('fh_profile') ?? '{}')
    return profile.theme === 'dark'
  } catch {
    return false
  }
}
