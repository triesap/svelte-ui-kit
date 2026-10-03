/**
 * Recoverable transaction states and owned transient paths (S064).
 *
 * A write invocation is one guarded, recoverable batch. Before any mutating
 * command is exposed this module freezes the safety model: the ordered phases
 * a transaction may occupy, the only legal transitions between them, the
 * terminal dispositions, the internal transient paths and modes, and the
 * distinct identities used to prove ownership and publication.
 *
 * This is a type-only/decision module: importing it reads or writes nothing and
 * starts no writer. A dry-run/planner path never constructs a transaction, so
 * `planned` is an internal staging state reached only after exclusive
 * coordination, never a synonym for a read-only plan.
 */
import { randomUUID } from "node:crypto";

/** Ordered internal transaction phases. */
export type TransactionPhase =
  "planned" | "prepared" | "applied" | "published" | "cleaned" | "rolled_back";

export const TRANSACTION_PHASES: readonly TransactionPhase[] = [
  "planned",
  "prepared",
  "applied",
  "published",
  "cleaned",
  "rolled_back",
];

/**
 * The frozen state table. `applied`/`prepared` may be rolled back by recovery;
 * a published transaction may only be cleaned. A `planned` transaction has
 * written no live bytes, so recovery discards it rather than restoring.
 */
export const TRANSACTION_TRANSITIONS: Readonly<
  Record<TransactionPhase, readonly TransactionPhase[]>
> = {
  planned: ["prepared", "cleaned"],
  prepared: ["applied", "rolled_back"],
  applied: ["published", "rolled_back"],
  published: ["cleaned"],
  cleaned: [],
  rolled_back: [],
};

/** True when `to` is an allowed successor of `from`. */
export function canTransition(
  from: TransactionPhase,
  to: TransactionPhase,
): boolean {
  return TRANSACTION_TRANSITIONS[from].includes(to);
}

/** Reject an impossible or ambiguous phase outcome. */
export function assertTransition(
  from: TransactionPhase,
  to: TransactionPhase,
): void {
  if (!canTransition(from, to)) {
    throw new Error(`illegal transaction transition: ${from} -> ${to}`);
  }
}

/** Terminal phases never transition and never mutate live state again. */
export function isTerminalPhase(phase: TransactionPhase): boolean {
  return phase === "cleaned" || phase === "rolled_back";
}

/** True for phases that may still mutate live application targets. */
export function isMutatingPhase(phase: TransactionPhase): boolean {
  return phase === "prepared" || phase === "applied";
}

/** The classified outcome of one guarded apply attempt. */
export type TransactionOutcomeKind =
  "no_change" | "applied" | "committed_needs_cleanup" | "refused";

/**
 * A distinct transaction identity. `transactionId` is unique per attempt; it is
 * what proves ownership and publication, so two attempts that would publish
 * equal lock bytes remain distinguishable. Byte equality alone is never treated
 * as a unique transaction identity.
 */
export interface TransactionIdentity {
  readonly transactionId: string;
  /** Exact-byte digest of the selected root/plan preimages. */
  readonly rootIdentity: string;
  /** Canonical digest of the complete validated plan. */
  readonly planDigest: string;
}

const TRANSACTION_ID = /^[0-9a-f][0-9a-f-]{15,63}$/;

/** True for a well-formed internal transaction identifier. */
export function isTransactionId(value: unknown): value is string {
  return typeof value === "string" && TRANSACTION_ID.test(value);
}

/** Create a fresh identity. The transient id never appears in CLI output. */
export function createTransactionIdentity(
  rootIdentity: string,
  planDigest: string,
): TransactionIdentity {
  return { transactionId: randomUUID(), rootIdentity, planDigest };
}

/**
 * The internal transient namespace, inside the reserved `_kit` state directory
 * and deliberately separate from semantic committed metadata (`kit.json`,
 * `kit.lock.json` and the contract metadata).
 */
export const TRANSIENT_NAMESPACE = ".svelte-ui-kit";

/** Modes for owned transient directories and files. */
export const OWNED_DIR_MODE = 0o700;
export const JOURNAL_MODE = 0o600;
export const STAGED_FILE_MODE = 0o600;

/**
 * The narrowly approved application ignore files the guarded plan may update.
 * The managed transient-namespace ignore entry is the only ignore edit the
 * protocol performs, so validation and recovery accept exactly this file and
 * refuse any other journal-claimed ignore target.
 */
export const APPROVED_IGNORE_FILES: readonly string[] = [".gitignore"];

/** The managed ignore entry for the transient namespace (no leading slash). */
export function ignoreEntryFor(stateDir: string): string {
  return `${stateDir}/${TRANSIENT_NAMESPACE}/`;
}

export function transientRoot(stateDir: string): string {
  return `${stateDir}/${TRANSIENT_NAMESPACE}`;
}

export function writerLockDir(stateDir: string): string {
  return `${transientRoot(stateDir)}/writer.lock`;
}

export function transactionsDir(stateDir: string): string {
  return `${transientRoot(stateDir)}/transactions`;
}

export function transactionDir(
  stateDir: string,
  transactionId: string,
): string {
  return `${transactionsDir(stateDir)}/${transactionId}`;
}

export function journalPath(stateDir: string, transactionId: string): string {
  return `${transactionDir(stateDir, transactionId)}/journal.json`;
}

/**
 * The one exact temporary journal name this transaction may ever create.
 * Ownership is the recorded transaction id, not a `journal.json.tmp-` prefix:
 * an unrelated notes file that merely resembles a temporary journal is not
 * owned and must be preserved.
 */
export function journalTempName(transactionId: string): string {
  return `journal.json.tmp-${transactionId}`;
}

/**
 * The durable publication-intent witness, written before the canonical lock
 * rename and removed with the owned transaction state.
 */
export function publicationIntentPath(
  stateDir: string,
  transactionId: string,
): string {
  return `${transactionDir(stateDir, transactionId)}/publication.json`;
}

/** The one exact temporary publication-intent name this transaction may create. */
export function publicationIntentTempName(transactionId: string): string {
  return `publication.json.tmp-${transactionId}`;
}

export function stagedDir(stateDir: string, transactionId: string): string {
  return `${transactionDir(stateDir, transactionId)}/staged`;
}

export function backupsDir(stateDir: string, transactionId: string): string {
  return `${transactionDir(stateDir, transactionId)}/backups`;
}

export function progressDir(stateDir: string, transactionId: string): string {
  return `${transactionDir(stateDir, transactionId)}/progress`;
}

/**
 * The canonical publication path. It is semantic committed metadata and lives
 * directly in the reserved state directory, never in the transient namespace.
 */
export function lockPath(stateDir: string): string {
  return `${stateDir}/kit.lock.json`;
}
