import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { before, after, test } from "node:test";
import type { KitLock } from "../../src/codegen/lock.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { installIndependentCli } from "../helpers/packaged-cli.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

let installed: ReturnType<typeof installIndependentCli>;
before(() => {
  installed = installIndependentCli();
});
after(() => installed?.cleanup());

test("runtime guards reject real authoring source/build/fixtures modules network and subprocesses", () => {
  assert.equal(existsSync(installed.author), false);
  for (const file of [
    "src/cli/main.ts",
    "dist/cli/main.js",
    "tests/fixtures/consumer/package.json",
  ]) {
    const target = path.join(installed.checkout, file);
    assert.ok(existsSync(target));
    const denied = installed.runNode(
      [
        "--eval",
        `try {require('node:fs').readFileSync(${JSON.stringify(target)}); process.exitCode = 1;} catch(e) {if(e.code !== 'OWNED_AUTHORING_UNAVAILABLE') throw e; console.log(e.code);}`,
      ],
      installed.root,
      "real-source-access-control",
    );
    assert.equal(denied.status, 0, denied.stdout + denied.stderr);
    assert.match(denied.stdout, /OWNED_AUTHORING_UNAVAILABLE/);
    assert.deepEqual(denied.guardEvents, [
      { kind: "authoring-access", code: "OWNED_AUTHORING_UNAVAILABLE" },
    ]);
  }
  const network = installed.runNode(
    [
      "--eval",
      "try {fetch('https://github.com/');process.exitCode=1;} catch(e) {if(e.code !== 'OWNED_NETWORK_DISABLED') throw e; console.log(e.code);}",
    ],
    installed.root,
    "live-network-control",
  );
  assert.equal(network.status, 0, network.stdout + network.stderr);
  assert.match(network.stdout, /OWNED_NETWORK_DISABLED/);
  const module = installed.runNode(
    [
      "--eval",
      `import(${JSON.stringify(path.join(installed.checkout, "dist/cli/main.js"))}).then(()=>{process.exitCode=1;}).catch(e=>{if(e.code !== 'OWNED_AUTHORING_UNAVAILABLE') throw e;console.log(e.code);});`,
    ],
    installed.root,
    "source-module-control",
  );
  assert.equal(module.status, 0, module.stdout + module.stderr);
  assert.match(module.stdout, /OWNED_AUTHORING_UNAVAILABLE/);
  const child = installed.runNode(
    [
      "--eval",
      "try {require('node:child_process').spawnSync(process.execPath,['--version']);process.exitCode=1;}catch(e){if(e.code !== 'OWNED_SUBPROCESS_DISABLED')throw e;console.log(e.code);}",
    ],
    installed.root,
    "subprocess-control",
  );
  assert.equal(child.status, 0, child.stdout + child.stderr);
  assert.match(child.stdout, /OWNED_SUBPROCESS_DISABLED/);
});

for (const custom of [false, true])
  test(`installed CLI uses only packed assets after author removal ${custom ? "custom" : "default"}`, () => {
    const consumer = installed.prepareConsumer(custom);
    const run = (args: string[]) => {
      const result = installed.run(args, consumer.root);
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.equal(result.stderr, "");
      assert.deepEqual(
        result.guardEvents,
        [],
        "actual CLI must attempt no authoring/network/subprocess access",
      );
      return JSON.parse(result.stdout);
    };
    const registry = JSON.parse(
      readFileSync(
        path.join(installed.packageRoot, "registry/registry.json"),
        "utf8",
      ),
    );
    assert.equal(registry.items.length, 22);
    const beforeViews = snapshotTree(consumer.root);
    for (const item of registry.items) {
      const viewed = run(["view", item.id, "--source"]);
      assert.equal(viewed.status, "success");
      assert.equal(viewed.data.item.id, item.id);
      for (const source of viewed.data.sources)
        assert.equal(source.digest, sha256Hex(Buffer.from(source.text)));
    }
    assert.deepEqual(snapshotTree(consumer.root), beforeViews);
    assert.equal(run(["init", "--dry-run"]).status, "planned");
    assert.deepEqual(snapshotTree(consumer.root), beforeViews);
    run(["init"]);
    for (const item of ["button", "dialog", "field", "menu"])
      run(["add", item]);
    const lock = JSON.parse(
      readFileSync(
        path.join(consumer.root, consumer.paths.stateDir, "kit.lock.json"),
        "utf8",
      ),
    ) as KitLock;
    assert.deepEqual(lock.requested, ["button", "dialog", "field", "menu"]);
    assert.deepEqual(
      lock.items.map((item) => item.id),
      ["button", "dialog", "field", "menu", "spinner", "tokens"],
    );
    for (const file of lock.files)
      assert.equal(
        sha256Hex(readFileSync(path.join(consumer.root, file.path))),
        file.baseHash,
        file.path,
      );
    const installedTree = snapshotTree(consumer.root);
    assert.equal(run(["sync", "--dry-run"]).status, "no_change");
    assert.equal(run(["sync"]).status, "no_change");
    assert.equal(run(["doctor", "--strict"]).status, "success");
    assert.deepEqual(snapshotTree(consumer.root), installedTree);
    for (const item of ["button", "dialog", "field", "menu"])
      assert.equal(run(["add", item]).status, "no_change");
    assert.deepEqual(snapshotTree(consumer.root), installedTree);
  });

test("copied packed CLI cannot substitute unavailable author assets or hide a missing bundle", () => {
  const consumer = path.join(installed.root, "default-consumer");
  const before = snapshotTree(consumer);
  const fallback = installed.clone("owned-source-fallback-control");
  const main = path.join(fallback, "dist/cli/main.js");
  const code = readFileSync(main, "utf8");
  const needle = 'fileURLToPath(new URL("../../", import.meta.url))';
  assert.equal(code.split(needle).length, 7, "actual six command asset roots");
  writeFileSync(
    main,
    code.replaceAll(needle, JSON.stringify(installed.author)),
  );
  const sourceBound = installed.run(
    ["view", "dialog", "--source"],
    consumer,
    fallback,
  );
  assert.equal(sourceBound.status, 12, sourceBound.stdout + sourceBound.stderr);
  assert.equal(JSON.parse(sourceBound.stdout).status, "error");
  const missing = installed.clone("owned-missing-bundle-control");
  rmSync(path.join(missing, "registry/registry.json"));
  const absent = installed.run(
    ["view", "dialog", "--source"],
    consumer,
    missing,
  );
  assert.equal(absent.status, 12, absent.stdout + absent.stderr);
  assert.ok(
    JSON.parse(absent.stdout).diagnostics.some(
      (entry: { code: string }) => entry.code === "ASSET_MISSING",
    ),
  );
  assert.deepEqual(snapshotTree(consumer), before);
});
