import assert from "node:assert/strict";
import { test } from "node:test";

import { composeManagedCss } from "../../src/codegen/css.js";

/**
 * S050 tests: managed blocks are updated/inserted deterministically while
 * leading, interleaved and trailing application CSS survives byte-for-byte, and
 * repeated composition is idempotent.
 */

const EXISTING =
  "/* app top */\n" +
  "/* svelte-ui-kit:start tokens */\n@layer old;\n/* svelte-ui-kit:end tokens */\n" +
  ".app { color: red; }\n" +
  "/* app bottom */\n";

test("unmanaged text survives and missing blocks are appended in order", () => {
  const result = composeManagedCss(EXISTING, [
    { id: "button", body: "\n.kit-button {}\n" },
    { id: "tokens", body: "\n@layer svelte-ui-kit.tokens;\n" },
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  const output = result.value;
  assert.ok(output.includes("/* app top */\n"));
  assert.ok(output.includes(".app { color: red; }\n"));
  assert.ok(output.includes("/* app bottom */\n"));
  assert.ok(output.includes("\n@layer svelte-ui-kit.tokens;\n"));
  // tokens is a new block and is appended before the dependent button block.
  assert.ok(
    output.indexOf("start tokens") < output.indexOf("start button"),
    output,
  );
});

test("permuted desired input yields identical managed output", () => {
  const first = composeManagedCss(EXISTING, [
    { id: "button", body: "\nB\n" },
    { id: "tokens", body: "\nT\n" },
    { id: "card", body: "\nC\n" },
  ]);
  const second = composeManagedCss(EXISTING, [
    { id: "card", body: "\nC\n" },
    { id: "tokens", body: "\nT\n" },
    { id: "button", body: "\nB\n" },
  ]);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (!first.ok || !second.ok) return;
  assert.equal(first.value, second.value);
});

test("repeated patch is byte-idempotent", () => {
  const desired = [
    { id: "tokens", body: "\n@layer a, b;\n" },
    { id: "button", body: "\n.kit-button {}\n" },
  ];
  const once = composeManagedCss(EXISTING, desired);
  assert.equal(once.ok, true);
  if (!once.ok) return;
  const twice = composeManagedCss(once.value, desired);
  assert.equal(twice.ok, true);
  if (!twice.ok) return;
  assert.equal(twice.value, once.value);
});

test("existing application content between blocks is not reordered", () => {
  const existing =
    "/* svelte-ui-kit:start button */\nB\n/* svelte-ui-kit:end button */\n" +
    "MIDDLE\n" +
    "/* svelte-ui-kit:start card */\nC\n/* svelte-ui-kit:end card */\n";
  const result = composeManagedCss(existing, [
    { id: "button", body: "\nB2\n" },
  ]);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(
    result.value,
    "/* svelte-ui-kit:start button */\nB2\n/* svelte-ui-kit:end button */\n" +
      "MIDDLE\n" +
      "/* svelte-ui-kit:start card */\nC\n/* svelte-ui-kit:end card */\n",
  );
});

test("a malformed existing stylesheet fails without producing output", () => {
  const result = composeManagedCss("/* svelte-ui-kit:start tokens */\n", [
    { id: "button", body: "\nB\n" },
  ]);
  assert.equal(result.ok, false);
});

/**
 * RCLD03-R2-3: a newly introduced tokens block is ordered before a dependent
 * block even when the dependent already exists.
 */
test("a new tokens block is ordered before a dependent block", () => {
  const button =
    "/* svelte-ui-kit:start button */\nB\n/* svelte-ui-kit:end button */";
  const result = composeManagedCss(button, [
    { id: "button", body: "\nB\n" },
    { id: "tokens", body: "\nT\n" },
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.ok(
    result.value.indexOf("start tokens") < result.value.indexOf("start button"),
    result.value,
  );
});

/**
 * RCLD03-R2-3: a previously wrong block order is corrected on the next
 * composition.
 */
test("a previously wrong tokens order is corrected", () => {
  const existing =
    "/* svelte-ui-kit:start button */\nB\n/* svelte-ui-kit:end button */" +
    "/* svelte-ui-kit:start tokens */\nT\n/* svelte-ui-kit:end tokens */";
  const result = composeManagedCss(existing, [
    { id: "tokens", body: "\nT\n" },
    { id: "button", body: "\nB\n" },
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.ok(
    result.value.indexOf("start tokens") < result.value.indexOf("start button"),
    result.value,
  );
});

/**
 * RCLD03-R2-3: a satisfied block keeps its exact (noncanonical) marker bytes.
 */
test("a satisfied block keeps its noncanonical marker bytes", () => {
  const noncanonical =
    "/*  svelte-ui-kit:start tokens  */\r\n:root{}\r\n/*  svelte-ui-kit:end tokens  */";
  const result = composeManagedCss(noncanonical, [
    { id: "tokens", body: "\r\n:root{}\r\n" },
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value, noncanonical);
});
