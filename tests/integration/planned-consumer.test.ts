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

import { planAdd } from "../../src/codegen/plan-add.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import { hashBytes } from "../../src/codegen/compare.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import { computeRegistryContentHash } from "../../src/registry/model.js";

/**
 * RCLD03-R4-4: a consumer produced by applying exactly the planned add
 * operations must check/build, using a real validated registry snapshot and the
 * production planner. Missing stylesheet prerequisites are never repaired by
 * the test; the plan itself must create them.
 */

const PKG_ROOT = process.cwd();
const FIXTURE = path.join(PKG_ROOT, "tests/fixtures/consumer");
const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);

function write(root: string, rel: string, data: string | Uint8Array): void {
  const abs = path.join(root, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, data);
}

function realRegistry(root: string): ReturnType<typeof loadRegistrySnapshot> {
  cpSync(path.join(PKG_ROOT, "schema"), path.join(root, "schema"), {
    recursive: true,
  });
  const body = "<button>button</button>\n";
  const compatibility = {
    svelte: "^5.57.1",
    bits: "^2.19.3",
    date: "^3.8.1",
  };
  const manifest = JSON.stringify({
    schemaVersion: 1,
    id: "button",
    kind: "component",
    version: "0.1.0",
    description: "Planned consumer component.",
    compatibility,
    files: [
      {
        source: "templates/button.svelte",
        target: "button.svelte",
        kind: "svelte",
        cohort: "core",
      },
    ],
    exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
    styles: [],
  });
  write(root, "registry/ui/button.json", manifest);
  write(root, "registry/templates/button.svelte", body);
  const assets = [
    {
      path: "registry/ui/button.json",
      digest: hashBytes(utf8(manifest)) as string,
    },
    {
      path: "registry/templates/button.svelte",
      digest: hashBytes(utf8(body)) as string,
    },
  ];
  const basis = {
    schemaVersion: 1,
    registryVersion: "0.1.0",
    compatibility,
    items: [{ id: "button", manifest: "ui/button.json" }],
  };
  write(
    root,
    "registry/registry.json",
    JSON.stringify({
      ...basis,
      contentHash: computeRegistryContentHash(basis, assets),
    }),
  );
  return loadRegistrySnapshot(createAssetProvider(root));
}

function realCompoundRegistry(
  root: string,
): ReturnType<typeof loadRegistrySnapshot> {
  cpSync(path.join(PKG_ROOT, "schema"), path.join(root, "schema"), {
    recursive: true,
  });
  const compatibility = {
    svelte: "^5.57.1",
    bits: "^2.19.3",
    date: "^3.8.1",
  };
  const files = [
    {
      source: "templates/dialog/index.ts",
      target: "dialog/index.ts",
      kind: "typescript",
      cohort: "dialog",
    },
    {
      source: "templates/dialog/root.svelte",
      target: "dialog/root.svelte",
      kind: "svelte",
      cohort: "dialog",
    },
    {
      source: "templates/dialog/trigger.svelte",
      target: "dialog/trigger.svelte",
      kind: "svelte",
      cohort: "dialog",
    },
  ];
  const manifest = JSON.stringify({
    schemaVersion: 1,
    id: "dialog",
    kind: "component",
    version: "0.1.0",
    description: "Planned compound consumer component.",
    compatibility,
    files,
    exports: [
      { name: "DialogRoot", target: "dialog/index.ts", kind: "value" },
      { name: "DialogTrigger", target: "dialog/index.ts", kind: "value" },
    ],
    styles: [],
  });
  const bodies: Record<string, string> = {
    "templates/dialog/index.ts":
      'export { default as DialogRoot } from "./root.svelte";\n' +
      'export { default as DialogTrigger } from "./trigger.svelte";\n',
    "templates/dialog/root.svelte": "<div><slot /></div>\n",
    "templates/dialog/trigger.svelte": "<button>open</button>\n",
  };
  write(root, "registry/ui/dialog.json", manifest);
  const assets = [
    {
      path: "registry/ui/dialog.json",
      digest: hashBytes(utf8(manifest)) as string,
    },
  ];
  for (const [source, body] of Object.entries(bodies)) {
    write(root, `registry/${source}`, body);
    assets.push({
      path: `registry/${source}`,
      digest: hashBytes(utf8(body)) as string,
    });
  }
  const basis = {
    schemaVersion: 1,
    registryVersion: "0.1.0",
    compatibility,
    items: [{ id: "dialog", manifest: "ui/dialog.json" }],
  };
  write(
    root,
    "registry/registry.json",
    JSON.stringify({
      ...basis,
      contentHash: computeRegistryContentHash(basis, assets),
    }),
  );
  return loadRegistrySnapshot(createAssetProvider(root));
}

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function applyWrites(
  root: string,
  writes: readonly { path: string; bytes: Uint8Array; operation?: string }[],
): void {
  for (const writeOp of writes) {
    const abs = path.join(root, writeOp.path);
    if (writeOp.operation === "retire") {
      rmSync(abs, { force: true });
      continue;
    }
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, writeOp.bytes);
  }
}

