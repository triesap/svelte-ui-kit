/** Qualification only: creates fresh owned fixtures, never operates on a user app. */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  writeFileSync,
  chmodSync,
  symlinkSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { buildPackage } from "./build-package.ts";
import {
  linkedFixtureEnvironment,
  prepareOfflineInstall,
  verifyFixtureManager,
} from "../tests/helpers/package-manager.ts";
import { snapshotTree } from "../tests/helpers/tree-snapshot.ts";

interface Options {
  previousArchive: string;
  previousSha256: string;
  output: string;
}
interface NativeProfile {
  name: string;
  archive: string;
  archiveSha256: string;
}
const digest = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
const json = (file: string) => JSON.parse(readFileSync(file, "utf8"));
const writeJson = (file: string, value: unknown) =>
  writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
const modernLayout =
  '<script lang="ts">import "../styles/site.css"; let { children } = $props();</script>\n{@render children()}\n';

export async function rehearseCanonicalCutover(options: Options) {
  const owner = realpathSync(
    path.resolve(fileURLToPath(new URL("../", import.meta.url))),
  );
  for (const value of [options.output, options.previousArchive])
    assert.ok(path.isAbsolute(value));
  assert.match(options.previousSha256, /^[0-9a-f]{64}$/);
  assert.equal(
    digest(readFileSync(options.previousArchive)),
    options.previousSha256,
  );
  assert.equal(
    lstatSync(options.output, { throwIfNoEntry: false }),
    undefined,
    "fresh output required",
  );
  mkdirSync(options.output, { recursive: false });
  const output = realpathSync(options.output),
    records: Record<string, unknown>[] = [];
  const evidenceFile = path.join(output, "commands.json");
  const env = linkedFixtureEnvironment();
  for (const name of ["NODE_OPTIONS", "NODE_TEST_CONTEXT", "NODE_V8_COVERAGE"])
    delete env[name];
  const manager = json(path.join(owner, "package.json")).packageManager;
  verifyFixtureManager("pnpm", [], owner, env);
  const record = (value: Record<string, unknown>) => {
    records.push(value);
    writeJson(evidenceFile, records);
  };
  const run = (
    command: string,
    args: string[],
    cwd: string,
    label: string,
    expected: number | "nonzero" = 0,
    timeout = 240000,
  ) => {
    const start = performance.now();
    const result = spawnSync(command, args, {
      cwd,
      env,
      encoding: "utf8",
      timeout,
      killSignal: "SIGKILL",
      maxBuffer: 16 * 1024 * 1024,
    });
    record({
      label,
      command,
      args,
      cwd,
      pid: result.pid ?? null,
      timeout,
      elapsedMs: performance.now() - start,
      status: result.status,
      signal: result.signal,
      error: result.error?.message ?? null,
      stdout: result.stdout,
      stderr: result.stderr,
    });
    assert.equal(result.error, undefined, label);
    assert.equal(result.signal, null, label);
    if (expected === "nonzero")
      assert.notEqual(result.status, 0, label + result.stdout);
    else
      assert.equal(
        result.status,
        expected,
        label + result.stdout + result.stderr,
      );
    return result;
  };
  const cli = (
    pkg: string,
    app: string,
    args: string[],
    label: string,
    expected: number | "nonzero" = 0,
  ) => {
    const result = run(
      process.execPath,
      [path.join(pkg, "dist/cli/main.js"), ...args, "--cwd", app, "--json"],
      app,
      label,
      expected,
      30000,
    );
    assert.equal(result.stderr, "", label);
    return JSON.parse(result.stdout);
  };
  const bootstrap = (root: string, label: string) => {
    const proof = prepareOfflineInstall(
      root,
      (args, stage) => run("pnpm", args, root, stage),
      label,
    );
    record(proof);
    return proof;
  };
  const copy = (source: string, target: string) => {
    assert.equal(lstatSync(target, { throwIfNoEntry: false }), undefined);
    cpSync(source, target, {
      recursive: true,
      force: false,
      errorOnExist: true,
      dereference: false,
      verbatimSymlinks: true,
      preserveTimestamps: true,
    });
  };
  try {
    const archives = path.join(output, "archives");
    mkdirSync(archives);
    const previous = path.join(archives, "previous.tgz");
    copy(options.previousArchive, previous);
    assert.equal(digest(readFileSync(previous)), options.previousSha256);
    const incoming = path.join(archives, "incoming");
    mkdirSync(incoming);
    await buildPackage({ root: owner, packDestination: incoming });
    const names = readdirSync(incoming);
    assert.equal(names.length, 1);
    const candidate = path.join(incoming, names[0]!);
    const host = (archive: string, name: string) => {
      const root = path.join(output, name);
      mkdirSync(root);
      writeJson(path.join(root, "package.json"), {
        private: true,
        type: "module",
        packageManager: manager,
        dependencies: { "svelte-ui-kit": `file:${archive}` },
      });
      bootstrap(root, name);
      return path.join(root, "node_modules/svelte-ui-kit");
    };
    const oldPkg = host(previous, "previous-host"),
      currentPkg = host(candidate, "incoming-host");
    assert.equal(
      json(path.join(oldPkg, "package.json")).version,
      "0.1.0",
      "this historical SDK fixture targets the retained0.1.0 binary",
    );
    assert.equal(json(path.join(currentPkg, "package.json")).version, "0.2.0");
    const catalog = parseYaml(
      readFileSync(path.join(owner, "pnpm-workspace.yaml"), "utf8"),
    ).catalog as Record<string, string>;
    const pin = (name: string) => {
      assert.equal(typeof catalog[name], "string");
      return catalog[name]!;
    };
    const profiles = [
      "native-dependency-baseline.json",
      "svelte-runtime-baseline.json",
    ].map((name) => {
      const old = json(path.join(oldPkg, "dist/project", name)),
        current = json(path.join(currentPkg, "dist/project", name));
      assert.equal(
        old.archiveSha256,
        current.archiveSha256,
        "historical rehearsal uses the same authentic native artifacts",
      );
      return current as NativeProfile;
    });
    const app = path.join(output, "original-application");
    mkdirSync(app);
    const vendor = path.join(app, "vendor");
    mkdirSync(vendor);
    for (const profile of profiles) {
      assert.match(profile.archive, /^[A-Za-z0-9._-]+\.tgz$/);
      const extraction = path.join(output, `extraction-${profile.name}`);
      mkdirSync(extraction);
      run(
        "tar",
        [
          "-xf",
          candidate,
          "-C",
          extraction,
          `package/dist/native/${profile.archive}`,
        ],
        output,
        "explicit-native-extraction",
      );
      const bytes = readFileSync(
        path.join(extraction, "package/dist/native", profile.archive),
      );
      assert.equal(digest(bytes), profile.archiveSha256);
      writeFileSync(path.join(vendor, profile.archive), bytes, { flag: "wx" });
    }
    const native = Object.fromEntries(
      profiles.map((p) => [p.name, `file:./vendor/${p.archive}`]),
    );
    writeJson(path.join(app, "package.json"), {
      name: "owned-cutover-rehearsal",
      private: true,
      type: "module",
      packageManager: manager,
      dependencies: {
        ...native,
        "@sveltejs/kit": pin("@sveltejs/kit"),
        "@sveltejs/vite-plugin-svelte": pin("@sveltejs/vite-plugin-svelte"),
        vite: pin("vite"),
        "@internationalized/date": pin("@internationalized/date"),
      },
    });
    writeFileSync(path.join(app, "pnpm-workspace.yaml"), "packages:\n  - .\n");
    writeFileSync(
      path.join(app, "svelte.config.ts"),
      "export default { kit: {} };\n",
    );
    mkdirSync(path.join(app, "src/routes"), { recursive: true });
    writeFileSync(path.join(app, "src/routes/+layout.svelte"), modernLayout);
    writeFileSync(
      path.join(app, "src/routes/+page.svelte"),
      "<h1>App-owned page</h1>\n",
    );
    mkdirSync(path.join(app, ".operator/empty"), { recursive: true });
    writeFileSync(
      path.join(app, ".operator/note"),
      "retain hidden operator work\n",
    );
    chmodSync(path.join(app, ".operator/note"), 0o640);
    symlinkSync("note", path.join(app, ".operator/link"));
    // This bounded old-binary profile has app-owned ancestry before initialization.
    // An empty _kit is not ownership; it prevents old rollback from invalidating
    // same-invocation captured parents (the absent-parent refusal is retained separately).
    const protectedDirectories = [
      "src/lib/components/ui",
      "src/lib/components/ui/_kit",
      "src/styles",
    ];
    for (const name of protectedDirectories)
      mkdirSync(path.join(app, name), { recursive: true });
    writeFileSync(
      path.join(app, "src/lib/components/ui/ApplicationBadge.svelte"),
      "<strong>Application-owned badge</strong>\n",
    );
    writeFileSync(
      path.join(app, "src/styles/site.css"),
      ":root { --app-reviewed-color: rebeccapurple; }\n",
    );
    const protectedIdentities = protectedDirectories.map((name) => {
      const stat = lstatSync(path.join(app, name));
      return {
        path: name,
        device: stat.dev,
        inode: stat.ino,
        mode: stat.mode & 0o7777,
      };
    });
    const ownedFiles = [
      "src/lib/components/ui/ApplicationBadge.svelte",
      "src/styles/site.css",
    ];
    const protectedFiles = ownedFiles.map((name) => ({
      path: name,
      sha256: digest(readFileSync(path.join(app, name))),
      mode: lstatSync(path.join(app, name)).mode & 0o7777,
    }));
    bootstrap(app, "original-application");
    const identity = lstatSync(app);
    writeJson(
      path.join(output, "preparation-full-inventory.json"),
      snapshotTree(app),
    );
    const worker = `
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const {pkg,root}=JSON.parse(process.env.OWNED_CUTOVER_OPTIONS);
const load=name=>import(pathToFileURL(path.join(pkg,'dist',name)).href);
const {DEFAULT_KIT_CONFIG:config,deriveKitPaths}=await load('project/config.js');
const {captureSnapshot}=await load('codegen/snapshot.js');const {planInit}=await load('codegen/plan-init.js');
const {composeApplyPlan}=await load('codegen/compose.js');const {applyPlan,validateApplyPlan}=await load('codegen/apply.js');
const {createAssetProvider}=await load('registry/assets.js');const {loadRegistrySnapshot}=await load('registry/load.js');
const paths=deriveKitPaths(config),state=paths.stateDir;
const observed=captureSnapshot(root,[state+'/kit.json',state+'/kit.lock.json',paths.rootExports,paths.kitCss,paths.themesCss,paths.appCss,config.layoutFile,'.gitignore']);
if(!observed.ok)throw Error(JSON.stringify(observed));const registry=loadRegistrySnapshot(createAssetProvider(pkg));if(!registry.ok)throw Error(JSON.stringify(registry));
const planned=planInit({config,layoutFile:config.layoutFile,layoutSource:fs.readFileSync(path.join(root,config.layoutFile),'utf8'),snapshot:observed.value,registry:registry.value,configHash:'b'.repeat(64)});if(!planned.ok)throw Error(JSON.stringify(planned));
const composed=composeApplyPlan({root,config,writes:planned.value.writes,snapshot:observed.value});if(!composed.ok)throw Error(JSON.stringify(composed));const validated=validateApplyPlan(composed.value);if(!validated.ok)throw Error(JSON.stringify(validated));
const outcome=applyPlan(validated.value,{after(boundary){if(boundary!=='journal:fsync')return;const dir=path.join(root,state,'.svelte-ui-kit','transactions');for(const id of fs.readdirSync(dir)){const journal=JSON.parse(fs.readFileSync(path.join(dir,id,'journal.json'),'utf8'));if(journal.phase==='prepared'){fs.writeSync(1,JSON.stringify({phase:'prepared',pid:process.pid,id,state})+'\\n');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0);}}}});
throw Error('prepared crash checkpoint was not reached: '+JSON.stringify(outcome));`;
    const workerFile = path.join(output, "previous-sdk-worker.mjs");
    writeFileSync(workerFile, worker);
    const workerInput = { pkg: oldPkg, root: app };
    writeJson(path.join(output, "previous-worker-input.json"), workerInput);
    const workerArgs = [workerFile];
    const child = spawn(process.execPath, workerArgs, {
      cwd: app,
      env: { ...env, OWNED_CUTOVER_OPTIONS: JSON.stringify(workerInput) },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const exit = once(child, "close");
    let stdout = "",
      stderr = "",
      marker: { phase: string; pid: number; id: string; state: string } | null =
        null;
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
      if (stdout.includes("\n") && marker === null) {
        try {
          marker = JSON.parse(stdout.split("\n")[0]!);
        } catch {
          /* assertions below retain malformed output */
        }
        child.kill("SIGKILL");
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    const timer = setTimeout(() => child.kill("SIGKILL"), 30000);
    let code: number | null, signal: NodeJS.Signals | null;
    try {
      [code, signal] = (await exit) as [number | null, NodeJS.Signals | null];
    } finally {
      clearTimeout(timer);
    }
    const prepared = marker as {
      phase: string;
      pid: number;
      id: string;
      state: string;
    } | null;
    record({
      label: "previous-binary-real-prepared-crash",
      command: process.execPath,
      args: workerArgs,
      cwd: app,
      pid: child.pid,
      deadline: 30000,
      code,
      signal,
      stdout,
      stderr,
    });
    assert.equal(signal, "SIGKILL");
    assert.equal(stderr, "");
    assert.ok(prepared);
    assert.equal(prepared.pid, child.pid);
    assert.equal(prepared.phase, "prepared");
    const journal = path.join(
      app,
      prepared.state,
      ".svelte-ui-kit/transactions",
      prepared.id,
      "journal.json",
    );
    const interruptedJournal = json(journal);
    assert.equal(interruptedJournal.phase, "prepared");
    assert.ok(
      [1, 2].includes(interruptedJournal.schemaVersion),
      "actual previous durable format required",
    );
    assert.equal(
      interruptedJournal.rootIdentity,
      digest(Buffer.from(`${identity.dev}:${identity.ino}`)),
    );
    for (const directory of interruptedJournal.createdDirs ?? []) {
      const name = typeof directory === "string" ? directory : directory.path;
      assert.equal(
        protectedDirectories.includes(name),
        false,
        "pre-existing app ancestry cannot become owned-created recovery state",
      );
    }
    record({
      label: "actual-previous-durable-journal",
      journal: interruptedJournal,
    });
    const interrupted = snapshotTree(app),
      interruptedBackup = path.join(output, "interrupted-full-snapshot");
    copy(app, interruptedBackup);
    assert.deepEqual(snapshotTree(interruptedBackup), interrupted);
    const writer = path.join(app, prepared.state, ".svelte-ui-kit/writer.lock");
    const ownerRecord = json(path.join(writer, "owner.json"));
    assert.equal(ownerRecord.pid, child.pid);
    assert.equal(ownerRecord.transactionId, prepared.id);
    const quarantine = path.join(output, "verified-dead-writer");
    renameSync(writer, quarantine);
    // Only the verified dead writer moves. Every journal and staged image remains.
    assert.ok(existsSync(journal));
    const beforeNew = snapshotTree(app);
    const retainedRefusal = cli(
      currentPkg,
      app,
      ["init", "--dry-run"],
      "canonical-refuses-previous-retained-journal",
      "nonzero",
    );
    assert.ok(
      retainedRefusal.diagnostics.some(
        (i: { code: string }) => i.code === "KIT_RECOVERY_PENDING",
      ),
      JSON.stringify(retainedRefusal),
    );
    assert.deepEqual(snapshotTree(app), beforeNew);
    cli(oldPkg, app, ["init"], "matching-previous-original-intent-recovery");
    assert.equal(existsSync(journal), false);
    assert.equal(lstatSync(app).ino, identity.ino);
    assert.equal(lstatSync(app).dev, identity.dev);
    for (const observed of protectedIdentities) {
      const stat = lstatSync(path.join(app, observed.path));
      assert.deepEqual(
        {
          path: observed.path,
          device: stat.dev,
          inode: stat.ino,
          mode: stat.mode & 0o7777,
        },
        observed,
      );
    }
    for (const observed of protectedFiles) {
      assert.equal(
        digest(readFileSync(path.join(app, observed.path))),
        observed.sha256,
      );
      assert.equal(
        lstatSync(path.join(app, observed.path)).mode & 0o7777,
        observed.mode,
      );
    }
    cli(oldPkg, app, ["add", "button"], "previous-deliberate-request");
    const button = path.join(app, "src/lib/components/ui/button.svelte");
    const customization = "\n<!-- reviewed app-owned customization -->\n";
    writeFileSync(button, readFileSync(button, "utf8") + customization);
    cli(oldPkg, app, ["doctor", "--strict"], "settled-previous-diagnosis");
    const settled = snapshotTree(app),
      settledBackup = path.join(output, "settled-full-snapshot");
    copy(app, settledBackup);
    assert.deepEqual(snapshotTree(settledBackup), settled);
    const legacyConfig = json(path.join(app, prepared.state, "kit.json"));
    assert.equal(legacyConfig.schemaVersion, 1);
    assert.equal(Object.hasOwn(legacyConfig, "target"), false);
    const formatRefusal = cli(
      currentPkg,
      app,
      ["info"],
      "canonical-refuses-previous-project-format",
      "nonzero",
    );
    assert.ok(
      formatRefusal.diagnostics.some(
        (i: { code: string }) => i.code === "SCHEMA_INVALID",
      ),
      JSON.stringify(formatRefusal),
    );
    assert.deepEqual(snapshotTree(app), settled);
    const canonical = path.join(output, "canonical-candidate");
    mkdirSync(canonical);
    for (const name of [
      "package.json",
      "pnpm-lock.yaml",
      "pnpm-workspace.yaml",
      "vendor",
      "svelte.config.ts",
      ".operator",
    ])
      copy(path.join(app, name), path.join(canonical, name));
    mkdirSync(path.join(canonical, "src/routes"), { recursive: true });
    copy(
      path.join(app, "src/routes/+page.svelte"),
      path.join(canonical, "src/routes/+page.svelte"),
    );
    writeFileSync(
      path.join(canonical, "src/routes/+layout.svelte"),
      modernLayout,
    ); // reviewed pre-kit layout, no old managed imports
    for (const name of ownedFiles) {
      const target = path.join(canonical, name);
      mkdirSync(path.dirname(target), { recursive: true });
      copy(path.join(app, name), target);
    }
    const manifestHash = digest(
        readFileSync(path.join(canonical, "package.json")),
      ),
      lockHash = digest(readFileSync(path.join(canonical, "pnpm-lock.yaml")));
    bootstrap(canonical, "canonical-application");
    assert.equal(
      digest(readFileSync(path.join(canonical, "package.json"))),
      manifestHash,
    );
    assert.equal(
      digest(readFileSync(path.join(canonical, "pnpm-lock.yaml"))),
      lockHash,
    );
    cli(
      currentPkg,
      canonical,
      ["init", "--dry-run"],
      "canonical-clean-copy-plan",
    );
    cli(currentPkg, canonical, ["init"], "canonical-clean-copy-init");
    cli(currentPkg, canonical, ["add", "button"], "canonical-reviewed-request");
    const newButton = path.join(
      canonical,
      "src/lib/components/ui/button.svelte",
    );
    writeFileSync(newButton, readFileSync(newButton, "utf8") + customization);
    cli(
      currentPkg,
      canonical,
      ["doctor", "--strict"],
      "canonical-customized-diagnosis",
    );
    const beforeSync = snapshotTree(canonical);
    cli(currentPkg, canonical, ["sync"], "canonical-customization-replay");
    assert.deepEqual(snapshotTree(canonical), beforeSync);
    assert.deepEqual(
      snapshotTree(path.join(canonical, ".operator")),
      snapshotTree(path.join(app, ".operator")),
    );
    assert.deepEqual(snapshotTree(app), settled);
    const preserved = path.join(output, "preserved-original"),
      active = path.join(output, "reviewed-active"),
      retainedCandidate = path.join(output, "retained-canonical-candidate");
    renameSync(app, preserved);
    renameSync(canonical, active);
    cli(
      currentPkg,
      active,
      ["doctor", "--strict"],
      "owned-fixture-switch-diagnosis",
    );
    renameSync(active, retainedCandidate);
    renameSync(preserved, app);
    assert.equal(lstatSync(app).ino, identity.ino);
    assert.equal(lstatSync(app).dev, identity.dev);
    assert.deepEqual(snapshotTree(app), settled);
    cli(
      oldPkg,
      app,
      ["doctor", "--strict"],
      "matching-previous-rollback-diagnosis",
    );
    const summary = {
      status: "PASS",
      output,
      previousArchive: previous,
      previousSha256: options.previousSha256,
      candidateArchive: candidate,
      candidateSha256: digest(readFileSync(candidate)),
      previousVersion: "0.1.0",
      candidateVersion: "0.2.0",
      prepared,
      previousRootIdentity: { device: identity.dev, inode: identity.ino },
      historicalPositiveProfile: {
        preexistingNonowningMetadataDirectory: true,
        protectedIdentities,
        protectedFiles,
      },
      interruptedSnapshot: interruptedBackup,
      settledSnapshot: settledBackup,
      originalApplication: app,
      retainedCandidate,
      commands: records.length,
      qualification:
        "Owned isolated rehearsal: exact previous binary recovery, copied evidence kept distinct from physical authority, clean canonical adoption/reviewed customization and identity-preserving settled rollback. No live cutover or universal historical migration guarantee.",
    };
    writeJson(path.join(output, "summary.json"), summary);
    return summary;
  } catch (error) {
    writeJson(path.join(output, "failure.json"), {
      status: "FAIL",
      error: String(error),
      output,
      commands: records.length,
    });
    throw error;
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2),
    values = new Map<string, string>();
  assert.equal(
    args.length,
    6,
    "--previous-archive PATH --previous-sha256 HEX --output FRESH_ABSOLUTE_PATH required",
  );
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]!,
      value = args[i + 1]!;
    assert.ok(
      ["--previous-archive", "--previous-sha256", "--output"].includes(key) &&
        !values.has(key),
    );
    values.set(key, value);
  }
  console.log(
    JSON.stringify(
      await rehearseCanonicalCutover({
        previousArchive: values.get("--previous-archive")!,
        previousSha256: values.get("--previous-sha256")!,
        output: values.get("--output")!,
      }),
      null,
      2,
    ),
  );
}
