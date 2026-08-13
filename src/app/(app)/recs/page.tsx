"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Camera,
  Pencil,
  RefreshCw,
  Send,
  ShoppingBasket,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { apiGetMe } from "@/lib/api/auth";
import { aiWelcome, aiChat, aiDetectDish, aiDetectIngredients } from "@/lib/api/ai";
import { ApiError, resolveMediaUrl } from "@/lib/api-client";
import type { ChatHistoryMessage, RagRecipe } from "@/lib/api/types";
import { MarkdownReply } from "@/components/chat/markdown-reply";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { NoteDialog } from "@/components/note-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDarkMode } from "@/lib/use-dark-mode";

interface UiMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  recipes?: RagRecipe[];
}

interface UserProfileForChat {
  dietaryRestrictions: string[];
  primaryGoal: string;
}

function newSessionId(): string {
  return `fh-${Date.now()}-${Math.abs(Math.floor(Math.random() * 1_000_000_000))}`;
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof Error) return err.message;
  return fallback;
}

function ComposeDetectionRow({
  text, icon, disabled, onEdit,
}: { text: string; icon: ReactNode; disabled: boolean; onEdit: () => void }) {
  const dark = useDarkMode();
  return (
    <div
      className="flex items-start gap-2 rounded-xl px-3 py-2.5 mb-2"
      style={{ backgroundColor: dark ? "#1E1E1E" : "#F3F4F6", border: "1px solid rgba(5,150,105,0.35)" }}
    >
      {icon}
      <p className="flex-1 text-[13px] leading-snug" style={{ color: "var(--tm-text)" }}>{text}</p>
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        className="shrink-0 disabled:opacity-40"
        style={{ color: "var(--tm-text-3)" }}
        aria-label="Edit"
      >
        <Pencil size={15} />
      </button>
    </div>
  );
}

