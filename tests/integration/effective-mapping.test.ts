import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { planAdd } from "../../src/codegen/plan-add.js";
import { planInit } from "../../src/codegen/plan-init.js";
import { planSync } from "../../src/codegen/plan-sync.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import type { ProjectSnapshot } from "../../src/codegen/snapshot.js";
import type { KitLock } from "../../src/codegen/lock.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
  type KitConfig,
} from "../../src/project/config.js";
import {
  createSupportedProject,
  type TempProject,
} from "../helpers/project.js";
import { componentItem, registryOf, sourceFile } from "../helpers/registry.js";

/**
 * RCLD03-R8-1: the captured effective mapping, not a stale supplied default,
 * determines every planned target across init/add/sync.
 *
 * The complete entries must compose the selected-package detection with the
 * bounded `_kit/kit.json` discovery into one mapping before planning:
 * - a static nondefault routes directory determines the layout;
 * - an observed custom installation determines the mapping even when a caller
 *   supplies the default;
 * - a valid explicit kit.json resolves an otherwise unsupported dynamic
 *   Svelte routes configuration;
 * - a malformed, ambiguous or location-mismatched discovery is a non-executable
 *   conflict (add/sync) or a typed failure (init);
 * - an incomplete observation is rejected rather than planned against the
 *   wrong paths, and no second default installation is ever created.
 */

const DEFAULT = DEFAULT_KIT_CONFIG;

function mappingPaths(config: KitConfig, extra: readonly string[] = []) {
  const derived = deriveKitPaths(config);
  return [
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    derived.rootExports,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    config.layoutFile,
    `${derived.rootExportsDir}/button.svelte`,
    "package.json",
    ...extra,
  ];
}

function snapshotOf(project: TempProject, paths: readonly string[]) {
  const result = captureSnapshot(project.root, paths);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("snapshot failed");
  return result.value;
}

function buttonRegistry() {
  return registryOf([
    componentItem("button", {
      files: [
        sourceFile("button.svelte", "<button>button</button>\n", "button"),
      ],
      exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
    }),
  ]);
}

function add(
  snapshot: ProjectSnapshot,
  config: KitConfig = DEFAULT,
  addedRoots: readonly string[] = ["button"],
  lock: KitLock | null = null,
) {
  const registry = buttonRegistry();
  return planAdd({
    registry,
    config,
    addedRoots,
    snapshot,
    lock,
    registryVersion: registry.root.registryVersion,
    registryHash: registry.root.contentHash,
  });
}

function init(
  snapshot: ProjectSnapshot,
  config: KitConfig,
  layoutFile: string,
) {
  const registry = registryOf([]);
  const layoutSource = readIfPresent(path.join(snapshot.root, layoutFile));
  return planInit({
    config,
    layoutFile,
    layoutSource,
    snapshot,
    registry,
    configHash: "b".repeat(64),
  });
}

function codes(result: {
  ok: boolean;
  issues?: readonly { code: string }[];
}): string[] {
  return result.ok ? [] : (result.issues ?? []).map((entry) => entry.code);
}

function readIfPresent(abs: string): string {
  try {
    return readFileSync(abs, "utf8");
  } catch {
    return "";
  }
}

test("fresh defaults plan against the default SvelteKit layout", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  const result = add(snapshotOf(project, mappingPaths(DEFAULT)));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(
    result.value.executable,
    true,
    JSON.stringify(result.value.diagnostics),
  );
  assert.ok(
    result.value.writes.some((write) => write.path === DEFAULT.layoutFile),
    JSON.stringify(result.value.writes.map((write) => write.path)),
  );
});

test("a static nondefault routes mapping determines the planned layout", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "svelte.config.js",
    'export default { kit: { files: { routes: "src/views" } } };\n',
  );
  const layoutFile = "src/views/+layout.svelte";
  const effective = { ...DEFAULT, layoutFile };
  const snapshot = snapshotOf(project, mappingPaths(effective));

  const addResult = add(snapshot);
  assert.equal(addResult.ok, true, JSON.stringify(addResult));
  if (addResult.ok) {
    assert.equal(
      addResult.value.executable,
      true,
      JSON.stringify(addResult.value.diagnostics),
    );
    const layoutWrites = addResult.value.writes
      .map((write) => write.path)
      .filter((entry) => entry.endsWith("+layout.svelte"));
    assert.deepEqual(layoutWrites, [layoutFile]);
    assert.ok(
      !addResult.value.writes.some(
        (write) => write.path === DEFAULT.layoutFile,
      ),
      "add must not plan an inactive default layout",
    );
  }

  const initResult = init(snapshot, DEFAULT, layoutFile);
  assert.equal(initResult.ok, true, JSON.stringify(initResult));
  if (initResult.ok) {
    assert.ok(
      initResult.value.writes.some((write) => write.path === layoutFile),
      JSON.stringify(initResult.value.writes.map((write) => write.path)),
    );
    assert.ok(
      !initResult.value.writes.some(
        (write) => write.path === DEFAULT.layoutFile,
      ),
    );
  }
});

