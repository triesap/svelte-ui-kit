import assert from "node:assert/strict";
import { test } from "node:test";

import { ModelError } from "../../src/registry/errors.js";
import { canonicalJson } from "../../src/codegen/serialize.js";

/**
 * S024 tests: canonical serialization sorts keys, preserves meaningful array
 * order, uses two-space indentation plus one LF, rejects non-JSON/nonfinite
 * values and never introduces timestamps or random identifiers.
 */

test("objects serialize with sorted keys, two-space indent and one LF", () => {
  const rendered = canonicalJson({ b: 2, a: 1 });
  assert.equal(rendered, '{\n  "a": 1,\n  "b": 2\n}\n');
  assert.equal(rendered.endsWith("\n"), true);
  assert.equal(rendered.endsWith("\n\n"), false);
});

test("equivalent unordered logical maps serialize identically", () => {
  const first = canonicalJson({ z: { y: 1, x: 2 }, a: [3, 4] });
  const second = canonicalJson({ a: [3, 4], z: { x: 2, y: 1 } });
  assert.equal(first, second);
});

test("array order is preserved because it is meaningful", () => {
  assert.notEqual(canonicalJson([1, 2]), canonicalJson([2, 1]));
  assert.equal(canonicalJson(["b", "a"]), '[\n  "b",\n  "a"\n]\n');
});

test("empty containers are stable", () => {
  assert.equal(canonicalJson({}), "{}\n");
  assert.equal(canonicalJson([]), "[]\n");
  assert.equal(
    canonicalJson({ a: {}, b: [] }),
    '{\n  "a": {},\n  "b": []\n}\n',
  );
});

test("strings are JSON-escaped and unicode is preserved", () => {
  assert.equal(canonicalJson("a\nb"), '"a\\nb"\n');
  assert.equal(canonicalJson("π"), '"π"\n');
  assert.equal(canonicalJson({ key: "é" }), '{\n  "key": "é"\n}\n');
});

test("non-finite numbers are rejected", () => {
  for (const value of [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ]) {
    assert.throws(
      () => canonicalJson({ value }),
      (error: unknown) => {
        assert.ok(error instanceof ModelError);
        assert.equal(error.code, "JSON_NUMBER_NONFINITE");
        return true;
      },
    );
  }
});

test("non-JSON values are rejected rather than silently dropped", () => {
  for (const value of [undefined, () => 1, Symbol("x"), 1n]) {
    assert.throws(
      () => canonicalJson({ value }),
      (error: unknown) => {
        assert.ok(error instanceof ModelError);
        assert.equal(error.code, "JSON_VALUE_UNSUPPORTED");
        return true;
      },
    );
  }
  assert.throws(() => canonicalJson({ a: undefined }), ModelError);
});

test("no timestamp or random identifier enters semantic output", () => {
  const value = { id: "button", version: "0.1.0" };
  const rendered = canonicalJson(value);
  assert.doesNotMatch(rendered, /\d{4}-\d{2}-\d{2}T/);
  assert.equal(canonicalJson(value), rendered);
});
