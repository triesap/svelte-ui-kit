import assert from "node:assert/strict";
import { test } from "node:test";

import type {
  RegistrySnapshot,
  RegistrySnapshotItem,
} from "../../src/registry/load.js";
import type {
  ItemExport,
  ItemStyle,
  RegistryItem,
} from "../../src/registry/item.js";
import {
  orderCssBlocks,
  orderDependencies,
  orderExports,
  orderedUnique,
  stableProjection,
  TOKEN_BLOCK_ID,
} from "../../src/registry/order.js";
import { resolveClosure } from "../../src/registry/resolve.js";

/**
 * S029 tests: closure/export/block order is deterministic and byte-stable
 * regardless of input ordering.
 */

function snapshot(items: Record<string, readonly string[]>): RegistrySnapshot {
  const entries = Object.entries(items);
  return {
    root: {
      schemaVersion: 1,
      registryVersion: "0.1.0",
      contentHash: "a".repeat(64),
      compatibility: { svelte: "^5.57.1", bits: "^2.19.3", date: "^3.8.1" },
      items: entries.map(([id]) => ({ id, manifest: `ui/${id}.json` })),
    },
    items: entries.map(([id, dependencies]): RegistrySnapshotItem => ({
      id,
      manifestPath: `registry/ui/${id}.json`,
      manifest: {
        id,
        registryDependencies: dependencies,
      } as unknown as RegistryItem,
      files: [],
    })),
    assets: [],
  };
}

const style = (blockId: string, target = "src/styles/kit.css"): ItemStyle => ({
  source: `styles/${blockId}.css`,
  target,
  blockId,
  cohort: blockId,
});

const exported = (name: string, target: string): ItemExport => ({
  name,
  target,
  kind: "value",
});

test("permuted roots and manifests yield equivalent closure and order", () => {
  const a = resolveClosure(
    snapshot({ button: ["spinner"], spinner: ["tokens"], tokens: [] }),
    ["button"],
  );
  const b = resolveClosure(
    snapshot({ tokens: [], spinner: ["tokens"], button: ["spinner"] }),
    ["button"],
  );
  assert.equal(a.ok && b.ok, true);
  if (a.ok && b.ok) {
    assert.deepEqual(a.value.order, b.value.order);
    assert.deepEqual(a.value.items, b.value.items);
    assert.deepEqual(a.value.order, ["tokens", "spinner", "button"]);
  }
});

test("dependency ids are de-duplicated and sorted", () => {
  assert.deepEqual(orderDependencies(["spinner", "button", "spinner"]), [
    "button",
    "spinner",
  ]);
  assert.deepEqual(orderedUnique(["b", "a", "b"]), ["a", "b"]);
});

test("export order is normalized from explicit metadata", () => {
  const ordered = orderExports([
    exported("DialogTitle", "dialog/title.svelte"),
    exported("DialogClose", "dialog/close.svelte"),
    exported("DialogRoot", "dialog/root.svelte"),
  ]);
  assert.deepEqual(
    ordered.map((entry) => entry.name),
    ["DialogClose", "DialogRoot", "DialogTitle"],
  );
});

test("tokens precede dependent styles and block order is stable", () => {
  const ordered = orderCssBlocks([
    style("spinner"),
    style("button"),
    style(TOKEN_BLOCK_ID),
  ]);
  assert.deepEqual(
    ordered.map((block) => block.blockId),
    ["tokens", "button", "spinner"],
  );
});

test("repeated metadata projection is byte-stable", () => {
  const blocks = [style("button"), style(TOKEN_BLOCK_ID)];
  const first = stableProjection(orderCssBlocks(blocks));
  const second = stableProjection(orderCssBlocks([...blocks].reverse()));
  assert.equal(first, second);
  assert.equal(first, stableProjection(orderCssBlocks(blocks)));
});
