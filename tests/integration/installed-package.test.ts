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
 * Installed-artifact execution (S025–S027).
 *
 * The registry/schema assets must load from the emitted package copy, not from
 * the authoring checkout. This test copies the built `dist/`, `schema/`,
 * `registry/` and manifest into an isolated directory, links only the declared
 * runtime dependencies (`ajv`, `semver`) beside it, then runs a child Node
 * process from a *different* CWD that imports the copied emitted modules. A
 * successful load therefore proves the copy is self-contained: there is no
 * authoring-tree or CWD fallback for schemas or registry assets.
 */
const PKG_ROOT = process.cwd();

function linkRuntimeDependency(installedRoot: string, name: string): void {
  symlinkSync(
    path.join(PKG_ROOT, "node_modules", name),
    path.join(installedRoot, "node_modules", name),
    "dir",
  );
}

test("emitted modules load the registry from an isolated package copy under a different cwd", (t) => {
  const installed = mkdtempSync(path.join(os.tmpdir(), "suik-installed-"));
  const runner = mkdtempSync(path.join(os.tmpdir(), "suik-runner-"));
  t.after(() => {
    rmSync(installed, { recursive: true, force: true });
    rmSync(runner, { recursive: true, force: true });
  });

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

  const runnerScript = path.join(runner, "run.mjs");
  writeFileSync(
    runnerScript,
    [
      'import { pathToFileURL } from "node:url";',
      'import path from "node:path";',
      `const installed = ${JSON.stringify(installed)};`,
      "const assets = await import(",
      '  pathToFileURL(path.join(installed, "dist", "registry", "assets.js")).href,',
      ");",
      "const load = await import(",
      '  pathToFileURL(path.join(installed, "dist", "registry", "load.js")).href,',
      ");",
      "const provider = assets.createInstalledAssetProvider();",
      "const snapshot = load.loadRegistrySnapshot(provider);",
      "process.stdout.write(",
      "  JSON.stringify({",
      "    cwd: process.cwd(),",
      "    root: provider.root,",
      "    ok: snapshot.ok,",
      "    items: snapshot.ok ? snapshot.value.items.length : null,",
      "    issues: snapshot.ok ? [] : snapshot.issues.map((entry) => entry.code),",
      "  }),",
      ");",
      "",
    ].join("\n"),
  );

  const result = spawnSync(process.execPath, [runnerScript], {
    cwd: runner,
    encoding: "utf8",
    timeout: 60_000,
  });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout) as {
    cwd: string;
    root: string;
    ok: boolean;
    items: number | null;
    issues: string[];
  };
  assert.equal(output.ok, true, JSON.stringify(output));
  assert.equal(output.root, installed);
  assert.notEqual(output.root, PKG_ROOT);
  assert.equal(output.cwd, runner);
  assert.equal(output.items, 0);
  assert.deepEqual(output.issues, []);
});
