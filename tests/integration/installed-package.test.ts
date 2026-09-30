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
