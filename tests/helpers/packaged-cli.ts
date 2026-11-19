import { writeFixtureWorkspace } from "./workspace-catalog.js";
import { prepareOfflineInstall } from "./package-manager.js";
/** Build an owned authoring copy, install its real tarball, then remove it. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { sha256Hex } from "../../src/codegen/digest.js";
import {
  NATIVE_BASELINE,
  SVELTE_RUNTIME_BASELINE,
} from "../../src/project/native-dependency.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
  parseKitConfig,
  type TargetKind,
} from "../../src/project/config.js";

export function runtimeGuard(
  checkout: string,
  audit: string,
  ownedRuntime: string | null = null,
  allowNativeSubprocesses = false,
  unavailablePaths: readonly string[] = [],
  missingSourceMetadata = false,
) {
  if (ownedRuntime !== null) {
    const relative = path.relative(checkout, ownedRuntime);
    assert.ok(
      relative.startsWith(
        path.join(".artifacts", "verification", "runtime-projects") + path.sep,
      ),
    );
    assert.equal(realpathSync(ownedRuntime), ownedRuntime);
    assert.ok(lstatSync(ownedRuntime).isDirectory());
    assert.equal(lstatSync(ownedRuntime).isSymbolicLink(), false);
  }
  return `const fs = require('node:fs'), path = require('node:path'), url = require('node:url'), mod = require('node:module');
const forbidden = ${JSON.stringify(checkout)}, audit = ${JSON.stringify(audit)};
const ownedRuntime = ${JSON.stringify(ownedRuntime)};
const missingSourceMetadata = ${JSON.stringify(missingSourceMetadata)};
const unavailablePaths = ${JSON.stringify(unavailablePaths)};
const append = fs.appendFileSync.bind(fs), physical = fs.realpathSync.bind(fs), metadata = fs.lstatSync.bind(fs);
const deny = (kind, code, p) => { append(audit, JSON.stringify({kind, code, ...(ownedRuntime && p ? {locator:path.relative(forbidden,p)} : {})})+'\\n'); const e = new Error('Owned installed-runtime guard: '+kind); e.code = code; throw e; };
const inside = p => unavailablePaths.some(root => p === root || p.startsWith(root+path.sep)) || ((p === forbidden || p.startsWith(forbidden+path.sep)) && !(ownedRuntime && (p === ownedRuntime || p.startsWith(ownedRuntime+path.sep))));
// Realpath needs directory identities along the canonical owned subtree. This
// exception grants no directory listing, file content or module access.
const ancestor = p => { if(!ownedRuntime || !ownedRuntime.startsWith(p+path.sep))return false;try {const s=metadata(p);return s.isDirectory()&&!s.isSymbolicLink();}catch{return false;} };
const metadataOperation = name => /^(stat|lstat|realpath|readlink|access|exists)(Sync)?$/.test(name);
const unavailable = (p,operation) => { append(audit,JSON.stringify({kind:'unavailable-metadata',code:'ENOENT',operation,locator:path.relative(forbidden,p)})+'\\n');return false; };
const missing = (p,operation) => {const e=new Error('Owned unavailable metadata');e.code='ENOENT';e.path=p;e.syscall=operation;return e;};
const check = (input, meta=false, operation='module') => {
  if (input instanceof URL) { if(input.protocol !== 'file:') return; input = url.fileURLToPath(input); }
  if (Buffer.isBuffer(input)) input = input.toString();
  if (typeof input !== 'string') return;
  const absolute = path.resolve(input);
  if (inside(absolute) && !(meta && ancestor(absolute))) {
    if((ownedRuntime || missingSourceMetadata) && meta) return unavailable(absolute,operation);
    deny('authoring-access', 'OWNED_AUTHORING_UNAVAILABLE', absolute);
  }
  let resolved = absolute; try {resolved = physical(absolute);} catch {}
  if ((inside(absolute) && !(meta && ancestor(absolute))) || (inside(resolved) && !(meta && ancestor(resolved)))) {
    if((ownedRuntime || missingSourceMetadata) && meta) return unavailable(resolved,operation);
    deny('authoring-access', 'OWNED_AUTHORING_UNAVAILABLE', resolved);
  }
};
const absentResult = (name,p,args) => {
  if(name==='existsSync')return false;
  const callback=args.at(-1);
  if(name==='exists') {if(typeof callback!=='function')throw new TypeError('callback required');queueMicrotask(()=>callback(false));return;}
  const error=missing(p,name);
  if(name.endsWith('Sync')) {if(['statSync','lstatSync'].includes(name)&&args[0]?.throwIfNoEntry===false)return;throw error;}
  if(typeof callback==='function'){queueMicrotask(()=>callback(error));return;}
  throw error;
};
for (const name of ['readFileSync','readFile','openSync','open','statSync','stat','lstatSync','lstat','realpathSync','realpath','readdirSync','readdir','opendirSync','opendir','readlinkSync','readlink','accessSync','access','existsSync','exists']) {
  const original = fs[name]; if(!original) continue;
  const wrapped = function(p,...args) {if(check(p,metadataOperation(name),name)===false)return absentResult(name,p,args); return original.call(this,p,...args);};
  if(original.native) wrapped.native = function(p,...args) {if(check(p,metadataOperation(name),name)===false)return absentResult(name,p,args);return original.native.call(this,p,...args);};
  fs[name] = wrapped;
}
for (const name of ['readFile','open','stat','lstat','realpath','readdir','opendir','readlink','access']) {
  const original = fs.promises[name]; fs.promises[name] = function(p,...args) {if(check(p,metadataOperation(name),name)===false)return Promise.reject(missing(p,name));return original.call(this,p,...args);};
}
mod.registerHooks({resolve(specifier,context,next) {if(ownedRuntime || missingSourceMetadata){if(specifier.startsWith('file:'))check(new URL(specifier));else if(path.isAbsolute(specifier))check(specifier);else if((specifier.startsWith('./')||specifier.startsWith('../'))&&context.parentURL?.startsWith('file:'))check(new URL(specifier,context.parentURL));}const r=next(specifier,context);if(r.url.startsWith('file:'))check(new URL(r.url));return r;},load(location,context,next) {if(location.startsWith('file:'))check(new URL(location));return next(location,context);}});
const network = () => deny('network', 'OWNED_NETWORK_DISABLED');
const child = require('node:child_process');
${allowNativeSubprocesses ? "" : "for(const name of ['spawn','spawnSync','exec','execSync','execFile','execFileSync','fork']) child[name] = () => deny('subprocess', 'OWNED_SUBPROCESS_DISABLED');"}
globalThis.fetch = network;
for (const name of ['node:http', 'node:https']) { const m = require(name); m.request = network; m.get = network; }
const net = require('node:net'); net.connect = network; net.createConnection = network; net.Socket.prototype.connect = network;
require('node:tls').connect = network;
mod.syncBuiltinESMExports();
`;
}

/** Qualification can bind every host to the same already-built distribution. */
export function selectedArchive(env: NodeJS.ProcessEnv = process.env) {
  const archive = env.SUIK_QUALIFICATION_ARCHIVE;
  const digest = env.SUIK_QUALIFICATION_SHA256;
  if (archive === undefined && digest === undefined) return null;
  assert.ok(
    archive && path.isAbsolute(archive),
    "qualification archive must be absolute",
  );
  assert.match(
    digest ?? "",
    /^[a-f0-9]{64}$/,
    "qualification archive requires SHA-256",
  );
  const physical = realpathSync(archive);
  assert.ok(
    lstatSync(physical).isFile(),
    "qualification archive must be a file",
  );
  assert.equal(
    sha256Hex(readFileSync(physical)),
    digest,
    "qualification archive digest mismatch",
  );
  return { path: physical, sha256: digest! };
}

