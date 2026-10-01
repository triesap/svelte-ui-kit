import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import {
  classifyOwnership,
  type OwnershipDisposition,
} from "../../src/codegen/ownership-policy.js";

/**
 * S043 tests: the frozen ownership matrix is data-driven and every equality,
 * absence and adoption case has exactly one disposition. No case grants an
 * overwrite of custom content, and local=incoming is covered explicitly.
 */

interface OwnershipCase {
  readonly id: string;
  readonly tracked: boolean;
  readonly base: string | null;
  readonly local: string | null;
  readonly incoming: string | null;
  readonly disposition: OwnershipDisposition;
}

const fixture = JSON.parse(
  readFileSync(
    path.join(process.cwd(), "tests", "fixtures", "ownership-cases.json"),
    "utf8",
  ),
) as {
  readonly schemaVersion: number;
  readonly cases: readonly OwnershipCase[];
};

function toBytes(value: string | null): Uint8Array | null {
  return value === null ? null : new TextEncoder().encode(value);
}

test("the fixture has a unique case for every disposition", () => {
  assert.equal(fixture.schemaVersion, 1);
  const ids = fixture.cases.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length, "case ids are unique");
  assert.ok(fixture.cases.length >= 10);
});

test("every fixture case matches the frozen matrix", () => {
  for (const entry of fixture.cases) {
    const actual = classifyOwnership({
      tracked: entry.tracked,
      base: toBytes(entry.base),
      local: toBytes(entry.local),
      incoming: toBytes(entry.incoming),
    });
    assert.equal(actual, entry.disposition, entry.id);
  }
});

test("local=incoming is covered explicitly", () => {
  const equalCases = fixture.cases.filter(
    (entry) =>
      entry.local !== null &&
      entry.local === entry.incoming &&
      entry.disposition === "no_change",
  );
  assert.ok(
    equalCases.length >= 2,
    JSON.stringify(equalCases.map((e) => e.id)),
  );
});

test("no fixture case grants an overwrite of custom content", () => {
  for (const entry of fixture.cases) {
    const hasCustomContent =
      entry.local !== null &&
      (entry.base === null || entry.local !== entry.base) &&
      entry.local !== entry.incoming;
    if (!hasCustomContent) continue;
    assert.notEqual(entry.disposition, "update", entry.id);
    assert.notEqual(entry.disposition, "no_change", entry.id);
  }
});

test("an existing untracked target never adopts or deletes", () => {
  for (const entry of fixture.cases) {
    if (entry.tracked || entry.local === null) continue;
    assert.equal(entry.disposition, "untracked_conflict", entry.id);
  }
});

test("a missing tracked target is always a conflict", () => {
  for (const entry of fixture.cases) {
    if (!entry.tracked || entry.local !== null) continue;
    assert.equal(entry.disposition, "conflict", entry.id);
  }
});
