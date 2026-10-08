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

test("real Separator declares complete native exports and direct source dependencies", () => {
  const loaded = loadRegistrySnapshot(createAssetProvider(process.cwd()));
  assert.equal(loaded.ok, true, JSON.stringify(loaded));
  if (!loaded.ok) return;
  const item = loaded.value.items.find((entry) => entry.id === "separator")!;
  assert.deepEqual(item.manifest.registryDependencies, ["tokens"]);
  assert.deepEqual(item.manifest.npmDependencies, []);
  assert.deepEqual(
    item.manifest.exports.map((entry) => [entry.name, entry.kind]),
    [
      ["Separator", "value"],
      ["SeparatorProps", "type"],
      ["SeparatorOrientation", "type"],
    ],
  );
  assert.equal(item.files.length, 3);
  assert.ok(
    item.files.every(
      (file) => file.owner === "separator" && file.cohort === "separator",
    ),
  );
  const component = readFileSync("registry/ui/separator.svelte", "utf8");
  assert.match(
    component,
    /import type \{ SeparatorProps \} from "\.\/separator\.types\.js"/,
  );
  assert.doesNotMatch(
    component,
    /from ["'][^"']*(?:index|svelte-ui-kit|src\/)[^"']*["']/,
  );
});
for (const custom of [false, true])
  test(`real Separator installs and renders in ${custom ? "custom" : "default"} consumer`, () => {
    const fixture = copyConsumerFixture();
    try {
      const config = custom
        ? { ...DEFAULT_KIT_CONFIG, uiDir: "app/ui", stylesDir: "assets/styles" }
        : DEFAULT_KIT_CONFIG;
      const paths = deriveKitPaths(config);
      const write = (file: string, body: string) => {
        const target = path.join(fixture.root, file);
        mkdirSync(path.dirname(target), { recursive: true });
        writeFileSync(target, body);
      };
      if (custom) write(`${paths.stateDir}/kit.json`, JSON.stringify(config));
      const run = (args: string[]) => {
        const result = spawnSync(
          process.execPath,
          [
            path.resolve("dist/cli/main.js"),
            ...args,
            "--json",
            "--cwd",
            fixture.root,
          ],
          { cwd: fixture.root, encoding: "utf8", timeout: 30000 },
        );
        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.equal(result.stderr, "");
        return JSON.parse(result.stdout);
      };
      run(["init"]);
      const before = snapshotTree(fixture.root);
      run(["add", "separator", "--dry-run"]);
      assert.deepEqual(snapshotTree(fixture.root), before);
      run(["add", "separator"]);
      const lock = JSON.parse(
        readFileSync(
          path.join(fixture.root, `${paths.stateDir}/kit.lock.json`),
          "utf8",
        ),
      );
      assert.deepEqual(lock.requested, ["separator"]);
      assert.deepEqual(
        lock.items.map((item: { id: string; origin: string }) => [
          item.id,
          item.origin,
        ]),
        [
          ["separator", "explicit"],
          ["tokens", "transitive"],
        ],
      );
      for (const name of ["separator.svelte", "separator.types.ts"])
        assert.ok(
          readFileSync(path.join(fixture.root, config.uiDir, name)).equals(
            readFileSync(path.join("registry/ui", name)),
          ),
        );
      for (const file of lock.files)
        assert.equal(
          file.baseHash,
          sha256Hex(readFileSync(path.join(fixture.root, file.path))),
        );
      const css = parseManagedCss(
        readFileSync(path.join(fixture.root, paths.kitCss), "utf8"),
      );
      assert.equal(css.ok, true, JSON.stringify(css));
      if (css.ok)
        assert.deepEqual(
          css.value.blocks.map((block) => block.id),
          ["tokens", "separator"],
        );
      const route = "src/routes/qualification/installed-separator/+page.svelte";
      let module = path.posix.relative(
        path.posix.dirname(route),
        `${config.uiDir}/index.js`,
      );
      if (!module.startsWith(".")) module = `./${module}`;
      write(
        route,
        '<script lang="ts">import { Separator } from __MODULE__;import type {SeparatorProps,SeparatorOrientation} from __MODULE__;let ref:HTMLDivElement|null=$state(null);const orientation:SeparatorOrientation="vertical";const attrs:Pick<SeparatorProps,"title"|"data-caller">={title:"Section boundary","data-caller":"preserved"};</script><h1>Installed Separator</h1><Separator id="default-separator" class={["caller",{retained:true}]} bind:ref {...attrs}/><div style="height:80px"><Separator id="named-separator" {orientation} aria-label="Section boundary" data-state="caller-owned"/></div><Separator id="decorative-separator" decorative role="none" orientation="vertical"/><Separator id="native-separator" role="separator" aria-hidden="true" hidden dir="rtl" style="background:navy"/>'.replaceAll(
          "__MODULE__",
          JSON.stringify(module),
        ),
      );
      for (const script of ["check", "build"]) {
        const result = runFixtureScript(fixture.root, script);
        assert.equal(result.status, 0, result.stdout + result.stderr);
      }
      const env = { ...process.env };
      if (env["NO_COLOR"] !== undefined) delete env["FORCE_COLOR"];
      const rendered = spawnSync(
        process.execPath,
        [
          path.resolve("tests/helpers/render-built-consumer.mjs"),
          path.join(fixture.root, "build/handler.js"),
          "/qualification/installed-separator",
        ],
        { cwd: fixture.root, env, encoding: "utf8", timeout: 90000 },
      );
      assert.equal(rendered.status, 0, rendered.stdout + rendered.stderr);
      assert.equal(rendered.stderr, "");
      const response = JSON.parse(rendered.stdout);
      assert.equal(response.status, 200);
      assert.equal(
        response.handlerSha256,
        sha256Hex(readFileSync(path.join(fixture.root, "build/handler.js"))),
      );
      const separator = (id: string) => {
        const tag = response.body.match(
          new RegExp('<div\\b[^>]*id="' + id + '"[^>]*>'),
        );
        assert.ok(tag, response.body);
        return tag![0];
      };
      assert.match(
        separator("default-separator"),
        /class="kit-separator caller retained"/,
      );
      assert.match(separator("default-separator"), /title="Section boundary"/);
      assert.match(separator("default-separator"), /data-caller="preserved"/);
      assert.match(separator("default-separator"), /role="separator"/);
      assert.match(
        separator("default-separator"),
        /aria-orientation="horizontal"/,
      );
      assert.match(
        separator("default-separator"),
        /data-orientation="horizontal"/,
      );
      assert.doesNotMatch(
        separator("default-separator"),
        /aria-hidden=|aria-live=|tabindex=/,
      );
      assert.match(
        separator("named-separator"),
        /aria-label="Section boundary"/,
      );
      assert.match(separator("named-separator"), /data-state="caller-owned"/);
      assert.match(separator("named-separator"), /role="separator"/);
      assert.match(separator("named-separator"), /aria-orientation="vertical"/);
      assert.match(separator("named-separator"), /data-orientation="vertical"/);
      assert.match(separator("decorative-separator"), /role="none"/);
      assert.match(separator("decorative-separator"), /aria-hidden="true"/);
      assert.match(
        separator("decorative-separator"),
        /data-orientation="vertical"/,
      );
      assert.doesNotMatch(
        separator("decorative-separator"),
        /aria-orientation=/,
      );
      assert.match(separator("native-separator"), /role="separator"/);
      assert.match(separator("native-separator"), /aria-hidden="true"/);
      assert.match(separator("native-separator"), /hidden/);
      assert.match(separator("native-separator"), /dir="rtl"/);
      assert.match(separator("native-separator"), /style="background:navy"/);
      assert.equal((response.body.match(/role="separator"/g) || []).length, 3);
      assert.equal((response.body.match(/role="none"/g) || []).length, 1);
      const installed = snapshotTree(fixture.root);
      assert.equal(run(["add", "separator"]).status, "no_change");
      assert.equal(run(["sync"]).status, "no_change");
      assert.deepEqual(snapshotTree(fixture.root), installed);
    } finally {
      fixture.cleanup();
    }
  });
