import assert from "node:assert/strict";
import { test } from "node:test";

import {
  isCompoundComponent,
  isCssOnlyFoundation,
  isSafeTarget,
  parseRegistryItem,
} from "../../src/registry/item.js";

/**
 * S017 tests: simple, compound and CSS-only sample items validate, while wrong
 * file kinds, duplicate exports, malformed targets and invented foundation
 * sources fail.
 */

function base(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    schemaVersion: 1,
    id: "button",
    kind: "component",
    version: "0.1.0",
    description: "A native button.",
    compatibility: { svelte: "^5.57.1", bits: "^2.19.3", date: "^3.8.1" },
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
      { name: "ButtonVariant", target: "button.types.ts", kind: "type" },
    ],
    styles: [
      {
        source: "styles/button.css",
        target: "kit.css",
        blockId: "button",
        cohort: "core",
      },
    ],
    ...overrides,
  };
}

function codesFor(value: unknown): string[] {
  const result = parseRegistryItem(value);
  assert.equal(result.ok, false, "expected the item to fail");
  return result.ok ? [] : result.issues.map((entry) => entry.code);
}

test("simple, compound and CSS-only sample items validate", () => {
  const simple = parseRegistryItem(base({}));
  assert.equal(simple.ok, true, JSON.stringify(simple));
  if (simple.ok) {
    assert.equal(isCompoundComponent(simple.value), false);
    assert.equal(isCssOnlyFoundation(simple.value), false);
  }

  const compound = parseRegistryItem(
    base({
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
      exports: [
        { name: "DialogRoot", target: "dialog/index.ts", kind: "value" },
      ],
      styles: [
        {
          source: "styles/dialog.css",
          target: "kit.css",
          blockId: "dialog",
          cohort: "dialog",
        },
      ],
    }),
  );
  assert.equal(compound.ok, true, JSON.stringify(compound));
  if (compound.ok) assert.equal(isCompoundComponent(compound.value), true);

  const cssOnly = parseRegistryItem({
    schemaVersion: 1,
    id: "tokens",
    kind: "foundation",
    version: "0.1.0",
    description: "Semantic design tokens.",
    compatibility: { svelte: "^5.57.1", bits: "^2.19.3", date: "^3.8.1" },
    files: [],
    exports: [],
    styles: [
      {
        source: "styles/tokens.css",
        target: "kit.css",
        blockId: "tokens",
        cohort: "tokens",
      },
    ],
  });
  assert.equal(cssOnly.ok, true, JSON.stringify(cssOnly));
  if (cssOnly.ok) assert.equal(isCssOnlyFoundation(cssOnly.value), true);
});

test("wrong file kinds fail", () => {
  const codes = codesFor(
    base({
      files: [
        {
          source: "templates/button.ts",
          target: "button.ts",
          kind: "svelte",
          cohort: "core",
        },
      ],
      exports: [],
    }),
  );
  assert.equal(codes.includes("ITEM_FILE_KIND_MISMATCH"), true);
  assert.equal(codes.includes("ITEM_COMPONENT_FILES_MISSING"), true);
});

test("duplicate local exports fail", () => {
  const codes = codesFor(
    base({
      exports: [
        { name: "Button", target: "button.svelte", kind: "value" },
        { name: "Button", target: "button.types.ts", kind: "type" },
      ],
    }),
  );
  assert.equal(codes.includes("ITEM_DUPLICATE_EXPORT"), true);
});

test("malformed and unsafe targets fail", () => {
  for (const target of [
    "../button.svelte",
    "/button.svelte",
    "a//b.svelte",
    "src/button.svelte",
    "button.svelte/",
    "button.ts",
  ]) {
    const codes = codesFor(
      base({
        files: [
          {
            source: "templates/x",
            target,
            kind: target.endsWith(".ts") ? "typescript" : "svelte",
            cohort: "core",
          },
        ],
        exports: [],
      }),
    );
    assert.equal(
      codes.length > 0,
      true,
      `${target} must fail: ${codes.join(",")}`,
    );
  }
  assert.equal(isSafeTarget("button.svelte", ".svelte"), true);
  assert.equal(isSafeTarget("../button.svelte", ".svelte"), false);
});

test("a foundation cannot invent a source file or export", () => {
  const codes = codesFor({
    schemaVersion: 1,
    id: "tokens",
    kind: "foundation",
    version: "0.1.0",
    description: "Semantic design tokens.",
    compatibility: { svelte: "^5.57.1", bits: "^2.19.3", date: "^3.8.1" },
    files: [],
    exports: [{ name: "TokenContract", target: "tokens.ts", kind: "type" }],
    styles: [],
  });
  assert.equal(codes.includes("ITEM_EXPORT_TARGET_UNKNOWN"), true);
  assert.equal(codes.includes("ITEM_FOUNDATION_SOURCE_INVENTED"), true);
});

test("compound components require their index and directory layout", () => {
  const codes = codesFor(
    base({
      id: "dialog",
      files: [
        {
          source: "templates/dialog/root.svelte",
          target: "dialog/root.svelte",
          kind: "svelte",
          cohort: "dialog",
        },
      ],
      exports: [],
    }),
  );
  assert.equal(codes.includes("ITEM_COMPOUND_INDEX_MISSING"), true);
});

test("unknown export targets and duplicate blocks fail", () => {
  assert.equal(
    codesFor(
      base({
        exports: [{ name: "Button", target: "missing.svelte", kind: "value" }],
      }),
    ).includes("ITEM_EXPORT_TARGET_UNKNOWN"),
    true,
  );
  assert.equal(
    codesFor(
      base({
        styles: [
          {
            source: "styles/a.css",
            target: "kit.css",
            blockId: "button",
            cohort: "core",
          },
          {
            source: "styles/b.css",
            target: "kit.css",
            blockId: "button",
            cohort: "core",
          },
        ],
      }),
    ).includes("ITEM_DUPLICATE_BLOCK"),
    true,
  );
});
