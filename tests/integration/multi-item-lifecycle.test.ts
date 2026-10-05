import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
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
  RETAINED_OWNERSHIP,
  applyGuarded,
  assertApplied,
  assertLockOwnership,
  currentLock,
} from "../helpers/lifecycle-assertions.js";
import {
  CUSTOM_MULTI_ITEM_CONFIG,
  compoundPaths,
  compoundRegistry,
  seedMultiItemConsumer,
} from "../helpers/multi-item-fixture.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * RCLD04-R2-5: a representative multi-item registry fixture driven through the
 * production planner and guarded apply, parameterized over a default and an
 * independently rooted custom mapping. The fixture (and its approved
 * manifest/template/component contracts) lives in
 * `tests/helpers/multi-item-fixture.ts`; the whole-tree and ownership
 * assertions live in `tests/helpers/lifecycle-assertions.ts`. It supplements,
 * and does not replace, the shipped-foundation lifecycle qualification.
 *
 * Each add/update/retirement step derives its expected tree from the captured
 * pre-state and the composed production plan, then compares the complete
 * resulting tree including bytes, modes, kinds, symlink targets and unrelated
 * application content. The only structural changes permitted are the parent
 * directories the plan itself requires.
 */

function abs(root: string, rel: string): string {
  return path.join(root, ...rel.split("/"));
}

/**
 * Run the same add → update → retirement lifecycle for one mapping. Each step
 * compares the complete resulting tree against the pre-state plus the composed
 * production plan.
 */
