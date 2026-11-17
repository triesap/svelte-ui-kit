/**
 * Read-only planning-outcome boundary (and the deterministic plan envelope).
 *
 * `PlanningOutcome` expresses the result of a pure planning pass so
 * orchestration can report and apply it without depending on planning
 * internals. `toPlanningEnvelope` normalizes any planner's writes into a
 * deterministic, content-visible envelope: entries are sorted by logical path
 * and each carries the exact byte length and digest, so a semantic reordering
 * of equivalent inputs is invisible while a real content change is not.
 *
 * This module owns plan data and pure digests/normalizers: importing it performs no
 * planning, no filesystem access and no writer/package-manager work.
 */
import {
  copyIntegrationFields,
  type IntegrationFields,
  type LibraryIntegrationFields,
} from "../project/integration-fields.js";
import type { PlanReadset } from "./authority.js";
import { hashBytes } from "./compare.js";
import { canonicalContentHash, sha256Hex } from "./digest.js";
import type { BarrelExportAuthority } from "./exports.js";
import type { KitLock } from "./lock.js";
import type { ExportAuthority } from "./projected-batch.js";
import type { TargetPreimage } from "./revalidate.js";
import type { ProjectSnapshot } from "./snapshot.js";

export interface OriginalPlanningReceipt {
  readonly snapshot: ProjectSnapshot;
  readonly writesDigest: string;
  readonly lockDigest: string;
  readonly publicationDigest: string | null;
}

/** A description alone grants no authority; only private planner registries do. */
export function describePlanning(
  writes: readonly PlanWrite[],
  lock: KitLock,
  snapshot: ProjectSnapshot,
  canonicalLock: string,
): OriginalPlanningReceipt {
  return Object.freeze({
    snapshot,
    writesDigest: planningWritesDigest(writes),
    lockDigest: canonicalContentHash(lock),
    publicationDigest: hashBytes(
      writes.find((write) => write.path === canonicalLock)?.bytes ??
        snapshot.entries.get(canonicalLock)?.bytes ??
        new Uint8Array(),
    ),
  });
}

export function planningWritesDigest(writes: readonly PlanWrite[]): string {
  return canonicalContentHash(
    writes.map((entry) => ({
      path: entry.path,
      operation: entry.operation ?? null,
      digest: hashBytes(entry.bytes),
    })),
  );
}

export interface PlanningOutcome {
  /** Whether the plan would change anything. */
  readonly kind: "no-op" | "apply";
  /** Planned target paths in deterministic order (empty for a no-op). */
  readonly writes: readonly string[];
  /** Human-readable diagnostics produced during planning. */
  readonly diagnostics: readonly string[];
}

/**
 * The content operation a planned write performs. `retire` is an explicit
 * deletion (bytes are empty) that must never be confused with creating an
 * empty file.
 */
export type ChangeOperation = "create" | "update" | "retire";

/** A planned write as produced by a planner. */
export interface PlanWrite {
  readonly path: string;
  readonly bytes: Uint8Array;
  /** Defaults to `create`/`update` when a planner does not state one. */
  readonly operation?: ChangeOperation;
  /**
   * Internal planning evidence carried on the canonical lock publication: the
   * registry-declared export-cohort authority for every managed barrel, sourced
   * from the validated registry closure. Composition consumes this independent
   * authority instead of parsing candidate barrel bytes. It is never a public
   * command flag, registry schema mode or serialized plan envelope field.
   */
  readonly exportAuthority?: readonly BarrelExportAuthority[];
}

export interface PlannedWriteEnvelope {
  readonly path: string;
  readonly operation: ChangeOperation;
  readonly bytesLength: number;
  readonly digest: string;
}

export type PlanCommand = "init" | "add" | "sync";

export interface PlanningEnvelope {
  readonly command: PlanCommand;
  readonly executable: boolean;
  readonly writes: readonly PlannedWriteEnvelope[];
  readonly diagnostics: readonly string[];
}

