import assert from "node:assert/strict";
import { test } from "node:test";

import {
  detectPackageManager,
  renderDependencyInstructions,
} from "../../src/project/dependency-instructions.js";
import type { ModelResult } from "../../src/registry/errors.js";
import { createTempProject, type TempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * S040 tests: instructions match the detected manager and requirements, are
 * safely quoted, separate consumer dependencies from CLI tooling, and report
 * without executing a package manager or changing the tree.
 */

function codes(result: ModelResult<unknown>): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

function render(project: TempProject, runtime: string[], peers: string[]) {
  return renderDependencyInstructions(project.root, { runtime, peers });
}

test("the packageManager field selects the instruction manager", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ packageManager: "pnpm@11.22.0" }),
  );

  const evidence = detectPackageManager(project.root);
  assert.equal(evidence.ok, true);
  if (evidence.ok) {
    assert.equal(evidence.value.manager, "pnpm");
    assert.equal(evidence.value.source, "packageManager");
  }

  const before = snapshotTree(project.root);
  const result = render(project, ["bits-ui@2.19.3"], ["svelte@5.57.1"]);
  const after = snapshotTree(project.root);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.runtimeCommand, "pnpm add bits-ui@2.19.3");
  assert.equal(result.value.peerCommand, "pnpm add svelte@5.57.1");
  // The CLI's own tooling is never part of the consumer instruction.
  assert.ok(!result.value.runtimeCommand?.includes("typescript"));
  assert.deepEqual(after, before, "reporting must not write");
});

test("one unambiguous lockfile family is detected", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "lockfile" }));
  project.writeFile("package-lock.json", "{}\n");

  const evidence = detectPackageManager(project.root);
  assert.equal(evidence.ok, true);
  if (!evidence.ok) return;
  assert.equal(evidence.value.manager, "npm");
  assert.equal(evidence.value.source, "lockfile");
  const result = render(project, ["bits-ui@2.19.3"], []);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok)
    assert.equal(result.value.runtimeCommand, "npm install bits-ui@2.19.3");
});

test("yarn lockfile selects yarn", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "yarn" }));
  project.writeFile("yarn.lock", "# yarn\n");

  const result = render(project, ["bits-ui@2.19.3"], []);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok)
    assert.equal(result.value.runtimeCommand, "yarn add bits-ui@2.19.3");
});

test("conflicting lockfiles produce an actionable diagnostic", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "conflict" }));
  project.writeFile("pnpm-lock.yaml", "lockfileVersion: 9\n");
  project.writeFile("yarn.lock", "# yarn\n");

  const result = render(project, ["bits-ui@2.19.3"], []);
  assert.equal(result.ok, false);
  assert.deepEqual(codes(result), ["DEPENDENCY_MANAGER_CONFLICTING"]);
});

test("no manager evidence yields a manual instruction, not a guess", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "none" }));

  const result = render(project, ["bits-ui@2.19.3"], ["svelte@5.57.1"]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.runtimeCommand, null);
  assert.equal(result.value.peerCommand, null);
  assert.match(result.value.manual ?? "", /bits-ui@2\.19\.3/);
  assert.match(result.value.manual ?? "", /svelte@5\.57\.1/);
});

test("specs with spaces are single-quoted and unsafe specs are rejected", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ packageManager: "pnpm@11.22.0" }),
  );

  const spaced = render(project, ["svelte@^5.0.0 || ^6.0.0"], []);
  assert.equal(spaced.ok, true, JSON.stringify(spaced));
  if (spaced.ok) {
    assert.equal(
      spaced.value.runtimeCommand,
      "pnpm add 'svelte@^5.0.0 || ^6.0.0'",
    );
  }

  const unsafe = render(project, ["bits-ui'; rm -rf /"], []);
  assert.equal(unsafe.ok, false);
  assert.deepEqual(codes(unsafe), ["DEPENDENCY_SPEC_UNSAFE"]);
});

test("reporting never executes a manager or changes the tree", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ packageManager: "pnpm@11.22.0" }),
  );
  project.writeDir("node_modules");
  const before = snapshotTree(project.root);
  render(project, ["bits-ui@2.19.3"], ["svelte@5.57.1"]);
  render(project, ["bits-ui@2.19.3"], ["svelte@5.57.1"]);
  assert.deepEqual(snapshotTree(project.root), before);
});
