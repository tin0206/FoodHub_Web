"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChefHat, RotateCcw } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { aiChat, aiWelcome } from "@/lib/api/ai";
import type { ChatHistoryMessage, ChatOption } from "@/lib/api/types";
import { ensureDemoSession } from "@/lib/demo-session";
import { ChatComposer } from "@/components/chat/chat-composer";
import {
  ChatMessageBubble,
  lastAssistantIndex,
  type ChatUiMessage,
} from "@/components/chat/chat-message-bubble";
import { TypingIndicator } from "@/components/chat/typing-indicator";

function newSessionId() {
  return `fh-demo-${Date.now()}-${Math.abs(
    Math.floor(Math.random() * 1_000_000_000),
  )}`;
}

function demoOptionsIntro(n: number) {
  return `I've got ${n} idea${n === 1 ? "" : "s"} for you — pick what works best:`;
}

function AutoAwesomeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
      <path
        fill="white"
        d="m19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25zm0 6l-1.25 2.75L15 19l2.75 1.25L19 23l-1.25-2.75L23 19l-2.75-1.25zm-7.5-5.5L9 4L6.5 9.5L1 12l5.5 2.5L9 20l2.5-5.5L17 12zm-1.51 3.49L9 15.17l-.99-2.18L5.83 12l2.18-.99L9 8.83l.99 2.18l2.18.99z"
      />
    </svg>
  );
}

export type DemoChatPanelProps = {
  /** Compact panel for landing page (fixed height, lazy start). */
  embedded?: boolean;
  className?: string;
};

