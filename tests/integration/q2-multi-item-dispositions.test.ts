import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { planAdd } from "../../src/codegen/plan-add.js";
import { planSync } from "../../src/codegen/plan-sync.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
  type KitConfig,
} from "../../src/project/config.js";
import {
  ADDED_OWNERSHIP,
  applyGuarded,
  assertApplied,
  assertLockOwnership,
  currentLock,
} from "../helpers/lifecycle-assertions.js";
import {
  CARD,
  CUSTOM_MULTI_ITEM_CONFIG,
  compoundPaths,
  compoundRegistry,
  seedMultiItemConsumer,
} from "../helpers/multi-item-fixture.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * RCLD04-R2-5 Q2: satisfied, metadata-only and conflicting dispositions for the
 * representative multi-item registry, through the existing production
 * planner/composition/validation/application core, for the default and the
 * independently rooted custom mapping. Each disposition asserts the exact
 * whole resulting tree and the derived lock ownership: satisfied leaves the
 * tree untouched, metadata-only confines the write to the canonical lock, and a
 * conflicting managed target refuses with no semantic writes.
 *
 * Component add/update/retirement tree and ownership coverage stays in
 * `multi-item-lifecycle.test.ts`; the resulting consumer's real check/build/
 * render is qualified in `tests/smoke/q2-resulting-consumer.test.mjs`.
 */

function abs(root: string, rel: string): string {
  return path.join(root, ...rel.split("/"));
}

