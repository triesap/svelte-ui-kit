import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseKitConfig,
  serializeKitConfig,
  DEFAULT_KIT_CONFIG,
} from "../../src/project/config.js";
import { parseKitLock } from "../../src/codegen/lock.js";
import { parseJournal } from "../../src/codegen/transaction-journal.js";
import { SHIPPED_SCHEMAS } from "../../src/registry/schema.js";
import { TOOL_VERSION } from "../../src/registry/versions.js";

const targets = ["sveltekit", "astro", "svelte-library"] as const;
for (const target of targets) {
  test(`${target}: canonical1 requires explicit target and exactly one mapping role`, () => {
    const mapping =
      target === "svelte-library"
        ? { styleEntry: "src/styles/index.css" }
        : {
            layoutFile:
              target === "astro"
                ? "src/layouts/Layout.astro"
                : "src/routes/+layout.svelte",
          };
    const raw = { schemaVersion: 1, target, ...mapping };
    const valid = parseKitConfig(raw);
    assert.ok(valid.ok, JSON.stringify(valid));
    assert.deepEqual(valid.value.requested, []);
    assert.equal(valid.value.uiDir, DEFAULT_KIT_CONFIG.uiDir);
    assert.equal(valid.value.stylesDir, DEFAULT_KIT_CONFIG.stylesDir);
    assert.equal(valid.value.toolVersion, TOOL_VERSION);
    const written = serializeKitConfig({
      ...valid.value,
      toolVersion: "9.9.9",
    });
    assert.equal(JSON.parse(written).toolVersion, TOOL_VERSION);
    const reread = parseKitConfig(JSON.parse(written));
    assert.ok(reread.ok);
    assert.equal(serializeKitConfig(reread.value), written);

    for (const value of [
      { ...raw, schemaVersion: 2 },
      { ...raw, schemaVersion: "1" },
      { ...raw, target: [target] },
      { ...raw, unknown: true },
      {
        ...raw,
        ...(target === "svelte-library"
          ? { layoutFile: "src/false.svelte" }
          : { styleEntry: "src/false.css" }),
      },
    ])
      assert.equal(parseKitConfig(value).ok, false, JSON.stringify(value));
    const retired: Record<string, unknown> = { ...raw };
    delete retired.target;
    assert.equal(parseKitConfig(retired).ok, false);
    assert.equal(parseKitConfig({ schemaVersion: 1, target }).ok, false);
  });
  test(`${target}: canonical lock target, roles and independent journal3 are strict`, () => {
    const lock = {
      schemaVersion: 1,
      target,
      toolVersion: TOOL_VERSION,
      registryVersion: "0.1.6",
      registryHash: "a".repeat(64),
      configHash: "b".repeat(64),
      requested: [],
      items: [],
      files: [],
      cssBlocks: [],
      integrations: [
        {
          kind: target === "svelte-library" ? "stylesheet-entry" : "layout",
          path:
            target === "svelte-library"
              ? "src/styles/index.css"
              : target === "astro"
                ? "src/layouts/Layout.astro"
                : "src/routes/+layout.svelte",
          contract:
            target === "svelte-library"
              ? "library-styles-v1"
              : target === "astro"
                ? "astro-layout-v1"
                : "layout-v1",
          baseline: "c".repeat(64),
        },
        {
          kind: "stylesheet",
          path: "src/styles/kit.css",
          contract: "foundation-tokens-v1",
          baseline: "d".repeat(64),
        },
        {
          kind: "exports",
          path: "src/lib/components/ui/index.ts",
          contract: "exports-v1",
          baseline: "e".repeat(64),
        },
      ],
    };
    assert.ok(parseKitLock(lock).ok);
    const retired: Record<string, unknown> = { ...lock };
    delete retired.target;
    for (const value of [
      retired,
      { ...lock, schemaVersion: 2 },
      { ...lock, target: [target] },
      { ...lock, integrations: lock.integrations.slice(1) },
      { ...lock, integrations: [...lock.integrations, lock.integrations[0]] },
    ])
      assert.equal(parseKitLock(value).ok, false, JSON.stringify(value));
    const journal = {
      schemaVersion: 3,
      target,
      transactionId: "0123456789abcdef0123456789abcdef",
      rootIdentity: "a".repeat(64),
      planDigest: "b".repeat(64),
      phase: "prepared",
      operations: [],
      lock: null,
      createdDirs: [],
      ignoreFiles: [],
    };
    assert.ok(parseJournal(JSON.stringify(journal)).ok);
    for (const value of [
      { ...journal, schemaVersion: 1 },
      { ...journal, schemaVersion: 2 },
      { ...journal, phase: "planned" },
      { ...journal, target: [target] },
      { ...journal, target: { toString: 0, valueOf: 0 } },
      { ...journal, phase: { toString: 0, valueOf: 0 } },
      { ...journal, createdDirs: [{ path: "src", device: 1, inode: 2 }] },
      {
        ...journal,
        createdDirs: [
          {
            path: "src",
            device: { toString: 0, valueOf: 0 },
            inode: 2,
            mode: 0o755,
          },
        ],
      },
    ]) {
      assert.doesNotThrow(() =>
        assert.equal(parseJournal(JSON.stringify(value)).ok, false),
      );
    }
    for (const key of ["target", "createdDirs", "ignoreFiles"]) {
      const absent: Record<string, unknown> = { ...journal };
      delete absent[key];
      assert.equal(parseJournal(JSON.stringify(absent)).ok, false);
    }
  });
}
test("project IDs are fresh while the eight independent identities remain separate", () => {
  assert.equal(Object.keys(SHIPPED_SCHEMAS).length, 10);
  assert.equal(
    SHIPPED_SCHEMAS["kit.schema.json"],
    "urn:svelte-ui-kit:schema:v1:project-config",
  );
  assert.equal(
    SHIPPED_SCHEMAS["kit-lock.schema.json"],
    "urn:svelte-ui-kit:schema:v1:install-lock",
  );
  for (const old of [
    "urn:svelte-ui-kit:schema:v1:kit",
    "urn:svelte-ui-kit:schema:v1:kit-lock",
    "urn:svelte-ui-kit:schema:v2:kit",
    "urn:svelte-ui-kit:schema:v2:kit-lock",
  ])
    assert.equal(Object.values(SHIPPED_SCHEMAS).includes(old), false);
});
