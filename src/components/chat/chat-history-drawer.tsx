"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { listChatSessions, deleteChatSession, renameChatSession } from "@/lib/api/ai";
import type { ChatSessionSummary } from "@/lib/api/types";
import { relativeTime } from "@/lib/admin";
import { useLang } from "@/lib/use-lang";
import { useStrings } from "@/lib/use-strings";
import { ConfirmDialog } from "@/components/confirm-dialog";

const PAGE_SIZE = 20;

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof Error) return err.message;
  return fallback;
}

/** Left-edge sidebar overlay listing the user's saved chat sessions (GET
 * /ai/sessions), with New chat / open / delete actions. */
export function ChatHistoryDrawer({
  activeSessionId,
  onClose,
  onSelectSession,
  onNewChat,
}: {
  activeSessionId: string | null;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
}) {
  const t = useStrings();
  const lang = useLang();
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ChatSessionSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await listChatSessions({ skip: 0, limit: PAGE_SIZE });
        if (cancelled) return;
        setSessions(res.sessions);
        setTotalCount(res.total_count);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, t.unableToLoadChatHistory));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await listChatSessions({ skip: sessions.length, limit: PAGE_SIZE });
      setSessions((prev) => [...prev, ...res.sessions]);
      setTotalCount(res.total_count);
    } catch (err) {
      setError(errorMessage(err, t.unableToLoadChatHistory));
    } finally {
      setLoadingMore(false);
    }
  }

  function startRename(session: ChatSessionSummary) {
    setRenamingId(session.session_id);
    setRenameValue(session.title ?? "");
  }

  async function commitRename(session: ChatSessionSummary) {
    const trimmed = renameValue.trim();
    setRenamingId(null);
    if (!trimmed || trimmed === (session.title ?? "")) return;
    try {
      const updated = await renameChatSession(session.session_id, trimmed);
      setSessions((prev) => prev.map((s) => (s.session_id === updated.session_id ? updated : s)));
    } catch (err) {
      setError(errorMessage(err, t.unableToRenameChatSession));
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteChatSession(deleteTarget.session_id);
      setSessions((prev) => prev.filter((s) => s.session_id !== deleteTarget.session_id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      const wasActive = deleteTarget.session_id === activeSessionId;
      setDeleteTarget(null);
      if (wasActive) onNewChat();
    } catch (err) {
      setError(errorMessage(err, t.unableToDeleteChatSession));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.chatHistoryTitle}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:w-80 max-w-[85vw] h-full flex flex-col"
          style={{ backgroundColor: "var(--tm-surface)" }}
        >
          <div
            className="flex items-center gap-2 px-4 h-14 border-b shrink-0"
            style={{ borderColor: "var(--tm-border-i)" }}
          >
            <p className="text-sm font-bold flex-1" style={{ color: "var(--tm-text)" }}>
              {t.chatHistoryTitle}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--tm-subtle)", color: "var(--tm-text-2)" }}
              aria-label={t.close}
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-3 pt-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: "#059669" }}
            >
              <Plus size={16} /> {t.newChatLabel}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {loading ? (
              <p className="text-xs text-center py-6" style={{ color: "var(--tm-text-3)" }}>
                {t.loadingChatHistory}
              </p>
            ) : error && sessions.length === 0 ? (
              <p className="text-xs text-center py-6" style={{ color: "#F43F5E" }}>
                {error}
              </p>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-center py-6" style={{ color: "var(--tm-text-3)" }}>
                {t.noChatHistoryYet}
              </p>
            ) : (
              <>
                {sessions.map((s) => {
                  const active = s.session_id === activeSessionId;
                  return (
                    <div
                      key={s.session_id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        onSelectSession(s.session_id);
                        onClose();
                      }}
                      className="rounded-xl px-3 py-2.5 flex items-start gap-2 cursor-pointer"
                      style={{
                        backgroundColor: active ? "rgba(5,150,105,0.12)" : "var(--tm-subtle)",
                        border: active ? "1px solid rgba(5,150,105,0.4)" : "1px solid transparent",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        {renamingId === s.session_id ? (
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void commitRename(s);
                              else if (e.key === "Escape") setRenamingId(null);
                            }}
                            onBlur={() => void commitRename(s)}
                            className="w-full text-[13px] font-semibold bg-transparent outline-none border-b"
                            style={{ color: "var(--tm-text)", borderColor: "#059669" }}
                          />
                        ) : (
                          <p
                            className="text-[13px] font-semibold truncate"
                            style={{ color: "var(--tm-text)" }}
                          >
                            {s.title?.trim() || t.newChatLabel}
                          </p>
                        )}
                        {s.last_message && (
                          <p
                            className="text-[11.5px] truncate mt-0.5"
                            style={{ color: "var(--tm-text-3)" }}
                          >
                            {s.last_message}
                          </p>
                        )}
                        <p className="text-[10.5px] mt-1" style={{ color: "var(--tm-text-3)" }}>
                          {relativeTime(s.updated_at, lang)} · {t.messageCountLabel(s.message_count)}
                        </p>
                      </div>
                      {renamingId === s.session_id ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void commitRename(s);
                          }}
                          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ color: "#059669" }}
                          aria-label={t.saveLabel}
                        >
                          <Check size={14} />
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startRename(s);
                            }}
                            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center opacity-60 hover:opacity-100"
                            style={{ color: "var(--tm-text-2)" }}
                            aria-label={t.edit}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(s);
                            }}
                            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center opacity-60 hover:opacity-100"
                            style={{ color: "#DC2626" }}
                            aria-label={t.delete}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
                {error && <p className="text-[11px] text-center" style={{ color: "#F43F5E" }}>{error}</p>}
                {sessions.length < totalCount && (
                  <button
                    type="button"
                    onClick={() => void loadMore()}
                    disabled={loadingMore}
                    className="w-full py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                    style={{ color: "#059669" }}
                  >
                    {loadingMore ? t.loadingChatHistory : t.loadMoreLabel}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title={t.deleteChatSessionTitle}
          message={t.deleteChatSessionDesc}
          confirmLabel={t.delete}
          confirmColor="#DC2626"
          onConfirm={() => void handleConfirmDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
