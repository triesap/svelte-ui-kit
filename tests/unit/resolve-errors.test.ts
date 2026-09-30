import assert from "node:assert/strict";
import { test } from "node:test";

import type {
  RegistrySnapshot,
  RegistrySnapshotItem,
} from "../../src/registry/load.js";
import type { RegistryItem } from "../../src/registry/item.js";
import { isInClosure, resolveClosure } from "../../src/registry/resolve.js";

/**
 * S028 tests: the closure resolves deterministically, diamonds are visited
 * once, and cycles/missing items fail with explicit diagnostics.
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

function codes(value: unknown): string[] {
  const result = resolveClosure(value as RegistrySnapshot, []);
  return result.ok ? [] : result.issues.map((entry) => entry.code);
}

test("empty roots resolve safely to an empty closure", () => {
  const result = resolveClosure(snapshot({}), []);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    assert.deepEqual(result.value.roots, []);
    assert.deepEqual(result.value.items, []);
    assert.deepEqual(result.value.order, []);
  }
});

test("a single root without dependencies resolves to itself", () => {
  const result = resolveClosure(snapshot({ button: [] }), ["button"]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    assert.deepEqual(result.value.items, ["button"]);
    assert.deepEqual(result.value.order, ["button"]);
  }
});

test("a diamond dependency resolves once in dependency-before-dependent order", () => {
  const result = resolveClosure(
    snapshot({
      button: ["spinner"],
      card: ["spinner"],
      spinner: ["tokens"],
      tokens: [],
    }),
    ["button", "card"],
  );
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    assert.deepEqual(result.value.items, [
      "button",
      "card",
      "spinner",
      "tokens",
    ]);
    // tokens before spinner before both dependents; deterministically sorted
    // roots/edges break ties by code unit.
    assert.deepEqual(result.value.order, [
      "tokens",
      "spinner",
      "button",
      "card",
    ]);
    assert.equal(isInClosure(result.value, "spinner"), true);
  }
});

test("a self-cycle reports its path", () => {
  const result = resolveClosure(snapshot({ a: ["a"] }), ["a"]);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "RESOLVE_CYCLE");
    assert.match(result.issues[0]?.message ?? "", /a -> a/);
  }
});

test("a multi-node cycle reports the concrete path", () => {
  const result = resolveClosure(snapshot({ a: ["b"], b: ["c"], c: ["a"] }), [
    "a",
  ]);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "RESOLVE_CYCLE");
    assert.match(result.issues[0]?.message ?? "", /a -> b -> c -> a/);
  }
});

test("a missing dependency or root fails with the item locator", () => {
  const missingDependency = resolveClosure(snapshot({ button: ["ghost"] }), [
    "button",
  ]);
  assert.equal(missingDependency.ok, false);
  if (!missingDependency.ok) {
    assert.equal(missingDependency.issues[0]?.code, "RESOLVE_MISSING_ITEM");
    assert.equal(missingDependency.issues[0]?.locator, "ghost");
    assert.match(
      missingDependency.issues[0]?.message ?? "",
      /registry 0\.1\.0#/,
    );
  }
  const missingRoot = resolveClosure(snapshot({}), ["ghost"]);
  assert.equal(missingRoot.ok, false);
  if (!missingRoot.ok) {
    assert.equal(missingRoot.issues[0]?.code, "RESOLVE_MISSING_ITEM");
  }
});

test("resolution is read-only and repeatable", () => {
  const graph = snapshot({
    button: ["spinner"],
    spinner: ["tokens"],
    tokens: [],
  });
  const first = resolveClosure(graph, ["button"]);
  const second = resolveClosure(graph, ["button"]);
  assert.deepEqual(first, second);
  assert.deepEqual(codes(graph), []);
});
