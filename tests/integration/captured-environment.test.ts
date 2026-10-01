import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { planAdd } from "../../src/codegen/plan-add.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { createSupportedProject } from "../helpers/project.js";
import { componentItem, registryOf } from "../helpers/registry.js";

/**
 * RCLD03-R7-1: the captured invocation environment is deeply immutable.
 *
 * Mutating a captured manifest value, installed observation, manager field or
 * issue array is impossible through any exposed lookup/iterator, and an
 * attempted mutation (or a later disk edit) cannot move the same snapshot from
 * executable to a conflict.
 */

const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);

function paths(): string[] {
  return [
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    derived.rootExports,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    DEFAULT_KIT_CONFIG.layoutFile,
    `${derived.rootExportsDir}/button.svelte`,
  ];
}

function dependencyRegistry() {
  return registryOf([
    componentItem("button", {
      exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
      npm: [{ name: "bits-ui", range: "^2.19.3", role: "runtime" }],
    }),
  ]);
}

function withDependency(project: ReturnType<typeof createSupportedProject>) {
  project.writeFile(
    "package.json",
    JSON.stringify({
      name: "consumer",
      private: true,
      devDependencies: { "@sveltejs/kit": "2.70.3" },
      dependencies: { "bits-ui": "^2.19.3" },
    }),
  );
  project.writeFile(
    "node_modules/bits-ui/package.json",
    JSON.stringify({ name: "bits-ui", version: "2.19.3" }),
  );
  return project;
}

test("captured environment values, lookups and iterators are deeply immutable", (t) => {
  const project = withDependency(createSupportedProject());
  t.after(() => project.cleanup());
  const captured = captureSnapshot(project.root, paths());
  assert.equal(captured.ok, true, JSON.stringify(captured));
  if (!captured.ok) return;
  const environment = captured.value.environment;

  assert.equal(Object.isFrozen(environment), true);
  assert.equal(Object.isFrozen(environment.manifest), true);
  assert.equal(environment.manifest.kind, "value");
  if (environment.manifest.kind === "value") {
    assert.equal(Object.isFrozen(environment.manifest.value), true);
  }
  assert.equal(Object.isFrozen(environment.manager), true);
  assert.equal(Object.isFrozen(environment.managerIssues), true);
  assert.equal(environment.project.ok, true);
  assert.equal(Object.isFrozen(environment.project), true);

  const installed = environment.installed;
  assert.equal(
    typeof (installed as unknown as { clear?: unknown }).clear,
    "undefined",
    "the installed lookup must not expose Map mutators",
  );
  assert.equal(
    typeof (installed as unknown as { set?: unknown }).set,
    "undefined",
  );
  const observation = installed.get("bits-ui");
  assert.ok(observation);
  assert.equal(Object.isFrozen(observation), true);
  if (observation.kind === "value") {
    assert.equal(Object.isFrozen(observation.manifest), true);
  }
  for (const value of installed.values()) {
    assert.equal(Object.isFrozen(value), true);
  }
});

test("attempted mutation and later disk edits cannot change an executable snapshot", (t) => {
  const project = withDependency(createSupportedProject());
  t.after(() => project.cleanup());
  const captured = captureSnapshot(project.root, paths());
  assert.equal(captured.ok, true, JSON.stringify(captured));
  if (!captured.ok) return;
  const snapshot = captured.value;
  const registry = dependencyRegistry();
  const input = {
    registry,
    config: DEFAULT_KIT_CONFIG,
    addedRoots: ["button"],
    snapshot,
    lock: null,
    registryVersion: registry.root.registryVersion,
    registryHash: registry.root.contentHash,
  };
  const before = planAdd(input);
  assert.equal(before.ok, true, JSON.stringify(before));
  if (!before.ok) return;
  assert.equal(
    before.value.executable,
    true,
    JSON.stringify(before.value.diagnostics),
  );

  const manifest = snapshot.environment.manifest;
  assert.equal(manifest.kind, "value");
  if (manifest.kind === "value") {
    const dependencies = manifest.value["dependencies"] as Record<
      string,
      unknown
    >;
    assert.throws(() => {
      dependencies["bits-ui"] = { invalid: true };
    }, TypeError);
  }
  const observation = snapshot.environment.installed.get("bits-ui");
  assert.ok(observation);
  assert.throws(() => {
    (observation as { kind: string }).kind = "malformed";
  }, TypeError);

  // A later disk edit is invisible to the frozen snapshot.
  writeFileSync(path.join(project.root, "package.json"), "{ not json");
  const after = planAdd(input);
  assert.equal(after.ok, true, JSON.stringify(after));
  if (!after.ok) return;
  assert.equal(after.value.executable, true);
  assert.deepEqual(
    after.value.writes.map((entry) => [entry.path, entry.operation]),
    before.value.writes.map((entry) => [entry.path, entry.operation]),
  );
  assert.deepEqual(after.value.diagnostics, before.value.diagnostics);
});

test("equivalent environment observations produce identical complete plans", (t) => {
  const first = withDependency(createSupportedProject());
  const second = withDependency(createSupportedProject());
  t.after(() => first.cleanup());
  t.after(() => second.cleanup());
  const registry = dependencyRegistry();
  const plan = (project: ReturnType<typeof createSupportedProject>) => {
    const captured = captureSnapshot(project.root, paths());
    assert.equal(captured.ok, true, JSON.stringify(captured));
    if (!captured.ok) throw new Error("snapshot failed");
    return planAdd({
      registry,
      config: DEFAULT_KIT_CONFIG,
      addedRoots: ["button"],
      snapshot: captured.value,
      lock: null,
      registryVersion: registry.root.registryVersion,
      registryHash: registry.root.contentHash,
    });
  };
  const left = plan(first);
  const right = plan(second);
  assert.equal(left.ok, true, JSON.stringify(left));
  assert.equal(right.ok, true, JSON.stringify(right));
  if (!left.ok || !right.ok) return;
  assert.deepEqual(
    left.value.writes.map((entry) => [entry.path, entry.operation]),
    right.value.writes.map((entry) => [entry.path, entry.operation]),
  );
  assert.deepEqual(left.value.diagnostics, right.value.diagnostics);
});
