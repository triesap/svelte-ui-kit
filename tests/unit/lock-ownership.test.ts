import assert from "node:assert/strict";
import { test } from "node:test";

import {
  parseKitLock,
  type LockValidationContext,
} from "../../src/codegen/lock.js";

/**
 * RCLD02-R4-1: one complete normalized lock ownership inventory.
 *
 * Every source file, CSS block and integration record contributes a claim to a
 * single comparison. These table-driven cases exercise all role pairs
 * (exact/ASCII-alias/ancestor/reverse-ancestor/disjoint), the required
 * UI/styles/state directory roles, input permutations, valid compound siblings,
 * prefix confusion and compatible aggregate stylesheet sharing through the
 * actual lock parser, with and without validated mapping context.
 */

const H = (char: string) => char.repeat(64);

const CONTEXT: LockValidationContext = {
  uiDir: "src/ui",
  stylesDir: "src/ui/styles",
  stateDir: "src/ui/_kit",
};

function base(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    schemaVersion: 1,
    toolVersion: "0.1.0",
    registryVersion: "0.1.0",
    registryHash: H("a"),
    configHash: H("b"),
    requested: ["button"],
    items: [
      { id: "button", version: "0.1.0", digest: H("c"), origin: "explicit" },
    ],
    files: [],
    cssBlocks: [],
    integrations: [],
    ...overrides,
  };
}

function file(path: string, owner = "button"): Record<string, unknown> {
  return {
    path,
    owner,
    baseHash: H("e"),
    itemVersion: "0.1.0",
    cohort: "core",
  };
}

function block(
  path: string,
  blockId = "button",
  owner = "button",
): Record<string, unknown> {
  return {
    path,
    owner,
    blockId,
    baseHash: H("e"),
    itemVersion: "0.1.0",
    cohort: "core",
  };
}

function integration(
  path: string,
  kind: "layout" | "stylesheet" | "exports" = "layout",
): Record<string, unknown> {
  return { kind, path, baseline: H("e"), contract: "layout-v1" };
}

function codes(result: ReturnType<typeof parseKitLock>): string[] {
  return result.ok ? [] : result.issues.map((entry) => entry.code);
}

interface NegativeCase {
  readonly name: string;
  readonly fields: Record<string, unknown>;
  readonly code: "LOCK_CASE_ALIAS" | "LOCK_PATH_OVERLAP";
  readonly context?: LockValidationContext;
}