function runPnpm(args: readonly string[], cwd: string) {
  return spawnSync("pnpm", args, {
    cwd,
    encoding: "utf8",
    timeout: 150_000,
    env: { ...process.env, CI: "1" },
  });
}

test(
  "a consumer built from exactly the planned add operations check/build passes",
  { timeout: 180_000 },
  (t) => {
    const registryRoot = mkdtempSync(path.join(os.tmpdir(), "suik-pr-reg-"));
    const consumer = mkdtempSync(path.join(os.tmpdir(), "suik-pr-app-"));
    t.after(() => {
      rmSync(registryRoot, { recursive: true, force: true });
      rmSync(consumer, { recursive: true, force: true });
    });
    for (const file of [
      "package.json",
      "vite.config.ts",
      "svelte.config.js",
      "tsconfig.json",
      "src/app.html",
    ]) {
      cpSync(path.join(FIXTURE, file), path.join(consumer, file));
    }
    symlinkSync(
      path.join(FIXTURE, "node_modules"),
      path.join(consumer, "node_modules"),
      "dir",
    );
    write(
      consumer,
      "src/routes/+page.svelte",
      '<script>import { Button } from "$lib/components/ui/index.js";</script>\n<Button />\n',
    );

    const registry = realRegistry(registryRoot);
    assert.equal(registry.ok, true, JSON.stringify(registry));
    if (!registry.ok) return;

    const snapshot = captureSnapshot(consumer, [
      `${derived.stateDir}/kit.json`,
      `${derived.stateDir}/kit.lock.json`,
      derived.rootExports,
      derived.kitCss,
      derived.themesCss,
      derived.appCss,
      DEFAULT_KIT_CONFIG.layoutFile,
      `${derived.rootExportsDir}/button.svelte`,
    ]);
    assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
    if (!snapshot.ok) return;

    const planned = planAdd({
      registry: registry.value,
      config: DEFAULT_KIT_CONFIG,
      addedRoots: ["button"],
      snapshot: snapshot.value,
      lock: null,
      registryVersion: registry.value.root.registryVersion,
      registryHash: registry.value.root.contentHash,
    });
    assert.equal(planned.ok, true, JSON.stringify(planned));
    if (!planned.ok) return;
    assert.equal(
      planned.value.executable,
      true,
      JSON.stringify(planned.value.diagnostics),
    );
    applyWrites(consumer, planned.value.writes);

    const checked = runPnpm(["run", "check"], consumer);
    assert.equal(checked.status, 0, `${checked.stdout}\n${checked.stderr}`);
    const built = runPnpm(["run", "build"], consumer);
    assert.equal(built.status, 0, `${built.stdout}\n${built.stderr}`);
  },
);

