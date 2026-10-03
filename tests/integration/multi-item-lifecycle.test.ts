import assert from "node:assert/strict";
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
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import { composeApplyPlan } from "../../src/codegen/compose.js";
import { hashBytes } from "../../src/codegen/compare.js";
import { planAdd } from "../../src/codegen/plan-add.js";
import type { PlanWrite } from "../../src/codegen/plan.js";
import type { KitLock } from "../../src/codegen/lock.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import type { ProjectSnapshot } from "../../src/codegen/snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import { computeRegistryContentHash } from "../../src/registry/model.js";
import { snapshotByPath, snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * RCLD04-R2-5: a representative multi-item registry fixture driven through the
 * production planner and guarded apply. The fixture conforms to the already
 * approved manifest/template/component contracts: a component with an explicit
 * registry dependency, a hybrid Svelte + TypeScript file set, multiple CSS
 * blocks in distinct cohorts sharing one aggregate stylesheet, and value/type
 * export cohorts. It supplements, and does not replace, the shipped-foundation
 * lifecycle qualification.
 */

const PKG_ROOT = process.cwd();
const FIXTURE = path.join(PKG_ROOT, "tests/fixtures/consumer");
const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);
const COMPATIBILITY = {
  svelte: "^5.57.1",
  bits: "^2.19.3",
  date: "^3.8.1",
};

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function abs(root: string, rel: string): string {
  return path.join(root, ...rel.split("/"));
}

function write(root: string, rel: string, data: string | Uint8Array): void {
  const target = abs(root, rel);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, data);
}

function seedConsumer(page: string): string {
  const consumer = mkdtempSync(path.join(os.tmpdir(), "suik-multi-app-"));
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
  write(consumer, "src/routes/+page.svelte", page);
  return consumer;
}

interface ManifestFile {
  readonly source: string;
  readonly target: string;
  readonly kind: "svelte" | "typescript";
  readonly cohort: string;
}

interface ManifestStyle {
  readonly source: string;
  readonly target: string;
  readonly blockId: string;
  readonly cohort: string;
}

interface ManifestExport {
  readonly name: string;
  readonly target: string;
  readonly kind: "value" | "type";
}

interface CompoundItem {
  readonly id: string;
  readonly body: string;
  readonly files: readonly ManifestFile[];
  readonly styles: readonly ManifestStyle[];
  readonly exports: readonly ManifestExport[];
  readonly dependencies: readonly string[];
}

const BUTTON: CompoundItem = {
  id: "button",
  body: "<button>button</button>\n",
  files: [
    {
      source: "templates/button.svelte",
      target: "button.svelte",
      kind: "svelte",
      cohort: "core",
    },
  ],
  styles: [
    {
      source: "styles/button.css",
      target: "kit.css",
      blockId: "button",
      cohort: "core",
    },
  ],
  exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
  dependencies: [],
};

const CARD: CompoundItem = {
  id: "card",
  body: '<div class="card"><slot /></div>\n',
  files: [
    {
      source: "templates/card.svelte",
      target: "card.svelte",
      kind: "svelte",
      cohort: "core",
    },
    {
      source: "templates/card.types.ts",
      target: "card.types.ts",
      kind: "typescript",
      cohort: "types",
    },
  ],
  styles: [
    {
      source: "styles/card.css",
      target: "kit.css",
      blockId: "card",
      cohort: "core",
    },
    {
      source: "styles/card-extra.css",
      target: "kit.css",
      blockId: "card-extra",
      cohort: "extra",
    },
  ],
  exports: [
    { name: "Card", target: "card.svelte", kind: "value" },
    { name: "CardProps", target: "card.types.ts", kind: "type" },
  ],
  dependencies: ["button"],
};

