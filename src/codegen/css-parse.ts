/**
 * Managed CSS marker parsing (S048).
 *
 * Registry CSS is installed as one managed block per item between reserved
 * comments. A start marker has the form of a CSS comment whose trimmed text is
 * `svelte-ui-kit:start <id>`, and an end marker uses `svelte-ui-kit:end <id>`,
 * where `<id>` is a component/item id.
 * The scanner is stateful: it skips CSS comments and string literals, so a
 * marker-like sequence inside a string or a non-reserved comment never creates
 * or closes a block. Reserved markers must be well formed; duplicate,
 * unmatched, nested and malformed reserved markers are typed failures. Exact
 * byte offsets are retained for both managed bodies and the unmanaged regions,
 * so patching never reformats unrelated text.
 */
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";

export interface CssBlock {
  readonly id: string;
  /** Offset of the slash that begins the start comment. */
  readonly startOffset: number;
  /** Offset just past the start comment's closing delimiter. */
  readonly contentStart: number;
  /** Offset of the slash that begins the end comment. */
  readonly contentEnd: number;
  /** Offset just past the end comment's closing delimiter. */
  readonly endOffset: number;
}

export interface CssRegion {
  readonly start: number;
  readonly end: number;
}

export interface ManagedCss {
  readonly blocks: readonly CssBlock[];
  /** Byte regions outside every managed block, in order. */
  readonly unmanaged: readonly CssRegion[];
}

const RESERVED_PREFIX = "svelte-ui-kit:";
const MARKER = /^svelte-ui-kit:(start|end)(?:\s+([A-Za-z0-9][A-Za-z0-9-]*))?$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9-]*$/;

interface MarkerMatch {
  readonly directive: "start" | "end";
  readonly id: string | null;
}

function parseMarker(comment: string): MarkerMatch | null {
  const trimmed = comment.trim();
  if (!trimmed.startsWith(RESERVED_PREFIX)) return null;
  const match = MARKER.exec(trimmed);
  if (!match) return null;
  return {
    directive: match[1] as "start" | "end",
    id: match[2] ?? null,
  };
}

function isReservedComment(comment: string): boolean {
  return comment.trim().startsWith(RESERVED_PREFIX);
}

/**
 * Parse managed blocks from a stylesheet. Returns every block with its exact
 * offsets and the unmanaged regions, or a typed failure for a malformed,
 * duplicate, unmatched or nested reserved marker.
 */
export function parseManagedCss(text: string): ModelResult<ManagedCss> {
  const issues = [];
  const blocks: CssBlock[] = [];
  const open = new Map<string, { startOffset: number; contentStart: number }>();
  const seenStart = new Set<string>();
  const seenEnd = new Set<string>();
  let index = 0;
  let lastEnd = 0;
  const unmanaged: CssRegion[] = [];

  while (index < text.length) {
    const char = text[index];
    if (char === "/" && text[index + 1] === "*") {
      const close = text.indexOf("*/", index + 2);
      const commentEnd = close === -1 ? text.length : close + 2;
      const comment = text.slice(index + 2, close === -1 ? text.length : close);
      if (close === -1) {
        issues.push(
          issue(
            "CSS_MARKER_MALFORMED",
            "an unterminated comment appears in the stylesheet",
          ),
        );
        return fail(issues);
      }
      const marker = parseMarker(comment);
      if (marker !== null) {
        if (marker.id === null || !ID.test(marker.id)) {
          issues.push(
            issue(
              "CSS_MARKER_MALFORMED",
              `reserved marker ${JSON.stringify(comment.trim())} has no valid block id`,
            ),
          );
          return fail(issues);
        }
        if (marker.directive === "start") {
          if (seenStart.has(marker.id)) {
            issues.push(
              issue(
                "CSS_MARKER_DUPLICATE",
                `reserved marker block ${JSON.stringify(marker.id)} starts more than once`,
              ),
            );
            return fail(issues);
          }
          if (open.size > 0) {
            issues.push(
              issue(
                "CSS_MARKER_NESTED",
                `reserved marker block ${JSON.stringify(marker.id)} starts inside another open block`,
              ),
            );
            return fail(issues);
          }
          seenStart.add(marker.id);
          open.set(marker.id, {
            startOffset: index,
            contentStart: commentEnd,
          });
        } else {
          if (seenEnd.has(marker.id)) {
            issues.push(
              issue(
                "CSS_MARKER_DUPLICATE",
                `reserved marker block ${JSON.stringify(marker.id)} ends more than once`,
              ),
            );
            return fail(issues);
          }
          const started = open.get(marker.id);
          if (started === undefined) {
            issues.push(
              issue(
                "CSS_MARKER_UNMATCHED_END",
                `reserved marker block ${JSON.stringify(marker.id)} ends without a matching start`,
              ),
            );
            return fail(issues);
          }
          seenEnd.add(marker.id);
          open.delete(marker.id);
          unmanaged.push({ start: lastEnd, end: started.startOffset });
          blocks.push({
            id: marker.id,
            startOffset: started.startOffset,
            contentStart: started.contentStart,
            contentEnd: index,
            endOffset: commentEnd,
          });
          lastEnd = commentEnd;
        }
        index = commentEnd;
        continue;
      }
      if (isReservedComment(comment)) {
        issues.push(
          issue(
            "CSS_MARKER_MALFORMED",
            `reserved marker comment ${JSON.stringify(comment.trim())} is not a valid start/end marker`,
          ),
        );
        return fail(issues);
      }
      index = commentEnd;
      continue;
    }
    if (char === '"' || char === "'") {
      index = skipString(text, index, char);
      continue;
    }
    index += 1;
  }

  if (open.size > 0) {
    issues.push(
      issue(
        "CSS_MARKER_UNMATCHED_START",
        `reserved marker block ${JSON.stringify([...open.keys()][0])} is never closed`,
      ),
    );
    return fail(issues);
  }
  unmanaged.push({ start: lastEnd, end: text.length });
  return ok({ blocks, unmanaged });
}

/** Advance past a CSS string literal starting at `index` with quote `quote`. */
function skipString(text: string, index: number, quote: string): number {
  let current = index + 1;
  while (current < text.length) {
    const char = text[current];
    if (char === "\\") {
      current += 2;
      continue;
    }
    if (char === quote) return current + 1;
    if (char === "\n") return current;
    current += 1;
  }
  return current;
}

/** The exact body bytes of each parsed block, keyed by block id. */
export function blockBodies(
  text: string,
  managed: ManagedCss,
): ReadonlyMap<string, string> {
  const bodies = new Map<string, string>();
  for (const block of managed.blocks) {
    bodies.set(block.id, text.slice(block.contentStart, block.contentEnd));
  }
  return bodies;
}
