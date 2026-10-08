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

test("real Skeleton declares complete native exports and direct source dependencies", () => {
  const loaded = loadRegistrySnapshot(createAssetProvider(process.cwd()));
  assert.equal(loaded.ok, true, JSON.stringify(loaded));
  if (!loaded.ok) return;
  const item = loaded.value.items.find((entry) => entry.id === "skeleton")!;
  assert.deepEqual(item.manifest.registryDependencies, ["tokens"]);
  assert.deepEqual(item.manifest.npmDependencies, []);
  assert.deepEqual(
    item.manifest.exports.map((entry) => [entry.name, entry.kind]),
    [
      ["Skeleton", "value"],
      ["SkeletonProps", "type"],
    ],
  );
  assert.equal(item.files.length, 3);
  assert.ok(
    item.files.every(
      (file) => file.owner === "skeleton" && file.cohort === "skeleton",
    ),
  );
  const component = readFileSync("registry/ui/skeleton.svelte", "utf8");
  assert.match(
    component,
    /import type \{ SkeletonProps \} from "\.\/skeleton\.types\.js"/,
  );
  assert.doesNotMatch(
    component,
    /from ["'][^"']*(?:index|svelte-ui-kit|src\/)[^"']*["']/,
  );
});
for (const custom of [false, true])
  test(`real Skeleton installs and renders in ${custom ? "custom" : "default"} consumer`, () => {
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
      run(["add", "skeleton", "--dry-run"]);
      assert.deepEqual(snapshotTree(fixture.root), before);
      run(["add", "skeleton"]);
      const lock = JSON.parse(
        readFileSync(
          path.join(fixture.root, `${paths.stateDir}/kit.lock.json`),
          "utf8",
        ),
      );
      assert.deepEqual(lock.requested, ["skeleton"]);
      assert.deepEqual(
        lock.items.map((item: { id: string; origin: string }) => [
          item.id,
          item.origin,
        ]),
        [
          ["skeleton", "explicit"],
          ["tokens", "transitive"],
        ],
      );
      for (const name of ["skeleton.svelte", "skeleton.types.ts"])
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
          ["tokens", "skeleton"],
        );
      const route = "src/routes/qualification/installed-skeleton/+page.svelte";
      let module = path.posix.relative(
        path.posix.dirname(route),
        `${config.uiDir}/index.js`,
      );
      if (!module.startsWith(".")) module = `./${module}`;
      write(
        route,
        '<script lang="ts">import { Skeleton } from __MODULE__;import type {SkeletonProps} from __MODULE__;let ref:HTMLSpanElement|null=$state(null);const attrs:Pick<SkeletonProps,"title"|"data-caller">={title:"Decorative placeholder","data-caller":"preserved"};</script><h1>Installed Skeleton</h1><section aria-label="Profile" aria-busy="true"><p>Loading profile</p><Skeleton id="default-skeleton" class={["caller",{retained:true}]} bind:ref {...attrs}/><Skeleton id="styled-skeleton" aria-hidden={true} aria-label="Concealed duplicate" data-state="caller-owned" style="width:80px;height:24px;border-radius:50%"/></section><Skeleton id="native-skeleton" aria-hidden="true" hidden dir="rtl" style="background:navy"/><Skeleton id="until-found" hidden="until-found"/>'.replaceAll(
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
          "/qualification/installed-skeleton",
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
      const skeleton = (id: string) => {
        const tag = response.body.match(
          new RegExp('<span\\b[^>]*id="' + id + '"[^>]*>'),
        );
        assert.ok(tag, response.body);
        return tag![0];
      };
      assert.match(
        skeleton("default-skeleton"),
        /class="kit-skeleton caller retained"/,
      );
      assert.match(
        skeleton("default-skeleton"),
        /title="Decorative placeholder"/,
      );
      assert.match(skeleton("default-skeleton"), /data-caller="preserved"/);
      for (const id of [
        "default-skeleton",
        "styled-skeleton",
        "native-skeleton",
        "until-found",
      ]) {
        assert.match(skeleton(id), /aria-hidden="true"/);
        assert.doesNotMatch(skeleton(id), /role=|aria-live=|tabindex=/);
        assert.match(
          response.body,
          new RegExp('<span[^>]*id="' + id + '"[^>]*><\\/span>'),
        );
      }
      assert.match(
        response.body,
        /<section aria-label="Profile" aria-busy="true">/,
      );
      assert.match(response.body, /<p>Loading profile<\/p>/);
      assert.match(
        skeleton("styled-skeleton"),
        /aria-label="Concealed duplicate"/,
      );
      assert.match(skeleton("styled-skeleton"), /data-state="caller-owned"/);
      assert.match(
        skeleton("styled-skeleton"),
        /style="width:80px;height:24px;border-radius:50%"/,
      );
      assert.match(skeleton("native-skeleton"), /hidden/);
      assert.match(skeleton("native-skeleton"), /dir="rtl"/);
      assert.match(skeleton("native-skeleton"), /style="background:navy"/);
      assert.match(skeleton("until-found"), /hidden="until-found"/);
      assert.equal(
        (response.body.match(/aria-hidden="true"/g) || []).length,
        4,
      );
      const installed = snapshotTree(fixture.root);
      assert.equal(run(["add", "skeleton"]).status, "no_change");
      assert.equal(run(["sync"]).status, "no_change");
      assert.deepEqual(snapshotTree(fixture.root), installed);
    } finally {
      fixture.cleanup();
    }
  });