function runMultiItemLifecycle(config: KitConfig): void {
  const derived = deriveKitPaths(config);
  const registryRoot = mkdtempSync(path.join(os.tmpdir(), "suik-multi-reg-"));
  const updatedRoot = mkdtempSync(path.join(os.tmpdir(), "suik-multi-upd-"));
  const retiredRoot = mkdtempSync(path.join(os.tmpdir(), "suik-multi-ret-"));
  const consumer = seedMultiItemConsumer("<h1>MULTI_ITEM_PAGE</h1>\n");
  try {
    // ---- add -------------------------------------------------------------
    const install = compoundRegistry(registryRoot);
    assert.equal(install.ok, true, JSON.stringify(install));
    if (!install.ok) return;
    const first = captureSnapshot(consumer, compoundPaths(config));
    assert.equal(first.ok, true, JSON.stringify(first));
    if (!first.ok) return;
    const added = planAdd({
      registry: install.value,
      config,
      // Only card is requested; button is pulled as a registry dependency.
      addedRoots: ["card"],
      snapshot: first.value,
      lock: null,
      registryVersion: install.value.root.registryVersion,
      registryHash: install.value.root.contentHash,
    });
    assert.equal(added.ok, true, JSON.stringify(added));
    if (!added.ok) return;
    assert.equal(
      added.value.executable,
      true,
      JSON.stringify(added.value.diagnostics),
    );

    const beforeAdd = snapshotTree(consumer);
    const installed = applyGuarded(
      consumer,
      config,
      first.value,
      added.value.writes,
    );
    assertApplied("add", consumer, config, beforeAdd, installed);

    // Hybrid file set: both items' Svelte files and the card TypeScript file.
    for (const rel of [
      `${derived.rootExportsDir}/button.svelte`,
      `${derived.rootExportsDir}/card.svelte`,
      `${derived.rootExportsDir}/card.types.ts`,
    ]) {
      assert.equal(existsSync(abs(consumer, rel)), true, rel);
    }
    // Multiple CSS blocks from both items share the aggregate stylesheet.
    const css = readFileSync(abs(consumer, derived.kitCss), "utf8");
    assert.match(css, /\.button\b/);
    assert.match(css, /\.card\b/);
    assert.match(css, /\.card-extra\b/);
    // Value and type exports are aggregated into the root exports region.
    const exports = readFileSync(abs(consumer, derived.rootExports), "utf8");
    assert.match(exports, /Button/);
    assert.match(exports, /Card/);
    assert.match(exports, /CardProps/);
    assertLockOwnership(
      currentLock(consumer, derived),
      config,
      ADDED_OWNERSHIP,
    );

    // ---- update ----------------------------------------------------------
    const updated = compoundRegistry(updatedRoot, {
      cardBody: '<div class="card">v2</div>\n',
    });
    assert.equal(updated.ok, true, JSON.stringify(updated));
    if (!updated.ok) return;
    const second = captureSnapshot(consumer, compoundPaths(config));
    assert.equal(second.ok, true, JSON.stringify(second));
    if (!second.ok) return;
    const sync = planSync({
      registry: updated.value,
      config: { ...config, requested: ["card"] },
      snapshot: second.value,
      lock: currentLock(consumer, derived),
      registryVersion: updated.value.root.registryVersion,
      registryHash: updated.value.root.contentHash,
    });
    assert.equal(sync.ok, true, JSON.stringify(sync));
    if (!sync.ok) return;
    assert.equal(
      sync.value.executable,
      true,
      JSON.stringify(sync.value.diagnostics),
    );
    const buttonAfterInstall = readFileSync(
      abs(consumer, `${derived.rootExportsDir}/button.svelte`),
      "utf8",
    );
    const beforeUpdate = snapshotTree(consumer);
    const updatedApply = applyGuarded(
      consumer,
      config,
      second.value,
      sync.value.writes,
    );
    assertApplied("update", consumer, config, beforeUpdate, updatedApply);
    assert.match(
      readFileSync(
        abs(consumer, `${derived.rootExportsDir}/card.svelte`),
        "utf8",
      ),
      /v2/,
    );
    assert.equal(
      readFileSync(
        abs(consumer, `${derived.rootExportsDir}/button.svelte`),
        "utf8",
      ),
      buttonAfterInstall,
    );
    assertLockOwnership(
      currentLock(consumer, derived),
      config,
      ADDED_OWNERSHIP,
    );

    // ---- retirement ------------------------------------------------------
    const retired = compoundRegistry(retiredRoot, { includeCard: false });
    assert.equal(retired.ok, true, JSON.stringify(retired));
    if (!retired.ok) return;
    const third = captureSnapshot(consumer, compoundPaths(config));
    assert.equal(third.ok, true, JSON.stringify(third));
    if (!third.ok) return;
    const retirement = planSync({
      registry: retired.value,
      config: { ...config, requested: ["button"] },
      snapshot: third.value,
      lock: currentLock(consumer, derived),
      registryVersion: retired.value.root.registryVersion,
      registryHash: retired.value.root.contentHash,
    });
    assert.equal(retirement.ok, true, JSON.stringify(retirement));
    if (!retirement.ok) return;
    assert.equal(
      retirement.value.executable,
      true,
      JSON.stringify(retirement.value.diagnostics),
    );
    const beforeRetirement = snapshotTree(consumer);
    const removed = applyGuarded(
      consumer,
      config,
      third.value,
      retirement.value.writes,
    );
    assertApplied("retirement", consumer, config, beforeRetirement, removed);
    assert.equal(
      existsSync(abs(consumer, `${derived.rootExportsDir}/card.svelte`)),
      false,
    );
    assert.equal(
      existsSync(abs(consumer, `${derived.rootExportsDir}/card.types.ts`)),
      false,
    );
    assert.equal(
      existsSync(abs(consumer, `${derived.rootExportsDir}/button.svelte`)),
      true,
    );
    const finalCss = readFileSync(abs(consumer, derived.kitCss), "utf8");
    assert.match(finalCss, /\.button\b/);
    assert.doesNotMatch(finalCss, /\.card\b/);
    assertLockOwnership(
      currentLock(consumer, derived),
      config,
      RETAINED_OWNERSHIP,
    );
    // The retained dependency's unrelated page content survives untouched.
    assert.match(
      readFileSync(abs(consumer, "src/routes/+page.svelte"), "utf8"),
      /MULTI_ITEM_PAGE/,
    );
  } finally {
    rmSync(registryRoot, { recursive: true, force: true });
    rmSync(updatedRoot, { recursive: true, force: true });
    rmSync(retiredRoot, { recursive: true, force: true });
    rmSync(consumer, { recursive: true, force: true });
  }
}

test("default mapping: multi-item add, update and retirement match the complete planned tree", () => {
  runMultiItemLifecycle(DEFAULT_KIT_CONFIG);
});

test("independent custom mapping: multi-item add, update and retirement match the complete planned tree", () => {
  runMultiItemLifecycle(CUSTOM_MULTI_ITEM_CONFIG);
});
