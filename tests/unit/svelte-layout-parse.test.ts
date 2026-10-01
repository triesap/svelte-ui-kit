import assert from "node:assert/strict";
import { test } from "node:test";

import { parseSvelteLayout } from "../../src/codegen/svelte-parse.js";

/**
 * S055 tests: instance, module and no-script layouts parse into precise spans,
 * existing imports are reported, unsupported syntax is a typed failure, and
 * parsing never mutates the source.
 */

test("no-script layouts are classified", () => {
  const source = "<main><slot /></main>\n";
  const result = parseSvelteLayout(source);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.kind, "no-script");
  assert.equal(result.value.instance, null);
  assert.equal(result.value.module, null);
});

test("an instance script yields its content span and imports", () => {
  const source =
    "<script>\n  import x from './x';\n  let a = 1;\n</script>\n<slot />\n";
  const result = parseSvelteLayout(source);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.kind, "instance");
  assert.ok(result.value.instance !== null);
  assert.deepEqual(result.value.instanceImports, ["./x"]);
  assert.equal(result.value.instance?.langTs, false);
  if (result.value.instance !== null) {
    assert.equal(
      source.slice(result.value.instance.start, result.value.instance.end),
      "\n  import x from './x';\n  let a = 1;\n",
    );
  }
});

test("a TypeScript instance script is detected", () => {
  const source = '<script lang="ts">export interface X {}</script>\n';
  const result = parseSvelteLayout(source);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.instance?.langTs, true);
});

test("a module script only layout is classified", () => {
  const source =
    "<script module>\n  export const prerender = true;\n</script>\n";
  const result = parseSvelteLayout(source);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.kind, "module-only");
  assert.equal(result.value.instance, null);
  assert.ok(result.value.module !== null);
});

test("comments around scripts still parse", () => {
  const source =
    "<!-- top -->\n<script>\n  // comment\n  import x from './x';\n</script>\n";
  const result = parseSvelteLayout(source);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.deepEqual(result.value.instanceImports, ["./x"]);
});

test("unsupported syntax is a typed failure", () => {
  const result = parseSvelteLayout("<script>let a = ;</script>");
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.deepEqual(
      result.issues.map((entry) => entry.code),
      ["LAYOUT_PARSE_UNSUPPORTED"],
    );
  }
});

test("parsing does not mutate the source string", () => {
  const source = "<script>let a = 1;</script>\n";
  const copy = `${source}`;
  parseSvelteLayout(source);
  assert.equal(source, copy);
});
