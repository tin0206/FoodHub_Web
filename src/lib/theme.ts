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

// Mirrors the Flutter app's ThemeData.dark (ColorScheme.fromSeed(seedColor: 0xFF059669,
// brightness: dark), scaffoldBackgroundColor 0x0A0A0A, cardColor 0x141414, dividerColor
// 0x2A2A2A, inputDecorationTheme.fillColor 0x1E1E1E) instead of a generic slate palette.
const DARK = {
  '--tm-bg': '#0A0A0A',
  '--tm-surface': '#141414',
  '--tm-border': '#2A2A2A',
  '--tm-border-s': '#2A2A2A',
  '--tm-border-i': '#3A3A3A',
  '--tm-text': '#F5F5F5',
  '--tm-text-2': '#A3A3A3',
  '--tm-text-3': '#737373',
  '--tm-subtle': '#1E1E1E',
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
