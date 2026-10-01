import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { hashBytes } from "../../src/codegen/compare.js";
import {
  FOUNDATION_TOKENS_CONTRACT,
  STYLESHEET_CONTRACT,
  renderManagedBlock,
} from "../../src/codegen/css.js";
import { planAdd } from "../../src/codegen/plan-add.js";
import { TOKENS_BODY, planInit } from "../../src/codegen/plan-init.js";
import { planSync } from "../../src/codegen/plan-sync.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import type { KitLock } from "../../src/codegen/lock.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { createSupportedProject } from "../helpers/project.js";
import { componentItem, registryOf } from "../helpers/registry.js";

/**
 * RCLD03-R7-2: initialization enforces the same explicit ownership and
 * legitimate-baseline rules as add/sync.
 *
 * Aggregate `stylesheet-v1` bookkeeping, marker presence and byte equality must
 * never reclaim a detached application-owned block or convert it to foundation
 * ownership. Init after install/customization/retirement preserves bytes and
 * lineage and refuses unverifiable reconciliation.
 */

const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);
const CONFIG = DEFAULT_KIT_CONFIG;
const KIT_CSS = derived.kitCss;

function paths(): string[] {
  return [
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    derived.rootExports,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    CONFIG.layoutFile,
    `${derived.rootExportsDir}/button.svelte`,
  ];
}

function snapshotOf(project: ReturnType<typeof createSupportedProject>) {
  const result = captureSnapshot(project.root, paths());
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("snapshot failed");
  return result.value;
}

function buttonRegistry(options: { tokens?: boolean } = {}) {
  return registryOf([
    componentItem("button", {
      exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
      ...(options.tokens
        ? {
            styles: [
              {
                source: "registry/styles/button-tokens.css",
                target: "kit.css",
                blockId: "tokens",
                cohort: "core",
              },
            ],
          }
        : {}),
    }),
  ]);
}

function apply(
  project: ReturnType<typeof createSupportedProject>,
  writes: readonly { path: string; bytes: Uint8Array; operation?: string }[],
): void {
  for (const write of writes) {
    // These lifecycle controls may plan an explicit deletion (for example a
    // retired source); retirement semantics are covered elsewhere, so a retire
    // is skipped here rather than applied as a zero-byte create.
    if (write.operation === "retire") continue;
    project.writeFile(write.path, new TextDecoder().decode(write.bytes));
  }
}

function add(
  project: ReturnType<typeof createSupportedProject>,
  registry: ReturnType<typeof registryOf>,
  lock: KitLock | null,
) {
  return planAdd({
    registry,
    config: CONFIG,
    addedRoots: ["button"],
    snapshot: snapshotOf(project),
    lock,
    registryVersion: registry.root.registryVersion,
    registryHash: registry.root.contentHash,
  });
}

function sync(
  project: ReturnType<typeof createSupportedProject>,
  registry: ReturnType<typeof registryOf>,
  lock: KitLock,
) {
  return planSync({
    registry,
    config: CONFIG,
    snapshot: snapshotOf(project),
    lock,
    registryVersion: registry.root.registryVersion,
    registryHash: registry.root.contentHash,
  });
}

function init(project: ReturnType<typeof createSupportedProject>) {
  const layoutPath = path.join(project.root, CONFIG.layoutFile);
  const layoutSource = existsSync(layoutPath)
    ? readFileSync(layoutPath, "utf8")
    : "";
  return planInit({
    config: CONFIG,
    layoutFile: CONFIG.layoutFile,
    layoutSource,
    snapshot: snapshotOf(project),
    registry: buttonRegistry(),
    configHash: "b".repeat(64),
  });
}

function good<T>(result: {
  ok: boolean;
  value?: T;
  issues?: readonly { code: string }[];
}): T & { executable?: boolean } {
  if (!result.ok || result.value === undefined) {
    throw new Error(JSON.stringify(result));
  }
  const value = result.value as T & { executable?: boolean };
  if (value.executable === false) throw new Error(JSON.stringify(result));
  return value;
}