test("a stale default layout is rejected, never planned against", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "svelte.config.js",
    'export default { kit: { files: { routes: "src/views" } } };\n',
  );
  // The snapshot captured only the default paths, so the effective layout is
  // unobserved. The planner must not silently plan the inactive default.
  const snapshot = snapshotOf(project, mappingPaths(DEFAULT));
  const result = add(snapshot);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.equal(result.value.writes.length, 0);
  assert.ok(
    !result.value.writes.some((write) => write.path === DEFAULT.layoutFile),
  );

  const initResult = init(snapshot, DEFAULT, DEFAULT.layoutFile);
  assert.equal(initResult.ok, false, JSON.stringify(initResult));
  assert.deepEqual(codes(initResult), ["INIT_LAYOUT_MISMATCH"]);
});

test("an observed custom installation determines the mapping over a stale default", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  const custom: KitConfig = {
    ...DEFAULT,
    uiDir: "src/lib/custom-ui",
    stylesDir: "custom-styles",
    layoutFile: "src/views/+layout.svelte",
  };
  const customDerived = deriveKitPaths(custom);
  project.writeFile(
    `${customDerived.stateDir}/kit.json`,
    JSON.stringify(custom),
  );

  // The caller supplies the default, but the observed custom installation wins.
  const snapshot = snapshotOf(project, mappingPaths(custom));
  const addResult = add(snapshot);
  assert.equal(addResult.ok, true, JSON.stringify(addResult));
  if (!addResult.ok) return;
  assert.equal(
    addResult.value.executable,
    true,
    JSON.stringify(addResult.value.diagnostics),
  );
  const plannedPaths = addResult.value.writes.map((write) => write.path);
  assert.ok(plannedPaths.includes(`${customDerived.stateDir}/kit.json`));
  assert.ok(plannedPaths.includes(customDerived.kitCss));
  assert.ok(plannedPaths.includes(custom.layoutFile));
  assert.ok(
    !plannedPaths.includes(`${deriveKitPaths(DEFAULT).stateDir}/kit.json`),
    "no second default installation may be created",
  );

  const initResult = init(snapshot, DEFAULT, custom.layoutFile);
  assert.equal(initResult.ok, true, JSON.stringify(initResult));
  if (initResult.ok) {
    const initPaths = initResult.value.writes.map((write) => write.path);
    assert.ok(initPaths.includes(`${customDerived.stateDir}/kit.json`));
    assert.ok(
      !initPaths.includes(`${deriveKitPaths(DEFAULT).stateDir}/kit.json`),
    );
  }
});

test("an incomplete custom observation is rejected as a conflict, not planned by default", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  const custom: KitConfig = {
    ...DEFAULT,
    uiDir: "src/lib/custom-ui",
    stylesDir: "custom-styles",
    layoutFile: "src/views/+layout.svelte",
  };
  project.writeFile(
    `${deriveKitPaths(custom).stateDir}/kit.json`,
    JSON.stringify(custom),
  );
  // Snapshot captured only the default paths: the effective custom targets are
  // unobserved.
  const snapshot = snapshotOf(project, mappingPaths(DEFAULT));
  const result = add(snapshot);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.equal(result.value.writes.length, 0);
  assert.ok(
    !result.value.writes.some(
      (write) => write.path === `${deriveKitPaths(DEFAULT).stateDir}/kit.json`,
    ),
  );
});

test("a valid explicit kit.json resolves an unsupported dynamic routes config", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "svelte.config.js",
    "export default { kit: { files: { routes: process.env.ROUTES } } };\n",
  );
  const explicit: KitConfig = {
    ...DEFAULT,
    layoutFile: "src/views/+layout.svelte",
  };
  project.writeFile(
    `${deriveKitPaths(explicit).stateDir}/kit.json`,
    JSON.stringify(explicit),
  );
  const snapshot = snapshotOf(project, mappingPaths(explicit));
  const result = add(snapshot);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(
    result.value.executable,
    true,
    JSON.stringify(result.value.diagnostics),
  );
  assert.ok(
    result.value.writes.some((write) => write.path === explicit.layoutFile),
  );
});

