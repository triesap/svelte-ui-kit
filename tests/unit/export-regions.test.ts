import assert from "node:assert/strict";
import { test } from "node:test";

import {
  EXPORT_END,
  EXPORT_START,
  findExportCollisions,
  parseExportRegion,
} from "../../src/codegen/export-parse.js";
import type { ModelResult } from "../../src/registry/errors.js";

/**
 * S052 tests: the export region parses at column zero, ignores marker-like
 * strings/templates, fails on duplicate or misordered markers, and inspects
 * application export declarations for collisions.
 */

function codes(result: ModelResult<unknown>): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

test("a managed region is located by exact offsets", () => {
  const source = `${EXPORT_START}\nexport { Button };\n${EXPORT_END}\n`;
  const result = parseExportRegion("index.ts", source);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok || result.value.region === null) return;
  const region = result.value.region;
  assert.equal(
    source.slice(region.startOffset, region.contentStart),
    `${EXPORT_START}\n`,
  );
  assert.equal(
    source.slice(region.contentStart, region.contentEnd),
    "export { Button };\n",
  );
  assert.equal(
    source.slice(region.contentEnd, region.endOffset),
    `${EXPORT_END}\n`,
  );
});

test("marker-like text in a string or template does not create a region", () => {
  const source =
    'const a = "' + EXPORT_START + '";\nconst b = `' + EXPORT_END + "`;\n";
  const result = parseExportRegion("index.ts", source);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.region, null);
});

test("an indented marker is not recognized", () => {
  const source = `  ${EXPORT_START}\n  ${EXPORT_END}\n`;
  const result = parseExportRegion("index.ts", source);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.region, null);
});

test("duplicate and misordered markers fail", () => {
  const duplicate = parseExportRegion(
    "index.ts",
    `${EXPORT_START}\n${EXPORT_START}\n${EXPORT_END}\n`,
  );
  assert.deepEqual(codes(duplicate), ["EXPORT_REGION_DUPLICATE"]);
  const misordered = parseExportRegion(
    "index.ts",
    `${EXPORT_END}\n${EXPORT_START}\n`,
  );
  assert.deepEqual(codes(misordered), ["EXPORT_REGION_ORDER"]);
});

test("application exports, aliases and type exports remain identifiable", () => {
  const source = [
    "// keep this comment",
    'import { x } from "./x";',
    "export { x as y };",
    "export type { Deep } from './types';",
    "export interface Local { a: number }",
    "export const value = 1;",
    EXPORT_START,
    "// managed",
    EXPORT_END,
  ].join("\n");
  const result = parseExportRegion("index.ts", source);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  const names = result.value.appExports.map((entry) => entry.name);
  assert.ok(names.includes("y"));
  assert.ok(names.includes("Local"));
  assert.ok(names.includes("value"));
  assert.equal(result.value.hasWildcardReexport, false);
});

test("marker-free files report no region but still expose app exports", () => {
  const result = parseExportRegion("index.ts", "export const app = 1;\n");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.region, null);
  assert.deepEqual(result.value.appExports, [{ name: "app", kind: "value" }]);
});

test("generated names that collide with app exports are reported", () => {
  const collisions = findExportCollisions(
    [
      { name: "Button", kind: "value" },
      { name: "Local", kind: "type" },
    ],
    [
      { name: "Button", kind: "value" },
      { name: "Card", kind: "value" },
      { name: "Local", kind: "type" },
    ],
  );
  assert.deepEqual(collisions, ["Button", "Local"]);
});
