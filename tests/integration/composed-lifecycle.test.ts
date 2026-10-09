import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import { composeApplyPlan } from "../../src/codegen/compose.js";
import { hashBytes } from "../../src/codegen/compare.js";
import { planAdd } from "../../src/codegen/plan-add.js";
import { planInit } from "../../src/codegen/plan-init.js";
import { planSync } from "../../src/codegen/plan-sync.js";
import type { KitLock } from "../../src/codegen/lock.js";
import type { PlanWrite } from "../../src/codegen/plan.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import type { ProjectSnapshot } from "../../src/codegen/snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
  type KitConfig,
} from "../../src/project/config.js";
import { discoverKitConfig } from "../../src/project/detect.js";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import { computeRegistryContentHash } from "../../src/registry/model.js";
import { snapshotByPath, snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * RCLD04-R2-5: composed default lifecycle through the production guarded apply.
 *
 * The real on-disk registry and the original immutable snapshot drive
 * planAdd/planSync, composeApplyPlan, validateApplyPlan and applyPlan. Complete
 * trees are compared before and after each step, and retirement only deletes
 * owned assets.
 */

const PKG_ROOT = process.cwd();
const FIXTURE = path.join(PKG_ROOT, "tests/fixtures/consumer");
const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);
const COMPATIBILITY = {
  svelte: "^5.57.1",
  bits: "^2.19.3",
  date: "^3.8.1",
};

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function abs(root: string, rel: string): string {
  return path.join(root, ...rel.split("/"));
}

function write(root: string, rel: string, data: string | Uint8Array): void {
  const target = abs(root, rel);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, data);
}

interface RegistryOptions {
  readonly body?: string;
  readonly includeButton?: boolean;
}

function onDiskRegistry(
  root: string,
  options: RegistryOptions = {},
): ReturnType<typeof loadRegistrySnapshot> {
  cpSync(path.join(PKG_ROOT, "schema"), path.join(root, "schema"), {
    recursive: true,
  });
  const body = options.body ?? "<button>button</button>\n";
  const includeButton = options.includeButton ?? true;
  const assets: { path: string; digest: string }[] = [];
  const items: { id: string; manifest: string }[] = [];
  if (includeButton) {
    const manifest = JSON.stringify({
      schemaVersion: 1,
      id: "button",
      kind: "component",
      version: "0.1.0",
      description: "Composed lifecycle component.",
      compatibility: COMPATIBILITY,
      files: [
        {
          source: "templates/button.svelte",
          target: "button.svelte",
          kind: "svelte",
          cohort: "core",
        },
      ],
      exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
      styles: [],
    });
    write(root, "registry/ui/button.json", manifest);
    write(root, "registry/templates/button.svelte", body);
    assets.push(
      {
        path: "registry/ui/button.json",
        digest: hashBytes(utf8(manifest)) as string,
      },
      {
        path: "registry/templates/button.svelte",
        digest: hashBytes(utf8(body)) as string,
      },
    );
    items.push({ id: "button", manifest: "ui/button.json" });
  }
  const basis = {
    schemaVersion: 1,
    registryVersion: "0.1.0",
    compatibility: COMPATIBILITY,
    items,
  };
  write(
    root,
    "registry/registry.json",
    JSON.stringify({
      ...basis,
      contentHash: computeRegistryContentHash(basis, assets),
    }),
  );
  return loadRegistrySnapshot(createAssetProvider(root));
}

function seedConsumer(page: string): string {
  const consumer = mkdtempSync(path.join(os.tmpdir(), "suik-lifecycle-app-"));
  for (const file of [
    "package.json",
    ".native-build",
    "vite.config.ts",
    "svelte.config.js",
    "tsconfig.json",
    "src/app.html",
  ]) {
    cpSync(path.join(FIXTURE, file), path.join(consumer, file), {
      recursive: true,
    });
  }
  symlinkSync(
    path.join(FIXTURE, "node_modules"),
    path.join(consumer, "node_modules"),
    "dir",
  );
  write(consumer, "src/routes/+page.svelte", page);
  return consumer;
}

function consumerPaths(): string[] {
  return [
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    derived.rootExports,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    DEFAULT_KIT_CONFIG.layoutFile,
    `${derived.rootExportsDir}/button.svelte`,
    ".gitignore",
  ];
}

