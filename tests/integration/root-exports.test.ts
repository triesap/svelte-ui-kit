import assert from "node:assert/strict";
import { test } from "node:test";

import {
  patchExportRegion,
  renderExportLines,
  type ExportDeclaration,
} from "../../src/codegen/exports.js";

/**
 * S053 tests: the root export region renders exact declared names with direct
 * targets, patching only the managed region is idempotent, and an app-owned
 * duplicate symbol is a nonmutating conflict.
 */

const DECLARATIONS: ExportDeclaration[] = [
  { name: "Button", target: "./button.svelte", kind: "value" },
  { name: "Card", target: "./card.svelte", kind: "value" },
  { name: "ButtonProps", target: "./button.svelte", kind: "type" },
];

test("rendered exports use exact declared names and direct targets", () => {
  const lines = renderExportLines(DECLARATIONS);
  assert.equal(
    lines,
    'export { Button } from "./button.svelte";\n' +
      'export type { ButtonProps } from "./button.svelte";\n' +
      'export { Card } from "./card.svelte";\n',
  );
});

test("a marker-free barrel receives a minimal managed region", () => {
  const source = 'import "./app.css";\nexport const appOwned = 1;\n';
  const result = patchExportRegion("index.ts", source, DECLARATIONS);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.ok(result.value.startsWith(source), "application bytes preserved");
  assert.ok(result.value.includes('export { Button } from "./button.svelte";'));
});

test("patching the managed region is idempotent", () => {
  const once = patchExportRegion("index.ts", "", DECLARATIONS);
  assert.equal(once.ok, true);
  if (!once.ok) return;
  const twice = patchExportRegion("index.ts", once.value, DECLARATIONS);
  assert.equal(twice.ok, true);
  if (!twice.ok) return;
  assert.equal(twice.value, once.value);
});

test("an app-owned duplicate symbol is a nonmutating conflict", () => {
  const source = "export const Card = 1;\n";
  const result = patchExportRegion("index.ts", source, DECLARATIONS);
  assert.equal(result.ok, false, JSON.stringify(result));
  if (result.ok) return;
  assert.deepEqual(
    result.issues.map((entry) => entry.code),
    ["EXPORT_SYMBOL_COLLISION"],
  );
});

test("only the managed region content changes", () => {
  const source =
    "// keep\n" +
    "// svelte-ui-kit:start exports\n" +
    "// old\n" +
    "// svelte-ui-kit:end exports\n" +
    "export const tail = 1;\n";
  const result = patchExportRegion("index.ts", source, DECLARATIONS);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.ok(
    result.value.startsWith("// keep\n// svelte-ui-kit:start exports\n"),
  );
  assert.ok(result.value.endsWith("export const tail = 1;\n"));
  assert.ok(!result.value.includes("// old"));
});
