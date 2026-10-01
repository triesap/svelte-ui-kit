import assert from "node:assert/strict";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { test } from "node:test";

import {
  inspectDependencyState,
  installedVersion,
  observeInstalled,
} from "../../src/project/dependencies.js";
import type { ModelResult } from "../../src/registry/errors.js";
import { createTempProject, type TempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * S038 tests (repaired): declared and installed dependency state are inspected
 * separately. Readiness requires explicit declaration evidence, a compatible
 * declared/required intersection and an installed version inside it. Hoisted
 * ancestor installs are resolved. Malformed metadata and package-identity
 * mismatches are typed invalid evidence, never absence, and I/O errors are
 * typed logical causes with no host path.
 */

function codes(result: ModelResult<unknown>): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

function install(project: TempProject, name: string, version: string): void {
  project.writeFile(
    `node_modules/${name}/package.json`,
    JSON.stringify({ name, version }),
  );
}

test("declared and installed compatible state is ready", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ dependencies: { svelte: "^5.0.0" } }),
  );
  install(project, "svelte", "5.57.1");

  const before = snapshotTree(project.root);
  const result = inspectDependencyState(project.root, [
    { name: "svelte", range: "^5.0.0" },
  ]);
  const after = snapshotTree(project.root);

  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value[0]?.status, "ready");
  assert.equal(result.value[0]?.declaredField, "dependencies");
  assert.equal(result.value[0]?.installedVersion, "5.57.1");
  assert.deepEqual(after, before, "inspection must not write");
});

test("a missing install differs from a missing declaration", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ dependencies: { "bits-ui": "^2.0.0" } }),
  );

  const result = inspectDependencyState(project.root, [
    { name: "bits-ui", range: "^2.0.0" },
    { name: "@internationalized/date", range: "^3.0.0" },
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  const bits = result.value.find((entry) => entry.name === "bits-ui");
  const date = result.value.find(
    (entry) => entry.name === "@internationalized/date",
  );
  assert.equal(bits?.status, "missing_install");
  assert.equal(date?.status, "missing_declaration");
  assert.equal(date?.declaredField, null);
});

test("an installed but undeclared dependency is not ready", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "hoisted" }));
  install(project, "bits-ui", "2.19.3");

  assert.equal(installedVersion(project.root, "bits-ui"), "2.19.3");
  const result = inspectDependencyState(project.root, [
    { name: "bits-ui", range: "^2.0.0" },
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  // Inspecting installed bytes does not create a consumer declaration.
  assert.equal(result.value[0]?.status, "missing_declaration");
  assert.equal(result.value[0]?.declaredRange, null);
  assert.equal(result.value[0]?.installedVersion, "2.19.3");
});

test("a declared range disjoint from the required range is not ready", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ dependencies: { svelte: "^4" } }),
  );
  install(project, "svelte", "5.57.1");

  const result = inspectDependencyState(project.root, [
    { name: "svelte", range: "^5" },
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value[0]?.status, "declaration_incompatible");
});

test("a compatible declared range that is not a subset is ready", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ dependencies: { svelte: ">=5 <7" } }),
  );
  install(project, "svelte", "6.0.0");

  const result = inspectDependencyState(project.root, [
    { name: "svelte", range: "^5 || ^6" },
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value[0]?.status, "ready");
});

test("a beta install does not satisfy a stable range", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ dependencies: { svelte: "^5" } }),
  );
  install(project, "svelte", "5.58.0-beta.1");

  const result = inspectDependencyState(project.root, [
    { name: "svelte", range: "^5" },
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value[0]?.status, "install_incompatible");
});

test("an installed incompatible version is reported", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ devDependencies: { svelte: "^5.0.0" } }),
  );
  install(project, "svelte", "6.5.0");

  const result = inspectDependencyState(project.root, [
    { name: "svelte", range: "^5.0.0" },
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value[0]?.status, "install_incompatible");
  assert.equal(result.value[0]?.installedVersion, "6.5.0");
  assert.equal(result.value[0]?.requiredRange, "^5.0.0");
});

test("a hoisted ancestor install is resolved", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ workspaces: ["apps/*"] }));
  project.writeFile(
    "apps/app/package.json",
    JSON.stringify({ dependencies: { svelte: "^5" } }),
  );
  install(project, "svelte", "5.57.1");

  const result = inspectDependencyState(`${project.root}/apps/app`, [
    { name: "svelte", range: "^5" },
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value[0]?.status, "ready");
  assert.equal(result.value[0]?.installedVersion, "5.57.1");
});

test("a malformed installed version is typed invalid, not absent", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ dependencies: { svelte: "^5" } }),
  );
  install(project, "svelte", "garbage");

  const result = inspectDependencyState(project.root, [
    { name: "svelte", range: "^5" },
  ]);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(codes(result), ["DEPENDENCY_INSTALLED_INVALID"]);
});

test("a malformed installed manifest is typed invalid, not absent", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ dependencies: { svelte: "^5" } }),
  );
  project.writeFile("node_modules/svelte/package.json", "{ not json");

  const result = inspectDependencyState(project.root, [
    { name: "svelte", range: "^5" },
  ]);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(codes(result), ["DEPENDENCY_INSTALLED_INVALID"]);
  assert.equal(observeInstalled(project.root, "svelte").kind, "malformed");
});

test("a package-identity mismatch is typed invalid", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ dependencies: { svelte: "^5" } }),
  );
  project.writeFile(
    "node_modules/svelte/package.json",
    JSON.stringify({ name: "not-svelte", version: "5.57.1" }),
  );

  const result = inspectDependencyState(project.root, [
    { name: "svelte", range: "^5" },
  ]);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(codes(result), ["DEPENDENCY_INSTALLED_INVALID"]);
});

test("a malformed declared range is typed invalid", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ dependencies: { svelte: "not a range" } }),
  );

  const result = inspectDependencyState(project.root, [
    { name: "svelte", range: "^5" },
  ]);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(codes(result), ["DEPENDENCY_DECLARED_INVALID"]);
});

test("an invalid required range fails with a typed issue", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "bad-range" }));

  const result = inspectDependencyState(project.root, [
    { name: "svelte", range: "not a range" },
  ]);
  assert.equal(result.ok, false);
  assert.deepEqual(codes(result), ["DEPENDENCY_RANGE_INVALID"]);
});

test("an injected permission error is a typed logical cause", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "eacces" }));

  const target = `${project.root}/package.json`;
  const mutableFs = fs as unknown as { lstatSync: typeof fs.lstatSync };
  const real = mutableFs.lstatSync;
  mutableFs.lstatSync = ((file: fs.PathLike, ...rest: unknown[]) => {
    if (String(file) === target) {
      const error = new Error("permission denied") as NodeJS.ErrnoException;
      error.code = "EACCES";
      throw error;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (real as any)(file, ...rest);
  }) as typeof fs.lstatSync;
  syncBuiltinESMExports();
  try {
    const result = inspectDependencyState(project.root, [
      { name: "svelte", range: "^5" },
    ]);
    assert.equal(result.ok, false, JSON.stringify(result));
    assert.deepEqual(codes(result), ["DEPENDENCY_MANIFEST_UNREADABLE"]);
    if (result.ok) return;
    assert.ok(!result.issues[0]?.message.includes(project.root));
  } finally {
    mutableFs.lstatSync = real;
    syncBuiltinESMExports();
  }
});
