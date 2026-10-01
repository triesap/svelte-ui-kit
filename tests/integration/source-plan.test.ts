import assert from "node:assert/strict";
import { test } from "node:test";

import { hashBytes } from "../../src/codegen/compare.js";
import type { LockFileRecord } from "../../src/codegen/lock.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import {
  assembleSourcePlan,
  type IncomingSourceFile,
} from "../../src/codegen/source-plan.js";
import { planSourceTargets } from "../../src/codegen/source-targets.js";
import { createTempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * S047 tests: a safe multi-file item yields a stable executable plan, one
 * conflicting file makes the whole batch non-executable, conflicts are ordered
 * deterministically, and assembly writes nothing.
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

test("a safe multi-file item yields a stable executable plan", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("src/a.svelte", "A0");
  // src/b.svelte is new.

  const before = snapshotTree(project.root);
  const snapshot = captureSnapshot(project.root, [
    "src/a.svelte",
    "src/b.svelte",
  ]);
  assert.equal(snapshot.ok, true);
  if (!snapshot.ok) return;

  const lockFiles = [
    lockRecord("src/a.svelte", "button", hashBytes(bytes("A0")) as string),
  ];
  const incoming: IncomingSourceFile[] = [
    { path: "src/a.svelte", owner: "button", bytes: bytes("A1") },
    { path: "src/b.svelte", owner: "button", bytes: bytes("B0") },
  ];
  const records = planSourceTargets(snapshot.value, lockFiles, incoming);
  const plan = assembleSourcePlan(records, incoming);
  const again = assembleSourcePlan(
    planSourceTargets(snapshot.value, lockFiles, incoming),
    incoming,
  );

  assert.equal(plan.executable, true, JSON.stringify(plan.conflicts));
  assert.equal(plan.conflicts.length, 0);
  assert.equal(plan.changes.length, 2);
  assert.ok(plan.changes.every((change) => change.producesBytes));
  assert.ok(plan.changes.every((change) => change.owner === "button"));
  assert.deepEqual(again, plan, "equivalent input yields an identical plan");
  assert.deepEqual(
    snapshotTree(project.root),
    before,
    "assembly must not write",
  );
});

test("one conflicting file makes the batch non-executable", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("src/ok.svelte", "A0");
  project.writeFile("src/untracked.svelte", "L");

  const snapshot = captureSnapshot(project.root, [
    "src/ok.svelte",
    "src/untracked.svelte",
  ]);
  assert.equal(snapshot.ok, true);
  if (!snapshot.ok) return;
  const lockFiles = [
    lockRecord("src/ok.svelte", "button", hashBytes(bytes("A0")) as string),
  ];
  const incoming: IncomingSourceFile[] = [
    { path: "src/ok.svelte", owner: "button", bytes: bytes("A1") },
    { path: "src/untracked.svelte", owner: "button", bytes: bytes("L") },
  ];
  const plan = assembleSourcePlan(
    planSourceTargets(snapshot.value, lockFiles, incoming),
    incoming,
  );
  assert.equal(plan.executable, false);
  assert.deepEqual(
    plan.conflicts.map((record) => record.path),
    ["src/untracked.svelte"],
  );
});

test("multiple diagnostics retain deterministic order", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("src/z.svelte", "Lz");
  project.writeFile("src/a.svelte", "La");

  const snapshot = captureSnapshot(project.root, [
    "src/z.svelte",
    "src/a.svelte",
  ]);
  assert.equal(snapshot.ok, true);
  if (!snapshot.ok) return;
  const incoming: IncomingSourceFile[] = [
    { path: "src/z.svelte", owner: "button", bytes: bytes("Iz") },
    { path: "src/a.svelte", owner: "button", bytes: bytes("Ia") },
  ];
  const plan = assembleSourcePlan(
    planSourceTargets(snapshot.value, [], incoming),
    incoming,
  );
  assert.equal(plan.executable, false);
  assert.deepEqual(
    plan.conflicts.map((record) => record.path),
    ["src/a.svelte", "src/z.svelte"],
  );
});
