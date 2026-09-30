import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_KIT_CONFIG,
  DEFAULT_LAYOUT_FILE,
  DEFAULT_STYLES_DIR,
  DEFAULT_UI_DIR,
  deriveKitPaths,
  parseKitConfig,
} from "../../src/project/config.js";

/**
 * S014 tests: the kit configuration schema is strict, defaults are explicit,
 * and no framework version is reused as a schema version.
 */

function issuesFor(value: unknown): string[] {
  const result = parseKitConfig(value);
  assert.equal(result.ok, false, `expected ${JSON.stringify(value)} to fail`);
  return result.ok ? [] : result.issues.map((entry) => entry.code);
}

test("canonical/default configuration validates", () => {
  for (const value of [DEFAULT_KIT_CONFIG, { schemaVersion: 1 }]) {
    const result = parseKitConfig(value);
    assert.equal(result.ok, true, JSON.stringify(result));
    if (result.ok) assert.deepEqual(result.value, DEFAULT_KIT_CONFIG);
  }
});

test("an explicit custom safe mapping is honored", () => {
  const result = parseKitConfig({
    schemaVersion: 1,
    registry: "builtin",
    uiDir: "app/lib/ui",
    stylesDir: "app/styles",
    layoutFile: "src/routes/root/+layout.svelte",
    requested: ["button", "spinner"],
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.uiDir, "app/lib/ui");
    assert.equal(result.value.layoutFile, "src/routes/root/+layout.svelte");
    assert.deepEqual(result.value.requested, ["button", "spinner"]);
  }
});

test("fixed paths derive from the validated roots", () => {
  const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);
  assert.deepEqual(derived, {
    stateDir: `${DEFAULT_UI_DIR}/_kit`,
    rootExportsDir: DEFAULT_UI_DIR,
    rootExports: `${DEFAULT_UI_DIR}/index.ts`,
    kitCss: `${DEFAULT_STYLES_DIR}/kit.css`,
    themesCss: `${DEFAULT_STYLES_DIR}/themes.css`,
    appCss: `${DEFAULT_STYLES_DIR}/app.css`,
  });
  const custom = deriveKitPaths({
    ...DEFAULT_KIT_CONFIG,
    uiDir: "app/lib/ui/",
    stylesDir: "app/styles/",
  });
  assert.equal(custom.stateDir, "app/lib/ui/_kit");
  assert.equal(custom.kitCss, "app/styles/kit.css");
});

test("unknown and legacy fields fail", () => {
  for (const value of [
    { schemaVersion: 1, ui: "src/ui" },
    { schemaVersion: 1, components: [] },
    { schemaVersion: 1, style: "kit.css" },
    { schemaVersion: 1, leptos: true },
    { schemaVersion: 1, svelteVersion: "5.57.1" },
    { schemaVersion: 1, layout: DEFAULT_LAYOUT_FILE },
  ]) {
    assert.deepEqual(issuesFor(value), ["SCHEMA_INVALID"]);
  }
});

test("bad types and unsupported schema versions fail", () => {
  for (const value of [
    { schemaVersion: "1" },
    { schemaVersion: 2 },
    { schemaVersion: 0 },
    { schemaVersion: "5.57.1" },
    { schemaVersion: 1, uiDir: 5 },
    { schemaVersion: 1, requested: "button" },
    { schemaVersion: 1, requested: [1] },
    { schemaVersion: 1, registry: "remote" },
  ]) {
    assert.equal(issuesFor(value).includes("SCHEMA_INVALID"), true);
  }
});

test("no source framework version is reused as the schema version", () => {
  const result = parseKitConfig({
    schemaVersion: "5.57.1",
    svelte: "5.57.1",
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.issues.every((entry) => entry.locator === "kit.json"),
      true,
    );
    assert.equal(
      result.issues.every((entry) => entry.code === "SCHEMA_INVALID"),
      true,
    );
  }
});

test("duplicate and malformed desired item ids fail", () => {
  for (const value of [
    { schemaVersion: 1, requested: ["button", "button"] },
    { schemaVersion: 1, requested: ["Button"] },
    { schemaVersion: 1, requested: ["alert_dialog"] },
    { schemaVersion: 1, requested: ["-button"] },
    { schemaVersion: 1, requested: [""] },
  ]) {
    assert.equal(issuesFor(value).includes("SCHEMA_INVALID"), true);
  }
});

test("an invalid tool provenance version fails", () => {
  const result = parseKitConfig({ schemaVersion: 1, toolVersion: "v1.2.3" });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "SCHEMA_INVALID");
    assert.equal(result.issues[0]?.locator, "toolVersion");
  }
  const valid = parseKitConfig({ schemaVersion: 1, toolVersion: "0.1.0" });
  assert.equal(valid.ok, true);
});

test("a non-object configuration fails without throwing", () => {
  for (const value of [null, [], "kit", 7]) {
    const result = parseKitConfig(value);
    assert.equal(result.ok, false);
  }
});

test("lexically unsafe roots are rejected", () => {
  const cases: readonly [string, string][] = [
    ["uiDir", "../outside"],
    ["uiDir", "/tmp/out"],
    ["uiDir", "C:\\out"],
    ["stylesDir", "a/../b"],
    ["layoutFile", "src\\routes\\+layout.svelte"],
    ["uiDir", "src//ui"],
  ];
  for (const [field, value] of cases) {
    const result = parseKitConfig({ schemaVersion: 1, [field]: value });
    assert.equal(result.ok, false, `${field}=${value}`);
    if (!result.ok) {
      assert.equal(result.issues[0]?.code, "PATH_UNSAFE", `${field}=${value}`);
    }
  }
});

test("stylesDir cannot overlap the reserved state directory", () => {
  const result = parseKitConfig({
    schemaVersion: 1,
    uiDir: "src/lib/components/ui",
    stylesDir: "src/lib/components/ui/_kit",
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "PATH_OVERLAP");
  }
});

test("layoutFile cannot live in the state dir or collide with root exports", () => {
  const inState = parseKitConfig({
    schemaVersion: 1,
    uiDir: "src/lib/components/ui",
    layoutFile: "src/lib/components/ui/_kit/kit.lock.json",
  });
  assert.equal(inState.ok, false);
  if (!inState.ok) assert.equal(inState.issues[0]?.code, "PATH_OVERLAP");

  const rootExports = parseKitConfig({
    schemaVersion: 1,
    uiDir: "src/lib/components/ui",
    layoutFile: "src/lib/components/ui/index.ts",
  });
  assert.equal(rootExports.ok, false);
  if (!rootExports.ok) {
    assert.equal(rootExports.issues[0]?.code, "PATH_OVERLAP");
  }
});

test("prefix siblings and nested safe roots are not rejected", () => {
  const result = parseKitConfig({
    schemaVersion: 1,
    uiDir: "src/lib/components/ui",
    stylesDir: "src/lib/components/ui-kit",
    layoutFile: "src/routes/+layout.svelte",
  });
  assert.equal(result.ok, true, JSON.stringify(result));
});
