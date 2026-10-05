import assert from "node:assert/strict";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  applyPlan,
  validateApplyPlan,
  type ValidatedApplyPlan,
} from "../../src/codegen/apply.js";
import { composeApplyPlan } from "../../src/codegen/compose.js";
import { planInit } from "../../src/codegen/plan-init.js";
import type { PlanWrite } from "../../src/codegen/plan.js";
import {
  recoverTransactions,
  type RecoveryResult,
  type RecoveryRoots,
} from "../../src/codegen/recovery.js";
import {
  captureSnapshot,
  type ProjectSnapshot,
} from "../../src/codegen/snapshot.js";
import { faultAt } from "../../src/codegen/transaction-hooks.js";
import {
  lockPath,
  transactionsDir,
  transientRoot,
  writerLockDir,
} from "../../src/codegen/transaction-types.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
  type KitConfig,
} from "../../src/project/config.js";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import { computeRegistryContentHash } from "../../src/registry/model.js";
import {
  runGuardedProductionWorker,
  runGuardedWorker,
} from "../helpers/guarded-process.js";
import {
  GUARDED_LAYOUT,
  GUARDED_STATE,
  GUARDED_STYLES,
  GUARDED_UI,
} from "../helpers/guarded-plan.js";
import {
  assertTreeAfterMutations,
  snapshotTree,
  type TreeEntry,
  type TreeMutation,
} from "../helpers/tree-snapshot.js";

/**
 * RCLD04-Q3-CLEANUP: production cleanup/restart qualification.
 *
 * The guarded production core (`planInit` -> `composeApplyPlan` ->
 * `validateApplyPlan` -> `applyPlan`) is exercised against a real captured
 * snapshot for the normal, prepublication-refusal and metadata-only commit
 * dispositions, with exact whole-tree comparisons and unrelated-state
 * survival. Real SIGKILL subprocess interruption then qualifies restart: a
 * kill after the writer release is finished by a fresh coordinating process,
 * while a kill that still holds coordination fails closed with retained owner
 * evidence and is never taken over.
 */

const PKG_ROOT = process.cwd();

const abs = (root: string, logical: string): string =>
  path.join(root, ...logical.split("/"));

function seedConsumer(root: string): void {
  write(
    root,
    "package.json",
    JSON.stringify({
      name: "consumer",
      type: "module",
      dependencies: {
        svelte: "5.57.1",
        "@sveltejs/kit": "2.70.3",
        "bits-ui": "2.19.3",
        "@internationalized/date": "3.12.4",
      },
    }),
  );
  // Unrelated application state that no plan may touch.
  write(root, "unrelated/keep.txt", "keep me\n");
}

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-restart-"));
  try {
    seedConsumer(root);
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function write(root: string, logical: string, data: string | Uint8Array): void {
  const target = abs(root, logical);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, data);
}

function rootsFor(config: KitConfig): RecoveryRoots {
  return {
    uiDir: config.uiDir,
    stylesDir: config.stylesDir,
    layoutFile: config.layoutFile,
  };
}

function initPaths(config: KitConfig): string[] {
  const derived = deriveKitPaths(config);
  return [
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    derived.rootExports,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    config.layoutFile,
    ".gitignore",
  ];
}

function planFor(root: string, config: KitConfig, configHash = "b".repeat(64)) {
  const registry = loadRegistrySnapshot(createAssetProvider(PKG_ROOT));
  assert.equal(registry.ok, true, JSON.stringify(registry));
  if (!registry.ok) throw new Error("registry load failed");
  const snapshot = captureSnapshot(root, initPaths(config));
  assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
  if (!snapshot.ok) throw new Error("snapshot failed");
  const layoutAbs = abs(root, config.layoutFile);
  const layoutSource = existsSync(layoutAbs)
    ? readFileSync(layoutAbs, "utf8")
    : "";
  const planned = planInit({
    config,
    layoutFile: config.layoutFile,
    layoutSource,
    snapshot: snapshot.value,
    registry: registry.value,
    configHash,
  });
  assert.equal(planned.ok, true, JSON.stringify(planned));
  if (!planned.ok) throw new Error("planInit failed");
  return { snapshot: snapshot.value, planned: planned.value };
}

