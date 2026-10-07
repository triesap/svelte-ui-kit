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

test("actual Spinner manifest advertises complete native sources, types and tokens ownership", () => {
  const loaded = loadRegistrySnapshot(createAssetProvider(process.cwd()));
  assert.equal(loaded.ok, true, JSON.stringify(loaded));
  if (!loaded.ok) return;
  const spinner = loaded.value.items.find((item) => item.id === "spinner")!;
  assert.ok(spinner);
  assert.deepEqual(spinner.manifest.registryDependencies, ["tokens"]);
  assert.deepEqual(spinner.manifest.npmDependencies, []);
  assert.deepEqual(
    spinner.manifest.exports.map((entry) => [entry.name, entry.kind]),
    [
      ["Spinner", "value"],
      ["SpinnerMode", "type"],
      ["SpinnerProps", "type"],
    ],
  );
  assert.equal(spinner.files.length, 3);
  assert.ok(
    spinner.files.every(
      (file) => file.owner === "spinner" && file.cohort === "spinner",
    ),
  );
});
for (const custom of [false, true])
  test(`real CLI Spinner installs, compiles, renders and replays in ${custom ? "custom" : "default"} consumer`, () => {
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
      const cli = path.resolve("dist/cli/main.js");
      const run = (args: string[]) => {
        const result = spawnSync(
          process.execPath,
          [cli, ...args, "--json", "--cwd", fixture.root],
          { cwd: fixture.root, encoding: "utf8", timeout: 30000 },
        );
        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.equal(result.stderr, "");
        return JSON.parse(result.stdout);
      };
      run(["init"]);
      const before = snapshotTree(fixture.root);
      run(["add", "spinner", "--dry-run"]);
      assert.deepEqual(snapshotTree(fixture.root), before);
      run(["add", "spinner"]);
      const lock = JSON.parse(
        readFileSync(
          path.join(fixture.root, `${paths.stateDir}/kit.lock.json`),
          "utf8",
        ),
      );
      assert.deepEqual(lock.requested, ["spinner"]);
      assert.deepEqual(
        lock.items.map((item: { id: string; origin: string }) => [
          item.id,
          item.origin,
        ]),
        [
          ["spinner", "explicit"],
          ["tokens", "transitive"],
        ],
      );
      const source = readFileSync(
        path.join(fixture.root, config.uiDir, "spinner.svelte"),
      );
      assert.ok(source.equals(readFileSync("registry/ui/spinner.svelte")));
      for (const file of lock.files)
        assert.equal(
          file.baseHash,
          sha256Hex(readFileSync(path.join(fixture.root, file.path))),
        );
      const css = readFileSync(path.join(fixture.root, paths.kitCss), "utf8"),
        parsed = parseManagedCss(css);
      assert.equal(parsed.ok, true, JSON.stringify(parsed));
      if (parsed.ok)
        assert.deepEqual(
          parsed.value.blocks.map((block) => block.id),
          ["tokens", "spinner"],
        );
      const route = "src/routes/qualification/installed-spinner/+page.svelte";
      let specifier = path.posix.relative(
        path.posix.dirname(route),
        `${config.uiDir}/index.js`,
      );
      if (!specifier.startsWith(".")) specifier = "./" + specifier;
      write(
        route,
        `<script lang="ts">import { Spinner } from ${JSON.stringify(specifier)};import type { SpinnerMode, SpinnerProps } from ${JSON.stringify(specifier)};const mode: SpinnerMode="decorative";const props:SpinnerProps={mode};</script><h1>Installed Spinner</h1><Spinner id="default-status" class="caller"/><Spinner id="named-status" label="Saving" data-operation="save"/><Spinner id="decorative" {...props}/>`,
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
          "/qualification/installed-spinner",
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
      assert.equal((response.body.match(/role="status"/g) ?? []).length, 2);
      assert.equal((response.body.match(/kit-spinner-label/g) ?? []).length, 2);
      assert.match(response.body, /kit-spinner caller/);
      assert.match(response.body, /Saving/);
      assert.match(response.body, /Loading/);
      assert.match(
        response.body,
        /<span[^>]*id="decorative"[^>]*aria-hidden="true"/,
      );
      const installed = snapshotTree(fixture.root);
      assert.equal(run(["add", "spinner"]).status, "no_change");
      assert.equal(run(["sync"]).status, "no_change");
      assert.deepEqual(snapshotTree(fixture.root), installed);
    } finally {
      fixture.cleanup();
    }
  });
