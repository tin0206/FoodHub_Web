export type RecipeDiffOp = "equal" | "added" | "removed" | "changed";

export type RecipeDiffHunk = {
  op: RecipeDiffOp;
  text: string;
  previous?: string;
};

export type ChatTextRef = {
  isUser: boolean;
  text: string;
};

/** First line of a backend-modified recipe: `**🍽️ {title} (Modified)**` */
export const modifiedRecipeFirstLinePattern =
  /^\*\*\s*(.+?)\s+\((?:Modified|Đã chỉnh sửa)\)\s*\*\*\s*$/;

const ingredientHeaderPattern =
  /(?:^#{1,4}[^\n]*(?:ingredient|nguy[eê]n\s*li[eê]u)|\*\*[^*\n]*(?:ingredient|nguy[eê]n\s*li[eê]u)[^*\n]*\*\*)/im;

const stepsHeaderPattern =
  /(?:^#{1,4}[^\n]*(?:(?:cooking\s+)?steps?|instructions?|directions?|c[aá]ch\s+l[aà]m)|\*\*[^*\n]*(?:(?:cooking\s+)?steps?|instructions?|directions?|c[aá]ch\s+l[aà]m)[^*\n]*\*\*)/im;

const sectionTitlePattern =
  /ingredient|nguy[eê]n\s*li[eê]u|(?:cooking\s+)?steps?|instructions?|directions?|c[aá]ch\s+l[aà]m|nutrition|dinh\s*d[uư][ơỡ]ng/i;

export function hunkIsBlank(hunk: RecipeDiffHunk): boolean {
  return hunk.text.trim() === "";
}

export function hunkIsHighlight(hunk: RecipeDiffHunk): boolean {
  return (
    !hunkIsBlank(hunk) &&
    (hunk.op === "added" || hunk.op === "removed" || hunk.op === "changed")
  );
}

export function isDetailRecipeMarkdown(text: string): boolean {
  return ingredientHeaderPattern.test(text) && stepsHeaderPattern.test(text);
}

export function firstNonEmptyLine(text: string): string {
  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    const trimmed = line.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

export function stripRecipeDecor(line: string): string {
  let s = line.trim().replace(/\*\*/g, "").replace(/\uFE0F/g, "");
  s = s.replace(/^[^\p{L}\p{N}]+/u, "");
  s = s.replace(/\s+\((?:Modified|Đã chỉnh sửa)\)\s*$/, "");
  return s.replace(/\s+/g, " ").trim();
}

export function parseModifiedRecipeTitle(text: string): string | null {
  const match = firstNonEmptyLine(text).match(modifiedRecipeFirstLinePattern);
  const title = match?.[1];
  if (!title) return null;
  const cleaned = stripRecipeDecor(title);
  return cleaned || null;
}

export function isModifiedRecipeMarkdown(text: string): boolean {
  return parseModifiedRecipeTitle(text) != null;
}

export function canonicalRecipeTitle(raw: string): string {
  return stripRecipeDecor(raw).toLowerCase();
}

export function extractComparableRecipeTitle(text: string): string {
  const modified = parseModifiedRecipeTitle(text);
  if (modified) return modified;
  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    const cleaned = stripRecipeDecor(line);
    if (!cleaned) continue;
    if (sectionTitlePattern.test(cleaned)) continue;
    return cleaned;
  }
  return "";
}

export function recipeTitlesMatch(a: string, b: string): boolean {
  const left = canonicalRecipeTitle(a);
  const right = canonicalRecipeTitle(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.length >= 8 && right.length >= 8) {
    return left.includes(right) || right.includes(left);
  }
  return false;
}

export function isComparableRecipeMarkdown(
  text: string,
  expectedTitle: string,
): boolean {
  if (!recipeTitlesMatch(extractComparableRecipeTitle(text), expectedTitle)) {
    return false;
  }
  return isModifiedRecipeMarkdown(text) || isDetailRecipeMarkdown(text);
}

export function findPreviousRecipeMarkdown(input: {
  messages: ChatTextRef[];
  currentIndex: number;
}): string | null {
  const { messages, currentIndex } = input;
  if (currentIndex < 0 || currentIndex >= messages.length) return null;
  const current = messages[currentIndex];
  if (current.isUser) return null;
  const title = parseModifiedRecipeTitle(current.text);
  if (!title) return null;

  for (let i = currentIndex - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.isUser) continue;
    if (isComparableRecipeMarkdown(msg.text, title)) return msg.text;
  }
  return null;
}

function isSectionHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return /^#{1,4}\s+/.test(trimmed) || /^\*\*[^*]+\*\*\s*:?\s*$/.test(trimmed);
}

function isIngredientHeader(line: string): boolean {
  return ingredientHeaderPattern.test(line.trim());
}

function splitIngredientSection(text: string): {
  before: string[];
  ingredients: string[];
  after: string[];
} {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let start = -1;
  let end = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (isIngredientHeader(lines[i])) {
      start = i;
      break;
    }
  }
  if (start < 0) {
    return { before: lines, ingredients: [], after: [] };
  }
  for (let i = start + 1; i < lines.length; i++) {
    if (isSectionHeading(lines[i]) && !isIngredientHeader(lines[i])) {
      end = i;
      break;
    }
  }
  return {
    before: lines.slice(0, start + 1),
    ingredients: lines.slice(start + 1, end),
    after: lines.slice(end),
  };
}

function diffLineLists(oldLines: string[], newLines: string[]): RecipeDiffHunk[] {
  const oldNorm = oldLines.map(stripRecipeDecor);
  const newNorm = newLines.map(stripRecipeDecor);
  const n = oldLines.length;
  const m = newLines.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array<number>(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        oldNorm[i] === newNorm[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const raw: RecipeDiffHunk[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (oldNorm[i] === newNorm[j]) {
      raw.push({ op: "equal", text: newLines[j] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      raw.push({ op: "removed", text: oldLines[i] });
      i++;
    } else {
      raw.push({ op: "added", text: newLines[j] });
      j++;
    }
  }
  while (i < n) raw.push({ op: "removed", text: oldLines[i++] });
  while (j < m) raw.push({ op: "added", text: newLines[j++] });

  const out: RecipeDiffHunk[] = [];
  for (let k = 0; k < raw.length; k++) {
    const a = raw[k];
    const b = raw[k + 1];
    if (b && a.op === "removed" && b.op === "added") {
      out.push({ op: "changed", text: b.text, previous: a.text });
      k++;
      continue;
    }
    if (b && a.op === "added" && b.op === "removed") {
      out.push({ op: "changed", text: a.text, previous: b.text });
      k++;
      continue;
    }
    out.push(a);
  }
  return out;
}

export function diffRecipeLines(
  previous: string,
  current: string,
): RecipeDiffHunk[] {
  const prev = splitIngredientSection(previous);
  const curr = splitIngredientSection(current);
  return [
    ...curr.before.map((text) => ({ op: "equal" as const, text })),
    ...diffLineLists(prev.ingredients, curr.ingredients),
    ...curr.after.map((text) => ({ op: "equal" as const, text })),
  ];
}

export function recipeDiffHasVisibleChanges(hunks: RecipeDiffHunk[]): boolean {
  return hunks.some(hunkIsHighlight);
}
