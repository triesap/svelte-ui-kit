import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";

test("real packed inventory contains only standalone distribution assets and runs without authoring fallback", () => {
  const base = mkdtempSync(path.join(os.tmpdir(), "suik-packed-inventory-"));
  try {
    const archives = path.join(base, "archives"),
      unpack = path.join(base, "unpack"),
      consumer = path.join(base, "empty-cwd");
    mkdirSync(archives);
    mkdirSync(unpack);
    mkdirSync(consumer);
    const packed = spawnSync(
      "pnpm",
      ["pack", "--json", "--pack-destination", archives],
      { encoding: "utf8", timeout: 60_000 },
    );
    assert.equal(packed.status, 0, packed.stdout + packed.stderr);
    const metadata = JSON.parse(packed.stdout);
    assert.equal(metadata.name, "svelte-ui-kit");
    const names = readdirSync(archives);
    assert.equal(names.length, 1);
    assert.match(names[0]!, /\.tgz$/);
    const archive = path.join(archives, names[0]!);
    const list = spawnSync("tar", ["-tzf", archive], { encoding: "utf8" });
    assert.equal(list.status, 0, list.stderr);
    const entries = list.stdout.trim().split("\n");
    for (const entry of entries) {
      assert.ok(entry.startsWith("package/"), entry);
      assert.equal(entry.split("/").includes(".."), false, entry);
      const logical = entry.slice("package/".length);
      assert.match(
        logical,
        /^(?:dist\/|registry\/|schema\/|package\.json$|README\.md$|CONTRIBUTING\.md$|CHANGELOG\.md$|LICENSE-MIT$|LICENSE-APACHE$)/,
        logical,
      );
      assert.doesNotMatch(
        logical,
        /(?:^|\/)(?:node_modules|tests|implementation|tools|\.git)(?:\/|$)|\.log$|\.tsbuildinfo$/,
      );
    }
    const extracted = spawnSync("tar", ["-xzf", archive, "-C", unpack], {
      encoding: "utf8",
    });
    assert.equal(extracted.status, 0, extracted.stderr);
    const root = path.join(unpack, "package");
    const manifest = JSON.parse(
      readFileSync(path.join(root, "package.json"), "utf8"),
    );
    assert.equal(manifest.bin["svelte-ui-kit"], "./dist/cli/main.js");
    assert.equal(manifest.type, "module");
    assert.equal(manifest.private, true);
    assert.ok(
      (statSync(path.join(root, manifest.bin["svelte-ui-kit"])).mode &
        0o111) !==
        0,
      "packed bin is executable",
    );
    assert.ok(
      readFileSync(path.join(root, "dist/cli/main.js"), "utf8").startsWith(
        "#!/usr/bin/env node",
      ),
    );
    const assertBytes = (logical: string) =>
      assert.deepEqual(
        readFileSync(path.join(root, logical)),
        readFileSync(logical),
        logical,
      );
    const visit = (logical: string) => {
      for (const child of readdirSync(logical, { withFileTypes: true })) {
        const next = logical + "/" + child.name;
        if (child.isDirectory()) visit(next);
        else {
          assert.equal(child.isFile(), true);
          assertBytes(next);
        }
      }
    };
    visit("dist");
    visit("schema");
    visit("registry");
    for (const file of ["LICENSE-MIT", "LICENSE-APACHE"]) assertBytes(file);
    const local = loadRegistrySnapshot(createAssetProvider(process.cwd()));
    assert.equal(local.ok, true);
    const loaded = loadRegistrySnapshot(createAssetProvider(root));
    assert.equal(loaded.ok, true, JSON.stringify(loaded));
    if (local.ok && loaded.ok) assert.deepEqual(loaded.value, local.value);
    // Installed dependency linkage is explicit test setup. There is no src,
    // registry fallback or current-directory assets in this extracted package.
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    const executable = path.join(root, "dist/cli/main.js");
    const help = spawnSync(process.execPath, [executable, "--help", "--json"], {
      cwd: consumer,
      encoding: "utf8",
    });
    assert.equal(help.status, 0, help.stdout + help.stderr);
    assert.equal(JSON.parse(help.stdout).command, "help");
    if (loaded.ok && loaded.value.items.length > 0) {
      for (const item of loaded.value.items) {
        const result = spawnSync(
          process.execPath,
          [executable, "view", item.id, "--source", "--json"],
          { cwd: consumer, encoding: "utf8" },
        );
        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.equal(JSON.parse(result.stdout).status, "success");
      }
    } else {
      const empty = spawnSync(
        process.execPath,
        [executable, "view", "not-shipped", "--source", "--json"],
        { cwd: consumer, encoding: "utf8" },
      );
      assert.equal(empty.status, 12, empty.stdout + empty.stderr);
      assert.ok(
        JSON.parse(empty.stdout).diagnostics.some(
          (entry: { code: string }) => entry.code === "REGISTRY_ITEM_UNKNOWN",
        ),
      );
    }
    assert.deepEqual(readdirSync(consumer), []);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
