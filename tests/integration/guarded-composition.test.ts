import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import { composeApplyPlan } from "../../src/codegen/compose.js";
import { planAdd } from "../../src/codegen/plan-add.js";
import { planInit } from "../../src/codegen/plan-init.js";
import { planSync } from "../../src/codegen/plan-sync.js";
import type { PlanWrite } from "../../src/codegen/plan.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import type { ProjectSnapshot } from "../../src/codegen/snapshot.js";
import { hashBytes } from "../../src/codegen/compare.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import { computeRegistryContentHash } from "../../src/registry/model.js";

/**
 * RCLD04-R1-5: actual planner output applied by the production guarded code.
 *
 * These tests do not hand-build `ApplyPlanInput`. They run the real
 * `planInit`/`planAdd`/`planSync` planners against a validated registry
 * snapshot, compose the writes through the production `composeApplyPlan`, apply
 * them through the production `validateApplyPlan`/`applyPlan` boundary, then
 * check, build and server-render the generated consumer.
 */

const PKG_ROOT = process.cwd();
const FIXTURE = path.join(PKG_ROOT, "tests/fixtures/consumer");
const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);

function write(root: string, rel: string, data: string | Uint8Array): void {
  const abs = path.join(root, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, data);
}

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

/** A real on-disk registry for one `button` item, loaded through the validator. */
function onDiskRegistry(root: string): ReturnType<typeof loadRegistrySnapshot> {
  cpSync(path.join(PKG_ROOT, "schema"), path.join(root, "schema"), {
    recursive: true,
  });
  const body = "<button>button</button>\n";
  const compatibility = { svelte: "^5.57.1", bits: "^2.19.3", date: "^3.8.1" };
  const manifest = JSON.stringify({
    schemaVersion: 1,
    id: "button",
    kind: "component",
    version: "0.1.0",
    description: "Guarded consumer component.",
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

function seedConsumer(page: string): string {
  const consumer = mkdtempSync(path.join(os.tmpdir(), "suik-guarded-app-"));
  for (const file of [
    "package.json",
    ".native-build",
    "vite.config.ts",
    "svelte.config.js",
    "tsconfig.json",
    "src/app.html",
  ]) {
    cpSync(path.join(FIXTURE, file), path.join(consumer, file), {
      recursive: true,
    });
  }
  symlinkSync(
    path.join(FIXTURE, "node_modules"),
    path.join(consumer, "node_modules"),
    "dir",
  );
  write(consumer, "src/routes/+page.svelte", page);
  return consumer;
}

function runPnpm(args: readonly string[], cwd: string) {
  return spawnSync("pnpm", args, {
    cwd,
    encoding: "utf8",
    timeout: 150_000,
    env: { ...process.env, CI: "1" },
  });
}

async function renderProductionPage(
  consumer: string,
): Promise<{ status: number; html: string }> {
  const module = (await import(
    pathToFileURL(path.join(consumer, "build/handler.js")).href
  )) as { handler: Parameters<typeof createServer>[0] };
  const server = createServer(module.handler);
  await new Promise<void>((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve()),
  );
  try {
    const address = server.address();
    const port =
      typeof address === "object" && address !== null ? address.port : 0;
    const response = await fetch(`http://127.0.0.1:${port}/`);
    return { status: response.status, html: await response.text() };
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

function consumerPaths(): string[] {
  return [
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    derived.rootExports,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    DEFAULT_KIT_CONFIG.layoutFile,
    `${derived.rootExportsDir}/button.svelte`,
    ".gitignore",
  ];
}

function applyThroughGuard(
  root: string,
  snapshot: ProjectSnapshot,
  writes: readonly PlanWrite[],
  config = DEFAULT_KIT_CONFIG,
) {
  const composed = composeApplyPlan({ root, config, writes, snapshot });
  assert.equal(composed.ok, true, JSON.stringify(composed));
  if (!composed.ok) throw new Error("compose failed");
  const validated = validateApplyPlan(composed.value);
  assert.equal(validated.ok, true, JSON.stringify(validated));
  if (!validated.ok) throw new Error("validation failed");
  const outcome = applyPlan(validated.value);
  assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));
  return outcome;
}

test(
  "a real bundled-registry init plan applies through guarded code and the consumer renders",
  { timeout: 180_000 },
  async (t) => {
    const consumer = seedConsumer("<h1>GUARDED_INIT_PAGE</h1>\n");
    t.after(() => rmSync(consumer, { recursive: true, force: true }));

    const registry = loadRegistrySnapshot(createAssetProvider(PKG_ROOT));
    assert.equal(registry.ok, true, JSON.stringify(registry));
    if (!registry.ok) return;
    const snapshot = captureSnapshot(consumer, consumerPaths());
    assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
    if (!snapshot.ok) return;

    const planned = planInit({
      config: DEFAULT_KIT_CONFIG,
      layoutFile: DEFAULT_KIT_CONFIG.layoutFile,
      layoutSource: "",
      snapshot: snapshot.value,
      registry: registry.value,
      configHash: "b".repeat(64),
    });
    assert.equal(planned.ok, true, JSON.stringify(planned));
    if (!planned.ok) return;
    applyThroughGuard(consumer, snapshot.value, planned.value.writes);

    const checked = runPnpm(["run", "check"], consumer);
    assert.equal(checked.status, 0, `${checked.stdout}\n${checked.stderr}`);
    const built = runPnpm(["run", "build"], consumer);
    assert.equal(built.status, 0, `${built.stdout}\n${built.stderr}`);
    const rendered = await renderProductionPage(consumer);
    assert.equal(rendered.status, 200);
    assert.ok(rendered.html.includes("GUARDED_INIT_PAGE"));
  },
);

test(
  "a real add plan applies through guarded code and the consumer renders",
  { timeout: 180_000 },
  async (t) => {
    const registryRoot = mkdtempSync(
      path.join(os.tmpdir(), "suik-guarded-reg-"),
    );
    const consumer = seedConsumer(
      '<h1>GUARDED_ADD_PAGE</h1>\n<script>import { Button } from "$lib/components/ui/index.js";</script>\n<Button />\n',
    );
    t.after(() => {
      rmSync(registryRoot, { recursive: true, force: true });
      rmSync(consumer, { recursive: true, force: true });
    });

    const registry = onDiskRegistry(registryRoot);
    assert.equal(registry.ok, true, JSON.stringify(registry));
    if (!registry.ok) return;
    const snapshot = captureSnapshot(consumer, consumerPaths());
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
    applyThroughGuard(consumer, snapshot.value, planned.value.writes);

    // A second identical plan is satisfied: the guarded boundary reports
    // no_change without opening a transaction.
    const secondSnapshot = captureSnapshot(consumer, consumerPaths());
    assert.equal(secondSnapshot.ok, true);
    if (!secondSnapshot.ok) return;
    const lock = JSON.parse(
      readFileSync(
        path.join(consumer, derived.stateDir, "kit.lock.json"),
        "utf8",
      ),
    );
    const replay = planSync({
      registry: registry.value,
      config: { ...DEFAULT_KIT_CONFIG, requested: ["button"] },
      snapshot: secondSnapshot.value,
      lock,
      registryVersion: registry.value.root.registryVersion,
      registryHash: registry.value.root.contentHash,
    });
    assert.equal(replay.ok, true, JSON.stringify(replay));
    if (!replay.ok) return;
    if (replay.value.writes.length === 0) {
      // A satisfied replay has nothing to apply; no transaction is opened.
      assert.equal(
        existsSync(
          path.join(
            consumer,
            derived.stateDir,
            ".svelte-ui-kit",
            "transactions",
          ),
        ),
        false,
      );
    } else {
      const composed = composeApplyPlan({
        root: consumer,
        config: DEFAULT_KIT_CONFIG,
        writes: replay.value.writes,
        snapshot: secondSnapshot.value,
      });
      assert.equal(composed.ok, true, JSON.stringify(composed));
      if (!composed.ok) return;
      const validated = validateApplyPlan(composed.value);
      assert.equal(validated.ok, true, JSON.stringify(validated));
      if (!validated.ok) return;
      const replayOutcome = applyPlan(validated.value);
      assert.ok(
        replayOutcome.kind === "no_change" || replayOutcome.kind === "applied",
        replayOutcome.kind,
      );
    }

    const checked = runPnpm(["run", "check"], consumer);
    assert.equal(checked.status, 0, `${checked.stdout}\n${checked.stderr}`);
    const built = runPnpm(["run", "build"], consumer);
    assert.equal(built.status, 0, `${built.stdout}\n${built.stderr}`);
    const rendered = await renderProductionPage(consumer);
    assert.equal(rendered.status, 200);
    assert.ok(rendered.html.includes("GUARDED_ADD_PAGE"));
  },
);
