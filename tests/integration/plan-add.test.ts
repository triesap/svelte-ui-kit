import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { hashBytes } from "../../src/codegen/compare.js";
import { planAdd } from "../../src/codegen/plan-add.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import type { KitLock, LockFileRecord } from "../../src/codegen/lock.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import type {
  RegistrySnapshot,
  RegistrySnapshotFile,
  RegistrySnapshotItem,
} from "../../src/registry/load.js";
import type { RegistryItem } from "../../src/registry/item.js";
import { createTempProject } from "../helpers/project.js";

/**
 * S058 tests: a pure add-request plan resolves the explicit root and its
 * registry closure, plans source/CSS/export changes, and refuses an executable
 * batch (including the config change) when a genuine conflict exists.
 */

const COMPATIBILITY = { svelte: "^5.57.1", bits: "^2.19.3", date: "^3.8.1" };

function sourceFile(
  fileTarget: string,
  body: string,
  owner: string,
  cohort = "core",
): RegistrySnapshotFile {
  const bytes = new TextEncoder().encode(body);
  return {
    logicalSource: `registry/templates/${fileTarget}`,
    target: fileTarget,
    owner,
    cohort,
    blockId: null,
    bytes,
    digest: hashBytes(bytes) as string,
  };
}

function styleFile(
  fileTarget: string,
  body: string,
  owner: string,
  blockId: string,
  cohort = "core",
): RegistrySnapshotFile {
  const bytes = new TextEncoder().encode(body);
  return {
    logicalSource: `registry/styles/${owner}-${blockId}.css`,
    target: fileTarget,
    owner,
    cohort,
    blockId,
    bytes,
    digest: hashBytes(bytes) as string,
  };
}

function componentItem(
  id: string,
  options: {
    files?: readonly RegistrySnapshotFile[];
    dependencies?: readonly string[];
    npm?: RegistryItem["npmDependencies"];
    exports?: RegistryItem["exports"];
    styles?: RegistryItem["styles"];
  } = {},
): RegistrySnapshotItem {
  const baseFiles = options.files ?? [
    sourceFile(`${id}.svelte`, `<button>${id}</button>\n`, id),
  ];
  const styleFiles = (options.styles ?? []).map((style) =>
    styleFile(
      style.target,
      `.${style.blockId} {}\n`,
      id,
      style.blockId,
      style.cohort,
    ),
  );
  const files = [...baseFiles, ...styleFiles];
  const manifest: RegistryItem = {
    schemaVersion: 1,
    id,
    kind: options.styles !== undefined ? "foundation" : "component",
    version: "0.1.0",
    description: `${id} sample.`,
    compatibility: COMPATIBILITY,
    files: options.files?.map((file) => ({
      source: file.logicalSource,
      target: file.target,
      kind: file.target.endsWith(".svelte") ? "svelte" : "typescript",
      cohort: file.cohort,
    })) ?? [
      {
        source: `registry/templates/${id}.svelte`,
        target: `${id}.svelte`,
        kind: "svelte",
        cohort: "core",
      },
    ],
    exports:
      options.exports ??
      (files.some((file) => file.target.endsWith(".svelte"))
        ? [
            {
              name: id.charAt(0).toUpperCase() + id.slice(1),
              target: `${id}.svelte`,
              kind: "value",
            },
          ]
        : []),
    styles: options.styles ?? [],
    registryDependencies: options.dependencies ?? [],
    npmDependencies: options.npm ?? [],
    accessibility: {
      requiredNames: [],
      keyboard: [],
      focus: [],
      form: [],
      tests: [],
    },
  };
  return {
    id,
    manifestPath: `registry/ui/${id}.json`,
    manifest,
    files: files,
  };
}

function registryOf(items: readonly RegistrySnapshotItem[]): RegistrySnapshot {
  return {
    root: {
      schemaVersion: 1,
      registryVersion: "0.1.0",
      contentHash: "f".repeat(64),
      compatibility: {
        svelte: "^5.57.1",
        bits: "^2.19.3",
        date: "^3.8.1",
      },
      items: items.map((item) => ({
        id: item.id,
        manifest: item.manifestPath,
      })),
    },
    items,
    assets: items.map((item) => ({
      path: item.manifestPath,
      digest: hashBytes(new TextEncoder().encode(item.id)) as string,
    })),
  };
}

const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);

