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
import { parseManagedCss, type CssRegion } from "./css-parse.js";

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
 * its body is unchanged, so a satisfied composition is byte-identical.
 *
 * The unmanaged regions are the fixed skeleton: they are emitted exactly once,
 * in their original document order and byte content, and only the owned spans
 * are reordered. A newly inserted block consumes no application region, so the
 * leading region stays first, the trailing region stays last, and no
 * application rule is duplicated or moved. When the stylesheet has no managed
 * block at all, its single unmanaged region is the leading text and there is no
 * separate trailing region.
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

  const observed = managed.blocks.length;
  const regions = managed.unmanaged;
  if (regions.length !== observed + 1) {
    return fail([
      {
        code: "CSS_COMPOSE_INCONSISTENT",
        message: "the parsed managed regions are internally inconsistent",
      },
    ]);
  }

  const ids = [
    ...new Set([...existingById.keys(), ...desiredById.keys()]),
  ].sort(compareManagedBlockIds);

  const regionText = (region: CssRegion | undefined): string =>
    region === undefined ? "" : existing.slice(region.start, region.end);

  // The unmanaged region emitted in output gap `index` (0 .. ids.length). The
  // leading region is always first, the trailing region always last, and the
  // interleaved regions keep their original order. Gaps with no corresponding
  // observed region stay empty, so a newly inserted block never shifts or
  // duplicates application bytes.
  const gap = (index: number): string => {
    if (index === 0) return regionText(regions[0]);
    if (index === ids.length) {
      return observed === 0 ? "" : regionText(regions[observed]);
    }
    if (index <= observed - 1) return regionText(regions[index]);
    return "";
  };

  let output = gap(0);
  ids.forEach((id, position) => {
    const existingEntry = existingById.get(id);
    const desiredBody = desiredById.get(id);
    if (existingEntry === undefined) {
      output += renderManagedBlock(id, desiredBody as string);
    } else {
      const { block } = existingEntry;
      const existingBody = existing.slice(block.contentStart, block.contentEnd);
      if (desiredBody === undefined || desiredBody === existingBody) {
        // Preserve the original marker bytes exactly; a satisfied block must
        // not be canonicalized just because it was re-read.
        output += existing.slice(block.startOffset, block.endOffset);
      } else {
        output += renderManagedBlock(id, desiredBody);
      }
    }
    output += gap(position + 1);
  });
  return ok(output);
}
