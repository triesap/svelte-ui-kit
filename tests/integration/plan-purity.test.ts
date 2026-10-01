import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { planAdd } from "../../src/codegen/plan-add.js";
import { planInit } from "../../src/codegen/plan-init.js";
import { toPlanningEnvelope } from "../../src/codegen/plan.js";
import { planSync } from "../../src/codegen/plan-sync.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { createTempProject } from "../helpers/project.js";
import { componentItem, registryOf } from "../helpers/registry.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * S063 tests: planning is provably side-effect-free (no hidden files, bytes or
 * mode changes), equivalent logical inputs yield identical envelopes, a
 * satisfied plan is a no_change, and no writer/package-manager work starts.
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
  ];
}

function snapshotOf(project: ReturnType<typeof createTempProject>) {
  const result = captureSnapshot(project.root, paths());
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("snapshot failed");
  return result.value;
}

function initPlan(
  project: ReturnType<typeof createTempProject>,
  layout: string,
) {
  return planInit({
    config: DEFAULT_KIT_CONFIG,
    layoutFile: DEFAULT_KIT_CONFIG.layoutFile,
    layoutSource: layout,
    snapshot: snapshotOf(project),
    registryVersion: "0.1.0",
    registryHash: "a".repeat(64),
    configHash: "b".repeat(64),
  });
}

function apply(
  project: ReturnType<typeof createTempProject>,
  writes: readonly { path: string; bytes: Uint8Array }[],
): void {
  for (const write of writes) {
    const abs = path.join(project.root, write.path);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, write.bytes);
  }
}

test("initialization planning is side-effect-free and repeats as no_change", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const before = snapshotTree(project.root);
  const first = initPlan(project, "<main />");
  assert.equal(first.ok, true, JSON.stringify(first));
  if (!first.ok) return;
  assert.deepEqual(snapshotTree(project.root), before);
  apply(project, first.value.writes);
  const layout = readFileSync(
    path.join(project.root, DEFAULT_KIT_CONFIG.layoutFile),
    "utf8",
  );
  const second = initPlan(project, layout);
  assert.equal(second.ok, true, JSON.stringify(second));
  if (!second.ok) return;
  assert.deepEqual(second.value.writes, []);
});

test("add planning is side-effect-free and order-independent", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const registry = registryOf([
    componentItem("button"),
    componentItem("spinner"),
  ]);
  const before = snapshotTree(project.root);
  const forward = planAdd({
    registry,
    config: DEFAULT_KIT_CONFIG,
    addedRoots: ["button", "spinner"],
    snapshot: snapshotOf(project),
    lock: null,
    registryVersion: "0.1.0",
    registryHash: "a".repeat(64),
  });
  const reverse = planAdd({
    registry,
    config: DEFAULT_KIT_CONFIG,
    addedRoots: ["spinner", "button"],
    snapshot: snapshotOf(project),
    lock: null,
    registryVersion: "0.1.0",
    registryHash: "a".repeat(64),
  });
  assert.equal(forward.ok, true, JSON.stringify(forward));
  assert.equal(reverse.ok, true, JSON.stringify(reverse));
  if (!forward.ok || !reverse.ok) return;
  assert.deepEqual(snapshotTree(project.root), before);
  const forwardEnvelope = toPlanningEnvelope(
    "add",
    forward.value.executable,
    forward.value.writes,
    forward.value.diagnostics,
  );
  const reverseEnvelope = toPlanningEnvelope(
    "add",
    reverse.value.executable,
    reverse.value.writes,
    reverse.value.diagnostics,
  );
  assert.deepEqual(forwardEnvelope, reverseEnvelope);
});

test("sync conflict planning writes nothing and starts no writer", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const source = `${derived.rootExportsDir}/button.svelte`;
  project.writeFile(source, "CUSTOM");
  const registry = registryOf([componentItem("button")]);
  const before = snapshotTree(project.root);
  const result = planSync({
    registry,
    config: { ...DEFAULT_KIT_CONFIG, requested: ["button"] },
    snapshot: snapshotOf(project),
    lock: {
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
          path: source,
          owner: "button",
          baseHash: "d".repeat(64),
          itemVersion: "0.1.0",
          cohort: "core",
        },
      ],
      cssBlocks: [],
      integrations: [],
    },
    registryVersion: "0.1.0",
    registryHash: "a".repeat(64),
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.deepEqual(result.value.writes, []);
  assert.deepEqual(snapshotTree(project.root), before);
});