function DetectionConfirmDialog({
  title, text, inputImageUrl, outputImageUrl, onSave, onCancel,
}: {
  title: string;
  text: string;
  inputImageUrl?: string;
  outputImageUrl?: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(text);
  const detectedImageUrl = outputImageUrl || inputImageUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl p-4 max-h-[85vh] overflow-y-auto"
        style={{ backgroundColor: "var(--tm-surface)" }}
      >
        <p className="text-sm font-bold mb-3" style={{ color: "var(--tm-text)" }}>{title}</p>

        {detectedImageUrl && (
          <div className="w-full rounded-lg mb-3 flex items-center justify-center overflow-hidden" style={{ backgroundColor: "var(--tm-subtle)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveMediaUrl(detectedImageUrl)}
              alt="Detection result"
              className="w-full max-h-80 object-contain"
            />
          </div>
        )}

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          autoFocus
          placeholder="Edit before adding to your message…"
          className="w-full px-2.5 py-2 rounded-xl text-xs resize-none focus:outline-none"
          style={{ backgroundColor: "var(--tm-subtle)", color: "var(--tm-text-2)" }}
        />

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: "var(--tm-subtle)", color: "var(--tm-text-2)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(value)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: "#059669" }}
          >
            Use this
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecsPage() {
  const listRef = useRef<HTMLDivElement>(null);
  const dishInputRef = useRef<HTMLInputElement>(null);
  const ingredientsInputRef = useRef<HTMLInputElement>(null);
  const startedRef = useRef(false);

  const [profile, setProfile] = useState<UserProfileForChat>({ dietaryRestrictions: [], primaryGoal: "" });
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [history, setHistory] = useState<ChatHistoryMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [composeDishText, setComposeDishText] = useState<string | null>(null);
  const [composeIngredientsText, setComposeIngredientsText] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"dish" | "ingredients" | null>(null);
  const [pendingDetection, setPendingDetection] = useState<{
    kind: "dish" | "ingredients";
    text: string;
    inputImageUrl?: string;
    outputImageUrl?: string;
  } | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState("");
  const [lastSentMessage, setLastSentMessage] = useState<string | null>(null);
  const [lastSentIngredients, setLastSentIngredients] = useState<string[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);

  const busy = isBootstrapping || isSending;

  function scrollToBottom() {
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  async function bootstrapWelcome(dietaryRestrictions: string[], primaryGoal: string) {
    setIsBootstrapping(true);
    setError("");
    setMessages([]);
    setHistory([]);
    setLastSentMessage(null);
    setLastSentIngredients([]);
    setComposeDishText(null);
    setComposeIngredientsText(null);
    const sid = newSessionId();
    setSessionId(sid);
    try {
      const response = await aiWelcome({
        sessionId: sid,
        dietaryRestrictions,
        primaryGoal: primaryGoal || undefined,
      });
      setSessionId(response.session_id || sid);
      const reply = response.reply.trim() || "Hello! I'm your culinary companion. Tell me what you'd like to cook.";
      setMessages([{ id: `a-${Date.now()}`, role: "assistant", text: reply, recipes: response.recipes }]);
      if (response.reply.trim()) setHistory([{ role: "assistant", content: response.reply }]);
    } catch (err) {
      const msg = errorMessage(err, "Unable to reach the AI companion.");
      setError(msg);
      setMessages([{ id: `err-${Date.now()}`, role: "assistant", text: msg }]);
    } finally {
      setIsBootstrapping(false);
      scrollToBottom();
    }
  }

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;
    apiGetMe()
      .then((u) => {
        if (cancelled) return;
        const p: UserProfileForChat = {
          dietaryRestrictions: u.dietary_restrictions ?? [],
          primaryGoal: u.primary_goal ?? "",
        };
        setProfile(p);
        void bootstrapWelcome(p.dietaryRestrictions, p.primaryGoal);
      })
      .catch(() => {
        if (cancelled) return;
        void bootstrapWelcome([], "");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, busy]);

  function ingredientsForApi(): string[] {
    const text = composeIngredientsText?.trim();
    if (!text) return [];
    let values = text;
    const prefix = "Ingredients detected:";
    if (values.toLowerCase().startsWith(prefix.toLowerCase())) values = values.slice(prefix.length);
    return values.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  }

  function buildMergedPrompt(userQuery: string): string {
    const parts: string[] = [];
    if (composeDishText?.trim()) parts.push(composeDishText.trim());
    if (composeIngredientsText?.trim()) parts.push(composeIngredientsText.trim());
    const trimmed = userQuery.trim();
    if (trimmed) parts.push(trimmed);
    return parts.join("\n");
  }

  async function sendToAi(merged: string, ingredients: string[], baseHistory: ChatHistoryMessage[]) {
    try {
      const response = await aiChat({
        message: merged,
        sessionId: sessionId!,
        conversationHistory: baseHistory,
        dietaryRestrictions: profile.dietaryRestrictions,
        primaryGoal: profile.primaryGoal || undefined,
        ingredients,
      });
      if (response.session_id) setSessionId(response.session_id);
      const reply = response.reply.trim() || "(Empty reply)";
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", text: reply, recipes: response.recipes }]);
      setHistory([...baseHistory, { role: "user", content: merged }, { role: "assistant", content: reply }]);
    } catch (err) {
      const msg = errorMessage(err, "Unable to reach the AI companion.");
      setError(msg);
      setMessages((prev) => [...prev, { id: `err-${Date.now()}`, role: "assistant", text: msg }]);
    } finally {
      setIsSending(false);
      scrollToBottom();
    }
  }

  async function handleSubmit() {
    if (busy || isDetecting) return;
    const userQuery = input.trim();
    const merged = buildMergedPrompt(userQuery);
    if (!merged) return;

    if (!sessionId) {
      await bootstrapWelcome(profile.dietaryRestrictions, profile.primaryGoal);
    }

    const ingredients = ingredientsForApi();
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: merged }]);
    setLastSentMessage(merged);
    setLastSentIngredients(ingredients);
    setIsSending(true);
    setComposeDishText(null);
    setComposeIngredientsText(null);
    setInput("");
    setError("");
    scrollToBottom();
    await sendToAi(merged, ingredients, history);
  }

  async function handleRerun() {
    if (busy || !lastSentMessage) return;
    let baseHistory = history;
    setMessages((prev) => {
      const copy = [...prev];
      if (copy.length && copy[copy.length - 1].role === "assistant") copy.pop();
      return copy;
    });
    if (baseHistory.length && baseHistory[baseHistory.length - 1].role === "assistant") {
      baseHistory = baseHistory.slice(0, -1);
    }
    if (
      baseHistory.length &&
      baseHistory[baseHistory.length - 1].role === "user" &&
      baseHistory[baseHistory.length - 1].content === lastSentMessage
    ) {
      baseHistory = baseHistory.slice(0, -1);
    }
    setHistory(baseHistory);
    setIsSending(true);
    setError("");
    scrollToBottom();
    await sendToAi(lastSentMessage, lastSentIngredients, baseHistory);
  }

  async function handleReset() {
    setConfirmReset(false);
    await bootstrapWelcome(profile.dietaryRestrictions, profile.primaryGoal);
  }

  async function handleDetect(file: File, kind: "dish" | "ingredients") {
    setIsDetecting(true);
    setError("");
    try {
      if (kind === "dish") {
        const result = await aiDetectDish(file);
        const names = result.results.length
          ? result.results.slice(0, 5).map((r) => r.dishName).filter(Boolean)
          : result.dishName
            ? [result.dishName]
            : result.suggestedRecipes.slice(0, 5);
        if (names.length) {
          setPendingDetection({
            kind: "dish",
            text: `Dishes detected: ${names[0]}`,
            inputImageUrl: result.imageUrl || undefined,
          });
        } else {
          setError("Could not recognize a dish in that photo.");
        }
      } else {
        const result = await aiDetectIngredients(file);
        if (result.ingredients.length) {
          setPendingDetection({
            kind: "ingredients",
            text: `Ingredients detected: ${result.ingredients.join(", ")}`,
            inputImageUrl: result.imageUrl || undefined,
            outputImageUrl: result.annotatedImageUrl || undefined,
          });
        } else {
          setError("No ingredients detected in that photo.");
        }
      }
    } catch (err) {
      setError(errorMessage(err, "Unable to analyze the photo."));
    } finally {
      setIsDetecting(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>, kind: "dish" | "ingredients") {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void handleDetect(file, kind);
  }

  const dishText = composeDishText?.trim();
  const ingredientsText = composeIngredientsText?.trim();
  const hasDish = !!dishText;
  const hasIngredients = !!ingredientsText;

  const lastAssistantIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === "assistant") return i;
    return -1;
  })();

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--tm-bg)" }}>
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 h-14 border-b shrink-0"
        style={{ backgroundColor: "var(--tm-surface)", borderColor: "var(--tm-border-s)" }}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#059669" }}>
          <Sparkles size={16} color="white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate" style={{ color: "var(--tm-text)" }}>AI Companion</p>
          <p className="text-[11px] truncate" style={{ color: "var(--tm-text-3)" }}>Personalized recipe recommendations</p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          disabled={busy}
          className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40"
          style={{ backgroundColor: "var(--tm-subtle)", color: "var(--tm-text-2)" }}
          aria-label="Reset conversation"
          title="Reset conversation"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto py-3 space-y-3 min-h-0">
        {messages.map((m, index) => {
          const isUser = m.role === "user";
          const showRerun = !busy && !isUser && index === lastAssistantIndex && !!lastSentMessage;
          return (
            <div key={m.id} className={`px-3 flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-2 max-w-[85%] ${isUser ? "flex-row-reverse" : ""}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "#059669" }}>
                    <Sparkles size={14} color="white" />
                  </div>
                )}
                <div>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 ${isUser ? "rounded-tr-md" : "rounded-tl-md"}`}
                    style={
                      isUser
                        ? { background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#fff" }
                        : { backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }
                    }
                  >
                    {isUser ? (
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    ) : (
                      <MarkdownReply text={m.text} recipes={m.recipes} />
                    )}
                  </div>
                  {showRerun && (
                    <button
                      type="button"
                      onClick={() => void handleRerun()}
                      className="mt-1.5 text-[11px] font-semibold px-2 py-1 rounded-lg"
                      style={{ color: "#059669", backgroundColor: "rgba(5,150,105,0.12)" }}
                    >
                      Rerun
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {busy && <TypingIndicator label={isBootstrapping ? "Starting session…" : "Thinking…"} />}
      </div>

      {error && (
        <div className="mx-3 mb-2 rounded-xl px-3 py-2 text-[12px]" style={{ backgroundColor: "#F43F5E14", color: "#F43F5E" }}>
          {error}
        </div>
      )}

      {/* Compose */}
      <div
        className="shrink-0 px-3 pb-3 pt-2 border-t"
        style={{ backgroundColor: "var(--tm-surface)", borderColor: "var(--tm-border-i)" }}
      >
        {hasDish && (
          <ComposeDetectionRow
            text={dishText!}
            icon={<UtensilsCrossed size={16} color="#059669" />}
            disabled={busy}
            onEdit={() => setEditingField("dish")}
          />
        )}
        {hasIngredients && (
          <ComposeDetectionRow
            text={ingredientsText!}
            icon={<ShoppingBasket size={16} color="#059669" />}
            disabled={busy}
            onEdit={() => setEditingField("ingredients")}
          />
        )}

        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => dishInputRef.current?.click()}
            disabled={busy || isDetecting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium disabled:opacity-50"
            style={{ borderColor: "var(--tm-border-i)", color: "var(--tm-text-2)", backgroundColor: "var(--tm-subtle)" }}
          >
            <Camera size={14} /> Dish photo
          </button>
          <button
            type="button"
            onClick={() => ingredientsInputRef.current?.click()}
            disabled={busy || isDetecting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium disabled:opacity-50"
            style={{ borderColor: "var(--tm-border-i)", color: "var(--tm-text-2)", backgroundColor: "var(--tm-subtle)" }}
          >
            <ShoppingBasket size={14} /> Ingredients photo
          </button>
        </div>

        <div
          className="flex items-center gap-2 h-11 rounded-full border px-3"
          style={{ borderColor: "var(--tm-border-i)", backgroundColor: "var(--tm-subtle)" }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
            disabled={busy}
            placeholder={isDetecting ? "Analyzing photo…" : "Ask for recipes…"}
            className="flex-1 bg-transparent text-sm focus:outline-none"
            style={{ color: "var(--tm-text)" }}
          />
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={busy || isDetecting || (!input.trim() && !hasDish && !hasIngredients)}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40"
            style={{ backgroundColor: "#059669" }}
          >
            <Send size={14} color="white" />
          </button>
        </div>
      </div>

      <input ref={dishInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, "dish")} />
      <input ref={ingredientsInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, "ingredients")} />

      {pendingDetection && (
        <DetectionConfirmDialog
          title={pendingDetection.kind === "dish" ? "Dish recognized — is this right?" : "Ingredients detected — is this right?"}
          text={pendingDetection.text}
          inputImageUrl={pendingDetection.inputImageUrl}
          outputImageUrl={pendingDetection.outputImageUrl}
          onSave={(text) => {
            const trimmed = text.trim();
            if (pendingDetection.kind === "dish") setComposeDishText(trimmed || null);
            else setComposeIngredientsText(trimmed || null);
            setPendingDetection(null);
          }}
          onCancel={() => setPendingDetection(null)}
        />
      )}

      {editingField && (
        <NoteDialog
          title={editingField === "dish" ? "Edit detected dish" : "Edit detected ingredients"}
          initialNote={(editingField === "dish" ? composeDishText : composeIngredientsText) ?? ""}
          accentColor="#059669"
          onSave={(text) => {
            const trimmed = text.trim();
            if (editingField === "dish") setComposeDishText(trimmed || null);
            else setComposeIngredientsText(trimmed || null);
            setEditingField(null);
          }}
          onCancel={() => setEditingField(null)}
        />
      )}

      {confirmReset && (
        <ConfirmDialog
          title="Reset chat?"
          message="This clears your current conversation and starts a new session."
          confirmLabel="Reset"
          confirmColor="#059669"
          onConfirm={() => void handleReset()}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}
