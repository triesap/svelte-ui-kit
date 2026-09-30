import assert from "node:assert/strict";
import { test } from "node:test";

import {
  blocksOwnedBy,
  integrationsOfKind,
  parseKitLock,
} from "../../src/codegen/lock.js";

/**
 * S020 tests: managed CSS blocks are tracked per block (several owners can
 * share one stylesheet), duplicate block IDs and forged indexes fail, and
 * per-target lineage cannot contradict a stored baseline.
 */

const H = (char: string) => char.repeat(64);

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
      { id: "spinner", version: "0.1.0", digest: H("d"), origin: "transitive" },
    ],
    files: [],
    cssBlocks: [],
    integrations: [],
    ...overrides,
  };
}

function codesFor(value: unknown): string[] {
  const result = parseKitLock(value);
  assert.equal(result.ok, false, "expected the lock to fail");
  return result.ok ? [] : result.issues.map((entry) => entry.code);
}

const KIT_CSS = "src/styles/kit.css";

test("multiple owners in one CSS file remain distinguishable", () => {
  const result = parseKitLock(
    base({
      cssBlocks: [
        {
          path: KIT_CSS,
          owner: "button",
          blockId: "button",
          baseHash: H("e"),
          itemVersion: "0.1.0",
          cohort: "core",
        },
        {
          path: KIT_CSS,
          owner: "spinner",
          blockId: "spinner",
          baseHash: H("f"),
          itemVersion: "0.1.0",
          cohort: "core",
        },
      ],
    }),
  );
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    assert.deepEqual(
      blocksOwnedBy(result.value, "button").map((block) => block.blockId),
      ["button"],
    );
    assert.deepEqual(
      blocksOwnedBy(result.value, "spinner").map((block) => block.blockId),
      ["spinner"],
    );
  }
});

test("duplicate block ids fail", () => {
  assert.equal(
    codesFor(
      base({
        cssBlocks: [
          {
            path: KIT_CSS,
            owner: "button",
            blockId: "core",
            baseHash: H("e"),
            itemVersion: "0.1.0",
            cohort: "core",
          },
          {
            path: KIT_CSS,
            owner: "spinner",
            blockId: "core",
            baseHash: H("f"),
            itemVersion: "0.1.0",
            cohort: "core",
          },
        ],
      }),
    ).includes("LOCK_DUPLICATE_BLOCK"),
    true,
  );
});

test("a forged block index is rejected", () => {
  assert.equal(
    codesFor(
      base({
        blockIndex: { button: KIT_CSS },
      }),
    ).includes("SCHEMA_INVALID"),
    true,
  );
});

test("block paths, owners and lineage are validated", () => {
  assert.equal(
    codesFor(
      base({
        cssBlocks: [
          {
            path: "../kit.css",
            owner: "button",
            blockId: "button",
            baseHash: H("e"),
            itemVersion: "0.1.0",
            cohort: "core",
          },
        ],
      }),
    ).includes("LOCK_PATH_INVALID"),
    true,
  );
  assert.equal(
    codesFor(
      base({
        cssBlocks: [
          {
            path: KIT_CSS,
            owner: "ghost",
            blockId: "button",
            baseHash: H("e"),
            itemVersion: "0.1.0",
            cohort: "core",
          },
        ],
      }),
    ).includes("LOCK_OWNER_UNKNOWN"),
    true,
  );
  assert.equal(
    codesFor(
      base({
        cssBlocks: [
          {
            path: KIT_CSS,
            owner: "button",
            blockId: "button",
            baseHash: H("e"),
            itemVersion: "9.9.9",
            cohort: "core",
          },
        ],
      }),
    ).includes("LOCK_LINEAGE_CONTRADICTION"),
    true,
  );
  assert.equal(
    codesFor(
      base({
        files: [
          {
            path: "src/lib/components/ui/button.svelte",
            owner: "button",
            baseHash: H("e"),
            itemVersion: "9.9.9",
            cohort: "core",
          },
        ],
      }),
    ).includes("LOCK_LINEAGE_CONTRADICTION"),
    true,
  );
});

test("integration records parse and duplicate kind/path pairs fail", () => {
  const layout = {
    kind: "layout",
    path: "src/routes/+layout.svelte",
    baseline: H("1"),
    contract: "urn:svelte-ui-kit:schema:v1:kit",
  };
  const stylesheet = {
    kind: "stylesheet",
    path: KIT_CSS,
    baseline: H("2"),
    contract: "theme-v1",
  };
  const good = parseKitLock(base({ integrations: [layout, stylesheet] }));
  assert.equal(good.ok, true, JSON.stringify(good));
  if (good.ok) {
    assert.deepEqual(
      integrationsOfKind(good.value, "layout").map((entry) => entry.path),
      ["src/routes/+layout.svelte"],
    );
  }
  assert.equal(
    codesFor(base({ integrations: [layout, { ...layout }] })).includes(
      "LOCK_DUPLICATE_INTEGRATION",
    ),
    true,
  );
  assert.equal(
    codesFor(
      base({
        integrations: [{ ...layout, kind: "bogus" }],
      }),
    ).includes("SCHEMA_INVALID"),
    true,
  );
});
