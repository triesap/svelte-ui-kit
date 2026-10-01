import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { hashBytes } from "../../src/codegen/compare.js";
import {
  FOUNDATION_TOKENS_CONTRACT,
  renderManagedBlock,
} from "../../src/codegen/css.js";
import { planAdd } from "../../src/codegen/plan-add.js";
import { TOKENS_BODY, planInit } from "../../src/codegen/plan-init.js";
import { planSync } from "../../src/codegen/plan-sync.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import type { KitLock } from "../../src/codegen/lock.js";
import type { ModelResult } from "../../src/registry/errors.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { createTempProject } from "../helpers/project.js";
import { componentItem, registryOf, sourceFile } from "../helpers/registry.js";

/**
 * RCLD03-R6 lifecycle integration: validated initialization evidence, truthful
 * foundation `tokens` ownership through retirement/replay, and rendered layout
 * materialization. The applier enforces each declared operation, so a planner
 * that mislabels create/update/retire fails here.
 */

const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);
const CONFIG = DEFAULT_KIT_CONFIG;
const KIT_CSS = derived.kitCss;
const BUTTON = `${derived.rootExportsDir}/button.svelte`;

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function targetPaths(): string[] {
  return [
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    derived.rootExports,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    CONFIG.layoutFile,
    BUTTON,
  ];
}

function snapshotOf(
  project: ReturnType<typeof createTempProject>,
  paths: readonly string[] = targetPaths(),
) {
  const result = captureSnapshot(project.root, paths);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("snapshot failed");
  return result.value;
}

function buttonRegistry(
  options: {
    styleBody?: string;
    blockId?: string;
    version?: string;
    npm?: { name: string; range: string; role: "runtime" | "peer" }[];
  } = {},
) {
  const blockId = options.blockId;
  const item = componentItem("button", {
    files: [sourceFile("button.svelte", "<button>button</button>\n", "button")],
    exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
    ...(blockId === undefined
      ? {}
      : {
          styles: [
            {
              source: `registry/styles/button-${blockId}.css`,
              target: "kit.css",
              blockId,
              cohort: "core",
            },
          ],
        }),
    ...(options.npm === undefined ? {} : { npm: options.npm }),
  });
  const body = options.styleBody ?? `.${blockId ?? "button"} {}\n`;
  const files =
    blockId === undefined
      ? item.files
      : item.files.map((file) =>
          file.blockId === blockId
            ? {
                ...file,
                bytes: utf8(body),
                digest: hashBytes(utf8(body)) as string,
              }
            : file,
        );
  return registryOf([
    {
      ...item,
      files,
      manifest: { ...item.manifest, version: options.version ?? "0.1.0" },
    },
  ]);
}

/** Test-only applier that enforces each declared operation meaning. */
function strictApply(
  project: ReturnType<typeof createTempProject>,
  writes: readonly { path: string; bytes: Uint8Array; operation?: string }[],
): void {
  for (const write of writes) {
    const abs = path.join(project.root, write.path);
    const exists = existsSync(abs);
    assert.ok(write.operation, `write ${write.path} must declare an operation`);
    if (write.operation === "retire") {
      assert.equal(exists, true, `retire target must exist: ${write.path}`);
      rmSync(abs, { force: true });
      continue;
    }
    if (write.operation === "create") {
      assert.equal(
        exists,
        false,
        `create target must be absent: ${write.path}`,
      );
    } else {
      assert.equal(exists, true, `update target must exist: ${write.path}`);
    }
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, write.bytes);
  }
}

function add(
  project: ReturnType<typeof createTempProject>,
  registry: ReturnType<typeof registryOf>,
  overrides: Record<string, unknown> = {},
) {
  return planAdd({
    registry,
    config: CONFIG,
    addedRoots: ["button"],
    snapshot: snapshotOf(project),
    lock: null,
    registryVersion: registry.root.registryVersion,
    registryHash: registry.root.contentHash,
    ...overrides,
  });
}

