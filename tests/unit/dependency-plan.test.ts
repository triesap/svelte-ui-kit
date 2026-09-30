import assert from "node:assert/strict";
import { test } from "node:test";

import {
  intersectRanges,
  planDependencies,
} from "../../src/registry/dependency-plan.js";
import type { NpmRole, RegistryItem } from "../../src/registry/item.js";
import type {
  RegistrySnapshot,
  RegistrySnapshotItem,
} from "../../src/registry/load.js";

/**
 * S031 tests: compatible requirements coalesce, disjoint/joint-empty ranges
 * fail with the involved item ids, and peer requirements are retained.
 */

function snapshot(
  items: Record<
    string,
    {
      deps?: readonly string[];
      npm?: readonly { name: string; range: string; role: NpmRole }[];
    }
  >,
): RegistrySnapshot {
  const entries = Object.entries(items);
  return {
    root: {
      schemaVersion: 1,
      registryVersion: "0.1.0",
      contentHash: "a".repeat(64),
      compatibility: { svelte: "^5.57.1", bits: "^2.19.3", date: "^3.8.1" },
      items: entries.map(([id]) => ({ id, manifest: `ui/${id}.json` })),
    },
    items: entries.map(([id, spec]): RegistrySnapshotItem => ({
      id,
      manifestPath: `registry/ui/${id}.json`,
      manifest: {
        id,
        registryDependencies: spec.deps ?? [],
        npmDependencies: spec.npm ?? [],
      } as unknown as RegistryItem,
      files: [],
    })),
    assets: [],
  };
}

function codes(value: unknown): string[] {
  const result = planDependencies(value as RegistrySnapshot, [
    "button",
    "card",
  ]);
  return result.ok ? [] : result.issues.map((entry) => entry.code);
}

test("compatible duplicate requirements coalesce with roles preserved", () => {
  const graph = snapshot({
    button: { npm: [{ name: "svelte", range: "^5.57.1", role: "peer" }] },
    card: { npm: [{ name: "svelte", range: "^5.0.0", role: "runtime" }] },
  });
  const result = planDependencies(graph, ["button", "card"]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    assert.equal(result.value.entries.length, 1);
    const entry = result.value.entries[0];
    assert.equal(entry?.name, "svelte");
    assert.deepEqual(entry?.roles, ["peer", "runtime"]);
    assert.deepEqual(entry?.requiredBy, ["button", "card"]);
    assert.ok(entry?.range.includes(">=5.0.0"));
  }
});

test("disjoint ranges fail with the involved item ids", () => {
  const graph = snapshot({
    button: { npm: [{ name: "bits-ui", range: "^1.0.0", role: "peer" }] },
    card: { npm: [{ name: "bits-ui", range: "^2.0.0", role: "peer" }] },
  });
  const result = planDependencies(graph, ["button", "card"]);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "DEPENDENCY_RANGE_CONFLICT");
    assert.equal(result.issues[0]?.locator, "bits-ui");
    assert.match(result.issues[0]?.message ?? "", /button, card/);
  }
});

test("pairwise overlap is not enough: the joint intersection is checked", () => {
  const graph = snapshot({
    button: { npm: [{ name: "x", range: "^1 || ^2", role: "runtime" }] },
    card: { npm: [{ name: "x", range: "^2 || ^3", role: "runtime" }] },
    panel: { npm: [{ name: "x", range: "^1 || ^3", role: "runtime" }] },
  });
  const result = planDependencies(graph, ["button", "card", "panel"]);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "DEPENDENCY_RANGE_CONFLICT");
  }
  // Two of the three still intersect.
  assert.notEqual(intersectRanges(["^1 || ^2", "^2 || ^3"]), null);
});

test("zero-major and prerelease ranges follow strict npm semantics", () => {
  assert.notEqual(intersectRanges(["^0.1.0", "~0.1.0"]), null);
  assert.equal(intersectRanges(["^0.1.0", "^0.2.0"]), null);
  assert.notEqual(
    intersectRanges(["^1.0.0-rc.1", ">=1.0.0-rc.0 <1.0.0"]),
    null,
  );
});

test("peer requirements are not dropped when not directly imported", () => {
  const graph = snapshot({
    button: { npm: [{ name: "bits-ui", range: "^2.19.3", role: "peer" }] },
  });
  const result = planDependencies(graph, ["button"]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    const entry = result.value.entries.find((item) => item.name === "bits-ui");
    assert.equal(entry?.roles.includes("peer"), true);
    assert.deepEqual(entry?.requiredBy, ["button"]);
  }
});

test("unsupported source ranges are typed errors", () => {
  const graph = snapshot({
    button: {
      npm: [
        {
          name: "x",
          range: "git+https://example.invalid/x.git",
          role: "runtime",
        },
      ],
    },
  });
  const result = planDependencies(graph, ["button"]);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "DEPENDENCY_SOURCE_UNSUPPORTED");
  }
  assert.deepEqual(codes(snapshot({ button: {}, card: {} })), []);
});
