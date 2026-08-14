// Admin section accent — deliberately distinct from the consumer app's brand green,
// signalling "you're in admin". Categorical slot 1 (blue) from the dataviz palette.
export const ADMIN_ACCENT_LIGHT = '#2a78d6'
export const ADMIN_ACCENT_DARK = '#3987e5'

// Categorical palette slots (dataviz reference palette — validated ordering, do not reshuffle)
export const CATEGORICAL = [
  { light: '#2a78d6', dark: '#3987e5' }, // 1 blue
  { light: '#eb6834', dark: '#d95926' }, // 2 orange
  { light: '#1baf7a', dark: '#199e70' }, // 3 aqua
  { light: '#eda100', dark: '#c98500' }, // 4 yellow
  { light: '#e87ba4', dark: '#d55181' }, // 5 magenta
  { light: '#008300', dark: '#008300' }, // 6 green
  { light: '#4a3aa7', dark: '#9085e9' }, // 7 violet
  { light: '#e34948', dark: '#e66767' }, // 8 red
] as const

export const SUCCESS_TEXT = { light: '#006300', dark: '#0ca30c' }

export const AVAILABLE_LABELS = [
  'Dairy Free',
  'Egg Free',
  'Gluten Free',
  'Nut Free',
  'Vegan',
  'Vegetarian',
  'Pescetarian',
  'High Protein',
  'Keto',
  'Quick Meal',
  'Breakfast',
  'Vietnamese',
  'Low Carb',
]

export function relativeTime(dateStr: string): string {
  const then = new Date(dateStr).getTime()
  if (Number.isNaN(then)) return ''
  const diffMs = Date.now() - then
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

export function avatarInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export function avatarColor(name: string, isDark: boolean): string {
  const hue = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 360
  return `hsl(${hue}, 55%, ${isDark ? 60 : 40}%)`
}
