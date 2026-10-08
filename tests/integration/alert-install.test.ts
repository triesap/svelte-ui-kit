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

test("real Alert declares complete native exports and direct source dependencies", () => {
  const loaded = loadRegistrySnapshot(createAssetProvider(process.cwd()));
  assert.equal(loaded.ok, true, JSON.stringify(loaded));
  if (!loaded.ok) return;
  const item = loaded.value.items.find((entry) => entry.id === "alert")!;
  assert.deepEqual(item.manifest.registryDependencies, ["tokens"]);
  assert.deepEqual(item.manifest.npmDependencies, []);
  assert.deepEqual(
    item.manifest.exports.map((entry) => [entry.name, entry.kind]),
    [
      ["Alert", "value"],
      ["AlertProps", "type"],
    ],
  );
  assert.equal(item.files.length, 3);
  assert.ok(
    item.files.every(
      (file) => file.owner === "alert" && file.cohort === "alert",
    ),
  );
  const component = readFileSync("registry/ui/alert.svelte", "utf8");
  assert.match(
    component,
    /import type \{ AlertProps \} from "\.\/alert\.types\.js"/,
  );
  assert.doesNotMatch(
    component,
    /from ["'][^"']*(?:index|svelte-ui-kit|src\/)[^"']*["']/,
  );
});
for (const custom of [false, true])
  test(`real Alert installs and renders in ${custom ? "custom" : "default"} consumer`, () => {
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
      run(["add", "alert", "--dry-run"]);
      assert.deepEqual(snapshotTree(fixture.root), before);
      run(["add", "alert"]);
      const lock = JSON.parse(
        readFileSync(
          path.join(fixture.root, `${paths.stateDir}/kit.lock.json`),
          "utf8",
        ),
      );
      assert.deepEqual(lock.requested, ["alert"]);
      assert.deepEqual(
        lock.items.map((item: { id: string; origin: string }) => [
          item.id,
          item.origin,
        ]),
        [
          ["alert", "explicit"],
          ["tokens", "transitive"],
        ],
      );
      for (const name of ["alert.svelte", "alert.types.ts"])
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
          ["tokens", "alert"],
        );
      const route = "src/routes/qualification/installed-alert/+page.svelte";
      let module = path.posix.relative(
        path.posix.dirname(route),
        `${config.uiDir}/index.js`,
      );
      if (!module.startsWith(".")) module = `./${module}`;
      write(
        route,
        '<script lang="ts">import { Alert } from __MODULE__;import type {AlertProps} from __MODULE__;let ref:HTMLDivElement|null=$state(null);const attrs:Pick<AlertProps,"title"|"data-caller">={title:"Urgent message","data-caller":"preserved"};</script><h1>Installed Alert</h1><Alert id="default-alert" class={["caller",{retained:true}]} bind:ref {...attrs}><span aria-hidden="true">!</span><p>Network request failed.</p></Alert><Alert id="named-alert" role="alert" aria-label="Connection problem" data-state="caller-owned"><h2>Connection lost</h2><p>Check your settings.</p></Alert><Alert id="native-alert" aria-live="off" aria-atomic={false} aria-relevant="removals" dir="rtl" style="color:navy">Explicit native attributes</Alert>'.replaceAll(
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
          "/qualification/installed-alert",
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
      const alert = (id: string) => {
        const tag = response.body.match(
          new RegExp('<div\\b[^>]*id="' + id + '"[^>]*>'),
        );
        assert.ok(tag, response.body);
        return tag![0];
      };
      assert.match(alert("default-alert"), /class="kit-alert caller retained"/);
      assert.match(alert("default-alert"), /title="Urgent message"/);
      assert.match(alert("default-alert"), /data-caller="preserved"/);
      assert.match(alert("default-alert"), /role="alert"/);
      assert.doesNotMatch(
        alert("default-alert"),
        /aria-live=|aria-atomic=|disabled=|href=/,
      );
      assert.match(response.body, /<span aria-hidden="true">!<\/span>/);
      assert.match(response.body, /<p>Network request failed.<\/p>/);
      assert.match(alert("named-alert"), /aria-label="Connection problem"/);
      assert.match(alert("named-alert"), /data-state="caller-owned"/);
      assert.match(alert("named-alert"), /role="alert"/);
      assert.match(alert("native-alert"), /aria-live="off"/);
      assert.match(alert("native-alert"), /aria-atomic="false"/);
      assert.match(alert("native-alert"), /aria-relevant="removals"/);
      assert.match(alert("native-alert"), /dir="rtl"/);
      assert.match(alert("native-alert"), /style="color:navy"/);
      assert.match(alert("native-alert"), /role="alert"/);
      assert.equal((response.body.match(/role="alert"/g) || []).length, 3);
      const installed = snapshotTree(fixture.root);
      assert.equal(run(["add", "alert"]).status, "no_change");
      assert.equal(run(["sync"]).status, "no_change");
      assert.deepEqual(snapshotTree(fixture.root), installed);
    } finally {
      fixture.cleanup();
    }
  });
