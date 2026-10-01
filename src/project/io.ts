/**
 * Typed logical filesystem observations (S033–S038 I/O causes).
 *
 * Project metadata readers must never let a host filesystem exception escape
 * with an absolute path, and must not collapse a permission/parse failure into
 * "absent". These helpers use non-following `lstat` metadata, so symlinks and
 * other nonregular entries are observed rather than followed, and classify the
 * outcome into a small closed set the callers translate into typed model issues
 * with *logical* locators.
 *
 * The values here are deliberately independent of any diagnostic vocabulary:
 * they carry a stable machine code (`code`) for I/O failures but never a
 * host path.
 */
import { lstatSync, readFileSync, type Stats } from "node:fs";

/** A non-following observation of one filesystem entry. */
export type EntryObservation =
  | { readonly kind: "absent" }
  | { readonly kind: "file"; readonly stats: Stats }
  | { readonly kind: "directory"; readonly stats: Stats }
  | { readonly kind: "symlink"; readonly stats: Stats }
  | { readonly kind: "other"; readonly stats: Stats }
  | { readonly kind: "unreadable"; readonly code: string };

/** Stable machine code for an unexpected non-ENOENT metadata failure. */
function codeOf(error: unknown): string {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return typeof code === "string" ? code : "EIO";
}

/**
 * Observe one entry with `lstat`, distinguishing absence from every other
 * outcome. Only `ENOENT` is absence; a permission or other error is a typed
 * `unreadable` cause, and no host path is retained.
 */
export function observeEntry(abs: string): EntryObservation {
  let stats: Stats;
  try {
    stats = lstatSync(abs);
  } catch (error) {
    if ((error as NodeJS.ErrnoException | null)?.code === "ENOENT") {
      return { kind: "absent" };
    }
    return { kind: "unreadable", code: codeOf(error) };
  }
  if (stats.isSymbolicLink()) return { kind: "symlink", stats };
  if (stats.isDirectory()) return { kind: "directory", stats };
  if (stats.isFile()) return { kind: "file", stats };
  return { kind: "other", stats };
}

/** True only for an existing regular, non-symlink file. */
export function isRegularFile(abs: string): boolean {
  return observeEntry(abs).kind === "file";
}

/** True only for an existing real directory (not a symlink). */
export function isRealDirectory(abs: string): boolean {
  return observeEntry(abs).kind === "directory";
}

/** A JSON-object read outcome, distinguishing every failure mode. */
export type JsonObservation =
  | { readonly kind: "absent" }
  | { readonly kind: "unsafe" }
  | { readonly kind: "unreadable"; readonly code: string }
  | { readonly kind: "malformed" }
  | { readonly kind: "value"; readonly value: Record<string, unknown> };

/**
 * Read a regular JSON file as an object. A symlink, directory or other
 * nonregular entry is `unsafe` and is never read, so a FIFO cannot block the
 * process. A non-ENOENT read/permission failure is `unreadable` with its code;
 * invalid JSON or a non-object top level is `malformed`.
 */
export function readJsonObject(abs: string): JsonObservation {
  const entry = observeEntry(abs);
  if (entry.kind === "absent") return { kind: "absent" };
  if (entry.kind === "unreadable") return entry;
  if (entry.kind !== "file") return { kind: "unsafe" };

  let text: string;
  try {
    text = readFileSync(abs, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException | null)?.code === "ENOENT") {
      return { kind: "absent" };
    }
    return { kind: "unreadable", code: codeOf(error) };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { kind: "malformed" };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { kind: "malformed" };
  }
  return { kind: "value", value: parsed as Record<string, unknown> };
}
