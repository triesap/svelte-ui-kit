/**
 * Compose a planner's writes into a guarded apply plan (RCLD04-R2-1).
 *
 * The pure planners (`planInit`, `planAdd`, `planSync`) reason about one
 * immutable `ProjectSnapshot`. This module is the production link between that
 * original planning authority and the guarded apply boundary: it derives every
 * target preimage, the ancestor chain and the read-only evidence from the
 * *captured* snapshot, never from a later live recapture. A post-planning edit
 * therefore makes the composed plan stale, and the apply boundary refuses it
 * instead of blessing the edited bytes as a new preimage.
 *
 * A write that the snapshot did not observe is a typed `COMPOSE_SNAPSHOT_...`
 * failure: the composition never guesses a preimage for unseen state. The
 * canonical lock write is carved out as the final publication, and its exact
 * bytes and preimage are validated as a first-class part of the plan digest.
 *
 * This function performs read-only observation of the snapshot only; it
 * creates no files and starts no writer.
 */
import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "../registry/errors.js";
import { deriveKitPaths, type KitConfig } from "../project/config.js";
import { canonicalContentHash, sha256Hex } from "./digest.js";
import { identityDigest, type PlanReadFile } from "./authority.js";
import { hasIgnoreEntry, ignoreBlockWithEntry } from "./transaction-cleanup.js";
import type { ApplyPlanInput, ApplyTarget } from "./apply.js";
import type { PlanWrite } from "./plan.js";
import { decodeObservedText } from "./snapshot.js";
import { ignoreEntryFor, lockPath } from "./transaction-types.js";
import type {
  AncestorObservation,
  ProjectSnapshot,
  TargetObservation,
} from "./snapshot.js";

export interface ComposeApplyPlanInput {
  readonly root: string;
  readonly config: KitConfig;
  readonly writes: readonly PlanWrite[];
  /**
   * The immutable snapshot the planner reasoned about. Every target preimage,
   * ancestor identity and read-only evidence file is derived from this captured
   * authority; a missing observation is a typed failure.
   */
  readonly snapshot: ProjectSnapshot;
  /** Override the root identity digest (tests); defaults to the snapshot root. */
  readonly rootIdentity?: string;
}

const HEX64 = /^[0-9a-f]{64}$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function preimageFor(observation: TargetObservation):
  | {
      readonly path: string;
      readonly kind: "absent";
      readonly digest: null;
      readonly mode: null;
    }
  | {
      readonly path: string;
      readonly kind: "file";
      readonly digest: string;
      readonly mode: number;
    }
  | null {
  if (observation.kind === "absent") {
    return { path: observation.path, kind: "absent", digest: null, mode: null };
  }
  if (observation.kind === "file" && observation.hash !== null) {
    return {
      path: observation.path,
      kind: "file",
      digest: observation.hash,
      mode: observation.mode ?? 0o644,
    };
  }
  return null;
}

function ancestorFor(observation: AncestorObservation): {
  readonly path: string;
  readonly kind: "directory" | "absent";
  readonly device: number | null;
  readonly inode: number | null;
} | null {
  if (observation.kind === "directory") {
    return {
      path: observation.path,
      kind: "directory",
      device: observation.device,
      inode: observation.inode,
    };
  }
  if (observation.kind === "absent") {
    return {
      path: observation.path,
      kind: "absent",
      device: null,
      inode: null,
    };
  }
  return null;
}

/**
 * Compose a complete guarded apply plan from planner writes and the original
 * immutable snapshot. The lock write is the final publication and is removed
 * from the ordinary target set.
 */
