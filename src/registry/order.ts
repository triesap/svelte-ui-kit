/**
 * Deterministic registry ordering (S029).
 *
 * Registry projections are byte-stable: the same logical inputs produce the
 * same order regardless of filesystem iteration, manifest declaration order or
 * root insertion order. Ties break by UTF-16 code unit (locale independent).
 *
 * This module only orders registry *metadata* arrays (ids, exports, CSS
 * blocks). It never rewrites application-owned text, so formatting is
 * preserved.
 */
import { compareItemIds } from "../project/requests.js";
import type { ItemExport, ItemStyle } from "./item.js";

/** Canonical token block id; its styles are emitted before dependent styles. */
export const TOKEN_BLOCK_ID = "tokens";

/** De-duplicate and sort ids by code unit. */
export function orderedUnique(ids: readonly string[]): readonly string[] {
  return [...new Set(ids)].sort(compareItemIds);
}

/** Sort registry dependencies deterministically. */
export function orderDependencies(
  dependencies: readonly string[],
): readonly string[] {
  return orderedUnique(dependencies);
}

/**
 * Normalize export order from explicit metadata: by public name, then target,
 * then kind. Array order is metadata, not application text.
 */
export function orderExports(
  exports: readonly ItemExport[],
): readonly ItemExport[] {
  return [...exports].sort((left, right) => {
    if (left.name !== right.name) return left.name < right.name ? -1 : 1;
    if (left.target !== right.target)
      return left.target < right.target ? -1 : 1;
    return left.kind < right.kind ? -1 : left.kind > right.kind ? 1 : 0;
  });
}

/**
 * Normalize managed CSS-block order: the token block first so tokens precede
 * dependent component styles, then by block id, then by target path.
 */
export function orderCssBlocks(
  styles: readonly ItemStyle[],
): readonly ItemStyle[] {
  const rank = (block: ItemStyle): number =>
    block.blockId === TOKEN_BLOCK_ID ? 0 : 1;
  return [...styles].sort((left, right) => {
    const leftRank = rank(left);
    const rightRank = rank(right);
    if (leftRank !== rightRank) return leftRank - rightRank;
    if (left.blockId !== right.blockId) {
      return left.blockId < right.blockId ? -1 : 1;
    }
    if (left.target !== right.target)
      return left.target < right.target ? -1 : 1;
    return left.cohort < right.cohort ? -1 : left.cohort > right.cohort ? 1 : 0;
  });
}

/** A byte-stable textual projection of ordered metadata. */
export function stableProjection<T>(values: readonly T[]): string {
  return JSON.stringify(values);
}
