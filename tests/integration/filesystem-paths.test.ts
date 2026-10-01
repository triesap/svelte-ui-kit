import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";

import {
  assertRootIdentity,
  captureRootIdentity,
  observeTargetAncestry,
} from "../../src/project/filesystem-paths.js";
import type { ModelResult } from "../../src/registry/errors.js";
import { createTempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * S042 tests: filesystem ancestry rejects symlinks, broken links,
 * non-directory intermediates and file/directory kind conflicts; valid
 * existing and new descendants pass; the preserved root identity detects a
 * replaced root; and inspection writes nothing.
 */

function codes(result: ModelResult<unknown>): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

test("valid existing and new descendants pass", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("src/lib/a.ts", "a");
  project.writeDir("src/styles");

  const identity = captureRootIdentity(project.root);
  assert.equal(identity.ok, true, JSON.stringify(identity));
  if (!identity.ok) return;

  const before = snapshotTree(project.root);
  const existing = observeTargetAncestry(
    identity.value,
    "src/lib/a.ts",
    "file",
  );
  const newFile = observeTargetAncestry(
    identity.value,
    "src/lib/new/deep.ts",
    "file",
  );
  const dir = observeTargetAncestry(identity.value, "src/styles", "directory");
  assert.equal(existing.ok, true, JSON.stringify(existing));
  if (existing.ok) assert.equal(existing.value.kind, "file");
  assert.equal(newFile.ok, true, JSON.stringify(newFile));
  if (newFile.ok) {
    assert.equal(newFile.value.kind, "absent");
    assert.deepEqual(newFile.value.missingAncestors, [
      "src/lib/new",
      "src/lib/new/deep.ts",
    ]);
  }
  assert.equal(dir.ok, true, JSON.stringify(dir));
  assert.deepEqual(
    snapshotTree(project.root),
    before,
    "inspection must not write",
  );
});

test("a symlinked ancestor below the root is rejected", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const external = createTempProject({ prefix: "suik-fspath-external-" });
  t.after(() => external.cleanup());
  external.writeFile("secret.ts", "secret");
  project.writeDir("src");
  project.symlink(external.root, "src/lib");

  const identity = captureRootIdentity(project.root);
  assert.equal(identity.ok, true);
  if (!identity.ok) return;
  const result = observeTargetAncestry(
    identity.value,
    "src/lib/secret.ts",
    "file",
  );
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(codes(result), ["TARGET_SYMLINK"]);
});

test("a broken link at the target is rejected", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeDir("src");
  project.symlink("missing-target", "src/link.ts");

  const identity = captureRootIdentity(project.root);
  assert.equal(identity.ok, true);
  if (!identity.ok) return;
  const result = observeTargetAncestry(identity.value, "src/link.ts", "file");
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(codes(result), ["TARGET_SYMLINK"]);
});

test("a directory at a file target and a file at a directory target fail", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeDir("src/dir");
  project.writeFile("src/file", "x");

  const identity = captureRootIdentity(project.root);
  assert.equal(identity.ok, true);
  if (!identity.ok) return;
  const atFile = observeTargetAncestry(identity.value, "src/dir", "file");
  const atDir = observeTargetAncestry(identity.value, "src/file", "directory");
  assert.deepEqual(codes(atFile), ["TARGET_KIND_CONFLICT"]);
  assert.deepEqual(codes(atDir), ["TARGET_KIND_CONFLICT"]);
});

test("a nonregular FIFO target is rejected without opening it", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeDir("src");
  const fifo = path.join(project.root, "src", "pipe");
  const made = spawnSync("mkfifo", [fifo], { encoding: "utf8" });
  if (made.status !== 0) {
    t.skip("mkfifo is not available on this platform");
    return;
  }

  const identity = captureRootIdentity(project.root);
  assert.equal(identity.ok, true);
  if (!identity.ok) return;
  const result = observeTargetAncestry(identity.value, "src/pipe", "file");
  assert.deepEqual(codes(result), ["TARGET_KIND_CONFLICT"]);
});

test("the preserved root identity detects a replaced root", async (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const identity = captureRootIdentity(project.root);
  assert.equal(identity.ok, true);
  if (!identity.ok) return;
  assert.equal(assertRootIdentity(identity.value).ok, true);

  const root = project.root;
  const parent = path.dirname(root);
  const { mkdirSync, renameSync, rmSync } = await import("node:fs");
  const replacement = path.join(parent, `${path.basename(root)}-replacement`);
  rmSync(replacement, { recursive: true, force: true });
  mkdirSync(replacement);
  renameSync(root, `${root}-old`);
  renameSync(replacement, root);
  t.after(() => {
    rmSync(root, { recursive: true, force: true });
    rmSync(`${root}-old`, { recursive: true, force: true });
  });
  const recheck = assertRootIdentity(identity.value);
  assert.equal(recheck.ok, false, JSON.stringify(recheck));
  if (!recheck.ok) assert.deepEqual(codes(recheck), ["ROOT_CHANGED"]);
});
