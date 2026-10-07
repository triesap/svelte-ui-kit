import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { copyConsumerFixture, runFixtureScript } from "../helpers/fixture.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import { parseManagedCss } from "../../src/codegen/css-parse.js";
import { sha256Hex } from "../../src/codegen/digest.js";

const cli = path.resolve("dist/cli/main.js");
function run(root: string, args: readonly string[]) {
  const result = spawnSync(
    process.execPath,
    [cli, ...args, "--json", "--cwd", root],
    { cwd: root, encoding: "utf8", timeout: 30_000 },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(result.stderr, "");
  return JSON.parse(result.stdout);
}
test("actual bundled tokens are CSS-only, loader authenticated and match the frozen defaults", () => {
  const loaded = loadRegistrySnapshot(createAssetProvider(process.cwd()));
  assert.equal(loaded.ok, true, JSON.stringify(loaded));
  if (!loaded.ok) return;
  const tokens = loaded.value.items.find((item) => item.id === "tokens");
  assert.ok(tokens);
  assert.equal(tokens.manifest.kind, "foundation");
  assert.deepEqual(tokens.manifest.files, []);
  assert.deepEqual(tokens.manifest.exports, []);
  assert.deepEqual(tokens.manifest.npmDependencies, []);
  assert.equal(tokens.files.length, 1);
  const css = readFileSync("registry/styles/tokens.css", "utf8");
  const parsed = parseManagedCss(css);
  assert.equal(parsed.ok, true, JSON.stringify(parsed));
  if (!parsed.ok) return;
  assert.equal(parsed.value.blocks.length, 1);
  assert.equal(parsed.value.blocks[0]!.id, "tokens");
  const semantic = JSON.parse(
    readFileSync("registry/contracts/theme-v1.json", "utf8"),
  );
  for (const token of semantic.tokens)
    assert.ok(css.includes(`${token.name}: ${token.fallback};`));
  assert.ok(css.includes("Copyright (c) 2026 Tyson Lupul"));
  assert.ok(!css.includes("@property"));
  assert.ok(!css.includes("tailwind"));
});
for (const custom of [false, true])
  test(`actual bundled tokens install/replay and compile in ${custom ? "custom" : "default"} consumer`, () => {
    const fixture = copyConsumerFixture();
    try {
      const config = custom
        ? { ...DEFAULT_KIT_CONFIG, uiDir: "app/ui", stylesDir: "assets/styles" }
        : DEFAULT_KIT_CONFIG;
      const paths = deriveKitPaths(config);
      if (custom) {
        const target = path.join(fixture.root, paths.stateDir, "kit.json");
        mkdirSync(path.dirname(target), { recursive: true });
        writeFileSync(target, JSON.stringify(config));
      }
      run(fixture.root, ["init"]);
      const before = snapshotTree(fixture.root);
      assert.equal(
        run(fixture.root, ["add", "tokens", "--dry-run"]).status,
        "planned",
      );
      assert.deepEqual(snapshotTree(fixture.root), before);
      assert.equal(run(fixture.root, ["add", "tokens"]).status, "success");
      const installed = readFileSync(
        path.join(fixture.root, paths.kitCss),
        "utf8",
      );
      const parsed = parseManagedCss(installed);
      assert.equal(parsed.ok, true, JSON.stringify(parsed));
      if (!parsed.ok) return;
      assert.deepEqual(
        parsed.value.blocks.map((block) => block.id),
        ["tokens"],
      );
      assert.ok(installed.includes("--kit-color-canvas: #f8fafc;"));
      assert.ok(installed.includes("Copyright (c) 2026 Tyson Lupul"));
      const lock = JSON.parse(
        readFileSync(
          path.join(fixture.root, paths.stateDir, "kit.lock.json"),
          "utf8",
        ),
      );
      const desired = JSON.parse(
        readFileSync(
          path.join(fixture.root, paths.stateDir, "kit.json"),
          "utf8",
        ),
      );
      assert.deepEqual(desired.requested, ["tokens"]);
      assert.deepEqual(lock.requested, ["tokens"]);
      assert.equal(lock.files.length, 3);
      for (const file of lock.files) {
        assert.equal(file.owner, "tokens");
        assert.equal(file.cohort, "tokens");
        assert.equal(
          file.baseHash,
          sha256Hex(readFileSync(path.join(fixture.root, file.path))),
        );
      }
      assert.equal(lock.cssBlocks.length, 1);
      assert.equal(lock.cssBlocks[0].owner, "tokens");
      assert.equal(
        lock.cssBlocks[0].baseHash,
        sha256Hex(
          new TextEncoder().encode(
            installed.slice(
              parsed.value.blocks[0]!.contentStart,
              parsed.value.blocks[0]!.contentEnd,
            ),
          ),
        ),
      );
      const after = snapshotTree(fixture.root);
      assert.equal(run(fixture.root, ["init"]).status, "no_change");
      assert.equal(run(fixture.root, ["add", "tokens"]).status, "no_change");
      assert.equal(run(fixture.root, ["sync"]).status, "no_change");
      assert.deepEqual(snapshotTree(fixture.root), after);
      const manifest = readFileSync(
        path.join(fixture.root, "package.json"),
        "utf8",
      );
      assert.ok(!manifest.includes("tailwind"));
      for (const script of ["check", "build"]) {
        const result = runFixtureScript(fixture.root, script);
        assert.equal(result.status, 0, result.stdout + result.stderr);
      }
    } finally {
      fixture.cleanup();
    }
  });
