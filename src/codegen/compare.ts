/**
 * Exact-byte source classification (S044).
 *
 * Applies the frozen ownership matrix (S043) to actual base/local/incoming
 * bytes and records the exact-byte hashes that justify the disposition. It is
 * pure: it reads no filesystem, performs no write and cannot mutate a plan. A
 * `customized` result preserves the recorded base; only a clean `update`
 * advances it.
 */
import { createHash } from "node:crypto";

import {
  classifyOwnership,
  type OwnershipDisposition,
  type OwnershipInput,
} from "./ownership-policy.js";

export interface SourceClassification {
  readonly disposition: OwnershipDisposition;
  /** SHA-256 of the recorded base bytes, or `null` when absent. */
  readonly baseHash: string | null;
  /** SHA-256 of the local bytes, or `null` when absent. */
  readonly localHash: string | null;
  /** SHA-256 of the incoming bytes, or `null` when absent. */
  readonly incomingHash: string | null;
}

/** SHA-256 hex of exact bytes, or `null` when the target is absent. */
export function hashBytes(bytes: Uint8Array | null): string | null {
  return bytes === null
    ? null
    : createHash("sha256").update(bytes).digest("hex");
}

/** Classify one source target and report the exact-byte hashes. */
export function classifySource(input: OwnershipInput): SourceClassification {
  return {
    disposition: classifyOwnership(input),
    baseHash: hashBytes(input.base),
    localHash: hashBytes(input.local),
    incomingHash: hashBytes(input.incoming),
  };
}

/** A hash-only view of the ownership matrix for lock-backed planning. */
export interface HashOwnershipInput {
  readonly tracked: boolean;
  /** Recorded base hash, or `null` when the target has no recorded base. */
  readonly baseHash: string | null;
  /** Local hash, or `null` when the target is missing. */
  readonly localHash: string | null;
  /** Incoming hash, or `null` when the registry no longer provides it. */
  readonly incomingHash: string | null;
}

/**
 * Classify using recorded base hashes rather than base bytes (the lock stores
 * hashes, not base content). The evaluation order matches `classifyOwnership`
 * exactly: a missing tracked local is a conflict, then L = I, then L = B, then
 * I = B.
 */
export function classifyOwnershipHashes(
  input: HashOwnershipInput,
): OwnershipDisposition {
  const { tracked, baseHash, localHash, incomingHash } = input;
  if (!tracked) {
    if (localHash === null) {
      return incomingHash === null ? "no_change" : "create";
    }
    return "untracked_conflict";
  }
  if (localHash === null) return "conflict";
  if (localHash === incomingHash) return "no_change";
  if (incomingHash === null) return "conflict";
  if (localHash === baseHash) return "update";
  if (incomingHash === baseHash) return "customized";
  return "conflict";
}