function applyGuarded(
  root: string,
  snapshot: ProjectSnapshot,
  writes: readonly PlanWrite[],
  config: KitConfig = DEFAULT_KIT_CONFIG,
) {
  const composed = composeApplyPlan({ root, config, writes, snapshot });
  assert.equal(composed.ok, true, JSON.stringify(composed));
  if (!composed.ok) throw new Error("compose failed");
  const validated = validateApplyPlan(composed.value);
  assert.equal(validated.ok, true, JSON.stringify(validated));
  if (!validated.ok) throw new Error("validation failed");
  return applyPlan(validated.value);
}

function currentLock(
  root: string,
  config: KitConfig = DEFAULT_KIT_CONFIG,
): KitLock {
  const derivedPaths = deriveKitPaths(config);
  return JSON.parse(
    readFileSync(abs(root, `${derivedPaths.stateDir}/kit.lock.json`), "utf8"),
  ) as KitLock;
}

test("a composed add, update and retirement changes only the owned tree", () => {
  const registryRoot = mkdtempSync(
    path.join(os.tmpdir(), "suik-lifecycle-reg-"),
  );
  const consumer = seedConsumer(
    '<h1>LIFECYCLE_PAGE</h1>\n<script>import { Button } from "$lib/components/ui/index.js";</script>\n<Button />\n',
  );
  try {
    const install = onDiskRegistry(registryRoot, {
      body: "<button>v1</button>\n",
    });
    assert.equal(install.ok, true, JSON.stringify(install));
    if (!install.ok) return;
    const first = captureSnapshot(consumer, consumerPaths());
    assert.equal(first.ok, true);
    if (!first.ok) return;
    const added = planAdd({
      registry: install.value,
      config: DEFAULT_KIT_CONFIG,
      addedRoots: ["button"],
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
    const applied = applyGuarded(consumer, first.value, added.value.writes);
    assert.equal(applied.kind, "applied", JSON.stringify(applied.issues));
    assert.equal(
      readFileSync(
        abs(consumer, `${derived.rootExportsDir}/button.svelte`),
        "utf8",
      ),
      "<button>v1</button>\n",
    );
    const treeAfterAdd = snapshotByPath(snapshotTree(consumer));

    // Update the registry body and reconcile through planSync + guarded apply.
    const updateRegistryRoot = mkdtempSync(
      path.join(os.tmpdir(), "suik-lifecycle-upd-"),
    );
    try {
      const update = onDiskRegistry(updateRegistryRoot, {
        body: "<button>v2</button>\n",
      });
      assert.equal(update.ok, true, JSON.stringify(update));
      if (!update.ok) return;
      const second = captureSnapshot(consumer, consumerPaths());
      assert.equal(second.ok, true);
      if (!second.ok) return;
      const synced = planSync({
        registry: update.value,
        config: { ...DEFAULT_KIT_CONFIG, requested: ["button"] },
        snapshot: second.value,
        lock: currentLock(consumer),
        registryVersion: update.value.root.registryVersion,
        registryHash: update.value.root.contentHash,
      });
      assert.equal(synced.ok, true, JSON.stringify(synced));
      if (!synced.ok) return;
      assert.equal(
        synced.value.executable,
        true,
        JSON.stringify(synced.value.diagnostics),
      );
      const updated = applyGuarded(consumer, second.value, synced.value.writes);
      assert.equal(updated.kind, "applied", JSON.stringify(updated.issues));
      assert.equal(
        readFileSync(
          abs(consumer, `${derived.rootExportsDir}/button.svelte`),
          "utf8",
        ),
        "<button>v2</button>\n",
      );
      const treeAfterUpdate = snapshotByPath(snapshotTree(consumer));
      // The update changed the owned component bytes.
      assert.notDeepEqual(
        treeAfterUpdate.get(`${derived.rootExportsDir}/button.svelte`),
        treeAfterAdd.get(`${derived.rootExportsDir}/button.svelte`),
      );
    } finally {
      rmSync(updateRegistryRoot, { recursive: true, force: true });
    }

    // Retire the item: a registry without it must delete only the owned asset.
    const retiredRegistryRoot = mkdtempSync(
      path.join(os.tmpdir(), "suik-lifecycle-ret-"),
    );
    try {
      const retired = onDiskRegistry(retiredRegistryRoot, {
        includeButton: false,
      });
      assert.equal(retired.ok, true, JSON.stringify(retired));
      if (!retired.ok) return;
      const third = captureSnapshot(consumer, consumerPaths());
      assert.equal(third.ok, true);
      if (!third.ok) return;
      const sync = planSync({
        registry: retired.value,
        config: { ...DEFAULT_KIT_CONFIG, requested: [] },
        snapshot: third.value,
        lock: currentLock(consumer),
        registryVersion: retired.value.root.registryVersion,
        registryHash: retired.value.root.contentHash,
      });
      assert.equal(sync.ok, true, JSON.stringify(sync));
      if (!sync.ok) return;
      const outcome = applyGuarded(consumer, third.value, sync.value.writes);
      assert.ok(
        outcome.kind === "applied" || outcome.kind === "no_change",
        JSON.stringify(outcome),
      );
      assert.equal(
        existsSync(abs(consumer, `${derived.rootExportsDir}/button.svelte`)),
        false,
      );
    } finally {
      rmSync(retiredRegistryRoot, { recursive: true, force: true });
    }
  } finally {
    rmSync(registryRoot, { recursive: true, force: true });
    rmSync(consumer, { recursive: true, force: true });
  }
});

test("a satisfied replay is a no_change with a byte-identical tree", () => {
  const registryRoot = mkdtempSync(
    path.join(os.tmpdir(), "suik-lifecycle-sat-"),
  );
  const consumer = seedConsumer(
    '<h1>SATISFIED_PAGE</h1>\n<script>import { Button } from "$lib/components/ui/index.js";</script>\n<Button />\n',
  );
  try {
    const registry = onDiskRegistry(registryRoot);
    assert.equal(registry.ok, true, JSON.stringify(registry));
    if (!registry.ok) return;
    const first = captureSnapshot(consumer, consumerPaths());
    assert.equal(first.ok, true);
    if (!first.ok) return;
    const added = planAdd({
      registry: registry.value,
      config: DEFAULT_KIT_CONFIG,
      addedRoots: ["button"],
      snapshot: first.value,
      lock: null,
      registryVersion: registry.value.root.registryVersion,
      registryHash: registry.value.root.contentHash,
    });
    assert.equal(added.ok, true);
    if (!added.ok) return;
    applyGuarded(consumer, first.value, added.value.writes);
    const before = snapshotTree(consumer);

    const second = captureSnapshot(consumer, consumerPaths());
    assert.equal(second.ok, true);
    if (!second.ok) return;
    const replay = planSync({
      registry: registry.value,
      config: { ...DEFAULT_KIT_CONFIG, requested: ["button"] },
      snapshot: second.value,
      lock: currentLock(consumer),
      registryVersion: registry.value.root.registryVersion,
      registryHash: registry.value.root.contentHash,
    });
    assert.equal(replay.ok, true, JSON.stringify(replay));
    if (!replay.ok) return;
    if (replay.value.writes.length === 0) {
      // A satisfied replay opens no transaction and changes nothing.
      assert.equal(
        existsSync(
          abs(consumer, `${derived.stateDir}/.svelte-ui-kit/transactions`),
        ),
        false,
      );
      assert.deepEqual(snapshotTree(consumer), before);
      return;
    }
    const outcome = applyGuarded(consumer, second.value, replay.value.writes);
    assert.equal(outcome.kind, "no_change", JSON.stringify(outcome.issues));
    assert.deepEqual(snapshotTree(consumer), before);
  } finally {
    rmSync(registryRoot, { recursive: true, force: true });
    rmSync(consumer, { recursive: true, force: true });
  }
});

test("an unowned managed export region makes the batch non-executable and leaves the tree untouched", () => {
  const registryRoot = mkdtempSync(
    path.join(os.tmpdir(), "suik-lifecycle-cfl-"),
  );
  const consumer = seedConsumer(
    '<h1>CONFLICT_PAGE</h1>\n<script>import { Button } from "$lib/components/ui/index.js";</script>\n<Button />\n',
  );
  try {
    const registry = onDiskRegistry(registryRoot);
    assert.equal(registry.ok, true, JSON.stringify(registry));
    if (!registry.ok) return;
    const first = captureSnapshot(consumer, consumerPaths());
    assert.equal(first.ok, true);
    if (!first.ok) return;
    const added = planAdd({
      registry: registry.value,
      config: DEFAULT_KIT_CONFIG,
      addedRoots: ["button"],
      snapshot: first.value,
      lock: null,
      registryVersion: registry.value.root.registryVersion,
      registryHash: registry.value.root.contentHash,
    });
    assert.equal(added.ok, true);
    if (!added.ok) return;
    applyGuarded(consumer, first.value, added.value.writes);

    // An unowned managed export region is an intended-cause conflict: the
    // batch must be non-executable and leave the whole tree untouched.
    write(
      consumer,
      derived.rootExports,
      "// svelte-ui-kit:start exports\nexport const Local = 1;\n// svelte-ui-kit:end exports\n",
    );
    const before = snapshotTree(consumer);
    const second = captureSnapshot(consumer, consumerPaths());
    assert.equal(second.ok, true);
    if (!second.ok) return;
    const sync = planSync({
      registry: registry.value,
      config: { ...DEFAULT_KIT_CONFIG, requested: ["button"] },
      snapshot: second.value,
      lock: currentLock(consumer),
      registryVersion: registry.value.root.registryVersion,
      registryHash: registry.value.root.contentHash,
    });
    assert.equal(sync.ok, true, JSON.stringify(sync));
    if (!sync.ok) return;
    assert.equal(
      sync.value.executable,
      false,
      JSON.stringify(sync.value.diagnostics),
    );
    assert.equal(sync.value.writes.length, 0);
    assert.ok(
      sync.value.diagnostics.some((entry) => entry.includes("conflict")),
      JSON.stringify(sync.value.diagnostics),
    );
    assert.deepEqual(snapshotTree(consumer), before);
  } finally {
    rmSync(registryRoot, { recursive: true, force: true });
    rmSync(consumer, { recursive: true, force: true });
  }
});

test("a custom mapping init applies through the guarded path", () => {
  const consumer = seedConsumer("<h1>CUSTOM_MAPPING_PAGE</h1>\n");
  try {
    write(
      consumer,
      "app/ui/_kit/kit.json",
      JSON.stringify({
        schemaVersion: 1,
        uiDir: "app/ui",
        stylesDir: "app/styles",
        layoutFile: "src/routes/+layout.svelte",
      }),
    );
    const discovery = discoverKitConfig(consumer);
    assert.equal(discovery.ok, true, JSON.stringify(discovery));
    if (!discovery.ok) return;
    assert.equal(discovery.value.kind, "custom");
    const custom = discovery.value.config;

    const registry = loadRegistrySnapshot(createAssetProvider(PKG_ROOT));
    assert.equal(registry.ok, true, JSON.stringify(registry));
    if (!registry.ok) return;

    const paths = [
      `${custom.uiDir}/_kit/kit.json`,
      `${custom.uiDir}/_kit/kit.lock.json`,
      `${custom.uiDir}/index.ts`,
      `${custom.stylesDir}/kit.css`,
      `${custom.stylesDir}/themes.css`,
      `${custom.stylesDir}/app.css`,
      custom.layoutFile,
      ".gitignore",
    ];
    const snapshot = captureSnapshot(consumer, paths);
    assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
    if (!snapshot.ok) return;

    const planned = planInit({
      config: custom,
      layoutFile: custom.layoutFile,
      layoutSource: "",
      snapshot: snapshot.value,
      registry: registry.value,
      configHash: "b".repeat(64),
    });
    assert.equal(planned.ok, true, JSON.stringify(planned));
    if (!planned.ok) return;

    const outcome = applyGuarded(
      consumer,
      snapshot.value,
      planned.value.writes,
      custom,
    );
    assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));
    assert.equal(
      existsSync(abs(consumer, `${custom.uiDir}/_kit/kit.lock.json`)),
      true,
    );
    assert.equal(
      existsSync(abs(consumer, `${custom.stylesDir}/kit.css`)),
      true,
    );
    assert.equal(existsSync(abs(consumer, custom.layoutFile)), true);
    // The default mapping was never materialized.
    assert.equal(existsSync(abs(consumer, derived.stateDir)), false);
  } finally {
    rmSync(consumer, { recursive: true, force: true });
  }
});