test("the same dynamic routes config fails without an explicit kit.json", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "svelte.config.js",
    "export default { kit: { files: { routes: process.env.ROUTES } } };\n",
  );
  const result = add(snapshotOf(project, mappingPaths(DEFAULT)));
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(codes(result), ["PROJECT_SVELTEKIT_CONFIG_UNSUPPORTED"]);
});

test("malformed discovery is a non-executable conflict for add and a typed failure for init", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  project.writeFile("src/lib/custom-ui/_kit/kit.json", "{ not json");
  const snapshot = snapshotOf(project, mappingPaths(DEFAULT));

  const addResult = add(snapshot);
  assert.equal(addResult.ok, true, JSON.stringify(addResult));
  if (addResult.ok) {
    assert.equal(addResult.value.executable, false);
    assert.deepEqual(addResult.value.writes, []);
    assert.ok(
      addResult.value.diagnostics.some((entry) =>
        entry.includes("KIT_CONFIG_INVALID_JSON"),
      ),
      JSON.stringify(addResult.value.diagnostics),
    );
  }

  const initResult = init(snapshot, DEFAULT, DEFAULT.layoutFile);
  assert.equal(initResult.ok, false, JSON.stringify(initResult));
  assert.deepEqual(codes(initResult), ["INIT_CONFIG_INVALID"]);
});

test("an ambiguous discovery is a non-executable conflict, never a guessed default", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "a/ui/_kit/kit.json",
    JSON.stringify({ schemaVersion: 1, uiDir: "a/ui" }),
  );
  project.writeFile(
    "b/ui/_kit/kit.json",
    JSON.stringify({ schemaVersion: 1, uiDir: "b/ui" }),
  );
  const result = add(snapshotOf(project, mappingPaths(DEFAULT)));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.deepEqual(result.value.writes, []);
  assert.ok(
    result.value.diagnostics.some((entry) =>
      entry.includes("KIT_CONFIG_AMBIGUOUS"),
    ),
    JSON.stringify(result.value.diagnostics),
  );
});

test("a location-mismatched discovery is a non-executable conflict", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "src/lib/components/ui/_kit/kit.json",
    JSON.stringify({ ...DEFAULT, uiDir: "src/custom/ui" }),
  );
  const result = add(snapshotOf(project, mappingPaths(DEFAULT)));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.deepEqual(result.value.writes, []);
  assert.ok(
    result.value.diagnostics.some((entry) =>
      entry.includes("KIT_CONFIG_LOCATION_MISMATCH"),
    ),
    JSON.stringify(result.value.diagnostics),
  );
});

test("sync retirement follows the effective custom mapping", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  const custom: KitConfig = {
    ...DEFAULT,
    uiDir: "src/lib/custom-ui",
    stylesDir: "custom-styles",
    layoutFile: "src/views/+layout.svelte",
  };
  const customDerived = deriveKitPaths(custom);
  project.writeFile(
    `${customDerived.stateDir}/kit.json`,
    JSON.stringify({ ...custom, requested: ["button"] }),
  );
  const registry = buttonRegistry();
  const installed = planAdd({
    registry,
    config: { ...DEFAULT, requested: ["button"] },
    addedRoots: ["button"],
    snapshot: snapshotOf(project, mappingPaths(custom)),
    lock: null,
    registryVersion: registry.root.registryVersion,
    registryHash: registry.root.contentHash,
  });
  assert.equal(installed.ok, true, JSON.stringify(installed));
  if (!installed.ok || !installed.value.executable) return;
  // Apply the install so the custom target really exists.
  for (const write of installed.value.writes) {
    project.writeFile(write.path, new TextDecoder().decode(write.bytes));
  }

  const retired = planSync({
    registry,
    config: { ...DEFAULT, requested: [] },
    snapshot: snapshotOf(project, mappingPaths(custom)),
    lock: installed.value.lock,
    registryVersion: registry.root.registryVersion,
    registryHash: registry.root.contentHash,
  });
  assert.equal(retired.ok, true, JSON.stringify(retired));
  if (!retired.ok) return;
  assert.equal(
    retired.value.executable,
    true,
    JSON.stringify(retired.value.diagnostics),
  );
  assert.ok(
    retired.value.writes.some(
      (write) =>
        write.operation === "retire" &&
        write.path === `${customDerived.rootExportsDir}/button.svelte`,
    ),
    JSON.stringify(retired.value.writes),
  );
});
