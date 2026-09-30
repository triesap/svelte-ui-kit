/**
 * Explicit requested item sets (S015).
 *
 * The desired configuration stores only *explicit root requests*. Dependency
 * closure is resolved elsewhere and never written back into the request set.
 * Normalization is deterministic and idempotent:
 *
 * - every entry must be a lowercase kebab-case item ID;
 * - exact duplicates collapse to one entry;
 * - the result is sorted by UTF-16 code unit (locale independent).
 *
 * Repeated `add` therefore leaves an already-satisfied set unchanged, and
 * `transitiveRequests` exposes the closure items an explicit request pulls in
 * without ever promoting them to explicit requests.
 */
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";

/** Lowercase kebab-case registry item identifier. */
export const ITEM_ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export type ItemId = string;

export function isItemId(value: unknown): value is ItemId {
  return typeof value === "string" && ITEM_ID_PATTERN.test(value);
}

/** Locale-independent, code-unit ordering for deterministic output. */
export function compareItemIds(left: ItemId, right: ItemId): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/**
 * Validate, de-duplicate and sort explicit request IDs. Never adds a
 * dependency; an invalid ID yields a typed `REQUEST_ID_INVALID` issue.
 */
export function normalizeRequested(
  values: readonly unknown[],
): ModelResult<readonly ItemId[]> {
  const issues = [];
  const ids: ItemId[] = [];
  for (const [index, value] of values.entries()) {
    if (!isItemId(value)) {
      issues.push(
        issue(
          "REQUEST_ID_INVALID",
          `requested[${index}] must be a lowercase kebab-case item id, received ${JSON.stringify(value)}`,
          "requested",
        ),
      );
      continue;
    }
    ids.push(value);
  }
  if (issues.length > 0) return fail(issues);
  return ok([...new Set(ids)].sort(compareItemIds));
}

/** Add one explicit request idempotently. */
export function addRequest(
  explicit: readonly ItemId[],
  id: ItemId,
): ModelResult<readonly ItemId[]> {
  return normalizeRequested([...explicit, id]);
}

/**
 * Items reachable only through dependency resolution: closure members that are
 * not themselves explicit requests. This keeps the requested/transitive
 * distinction visible without mutating the explicit set.
 */
export function transitiveRequests(
  explicit: readonly ItemId[],
  closure: readonly ItemId[],
): readonly ItemId[] {
  const explicitSet = new Set<ItemId>(explicit);
  return [...new Set(closure)]
    .filter((id) => !explicitSet.has(id))
    .sort(compareItemIds);
}