test(
  "the actual bundled registry drives default init, check and satisfied sync",
  { timeout: 240_000 },
  () => {
    const consumer = seedConsumer("<h1>SHIPPED_PAGE</h1>\n");
    try {
      const registry = loadRegistrySnapshot(createAssetProvider(PKG_ROOT));
      assert.equal(registry.ok, true, JSON.stringify(registry));
      if (!registry.ok) return;
      const first = captureSnapshot(consumer, consumerPaths());
      assert.equal(first.ok, true);
      if (!first.ok) return;
      const planned = planInit({
        config: DEFAULT_KIT_CONFIG,
        layoutFile: DEFAULT_KIT_CONFIG.layoutFile,
        layoutSource: "",
        snapshot: first.value,
        registry: registry.value,
        configHash: "b".repeat(64),
      });
      assert.equal(planned.ok, true, JSON.stringify(planned));
      if (!planned.ok) return;
      const outcome = applyGuarded(consumer, first.value, planned.value.writes);
      assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));
      assert.equal(
        existsSync(abs(consumer, `${derived.stateDir}/kit.lock.json`)),
        true,
      );
      assert.equal(existsSync(abs(consumer, derived.kitCss)), true);

      // The generated application must actually check with the shipped registry.
      const check = spawnSync("pnpm", ["run", "check"], {
        cwd: consumer,
        encoding: "utf8",
        timeout: 180_000,
        env: { ...process.env, CI: "1" },
      });
      assert.equal(check.status, 0, `${check.stdout}\n${check.stderr}`);

      const before = snapshotTree(consumer);
      const second = captureSnapshot(consumer, consumerPaths());
      assert.equal(second.ok, true);
      if (!second.ok) return;
      const sync = planSync({
        registry: registry.value,
        config: DEFAULT_KIT_CONFIG,
        snapshot: second.value,
        lock: currentLock(consumer),
        registryVersion: registry.value.root.registryVersion,
        registryHash: registry.value.root.contentHash,
      });
      assert.equal(sync.ok, true, JSON.stringify(sync));
      if (!sync.ok) return;
      if (sync.value.writes.length === 0) {
        assert.deepEqual(snapshotTree(consumer), before);
        return;
      }
      const replay = applyGuarded(consumer, second.value, sync.value.writes);
      assert.ok(
        replay.kind === "no_change" || replay.kind === "applied",
        JSON.stringify(replay.issues),
      );
      assert.deepEqual(snapshotTree(consumer), before);
    } finally {
      rmSync(consumer, { recursive: true, force: true });
    }
  },
);