test(
  "a compound consumer built from exactly the planned add operations builds",
  { timeout: 180_000 },
  (t) => {
    const registryRoot = mkdtempSync(path.join(os.tmpdir(), "suik-pr-creg-"));
    const consumer = mkdtempSync(path.join(os.tmpdir(), "suik-pr-capp-"));
    t.after(() => {
      rmSync(registryRoot, { recursive: true, force: true });
      rmSync(consumer, { recursive: true, force: true });
    });
    for (const file of [
      "package.json",
      "vite.config.ts",
      "svelte.config.js",
      "tsconfig.json",
      "src/app.html",
    ]) {
      cpSync(path.join(FIXTURE, file), path.join(consumer, file));
    }
    symlinkSync(
      path.join(FIXTURE, "node_modules"),
      path.join(consumer, "node_modules"),
      "dir",
    );
    write(
      consumer,
      "src/routes/+page.svelte",
      '<script>import { DialogRoot } from "$lib/components/ui/index.js";</script>\n<DialogRoot />\n',
    );

    const registry = realCompoundRegistry(registryRoot);
    assert.equal(registry.ok, true, JSON.stringify(registry));
    if (!registry.ok) return;

    const snapshot = captureSnapshot(consumer, [
      `${derived.stateDir}/kit.json`,
      `${derived.stateDir}/kit.lock.json`,
      derived.rootExports,
      derived.kitCss,
      derived.themesCss,
      derived.appCss,
      DEFAULT_KIT_CONFIG.layoutFile,
      `${derived.rootExportsDir}/dialog/index.ts`,
      `${derived.rootExportsDir}/dialog/root.svelte`,
      `${derived.rootExportsDir}/dialog/trigger.svelte`,
    ]);
    assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
    if (!snapshot.ok) return;

    const planned = planAdd({
      registry: registry.value,
      config: DEFAULT_KIT_CONFIG,
      addedRoots: ["dialog"],
      snapshot: snapshot.value,
      lock: null,
      registryVersion: registry.value.root.registryVersion,
      registryHash: registry.value.root.contentHash,
    });
    assert.equal(planned.ok, true, JSON.stringify(planned));
    if (!planned.ok) return;
    assert.equal(
      planned.value.executable,
      true,
      JSON.stringify(planned.value.diagnostics),
    );
    const written = new Set(planned.value.writes.map((entry) => entry.path));
    assert.ok(written.has(`${derived.rootExportsDir}/dialog/index.ts`));
    assert.ok(written.has(`${derived.rootExportsDir}/dialog/root.svelte`));
    assert.ok(written.has(`${derived.rootExportsDir}/dialog/trigger.svelte`));
    const exportWrite = planned.value.writes.find(
      (entry) => entry.path === derived.rootExports,
    );
    assert.ok(exportWrite);
    assert.match(
      new TextDecoder().decode(exportWrite.bytes),
      /export \{ DialogRoot \} from "\.\/dialog\/index\.js";/,
    );
    applyWrites(consumer, planned.value.writes);

    const checked = runPnpm(["run", "check"], consumer);
    assert.equal(checked.status, 0, `${checked.stdout}\n${checked.stderr}`);
    const built = runPnpm(["run", "build"], consumer);
    assert.equal(built.status, 0, `${built.stdout}\n${built.stderr}`);
  },
);

test(
  "the planned-consumer check lane rejects an injected type error",
  { timeout: 180_000 },
  (t) => {
    const registryRoot = mkdtempSync(path.join(os.tmpdir(), "suik-pr-negreg-"));
    const consumer = mkdtempSync(path.join(os.tmpdir(), "suik-pr-negapp-"));
    t.after(() => {
      rmSync(registryRoot, { recursive: true, force: true });
      rmSync(consumer, { recursive: true, force: true });
    });
    for (const file of [
      "package.json",
      "vite.config.ts",
      "svelte.config.js",
      "tsconfig.json",
      "src/app.html",
    ]) {
      cpSync(path.join(FIXTURE, file), path.join(consumer, file));
    }
    symlinkSync(
      path.join(FIXTURE, "node_modules"),
      path.join(consumer, "node_modules"),
      "dir",
    );
    write(
      consumer,
      "src/routes/+page.svelte",
      '<script lang="ts">import { Button } from "$lib/components/ui/index.js";\nconst broken: number = "not a number";\n</script>\n<Button />\n',
    );
    const registry = realRegistry(registryRoot);
    assert.equal(registry.ok, true, JSON.stringify(registry));
    if (!registry.ok) return;
    const snapshot = captureSnapshot(consumer, [
      `${derived.stateDir}/kit.json`,
      `${derived.stateDir}/kit.lock.json`,
      derived.rootExports,
      derived.kitCss,
      derived.themesCss,
      derived.appCss,
      DEFAULT_KIT_CONFIG.layoutFile,
      `${derived.rootExportsDir}/button.svelte`,
    ]);
    assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
    if (!snapshot.ok) return;
    const planned = planAdd({
      registry: registry.value,
      config: DEFAULT_KIT_CONFIG,
      addedRoots: ["button"],
      snapshot: snapshot.value,
      lock: null,
      registryVersion: registry.value.root.registryVersion,
      registryHash: registry.value.root.contentHash,
    });
    assert.equal(planned.ok, true, JSON.stringify(planned));
    if (!planned.ok) return;
    applyWrites(consumer, planned.value.writes);
    const checked = runPnpm(["run", "check"], consumer);
    assert.notEqual(
      checked.status,
      0,
      `the check lane must fail on a real type error:\n${checked.stdout}\n${checked.stderr}`,
    );
  },
);