export function composeApplyPlan(
  input: ComposeApplyPlanInput,
): ModelResult<ApplyPlanInput> {
  const snapshot = input.snapshot;
  if (!isPlainObject(snapshot as unknown)) {
    return fail([
      issue(
        "COMPOSE_SNAPSHOT_REQUIRED",
        "composeApplyPlan requires the original immutable project snapshot",
        "snapshot",
      ),
    ]);
  }

  const derived = deriveKitPaths(input.config);
  const stateDir = derived.stateDir;
  const canonicalLock = lockPath(stateDir);
  const root = snapshot.root;
  const problems: ModelIssue[] = [];

  const lockWrites = input.writes.filter(
    (write) => write.path === canonicalLock,
  );
  if (lockWrites.length === 0) {
    problems.push(
      issue(
        "COMPOSE_LOCK_MISSING",
        "a guarded apply plan requires the canonical lock write",
        canonicalLock,
      ),
    );
  }
  if (lockWrites.length > 1) {
    problems.push(
      issue(
        "COMPOSE_LOCK_DUPLICATE",
        "the canonical lock must appear exactly once",
        canonicalLock,
      ),
    );
  }

  const targets: ApplyTarget[] = [];
  const targetPaths = new Set<string>();
  const seen = new Set<string>();
  for (const write of input.writes) {
    if (write.path === canonicalLock) continue;
    if (seen.has(write.path)) {
      problems.push(
        issue(
          "COMPOSE_TARGET_DUPLICATE",
          `duplicate planned target ${write.path}`,
          write.path,
        ),
      );
      continue;
    }
    seen.add(write.path);
    targetPaths.add(write.path);

    const observation = snapshot.entries.get(write.path);
    if (observation === undefined) {
      problems.push(
        issue(
          "COMPOSE_SNAPSHOT_INCOMPLETE",
          `the planning snapshot did not observe ${write.path}; refusing to guess its preimage`,
          write.path,
        ),
      );
      continue;
    }
    const preimage = preimageFor(observation);
    if (preimage === null) {
      problems.push(
        issue(
          "COMPOSE_SNAPSHOT_UNSAFE",
          `the planning snapshot observed ${write.path} as ${observation.kind}; refusing an unsafe preimage`,
          write.path,
        ),
      );
      continue;
    }
    const operation =
      write.operation ?? (preimage.kind === "absent" ? "create" : "update");
    if (operation === "create" && preimage.kind !== "absent") {
      problems.push(
        issue(
          "COMPOSE_OPERATION_MISMATCH",
          `planned create target already exists: ${write.path}`,
          write.path,
        ),
      );
      continue;
    }
    if (
      (operation === "update" || operation === "retire") &&
      preimage.kind !== "file"
    ) {
      problems.push(
        issue(
          "COMPOSE_OPERATION_MISMATCH",
          `planned ${operation} target is absent: ${write.path}`,
          write.path,
        ),
      );
      continue;
    }
    if (operation === "retire" && write.bytes.byteLength !== 0) {
      problems.push(
        issue(
          "COMPOSE_OPERATION_MISMATCH",
          `planned retire target carries bytes: ${write.path}`,
          write.path,
        ),
      );
      continue;
    }
    targets.push({
      path: write.path,
      operation,
      bytes: write.bytes,
      mode: preimage.kind === "file" ? (preimage.mode ?? 0o644) : 0o644,
      preimage,
    });
  }

  if (problems.length > 0) return fail(problems);
  const lockWrite = lockWrites[0];
  if (lockWrite === undefined) {
    return fail([
      issue(
        "COMPOSE_LOCK_MISSING",
        "a guarded apply plan requires the canonical lock write",
        canonicalLock,
      ),
    ]);
  }

  const lockObservation = snapshot.entries.get(canonicalLock);
  if (lockObservation === undefined) {
    return fail([
      issue(
        "COMPOSE_SNAPSHOT_INCOMPLETE",
        `the planning snapshot did not observe ${canonicalLock}`,
        canonicalLock,
      ),
    ]);
  }
  const lockPreimage = preimageFor(lockObservation);
  if (lockPreimage === null) {
    return fail([
      issue(
        "COMPOSE_SNAPSHOT_UNSAFE",
        `the planning snapshot observed the canonical lock as ${lockObservation.kind}`,
        canonicalLock,
      ),
    ]);
  }

  // Guarded ignore-file integration (S072). When the captured snapshot observed
  // the application ignore file, plan exactly one managed entry that preserves
  // every existing rule. It is only required when this batch changes committed
  // state; a satisfied replay adds nothing, and an unobserved or undecodable
  // ignore file is left to doctor diagnostics rather than appended blindly.
  const ignorePath = ".gitignore";
  let ignoreTargetAdded = false;
  const lockSatisfied =
    lockObservation.kind === "file" &&
    lockObservation.hash === sha256Hex(lockWrite.bytes);
  if (
    (targets.length > 0 || !lockSatisfied) &&
    snapshot.paths.includes(ignorePath) &&
    !targetPaths.has(ignorePath)
  ) {
    const observation = snapshot.entries.get(ignorePath);
    if (
      observation !== undefined &&
      (observation.kind === "absent" || observation.kind === "file")
    ) {
      const decoded =
        observation.kind === "file"
          ? decodeObservedText(observation)
          : ({ kind: "none" } as const);
      if (decoded.kind !== "invalid") {
        const existing = decoded.kind === "text" ? decoded.text : "";
        const entry = ignoreEntryFor(stateDir);
        const preimage = preimageFor(observation);
        if (preimage !== null && !hasIgnoreEntry(existing, entry)) {
          targetPaths.add(ignorePath);
          ignoreTargetAdded = true;
          targets.push({
            path: ignorePath,
            operation: observation.kind === "absent" ? "create" : "update",
            bytes: new TextEncoder().encode(
              ignoreBlockWithEntry(existing, entry),
            ),
            mode: preimage.kind === "file" ? (preimage.mode ?? 0o644) : 0o644,
            preimage,
          });
        }
      }
    }
  }

  // The ancestor chain and read-only evidence come from the captured snapshot,
  // including explicit absence, never from a later live recapture.
  const ancestors: {
    path: string;
    kind: "directory" | "absent";
    device: number | null;
    inode: number | null;
  }[] = [];
  for (const observation of snapshot.ancestors.values()) {
    const ancestor = ancestorFor(observation);
    if (ancestor !== null) ancestors.push(ancestor);
  }
  const evidenceFiles: PlanReadFile[] = [];
  const evidenceSeen = new Set<string>();
  for (const path of snapshot.paths) {
    if (targetPaths.has(path) || path === canonicalLock) continue;
    const observation = snapshot.entries.get(path);
    if (observation?.kind === "file" && observation.hash !== null) {
      evidenceSeen.add(path);
      evidenceFiles.push({
        path,
        kind: "file",
        digest: observation.hash,
        mode: observation.mode ?? 0o644,
      });
    }
  }
  // Carry the captured environment/manifest/manager evidence (including proven
  // absence) so a post-planning dependency or manifest edit cannot be silently
  // omitted from the apply read set.
  for (const captured of snapshot.environment.evidence) {
    if (evidenceSeen.has(captured.path)) continue;
    evidenceSeen.add(captured.path);
    evidenceFiles.push({
      path: captured.path,
      kind: captured.kind,
      digest: captured.digest,
      mode: captured.mode,
    });
  }
  evidenceFiles.sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
  );

  const rootIdentity =
    input.rootIdentity ?? identityDigest(snapshot.rootIdentity);
  if (!HEX64.test(rootIdentity)) {
    return fail([
      issue(
        "COMPOSE_ROOT_IDENTITY_INVALID",
        "the root identity digest must be a 64-hex value",
        "rootIdentity",
      ),
    ]);
  }

  const planDigest = canonicalContentHash({
    root,
    stateDir,
    uiDir: input.config.uiDir,
    stylesDir: input.config.stylesDir,
    layoutFile: input.config.layoutFile,
    rootIdentity,
    targets: targets.map((target) => ({
      path: target.path,
      operation: target.operation,
      resultDigest: sha256Hex(target.bytes),
      mode: target.mode,
      preimage: {
        kind: target.preimage.kind,
        digest: target.preimage.digest,
        mode: target.preimage.mode,
      },
    })),
    lock: {
      digest: sha256Hex(lockWrite.bytes),
      preimage: {
        kind: lockPreimage.kind,
        digest: lockPreimage.digest,
        mode: lockPreimage.mode,
      },
    },
    readset: {
      root: {
        device: snapshot.rootIdentity.device,
        inode: snapshot.rootIdentity.inode,
      },
      ancestors: ancestors.map((ancestor) => ({
        path: ancestor.path,
        kind: ancestor.kind,
        device: ancestor.device,
        inode: ancestor.inode,
      })),
      files: evidenceFiles.map((file) => ({
        path: file.path,
        kind: file.kind,
        digest: file.digest,
        mode: file.mode,
      })),
    },
  });

  return ok({
    root,
    stateDir,
    uiDir: input.config.uiDir,
    stylesDir: input.config.stylesDir,
    layoutFile: input.config.layoutFile,
    rootIdentity,
    planDigest,
    readset: {
      root: {
        device: snapshot.rootIdentity.device,
        inode: snapshot.rootIdentity.inode,
      },
      ancestors,
      files: evidenceFiles,
    },
    targets,
    lock: {
      bytes: lockWrite.bytes,
      preimage: lockPreimage,
    },
    ignoreFiles: ignoreTargetAdded ? [ignorePath] : [],
  });
}

// Imported for type stability in the public signature.
export type { ProjectSnapshot, TargetObservation };
