/**
 * Durable write ordering helpers (RCLD04-R2-2).
 *
 * The frozen transaction model claims atomic per-file replacement, not native
 * multi-file atomicity. For an interrupted single-file rename to be recoverable
 * the bytes and their directory entries must be flushed in the documented
 * order: file data before the rename, the parent directory after it. These
 * helpers centralize the `open`/`fsync`/`close` sequence so staging, backups,
 * replacement, lock publication and recovery all use the same primitive.
 */
import { closeSync, fsyncSync, openSync } from "node:fs";

/** Flush one regular file's contents to stable storage. */
export function flushFile(abs: string): void {
  const fd = openSync(abs, "r");
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

/** Flush one directory's entry list to stable storage. */
export function flushDirectory(abs: string): void {
  const fd = openSync(abs, "r");
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

/**
 * Errno codes that legitimately mean an owned empty-namespace directory is
 * already absent or is not empty. These are ordinary, safe outcomes: the
 * directory is either gone or holds unrelated state that must never be
 * removed. Any other code (EIO, EACCES, EPERM, ENOTDIR, ELOOP, ...) is a real
 * I/O, permission or kind fault and must be reported instead of silently
 * treated as a clean removal.
 */
const ABSENT_OR_NON_EMPTY_CODES: ReadonlySet<string> = new Set([
  "ENOENT",
  "ENOTEMPTY",
  // Windows reports a non-empty directory removal as EEXIST in some cases.
  "EEXIST",
]);

/** True when a failed empty-directory removal is legitimate absence/non-empty state. */
export function isEmptyRemovalAbsence(code: string): boolean {
  return ABSENT_OR_NON_EMPTY_CODES.has(code);
}
