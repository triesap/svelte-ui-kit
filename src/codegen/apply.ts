/**
 * The one guarded apply use case (S077, repaired for RCLD04-R1-1/2/3).
 *
 * Every write command composes its complete, conflict-free plan through this
 * single boundary: transient-ancestry guard, exclusive coordination, recovery,
 * physical-authority and preimage revalidation, same-filesystem staging,
 * journaled replacement, lock-last publication and safe cleanup. A partial or
 * unvalidated typed object confers no write authority. Pure planning stays
 * outside this module; the apply layer consumes plan data and never plans.
 *
 * Ordering is deliberate:
 *
 * 1. The transient namespace ancestry is proven before the first write so a
 *    symlinked coordination directory cannot redirect owned state outside the
 *    project.
 * 2. The exclusive writer lock is acquired *before* recovery, so a contender
 *    can never roll back a live owner's in-flight batch; it refuses busy
 *    instead.
 * 3. Recovery, authority revalidation and replacement all run while the lock is
 *    held, so no cooperative writer can interleave.
 * 4. The physical readset (root/ancestor identities and config/manifest/lock
 *    evidence) is re-proven immediately before staging and again immediately
 *    before live replacement, so a staging-time edit is refused rather than
 *    overwritten.
 * 5. The lock is published last; a durable publication intent is persisted
 *    before the rename so a crash in the publication window is recoverable as a
 *    commit rather than an unsafe rollback.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  rmdirSync,
} from "node:fs";
import path from "node:path";

import type { ModelIssue } from "../registry/errors.js";
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import { observeEntry } from "../project/io.js";
import { isSafeLogicalRelativePath, pathsOverlap } from "../project/paths.js";
import {
  captureReadset,
  identityDigest,
  validateReadset,
  verifyTransientAncestry,
  type PhysicalIdentity,
  type PlanAncestor,
  type PlanReadFile,
  type PlanReadset,
} from "./authority.js";
import { canonicalContentHash, sha256Hex } from "./digest.js";
import { flushDirectory, isEmptyRemovalAbsence } from "./durability.js";
import { parseKitLock } from "./lock.js";
import {
  resolveProjectedConfig,
  validateProjectedLock,
} from "./projected-batch.js";
import { deriveKitPaths } from "../project/config.js";
import type { ChangeOperation } from "./plan.js";
import {
  prepareJournal,
  persistJournal,
  type JournalCreatedDir,
  type TransactionJournal,
} from "./transaction-journal.js";
import {
  createOwnedAncestors,
  removeOwnedAncestors,
} from "./owned-ancestry.js";
import { recoverTransactions } from "./recovery.js";
import { revalidatePreimages, type TargetPreimage } from "./revalidate.js";
import { applyReplacements } from "./replace.js";
import { publishLock } from "./publish-lock.js";
import { cleanupTransaction } from "./transaction-cleanup.js";
import { stageOperations } from "./stage.js";
import { acquireWriterLock, releaseWriterLock } from "./write-lock.js";
import {
  APPROVED_IGNORE_FILES,
  createTransactionIdentity,
  journalPath,
  lockPath,
  publicationIntentPath,
  stagedDir,
  transactionDir,
  transactionsDir,
  transientRoot,
  type TransactionOutcomeKind,
} from "./transaction-types.js";
import {
  classifyPublication,
  observeFileIdentity,
  readPublicationIntent,
  type PublicationState,
} from "./publication-intent.js";
import { fireHooks, type TransactionHooks } from "./transaction-hooks.js";

export interface ApplyTarget {
  readonly path: string;
  readonly operation: ChangeOperation;
  readonly bytes: Uint8Array;
  /** Exact mode to apply; for updates this should preserve the preimage mode. */
  readonly mode: number;
  readonly preimage: TargetPreimage;
}

export interface ApplyPlanInput {
  readonly root: string;
  readonly stateDir: string;
  readonly uiDir: string;
  readonly stylesDir: string;
  readonly layoutFile: string;
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
}

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

const VALIDATED_PLANS = new WeakSet<object>();

/**
 * The instance-level validation registry. Membership is module-owned and
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
}

const OPERATIONS: readonly ChangeOperation[] = ["create", "update", "retire"];
const HEX64 = /^[0-9a-f]{64}$/;
const TRANSIENT_BASENAME = ".svelte-ui-kit";

/**
 * The complete approved key set of each input shape. An unknown key is a typed
 * refusal, never a silently ignored field: a caller cannot smuggle authority
 * or extra behaviour past validation. Nested preimages/readset evidence carry
 * their own strict key inventories.
 */
const PLAN_KEYS: readonly string[] = [
  "root",
  "stateDir",
  "uiDir",
  "stylesDir",
  "layoutFile",
  "rootIdentity",
  "planDigest",
  "readset",
  "targets",
  "lock",
  "ignoreFiles",
];
const TARGET_KEYS: readonly string[] = [
  "path",
  "operation",
  "bytes",
  "mode",
  "preimage",
];
const LOCK_KEYS: readonly string[] = ["bytes", "preimage"];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Record every key of a plain object that is not in the approved inventory. */
function unknownKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  code: string,
  locator: string,
  problems: ModelIssue[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      problems.push(
        issue(code, `${locator} has unexpected key ${key}`, locator),
      );
    }
  }
}

/**
 * Validate a complete plan and seal it. Incomplete/partial objects, unknown
 * operations, unsafe or out-of-root/duplicate/reserved targets, a canonical
 * lock posed as an ordinary target, and missing preimages are refused before
 * any coordination is acquired. The returned plan is a defensive copy with
 * copied bytes and a bound result digest, so mutating the caller's object (or
 * its typed arrays) cannot confer the old authority.
 */
