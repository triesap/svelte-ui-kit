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
import { resolveClosure } from "../../src/registry/resolve.js";
import { transitiveRequests } from "../../src/project/requests.js";
import {
  isInstallable,
  validateRegistryHealth,
  validateResolvedInventory,
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

test("a provided item schema that rejects everything fails health", (t) => {
  const root = buildHealthFixture(t);
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
  const result = validateRegistryHealth(createAssetProvider(root));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.issues.some((entry) => entry.code === "SCHEMA_INVALID"),
      true,
    );
  }
});

test("invalid UTF-8 advertised source bytes fail health", (t) => {
  const root = buildHealthFixture(t);
  writeFileSync(
    path.join(root, "registry", "templates", "button.svelte"),
    Uint8Array.from([0xff, 0xfe]),
  );
  const result = validateRegistryHealth(createAssetProvider(root));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.issues.some((entry) => entry.code === "ASSET_INVALID_UTF8"),
      true,
    );
  }
});

test("a missing provider schema set fails health without throwing", (t) => {
  const root = buildHealthFixture(t);
  rmSync(path.join(root, "schema"), { recursive: true, force: true });
  const result = validateRegistryHealth(createAssetProvider(root));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.issues.some((entry) => entry.code === "ASSET_MISSING"),
      true,
    );
  }
});

interface InventoryItem {
  readonly id: string;
  readonly compatibility?: {
    svelte: string;
    bits: string;
    date: string;
  };
  readonly registryDependencies?: readonly string[];
  readonly npmDependencies?: readonly {
    name: string;
    range: string;
    role: string;
  }[];
  readonly files?: readonly {
    source: string;
    target: string;
    kind: string;
    cohort: string;
  }[];
  readonly exports?: readonly {
    name: string;
    target: string;
    kind: string;
  }[];
  readonly styles?: readonly {
    source: string;
    target: string;
    blockId: string;
    cohort: string;
  }[];
}

/** Build a fully parsed multi-item inventory fixture and register every part. */
function buildInventoryFixture(
  t: { after: (fn: () => void) => void },
  specs: readonly InventoryItem[],
): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-inventory-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  cpSync(path.join(process.cwd(), "schema"), path.join(root, "schema"), {
    recursive: true,
  });
  mkdirSync(path.join(root, "registry", "ui"), { recursive: true });
  mkdirSync(path.join(root, "registry", "templates"), { recursive: true });

  const assets: { path: string; digest: string }[] = [];
  const items: { id: string; manifest: string }[] = [];
  for (const spec of specs) {
    const files = spec.files ?? [
      {
        source: `templates/${spec.id}.svelte`,
        target: `${spec.id}.svelte`,
        kind: "svelte",
        cohort: "core",
      },
    ];
    const exports = spec.exports ?? [
      {
        name: spec.id
          .split("-")
          .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
          .join(""),
        target: `${spec.id}.svelte`,
        kind: "value",
      },
    ];
    const manifest = {
      schemaVersion: 1,
      id: spec.id,
      kind: "component",
      version: "0.1.0",
      description: "inventory item",
      compatibility: spec.compatibility ?? COMPATIBILITY,
      files,
      exports,
      styles: spec.styles ?? [],
      registryDependencies: spec.registryDependencies ?? [],
      npmDependencies: spec.npmDependencies ?? [],
    };
    const text = `${JSON.stringify(manifest, null, 2)}\n`;
    writeFileSync(path.join(root, "registry", "ui", `${spec.id}.json`), text);
    assets.push({
      path: `registry/ui/${spec.id}.json`,
      digest: sha256Hex(text),
    });
    for (const file of files) {
      writeFileSync(path.join(root, "registry", file.source), SOURCE_TEXT);
      assets.push({
        path: `registry/${file.source}`,
        digest: sha256Hex(SOURCE_TEXT),
      });
    }
    for (const style of spec.styles ?? []) {
      const css = `.${style.blockId} {}\n`;
      writeFileSync(path.join(root, "registry", style.source), css);
      assets.push({
        path: `registry/${style.source}`,
        digest: sha256Hex(css),
      });
    }
    items.push({ id: spec.id, manifest: `ui/${spec.id}.json` });
  }
  const basis = {
    schemaVersion: 1,
    registryVersion: "0.1.0",
    compatibility: COMPATIBILITY,
    items,
  };
  writeFileSync(
    path.join(root, "registry", "registry.json"),
    `${JSON.stringify({ ...basis, contentHash: computeRegistryContentHash(basis, assets) }, null, 2)}\n`,
  );
  return root;
}

