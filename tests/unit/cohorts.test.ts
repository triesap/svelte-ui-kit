import assert from "node:assert/strict";
import { test } from "node:test";

import { applyCohortPolicy } from "../../src/codegen/cohorts.js";

/**
 * S059 tests: the frozen conservative cohort rule blocks an unsafe mixed
 * update, keeps unrelated units independent, and widens a unit only when a
 * changed public API justifies expanding to its dependents.
 */

test("a conflict in one member blocks a coupled update", () => {
  const result = applyCohortPolicy({
    members: [
      { owner: "button", disposition: "conflict" },
      { owner: "button", disposition: "update" },
    ],
  });
  assert.deepEqual([...result.blockedOwners], ["button"]);
  assert.equal(result.conflicts.length, 1);
});

test("a customized member coupled to a changed member is preserved", () => {
  const result = applyCohortPolicy({
    members: [
      { owner: "button", disposition: "customized" },
      { owner: "button", disposition: "update" },
    ],
  });
  assert.deepEqual([...result.blockedOwners], ["button"]);
});

test("a standalone customization with unchanged upstream is not a conflict", () => {
  const result = applyCohortPolicy({
    members: [{ owner: "button", disposition: "customized" }],
  });
  assert.deepEqual(result.conflicts, []);
  assert.deepEqual([...result.blockedOwners], []);
});

test("unrelated unchanged components do not create false conflicts", () => {
  const result = applyCohortPolicy({
    members: [
      { owner: "button", disposition: "no_change" },
      { owner: "card", disposition: "no_change" },
      { owner: "spinner", disposition: "update" },
    ],
  });
  assert.deepEqual(result.conflicts, []);
  assert.deepEqual([...result.blockedOwners], []);
});

test("a clean adoption is allowed", () => {
  const result = applyCohortPolicy({
    members: [
      { owner: "button", disposition: "update" },
      { owner: "button", disposition: "no_change" },
    ],
  });
  assert.deepEqual(result.conflicts, []);
});

test("a changed public API widens the unit to its dependents", () => {
  const dependents = new Map<string, readonly string[]>([
    ["tokens", ["button"]],
  ]);
  const withoutExpansion = applyCohortPolicy({
    members: [
      { owner: "tokens", disposition: "update" },
      { owner: "button", disposition: "customized" },
    ],
    exportedApiChanged: new Set(["tokens"]),
  });
  assert.deepEqual(withoutExpansion.conflicts, []);

  const expanded = applyCohortPolicy({
    members: [
      { owner: "tokens", disposition: "update" },
      { owner: "button", disposition: "customized" },
    ],
    dependents,
    exportedApiChanged: new Set(["tokens"]),
  });
  assert.deepEqual([...expanded.expandedOwners], ["button"]);
  assert.deepEqual([...expanded.blockedOwners].sort(), ["button", "tokens"]);
  assert.equal(expanded.conflicts.length, 1);
});
