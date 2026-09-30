import assert from "node:assert/strict";
import { test } from "node:test";

import {
  EMPTY_ACCESSIBILITY,
  parseRegistryItem,
} from "../../src/registry/item.js";

/**
 * S018 tests: accessibility and dependency metadata parse, while unknown roles,
 * malformed ranges, duplicate declarations and self-dependencies fail.
 */

function base(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    schemaVersion: 1,
    id: "button",
    kind: "component",
    version: "0.1.0",
    description: "A native button.",
    compatibility: { svelte: "^5.57.1", bits: "^2.19.3", date: "^3.8.1" },
    files: [
      {
        source: "templates/button.svelte",
        target: "button.svelte",
        kind: "svelte",
        cohort: "core",
      },
    ],
    exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
    styles: [],
    ...overrides,
  };
}

function codesFor(value: unknown): string[] {
  const result = parseRegistryItem(value);
  assert.equal(result.ok, false, "expected the item to fail");
  return result.ok ? [] : result.issues.map((entry) => entry.code);
}

test("accessibility and dependency metadata parse", () => {
  const result = parseRegistryItem(
    base({
      registryDependencies: ["tokens", "spinner"],
      npmDependencies: [
        { name: "bits-ui", range: "^2.19.3", role: "peer" },
        { name: "@internationalized/date", range: "^3.8.1", role: "peer" },
        { name: "svelte", range: "^5.57.1", role: "runtime" },
      ],
      accessibility: {
        requiredNames: ["accessible button name"],
        keyboard: ["Enter and Space activate the button"],
        focus: ["visible focus ring"],
        form: ["type=submit participates in form submission"],
        tests: ["keyboard activation fixture", "focus visibility fixture"],
      },
    }),
  );
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    assert.deepEqual(result.value.registryDependencies, ["tokens", "spinner"]);
    assert.deepEqual(
      result.value.npmDependencies.map((entry) => entry.role),
      ["peer", "peer", "runtime"],
    );
    assert.equal(result.value.accessibility.tests.length, 2);
  }
});

test("absent metadata defaults to empty descriptive structures", () => {
  const result = parseRegistryItem(base({}));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    assert.deepEqual(result.value.registryDependencies, []);
    assert.deepEqual(result.value.npmDependencies, []);
    assert.deepEqual(result.value.accessibility, EMPTY_ACCESSIBILITY);
  }
});

test("an incomplete accessibility record fails the schema", () => {
  assert.equal(
    codesFor(
      base({
        accessibility: {
          requiredNames: ["name"],
          keyboard: [],
          focus: [],
          form: [],
        },
      }),
    ).includes("SCHEMA_INVALID"),
    true,
  );
});

test("unknown npm roles fail the schema", () => {
  assert.equal(
    codesFor(
      base({
        npmDependencies: [
          { name: "bits-ui", range: "^2.19.3", role: "optional" },
        ],
      }),
    ).includes("SCHEMA_INVALID"),
    true,
  );
});

test("malformed npm ranges and duplicate declarations fail", () => {
  assert.equal(
    codesFor(
      base({
        npmDependencies: [
          {
            name: "bits-ui",
            range: "git+https://example.invalid/x",
            role: "peer",
          },
        ],
      }),
    ).includes("NPM_RANGE_INVALID"),
    true,
  );
  assert.equal(
    codesFor(
      base({
        npmDependencies: [
          { name: "bits-ui", range: "^2.19.3", role: "peer" },
          { name: "bits-ui", range: "^2.19.3", role: "runtime" },
        ],
      }),
    ).includes("ITEM_DUPLICATE_NPM_DEPENDENCY"),
    true,
  );
});

test("a self registry dependency fails", () => {
  assert.equal(
    codesFor(base({ registryDependencies: ["button"] })).includes(
      "ITEM_SELF_DEPENDENCY",
    ),
    true,
  );
});