/**
 * Normalize a planner's writes into a deterministic envelope. Writes are
 * sorted by logical path and each entry exposes the exact byte length and
 * SHA-256 digest, so equivalent logical inputs produce identical envelopes and
 * a hidden content change can never be masked.
 */
export function toPlanningEnvelope(
  command: PlanCommand,
  executable: boolean,
  writes: readonly PlanWrite[],
  diagnostics: readonly string[],
): PlanningEnvelope {
  const entries = [...writes]
    .sort((left, right) =>
      left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
    )
    .map((write) => ({
      path: write.path,
      operation: write.operation ?? "update",
      bytesLength: write.bytes.byteLength,
      digest: hashBytes(write.bytes) as string,
    }));
  return {
    command,
    executable,
    diagnostics: [...diagnostics].sort(),
    writes: entries,
  };
}

export interface ApplyTarget {
  readonly path: string;
  readonly operation: ChangeOperation;
  readonly bytes: Uint8Array;
  /** Exact mode to apply; for updates this should preserve the preimage mode. */
  readonly mode: number;
  readonly preimage: TargetPreimage;
}

export interface ApplyPlanInput {
  /** Process-local proof of the complete original composition. */
  readonly compositionAuthority?: object;
  readonly root: string;
  readonly stateDir: string;
  readonly uiDir: string;
  readonly stylesDir: string;
  readonly layoutFile: string;
  readonly styleEntry?: never;
  readonly configSchema: 1;
  readonly target: "sveltekit" | "astro";
  readonly rootIdentity: string;
  readonly planDigest: string;
  readonly readset: PlanReadset;
  readonly targets: readonly ApplyTarget[];
  readonly lock: {
    readonly bytes: Uint8Array;
    readonly preimage: TargetPreimage;
  };
  /**
   * Additional approved ignore files (for example `.gitignore`) that the
   * guarded plan may update. Defaults to none when omitted.
   */
  readonly ignoreFiles?: readonly string[];
  /**
   * Internal planning authority: the registry-declared export cohort each
   * managed barrel is expected to carry. The guarded boundary re-proves the
   * effective managed region against this set, so a barrel replacement that
   * silently drops a declared export cannot pass on marker presence alone.
   * Never a public command flag or registry contract mode.
   */
  readonly exportAuthority?: readonly ExportAuthority[];
}

export type LibraryApplyPlanInput = Omit<
  ApplyPlanInput,
  "layoutFile" | "styleEntry" | "target" | "configSchema"
> &
  LibraryIntegrationFields;

export type AnyApplyPlanInput = ApplyPlanInput | LibraryApplyPlanInput;

/** A sealed target: bytes are copied and their result digest is bound. */
export interface ValidatedApplyTarget {
  readonly path: string;
  readonly operation: ChangeOperation;
  readonly bytes: Uint8Array;
  readonly mode: number;
  readonly preimage: TargetPreimage;
  /** Digest of the sealed result bytes; re-proven before any write. */
  readonly resultDigest: string;
}

/**
 * The sealed plan data shape. Validation membership remains application-owned and
 * nontransferable: object spread copies enumerable properties, never WeakSet
 * membership, so a forged copy with recomputed digest fields can never confer
 * write authority.
 */
export interface ValidatedApplyPlan {
  readonly root: string;
  readonly stateDir: string;
  readonly uiDir: string;
  readonly stylesDir: string;
  readonly layoutFile: string;
  readonly styleEntry?: never;
  readonly configSchema: 1;
  readonly target: "sveltekit" | "astro";
  readonly rootIdentity: string;
  readonly planDigest: string;
  readonly readset: PlanReadset;
  readonly targets: readonly ValidatedApplyTarget[];
  readonly lock: {
    readonly bytes: Uint8Array;
    readonly digest: string;
    readonly preimage: TargetPreimage;
  };
  readonly ignoreFiles: readonly string[];
  /** Registry-declared export cohorts carried from the original plan. */
  readonly exportAuthority: readonly ExportAuthority[];
}

