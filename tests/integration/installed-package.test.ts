import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
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

/**
 * Installed-artifact execution (S025–S027, RCLD02-R2-2).
 *
 * The registry/schema assets and the *default* model parsers must load from the
 * emitted package copy, not from the authoring checkout. This test copies the
 * built `dist/`, `schema/`, `registry/` and manifest into an isolated
 * directory, links only the declared runtime dependencies (`ajv`, `semver`)
 * beside it, then runs a child Node process from a *different* CWD that imports
 * the copied emitted modules. It exercises the registry snapshot plus the
 * config, lock, theme and envelope parsers through their contained default
 * authority, and the negative controls (missing, corrupt and escaping schema
 * and registry assets) prove there is no authoring-tree or CWD fallback.
 */
const PKG_ROOT = process.cwd();

function linkRuntimeDependency(installedRoot: string, name: string): void {
  symlinkSync(
    path.join(PKG_ROOT, "node_modules", name),
    path.join(installedRoot, "node_modules", name),
    "dir",
  );
}

function installedCopy(t: { after: (fn: () => void) => void }): string {
  const installed = mkdtempSync(path.join(os.tmpdir(), "suik-installed-"));
  t.after(() => rmSync(installed, { recursive: true, force: true }));
  for (const directory of ["dist", "schema", "registry"]) {
    cpSync(path.join(PKG_ROOT, directory), path.join(installed, directory), {
      recursive: true,
    });
  }
  cpSync(
    path.join(PKG_ROOT, "package.json"),
    path.join(installed, "package.json"),
  );
  mkdirSync(path.join(installed, "node_modules"));
  for (const dependency of ["ajv", "semver", "svelte", "typescript"]) {
    linkRuntimeDependency(installed, dependency);
  }
  return installed;
}

const RUNNER_SOURCE = [
  'import { pathToFileURL } from "node:url";',
  'import path from "node:path";',
  "const installed = process.env.SUIK_INSTALLED;",
  "const imp = (relative) =>",
  '  import(pathToFileURL(path.join(installed, "dist", relative)).href);',
  "const assets = await imp('registry/assets.js');",
  "const load = await imp('registry/load.js');",
  "const config = await imp('project/config.js');",
  "const lock = await imp('codegen/lock.js');",
  "const theme = await imp('registry/theme.js');",
  "const protocol = await imp('cli/protocol.js');",
  "const codes = (result) =>",
  "  result.ok ? [] : result.issues.map((issue) => issue.code);",
  "const provider = assets.createInstalledAssetProvider();",
  "const snapshot = load.loadRegistrySnapshot(provider);",
  "const configResult = config.parseKitConfig({ schemaVersion: 1 });",
  "const lockResult = lock.parseKitLock({",
  "  schemaVersion: 1,",
  "  toolVersion: '0.1.0',",
  "  registryVersion: '0.1.0',",
  "  registryHash: 'a'.repeat(64),",
  "  configHash: 'b'.repeat(64),",
  "  requested: [],",
  "  items: [],",
  "  files: [],",
  "  cssBlocks: [],",
  "  integrations: [],",
  "});",
  "const tokenContract = theme.parseTokenContract({",
  "  id: 'urn:svelte-ui-kit:token-contract:v1',",
  "  contractVersion: 1,",
  "  description: 'installed fixture',",
  "  layers: [",
  "    'svelte-ui-kit.tokens',",
  "    'svelte-ui-kit.themes',",
  "    'svelte-ui-kit.components',",
  "  ],",
  "  tokens: [",
  "    { name: '--kit-color', role: 'color', type: 'color', fallback: '#000' },",
  "  ],",
  "  radiusGrammar: { corners: 4, elliptical: true, slashSeparator: true },",
  "});",
  "const envelope = protocol.parseEnvelope({",
  "  schemaVersion: 1,",
  "  command: 'help',",
  "  status: 'success',",
  "  diagnostics: [],",
  "  changes: [],",
  "  data: null,",
  "});",
  "process.stdout.write(",
  "  JSON.stringify({",
  "    cwd: process.cwd(),",
  "    root: provider.root,",
  "    snapshot: {",
  "      ok: snapshot.ok,",
  "      items: snapshot.ok ? snapshot.value.items.length : null,",
  "      codes: codes(snapshot),",
  "    },",
  "    config: { ok: configResult.ok, codes: codes(configResult) },",
  "    lock: { ok: lockResult.ok, codes: codes(lockResult) },",
  "    theme: { ok: tokenContract.ok, codes: codes(tokenContract) },",
  "    envelope: { ok: envelope.ok, codes: codes(envelope) },",
  "  }),",
  ");",
  "",
].join("\n");

