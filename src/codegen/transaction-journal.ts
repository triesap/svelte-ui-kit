/**
 * Strict transient journal and coordination records (S065, S069).
 *
 * Recovery inputs are treated exactly as strictly as committed lock metadata:
 * a journal is parsed field by field, every target is validated against the
 * approved generated roots, and corrupt, forged or unknown state is refused
 * before any restoration is attempted. The journal is internal transient state;
 * its fields never appear in the semantic CLI envelope.
 *
 * `serializeJournal` produces canonical JSON so a prepared record is
 * deterministic. `persistJournal` implements the documented durability order
 * (write, flush the file, rename, flush the parent directory) used before live
 * replacement begins.
 */
import {
  mkdirSync,
  openSync,
  writeSync,
  fsyncSync,
  closeSync,
  renameSync,
} from "node:fs";
import path from "node:path";

import { sha256Hex } from "./digest.js";
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import { isSafeLogicalRelativePath, pathsOverlap } from "../project/paths.js";
import { canonicalJson } from "./serialize.js";
import type { ChangeOperation } from "./plan.js";
import { fireHooks, type TransactionHooks } from "./transaction-hooks.js";
import {
  isTransactionId,
  lockPath,
  TRANSACTION_PHASES,
  type TransactionPhase,
} from "./transaction-types.js";

const HEX64 = /^[0-9a-f]{64}$/;
const SAFE_ID = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const EMPTY_DIGEST = sha256Hex(new Uint8Array(0));

export interface JournalPreimage {
  readonly kind: "absent" | "file";
  readonly digest: string | null;
  readonly mode: number | null;
}

export interface JournalOperationRecord {
  readonly path: string;
  readonly operation: ChangeOperation;
  readonly preimage: JournalPreimage;
  /** Exact digest of the intended result bytes (empty bytes for a retire). */
  readonly resultDigest: string;
  readonly resultMode: number;
  readonly backupId: string | null;
  readonly stagedId: string | null;
  readonly applied: boolean;
}

export interface JournalLockRecord {
  readonly path: string;
  readonly digest: string;
  readonly published: boolean;
  readonly unchanged: boolean;
}

export interface TransactionJournal {
  readonly schemaVersion: 1;
  readonly transactionId: string;
  readonly rootIdentity: string;
  readonly planDigest: string;
  readonly phase: TransactionPhase;
  readonly operations: readonly JournalOperationRecord[];
  readonly lock: JournalLockRecord | null;
}

const JOURNAL_KEYS = [
  "schemaVersion",
  "transactionId",
  "rootIdentity",
  "planDigest",
  "phase",
  "operations",
  "lock",
] as const;
const OPERATION_KEYS = [
  "path",
  "operation",
  "preimage",
  "resultDigest",
  "resultMode",
  "backupId",
  "stagedId",
  "applied",
] as const;
const PREIMAGE_KEYS = ["kind", "digest", "mode"] as const;
const LOCK_KEYS = ["path", "digest", "published", "unchanged"] as const;

function exactlyKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  problems: string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    !actual.every((key, index) => key === expected[index])
  ) {
    problems.push(`${label} keys must be exactly ${keys.join(", ")}`);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const OPERATIONS: readonly ChangeOperation[] = ["create", "update", "retire"];

/** Strictly parse one journal document, rejecting corrupt or unknown state. */
export function parseJournal(text: string): ModelResult<TransactionJournal> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return fail([
      issue(
        "JOURNAL_MALFORMED",
        `journal is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
        "journal.json",
      ),
    ]);
  }
  if (!isPlainObject(parsed)) {
    return fail([
      issue(
        "JOURNAL_MALFORMED",
        "journal must be a JSON object",
        "journal.json",
      ),
    ]);
  }
  const problems: string[] = [];
  exactlyKeys(parsed, JOURNAL_KEYS, problems, "journal");

  if (parsed["schemaVersion"] !== 1) {
    problems.push("journal schemaVersion must be 1");
  }
  if (!isTransactionId(parsed["transactionId"])) {
    problems.push("journal transactionId is not a valid identifier");
  }
  if (!HEX64.test(String(parsed["rootIdentity"]))) {
    problems.push("journal rootIdentity must be a lowercase 64-hex digest");
  }
  if (!HEX64.test(String(parsed["planDigest"]))) {
    problems.push("journal planDigest must be a lowercase 64-hex digest");
  }
  if (!TRANSACTION_PHASES.includes(parsed["phase"] as TransactionPhase)) {
    problems.push(`journal phase is unknown: ${String(parsed["phase"])}`);
  }
  if (!Array.isArray(parsed["operations"])) {
    problems.push("journal operations must be an array");
  }

  const seenPaths = new Set<string>();
  const operations: JournalOperationRecord[] = [];
  if (Array.isArray(parsed["operations"])) {
    for (const [index, raw] of parsed["operations"].entries()) {
      if (!isPlainObject(raw)) {
        problems.push(`journal operations[${index}] must be an object`);
        continue;
      }
      const label = `journal operations[${index}]`;
      exactlyKeys(raw, OPERATION_KEYS, problems, label);
      const target = raw["path"];
      if (!isSafeLogicalRelativePath(target)) {
        problems.push(`${label} path is not a safe logical relative path`);
      } else {
        const folded = target.toLowerCase();
        if (seenPaths.has(folded)) {
          problems.push(`${label} duplicates target ${target}`);
        }
        seenPaths.add(folded);
      }
      const operation = raw["operation"];
      if (!OPERATIONS.includes(operation as ChangeOperation)) {
        problems.push(`${label} operation is unknown: ${String(operation)}`);
      }
      const preimage = raw["preimage"];
      if (!isPlainObject(preimage)) {
        problems.push(`${label} preimage must be an object`);
      } else {
        exactlyKeys(preimage, PREIMAGE_KEYS, problems, `${label} preimage`);
        if (preimage["kind"] !== "absent" && preimage["kind"] !== "file") {
          problems.push(`${label} preimage kind is unknown`);
        }
        if (
          preimage["digest"] !== null &&
          !HEX64.test(String(preimage["digest"]))
        ) {
          problems.push(`${label} preimage digest must be null or 64-hex`);
        }
        if (
          preimage["mode"] !== null &&
          (!Number.isInteger(preimage["mode"]) ||
            (preimage["mode"] as number) < 0 ||
            (preimage["mode"] as number) > 0o777)
        ) {
          problems.push(`${label} preimage mode must be null or a file mode`);
        }
        if (operation === "create" && preimage["kind"] !== "absent") {
          problems.push(`${label} create must record an absent preimage`);
        }
        if (operation !== "create" && preimage["kind"] !== "file") {
          problems.push(
            `${label} ${String(operation)} must record a file preimage`,
          );
        }
      }
      if (!HEX64.test(String(raw["resultDigest"]))) {
        problems.push(
          `${label} resultDigest must be a lowercase 64-hex digest`,
        );
      } else if (
        operation === "retire" &&
        raw["resultDigest"] !== EMPTY_DIGEST
      ) {
        problems.push(`${label} retire resultDigest must be the empty digest`);
      }
      if (
        !Number.isInteger(raw["resultMode"]) ||
        (raw["resultMode"] as number) < 0 ||
        (raw["resultMode"] as number) > 0o777
      ) {
        problems.push(`${label} resultMode must be a file mode`);
      }
      for (const idKey of ["backupId", "stagedId"] as const) {
        const value = raw[idKey];
        if (value !== null && !SAFE_ID.test(String(value))) {
          problems.push(`${label} ${idKey} must be null or a safe id`);
        }
      }
      if (typeof raw["applied"] !== "boolean") {
        problems.push(`${label} applied must be a boolean`);
      }
      operations.push({
        path: String(target),
        operation: operation as ChangeOperation,
        preimage: isPlainObject(preimage)
          ? {
              kind: preimage["kind"] as "absent" | "file",
              digest: (preimage["digest"] as string | null) ?? null,
              mode: (preimage["mode"] as number | null) ?? null,
            }
          : { kind: "file", digest: null, mode: null },
        resultDigest: String(raw["resultDigest"]),
        resultMode: Number(raw["resultMode"]),
        backupId: (raw["backupId"] as string | null) ?? null,
        stagedId: (raw["stagedId"] as string | null) ?? null,
        applied: raw["applied"] === true,
      });
    }
  }

  let lock: JournalLockRecord | null = null;
  const rawLock = parsed["lock"];
  if (rawLock !== null) {
    if (!isPlainObject(rawLock)) {
      problems.push("journal lock must be null or an object");
    } else {
      exactlyKeys(rawLock, LOCK_KEYS, problems, "journal lock");
      if (!isSafeLogicalRelativePath(rawLock["path"])) {
        problems.push("journal lock path is not a safe logical path");
      }
      if (!HEX64.test(String(rawLock["digest"]))) {
        problems.push("journal lock digest must be a lowercase 64-hex digest");
      }
      if (typeof rawLock["published"] !== "boolean") {
        problems.push("journal lock published must be a boolean");
      }
      if (typeof rawLock["unchanged"] !== "boolean") {
        problems.push("journal lock unchanged must be a boolean");
      }
      lock = {
        path: String(rawLock["path"]),
        digest: String(rawLock["digest"]),
        published: rawLock["published"] === true,
        unchanged: rawLock["unchanged"] === true,
      };
    }
  }

  if (problems.length > 0) {
    return fail(
      problems.map((message) =>
        issue("JOURNAL_INVALID", message, "journal.json"),
      ),
    );
  }

  return ok({
    schemaVersion: 1,
    transactionId: parsed["transactionId"] as string,
    rootIdentity: parsed["rootIdentity"] as string,
    planDigest: parsed["planDigest"] as string,
    phase: parsed["phase"] as TransactionPhase,
    operations,
    lock,
  });
}

/** Deterministic canonical JSON for one journal document. */
export function serializeJournal(journal: TransactionJournal): string {
  return canonicalJson(journal);
}

/**
 * Validate every journal target against the approved generated roots and the
 * canonical lock location. A target outside the roots, overlap with the
 * reserved transient namespace, or a lock path other than the canonical
 * `_kit/kit.lock.json` is refused.
 */
export function validateJournalTargets(
  journal: TransactionJournal,
  roots: {
    readonly uiDir: string;
    readonly stylesDir: string;
    readonly layoutFile: string;
    readonly stateDir: string;
  },
): ModelResult<TransactionJournal> {
  const problems = [];
  const transient = `${roots.stateDir}/.svelte-ui-kit`;
  for (const operation of journal.operations) {
    const target = operation.path;
    const within =
      isWithin(target, roots.uiDir) ||
      isWithin(target, roots.stylesDir) ||
      target === roots.layoutFile;
    if (!within) {
      problems.push(
        issue(
          "JOURNAL_TARGET_UNAPPROVED",
          `journal target ${target} is outside the approved generated roots`,
          target,
        ),
      );
    }
    if (pathsOverlap(target, transient)) {
      problems.push(
        issue(
          "JOURNAL_TARGET_UNAPPROVED",
          `journal target ${target} overlaps the reserved transient namespace`,
          target,
        ),
      );
    }
  }
  if (journal.lock !== null && journal.lock.path !== lockPath(roots.stateDir)) {
    problems.push(
      issue(
        "JOURNAL_LOCK_UNAPPROVED",
        `journal lock path must be ${lockPath(roots.stateDir)}`,
        journal.lock.path,
      ),
    );
  }
  return problems.length > 0 ? fail(problems) : ok(journal);
}

function isWithin(candidate: string, root: string): boolean {
  const foldedCandidate = candidate.toLowerCase();
  const foldedRoot = root.replace(/\/+$/, "").toLowerCase();
  return (
    foldedCandidate === foldedRoot ||
    foldedCandidate.startsWith(`${foldedRoot}/`)
  );
}

/**
 * Write the journal durably: a temporary sibling is written and flushed, then
 * atomically renamed over the destination and the parent directory is flushed.
 * The temporary file is never visible as the journal and is removed on rename
 * failure by the caller through the ordinary cleanup path.
 */
export function persistJournal(
  root: string,
  logicalJournalPath: string,
  journal: TransactionJournal,
  hooks?: TransactionHooks,
): void {
  const destination = path.join(root, ...logicalJournalPath.split("/"));
  const dir = path.dirname(destination);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const temporary = `${destination}.tmp-${journal.transactionId}`;
  const bytes = Buffer.from(serializeJournal(journal), "utf8");
  fireHooks(hooks, "before", "journal:write", logicalJournalPath);
  const fd = openSync(temporary, "wx", 0o600);
  try {
    writeSync(fd, bytes);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  fireHooks(hooks, "after", "journal:write", logicalJournalPath);
  renameSync(temporary, destination);
  fireHooks(hooks, "before", "journal:fsync", logicalJournalPath);
  const dirFd = openSync(dir, "r");
  try {
    fsyncSync(dirFd);
  } finally {
    closeSync(dirFd);
  }
  fireHooks(hooks, "after", "journal:fsync", logicalJournalPath);
}

/** Replace one journal phase immutably. */
export function withPhase(
  journal: TransactionJournal,
  phase: TransactionPhase,
): TransactionJournal {
  return { ...journal, phase };
}

/**
 * Record the prepared state (S069): attach the staged identifier produced by
 * staging, reserve a deterministic backup id for every update/retire preimage,
 * and move the phase to `prepared`. The returned journal is still pure; the
 * caller persists it durably before any live replacement begins.
 */
export function prepareJournal(
  journal: TransactionJournal,
  staged: readonly { readonly path: string; readonly stagedId: string }[],
): TransactionJournal {
  const stagedByPath = new Map(
    staged.map((entry) => [entry.path, entry.stagedId]),
  );
  return {
    ...journal,
    phase: "prepared",
    operations: journal.operations.map((operation, index) => ({
      ...operation,
      stagedId: stagedByPath.get(operation.path) ?? operation.stagedId,
      backupId:
        operation.operation === "create"
          ? null
          : (operation.backupId ?? `backup-${index}`),
    })),
  };
}

/**
 * Verify a prepared journal is complete enough for safe replacement/recovery:
 * it must be in the `prepared` phase, every create/update must name a staged
 * image and every update/retire must name a preimage backup. An incomplete
 * record is refused rather than treated as a recoverable batch.
 */
export function verifyPreparedJournal(
  journal: TransactionJournal,
): ModelResult<null> {
  const issues = [];
  if (journal.phase !== "prepared") {
    issues.push(
      issue(
        "PREPARATION_INCOMPLETE",
        `journal is in phase "${journal.phase}", not prepared`,
        "journal.json",
      ),
    );
  }
  for (const operation of journal.operations) {
    if (
      (operation.operation === "create" || operation.operation === "update") &&
      operation.stagedId === null
    ) {
      issues.push(
        issue(
          "PREPARATION_INCOMPLETE",
          `operation ${operation.path} has no staged identifier`,
          operation.path,
        ),
      );
    }
    if (
      (operation.operation === "update" || operation.operation === "retire") &&
      operation.backupId === null
    ) {
      issues.push(
        issue(
          "PREPARATION_INCOMPLETE",
          `operation ${operation.path} has no backup identifier`,
          operation.path,
        ),
      );
    }
  }
  return issues.length > 0 ? fail(issues) : ok(null);
}

/** Replace one journal operation record by target path. */
export function withOperation(
  journal: TransactionJournal,
  target: string,
  update: Partial<JournalOperationRecord>,
): TransactionJournal {
  return {
    ...journal,
    operations: journal.operations.map((operation) =>
      operation.path === target ? { ...operation, ...update } : operation,
    ),
  };
}

export { EMPTY_DIGEST };
