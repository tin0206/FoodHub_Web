export interface RecipeCardTheme {
  start: string
  end: string
}

// Curated appetizing gradient pairs — a recipe always lands on the same one.
const PALETTE: RecipeCardTheme[] = [
  { start: '#F59E0B', end: '#D97706' }, // amber
  { start: '#10B981', end: '#059669' }, // emerald
  { start: '#F43F5E', end: '#E11D48' }, // rose
  { start: '#8B5CF6', end: '#7C3AED' }, // violet
  { start: '#3B82F6', end: '#2563EB' }, // blue
  { start: '#EC4899', end: '#DB2777' }, // pink
  { start: '#14B8A6', end: '#0D9488' }, // teal
  { start: '#F97316', end: '#EA580C' }, // orange
]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function recipeCardTheme(id: string | number, labels: string[] = []): RecipeCardTheme {
  const key = `${id}:${labels.join(',')}`
  return PALETTE[hashString(key) % PALETTE.length]
}