const ROLE_CONFLICTS: readonly NegativeCase[] = [
  {
    name: "file vs layout integration at the same exact path",
    fields: {
      files: [file("src/ui/button.svelte")],
      integrations: [integration("src/ui/button.svelte", "layout")],
    },
    code: "LOCK_PATH_OVERLAP",
  },
  {
    name: "file vs stylesheet integration at the same exact path",
    fields: {
      files: [file("src/ui/button.svelte")],
      integrations: [integration("src/ui/button.svelte", "stylesheet")],
    },
    code: "LOCK_PATH_OVERLAP",
  },
  {
    name: "file vs integration ASCII case alias",
    fields: {
      files: [file("src/ui/button.svelte")],
      integrations: [integration("src/ui/Button.svelte")],
    },
    code: "LOCK_CASE_ALIAS",
  },
  {
    name: "file ancestor of a layout integration",
    fields: {
      files: [file("src/ui/part")],
      integrations: [integration("src/ui/part/layout.svelte")],
    },
    code: "LOCK_PATH_OVERLAP",
  },
  {
    name: "layout integration ancestor of a file (reverse order)",
    fields: {
      integrations: [integration("src/ui/part")],
      files: [file("src/ui/part/child.svelte")],
    },
    code: "LOCK_PATH_OVERLAP",
  },
  {
    name: "file ancestor of a CSS block",
    fields: {
      files: [file("src/ui/styles/family")],
      cssBlocks: [block("src/ui/styles/family/kit.css")],
    },
    code: "LOCK_PATH_OVERLAP",
  },
  {
    name: "CSS block ancestor of a file (reverse order)",
    fields: {
      cssBlocks: [block("src/ui/styles/kit.css")],
      files: [file("src/ui/styles/kit.css/child.svelte")],
    },
    code: "LOCK_PATH_OVERLAP",
  },
  {
    name: "CSS block ancestor of a layout integration",
    fields: {
      cssBlocks: [block("src/ui/styles/kit.css")],
      integrations: [integration("src/ui/styles/kit.css/layout.svelte")],
    },
    code: "LOCK_PATH_OVERLAP",
  },
  {
    name: "CSS block vs exports integration at the same exact path",
    fields: {
      cssBlocks: [block("src/ui/styles/kit.css")],
      integrations: [integration("src/ui/styles/kit.css", "exports")],
    },
    code: "LOCK_PATH_OVERLAP",
  },
  {
    name: "CSS block vs stylesheet integration at differently spelled aliases",
    fields: {
      cssBlocks: [block("src/ui/styles/kit.css")],
      integrations: [integration("src/ui/styles/Kit.css", "stylesheet")],
    },
    code: "LOCK_CASE_ALIAS",
  },
  {
    name: "two CSS blocks at differently spelled aliases",
    fields: {
      cssBlocks: [
        block("src/ui/styles/kit.css", "button"),
        block("src/ui/styles/Kit.css", "card", "button"),
      ],
    },
    code: "LOCK_CASE_ALIAS",
  },
  {
    name: "CSS block ancestor of another CSS block",
    fields: {
      cssBlocks: [
        block("src/ui/styles/kit.css", "button"),
        block("src/ui/styles/kit.css/card.css", "card", "button"),
      ],
    },
    code: "LOCK_PATH_OVERLAP",
  },
  {
    name: "layout integration vs stylesheet integration at the same exact path",
    fields: {
      integrations: [
        integration("src/routes/+layout.svelte", "layout"),
        integration("src/routes/+layout.svelte", "stylesheet"),
      ],
    },
    code: "LOCK_PATH_OVERLAP",
  },
  {
    name: "layout integration vs exports integration at the same exact path",
    fields: {
      integrations: [
        integration("src/routes/+layout.svelte", "layout"),
        integration("src/routes/+layout.svelte", "exports"),
      ],
    },
    code: "LOCK_PATH_OVERLAP",
  },
  {
    name: "two integrations at differently spelled aliases",
    fields: {
      integrations: [
        integration("src/routes/+layout.svelte", "layout"),
        integration("src/routes/+Layout.svelte", "exports"),
      ],
    },
    code: "LOCK_CASE_ALIAS",
  },
  {
    name: "integration ancestor of another integration",
    fields: {
      integrations: [
        integration("src/routes/+layout.svelte", "layout"),
        integration("src/routes/+layout.svelte/nested.svelte", "stylesheet"),
      ],
    },
    code: "LOCK_PATH_OVERLAP",
  },
];

test("every cross-role pair fails with a meaningful cause and locator", () => {
  for (const entry of ROLE_CONFLICTS) {
    const result = parseKitLock(
      base(entry.fields),
      "kit.lock.json",
      entry.context ?? CONTEXT,
    );
    assert.equal(result.ok, false, entry.name);
    const found = codes(result);
    assert.equal(found.includes(entry.code), true, `${entry.name}: ${found}`);
    assert.equal(found.includes("SCHEMA_INVALID"), false, entry.name);
    // No unrelated namespace failure may be the only reason the lock fails.
    assert.equal(
      found.includes("LOCK_NAMESPACE") || found.includes("LOCK_RESERVED_STATE"),
      false,
      entry.name,
    );
    for (const issue of result.ok ? [] : result.issues) {
      assert.ok(issue.locator, `${entry.name}: expected a locator`);
    }
  }
});

