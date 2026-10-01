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
