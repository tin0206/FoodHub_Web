"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Camera,
  History,
  Loader2,
  Pencil,
  RefreshCw,
  Send,
  ShoppingBasket,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { apiGetMe } from "@/lib/api/auth";
import {
  aiWelcome,
  aiChat,
  aiDetectDish,
  aiDetectIngredients,
  getChatSession,
  type DishMatch,
} from "@/lib/api/ai";
import { getRecipe } from "@/lib/api/recipes";
import { ApiError, resolveMediaUrl } from "@/lib/api-client";
import type { ApiRecipe, ChatHistoryMessage, ChatOption } from "@/lib/api/types";
import { loadChatSession, saveChatSession } from "@/lib/chat-session";
import { RecipeImageHeader } from "@/components/recipe/recipe-image-header";
import { ChatComposer } from "@/components/chat/chat-composer";
import {
  ChatMessageBubble,
  lastAssistantIndex,
  type ChatUiMessage,
} from "@/components/chat/chat-message-bubble";
import { ChatHistoryDrawer } from "@/components/chat/chat-history-drawer";
import { extractRecipeMarkdownLinks, type RecipeLinkRef } from "@/components/chat/markdown-reply";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { NoteDialog } from "@/components/note-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDarkMode } from "@/lib/use-dark-mode";
import { useLang } from "@/lib/use-lang";
import { useStrings } from "@/lib/use-strings";

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
  text,
  icon,
  disabled,
  onEdit,
  onSend,
}: {
  text: string;
  icon: ReactNode;
  disabled: boolean;
  onEdit: () => void;
  onSend: () => void;
}) {
  const dark = useDarkMode();
  const t = useStrings();
  return (
    <div
      className="flex items-start gap-2 rounded-xl px-3 py-2.5 mb-2"
      style={{
        backgroundColor: dark ? "#1E1E1E" : "#F3F4F6",
        border: "1px solid rgba(5,150,105,0.35)",
      }}
    >
      {icon}
      <p
        className="flex-1 text-[13px] leading-snug"
        style={{ color: "var(--tm-text)" }}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        className="shrink-0 disabled:opacity-40"
        style={{ color: "var(--tm-text-3)" }}
        aria-label={t.edit}
      >
        <Pencil size={15} />
      </button>
      <button
        type="button"
        onClick={onSend}
        disabled={disabled}
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40"
        style={{ backgroundColor: "#059669" }}
        aria-label={t.sendLabel}
        title={t.sendLabel}
      >
        <Send size={12} color="white" />
      </button>
    </div>
  );
}

function DetectingBanner({ kind }: { kind: "dish" | "ingredients" }) {
  const t = useStrings();
  const Icon = kind === "dish" ? UtensilsCrossed : ShoppingBasket;
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-2"
      style={{
        backgroundColor: "rgba(5,150,105,0.1)",
        border: "1px solid rgba(5,150,105,0.35)",
      }}
    >
      <Icon size={16} color="#059669" />
      <p
        className="flex-1 text-[13px] leading-snug"
        style={{ color: "var(--tm-text)" }}
      >
        {t.analyzingPhoto}
      </p>
      <Loader2 size={16} className="animate-spin" color="#059669" />
    </div>
  );
}

