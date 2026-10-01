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
 * Compose `existing` with the desired block bodies. Managed spans are emitted
 * in canonical order (the `tokens` foundation layer first, then a stable
 * non-token order), so a newly introduced `tokens` block or a previously wrong
 * order is corrected. Each managed block keeps its original marker bytes when
 * its body is unchanged, so a satisfied composition is byte-identical. The
 * leading/trailing unmanaged regions stay at the ends and every interleaved
 * application region is copied byte-for-byte next to its original block.
 */
export function composeManagedCss(
  existing: string,
  desired: readonly ManagedBlockInput[],
): ModelResult<string> {
  const parsed = parseManagedCss(existing);
  if (!parsed.ok) return parsed;
  const managed = parsed.value;
  const desiredById = new Map(desired.map((block) => [block.id, block.body]));
  const existingById = new Map(
    managed.blocks.map((block, index) => [block.id, { block, index }]),
  );

  const leading = managed.unmanaged[0];
  const trailing = managed.unmanaged[managed.blocks.length];
  if (leading === undefined || trailing === undefined) {
    return fail([
      {
        code: "CSS_COMPOSE_INCONSISTENT",
        message: "the parsed managed regions are internally inconsistent",
      },
    ]);
  }

  // The unmanaged region immediately after an existing block, except the final
  // block whose following region is the global trailing region.
  const followingFor = (index: number): string => {
    if (index === managed.blocks.length - 1) return "";
    const region = managed.unmanaged[index + 1];
    return region === undefined ? "" : existing.slice(region.start, region.end);
  };

  const ids = [
    ...new Set([...existingById.keys(), ...desiredById.keys()]),
  ].sort(compareManagedBlockIds);

  let output = existing.slice(leading.start, leading.end);
  for (const id of ids) {
    const existingEntry = existingById.get(id);
    const desiredBody = desiredById.get(id);
    if (existingEntry === undefined) {
      output += renderManagedBlock(id, desiredBody as string);
      continue;
    }
    const { block, index } = existingEntry;
    const existingBody = existing.slice(block.contentStart, block.contentEnd);
    if (desiredBody === undefined || desiredBody === existingBody) {
      // Preserve the original marker bytes exactly; a satisfied block must not
      // be canonicalized just because it was re-read.
      output += existing.slice(block.startOffset, block.endOffset);
    } else {
      output += renderManagedBlock(id, desiredBody);
    }
    output += followingFor(index);
  }
  output += existing.slice(trailing.start, trailing.end);
  return ok(output);
}