export type ValidatedLibraryApplyPlan = Omit<
  ValidatedApplyPlan,
  "layoutFile" | "styleEntry" | "target" | "configSchema"
> &
  LibraryIntegrationFields;

export type AnyValidatedApplyPlan =
  ValidatedApplyPlan | ValidatedLibraryApplyPlan;

/**
 * Derive the canonical digest of the complete sealed plan: exact result bytes,
 * modes and operations, original physical preimages and read evidence including
 * absence, and final lock content. A caller supplied digest is never authority.
 */
export function derivePlanDigest(
  input: {
    readonly root: string;
    readonly stateDir: string;
    readonly uiDir: string;
    readonly stylesDir: string;
    readonly rootIdentity: string;
    readonly targets: readonly ValidatedApplyTarget[];
    readonly lock: {
      readonly bytes: Uint8Array;
      readonly preimage: TargetPreimage;
    };
    readonly readset: PlanReadset;
    readonly ignoreFiles?: readonly string[];
    readonly exportAuthority?: readonly ExportAuthority[];
  } & IntegrationFields,
): string {
  return canonicalContentHash({
    root: input.root,
    stateDir: input.stateDir,
    uiDir: input.uiDir,
    stylesDir: input.stylesDir,
    ...copyIntegrationFields(input),
    configSchema: input.configSchema,
    target: input.target,
    rootIdentity: input.rootIdentity,
    ignoreFiles: [...(input.ignoreFiles ?? [])].map((entry) =>
      entry.toLowerCase(),
    ),
    exportAuthority: (input.exportAuthority ?? []).map((entry) => ({
      path: entry.path,
      contract: entry.contract,
      registryVersion: entry.registryVersion,
      registryHash: entry.registryHash,
      declarations: entry.declarations.map((declaration) => ({
        owner: declaration.owner,
        name: declaration.name,
        source: declaration.source,
        target: declaration.target,
        kind: declaration.kind,
      })),
    })),
    targets: input.targets.map((target) => ({
      path: target.path,
      operation: target.operation,
      resultDigest: target.resultDigest,
      mode: target.mode,
      preimage: {
        kind: target.preimage.kind,
        digest: target.preimage.digest,
        mode: target.preimage.mode,
        identity: target.preimage.identity ?? null,
      },
    })),
    lock: {
      digest: sha256Hex(input.lock.bytes),
      preimage: {
        kind: input.lock.preimage.kind,
        digest: input.lock.preimage.digest,
        mode: input.lock.preimage.mode,
        identity: input.lock.preimage.identity ?? null,
      },
    },
    readset: {
      ...(input.readset.installation === undefined
        ? {}
        : { installation: input.readset.installation }),
      catalogDigest: input.readset.catalogDigest ?? null,
      root: {
        device: input.readset.root.device,
        inode: input.readset.root.inode,
        mode: input.readset.root.mode ?? null,
      },
      ancestors: input.readset.ancestors.map((ancestor) => ({
        path: ancestor.path,
        kind: ancestor.kind,
        device: ancestor.device,
        inode: ancestor.inode,
        mode: ancestor.mode ?? null,
      })),
      files: input.readset.files.map((file) => ({
        path: file.path,
        kind: file.kind,
        digest: file.digest,
        mode: file.mode,
        contentDigest:
          file.bytes instanceof Uint8Array ? sha256Hex(file.bytes) : null,
      })),
      installed: (input.readset.installed ?? []).map((entry) => ({
        name: entry.name,
        kind: entry.kind,
        path: entry.path,
        realPath: entry.realPath,
        digest: entry.digest,
        mode: entry.mode,
        device: entry.device,
        inode: entry.inode,
      })),
    },
  });
}
