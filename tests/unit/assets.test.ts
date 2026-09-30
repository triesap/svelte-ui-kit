import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  createAssetProvider,
  createInstalledAssetProvider,
  createSourceAssetProvider,
  normalizeAssetPath,
} from "../../src/registry/assets.js";

/**
 * S025 tests: assets load relative to an explicit package root, and traversal,
 * missing/nontext assets, symlink escapes and invalid UTF-8 are typed errors.
 */

function tempRoot(prefix = "suik-assets-"): string {
  return mkdtempSync(path.join(os.tmpdir(), prefix));
}

test("the installed provider reads the bundled registry and schema", () => {
  const provider = createInstalledAssetProvider();
  const registry = provider.readText("registry/registry.json");
  assert.equal(registry.ok, true, JSON.stringify(registry));
  if (registry.ok) {
    const parsed = JSON.parse(registry.value) as { schemaVersion: number };
    assert.equal(parsed.schemaVersion, 1);
  }
  const schema = provider.readText("schema/v1/kit.schema.json");
  assert.equal(schema.ok, true);
  const bytes = provider.readBytes("registry/registry.json");
  assert.equal(bytes.ok, true);
});

test("assets load from an isolated package root regardless of CWD", (t) => {
  const root = tempRoot();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, "registry"));
  writeFileSync(
    path.join(root, "registry", "registry.json"),
    '{"isolated":true}\n',
  );

  const provider = createSourceAssetProvider(root);
  assert.equal(provider.root, root);
  const text = provider.readText("registry/registry.json");
  assert.equal(text.ok, true);
  if (text.ok) assert.equal(text.value, '{"isolated":true}\n');

  // A path that exists only in the real authoring repo is missing here: there
  // is no hidden fallback to the source checkout or CWD.
  const noFallback = provider.readText("schema/v1/kit.schema.json");
  assert.equal(noFallback.ok, false);
  if (!noFallback.ok) assert.equal(noFallback.issues[0]?.code, "ASSET_MISSING");
});

test("traversal, absolute and out-of-root paths are rejected", () => {
  const provider = createAssetProvider(
    path.join(os.tmpdir(), "suik-assets-nonexistent"),
  );
  for (const logicalPath of [
    "../package.json",
    "registry/../../etc/passwd",
    "/etc/passwd",
    "C:\\secret.json",
    "registry//registry.json",
    "other/file.json",
    "registry/file.txt",
  ]) {
    const result = provider.readText(logicalPath);
    assert.equal(result.ok, false, logicalPath);
    if (!result.ok) assert.equal(result.issues[0]?.code, "ASSET_PATH_INVALID");
  }
  assert.equal(normalizeAssetPath("registry/registry.json").ok, true);
  assert.equal(normalizeAssetPath("../x").ok, false);
});

test("missing and non-file assets are typed errors", (t) => {
  const root = tempRoot();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, "registry", "sub.json"), { recursive: true });
  writeFileSync(path.join(root, "registry", "registry.json"), "{}\n");
  const provider = createAssetProvider(root);

  const missing = provider.readText("registry/missing.json");
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.issues[0]?.code, "ASSET_MISSING");

  const directory = provider.readText("registry/sub.json");
  assert.equal(directory.ok, false);
  if (!directory.ok) assert.equal(directory.issues[0]?.code, "ASSET_NOT_FILE");
});

test("symlinked assets and escaping symlink ancestors are rejected", (t) => {
  const root = tempRoot();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, "registry"));
  writeFileSync(path.join(root, "outside.json"), "{}\n");
  symlinkSync(
    path.join(root, "outside.json"),
    path.join(root, "registry", "link.json"),
  );
  const provider = createAssetProvider(root);
  const linked = provider.readText("registry/link.json");
  assert.equal(linked.ok, false);
  if (!linked.ok) assert.equal(linked.issues[0]?.code, "ASSET_SYMLINK_ESCAPE");

  // An ancestor symlink that resolves outside the package root is rejected.
  const escaped = tempRoot("suik-assets-escape-");
  t.after(() => rmSync(escaped, { recursive: true, force: true }));
  const outside = tempRoot("suik-assets-outside-");
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  writeFileSync(path.join(outside, "registry.json"), "{}\n");
  symlinkSync(outside, path.join(escaped, "registry"));
  const escaping = createAssetProvider(escaped).readText(
    "registry/registry.json",
  );
  assert.equal(escaping.ok, false);
  if (!escaping.ok)
    assert.equal(escaping.issues[0]?.code, "ASSET_SYMLINK_ESCAPE");
});

test("invalid UTF-8 text is rejected while bytes remain readable", (t) => {
  const root = tempRoot();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, "registry"));
  writeFileSync(
    path.join(root, "registry", "bad.json"),
    Uint8Array.from([0xff, 0xfe, 0x00]),
  );
  const provider = createAssetProvider(root);
  const text = provider.readText("registry/bad.json");
  assert.equal(text.ok, false);
  if (!text.ok) assert.equal(text.issues[0]?.code, "ASSET_INVALID_UTF8");
  const bytes = provider.readBytes("registry/bad.json");
  assert.equal(bytes.ok, true);
  if (bytes.ok) assert.deepEqual([...bytes.value], [0xff, 0xfe, 0x00]);
});

test("the packaged asset inventory excludes authoring-only trees", () => {
  const manifest = JSON.parse(
    readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
  ) as { files?: string[] };
  for (const required of ["dist", "schema", "registry"]) {
    assert.ok(
      manifest.files?.includes(required),
      `files must include ${required}`,
    );
  }
});

test("a symlinked listing start directory is rejected", (t) => {
  const root = tempRoot();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const outside = tempRoot("suik-assets-list-outside-");
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  writeFileSync(path.join(outside, "outside.json"), "{}\n");
  symlinkSync(outside, path.join(root, "registry"));
  const result = createAssetProvider(root).list("registry");
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.issues[0]?.code, "ASSET_SYMLINK_ESCAPE");
  }
});
