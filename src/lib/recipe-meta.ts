// The recipes API has no cooking-time/calorie fields (only `estimated_servings`),
// but the create form still collects them for parity with the mobile UI. Cache
// what the user entered locally so cards can keep showing it after creation.

const STORAGE_KEY = 'fh_recipe_meta'

export interface RecipeMeta {
  cookingMinutes: number
  calories: number
}

function readAll(): Record<string, RecipeMeta> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function getRecipeMeta(id: string | number): RecipeMeta | undefined {
  return readAll()[String(id)]
}

export function setRecipeMeta(id: string | number, meta: RecipeMeta): void {
  const all = readAll()
  all[String(id)] = meta
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

interface RecipeLike {
  id: string | number
  directions: string[]
  ingredients: string[]
  estimated_servings?: number | null
}

/** Rough stand-in for recipes with no cached meta (catalog recipes, other devices). */
export function estimateStats(recipe: RecipeLike): RecipeMeta {
  const steps = recipe.directions.length || 1
  const ingredientCount = recipe.ingredients.length || 1
  const cookingMinutes = Math.min(120, Math.max(10, 8 * steps + 2 * ingredientCount))
  const servings = recipe.estimated_servings ?? Math.max(1, Math.round(ingredientCount / 3))
  return { cookingMinutes, calories: servings * 200 }
}

export function getOrEstimateMeta(recipe: RecipeLike): RecipeMeta {
  return getRecipeMeta(recipe.id) ?? estimateStats(recipe)
}
