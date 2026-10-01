import { hashBytes } from "../../src/codegen/compare.js";
import type {
  RegistrySnapshot,
  RegistrySnapshotFile,
  RegistrySnapshotItem,
} from "../../src/registry/load.js";
import type { RegistryItem } from "../../src/registry/item.js";

/**
 * Small in-memory registry snapshot builder for planner tests. It constructs
 * the same read-only shape `loadRegistrySnapshot` returns, so a planner test
 * does not need a filesystem registry fixture.
 */

export const COMPATIBILITY = {
  svelte: "^5.57.1",
  bits: "^2.19.3",
  date: "^3.8.1",
};

export function sourceFile(
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

export function styleFile(
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

export function componentItem(
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
    files: (options.files ?? []).map((file) => ({
      source: file.logicalSource,
      target: file.target,
      kind: file.target.endsWith(".svelte")
        ? ("svelte" as const)
        : ("typescript" as const),
      cohort: file.cohort,
    })),
    exports: options.exports ?? [],
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
  return { id, manifestPath: `registry/ui/${id}.json`, manifest, files };
}

export function registryOf(
  items: readonly RegistrySnapshotItem[],
): RegistrySnapshot {
  return {
    root: {
      schemaVersion: 1,
      registryVersion: "0.1.0",
      contentHash: "f".repeat(64),
      compatibility: COMPATIBILITY,
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
