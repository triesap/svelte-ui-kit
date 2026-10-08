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

test("optional RouterLink declares exact native source reuse and dependency/style ownership", () => {
  const loaded = loadRegistrySnapshot(createAssetProvider(process.cwd()));
  assert.equal(loaded.ok, true, JSON.stringify(loaded));
  if (!loaded.ok) return;
  const item = loaded.value.items.find((entry) => entry.id === "router-link")!;
  assert.deepEqual(item.manifest.registryDependencies, ["anchor"]);
  assert.deepEqual(item.manifest.npmDependencies, []);
  assert.deepEqual(
    item.manifest.exports.map((entry) => [entry.name, entry.kind]),
    [
      ["RouterLink", "value"],
      ["RouterLinkProps", "type"],
    ],
  );
  assert.equal(item.files.length, 2);
  assert.deepEqual(item.manifest.styles, []);
  assert.ok(
    item.files.every(
      (file) => file.owner === "router-link" && file.cohort === "router-link",
    ),
  );
  const component = readFileSync("registry/ui/router-link.svelte", "utf8");
  assert.match(component, /import Anchor from "\.\/anchor\.svelte"/);
  assert.doesNotMatch(
    component,
    /from ["'][^"']*(?:index|svelte-ui-kit|src\/)[^"']*["']/,
  );
});
for (const custom of [false, true])
  test(`optional RouterLink installs and renders in ${custom ? "custom" : "default"} consumer`, () => {
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
      run(["add", "router-link", "--dry-run"]);
      assert.deepEqual(snapshotTree(fixture.root), before);
      run(["add", "router-link"]);
      const lock = JSON.parse(
        readFileSync(
          path.join(fixture.root, `${paths.stateDir}/kit.lock.json`),
          "utf8",
        ),
      );
      assert.deepEqual(lock.requested, ["router-link"]);
      assert.deepEqual(
        lock.items.map((item: { id: string; origin: string }) => [
          item.id,
          item.origin,
        ]),
        [
          ["anchor", "transitive"],
          ["router-link", "explicit"],
          ["tokens", "transitive"],
        ],
      );
      for (const name of [
        "anchor.svelte",
        "anchor.types.ts",
        "router-link.svelte",
        "router-link.types.ts",
      ])
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
          ["tokens", "anchor"],
        );
      const route =
        "src/routes/qualification/installed-router-link/+page.svelte";
      let module = path.posix.relative(
        path.posix.dirname(route),
        `${config.uiDir}/index.js`,
      );
      if (!module.startsWith(".")) module = `./${module}`;
      write(
        route,
        `<script lang="ts">import { RouterLink } from ${JSON.stringify(module)};import type { RouterLinkProps } from ${JSON.stringify(module)};const target:RouterLinkProps["target"]="_blank";const options:Pick<RouterLinkProps,"referrerpolicy"|"data-caller">={referrerpolicy:"no-referrer","data-caller":"yes"};let ref:HTMLAnchorElement|null=$state(null);</script><h1>Installed Anchor</h1><RouterLink id="default-anchor" class={['caller',{retained:true}]} href="/next?q=1#part" bind:ref>Next</RouterLink><RouterLink id="blank-anchor" href="/next" {target} {...options}>Blank</RouterLink><RouterLink id="rel-anchor" href="/next" target="_blank" rel="opener">Explicit</RouterLink><RouterLink id="empty-anchor" href="/next" target="_blank" rel="">Empty</RouterLink><RouterLink id="download-anchor" href="/download.txt" download="report.txt">Download</RouterLink><RouterLink id="named-anchor" href="/next" target="report">Named</RouterLink>`,
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
          "/qualification/installed-router-link",
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
      const anchor = (id: string) => {
        const tag = response.body.match(
          new RegExp('<a\\b[^>]*id="' + id + '"[^>]*>'),
        );
        assert.ok(tag, response.body);
        return tag![0];
      };
      assert.match(anchor("default-anchor"), /href="\/next\?q=1#part"/);
      assert.match(
        anchor("default-anchor"),
        /class="kit-anchor caller retained"/,
      );
      assert.doesNotMatch(
        anchor("default-anchor"),
        /\btarget=|\brel=|role="button"/,
      );
      assert.match(anchor("blank-anchor"), /target="_blank"/);
      assert.match(anchor("blank-anchor"), /rel="noopener noreferrer"/);
      assert.match(anchor("blank-anchor"), /referrerpolicy="no-referrer"/);
      assert.match(anchor("blank-anchor"), /data-caller="yes"/);
      assert.match(anchor("rel-anchor"), /rel="opener"/);
      assert.match(anchor("empty-anchor"), /rel=""/);
      assert.match(anchor("download-anchor"), /download="report.txt"/);
      assert.match(anchor("named-anchor"), /target="report"/);
      assert.doesNotMatch(anchor("named-anchor"), /\brel=/);
      const installed = snapshotTree(fixture.root);
      assert.equal(run(["add", "router-link"]).status, "no_change");
      assert.equal(run(["sync"]).status, "no_change");
      assert.deepEqual(snapshotTree(fixture.root), installed);
    } finally {
      fixture.cleanup();
    }
  });
