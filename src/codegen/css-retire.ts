/**
 * CSS block retirement (S051).
 *
 * Retirement removes only a clean obsolete owned block. A customized retired
 * block is retained as application-owned text: its complete marked span stays
 * byte-for-byte and its lock ownership is detached, so a later add sees it as
 * untracked and conflicts rather than silently reacquiring it. Malformed or
 * ambiguous input is nonmutating.
 */
import { fail, ok, type ModelResult } from "../registry/errors.js";
import { parseManagedCss } from "./css-parse.js";
import { renderManagedBlock } from "./css.js";

export interface RetiredCssBlock {
  readonly id: string;
  /** True only when the local body equals the recorded base. */
  readonly clean: boolean;
}

export interface CssRetirementRecord {
  readonly blockId: string;
  readonly action: "removed" | "retained";
  readonly reason: string;
}

export interface CssRetirementResult {
  readonly text: string;
  readonly records: readonly CssRetirementRecord[];
}

/**
 * Retire the named blocks from `existing`. Clean blocks are removed; customized
 * blocks are retained unchanged. Unmanaged regions are copied byte-for-byte.
 */
export function retireManagedCss(
  existing: string,
  retired: readonly RetiredCssBlock[],
): ModelResult<CssRetirementResult> {
  const parsed = parseManagedCss(existing);
  if (!parsed.ok) return parsed;
  const managed = parsed.value;
  const byId = new Map(retired.map((block) => [block.id, block]));
  const records: CssRetirementRecord[] = [];

  let output = "";
  for (let index = 0; index < managed.blocks.length; index += 1) {
    const region = managed.unmanaged[index];
    const block = managed.blocks[index];
    if (region === undefined || block === undefined) {
      return fail([
        {
          code: "CSS_RETIRE_INCONSISTENT",
          message: "the parsed managed regions are internally inconsistent",
        },
      ]);
    }
    output += existing.slice(region.start, region.end);
    const retirement = byId.get(block.id);
    if (retirement === undefined) {
      output += existing.slice(block.startOffset, block.endOffset);
      continue;
    }
    if (retirement.clean) {
      records.push({
        blockId: block.id,
        action: "removed",
        reason: "clean owned block retired",
      });
      continue;
    }
    output += existing.slice(block.startOffset, block.endOffset);
    records.push({
      blockId: block.id,
      action: "retained",
      reason:
        "customized retired block retained as application-owned text; ownership detached",
    });
  }
  const trailing = managed.unmanaged[managed.blocks.length];
  if (trailing !== undefined) {
    output += existing.slice(trailing.start, trailing.end);
  }
  return ok({ text: output, records });
}

/**
 * A marked span retained by retirement, rendered back with its markers so a
 * caller cannot mistake it for a managed block (markers are not ownership).
 */
export function retainedSpan(id: string, body: string): string {
  return renderManagedBlock(id, body);
}