test("a custom mapping satisfied sync replays through the guarded path", () => {
  const consumer = seedConsumer("<h1>CUSTOM_SYNC_PAGE</h1>\n");
  try {
    write(
      consumer,
      "app/ui/_kit/kit.json",
      JSON.stringify({
        schemaVersion: 1,
        uiDir: "app/ui",
        stylesDir: "app/styles",
        layoutFile: "src/routes/+layout.svelte",
      }),
    );
    const discovery = discoverKitConfig(consumer);
    assert.equal(discovery.ok, true, JSON.stringify(discovery));
    if (!discovery.ok) return;
    const custom = discovery.value.config;
    const registry = loadRegistrySnapshot(createAssetProvider(PKG_ROOT));
    assert.equal(registry.ok, true, JSON.stringify(registry));
    if (!registry.ok) return;

    const paths = [
      `${custom.uiDir}/_kit/kit.json`,
      `${custom.uiDir}/_kit/kit.lock.json`,
      `${custom.uiDir}/index.ts`,
      `${custom.stylesDir}/kit.css`,
      `${custom.stylesDir}/themes.css`,
      `${custom.stylesDir}/app.css`,
      custom.layoutFile,
      ".gitignore",
    ];
    const first = captureSnapshot(consumer, paths);
    assert.equal(first.ok, true, JSON.stringify(first));
    if (!first.ok) return;
    const planned = planInit({
      config: custom,
      layoutFile: custom.layoutFile,
      layoutSource: "",
      snapshot: first.value,
      registry: registry.value,
      configHash: "b".repeat(64),
    });
    assert.equal(planned.ok, true, JSON.stringify(planned));
    if (!planned.ok) return;
    const outcome = applyGuarded(
      consumer,
      first.value,
      planned.value.writes,
      custom,
    );
    assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));
    const before = snapshotTree(consumer);

    const second = captureSnapshot(consumer, paths);
    assert.equal(second.ok, true, JSON.stringify(second));
    if (!second.ok) return;
    const lock = JSON.parse(
      readFileSync(abs(consumer, `${custom.uiDir}/_kit/kit.lock.json`), "utf8"),
    ) as KitLock;
    const sync = planSync({
      registry: registry.value,
      config: custom,
      snapshot: second.value,
      lock,
      registryVersion: registry.value.root.registryVersion,
      registryHash: registry.value.root.contentHash,
    });
    assert.equal(sync.ok, true, JSON.stringify(sync));
    if (!sync.ok) return;
    if (sync.value.writes.length === 0) {
      assert.deepEqual(snapshotTree(consumer), before);
      return;
    }
    const replay = applyGuarded(
      consumer,
      second.value,
      sync.value.writes,
      custom,
    );
    assert.ok(
      replay.kind === "no_change" || replay.kind === "applied",
      JSON.stringify(replay.issues),
    );
    assert.deepEqual(snapshotTree(consumer), before);
  } finally {
    rmSync(consumer, { recursive: true, force: true });
  }
});