function sync(
  project: ReturnType<typeof createTempProject>,
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

function good<T>(result: ModelResult<T>): T {
  if (!result.ok) throw new Error(JSON.stringify(result));
  const value = result.value as T & { executable?: boolean };
  if (value.executable === false) throw new Error(JSON.stringify(result));
  return result.value;
}

function readText(
  project: ReturnType<typeof createTempProject>,
  rel: string,
): string {
  return readFileSync(path.join(project.root, rel), "utf8");
}

// ---------------------------------------------------------------------------
// RCLD03-R6-2: foundation ownership, retirement and replay
// ---------------------------------------------------------------------------

test("a fresh add records the foundation tokens contract with the owned body baseline", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const result = add(project, buttonRegistry());
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, true);
  const integration = result.value.lock?.integrations.find(
    (entry) => entry.kind === "stylesheet",
  );
  assert.ok(integration);
  assert.equal(integration.contract, FOUNDATION_TOKENS_CONTRACT);
  assert.equal(
    integration.baseline,
    hashBytes(utf8(TOKENS_BODY)) as string,
    "a foundation baseline hashes the exact owned tokens body",
  );
  assert.deepEqual(
    result.value.lock?.cssBlocks,
    [],
    "the foundation layer is not an item-owned cssBlock",
  );
});

test("a missing foundation tokens block conflicts instead of being silently restored", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const first = good(add(project, buttonRegistry()));
  strictApply(project, first.writes);
  project.writeFile(KIT_CSS, "/* application only */\n");
  const result = add(project, buttonRegistry(), { lock: first.lock });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.deepEqual(result.value.writes, []);
  assert.ok(
    result.value.diagnostics.some((entry) =>
      entry.includes(
        "foundation integration owns the tokens block but it is absent",
      ),
    ),
    JSON.stringify(result.value.diagnostics),
  );
});

test("initialize/add/customize/retire/re-add/retire never reacquires detached tokens", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const tokens = buttonRegistry({
    styleBody: ".tokens { color: red; }\n",
    blockId: "tokens",
  });
  const first = good(add(project, tokens));
  strictApply(project, first.writes);
  assert.ok(
    first.lock?.cssBlocks.some((block) => block.blockId === "tokens"),
    "the registry item initially owns the tokens block",
  );

  // Customize the retained tokens body.
  writeFileSync(
    path.join(project.root, KIT_CSS),
    renderManagedBlock("tokens", "\n.tokens { color: purple; }\n"),
  );
  const retired = good(sync(project, tokens, first.lock, CONFIG));
  strictApply(project, retired.writes);
  assert.deepEqual(
    retired.lock?.cssBlocks,
    [],
    "retiring detaches item ownership",
  );
  assert.ok(
    retired.cssRetirement.some(
      (record) => record.blockId === "tokens" && record.action === "retain",
    ),
  );

  // Re-adding an identical incoming body must not reclaim the detached text.
  const readd = add(project, tokens, { lock: retired.lock });
  assert.equal(readd.ok, true, JSON.stringify(readd));
  if (!readd.ok) return;
  assert.equal(readd.value.executable, false);
  assert.deepEqual(readd.value.writes, []);

  // The original customized bytes still exist; a forced retire cannot delete them.
  assert.ok(readText(project, KIT_CSS).includes(".tokens { color: purple; }"));
  assert.ok(readText(project, KIT_CSS).includes("svelte-ui-kit:start tokens"));
});

test("a clean registry tokens retirement establishes the minimal foundation once", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const tokens = buttonRegistry({
    styleBody: ".tokens { color: red; }\n",
    blockId: "tokens",
  });
  const first = good(add(project, tokens));
  strictApply(project, first.writes);
  const retired = good(sync(project, tokens, first.lock, CONFIG));
  strictApply(project, retired.writes);
  assert.ok(
    readText(project, KIT_CSS).includes("svelte-ui-kit:start tokens"),
    "clean retirement re-establishes the required foundation layer",
  );
  const integration = retired.lock?.integrations.find(
    (entry) => entry.kind === "stylesheet",
  );
  assert.equal(integration?.contract, FOUNDATION_TOKENS_CONTRACT);

  const replay = sync(project, tokens, retired.lock, CONFIG);
  assert.equal(replay.ok, true, JSON.stringify(replay));
  if (!replay.ok) return;
  assert.equal(replay.value.executable, true);
  assert.deepEqual(replay.value.writes, [], "a satisfied replay is no_change");
});

