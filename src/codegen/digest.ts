/**
 * Content digests.
 *
 * `sha256Hex` hashes exact bytes: a string is hashed as its UTF-8 bytes, so a
 * CRLF file and its LF twin produce different digests. `canonicalContentHash`
 * hashes the canonical semantic JSON of a tool-generated value. Both return a
 * lowercase 64-hex digest; the two meanings are named distinctly and never
 * conflated.
 */
import { createHash } from "node:crypto";

import { canonicalJson } from "./serialize.js";

/** Exact-byte SHA-256 of a UTF-8 string or raw bytes, lowercase 64-hex. */
export function sha256Hex(input: string | Uint8Array): string {
  return createHash("sha256").update(input).digest("hex");
}

/** SHA-256 over the canonical semantic JSON of `value`. */
export function canonicalContentHash(value: unknown): string {
  return sha256Hex(canonicalJson(value));
}
