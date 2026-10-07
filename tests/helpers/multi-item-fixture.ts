/**
 * Shared representative multi-item registry fixture for the RCLD-04 lifecycle
 * qualification. Extracted from the accepted `multi-item-lifecycle.test.ts`
 * coverage so the Q2 disposition matrix can drive the same approved
 * default/custom mappings without duplicating the registry definition.
 *
 * The fixture conforms to the already approved manifest/template/component
 * contracts: a component with an explicit registry dependency, a hybrid
 * Svelte + TypeScript file set, multiple CSS blocks in distinct cohorts sharing
 * one aggregate stylesheet, and value/type export cohorts. Nothing here is
 * product code; it is owned test-harness setup.
 */
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { hashBytes } from "../../src/codegen/compare.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
  type KitConfig,
} from "../../src/project/config.js";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import { computeRegistryContentHash } from "../../src/registry/model.js";

const PKG_ROOT = process.cwd();
const FIXTURE = path.join(PKG_ROOT, "tests/fixtures/consumer");

export const MULTI_ITEM_COMPATIBILITY = {
  svelte: "^5.57.1",
  bits: "^2.19.3",
  date: "^3.8.1",
};

/** An independently rooted custom mapping paired with the default one. */
export const CUSTOM_MULTI_ITEM_CONFIG: KitConfig = {
  ...DEFAULT_KIT_CONFIG,
  uiDir: "app/ui",
  stylesDir: "assets/styles",
};

function abs(root: string, rel: string): string {
  return path.join(root, ...rel.split("/"));
}

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function write(root: string, rel: string, data: string | Uint8Array): void {
  const target = abs(root, rel);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, data);
}

export interface ManifestFile {
  readonly source: string;
  readonly target: string;
  readonly kind: "svelte" | "typescript";
  readonly cohort: string;
}

export interface ManifestStyle {
  readonly source: string;
  readonly target: string;
  readonly blockId: string;
  readonly cohort: string;
}

export interface ManifestExport {
  readonly name: string;
  readonly target: string;
  readonly kind: "value" | "type";
}

export interface CompoundItem {
  readonly id: string;
  readonly body: string;
  readonly files: readonly ManifestFile[];
  readonly styles: readonly ManifestStyle[];
  readonly exports: readonly ManifestExport[];
  readonly dependencies: readonly string[];
}

export const BUTTON: CompoundItem = {
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

export const CARD: CompoundItem = {
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

/**
 * Seed an owned consumer copy from the maintained fixture: the application
 * configuration files plus every installed package are copied/linked, and the
 * caller-supplied page is written. The maintained fixture is never mutated.
 */
export function seedMultiItemConsumer(page: string): string {
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

export interface CompoundRegistryOptions {
  readonly cardBody?: string;
  readonly includeCard?: boolean;
  readonly version?: string;
  /** Synthetic independent item versions; omitted items retain registry default. */
  readonly itemVersions?: Readonly<Record<string, string>>;
  /** Synthetic cohort declaration changes without changing schema identities. */
  readonly cohortOverrides?: Readonly<Record<string, string>>;
  /**
   * Override the registry CSS body for one managed block id. Used to build a
   * genuine base/local/incoming three-way conflict where the incoming block
   * bytes differ from both the recorded base and a local edit.
   */
  readonly cssBodyOverrides?: Readonly<Record<string, string>>;
}

/** Materialize the representative compound registry and load its snapshot. */
export function compoundRegistry(
  root: string,
  options: CompoundRegistryOptions = {},
): ReturnType<typeof loadRegistrySnapshot> {
  cpSync(path.join(PKG_ROOT, "schema"), path.join(root, "schema"), {
    recursive: true,
  });
  const includeCard = options.includeCard ?? true;
  const card: CompoundItem = { ...CARD, body: options.cardBody ?? CARD.body };
  const itemsToWrite = includeCard ? [BUTTON, card] : [BUTTON];
  const version = options.version ?? "0.1.0";
  const assets: { path: string; digest: string }[] = [];
  const items: { id: string; manifest: string }[] = [];
  for (const item of itemsToWrite) {
    const manifest = JSON.stringify({
      schemaVersion: 1,
      id: item.id,
      kind: "component",
      version: options.itemVersions?.[item.id] ?? version,
      description: `${item.id} compound fixture item.`,
      compatibility: MULTI_ITEM_COMPATIBILITY,
      files: item.files.map((file) => ({
        ...file,
        cohort: options.cohortOverrides?.[item.id] ?? file.cohort,
      })),
      exports: item.exports,
      styles: item.styles.map((style) => ({
        ...style,
        cohort: options.cohortOverrides?.[item.id] ?? style.cohort,
      })),
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
          : `export interface ${item.exports.find((entry) => entry.target === file.target && entry.kind === "type")?.name ?? `${item.id}Props`} {}\n`;
      write(root, `registry/${file.source}`, body);
      assets.push({
        path: `registry/${file.source}`,
        digest: hashBytes(utf8(body)) as string,
      });
    }
    for (const style of item.styles) {
      const body =
        options.cssBodyOverrides?.[style.blockId] ?? `.${style.blockId} {}\n`;
      write(root, `registry/${style.source}`, body);
      assets.push({
        path: `registry/${style.source}`,
        digest: hashBytes(utf8(body)) as string,
      });
    }
  }
  const basis = {
    schemaVersion: 1,
    registryVersion: version,
    compatibility: MULTI_ITEM_COMPATIBILITY,
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

/** The observed path set the multi-item lifecycle planner reads. */
export function compoundPaths(config: KitConfig): string[] {
  const derived = deriveKitPaths(config);
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
    config.layoutFile,
    ".gitignore",
  ];
}
