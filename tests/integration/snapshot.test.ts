import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import {
  captureSnapshot,
  decodeObservedText,
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

/**
 * RCLD03-R2-2: the entry lookup is genuinely immutable, so captured evidence
 * cannot be cleared, replaced or deleted.
 */
test("the captured entry lookup is immutable", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("a.txt", "a");

  const result = captureSnapshot(project.root, ["a.txt", "missing.txt"]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;

  assert.equal(result.value.entries.size, 2);
  const mutable = result.value.entries as unknown as Record<string, unknown>;
  assert.equal(typeof mutable["clear"], "undefined");
  assert.equal(typeof mutable["set"], "undefined");
  assert.equal(typeof mutable["delete"], "undefined");
  assert.equal(result.value.entries.size, 2);
});

/**
 * RCLD03-R2-2: an intermediate symlink is a typed unsafe observation, and the
 * external target is never read.
 */
test("a symlinked ancestor is a typed unsafe observation", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const external = createTempProject({ prefix: "suik-snapshot-external-" });
  t.after(() => external.cleanup());
  external.writeFile("secret", "OUTSIDE");
  project.symlink(external.root, "linked");

  const result = captureSnapshot(project.root, ["linked/secret"]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  const observation = observationOf(result.value, "linked/secret");
  assert.equal(observation?.kind, "unsafe");
  assert.equal(observation?.errorCode, "UNSAFE_ANCESTRY");
  assert.equal(observation?.bytes, null);
});

/**
 * RCLD03-R2-2: a byte-order mark is preserved and invalid UTF-8 is rejected
 * instead of being replaced lossily.
 */
test("text decoding preserves a BOM and rejects invalid UTF-8", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  writeFileSync(
    path.join(project.root, "bom.ts"),
    new Uint8Array([0xef, 0xbb, 0xbf, 0x2f, 0x2f, 0x41, 0x50, 0x50, 0x0a]),
  );
  writeFileSync(
    path.join(project.root, "invalid.ts"),
    new Uint8Array([0x2f, 0x2f, 0xff, 0x0a]),
  );

  const result = captureSnapshot(project.root, ["bom.ts", "invalid.ts"]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  const bom = observationOf(result.value, "bom.ts");
  const invalid = observationOf(result.value, "invalid.ts");
  assert.equal(observedText(bom!), "\uFEFF//APP\n");
  assert.deepEqual(decodeObservedText(invalid!), {
    kind: "invalid",
    code: "INVALID_UTF8",
  });
});

/**
 * RCLD03-R3-1: an explicitly selected root alias is canonicalized once, so a
 * root that is a symlink to a directory is observed; a root that does not
 * resolve to a real directory is still a typed failure.
 */
test("a root alias canonicalizes once and a non-directory root is unsafe", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const external = createTempProject({ prefix: "suik-root-external-" });
  t.after(() => external.cleanup());
  external.writeFile("f", "x");
  project.symlink(external.root, "linked-root");

  const result = captureSnapshot(path.join(project.root, "linked-root"), ["f"]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  const observation = observationOf(result.value, "f");
  assert.equal(observation?.kind, "file");
  assert.equal(observedText(observation!), "x");
  assert.equal(result.value.root, external.root);

  // A root that resolves to a non-directory is unsafe, not followed.
  project.writeFile("plain.txt", "x");
  project.symlink(path.join(project.root, "plain.txt"), "file-link");
  const unsafe = captureSnapshot(path.join(project.root, "file-link"), [
    "plain.txt",
  ]);
  assert.equal(unsafe.ok, false);
  assert.deepEqual(unsafe.ok ? [] : unsafe.issues.map((entry) => entry.code), [
    "SNAPSHOT_ROOT_UNSAFE",
  ]);
});
