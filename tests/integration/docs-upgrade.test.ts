import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { installIndependentCli } from "../helpers/packaged-cli.js";
import { refreshRegistryContent } from "../helpers/registry-content.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import { runFixtureScript } from "../helpers/fixture.js";
import { sha256Hex } from "../../src/codegen/digest.js";

import { documentedExample } from "../helpers/documented-example.js";
const readme = readFileSync("docs/getting-started.md", "utf8");
function commands(marker: string, count: number) {
  const file =
    marker === "documented-upgrade-workflow"
      ? "docs/guides/upgrading.md"
      : "docs/getting-started.md";
  const lines = documentedExample(file, marker, "sh")
    .split("\n")
    .filter((line) => line.startsWith("node "));
  assert.equal(lines.length, count);
  return lines.map((line) => {
    const match = /^node "\$(CLI|INCOMING_CLI)" --cwd "\$APP" ([-a-z ]+)$/.exec(
      line,
    );
    assert.ok(match, line);
    return {
      incoming: match[1] === "INCOMING_CLI",
      args: match[2]!.split(" "),
    };
  });
}
const initial = commands("documented-cli-workflow", 7);
const items = commands("documented-item-install", 6);
const upgrade = commands("documented-upgrade-workflow", 4);

for (const custom of [false, true])
  test(`documented packed installation customization upgrades and retirement ${custom ? "custom" : "default"}`, (t) => {
    const cli = installIndependentCli();
    t.after(cli.cleanup);
    assert.ok(
      readme.includes('pnpm --dir "$CLI_HOST" add --ignore-scripts "$ARCHIVE"'),
    );
    const host = path.join(cli.root, "documented-cli-host");
    const archive = path.join(cli.root, "documented-archive.tgz");
    mkdirSync(host);
    writeFileSync(
      path.join(host, "package.json"),
      JSON.stringify({ private: true }),
    );
    cpSync(cli.retainedArchive, archive);
    assert.equal(sha256Hex(readFileSync(archive)), cli.evidence.archiveSha256);
    const installed = spawnSync(
      "pnpm",
      ["--dir", host, "add", "--ignore-scripts", archive],
      {
        encoding: "utf8",
        timeout: 120000,
        env: {
          ...process.env,
          npm_config_offline: "true",
          npm_config_strict_peer_dependencies: "true",
          npm_config_engine_strict: "true",
        },
      },
    );
    assert.equal(installed.status, 0, installed.stdout + installed.stderr);
    rmSync(archive);
    const documentedPackage = path.join(host, "node_modules/svelte-ui-kit");
    assert.equal(
      sha256Hex(readFileSync(path.join(documentedPackage, "dist/cli/main.js"))),
      cli.evidence.executableSha256,
    );
    const app = cli.prepareConsumer(custom);
    const read = (file: string) =>
      readFileSync(path.join(app.root, file), "utf8");
    for (const file of [
      "svelte.config.js",
      "vite.config.ts",
      "tsconfig.json",
      "src/app.html",
      "src/routes/+layout.svelte",
    ])
      app.write(file, readFileSync(`tests/fixtures/consumer/${file}`, "utf8"));
    const manifest = read("package.json");
    const run = (args: string[], pkg = documentedPackage, expected = 0) => {
      const result = cli.run(args, app.root, pkg);
      assert.equal(result.status, expected, result.stdout + result.stderr);
      assert.equal(result.stderr, "");
      assert.deepEqual(result.guardEvents, []);
      return JSON.parse(result.stdout);
    };
    for (const command of [...initial, ...items]) {
      const before = snapshotTree(app.root);
      const envelope = run(command.args);
      if (
        command.args.includes("--dry-run") ||
        ["info", "view", "doctor"].includes(command.args[0]!) ||
        envelope.status === "no_change"
      )
        assert.deepEqual(snapshotTree(app.root), before);
    }
    const state = `${app.paths.stateDir}/kit.json`;
    assert.deepEqual(JSON.parse(read(state)).requested.sort(), [
      "button",
      "dialog",
      "field",
      "menu",
    ]);
    assert.equal(read("package.json"), manifest);
    const spinner = `${app.config.uiDir}/spinner.svelte`;
    const button = `${app.config.uiDir}/button.svelte`;
    const localSpinner =
      read(spinner) + "\n<!-- Documented application customization -->\n";
    const localCss =
      read(app.paths.appCss) +
      "\n:root { --kit-color-primary: rgb(12, 34, 56); }\n";
    app.write(spinner, localSpinner);
    app.write(app.paths.appCss, localCss);
    const customizedTree = snapshotTree(app.root);
    const customized = run(["doctor", "--strict"]);
    assert.equal(customized.data.ready, true);
    assert.ok(
      customized.data.checks.some(
        (check: { code: string; status: string }) =>
          check.code === "DOCTOR_SOURCE_CUSTOMIZED" &&
          check.status === "customized",
      ),
    );
    assert.deepEqual(snapshotTree(app.root), customizedTree);
    rmSync(path.join(app.root, spinner));
    const brokenTree = snapshotTree(app.root);
    const broken = run(["doctor", "--strict"], cli.packageRoot, 3);
    assert.equal(broken.data.ready, false);
    assert.ok(
      broken.data.checks.some(
        (check: { status: string }) => check.status === "broken",
      ),
    );
    assert.deepEqual(snapshotTree(app.root), brokenTree);
    app.write(spinner, localSpinner);

    // Synthetic copied installed revisions qualify the documented commands;
    // neither revision is asserted to be a published release.
    const incoming = cli.clone("documented-incoming");
    const sourcePath = path.join(incoming, "registry/ui/button.svelte");
    const itemPath = path.join(incoming, "registry/ui/button.json");
    const source = readFileSync(sourcePath, "utf8");
    assert.equal(source.split("<button\n").length, 2);
    const safeSource = source.replace(
      "<button\n",
      '<button\n data-doc-upgrade="safe"\n',
    );
    writeFileSync(sourcePath, safeSource);
    const item = JSON.parse(readFileSync(itemPath, "utf8"));
    item.version = "9.0.1";
    writeFileSync(itemPath, JSON.stringify(item));
    refreshRegistryContent(incoming);
    for (const command of upgrade) {
      assert.equal(command.incoming, true);
      const before = snapshotTree(app.root);
      run(command.args, incoming);
      if (
        command.args.includes("--dry-run") ||
        ["view", "doctor"].includes(command.args[0]!)
      )
        assert.deepEqual(snapshotTree(app.root), before);
    }
    assert.equal(read(button), safeSource);
    assert.equal(read(spinner), localSpinner);
    assert.equal(read(app.paths.appCss), localCss);
    app.write(button, safeSource + "\n<!-- Local button edit -->\n");
    const nextSource = safeSource.replace(
      'data-doc-upgrade="safe"',
      'data-doc-upgrade="reviewed"',
    );
    writeFileSync(sourcePath, nextSource);
    item.version = "9.0.2";
    writeFileSync(itemPath, JSON.stringify(item));
    refreshRegistryContent(incoming);
    const conflictTree = snapshotTree(app.root);
    assert.equal(run(["sync"], incoming, 10).status, "conflict");
    assert.deepEqual(snapshotTree(app.root), conflictTree);
    // Deliberate operator reconciliation to the exact reviewed incoming bytes.
    app.write(button, nextSource);
    run(["sync", "--dry-run"], incoming);
    run(["sync"], incoming);
    run(["doctor", "--strict"], incoming);
    assert.equal(read(button), nextSource);
    const config = JSON.parse(read(state));
    config.requested = ["button"];
    app.write(state, JSON.stringify(config));
    const retiringTree = snapshotTree(app.root);
    run(["sync", "--dry-run"], incoming);
    assert.deepEqual(snapshotTree(app.root), retiringTree);
    const retired = run(["sync"], incoming);
    assert.equal(retired.status, "warning");
    assert.ok(
      retired.diagnostics.some(
        (d: { code: string }) => d.code === "RETIRED_IMPORTS_REVIEW_REQUIRED",
      ),
    );
    assert.equal(read(spinner), localSpinner);
    assert.equal(read(app.paths.appCss), localCss);
    assert.equal(read("package.json"), manifest);
    const replayTree = snapshotTree(app.root);
    assert.equal(run(["sync"], incoming).status, "no_change");
    run(["doctor", "--strict"], incoming);
    assert.deepEqual(snapshotTree(app.root), replayTree);
    let module = path.posix.relative(
      "src/routes",
      app.paths.rootExports.replace(/\.ts$/, ".js"),
    );
    if (!module.startsWith(".")) module = `./${module}`;
    app.write(
      "src/routes/+page.svelte",
      `<script lang="ts">import * as UI from ${JSON.stringify(module)};</script>\n<h1>Documented workflow</h1><UI.Button>Verified source</UI.Button>\n`,
    );
    for (const script of ["check", "build"]) {
      const result = runFixtureScript(app.root, script, 240000);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    }
    const ssr = spawnSync(
      process.execPath,
      [
        "tests/helpers/render-built-consumer.mjs",
        path.join(app.root, "build/handler.js"),
        "/",
      ],
      { encoding: "utf8", timeout: 30000 },
    );
    assert.equal(ssr.status, 0, ssr.stdout + ssr.stderr);
    assert.equal(JSON.parse(ssr.stdout).status, 200);
    assert.match(JSON.parse(ssr.stdout).body, /data-doc-upgrade="reviewed"/);
  });
