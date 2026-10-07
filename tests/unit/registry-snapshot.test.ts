import assert from "node:assert/strict";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { sha256Hex } from "../../src/codegen/digest.js";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import { computeRegistryContentHash } from "../../src/registry/model.js";

/**
 * S026 tests: the snapshot is validated, identity-checked and immutable, and
 * wrong identities, missing assets and invalid manifests fail deterministically.
 */

const COMPATIBILITY = { svelte: "^5.57.1", bits: "^2.19.3", date: "^3.8.1" };
const SOURCE_TEXT = '<script lang="ts">export interface X {}</script>\n';

function manifestText(id: string): string {
  return `${JSON.stringify(
    {
      schemaVersion: 1,
      id,
      kind: "component",
      version: "0.1.0",
      description: "A sample component.",
      compatibility: COMPATIBILITY,
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
    },
    null,
    2,
  )}\n`;
}

function buildFixture(
  t: { after: (fn: () => void) => void },
  options: { manifestId?: string; rootId?: string } = {},
): string {
  const manifestId = options.manifestId ?? "button";
  const rootId = options.rootId ?? "button";
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-snapshot-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  cpSync(path.join(process.cwd(), "schema"), path.join(root, "schema"), {
    recursive: true,
  });
  mkdirSync(path.join(root, "registry", "ui"), { recursive: true });
  mkdirSync(path.join(root, "registry", "templates"), { recursive: true });
  const manifest = manifestText(manifestId);
  writeFileSync(path.join(root, "registry", "ui", "button.json"), manifest);
  writeFileSync(
    path.join(root, "registry", "templates", "button.svelte"),
    SOURCE_TEXT,
  );
  const assets = [
    { path: "registry/ui/button.json", digest: sha256Hex(manifest) },
    {
      path: "registry/templates/button.svelte",
      digest: sha256Hex(SOURCE_TEXT),
    },
  ];
  const basis = {
    schemaVersion: 1,
    registryVersion: "0.1.0",
    compatibility: COMPATIBILITY,
    items: [{ id: rootId, manifest: "ui/button.json" }],
  };
  const contentHash = computeRegistryContentHash(basis, assets);
  writeFileSync(
    path.join(root, "registry", "registry.json"),
    `${JSON.stringify({ ...basis, contentHash }, null, 2)}\n`,
  );
  return root;
}

test("a valid registry loads into a frozen snapshot", (t) => {
  const root = buildFixture(t);
  const result = loadRegistrySnapshot(createAssetProvider(root));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    assert.equal(result.value.items.length, 1);
    const item = result.value.items[0];
    assert.equal(item.id, "button");
    assert.equal(item.manifest.kind, "component");
    assert.equal(item.files.length, 1);
    assert.equal(item.files[0]?.target, "button.svelte");
    assert.equal(item.files[0]?.digest, sha256Hex(SOURCE_TEXT));
    assert.equal(Object.isFrozen(result.value), true);
    assert.equal(result.value.assets.length, 2);
  }
});

test("provider mutation after snapshot creation cannot change resolved bytes", (t) => {
  const root = buildFixture(t);
  const provider = createAssetProvider(root);
  const result = loadRegistrySnapshot(provider);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const before = result.value.items[0]?.files[0];
  assert.ok(before);
  writeFileSync(
    path.join(root, "registry", "templates", "button.svelte"),
    "changed after snapshot\n",
  );
  assert.equal(before.bytes.length, Buffer.byteLength(SOURCE_TEXT));
  assert.equal(
    new TextDecoder().decode(before.bytes),
    SOURCE_TEXT,
    "snapshot bytes must not change",
  );
  assert.equal(before.digest, sha256Hex(SOURCE_TEXT));
});

test("a manifest whose id disagrees with the root is rejected", (t) => {
  const root = buildFixture(t, { manifestId: "button", rootId: "other" });
  const result = loadRegistrySnapshot(createAssetProvider(root));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "REGISTRY_MANIFEST_ID_MISMATCH");
  }
});

test("a missing manifest and a missing source asset are typed errors", (t) => {
  const missingManifest = buildFixture(t);
  rmSync(path.join(missingManifest, "registry", "ui", "button.json"));
  const manifestResult = loadRegistrySnapshot(
    createAssetProvider(missingManifest),
  );
  assert.equal(manifestResult.ok, false);
  if (!manifestResult.ok) {
    assert.equal(manifestResult.issues[0]?.code, "ASSET_MISSING");
  }

  const missingSource = buildFixture(t);
  rmSync(path.join(missingSource, "registry", "templates", "button.svelte"));
  const sourceResult = loadRegistrySnapshot(createAssetProvider(missingSource));
  assert.equal(sourceResult.ok, false);
  if (!sourceResult.ok) {
    assert.equal(sourceResult.issues[0]?.code, "ASSET_MISSING");
    assert.equal(
      sourceResult.issues[0]?.locator,
      "registry/templates/button.svelte",
    );
  }
});

