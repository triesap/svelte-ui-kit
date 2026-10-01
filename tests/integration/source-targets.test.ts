import assert from "node:assert/strict";
import { test } from "node:test";

import { hashBytes } from "../../src/codegen/compare.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import {
  hasSourceConflict,
  planSourceTargets,
  type SourceTargetRecord,
} from "../../src/codegen/source-targets.js";
import type { LockFileRecord } from "../../src/codegen/lock.js";
import { createTempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * S045 tests: missing tracked targets follow the frozen missing-target policy,
 * existing untracked equal/different sources retain documented no-adoption
 * rights, new absent targets are planned creations, and planning writes nothing.
 */

function lockRecord(path: string, baseHash: string | null): LockFileRecord {
  return {
    path,
    owner: "button",
    baseHash: baseHash ?? "0".repeat(64),
    itemVersion: "0.1.0",
    cohort: "core",
  };
}

function bytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function byPath(
  records: readonly SourceTargetRecord[],
): Map<string, SourceTargetRecord> {
  return new Map(records.map((record) => [record.path, record]));
}

test("source targets follow the frozen ownership policy without writing", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("src/untouched.svelte", "B");
  project.writeFile("src/customized.svelte", "L");
  project.writeFile("src/untracked-equal.svelte", "I");
  project.writeFile("src/untracked-different.svelte", "L");
  project.writeFile("src/satisfied.svelte", "I");
  // src/missing.svelte is tracked but absent on disk.
  // src/new.svelte is untracked and absent.

  const before = snapshotTree(project.root);
  const snapshot = captureSnapshot(project.root, [
    "src/untouched.svelte",
    "src/customized.svelte",
    "src/untracked-equal.svelte",
    "src/untracked-different.svelte",
    "src/satisfied.svelte",
    "src/missing.svelte",
    "src/new.svelte",
  ]);
  assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
  if (!snapshot.ok) return;

  const records = planSourceTargets(
    snapshot.value,
    [
      lockRecord("src/untouched.svelte", hashBytes(bytes("B"))),
      lockRecord("src/customized.svelte", hashBytes(bytes("B"))),
      lockRecord("src/satisfied.svelte", hashBytes(bytes("I"))),
      lockRecord("src/missing.svelte", hashBytes(bytes("B"))),
    ],
    [
      { path: "src/untouched.svelte", bytes: bytes("I") },
      { path: "src/customized.svelte", bytes: bytes("B") },
      { path: "src/untracked-equal.svelte", bytes: bytes("I") },
      { path: "src/untracked-different.svelte", bytes: bytes("I") },
      { path: "src/satisfied.svelte", bytes: bytes("I") },
      { path: "src/missing.svelte", bytes: bytes("I") },
      { path: "src/new.svelte", bytes: bytes("I") },
    ],
  );
  const map = byPath(records);

  assert.equal(map.get("src/untouched.svelte")?.disposition, "update");
  assert.equal(map.get("src/customized.svelte")?.disposition, "customized");
  assert.equal(map.get("src/satisfied.svelte")?.disposition, "no_change");
  assert.equal(map.get("src/missing.svelte")?.disposition, "conflict");
  assert.match(
    map.get("src/missing.svelte")?.reason ?? "",
    /no silent restoration/,
  );
  assert.equal(
    map.get("src/untracked-equal.svelte")?.disposition,
    "untracked_conflict",
  );
  assert.equal(
    map.get("src/untracked-different.svelte")?.disposition,
    "untracked_conflict",
  );
  assert.equal(map.get("src/new.svelte")?.disposition, "create");
  assert.equal(hasSourceConflict(records), true);
  assert.deepEqual(
    snapshotTree(project.root),
    before,
    "planning must not write",
  );
});

test("a fully satisfied tracked set has no conflict", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("src/satisfied.svelte", "I");

  const snapshot = captureSnapshot(project.root, ["src/satisfied.svelte"]);
  assert.equal(snapshot.ok, true);
  if (!snapshot.ok) return;
  const records = planSourceTargets(
    snapshot.value,
    [lockRecord("src/satisfied.svelte", hashBytes(bytes("I")))],
    [{ path: "src/satisfied.svelte", bytes: bytes("I") }],
  );
  assert.equal(hasSourceConflict(records), false);
  assert.equal(records[0]?.disposition, "no_change");
});

test("a nonregular local target is a conflict", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeDir("src");
  project.writeFile("src/real.svelte", "I");
  project.symlink("real.svelte", "src/linked.svelte");

  const snapshot = captureSnapshot(project.root, ["src/linked.svelte"]);
  assert.equal(snapshot.ok, true);
  if (!snapshot.ok) return;
  const records = planSourceTargets(
    snapshot.value,
    [],
    [{ path: "src/linked.svelte", bytes: bytes("I") }],
  );
  assert.equal(records[0]?.disposition, "conflict");
});