export function validateApplyPlan(
  input: Partial<ApplyPlanInput>,
): ModelResult<ValidatedApplyPlan> {
  const problems: ModelIssue[] = [];
  if (!isPlainObject(input)) {
    return fail([issue("PLAN_INCOMPLETE", "plan must be an object", "plan")]);
  }
  unknownKeys(input, PLAN_KEYS, "PLAN_UNKNOWN_FIELD", "plan", problems);
  const requiredStrings: readonly (keyof ApplyPlanInput)[] = [
    "root",
    "stateDir",
    "uiDir",
    "stylesDir",
    "layoutFile",
    "rootIdentity",
    "planDigest",
  ];
  for (const field of requiredStrings) {
    const value = input[field];
    if (typeof value !== "string" || value.length === 0) {
      problems.push(
        issue("PLAN_INCOMPLETE", `plan.${field} is required`, field),
      );
    }
  }
  if (!HEX64.test(String(input.rootIdentity))) {
    problems.push(
      issue(
        "PLAN_INCOMPLETE",
        "plan.rootIdentity must be a 64-hex digest",
        "rootIdentity",
      ),
    );
  }
  if (!HEX64.test(String(input.planDigest))) {
    problems.push(
      issue(
        "PLAN_INCOMPLETE",
        "plan.planDigest must be a 64-hex digest",
        "planDigest",
      ),
    );
  }
  problems.push(...validateReadset(input.readset));
  if (!Array.isArray(input.targets)) {
    problems.push(
      issue("PLAN_INCOMPLETE", "plan.targets must be an array", "targets"),
    );
  }
  if (
    !isPlainObject(input.lock) ||
    !(input.lock as { bytes?: unknown }).bytes
  ) {
    problems.push(issue("PLAN_INCOMPLETE", "plan.lock is required", "lock"));
  }
  // The approved ignore authority is a strict array of the narrowly managed
  // ignore files. A malformed value is a typed refusal before any effect, never
  // an uncaught TypeError; an unapproved or duplicate entry is refused too.
  if (input.ignoreFiles !== undefined) {
    if (!Array.isArray(input.ignoreFiles)) {
      problems.push(
        issue(
          "PLAN_IGNORE_INVALID",
          "plan.ignoreFiles must be an array of logical paths",
          "ignoreFiles",
        ),
      );
    } else {
      const seenIgnore = new Set<string>();
      for (const [index, entry] of input.ignoreFiles.entries()) {
        if (
          typeof entry !== "string" ||
          entry.length === 0 ||
          !isSafeLogicalRelativePath(entry)
        ) {
          problems.push(
            issue(
              "PLAN_IGNORE_INVALID",
              `plan.ignoreFiles[${index}] must be a safe logical path`,
              "ignoreFiles",
            ),
          );
          continue;
        }
        const folded = entry.toLowerCase();
        if (seenIgnore.has(folded)) {
          problems.push(
            issue(
              "PLAN_IGNORE_DUPLICATE",
              `plan.ignoreFiles contains duplicate ${entry}`,
              "ignoreFiles",
            ),
          );
          continue;
        }
        seenIgnore.add(folded);
        if (!APPROVED_IGNORE_FILES.includes(folded)) {
          problems.push(
            issue(
              "PLAN_IGNORE_UNAPPROVED",
              `ignore file ${entry} is not an approved managed ignore file`,
              "ignoreFiles",
            ),
          );
        }
      }
    }
  }
  if (problems.length > 0) return fail(problems);

  const plan = input as ApplyPlanInput;
  const canonicalLock = lockPath(plan.stateDir);
  const roots = [plan.uiDir, plan.stylesDir, plan.layoutFile];
  const approvedIgnoreFiles = new Set(
    (plan.ignoreFiles ?? []).map((entry) => entry.toLowerCase()),
  );
  const seen = new Set<string>();
  const sealedTargets: ValidatedApplyTarget[] = [];
  const lockBytesView = plan.lock.bytes;
  if (
    !(lockBytesView instanceof Uint8Array) ||
    lockBytesView.byteLength === 0
  ) {
    problems.push(
      issue("PLAN_LOCK_EMPTY", "plan.lock.bytes must not be empty", "lock"),
    );
  }
  for (const target of plan.targets) {
    if (!isPlainObject(target)) {
      problems.push(
        issue(
          "PLAN_TARGET_INVALID",
          "each target must be an object",
          "targets",
        ),
      );
      continue;
    }
    unknownKeys(
      target,
      TARGET_KEYS,
      "PLAN_TARGET_INVALID",
      typeof target.path === "string" ? target.path : "targets",
      problems,
    );
    if (!isSafeLogicalRelativePath(target.path)) {
      problems.push(
        issue(
          "PLAN_TARGET_UNSAFE",
          `unsafe target ${target.path}`,
          target.path,
        ),
      );
      continue;
    }
    if (!OPERATIONS.includes(target.operation)) {
      problems.push(
        issue(
          "PLAN_OPERATION_UNKNOWN",
          `target ${target.path} has an unknown operation ${String(target.operation)}`,
          target.path,
        ),
      );
      continue;
    }
    if (!(target.bytes instanceof Uint8Array)) {
      problems.push(
        issue(
          "PLAN_TARGET_INVALID",
          `target ${target.path} must carry bytes`,
          target.path,
        ),
      );
      continue;
    }
    if (
      !Number.isInteger(target.mode) ||
      target.mode < 0 ||
      target.mode > 0o777
    ) {
      problems.push(
        issue(
          "PLAN_TARGET_INVALID",
          `target ${target.path} has an invalid mode`,
          target.path,
        ),
      );
      continue;
    }
    if (pathsOverlap(target.path, `${plan.stateDir}/${TRANSIENT_BASENAME}`)) {
      problems.push(
        issue(
          "PLAN_TARGET_RESERVED",
          `target ${target.path} overlaps the reserved transient namespace`,
          target.path,
        ),
      );
      continue;
    }
    if (target.path.toLowerCase() === canonicalLock.toLowerCase()) {
      problems.push(
        issue(
          "PLAN_LOCK_TARGET",
          "the canonical lock is exclusively final publication and cannot be an ordinary target",
          target.path,
        ),
      );
      continue;
    }
    const within =
      target.path === plan.layoutFile ||
      roots.some(
        (root) =>
          target.path === root.replace(/\/+$/, "") ||
          target.path.startsWith(`${root.replace(/\/+$/, "")}/`),
      ) ||
      approvedIgnoreFiles.has(target.path.toLowerCase());
    if (!within) {
      problems.push(
        issue(
          "PLAN_TARGET_UNAPPROVED",
          `target ${target.path} is outside the approved roots`,
          target.path,
        ),
      );
    }
    const folded = target.path.toLowerCase();
    if (seen.has(folded)) {
      problems.push(
        issue(
          "PLAN_TARGET_DUPLICATE",
          `duplicate target ${target.path}`,
          target.path,
        ),
      );
    }
    seen.add(folded);
    if (!isPlainObject(target.preimage)) {
      problems.push(
        issue(
          "PLAN_PREIMAGE_MISMATCH",
          `target ${target.path} must carry a preimage`,
          target.path,
        ),
      );
      continue;
    }
    // Strict nested shape: exactly {path, kind, digest, mode}, no unknown or
    // missing keys, and a kind-consistent digest/mode. A malformed nested
    // preimage is a typed refusal before digest/sealing/coordination, never an
    // `undefined` value that later throws during canonical serialization.
    for (const key of Object.keys(target.preimage)) {
      if (!["path", "kind", "digest", "mode"].includes(key)) {
        problems.push(
          issue(
            "PLAN_PREIMAGE_MISMATCH",
            `target ${target.path} preimage has unexpected key ${key}`,
            target.path,
          ),
        );
      }
    }
    for (const key of ["path", "kind", "digest", "mode"]) {
      if (!(key in target.preimage)) {
        problems.push(
          issue(
            "PLAN_PREIMAGE_MISMATCH",
            `target ${target.path} preimage is missing ${key}`,
            target.path,
          ),
        );
      }
    }
    if (target.preimage.path !== target.path) {
      problems.push(
        issue(
          "PLAN_PREIMAGE_MISMATCH",
          `preimage path does not match ${target.path}`,
          target.path,
        ),
      );
    }
    if (target.operation === "retire" && target.bytes.byteLength !== 0) {
      problems.push(
        issue(
          "PLAN_RETIRE_BYTES",
          `retire target ${target.path} must carry no bytes`,
          target.path,
        ),
      );
    }
    if (target.operation === "create" && target.preimage.kind !== "absent") {
      problems.push(
        issue(
          "PLAN_PREIMAGE_MISMATCH",
          `create target ${target.path} must have an absent preimage`,
          target.path,
        ),
      );
    }
    if (target.operation !== "create" && target.preimage.kind !== "file") {
      problems.push(
        issue(
          "PLAN_PREIMAGE_MISMATCH",
          `${target.operation} target ${target.path} must have a file preimage`,
          target.path,
        ),
      );
    }
    if (
      target.preimage.kind === "file" &&
      (typeof target.preimage.digest !== "string" ||
        !HEX64.test(target.preimage.digest))
    ) {
      problems.push(
        issue(
          "PLAN_PREIMAGE_MISMATCH",
          `target ${target.path} preimage digest is invalid`,
          target.path,
        ),
      );
    }
    if (target.preimage.kind === "file") {
      if (
        target.preimage.mode === null ||
        !Number.isInteger(target.preimage.mode) ||
        target.preimage.mode < 0 ||
        target.preimage.mode > 0o777
      ) {
        problems.push(
          issue(
            "PLAN_PREIMAGE_MISMATCH",
            `target ${target.path} preimage mode is invalid`,
            target.path,
          ),
        );
      }
    } else if (target.preimage.kind === "absent") {
      if (target.preimage.digest !== null || target.preimage.mode !== null) {
        problems.push(
          issue(
            "PLAN_PREIMAGE_MISMATCH",
            `target ${target.path} absent preimage must not carry a digest or mode`,
            target.path,
          ),
        );
      }
    }
    sealedTargets.push(
      Object.freeze({
        path: target.path,
        operation: target.operation,
        bytes: new Uint8Array(target.bytes),
        mode: target.mode,
        preimage: Object.freeze({ ...target.preimage }),
        resultDigest: sha256Hex(target.bytes),
      }),
    );
  }
  // The lock wrapper is a strict nested shape. An unknown key is a typed
  // refusal before digest/sealing/coordination, never a silently ignored field.
  unknownKeys(plan.lock, LOCK_KEYS, "PLAN_LOCK_INVALID", "lock", problems);
  // The lock preimage is a strict nested shape, not an unchecked record.
  const lockPreimage = plan.lock.preimage as unknown;
  if (!isPlainObject(lockPreimage)) {
    problems.push(
      issue("PLAN_PREIMAGE_MISMATCH", "plan.lock.preimage is required", "lock"),
    );
  } else {
    for (const key of Object.keys(lockPreimage)) {
      if (!["path", "kind", "digest", "mode"].includes(key)) {
        problems.push(
          issue(
            "PLAN_PREIMAGE_MISMATCH",
            `plan.lock.preimage has unexpected key ${key}`,
            "lock",
          ),
        );
      }
    }
    for (const key of ["path", "kind", "digest", "mode"]) {
      if (!(key in lockPreimage)) {
        problems.push(
          issue(
            "PLAN_PREIMAGE_MISMATCH",
            `plan.lock.preimage is missing ${key}`,
            "lock",
          ),
        );
      }
    }
    if (lockPreimage["path"] !== canonicalLock) {
      problems.push(
        issue(
          "PLAN_PREIMAGE_MISMATCH",
          "lock preimage path must be the canonical lock",
          "lock",
        ),
      );
    }
    const lockKind = lockPreimage["kind"];
    if (lockKind !== "file" && lockKind !== "absent") {
      problems.push(
        issue(
          "PLAN_PREIMAGE_MISMATCH",
          "lock preimage kind must be file or absent",
          "lock",
        ),
      );
    } else if (lockKind === "file") {
      if (!HEX64.test(String(lockPreimage["digest"]))) {
        problems.push(
          issue(
            "PLAN_PREIMAGE_MISMATCH",
            "lock preimage digest is invalid",
            "lock",
          ),
        );
      }
      const mode = lockPreimage["mode"];
      if (
        !Number.isInteger(mode) ||
        (mode as number) < 0 ||
        (mode as number) > 0o777
      ) {
        problems.push(
          issue(
            "PLAN_PREIMAGE_MISMATCH",
            "lock preimage mode is invalid",
            "lock",
          ),
        );
      }
    } else if (
      lockPreimage["digest"] !== null ||
      lockPreimage["mode"] !== null
    ) {
      problems.push(
        issue(
          "PLAN_PREIMAGE_MISMATCH",
          "an absent lock preimage must not carry a digest or mode",
          "lock",
        ),
      );
    }
  }

  // Structural target/preimage problems stop before projection, hashing or
  // sealing: no invalid record may reach later semantic processing. This is a
  // typed refusal, never an uncaught serializer/projection error.
  if (problems.length > 0) return fail(problems);

  // Validate the exact final lock content before any coordination is acquired.
  // An invalid or incoherent lock must never reach a semantic replacement.
  if (lockBytesView instanceof Uint8Array && lockBytesView.byteLength > 0) {
    // Derive the complete projected batch from the captured planning authority:
    // the effective projected configuration, target results and unchanged
    // evidence, plus the exact projected content carried from the original
    // capture. A config write that changes the mapping, a lock that names an
    // absent integration/owned record, or a managed stylesheet that omits its
    // contracted content is a typed refusal before coordination.
    // Carry only the original captured pre-state bytes here. The effective
    // projected content is resolved once by overlaying the target results over
    // this captured pre-state (create/update overrides, retire removes), so
    // later read evidence can never shadow a planned target result.
    const content: { path: string; bytes: Uint8Array }[] = [];
    for (const file of plan.readset.files) {
      if (file.kind === "file" && file.bytes instanceof Uint8Array) {
        content.push({ path: file.path, bytes: file.bytes });
      }
    }
    const projectedBatch = {
      stateDir: plan.stateDir,
      uiDir: plan.uiDir,
      stylesDir: plan.stylesDir,
      layoutFile: plan.layoutFile,
      targets: sealedTargets.map((target) => ({
        path: target.path,
        operation: target.operation,
        bytes: target.bytes,
      })),
      evidence: plan.readset.files.map((file) => ({
        path: file.path,
        kind: file.kind,
      })),
      content,
    };
    const projected = resolveProjectedConfig(projectedBatch);
    if (projected.issues.length > 0) problems.push(...projected.issues);
    if (projected.config !== null) {
      let parsedLock: unknown;
      try {
        parsedLock = JSON.parse(Buffer.from(lockBytesView).toString("utf8"));
      } catch (error) {
        problems.push(
          issue(
            "LOCK_INVALID",
            `planned lock is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
            canonicalLock,
          ),
        );
      }
      if (parsedLock !== undefined) {
        const derivedPaths = deriveKitPaths(projected.config);
        const validatedLock = parseKitLock(parsedLock, canonicalLock, {
          stateDir: derivedPaths.stateDir,
          uiDir: projected.config.uiDir,
          stylesDir: projected.config.stylesDir,
          layoutFile: projected.config.layoutFile,
          stylesheetPath: derivedPaths.kitCss,
          exportsPath: derivedPaths.rootExports,
        });
        if (!validatedLock.ok) {
          problems.push(...validatedLock.issues);
        } else {
          problems.push(
            ...validateProjectedLock(
              projectedBatch,
              validatedLock.value,
              projected,
            ),
          );
        }
      }
    }
  }
  if (problems.length > 0) return fail(problems);

  const derivedRootIdentity = identityDigest(plan.readset.root);
  const lockView = plan.lock as { bytes: Uint8Array; preimage: TargetPreimage };
  const sealed: ValidatedApplyPlan = {
    root: plan.root,
    stateDir: plan.stateDir,
    uiDir: plan.uiDir,
    stylesDir: plan.stylesDir,
    layoutFile: plan.layoutFile,
    rootIdentity: derivedRootIdentity,
    planDigest: "",
    readset: Object.freeze({
      root: Object.freeze({ ...plan.readset.root }),
      ancestors: Object.freeze(
        plan.readset.ancestors.map((ancestor) =>
          Object.freeze({ ...ancestor }),
        ),
      ),
      files: Object.freeze(
        plan.readset.files.map((file) =>
          Object.freeze({
            ...file,
            // Isolate the captured byte buffer from the caller: the shallow
            // record freeze does not make the shared Uint8Array immutable, so
            // the sealed plan owns its own copy of every authority byte
            // sequence. Their content digest is bound into the plan digest.
            bytes:
              file.bytes instanceof Uint8Array
                ? new Uint8Array(file.bytes)
                : file.bytes,
          }),
        ),
      ),
      installed: Object.freeze(
        (plan.readset.installed ?? []).map((entry) =>
          Object.freeze({ ...entry }),
        ),
      ),
    }),
    targets: Object.freeze(sealedTargets),
    lock: Object.freeze({
      bytes: new Uint8Array(lockView.bytes),
      digest: sha256Hex(lockView.bytes),
      preimage: Object.freeze({ ...lockView.preimage }),
    }),
    ignoreFiles: Object.freeze([...(plan.ignoreFiles ?? [])]),
  };
  const sealedPlan: ValidatedApplyPlan = Object.freeze({
    ...sealed,
    // The plan digest is derived from the complete sealed content; a caller
    // supplied value is never trusted as authority.
    planDigest: derivePlanDigest(sealed),
  }) as ValidatedApplyPlan;
  // Register the exact instance, not a copyable token.
  VALIDATED_PLANS.add(sealedPlan);
  return ok(sealedPlan);
}

/**
 * Derive the canonical digest of the complete sealed plan: exact result bytes,
 * modes and operations, the physical read evidence including absence, and the
 * exact final lock content. A caller supplied digest is never authority.
 */
export function derivePlanDigest(input: {
  readonly root: string;
  readonly stateDir: string;
  readonly uiDir: string;
  readonly stylesDir: string;
  readonly layoutFile: string;
  readonly rootIdentity: string;
  readonly targets: readonly ValidatedApplyTarget[];
  readonly lock: {
    readonly bytes: Uint8Array;
    readonly preimage: TargetPreimage;
  };
  readonly readset: PlanReadset;
  readonly ignoreFiles?: readonly string[];
}): string {
  return canonicalContentHash({
    root: input.root,
    stateDir: input.stateDir,
    uiDir: input.uiDir,
    stylesDir: input.stylesDir,
    layoutFile: input.layoutFile,
    rootIdentity: input.rootIdentity,
    ignoreFiles: [...(input.ignoreFiles ?? [])].map((entry) =>
      entry.toLowerCase(),
    ),
    targets: input.targets.map((target) => ({
      path: target.path,
      operation: target.operation,
      resultDigest: target.resultDigest,
      mode: target.mode,
      preimage: {
        kind: target.preimage.kind,
        digest: target.preimage.digest,
        mode: target.preimage.mode,
      },
    })),
    lock: {
      digest: sha256Hex(input.lock.bytes),
      preimage: {
        kind: input.lock.preimage.kind,
        digest: input.lock.preimage.digest,
        mode: input.lock.preimage.mode,
      },
    },
    readset: {
      root: {
        device: input.readset.root.device,
        inode: input.readset.root.inode,
      },
      ancestors: input.readset.ancestors.map((ancestor) => ({
        path: ancestor.path,
        kind: ancestor.kind,
        device: ancestor.device,
        inode: ancestor.inode,
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

/** Convenience: a readset for a caller that already knows its targets. */
export function readsetFor(
  root: string,
  targetPaths: readonly string[],
  readFiles: readonly string[] = [],
): ModelResult<PlanReadset> {
  return captureReadset(root, targetPaths, readFiles);
}

export interface ApplyOutcome {
  readonly kind: TransactionOutcomeKind;
  readonly transactionId: string | null;
  readonly issues: readonly ModelIssue[];
}

function absOf(root: string, logical: string): string {
  return path.join(root, ...logical.split("/"));
}

/** The errno code of a filesystem failure, or a conservative I/O default. */
function errorCode(error: unknown): string {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return typeof code === "string" ? code : "EIO";
}

/**
 * The complete generated-ancestry plan for every target and the canonical
 * lock. A recorded-absent ancestor implies every deeper component was also
 * absent at planning, so the inferred deeper components are included; a chain
 * with no recorded-absent component has nothing to create. This lets the owned
 * bootstrap cover the whole absent chain even though `captureAncestors` stops
 * at the first missing component.
 */
function ownedAncestorCandidates(plan: ValidatedApplyPlan): PlanAncestor[] {
  const recordedKinds = new Map(
    plan.readset.ancestors.map((ancestor) => [ancestor.path, ancestor.kind]),
  );
  const result = new Map<string, PlanAncestor>();
  const paths = [
    ...plan.targets.map((target) => target.path),
    lockPath(plan.stateDir),
  ];
  for (const targetPath of paths) {
    const segments = targetPath.split("/");
    let inferredAbsent = false;
    for (let index = 1; index < segments.length; index += 1) {
      const logical = segments.slice(0, index).join("/");
      const recorded = recordedKinds.get(logical);
      if (recorded === "directory") {
        inferredAbsent = false;
        continue;
      }
      if (recorded === "absent") inferredAbsent = true;
      if (!inferredAbsent) continue;
      if (!result.has(logical)) {
        result.set(logical, {
          path: logical,
          kind: "absent",
          device: null,
          inode: null,
        });
      }
    }
  }
  return [...result.values()];
}

export type DeviceObservation =
  | { readonly kind: "directory"; readonly device: number }
  | { readonly kind: "absent" }
  | { readonly kind: "other"; readonly detail: string }
  | { readonly kind: "unreadable"; readonly code: string };

/**
 * Pure same-filesystem walk from `startAbs` toward the filesystem root. The
 * nearest existing ancestor directory must carry the project root's device; a
 * foreign device is a typed refusal, an unsafe ancestor (symlink/non-directory)
 * or an unreadable ancestor is a typed refusal, and a fully absent chain has no
 * cross-device evidence. The observation function is injectable so the
 * deterministic cross-device negative path can be exercised on a single-volume
 * host without changing the production probe.
 */
export function sameFilesystemIssues(
  rootDevice: number,
  startAbs: string,
  locator: string,
  observe: (abs: string) => DeviceObservation,
): ModelIssue[] {
  let current = startAbs;
  for (;;) {
    const entry = observe(current);
    if (entry.kind === "directory") {
      if (entry.device !== rootDevice) {
        return [
          issue(
            "STAGE_CROSS_DEVICE",
            `${locator} is not on the same filesystem as the project root; refusing non-atomic publication`,
            locator,
          ),
        ];
      }
      return [];
    }
    if (entry.kind === "unreadable") {
      return [
        issue(
          "AUTHORITY_ANCESTOR_UNREADABLE",
          `cannot prove a same-filesystem ancestor for ${locator} (${entry.code})`,
          locator,
        ),
      ];
    }
    if (entry.kind === "other") {
      return [
        issue(
          "AUTHORITY_ANCESTOR_UNSAFE",
          `cannot prove a same-filesystem ancestor for ${locator} (${entry.detail})`,
          locator,
        ),
      ];
    }
    const parent = path.dirname(current);
    if (parent === current) return [];
    current = parent;
  }
}

function observeDevice(abs: string): DeviceObservation {
  const entry = observeEntry(abs);
  if (entry.kind === "directory") {
    return { kind: "directory", device: entry.stats.dev };
  }
  if (entry.kind === "absent") return { kind: "absent" };
  if (entry.kind === "unreadable") {
    return { kind: "unreadable", code: entry.code };
  }
  return { kind: "other", detail: entry.kind };
}

/**
 * Prove the staged replacement can be published with an atomic same-filesystem
 * rename: the nearest existing ancestor directory of every target and of the
 * owned state directory must share the project root's device. A cross-device
 * arrangement is a typed refusal before any semantic effect, never a
 * happy-path assumption. The state directory is checked even for a
 * metadata-only plan because staging and lock publication live inside it.
 */
function verifySameFilesystem(
  root: string,
  targets: readonly ValidatedApplyTarget[],
  stateDir: string,
): ModelIssue[] {
  const rootEntry = observeEntry(root);
  if (rootEntry.kind !== "directory") {
    return [
      issue(
        "AUTHORITY_ROOT_UNSAFE",
        "the project root is not a real directory",
      ),
    ];
  }
  const rootDevice = rootEntry.stats.dev;
  const issues: ModelIssue[] = [];
  for (const target of targets) {
    issues.push(
      ...sameFilesystemIssues(
        rootDevice,
        path.dirname(absOf(root, target.path)),
        target.path,
        observeDevice,
      ),
    );
  }
  issues.push(
    ...sameFilesystemIssues(
      rootDevice,
      absOf(root, stateDir),
      stateDir,
      observeDevice,
    ),
  );
  return issues;
}

/** True when every sealed target's bytes still match their bound digest. */
function verifySealedTargets(plan: ValidatedApplyPlan): ModelIssue[] {
  const issues: ModelIssue[] = [];
  for (const target of plan.targets) {
    if (sha256Hex(target.bytes) !== target.resultDigest) {
      issues.push(
        issue(
          "PLAN_AUTHORITY_STALE",
          `sealed bytes for ${target.path} changed after validation`,
          target.path,
        ),
      );
    }
  }
  // The lock is verified even when there are no ordinary targets, so a
  // metadata-only apply can never publish mutated sealed bytes.
  if (sha256Hex(plan.lock.bytes) !== plan.lock.digest) {
    issues.push(
      issue(
        "PLAN_AUTHORITY_STALE",
        "sealed lock bytes changed after validation",
        lockPath(plan.stateDir),
      ),
    );
  }
  if (derivePlanDigest(plan) !== plan.planDigest) {
    issues.push(
      issue(
        "PLAN_AUTHORITY_STALE",
        "sealed plan content changed after validation",
      ),
    );
  }
  return issues;
}

/**
 * Apply one complete validated plan through the guarded boundary. The writer
 * lock is acquired before recovery and held across every stage; a failed
 * replacement is rolled back so the developer ends in a consistent state, and
 * the writer lock is always released.
 */
export function applyPlan(
  plan: ValidatedApplyPlan,
  hooks?: TransactionHooks,
): ApplyOutcome {
  // Only the exact instance produced by `validateApplyPlan` carries write
  // authority. A structurally similar object, including an object spread of a
  // validated instance with recomputed digest fields, is refused before any
  // observation or coordination.
  if (
    typeof plan !== "object" ||
    plan === null ||
    !VALIDATED_PLANS.has(plan as object)
  ) {
    return {
      kind: "refused",
      transactionId: null,
      issues: [
        issue(
          "PLAN_UNVALIDATED",
          "applyPlan requires a plan produced by validateApplyPlan",
        ),
      ],
    };
  }
  const sealedIssues = verifySealedTargets(plan);
  if (sealedIssues.length > 0) {
    return { kind: "refused", transactionId: null, issues: sealedIssues };
  }

  // 0. Guard the transient namespace ancestry before the first write.
  const ancestry = verifyTransientAncestry(plan.root, plan.stateDir);
  if (ancestry.length > 0) {
    return { kind: "refused", transactionId: null, issues: ancestry };
  }

  const identity = createTransactionIdentity(
    plan.rootIdentity,
    plan.planDigest,
  );
  const { transactionId } = identity;

  // 1. Acquire exclusive coordination before recovery. A contender never
  //    recovers a live owner's in-flight batch; it fails busy.
  const acquired = acquireWriterLock(
    plan.root,
    plan.stateDir,
    transactionId,
    hooks,
  );
  if (!acquired.ok) {
    return { kind: "refused", transactionId: null, issues: acquired.issues };
  }

  // Owned generated ancestry includes the state-directory chain this
  // acquisition created plus any absent target ancestry created below.
  const ownedCreated: JournalCreatedDir[] = [
    ...acquired.value.createdDirectories,
  ];

  let outcome: ApplyOutcome;
  try {
    outcome = applyUnderLock(plan, transactionId, ownedCreated, hooks);
  } catch (error) {
    outcome = {
      kind: "refused",
      transactionId,
      issues: [
        issue(
          "APPLY_INTERNAL_FAILED",
          `the guarded batch failed unexpectedly: ${error instanceof Error ? error.message : String(error)}`,
        ),
      ],
    };
  }
  const release = releaseWriterLock(acquired.value, hooks);
  const transientIssues = cleanupEmptyTransient(plan);
  // A refused or no-change attempt leaves no committed install, so remove only
  // the empty directories this attempt created. A committed install keeps them.
  const ancestryIssues =
    outcome.kind === "applied" || outcome.kind === "committed_needs_cleanup"
      ? []
      : removeOwnedAncestors(plan.root, ownedCreated, hooks);
  const cleanupIssues = [...transientIssues, ...ancestryIssues];
  if (release.ok) {
    if (cleanupIssues.length === 0) return outcome;
    // A published batch never rolls back for a cleanup failure, but it is not
    // fully clean either: report the truthful applied-but-needs-cleanup
    // outcome with the actual durability issue retained.
    return {
      ...outcome,
      kind:
        outcome.kind === "applied" ? "committed_needs_cleanup" : outcome.kind,
      issues: [...outcome.issues, ...cleanupIssues],
    };
  }
  // A failed release never downgrades a truthful outcome, but an applied batch
  // whose ownership evidence could not be released is not fully clean.
  return {
    ...outcome,
    kind: outcome.kind === "applied" ? "committed_needs_cleanup" : outcome.kind,
    issues: [...outcome.issues, ...release.issues, ...cleanupIssues],
  };
}

/** The guarded body, run while this attempt holds the exclusive writer lock. */
function applyUnderLock(
  plan: ValidatedApplyPlan,
  transactionId: string,
  ownedCreated: JournalCreatedDir[],
  hooks?: TransactionHooks,
): ApplyOutcome {
  // 2. Recovery runs under the lock and validates every recovery input
  //    against the approved mapping before any mutation.
  const recovery = recoverTransactions(
    plan.root,
    plan.stateDir,
    {
      uiDir: plan.uiDir,
      stylesDir: plan.stylesDir,
      layoutFile: plan.layoutFile,
    },
    hooks,
  );
  const refusedRecovery = recovery.filter(
    (entry) => entry.status === "refused",
  );
  if (refusedRecovery.length > 0) {
    return {
      kind: "refused",
      transactionId,
      issues: refusedRecovery.flatMap((entry) => entry.issues),
    };
  }

  // 3. Physical authority and preimage revalidation under coordination.
  const revalidated = revalidatePreimages(
    plan.root,
    [...plan.targets.map((target) => target.preimage), plan.lock.preimage],
    {
      root: plan.readset.root,
      ancestors: plan.readset.ancestors,
      files: plan.readset.files,
      installed: plan.readset.installed,
    },
  );
  if (!revalidated.ok) {
    return { kind: "refused", transactionId, issues: revalidated.issues };
  }

  // 3b. Prove same-filesystem staging/replacement before any semantic effect.
  const filesystem = verifySameFilesystem(
    plan.root,
    plan.targets,
    plan.stateDir,
  );
  if (filesystem.length > 0) {
    return { kind: "refused", transactionId, issues: filesystem };
  }

  // 4. Satisfied case: no target changes and the lock already holds the
  //    planned bytes. Nothing to do; no transaction is opened.
  const lockAbs = absOf(plan.root, lockPath(plan.stateDir));
  const lockUnchanged =
    plan.targets.length === 0 &&
    existsSync(lockAbs) &&
    sha256Hex(readFileSync(lockAbs)) === plan.lock.digest;
  if (lockUnchanged) {
    return { kind: "no_change", transactionId: null, issues: [] };
  }

  const journal: TransactionJournal = {
    schemaVersion: 1,
    transactionId,
    rootIdentity: plan.rootIdentity,
    planDigest: plan.planDigest,
    phase: "planned",
    operations: plan.targets.map((target) => ({
      path: target.path,
      operation: target.operation,
      preimage: {
        kind: target.preimage.kind,
        digest: target.preimage.digest,
        mode: target.preimage.mode,
      },
      resultDigest: target.resultDigest,
      resultMode: target.mode,
      backupId: null,
      stagedId: null,
      applied: false,
    })),
    lock: null,
    ignoreFiles: [...plan.ignoreFiles],
  };

  // 5. Setup: a failure here is typed and cleans only the owned directory.
  try {
    mkdirSync(absOf(plan.root, transactionDir(plan.stateDir, transactionId)), {
      recursive: true,
      mode: 0o700,
    });
    fireHooks(hooks, "before", "transaction:create", transactionId);
  } catch (error) {
    removeTransaction(plan, transactionId);
    return {
      kind: "refused",
      transactionId,
      issues: [
        issue(
          "APPLY_SETUP_FAILED",
          `could not create the owned transaction directory: ${error instanceof Error ? error.message : String(error)}`,
        ),
      ],
    };
  }

  const staged = stageOperations(
    plan.root,
    plan.stateDir,
    transactionId,
    plan.targets.map((target) => ({
      path: target.path,
      operation: target.operation,
      bytes: target.bytes,
      mode: target.mode,
    })),
    hooks,
  );
  if (!staged.ok) {
    removeTransaction(plan, transactionId);
    return { kind: "refused", transactionId, issues: staged.issues };
  }

  const prepared = prepareJournal(journal, staged.value.records);
  // Create the remaining absent generated ancestry this attempt owns, and
  // record every owned directory's exact identity so rollback removes only
  // empty directories this attempt made.
  const coordinationPaths = new Set(ownedCreated.map((entry) => entry.path));
  const created = createOwnedAncestors(
    plan.root,
    ownedAncestorCandidates(plan).filter(
      (ancestor) =>
        ancestor.kind === "absent" && !coordinationPaths.has(ancestor.path),
    ),
    hooks,
  );
  if (created.issues.length > 0) {
    removeOwnedAncestors(plan.root, created.created, hooks);
    removeTransaction(plan, transactionId);
    return { kind: "refused", transactionId, issues: [...created.issues] };
  }
  ownedCreated.push(...created.created);
  const preparedWithAncestry: TransactionJournal = {
    ...prepared,
    // Only the extra generated ancestry this attempt created is recorded for
    // recovery; the coordination state-directory chain is transient and is
    // removed by the guarded release/cleanup path.
    createdDirs: created.created,
  };
  try {
    persistJournal(
      plan.root,
      journalPath(plan.stateDir, transactionId),
      preparedWithAncestry,
      hooks,
    );
  } catch (error) {
    removeOwnedAncestors(plan.root, ownedCreated, hooks);
    removeTransaction(plan, transactionId);
    return {
      kind: "refused",
      transactionId,
      issues: [
        issue(
          "APPLY_PREPARATION_FAILED",
          `could not persist the prepared journal: ${error instanceof Error ? error.message : String(error)}`,
        ),
      ],
    };
  }

  // 6. Re-prove the physical authority and preimages after staging but before
  //    any live replacement, so an edit made during staging is refused rather
  //    than overwritten.
  const rechecked = revalidatePreimages(
    plan.root,
    [...plan.targets.map((target) => target.preimage), plan.lock.preimage],
    {
      root: plan.readset.root,
      ancestors: plan.readset.ancestors,
      files: plan.readset.files,
      installed: plan.readset.installed,
    },
  );
  if (!rechecked.ok) {
    removeTransaction(plan, transactionId);
    return { kind: "refused", transactionId, issues: rechecked.issues };
  }

  const replaced = applyReplacements(
    plan.root,
    plan.stateDir,
    preparedWithAncestry,
    staged.value,
    hooks,
  );
  if (!replaced.ok) {
    const recovered = recoverTransactionsUnderLock(plan, transactionId, hooks);
    return {
      kind: "refused",
      transactionId,
      issues: [...replaced.issues, ...recovered],
    };
  }

  const published = publishLock(
    plan.root,
    plan.stateDir,
    replaced.journal,
    plan.lock.bytes,
    plan.lock.preimage.mode ?? 0o644,
    {
      stateDir: plan.stateDir,
      uiDir: plan.uiDir,
      stylesDir: plan.stylesDir,
      layoutFile: plan.layoutFile,
    },
    hooks,
  );
  if (!published.ok) {
    if (published.journal.phase === "published") {
      return {
        kind: "committed_needs_cleanup",
        transactionId,
        issues: published.issues,
      };
    }
    const state = classifyApplyPublication(plan, published.journal);
    if (state === "published") {
      return {
        kind: "committed_needs_cleanup",
        transactionId,
        issues: published.issues,
      };
    }
    if (state === "ambiguous") {
      return {
        kind: "refused",
        transactionId,
        issues: [
          ...published.issues,
          issue(
            "RECOVERY_AMBIGUOUS_PUBLICATION",
            "the canonical lock publication outcome is ambiguous; refusing to roll back or discard evidence",
            lockPath(plan.stateDir),
          ),
        ],
      };
    }
    const recovered = recoverTransactionsUnderLock(plan, transactionId, hooks);
    return {
      kind: "refused",
      transactionId,
      issues: [...published.issues, ...recovered],
    };
  }

  const cleanup = cleanupTransaction(
    plan.root,
    plan.stateDir,
    published.journal,
    hooks,
  );
  if (!cleanup.ok) {
    return {
      kind: "committed_needs_cleanup",
      transactionId,
      issues: cleanup.issues,
    };
  }
  return { kind: "applied", transactionId, issues: [] };
}

/**
 * Classify a failed lock publication from the physical rename witness. Only a
 * matching staged identity proves publication; a matching preimage identity
 * proves non-publication; anything else is an ambiguity that must not roll
 * back or discard evidence.
 */
function classifyApplyPublication(
  plan: ValidatedApplyPlan,
  journal: TransactionJournal,
): PublicationState | "none" {
  if (journal.phase !== "applied" || journal.lock === null) return "none";
  const intentRead = readPublicationIntent(
    plan.root,
    publicationIntentPath(plan.stateDir, journal.transactionId),
  );
  if (Array.isArray(intentRead)) return "ambiguous";
  const canonicalDigest = (() => {
    try {
      return sha256Hex(readFileSync(absOf(plan.root, lockPath(plan.stateDir))));
    } catch {
      return null;
    }
  })();
  const stagedIdentity = observeFileIdentity(
    absOf(
      plan.root,
      `${stagedDir(plan.stateDir, journal.transactionId)}/kit.lock.json`,
    ),
  );
  return classifyPublication({
    intent: intentRead,
    canonical: observeFileIdentity(absOf(plan.root, lockPath(plan.stateDir))),
    stagedIdentity,
    expectedDigest: journal.lock.digest,
    canonicalDigest,
  });
}

function recoverTransactionsUnderLock(
  plan: ValidatedApplyPlan,
  transactionId: string,
  hooks?: TransactionHooks,
): ModelIssue[] {
  const recovered = recoverTransactions(
    plan.root,
    plan.stateDir,
    {
      uiDir: plan.uiDir,
      stylesDir: plan.stylesDir,
      layoutFile: plan.layoutFile,
    },
    hooks,
  );
  return recovered.flatMap((entry) => entry.issues);
}

function removeTransaction(
  plan: ValidatedApplyPlan,
  transactionId: string,
): void {
  const dir = absOf(plan.root, transactionDir(plan.stateDir, transactionId));
  rmSync(dir, { recursive: true, force: true });
  // The removal must be durable in the transaction namespace so a crash cannot
  // resurrect an owned transaction directory this attempt abandoned.
  try {
    flushDirectory(path.dirname(dir));
  } catch {
    // The namespace may already be gone; removal is still best effort here.
  }
}

/**
 * Best-effort removal of empty owned transient directories after release, so a
 * fresh initialization that only created transient state does not leave hidden
 * residue. Only empty directories are removed; unexpected entries survive.
 *
 * The removal of each empty directory is flushed in its parent. If that flush
 * fails, the removal may not be durable, so destructive progress stops and a
 * typed issue is returned; the surviving namespace is retained as evidence.
 */
function cleanupEmptyTransient(plan: ValidatedApplyPlan): ModelIssue[] {
  const issues: ModelIssue[] = [];
  for (const [logical, parent] of [
    [transactionsDir(plan.stateDir), transientRoot(plan.stateDir)],
    [transientRoot(plan.stateDir), plan.stateDir],
  ] as const) {
    try {
      rmdirSync(absOf(plan.root, logical));
    } catch (error) {
      const code = errorCode(error);
      // A real I/O, permission or kind fault while removing an empty owned
      // directory is not a clean absence or a non-empty guard: report it and
      // stop destructive progress rather than reporting a false clean success.
      if (isEmptyRemovalAbsence(code)) continue;
      issues.push(
        issue(
          "COMMITTED_NEEDS_CLEANUP",
          `owned transient directory ${logical} could not be removed (${code})`,
          logical,
        ),
      );
      return issues;
    }
    // Durable removal of the now-empty owned transient directory in its parent.
    try {
      flushDirectory(absOf(plan.root, parent));
    } catch (error) {
      issues.push(
        issue(
          "COMMITTED_NEEDS_CLEANUP",
          `owned transient directory ${logical} was removed but its parent could not be flushed durably (${errorCode(error)})`,
          logical,
        ),
      );
      return issues;
    }
  }
  return issues;
}

// Kept for import stability with the sealed-authority readers.
export type { PlanAncestor, PlanReadFile, PhysicalIdentity };
export { identityDigest };