function runDispositions(config: KitConfig): void {
  const derived = deriveKitPaths(config);
  const registryRoot = mkdtempSync(path.join(os.tmpdir(), "suik-q2-reg-"));
  const metadataRoot = mkdtempSync(path.join(os.tmpdir(), "suik-q2-meta-"));
  const consumer = seedMultiItemConsumer("<h1>DISPOSITION_PAGE</h1>\n");
  try {
    // ---- install the multi-item cohort through the guarded core ----------
    const installed = compoundRegistry(registryRoot);
    assert.equal(installed.ok, true, JSON.stringify(installed));
    if (!installed.ok) return;
    const first = captureSnapshot(consumer, compoundPaths(config));
    assert.equal(first.ok, true, JSON.stringify(first));
    if (!first.ok) return;
    const add = planAdd({
      registry: installed.value,
      config,
      addedRoots: ["card"],
      snapshot: first.value,
      lock: null,
      registryVersion: installed.value.root.registryVersion,
      registryHash: installed.value.root.contentHash,
    });
    assert.equal(add.ok, true, JSON.stringify(add));
    if (!add.ok) return;
    assert.equal(
      add.value.executable,
      true,
      JSON.stringify(add.value.diagnostics),
    );
    const beforeInstall = snapshotTree(consumer);
    assertApplied(
      "install",
      consumer,
      config,
      beforeInstall,
      applyGuarded(consumer, config, first.value, add.value.writes),
    );
    assertLockOwnership(
      currentLock(consumer, derived),
      config,
      ADDED_OWNERSHIP,
    );

    // ---- satisfied: identical desired state is a no-change plan ----------
    const satisfiedBefore = snapshotTree(consumer);
    const satisfiedLock = JSON.stringify(currentLock(consumer, derived));
    const satisfiedSnapshot = captureSnapshot(consumer, compoundPaths(config));
    assert.equal(satisfiedSnapshot.ok, true, JSON.stringify(satisfiedSnapshot));
    if (!satisfiedSnapshot.ok) return;
    const satisfied = planSync({
      registry: installed.value,
      config: { ...config, requested: ["card"] },
      snapshot: satisfiedSnapshot.value,
      lock: currentLock(consumer, derived),
      registryVersion: installed.value.root.registryVersion,
      registryHash: installed.value.root.contentHash,
    });
    assert.equal(satisfied.ok, true, JSON.stringify(satisfied));
    if (!satisfied.ok) return;
    assert.equal(
      satisfied.value.executable,
      true,
      JSON.stringify(satisfied.value.diagnostics),
    );
    // No write at all: the whole plan is satisfied, so the application is not
    // entered and neither the tree nor the canonical lock changes.
    assert.deepEqual(satisfied.value.writes, []);
    assert.deepEqual(snapshotTree(consumer), satisfiedBefore);
    assert.equal(JSON.stringify(currentLock(consumer, derived)), satisfiedLock);
    assertLockOwnership(
      currentLock(consumer, derived),
      config,
      ADDED_OWNERSHIP,
    );

    // ---- metadata-only: a registry version change publishes only the lock -
    const metadataRegistry = compoundRegistry(metadataRoot, {
      version: "0.2.0",
    });
    assert.equal(metadataRegistry.ok, true, JSON.stringify(metadataRegistry));
    if (!metadataRegistry.ok) return;
    const metadataBefore = snapshotTree(consumer);
    const metadataSnapshot = captureSnapshot(consumer, compoundPaths(config));
    assert.equal(metadataSnapshot.ok, true, JSON.stringify(metadataSnapshot));
    if (!metadataSnapshot.ok) return;
    const metadata = planSync({
      registry: metadataRegistry.value,
      config: { ...config, requested: ["card"] },
      snapshot: metadataSnapshot.value,
      lock: currentLock(consumer, derived),
      registryVersion: metadataRegistry.value.root.registryVersion,
      registryHash: metadataRegistry.value.root.contentHash,
    });
    assert.equal(metadata.ok, true, JSON.stringify(metadata));
    if (!metadata.ok) return;
    assert.equal(
      metadata.value.executable,
      true,
      JSON.stringify(metadata.value.diagnostics),
    );
    // Exactly the canonical lock is written; no generated source, stylesheet
    // or exports file is regenerated.
    assert.deepEqual(
      metadata.value.writes.map((write) => write.path),
      [`${derived.stateDir}/kit.lock.json`],
    );
    const metadataGuarded = applyGuarded(
      consumer,
      config,
      metadataSnapshot.value,
      metadata.value.writes,
    );
    assertApplied(
      "metadata-only",
      consumer,
      config,
      metadataBefore,
      metadataGuarded,
    );
    assertLockOwnership(
      currentLock(consumer, derived),
      config,
      ADDED_OWNERSHIP,
    );
    assert.equal(
      readFileSync(
        abs(consumer, `${derived.rootExportsDir}/card.svelte`),
        "utf8",
      ),
      CARD.body,
    );

    // ---- conflict: a non-regular managed target refuses the whole batch ---
    const cardTarget = abs(consumer, `${derived.rootExportsDir}/card.svelte`);
    rmSync(cardTarget);
    mkdirSync(cardTarget);
    const conflictBefore = snapshotTree(consumer);
    const conflictLock = JSON.stringify(currentLock(consumer, derived));
    const conflictSnapshot = captureSnapshot(consumer, compoundPaths(config));
    assert.equal(conflictSnapshot.ok, true, JSON.stringify(conflictSnapshot));
    if (!conflictSnapshot.ok) return;
    const conflict = planSync({
      registry: metadataRegistry.value,
      config: { ...config, requested: ["card"] },
      snapshot: conflictSnapshot.value,
      lock: currentLock(consumer, derived),
      registryVersion: metadataRegistry.value.root.registryVersion,
      registryHash: metadataRegistry.value.root.contentHash,
    });
    assert.equal(conflict.ok, true, JSON.stringify(conflict));
    if (!conflict.ok) return;
    assert.equal(conflict.value.executable, false);
    assert.deepEqual(conflict.value.writes, []);
    assert.match(
      JSON.stringify(conflict.value.diagnostics),
      /conflict/,
      JSON.stringify(conflict.value.diagnostics),
    );
    // The whole tree and the canonical lock stay exactly as planned against:
    // no semantic write occurred and the conflicting target is untouched.
    assert.deepEqual(snapshotTree(consumer), conflictBefore);
    assert.equal(JSON.stringify(currentLock(consumer, derived)), conflictLock);
    assert.equal(existsSync(cardTarget), true);
  } finally {
    rmSync(registryRoot, { recursive: true, force: true });
    rmSync(metadataRoot, { recursive: true, force: true });
    rmSync(consumer, { recursive: true, force: true });
  }
}

test("default mapping: multi-item satisfied, metadata-only and conflict dispositions", () => {
  runDispositions(DEFAULT_KIT_CONFIG);
});

test("custom mapping: multi-item satisfied, metadata-only and conflict dispositions", () => {
  runDispositions(CUSTOM_MULTI_ITEM_CONFIG);
});
