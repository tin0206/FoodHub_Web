export type UserRole = "admin" | "user";

export interface ApiUser {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  role: string;
  age?: number | null;
  weight?: number | null;
  calorie_target?: number | null;
  protein_target?: number | null;
  dietary_restrictions: string[];
  primary_goal?: string | null;
  language: string;
  notify_recommendations?: boolean;
  notify_new_features?: boolean;
  notify_weekly_summary?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: ApiUser;
}

export interface UserProfileUpdate {
  full_name?: string | null;
  age?: number | null;
  weight?: number | null;
  calorie_target?: number | null;
  protein_target?: number | null;
  dietary_restrictions?: string[] | null;
  primary_goal?: string | null;
  language?: string | null;
  notify_recommendations?: boolean | null;
  notify_new_features?: boolean | null;
  notify_weekly_summary?: boolean | null;
}

export type RecipeVisibility = "private" | "public";

export interface ApiRecipe {
  id: number;
  title: string;
  ingredients: string[];
  directions: string[];
  ner: string[];
  estimated_servings?: number | null;
  mapped_ingredients?: unknown[];
  dietary_restrictions: string[];
  image_url?: string | null;
  visibility: RecipeVisibility;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
  locale: string;
}

export interface ApiRecipeTranslation {
  id: number;
  recipe_id: number;
  locale: string;
  title: string;
  ingredients: string[];
  directions: string[];
  created_at: string;
  updated_at: string;
}

export interface RecipeTranslationUpsert {
  title: string;
  ingredients: string[];
  directions: string[];
}

export interface RecipeSearchResult {
  totalCount: number;
  recipes: ApiRecipe[];
}

export interface ApiFavorite {
  id: number;
  recipe_id: number;
  note: string | null;
  recipe: ApiRecipe;
  created_at: string;
  updated_at: string;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiJobAccepted {
  task_id: string;
  status: string;
  request_type: string;
  image_url?: string | null;
  session_id?: string | null;
}

export interface AiRequestDetail {
  task_id: string;
  request_type: string;
  status: string;
  input_payload?: Record<string, unknown> | null;
  output_payload?: Record<string, unknown> | null;
  error_message?: string | null;
  duration_ms?: number | null;
}

export interface RagRecipe {
  recipe_id?: string | null;
  title: string;
  ingredients: string[];
  directions: string[];
  dietary_restrictions?: string[];
  estimated_servings?: number | null;
}

export interface ChatResponse {
  task_id: string;
  reply: string;
  phase: string;
  session_id?: string | null;
  recipes: RagRecipe[];
  known_info?: Record<string, unknown>;
}
