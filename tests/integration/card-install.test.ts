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

test("real Card declares complete native exports and direct source dependencies", () => {
  const loaded = loadRegistrySnapshot(createAssetProvider(process.cwd()));
  assert.equal(loaded.ok, true, JSON.stringify(loaded));
  if (!loaded.ok) return;
  const item = loaded.value.items.find((entry) => entry.id === "card")!;
  assert.deepEqual(item.manifest.registryDependencies, ["tokens"]);
  assert.deepEqual(item.manifest.npmDependencies, []);
  assert.deepEqual(
    item.manifest.exports.map((entry) => [entry.name, entry.kind]),
    [
      ["Card", "value"],
      ["CardProps", "type"],
    ],
  );
  assert.equal(item.files.length, 3);
  assert.ok(
    item.files.every((file) => file.owner === "card" && file.cohort === "card"),
  );
  const component = readFileSync("registry/ui/card.svelte", "utf8");
  assert.match(
    component,
    /import type \{ CardProps \} from "\.\/card\.types\.js"/,
  );
  assert.doesNotMatch(
    component,
    /from ["'][^"']*(?:index|svelte-ui-kit|src\/)[^"']*["']/,
  );
});
for (const custom of [false, true])
  test(`real Card installs and renders in ${custom ? "custom" : "default"} consumer`, () => {
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
      run(["add", "card", "--dry-run"]);
      assert.deepEqual(snapshotTree(fixture.root), before);
      run(["add", "card"]);
      const lock = JSON.parse(
        readFileSync(
          path.join(fixture.root, `${paths.stateDir}/kit.lock.json`),
          "utf8",
        ),
      );
      assert.deepEqual(lock.requested, ["card"]);
      assert.deepEqual(
        lock.items.map((item: { id: string; origin: string }) => [
          item.id,
          item.origin,
        ]),
        [
          ["card", "explicit"],
          ["tokens", "transitive"],
        ],
      );
      for (const name of ["card.svelte", "card.types.ts"])
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
          ["tokens", "card"],
        );
      const route = "src/routes/qualification/installed-card/+page.svelte";
      let module = path.posix.relative(
        path.posix.dirname(route),
        `${config.uiDir}/index.js`,
      );
      if (!module.startsWith(".")) module = `./${module}`;
      write(
        route,
        '<script lang="ts">import { Card } from __MODULE__;import type {CardProps} from __MODULE__;let ref:HTMLElement|null=$state(null);const attrs:Pick<CardProps,"title"|"data-caller">={title:"Section description","data-caller":"preserved"};</script><h1>Installed Card</h1><Card id="outer" class={["caller",{retained:true}]} bind:ref {...attrs} aria-labelledby="outer-heading"><header><h2 id="outer-heading">Outer Card</h2><p>Outer description</p></header><p>Application content</p><Card id="inner" aria-labelledby="inner-heading" class="nested" style="border-radius:4px" dir="rtl"><h3 id="inner-heading">Inner Card</h3><p>Nested content</p></Card><footer><button type="button">Native action</button></footer></Card><Card id="unnamed">Ordinary native section</Card>'.replaceAll(
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
          "/qualification/installed-card",
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
      const card = (id: string) => {
        const tag = response.body.match(
          new RegExp('<section\\b[^>]*id="' + id + '"[^>]*>'),
        );
        assert.ok(tag, response.body);
        return tag![0];
      };
      assert.match(card("outer"), /class="kit-card caller retained"/);
      assert.match(card("outer"), /title="Section description"/);
      assert.match(card("outer"), /data-caller="preserved"/);
      assert.match(card("outer"), /aria-labelledby="outer-heading"/);
      assert.doesNotMatch(card("outer"), /role=|aria-live=|disabled=|href=/);
      assert.match(
        response.body,
        /<header><h2 id="outer-heading">Outer Card<\/h2>/,
      );
      assert.match(response.body, /<p>Application content<\/p>/);
      assert.match(card("inner"), /class="kit-card nested"/);
      assert.match(card("inner"), /aria-labelledby="inner-heading"/);
      assert.match(card("inner"), /style="border-radius:4px"/);
      assert.match(card("inner"), /dir="rtl"/);
      assert.match(response.body, /<h3 id="inner-heading">Inner Card<\/h3>/);
      assert.match(
        response.body,
        /<footer><button type="button">Native action<\/button><\/footer>/,
      );
      assert.doesNotMatch(card("unnamed"), /role=|aria-label/);
      assert.equal((response.body.match(/<section\b/g) || []).length, 3);
      const installed = snapshotTree(fixture.root);
      assert.equal(run(["add", "card"]).status, "no_change");
      assert.equal(run(["sync"]).status, "no_change");
      assert.deepEqual(snapshotTree(fixture.root), installed);
    } finally {
      fixture.cleanup();
    }
  });
