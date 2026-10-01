import assert from "node:assert/strict";
import { test } from "node:test";
import { parse } from "svelte/compiler";

import { patchLayoutImports } from "../../src/codegen/svelte.js";
import type { ModelResult } from "../../src/registry/errors.js";

/**
 * S056 tests: ordered kit/themes/app imports are inserted minimally, repeated
 * patching is unchanged, existing rendering and module scripts survive, and an
 * unsupported order is reported without mutation.
 */

const IMPORTS = [
  { specifier: "$lib/styles/kit.css" },
  { specifier: "$lib/styles/themes.css" },
  { specifier: "$lib/styles/app.css" },
];

function codes(result: ModelResult<unknown>): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

test("a no-script layout receives a created ordered instance script", () => {
  const source = "<main><slot /></main>\n";
  const result = patchLayoutImports(source, IMPORTS);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.ok(result.value.startsWith("<script>\n"));
  const kit = result.value.indexOf("$lib/styles/kit.css");
  const themes = result.value.indexOf("$lib/styles/themes.css");
  const app = result.value.indexOf("$lib/styles/app.css");
  assert.ok(kit < themes && themes < app, result.value);
  assert.ok(result.value.includes("<main><slot /></main>"));
});

test("existing imports and rendering are preserved and missing ones inserted", () => {
  const source =
    "<script>\n  import Existing from './Existing.svelte';\n  let n = 1;\n</script>\n<Existing {n} />\n";
  const result = patchLayoutImports(source, IMPORTS);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.ok(result.value.includes("import Existing from './Existing.svelte';"));
  assert.ok(result.value.includes("let n = 1;"));
  assert.ok(result.value.includes("<Existing {n} />"));
  assert.ok(result.value.includes('import "$lib/styles/kit.css";'));
});

test("a partially present import set only adds the missing ones", () => {
  const source = '<script>\n  import "$lib/styles/kit.css";\n</script>\n';
  const result = patchLayoutImports(source, IMPORTS);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(
    result.value.match(/\$lib\/styles\/kit\.css/g)?.length,
    1,
    "kit is not duplicated",
  );
  assert.ok(result.value.includes("themes.css"));
  assert.ok(result.value.includes("app.css"));
});

test("repeated patch is unchanged", () => {
  const source = "<script>\n  let n = 1;\n</script>\n";
  const once = patchLayoutImports(source, IMPORTS);
  assert.equal(once.ok, true);
  if (!once.ok) return;
  const twice = patchLayoutImports(once.value, IMPORTS);
  assert.equal(twice.ok, true);
  if (!twice.ok) return;
  assert.equal(twice.value, once.value);
});

test("a module script survives untouched", () => {
  const source =
    "<script module>\n  export const prerender = true;\n</script>\n<slot />\n";
  const result = patchLayoutImports(source, IMPORTS);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.ok(result.value.includes("export const prerender = true;"));
});

test("an out-of-order existing import set is a safe conflict", () => {
  const source =
    "<script>\n" +
    '  import "$lib/styles/app.css";\n' +
    '  import "$lib/styles/kit.css";\n' +
    "</script>\n";
  const result = patchLayoutImports(source, IMPORTS);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(codes(result), ["LAYOUT_IMPORT_ORDER"]);
});

function astInstanceImports(source: string): string[] {
  const ast = parse(source, { modern: true }) as {
    instance?: {
      content: { body: { type: string; source: { value: string } }[] };
    };
  };
  return (ast.instance?.content.body ?? [])
    .filter((node) => node.type === "ImportDeclaration")
    .map((node) => node.source.value);
}

/**
 * RCLD03-R2-3: an app-only import is reordered into the kit/themes/app order,
 * and the resulting AST has exactly the approved imports.
 */
test("an app-only import is completed in the correct order", () => {
  const source =
    '<script>\nimport "$lib/styles/app.css";\n</script>\n<main />\n';
  const result = patchLayoutImports(source, IMPORTS);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.deepEqual(astInstanceImports(result.value), [
    "$lib/styles/kit.css",
    "$lib/styles/themes.css",
    "$lib/styles/app.css",
  ]);
});

/**
 * RCLD03-R2-3: an inline one-line import list is not duplicated.
 */
test("an inline one-line import list is not duplicated", () => {
  const source =
    '<script>import "$lib/styles/kit.css"; import "$lib/styles/themes.css"; import "$lib/styles/app.css";</script>\n';
  const result = patchLayoutImports(source, IMPORTS);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.deepEqual(astInstanceImports(result.value), [
    "$lib/styles/kit.css",
    "$lib/styles/themes.css",
    "$lib/styles/app.css",
  ]);
});

/**
 * RCLD03-R2-3: import-like text inside a comment or template does not
 * suppress a real insertion.
 */
test("import-like text in a comment or template does not suppress insertion", () => {
  const source =
    '<script>\n/*\nimport "$lib/styles/kit.css";\n*/\nlet t = `\nimport "$lib/styles/app.css";\n`;\n</script>\n';
  const result = patchLayoutImports(source, IMPORTS);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.deepEqual(astInstanceImports(result.value), [
    "$lib/styles/kit.css",
    "$lib/styles/themes.css",
    "$lib/styles/app.css",
  ]);
  assert.ok(result.value.includes("/*"));
});

/**
 * RCLD03-R2-3: an approved import that lives in the module script is a precise
 * conflict, not a silent duplicate.
 */
test("an approved import in the module script is a conflict", () => {
  const source =
    '<script module>\nimport "$lib/styles/kit.css";\n</script>\n<slot />\n';
  const result = patchLayoutImports(source, IMPORTS);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(codes(result), ["LAYOUT_IMPORT_MODULE_CONFLICT"]);
});
