import assert from "node:assert/strict";
import { test } from "node:test";

import { ModelError } from "../../src/registry/errors.js";
import {
  assertContentHash,
  assertVersionIdentities,
  BITS_UI_PEER_REQUIREMENTS,
  changedVersionAxes,
  CONTENT_HASH_PATTERN,
  INITIAL_COMPATIBILITY,
  INITIAL_IDENTITIES,
  INITIAL_ITEM_VERSION,
  INITIAL_REGISTRY_VERSION,
  INITIAL_SCHEMA_VERSION,
  INITIAL_TOOL_VERSION,
  isCompatibilityRange,
  isContentHash,
  isPositiveInteger,
  isSemVer,
  validateCompatibilityRange,
  validateContentHash,
  validateSchemaVersion,
  validateSemVer,
  validateVersionIdentities,
  type VersionIdentities,
} from "../../src/registry/versions.js";

/**
 * S013 model tests: the version axes are independent, each invalid identity
 * receives a typed error, and a compatibility-range change never implies a
 * schema migration.
 */

const changed = (overrides: Partial<VersionIdentities>): VersionIdentities => ({
  ...INITIAL_IDENTITIES,
  ...overrides,
});

test("initial identities validate and stay independent", () => {
  const result = validateVersionIdentities(INITIAL_IDENTITIES);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(INITIAL_SCHEMA_VERSION, 1);
  assert.equal(INITIAL_TOOL_VERSION, "0.1.0");
  assert.equal(INITIAL_REGISTRY_VERSION, "0.1.0");
  assert.equal(INITIAL_ITEM_VERSION, "0.1.0");
  // The compatibility range is a range, never the integer schema identity.
  assert.notEqual(INITIAL_COMPATIBILITY.svelte, String(INITIAL_SCHEMA_VERSION));
  assert.equal(isCompatibilityRange(INITIAL_COMPATIBILITY.svelte), true);
});

test("advertised tested support is exact and Bits peers stay distinct", () => {
  assert.equal(INITIAL_COMPATIBILITY.svelte, "5.57.1");
  assert.equal(INITIAL_COMPATIBILITY.bits, "2.19.3");
  assert.equal(INITIAL_COMPATIBILITY.date, "^3.8.1");
  assert.equal(BITS_UI_PEER_REQUIREMENTS.svelte, "^5.33.0");
  assert.equal(BITS_UI_PEER_REQUIREMENTS.date, "^3.8.1");
  assert.notEqual(
    BITS_UI_PEER_REQUIREMENTS.svelte,
    INITIAL_COMPATIBILITY.svelte,
  );
  assert.equal(isCompatibilityRange(INITIAL_COMPATIBILITY.svelte), true);
  assert.equal(isCompatibilityRange(INITIAL_COMPATIBILITY.bits), true);
});

test("a framework compatibility change does not imply a schema migration", () => {
  const after = changed({
    compatibility: { ...INITIAL_COMPATIBILITY, svelte: "^5.58.0" },
  });
  assert.deepEqual(changedVersionAxes(INITIAL_IDENTITIES, after), [
    "compatibility",
  ]);
  assert.deepEqual(
    changedVersionAxes(INITIAL_IDENTITIES, INITIAL_IDENTITIES),
    [],
  );
});

test("independent axes change independently", () => {
  assert.deepEqual(
    changedVersionAxes(INITIAL_IDENTITIES, changed({ schemaVersion: 2 })),
    ["schemaVersion"],
  );
  assert.deepEqual(
    changedVersionAxes(
      INITIAL_IDENTITIES,
      changed({ registryVersion: "0.2.0" }),
    ),
    ["registryVersion"],
  );
  assert.deepEqual(
    changedVersionAxes(
      INITIAL_IDENTITIES,
      changed({
        schemaVersion: 2,
        compatibility: { ...INITIAL_COMPATIBILITY, bits: "^2.20.0" },
      }),
    ),
    ["schemaVersion", "compatibility"],
  );
});

test("positive-integer identities reject non-integers with typed codes", () => {
  for (const value of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, "1"]) {
    const result = validateSchemaVersion(value);
    assert.equal(result.ok, false, `expected ${String(value)} to fail`);
    if (!result.ok) {
      assert.equal(result.issues[0]?.code, "SCHEMA_VERSION_INVALID");
      assert.equal(result.issues[0]?.locator, undefined);
    }
  }
  assert.equal(isPositiveInteger(1), true);
  assert.equal(isPositiveInteger(0), false);
  assert.equal(isPositiveInteger(Number.MAX_SAFE_INTEGER + 1), false);
});

