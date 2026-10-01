import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { hashBytes } from "../../src/codegen/compare.js";
import { renderManagedBlock } from "../../src/codegen/css.js";
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
import {
  createSupportedProject,
  createTempProject,
  type TempProject,
} from "../helpers/project.js";
import { componentItem, registryOf, sourceFile } from "../helpers/registry.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * RCLD03-R7-3: complete-tree qualification across init/add/sync.
 *
 * Every successful and intended-cause-conflicting plan is compared against a
 * complete tree snapshot (bytes, modes, kinds, links, hidden and empty
 * entries). Equivalent observations produce identical envelopes, and no
 * writer or package-manager process can start because the planning modules
 * never import `node:child_process`.
 */

const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);
const CONFIG = DEFAULT_KIT_CONFIG;
const SOURCE = `${derived.rootExportsDir}/button.svelte`;
const TOKENS = `${derived.rootExportsDir}/tokens.svelte`;
const KIT_CSS = derived.kitCss;
const ROOT_EXPORTS = derived.rootExports;

function paths(): string[] {
  return [
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    derived.rootExports,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    CONFIG.layoutFile,
    SOURCE,
    TOKENS,
  ];
}

function snapshotOf(project: TempProject) {
  const result = captureSnapshot(project.root, paths());
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("snapshot failed");
  return result.value;
}

function buttonRegistry(incoming = "<button>button</button>\n") {
  return registryOf([
    componentItem("button", {
      files: [sourceFile("button.svelte", incoming, "button")],
      exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
    }),
  ]);
}

function baseLock(
  baseBytes: string,
  overrides: Partial<KitLock> = {},
): KitLock {
  return {
    schemaVersion: 1,
    toolVersion: "0.1.0",
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
        baseHash: hashBytes(new TextEncoder().encode(baseBytes)) as string,
        itemVersion: "0.1.0",
        cohort: "core",
      },
    ],
    cssBlocks: [],
    integrations: [],
    ...overrides,
  };
}

function add(
  project: TempProject,
  registry: ReturnType<typeof registryOf>,
  lock: KitLock | null = null,
  addedRoots: readonly string[] = ["button"],
) {
  return planAdd({
    registry,
    config: CONFIG,
    addedRoots,
    snapshot: snapshotOf(project),
    lock,
    registryVersion: registry.root.registryVersion,
    registryHash: registry.root.contentHash,
  });
}

function sync(
  project: TempProject,
  registry: ReturnType<typeof registryOf>,
  lock: KitLock | null,
  config = CONFIG,
) {
  return planSync({
    registry,
    config,
    snapshot: snapshotOf(project),
    lock,
    registryVersion: registry.root.registryVersion,
    registryHash: registry.root.contentHash,
  });
}

function init(project: TempProject) {
  return planInit({
    config: CONFIG,
    layoutFile: CONFIG.layoutFile,
    layoutSource: "",
    snapshot: snapshotOf(project),
    registry: registryOf([]),
    configHash: "b".repeat(64),
  });
}

function assertNoWrites(
  project: TempProject,
  before: ReturnType<typeof snapshotTree>,
): void {
  assert.deepEqual(
    snapshotTree(project.root),
    before,
    "planning must not change the complete tree",
  );
}

test("the planning modules never import node:child_process or node:fs", () => {
  const root = process.cwd();
  for (const relative of [
    "src/codegen/plan-init.ts",
    "src/codegen/plan-add.ts",
    "src/codegen/plan-sync.ts",
    "src/codegen/invocation.ts",
  ]) {
    const source = readFileSync(path.join(root, relative), "utf8");
    assert.ok(
      !source.includes("node:child_process"),
      `${relative} must not start a process`,
    );
    assert.ok(!source.includes("node:fs"), `${relative} must not write`);
  }
});