test("a customized foundation baseline is preserved rather than reset to local bytes", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const first = good(add(project, buttonRegistry()));
  strictApply(project, first.writes);
  const before = first.lock?.integrations.find(
    (entry) => entry.kind === "stylesheet",
  );
  assert.ok(before);
  project.writeFile(
    KIT_CSS,
    renderManagedBlock("tokens", "\n.custom { color: purple; }\n"),
  );
  const result = sync(project, buttonRegistry(), first.lock, {
    ...CONFIG,
    requested: ["button"],
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, true);
  const after = result.value.lock?.integrations.find(
    (entry) => entry.kind === "stylesheet",
  );
  assert.equal(after?.baseline, before.baseline);
  assert.equal(after?.contract, FOUNDATION_TOKENS_CONTRACT);
  assert.deepEqual(result.value.writes, []);
});

test("legacy aggregate-only stylesheet evidence does not confer tokens ownership", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(KIT_CSS, renderManagedBlock("tokens", TOKENS_BODY));
  const lock: KitLock = {
    schemaVersion: 1,
    toolVersion: "0.1.0",
    registryVersion: "0.1.0",
    registryHash: "a".repeat(64),
    configHash: "b".repeat(64),
    requested: [],
    items: [],
    files: [],
    cssBlocks: [],
    integrations: [
      {
        kind: "stylesheet",
        path: KIT_CSS,
        baseline: hashBytes(utf8(readText(project, KIT_CSS))) as string,
        contract: "stylesheet-v1",
      },
    ],
  };
  project.writeFile(
    `${derived.stateDir}/kit.lock.json`,
    `${JSON.stringify(lock, null, 2)}\n`,
  );
  const result = add(project, buttonRegistry(), { lock });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.ok(
    result.value.diagnostics.some((entry) =>
      entry.includes("markers alone do not confer ownership"),
    ),
    JSON.stringify(result.value.diagnostics),
  );
});

