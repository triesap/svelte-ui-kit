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
import { computeRegistryContentHash } from "../../src/registry/model.js";
import {
  isInstallable,
  validateRegistryHealth,
  validateSchemaIdentities,
} from "../../src/registry/validate.js";

/**
 * S027 tests: the registry health lane validates schema identities and
 * distinguishes installable advertised items from unregistered candidates.
 */

const COMPATIBILITY = { svelte: "^5.57.1", bits: "^2.19.3", date: "^3.8.1" };
const SOURCE_TEXT = '<script lang="ts">export interface X {}</script>\n';

function manifestText(id: string, source: string): string {
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
          source,
          target: `${id}.svelte`,
          kind: "svelte",
          cohort: "core",
        },
      ],
      exports: [{ name: "Button", target: `${id}.svelte`, kind: "value" }],
      styles: [],
    },
    null,
    2,
  )}\n`;
}

function buildHealthFixture(t: { after: (fn: () => void) => void }): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-health-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  cpSync(path.join(process.cwd(), "schema"), path.join(root, "schema"), {
    recursive: true,
  });
  mkdirSync(path.join(root, "registry", "ui"), { recursive: true });
  mkdirSync(path.join(root, "registry", "templates"), { recursive: true });

  const buttonManifest = manifestText("button", "templates/button.svelte");
  writeFileSync(
    path.join(root, "registry", "ui", "button.json"),
    buttonManifest,
  );
  writeFileSync(
    path.join(root, "registry", "templates", "button.svelte"),
    SOURCE_TEXT,
  );

  // An unregistered candidate authoring item: its files exist but the root does
  // not advertise it.
  writeFileSync(
    path.join(root, "registry", "ui", "spinner.json"),
    manifestText("spinner", "templates/spinner.svelte"),
  );
  writeFileSync(
    path.join(root, "registry", "templates", "spinner.svelte"),
    SOURCE_TEXT,
  );

  const assets = [
    { path: "registry/ui/button.json", digest: sha256Hex(buttonManifest) },
    {
      path: "registry/templates/button.svelte",
      digest: sha256Hex(SOURCE_TEXT),
    },
  ];
  const basis = {
    schemaVersion: 1,
    registryVersion: "0.1.0",
    compatibility: COMPATIBILITY,
    items: [{ id: "button", manifest: "ui/button.json" }],
  };
  const contentHash = computeRegistryContentHash(basis, assets);
  writeFileSync(
    path.join(root, "registry", "registry.json"),
    `${JSON.stringify({ ...basis, contentHash }, null, 2)}\n`,
  );
  return root;
}

test("the shipped registry is healthy with no candidates", () => {
  const result = validateRegistryHealth(
    createAssetProvider(path.join(process.cwd())),
  );
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    assert.deepEqual(result.value.advertised, []);
    assert.deepEqual(result.value.candidates, []);
  }
});

test("advertised items are installable and candidates are not", (t) => {
  const root = buildHealthFixture(t);
  const result = validateRegistryHealth(createAssetProvider(root));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) {
    assert.deepEqual(result.value.advertised, ["button"]);
    assert.deepEqual(result.value.candidates, ["registry/ui/spinner.json"]);
    assert.equal(result.value.snapshot.items.length, 1);
    assert.equal(isInstallable(result.value, "button"), true);
    assert.equal(isInstallable(result.value, "spinner"), false);
  }
});

test("a schema identity mismatch fails", (t) => {
  const root = buildHealthFixture(t);
  const kitPath = path.join(root, "schema", "v1", "kit.schema.json");
  const schema = JSON.parse(readFileSync(kitPath, "utf8")) as Record<
    string,
    unknown
  >;
  schema["$id"] = "urn:someone-else:kit";
  writeFileSync(kitPath, `${JSON.stringify(schema, null, 2)}\n`);
  const result = validateSchemaIdentities(createAssetProvider(root));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "SCHEMA_IDENTITY_MISMATCH");
  }
});

test("an advertised item missing its source fails health", (t) => {
  const root = buildHealthFixture(t);
  rmSync(path.join(root, "registry", "templates", "button.svelte"));
  const result = validateRegistryHealth(createAssetProvider(root));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "ASSET_MISSING");
  }
});
