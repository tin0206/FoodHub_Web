"use client";

import { FormEvent, Ref, useState } from "react";
import { Send } from "lucide-react";

export function ChatComposer({
  disabled,
  placeholder,
  onSend,
  extraCanSend = false,
  inputRef,
}: {
  disabled: boolean;
  placeholder: string;
  onSend: (text: string) => void;
  extraCanSend?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const [value, setValue] = useState("");
  const canSend = !disabled && (value.trim().length > 0 || extraCanSend);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (disabled) return;
    const text = value.trim();
    if (!text && !extraCanSend) return;
    setValue("");
    onSend(text);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 h-11 rounded-full border px-3"
      style={{
        borderColor: "var(--tm-border-i, #D1D5DB)",
        backgroundColor: "var(--tm-subtle, #F3F4F6)",
      }}
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent text-sm outline-none"
        style={{ color: "var(--tm-text, #0F172A)" }}
      />
      <button
        type="submit"
        disabled={!canSend}
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40"
        style={{ backgroundColor: "#059669" }}
        aria-label="Send"
      >
        <Send size={14} color="white" />
      </button>
    </form>
  );
}
