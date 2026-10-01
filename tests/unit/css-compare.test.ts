import assert from "node:assert/strict";
import { test } from "node:test";

import { hashBytes } from "../../src/codegen/compare.js";
import { classifyCssBlocks } from "../../src/codegen/css-compare.js";

/**
 * S049 tests: CSS blocks use the frozen ownership matrix independently, so
 * editing one block never marks an unrelated block modified and missing or
 * untracked blocks follow the frozen rules.
 */

function hash(value: string): string {
  return hashBytes(new TextEncoder().encode(value)) as string;
}

test("all base/local/incoming combinations match the source policy", () => {
  const classifications = classifyCssBlocks([
    {
      id: "untouched",
      owner: "button",
      baseHash: hash("B"),
      localBody: "B",
      incomingBody: "I",
    },
    {
      id: "customized",
      owner: "button",
      baseHash: hash("B"),
      localBody: "L",
      incomingBody: "B",
    },
    {
      id: "satisfied",
      owner: "button",
      baseHash: hash("B"),
      localBody: "I",
      incomingBody: "I",
    },
    {
      id: "conflict",
      owner: "button",
      baseHash: hash("B"),
      localBody: "L",
      incomingBody: "I",
    },
    {
      id: "missing",
      owner: "button",
      baseHash: hash("B"),
      localBody: null,
      incomingBody: "I",
    },
    {
      id: "untracked",
      owner: null,
      baseHash: null,
      localBody: "I",
      incomingBody: "I",
    },
  ]);
  const byId = new Map(classifications.map((entry) => [entry.id, entry]));
  assert.equal(byId.get("untouched")?.disposition, "update");
  assert.equal(byId.get("customized")?.disposition, "customized");
  assert.equal(byId.get("satisfied")?.disposition, "no_change");
  assert.equal(byId.get("conflict")?.disposition, "conflict");
  assert.equal(byId.get("missing")?.disposition, "conflict");
  assert.equal(byId.get("untracked")?.disposition, "untracked_conflict");
});

test("editing one block does not mark unrelated blocks modified", () => {
  const classifications = classifyCssBlocks([
    {
      id: "edited",
      owner: "button",
      baseHash: hash("B"),
      localBody: "L",
      incomingBody: "B",
    },
    {
      id: "stable",
      owner: "card",
      baseHash: hash("B"),
      localBody: "B",
      incomingBody: "B",
    },
  ]);
  const byId = new Map(classifications.map((entry) => [entry.id, entry]));
  assert.equal(byId.get("edited")?.disposition, "customized");
  assert.equal(byId.get("stable")?.disposition, "no_change");
});

test("results are ordered deterministically by block id", () => {
  const classifications = classifyCssBlocks([
    {
      id: "z",
      owner: "b",
      baseHash: hash("B"),
      localBody: "B",
      incomingBody: "B",
    },
    {
      id: "a",
      owner: "b",
      baseHash: hash("B"),
      localBody: "B",
      incomingBody: "B",
    },
  ]);
  assert.deepEqual(
    classifications.map((entry) => entry.id),
    ["a", "z"],
  );
});
