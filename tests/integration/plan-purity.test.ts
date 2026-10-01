import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { hashBytes } from "../../src/codegen/compare.js";
import { planAdd } from "../../src/codegen/plan-add.js";
import { planInit } from "../../src/codegen/plan-init.js";
import { toPlanningEnvelope } from "../../src/codegen/plan.js";
import { planSync } from "../../src/codegen/plan-sync.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import type { KitLock } from "../../src/codegen/lock.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { createTempProject } from "../helpers/project.js";
import { componentItem, registryOf } from "../helpers/registry.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * S063 tests: planning is provably side-effect-free (no hidden files, bytes,
 * modes, kinds or links change), equivalent logical inputs yield identical
 * envelopes, a satisfied plan is a no_change, and no writer/package-manager
 * work starts.
 *
 * RCLD03-R4-4: the add and sync cases use *complete* observations and assert an
 * executable successful plan; a separate negative control reaches the intended
 * conflict cause rather than passing because an incomplete snapshot failed
 * first. The complete-tree snapshots include hidden/empty directories, modes,
 * kinds and symlink targets.
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
    `${derived.rootExportsDir}/spinner.svelte`,
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
  writes: readonly { path: string; bytes: Uint8Array; operation?: string }[],
): void {
  for (const write of writes) {
    const abs = path.join(project.root, write.path);
    if (write.operation === "retire") {
      continue;
    }
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, write.bytes);
  }
}

function sampleRegistry(registryVersion = "0.1.0") {
  const base = registryOf([
    componentItem("button", {
      exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
    }),
    componentItem("spinner", {
      exports: [{ name: "Spinner", target: "spinner.svelte", kind: "value" }],
    }),
  ]);
  return { ...base, root: { ...base.root, registryVersion } };
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

test("add planning is executable, side-effect-free and order-independent", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  // A hidden empty directory and a symlink must survive planning untouched.
  project.writeDir(".cache/empty");
  project.symlink("package.json", "linked.json");
  const registry = sampleRegistry();
  const before = snapshotTree(project.root);
  const forward = planAdd({
    registry,
    config: DEFAULT_KIT_CONFIG,
    addedRoots: ["button", "spinner"],
    snapshot: snapshotOf(project),
    lock: null,
    registryVersion: registry.root.registryVersion,
    registryHash: registry.root.contentHash,
  });
  const reverse = planAdd({
    registry,
    config: DEFAULT_KIT_CONFIG,
    addedRoots: ["spinner", "button"],
    snapshot: snapshotOf(project),
    lock: null,
    registryVersion: registry.root.registryVersion,
    registryHash: registry.root.contentHash,
  });
  assert.equal(forward.ok, true, JSON.stringify(forward));
  assert.equal(reverse.ok, true, JSON.stringify(reverse));
  if (!forward.ok || !reverse.ok) return;
  assert.equal(
    forward.value.executable,
    true,
    JSON.stringify(forward.value.diagnostics),
  );
  assert.equal(
    reverse.value.executable,
    true,
    JSON.stringify(reverse.value.diagnostics),
  );
  assert.ok(forward.value.writes.length > 0);
  assert.deepEqual(
    snapshotTree(project.root),
    before,
    "planning must not write",
  );
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
  assert.deepEqual(
    JSON.parse(JSON.stringify(forward.value.lock)),
    JSON.parse(JSON.stringify(reverse.value.lock)),
  );
});

test("sync planning reaches the intended B/L/I conflict with complete observations", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const source = `${derived.rootExportsDir}/button.svelte`;
  project.writeFile(source, "CUSTOM");
  const registry = registryOf([
    componentItem("button", {
      files: [
        {
          logicalSource: "registry/templates/button.svelte",
          target: "button.svelte",
          owner: "button",
          cohort: "core",
          blockId: null,
          bytes: new TextEncoder().encode("NEW"),
          digest: hashBytes(new TextEncoder().encode("NEW")) as string,
        },
      ],
    }),
  ]);
  const lock: KitLock = {
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
        baseHash: hashBytes(new TextEncoder().encode("BASE")) as string,
        itemVersion: "0.1.0",
        cohort: "core",
      },
    ],
    cssBlocks: [],
    integrations: [],
  };
  const before = snapshotTree(project.root);
  const result = planSync({
    registry,
    config: { ...DEFAULT_KIT_CONFIG, requested: ["button"] },
    snapshot: snapshotOf(project),
    lock,
    registryVersion: registry.root.registryVersion,
    registryHash: registry.root.contentHash,
  });
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

test("a metadata-only lock transition is distinct from a satisfied no_change", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const registry = sampleRegistry("0.1.0");
  const first = planAdd({
    registry,
    config: DEFAULT_KIT_CONFIG,
    addedRoots: ["button"],
    snapshot: snapshotOf(project),
    lock: null,
    registryVersion: registry.root.registryVersion,
    registryHash: registry.root.contentHash,
  });
  assert.equal(first.ok, true, JSON.stringify(first));
  if (!first.ok || !first.value.executable) return;
  apply(project, first.value.writes);

  // Same registry content, new registry version: only lock metadata changes.
  const bumped = sampleRegistry("0.2.0");
  const metadata = planAdd({
    registry: bumped,
    config: DEFAULT_KIT_CONFIG,
    addedRoots: ["button"],
    snapshot: snapshotOf(project),
    lock: first.value.lock,
    registryVersion: bumped.root.registryVersion,
    registryHash: bumped.root.contentHash,
  });
  assert.equal(metadata.ok, true, JSON.stringify(metadata));
  if (!metadata.ok) return;
  assert.equal(metadata.value.executable, true);
  const lockPath = `${derived.stateDir}/kit.lock.json`;
  assert.deepEqual(
    metadata.value.writes.map((entry) => entry.path),
    [lockPath],
    JSON.stringify(metadata.value.writes),
  );
  assert.equal(metadata.value.writes[0]?.operation, "update");
  apply(project, metadata.value.writes);

  const satisfied = planAdd({
    registry: bumped,
    config: DEFAULT_KIT_CONFIG,
    addedRoots: ["button"],
    snapshot: snapshotOf(project),
    lock: metadata.value.lock,
    registryVersion: bumped.root.registryVersion,
    registryHash: bumped.root.contentHash,
  });
  assert.equal(satisfied.ok, true, JSON.stringify(satisfied));
  if (!satisfied.ok) return;
  assert.deepEqual(satisfied.value.writes, []);
});
