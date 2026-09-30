import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
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
  for (const dependency of ["ajv", "semver"]) {
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
  assert.deepEqual(output.snapshot, { ok: true, items: 0, codes: [] });
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
