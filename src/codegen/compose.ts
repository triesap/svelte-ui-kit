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
import { isSafeLogicalRelativePath } from "../project/paths.js";
import { canonicalContentHash, sha256Hex } from "./digest.js";
import { identityDigest, type PlanReadFile } from "./authority.js";
import type { PlanInstalledRead } from "./authority.js";
import {
  authoritativeExportKey,
  effectiveExportKey,
  parseGeneratedDeclarations,
  type BarrelExportAuthority,
} from "./exports.js";
import { parseExportRegion } from "./export-parse.js";
import { parseKitLock } from "./lock.js";
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
  /**
   * Independent immutable export-cohort authority produced by the planner from
   * the validated registry closure (owner, source binding, public name, target
   * and value/type role), keyed by managed barrel path. Composition consumes
   * this authority instead of parsing candidate barrel bytes, so a plan cannot
   * certify its own expectations and a tampered or emptied barrel write is
   * refused. It is required for every barrel the projected lock declares as an
   * `exports-v1` integration, whether or not this batch writes the barrel.
   */
  readonly exportAuthority?: readonly BarrelExportAuthority[];
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

  // Guarded ignore-file integration (S072). When the batch changes committed
  // state it must plan the one managed transient-namespace entry, preserving
  // every existing rule. The captured ignore authority is required: an
  // unobserved, unsafe/unreadable or undecodable ignore file is a typed
  // diagnostic, never a silent skip and never a live fallback read. A satisfied
  // replay adds nothing.
  const ignorePath = ".gitignore";
  let ignoreTargetAdded = false;
  const lockSatisfied =
    lockObservation.kind === "file" &&
    lockObservation.hash === sha256Hex(lockWrite.bytes);
  const ignoreRequired = targets.length > 0 || !lockSatisfied;
  if (ignoreRequired && !targetPaths.has(ignorePath)) {
    if (!snapshot.paths.includes(ignorePath)) {
      return fail([
        issue(
          "COMPOSE_IGNORE_UNOBSERVED",
          `the required managed ignore file ${ignorePath} was not observed by the planning snapshot; request a fresh snapshot before planning`,
          ignorePath,
        ),
      ]);
    }
    const observation = snapshot.entries.get(ignorePath);
    if (observation === undefined) {
      return fail([
        issue(
          "COMPOSE_IGNORE_UNOBSERVED",
          `the required managed ignore file ${ignorePath} was not observed by the planning snapshot; request a fresh snapshot before planning`,
          ignorePath,
        ),
      ]);
    }
    if (observation.kind !== "absent" && observation.kind !== "file") {
      return fail([
        issue(
          "COMPOSE_IGNORE_UNSAFE",
          `the managed ignore file ${ignorePath} was observed as ${observation.kind}; refusing to plan a blind ignore edit`,
          ignorePath,
        ),
      ]);
    }
    const decoded =
      observation.kind === "file"
        ? decodeObservedText(observation)
        : ({ kind: "none" } as const);
    if (decoded.kind === "invalid") {
      return fail([
        issue(
          "COMPOSE_IGNORE_UNSAFE",
          `the managed ignore file ${ignorePath} is not valid UTF-8; refusing to plan an edit that cannot preserve its existing rules`,
          ignorePath,
        ),
      ]);
    }
    const existing = decoded.kind === "text" ? decoded.text : "";
    const entry = ignoreEntryFor(stateDir);
    const preimage = preimageFor(observation);
    if (preimage !== null && !hasIgnoreEntry(existing, entry)) {
      targetPaths.add(ignorePath);
      ignoreTargetAdded = true;
      targets.push({
        path: ignorePath,
        operation: observation.kind === "absent" ? "create" : "update",
        bytes: new TextEncoder().encode(ignoreBlockWithEntry(existing, entry)),
        mode: preimage.kind === "file" ? (preimage.mode ?? 0o644) : 0o644,
        preimage,
      });
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
        bytes: observation.bytes,
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
      bytes: null,
    });
  }
  evidenceFiles.sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
  );

  // Carry the captured read-only installed resolution decisions. These may name
  // ancestor/hoisted installs or dependency links outside the selected root;
  // they are re-proven as reads only and never become write targets.
  const installedReads: PlanInstalledRead[] =
    snapshot.environment.installedResolution.map((entry) => ({
      name: entry.name,
      kind: entry.kind,
      path: entry.path,
      realPath: entry.realPath,
      digest: entry.digest,
      mode: entry.mode,
      device: entry.device,
      inode: entry.inode,
      code:
        entry.kind === "unsafe" || entry.kind === "unreadable"
          ? entry.code
          : null,
    }));

  // Consume the independent, planner-produced export-cohort authority. The
  // projected lock (published by this plan) declares which barrels are managed
  // `exports-v1` integrations; each must carry an authority entry sourced from
  // the original validated registry closure, whether or not this batch writes
  // the barrel. Composition never derives the expected cohort from candidate
  // output bytes, so a tampered/emptied barrel write is refused and an
  // unchanged barrel is still proven against its original relationships.
  const decodeLockBytes = (): unknown => {
    try {
      return JSON.parse(new TextDecoder("utf-8").decode(lockWrite.bytes));
    } catch {
      return undefined;
    }
  };
  const parsedLockValue = decodeLockBytes();
  const projectedLock =
    parsedLockValue === undefined
      ? null
      : (() => {
          const validated = parseKitLock(parsedLockValue, canonicalLock, {
            stateDir,
          });
          return validated.ok ? validated.value : null;
        })();
  const managedExportPaths = new Set<string>();
  if (projectedLock !== null) {
    for (const integration of projectedLock.integrations) {
      if (integration.kind === "exports") {
        managedExportPaths.add(integration.path);
      }
    }
  } else {
    // A lock that cannot be parsed as a lock cannot declare integrations; fall
    // back to the planned barrel write so a managed replacement is never left
    // unqualified. This is a detection aid, never authority derivation.
    for (const write of input.writes) {
      if (write.path === derived.rootExports) {
        managedExportPaths.add(write.path);
      }
    }
  }

  const authorityByPath = new Map<string, BarrelExportAuthority>();
  const planningAuthority =
    input.exportAuthority ?? lockWrite.exportAuthority ?? [];
  for (const entry of planningAuthority) {
    if (
      !isPlainObject(entry as unknown) ||
      typeof (entry as BarrelExportAuthority).path !== "string" ||
      !isSafeLogicalRelativePath((entry as BarrelExportAuthority).path)
    ) {
      return fail([
        issue(
          "COMPOSE_EXPORTS_AUTHORITY_INVALID",
          "the planning export authority must name safe barrel paths",
        ),
      ]);
    }
    const typed = entry as BarrelExportAuthority;
    if (
      typed.contract !== "exports-v1" ||
      typeof typed.registryVersion !== "string" ||
      typeof typed.registryHash !== "string" ||
      !HEX64.test(typed.registryHash) ||
      !Array.isArray(typed.declarations)
    ) {
      return fail([
        issue(
          "COMPOSE_EXPORTS_AUTHORITY_INVALID",
          `the planning export authority for ${typed.path} is not a well-formed exports-v1 cohort`,
          typed.path,
        ),
      ]);
    }
    for (const declaration of typed.declarations) {
      if (
        !isPlainObject(declaration as unknown) ||
        typeof declaration.owner !== "string" ||
        declaration.owner.length === 0 ||
        typeof declaration.name !== "string" ||
        declaration.name.length === 0 ||
        typeof declaration.source !== "string" ||
        declaration.source.length === 0 ||
        typeof declaration.target !== "string" ||
        declaration.target.length === 0 ||
        (declaration.kind !== "value" && declaration.kind !== "type")
      ) {
        return fail([
          issue(
            "COMPOSE_EXPORTS_AUTHORITY_INVALID",
            `the planning export authority for ${typed.path} carries a malformed declaration`,
            typed.path,
          ),
        ]);
      }
    }
    const folded = typed.path.toLowerCase();
    if (authorityByPath.has(folded)) {
      return fail([
        issue(
          "COMPOSE_EXPORTS_AUTHORITY_DUPLICATE",
          `duplicate planning export authority for ${typed.path}`,
          typed.path,
        ),
      ]);
    }
    authorityByPath.set(folded, typed);
  }

  const exportAuthority: BarrelExportAuthority[] = [];
  for (const managedPath of managedExportPaths) {
    const authority = authorityByPath.get(managedPath.toLowerCase());
    if (authority === undefined) {
      return fail([
        issue(
          "COMPOSE_EXPORTS_AUTHORITY_MISSING",
          `the projected lock manages the exports barrel ${managedPath} but the plan carries no independent registry-declared authority for it; refusing to compose an unqualified export cohort`,
          managedPath,
        ),
      ]);
    }
    if (
      projectedLock !== null &&
      (projectedLock.registryVersion !== authority.registryVersion ||
        projectedLock.registryHash !== authority.registryHash)
    ) {
      return fail([
        issue(
          "COMPOSE_EXPORTS_AUTHORITY_STALE",
          `the export authority for ${managedPath} was derived from registry ${authority.registryVersion}/${authority.registryHash} but the projected lock records ${projectedLock.registryVersion}/${projectedLock.registryHash}`,
          managedPath,
        ),
      ]);
    }
    const barrelWrite = input.writes.find(
      (write) => write.path === managedPath,
    );
    if (barrelWrite !== undefined) {
      let text: string | null;
      try {
        text = new TextDecoder("utf-8", {
          fatal: true,
          ignoreBOM: true,
        }).decode(barrelWrite.bytes);
      } catch {
        text = null;
      }
      const parsed =
        text === null ? null : parseExportRegion(managedPath, text);
      if (
        text === null ||
        parsed === null ||
        !parsed.ok ||
        parsed.value.region === null
      ) {
        return fail([
          issue(
            "COMPOSE_EXPORTS_AUTHORITY_INVALID",
            `the planned exports barrel ${managedPath} does not carry a parseable managed export region`,
            managedPath,
          ),
        ]);
      }
      const region = parsed.value.region;
      const written = new Set(
        parseGeneratedDeclarations(
          text.slice(region.contentStart, region.contentEnd),
        ).map(effectiveExportKey),
      );
      const missing = authority.declarations.filter(
        (declaration) => !written.has(authoritativeExportKey(declaration)),
      );
      if (missing.length > 0) {
        return fail([
          issue(
            "COMPOSE_EXPORTS_AUTHORITY_WRITE_MISMATCH",
            `the planned exports barrel ${managedPath} does not carry ${missing.length} independently declared export relationship(s): ${[...new Set(missing.map((entry) => entry.name))].join(", ")}`,
            managedPath,
          ),
        ]);
      }
    }
    exportAuthority.push(authority);
  }
  if (projectedLock !== null) {
    for (const [folded, authority] of authorityByPath) {
      if (
        ![...managedExportPaths].some(
          (managedPath) => managedPath.toLowerCase() === folded,
        )
      ) {
        return fail([
          issue(
            "COMPOSE_EXPORTS_AUTHORITY_UNEXPECTED",
            `the plan carries export authority for ${authority.path} which the projected lock does not manage`,
            authority.path,
          ),
        ]);
      }
    }
  }

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
      installed: installedReads.map((entry) => ({
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
      installed: installedReads,
    },
    targets,
    lock: {
      bytes: lockWrite.bytes,
      preimage: lockPreimage,
    },
    ignoreFiles: ignoreTargetAdded ? [ignorePath] : [],
    exportAuthority,
  });
}

// Imported for type stability in the public signature.
export type { ProjectSnapshot, TargetObservation };
