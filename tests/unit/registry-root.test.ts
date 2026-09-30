import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import {
  buildEmptyDevelopmentRegistry,
  computeRegistryContentHash,
  isManifestPath,
  parseRegistryRoot,
  type RegistryRoot,
  type RegistryRootBasis,
} from "../../src/registry/model.js";
import { INITIAL_COMPATIBILITY } from "../../src/registry/versions.js";

/**
 * S016 tests: the bundled registry root is explicit and validated, duplicate
 * IDs/manifests and identity mismatches fail, and the development root
 * advertises no unimplemented items.
 */

function withHash(basis: RegistryRootBasis): RegistryRoot {
  return { ...basis, contentHash: computeRegistryContentHash(basis) };
}

function issueCodes(root: unknown): string[] {
  const result = parseRegistryRoot(root);
  assert.equal(result.ok, false, "expected the root to fail");
  return result.ok ? [] : result.issues.map((entry) => entry.code);
}

const SAMPLE_BASIS: RegistryRootBasis = {
  schemaVersion: 1,
  registryVersion: "0.1.0",
  compatibility: INITIAL_COMPATIBILITY,
  items: [
    { id: "button", manifest: "ui/button.json" },
    { id: "spinner", manifest: "ui/spinner.json" },
  ],
};

test("the empty development registry validates and advertises no items", () => {
  const fromDisk: unknown = JSON.parse(
    readFileSync(path.join(process.cwd(), "registry", "registry.json"), "utf8"),
  );
  const result = parseRegistryRoot(fromDisk);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    assert.deepEqual(result.value.items, []);
    assert.equal(result.value.registryVersion, "0.1.0");
    assert.equal(result.value.contentHash.length, 64);
  }
  const built = buildEmptyDevelopmentRegistry(INITIAL_COMPATIBILITY);
  assert.deepEqual(built, fromDisk);
});

test("a sample root with explicit {id, manifest} records validates", () => {
  const result = parseRegistryRoot(withHash(SAMPLE_BASIS));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    assert.deepEqual(
      result.value.items.map((entry) => entry.id),
      ["button", "spinner"],
    );
  }
});

test("duplicate item ids and manifest paths fail", () => {
  assert.equal(
    issueCodes(
      withHash({
        ...SAMPLE_BASIS,
        items: [
          { id: "button", manifest: "ui/button.json" },
          { id: "button", manifest: "ui/other.json" },
        ],
      }),
    ).includes("REGISTRY_DUPLICATE_ITEM"),
    true,
  );
  assert.equal(
    issueCodes(
      withHash({
        ...SAMPLE_BASIS,
        items: [
          { id: "button", manifest: "ui/button.json" },
          { id: "spinner", manifest: "ui/button.json" },
        ],
      }),
    ).includes("REGISTRY_DUPLICATE_MANIFEST"),
    true,
  );
});

test("an identity mismatch fails deterministically", () => {
  const tampered = { ...withHash(SAMPLE_BASIS), contentHash: "0".repeat(64) };
  const codes = issueCodes(tampered);
  assert.equal(codes.includes("REGISTRY_HASH_MISMATCH"), true);
});

test("malformed compatibility ranges fail", () => {
  const codes = issueCodes(
    withHash({
      ...SAMPLE_BASIS,
      compatibility: {
        svelte: "file:../sibling",
        bits: "^2.19.3",
        date: "^3.8.1",
      },
    }),
  );
  assert.equal(codes.includes("COMPATIBILITY_RANGE_INVALID"), true);
});

test("unsafe manifest paths are rejected", () => {
  assert.equal(isManifestPath("ui/button.json"), true);
  for (const manifest of [
    "/abs/button.json",
    "../button.json",
    "ui/../../button.json",
    "ui//button.json",
    "ui/button.ts",
    "",
  ]) {
    assert.equal(isManifestPath(manifest), false, manifest);
  }
  // A traversal that still matches the schema pattern is caught semantically.
  assert.equal(
    issueCodes(
      withHash({
        ...SAMPLE_BASIS,
        items: [{ id: "button", manifest: "ui/../button.json" }],
      }),
    ).includes("REGISTRY_MANIFEST_PATH_INVALID"),
    true,
  );
});

test("unknown root fields and bad shapes fail the schema", () => {
  const codes = issueCodes({
    ...withHash(SAMPLE_BASIS),
    extra: true,
  });
  assert.equal(codes.includes("SCHEMA_INVALID"), true);
  assert.equal(issueCodes(null).includes("SCHEMA_INVALID"), true);
});
