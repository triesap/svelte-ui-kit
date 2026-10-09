import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";

test("each authenticated advertised item has a maintained source map and real assets", () => {
  const loaded = loadRegistrySnapshot(createAssetProvider(process.cwd()));
  assert.ok(loaded.ok, JSON.stringify(loaded));
  if (!loaded.ok) throw new Error("registry invalid");
  assert.equal(loaded.value.items.length, 22);
  for (const item of loaded.value.items) {
    const map = `docs/reference/components/${item.manifest.id}.md`;
    assert.ok(existsSync(map), map);
    assert.ok(readFileSync(map, "utf8").trim().length > 0);
    for (const asset of [...item.manifest.files, ...item.manifest.styles])
      assert.ok(existsSync(path.join("registry", asset.source)), asset.source);
  }
  assert.ok(existsSync("docs/reference/compatibility.md"));
  assert.equal(
    loaded.value.items.some((item) => item.manifest.id === "identity"),
    false,
    "native identity must not become an invented registry item",
  );
});