test("each cross-role conflict is order independent", () => {
  for (const entry of ROLE_CONFLICTS) {
    const reordered: Record<string, unknown> = {};
    for (const key of Object.keys(entry.fields).reverse()) {
      const value = entry.fields[key];
      reordered[key] = Array.isArray(value) ? [...value].reverse() : value;
    }
    const result = parseKitLock(
      base(reordered),
      "kit.lock.json",
      entry.context ?? CONTEXT,
    );
    assert.equal(result.ok, false, entry.name);
    assert.equal(codes(result).includes(entry.code), true, entry.name);
  }
});

test("compatible exact sharing stays valid", () => {
  const shared = parseKitLock(
    base({
      cssBlocks: [
        block("src/ui/styles/kit.css", "button"),
        block("src/ui/styles/kit.css", "card", "button"),
      ],
      integrations: [integration("src/ui/styles/kit.css", "stylesheet")],
    }),
    "kit.lock.json",
    CONTEXT,
  );
  assert.equal(shared.ok, true, JSON.stringify(shared));
});

test("same block identity in one aggregate is still a duplicate", () => {
  const duplicate = parseKitLock(
    base({
      cssBlocks: [
        block("src/ui/styles/kit.css", "button"),
        block("src/ui/styles/kit.css", "button"),
      ],
    }),
    "kit.lock.json",
    CONTEXT,
  );
  assert.equal(duplicate.ok, false);
  assert.equal(codes(duplicate).includes("LOCK_DUPLICATE_BLOCK"), true);
});

test("same integration identity is still a duplicate, not an overlap", () => {
  const duplicate = parseKitLock(
    base({
      integrations: [
        integration("src/routes/+layout.svelte", "layout"),
        integration("src/routes/+layout.svelte", "layout"),
      ],
    }),
    "kit.lock.json",
    CONTEXT,
  );
  assert.equal(duplicate.ok, false);
  const found = codes(duplicate);
  assert.equal(found.includes("LOCK_DUPLICATE_INTEGRATION"), true);
  assert.equal(found.includes("LOCK_PATH_OVERLAP"), false);
});

test("disjoint compound siblings and prefix confusion stay valid", () => {
  const valid = parseKitLock(
    base({
      files: [
        file("src/ui/button/root.svelte"),
        file("src/ui/button/trigger.svelte"),
      ],
      cssBlocks: [block("src/ui/styles/kit.css", "button")],
      integrations: [integration("src/routes/+layout.svelte", "layout")],
    }),
    "kit.lock.json",
    CONTEXT,
  );
  assert.equal(valid.ok, true, JSON.stringify(valid));

  const prefix = parseKitLock(
    base({
      files: [file("src/ui/part")],
      cssBlocks: [block("src/ui/styles/kit.css", "button")],
      integrations: [integration("src/ui/part-extra/layout.svelte", "layout")],
    }),
    "kit.lock.json",
    CONTEXT,
  );
  assert.equal(prefix.ok, true, JSON.stringify(prefix));

  const siblingBlocks = parseKitLock(
    base({
      cssBlocks: [
        block("src/ui/styles/kit.css", "button"),
        block("src/ui/styles/kit-extra.css", "card"),
      ],
    }),
    "kit.lock.json",
    CONTEXT,
  );
  assert.equal(siblingBlocks.ok, true, JSON.stringify(siblingBlocks));
});

test("directory nesting below required directories stays valid", () => {
  const nested = {
    uiDir: "src/ui",
    stylesDir: "src/ui/styles/nested",
    stateDir: "src/ui/_kit",
  } satisfies LockValidationContext;
  const valid = parseKitLock(
    base({
      files: [file("src/ui/components/button.svelte")],
      cssBlocks: [block("src/ui/styles/nested/kit.css", "button")],
      integrations: [integration("src/routes/+layout.svelte", "layout")],
    }),
    "kit.lock.json",
    nested,
  );
  assert.equal(valid.ok, true, JSON.stringify(valid));
});

