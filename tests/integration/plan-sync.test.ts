import assert from "node:assert/strict";
import { test } from "node:test";

import { hashBytes } from "../../src/codegen/compare.js";
import { planSync } from "../../src/codegen/plan-sync.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import type { KitLock } from "../../src/codegen/lock.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import type { RegistrySnapshot } from "../../src/registry/load.js";
import { createSupportedProject } from "../helpers/project.js";
import { componentItem, registryOf, sourceFile } from "../helpers/registry.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * S060 tests: sync reconciles the desired roots with incoming content, keeps
 * local-only customizations, reports a real conflict without changing any
 * project state, and treats already-incoming content as a no_change.
 */

const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);
const SOURCE = `${derived.rootExportsDir}/button.svelte`;

function snapshotPaths(): string[] {
  return [
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    derived.rootExports,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    DEFAULT_KIT_CONFIG.layoutFile,
    SOURCE,
    `${derived.rootExportsDir}/spinner.svelte`,
  ];
}

function snapshotOf(project: ReturnType<typeof createSupportedProject>) {
  const result = captureSnapshot(project.root, snapshotPaths());
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("snapshot failed");
  return result.value;
}

function lockWithBase(base: string): KitLock {
  return {
    schemaVersion: 1,
    toolVersion: "1.0.0",
    registryVersion: "0.1.0",
    registryHash: "a".repeat(64),
    configHash: "b".repeat(64),
    requested: ["button"],
    items: [
      {
        id: "button",
        version: "0.1.0",
        digest: "c".repeat(64),
        origin: "explicit",
      },
    ],
    files: [
      {
        path: SOURCE,
        owner: "button",
        baseHash: hashBytes(new TextEncoder().encode(base)) as string,
        itemVersion: "0.1.0",
        cohort: "core",
      },
    ],
    cssBlocks: [],
    integrations: [],
  };
}

function seedLock(
  project: ReturnType<typeof createSupportedProject>,
  lock: KitLock,
): void {
  project.writeFile(
    `${derived.stateDir}/kit.lock.json`,
    `${JSON.stringify(lock, null, 2)}\n`,
  );
}

function syncInput(
  project: ReturnType<typeof createSupportedProject>,
  registry: RegistrySnapshot,
  lock: KitLock,
) {
  seedLock(project, lock);
  return {
    registry,
    config: { ...DEFAULT_KIT_CONFIG, requested: ["button"] },
    snapshot: snapshotOf(project),
    lock,
    registryVersion: "0.1.0",
    registryHash: "a".repeat(64),
  };
}

test("an untouched source is safely upgraded", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  project.writeFile(SOURCE, "BASE");
  const registry = registryOf([
    componentItem("button", {
      files: [sourceFile("button.svelte", "NEW", "button")],
    }),
  ]);
  const result = planSync(syncInput(project, registry, lockWithBase("BASE")));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, true);
  const write = result.value.writes.find((entry) => entry.path === SOURCE);
  assert.equal(new TextDecoder().decode(write?.bytes), "NEW");
});

test("a local-only customization is preserved", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  project.writeFile(SOURCE, "CUSTOM");
  const registry = registryOf([
    componentItem("button", {
      files: [sourceFile("button.svelte", "BASE", "button")],
    }),
  ]);
  const result = planSync(syncInput(project, registry, lockWithBase("BASE")));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, true);
  assert.ok(!result.value.writes.some((entry) => entry.path === SOURCE));
  assert.equal(
    result.value.lock?.files.find((entry) => entry.path === SOURCE)?.baseHash,
    hashBytes(new TextEncoder().encode("BASE")),
  );
});

test("a real conflict leaves every project target unchanged", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  project.writeFile(SOURCE, "CUSTOM");
  const registry = registryOf([
    componentItem("button", {
      files: [sourceFile("button.svelte", "NEW", "button")],
    }),
  ]);
  seedLock(project, lockWithBase("BASE"));
  const before = snapshotTree(project.root);
  const result = planSync(syncInput(project, registry, lockWithBase("BASE")));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.deepEqual(result.value.writes, []);
  assert.deepEqual(snapshotTree(project.root), before);
});

test("already-incoming content is a no_change", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  project.writeFile(SOURCE, "NEW");
  const registry = registryOf([
    componentItem("button", {
      files: [sourceFile("button.svelte", "NEW", "button")],
    }),
  ]);
  const result = planSync(syncInput(project, registry, lockWithBase("BASE")));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, true);
  assert.ok(!result.value.writes.some((entry) => entry.path === SOURCE));
});

test("requested roots stay separate from the transitive closure", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  const registry = registryOf([
    componentItem("button", {
      dependencies: ["spinner"],
      files: [sourceFile("button.svelte", "BASE", "button")],
    }),
    componentItem("spinner"),
  ]);
  const result = planSync(syncInput(project, registry, lockWithBase("BASE")));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.deepEqual(result.value.projection.requested, ["button"]);
  assert.deepEqual(
    [...result.value.projection.items.map((item) => item.id)].sort(),
    ["button", "spinner"],
  );
});
