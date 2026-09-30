import assert from "node:assert/strict";
import { test } from "node:test";

import { canonicalContentHash, sha256Hex } from "../../src/codegen/digest.js";
import { canonicalJson } from "../../src/codegen/serialize.js";

/**
 * S024 tests: exact-byte hashes are lowercase 64-hex and distinguish CRLF from
 * LF, while canonical semantic hashes are stable and key-order independent.
 */

test("known SHA-256 vectors match", () => {
  assert.equal(
    sha256Hex(""),
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  );
  assert.equal(
    sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

test("a string is hashed as its UTF-8 bytes and stays lowercase 64-hex", () => {
  const digest = sha256Hex("café π");
  assert.match(digest, /^[0-9a-f]{64}$/);
  assert.equal(digest, sha256Hex(Buffer.from("café π", "utf8")));
});

test("exact-byte hashing distinguishes CRLF from LF", () => {
  assert.notEqual(sha256Hex("a\r\nb"), sha256Hex("a\nb"));
  // The digest of the exact bytes equals hashing the same bytes via a buffer.
  assert.equal(sha256Hex("a\r\nb"), sha256Hex(Buffer.from("a\r\nb", "utf8")));
});

test("raw bytes are hashed exactly", () => {
  const bytes = Uint8Array.from([0, 1, 2, 253, 254, 255]);
  assert.match(sha256Hex(bytes), /^[0-9a-f]{64}$/);
  assert.equal(sha256Hex(bytes), sha256Hex(Buffer.from(bytes)));
});

test("canonical content hashing is semantic, not exact-byte", () => {
  const left = { b: 2, a: 1 };
  const right = { a: 1, b: 2 };
  assert.equal(canonicalContentHash(left), canonicalContentHash(right));
  assert.equal(canonicalContentHash(left), sha256Hex(canonicalJson(right)));
  // It is named distinctly from the exact-byte hash and never includes itself.
  assert.notEqual(canonicalContentHash(left), sha256Hex(JSON.stringify(left)));
});

test("semantic hashing is stable across repeated calls", () => {
  const value = { items: [{ id: "button", version: "0.1.0" }] };
  assert.equal(canonicalContentHash(value), canonicalContentHash(value));
});
