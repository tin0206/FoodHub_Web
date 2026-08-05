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

export interface TopRecipe {
  title: string
  favorites: number
}

export interface LabelStat {
  label: string
  count: number
  colorIndex: number
}

export interface ActivityItem {
  id: string
  title: string
  time: string
  colorIndex: number
}

export interface OverviewStat {
  label: string
  value: string
  trend: string
  colorIndex: number
}

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const OVERVIEW_STATS: OverviewStat[] = [
  { label: 'Total users', value: '247', trend: '+12 this week', colorIndex: 0 },
  { label: 'Total recipes', value: '1,842', trend: '+34 this week', colorIndex: 2 },
  { label: 'Total favorites', value: '4,391', trend: '+208 this week', colorIndex: 7 },
  { label: 'AI scans', value: '893', trend: '+57 this week', colorIndex: 1 },
]

export const RECENT_ACTIVITY: ActivityItem[] = [
  { id: '1', title: 'New user registered: kieu_anh', time: '2 minutes ago', colorIndex: 0 },
  { id: '2', title: 'Recipe "Phở Bò Hà Nội" added', time: '14 minutes ago', colorIndex: 2 },
  { id: '3', title: '12 new favorites in the last hour', time: '1 hour ago', colorIndex: 7 },
  { id: '4', title: 'AI scan by minh_duc: 5 ingredients', time: '2 hours ago', colorIndex: 1 },
  { id: '5', title: 'New user registered: thanh_nam', time: '3 hours ago', colorIndex: 0 },
  { id: '6', title: 'Recipe "Avocado Toast" added', time: '5 hours ago', colorIndex: 2 },
]

export const TOP_RECIPES: TopRecipe[] = [
  { title: 'Green Smoothie Bowl', favorites: 201 },
  { title: 'Bánh Mì Sandwich', favorites: 176 },
  { title: 'Phở Bò Hà Nội', favorites: 142 },
  { title: 'Avocado Toast', favorites: 133 },
  { title: 'Bún Bò Huế', favorites: 98 },
]

export const LABEL_STATS: LabelStat[] = [
  { label: 'Vietnamese', count: 312, colorIndex: 0 },
  { label: 'Vegan', count: 278, colorIndex: 2 },
  { label: 'High Protein', count: 241, colorIndex: 1 },
  { label: 'Quick Meal', count: 198, colorIndex: 3 },
  { label: 'Breakfast', count: 156, colorIndex: 4 },
  { label: 'Keto', count: 112, colorIndex: 6 },
]

export const WEEKLY_SIGNUPS = [3, 7, 5, 12, 8, 15, 10]
export const WEEKLY_AI_SCANS = [18, 24, 31, 19, 42, 38, 27]

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

// ── Admin-created recipes (localStorage-backed, mirrors the rest of the app's mock data layer) ──

export interface AdminRecipe {
  id: string
  title: string
  cookingMinutes: number
  calories: number
  ingredientLines: string[]
  stepLines: string[]
  labels: string[]
  imageUrl?: string
}

const SEED_RECIPES: AdminRecipe[] = [
  {
    id: 'r1',
    title: 'Green Smoothie Bowl',
    cookingMinutes: 10,
    calories: 320,
    ingredientLines: ['1 frozen banana', '1 cup spinach', '1/2 cup Greek yogurt', '1/2 cup almond milk', 'Granola & chia seeds to top'],
    stepLines: ['Blend banana, spinach, yogurt, and almond milk until smooth.', 'Pour into a bowl.', 'Top with granola and chia seeds.'],
    labels: ['Vegetarian', 'Quick Meal', 'Breakfast'],
  },
  {
    id: 'r2',
    title: 'Bánh Mì Sandwich',
    cookingMinutes: 25,
    calories: 480,
    ingredientLines: ['1 baguette', '150g grilled pork', 'Pickled carrot & daikon', 'Cucumber, cilantro', 'Mayonnaise & pâté'],
    stepLines: ['Marinate and grill the pork.', 'Split the baguette and spread mayonnaise and pâté.', 'Layer pork, pickled vegetables, cucumber, and cilantro.'],
    labels: ['Vietnamese', 'Quick Meal'],
  },
  {
    id: 'r3',
    title: 'Phở Bò Hà Nội',
    cookingMinutes: 90,
    calories: 450,
    ingredientLines: ['500g beef bones', '300g beef slices', 'Rice noodles', 'Star anise, cinnamon, ginger', 'Fish sauce, herbs, lime'],
    stepLines: ['Simmer bones with charred ginger and spices for 3+ hours to make the broth.', 'Cook rice noodles.', 'Assemble noodles, beef slices, and broth in a bowl.', 'Serve with herbs and lime.'],
    labels: ['Vietnamese'],
  },
  {
    id: 'r4',
    title: 'Avocado Toast',
    cookingMinutes: 10,
    calories: 290,
    ingredientLines: ['2 slices sourdough bread', '1 ripe avocado', '1 egg', 'Chili flakes, salt, pepper'],
    stepLines: ['Toast the bread.', 'Mash avocado with salt and pepper, spread on toast.', 'Top with a fried or poached egg and chili flakes.'],
    labels: ['Vegetarian', 'Quick Meal', 'Breakfast'],
  },
  {
    id: 'r5',
    title: 'Bún Bò Huế',
    cookingMinutes: 100,
    calories: 520,
    ingredientLines: ['400g beef shank', '200g pork hock', 'Thick rice vermicelli', 'Lemongrass, shrimp paste, chili oil', 'Herbs, banana blossom'],
    stepLines: ['Simmer beef and pork with lemongrass for a fragrant broth.', 'Season with shrimp paste and chili oil.', 'Cook vermicelli and assemble with meat and broth.', 'Serve with herbs and banana blossom.'],
    labels: ['Vietnamese', 'High Protein'],
  },
]

