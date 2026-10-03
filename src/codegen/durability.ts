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