interface DirectoryCase {
  readonly name: string;
  readonly role: "file" | "integration";
  readonly path: string;
  readonly code: "LOCK_NAMESPACE" | "LOCK_RESERVED_STATE";
}

const DIRECTORY_CONFLICTS: readonly DirectoryCase[] = [
  {
    name: "file equals the UI directory",
    role: "file",
    path: "src/ui",
    code: "LOCK_NAMESPACE",
  },
  {
    name: "file equals the styles directory",
    role: "file",
    path: "src/ui/styles",
    code: "LOCK_NAMESPACE",
  },
  {
    name: "file equals the reserved state directory",
    role: "file",
    path: "src/ui/_kit",
    code: "LOCK_RESERVED_STATE",
  },
  {
    name: "file is an ancestor of the UI directory",
    role: "file",
    path: "src",
    code: "LOCK_NAMESPACE",
  },
  {
    name: "file is an ancestor of the reserved state directory",
    role: "file",
    path: "src/ui",
    code: "LOCK_RESERVED_STATE",
  },
  {
    name: "file is an ancestor of a nested styles directory",
    role: "file",
    path: "src/ui/styles",
    code: "LOCK_NAMESPACE",
  },
  {
    name: "integration equals the UI directory",
    role: "integration",
    path: "src/ui",
    code: "LOCK_NAMESPACE",
  },
  {
    name: "integration equals the styles directory",
    role: "integration",
    path: "src/ui/styles",
    code: "LOCK_NAMESPACE",
  },
  {
    name: "integration equals the reserved state directory",
    role: "integration",
    path: "src/ui/_kit",
    code: "LOCK_RESERVED_STATE",
  },
];

function fieldsFor(
  role: DirectoryCase["role"],
  path: string,
): Record<string, unknown> {
  if (role === "file") return { files: [file(path)] };
  return { integrations: [integration(path, "layout")] };
}

test("no file claim may equal or be an ancestor of a required directory", () => {
  const nested = {
    uiDir: "src/ui",
    stylesDir: "src/ui/styles/nested",
    stateDir: "src/ui/_kit",
  } satisfies LockValidationContext;
  for (const entry of DIRECTORY_CONFLICTS) {
    const context = entry.name.includes("nested") ? nested : CONTEXT;
    const result = parseKitLock(
      base(fieldsFor(entry.role, entry.path)),
      "kit.lock.json",
      context,
    );
    assert.equal(result.ok, false, entry.name);
    const found = codes(result);
    assert.equal(found.includes(entry.code), true, `${entry.name}: ${found}`);
    assert.equal(found.includes("SCHEMA_INVALID"), false, entry.name);
  }
});

test("the same matrix applies without optional mapping context", () => {
  // Structural role conflicts need no mapping context.
  const noContext = parseKitLock(
    base({
      files: [file("src/ui/button.svelte")],
      integrations: [integration("src/ui/button.svelte", "layout")],
    }),
    "kit.lock.json",
  );
  assert.equal(noContext.ok, false);
  assert.equal(codes(noContext).includes("LOCK_PATH_OVERLAP"), true);

  // Required-directory roles are only enforced when a context is supplied.
  const withoutContext = parseKitLock(
    base({ files: [file("src/ui/styles")] }),
    "kit.lock.json",
  );
  assert.equal(withoutContext.ok, true, JSON.stringify(withoutContext));
  const withContext = parseKitLock(
    base({ files: [file("src/ui/styles")] }),
    "kit.lock.json",
    {
      uiDir: "src/ui",
      stylesDir: "src/ui/styles/nested",
      stateDir: "src/ui/_kit",
    },
  );
  assert.equal(withContext.ok, false);
  assert.equal(codes(withContext).includes("LOCK_NAMESPACE"), true);
});
