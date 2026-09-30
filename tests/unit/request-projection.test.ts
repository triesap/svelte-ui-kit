import assert from "node:assert/strict";
import { test } from "node:test";

import type {
  RegistrySnapshot,
  RegistrySnapshotItem,
} from "../../src/registry/load.js";
import type { RegistryItem } from "../../src/registry/item.js";
import { projectRequests } from "../../src/registry/projection.js";

/**
 * S030 tests: explicit roots stay distinct from the closure, provenance and
 * requiring roots are projected, and shared dependencies survive root removal.
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

const graph = snapshot({
  button: ["spinner"],
  spinner: ["tokens"],
  tokens: [],
  card: ["spinner"],
});

test("a root closure keeps config roots separate from transitive items", () => {
  const result = projectRequests(graph, ["button"]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    assert.deepEqual(result.value.requested, ["button"]);
    assert.deepEqual(
      result.value.items.map((item) => [item.id, item.provenance]),
      [
        ["tokens", "transitive"],
        ["spinner", "transitive"],
        ["button", "explicit"],
      ],
    );
    for (const item of result.value.items) {
      assert.deepEqual(item.requiredBy, ["button"]);
    }
  }
});

test("an explicitly requested dependency is distinguishable from a transitive one", () => {
  const result = projectRequests(graph, ["button", "spinner"]);
  assert.equal(result.ok, true);
  if (result.ok) {
    const spinner = result.value.items.find((item) => item.id === "spinner");
    assert.equal(spinner?.provenance, "explicit");
    assert.deepEqual(result.value.requested, ["button", "spinner"]);
    const tokens = result.value.items.find((item) => item.id === "tokens");
    assert.equal(tokens?.provenance, "transitive");
  }
});

test("a shared dependency remains while any root needs it", () => {
  const result = projectRequests(graph, ["button", "card"]);
  assert.equal(result.ok, true);
  if (result.ok) {
    const spinner = result.value.items.find((item) => item.id === "spinner");
    const tokens = result.value.items.find((item) => item.id === "tokens");
    assert.deepEqual(spinner?.requiredBy, ["button", "card"]);
    assert.deepEqual(tokens?.requiredBy, ["button", "card"]);
    assert.equal(result.value.retained.includes("spinner"), true);
  }
});

test("removing a root preserves an explicitly requested dependency", () => {
  const both = projectRequests(graph, ["button", "spinner"]);
  assert.equal(both.ok, true);
  if (!both.ok) return;
  const onlySpinner = projectRequests(graph, ["spinner"], both.value.retained);
  assert.equal(onlySpinner.ok, true);
  if (onlySpinner.ok) {
    assert.deepEqual(onlySpinner.value.requested, ["spinner"]);
    assert.deepEqual(
      onlySpinner.value.items.map((item) => item.id),
      ["tokens", "spinner"],
    );
    assert.deepEqual(onlySpinner.value.retired, ["button"]);
  }
});

test("previously owned items outside the closure are retired in order", () => {
  const result = projectRequests(
    graph,
    ["tokens"],
    ["spinner", "button", "card"],
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.value.retired, ["button", "card", "spinner"]);
  }
});
