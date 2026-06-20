export interface RecipeForDetail {
  id?: string
  name: string
  ingredients: string
  steps: string
  labels: string[]
  cookingMinutes: number
  calories: number
  cardColor: string
  source?: 'home' | 'search' | 'favorites'
}

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function storeRecipe(recipe: RecipeForDetail): void {
  sessionStorage.setItem('fh_recipe_detail', JSON.stringify(recipe))
}

export function loadRecipe(): RecipeForDetail | null {
  try {
    const s = sessionStorage.getItem('fh_recipe_detail')
    return s ? (JSON.parse(s) as RecipeForDetail) : null
  } catch {
    return null
  }
}
