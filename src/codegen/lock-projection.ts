/**
 * Truthful lock lineage projection (S061).
 *
 * Builds the final lock from the *effective* per-target dispositions, not from
 * the incoming registry version alone. A preserved customized target keeps its
 * legitimate prior base, an adopted target advances only its valid lineage, and
 * a retired owner's records are detached. A transition that changes only lock
 * metadata (items/requested/version) without changing any content is recorded
 * explicitly as `metadataOnly` so a caller can publish it without a content
 * write.
 *
 * The projection is pure data; the caller validates it through `parseKitLock`
 * (schema and index checks) before publication planning.
 */
import type {
  LockCssBlock,
  LockFileRecord,
  LockIntegration,
  LockItem,
  KitLock,
} from "./lock.js";
import type { RequestProjection } from "../registry/projection.js";
import type { SourcePlan } from "./source-plan.js";
import type { RetirementRecord } from "./retire.js";

export interface LockSourceMeta {
  readonly owner: string;
  readonly cohort: string;
  readonly version: string;
}

export interface LockCssOutcome {
  readonly path: string;
  readonly blocks: readonly {
    readonly id: string;
    readonly owner: string;
    readonly cohort: string;
    readonly version: string;
    readonly baseHash: string;
  }[];
}

export interface LockProjectionInput {
  readonly items: readonly LockItem[];
  readonly desired: RequestProjection;
  readonly lock: KitLock | null;
  readonly sourcePlan: SourcePlan;
  readonly sourceMeta: ReadonlyMap<string, LockSourceMeta>;
  readonly cssOutcomes: readonly LockCssOutcome[];
  readonly retirement?: readonly RetirementRecord[];
  readonly integrations?: readonly LockIntegration[];
  readonly registryVersion: string;
  readonly registryHash: string;
  readonly configHash: string;
  readonly toolVersion: string;
}

export interface LockProjection {
  readonly lock: KitLock;
  /** True when no content changed but lock metadata must still be published. */
  readonly metadataOnly: boolean;
}

function byPath(left: { path: string }, right: { path: string }): number {
  return left.path < right.path ? -1 : left.path > right.path ? 1 : 0;
}

/**
 * Project the effective lock. A target that was customized keeps its recorded
 * base; a create/update adopts the candidate base; a no_change keeps its
 * existing record. Records for owners that left the closure are dropped.
 */
export function buildLockProjection(
  input: LockProjectionInput,
): LockProjection {
  const retiredPaths = new Set(
    (input.retirement ?? []).map((record) => record.path),
  );
  const existingFiles = new Map(
    (input.lock?.files ?? []).map((record) => [record.path, record]),
  );
  const retainedOwners = new Set(input.items.map((item) => item.id));

  const files: LockFileRecord[] = [];
  let contentChanged = false;
  for (const change of input.sourcePlan.changes) {
    if (retiredPaths.has(change.path)) continue;
    const meta = input.sourceMeta.get(change.path);
    if (meta === undefined) continue;
    const existing = existingFiles.get(change.path);
    if (change.disposition === "customized") {
      if (existing !== undefined) files.push(existing);
      continue;
    }
    if (change.disposition === "no_change") {
      if (existing !== undefined) files.push(existing);
      continue;
    }
    // create / update: adopt the candidate bytes as the new base.
    contentChanged = true;
    files.push({
      path: change.path,
      owner: meta.owner,
      baseHash: change.candidateHash as string,
      itemVersion: meta.version,
      cohort: meta.cohort,
    });
  }
  for (const record of input.lock?.files ?? []) {
    if (retiredPaths.has(record.path)) continue;
    if (!retainedOwners.has(record.owner)) continue;
    if (files.some((file) => file.path === record.path)) continue;
    files.push(record);
  }

  const existingCss = new Map(
    (input.lock?.cssBlocks ?? []).map((block) => [
      `${block.path}#${block.blockId}`,
      block,
    ]),
  );
  const cssBlocks: LockCssBlock[] = [];
  for (const outcome of input.cssOutcomes) {
    for (const block of outcome.blocks) {
      const key = `${outcome.path}#${block.id}`;
      const prior = existingCss.get(key);
      if (prior !== undefined && prior.baseHash === block.baseHash) {
        cssBlocks.push(prior);
        continue;
      }
      contentChanged = true;
      cssBlocks.push({
        path: outcome.path,
        owner: block.owner,
        blockId: block.id,
        baseHash: block.baseHash,
        itemVersion: block.version,
        cohort: block.cohort,
      });
    }
  }
  for (const record of input.lock?.cssBlocks ?? []) {
    if (retiredPaths.has(record.path)) continue;
    if (!retainedOwners.has(record.owner)) continue;
    if (
      cssBlocks.some(
        (block) =>
          block.path === record.path && block.blockId === record.blockId,
      )
    ) {
      continue;
    }
    cssBlocks.push(record);
  }

  if ((input.retirement ?? []).some((record) => record.action === "delete")) {
    contentChanged = true;
  }

  const lock: KitLock = {
    schemaVersion: 1,
    toolVersion: input.toolVersion,
    registryVersion: input.registryVersion,
    registryHash: input.registryHash,
    configHash: input.configHash,
    requested: input.desired.requested,
    items: [...input.items].sort((left, right) =>
      left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
    ),
    files: files.sort(byPath),
    cssBlocks: cssBlocks.sort(
      (left, right) =>
        byPath(left, right) ||
        (left.blockId < right.blockId
          ? -1
          : left.blockId > right.blockId
            ? 1
            : 0),
    ),
    integrations: [...(input.integrations ?? [])].sort(
      (left, right) =>
        byPath(left, right) ||
        (left.kind < right.kind ? -1 : left.kind > right.kind ? 1 : 0),
    ),
  };

  return { lock, metadataOnly: !contentChanged };
}