export function installIndependentCli() {
  const selected = selectedArchive();
  const checkout = realpathSync(process.cwd());
  const root = realpathSync(
    mkdtempSync(path.join(os.tmpdir(), "suik-installed-runtime-")),
  );
  const author = path.join(root, "author"),
    host = path.join(root, "host");
  const logRoot = path.resolve(".artifacts/verification/installed-runtime");
  mkdirSync(logRoot, { recursive: true });
  const prefix = `${process.pid}-${Date.now()}`;
  const transcript: unknown[] = [];
  const env = { ...process.env };
  for (const name of ["NODE_OPTIONS", "NODE_TEST_CONTEXT", "NODE_V8_COVERAGE"])
    delete env[name];
  let abnormal = false;
  const cleanup = () => {
    if (!abnormal) rmSync(root, { recursive: true, force: true });
  };
  const writeEvidence = () =>
    writeFileSync(
      path.join(logRoot, `${prefix}-transcript.json`),
      JSON.stringify(transcript, null, 2),
    );
  const runTool = (
    command: string,
    args: string[],
    cwd: string,
    label: string,
  ) => {
    const started = performance.now();
    const result = spawnSync(command, args, {
      cwd,
      env,
      encoding: "utf8",
      timeout: 240000,
      killSignal: "SIGKILL",
    });
    transcript.push({
      label,
      command,
      args,
      cwd,
      pid: result.pid,
      elapsedMs: performance.now() - started,
      timeoutMs: 240000,
      errorCode:
        (result.error as NodeJS.ErrnoException | undefined)?.code ?? null,
      status: result.status,
      signal: result.signal,
      stdout: result.stdout,
      stderr: result.stderr,
    });
    writeEvidence();
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(result.signal, null);
    return result;
  };
  const bootstrapOffline = (cwd: string, label: string) => {
    const identity = prepareOfflineInstall(
      cwd,
      (args, stage) => runTool("pnpm", args, cwd, stage),
      label,
    );
    transcript.push(identity);
    writeEvidence();
    return identity;
  };
  try {
    mkdirSync(author);
    for (const file of [
      "src",
      "tools",
      ".native-build",
      "assets",
      "examples",
      "tsconfig.json",
      "package.json",
      "pnpm-workspace.yaml",
      "README.md",
      "docs/README.md",
      "docs/CHANGELOG.md",
      "docs/getting-started.md",
      "docs/guides",
      "docs/reference",
      "NOTICE.md",
      "LICENSE-MIT",
      "LICENSE-APACHE",
    ])
      cpSync(path.join(checkout, file), path.join(author, file), {
        recursive: true,
      });
    // These are real fixture inputs before removal, not nonexistent sentinels.
    cpSync(
      path.join(checkout, "tests/fixtures/consumer"),
      path.join(author, "tests/fixtures/consumer"),
      {
        recursive: true,
        filter: (source) =>
          ![
            "node_modules",
            ".svelte-kit",
            "build",
            "dist",
            "coverage",
          ].includes(path.basename(source)),
      },
    );
    symlinkSync(
      path.join(checkout, "node_modules"),
      path.join(author, "node_modules"),
    );
    const archives = path.join(root, "archives");
    mkdirSync(archives);
    const packed = selected
      ? null
      : runTool(
          process.execPath,
          ["tools/build-package.ts", "--pack-destination", archives],
          author,
          "owned-production-build-and-pack",
        );
    rmSync(path.join(author, "node_modules"));
    if (selected) {
      const bytes = readFileSync(selected.path);
      assert.equal(sha256Hex(bytes), selected.sha256);
      writeFileSync(path.join(archives, path.basename(selected.path)), bytes, {
        flag: "wx",
      });
    }
    const names = readdirSync(archives);
    assert.equal(names.length, 1);
    assert.match(names[0]!, /\.tgz$/);
    const archive = path.join(archives, names[0]!);
    const archiveBytes = readFileSync(archive);
    // Retain the actual distribution for inspection, outside the runtime allowance.
    const retainedArchive = path.join(logRoot, `${prefix}.tgz`);
    writeFileSync(retainedArchive, archiveBytes);
    mkdirSync(host);
    writeFileSync(
      path.join(host, "package.json"),
      JSON.stringify({
        name: "owned-installed-runtime-host",
        private: true,
        type: "module",
        packageManager: "pnpm@12.16.1",
        dependencies: { "svelte-ui-kit": `file:${archive}` },
      }),
    );
    const hostInstall = bootstrapOffline(host, "offline-cli-install");
    const packageRoot = realpathSync(
      path.join(host, "node_modules/svelte-ui-kit"),
    );
    for (const absent of ["src", "tests", "implementation", "tools"])
      assert.equal(existsSync(path.join(packageRoot, absent)), false, absent);
    const evidence = {
      archiveSha256: sha256Hex(archiveBytes),
      hostInstall,
      pack: packed ? JSON.parse(packed.stdout) : null,
      selectedArchive: selected,
      executableSha256: sha256Hex(
        readFileSync(path.join(packageRoot, "dist/cli/main.js")),
      ),
      registrySha256: sha256Hex(
        readFileSync(path.join(packageRoot, "assets/registry/registry.json")),
      ),
      manifest: JSON.parse(
        readFileSync(path.join(packageRoot, "package.json"), "utf8"),
      ),
      removedAuthor: author,
      installedRoot: packageRoot,
    };
    rmSync(author, { recursive: true, force: true });
    rmSync(archives, { recursive: true, force: true });
    assert.equal(existsSync(author), false);
    assert.equal(existsSync(archive), false);
    const guard = path.join(root, "runtime-guard.cjs");
    const audit = path.join(root, "runtime-guard.jsonl");
    writeFileSync(
      guard,
      runtimeGuard(
        checkout,
        audit,
        null,
        false,
        selected ? [selected.path] : [],
      ),
    );
    writeFileSync(
      path.join(logRoot, `${prefix}-identity.json`),
      JSON.stringify(evidence, null, 2),
    );
    // Node's permission mode disables fsync even with all filesystem grants.
    // Keep real transaction durability; guard source/module reads instead.
    const nodeArgs = ["--require", guard];
    const runNode = (
      args: string[],
      cwd: string,
      label: string,
      timeoutMs = 30_000,
      expectedSignal: "SIGKILL" | null = null,
    ) => {
      assert.ok(
        Number.isSafeInteger(timeoutMs) &&
          timeoutMs > 0 &&
          timeoutMs <= 300_000,
      );
      writeFileSync(audit, "");
      const started = performance.now();
      const result = spawnSync(process.execPath, [...nodeArgs, ...args], {
        cwd,
        env,
        encoding: "utf8",
        timeout: timeoutMs,
        killSignal: "SIGKILL",
      });
      const guardEvents = readFileSync(audit, "utf8")
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      transcript.push({
        label,
        pid: result.pid,
        cwd,
        elapsedMs: performance.now() - started,
        args,
        status: result.status,
        signal: result.signal,
        errorCode:
          (result.error as NodeJS.ErrnoException | undefined)?.code ?? null,
        timeoutMs,
        stdout: result.stdout,
        stderr: result.stderr,
        guardEvents,
      });
      writeEvidence();
      if (result.error || result.signal) abnormal = true;
      assert.equal(result.error, undefined);
      assert.equal(result.signal, expectedSignal);
      return { ...result, guardEvents };
    };
    const run = (args: string[], cwd: string, cliRoot = packageRoot) =>
      runNode(
        [
          path.join(cliRoot, "dist/cli/main.js"),
          ...args,
          "--json",
          "--cwd",
          cwd,
        ],
        cwd,
        "source-independent-cli",
        ["init", "add", "sync"].includes(args[0] ?? "") ? 300_000 : 30_000,
      );
    const prepareConsumer = (
      custom: boolean,
      purpose:
        | "adoption"
        | "native-authentication"
        | "catalog"
        | "preinstall" = "adoption",
      target: TargetKind = "sveltekit",
    ) => {
      const consumer = path.join(
        root,
        purpose !== "adoption"
          ? `${purpose}-consumer`
          : target !== "sveltekit"
            ? `${target}-consumer`
            : custom
              ? "custom-consumer"
              : "default-consumer",
      );
      mkdirSync(consumer);
      const manifest = JSON.parse(
        readFileSync(
          path.join(checkout, "tests/fixtures/consumer/package.json"),
          "utf8",
        ),
      );
      manifest.name = custom ? "owned-runtime-custom" : "owned-runtime-default";
      manifest.packageManager = "pnpm@12.16.1";
      if (target !== "sveltekit") {
        delete manifest.devDependencies["@sveltejs/kit"];
        delete manifest.devDependencies["@sveltejs/adapter-node"];
      }
      if (target === "astro") {
        manifest.dependencies.astro = "catalog:";
        manifest.dependencies["@astrojs/svelte"] = "catalog:";
      }
      if (target === "svelte-library") {
        manifest.peerDependencies = { svelte: "catalog:" };
        manifest.svelte = "./dist/index.js";
        manifest.types = "./dist/index.d.ts";
        manifest.exports = {
          ".": {
            types: "./dist/index.d.ts",
            svelte: "./dist/index.js",
            default: "./dist/index.js",
          },
          "./styles.css": "./src/styles.css",
        };
      }
      // Explicit operator setup extracts the actual locally packed CLI member.
      // It never uses an authoring cache as the consumer dependency source.
      const extraction = path.join(consumer, ".owned-cli-extraction");
      mkdirSync(extraction);
      mkdirSync(path.join(consumer, "vendor"));
      for (const profile of [NATIVE_BASELINE, SVELTE_RUNTIME_BASELINE]) {
        const member = `package/dist/native/${profile.archive}`;
        runTool(
          "tar",
          ["-xf", retainedArchive, "-C", extraction, member],
          consumer,
          "explicit-native-extraction",
        );
        const nativeBytes = readFileSync(path.join(extraction, member));
        assert.equal(sha256Hex(nativeBytes), profile.archiveSha256);
        writeFileSync(
          path.join(consumer, "vendor", profile.archive),
          nativeBytes,
          { flag: "wx" },
        );
        manifest.dependencies[profile.name] =
          `file:./vendor/${profile.archive}`;
      }
      rmSync(extraction, { recursive: true });
      writeFileSync(
        path.join(consumer, "package.json"),
        JSON.stringify(manifest, null, 2),
      );
      writeFixtureWorkspace(consumer, checkout);
      // Dependency setup is separate from the CLI and uses real declared pins.
      bootstrapOffline(consumer, "explicit-consumer-install");
      const write = (logical: string, text: string) => {
        const target = path.join(consumer, logical);
        mkdirSync(path.dirname(target), { recursive: true });
        writeFileSync(target, text);
      };
      if (target === "sveltekit") {
        write("svelte.config.ts", "export default { kit: {} };\n");
        write(
          "src/routes/+layout.svelte",
          '<script lang="ts">let {children} = $props();</script>\n{@render children()}\n',
        );
      }
      const parsed = parseKitConfig(
        target === "sveltekit"
          ? custom
            ? {
                ...DEFAULT_KIT_CONFIG,
                uiDir: "app/ui",
                stylesDir: "assets/styles",
              }
            : DEFAULT_KIT_CONFIG
          : {
              schemaVersion: 1,
              target,
              uiDir: "src/lib",
              stylesDir: "src/styles",
              requested: [],
              ...(target === "astro"
                ? { layoutFile: "src/layouts/Layout.astro" }
                : { styleEntry: "src/styles.css" }),
            },
      );
      assert.ok(parsed.ok, JSON.stringify(parsed));
      const config = parsed.value;
      const paths = deriveKitPaths(config);
      if (custom || target !== "sveltekit")
        write(`${paths.stateDir}/kit.json`, JSON.stringify(config));
      if (target === "astro") {
        write(
          "astro.config.ts",
          'import {defineConfig} from "astro/config";import svelte from "@astrojs/svelte";export default defineConfig({integrations:[svelte()]});\n',
        );
        write(
          "src/layouts/Layout.astro",
          '---\nconst title="Preserved";\n---\n<main><h1>{title}</h1><slot /></main>\n',
        );
      }
      if (target === "svelte-library")
        write("src/styles.css", "/* application stylesheet */\n");
      return { root: consumer, config, paths, write };
    };
    const clone = (name: string) => {
      const cloned = path.join(root, name);
      mkdirSync(cloned);
      for (const file of ["dist", "assets", "package.json"])
        cpSync(path.join(packageRoot, file), path.join(cloned, file), {
          recursive: true,
        });
      const require = createRequire(path.join(packageRoot, "package.json"));
      const manifest = JSON.parse(
        readFileSync(path.join(packageRoot, "package.json"), "utf8"),
      );
      mkdirSync(path.join(cloned, "node_modules"));
      for (const dependency of Object.keys(manifest.dependencies)) {
        const target = path.join(cloned, "node_modules", dependency);
        mkdirSync(path.dirname(target), { recursive: true });
        symlinkSync(
          path.dirname(require.resolve(`${dependency}/package.json`)),
          target,
        );
      }
      return cloned;
    };
    return {
      root,
      retainedArchive,
      checkout,
      author,
      packageRoot,
      evidence,
      run,
      runNode,
      prepareConsumer,
      clone,
      cleanup,
    };
  } catch (error) {
    transcript.push({ failedRoot: root, error: String(error) });
    writeEvidence();
    throw error;
  }
}