interface ChildResult {
  readonly cwd: string;
  readonly root: string;
  readonly snapshot: { ok: boolean; items: number | null; codes: string[] };
  readonly config: { ok: boolean; codes: string[] };
  readonly lock: { ok: boolean; codes: string[] };
  readonly theme: { ok: boolean; codes: string[] };
  readonly envelope: { ok: boolean; codes: string[] };
}

function runChild(
  t: { after: (fn: () => void) => void },
  installed: string,
): ChildResult {
  const runner = mkdtempSync(path.join(os.tmpdir(), "suik-runner-"));
  t.after(() => rmSync(runner, { recursive: true, force: true }));
  const runnerScript = path.join(runner, "run.mjs");
  writeFileSync(runnerScript, RUNNER_SOURCE);
  const result = spawnSync(process.execPath, [runnerScript], {
    cwd: runner,
    encoding: "utf8",
    timeout: 60_000,
    env: { ...process.env, SUIK_INSTALLED: installed },
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout) as ChildResult;
}

test("emitted modules and every default parser load from an isolated package copy", (t) => {
  const installed = installedCopy(t);
  const output = runChild(t, installed);
  const expected = JSON.parse(
    readFileSync(path.join(installed, "registry/registry.json"), "utf8"),
  );
  assert.deepEqual(output.snapshot, {
    ok: true,
    items: expected.items.length,
    codes: [],
  });
  assert.deepEqual(output.config, { ok: true, codes: [] });
  assert.deepEqual(output.lock, { ok: true, codes: [] });
  assert.deepEqual(output.theme, { ok: true, codes: [] });
  assert.deepEqual(output.envelope, { ok: true, codes: [] });
  assert.equal(output.root, installed);
  assert.notEqual(output.root, PKG_ROOT);
  assert.notEqual(output.cwd, PKG_ROOT);
});

test("a missing copied schema fails the default parsers with no checkout fallback", (t) => {
  const installed = installedCopy(t);
  rmSync(path.join(installed, "schema", "v1", "kit.schema.json"));
  const output = runChild(t, installed);
  assert.equal(output.config.ok, false);
  assert.equal(output.config.codes.includes("ASSET_MISSING"), true);
  assert.equal(output.snapshot.ok, false);
  assert.equal(output.snapshot.codes.includes("ASSET_MISSING"), true);
});

test("a corrupt copied schema fails the default parsers", (t) => {
  const installed = installedCopy(t);
  writeFileSync(
    path.join(installed, "schema", "v1", "kit.schema.json"),
    "{ not json\n",
  );
  const output = runChild(t, installed);
  assert.equal(output.config.ok, false);
  assert.equal(output.config.codes.includes("SCHEMA_INVALID_DOCUMENT"), true);
});

test("an escaping copied schema symlink is rejected", (t) => {
  const installed = installedCopy(t);
  const outside = mkdtempSync(path.join(os.tmpdir(), "suik-installed-out-"));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  const external = path.join(outside, "kit.json");
  writeFileSync(external, "{}\n");
  rmSync(path.join(installed, "schema", "v1", "kit.schema.json"));
  symlinkSync(
    external,
    path.join(installed, "schema", "v1", "kit.schema.json"),
  );
  const output = runChild(t, installed);
  assert.equal(output.config.ok, false);
  assert.equal(output.config.codes.includes("ASSET_SYMLINK_ESCAPE"), true);
});

test("an escaping copied registry asset symlink is rejected", (t) => {
  const installed = installedCopy(t);
  const outside = mkdtempSync(path.join(os.tmpdir(), "suik-installed-out-"));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  const external = path.join(outside, "registry.json");
  writeFileSync(external, "{}\n");
  rmSync(path.join(installed, "registry", "registry.json"));
  symlinkSync(external, path.join(installed, "registry", "registry.json"));
  const output = runChild(t, installed);
  assert.equal(output.snapshot.ok, false);
  assert.equal(output.snapshot.codes.includes("ASSET_SYMLINK_ESCAPE"), true);
});

/**
 * RCLD02-R3 installed-copy controls: the joint-compatibility and complete
 * ownership repairs must be present in the emitted modules and exercised
 * through real parsers from an isolated package copy and a different CWD.
 */
const R3_RUNNER_SOURCE = `import { pathToFileURL } from "node:url";
import path from "node:path";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
const installed = process.env.SUIK_INSTALLED;
const mode = process.env.SUIK_R3_MODE;
const imp = (relative) =>
  import(pathToFileURL(path.join(installed, "dist", relative)).href);
const assets = await imp("registry/assets.js");
const validate = await imp("registry/validate.js");
const lock = await imp("codegen/lock.js");
const digest = await imp("codegen/digest.js");
const model = await imp("registry/model.js");
const root = mkdtempSync(path.join(os.tmpdir(), "suik-r3-"));
cpSync(path.join(installed, "schema"), path.join(root, "schema"), { recursive: true });
mkdirSync(path.join(root, "registry", "ui"), { recursive: true });
mkdirSync(path.join(root, "registry", "templates"), { recursive: true });
const compat = { svelte: "5.57.1", bits: "2.19.3", date: "^3.8.1" };
const itemManifest = (id, date) => ({
  schemaVersion: 1,
  id,
  kind: "component",
  version: "0.1.0",
  description: "probe",
  compatibility: { ...compat, date },
  files: [
    { source: "templates/" + id + ".svelte", target: id + ".svelte", kind: "svelte", cohort: "core" },
  ],
  exports: [{ name: id[0].toUpperCase() + id.slice(1), target: id + ".svelte", kind: "value" }],
  styles: [],
  registryDependencies: [],
  npmDependencies: [],
  accessibility: { requiredNames: [], keyboard: [], focus: [], form: [], tests: [] },
});
const items =
  mode === "compatible"
    ? [itemManifest("button", ">=3.8.1 <3.10.0"), itemManifest("card", ">=3.9.0 <3.11.0")]
    : [itemManifest("button", ">=3.8.1 <3.10.0"), itemManifest("card", ">=3.10.0 <4.0.0")];
const assetList = [];
for (const item of items) {
  const text = JSON.stringify(item);
  writeFileSync(path.join(root, "registry", "ui", item.id + ".json"), text);
  assetList.push({ path: "registry/ui/" + item.id + ".json", digest: digest.sha256Hex(text) });
  const bytes = Buffer.from("<script>export interface X {}</script>\\n");
  writeFileSync(path.join(root, "registry", item.files[0].source), bytes);
  assetList.push({ path: "registry/" + item.files[0].source, digest: digest.sha256Hex(bytes) });
}
const basis = {
  schemaVersion: 1,
  registryVersion: "0.1.0",
  compatibility: compat,
  items: items.map((item) => ({ id: item.id, manifest: "ui/" + item.id + ".json" })),
};
writeFileSync(
  path.join(root, "registry", "registry.json"),
  JSON.stringify({ ...basis, contentHash: model.computeRegistryContentHash(basis, assetList) }),
);
const health = validate.validateRegistryHealth(assets.createAssetProvider(root));
const fileRecord = (p, owner) => ({
  path: p,
  owner,
  baseHash: "d".repeat(64),
  itemVersion: "0.1.0",
  cohort: "core",
});
const lockValue = {
  schemaVersion: 1,
  toolVersion: "0.1.0",
  registryVersion: "0.1.0",
  registryHash: "a".repeat(64),
  configHash: "b".repeat(64),
  requested: ["button", "card"],
  items: [
    { id: "button", version: "0.1.0", digest: "c".repeat(64), origin: "explicit" },
    { id: "card", version: "0.1.0", digest: "c".repeat(64), origin: "explicit" },
  ],
  files:
    mode === "compatible"
      ? [
          fileRecord("src/ui/button/root.svelte", "button"),
          fileRecord("src/ui/button/trigger.svelte", "card"),
        ]
      : [
          fileRecord("src/ui/button.svelte", "button"),
          fileRecord("src/ui/Button.svelte", "card"),
        ],
  cssBlocks: [],
  integrations: [],
};
const lockResult = lock.parseKitLock(lockValue, "kit.lock.json", {
  uiDir: "src/ui",
  stylesDir: "src/ui/styles",
  stateDir: "src/ui/_kit",
});
const codes = (result) => (result.ok ? [] : result.issues.map((issue) => issue.code));
process.stdout.write(
  JSON.stringify({
    cwd: process.cwd(),
    root,
    health: { ok: health.ok, codes: codes(health) },
    lock: { ok: lockResult.ok, codes: codes(lockResult) },
  }),
);
rmSync(root, { recursive: true, force: true });
`;

interface R3ChildResult {
  readonly cwd: string;
  readonly root: string;
  readonly health: { ok: boolean; codes: string[] };
  readonly lock: { ok: boolean; codes: string[] };
}

function runR3Child(
  t: { after: (fn: () => void) => void },
  installed: string,
  mode: "compatible" | "conflicting",
): R3ChildResult {
  const runner = mkdtempSync(path.join(os.tmpdir(), "suik-r3-runner-"));
  t.after(() => rmSync(runner, { recursive: true, force: true }));
  const runnerScript = path.join(runner, "run.mjs");
  writeFileSync(runnerScript, R3_RUNNER_SOURCE);
  const result = spawnSync(process.execPath, [runnerScript], {
    cwd: runner,
    encoding: "utf8",
    timeout: 60_000,
    env: { ...process.env, SUIK_INSTALLED: installed, SUIK_R3_MODE: mode },
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout) as R3ChildResult;
}

test("the emitted copy accepts a valid joint overlap and valid lock ownership", (t) => {
  const installed = installedCopy(t);
  const output = runR3Child(t, installed, "compatible");
  assert.notEqual(output.cwd, PKG_ROOT);
  assert.deepEqual(output.health, { ok: true, codes: [] });
  assert.deepEqual(output.lock, { ok: true, codes: [] });
});

test("the emitted copy rejects disjoint joint constraints and lock case aliases", (t) => {
  const installed = installedCopy(t);
  const output = runR3Child(t, installed, "conflicting");
  assert.equal(output.health.ok, false);
  assert.equal(output.health.codes.includes("COMPATIBILITY_CONFLICT"), true);
  assert.equal(output.lock.ok, false);
  assert.equal(output.lock.codes.includes("LOCK_CASE_ALIAS"), true);
});

/**
 * RCLD02-R4 installed-copy controls: the complete cross-role ownership
 * inventory must be present in the emitted modules and reject/accept the same
 * cases as the authoring parser from an isolated package copy.
 */
const R4_RUNNER_SOURCE = `import { pathToFileURL } from "node:url";
import path from "node:path";
const installed = process.env.SUIK_INSTALLED;
const imp = (relative) =>
  import(pathToFileURL(path.join(installed, "dist", relative)).href);
const lock = await imp("codegen/lock.js");
const H = (c) => c.repeat(64);
const base = (overrides) => ({
  schemaVersion: 1,
  toolVersion: "0.1.0",
  registryVersion: "0.1.0",
  registryHash: H("a"),
  configHash: H("b"),
  requested: ["button"],
  items: [{ id: "button", version: "0.1.0", digest: H("c"), origin: "explicit" }],
  files: [],
  cssBlocks: [],
  integrations: [],
  ...overrides,
});
const file = (p) => ({ path: p, owner: "button", baseHash: H("e"), itemVersion: "0.1.0", cohort: "core" });
const block = (p, id) => ({ path: p, owner: "button", blockId: id, baseHash: H("e"), itemVersion: "0.1.0", cohort: "core" });
const integration = (p, kind) => ({ kind, path: p, baseline: H("e"), contract: "layout-v1" });
const context = { uiDir: "src/ui", stylesDir: "src/ui/styles", stateDir: "src/ui/_kit" };
const cases = [
  { name: "file-vs-layout-exact", fields: { files: [file("src/ui/button.svelte")], integrations: [integration("src/ui/button.svelte", "layout")] }, expected: false, code: "LOCK_PATH_OVERLAP" },
  { name: "file-vs-integration-alias", fields: { files: [file("src/ui/button.svelte")], integrations: [integration("src/ui/Button.svelte", "layout")] }, expected: false, code: "LOCK_CASE_ALIAS" },
  { name: "file-ancestor-of-block", fields: { files: [file("src/ui/styles/family")], cssBlocks: [block("src/ui/styles/family/kit.css", "button")] }, expected: false, code: "LOCK_PATH_OVERLAP" },
  { name: "block-ancestor-of-integration", fields: { cssBlocks: [block("src/ui/styles/kit.css", "button")], integrations: [integration("src/ui/styles/kit.css/layout.svelte", "layout")] }, expected: false, code: "LOCK_PATH_OVERLAP" },
  { name: "layout-vs-stylesheet-integration", fields: { integrations: [integration("src/routes/+layout.svelte", "layout"), integration("src/routes/+layout.svelte", "stylesheet")] }, expected: false, code: "LOCK_PATH_OVERLAP" },
  { name: "block-vs-layout-integration", fields: { cssBlocks: [block("src/ui/styles/kit.css", "button")], integrations: [integration("src/ui/styles/kit.css", "layout")] }, expected: false, code: "LOCK_PATH_OVERLAP" },
  { name: "block-vs-stylesheet-alias", fields: { cssBlocks: [block("src/ui/styles/kit.css", "button")], integrations: [integration("src/ui/styles/Kit.css", "stylesheet")] }, expected: false, code: "LOCK_CASE_ALIAS" },
  { name: "shared-aggregate", fields: { cssBlocks: [block("src/ui/styles/kit.css", "button"), block("src/ui/styles/kit.css", "card")], integrations: [integration("src/ui/styles/kit.css", "stylesheet")] }, expected: true },
  { name: "disjoint-valid", fields: { files: [file("src/ui/button/root.svelte")], cssBlocks: [block("src/ui/styles/kit.css", "button")], integrations: [integration("src/routes/+layout.svelte", "layout")] }, expected: true },
  { name: "file-ancestor-of-nested-styles-dir", fields: { files: [file("src/ui/styles")] }, expected: false, code: "LOCK_NAMESPACE", context: { uiDir: "src/ui", stylesDir: "src/ui/styles/nested", stateDir: "src/ui/_kit" } },
];
const results = cases.map((entry) => {
  const result = lock.parseKitLock(base(entry.fields), "kit.lock.json", entry.context ?? context);
  const codes = result.ok ? [] : result.issues.map((issue) => issue.code);
  return {
    name: entry.name,
    expected: entry.expected,
    ok: result.ok,
    code: entry.code ?? null,
    codes,
  };
});
process.stdout.write(JSON.stringify({ cwd: process.cwd(), results }));
`;

interface R4CaseResult {
  readonly name: string;
  readonly expected: boolean;
  readonly ok: boolean;
  readonly code: string | null;
  readonly codes: string[];
}

interface R4ChildResult {
  readonly cwd: string;
  readonly results: R4CaseResult[];
}

function runR4Child(
  t: { after: (fn: () => void) => void },
  installed: string,
): R4ChildResult {
  const runner = mkdtempSync(path.join(os.tmpdir(), "suik-r4-runner-"));
  t.after(() => rmSync(runner, { recursive: true, force: true }));
  const runnerScript = path.join(runner, "run.mjs");
  writeFileSync(runnerScript, R4_RUNNER_SOURCE);
  const result = spawnSync(process.execPath, [runnerScript], {
    cwd: runner,
    encoding: "utf8",
    timeout: 60_000,
    env: { ...process.env, SUIK_INSTALLED: installed },
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout) as R4ChildResult;
}

test("the emitted copy enforces the complete cross-role ownership inventory", (t) => {
  const installed = installedCopy(t);
  const output = runR4Child(t, installed);
  assert.notEqual(output.cwd, PKG_ROOT);
  assert.equal(output.results.length, 10);
  for (const entry of output.results) {
    assert.equal(entry.ok, entry.expected, `${entry.name}: ${entry.codes}`);
    assert.equal(entry.codes.includes("SCHEMA_INVALID"), false, entry.name);
    if (entry.code !== null) {
      assert.equal(entry.codes.includes(entry.code), true, entry.name);
    }
  }
});

/**
 * RCLD03-R4-4: the emitted planner and parser paths must import and run
 * outside the checkout with the declared runtime TypeScript/Svelte parsers,
 * never falling back to the authoring tree. The unchanged ajv/semver model
 * tests above never exercise these modules.
 */
const R5_RUNNER_SOURCE = `import { pathToFileURL } from "node:url";
import path from "node:path";
const installed = process.env.SUIK_INSTALLED;
const imp = (relative) =>
  import(pathToFileURL(path.join(installed, "dist", relative)).href);
const planAdd = await imp("codegen/plan-add.js");
const exportsModule = await imp("codegen/exports.js");
const exportParse = await imp("codegen/export-parse.js");
const svelteModule = await imp("codegen/svelte.js");
const plan = await imp("codegen/plan.js");
const snapshotModule = await imp("codegen/snapshot.js");
const configModule = await imp("project/config.js");
const assetsModule = await imp("registry/assets.js");
const loadModule = await imp("registry/load.js");
const fsModule = await import("node:fs");
const osModule = await import("node:os");
const provider = assetsModule.createInstalledAssetProvider();
const registryResult = loadModule.loadRegistrySnapshot(provider);
const configResult = configModule.parseKitConfig({ schemaVersion: 1 });
const projectRoot = fsModule.mkdtempSync(path.join(osModule.tmpdir(), "suik-installed-plan-"));
const derived = configModule.deriveKitPaths(configResult.value);
fsModule.writeFileSync(
  path.join(projectRoot, "package.json"),
  JSON.stringify({ name: "consumer", private: true, devDependencies: { "@sveltejs/kit": "2.70.3" } }),
);
const observed = snapshotModule.captureSnapshot(projectRoot, [
  derived.stateDir + "/kit.json",
  derived.stateDir + "/kit.lock.json",
  derived.rootExports,
  derived.kitCss,
  derived.themesCss,
  derived.appCss,
  configResult.value.layoutFile,
]);
const planned = planAdd.planAdd({
  registry: registryResult.value,
  config: configResult.value,
  addedRoots: [],
  snapshot: observed.value,
  lock: null,
  registryVersion: registryResult.value.root.registryVersion,
  registryHash: registryResult.value.root.contentHash,
});
fsModule.rmSync(projectRoot, { recursive: true, force: true });
const patched = exportsModule.patchExportRegion("index.ts", "", [
  { name: "Button", target: "./button.svelte", kind: "value" },
]);
const region = patched.ok
  ? exportParse.parseExportRegion("index.ts", patched.value)
  : { ok: false };
const compound = exportsModule
  .renderCompoundBarrel([
    { name: "Root", target: "./root.svelte", kind: "value" },
    { name: "Trigger", target: "./trigger.svelte", kind: "value" },
  ])
  .includes("default as Root");
const layout = svelteModule.patchLayoutImports("<main />", [
  { specifier: "./kit.css" },
  { specifier: "./themes.css" },
  { specifier: "./app.css" },
]);
process.stdout.write(
  JSON.stringify({
    cwd: process.cwd(),
    root: installed,
    planAddType: typeof planAdd.planAdd,
    planAddOk: planned.ok,
    planAddExecutable: planned.ok ? planned.value.executable : false,
    planAddWrites: planned.ok ? planned.value.writes.length : -1,
    exportRegionOk: patched.ok,
    regionFound: region.ok ? region.value.region !== null : false,
    compound,
    layoutOk: layout.ok,
    layoutOrder:
      layout.ok && layout.value.includes("kit.css") && layout.value.indexOf("kit.css") < layout.value.indexOf("app.css"),
    envelopeOperation: plan.toPlanningEnvelope("add", true, [
      { path: "a", operation: "retire", bytes: new Uint8Array() },
    ], []).writes[0].operation,
  }),
);
`;

interface R5ChildResult {
  readonly cwd: string;
  readonly root: string;
  readonly planAddType: string;
  readonly planAddOk: boolean;
  readonly planAddExecutable: boolean;
  readonly planAddWrites: number;
  readonly exportRegionOk: boolean;
  readonly regionFound: boolean;
  readonly compound: boolean;
  readonly layoutOk: boolean;
  readonly layoutOrder: boolean;
  readonly envelopeOperation: string;
}

function runR5Child(
  t: { after: (fn: () => void) => void },
  installed: string,
): R5ChildResult {
  const runner = mkdtempSync(path.join(os.tmpdir(), "suik-r5-runner-"));
  t.after(() => rmSync(runner, { recursive: true, force: true }));
  const runnerScript = path.join(runner, "run.mjs");
  writeFileSync(runnerScript, R5_RUNNER_SOURCE);
  const result = spawnSync(process.execPath, [runnerScript], {
    cwd: runner,
    encoding: "utf8",
    timeout: 60_000,
    env: { ...process.env, SUIK_INSTALLED: installed },
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout) as R5ChildResult;
}

test("the emitted planners and TS/Svelte parsers run outside the checkout", (t) => {
  const installed = installedCopy(t);
  const output = runR5Child(t, installed);
  assert.notEqual(output.cwd, PKG_ROOT);
  assert.notEqual(output.root, PKG_ROOT);
  assert.equal(output.planAddType, "function");
  assert.equal(output.planAddOk, true);
  assert.equal(output.planAddExecutable, true);
  assert.ok(output.planAddWrites > 0);
  assert.equal(output.exportRegionOk, true);
  assert.equal(output.regionFound, true);
  assert.equal(output.compound, true);
  assert.equal(output.layoutOk, true);
  assert.equal(output.layoutOrder, true);
  assert.equal(output.envelopeOperation, "retire");
});
