import assert from "node:assert/strict";
import { test } from "node:test";

import {
  addRequest,
  compareItemIds,
  isItemId,
  normalizeRequested,
  transitiveRequests,
} from "../../src/project/requests.js";

/**
 * S015 tests: explicit requested roots stay distinct from the dependency
 * closure, normalization is deterministic and idempotent, and invalid names
 * are rejected.
 */

test("button alone remains the only explicit request after normalization", () => {
  const result = normalizeRequested(["button"]);
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.value, ["button"]);
});

test("normalization is deterministic and idempotent", () => {
  const first = normalizeRequested(["spinner", "button", "button"]);
  assert.equal(first.ok, true);
  if (first.ok) assert.deepEqual(first.value, ["button", "spinner"]);
  const second = normalizeRequested(first.ok ? first.value : []);
  assert.deepEqual(second, first);
});

test("explicit spinner plus button is distinguishable from a transitive spinner", () => {
  const explicit = normalizeRequested(["spinner", "button"]);
  assert.equal(explicit.ok, true);
  const closure = ["tokens", "spinner", "button"];
  if (explicit.ok) {
    // Both spinner and button are explicit roots; only tokens is transitive.
    assert.deepEqual(transitiveRequests(explicit.value, closure), ["tokens"]);
    assert.deepEqual(explicit.value, ["button", "spinner"]);
  }
  // With button alone, spinner is transitive even though both are installed.
  const buttonOnly = normalizeRequested(["button"]);
  if (buttonOnly.ok) {
    assert.deepEqual(transitiveRequests(buttonOnly.value, closure), [
      "spinner",
      "tokens",
    ]);
    assert.deepEqual(buttonOnly.value, ["button"]);
  }
});

test("adding the same request is idempotent and never adds a dependency", () => {
  const empty = normalizeRequested([]);
  assert.equal(empty.ok, true);
  const once = addRequest([], "button");
  const twice = addRequest(once.ok ? once.value : [], "button");
  assert.equal(once.ok && twice.ok, true);
  if (once.ok && twice.ok) {
    assert.deepEqual(once.value, ["button"]);
    assert.deepEqual(twice.value, ["button"]);
  }
});

test("invalid request names are rejected with a typed locator", () => {
  for (const value of [
    ["Button"],
    ["alert_dialog"],
    ["-button"],
    ["button--x"],
    ["button/"],
    ["Ünicode"],
    [""],
    [7],
    [null],
  ] as const) {
    const result = normalizeRequested(value);
    assert.equal(result.ok, false, JSON.stringify(value));
    if (!result.ok) {
      assert.equal(result.issues[0]?.code, "REQUEST_ID_INVALID");
      assert.equal(result.issues[0]?.locator, "requested");
    }
  }
  assert.equal(isItemId("alert-dialog"), true);
  assert.equal(isItemId("button2"), true);
  assert.equal(isItemId("Button"), false);
  assert.equal(compareItemIds("a", "b"), -1);
  assert.equal(compareItemIds("b", "a"), 1);
  assert.equal(compareItemIds("a", "a"), 0);
});
