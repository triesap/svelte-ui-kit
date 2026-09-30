import assert from "node:assert/strict";
import { test } from "node:test";

import type {
  ItemExport,
  ItemFile,
  ItemStyle,
  RegistryItem,
} from "../../src/registry/item.js";
import type {
  RegistrySnapshot,
  RegistrySnapshotItem,
} from "../../src/registry/load.js";
import { validateResolvedTargets } from "../../src/registry/validate-targets.js";

/**
 * S032 tests: one owner per target/block/export, ASCII case-folded collisions
 * are caught, and unregistered candidates make no public claim.
 */

const COMPATIBILITY = { svelte: "^5.57.1", bits: "^2.19.3", date: "^3.8.1" };

const file = (target: string, source = `templates/${target}`): ItemFile => ({
  source,
  target,
  kind: "svelte",
  cohort: "core",
});

const exported = (name: string, target: string): ItemExport => ({
  name,
  target,
  kind: "value",
});

const block = (blockId: string, target = "src/styles/kit.css"): ItemStyle => ({
  source: `styles/${blockId}.css`,
  target,
  blockId,
  cohort: blockId,
});

function snapshot(
  items: Record<
    string,
    { files?: ItemFile[]; exports?: ItemExport[]; styles?: ItemStyle[] }
  >,
): RegistrySnapshot {
  const entries = Object.entries(items);
  return {
    root: {
      schemaVersion: 1,
      registryVersion: "0.1.0",
      contentHash: "a".repeat(64),
      compatibility: COMPATIBILITY,
      items: entries.map(([id]) => ({ id, manifest: `ui/${id}.json` })),
    },
    items: entries.map(([id, spec]): RegistrySnapshotItem => ({
      id,
      manifestPath: `registry/ui/${id}.json`,
      manifest: {
        schemaVersion: 1,
        id,
        kind: "component",
        version: "0.1.0",
        description: "d",
        compatibility: COMPATIBILITY,
        files: spec.files ?? [],
        exports: spec.exports ?? [],
        styles: spec.styles ?? [],
        registryDependencies: [],
        npmDependencies: [],
        accessibility: {
          requiredNames: [],
          keyboard: [],
          focus: [],
          form: [],
          tests: [],
        },
      } as unknown as RegistryItem,
      files: [],
    })),
    assets: [],
  };
}

function codes(value: RegistrySnapshot, closure: readonly string[]): string[] {
  const result = validateResolvedTargets(value, closure);
  assert.equal(result.ok, false, "expected a collision");
  return result.ok ? [] : result.issues.map((entry) => entry.code);
}

test("valid compound exports resolve to explicit files", () => {
  const graph = snapshot({
    dialog: {
      files: [file("dialog/index.ts"), file("dialog/root.svelte")],
      exports: [exported("DialogRoot", "dialog/index.ts")],
      styles: [block("dialog")],
    },
  });
  const result = validateResolvedTargets(graph, ["dialog"]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    assert.equal(result.value.files.length, 2);
    assert.deepEqual(result.value.exports, [
      { name: "DialogRoot", target: "dialog/index.ts", owner: "dialog" },
    ]);
  }
});

test("two owners of one path, block or export fail", () => {
  assert.equal(
    codes(
      snapshot({
        button: { files: [file("shared.svelte")] },
        card: { files: [file("shared.svelte")] },
      }),
      ["button", "card"],
    ).includes("COLLISION_TARGET"),
    true,
  );
  assert.equal(
    codes(
      snapshot({
        button: { styles: [block("core")] },
        card: { styles: [block("core")] },
      }),
      ["button", "card"],
    ).includes("COLLISION_BLOCK"),
    true,
  );
  assert.equal(
    codes(
      snapshot({
        button: {
          files: [file("button.svelte")],
          exports: [exported("Widget", "button.svelte")],
        },
        card: {
          files: [file("card.svelte")],
          exports: [exported("Widget", "card.svelte")],
        },
      }),
      ["button", "card"],
    ).includes("COLLISION_EXPORT"),
    true,
  );
});

test("ASCII case-folded collisions are detected on a case-sensitive system", () => {
  const target = codes(
    snapshot({
      button: { files: [file("button.svelte")] },
      card: { files: [file("Button.svelte")] },
    }),
    ["button", "card"],
  );
  assert.equal(target.includes("COLLISION_TARGET_CASE"), true);
  assert.equal(target.includes("COLLISION_TARGET"), false);

  const exportCollision = codes(
    snapshot({
      button: {
        files: [file("button.svelte")],
        exports: [exported("Widget", "button.svelte")],
      },
      card: {
        files: [file("card.svelte")],
        exports: [exported("widget", "card.svelte")],
      },
    }),
    ["button", "card"],
  );
  assert.equal(exportCollision.includes("COLLISION_EXPORT_CASE"), true);
});

test("unregistered candidates make no public collision claim", () => {
  const graph = snapshot({
    button: { files: [file("button.svelte")] },
    spinner: { files: [file("button.svelte")] },
  });
  // spinner is only a candidate here (not in the resolved closure).
  const result = validateResolvedTargets(graph, ["button"]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    assert.deepEqual(
      result.value.files.map((entry) => entry.owner),
      ["button"],
    );
  }
});
