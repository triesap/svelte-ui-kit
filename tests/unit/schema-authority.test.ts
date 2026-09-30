import assert from "node:assert/strict";
import {
  chmodSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { parseKitConfig } from "../../src/project/config.js";
import {
  createAssetProvider,
  type AssetProvider,
} from "../../src/registry/assets.js";
import { buildEmptyDevelopmentRegistry } from "../../src/registry/model.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import {
  createSchemaAuthority,
  defaultSchemaAuthority,
} from "../../src/registry/schema.js";

/**
 * RCLD02-R2-2 schema-authority controls.
 *
 * Every default parser resolves schemas through one contained, provider-bound
 * authority. These controls prove: the installed default works; a missing,
 * escaping or replace-everything schema is a typed failure (never a raw throw
 * or a silently widened schema); a second provider with the same root is not
 * shadowed by a cache; and ordinary I/O failures stay typed and free of host
 * paths.
 */

const COMPATIBILITY = { svelte: "^5.57.1", bits: "^2.19.3", date: "^3.8.1" };

function copySchemas(t: { after: (fn: () => void) => void }): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-authority-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  cpSync(path.join(process.cwd(), "schema"), path.join(root, "schema"), {
    recursive: true,
  });
  return root;
}

function rejectAllSchema(id: string): string {
  return `${JSON.stringify(
    {
      $id: id,
      $schema: "http://json-schema.org/draft-07/schema#",
      not: {},
    },
    null,
    2,
  )}\n`;
}

test("the installed default authority validates against the shipped schemas", () => {
  const authority = defaultSchemaAuthority();
  assert.equal(authority.ok, true, JSON.stringify(authority));
  if (authority.ok) {
    const config = parseKitConfig({ schemaVersion: 1 });
    assert.equal(config.ok, true, JSON.stringify(config));
  }
});

test("a missing shipped schema is a typed failure without throwing", (t) => {
  const root = copySchemas(t);
  rmSync(path.join(root, "schema", "v1", "kit.schema.json"));
  const authority = createSchemaAuthority(createAssetProvider(root));
  assert.equal(authority.ok, false);
  if (!authority.ok) {
    assert.equal(authority.issues[0]?.code, "ASSET_MISSING");
  }
});

test("an escaping schema symlink cannot widen validation", (t) => {
  const root = copySchemas(t);
  const outside = mkdtempSync(path.join(os.tmpdir(), "suik-authority-out-"));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  const external = path.join(outside, "kit.json");
  writeFileSync(external, "{}\n");
  rmSync(path.join(root, "schema", "v1", "kit.schema.json"));
  symlinkSync(external, path.join(root, "schema", "v1", "kit.schema.json"));

  const authority = createSchemaAuthority(createAssetProvider(root));
  assert.equal(authority.ok, false);
  if (!authority.ok) {
    assert.equal(authority.issues[0]?.code, "ASSET_SYMLINK_ESCAPE");
  }
});

test("a replace-everything schema is applied by the config parser", (t) => {
  const root = copySchemas(t);
  writeFileSync(
    path.join(root, "schema", "v1", "kit.schema.json"),
    rejectAllSchema("urn:svelte-ui-kit:schema:v1:kit"),
  );
  const authority = createSchemaAuthority(createAssetProvider(root));
  assert.equal(authority.ok, true, JSON.stringify(authority));
  if (!authority.ok) return;
  const result = parseKitConfig(
    { schemaVersion: 1, unknown: true },
    "kit.json",
    authority.value,
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "SCHEMA_INVALID");
  }
});

test("a warm provider whose schemas are removed fails the next operation", (t) => {
  const root = copySchemas(t);
  mkdirSync(path.join(root, "registry"), { recursive: true });
  const empty = buildEmptyDevelopmentRegistry(COMPATIBILITY);
  assert.equal(typeof empty.contentHash, "string");
  writeFileSync(
    path.join(root, "registry", "registry.json"),
    `${JSON.stringify(empty, null, 2)}\n`,
  );

  const provider = createAssetProvider(root);
  const cold = loadRegistrySnapshot(provider);
  assert.equal(cold.ok, true, JSON.stringify(cold));
  rmSync(path.join(root, "schema"), { recursive: true, force: true });
  const warm = loadRegistrySnapshot(provider);
  assert.equal(warm.ok, false);
  if (!warm.ok) {
    assert.equal(
      warm.issues.some((entry) => entry.code === "ASSET_MISSING"),
      true,
    );
  }
});

test("a same-root provider with replace-everything schemas is not shadowed", (t) => {
  const root = copySchemas(t);
  const first = createAssetProvider(root);

  const second: AssetProvider = {
    root: first.root,
    readBytes: (logicalPath) => first.readBytes(logicalPath),
    exists: (logicalPath) => first.exists(logicalPath),
    list: (prefix) => first.list(prefix),
    readText: (logicalPath) => {
      if (logicalPath === "schema/v1/registry-item.schema.json") {
        return {
          ok: true,
          value: rejectAllSchema("urn:svelte-ui-kit:schema:v1:registry-item"),
        };
      }
      return first.readText(logicalPath);
    },
  };

  const firstAuthority = createSchemaAuthority(first);
  const secondAuthority = createSchemaAuthority(second);
  assert.equal(firstAuthority.ok, true, JSON.stringify(firstAuthority));
  assert.equal(secondAuthority.ok, true, JSON.stringify(secondAuthority));
  if (!firstAuthority.ok || !secondAuthority.ok) return;

  const item = {
    schemaVersion: 1,
    id: "button",
    kind: "component",
    version: "0.1.0",
    description: "fixture",
    compatibility: { svelte: "^5", bits: "^2", date: "^3" },
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
  };
  assert.equal(
    firstAuthority.value.validate("registry-item.schema.json", item).ok,
    true,
  );
  assert.equal(
    secondAuthority.value.validate("registry-item.schema.json", item).ok,
    false,
  );
});

test("ordinary read failures are typed and never leak host paths", (t) => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-authority-io-"));
  t.after(() => {
    chmodSync(path.join(root, "registry", "x.json"), 0o600);
    rmSync(root, { recursive: true, force: true });
  });
  mkdirSync(path.join(root, "registry"), { recursive: true });
  writeFileSync(path.join(root, "registry", "x.json"), "{}\n");
  chmodSync(path.join(root, "registry", "x.json"), 0);
  const provider = createAssetProvider(root);
  const result = provider.readBytes("registry/x.json");
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "ASSET_IO_FAILURE");
    assert.equal(result.issues[0]?.locator, "registry/x.json");
    assert.equal(result.issues[0]?.message.includes(root), false);
  }
});
