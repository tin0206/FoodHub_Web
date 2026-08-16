// The recipes API has no cooking-time field, so the create form still collects
// it for parity with the mobile UI and we cache it locally so cards keep
// showing it after creation. Calories now come from the server-computed
// `nutrition.per_serving` once a recipe's ingredients are catalog-mapped —
// the local cache/estimate is only a fallback until that's available.

import type { RecipeNutrition } from '@/lib/api/types'

const STORAGE_KEY = 'fh_recipe_meta'
const CALORIES_KEY = 'Calories (kcal)'

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
  nutrition?: RecipeNutrition | null
}

/** Rough stand-in for recipes with no nutrition and no cached meta (catalog recipes, other devices). */
export function estimateStats(recipe: RecipeLike): RecipeMeta {
  const steps = recipe.directions.length || 1
  const ingredientCount = recipe.ingredients.length || 1
  const cookingMinutes = Math.min(120, Math.max(10, 8 * steps + 2 * ingredientCount))
  const servings = recipe.estimated_servings ?? Math.max(1, Math.round(ingredientCount / 3))
  return { cookingMinutes, calories: servings * 200 }
}

/** Real server-computed calories, when the recipe's ingredients have been catalog-mapped. */
export function nutritionCalories(recipe: RecipeLike): number | null {
  const value = recipe.nutrition?.per_serving?.[CALORIES_KEY]
  return value != null ? Math.round(value) : null
}

export function getOrEstimateMeta(recipe: RecipeLike): RecipeMeta {
  const cached = getRecipeMeta(recipe.id)
  const fromNutrition = nutritionCalories(recipe)
  const fallback = cached ?? estimateStats(recipe)
  return {
    cookingMinutes: fallback.cookingMinutes,
    calories: fromNutrition ?? fallback.calories,
  }
}
