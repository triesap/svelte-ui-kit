import assert from "node:assert/strict";
import { test } from "node:test";
import { satisfies } from "semver";

import {
  intersectRanges,
  intersectRangesDetailed,
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

const MEMBERSHIP_CASES: readonly (readonly string[])[] = [
  ["*", ">=1.0.0-rc.1 <1.0.0"],
  ["^1 || ^2", ">=1 <3"],
  [">2 <1"],
  ["^0.1.0", "~0.1.0"],
  ["^0.1.0", "^0.2.0"],
  ["^1.0.0-rc.1", ">=1.0.0-rc.0 <1.0.0"],
  ["^1 || ^2", "^2 || ^3"],
  ["^1 || ^2", "^2 || ^3", "^1 || ^3"],
  ["^1 || ^2", ">=1 <3", "^2"],
  ["~1.2.3", "^1.2.0", ">=1.2.5"],
  ["1.x", ">=1.0.0 <2.0.0"],
  ["*", "*"],
  [">=1.2.0", "^1.2.0", "~1.5.0"],
];

const MEMBERSHIP_PROBES: readonly string[] = [
  "0.0.1",
  "0.1.0",
  "0.2.0",
  "1.0.0-rc.0",
  "1.0.0-rc.1",
  "1.0.0-rc.2",
  "1.0.0",
  "1.2.3",
  "1.2.5",
  "1.5.0",
  "1.9.9",
  "2.0.0-0",
  "2.0.0",
  "2.5.0",
  "3.0.0",
  "3.1.0",
  "4.0.0-alpha",
  "4.0.0",
];

test("joint membership matches every original operand", () => {
  for (const ranges of MEMBERSHIP_CASES) {
    const result = intersectRangesDetailed(ranges);
    for (const version of MEMBERSHIP_PROBES) {
      const expected = ranges.every((range) => satisfies(version, range));
      const label = `${JSON.stringify(ranges)} @ ${version}`;
      if (result.kind === "range") {
        assert.equal(
          satisfies(version, result.range),
          expected,
          `${label} -> ${result.range}`,
        );
      } else if (result.kind === "empty") {
        assert.equal(expected, false, `${label} should be empty`);
      } else {
        assert.fail(`${label} unexpectedly unable: ${result.reason}`);
      }
    }
  }
});

test("permuted and redundant operands stay membership equivalent", () => {
  const base = ["^1 || ^2", ">=1 <3"];
  const permuted = [">=1 <3", "^1 || ^2", "^1 || ^2"];
  const a = intersectRangesDetailed(base);
  const b = intersectRangesDetailed(permuted);
  assert.equal(a.kind, "range");
  assert.equal(b.kind, "range");
  if (a.kind === "range" && b.kind === "range") {
    for (const version of MEMBERSHIP_PROBES) {
      assert.equal(satisfies(version, a.range), satisfies(version, b.range));
    }
  }
});

test("a lone unsatisfiable range is a proven empty intersection", () => {
  assert.deepEqual(intersectRangesDetailed([">2 <1"]), { kind: "empty" });
  assert.equal(intersectRanges([">2 <1"]), null);
  assert.equal(intersectRanges(["*", ">=1.0.0-rc.1 <1.0.0"]), null);
});

test("an invalid range yields a typed inability rather than a conflict", () => {
  const detail = intersectRangesDetailed(["not a range"]);
  assert.equal(detail.kind, "unable");
  assert.throws(
    () => intersectRanges(["not a range"]),
    /could not be evaluated/,
  );
});

test("the or-intersection retains the dropped major branch", () => {
  const result = intersectRanges(["^1 || ^2", ">=1 <3"]);
  assert.notEqual(result, null);
  if (result !== null) {
    assert.equal(satisfies("1.5.0", result), true);
    assert.equal(satisfies("2.5.0", result), true);
    assert.equal(satisfies("3.0.0", result), false);
  }
});
