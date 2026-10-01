import assert from "node:assert/strict";
import { test } from "node:test";

import {
  findRootBarrelImports,
  renderCompoundBarrel,
  shouldGenerateCompoundBarrel,
  type ExportDeclaration,
} from "../../src/codegen/exports.js";

/**
 * S054 tests: simple and compound items produce different shapes, compound
 * barrels use direct sibling imports, and no unrequested parent barrel is
 * created.
 */

const SIMPLE: ExportDeclaration[] = [
  { name: "Switch", target: "./switch.svelte", kind: "value" },
];

const COMPOUND: ExportDeclaration[] = [
  { name: "Trigger", target: "./trigger.svelte", kind: "value" },
  { name: "Root", target: "./root.svelte", kind: "value" },
];

test("simple and compound items produce different shapes", () => {
  assert.equal(shouldGenerateCompoundBarrel(SIMPLE), false);
  assert.equal(shouldGenerateCompoundBarrel(COMPOUND), true);
  assert.equal(shouldGenerateCompoundBarrel([]), false);
});

test("a compound barrel re-exports its parts with direct sibling imports", () => {
  assert.equal(
    renderCompoundBarrel(COMPOUND),
    'export { Root } from "./root.svelte";\n' +
      'export { Trigger } from "./trigger.svelte";\n',
  );
});

test("imports through the root ui barrel are reported", () => {
  const source = [
    'import { Button } from "$lib/components/ui";',
    'import { Card } from "../index";',
    'import { Trigger } from "./trigger.svelte";',
  ].join("\n");
  const offenders = findRootBarrelImports(
    source,
    new Set(["$lib/components/ui", "../index"]),
  );
  assert.deepEqual(offenders, ["$lib/components/ui", "../index"]);
});

test("a compound barrel without a root-barrel import is clean", () => {
  const source = 'export { Trigger } from "./trigger.svelte";\n';
  assert.deepEqual(findRootBarrelImports(source, new Set(["../index"])), []);
});
