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
