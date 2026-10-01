import assert from "node:assert/strict";
import { test } from "node:test";

import { hashBytes } from "../../src/codegen/compare.js";
import type { LockFileRecord } from "../../src/codegen/lock.js";
import {
  planSourceRetirement,
  survivingLockFiles,
} from "../../src/codegen/retire.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import { planSourceTargets } from "../../src/codegen/source-targets.js";
import { createTempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * S046 tests: a shared transitive dependency survives, clean and customized
 * retired targets get different actions, and a retained customization cannot be
 * silently reacquired by a later add.
 */

function bytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function lockRecord(
  path: string,
  owner: string,
  baseHash: string,
): LockFileRecord {
  return { path, owner, baseHash, itemVersion: "0.1.0", cohort: "core" };
}

test("clean and customized retired targets get different actions", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("src/clean.svelte", "B");
  project.writeFile("src/custom.svelte", "L");
  project.writeFile("src/shared.svelte", "S");

  const before = snapshotTree(project.root);
  const snapshot = captureSnapshot(project.root, [
    "src/clean.svelte",
    "src/custom.svelte",
    "src/shared.svelte",
  ]);
  assert.equal(snapshot.ok, true);
  if (!snapshot.ok) return;

  const lockFiles = [
    lockRecord("src/clean.svelte", "button", hashBytes(bytes("B")) as string),
    lockRecord("src/custom.svelte", "button", hashBytes(bytes("B")) as string),
    lockRecord("src/shared.svelte", "tokens", hashBytes(bytes("S")) as string),
  ];
  const records = planSourceRetirement(
    snapshot.value,
    lockFiles,
    new Set(["tokens"]),
  );
  const map = new Map(records.map((record) => [record.path, record]));

  assert.equal(map.get("src/clean.svelte")?.action, "delete");
  assert.equal(map.get("src/custom.svelte")?.action, "retain");
  assert.equal(map.get("src/custom.svelte")?.detachOwnership, true);
  // A shared dependency outside the removed owner set survives untouched.
  assert.equal(map.has("src/shared.svelte"), false);
  assert.deepEqual(
    snapshotTree(project.root),
    before,
    "planning must not write",
  );
});

test("a retained customization is not silently reacquired on a later add", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("src/custom.svelte", "L");

  const snapshot = captureSnapshot(project.root, ["src/custom.svelte"]);
  assert.equal(snapshot.ok, true);
  if (!snapshot.ok) return;
  const before = lockRecord(
    "src/custom.svelte",
    "button",
    hashBytes(bytes("B")) as string,
  );
  const retirement = planSourceRetirement(snapshot.value, [before], new Set());
  assert.equal(retirement[0]?.action, "retain");

  const surviving = survivingLockFiles([before], new Set());
  assert.deepEqual(surviving, []);

  // A later add encounters the retained, now-untracked file; it conflicts even
  // though incoming bytes are identical.
  const add = planSourceTargets(snapshot.value, surviving, [
    { path: "src/custom.svelte", bytes: bytes("L") },
  ]);
  assert.equal(add[0]?.disposition, "untracked_conflict");
});

test("a missing retired target is detached without deletion", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const snapshot = captureSnapshot(project.root, ["src/gone.svelte"]);
  assert.equal(snapshot.ok, true);
  if (!snapshot.ok) return;
  const records = planSourceRetirement(
    snapshot.value,
    [lockRecord("src/gone.svelte", "button", hashBytes(bytes("B")) as string)],
    new Set(),
  );
  assert.equal(records[0]?.action, "retain");
  assert.equal(records[0]?.detachOwnership, true);
});
