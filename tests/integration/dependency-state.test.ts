import assert from "node:assert/strict";
import { test } from "node:test";

import {
  inspectDependencyState,
  installedVersion,
} from "../../src/project/dependencies.js";
import type { ModelResult } from "../../src/registry/errors.js";
import { createTempProject, type TempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * S038 tests: declared and installed dependency state are inspected separately,
 * missing install differs from missing declaration, an installed incompatible
 * version is reported, and inspection never mutates package/lock files.
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

test("an installed incompatible version is reported", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ devDependencies: { svelte: "^4.0.0" } }),
  );
  install(project, "svelte", "5.57.1");

  const result = inspectDependencyState(project.root, [
    { name: "svelte", range: "^4.0.0" },
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value[0]?.status, "incompatible");
  assert.equal(result.value[0]?.installedVersion, "5.57.1");
  assert.equal(result.value[0]?.requiredRange, "^4.0.0");
});

test("an installed but undeclared package is read as hoisting evidence", (t) => {
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
  assert.equal(result.value[0]?.status, "ready");
  assert.equal(result.value[0]?.declaredRange, null);
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

test("a malformed installed manifest is treated as not installed", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "broken" }));
  project.writeFile("node_modules/svelte/package.json", "{ not json");

  assert.equal(installedVersion(project.root, "svelte"), null);
});