function planMutations(
  plan: ValidatedApplyPlan,
  config: KitConfig,
): TreeMutation[] {
  const derived = deriveKitPaths(config);
  const mutations: TreeMutation[] = plan.targets.map((target) => ({
    path: target.path,
    operation: target.operation,
    bytes: target.bytes,
    mode: target.mode,
  }));
  mutations.push({
    path: `${derived.stateDir}/kit.lock.json`,
    operation: plan.lock.preimage.kind === "file" ? "update" : "create",
    bytes: plan.lock.bytes,
    mode: plan.lock.preimage.mode ?? 0o644,
  });
  return mutations;
}

function applyCaptured(
  root: string,
  config: KitConfig,
  snapshot: ProjectSnapshot,
  writes: readonly PlanWrite[],
  hooks?: Parameters<typeof applyPlan>[1],
) {
  const composed = composeApplyPlan({ root, config, writes, snapshot });
  assert.equal(composed.ok, true, JSON.stringify(composed));
  if (!composed.ok) throw new Error("compose failed");
  const validated = validateApplyPlan(composed.value);
  assert.equal(validated.ok, true, JSON.stringify(validated));
  if (!validated.ok) throw new Error("validate failed");
  return {
    plan: validated.value,
    outcome: applyPlan(validated.value, hooks),
  };
}

function assertNoRefusal(results: readonly RecoveryResult[]): void {
  const refused = results.filter((entry) => entry.status === "refused");
  assert.deepEqual(refused, [], JSON.stringify(results));
}

const CONFIGS: readonly [string, KitConfig][] = [
  ["default", DEFAULT_KIT_CONFIG],
  [
    "custom",
    { ...DEFAULT_KIT_CONFIG, uiDir: "app/ui", stylesDir: "assets/styles" },
  ],
];

for (const [label, config] of CONFIGS) {
  test(`${label}: a normal commit preserves the exact tree and survives a fresh recovery`, () => {
    withRoot((root) => {
      const { snapshot, planned } = planFor(root, config);
      const before = snapshotTree(root);
      const guarded = applyCaptured(root, config, snapshot, planned.writes);
      assert.equal(
        guarded.outcome.kind,
        "applied",
        JSON.stringify(guarded.outcome.issues),
      );
      const derived = deriveKitPaths(config);
      assert.equal(
        existsSync(abs(root, `${derived.stateDir}/kit.lock.json`)),
        true,
      );
      assert.equal(
        existsSync(abs(root, `${derived.stateDir}/.svelte-ui-kit`)),
        false,
        "a completed commit leaves no transient namespace",
      );
      // Exact resulting tree, and unrelated application state untouched.
      assertTreeAfterMutations(
        root,
        before,
        planMutations(guarded.plan, config),
      );
      const committed = snapshotTree(root);

      const results = recoverTransactions(
        root,
        derived.stateDir,
        rootsFor(config),
      );
      assertNoRefusal(results);
      assert.deepEqual(
        snapshotTree(root),
        committed,
        "a fresh recovery after a completed commit must not change the tree",
      );
    });
  });

  test(`${label}: a prepublication interruption rolls back to the exact captured tree`, () => {
    withRoot((root) => {
      const { snapshot, planned } = planFor(root, config);
      const before = snapshotTree(root);
      const guarded = applyCaptured(
        root,
        config,
        snapshot,
        planned.writes,
        faultAt("durability:replace"),
      );
      assert.equal(
        guarded.outcome.kind,
        "refused",
        JSON.stringify(guarded.outcome.issues),
      );
      // The refused batch restores the captured tree exactly, including the
      // unrelated application state, and leaves no owned residue.
      assert.deepEqual(
        snapshotTree(root),
        before,
        "an uncommitted refusal must restore the exact captured tree",
      );
      const derived = deriveKitPaths(config);
      assert.equal(
        existsSync(abs(root, `${derived.stateDir}/kit.lock.json`)),
        false,
        "a prepublication refusal must not publish the lock",
      );
      const results = recoverTransactions(
        root,
        derived.stateDir,
        rootsFor(config),
      );
      assertNoRefusal(results);
      assert.deepEqual(snapshotTree(root), before);
    });
  });
}

