"use client";

import { memo } from "react";
import { Bot, ChevronRight } from "lucide-react";
import type { ChatOption, RagRecipe } from "@/lib/api/types";
import { MarkdownReply } from "@/components/chat/markdown-reply";

export interface ChatUiMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  recipes?: RagRecipe[];
  options?: ChatOption[];
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
  canRerun,
  optionsIntro,
  rerunLabel,
  authToken,
  onSelectOption,
  onRerun,
}: {
  message: ChatUiMessage;
  isLatestAi: boolean;
  canRerun: boolean;
  optionsIntro: (count: number) => string;
  rerunLabel: string;
  authToken?: string;
  onSelectOption: (option: ChatOption) => void;
  onRerun: () => void;
}) {
  const isUser = message.role === "user";
  const options = message.options ?? EMPTY_OPTIONS;
  const showOptions = isLatestAi && options.length > 0;
  const showRerun = isLatestAi && canRerun && options.length === 0;

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
                recipes={message.recipes}
                authToken={authToken}
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
          {showRerun && (
            <button
              type="button"
              onClick={onRerun}
              className="mt-1.5 text-[11px] font-semibold px-2 py-1 rounded-lg"
              style={{
                color: "#059669",
                backgroundColor: "rgba(5,150,105,0.12)",
              }}
            >
              {rerunLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
