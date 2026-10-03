/**
 * Durable publication intent and physical rename witness (RCLD04-R2-3).
 *
 * A byte digest alone cannot prove that the canonical lock rename happened:
 * equal bytes may be the untouched preimage, and an edited post-publication lock
 * has a different digest even though the publication did happen. This module
 * records, before the rename, the physical identity (device/inode) of the exact
 * canonical preimage and of the uniquely identified staged publication image,
 * and classifies the outcome from complete physical evidence.
 *
 * The intent is internal transient state in the owned transaction directory. It
 * is written durably before the rename and removed only with the rest of the
 * owned state. An identity that matches neither the preimage nor the staged
 * image, or a missing canonical lock after a possible publication, is an
 * ambiguity that must never authorize a rollback.
 */
import {
  lstatSync,
  openSync,
  readFileSync,
  writeSync,
  fsyncSync,
  closeSync,
  renameSync,
} from "node:fs";
import path from "node:path";

import type { ModelIssue } from "../registry/errors.js";
import { isTransactionId } from "./transaction-types.js";

export interface PublicationIdentity {
  readonly device: number;
  readonly inode: number;
}

export interface PublicationIntent {
  readonly schemaVersion: 1;
  readonly transactionId: string;
  /** Digest of the exact intended canonical lock bytes. */
  readonly digest: string;
  /** Exact mode the publication rename is expected to leave on the canonical lock. */
  readonly mode: number;
  /** Physical identity of the canonical preimage, or null when it was absent. */
  readonly preimage: PublicationIdentity | null;
  /** Physical identity of the exact staged publication image. */
  readonly staged: PublicationIdentity | null;
}

export type PublicationState = "published" | "prepublication" | "ambiguous";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function identityRecord(
  value: unknown,
): PublicationIdentity | null | undefined {
  if (value === null) return null;
  if (
    isPlainObject(value) &&
    Number.isInteger(value["device"]) &&
    Number.isInteger(value["inode"])
  ) {
    return {
      device: value["device"] as number,
      inode: value["inode"] as number,
    };
  }
  return undefined;
}

function sameIdentity(
  left: PublicationIdentity | null,
  right: PublicationIdentity | null,
): boolean {
  return (
    left !== null &&
    right !== null &&
    left.device === right.device &&
    left.inode === right.inode
  );
}

/** Non-following physical identity of one existing regular file, or null. */
export function observeFileIdentity(abs: string): PublicationIdentity | null {
  try {
    const stats = lstatSync(abs);
    if (stats.isSymbolicLink() || !stats.isFile()) return null;
    return { device: stats.dev, inode: stats.ino };
  } catch {
    return null;
  }
}

/** Durable write of the publication intent (write, flush, rename, flush). */
export function writePublicationIntent(
  root: string,
  logicalPath: string,
  intent: PublicationIntent,
): void {
  const destination = path.join(root, ...logicalPath.split("/"));
  const dir = path.dirname(destination);
  const temporary = `${destination}.tmp-${intent.transactionId}`;
  const bytes = Buffer.from(`${JSON.stringify(intent)}\n`, "utf8");
  const fd = openSync(temporary, "wx", 0o600);
  try {
    writeSync(fd, bytes);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(temporary, destination);
  const dirFd = openSync(dir, "r");
  try {
    fsyncSync(dirFd);
  } finally {
    closeSync(dirFd);
  }
}

/** Strictly parse a publication intent; `null` when it is absent. */
export function readPublicationIntent(
  root: string,
  logicalPath: string,
): PublicationIntent | null | ModelIssue[] {
  const abs = path.join(root, ...logicalPath.split("/"));
  let text: string;
  try {
    text = readFileSync(abs, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException | null)?.code === "ENOENT") return null;
    return [
      {
        code: "PUBLICATION_INTENT_UNREADABLE",
        message: `the publication intent is unreadable (${(error as NodeJS.ErrnoException | null)?.code ?? "EIO"})`,
        locator: logicalPath,
      },
    ];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [
      {
        code: "PUBLICATION_INTENT_INVALID",
        message: "the publication intent is not valid JSON",
        locator: logicalPath,
      },
    ];
  }
  if (!isPlainObject(parsed)) {
    return [
      {
        code: "PUBLICATION_INTENT_INVALID",
        message: "the publication intent is not an object",
        locator: logicalPath,
      },
    ];
  }
  if (
    parsed["schemaVersion"] !== 1 ||
    !isTransactionId(parsed["transactionId"])
  ) {
    return [
      {
        code: "PUBLICATION_INTENT_INVALID",
        message: "the publication intent identity is invalid",
        locator: logicalPath,
      },
    ];
  }
  if (
    typeof parsed["digest"] !== "string" ||
    !/^[0-9a-f]{64}$/.test(parsed["digest"])
  ) {
    return [
      {
        code: "PUBLICATION_INTENT_INVALID",
        message: "the publication intent digest is invalid",
        locator: logicalPath,
      },
    ];
  }
  if (
    !Number.isInteger(parsed["mode"]) ||
    (parsed["mode"] as number) < 0 ||
    (parsed["mode"] as number) > 0o777
  ) {
    return [
      {
        code: "PUBLICATION_INTENT_INVALID",
        message: "the publication intent mode is invalid",
        locator: logicalPath,
      },
    ];
  }
  const preimage = identityRecord(parsed["preimage"]);
  const staged = identityRecord(parsed["staged"]);
  if (preimage === undefined || staged === undefined) {
    return [
      {
        code: "PUBLICATION_INTENT_INVALID",
        message: "the publication intent identities are invalid",
        locator: logicalPath,
      },
    ];
  }
  return {
    schemaVersion: 1,
    transactionId: parsed["transactionId"] as string,
    digest: parsed["digest"] as string,
    mode: parsed["mode"] as number,
    preimage,
    staged,
  };
}

/**
 * Classify a possible publication from complete physical evidence. Byte
 * equality is never sufficient; only a matching staged identity proves the
 * rename happened, and only a matching preimage identity (or an absent
 * canonical with the staged image still present) proves it did not.
 */
export function classifyPublication(input: {
  readonly intent: PublicationIntent | null;
  readonly canonical: PublicationIdentity | null;
  readonly stagedStillPresent: boolean;
  readonly expectedDigest: string;
  readonly canonicalDigest: string | null;
}): PublicationState {
  if (input.intent !== null) {
    if (
      input.canonical !== null &&
      sameIdentity(input.canonical, input.intent.staged)
    ) {
      return "published";
    }
    // A recorded non-absent preimage that has since disappeared is not proof of
    // non-publication: someone removed the canonical lock after the intent. It
    // is contradictory evidence and must fail closed rather than roll back.
    if (
      input.canonical === null &&
      input.intent.preimage === null &&
      input.intent.staged !== null &&
      input.stagedStillPresent
    ) {
      return "prepublication";
    }
    if (
      input.canonical !== null &&
      sameIdentity(input.canonical, input.intent.preimage)
    ) {
      return "prepublication";
    }
    return "ambiguous";
  }
  // A legacy record without a physical witness can never prove a unique
  // publication. Byte equality is not a commit event, so it fails closed.
  return "ambiguous";
}
