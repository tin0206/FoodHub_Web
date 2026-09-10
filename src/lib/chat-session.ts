import type { ApiRecipe, ChatHistoryMessage, ChatOption } from "@/lib/api/types";

const CHAT_SESSION_KEY = "fh_recs_chat_session";

export interface PersistedChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  options?: ChatOption[];
  savedRecipeId?: number;
  isFreshReferenceView?: boolean;
  referencedRecipeSnapshot?: ApiRecipe | null;
}

export interface PersistedChatSession {
  sessionId: string;
  messages: PersistedChatMessage[];
  history: ChatHistoryMessage[];
  composeDishText: string | null;
  composeIngredientsText: string | null;
  /** The recipe the user last opened from a chat reply — kept across a reload
   * so the "Add to personal recipe" / diff-highlight UI doesn't disappear
   * after navigating to a saved recipe's detail page and coming back. */
  referencedRecipe?: ApiRecipe | null;
  /** Every full recipe the AI has embedded in a `recipes[]` list so far this
   * session, keyed by id — kept across a reload so a plain-text pick
   * ("choose option 2") still resolves without a fetch afterward. */
  recipeCache?: Record<number, ApiRecipe>;
}

/** Survives a page reload but clears when the tab/browser closes — matches how far a chat should follow the user. */
export function loadChatSession(): PersistedChatSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CHAT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedChatSession;
    if (!parsed.sessionId || !Array.isArray(parsed.messages) || parsed.messages.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveChatSession(session: PersistedChatSession): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage full/unavailable — chat still works, it just won't survive a reload.
  }
}

export function clearChatSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHAT_SESSION_KEY);
  } catch {
    // ignore
  }
}