export function DemoChatPanel({
  embedded = false,
  className = "",
}: DemoChatPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startedRef = useRef(false);
  const tokenRef = useRef<string | null>(null);

  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [history, setHistory] = useState<ChatHistoryMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [shouldStart, setShouldStart] = useState(!embedded);

  const busy = isBootstrapping || isSending;

  useEffect(() => {
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [messages, busy]);

  // Embedded: start guest session when the panel scrolls into view
  useEffect(() => {
    if (!embedded || shouldStart) return;
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShouldStart(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldStart(true);
          io.disconnect();
        }
      },
      { rootMargin: "120px", threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [embedded, shouldStart]);

  const bootstrapWelcome = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;

    const sid = newSessionId();
    setIsBootstrapping(true);
    setError("");
    setMessages([]);
    setHistory([]);
    setLastSent(null);
    setSessionId(sid);

    try {
      const response = await aiWelcome({ sessionId: sid, token });
      const finalSession = response.session_id || sid;
      setSessionId(finalSession);
      const reply =
        response.reply.trim() ||
        "Hello! I'm your AI companion. Tell me what you'd like to cook.";
      setMessages([
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: reply,
          recipes: response.recipes ?? [],
          options: response.options ?? [],
        },
      ]);
      setHistory([{ role: "assistant", content: reply }]);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to start companion session";
      setError(msg);
      setMessages([
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          text: `Could not start session: ${msg}`,
        },
      ]);
    } finally {
      setIsBootstrapping(false);
    }
  }, []);

  useEffect(() => {
    if (!shouldStart || startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const session = await ensureDemoSession();
        if (cancelled) return;
        tokenRef.current = session.token;
        setReady(true);
        await bootstrapWelcome();
      } catch (err) {
        if (cancelled) return;
        setReady(true);
        setError(
          err instanceof Error
            ? err.message
            : "Could not start demo session. Is the API running?",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shouldStart, bootstrapWelcome]);

  async function sendMessage(raw: string, opts?: { rerun?: boolean }) {
    const text = raw.trim();
    const token = tokenRef.current;
    if (!text || busy || !sessionId || !token) return;

    setError("");
    setIsSending(true);

    let nextHistory = history;
    if (!opts?.rerun) {
      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: "user", text },
      ]);
      setLastSent(text);
    } else {
      setMessages((prev) => {
        const copy = [...prev];
        if (copy.length && copy[copy.length - 1].role === "assistant") {
          copy.pop();
        }
        return copy;
      });
      nextHistory = [...history];
      if (
        nextHistory.length &&
        nextHistory[nextHistory.length - 1].role === "assistant"
      ) {
        nextHistory = nextHistory.slice(0, -1);
      }
      setHistory(nextHistory);
    }

    try {
      const response = await aiChat({
        message: text,
        sessionId,
        token,
      });
      if (response.session_id) setSessionId(response.session_id);

      const reply = response.reply.trim() || "(Empty reply from AI)";
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: reply,
          recipes: response.recipes ?? [],
          options: response.options ?? [],
        },
      ]);
      setHistory([
        ...nextHistory,
        { role: "user", content: text },
        { role: "assistant", content: reply },
      ]);
      setLastSent(text);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to send message";
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          text: `Sorry — ${msg}`,
        },
      ]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  async function handleSelectOption(option: ChatOption) {
    if (busy) return;
    setMessages((prev) => {
      const next = [...prev];
      if (next.length && next[next.length - 1].role === "assistant") {
        next[next.length - 1] = { ...next[next.length - 1], options: [] };
      }
      return next;
    });
    await sendMessage(option.label);
  }

  function handleReset() {
    setConfirmReset(false);
    void bootstrapWelcome();
  }

  const lastAi = lastAssistantIndex(messages);
  const shellClass = embedded
    ? `demo-chat-embed flex flex-col min-h-0 ${className}`
    : `flex flex-col h-[100dvh] min-h-0 ${className}`;

  return (
    <div
      ref={rootRef}
      className={shellClass}
      style={{ backgroundColor: "var(--tm-bg, #F8FAFC)" }}
    >
      <div
        className="flex items-center gap-3 px-4 h-14 border-b shrink-0"
        style={{
          backgroundColor: "var(--tm-surface, #fff)",
          borderColor: "var(--tm-border-s, #E2E8F0)",
        }}
      >
        {!embedded && (
          <>
            <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-80">
              <ChefHat size={20} color="#059669" />
              <span
                className="text-sm font-bold hidden sm:inline"
                style={{ color: "var(--tm-text, #0F172A)" }}
              >
                FoodHub
              </span>
            </Link>
            <div
              className="w-px h-5 shrink-0"
              style={{ backgroundColor: "var(--tm-border-i, #D1D5DB)" }}
            />
          </>
        )}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#059669" }}
        >
          <AutoAwesomeIcon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-bold truncate"
            style={{ color: "var(--tm-text, #0F172A)" }}
          >
            AI Companion Demo
          </p>
          <p
            className="text-[11px] truncate"
            style={{ color: "var(--tm-text-3, #6B7280)" }}
          >
            {!shouldStart
              ? "Scroll to start…"
              : ready
                ? "Guest demo · unlimited chats"
                : "Preparing…"}
          </p>
        </div>
        <Link
          href="/login"
          className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shrink-0"
          style={{ color: "#059669", backgroundColor: "rgba(5,150,105,0.12)" }}
        >
          Sign in
        </Link>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          disabled={busy || !ready}
          className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40"
          style={{
            backgroundColor: "var(--tm-subtle, #F3F4F6)",
            color: "var(--tm-text-2, #475569)",
          }}
          aria-label="Reset conversation"
          title="Reset conversation"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {!shouldStart ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm" style={{ color: "var(--tm-text-2, #475569)" }}>
            Demo loads when you scroll here
          </p>
        </div>
      ) : !ready ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm" style={{ color: "var(--tm-text-2, #475569)" }}>
            Starting guest demo…
          </p>
        </div>
      ) : (
        <>
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto py-3 space-y-3 min-h-0"
          >
            {messages.map((message, index) => (
              <ChatMessageBubble
                key={message.id}
                message={message}
                isLatestAi={
                  !busy &&
                  message.role === "assistant" &&
                  index === lastAi
                }
                canRerun={!!lastSent}
                optionsIntro={demoOptionsIntro}
                rerunLabel="Rerun"
                authToken={tokenRef.current ?? undefined}
                onSelectOption={(opt) => void handleSelectOption(opt)}
                onRerun={() => void sendMessage(lastSent!, { rerun: true })}
              />
            ))}
            {busy && (
              <TypingIndicator
                label={
                  isBootstrapping
                    ? "Starting companion session…"
                    : "Thinking…"
                }
              />
            )}
          </div>

          {error && (
            <div
              className="mx-3 mb-2 rounded-xl px-3 py-2 text-[12px]"
              style={{ backgroundColor: "#F43F5E14", color: "#F43F5E" }}
            >
              {error}
            </div>
          )}

          <div
            className="shrink-0 px-3 pb-3 pt-1"
            style={{ backgroundColor: "var(--tm-bg, #F8FAFC)" }}
          >
            <ChatComposer
              inputRef={inputRef}
              disabled={busy || !sessionId}
              placeholder="Ask for recipes..."
              onSend={(text) => void sendMessage(text)}
            />
          </div>
        </>
      )}

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div
            className="w-full max-w-sm rounded-2xl p-4"
            style={{ backgroundColor: "var(--tm-surface, #fff)" }}
          >
            <p
              className="text-sm font-bold mb-1"
              style={{ color: "var(--tm-text, #0F172A)" }}
            >
              Reset conversation?
            </p>
            <p
              className="text-xs mb-4"
              style={{ color: "var(--tm-text-2, #475569)" }}
            >
              Clears messages and starts a new session.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="text-xs font-semibold px-3 py-2 rounded-lg"
                style={{
                  color: "var(--tm-text-2, #475569)",
                  backgroundColor: "var(--tm-subtle, #F3F4F6)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-bold text-white px-3 py-2 rounded-lg"
                style={{ backgroundColor: "#059669" }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
