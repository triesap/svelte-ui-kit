import assert from "node:assert/strict";
import {
  existsSync,
  chmodSync,
  cpSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
  symlinkSync,
} from "node:fs";
import path from "node:path";
import { before, after, test } from "node:test";
import type { KitLock } from "../../src/codegen/lock.js";
import { parse, stringify } from "yaml";
import { sha256Hex } from "../../src/codegen/digest.js";
import { installIndependentCli } from "../helpers/packaged-cli.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import {
  NATIVE_BASELINE,
  SVELTE_RUNTIME_BASELINE,
} from "../../src/project/native-dependency.js";
import {
  transientRoot,
  writerLockDir,
} from "../../src/codegen/transaction-types.js";

let installed: ReturnType<typeof installIndependentCli>;
before(() => {
  installed = installIndependentCli();
});
after(() => installed?.cleanup());

test("installed CLI resolves selected-workspace catalogs without source or subprocess access", () => {
  const consumer = installed.prepareConsumer(false, "catalog");
  const file = path.join(consumer.root, "package.json");
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  const workspacePath = path.join(consumer.root, "pnpm-workspace.yaml");
  const workspace = parse(readFileSync(workspacePath, "utf8"));
  const version =
    manifest.dependencies.svelte === "catalog:"
      ? workspace.catalog.svelte
      : manifest.dependencies.svelte;
  assert.equal(typeof version, "string");
  manifest.dependencies.svelte = "catalog:framework";
  writeFileSync(file, JSON.stringify(manifest));
  workspace.catalogs = {
    ...workspace.catalogs,
    framework: { svelte: version },
  };
  writeFileSync(workspacePath, stringify(workspace));
  const before = snapshotTree(consumer.root);
  const result = installed.run(["init", "--dry-run"], consumer.root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(JSON.parse(result.stdout).status, "planned");
  assert.deepEqual(result.guardEvents, []);
  assert.deepEqual(snapshotTree(consumer.root), before);
});

test("an installed runtime timeout fails after executing the owned child", () => {
  const marker = path.join(installed.root, "deadline-control-entered");
  assert.throws(
    () =>
      installed.runNode(
        [
          "--eval",
          `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'entered'); setInterval(() => {}, 1000);`,
        ],
        installed.root,
        "runtime-timeout-control",
        1000,
      ),
    (error: unknown) => {
      assert.ok(error instanceof assert.AssertionError);
      assert.equal((error.actual as NodeJS.ErrnoException).code, "ETIMEDOUT");
      return true;
    },
  );
  assert.equal(readFileSync(marker, "utf8"), "entered");
  const completed = installed.runNode(
    ["--eval", "console.log('completed')"],
    installed.root,
    "runtime-normal-completion-control",
    5000,
  );
  assert.equal(completed.status, 0, completed.stderr);
  assert.equal(completed.stdout.trim(), "completed");
  assert.deepEqual(completed.guardEvents, []);
});

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
    const writer = writerLockDir(consumer.paths.stateDir);
    consumer.write(
      `${writer}/owner.json`,
      JSON.stringify({
        schemaVersion: 1,
        transactionId: "11111111-1111-4111-8111-111111111111",
        pid: 999999999,
      }),
    );
    const retained = snapshotTree(consumer.root);
    const omission = installed.clone(
      `owned-unchanged-omission-${custom ? "custom" : "default"}`,
    );
    const module = path.join(omission, "dist/codegen/recovery.js");
    const source = readFileSync(module, "utf8");
    const start = source.indexOf("export function inspectUnchangedState(");
    const end = source.indexOf("export function inspectTransactions(", start);
    assert.ok(start >= 0 && end > start);
    writeFileSync(
      module,
      source.slice(0, start) +
        "export function inspectUnchangedState() { return []; }\n" +
        source.slice(end),
    );
    for (const args of [["init"], ["add", "button"], ["sync"]])
      for (const dry of [false, true]) {
        const operands = [...args, ...(dry ? ["--dry-run"] : [])];
        const refused = installed.run(operands, consumer.root);
        assert.equal(refused.status, 1, refused.stdout + refused.stderr);
        assert.deepEqual(refused.guardEvents, []);
        const envelope = JSON.parse(refused.stdout);
        assert.equal(envelope.status, "error");
        assert.deepEqual(envelope.changes, []);
        assert.ok(
          envelope.diagnostics.some(
            (entry: { code: string }) => entry.code === "WRITER_BUSY",
          ),
        );
        assert.deepEqual(snapshotTree(consumer.root), retained);
        const bypassed = installed.run(operands, consumer.root, omission);
        assert.equal(bypassed.status, 0, bypassed.stdout + bypassed.stderr);
        assert.equal(JSON.parse(bypassed.stdout).status, "no_change");
        assert.deepEqual(bypassed.guardEvents, []);
        assert.deepEqual(snapshotTree(consumer.root), retained);
      }
    // Exact owned test setup; the product never takes over this writer.
    rmSync(path.join(consumer.root, transientRoot(consumer.paths.stateDir)), {
      recursive: true,
    });
    const transaction = path.join(
      consumer.root,
      transientRoot(consumer.paths.stateDir),
      "transactions",
      "11111111-1111-4111-8111-111111111111",
    );
    mkdirSync(transaction, { recursive: true });
    const pending = snapshotTree(consumer.root);
    for (const args of [["init"], ["add", "button"], ["sync"]]) {
      const refused = installed.run(args, consumer.root);
      assert.equal(refused.status, 1, refused.stdout + refused.stderr);
      assert.deepEqual(refused.guardEvents, []);
      assert.ok(
        JSON.parse(refused.stdout).diagnostics.some(
          (entry: { code: string }) => entry.code === "RECOVERY_PENDING",
        ),
      );
      assert.deepEqual(snapshotTree(consumer.root), pending);
    }
    rmSync(path.join(consumer.root, transientRoot(consumer.paths.stateDir)), {
      recursive: true,
    });
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

test("separate installed CLI authenticates both native identities and preserves every refusal", () => {
  const consumer = installed.prepareConsumer(false, "native-authentication");
  const profiles = [NATIVE_BASELINE, SVELTE_RUNTIME_BASELINE];
  const distributions = new Map<string, string>();
  // Faults affect independent owned copies, never dependency-store inodes.
  for (const profile of profiles) {
    const link = path.join(consumer.root, "node_modules", profile.name);
    const native = path.join(consumer.root, `.owned-native-${profile.name}`);
    cpSync(realpathSync(link), native, { recursive: true });
    rmSync(link);
    symlinkSync(native, link);
    distributions.set(profile.name, native);
  }
  const run = (args: string[]) => {
    const result = installed.run(args, consumer.root);
    assert.equal(result.stderr, "");
    assert.deepEqual(
      result.guardEvents,
      [],
      "no source, network or subprocess fallback",
    );
    return { status: result.status, envelope: JSON.parse(result.stdout) };
  };
  for (const args of [
    ["init"],
    ["add", "switch"],
    ["info"],
    ["doctor", "--strict"],
  ]) {
    const result = run(args);
    assert.equal(result.status, 0, JSON.stringify(result.envelope));
  }
  const original = snapshotTree(consumer.root);
  for (const profile of profiles) {
    const native = distributions.get(profile.name)!;
    for (const fault of [
      "v-prefix",
      "build-metadata",
      "provenance",
      "runtime",
      "declaration",
      "archive",
      ...(profile.name === "svelte" ? ["build-id", "installer-shim"] : []),
    ]) {
      const file =
        fault === "declaration"
          ? path.join(consumer.root, "package.json")
          : fault === "archive"
            ? path.join(consumer.root, "vendor", profile.archive)
            : path.join(
                native,
                fault === "provenance"
                  ? "NATIVE_PROVENANCE.json"
                  : fault === "installer-shim"
                    ? "node_modules/.bin/acorn"
                    : fault === "runtime"
                      ? profile.name === "svelte"
                        ? "src/internal/client/dom/elements/bindings/input.js"
                        : "dist/index.js"
                      : "package.json",
              );
      const bytes = readFileSync(file),
        mode = lstatSync(file).mode & 0o777;
      chmodSync(file, 0o600);
      if (
        ["v-prefix", "build-metadata", "declaration", "build-id"].includes(
          fault,
        )
      ) {
        const data = JSON.parse(bytes.toString());
        if (fault === "declaration") delete data.dependencies[profile.name];
        else if (fault === "build-id")
          data.svelteUiKitNative.buildId = "unqualified";
        else
          data.version =
            fault === "v-prefix"
              ? `v${profile.version}`
              : `${profile.version}+unqualified`;
        writeFileSync(file, JSON.stringify(data));
      } else writeFileSync(file, "tampered native evidence");
      const damaged = snapshotTree(consumer.root);
      for (const args of [
        ...(profile.name === "svelte"
          ? [["init"], ["init", "--dry-run"], ["add", "field"]]
          : []),
        ["info"],
        ["add", "dialog"],
        ["sync"],
        ["doctor"],
        ["doctor", "--strict"],
      ]) {
        const result = run(args);
        const expected =
          fault === "v-prefix" || fault === "build-metadata"
            ? "NATIVE_INSTALL_VERSION"
            : fault === "declaration"
              ? "NATIVE_ARCHIVE_REQUIRED"
              : fault === "archive"
                ? "NATIVE_ARCHIVE_INVALID"
                : "NATIVE_INSTALL_INVALID";
        assert.ok(
          result.envelope.diagnostics.some(
            (i: { code: string }) => i.code === expected,
          ),
          JSON.stringify(result.envelope),
        );
        if (args[0] === "info" || (args[0] === "doctor" && args.length === 1)) {
          assert.equal(result.status, 0);
          assert.equal(result.envelope.data.ready, false);
          assert.equal(result.envelope.status, "warning");
        } else
          assert.notEqual(
            result.status,
            0,
            `${profile.name}: ${fault}: ${args}`,
          );
        assert.deepEqual(
          snapshotTree(consumer.root),
          damaged,
          `${profile.name}: ${fault}: ${args}`,
        );
      }
      writeFileSync(file, bytes);
      chmodSync(file, mode);
      assert.deepEqual(snapshotTree(consumer.root), original);
    }
  }
  assert.equal(run(["doctor", "--strict"]).status, 0);
  assert.deepEqual(snapshotTree(consumer.root), original);
});

test("preinstall source generation reports unready runtime without claiming native qualification", () => {
  const consumer = installed.prepareConsumer(false, "preinstall");
  rmSync(path.join(consumer.root, "node_modules/svelte"));
  const manifestFile = path.join(consumer.root, "package.json");
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  const run = (args: string[]) => {
    const result = installed.run(args, consumer.root);
    assert.equal(result.stderr, "");
    assert.deepEqual(result.guardEvents, []);
    return { status: result.status, envelope: JSON.parse(result.stdout) };
  };
  for (const args of [
    ["init", "--dry-run"],
    ["init"],
    ["add", "field", "--dry-run"],
    ["add", "field"],
  ]) {
    const before = snapshotTree(consumer.root);
    const result = run(args);
    assert.equal(result.status, 0, JSON.stringify(result.envelope));
    assert.ok(
      result.envelope.diagnostics.some(
        (i: { code: string; message: string }) =>
          i.code === "DEPENDENCY_NOT_READY" &&
          i.message.includes("svelte: missing_install"),
      ),
      JSON.stringify(result.envelope),
    );
    const instructions =
      args[0] === "init"
        ? result.envelope.data.dependencies
        : result.envelope.data.instructions;
    assert.ok(
      instructions.manual.includes(SVELTE_RUNTIME_BASELINE.archiveSha256),
    );
    if (args.includes("--dry-run"))
      assert.deepEqual(snapshotTree(consumer.root), before);
  }
  assert.equal(run(["info"]).envelope.data.ready, false);
  assert.notEqual(run(["doctor", "--strict"]).status, 0);
  delete manifest.dependencies.svelte;
  writeFileSync(manifestFile, JSON.stringify(manifest));
  const before = snapshotTree(consumer.root);
  const result = run(["init", "--dry-run"]);
  assert.equal(result.status, 0, JSON.stringify(result.envelope));
  assert.ok(
    result.envelope.diagnostics.some(
      (i: { code: string; message: string }) =>
        i.code === "DEPENDENCY_NOT_READY" &&
        i.message.includes("svelte: missing_declaration"),
    ),
  );
  assert.deepEqual(snapshotTree(consumer.root), before);
});
