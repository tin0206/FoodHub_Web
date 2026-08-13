"use client";

import { useState } from "react";

export function NoteDialog({
  title,
  initialNote,
  accentColor,
  onSave,
  onCancel,
  confirmLabel = "Save Note",
  placeholder = "Write a note…",
}: {
  title: string;
  initialNote: string;
  accentColor: string;
  onSave: (note: string) => void;
  onCancel: () => void;
  confirmLabel?: string;
  placeholder?: string;
}) {
  const [note, setNote] = useState(initialNote);

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
        className="w-full max-w-sm rounded-2xl p-4"
        style={{ backgroundColor: "var(--tm-surface)" }}
      >
        <p className="text-sm font-bold mb-2.5" style={{ color: "var(--tm-text)" }}>
          {title}
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          autoFocus
          placeholder={placeholder}
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
            onClick={() => onSave(note)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: accentColor }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