test("successful init/add/sync plans leave a complete tree byte-identical", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  // Hidden/empty directories and a symlink must survive untouched.
  project.writeDir(".cache/empty");
  project.symlink("package.json", "linked.json");

  const beforeInit = snapshotTree(project.root);
  const initResult = init(project);
  assert.equal(initResult.ok, true, JSON.stringify(initResult));
  assertNoWrites(project, beforeInit);

  const beforeAdd = snapshotTree(project.root);
  const addResult = add(project, buttonRegistry());
  assert.equal(addResult.ok, true, JSON.stringify(addResult));
  if (!addResult.ok) return;
  assert.equal(
    addResult.value.executable,
    true,
    JSON.stringify(addResult.value.diagnostics),
  );
  assertNoWrites(project, beforeAdd);

  const beforeSync = snapshotTree(project.root);
  const syncResult = sync(project, buttonRegistry(), null);
  assert.equal(syncResult.ok, true, JSON.stringify(syncResult));
  assertNoWrites(project, beforeSync);
});

test("equivalent observations produce identical complete init/add/sync envelopes", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  const registry = buttonRegistry();

  const firstInit = init(project);
  const secondInit = init(project);
  assert.equal(firstInit.ok, true, JSON.stringify(firstInit));
  assert.equal(secondInit.ok, true, JSON.stringify(secondInit));
  if (!firstInit.ok || !secondInit.ok) return;
  assert.deepEqual(
    toPlanningEnvelope(
      "init",
      true,
      firstInit.value.writes,
      firstInit.value.diagnostics,
    ),
    toPlanningEnvelope(
      "init",
      true,
      secondInit.value.writes,
      secondInit.value.diagnostics,
    ),
  );

  const firstAdd = add(project, registry);
  const secondAdd = add(project, registry);
  assert.equal(firstAdd.ok, true, JSON.stringify(firstAdd));
  assert.equal(secondAdd.ok, true, JSON.stringify(secondAdd));
  if (!firstAdd.ok || !secondAdd.ok) return;
  assert.deepEqual(
    toPlanningEnvelope(
      "add",
      firstAdd.value.executable,
      firstAdd.value.writes,
      firstAdd.value.diagnostics,
    ),
    toPlanningEnvelope(
      "add",
      secondAdd.value.executable,
      secondAdd.value.writes,
      secondAdd.value.diagnostics,
    ),
  );

  const firstSync = sync(project, registry, null);
  const secondSync = sync(project, registry, null);
  assert.equal(firstSync.ok, true, JSON.stringify(firstSync));
  assert.equal(secondSync.ok, true, JSON.stringify(secondSync));
  if (!firstSync.ok || !secondSync.ok) return;
  assert.deepEqual(
    toPlanningEnvelope(
      "sync",
      firstSync.value.executable,
      firstSync.value.writes,
      firstSync.value.diagnostics,
    ),
    toPlanningEnvelope(
      "sync",
      secondSync.value.executable,
      secondSync.value.writes,
      secondSync.value.diagnostics,
    ),
  );
});

test("invocation failures leave the complete tree untouched for every command", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const before = snapshotTree(project.root);
  const registry = buttonRegistry();
  const results = [
    init(project),
    add(project, registry),
    sync(project, registry, null),
  ];
  for (const result of results) {
    assert.equal(result.ok, false, JSON.stringify(result));
  }
  assertNoWrites(project, before);
});

test("a source conflict leaves the complete tree untouched for add and sync", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  project.writeFile(SOURCE, "CUSTOM");
  const lock = baseLock("BASE");
  project.writeFile(
    `${derived.stateDir}/kit.lock.json`,
    `${JSON.stringify(lock, null, 2)}\n`,
  );
  const before = snapshotTree(project.root);
  const registry = buttonRegistry("NEW");
  const addResult = add(project, registry, lock);
  const syncResult = sync(project, registry, lock, {
    ...CONFIG,
    requested: ["button"],
  });
  for (const result of [addResult, syncResult]) {
    assert.equal(result.ok, true, JSON.stringify(result));
    if (!result.ok) continue;
    assert.equal(result.value.executable, false);
    assert.deepEqual(result.value.writes, []);
  }
  assertNoWrites(project, before);
});

