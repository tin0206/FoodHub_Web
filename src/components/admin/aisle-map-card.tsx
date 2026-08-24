"use client";

import { useEffect, useRef, useState } from "react";
import { Store } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import {
  getAisleMappingStatus,
  startAisleMapping,
  stopAisleMapping,
  isAisleJobActive,
  type AisleMappingStatus,
} from "@/lib/api/admin-recipes";
import { useDarkMode } from "@/lib/use-dark-mode";
import { useStrings } from "@/lib/use-strings";
import { ADMIN_ACCENT_LIGHT, ADMIN_ACCENT_DARK } from "@/lib/admin";
import { ConfirmDialog } from "@/components/confirm-dialog";

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof Error) return err.message;
  return fallback;
}

export function AisleMapCard() {
  const dark = useDarkMode();
  const accent = dark ? ADMIN_ACCENT_DARK : ADMIN_ACCENT_LIGHT;
  const t = useStrings();

  const [status, setStatus] = useState<AisleMappingStatus | null>(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [confirmRemap, setConfirmRemap] = useState(false);
  const [toast, setToast] = useState("");
  const [toastIsError, setToastIsError] = useState(false);
  const pollRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const wasRunningRef = useRef(false);

  function stopPoll() {
    if (pollRef.current != null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function showToast(message: string, isError: boolean) {
    setToast(message);
    setToastIsError(isError);
    if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 4000);
  }

  function applyStatus(data: AisleMappingStatus) {
    const running = isAisleJobActive(data.job);
    if (wasRunningRef.current && !running) {
      const job = data.job;
      if (job?.status === "cancelled") {
        showToast(t.adminAisleMappingStoppedToast, false);
      } else if (job?.status === "failed" || job?.error_message) {
        showToast(job?.error_message || t.adminUnableToStartAisleMapping, true);
      } else {
        showToast(t.adminAisleMappingFinishedToast, false);
      }
    }
    wasRunningRef.current = running;
    setStatus(data);
    if (running) {
      if (pollRef.current == null) {
        pollRef.current = window.setInterval(pollOnce, 2000);
      }
    } else {
      stopPoll();
    }
  }

  async function pollOnce() {
    try {
      const data = await getAisleMappingStatus();
      applyStatus(data);
    } catch {
      // Transient network hiccup mid-job — keep polling rather than surfacing an error banner.
    }
  }

  async function load() {
    setError("");
    try {
      const data = await getAisleMappingStatus();
      // Seed the "was running" flag from this first read so mount never fires a stale toast.
      wasRunningRef.current = isAisleJobActive(data.job);
      applyStatus(data);
    } catch (err) {
      setError(errorMessage(err, t.adminUnableToLoadAisleStatus));
    }
  }

  useEffect(() => {
    load();
    return () => {
      stopPoll();
      if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStart(force: boolean) {
    setError("");
    setStarting(true);
    try {
      const data = await startAisleMapping({ force });
      applyStatus(data);
    } catch (err) {
      setError(errorMessage(err, t.adminUnableToStartAisleMapping));
    } finally {
      setStarting(false);
    }
  }

  function handlePrimaryClick() {
    if (!status) return;
    if (status.missing > 0) {
      handleStart(false);
    } else {
      setConfirmRemap(true);
    }
  }

  async function handleStop() {
    setStopping(true);
    try {
      const data = await stopAisleMapping();
      applyStatus(data);
    } catch (err) {
      setError(errorMessage(err, t.adminUnableToStopAisleMapping));
    } finally {
      setStopping(false);
    }
  }

  const job = status?.job;
  const isRunning = isAisleJobActive(job);
  const primaryLabel = isRunning
    ? t.adminMappingAislesButton
    : (status?.missing ?? 0) > 0
      ? t.adminMapAislesButton
      : t.adminRemapAislesButton;

  return (
    <div
      className="rounded-2xl p-4 mb-4"
      style={{ backgroundColor: "var(--tm-surface)", border: "1px solid var(--tm-border-i)" }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accent}1A` }}
        >
          <Store size={16} color={accent} />
        </span>
        <p className="text-sm font-bold" style={{ color: "var(--tm-text)" }}>{t.adminMapAislesTitle}</p>
      </div>

      {status && (
        <div className="mb-3">
          <p className="text-xs" style={{ color: "var(--tm-text-2)" }}>
            {t.adminMappedStat(status.mapped, status.total)}
          </p>
          {status.missing > 0 && (
            <p className="text-xs mt-0.5" style={{ color: "var(--tm-text-3)" }}>
              {t.adminMissingStat(status.missing)}
            </p>
          )}
        </div>
      )}

      {isRunning && (
        <div className="mb-3">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--tm-subtle)" }}>
            {job && job.total > 0 ? (
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((job.processed / job.total) * 100))}%`, backgroundColor: accent }}
              />
            ) : (
              <div className="h-full rounded-full animate-pulse" style={{ width: "40%", backgroundColor: accent }} />
            )}
          </div>
          {job && (
            <p className="text-[11px] mt-1" style={{ color: "var(--tm-text-3)" }}>
              {t.adminProcessedStat(job.processed, job.total)}
            </p>
          )}
        </div>
      )}

      {(job?.status === "failed" || job?.status === "cancelled") && job.error_message && (
        <p className="text-xs mb-3" style={{ color: "#DC2626" }}>{job.error_message}</p>
      )}

      {error && <p className="text-xs mb-3" style={{ color: "#DC2626" }}>{error}</p>}

      {toast && (
        <p className="text-xs mb-3 font-medium" style={{ color: toastIsError ? "#DC2626" : accent }}>{toast}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handlePrimaryClick}
          disabled={isRunning || starting || !status}
          className="flex-1 h-9 rounded-lg text-xs font-bold text-white disabled:opacity-60"
          style={{ backgroundColor: accent }}
        >
          {primaryLabel}
        </button>
        <button
          type="button"
          onClick={handleStop}
          disabled={stopping}
          className="h-9 px-4 rounded-lg text-xs font-bold border disabled:opacity-40"
          style={{ borderColor: "#DC262640", color: "#DC2626", backgroundColor: dark ? "#2A1416" : "#FEF2F2" }}
        >
          {t.adminStopButton}
        </button>
      </div>

      {confirmRemap && (
        <ConfirmDialog
          title={t.adminRemapConfirmTitle}
          message={t.adminRemapConfirmMessage}
          confirmLabel={t.adminRemapConfirmButton}
          confirmColor="#DC2626"
          onConfirm={() => {
            setConfirmRemap(false);
            handleStart(true);
          }}
          onCancel={() => setConfirmRemap(false)}
        />
      )}
    </div>
  );
}
