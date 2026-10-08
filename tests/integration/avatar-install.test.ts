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

test("real Avatar declares complete native exports and direct source dependencies", () => {
  const loaded = loadRegistrySnapshot(createAssetProvider(process.cwd()));
  assert.equal(loaded.ok, true, JSON.stringify(loaded));
  if (!loaded.ok) return;
  const item = loaded.value.items.find((entry) => entry.id === "avatar")!;
  assert.deepEqual(item.manifest.registryDependencies, ["tokens"]);
  assert.deepEqual(item.manifest.npmDependencies, []);
  assert.deepEqual(
    item.manifest.exports.map((entry) => [entry.name, entry.kind]),
    [
      ["Avatar", "value"],
      ["AvatarProps", "type"],
    ],
  );
  assert.equal(item.files.length, 3);
  assert.ok(
    item.files.every(
      (file) => file.owner === "avatar" && file.cohort === "avatar",
    ),
  );
  const component = readFileSync("registry/ui/avatar.svelte", "utf8");
  assert.match(
    component,
    /import type \{ AvatarProps \} from "\.\/avatar\.types\.js"/,
  );
  assert.doesNotMatch(
    component,
    /from ["'][^"']*(?:index|svelte-ui-kit|src\/)[^"']*["']/,
  );
});
for (const custom of [false, true])
  test(`real Avatar installs and renders in ${custom ? "custom" : "default"} consumer`, () => {
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
      run(["add", "avatar", "--dry-run"]);
      assert.deepEqual(snapshotTree(fixture.root), before);
      run(["add", "avatar"]);
      const lock = JSON.parse(
        readFileSync(
          path.join(fixture.root, `${paths.stateDir}/kit.lock.json`),
          "utf8",
        ),
      );
      assert.deepEqual(lock.requested, ["avatar"]);
      assert.deepEqual(
        lock.items.map((item: { id: string; origin: string }) => [
          item.id,
          item.origin,
        ]),
        [
          ["avatar", "explicit"],
          ["tokens", "transitive"],
        ],
      );
      for (const name of ["avatar.svelte", "avatar.types.ts"])
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
          ["tokens", "avatar"],
        );
      const route = "src/routes/qualification/installed-avatar/+page.svelte";
      let module = path.posix.relative(
        path.posix.dirname(route),
        `${config.uiDir}/index.js`,
      );
      if (!module.startsWith(".")) module = `./${module}`;
      write(
        route,
        '<script lang="ts">import { Avatar } from __MODULE__;import type {AvatarProps} from __MODULE__;let ref:HTMLImageElement|null=$state(null);const attrs:Pick<AvatarProps,"loading"|"decoding">={loading:"lazy",decoding:"async"};</script>{#snippet fallback()}<span>AD</span>{/snippet}<h1>Installed Avatar</h1><Avatar id="profile" src="/portrait.png" alt="Ada" {fallback} class={["caller",{retained:true}]} data-caller="preserved" title="Portrait" bind:ref {...attrs} srcset="/portrait.png 1x, /portrait-2x.png 2x" sizes="40px"/><Avatar id="native" src="/native.png" alt="Native alternate text"/><Avatar id="decorative" src="/decoration.png" alt="" {fallback}/><Avatar id="hidden" src="/hidden.png" alt="Hidden" hidden aria-hidden="true"/>'.replaceAll(
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
          "/qualification/installed-avatar",
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
      const image = (id: string) => {
        const tag = response.body.match(
          new RegExp('<img\\b[^>]*id="' + id + '"[^>]*>'),
        );
        assert.ok(tag, response.body);
        return tag![0];
      };
      assert.match(image("profile"), /src="\/portrait.png"/);
      assert.match(image("profile"), /alt="Ada"/);
      assert.match(image("profile"), /class="kit-avatar caller retained"/);
      assert.match(image("profile"), /data-caller="preserved"/);
      assert.match(image("profile"), /loading="lazy"/);
      assert.match(image("profile"), /decoding="async"/);
      assert.match(
        image("profile"),
        /srcset="\/portrait.png 1x, \/portrait-2x.png 2x"/,
      );
      assert.match(image("profile"), /sizes="40px"/);
      assert.match(image("profile"), /aria-hidden="true"/);
      assert.match(
        response.body,
        /<div[^>]*class="kit-avatar-frame"[^>]*data-state="loading"[^>]*role="img"[^>]*aria-label="Ada"/,
      );
      assert.match(
        response.body,
        /<span[^>]*class="kit-avatar-fallback"[^>]*aria-hidden="true"[^>]*>[^]*?AD/,
      );
      assert.match(image("native"), /alt="Native alternate text"/);
      assert.doesNotMatch(image("native"), /aria-hidden=/);
      assert.match(image("decorative"), /alt=""/);
      assert.match(image("hidden"), /hidden/);
      assert.match(image("hidden"), /aria-hidden="true"/);
      assert.doesNotMatch(
        response.body,
        /data-state="loaded"|data-state="error"/,
      );
      const installed = snapshotTree(fixture.root);
      assert.equal(run(["add", "avatar"]).status, "no_change");
      assert.equal(run(["sync"]).status, "no_change");
      assert.deepEqual(snapshotTree(fixture.root), installed);
    } finally {
      fixture.cleanup();
    }
  });
