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
  workspaces: readonly string[] = ["apps/*"],
): void {
  project.writeFile(
    "package.json",
    JSON.stringify({
      name: "workspace-root",
      private: true,
      workspaces,
    }),
  );
  for (const member of members) {
    project.writeFile(
      `${member}/package.json`,
      JSON.stringify({
        name: member.replace("/", "-"),
        devDependencies: { "@sveltejs/kit": "2.70.3" },
      }),
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

test("default discovery selects the nearest enclosing application, never a sibling", (t) => {
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

  // From the workspace root itself the nearest package is the ambiguous
  // workspace container, not one of its sibling members.
  const atRoot = resolveProjectRoot({ invocationDir: project.root });
  assert.equal(atRoot.ok, false, JSON.stringify(atRoot));
  assert.deepEqual(codes(atRoot), ["PROJECT_AMBIGUOUS_WORKSPACE"]);
});

test("default discovery of a single-member workspace selects that application", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  buildWorkspace(project, ["apps/only"]);

  const result = resolveProjectRoot({ invocationDir: project.root });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.root, path.join(project.root, "apps", "only"));
  assert.equal(result.value.selectedBy, "nearest");
});

test("ordinary library members do not count as applications", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ name: "root", workspaces: ["apps/*"] }),
  );
  project.writeFile(
    "apps/lib/package.json",
    JSON.stringify({ name: "lib", dependencies: { svelte: "5.57.1" } }),
  );

  const result = resolveProjectRoot({ cwd: ".", invocationDir: project.root });
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(codes(result), ["PROJECT_PACKAGE_NOT_FOUND"]);
});

test("an escaping workspace member pattern is rejected", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ name: "root", workspaces: ["../outside"] }),
  );

  const result = resolveProjectRoot({ cwd: ".", invocationDir: project.root });
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(codes(result), ["PROJECT_WORKSPACE_UNSUPPORTED"]);
});

test("a negative workspace pattern excludes a proven member", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  buildWorkspace(project, ["apps/keep", "apps/drop"], ["apps/*", "!apps/drop"]);

  const result = resolveProjectRoot({ cwd: ".", invocationDir: project.root });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.root, path.join(project.root, "apps", "keep"));
});

test("an unsupported deeper glob requires explicit --cwd", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  buildWorkspace(project, ["apps/a"], ["apps/a", "other/**"]);
  project.writeFile(
    "other/deep/b/package.json",
    JSON.stringify({
      name: "b",
      devDependencies: { "@sveltejs/kit": "2.70.3" },
    }),
  );

  const result = resolveProjectRoot({ cwd: ".", invocationDir: project.root });
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(codes(result), ["PROJECT_WORKSPACE_UNSUPPORTED"]);
});

test("a symlinked workspace member is not selected", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ name: "root", workspaces: ["apps/*"] }),
  );
  const external = createTempProject({ prefix: "suik-root-external-" });
  t.after(() => external.cleanup());
  external.writeFile(
    "package.json",
    JSON.stringify({
      name: "linked",
      devDependencies: { "@sveltejs/kit": "2.70.3" },
    }),
  );
  project.writeDir("apps");
  project.symlink(external.root, "apps/linked");

  const result = resolveProjectRoot({ cwd: ".", invocationDir: project.root });
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(codes(result), ["PROJECT_PACKAGE_NOT_FOUND"]);
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
