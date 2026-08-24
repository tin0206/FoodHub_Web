import type { ChatHistoryMessage, ChatOption, RagRecipe } from "@/lib/api/types";

const CHAT_SESSION_KEY = "fh_recs_chat_session";

export interface PersistedChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  recipes?: RagRecipe[];
  options?: ChatOption[];
}

export interface PersistedChatSession {
  sessionId: string;
  messages: PersistedChatMessage[];
  history: ChatHistoryMessage[];
  composeDishText: string | null;
  composeIngredientsText: string | null;
  lastSentMessage: string | null;
  lastSentIngredients: string[];
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