test("default: a metadata-only commit publishes only the lock and survives recovery", () => {
  withRoot((root) => {
    const first = planFor(root, DEFAULT_KIT_CONFIG);
    const applied = applyCaptured(
      root,
      DEFAULT_KIT_CONFIG,
      first.snapshot,
      first.planned.writes,
    );
    assert.equal(
      applied.outcome.kind,
      "applied",
      JSON.stringify(applied.outcome.issues),
    );

    // An empty registry with a bumped version changes only lock metadata.
    const altRoot = mkdtempSync(path.join(os.tmpdir(), "suik-restart-reg-"));
    try {
      cpSync(path.join(PKG_ROOT, "schema"), path.join(altRoot, "schema"), {
        recursive: true,
      });
      const basis = {
        schemaVersion: 1,
        registryVersion: "0.2.0",
        compatibility: { svelte: "5.57.1", bits: "2.19.3", date: "^3.8.1" },
        items: [] as { id: string; manifest: string }[],
      };
      write(
        altRoot,
        "registry/registry.json",
        JSON.stringify({
          ...basis,
          contentHash: computeRegistryContentHash(basis, []),
        }),
      );
      const altRegistry = loadRegistrySnapshot(createAssetProvider(altRoot));
      assert.equal(altRegistry.ok, true, JSON.stringify(altRegistry));
      if (!altRegistry.ok) return;
      const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);
      const snapshot = captureSnapshot(root, initPaths(DEFAULT_KIT_CONFIG));
      assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
      if (!snapshot.ok) return;
      const planned = planInit({
        config: DEFAULT_KIT_CONFIG,
        layoutFile: DEFAULT_KIT_CONFIG.layoutFile,
        layoutSource: readFileSync(
          abs(root, DEFAULT_KIT_CONFIG.layoutFile),
          "utf8",
        ),
        snapshot: snapshot.value,
        registry: altRegistry.value,
        configHash: "b".repeat(64),
      });
      assert.equal(planned.ok, true, JSON.stringify(planned));
      if (!planned.ok) return;
      assert.deepEqual(
        planned.value.writes.map((write) => write.path),
        [`${derived.stateDir}/kit.lock.json`],
        "a metadata-only plan must write only the lock",
      );
      const before = snapshotTree(root);
      const reapply = applyCaptured(
        root,
        DEFAULT_KIT_CONFIG,
        snapshot.value,
        planned.value.writes,
      );
      assert.equal(
        reapply.outcome.kind,
        "applied",
        JSON.stringify(reapply.outcome.issues),
      );
      assertTreeAfterMutations(
        root,
        before,
        planMutations(reapply.plan, DEFAULT_KIT_CONFIG),
      );
      const committed = snapshotTree(root);
      const results = recoverTransactions(
        root,
        derived.stateDir,
        rootsFor(DEFAULT_KIT_CONFIG),
      );
      assertNoRefusal(results);
      assert.deepEqual(snapshotTree(root), committed);
    } finally {
      rmSync(altRoot, { recursive: true, force: true });
    }
  });
});

test("a kill after the writer release is finished by a fresh recovery", () => {
  withRoot((root) => {
    const killed = runGuardedWorker({
      root,
      uiDir: GUARDED_UI,
      stylesDir: GUARDED_STYLES,
      layoutFile: GUARDED_LAYOUT,
      stateDir: GUARDED_STATE,
      boundary: "durability:release",
      mode: "kill",
    });
    assert.equal(killed.signal, "SIGKILL", killed.stderr);
    // The commit is durable and the writer lock was released before the kill.
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "new css",
    );
    assert.equal(existsSync(abs(root, lockPath(GUARDED_STATE))), true);
    assert.equal(existsSync(abs(root, writerLockDir(GUARDED_STATE))), false);

    const results = recoverTransactions(root, GUARDED_STATE, {
      uiDir: GUARDED_UI,
      stylesDir: GUARDED_STYLES,
      layoutFile: GUARDED_LAYOUT,
    });
    assertNoRefusal(results);
    assert.equal(
      existsSync(abs(root, transientRoot(GUARDED_STATE))),
      false,
      "the fresh recovery finishes the interrupted empty namespace",
    );
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "new css",
      "recovery must never roll back a committed batch",
    );
  });
});