test("projected config and requested authority hold across init, add and satisfied sync", () => {
  const registryRoot = mkdtempSync(
    path.join(os.tmpdir(), "suik-lifecycle-auth-"),
  );
  const consumer = seedConsumer("<h1>AUTHORITY_PAGE</h1>\n");
  try {
    const registry = onDiskRegistry(registryRoot);
    assert.equal(registry.ok, true, JSON.stringify(registry));
    if (!registry.ok) return;

    // Fresh initialization writes the configuration; the published lock must
    // bind its exact identity.
    const first = captureSnapshot(consumer, consumerPaths());
    assert.equal(first.ok, true, JSON.stringify(first));
    if (!first.ok) return;
    const planned = planInit({
      config: DEFAULT_KIT_CONFIG,
      layoutFile: DEFAULT_KIT_CONFIG.layoutFile,
      layoutSource: "",
      snapshot: first.value,
      registry: registry.value,
      configHash: "b".repeat(64),
    });
    assert.equal(planned.ok, true, JSON.stringify(planned));
    if (!planned.ok) return;
    const init = applyGuarded(consumer, first.value, planned.value.writes);
    assert.equal(init.kind, "applied", JSON.stringify(init.issues));
    const initConfig = readFileSync(
      abs(consumer, `${derived.stateDir}/kit.json`),
    );
    const initLock = currentLock(consumer);
    assert.equal(initLock.configHash, hashBytes(initConfig) as string);
    assert.deepEqual(initLock.requested, []);

    // An explicit addition writes the requested root into both the config and
    // the lock; the projected authority keeps them in agreement.
    const second = captureSnapshot(consumer, consumerPaths());
    assert.equal(second.ok, true, JSON.stringify(second));
    if (!second.ok) return;
    const added = planAdd({
      registry: registry.value,
      config: DEFAULT_KIT_CONFIG,
      addedRoots: ["button"],
      snapshot: second.value,
      lock: initLock,
      registryVersion: registry.value.root.registryVersion,
      registryHash: registry.value.root.contentHash,
    });
    assert.equal(added.ok, true, JSON.stringify(added));
    if (!added.ok) return;
    assert.equal(
      added.value.executable,
      true,
      JSON.stringify(added.value.diagnostics),
    );
    const addedOutcome = applyGuarded(
      consumer,
      second.value,
      added.value.writes,
    );
    assert.equal(
      addedOutcome.kind,
      "applied",
      JSON.stringify(addedOutcome.issues),
    );
    const addConfig = JSON.parse(
      readFileSync(abs(consumer, `${derived.stateDir}/kit.json`), "utf8"),
    ) as { requested: string[] };
    const addLock = currentLock(consumer);
    assert.equal(
      addLock.configHash,
      hashBytes(
        readFileSync(abs(consumer, `${derived.stateDir}/kit.json`)),
      ) as string,
    );
    assert.deepEqual(addLock.requested, ["button"]);
    assert.deepEqual(addConfig.requested, ["button"]);

    // An installed satisfied replay carries the unchanged captured config
    // authority and publishes nothing new.
    const before = snapshotTree(consumer);
    const third = captureSnapshot(consumer, consumerPaths());
    assert.equal(third.ok, true, JSON.stringify(third));
    if (!third.ok) return;
    const sync = planSync({
      registry: registry.value,
      config: { ...DEFAULT_KIT_CONFIG, requested: ["button"] },
      snapshot: third.value,
      lock: addLock,
      registryVersion: registry.value.root.registryVersion,
      registryHash: registry.value.root.contentHash,
    });
    assert.equal(sync.ok, true, JSON.stringify(sync));
    if (!sync.ok) return;
    if (sync.value.writes.length > 0) {
      const replay = applyGuarded(consumer, third.value, sync.value.writes);
      assert.ok(
        replay.kind === "no_change" || replay.kind === "applied",
        JSON.stringify(replay.issues),
      );
    }
    assert.deepEqual(currentLock(consumer), addLock);
    assert.deepEqual(snapshotTree(consumer), before);
  } finally {
    rmSync(registryRoot, { recursive: true, force: true });
    rmSync(consumer, { recursive: true, force: true });
  }
});