test("an invalid manifest fails deterministically", (t) => {
  const root = buildFixture(t);
  writeFileSync(
    path.join(root, "registry", "ui", "button.json"),
    "{ not json\n",
  );
  const result = loadRegistrySnapshot(createAssetProvider(root));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "REGISTRY_MANIFEST_INVALID");
  }
});

test("a tampered root content hash is rejected", (t) => {
  const root = buildFixture(t);
  const registryPath = path.join(root, "registry", "registry.json");
  const parsed = JSON.parse(readFileSync(registryPath, "utf8")) as Record<
    string,
    unknown
  >;
  parsed["contentHash"] = "0".repeat(64);
  writeFileSync(registryPath, `${JSON.stringify(parsed, null, 2)}\n`);
  const result = loadRegistrySnapshot(createAssetProvider(root));
  assert.equal(result.ok, false);
  if (!result.ok)
    assert.equal(result.issues[0]?.code, "REGISTRY_HASH_MISMATCH");
});

test("the empty development registry loads with no assets", (t) => {
  const root = buildFixture(t);
  writeFileSync(
    path.join(root, "registry", "registry.json"),
    readFileSync("tests/fixtures/registry/empty.json"),
  );
  const result = loadRegistrySnapshot(createAssetProvider(root));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    assert.deepEqual(result.value.items, []);
    assert.deepEqual(result.value.assets, []);
  }
});

test("a snapshot is deeply immutable and byte views are defensive copies", (t) => {
  const root = buildFixture(t);
  const result = loadRegistrySnapshot(createAssetProvider(root));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  const snapshot = result.value;
  const item = snapshot.items[0];
  assert.ok(item);
  const file = item.files[0];
  assert.ok(file);

  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(item), true);
  assert.equal(Object.isFrozen(item.manifest), true);
  assert.equal(Object.isFrozen(item.manifest.registryDependencies), true);
  assert.equal(Object.isFrozen(item.files), true);
  assert.equal(Object.isFrozen(file), true);
  assert.equal(Object.isFrozen(snapshot.assets[0]), true);

  // Mutating the exposed bytes must not change the stored copy or the digest.
  const original = [...file.bytes];
  file.bytes[0] = 0;
  assert.deepEqual([...file.bytes], original);
  assert.equal(sha256Hex(file.bytes), file.digest);

  // Deeply frozen records reject later mutation attempts.
  assert.equal(Reflect.set(snapshot.root, "registryVersion", "changed"), false);
  assert.equal(snapshot.root.registryVersion, "0.1.0");
});

test("missing provider schemas fail the snapshot", (t) => {
  const root = buildFixture(t);
  rmSync(path.join(root, "schema"), { recursive: true, force: true });
  const result = loadRegistrySnapshot(createAssetProvider(root));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.issues.some((entry) => entry.code === "ASSET_MISSING"),
      true,
    );
  }
});

test("a provider item schema that rejects everything fails the snapshot", (t) => {
  const root = buildFixture(t);
  writeFileSync(
    path.join(root, "schema", "v1", "registry-item.schema.json"),
    `${JSON.stringify(
      {
        $id: "urn:svelte-ui-kit:schema:v1:registry-item",
        $schema: "http://json-schema.org/draft-07/schema#",
        not: {},
      },
      null,
      2,
    )}\n`,
  );
  const result = loadRegistrySnapshot(createAssetProvider(root));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.issues.some((entry) => entry.code === "SCHEMA_INVALID"),
      true,
    );
  }
});

test("a non-object provider schema fails without throwing", (t) => {
  const root = buildFixture(t);
  writeFileSync(path.join(root, "schema", "v1", "kit.schema.json"), "null");
  const result = loadRegistrySnapshot(createAssetProvider(root));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "SCHEMA_INVALID_DOCUMENT");
  }
});

test("invalid UTF-8 source bytes fail the snapshot", (t) => {
  const root = buildFixture(t);
  writeFileSync(
    path.join(root, "registry", "templates", "button.svelte"),
    Uint8Array.from([0xff, 0xfe]),
  );
  const result = loadRegistrySnapshot(createAssetProvider(root));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.issues.some((entry) => entry.code === "ASSET_INVALID_UTF8"),
      true,
    );
  }
});
