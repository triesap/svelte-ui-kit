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

test("real Switch declares complete native exports and direct source dependencies", () => {
  const loaded = loadRegistrySnapshot(createAssetProvider(process.cwd()));
  assert.equal(loaded.ok, true, JSON.stringify(loaded));
  if (!loaded.ok) return;
  const item = loaded.value.items.find((entry) => entry.id === "switch")!;
  assert.deepEqual(item.manifest.registryDependencies, ["tokens"]);
  assert.deepEqual(item.manifest.npmDependencies, [
    { name: "bits-ui", range: "2.19.5-svelte-ui-kit.2", role: "runtime" },
  ]);
  assert.deepEqual(
    item.manifest.exports.map((entry) => [entry.name, entry.kind]),
    [
      ["Switch", "value"],
      ["SwitchProps", "type"],
    ],
  );
  assert.equal(item.files.length, 3);
  assert.ok(
    item.files.every(
      (file) => file.owner === "switch" && file.cohort === "switch",
    ),
  );
  const component = readFileSync("registry/ui/switch.svelte", "utf8");
  assert.match(component, /import \{ Switch as BitsSwitch \} from "bits-ui"/);
  assert.doesNotMatch(
    component,
    /from ["'][^"']*(?:index|svelte-ui-kit|src\/)[^"']*["']/,
  );
});
for (const custom of [false, true])
  test(`real Switch installs and renders in ${custom ? "custom" : "default"} consumer`, () => {
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
      run(["add", "switch", "--dry-run"]);
      assert.deepEqual(snapshotTree(fixture.root), before);
      run(["add", "switch"]);
      const lock = JSON.parse(
        readFileSync(
          path.join(fixture.root, `${paths.stateDir}/kit.lock.json`),
          "utf8",
        ),
      );
      assert.deepEqual(lock.requested, ["switch"]);
      assert.deepEqual(
        lock.items.map((item: { id: string; origin: string }) => [
          item.id,
          item.origin,
        ]),
        [
          ["switch", "explicit"],
          ["tokens", "transitive"],
        ],
      );
      for (const name of ["switch.svelte", "switch.types.ts"])
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
          ["tokens", "switch"],
        );
      const route = "src/routes/qualification/installed-switch/+page.svelte";
      let module = path.posix.relative(
        path.posix.dirname(route),
        `${config.uiDir}/index.js`,
      );
      if (!module.startsWith(".")) module = `./${module}`;
      write(
        route,
        `<script lang="ts">import { Switch } from ${JSON.stringify(module)};import type { SwitchProps } from ${JSON.stringify(module)};let ref=$state<HTMLElement|null>(null);let checked=$state(true);const options:Pick<SwitchProps,"name"|"value">={name:"enabled",value:"yes"};</script><h1>Installed Switch</h1><Switch id="checked-switch" bind:checked bind:ref class="caller" aria-label="Enabled" {...options}/><Switch id="unchecked-switch" aria-label="Optional"/>`,
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
          "/qualification/installed-switch",
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
      const checkedTag = response.body.match(
        /<button[^>]*id="checked-switch"[^>]*>/,
      )?.[0];
      assert.ok(checkedTag);
      assert.match(checkedTag, /role="switch"/);
      assert.match(checkedTag, /aria-checked="true"/);
      assert.match(checkedTag, /data-state="checked"/);
      assert.match(checkedTag, /kit-switch caller/);
      assert.match(checkedTag, /type="button"/);
      const uncheckedTag = response.body.match(
        /<button[^>]*id="unchecked-switch"[^>]*>/,
      )?.[0];
      assert.ok(uncheckedTag);
      assert.match(uncheckedTag, /aria-checked="false"/);
      assert.match(uncheckedTag, /data-state="unchecked"/);
      assert.match(response.body, /<span[^>]*class="kit-switch-thumb"[^>]*>/);
      assert.match(
        response.body,
        /<input(?=[^>]*name="enabled")(?=[^>]*value="yes")(?=[^>]*checked)[^>]*>/,
      );
      assert.equal((response.body.match(/type="checkbox"/g) ?? []).length, 1);
      const installed = snapshotTree(fixture.root);
      assert.equal(run(["add", "switch"]).status, "no_change");
      assert.equal(run(["sync"]).status, "no_change");
      assert.deepEqual(snapshotTree(fixture.root), installed);
    } finally {
      fixture.cleanup();
    }
  });
