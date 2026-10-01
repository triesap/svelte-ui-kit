import assert from "node:assert/strict";
import { test } from "node:test";

import {
  captureSnapshot,
  observedText,
  observationOf,
} from "../../src/codegen/snapshot.js";
import { createTempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * S041 tests: a snapshot captures exact bytes and kinds read-only, absence is
 * distinct from empty content, bytes are defensively copied so later changes do
 * not mutate a captured snapshot, and capturing writes nothing.
 */

test("absence, empty, CRLF and nonregular observations stay distinct", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("empty.txt", "");
  project.writeFile("crlf.txt", "a\r\nb\r\n");
  project.writeFile("real.json", JSON.stringify({ name: "linked" }));
  project.symlink("real.json", "link.json");
  project.writeDir("adir");

  const result = captureSnapshot(project.root, [
    "missing.txt",
    "empty.txt",
    "crlf.txt",
    "link.json",
    "adir",
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;

  const missing = observationOf(result.value, "missing.txt");
  const empty = observationOf(result.value, "empty.txt");
  const crlf = observationOf(result.value, "crlf.txt");
  const link = observationOf(result.value, "link.json");
  const dir = observationOf(result.value, "adir");

  assert.equal(missing?.kind, "absent");
  assert.equal(missing?.bytes, null);
  assert.equal(empty?.kind, "file");
  assert.equal(empty?.bytes?.byteLength, 0);
  assert.equal(empty?.hash !== null, true);
  assert.equal(crlf?.kind, "file");
  assert.equal(observedText(crlf!), "a\r\nb\r\n");
  assert.equal(link?.kind, "symlink");
  assert.equal(link?.linkTarget, "real.json");
  assert.equal(dir?.kind, "directory");
  // Absence and empty content are not the same observation.
  assert.notEqual(missing?.kind, empty?.kind);
});

test("a later filesystem change does not mutate a captured snapshot", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("file.txt", "original");

  const result = captureSnapshot(project.root, ["file.txt"]);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const original = observedText(observationOf(result.value, "file.txt")!);
  assert.equal(original, "original");

  project.writeFile("file.txt", "changed");
  assert.equal(
    observedText(observationOf(result.value, "file.txt")!),
    "original",
    "captured bytes are a defensive copy",
  );
});

test("an unsafe logical path is a typed failure", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const result = captureSnapshot(project.root, ["../escape"]);
  assert.equal(result.ok, false);
  assert.deepEqual(result.ok ? [] : result.issues.map((entry) => entry.code), [
    "SNAPSHOT_PATH_INVALID",
  ]);
});

test("capturing a snapshot writes nothing", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("a.txt", "a");
  project.writeFile("src/b.txt", "b");
  const before = snapshotTree(project.root);
  captureSnapshot(project.root, ["a.txt", "src/b.txt", "missing.txt"]);
  assert.deepEqual(snapshotTree(project.root), before);
});
