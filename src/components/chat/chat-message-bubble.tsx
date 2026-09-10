"use client";

import { memo } from "react";
import { Bot, ChevronRight } from "lucide-react";
import type { ApiRecipe, ChatOption } from "@/lib/api/types";
import { MarkdownReply } from "@/components/chat/markdown-reply";
import { findPreviousRecipeMarkdown } from "@/lib/recipe-version-diff";

export interface ChatUiMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  options?: ChatOption[];
  /** Set once this message's "Add to personal recipe" action has succeeded —
   * survives a page reload so the button doesn't reset to unsaved. */
  savedRecipeId?: number;
  /** True when this reply is just the first full view of a freshly-picked
   * recipe (nothing was asked to change yet) — see MarkdownReply. */
  isFreshReferenceView?: boolean;
  /** The recipe this specific reply is about, frozen at the moment the reply
   * was requested — never a live/shared value, since the "current" recipe
   * context can move on to a different pick before the user acts on an
   * earlier message still visible in the transcript. */
  referencedRecipeSnapshot?: ApiRecipe | null;
}

const EMPTY_OPTIONS: ChatOption[] = [];

export function lastAssistantIndex(messages: ChatUiMessage[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") return i;
  }
  return -1;
}

export const ChatMessageBubble = memo(function ChatMessageBubble({
  message,
  isLatestAi,
  optionsIntro,
  authToken,
  messages,
  messageIndex,
  referencedRecipe,
  recipeCache,
  onRecipeOpened,
  canSaveRecipes,
  onRecipeSaved,
  onSelectOption,
}: {
  message: ChatUiMessage;
  isLatestAi: boolean;
  optionsIntro: (count: number) => string;
  authToken?: string;
  messages?: ChatUiMessage[];
  messageIndex?: number;
  referencedRecipe?: ApiRecipe | null;
  /** Every full recipe the AI has embedded in a `recipes[]` list so far this
   * session, keyed by id — lets CTA images and "view recipe" taps skip a fetch. */
  recipeCache?: Record<number, ApiRecipe>;
  onRecipeOpened?: (recipe: ApiRecipe) => void;
  canSaveRecipes?: boolean;
  onRecipeSaved?: (recipeId: number) => void;
  onSelectOption: (option: ChatOption) => void;
}) {
  const isUser = message.role === "user";
  const options = message.options ?? EMPTY_OPTIONS;
  const showOptions = isLatestAi && options.length > 0;
  const previousMarkdown =
    messages && messageIndex != null
      ? findPreviousRecipeMarkdown({
          messages: messages.map((m) => ({
            isUser: m.role === "user",
            text: m.text,
          })),
          currentIndex: messageIndex,
        })
      : null;

  return (
    <div className={`px-3 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex gap-2 max-w-[85%] ${isUser ? "flex-row-reverse" : ""}`}
      >
        {!isUser && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: "#059669" }}
          >
            <Bot size={14} color="white" />
          </div>
        )}
        <div>
          <div
            className={`rounded-2xl px-3.5 py-2.5 ${
              isUser ? "rounded-tr-md" : "rounded-tl-md"
            }`}
            style={
              isUser
                ? {
                    background:
                      "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    color: "#fff",
                  }
                : {
                    backgroundColor: "var(--tm-surface, #fff)",
                    border: "1px solid var(--tm-border-i, #D1D5DB)",
                  }
            }
          >
            {isUser ? (
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                {message.text}
              </p>
            ) : showOptions ? (
              <p
                className="text-[13px] leading-relaxed"
                style={{ color: "var(--tm-text, #0F172A)" }}
              >
                {optionsIntro(options.length)}
              </p>
            ) : (
              <MarkdownReply
                text={message.text}
                authToken={authToken}
                previousMarkdown={previousMarkdown}
                referencedRecipe={referencedRecipe}
                recipeCache={recipeCache}
                onRecipeOpened={onRecipeOpened}
                canSaveRecipes={canSaveRecipes}
                savedRecipeId={message.savedRecipeId}
                onRecipeSaved={onRecipeSaved}
                isFreshReferenceView={message.isFreshReferenceView}
              />
            )}
          </div>
          {showOptions && (
            <div className="mt-1.5 space-y-1.5">
              {options.map((opt) => (
                <button
                  key={opt.index}
                  type="button"
                  onClick={() => onSelectOption(opt)}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: "var(--tm-surface, #fff)",
                    border: "1px solid var(--tm-border-i, #D1D5DB)",
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
                    style={{ backgroundColor: "#059669" }}
                  >
                    {opt.index}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span
                      className="block text-[13px] font-bold"
                      style={{ color: "var(--tm-text, #0F172A)" }}
                    >
                      {opt.label}
                    </span>
                    {opt.rationale && (
                      <span
                        className="block text-[11.5px] mt-0.5"
                        style={{ color: "var(--tm-text-3, #6B7280)" }}
                      >
                        {opt.rationale}
                      </span>
                    )}
                  </span>
                  <ChevronRight
                    size={16}
                    color="var(--tm-text-3, #6B7280)"
                    className="shrink-0"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
