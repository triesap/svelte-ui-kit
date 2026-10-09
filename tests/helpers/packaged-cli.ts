/** Build an owned authoring copy, install its real tarball, then remove it. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  cpSync,
  existsSync,
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
import { NATIVE_BASELINE } from "../../src/project/native-dependency.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";

function runtimeGuard(checkout: string, audit: string) {
  return `const fs = require('node:fs'), path = require('node:path'), url = require('node:url'), mod = require('node:module');
const forbidden = ${JSON.stringify(checkout)}, audit = ${JSON.stringify(audit)};
const append = fs.appendFileSync.bind(fs), physical = fs.realpathSync.bind(fs);
const deny = (kind, code) => { append(audit, JSON.stringify({kind, code})+'\\n'); const e = new Error('Owned installed-runtime guard: '+kind); e.code = code; throw e; };
const inside = p => p === forbidden || p.startsWith(forbidden+path.sep);
const check = input => {
  if (input instanceof URL) { if(input.protocol !== 'file:') return; input = url.fileURLToPath(input); }
  if (Buffer.isBuffer(input)) input = input.toString();
  if (typeof input !== 'string') return;
  const absolute = path.resolve(input);
  if (inside(absolute)) deny('authoring-access', 'OWNED_AUTHORING_UNAVAILABLE');
  let resolved = absolute; try {resolved = physical(absolute);} catch {}
  if (inside(absolute) || inside(resolved)) deny('authoring-access', 'OWNED_AUTHORING_UNAVAILABLE');
};
for (const name of ['readFileSync','readFile','openSync','open','statSync','stat','lstatSync','lstat','realpathSync','realpath','readdirSync','readdir','opendirSync','opendir','readlinkSync','readlink','accessSync','access','existsSync','exists']) {
  const original = fs[name]; if(!original) continue;
  const wrapped = function(p,...args) {check(p); return original.call(this,p,...args);};
  if(original.native) wrapped.native = function(p,...args) {check(p);return original.native.call(this,p,...args);};
  fs[name] = wrapped;
}
for (const name of ['readFile','open','stat','lstat','realpath','readdir','opendir','readlink','access']) {
  const original = fs.promises[name]; fs.promises[name] = function(p,...args) {check(p);return original.call(this,p,...args);};
}
mod.registerHooks({resolve(specifier,context,next) {const r=next(specifier,context);if(r.url.startsWith('file:'))check(new URL(r.url));return r;},load(location,context,next) {if(location.startsWith('file:'))check(new URL(location));return next(location,context);}});
const network = () => deny('network', 'OWNED_NETWORK_DISABLED');
const child = require('node:child_process');
for(const name of ['spawn','spawnSync','exec','execSync','execFile','execFileSync','fork']) child[name] = () => deny('subprocess', 'OWNED_SUBPROCESS_DISABLED');
globalThis.fetch = network;
for (const name of ['node:http', 'node:https']) { const m = require(name); m.request = network; m.get = network; }
const net = require('node:net'); net.connect = network; net.createConnection = network; net.Socket.prototype.connect = network;
require('node:tls').connect = network;
mod.syncBuiltinESMExports();
`;
}

export function installIndependentCli() {
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
  const cleanup = () => rmSync(root, { recursive: true, force: true });
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
    const result = spawnSync(command, args, {
      cwd,
      env,
      encoding: "utf8",
      timeout: 240000,
    });
    transcript.push({
      label,
      command,
      args,
      status: result.status,
      signal: result.signal,
      stdout: result.stdout,
      stderr: result.stderr,
    });
    writeEvidence();
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(result.signal, null);
    return result;
  };
  try {
    mkdirSync(author);
    for (const file of [
      "src",
      "tools",
      ".native-build",
      "registry",
      "schema",
      "tsconfig.json",
      "package.json",
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
    // Run the repository build's exact compiler command with an explicit
    // compiler input. A package-manager run must not try to replace a linked
    // authoring dependency directory through its automatic install check.
    const compiler = createRequire(path.join(checkout, "package.json")).resolve(
      "typescript/bin/tsc",
    );
    runTool(
      process.execPath,
      ["tools/prepare-native-dependency.mjs"],
      author,
      "owned-native-preparation",
    );
    runTool(
      process.execPath,
      [compiler, "-p", "tsconfig.json"],
      author,
      "owned-author-build",
    );
    runTool(
      process.execPath,
      ["tools/prepare-native-dependency.mjs", "--bundle"],
      author,
      "owned-native-bundle",
    );
    rmSync(path.join(author, "node_modules"));
    const archives = path.join(root, "archives");
    mkdirSync(archives);
    const packed = runTool(
      "pnpm",
      ["pack", "--json", "--pack-destination", archives],
      author,
      "owned-author-pack",
    );
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
        packageManager: "pnpm@11.22.0",
        dependencies: { "svelte-ui-kit": `file:${archive}` },
      }),
    );
    runTool(
      "pnpm",
      [
        "install",
        "--offline",
        "--ignore-scripts",
        "--strict-peer-dependencies",
        "--engine-strict",
      ],
      host,
      "offline-cli-install",
    );
    const packageRoot = realpathSync(
      path.join(host, "node_modules/svelte-ui-kit"),
    );
    for (const absent of ["src", "tests", "implementation", "tools"])
      assert.equal(existsSync(path.join(packageRoot, absent)), false, absent);
    const evidence = {
      archiveSha256: sha256Hex(archiveBytes),
      pack: JSON.parse(packed.stdout),
      executableSha256: sha256Hex(
        readFileSync(path.join(packageRoot, "dist/cli/main.js")),
      ),
      registrySha256: sha256Hex(
        readFileSync(path.join(packageRoot, "registry/registry.json")),
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
    writeFileSync(guard, runtimeGuard(checkout, audit));
    writeFileSync(
      path.join(logRoot, `${prefix}-identity.json`),
      JSON.stringify(evidence, null, 2),
    );
    // Node's permission mode disables fsync even with all filesystem grants.
    // Keep real transaction durability; guard source/module reads instead.
    const nodeArgs = ["--require", guard];
    const runNode = (args: string[], cwd: string, label: string) => {
      writeFileSync(audit, "");
      const result = spawnSync(process.execPath, [...nodeArgs, ...args], {
        cwd,
        env,
        encoding: "utf8",
        timeout: 30000,
      });
      const guardEvents = readFileSync(audit, "utf8")
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      transcript.push({
        label,
        args,
        status: result.status,
        signal: result.signal,
        stdout: result.stdout,
        stderr: result.stderr,
        guardEvents,
      });
      writeEvidence();
      assert.equal(result.signal, null);
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
      );
    const prepareConsumer = (custom: boolean) => {
      const consumer = path.join(
        root,
        custom ? "custom-consumer" : "default-consumer",
      );
      mkdirSync(consumer);
      const manifest = JSON.parse(
        readFileSync(
          path.join(checkout, "tests/fixtures/consumer/package.json"),
          "utf8",
        ),
      );
      manifest.name = custom ? "owned-runtime-custom" : "owned-runtime-default";
      manifest.packageManager = "pnpm@11.22.0";
      // Explicit operator setup extracts the actual locally packed CLI member.
      // It never uses an authoring cache as the consumer dependency source.
      const extraction = path.join(consumer, ".owned-cli-extraction");
      mkdirSync(extraction);
      const member = `package/dist/native/${NATIVE_BASELINE.archive}`;
      runTool(
        "tar",
        ["-xf", retainedArchive, "-C", extraction, member],
        consumer,
        "explicit-native-extraction",
      );
      const nativeBytes = readFileSync(path.join(extraction, member));
      assert.equal(sha256Hex(nativeBytes), NATIVE_BASELINE.archiveSha256);
      mkdirSync(path.join(consumer, "vendor"));
      writeFileSync(
        path.join(consumer, "vendor", NATIVE_BASELINE.archive),
        nativeBytes,
        { flag: "wx" },
      );
      rmSync(extraction, { recursive: true });
      manifest.dependencies["bits-ui"] =
        `file:./vendor/${NATIVE_BASELINE.archive}`;
      writeFileSync(
        path.join(consumer, "package.json"),
        JSON.stringify(manifest, null, 2),
      );
      // Dependency setup is separate from the CLI and uses real declared pins.
      runTool(
        "pnpm",
        [
          "install",
          "--offline",
          "--ignore-scripts",
          "--strict-peer-dependencies",
          "--engine-strict",
        ],
        consumer,
        "explicit-consumer-install",
      );
      const write = (logical: string, text: string) => {
        const target = path.join(consumer, logical);
        mkdirSync(path.dirname(target), { recursive: true });
        writeFileSync(target, text);
      };
      write("svelte.config.js", "export default { kit: {} };\n");
      write(
        "src/routes/+layout.svelte",
        '<script lang="ts">let {children} = $props();</script>\n{@render children()}\n',
      );
      const config = custom
        ? { ...DEFAULT_KIT_CONFIG, uiDir: "app/ui", stylesDir: "assets/styles" }
        : DEFAULT_KIT_CONFIG;
      const paths = deriveKitPaths(config);
      if (custom) write(`${paths.stateDir}/kit.json`, JSON.stringify(config));
      return { root: consumer, config, paths, write };
    };
    const clone = (name: string) => {
      const cloned = path.join(root, name);
      mkdirSync(cloned);
      for (const file of ["dist", "registry", "schema", "package.json"])
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
    cleanup();
    throw error;
  }
}
