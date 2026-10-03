#!/usr/bin/env node
/**
 * RCLD04-R2-5 lifecycle-consumer qualification.
 *
 * Copies the maintained SvelteKit consumer fixture into an owned directory,
 * drives a real default initialization through the production
 * `planInit`/`composeApplyPlan`/`validateApplyPlan`/`applyPlan` core using the
 * built `dist/` modules, then proves the resulting consumer is a real,
 * consumable application: `svelte-check`, a production `vite build` and an
 * actual server-rendered response from the built Node-adapter handler.
 *
 * The copy and every child process are owned by the suite and removed or
 * stopped on success and failure; the maintained fixture is never mutated.
 */
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

import {
  DEFAULT_LAUNCHER,
  fetchRoute,
  startOwnedServer,
} from "./owned-server.mjs";
import { assertServerRendered } from "./ssr-assertions.mjs";

const PACKAGE_ROOT = process.cwd();
const FIXTURE_ROOT = path.join(PACKAGE_ROOT, "tests", "fixtures", "consumer");
const DIST = path.join(PACKAGE_ROOT, "dist");
const CHECK_TIMEOUT_MS = 180_000;
const BUILD_TIMEOUT_MS = 180_000;
const COPY_EXCLUDES = new Set([
  "node_modules",
  ".svelte-kit",
  "build",
  "dist",
  "coverage",
]);

const dist = (rel) => import(pathToFileURL(path.join(DIST, rel)).href);

function linkFixtureNodeModules(fixtureNodeModules, targetNodeModules) {
  mkdirSync(targetNodeModules, { recursive: true });
  for (const entry of readdirSync(fixtureNodeModules)) {
    if (entry === ".bin") continue;
    symlinkSync(
      path.join(fixtureNodeModules, entry),
      path.join(targetNodeModules, entry),
    );
  }
  const binDir = path.join(targetNodeModules, ".bin");
  mkdirSync(binDir, { recursive: true });
  for (const bin of readdirSync(path.join(fixtureNodeModules, ".bin"))) {
    symlinkSync(
      path.join(fixtureNodeModules, ".bin", bin),
      path.join(binDir, bin),
    );
  }
}

function runFixtureScript(root, script, timeout) {
  const execPath = process.env["npm_execpath"];
  const viaNode =
    typeof execPath === "string" &&
    existsSync(execPath) &&
    /\.[cm]?js$/.test(execPath);
  const command = viaNode ? process.execPath : "pnpm";
  const args = viaNode ? [execPath, "run", script] : ["run", script];
  const env = { ...process.env };
  delete env["NODE_OPTIONS"];
  delete env["NODE_V8_COVERAGE"];
  delete env["NODE_TEST_CONTEXT"];
  env["npm_config_verify_deps_before_run"] = "false";
  env["PATH"] =
    `${path.dirname(process.execPath)}${path.delimiter}${env["PATH"] ?? ""}`;
  return spawnSync(command, args, {
    cwd: root,
    env,
    encoding: "utf8",
    timeout,
  });
}

function assertCompleted(result, label) {
  assert.equal(
    result.error,
    undefined,
    `${label}: subprocess reported an error (possible timeout): ${String(result.error)}`,
  );
  assert.notEqual(
    result.status,
    null,
    `${label}: process ended via signal ${String(result.signal)}`,
  );
  return result.status;
}

test("a generated default consumer checks, builds and server-renders", async (t) => {
  const base = mkdtempSync(path.join(os.tmpdir(), "suik-lifecycle-"));
  const root = path.join(base, "consumer");
  let server;
  t.after(async () => {
    if (server) await server.stop();
    rmSync(base, { recursive: true, force: true });
  });
  cpSync(FIXTURE_ROOT, root, {
    recursive: true,
    filter: (entry) => !COPY_EXCLUDES.has(path.basename(entry)),
  });
  linkFixtureNodeModules(
    path.join(FIXTURE_ROOT, "node_modules"),
    path.join(root, "node_modules"),
  );

  const { DEFAULT_KIT_CONFIG, deriveKitPaths } =
    await dist("project/config.js");
  const { captureSnapshot } = await dist("codegen/snapshot.js");
  const { planInit } = await dist("codegen/plan-init.js");
  const { composeApplyPlan } = await dist("codegen/compose.js");
  const { validateApplyPlan, applyPlan } = await dist("codegen/apply.js");
  const { createAssetProvider } = await dist("registry/assets.js");
  const { loadRegistrySnapshot } = await dist("registry/load.js");

  const config = DEFAULT_KIT_CONFIG;
  const derived = deriveKitPaths(config);
  const paths = [
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    derived.rootExports,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    config.layoutFile,
    ".gitignore",
  ];
  const registry = loadRegistrySnapshot(createAssetProvider(PACKAGE_ROOT));
  assert.equal(registry.ok, true, JSON.stringify(registry));
  if (!registry.ok) return;
  const snapshot = captureSnapshot(root, paths);
  assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
  if (!snapshot.ok) return;
  const planned = planInit({
    config,
    layoutFile: config.layoutFile,
    layoutSource: readFileSync(
      path.join(root, ...config.layoutFile.split("/")),
      "utf8",
    ),
    snapshot: snapshot.value,
    registry: registry.value,
    configHash: "b".repeat(64),
  });
  assert.equal(planned.ok, true, JSON.stringify(planned));
  if (!planned.ok) return;
  const composed = composeApplyPlan({
    root,
    config,
    writes: planned.value.writes,
    snapshot: snapshot.value,
  });
  assert.equal(composed.ok, true, JSON.stringify(composed));
  if (!composed.ok) return;
  const validated = validateApplyPlan(composed.value);
  assert.equal(validated.ok, true, JSON.stringify(validated));
  if (!validated.ok) return;
  const outcome = applyPlan(validated.value);
  assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));

  // The generated managed files exist under the configured roots.
  assert.equal(
    existsSync(path.join(root, ...derived.rootExports.split("/"))),
    true,
  );
  assert.equal(existsSync(path.join(root, ...derived.kitCss.split("/"))), true);

  const check = runFixtureScript(root, "check", CHECK_TIMEOUT_MS);
  assertCompleted(check, "svelte-check");
  assert.equal(check.status, 0, `${check.stdout}\n${check.stderr}`);

  const build = runFixtureScript(root, "build", BUILD_TIMEOUT_MS);
  assertCompleted(build, "vite build");
  assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);

  const handler = path.join(root, "build", "handler.js");
  assert.equal(existsSync(handler), true, "missing built handler");
  server = startOwnedServer({
    command: process.execPath,
    args: [DEFAULT_LAUNCHER, handler],
    cwd: root,
  });
  const port = await server.ready;
  const response = await fetchRoute(`http://127.0.0.1:${port}/`);
  assertServerRendered(response, "world");
});
