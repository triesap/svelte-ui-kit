import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { classifySource, hashBytes } from "../../src/codegen/compare.js";

/**
 * S044 tests: the pure byte classifier matches every frozen ownership fixture,
 * preserves exact-byte baseline semantics, and never mutates its inputs.
 */

interface OwnershipCase {
  readonly id: string;
  readonly tracked: boolean;
  readonly base: string | null;
  readonly local: string | null;
  readonly incoming: string | null;
  readonly disposition: string;
}

function fixture(): readonly OwnershipCase[] {
  const parsed = JSON.parse(
    readFileSync(
      path.join(process.cwd(), "tests", "fixtures", "ownership-cases.json"),
      "utf8",
    ),
  ) as { readonly cases: readonly OwnershipCase[] };
  return parsed.cases;
}

function toBytes(value: string | null): Uint8Array | null {
  return value === null ? null : new TextEncoder().encode(value);
}

test("every ownership fixture uses the pure byte classifier", () => {
  for (const entry of fixture()) {
    const classification = classifySource({
      tracked: entry.tracked,
      base: toBytes(entry.base),
      local: toBytes(entry.local),
      incoming: toBytes(entry.incoming),
    });
    assert.equal(classification.disposition, entry.disposition, entry.id);
  }
});

test("a local-only edit preserves the recorded base", () => {
  const classification = classifySource({
    tracked: true,
    base: toBytes("B"),
    local: toBytes("L"),
    incoming: toBytes("B"),
  });
  assert.equal(classification.disposition, "customized");
  assert.equal(classification.baseHash, hashBytes(toBytes("B")));
  assert.equal(classification.localHash, hashBytes(toBytes("L")));
});

test("both-different is a conflict and hashes stay distinct", () => {
  const classification = classifySource({
    tracked: true,
    base: toBytes("B"),
    local: toBytes("L"),
    incoming: toBytes("I"),
  });
  assert.equal(classification.disposition, "conflict");
  assert.notEqual(classification.baseHash, classification.localHash);
  assert.notEqual(classification.localHash, classification.incomingHash);
});

test("classification does not mutate its byte inputs", () => {
  const base = toBytes("B");
  const local = toBytes("L");
  const incoming = toBytes("I");
  const copies = [base, local, incoming].map((entry) =>
    entry === null ? null : Uint8Array.from(entry),
  );
  classifySource({ tracked: true, base, local, incoming });
  assert.deepEqual(base, copies[0]);
  assert.deepEqual(local, copies[1]);
  assert.deepEqual(incoming, copies[2]);
});