test("a process killed while holding coordination fails closed with owner evidence", () => {
  withRoot((root) => {
    const killed = runGuardedWorker({
      root,
      uiDir: GUARDED_UI,
      stylesDir: GUARDED_STYLES,
      layoutFile: GUARDED_LAYOUT,
      stateDir: GUARDED_STATE,
      boundary: "lock:publish",
      mode: "kill",
    });
    assert.equal(killed.signal, "SIGKILL", killed.stderr);

    const results = recoverTransactions(root, GUARDED_STATE, {
      uiDir: GUARDED_UI,
      stylesDir: GUARDED_STYLES,
      layoutFile: GUARDED_LAYOUT,
    });
    assert.ok(
      results.some((entry) => entry.status === "refused"),
      JSON.stringify(results),
    );
    assert.ok(
      results.some((entry) =>
        entry.issues.some((issue) => issue.code === "WRITER_BUSY"),
      ),
      JSON.stringify(results),
    );
    // Owner evidence is retained: the dead owner's lock and the transaction
    // directory are never taken over or removed without coordination.
    assert.equal(existsSync(abs(root, writerLockDir(GUARDED_STATE))), true);
    assert.equal(
      existsSync(abs(root, transactionsDir(GUARDED_STATE))),
      true,
      "unresolved transaction evidence must be retained",
    );
  });
});

/**
 * The original immutable captured plan, applied in a killed subprocess and then
 * finished by a fresh recovery process, must produce exactly the same whole
 * generated tree as a clean reference commit. This qualifies real process
 * interruption against production planning rather than a hand-built plan.
 */
for (const [label, config] of CONFIGS) {
  test(`${label}: a captured production commit killed after release recovers to the exact committed tree`, () => {
    const reference = mkdtempSync(path.join(os.tmpdir(), "suik-restart-ref-"));
    let expected: TreeEntry[];
    try {
      seedConsumer(reference);
      const { snapshot, planned } = planFor(reference, config);
      const applied = applyCaptured(
        reference,
        config,
        snapshot,
        planned.writes,
      );
      assert.equal(
        applied.outcome.kind,
        "applied",
        JSON.stringify(applied.outcome.issues),
      );
      expected = snapshotTree(reference);
    } finally {
      rmSync(reference, { recursive: true, force: true });
    }

    withRoot((root) => {
      const killed = runGuardedProductionWorker({
        root,
        pkgRoot: PKG_ROOT,
        uiDir: config.uiDir,
        stylesDir: config.stylesDir,
        layoutFile: config.layoutFile,
        boundary: "durability:release",
        mode: "kill",
      });
      assert.equal(killed.signal, "SIGKILL", killed.stderr);
      const derived = deriveKitPaths(config);
      assert.equal(
        existsSync(abs(root, `${derived.stateDir}/kit.lock.json`)),
        true,
        "the production commit published its lock before the kill",
      );
      const results = recoverTransactions(
        root,
        derived.stateDir,
        rootsFor(config),
      );
      assertNoRefusal(results);
      // The fresh recovery finishes the interrupted cleanup tail, leaving the
      // exact committed tree including unrelated application state.
      assert.deepEqual(
        snapshotTree(root),
        expected,
        "fresh recovery must finish the committed production tree exactly",
      );
    });
  });
}

for (const [label, config] of CONFIGS) {
  test(`${label}: a captured production process killed while holding coordination fails closed`, () => {
    withRoot((root) => {
      const killed = runGuardedProductionWorker({
        root,
        pkgRoot: PKG_ROOT,
        uiDir: config.uiDir,
        stylesDir: config.stylesDir,
        layoutFile: config.layoutFile,
        boundary: "lock:publish",
        mode: "kill",
      });
      assert.equal(killed.signal, "SIGKILL", killed.stderr);
      const derived = deriveKitPaths(config);
      const before = snapshotTree(root);
      const results = recoverTransactions(
        root,
        derived.stateDir,
        rootsFor(config),
      );
      assert.ok(
        results.some(
          (entry) =>
            entry.status === "refused" &&
            entry.issues.some((issue) => issue.code === "WRITER_BUSY"),
        ),
        JSON.stringify(results),
      );
      // The dead owner's lock and unresolved transaction evidence are retained;
      // no PID/age takeover and no tree mutation occurs.
      assert.equal(
        existsSync(abs(root, writerLockDir(derived.stateDir))),
        true,
      );
      assert.equal(
        existsSync(abs(root, transactionsDir(derived.stateDir))),
        true,
      );
      assert.deepEqual(
        snapshotTree(root),
        before,
        "a fail-closed recovery must not mutate the tree",
      );
    });
  });
}