test("SemVer validation is strict", () => {
  for (const value of ["1.2.3", "0.1.0", "1.0.0-alpha.1", "1.0.0+build.5"]) {
    assert.equal(isSemVer(value), true, value);
    assert.equal(validateSemVer(value, "test").ok, true, value);
  }
  for (const value of [
    "v1.2.3",
    "1.2",
    "01.2.3",
    "1.2.3.4",
    " 1.2.3",
    "",
    "latest",
  ]) {
    const result = validateSemVer(value, "tool version", "toolVersion");
    assert.equal(result.ok, false, `expected ${JSON.stringify(value)} to fail`);
    if (!result.ok) {
      assert.equal(result.issues[0]?.code, "SEMVER_INVALID");
      assert.equal(result.issues[0]?.locator, "toolVersion");
    }
  }
});

test("compatibility ranges accept npm ranges and reject source kinds", () => {
  for (const value of ["^5.57.1", "~2.19.0", ">=1 <2 || >=3", "1.2.3", "*"]) {
    assert.equal(isCompatibilityRange(value), true, value);
  }
  for (const value of [
    "git+https://example.invalid/x.git",
    "git://example.invalid/x",
    "file:../sibling",
    "https://example.invalid/pkg.tgz",
    "github:owner/repo",
    "workspace:*",
    "",
    "  ^1.0.0",
    "latest",
  ]) {
    const result = validateCompatibilityRange(value, "svelte compatibility");
    assert.equal(result.ok, false, `expected ${JSON.stringify(value)} to fail`);
    if (!result.ok) {
      assert.equal(result.issues[0]?.code, "COMPATIBILITY_RANGE_INVALID");
    }
  }
});

test("content hashes are lowercase 64-hex", () => {
  const good = "a".repeat(64);
  assert.equal(CONTENT_HASH_PATTERN.test(good), true);
  assert.equal(isContentHash(good), true);
  assert.equal(assertContentHash(good), good);
  for (const value of [
    "A".repeat(64),
    "a".repeat(63),
    "a".repeat(65),
    "g".repeat(64),
    `sha256:${good}`,
    7,
  ]) {
    const result = validateContentHash(value, "registry.contentHash");
    assert.equal(result.ok, false, `expected ${String(value)} to fail`);
    if (!result.ok) {
      assert.equal(result.issues[0]?.code, "CONTENT_HASH_INVALID");
      assert.equal(result.issues[0]?.locator, "registry.contentHash");
    }
  }
});

test("invalid identities throw typed ModelError through the assert wrapper", () => {
  assert.throws(
    () =>
      assertVersionIdentities(
        changed({ schemaVersion: 0 as unknown as number }),
      ),
    (error: unknown) => {
      assert.ok(error instanceof ModelError);
      assert.equal(error.code, "SCHEMA_VERSION_INVALID");
      return true;
    },
  );
  assert.throws(
    () => assertContentHash("nope"),
    (error: unknown) => {
      assert.ok(error instanceof ModelError);
      assert.equal(error.code, "CONTENT_HASH_INVALID");
      return true;
    },
  );
});

test("validateVersionIdentities collects every problem in one pass", () => {
  const result = validateVersionIdentities({
    schemaVersion: 0,
    protocolVersion: 1,
    contractVersion: "1",
    toolVersion: "not-semver",
    registryVersion: "0.1.0",
    itemVersion: "0.1.0",
    compatibility: { svelte: "file:../x", bits: "^2.19.3", date: "^3.8.1" },
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    const codes = result.issues.map((entry) => entry.code).sort();
    assert.deepEqual(codes, [
      "COMPATIBILITY_RANGE_INVALID",
      "CONTRACT_VERSION_INVALID",
      "SCHEMA_VERSION_INVALID",
      "SEMVER_INVALID",
    ]);
  }
  const nonObject = validateVersionIdentities(null);
  assert.equal(nonObject.ok, false);
  if (!nonObject.ok) {
    assert.equal(nonObject.issues[0]?.code, "VERSION_IDENTITIES_INVALID");
  }
});
