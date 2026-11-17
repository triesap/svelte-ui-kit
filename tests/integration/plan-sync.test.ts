import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { planInit } from "../../src/codegen/plan-init.js";
import { serializeKitConfig } from "../../src/project/config.js";

import { hashBytes } from "../../src/codegen/compare.js";
import type { KitLock } from "../../src/codegen/lock.js";
import { planSync } from "../../src/codegen/plan-sync.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
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
    target: "sveltekit",
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
    integrations: [
      {
        kind: "layout",
        path: DEFAULT_KIT_CONFIG.layoutFile,
        contract: "layout-v1",
        baseline: "e".repeat(64),
      },
      {
        kind: "stylesheet",
        path: derived.kitCss,
        contract: "foundation-tokens-v1",
        baseline: "e".repeat(64),
      },
      {
        kind: "exports",
        path: derived.rootExports,
        contract: "exports-v1",
        baseline: "e".repeat(64),
      },
    ],
  };
}

/** Seed actual production-authored foundation ownership, then the controlled
 * component base lineage under test. No absent file is mislabeled as owned. */
function seedLock(
  project: ReturnType<typeof createSupportedProject>,
  lock: KitLock,
): KitLock {
  const lockPath = `${derived.stateDir}/kit.lock.json`;
  let integrations: KitLock["integrations"];
  if (!existsSync(path.join(project.root, lockPath))) {
    const snapshot = captureSnapshot(project.root, snapshotPaths());
    assert.ok(snapshot.ok, JSON.stringify(snapshot));
    const foundation = planInit({
      config: DEFAULT_KIT_CONFIG,
      layoutFile: DEFAULT_KIT_CONFIG.layoutFile,
      layoutSource: "",
      snapshot: snapshot.value,
      registry: registryOf([]),
      configHash: "b".repeat(64),
    });
    assert.ok(foundation.ok, JSON.stringify(foundation));
    for (const write of foundation.value.writes)
      project.writeFile(write.path, write.bytes);
    integrations = foundation.value.lock.integrations;
  } else {
    integrations = (
      JSON.parse(
        readFileSync(path.join(project.root, lockPath), "utf8"),
      ) as KitLock
    ).integrations;
  }
  const config = serializeKitConfig({
    ...DEFAULT_KIT_CONFIG,
    requested: lock.requested,
  });
  const installed = {
    ...lock,
    integrations,
    configHash: hashBytes(new TextEncoder().encode(config)) as string,
  };
  for (const [file, text] of [
    [`${derived.stateDir}/kit.json`, config],
    [lockPath, JSON.stringify(installed, null, 2) + "\n"],
  ] as const) {
    if (
      !existsSync(path.join(project.root, file)) ||
      readFileSync(path.join(project.root, file), "utf8") !== text
    )
      project.writeFile(file, text);
  }
  return installed;
}

function syncInput(
  project: ReturnType<typeof createSupportedProject>,
  registry: RegistrySnapshot,
  lock: KitLock,
) {
  lock = seedLock(project, lock);
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
  assert.equal(
    result.value.executable,
    true,
    JSON.stringify(result.value.diagnostics),
  );
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
  assert.equal(
    result.value.executable,
    true,
    JSON.stringify(result.value.diagnostics),
  );
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
  assert.ok(
    result.value.diagnostics.some(
      (entry) =>
        entry.includes("source conflict") &&
        entry.includes("local and incoming content both changed"),
    ),
    JSON.stringify(result.value.diagnostics),
  );
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
  assert.equal(
    result.value.executable,
    true,
    JSON.stringify(result.value.diagnostics),
  );
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
