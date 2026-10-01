/**
 * Frozen ownership disposition matrix (S043).
 *
 * A pure decision table over tracked base (B), local (L) and incoming (I)
 * bytes. It is the single authority `src/codegen/compare.ts` uses, so the
 * policy cannot drift between the specification, fixtures and implementation.
 *
 * Frozen rules (Q08):
 *
 * - Tracked with a missing local target is a visible conflict: absence never
 *   becomes a baseline and no silent restoration occurs.
 * - A tracked missing base has no legitimate upstream content to compare, so
 *   equal local/incoming is still `no_change` (L = I precedence) and otherwise
 *   the target is a conflict.
 * - L = I is `no_change` and precedes the conflict classification.
 * - L = B is a safe incoming `update`.
 * - I = B is `customized`: the local edit is preserved.
 * - Anything else is a `conflict`.
 * - An existing untracked target is always `untracked_conflict`, even when its
 *   bytes equal incoming: untracked content is application-owned and confers no
 *   adoption or deletion rights.
 * - A new absent untracked target is `create`.
 */
export type OwnershipDisposition =
  | "create"
  | "no_change"
  | "update"
  | "customized"
  | "conflict"
  | "untracked_conflict";

export interface OwnershipInput {
  /** Whether the lock records the target as owned. */
  readonly tracked: boolean;
  /** Base upstream bytes last accepted, or `null` when absent. */
  readonly base: Uint8Array | null;
  /** Local bytes now, or `null` when the target is missing. */
  readonly local: Uint8Array | null;
  /** Incoming bytes from the registry, or `null` when the registry no longer provides it. */
  readonly incoming: Uint8Array | null;
}

export function bytesEqual(
  left: Uint8Array | null,
  right: Uint8Array | null,
): boolean {
  if (left === null || right === null) return left === right;
  if (left.byteLength !== right.byteLength) return false;
  for (let index = 0; index < left.byteLength; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

/** Classify one target against the frozen ownership matrix. */
export function classifyOwnership(input: OwnershipInput): OwnershipDisposition {
  const { tracked, base, local, incoming } = input;
  if (!tracked) {
    if (local === null) return incoming === null ? "no_change" : "create";
    return "untracked_conflict";
  }
  // Tracked: a missing local target is a visible conflict before equality.
  if (local === null) return "conflict";
  // L = I precedence, including when a tracked base is missing.
  if (bytesEqual(local, incoming)) return "no_change";
  if (incoming === null) return "conflict";
  if (bytesEqual(local, base)) return "update";
  if (bytesEqual(incoming, base)) return "customized";
  return "conflict";
}
