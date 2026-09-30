/**
 * Lexical logical-path validation (shared by configuration and lock models).
 *
 * These checks are deliberately lexical: they reject obvious escape forms
 * (absolute, drive/UNC, separator confusion, empty/`.`/`..` segments and
 * control characters) before any filesystem resolution. They say nothing about
 * symlinks, ancestry or existence; real filesystem containment is a distinct
 * later gate.
 *
 * Overlap helpers compare logical targets with ASCII case folding so a
 * collision that would only appear on a case-insensitive filesystem is caught
 * on a case-sensitive development machine. Overlap is segment-aware, so
 * `a/kit` and `a/kit-extra` are siblings, not overlapping targets.
 */

const WINDOWS_DRIVE = /^[A-Za-z]:/;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

/** True for a safe, non-empty, relative logical path. */
export function isSafeLogicalRelativePath(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  if (value.startsWith("/") || value.includes("\\")) return false;
  if (WINDOWS_DRIVE.test(value)) return false;
  if (CONTROL_CHARACTERS.test(value)) return false;
  return value
    .split("/")
    .every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

/** ASCII-only case fold; locale independent and stable across platforms. */
export function asciiFold(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => letter.toLowerCase());
}

/** Split a validated logical path into its non-empty segments. */
export function logicalSegments(value: string): readonly string[] {
  return value.split("/").filter((segment) => segment !== "");
}

/**
 * True when `candidate` is lexically equal to, or nested below, `root`.
 * Comparison is ASCII-folded and segment-aware.
 */
export function isSameOrBelow(candidate: string, root: string): boolean {
  const foldedCandidate = asciiFold(candidate);
  const foldedRoot = asciiFold(root);
  if (foldedCandidate === foldedRoot) return true;
  return foldedRoot !== "" && foldedCandidate.startsWith(`${foldedRoot}/`);
}

/**
 * True when two logical paths overlap: they are equal or one is nested below
 * the other. Prefix siblings such as `a/kit` and `a/kit-extra` do not overlap.
 */
export function pathsOverlap(left: string, right: string): boolean {
  return isSameOrBelow(left, right) || isSameOrBelow(right, left);
}
