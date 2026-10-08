/** Real standalone consumer with explicit dependencies and an installed CLI. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import type { KitLock } from "../../src/codegen/lock.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { installIndependentCli } from "./packaged-cli.js";
import { auditConsumerGraph } from "./consumer-graph.js";
import { refreshRegistryContent } from "./registry-content.js";
import { runFixtureScript } from "./fixture.js";
import { snapshotTree } from "./tree-snapshot.js";

export function buildPackagedConsumer(custom: boolean) {
  const cli = installIndependentCli();
  try {
    const app = cli.prepareConsumer(custom);
    const read = (file: string) =>
      readFileSync(path.join(app.root, file), "utf8");
    const manifestBefore = read("package.json");
    const manifest = JSON.parse(manifestBefore);
    for (const role of ["dependencies", "devDependencies", "peerDependencies"])
      assert.equal(manifest[role]?.["svelte-ui-kit"], undefined);
    for (const file of [
      "svelte.config.js",
      "vite.config.ts",
      "tsconfig.json",
      "src/app.html",
      "src/routes/+layout.svelte",
    ])
      app.write(file, readFileSync(`tests/fixtures/consumer/${file}`, "utf8"));
    app.write(
      "src/routes/+page.svelte",
      readFileSync("tests/fixtures/packaged-consumer/+page.svelte", "utf8"),
    );
    let module = path.posix.relative(
      "src/routes",
      `${app.config.uiDir}/index.js`,
    );
    if (!module.startsWith(".")) module = `./${module}`;
    let catalog = readFileSync(
      "tests/fixtures/qualification/catalog-hydration/Catalog.svelte",
      "utf8",
    );
    assert.equal(catalog.match(/__UI_MODULE__/g)?.length, 2);
    // The application owns selection across native portal content unmounts.
    const state = "let ready = $state(false);";
    const svelteImport = 'import { onMount } from "svelte";';
    const radioGroup = '<UI.MenuRadioGroup value={on ? "b" : "a"}';
    assert.equal(catalog.split(state).length, 2);
    assert.equal(catalog.split(svelteImport).length, 2);
    assert.equal(catalog.split(radioGroup).length, 2);
    catalog = catalog
      .replace(svelteImport, 'import { onMount, untrack } from "svelte";')
      .replace(
        state,
        `${state}\n  let menuValue = $state(untrack(() => on ? "b" : "a"));`,
      )
      .replace(radioGroup, "<UI.MenuRadioGroup bind:value={menuValue}");
    app.write(
      "src/routes/Catalog.svelte",
      catalog.replaceAll("__UI_MODULE__", module),
    );
    const run = (
      args: string[],
      packageRoot = cli.packageRoot,
      expected = 0,
    ) => {
      const result = cli.run(args, app.root, packageRoot);
      assert.equal(result.status, expected, result.stdout + result.stderr);
      assert.equal(result.stderr, "");
      assert.deepEqual(result.guardEvents, []);
      return JSON.parse(result.stdout);
    };
    const registry = JSON.parse(
      readFileSync(
        path.join(cli.packageRoot, "registry/registry.json"),
        "utf8",
      ),
    );
    assert.equal(registry.items.length, 22);
    run(["init"]);
    for (const item of registry.items) run(["add", item.id]);
    assert.equal(
      read("package.json"),
      manifestBefore,
      "CLI never installs dependencies or changes their declaration",
    );
    const lockPath = `${app.paths.stateDir}/kit.lock.json`;
    const lock = () => JSON.parse(read(lockPath)) as KitLock;
    const initial = lock();
    assert.deepEqual(
      initial.requested,
      registry.items.map((item: { id: string }) => item.id).sort(),
    );
    const generated = new Map<string, string>();
    const collectSources = (folder: string) => {
      for (const entry of readdirSync(
        path.join(app.root, app.config.uiDir, folder),
        { withFileTypes: true },
      )) {
        const file = path.posix.join(folder, entry.name);
        if (entry.isDirectory()) collectSources(file);
        else if (/\.(ts|svelte)$/.test(file))
          generated.set(file, read(`${app.config.uiDir}/${file}`));
      }
    };
    collectSources("");
    const initialGraph = auditConsumerGraph(generated);
    for (const file of initial.files) {
      assert.equal(
        sha256Hex(readFileSync(path.join(app.root, file.path))),
        file.baseHash,
        file.path,
      );
      if (
        file.path.startsWith(`${app.config.uiDir}/`) &&
        file.path !== app.paths.rootExports
      ) {
        const relative = file.path.slice(app.config.uiDir.length + 1);
        if (!relative.startsWith("_kit/"))
          assert.equal(
            read(file.path),
            readFileSync(
              path.join(cli.packageRoot, "registry/ui", relative),
              "utf8",
            ),
          );
      }
    }
    const exports = registry.items.flatMap(
      (item: { manifest: string }) =>
        JSON.parse(
          readFileSync(
            path.join(cli.packageRoot, "registry", item.manifest),
            "utf8",
          ),
        ).exports,
    ) as { name: string; kind: string }[];
    const values = exports
      .filter((e) => e.kind === "value")
      .map((e) => `UI.${e.name}`);
    const types = exports.filter((e) => e.kind === "type").map((e) => e.name);
    assert.equal(values.length, 60);
    assert.equal(types.length, 69);
    let publicModule = path.posix.relative(
      "src",
      app.paths.rootExports.replace(/\.ts$/, ".js"),
    );
    if (!publicModule.startsWith(".")) publicModule = `./${publicModule}`;
    app.write(
      "src/catalog-exports.ts",
      `import * as UI from ${JSON.stringify(publicModule)};\nimport type {${types.join(",")}} from ${JSON.stringify(publicModule)};\nexport const values = [${values.join(",")}];\nexport type Types = [${types.join(",")}];\n`,
    );

    // Real safe/custom/conflicting transitions use copied installed assets only.
    // These incoming versions are synthetic qualification inputs, not history.
    const badge = `${app.config.uiDir}/badge.svelte`,
      button = `${app.config.uiDir}/button.svelte`;
    const badgeLocal =
      read(badge) + "\n<!-- Application-owned badge customization -->\n";
    app.write(badge, badgeLocal);
    const appCss =
      read(app.paths.appCss) +
      "\n:root { --kit-color-primary: rgb(12, 34, 56); }\n";
    app.write(app.paths.appCss, appCss);
    const incoming = cli.clone(custom ? "custom-incoming" : "default-incoming");
    const sourcePath = path.join(incoming, "registry/ui/button.svelte");
    const source = readFileSync(sourcePath, "utf8");
    assert.equal(source.split("<button\n").length, 2);
    const safeSource = source.replace(
      "<button\n",
      '<button\n  data-packed-revision="safe"\n',
    );
    writeFileSync(sourcePath, safeSource);
    const itemPath = path.join(incoming, "registry/ui/button.json");
    const item = JSON.parse(readFileSync(itemPath, "utf8"));
    item.version = "8.0.1";
    writeFileSync(itemPath, JSON.stringify(item));
    refreshRegistryContent(incoming);
    const beforeDry = snapshotTree(app.root);
    assert.equal(run(["sync", "--dry-run"], incoming).status, "planned");
    assert.deepEqual(snapshotTree(app.root), beforeDry);
    run(["sync"], incoming);
    assert.equal(read(button), safeSource);
    assert.equal(read(badge), badgeLocal);
    assert.equal(read(app.paths.appCss), appCss);
    assert.deepEqual(
      lock().files.find((file) => file.path === badge),
      initial.files.find((file) => file.path === badge),
    );
    const safeTree = snapshotTree(app.root);
    assert.equal(run(["sync"], incoming).status, "no_change");
    run(["doctor", "--strict"], incoming);
    assert.deepEqual(snapshotTree(app.root), safeTree);
    const buttonLocal =
      read(button) + "\n<!-- Application-owned button customization -->\n";
    app.write(button, buttonLocal);
    writeFileSync(
      sourcePath,
      safeSource.replace(
        'data-packed-revision="safe"',
        'data-packed-revision="conflict"',
      ),
    );
    item.version = "8.0.2";
    writeFileSync(itemPath, JSON.stringify(item));
    refreshRegistryContent(incoming);
    const beforeConflict = snapshotTree(app.root);
    assert.equal(run(["sync"], incoming, 10).status, "conflict");
    assert.deepEqual(snapshotTree(app.root), beforeConflict);
    assert.equal(read(button), buttonLocal);
    assert.equal(read(badge), badgeLocal);
    assert.equal(read(app.paths.appCss), appCss);

    // Generated source and explicit application dependencies must suffice even
    // when the installed CLI and copied incoming registry cease to exist.
    rmSync(path.join(cli.root, "host"), { recursive: true, force: true });
    rmSync(incoming, { recursive: true, force: true });
    assert.equal(existsSync(cli.packageRoot), false);
    assert.equal(existsSync(incoming), false);
    generated.clear();
    collectSources("");
    const graph = auditConsumerGraph(generated);

    const logs: {
      script: string;
      status: number | null;
      stdout: string;
      stderr: string;
    }[] = [];
    for (const script of ["check", "build"]) {
      const result = runFixtureScript(app.root, script, 240000);
      logs.push({ script, ...result });
      assert.equal(result.status, 0, result.stdout + result.stderr);
    }
    const production: Record<string, string> = {};
    const collectBuild = (folder: string) => {
      for (const entry of readdirSync(path.join(app.root, folder), {
        withFileTypes: true,
      })) {
        const file = path.posix.join(folder, entry.name);
        if (entry.isDirectory()) collectBuild(file);
        else {
          const bytes = readFileSync(path.join(app.root, file));
          production[file] = sha256Hex(bytes);
          if (file.endsWith(".js"))
            assert.doesNotMatch(
              bytes.toString(),
              /\b(?:from\s*|import\s*\(\s*)["']svelte-ui-kit(?:[/"'])/,
              file,
            );
        }
      }
    };
    collectBuild("build");
    const handler = path.join(app.root, "build/handler.js");
    const rendered = spawnSync(
      process.execPath,
      ["tests/helpers/render-built-consumer.mjs", handler, "/"],
      { encoding: "utf8", timeout: 30000 },
    );
    assert.equal(rendered.status, 0, rendered.stdout + rendered.stderr);
    const ssr = JSON.parse(rendered.stdout);
    assert.equal(ssr.status, 200);
    assert.match(ssr.body, /Actual packed complete catalog/);
    assert.match(ssr.body, /data-packed-revision="safe"/);
    assert.equal(ssr.handlerSha256, production["build/handler.js"]);
    const evidence = {
      custom,
      cliRemoved: true,
      installed: cli.evidence,
      mapping: app.config,
      requested: initial.requested,
      graph,
      initialGraph,
      values: values.length,
      types: types.length,
      initialLock: initial,
      finalLock: lock(),
      logs,
      production,
      ssr,
    };
    return { ...app, handler, evidence, cleanup: cli.cleanup };
  } catch (error) {
    cli.cleanup();
    throw error;
  }
}
