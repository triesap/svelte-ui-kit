/**
 * Managed stylesheet composition (S050).
 *
 * Updates managed block bodies in place and appends missing blocks in a
 * deterministic order (the `tokens` foundation layer first, then the remaining
 * blocks by id). Unmanaged text — leading, trailing and interleaved application
 * CSS — is copied byte-for-byte; no formatter pass runs. Composition is
 * byte-idempotent: re-applying the same desired bodies produces identical
 * output.
 */
import { fail, ok, type ModelResult } from "../registry/errors.js";
import { parseManagedCss } from "./css-parse.js";

export interface ManagedBlockInput {
  readonly id: string;
  /** Exact body to place between the markers. */
  readonly body: string;
}

/** Render one managed block with its reserved markers and no added bytes. */
export function renderManagedBlock(id: string, body: string): string {
  return `/* svelte-ui-kit:start ${id} */${body}/* svelte-ui-kit:end ${id} */`;
}

/** Canonical order: the foundation `tokens` block precedes dependents. */
export function compareManagedBlockIds(left: string, right: string): number {
  if (left === right) return 0;
  if (left === "tokens") return -1;
  if (right === "tokens") return 1;
  return left < right ? -1 : 1;
}

/**
 * Compose `existing` with the desired block bodies. Existing blocks keep their
 * position and unmanaged neighbours; a desired block that is not present is
 * appended in canonical order.
 */
export function composeManagedCss(
  existing: string,
  desired: readonly ManagedBlockInput[],
): ModelResult<string> {
  const parsed = parseManagedCss(existing);
  if (!parsed.ok) return parsed;
  const managed = parsed.value;
  const desiredById = new Map(desired.map((block) => [block.id, block.body]));
  const existingIds = new Set(managed.blocks.map((block) => block.id));

  let output = "";
  for (let index = 0; index < managed.blocks.length; index += 1) {
    const region = managed.unmanaged[index];
    const block = managed.blocks[index];
    if (region === undefined || block === undefined) {
      return fail([
        {
          code: "CSS_COMPOSE_INCONSISTENT",
          message: "the parsed managed regions are internally inconsistent",
        },
      ]);
    }
    output += existing.slice(region.start, region.end);
    const body =
      desiredById.get(block.id) ??
      existing.slice(block.contentStart, block.contentEnd);
    output += renderManagedBlock(block.id, body);
  }
  const trailing = managed.unmanaged[managed.blocks.length];
  if (trailing !== undefined) {
    output += existing.slice(trailing.start, trailing.end);
  }

  const newIds = desired
    .map((block) => block.id)
    .filter((id) => !existingIds.has(id))
    .sort(compareManagedBlockIds);
  for (const id of newIds) {
    output += renderManagedBlock(id, desiredById.get(id) as string);
  }
  return ok(output);
}
