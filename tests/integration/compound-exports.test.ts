import assert from "node:assert/strict";
import { test } from "node:test";

import {
  findRootBarrelImports,
  findRootBarrelImportsInSource,
  renderCompoundBarrel,
  rootBarrelSpecifiers,
  shouldGenerateCompoundBarrel,
  type ExportDeclaration,
} from "../../src/codegen/exports.js";
import {
  parseRegistryItem,
  type RegistryItem,
} from "../../src/registry/item.js";

/**
 * S054 tests: simple and compound items produce different shapes, compound
 * barrels use direct sibling imports, and no unrequested parent barrel is
 * created. RCLD03-R4-2 makes the compound decision manifest-authoritative.
 */

const COMPOUND: ExportDeclaration[] = [
  { name: "Trigger", target: "./trigger.svelte", kind: "value" },
  { name: "Root", target: "./root.svelte", kind: "value" },
];

function item(overrides: Record<string, unknown>): RegistryItem {
  const result = parseRegistryItem({
    schemaVersion: 1,
    id: "button",
    kind: "component",
    version: "0.1.0",
    description: "A component.",
    compatibility: { svelte: "^5.57.1", bits: "^2.19.3", date: "^3.8.1" },
    files: [
      {
        source: "templates/button.svelte",
        target: "button.svelte",
        kind: "svelte",
        cohort: "core",
      },
    ],
    exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
    styles: [],
    ...overrides,
  });
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.value;
}

test("simple and compound items produce different shapes", () => {
  const simple = item({});
  assert.equal(shouldGenerateCompoundBarrel(simple), false);
  const compound = item({
    id: "dialog",
    description: "A dialog family.",
    files: [
      {
        source: "templates/dialog/index.ts",
        target: "dialog/index.ts",
        kind: "typescript",
        cohort: "dialog",
      },
      {
        source: "templates/dialog/root.svelte",
        target: "dialog/root.svelte",
        kind: "svelte",
        cohort: "dialog",
      },
    ],
    exports: [{ name: "DialogRoot", target: "dialog/index.ts", kind: "value" }],
  });
  assert.equal(shouldGenerateCompoundBarrel(compound), true);
});

/**
 * RCLD03-R2-3/R4-2: a flat component plus its type export is not a compound
 * item, and a component with no public exports never generates a barrel.
 */
test("a flat component plus a type export is not compound", () => {
  const flat = item({
    files: [
      {
        source: "templates/button.svelte",
        target: "button.svelte",
        kind: "svelte",
        cohort: "core",
      },
      {
        source: "templates/button.types.ts",
        target: "button.types.ts",
        kind: "typescript",
        cohort: "core",
      },
    ],
    exports: [
      { name: "Button", target: "button.svelte", kind: "value" },
      { name: "ButtonProps", target: "button.types.ts", kind: "type" },
    ],
  });
  assert.equal(shouldGenerateCompoundBarrel(flat), false);
  const noExports = item({ exports: [] });
  assert.equal(shouldGenerateCompoundBarrel(noExports), false);
});

test("a compound barrel re-exports its parts with direct sibling imports", () => {
  assert.equal(
    renderCompoundBarrel(COMPOUND),
    'export { default as Root } from "./root.svelte";\n' +
      'export { default as Trigger } from "./trigger.svelte";\n',
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

test("root-barrel specifiers cover extension, directory and $lib spellings", () => {
  const from = "src/lib/components/ui/button.svelte";
  const set = rootBarrelSpecifiers(from, "src/lib/components/ui/index.ts");
  for (const specifier of [
    "./index",
    "./index.js",
    "./index.ts",
    ".",
    "$lib/components/ui",
    "$lib/components/ui/index.js",
  ]) {
    assert.ok(set.has(specifier), `${specifier} must be recognized`);
  }
  const nested = rootBarrelSpecifiers(
    "src/lib/components/ui/dialog/root.svelte",
    "src/lib/components/ui/index.ts",
  );
  assert.ok(nested.has("../index"));
  assert.ok(nested.has("../index.js"));
});

test("svelte script imports of the root barrel are detected structurally", () => {
  const set = rootBarrelSpecifiers(
    "src/lib/components/ui/button.svelte",
    "src/lib/components/ui/index.ts",
  );
  const svelte =
    '<script lang="ts">\nimport { Button } from "./index.js";\n</script>\n<button>hi</button>\n';
  assert.deepEqual(
    findRootBarrelImportsInSource("button.svelte", svelte, set),
    ["./index.js"],
  );
  const markupOnly =
    "<script>export let x;</script>\n<p>not an import: ./index.js</p>\n";
  assert.deepEqual(
    findRootBarrelImportsInSource("button.svelte", markupOnly, set),
    [],
  );
});