function DetectionConfirmDialog({
  title,
  text,
  inputImageUrl,
  outputImageUrl,
  onSave,
  onCancel,
}: {
  title: string;
  text: string;
  inputImageUrl?: string;
  outputImageUrl?: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}) {
  const t = useStrings();
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
        <p
          className="text-sm font-bold mb-3"
          style={{ color: "var(--tm-text)" }}
        >
          {title}
        </p>

        {detectedImageUrl && (
          <div
            className="w-full rounded-lg mb-3 flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: "var(--tm-subtle)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveMediaUrl(detectedImageUrl)}
              alt={t.detectionResultAlt}
              className="w-full max-h-80 object-contain"
            />
          </div>
        )}

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          autoFocus
          placeholder={t.editBeforeAddingHint}
          className="w-full px-2.5 py-2 rounded-xl text-xs resize-none focus:outline-none"
          style={{
            backgroundColor: "var(--tm-subtle)",
            color: "var(--tm-text-2)",
          }}
        />

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg text-xs font-semibold"
            style={{
              backgroundColor: "var(--tm-subtle)",
              color: "var(--tm-text-2)",
            }}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => onSave(value)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: "#059669" }}
          >
            {t.useThisLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function DishCardPicker({
  results,
  onPick,
  onCancel,
}: {
  results: DishMatch[];
  onPick: (match: DishMatch) => void;
  onCancel: () => void;
}) {
  const t = useStrings();
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
        <p className="text-sm font-bold mb-3" style={{ color: "var(--tm-text)" }}>
          {t.dishRecognizedTitle}
        </p>

        <div className="flex flex-col gap-2 mb-3">
          {results.map((match) => (
            <button
              key={match.rank}
              type="button"
              onClick={() => onPick(match)}
              className="flex items-center gap-3 rounded-xl overflow-hidden border text-left transition-opacity hover:opacity-90"
              style={{ borderColor: "var(--tm-border-i)", backgroundColor: "var(--tm-subtle)" }}
            >
              <div className="w-16 h-16 shrink-0">
                <RecipeImageHeader
                  imageUrl={match.recipe?.image_url}
                  cardId={match.rank}
                  labels={match.recipe?.dietary_restrictions ?? []}
                  height={64}
                />
              </div>
              <p
                className="text-sm font-semibold pr-3 py-2 line-clamp-2"
                style={{ color: "var(--tm-text)" }}
              >
                {match.recipe?.title || match.dishName}
              </p>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2 rounded-lg text-xs font-semibold"
          style={{ backgroundColor: "var(--tm-subtle)", color: "var(--tm-text-2)" }}
        >
          {t.cancel}
        </button>
      </div>
    </div>
  );
}

export default function RecsPage() {
  const t = useStrings();
  const lang = useLang();
  const listRef = useRef<HTMLDivElement>(null);
  const dishInputRef = useRef<HTMLInputElement>(null);
  const ingredientsInputRef = useRef<HTMLInputElement>(null);
  const startedRef = useRef(false);

  const [profile, setProfile] = useState<UserProfileForChat>({
    dietaryRestrictions: [],
    primaryGoal: "",
  });
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [history, setHistory] = useState<ChatHistoryMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [composeDishText, setComposeDishText] = useState<string | null>(null);
  const [composeIngredientsText, setComposeIngredientsText] = useState<
    string | null
  >(null);
  const [editingField, setEditingField] = useState<
    "dish" | "ingredients" | null
  >(null);
  const [dishPicker, setDishPicker] = useState<DishMatch[] | null>(null);
  const [pendingDetection, setPendingDetection] = useState<{
    kind: "dish" | "ingredients";
    text: string;
    inputImageUrl?: string;
    outputImageUrl?: string;
  } | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [detectingKind, setDetectingKind] = useState<
    "dish" | "ingredients" | null
  >(null);
  const isDetecting = detectingKind !== null;
  const [error, setError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  // The recipe the user last opened from a chat reply — provides the title/image
  // when they save an AI-edited version ("make it vegetarian") back to their library.
  const [referencedRecipe, setReferencedRecipe] = useState<ApiRecipe | null>(null);
  // Recipe links from the most recent recommendation-list reply — lets a plain-text
  // pick ("choose option 2") resolve to a real recipe without the user tapping a card.
  const [lastCtas, setLastCtas] = useState<RecipeLinkRef[]>([]);
  // Every full recipe the AI has embedded in a `recipes[]` list so far this
  // session, keyed by id — the chat API already sends the same shape as
  // `GET /recipes/{id}` (image_url/nutrition included), so once a recipe has
  // appeared in a list once, opening/referencing it again never needs a fetch.
  const [recipeCache, setRecipeCache] = useState<Record<number, ApiRecipe>>({});

  function cacheRecipes(recipes: ApiRecipe[]) {
    if (recipes.length === 0) return;
    setRecipeCache((prev) => {
      const next = { ...prev };
      for (const r of recipes) next[r.id] = r;
      return next;
    });
  }

  const busy = isBootstrapping || isSending;

  function scrollToBottom() {
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  async function bootstrapWelcome(
    dietaryRestrictions: string[],
    primaryGoal: string,
  ) {
    setIsBootstrapping(true);
    setError("");
    setMessages([]);
    setHistory([]);
    setComposeDishText(null);
    setComposeIngredientsText(null);
    setReferencedRecipe(null);
    setLastCtas([]);
    setRecipeCache({});
    const sid = newSessionId();
    setSessionId(sid);
    try {
      const response = await aiWelcome({
        sessionId: sid,
        dietaryRestrictions,
        primaryGoal: primaryGoal || undefined,
      });
      setSessionId(response.session_id || sid);
      const reply = response.reply.trim() || t.aiWelcomeFallback;
      cacheRecipes(response.recipes);
      setMessages([
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: reply,
          options: response.options,
          isWelcome: true,
        },
      ]);
      setLastCtas(extractRecipeMarkdownLinks(reply).links);
      if (response.reply.trim())
        setHistory([{ role: "assistant", content: response.reply }]);
    } catch (err) {
      const msg = errorMessage(err, t.unableToReachAi);
      setError(msg);
      setMessages([{ id: `err-${Date.now()}`, role: "assistant", text: msg }]);
    } finally {
      setIsBootstrapping(false);
      scrollToBottom();
    }
  }

  // Reopens a saved conversation from the history drawer (GET /ai/sessions/{id})
  // — the backend only stores plain role/content pairs, so options/recipe
  // snapshots/save state naturally start blank for restored messages, same as
  // for any older message from before this feature existed.
  async function loadExistingSession(targetSessionId: string) {
    if (targetSessionId === sessionId) return;
    setIsBootstrapping(true);
    setError("");
    try {
      const detail = await getChatSession(targetSessionId);
      const uiMessages: ChatUiMessage[] = detail.messages.map((m, i) => ({
        id: `${m.role[0]}-${i}-${targetSessionId}`,
        role: m.role,
        text: m.content,
      }));
      const historyMessages: ChatHistoryMessage[] = detail.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      setSessionId(detail.session_id);
      setMessages(uiMessages);
      setHistory(historyMessages);
      setComposeDishText(null);
      setComposeIngredientsText(null);
      setReferencedRecipe(null);
      setRecipeCache({});
      const lastAssistant = [...uiMessages].reverse().find((m) => m.role === "assistant");
      setLastCtas(lastAssistant ? extractRecipeMarkdownLinks(lastAssistant.text).links : []);
    } catch (err) {
      setError(errorMessage(err, t.unableToLoadChatHistory));
    } finally {
      setIsBootstrapping(false);
      scrollToBottom();
    }
  }

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const persisted = loadChatSession();
    if (persisted) {
      setSessionId(persisted.sessionId);
      setMessages(persisted.messages);
      setHistory(persisted.history);
      setComposeDishText(persisted.composeDishText);
      setComposeIngredientsText(persisted.composeIngredientsText);
      setReferencedRecipe(persisted.referencedRecipe ?? null);
      setRecipeCache(persisted.recipeCache ?? {});
      setIsBootstrapping(false);
      // A restored session's most recent recommendation list still needs to be
      // resolvable by a plain-text pick ("choose option 2") after the reload.
      const lastAssistant = [...persisted.messages].reverse().find((m) => m.role === "assistant");
      if (lastAssistant) setLastCtas(extractRecipeMarkdownLinks(lastAssistant.text).links);
    }

    let cancelled = false;
    apiGetMe()
      .then((u) => {
        if (cancelled) return;
        const p: UserProfileForChat = {
          dietaryRestrictions: u.dietary_restrictions ?? [],
          primaryGoal: u.primary_goal ?? "",
        };
        setProfile(p);
        if (!persisted)
          void bootstrapWelcome(p.dietaryRestrictions, p.primaryGoal);
      })
      .catch(() => {
        if (cancelled) return;
        if (!persisted) void bootstrapWelcome([], "");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the conversation in sessionStorage so a page reload doesn't lose it — cleared on logout.
  useEffect(() => {
    if (!sessionId || messages.length === 0) return;
    saveChatSession({
      sessionId,
      messages,
      history,
      composeDishText,
      composeIngredientsText,
      referencedRecipe,
      recipeCache,
    });
  }, [
    sessionId,
    messages,
    history,
    composeDishText,
    referencedRecipe,
    composeIngredientsText,
    recipeCache,
  ]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, busy]);

  function ingredientsForApi(): string[] {
    const text = composeIngredientsText?.trim();
    if (!text) return [];
    let values = text;
    const prefix = t.ingredientsDetectedPrefix;
    if (values.toLowerCase().startsWith(prefix.toLowerCase()))
      values = values.slice(prefix.length);
    return values
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function buildMergedPrompt(userQuery: string): string {
    const parts: string[] = [];
    if (composeDishText?.trim()) parts.push(composeDishText.trim());
    if (composeIngredientsText?.trim())
      parts.push(composeIngredientsText.trim());
    const trimmed = userQuery.trim();
    if (trimmed) parts.push(trimmed);
    return parts.join("\n");
  }

  async function sendToAi(
    merged: string,
    ingredients: string[],
    baseHistory: ChatHistoryMessage[],
    isFreshReferenceView = false,
    referenceSnapshot: ApiRecipe | null = null,
  ) {
    try {
      const response = await aiChat({
        message: merged,
        sessionId: sessionId!,
        dietaryRestrictions: profile.dietaryRestrictions,
        primaryGoal: profile.primaryGoal || undefined,
        ingredients,
      });
      if (response.session_id) setSessionId(response.session_id);
      const reply = response.reply.trim() || t.emptyReply;
      cacheRecipes(response.recipes);

      // The backend sometimes states the selected recipe's id directly in the
      // reply text (e.g. "... (ID: 7445) ...") when narrowing to one recipe
      // out of a prior list — prefer that (cache lookup, fetch as last
      // resort) over the pre-send guess from the user's own wording, since
      // it's authoritative.
      let finalSnapshot = referenceSnapshot;
      const statedIdMatch = /\(id[:\s]*(\d{1,10})\)/i.exec(reply);
      if (statedIdMatch) {
        const statedId = Number(statedIdMatch[1]);
        const cached = recipeCache[statedId];
        if (cached) {
          finalSnapshot = cached;
        } else {
          try {
            const fetched = await getRecipe(statedId, lang);
            finalSnapshot = fetched;
            cacheRecipes([fetched]);
          } catch {
            // keep whatever snapshot was already resolved pre-send
          }
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: reply,
          options: response.options,
          isFreshReferenceView,
          // Frozen at the moment this reply was requested — never the live,
          // shared `referencedRecipe`, which can move on to a different
          // recipe by the time this specific message is later interacted
          // with (e.g. after picking a second recipe from the same list).
          referencedRecipeSnapshot: finalSnapshot,
        },
      ]);
      // Sticky until a genuinely new recommendation list arrives — a detail
      // reply has no links of its own, and clearing this on every such reply
      // broke resolving a second plain-text pick ("choose option 2") against
      // the same original list.
      const newLinks = extractRecipeMarkdownLinks(reply).links;
      if (newLinks.length > 0) setLastCtas(newLinks);
      setHistory([
        ...baseHistory,
        { role: "user", content: merged },
        { role: "assistant", content: reply },
      ]);
    } catch (err) {
      const msg = errorMessage(err, t.unableToReachAi);
      setError(msg);
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: "assistant", text: msg },
      ]);
    } finally {
      setIsSending(false);
      scrollToBottom();
    }
  }

  // A plain-text pick ("choose option 2", "let's go with 2", or the recipe's
  // own title) from the last recommendation list doesn't tap a CTA card, so
  // there's no fetch to hang a "referenced recipe" off — resolve it ourselves
  // so the save/highlight UI has a title+image to work with on the very first
  // recipe detail reply, not just once the user later opens a card.
  async function tryResolveReferencedRecipe(userText: string): Promise<ApiRecipe | null> {
    if (lastCtas.length === 0) return null;
    const trimmed = userText.trim();
    let matched: RecipeLinkRef | undefined;
    if (trimmed.length <= 40) {
      const numberMatch = trimmed.match(/\d{1,2}/);
      if (numberMatch) {
        const idx = Number(numberMatch[0]) - 1;
        matched = lastCtas[idx];
      }
    }
    if (!matched) {
      const lower = trimmed.toLowerCase();
      matched = lastCtas.find((c) => c.title && lower.includes(c.title.toLowerCase()));
    }
    if (!matched?.recipeId) return null;
    const numericId = Number(matched.recipeId);
    if (!Number.isFinite(numericId)) return null;
    // Already embedded in an earlier recommendation-list reply — no fetch needed.
    const cached = recipeCache[numericId];
    if (cached) {
      setReferencedRecipe(cached);
      return cached;
    }
    try {
      const fetched = await getRecipe(numericId, lang);
      cacheRecipes([fetched]);
      setReferencedRecipe(fetched);
      return fetched;
    } catch {
      // best-effort only — the save/highlight UI just won't show for this turn
      return null;
    }
  }

  function markMessageSaved(messageId: string, recipeId: number) {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, savedRecipeId: recipeId } : m)),
    );
  }

  async function handleSubmit(userQuery: string) {
    if (busy || isDetecting) return;
    const merged = buildMergedPrompt(userQuery.trim());
    if (!merged) return;

    if (!sessionId) {
      await bootstrapWelcome(profile.dietaryRestrictions, profile.primaryGoal);
    }

    const ingredients = ingredientsForApi();
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text: merged },
    ]);
    setIsSending(true);
    setComposeDishText(null);
    setComposeIngredientsText(null);
    setError("");
    scrollToBottom();

    // Resolved before sending so the upcoming reply can be tagged as a fresh
    // pick (no diff/"changes" framing) vs a genuine follow-up edit, and so the
    // reply's snapshot is exactly what was just resolved rather than whatever
    // `referencedRecipe` happens to hold by the time this async call settles.
    const resolved = await tryResolveReferencedRecipe(userQuery);
    const snapshot = resolved ?? referencedRecipe;
    await sendToAi(merged, ingredients, history, resolved != null, snapshot);
  }

  // Sends just the dish or just the ingredients detection on its own, leaving
  // the other one (if also pending) untouched for the user to send separately.
  async function sendDetectionOnly(kind: "dish" | "ingredients") {
    if (busy || isDetecting) return;
    const merged = (kind === "dish" ? composeDishText : composeIngredientsText)?.trim();
    if (!merged) return;

    if (!sessionId) {
      await bootstrapWelcome(profile.dietaryRestrictions, profile.primaryGoal);
    }

    const ingredients = kind === "ingredients" ? ingredientsForApi() : [];
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text: merged },
    ]);
    setIsSending(true);
    if (kind === "dish") setComposeDishText(null);
    else setComposeIngredientsText(null);
    setError("");
    scrollToBottom();

    const resolved = await tryResolveReferencedRecipe(merged);
    const snapshot = resolved ?? referencedRecipe;
    await sendToAi(merged, ingredients, history, resolved != null, snapshot);
  }

  // Sends the tapped option's label as a plain chat message — the backend errors on `message: null`.
  async function handleSelectOption(option: ChatOption) {
    if (busy || !sessionId) return;
    setMessages((prev) => {
      const next = [...prev];
      if (next.length && next[next.length - 1].role === "assistant") {
        next[next.length - 1] = { ...next[next.length - 1], options: [] };
      }
      next.push({ id: `u-${Date.now()}`, role: "user", text: option.label });
      return next;
    });
    setIsSending(true);
    setError("");
    scrollToBottom();
    // Same resolution step handleSubmit does — without it, picking a numbered
    // option never resolves which recipe was picked, so the follow-up detail
    // reply has no snapshot to hang the "Add to personal recipe" button off.
    const resolved = await tryResolveReferencedRecipe(option.label);
    const snapshot = resolved ?? referencedRecipe;
    await sendToAi(option.label, [], history, resolved != null, snapshot);
  }

  async function handleReset() {
    setConfirmReset(false);
    await bootstrapWelcome(profile.dietaryRestrictions, profile.primaryGoal);
  }

  async function handleDetect(file: File, kind: "dish" | "ingredients") {
    setDetectingKind(kind);
    setError("");
    try {
      if (kind === "dish") {
        const result = await aiDetectDish(file, lang);
        const candidates = result.results.slice(0, 5);
        if (candidates.length) {
          setDishPicker(candidates);
        } else if (result.dishName) {
          setComposeDishText(`${t.dishesDetectedPrefix} ${result.dishName}`);
        } else {
          setError(t.couldNotRecognizeDish);
        }
      } else {
        const result = await aiDetectIngredients(file, lang);
        if (result.ingredients.length) {
          setPendingDetection({
            kind: "ingredients",
            text: `${t.ingredientsDetectedPrefix} ${result.ingredients.join(", ")}`,
            inputImageUrl: result.imageUrl || undefined,
            outputImageUrl: result.annotatedImageUrl || undefined,
          });
        } else {
          setError(t.noIngredientsDetected);
        }
      }
    } catch (err) {
      setError(errorMessage(err, t.unableToAnalyzePhoto));
    } finally {
      setDetectingKind(null);
    }
  }

  function onFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    kind: "dish" | "ingredients",
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void handleDetect(file, kind);
  }

  function pickDish(match: DishMatch) {
    setComposeDishText(`${t.dishesDetectedPrefix} ${match.recipe?.title || match.dishName}`);
    setDishPicker(null);
  }

  const dishText = composeDishText?.trim();
  const ingredientsText = composeIngredientsText?.trim();
  const hasDish = !!dishText;
  const hasIngredients = !!ingredientsText;
  const lastAi = lastAssistantIndex(messages);

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "var(--tm-bg)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 h-14 border-b shrink-0"
        style={{
          backgroundColor: "var(--tm-surface)",
          borderColor: "var(--tm-border-s)",
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#059669" }}
        >
          <Sparkles size={16} color="white" />
        </div>
        <p
          className="text-sm font-bold truncate flex-1"
          style={{ color: "var(--tm-text)" }}
        >
          {t.aiCompanion}
        </p>
        <button
          type="button"
          onClick={() => setShowHistory(true)}
          disabled={busy}
          className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40"
          style={{
            backgroundColor: "var(--tm-subtle)",
            color: "var(--tm-text-2)",
          }}
          aria-label={t.historyLabel}
          title={t.historyLabel}
        >
          <History size={16} />
        </button>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          disabled={busy}
          className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40"
          style={{
            backgroundColor: "var(--tm-subtle)",
            color: "var(--tm-text-2)",
          }}
          aria-label={t.resetLabel}
          title={t.resetLabel}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto py-3 space-y-3 min-h-0"
      >
        {messages.map((message, index) => (
          <ChatMessageBubble
            key={message.id}
            message={message}
            messages={messages}
            messageIndex={index}
            isLatestAi={
              !busy && message.role === "assistant" && index === lastAi
            }
            optionsIntro={t.aiHasOptionsIntro}
            referencedRecipe={message.referencedRecipeSnapshot ?? null}
            recipeCache={recipeCache}
            onRecipeOpened={(r) => {
              setReferencedRecipe(r);
              cacheRecipes([r]);
            }}
            canSaveRecipes
            onRecipeSaved={(recipeId) => markMessageSaved(message.id, recipeId)}
            onSelectOption={(opt) => void handleSelectOption(opt)}
          />
        ))}
        {busy && (
          <TypingIndicator
            label={isBootstrapping ? t.startingSession : t.aiThinking}
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

      {/* Compose */}
      <div
        className="shrink-0 px-3 pb-3 pt-2 border-t"
        style={{
          backgroundColor: "var(--tm-surface)",
          borderColor: "var(--tm-border-i)",
        }}
      >
        {hasDish && (
          <ComposeDetectionRow
            text={dishText!}
            icon={<UtensilsCrossed size={16} color="#059669" />}
            disabled={busy}
            onEdit={() => setEditingField("dish")}
            onSend={() => void sendDetectionOnly("dish")}
          />
        )}
        {hasIngredients && (
          <ComposeDetectionRow
            text={ingredientsText!}
            icon={<ShoppingBasket size={16} color="#059669" />}
            disabled={busy}
            onEdit={() => setEditingField("ingredients")}
            onSend={() => void sendDetectionOnly("ingredients")}
          />
        )}

        {(hasDish || hasIngredients) && (
          <p className="text-[11.5px] mb-2 px-0.5" style={{ color: "var(--tm-text-3)" }}>
            {t.wantRecipeSuggestionsHint}
          </p>
        )}

        {detectingKind && <DetectingBanner kind={detectingKind} />}

        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => dishInputRef.current?.click()}
            disabled={busy || isDetecting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium disabled:opacity-50"
            style={{
              borderColor: "var(--tm-border-i)",
              color: "var(--tm-text-2)",
              backgroundColor: "var(--tm-subtle)",
            }}
          >
            {detectingKind === "dish" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Camera size={14} />
            )}{" "}
            {t.dishPhotoLabel}
          </button>
          <button
            type="button"
            onClick={() => ingredientsInputRef.current?.click()}
            disabled={busy || isDetecting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium disabled:opacity-50"
            style={{
              borderColor: "var(--tm-border-i)",
              color: "var(--tm-text-2)",
              backgroundColor: "var(--tm-subtle)",
            }}
          >
            {detectingKind === "ingredients" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ShoppingBasket size={14} />
            )}{" "}
            {t.ingredientsPhotoLabel}
          </button>
        </div>

        <ChatComposer
          disabled={busy || isDetecting}
          placeholder={isDetecting ? t.analyzingPhoto : t.askForRecipesHint}
          onSend={(text) => void handleSubmit(text)}
        />
      </div>

      <input
        ref={dishInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFileChange(e, "dish")}
      />
      <input
        ref={ingredientsInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFileChange(e, "ingredients")}
      />

      {pendingDetection && (
        <DetectionConfirmDialog
          title={
            pendingDetection.kind === "dish"
              ? t.dishRecognizedTitle
              : t.ingredientsDetectedTitle
          }
          text={pendingDetection.text}
          inputImageUrl={pendingDetection.inputImageUrl}
          outputImageUrl={pendingDetection.outputImageUrl}
          onSave={(text) => {
            const trimmed = text.trim();
            if (pendingDetection.kind === "dish")
              setComposeDishText(trimmed || null);
            else setComposeIngredientsText(trimmed || null);
            setPendingDetection(null);
          }}
          onCancel={() => setPendingDetection(null)}
        />
      )}

      {dishPicker && (
        <DishCardPicker
          results={dishPicker}
          onPick={pickDish}
          onCancel={() => setDishPicker(null)}
        />
      )}

      {editingField && (
        <NoteDialog
          title={
            editingField === "dish" ? t.editDishesLabel : t.editIngredientsLabel
          }
          initialNote={
            (editingField === "dish"
              ? composeDishText
              : composeIngredientsText) ?? ""
          }
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
          title={t.resetChatTitle}
          message={t.resetChatDesc}
          confirmLabel={t.resetLabel}
          confirmColor="#059669"
          onConfirm={() => void handleReset()}
          onCancel={() => setConfirmReset(false)}
        />
      )}

      {showHistory && (
        <ChatHistoryDrawer
          activeSessionId={sessionId}
          activeSessionLiveInfo={
            sessionId
              ? {
                  lastMessage: messages.length > 0 ? messages[messages.length - 1].text : null,
                  messageCount: messages.length,
                }
              : null
          }
          onClose={() => setShowHistory(false)}
          onSelectSession={(id) => void loadExistingSession(id)}
          onNewChat={() => void bootstrapWelcome(profile.dietaryRestrictions, profile.primaryGoal)}
        />
      )}
    </div>
  );
}
