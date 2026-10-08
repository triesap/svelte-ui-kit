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

test("real Progress declares complete native exports and direct source dependencies", () => {
  const loaded = loadRegistrySnapshot(createAssetProvider(process.cwd()));
  assert.equal(loaded.ok, true, JSON.stringify(loaded));
  if (!loaded.ok) return;
  const item = loaded.value.items.find((entry) => entry.id === "progress")!;
  assert.deepEqual(item.manifest.registryDependencies, ["tokens"]);
  assert.deepEqual(item.manifest.npmDependencies, []);
  assert.deepEqual(
    item.manifest.exports.map((entry) => [entry.name, entry.kind]),
    [
      ["Progress", "value"],
      ["ProgressProps", "type"],
    ],
  );
  assert.equal(item.files.length, 3);
  assert.ok(
    item.files.every(
      (file) => file.owner === "progress" && file.cohort === "progress",
    ),
  );
  const component = readFileSync("registry/ui/progress.svelte", "utf8");
  assert.match(
    component,
    /import type \{ ProgressProps \} from "\.\/progress\.types\.js"/,
  );
  assert.doesNotMatch(
    component,
    /from ["'][^"']*(?:index|svelte-ui-kit|src\/)[^"']*["']/,
  );
});
for (const custom of [false, true])
  test(`real Progress installs and renders in ${custom ? "custom" : "default"} consumer`, () => {
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
      run(["add", "progress", "--dry-run"]);
      assert.deepEqual(snapshotTree(fixture.root), before);
      run(["add", "progress"]);
      const lock = JSON.parse(
        readFileSync(
          path.join(fixture.root, `${paths.stateDir}/kit.lock.json`),
          "utf8",
        ),
      );
      assert.deepEqual(lock.requested, ["progress"]);
      assert.deepEqual(
        lock.items.map((item: { id: string; origin: string }) => [
          item.id,
          item.origin,
        ]),
        [
          ["progress", "explicit"],
          ["tokens", "transitive"],
        ],
      );
      for (const name of ["progress.svelte", "progress.types.ts"])
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
          ["tokens", "progress"],
        );
      const route = "src/routes/qualification/installed-progress/+page.svelte";
      let module = path.posix.relative(
        path.posix.dirname(route),
        `${config.uiDir}/index.js`,
      );
      if (!module.startsWith(".")) module = `./${module}`;
      write(
        route,
        '<script lang="ts">import { Progress } from __MODULE__;import type {ProgressProps} from __MODULE__;let ref:HTMLProgressElement|null=$state(null);const attrs:Pick<ProgressProps,"title"|"data-caller">={title:"Transfer progress","data-caller":"preserved"};</script><h1>Installed Progress</h1><label for="default-progress">Upload</label><Progress id="default-progress" value={25} class={["caller",{retained:true}]} bind:ref {...attrs}/><Progress id="named-progress" value={75} max={80} aria-label="Download" data-state="caller-owned"/><Progress id="zero-progress" value={0} aria-label="Zero"/><Progress id="indeterminate-progress" aria-label="Pending"/><Progress id="null-progress" value={null} max={null} aria-label="Native bounds" dir="rtl" style="accent-color:navy"/><Progress id="bounded-progress" value={200} max={100} aria-label="Complete" aria-valuetext="All files copied"/>'.replaceAll(
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
          "/qualification/installed-progress",
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
      const progress = (id: string) => {
        const tag = response.body.match(
          new RegExp('<progress\\b[^>]*id="' + id + '"[^>]*>'),
        );
        assert.ok(tag, response.body);
        return tag![0];
      };
      assert.match(
        progress("default-progress"),
        /class="kit-progress caller retained"/,
      );
      assert.match(progress("default-progress"), /title="Transfer progress"/);
      assert.match(progress("default-progress"), /data-caller="preserved"/);
      assert.match(progress("default-progress"), /value="25"/);
      assert.match(progress("default-progress"), /max="100"/);
      assert.doesNotMatch(
        progress("default-progress"),
        /role=|aria-value|aria-live=/,
      );
      assert.match(
        response.body,
        /<label for="default-progress">Upload<\/label>/,
      );
      assert.ok(response.body.includes("25 / 100"));
      assert.match(progress("named-progress"), /aria-label="Download"/);
      assert.match(progress("named-progress"), /data-state="caller-owned"/);
      assert.match(progress("named-progress"), /value="75"/);
      assert.match(progress("named-progress"), /max="80"/);
      assert.match(progress("zero-progress"), /value="0"/);
      assert.doesNotMatch(progress("indeterminate-progress"), /value=/);
      assert.match(progress("indeterminate-progress"), /max="100"/);
      assert.doesNotMatch(progress("null-progress"), /value=|max=/);
      assert.match(progress("null-progress"), /dir="rtl"/);
      assert.match(progress("null-progress"), /style="accent-color:navy"/);
      assert.match(progress("bounded-progress"), /value="200"/);
      assert.match(progress("bounded-progress"), /max="100"/);
      assert.match(
        progress("bounded-progress"),
        /aria-valuetext="All files copied"/,
      );
      assert.equal((response.body.match(/<progress\b/g) || []).length, 6);
      const installed = snapshotTree(fixture.root);
      assert.equal(run(["add", "progress"]).status, "no_change");
      assert.equal(run(["sync"]).status, "no_change");
      assert.deepEqual(snapshotTree(fixture.root), installed);
    } finally {
      fixture.cleanup();
    }
  });