function compoundRegistry(
  root: string,
): ReturnType<typeof loadRegistrySnapshot> {
  cpSync(path.join(PKG_ROOT, "schema"), path.join(root, "schema"), {
    recursive: true,
  });
  const assets: { path: string; digest: string }[] = [];
  const items: { id: string; manifest: string }[] = [];
  for (const item of [BUTTON, CARD]) {
    const manifest = JSON.stringify({
      schemaVersion: 1,
      id: item.id,
      kind: "component",
      version: "0.1.0",
      description: `${item.id} compound fixture item.`,
      compatibility: COMPATIBILITY,
      files: item.files,
      exports: item.exports,
      styles: item.styles,
      registryDependencies: item.dependencies,
    });
    write(root, `registry/ui/${item.id}.json`, manifest);
    assets.push({
      path: `registry/ui/${item.id}.json`,
      digest: hashBytes(utf8(manifest)) as string,
    });
    items.push({ id: item.id, manifest: `ui/${item.id}.json` });
    for (const file of item.files) {
      const body =
        file.kind === "svelte"
          ? item.body
          : `export interface ${item.id}Props {}\n`;
      write(root, `registry/${file.source}`, body);
      assets.push({
        path: `registry/${file.source}`,
        digest: hashBytes(utf8(body)) as string,
      });
    }
    for (const style of item.styles) {
      const body = `.${style.blockId} {}\n`;
      write(root, `registry/${style.source}`, body);
      assets.push({
        path: `registry/${style.source}`,
        digest: hashBytes(utf8(body)) as string,
      });
    }
  }
  const basis = {
    schemaVersion: 1,
    registryVersion: "0.1.0",
    compatibility: COMPATIBILITY,
    items,
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

function compoundPaths(): string[] {
  return [
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    derived.rootExports,
    `${derived.rootExportsDir}/button.svelte`,
    `${derived.rootExportsDir}/card.svelte`,
    `${derived.rootExportsDir}/card.types.ts`,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    DEFAULT_KIT_CONFIG.layoutFile,
    ".gitignore",
  ];
}

function applyGuarded(
  root: string,
  snapshot: ProjectSnapshot,
  writes: readonly PlanWrite[],
): ReturnType<typeof applyPlan> {
  const composed = composeApplyPlan({
    root,
    config: DEFAULT_KIT_CONFIG,
    writes,
    snapshot,
  });
  assert.equal(composed.ok, true, JSON.stringify(composed));
  if (!composed.ok) throw new Error("compose failed");
  const validated = validateApplyPlan(composed.value);
  assert.equal(validated.ok, true, JSON.stringify(validated));
  if (!validated.ok) throw new Error("validation failed");
  return applyPlan(validated.value);
}

test("a compound multi-item add generates hybrid files, css blocks and export cohorts", () => {
  const registryRoot = mkdtempSync(path.join(os.tmpdir(), "suik-multi-reg-"));
  const consumer = seedConsumer("<h1>MULTI_ITEM_PAGE</h1>\n");
  try {
    const registry = compoundRegistry(registryRoot);
    assert.equal(registry.ok, true, JSON.stringify(registry));
    if (!registry.ok) return;

    const first = captureSnapshot(consumer, compoundPaths());
    assert.equal(first.ok, true, JSON.stringify(first));
    if (!first.ok) return;
    const unrelatedBefore = snapshotByPath(snapshotTree(consumer));

    const added = planAdd({
      registry: registry.value,
      config: DEFAULT_KIT_CONFIG,
      // Only card is requested; button is pulled as a registry dependency.
      addedRoots: ["card"],
      snapshot: first.value,
      lock: null,
      registryVersion: registry.value.root.registryVersion,
      registryHash: registry.value.root.contentHash,
    });
    assert.equal(added.ok, true, JSON.stringify(added));
    if (!added.ok) return;
    assert.equal(
      added.value.executable,
      true,
      JSON.stringify(added.value.diagnostics),
    );

    const applied = applyGuarded(consumer, first.value, added.value.writes);
    assert.equal(applied.kind, "applied", JSON.stringify(applied.issues));

    // Hybrid file set: both items' Svelte files and the card TypeScript file.
    for (const rel of [
      `${derived.rootExportsDir}/button.svelte`,
      `${derived.rootExportsDir}/card.svelte`,
      `${derived.rootExportsDir}/card.types.ts`,
    ]) {
      assert.equal(existsSync(abs(consumer, rel)), true, rel);
    }
    // Multiple CSS blocks from both items share the aggregate stylesheet.
    const css = readFileSync(abs(consumer, derived.kitCss), "utf8");
    assert.match(css, /\.button\b/);
    assert.match(css, /\.card\b/);
    assert.match(css, /\.card-extra\b/);
    // Value and type exports are aggregated into the root exports region.
    const exports = readFileSync(abs(consumer, derived.rootExports), "utf8");
    assert.match(exports, /Button/);
    assert.match(exports, /Card/);
    assert.match(exports, /CardProps/);

    const lock = JSON.parse(
      readFileSync(abs(consumer, `${derived.stateDir}/kit.lock.json`), "utf8"),
    ) as KitLock;
    assert.deepEqual(lock.requested, ["card"]);
    assert.deepEqual(
      lock.items.map((item) => `${item.id}:${item.origin}`).sort(),
      ["button:transitive", "card:explicit"],
    );
    assert.deepEqual(lock.cssBlocks.map((block) => block.blockId).sort(), [
      "button",
      "card",
      "card-extra",
    ]);
    assert.ok(
      lock.files.some(
        (file) =>
          file.path.endsWith("card.types.ts") && file.cohort === "types",
      ),
      JSON.stringify(lock.files),
    );

    // Unrelated content is preserved byte-for-byte.
    const unrelatedAfter = snapshotByPath(snapshotTree(consumer));
    assert.deepEqual(
      unrelatedAfter.get("src/routes/+page.svelte"),
      unrelatedBefore.get("src/routes/+page.svelte"),
    );
  } finally {
    rmSync(registryRoot, { recursive: true, force: true });
    rmSync(consumer, { recursive: true, force: true });
  }
});
