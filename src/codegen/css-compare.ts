/**
 * CSS block-level three-way comparison (S049).
 *
 * Managed blocks are compared individually with the same frozen ownership
 * matrix used for sources, so editing one block never marks an unrelated block
 * modified and the whole stylesheet is never hashed as a single owned asset.
 * A block with an owner whose recorded base matches the local body is clean; a
 * locally edited block is `customized`; a block that changed on both sides is a
 * `conflict`.
 */
import { classifyOwnershipHashes, hashBytes } from "./compare.js";
import type { OwnershipDisposition } from "./ownership-policy.js";

export interface CssBlockObservation {
  readonly id: string;
  /** Recorded owner item, or `null` for an unowned/untracked block. */
  readonly owner: string | null;
  /** Recorded base hash, or `null` when untracked or base-missing. */
  readonly baseHash: string | null;
  /** Local block body now, or `null` when the block is not present. */
  readonly localBody: string | null;
  /** Incoming block body from the registry, or `null`. */
  readonly incomingBody: string | null;
}

export interface CssBlockClassification {
  readonly id: string;
  readonly owner: string | null;
  readonly disposition: OwnershipDisposition;
  readonly baseHash: string | null;
  readonly localHash: string | null;
  readonly incomingHash: string | null;
}

/** Classify each observed managed CSS block independently. */
export function classifyCssBlocks(
  observations: readonly CssBlockObservation[],
): readonly CssBlockClassification[] {
  return observations
    .map((block) => {
      const localHash = hashBytes(
        block.localBody === null
          ? null
          : new TextEncoder().encode(block.localBody),
      );
      const incomingHash = hashBytes(
        block.incomingBody === null
          ? null
          : new TextEncoder().encode(block.incomingBody),
      );
      return {
        id: block.id,
        owner: block.owner,
        disposition: classifyOwnershipHashes({
          tracked: block.owner !== null,
          baseHash: block.baseHash,
          localHash,
          incomingHash,
        }),
        baseHash: block.baseHash,
        localHash,
        incomingHash,
      };
    })
    .sort((left, right) =>
      left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
    );
}