function snapshotPaths(): string[] {
  return [
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    derived.rootExports,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    DEFAULT_KIT_CONFIG.layoutFile,
    `${derived.rootExportsDir}/button.svelte`,
    `${derived.rootExportsDir}/spinner.svelte`,
    `${derived.rootExportsDir}/card.svelte`,
  ];
}

function snapshotOf(project: ReturnType<typeof createTempProject>) {
  const result = captureSnapshot(project.root, snapshotPaths());
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("snapshot failed");
  return result.value;
}

function baseInput(registry: RegistrySnapshot, lock: KitLock | null) {
  return {
    registry,
    config: DEFAULT_KIT_CONFIG,
    lock,
    registryVersion: "0.1.0",
    registryHash: "a".repeat(64),
  };
}

test("a sample button adds spinner and tokens transitively only", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const registry = registryOf([
    componentItem("button", { dependencies: ["spinner", "tokens"] }),
    componentItem("spinner"),
    componentItem("tokens", {
      styles: [
        {
          source: "registry/styles/tokens.css",
          target: "kit.css",
          blockId: "tokens",
          cohort: "core",
        },
      ],
    }),
    componentItem("card"),
  ]);
  const input = {
    ...baseInput(registry, null),
    snapshot: snapshotOf(project),
    addedRoots: ["button"],
  };
  const result = planAdd(input);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.deepEqual(result.value.projection.requested, ["button"]);
  assert.deepEqual(
    [...result.value.projection.items.map((item) => item.id)].sort(),
    ["button", "spinner", "tokens"],
  );
  assert.ok(!result.value.projection.items.some((item) => item.id === "card"));
});

test("a repeated add creates no duplicate request, block or export", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const registry = registryOf([
    componentItem("button", { dependencies: ["spinner", "tokens"] }),
    componentItem("spinner"),
    componentItem("tokens", {
      styles: [
        {
          source: "registry/styles/tokens.css",
          target: "kit.css",
          blockId: "tokens",
          cohort: "core",
        },
      ],
    }),
  ]);
  const first = planAdd({
    ...baseInput(registry, null),
    snapshot: snapshotOf(project),
    addedRoots: ["button"],
  });
  assert.equal(first.ok, true, JSON.stringify(first));
  if (!first.ok) return;
  for (const write of first.value.writes) {
    const abs = path.join(project.root, write.path);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, write.bytes);
  }
  const second = planAdd({
    ...baseInput(registry, first.value.lock),
    snapshot: snapshotOf(project),
    addedRoots: ["button"],
  });
  assert.equal(second.ok, true, JSON.stringify(second));
  if (!second.ok) return;
  assert.deepEqual(second.value.projection.requested, ["button"]);
  const blockIds =
    second.value.lock?.cssBlocks.map((block) => block.blockId) ?? [];
  assert.deepEqual([...new Set(blockIds)].sort(), [...blockIds].sort());
  assert.deepEqual(second.value.writes, []);
});

test("a source conflict prevents the executable config-only change", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const sourceTarget = `${derived.rootExportsDir}/button.svelte`;
  project.writeFile(sourceTarget, "// locally customized\n");
  const registry = registryOf([
    componentItem("button", {
      files: [
        sourceFile("button.svelte", "// incoming upstream change\n", "button"),
      ],
    }),
  ]);
  const lock: KitLock = {
    schemaVersion: 1,
    toolVersion: "1.0.0",
    registryVersion: "0.1.0",
    registryHash: "a".repeat(64),
    configHash: "b".repeat(64),
    requested: ["button"],
    items: [
      {
        id: "button",
        version: "0.1.0",
        digest: "c".repeat(64),
        origin: "explicit",
      },
    ],
    files: [
      {
        path: sourceTarget,
        owner: "button",
        baseHash: hashBytes(
          new TextEncoder().encode("// base upstream\n"),
        ) as string,
        itemVersion: "0.1.0",
        cohort: "core",
      } satisfies LockFileRecord,
    ],
    cssBlocks: [],
    integrations: [],
  };
  const result = planAdd({
    ...baseInput(registry, lock),
    snapshot: snapshotOf(project),
    addedRoots: ["button"],
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.deepEqual(result.value.writes, []);
  assert.ok(
    result.value.diagnostics.some((entry) => entry.includes("source conflict")),
    JSON.stringify(result.value.diagnostics),
  );
});
