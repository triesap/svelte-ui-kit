import assert from "node:assert/strict";
import { test } from "node:test";

import { blockBodies, parseManagedCss } from "../../src/codegen/css-parse.js";
import type { ModelResult } from "../../src/registry/errors.js";

/**
 * S048 tests: managed CSS markers parse into exact spans while string/comment
 * content is ignored, malformed/duplicate/unmatched/nested markers fail, and
 * CRLF plus every unmanaged byte is retained.
 */

function codes(result: ModelResult<unknown>): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

test("blocks and unmanaged regions retain exact spans and CRLF", () => {
  const text =
    "/* app top */\r\n" +
    "/* svelte-ui-kit:start tokens */\r\n@layer a, b;\r\n/* svelte-ui-kit:end tokens */\r\n" +
    ".app { color: red; }\r\n" +
    "/* svelte-ui-kit:start button */\r\n.kit-button {}\r\n/* svelte-ui-kit:end button */\r\n" +
    "/* app bottom */\r\n";
  const result = parseManagedCss(text);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;

  assert.deepEqual(
    result.value.blocks.map((block) => block.id),
    ["tokens", "button"],
  );
  const bodies = blockBodies(text, result.value);
  assert.equal(bodies.get("tokens"), "\r\n@layer a, b;\r\n");
  assert.equal(bodies.get("button"), "\r\n.kit-button {}\r\n");

  const reconstructed = result.value.unmanaged
    .map((region) => text.slice(region.start, region.end))
    .join("");
  assert.ok(reconstructed.includes("/* app top */\r\n"));
  assert.ok(reconstructed.includes(".app { color: red; }\r\n"));
  assert.ok(reconstructed.includes("/* app bottom */\r\n"));
  assert.ok(reconstructed.includes("\r\n"));
});

test("marker-like text inside strings does not create a block", () => {
  const text = '.x { content: "/* svelte-ui-kit:start tokens */"; }\n';
  const result = parseManagedCss(text);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.deepEqual(result.value.blocks, []);
});

test("a non-reserved comment that mentions the prefix is ignored", () => {
  const text =
    "/* note: svelte-ui-kit:start is a marker */\n/* svelte-ui-kit:start tokens */\n/* svelte-ui-kit:end tokens */\n";
  const result = parseManagedCss(text);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.deepEqual(
    result.value.blocks.map((block) => block.id),
    ["tokens"],
  );
});

test("a reserved marker with no valid id is malformed", () => {
  const result = parseManagedCss("/* svelte-ui-kit:start */\n");
  assert.deepEqual(codes(result), ["CSS_MARKER_MALFORMED"]);
});

test("a duplicate start fails", () => {
  const result = parseManagedCss(
    "/* svelte-ui-kit:start tokens */\n/* svelte-ui-kit:end tokens */\n" +
      "/* svelte-ui-kit:start tokens */\n/* svelte-ui-kit:end tokens */\n",
  );
  assert.deepEqual(codes(result), ["CSS_MARKER_DUPLICATE"]);
});

test("an unmatched end fails", () => {
  const result = parseManagedCss("/* svelte-ui-kit:end tokens */\n");
  assert.deepEqual(codes(result), ["CSS_MARKER_UNMATCHED_END"]);
});

test("an unmatched start fails", () => {
  const result = parseManagedCss("/* svelte-ui-kit:start tokens */\n");
  assert.deepEqual(codes(result), ["CSS_MARKER_UNMATCHED_START"]);
});

test("nested markers fail", () => {
  const result = parseManagedCss(
    "/* svelte-ui-kit:start tokens */\n/* svelte-ui-kit:start button */\n" +
      "/* svelte-ui-kit:end button */\n/* svelte-ui-kit:end tokens */\n",
  );
  assert.deepEqual(codes(result), ["CSS_MARKER_NESTED"]);
});

test("an unterminated comment fails", () => {
  const result = parseManagedCss("/* svelte-ui-kit:start tokens\n");
  assert.deepEqual(codes(result), ["CSS_MARKER_MALFORMED"]);
});