test("a missing registry dependency fails integrated health", (t) => {
  const root = buildInventoryFixture(t, [
    { id: "button", registryDependencies: ["missing"] },
  ]);
  const result = validateRegistryHealth(createAssetProvider(root));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.issues.some((entry) => entry.code === "RESOLVE_MISSING_ITEM"),
      true,
    );
  }
});

test("a registry cycle fails integrated health", (t) => {
  const root = buildInventoryFixture(t, [
    { id: "button", registryDependencies: ["card"] },
    { id: "card", registryDependencies: ["button"] },
  ]);
  const result = validateRegistryHealth(createAssetProvider(root));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.issues.some((entry) => entry.code === "RESOLVE_CYCLE"),
      true,
    );
  }
});

test("a public export collision fails integrated health", (t) => {
  const root = buildInventoryFixture(t, [
    {
      id: "button",
      exports: [{ name: "Widget", target: "button.svelte", kind: "value" }],
    },
    {
      id: "card",
      exports: [{ name: "Widget", target: "card.svelte", kind: "value" }],
    },
  ]);
  const result = validateRegistryHealth(createAssetProvider(root));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.issues.some((entry) => entry.code === "COLLISION_EXPORT"),
      true,
    );
  }
});

test("an unsupported npm requirement fails integrated health", (t) => {
  const root = buildInventoryFixture(t, [
    {
      id: "button",
      npmDependencies: [{ name: "x", range: "file:../x", role: "runtime" }],
    },
  ]);
  const result = validateRegistryHealth(createAssetProvider(root));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.issues.some((entry) => entry.code === "NPM_RANGE_INVALID"),
      true,
    );
  }
});

test("distinct component blocks may share one aggregate stylesheet", (t) => {
  const root = buildInventoryFixture(t, [
    {
      id: "button",
      styles: [
        {
          source: "templates/button.css",
          target: "kit.css",
          blockId: "button",
          cohort: "core",
        },
      ],
    },
    {
      id: "card",
      styles: [
        {
          source: "templates/card.css",
          target: "kit.css",
          blockId: "card",
          cohort: "core",
        },
      ],
    },
  ]);
  const result = validateRegistryHealth(createAssetProvider(root));
  assert.equal(result.ok, true, JSON.stringify(result));
});

test("a healthy multi-item inventory keeps dependency order and provenance", (t) => {
  const root = buildInventoryFixture(t, [
    {
      id: "button",
      registryDependencies: ["card"],
      npmDependencies: [{ name: "svelte", range: "5.57.1", role: "peer" }],
    },
    {
      id: "card",
      npmDependencies: [{ name: "svelte", range: "^5.33.0", role: "peer" }],
    },
  ]);
  const result = validateRegistryHealth(createAssetProvider(root));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  const closure = resolveClosure(result.value.snapshot, ["button"]);
  assert.equal(closure.ok, true, JSON.stringify(closure));
  if (closure.ok) {
    assert.deepEqual(closure.value.order, ["card", "button"]);
    assert.deepEqual(closure.value.roots, ["button"]);
    assert.deepEqual(transitiveRequests(["button"], closure.value.items), [
      "card",
    ]);
    const operation = validateResolvedInventory(
      result.value.snapshot,
      closure.value.items,
    );
    assert.equal(operation.ok, true, JSON.stringify(operation));
  }
});

test("an advertised item incompatible with the qualified root fails health", (t) => {
  const root = buildInventoryFixture(t, [
    {
      id: "button",
      compatibility: { svelte: "^4", bits: "^1", date: "^2" },
    },
  ]);
  const result = validateRegistryHealth(createAssetProvider(root));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.issues.some((entry) => entry.code === "COMPATIBILITY_CONFLICT"),
      true,
    );
  }
});

test("an advertised peer requirement conflicting with root support fails health", (t) => {
  const root = buildInventoryFixture(t, [
    {
      id: "button",
      npmDependencies: [{ name: "svelte", range: "^4", role: "peer" }],
    },
  ]);
  const result = validateRegistryHealth(createAssetProvider(root));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.issues.some((entry) => entry.code === "COMPATIBILITY_CONFLICT"),
      true,
    );
  }
});

test("ASCII case-alias style targets fail integrated health", (t) => {
  const root = buildInventoryFixture(t, [
    {
      id: "button",
      styles: [
        {
          source: "templates/button.css",
          target: "kit.css",
          blockId: "button",
          cohort: "core",
        },
      ],
    },
    {
      id: "card",
      styles: [
        {
          source: "templates/card.css",
          target: "Kit.css",
          blockId: "card",
          cohort: "core",
        },
      ],
    },
  ]);
  const result = validateRegistryHealth(createAssetProvider(root));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.issues.some(
        (entry) => entry.code === "COLLISION_STYLE_TARGET_CASE",
      ),
      true,
    );
  }
});
