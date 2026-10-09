/** Actual core revisions are synthetic owned copies, never shipped history. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { deriveKitPaths, type KitConfig } from "../../src/project/config.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { parseManagedCss } from "../../src/codegen/css-parse.js";
import { snapshotTree } from "./tree-snapshot.js";
import { refreshRegistryContent } from "./registry-content.js";

export function copyCorePackage(source = process.cwd()) {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-core-package-"));
  try {
    for (const file of ["dist", "schema", "registry", "package.json"])
      cpSync(path.join(source, file), path.join(root, file), {
        recursive: true,
      });
    const require = createRequire(
      realpathSync(path.join(source, "package.json")),
    );
    const manifest = JSON.parse(
      readFileSync(path.join(source, "package.json"), "utf8"),
    );
    mkdirSync(path.join(root, "node_modules"));
    for (const name of Object.keys(manifest.dependencies)) {
      const target = path.join(root, "node_modules", name);
      mkdirSync(path.dirname(target), { recursive: true });
      symlinkSync(
        path.dirname(require.resolve(`${name}/package.json`)),
        target,
      );
    }
    return {
      root,
      cleanup: () => rmSync(root, { recursive: true, force: true }),
    };
  } catch (error) {
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
}

export function evolveCore(
  packageRoot: string,
  root: string,
  config: KitConfig,
) {
  const paths = deriveKitPaths(config);
  const logs: {
    args: readonly string[];
    status: number | null;
    stdout: string;
    stderr: string;
  }[] = [];
  const run = (args: readonly string[], expected = 0) => {
    const result = spawnSync(
      process.execPath,
      [
        path.join(packageRoot, "dist/cli/main.js"),
        ...args,
        "--json",
        "--cwd",
        root,
      ],
      { cwd: root, encoding: "utf8", timeout: 30000 },
    );
    logs.push({
      args,
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
    });
    assert.equal(result.status, expected, result.stdout + result.stderr);
    assert.equal(result.stderr, "");
    return JSON.parse(result.stdout);
  };
  const lockPath = path.join(root, paths.stateDir, "kit.lock.json");
  const lock = () => JSON.parse(readFileSync(lockPath, "utf8"));
  const initial = lock();
  assert.deepEqual(initial.requested, [
    "button",
    "dialog",
    "spinner",
    "switch",
    "tokens",
  ]);
  assert.deepEqual(
    initial.items.map((i: { id: string }) => i.id),
    initial.requested,
  );
  for (const file of initial.files)
    assert.equal(
      file.baseHash,
      sha256Hex(readFileSync(path.join(root, file.path))),
      file.path,
    );
  const css = parseManagedCss(
    readFileSync(path.join(root, paths.kitCss), "utf8"),
  );
  assert.equal(css.ok, true);
  if (css.ok)
    assert.deepEqual(
      css.value.blocks.map((b) => b.id),
      ["tokens", "button", "dialog", "spinner", "switch"],
    );
  const initialTree = snapshotTree(root);
  run(["sync", "--dry-run"]);
  run(["sync"]);
  run(["doctor", "--strict"]);
  assert.deepEqual(snapshotTree(root), initialTree);
  const style = path.join(root, paths.kitCss),
    source = path.join(root, config.uiDir, "dialog/close.svelte");
  const localStyle =
    readFileSync(style, "utf8") +
    "\n/* Application-owned core override */\n.core-app { --kit-radius-default: 7px; }\n";
  writeFileSync(style, localStyle);
  const localSource = readFileSync(source, "utf8").replace(
    'class={["kit-dialog-close", className]}',
    'class={["kit-dialog-close", "application-close", className]}',
  );
  assert.notEqual(localSource, readFileSync(source, "utf8"));
  writeFileSync(source, localSource);
  const customized = snapshotTree(root);
  const beforeCustomizedLock = lock();
  run(["sync"]);
  run(["doctor", "--strict"]);
  mkdirSync(".artifacts/verification/core-workflow", { recursive: true });
  writeFileSync(
    `.artifacts/verification/core-workflow/${process.pid}-customized-locks.json`,
    JSON.stringify({ before: beforeCustomizedLock, after: lock() }, null, 2),
  );
  const expectedCustomizedLock = {
    ...beforeCustomizedLock,
    integrations: beforeCustomizedLock.integrations.map(
      (entry: { kind: string; contract: string; baseline: string }) =>
        entry.kind === "stylesheet" && entry.contract === "stylesheet-v1"
          ? {
              ...entry,
              baseline: sha256Hex(new TextEncoder().encode(localStyle)),
            }
          : entry,
    ),
  };
  assert.deepEqual(lock(), expectedCustomizedLock);
  const lockRelative = `${paths.stateDir}/kit.lock.json`;
  assert.deepEqual(
    snapshotTree(root).filter((entry) => entry.path !== lockRelative),
    customized.filter((entry) => entry.path !== lockRelative),
  );
  const settledCustomization = snapshotTree(root);
  run(["sync"]);
  assert.deepEqual(snapshotTree(root), settledCustomization);
  const revised = path.join(packageRoot, "registry/ui/button.svelte");
  writeFileSync(
    revised,
    readFileSync(revised, "utf8") +
      "\n<!-- Synthetic core safe source revision -->\n",
  );
  const manifestPath = path.join(packageRoot, "registry/ui/button.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.version = "0.1.1";
  writeFileSync(manifestPath, JSON.stringify(manifest));
  const registryPath = path.join(packageRoot, "registry/registry.json");
  const registry = JSON.parse(readFileSync(registryPath, "utf8"));
  registry.registryVersion = "0.1.1";
  writeFileSync(registryPath, JSON.stringify(registry));
  refreshRegistryContent(packageRoot);
  const beforeSafe = snapshotTree(root);
  run(["sync", "--dry-run"]);
  assert.deepEqual(snapshotTree(root), beforeSafe);
  run(["sync"]);
  assert.equal(
    readFileSync(path.join(root, config.uiDir, "button.svelte"), "utf8"),
    readFileSync(revised, "utf8"),
  );
  assert.equal(readFileSync(source, "utf8"), localSource);
  assert.ok(
    readFileSync(style, "utf8").includes("Application-owned core override"),
  );
  const safe = lock();
  assert.equal(
    safe.items.find((i: { id: string }) => i.id === "button").version,
    "0.1.1",
  );
  const closeBase = safe.files.find(
    (f: { path: string }) => f.path === `${config.uiDir}/dialog/close.svelte`,
  );
  assert.equal(
    closeBase.baseHash,
    initial.files.find((f: { path: string }) => f.path === closeBase.path)
      .baseHash,
  );
  const afterSafe = snapshotTree(root);
  run(["sync"]);
  assert.deepEqual(snapshotTree(root), afterSafe);
  const incomingClose = path.join(
    packageRoot,
    "registry/ui/dialog/close.svelte",
  );
  writeFileSync(
    incomingClose,
    readFileSync(incomingClose, "utf8").replace(
      'type = "button"',
      'type = "reset"',
    ),
  );
  const dialogPath = path.join(packageRoot, "registry/ui/dialog.json");
  const dialog = JSON.parse(readFileSync(dialogPath, "utf8"));
  dialog.version = "0.1.1";
  writeFileSync(dialogPath, JSON.stringify(dialog));
  refreshRegistryContent(packageRoot);
  const conflictTree = snapshotTree(root);
  const refused = run(["sync", "--dry-run"], 10);
  run(["sync"], 10);
  assert.deepEqual(snapshotTree(root), conflictTree);
  assert.deepEqual(lock(), safe);
  assert.ok(
    refused.diagnostics.some(
      (d: { code: string; message: string }) =>
        d.code === "PLAN_DIAGNOSTIC" && /cohort|conflict/i.test(d.message),
    ),
  );
  mkdirSync(".artifacts/verification/core-workflow", { recursive: true });
  writeFileSync(
    `.artifacts/verification/core-workflow/${config.uiDir.includes("app/") ? "custom" : "default"}-${process.pid}-${Date.now()}.json`,
    JSON.stringify(
      { synthetic: true, initial, safe, logs, conflictTree },
      null,
      2,
    ),
  );
}