test("initialization never converts a retired stylesheet integration into foundation ownership", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  const registry = buttonRegistry({ tokens: true });
  const installed = good(add(project, registry, null));
  apply(project, installed.writes);
  assert.equal(
    installed.lock?.integrations.find((entry) => entry.kind === "stylesheet")
      ?.contract,
    STYLESHEET_CONTRACT,
  );

  // Customize the retained registry block to the minimal foundation body, then
  // retire the item so ownership detaches.
  writeFileSync(
    path.join(project.root, KIT_CSS),
    renderManagedBlock("tokens", TOKENS_BODY),
  );
  const retired = good(sync(project, registry, installed.lock as KitLock));
  apply(project, retired.writes);
  assert.deepEqual(retired.lock?.cssBlocks, []);
  const before = retired.lock?.integrations.find(
    (entry) => entry.kind === "stylesheet",
  );
  assert.equal(before?.contract, STYLESHEET_CONTRACT);

  const initialized = init(project);
  assert.equal(initialized.ok, true, JSON.stringify(initialized));
  if (!initialized.ok) return;
  const after = initialized.value.lock.integrations.find(
    (entry) => entry.kind === "stylesheet",
  );
  assert.equal(
    after?.contract,
    STYLESHEET_CONTRACT,
    "init must not convert aggregate bookkeeping to foundation ownership",
  );
  assert.equal(after?.baseline, before?.baseline);

  // The next add must not be executable against detached application text.
  const readd = add(project, registry, initialized.value.lock);
  assert.equal(readd.ok, true, JSON.stringify(readd));
  if (!readd.ok) return;
  assert.equal(readd.value.executable, false);
  assert.deepEqual(readd.value.writes, []);
});

test("initialization preserves a customized foundation baseline without overwriting it", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  const registry = buttonRegistry();
  const installed = good(add(project, registry, null));
  apply(project, installed.writes);
  const before = installed.lock?.integrations.find(
    (entry) => entry.kind === "stylesheet",
  );
  assert.equal(before?.contract, FOUNDATION_TOKENS_CONTRACT);

  const customized = renderManagedBlock(
    "tokens",
    "\n.custom { color: purple; }\n",
  );
  writeFileSync(path.join(project.root, KIT_CSS), customized);
  const initialized = init(project);
  assert.equal(initialized.ok, true, JSON.stringify(initialized));
  if (!initialized.ok) return;
  assert.deepEqual(
    initialized.value.writes.map((entry) => entry.path),
    [],
  );
  assert.equal(
    readFileSync(path.join(project.root, KIT_CSS), "utf8"),
    customized,
  );
  const after = initialized.value.lock.integrations.find(
    (entry) => entry.kind === "stylesheet",
  );
  assert.equal(after?.contract, FOUNDATION_TOKENS_CONTRACT);
  assert.equal(
    after?.baseline,
    before?.baseline,
    "the legitimate foundation baseline is preserved, not reset to local bytes",
  );
});

test("initialization after a clean installation preserves foundation lineage", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  const registry = buttonRegistry();
  const installed = good(add(project, registry, null));
  apply(project, installed.writes);
  const before = installed.lock?.integrations.find(
    (entry) => entry.kind === "stylesheet",
  );
  const initialized = init(project);
  assert.equal(initialized.ok, true, JSON.stringify(initialized));
  if (!initialized.ok) return;
  const integration = initialized.value.lock.integrations.find(
    (entry) => entry.kind === "stylesheet",
  );
  assert.equal(integration?.contract, FOUNDATION_TOKENS_CONTRACT);
  assert.equal(integration?.baseline, before?.baseline);
  assert.equal(
    integration?.baseline,
    hashBytes(new TextEncoder().encode(TOKENS_BODY)),
    "a fresh foundation baseline hashes the exact owned tokens body",
  );
});

test("initialization after installation preserves a registry-owned managed block", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  const registry = buttonRegistry({ tokens: true });
  const installed = good(add(project, registry, null));
  apply(project, installed.writes);
  const before = readFileSync(path.join(project.root, KIT_CSS), "utf8");
  const initialized = init(project);
  assert.equal(initialized.ok, true, JSON.stringify(initialized));
  if (!initialized.ok) return;
  assert.deepEqual(initialized.value.writes, []);
  assert.equal(readFileSync(path.join(project.root, KIT_CSS), "utf8"), before);
  const integration = initialized.value.lock.integrations.find(
    (entry) => entry.kind === "stylesheet",
  );
  assert.equal(integration?.contract, STYLESHEET_CONTRACT);
  assert.deepEqual(
    initialized.value.lock.cssBlocks.map((block) => block.blockId),
    ["tokens"],
  );
});

test("a satisfied initialization replay writes nothing", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  const first = init(project);
  assert.equal(first.ok, true, JSON.stringify(first));
  if (!first.ok) return;
  apply(project, first.value.writes);
  const second = init(project);
  assert.equal(second.ok, true, JSON.stringify(second));
  if (!second.ok) return;
  assert.deepEqual(second.value.writes, []);
});
