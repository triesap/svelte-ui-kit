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

test("real Status declares complete native exports and direct source dependencies", () => {
  const loaded = loadRegistrySnapshot(createAssetProvider(process.cwd()));
  assert.equal(loaded.ok, true, JSON.stringify(loaded));
  if (!loaded.ok) return;
  const item = loaded.value.items.find((entry) => entry.id === "status")!;
  assert.deepEqual(item.manifest.registryDependencies, ["tokens"]);
  assert.deepEqual(item.manifest.npmDependencies, []);
  assert.deepEqual(
    item.manifest.exports.map((entry) => [entry.name, entry.kind]),
    [
      ["Status", "value"],
      ["StatusProps", "type"],
      ["StatusRole", "type"],
      ["StatusPoliteness", "type"],
    ],
  );
  assert.equal(item.files.length, 3);
  assert.ok(
    item.files.every(
      (file) => file.owner === "status" && file.cohort === "status",
    ),
  );
  const component = readFileSync("registry/ui/status.svelte", "utf8");
  assert.match(
    component,
    /import type \{ StatusProps \} from "\.\/status\.types\.js"/,
  );
  assert.doesNotMatch(
    component,
    /from ["'][^"']*(?:index|svelte-ui-kit|src\/)[^"']*["']/,
  );
});
for (const custom of [false, true])
  test(`real Status installs and renders in ${custom ? "custom" : "default"} consumer`, () => {
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
      run(["add", "status", "--dry-run"]);
      assert.deepEqual(snapshotTree(fixture.root), before);
      run(["add", "status"]);
      const lock = JSON.parse(
        readFileSync(
          path.join(fixture.root, `${paths.stateDir}/kit.lock.json`),
          "utf8",
        ),
      );
      assert.deepEqual(lock.requested, ["status"]);
      assert.deepEqual(
        lock.items.map((item: { id: string; origin: string }) => [
          item.id,
          item.origin,
        ]),
        [
          ["status", "explicit"],
          ["tokens", "transitive"],
        ],
      );
      for (const name of ["status.svelte", "status.types.ts"])
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
          ["tokens", "status"],
        );
      const route = "src/routes/qualification/installed-status/+page.svelte";
      let module = path.posix.relative(
        path.posix.dirname(route),
        `${config.uiDir}/index.js`,
      );
      if (!module.startsWith(".")) module = `./${module}`;
      write(
        route,
        '<script lang="ts">import { Status } from __MODULE__;import type {StatusProps,StatusRole,StatusPoliteness} from __MODULE__;let ref:HTMLParagraphElement|null=$state(null);const role:StatusRole="alert";const politeness:StatusPoliteness="assertive";const attrs:Pick<StatusProps,"title"|"data-caller">={title:"Feedback message","data-caller":"preserved"};</script><h1>Installed Status</h1><Status id="default-status" class={["caller",{retained:true}]} bind:ref {...attrs}><span aria-hidden="true">!</span>Saved changes.</Status><Status id="named-status" {role} {politeness} atomic={false} aria-label="Save problem" data-state="caller-owned">Retry saving.</Status><Status id="native-status" aria-live="off" aria-atomic={false} aria-relevant="removals" dir="rtl" style="color:navy">Explicit native attributes</Status><Status id="null-status" aria-live={null} aria-atomic={null}>Native omitted attributes</Status><Status id="decorative-status" aria-hidden="true">Decorative copy</Status>'.replaceAll(
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
          "/qualification/installed-status",
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
      const status = (id: string) => {
        const tag = response.body.match(
          new RegExp('<p\\b[^>]*id="' + id + '"[^>]*>'),
        );
        assert.ok(tag, response.body);
        return tag![0];
      };
      assert.match(
        status("default-status"),
        /class="kit-status caller retained"/,
      );
      assert.match(status("default-status"), /title="Feedback message"/);
      assert.match(status("default-status"), /data-caller="preserved"/);
      assert.match(status("default-status"), /role="status"/);
      assert.match(status("default-status"), /aria-live="polite"/);
      assert.match(status("default-status"), /aria-atomic="true"/);
      assert.match(
        response.body,
        /<span aria-hidden="true">!<\/span>Saved changes./,
      );
      assert.match(status("named-status"), /aria-label="Save problem"/);
      assert.match(status("named-status"), /data-state="caller-owned"/);
      assert.match(status("named-status"), /role="alert"/);
      assert.match(status("named-status"), /aria-live="assertive"/);
      assert.match(status("named-status"), /aria-atomic="false"/);
      assert.match(status("native-status"), /aria-live="off"/);
      assert.match(status("native-status"), /aria-atomic="false"/);
      assert.match(status("native-status"), /aria-relevant="removals"/);
      assert.match(status("native-status"), /dir="rtl"/);
      assert.match(status("native-status"), /style="color:navy"/);
      assert.match(status("native-status"), /role="status"/);
      assert.doesNotMatch(status("null-status"), /aria-live=|aria-atomic=/);
      assert.match(status("decorative-status"), /aria-hidden="true"/);
      assert.equal((response.body.match(/role="status"/g) || []).length, 4);
      assert.equal((response.body.match(/role="alert"/g) || []).length, 1);
      const installed = snapshotTree(fixture.root);
      assert.equal(run(["add", "status"]).status, "no_change");
      assert.equal(run(["sync"]).status, "no_change");
      assert.deepEqual(snapshotTree(fixture.root), installed);
    } finally {
      fixture.cleanup();
    }
  });