test("a customized foundation transfers to a registry item within one plan", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const first = good(add(project, buttonRegistry()));
  strictApply(project, first.writes);
  writeFileSync(
    path.join(project.root, KIT_CSS),
    renderManagedBlock("tokens", "\n.tokens { color: purple; }\n"),
  );
  const tokens = buttonRegistry({
    styleBody: ".tokens { color: red; }\n",
    blockId: "tokens",
  });
  const result = add(project, tokens, {
    config: { ...CONFIG, requested: ["button"] },
    lock: first.lock,
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(
    result.value.executable,
    false,
    "a customized foundation must not silently adopt new registry tokens",
  );
});

// ---------------------------------------------------------------------------
// RCLD03-R6-1: validated initialization evidence and observed mapping
// ---------------------------------------------------------------------------

test("initialization refuses unverifiable scalar registry identity", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const result = planInit({
    config: CONFIG,
    layoutFile: CONFIG.layoutFile,
    layoutSource: "",
    snapshot: snapshotOf(project),
    registryVersion: "9.9.9",
    registryHash: "a".repeat(64),
    configHash: "b".repeat(64),
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.ok ? [] : result.issues.map((entry) => entry.code), [
    "INIT_REGISTRY_UNVERIFIED",
  ]);
});

test("initialization records the validated registry identity, not a spoofed scalar", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const registry = registryOf([]);
  const result = planInit({
    config: CONFIG,
    layoutFile: CONFIG.layoutFile,
    layoutSource: "",
    snapshot: snapshotOf(project),
    registry,
    registryVersion: "9.9.9",
    registryHash: "a".repeat(64),
    configHash: "b".repeat(64),
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(
    result.value.lock.registryVersion,
    registry.root.registryVersion,
  );
  assert.equal(result.value.lock.registryHash, registry.root.contentHash);
});

test("initialization preserves a valid observed custom styles mapping", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const custom = {
    ...CONFIG,
    stylesDir: "app-styles",
  };
  project.writeFile(
    `${derived.stateDir}/kit.json`,
    `${JSON.stringify(custom, null, 2)}\n`,
  );
  const registry = registryOf([]);
  const result = planInit({
    config: CONFIG,
    layoutFile: CONFIG.layoutFile,
    layoutSource: "",
    snapshot: snapshotOf(project, [
      `${derived.stateDir}/kit.json`,
      `${derived.stateDir}/kit.lock.json`,
      derived.rootExports,
      "app-styles/kit.css",
      "app-styles/themes.css",
      "app-styles/app.css",
      CONFIG.layoutFile,
    ]),
    registry,
    configHash: "b".repeat(64),
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  const written = new Set(result.value.writes.map((entry) => entry.path));
  assert.ok(written.has("app-styles/kit.css"));
  assert.ok(!written.has(derived.kitCss));
  assert.ok(
    !written.has(`${derived.stateDir}/kit.json`),
    "the valid observed mapping is preserved, not overwritten by defaults",
  );
});

test("initialization requires a complete snapshot for the effective mapping", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    `${derived.stateDir}/kit.json`,
    `${JSON.stringify({ ...CONFIG, stylesDir: "app-styles" }, null, 2)}\n`,
  );
  const result = planInit({
    config: CONFIG,
    layoutFile: CONFIG.layoutFile,
    layoutSource: "",
    snapshot: snapshotOf(project),
    registry: registryOf([]),
    configHash: "b".repeat(64),
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.ok ? [] : result.issues.map((entry) => entry.code), [
    "INIT_OBSERVATION_INCOMPLETE",
  ]);
});

// ---------------------------------------------------------------------------
// RCLD03-R6-1: one immutable dependency observation
// ---------------------------------------------------------------------------

test("a captured snapshot does not mix later live dependency metadata", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({
      name: "consumer",
      packageManager: "pnpm@11.22.0",
      dependencies: { "bits-ui": "^2.19.3", svelte: "5.57.1" },
    }),
  );
  project.writeFile(
    "node_modules/bits-ui/package.json",
    JSON.stringify({
      name: "bits-ui",
      version: "2.19.3",
      peerDependencies: { svelte: "^5.0.0" },
    }),
  );
  project.writeFile(
    "node_modules/svelte/package.json",
    JSON.stringify({ name: "svelte", version: "5.57.1" }),
  );
  const registry = buttonRegistry({
    npm: [{ name: "bits-ui", range: "^2.19.3", role: "runtime" }],
  });
  const frozen = snapshotOf(project);
  const before = add(project, registry, { snapshot: frozen });
  // A live edit must not change the plan derived from the captured evidence.
  writeFileSync(path.join(project.root, "package.json"), "not json");
  const after = add(project, registry, { snapshot: frozen });
  assert.equal(before.ok, true, JSON.stringify(before));
  assert.equal(after.ok, true, JSON.stringify(after));
  if (!before.ok || !after.ok) return;
  assert.equal(before.value.executable, true);
  assert.equal(after.value.executable, true);
  assert.deepEqual(
    after.value.writes.map((entry) => [entry.path, entry.operation]),
    before.value.writes.map((entry) => [entry.path, entry.operation]),
  );
  assert.deepEqual(after.value.diagnostics, before.value.diagnostics);
});

// ---------------------------------------------------------------------------
// RCLD03-R6-3: rendered layout materialization
// ---------------------------------------------------------------------------

test("an absent layout is materialized as a rendering passthrough", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const first = good(add(project, buttonRegistry()));
  strictApply(project, first.writes);
  const layout = readText(project, CONFIG.layoutFile);
  assert.ok(layout.includes("let { children } = $props();"), layout);
  assert.ok(layout.includes("{@render children()}"), layout);
  assert.ok(layout.includes('import "../styles/kit.css";'), layout);
});

test("an existing layout keeps its exact rendering and is not given a second render", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const existing = [
    '<script lang="ts">',
    '  import type { Snippet } from "svelte";',
    "  let { children }: { children: Snippet } = $props();",
    "</script>",
    "",
    '<div class="shell">{@render children()}</div>',
    "",
  ].join("\n");
  project.writeFile(CONFIG.layoutFile, existing);
  const first = good(add(project, buttonRegistry()));
  strictApply(project, first.writes);
  const layout = readText(project, CONFIG.layoutFile);
  assert.ok(layout.includes('import "../styles/kit.css";'), layout);
  assert.equal(
    (layout.match(/\{@render children\(\)\}/g) ?? []).length,
    1,
    layout,
  );
  assert.ok(layout.includes('<div class="shell">'), layout);
});
