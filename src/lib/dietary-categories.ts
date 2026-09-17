/** Search/filter chips. Hardcoded — not loaded from the API or DB. */

export const MEAL_TYPE_CATEGORIES: [string, string][] = [
  ["🌅", "Breakfast"],
  ["🥗", "Lunch"],
  ["🍝", "Dinner"],
];

export const DIETARY_CATEGORIES: [string, string][] = [
  ["🍸", "Alcoholic"],
  ["🥤", "Beverage"],
  ["🥛", "Dairy Free"],
  ["🌾", "Gluten Free"],
  ["🥜", "Nut Free"],
  ["🐟", "Pescetarian"],
  ["🌱", "Vegan"],
  ["🥦", "Vegetarian"],
];

export const SEARCH_CATEGORY_CHIPS: [string, string][] = [
  ...MEAL_TYPE_CATEGORIES,
  ...DIETARY_CATEGORIES,
];

const DIETARY_LABELS = new Set(DIETARY_CATEGORIES.map(([, label]) => label));

export const RECIPE_LABEL_OPTIONS: string[] = [
  ...MEAL_TYPE_CATEGORIES.map(([, label]) => label),
  ...DIETARY_CATEGORIES.map(([, label]) => label),
];

export function isDietaryCategory(label: string): boolean {
  return DIETARY_LABELS.has(label);
}

/** Same windows as the home greeting: morning → Breakfast, afternoon → Lunch, evening → Dinner. */
export function defaultMealCategory(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Breakfast";
  if (hour < 17) return "Lunch";
  return "Dinner";
}

/** Search uses `q` only: selected chips plus typed text,
 * e.g. Dinner + Vegan + cake → "Dinner Vegan cake". */
export function recipeSearchQuery(
  text: string,
  categories: string[] = [],
): string | undefined {
  const selected = new Set(
    categories.map((c) => c.trim()).filter(Boolean),
  );
  const chips = SEARCH_CATEGORY_CHIPS.map(([, label]) => label).filter((label) =>
    selected.has(label),
  );
  const typed = text.trim();
  const parts = typed ? [...chips, typed] : chips;
  return parts.length ? parts.join(" ") : undefined;
}

export function toggleSearchCategory(
  selected: string[],
  category: string,
): string[] {
  return selected.includes(category)
    ? selected.filter((c) => c !== category)
    : [...selected, category];
}
