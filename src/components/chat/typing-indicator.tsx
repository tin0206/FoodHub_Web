"use client";

export function TypingIndicator({ label }: { label?: string }) {
  return (
    <div className="flex items-start gap-2.5 px-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: "#059669" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
          <path
            fill="white"
            d="m19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25zm0 6l-1.25 2.75L15 19l2.75 1.25L19 23l-1.25-2.75L23 19l-2.75-1.25zm-7.5-5.5L9 4L6.5 9.5L1 12l5.5 2.5L9 20l2.5-5.5L17 12z"
          />
        </svg>
      </div>
      <div
        className="rounded-2xl rounded-tl-md px-3.5 py-3"
        style={{
          backgroundColor: "var(--tm-surface)",
          border: "1px solid var(--tm-border-i)",
        }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block w-1.5 h-1.5 rounded-full animate-bounce"
              style={{
                backgroundColor: "var(--tm-text-3)",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
        {label && (
          <p className="text-[11px]" style={{ color: "var(--tm-text-3)" }}>
            {label}
          </p>
        )}
      </div>
    </div>
  );
}
