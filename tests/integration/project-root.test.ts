import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";

import type { ModelResult } from "../../src/registry/errors.js";
import { resolveProjectRoot } from "../../src/project/root.js";
import { createTempProject, type TempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * S036 tests: `--cwd` selects exactly one application package, an ambiguous
 * workspace root fails read-only, nearest-package discovery never chooses a
 * sibling, and resolution performs no write.
 */

function codes(result: ModelResult<unknown>): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

function buildWorkspace(
  project: TempProject,
  members: readonly string[],
): void {
  project.writeFile(
    "package.json",
    JSON.stringify({
      name: "workspace-root",
      private: true,
      workspaces: ["apps/*"],
    }),
  );
  for (const member of members) {
    project.writeFile(
      `${member}/package.json`,
      JSON.stringify({ name: member.replace("/", "-") }),
    );
  }
}

test("nested --cwd selects exactly its application package", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  buildWorkspace(project, ["apps/a", "apps/b"]);

  const before = snapshotTree(project.root);
  const result = resolveProjectRoot({
    cwd: "apps/b",
    invocationDir: project.root,
  });
  const after = snapshotTree(project.root);

  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.root, path.join(project.root, "apps", "b"));
  assert.equal(result.value.selectedBy, "cwd");
  assert.equal(result.value.packageName, "apps-b");
  assert.deepEqual(after, before, "resolution must not write");
});

test("an ambiguous workspace root fails with an actionable diagnostic", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  buildWorkspace(project, ["apps/a", "apps/b"]);

  const result = resolveProjectRoot({
    cwd: ".",
    invocationDir: project.root,
  });
  assert.equal(result.ok, false);
  assert.deepEqual(codes(result), ["PROJECT_AMBIGUOUS_WORKSPACE"]);
});

test("a single-member workspace resolves without guessing", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  buildWorkspace(project, ["apps/only"]);

  const result = resolveProjectRoot({
    cwd: ".",
    invocationDir: project.root,
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.root, path.join(project.root, "apps", "only"));
  assert.equal(result.value.workspaceRoot, project.root);
});

test("default discovery selects the nearest enclosing package, never a sibling", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  buildWorkspace(project, ["apps/a", "apps/b"]);
  project.writeDir("apps/a/src/lib");

  const nested = resolveProjectRoot({
    invocationDir: path.join(project.root, "apps", "a", "src", "lib"),
  });
  assert.equal(nested.ok, true, JSON.stringify(nested));
  if (nested.ok) {
    assert.equal(nested.value.root, path.join(project.root, "apps", "a"));
    assert.equal(nested.value.selectedBy, "nearest");
  }

  // From the workspace root itself the nearest package is the root, not a
  // sibling member.
  const atRoot = resolveProjectRoot({ invocationDir: project.root });
  assert.equal(atRoot.ok, true, JSON.stringify(atRoot));
  if (atRoot.ok) {
    assert.equal(atRoot.value.root, project.root);
  }
});

test("an explicit non-package directory fails clearly", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeDir("empty");

  const result = resolveProjectRoot({
    cwd: "empty",
    invocationDir: project.root,
  });
  assert.equal(result.ok, false);
  assert.deepEqual(codes(result), ["PROJECT_PACKAGE_NOT_FOUND"]);
});

test("a missing --cwd directory fails clearly", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());

  const result = resolveProjectRoot({
    cwd: "does-not-exist",
    invocationDir: project.root,
  });
  assert.equal(result.ok, false);
  assert.deepEqual(codes(result), ["PROJECT_CWD_NOT_FOUND"]);
});
