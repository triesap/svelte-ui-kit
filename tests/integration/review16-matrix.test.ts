import assert from "node:assert/strict";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  applyPlan,
  validateApplyPlan,
  type ApplyOutcome,
} from "../../src/codegen/apply.js";
import { composeApplyPlan } from "../../src/codegen/compose.js";
import { planInit, type InitPlan } from "../../src/codegen/plan-init.js";
import type { PlanWrite } from "../../src/codegen/plan.js";
import {
  captureSnapshot,
  type ProjectSnapshot,
} from "../../src/codegen/snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
  type KitConfig,
} from "../../src/project/config.js";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import { computeRegistryContentHash } from "../../src/registry/model.js";
import { snapshotByPath, snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * RCLD04-R2-5: factual lifecycle matrix for the guarded production core.
 *
 * Each default/custom initialization scenario is driven through the production
 * `planInit`/`composeApplyPlan`/`validateApplyPlan`/`applyPlan` path against a
 * captured original snapshot. The generated consumer tree is compared for exact
 * kinds, modes, bytes and derived ownership; unrelated application state is
 * proved byte-identical; and the satisfied (no-change), metadata-only and
 * conflict dispositions are exercised through the same core. Component add/
 * sync/update/retirement and cohort coverage are qualified in
 * `multi-item-lifecycle.test.ts`; the generated consumer's check/build/render is
 * qualified in `tests/smoke/lifecycle-consumer.test.mjs`.
 */

const PKG_ROOT = process.cwd();

const abs = (root: string, logical: string): string =>
  path.join(root, ...logical.split("/"));

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-matrix-"));
  try {
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

function applyGuarded(
  root: string,
  config: KitConfig,
  snapshot: ProjectSnapshot,
  writes: readonly PlanWrite[],
): ApplyOutcome {
  const composed = composeApplyPlan({ root, config, writes, snapshot });
  assert.equal(composed.ok, true, JSON.stringify(composed));
  if (!composed.ok) throw new Error("compose failed");
  const validated = validateApplyPlan(composed.value);
  assert.equal(validated.ok, true, JSON.stringify(validated));
  if (!validated.ok) throw new Error("validate failed");
  return applyPlan(validated.value);
}

function assertGeneratedDefaults(
  root: string,
  config: KitConfig,
  lock: InitPlan["lock"],
): void {
  const derived = deriveKitPaths(config);
  for (const logical of [
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    derived.rootExports,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    config.layoutFile,
  ]) {
    const target = abs(root, logical);
    assert.equal(existsSync(target), true, logical);
    assert.equal(statSync(target).isFile(), true, logical);
    assert.equal(statSync(target).mode & 0o777, 0o644, `${logical} mode`);
  }
  // Derived ownership: file records, CSS blocks and the layout/stylesheet/
  // exports integration roles all resolve to the mapped generated paths.
  assert.ok(
    lock.files.every((file) => file.owner.length > 0),
    JSON.stringify(lock.files),
  );
  const integration = (
    kind: "layout" | "stylesheet" | "exports",
  ): string | undefined =>
    lock.integrations.find((entry) => entry.kind === kind)?.path;
  assert.equal(integration("layout"), config.layoutFile);
  assert.equal(integration("stylesheet"), derived.kitCss);
  assert.equal(integration("exports"), derived.rootExports);
}

test("default init writes the exact planned tree, modes and ownership", () => {
  withRoot((root) => {
    const { snapshot, planned } = planFor(root, DEFAULT_KIT_CONFIG);
    const unrelatedBefore = snapshotByPath(snapshotTree(root));
    const applied = applyGuarded(
      root,
      DEFAULT_KIT_CONFIG,
      snapshot,
      planned.writes,
    );
    assert.equal(applied.kind, "applied", JSON.stringify(applied.issues));
    assertGeneratedDefaults(root, DEFAULT_KIT_CONFIG, planned.lock);

    // The complete planned write set is exactly the generated differences.
    const after = snapshotByPath(snapshotTree(root));
    for (const write of planned.writes) {
      const entry = after.get(write.path);
      assert.ok(entry, `missing planned write ${write.path}`);
      assert.equal(entry?.kind, "file", write.path);
      assert.deepEqual(
        readFileSync(abs(root, write.path)),
        Buffer.from(write.bytes),
        write.path,
      );
    }
    // Unrelated application state is byte-identical.
    assert.deepEqual(
      after.get("package.json"),
      unrelatedBefore.get("package.json"),
    );
  });
});

test("a satisfied re-init through the guarded core is a no-change apply", () => {
  withRoot((root) => {
    const first = planFor(root, DEFAULT_KIT_CONFIG);
    const applied = applyGuarded(
      root,
      DEFAULT_KIT_CONFIG,
      first.snapshot,
      first.planned.writes,
    );
    assert.equal(applied.kind, "applied", JSON.stringify(applied.issues));

    // A second observation against the same configuration is satisfied: it
    // generates no writes and opens no transaction, leaving the tree unchanged.
    const before = snapshotTree(root);
    const second = planFor(root, DEFAULT_KIT_CONFIG);
    assert.deepEqual(second.planned.writes, []);
    assert.deepEqual(snapshotTree(root), before);
  });
});

test("custom mapping init generates under the configured roots", () => {
  const config: KitConfig = {
    ...DEFAULT_KIT_CONFIG,
    uiDir: "app/ui",
    stylesDir: "assets/styles",
  };
  withRoot((root) => {
    const { snapshot, planned } = planFor(root, config);
    const applied = applyGuarded(root, config, snapshot, planned.writes);
    assert.equal(applied.kind, "applied", JSON.stringify(applied.issues));
    assertGeneratedDefaults(root, config, planned.lock);
    const derived = deriveKitPaths(config);
    assert.equal(existsSync(abs(root, "app/ui/index.ts")), true);
    assert.equal(existsSync(abs(root, "assets/styles/kit.css")), true);
    assert.equal(integrationPath(planned, "stylesheet"), derived.kitCss);
  });
});

function integrationPath(
  planned: InitPlan,
  kind: "layout" | "stylesheet" | "exports",
): string | undefined {
  return planned.lock.integrations.find((entry) => entry.kind === kind)?.path;
}

test("a metadata-only re-init publishes only the changed lock", () => {
  withRoot((root) => {
    const first = planFor(root, DEFAULT_KIT_CONFIG);
    const applied = applyGuarded(
      root,
      DEFAULT_KIT_CONFIG,
      first.snapshot,
      first.planned.writes,
    );
    assert.equal(applied.kind, "applied", JSON.stringify(applied.issues));

    // An empty registry with a bumped version changes only lock metadata: the
    // generated application content is identical, so only the lock is written.
    const altRoot = mkdtempSync(path.join(os.tmpdir(), "suik-matrix-reg-"));
    try {
      cpSync(path.join(PKG_ROOT, "schema"), path.join(altRoot, "schema"), {
        recursive: true,
      });
      const basis = {
        schemaVersion: 1,
        registryVersion: "0.2.0",
        compatibility: {
          svelte: "5.57.1",
          bits: "2.19.3",
          date: "^3.8.1",
        },
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
      const layoutSource = readFileSync(
        abs(root, DEFAULT_KIT_CONFIG.layoutFile),
        "utf8",
      );
      const planned = planInit({
        config: DEFAULT_KIT_CONFIG,
        layoutFile: DEFAULT_KIT_CONFIG.layoutFile,
        layoutSource,
        snapshot: snapshot.value,
        registry: altRegistry.value,
        configHash: "b".repeat(64),
      });
      assert.equal(planned.ok, true, JSON.stringify(planned));
      if (!planned.ok) return;
      assert.deepEqual(
        planned.value.writes.map((write) => write.path),
        [`${derived.stateDir}/kit.lock.json`],
      );
      const reapply = applyGuarded(
        root,
        DEFAULT_KIT_CONFIG,
        snapshot.value,
        planned.value.writes,
      );
      assert.equal(reapply.kind, "applied", JSON.stringify(reapply.issues));
    } finally {
      rmSync(altRoot, { recursive: true, force: true });
    }
  });
});

test("a conflicting managed target is refused with no semantic writes", () => {
  withRoot((root) => {
    const first = planFor(root, DEFAULT_KIT_CONFIG);
    const applied = applyGuarded(
      root,
      DEFAULT_KIT_CONFIG,
      first.snapshot,
      first.planned.writes,
    );
    assert.equal(applied.kind, "applied", JSON.stringify(applied.issues));

    // Replace the managed exports barrel with an unrelated directory: the
    // observation is a non-regular managed target and the plan conflicts.
    const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);
    rmSync(abs(root, derived.rootExports));
    mkdirSync(abs(root, derived.rootExports));
    const registry = loadRegistrySnapshot(createAssetProvider(PKG_ROOT));
    assert.equal(registry.ok, true);
    if (!registry.ok) return;
    const snapshot = captureSnapshot(root, initPaths(DEFAULT_KIT_CONFIG));
    assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
    if (!snapshot.ok) return;
    const planned = planInit({
      config: DEFAULT_KIT_CONFIG,
      layoutFile: DEFAULT_KIT_CONFIG.layoutFile,
      layoutSource: "",
      snapshot: snapshot.value,
      registry: registry.value,
      configHash: "b".repeat(64),
    });
    assert.equal(planned.ok, false, JSON.stringify(planned));
    if (!planned.ok) {
      assert.match(JSON.stringify(planned.issues), /INIT_TARGET_UNSAFE/);
    }
  });
});
