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
/**
 * Windows-reserved device names, with or without an extension. These are not
 * portable across supported platforms because opening them can address a
 * device rather than a file in the working directory.
 */
const RESERVED_SEGMENT = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;

/**
 * True when one already-split logical segment is portable. A segment must be
 * non-empty, must not be `.` or `..`, must be free of control characters and
 * the `:` character, must not end in a dot or space (both are silently
 * stripped by Windows), and must not be a reserved device name (ASCII case
 * insensitively, with or without an extension).
 */
export function isPortableLogicalSegment(segment: string): boolean {
  if (segment.length === 0) return false;
  if (segment === "." || segment === "..") return false;
  if (CONTROL_CHARACTERS.test(segment)) return false;
  if (segment.includes(":")) return false;
  if (/[. ]$/.test(segment)) return false;
  if (RESERVED_SEGMENT.test(segment)) return false;
  return true;
}

/**
 * Describe the first non-portable segment of a candidate path as a safe,
 * JSON-quoted value for diagnostics. Returns `null` when the value is a safe
 * logical relative path. Unsafe input is never echoed as a raw locator.
 */
export function unsafeLogicalSegment(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) {
    return JSON.stringify(value);
  }
  if (value.startsWith("/") || value.includes("\\")) {
    return JSON.stringify(value);
  }
  if (WINDOWS_DRIVE.test(value)) {
    return JSON.stringify(value);
  }
  for (const segment of value.split("/")) {
    if (!isPortableLogicalSegment(segment)) return JSON.stringify(segment);
  }
  return null;
}

/** True for a safe, non-empty, relative logical path. */
export function isSafeLogicalRelativePath(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  if (value.startsWith("/") || value.includes("\\")) return false;
  if (WINDOWS_DRIVE.test(value)) return false;
  return value.split("/").every(isPortableLogicalSegment);
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