const STORAGE_KEY = 'fh_admin_recipes'

function readAll(): AdminRecipe[] {
  if (typeof window === 'undefined') return SEED_RECIPES
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    return SEED_RECIPES
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_RECIPES))
  return SEED_RECIPES
}

function writeAll(recipes: AdminRecipe[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes))
}

export function listAdminRecipes(): AdminRecipe[] {
  return readAll()
}

export function getAdminRecipe(id: string): AdminRecipe | null {
  return readAll().find((r) => r.id === id) ?? null
}

export function saveAdminRecipe(recipe: Omit<AdminRecipe, 'id'> & { id?: string }): AdminRecipe {
  const recipes = readAll()
  if (recipe.id) {
    const idx = recipes.findIndex((r) => r.id === recipe.id)
    const saved = { ...recipe, id: recipe.id } as AdminRecipe
    if (idx >= 0) recipes[idx] = saved
    else recipes.push(saved)
    writeAll(recipes)
    return saved
  }
  const saved: AdminRecipe = { ...recipe, id: crypto.randomUUID() }
  writeAll([...recipes, saved])
  return saved
}

export function deleteAdminRecipe(id: string): void {
  writeAll(readAll().filter((r) => r.id !== id))
}

// ── Admin users (localStorage-backed, seeded once from dummy data — mirrors the mobile admin) ──

export interface AdminUser {
  id: string
  fullName: string
  email: string
  username: string
  role: 'admin' | 'user'
  isActive: boolean
  recipeCount: number
  savedCount: number
  createdAt: string
  age?: number
  weight?: number
  calorieTarget?: number
  proteinTarget?: number
  dietaryRestrictions: string[]
  primaryGoal?: string
}

