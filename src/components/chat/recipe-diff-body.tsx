"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { useStrings } from "@/lib/use-strings";
import {
  hunkIsBlank,
  hunkIsHighlight,
  stripRecipeDecor,
  type RecipeDiffHunk,
} from "@/lib/recipe-version-diff";

export function RecipeDiffBody({ hunks }: { hunks: RecipeDiffHunk[] }) {
  const blocks = groupHunks(hunks);
  return (
    <div className="space-y-0.5">
      {blocks.map((block, i) =>
        block.kind === "markdown" ? (
          <ReactMarkdown
            key={`md-${i}`}
            components={markdownComponents}
          >
            {block.text || " "}
          </ReactMarkdown>
        ) : (
          <DiffLine key={`h-${i}`} hunk={block.hunk} />
        ),
      )}
    </div>
  );
}

type DiffBlock =
  | { kind: "markdown"; text: string }
  | { kind: "hunk"; hunk: RecipeDiffHunk };

function groupHunks(hunks: RecipeDiffHunk[]): DiffBlock[] {
  const blocks: DiffBlock[] = [];
  let md: string[] = [];
  const flush = () => {
    if (md.length === 0) return;
    blocks.push({ kind: "markdown", text: md.join("\n") });
    md = [];
  };
  for (const hunk of hunks) {
    if (hunkIsHighlight(hunk)) {
      flush();
      blocks.push({ kind: "hunk", hunk });
    } else {
      md.push(hunk.text);
    }
  }
  flush();
  return blocks;
}

function DiffLine({ hunk }: { hunk: RecipeDiffHunk }) {
  const t = useStrings();
  const [open, setOpen] = useState(false);

  if (hunkIsBlank(hunk)) return <div className="h-2" />;

  const colors = highlightStyle(hunk.op);
  const tooltip = tooltipMessage(t, hunk);
  const title = dialogTitle(t, hunk);

  return (
    <>
      <button
        type="button"
        title={tooltip}
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-md px-2 py-1 my-0.5 cursor-pointer"
        style={{
          backgroundColor: colors.bg,
          borderLeft: `3px solid ${colors.border}`,
          textDecoration: hunk.op === "removed" ? "line-through" : undefined,
          opacity: hunk.op === "removed" ? 0.75 : 1,
        }}
      >
        <RecipeLineText text={hunk.text} />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-4"
            style={{ backgroundColor: "var(--tm-surface, #fff)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="text-base font-bold mb-3"
              style={{ color: "var(--tm-text, #0F172A)" }}
            >
              {title}
            </h3>
            {hunk.op !== "added" && (
              <div className="mb-3">
                <p className="text-xs font-bold mb-1" style={{ color: "#6B7280" }}>
                  {t.recipeDiffPrevious}
                </p>
                <p
                  className="text-[13px] leading-relaxed"
                  style={{ color: "var(--tm-text, #0F172A)" }}
                >
                  {stripRecipeDecor(
                    hunk.op === "removed" ? hunk.text : (hunk.previous ?? ""),
                  )}
                </p>
              </div>
            )}
            {hunk.op !== "removed" && (
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: "#059669" }}>
                  {t.recipeDiffCurrent}
                </p>
                <p
                  className="text-[13px] leading-relaxed"
                  style={{ color: "var(--tm-text, #0F172A)" }}
                >
                  {stripRecipeDecor(hunk.text)}
                </p>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm font-semibold px-3 py-1.5 rounded-lg"
                style={{ color: "#059669", backgroundColor: "rgba(5,150,105,0.12)" }}
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function RecipeLineText({ text }: { text: string }) {
  const bullet = text.match(/^(\s*)[-*•]\s+(.*)$/);
  const numbered = text.match(/^(\s*)(\d+)\.\s+(.*)$/);
  let body = text;
  let marker: ReactNode = null;
  if (bullet) {
    body = bullet[2];
    marker = (
      <span
        className="mt-[7px] w-[5px] h-[5px] rounded-full shrink-0"
        style={{ backgroundColor: "currentColor" }}
      />
    );
  } else if (numbered) {
    body = numbered[3];
    marker = <span className="font-semibold shrink-0">{numbered[2]}.</span>;
  }
  const inner = <span>{renderBold(body)}</span>;
  if (!marker) return inner;
  return (
    <span className="flex items-start gap-2">
      {marker}
      {inner}
    </span>
  );
}

function renderBold(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    parts.push(<strong key={key++}>{match[1]}</strong>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-2 last:mb-0">{children}</p>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
};

function highlightStyle(op: RecipeDiffHunk["op"]) {
  switch (op) {
    case "added":
      return { bg: "rgba(5,150,105,0.16)", border: "#059669" };
    case "removed":
      return { bg: "rgba(239,68,68,0.14)", border: "#EF4444" };
    case "changed":
      return { bg: "rgba(245,158,11,0.18)", border: "#D97706" };
    default:
      return { bg: "transparent", border: "transparent" };
  }
}

function tooltipMessage(
  t: ReturnType<typeof useStrings>,
  hunk: RecipeDiffHunk,
): string {
  if (hunk.op === "added") return t.recipeDiffAdded;
  if (hunk.op === "removed") {
    return `${t.recipeDiffRemoved}: ${stripRecipeDecor(hunk.text)}`;
  }
  if (hunk.op === "changed") {
    return `${t.recipeDiffPrevious}: ${stripRecipeDecor(hunk.previous ?? "")}`;
  }
  return "";
}

function dialogTitle(
  t: ReturnType<typeof useStrings>,
  hunk: RecipeDiffHunk,
): string {
  if (hunk.op === "added") return t.recipeDiffAdded;
  if (hunk.op === "removed") return t.recipeDiffRemoved;
  return t.recipeDiffChanged;
}