test("an unowned managed CSS block is an intended-cause conflict for init and add", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  project.writeFile(
    KIT_CSS,
    renderManagedBlock("tokens", "\n.tokens { color: red; }\n"),
  );
  const before = snapshotTree(project.root);
  const initResult = init(project);
  const addResult = add(project, buttonRegistry());
  assert.equal(initResult.ok, false, JSON.stringify(initResult));
  assert.equal(addResult.ok, true, JSON.stringify(addResult));
  if (addResult.ok) {
    assert.equal(addResult.value.executable, false);
    assert.deepEqual(addResult.value.writes, []);
  }
  assertNoWrites(project, before);
});

test("an unowned managed export region is an intended-cause conflict for init and add", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  project.writeFile(
    ROOT_EXPORTS,
    "// svelte-ui-kit:start exports\nexport const Local = 1;\n// svelte-ui-kit:end exports\n",
  );
  const before = snapshotTree(project.root);
  const initResult = init(project);
  const addResult = add(project, buttonRegistry());
  assert.equal(initResult.ok, false, JSON.stringify(initResult));
  assert.equal(addResult.ok, true, JSON.stringify(addResult));
  if (addResult.ok) {
    assert.equal(addResult.value.executable, false);
    assert.deepEqual(addResult.value.writes, []);
  }
  assertNoWrites(project, before);
});

test("a cohort conflict from a renamed export leaves the tree untouched", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  const installed = add(project, buttonRegistry());
  assert.equal(installed.ok, true, JSON.stringify(installed));
  if (!installed.ok || !installed.value.executable) return;
  for (const write of installed.value.writes) {
    if (write.operation === "retire") continue;
    project.writeFile(write.path, new TextDecoder().decode(write.bytes));
  }
  project.writeFile(SOURCE, "<button>CUSTOM</button>\n");
  const renamed = registryOf([
    componentItem("button", {
      files: [sourceFile("button.svelte", "NEW", "button")],
      exports: [{ name: "Renamed", target: "button.svelte", kind: "value" }],
    }),
  ]);
  const before = snapshotTree(project.root);
  const result = add(project, renamed, installed.value.lock);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.deepEqual(result.value.writes, []);
  assertNoWrites(project, before);
});

test("a detached retired token is a conflict, never reacquired or deleted", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  const tokens = registryOf([
    componentItem("button", {
      files: [sourceFile("button.svelte", "BUTTON", "button")],
      exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
      styles: [
        {
          source: "registry/styles/button-tokens.css",
          target: "kit.css",
          blockId: "tokens",
          cohort: "core",
        },
      ],
    }),
  ]);
  const installed = add(project, tokens);
  assert.equal(installed.ok, true, JSON.stringify(installed));
  if (!installed.ok || !installed.value.executable) return;
  for (const write of installed.value.writes) {
    if (write.operation === "retire") continue;
    project.writeFile(write.path, new TextDecoder().decode(write.bytes));
  }
  project.writeFile(
    KIT_CSS,
    renderManagedBlock("tokens", "\n.tokens { color: purple; }\n"),
  );
  const retired = sync(project, tokens, installed.value.lock);
  assert.equal(retired.ok, true, JSON.stringify(retired));
  if (!retired.ok || !retired.value.executable) return;
  for (const write of retired.value.writes) {
    if (write.operation === "retire") continue;
    project.writeFile(write.path, new TextDecoder().decode(write.bytes));
  }
  const before = snapshotTree(project.root);
  const readd = add(project, tokens, retired.value.lock);
  assert.equal(readd.ok, true, JSON.stringify(readd));
  if (!readd.ok) return;
  assert.equal(readd.value.executable, false);
  assert.deepEqual(readd.value.writes, []);
  assertNoWrites(project, before);
  assert.ok(
    readFileSync(path.join(project.root, KIT_CSS), "utf8").includes(
      ".tokens { color: purple; }",
    ),
  );
});