const SEED_USERS: AdminUser[] = [
  {
    id: '1', fullName: 'Trung Tin', email: 'tin@foodhub.app', username: 'trungtin',
    role: 'admin', isActive: true, recipeCount: 12, savedCount: 34, createdAt: 'Jan 15, 2024',
    age: 20, weight: 65, calorieTarget: 2200, proteinTarget: 150,
    dietaryRestrictions: ['High Protein'], primaryGoal: 'Build Muscle',
  },
  {
    id: '2', fullName: 'Minh Duc', email: 'duc@gmail.com', username: 'minhduc',
    role: 'user', isActive: true, recipeCount: 5, savedCount: 18, createdAt: 'Feb 20, 2024',
    age: 25, weight: 70, calorieTarget: 2000, proteinTarget: 120,
    dietaryRestrictions: ['Vegan'], primaryGoal: 'Lose Weight',
  },
  {
    id: '3', fullName: 'Thu Hang', email: 'hang@gmail.com', username: 'thuhang',
    role: 'user', isActive: true, recipeCount: 8, savedCount: 42, createdAt: 'Mar 10, 2024',
    age: 28, weight: 55, calorieTarget: 1800, proteinTarget: 90,
    dietaryRestrictions: ['Vegan', 'Gluten-Free'], primaryGoal: 'Balanced Nutrition',
  },
  {
    id: '4', fullName: 'Van Long', email: 'long@gmail.com', username: 'vanlong',
    role: 'user', isActive: false, recipeCount: 3, savedCount: 7, createdAt: 'Apr 5, 2024',
    age: 32, weight: 80, dietaryRestrictions: [],
  },
  {
    id: '5', fullName: 'Phuong Thao', email: 'thao@gmail.com', username: 'phuongthao',
    role: 'user', isActive: true, recipeCount: 15, savedCount: 61, createdAt: 'Apr 22, 2024',
    age: 23, weight: 52, calorieTarget: 1600, proteinTarget: 80,
    dietaryRestrictions: ['Vegan'], primaryGoal: 'Improve Health',
  },
  {
    id: '6', fullName: 'Bao Ngoc', email: 'ngoc@gmail.com', username: 'baongoc',
    role: 'user', isActive: true, recipeCount: 2, savedCount: 9, createdAt: 'May 1, 2024',
    age: 21, weight: 58, calorieTarget: 1900, proteinTarget: 100,
    dietaryRestrictions: ['Keto'], primaryGoal: 'Lose Weight',
  },
  {
    id: '7', fullName: 'Thanh Nam', email: 'nam@gmail.com', username: 'thanhnam',
    role: 'user', isActive: false, recipeCount: 0, savedCount: 0, createdAt: 'May 10, 2024',
    dietaryRestrictions: [],
  },
  {
    id: '8', fullName: 'Kieu Anh', email: 'anh@gmail.com', username: 'kieuanh',
    role: 'user', isActive: true, recipeCount: 7, savedCount: 29, createdAt: 'Jun 12, 2024',
    age: 26, weight: 61, calorieTarget: 2100, proteinTarget: 130,
    dietaryRestrictions: ['High Protein', 'Breakfast'], primaryGoal: 'Build Muscle',
  },
]

const USERS_STORAGE_KEY = 'fh_admin_users'

function readAllUsers(): AdminUser[] {
  if (typeof window === 'undefined') return SEED_USERS
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    return SEED_USERS
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(SEED_USERS))
  return SEED_USERS
}

function writeAllUsers(users: AdminUser[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

export function listAdminUsers(): AdminUser[] {
  return readAllUsers()
}

export function getAdminUser(id: string): AdminUser | null {
  return readAllUsers().find((u) => u.id === id) ?? null
}

type AdminUserInput = Omit<AdminUser, 'id' | 'recipeCount' | 'savedCount' | 'createdAt'> & { id?: string }

export function saveAdminUser(input: AdminUserInput): AdminUser {
  const users = readAllUsers()
  if (input.id) {
    const idx = users.findIndex((u) => u.id === input.id)
    if (idx >= 0) {
      const merged: AdminUser = { ...users[idx], ...input, id: input.id }
      users[idx] = merged
      writeAllUsers(users)
      return merged
    }
  }
  const created: AdminUser = {
    ...input,
    id: crypto.randomUUID(),
    recipeCount: 0,
    savedCount: 0,
    createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }
  writeAllUsers([...users, created])
  return created
}

export function setAdminUserActive(id: string, isActive: boolean): void {
  const users = readAllUsers()
  const idx = users.findIndex((u) => u.id === id)
  if (idx < 0) return
  users[idx] = { ...users[idx], isActive }
  writeAllUsers(users)
}

export function deleteAdminUser(id: string): void {
  writeAllUsers(readAllUsers().filter((u) => u.id !== id))
}

export function avatarInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export function avatarColor(name: string, isDark: boolean): string {
  const hue = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 360
  return `hsl(${hue}, 55%, ${isDark ? 60 : 40}%)`
}

export interface UserRecipeSummary {
  title: string
  favorites: number
  date: string
  colorIndex: number
}

// The mobile source's per-user saved/created recipe lists weren't available when this
// was ported, so entries are derived deterministically from the user's own counts.
export function mockUserRecipes(user: AdminUser, kind: 'saved' | 'created'): UserRecipeSummary[] {
  const count = kind === 'saved' ? user.savedCount : user.recipeCount
  const shown = Math.min(count, 6)
  return Array.from({ length: shown }, (_, i) => ({
    title: TOP_RECIPES[(i + user.id.length) % TOP_RECIPES.length].title,
    favorites: 20 + ((i * 17 + user.id.length * 5) % 180),
    date: user.createdAt,
    colorIndex: (i + Number(user.id.replace(/\D/g, '') || 0)) % CATEGORICAL.length,
  }))
}
