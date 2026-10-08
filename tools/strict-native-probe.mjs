#!/usr/bin/env node
/**
 * R11-F01 diagnostic qualification, not final strict acceptance. Every trial
 * installs supported packages in a disposable owned project. Public entry
 * failures, successful no-import control and an authored negative control are
 * recorded separately. No installed package or reference source is patched.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const fixtureRoot = path.join(packageRoot, "tests/fixtures/consumer");
const producerOverrides = {
  runed: "0.35.1",
  "svelte-toolbelt": "0.10.6",
  svelte2tsx: "0.7.34",
  "@floating-ui/core": "1.7.1",
  "@floating-ui/dom": "1.7.1",
  "esm-env": "1.2.2",
  tabbable: "6.2.0",
};
const [profile, output] = process.argv.slice(2);
assert.ok(
  ["current", "producer-full", "peer-floor"].includes(profile),
  "profile: current | producer-full | peer-floor",
);
assert.ok(output, "provide an owned report directory");
assert.equal(process.argv.length, 4, "unexpected arguments");
const reportRoot = path.resolve(output);
mkdirSync(reportRoot, { recursive: true });
const root = mkdtempSync(path.join(os.tmpdir(), "suik-native-diagnosis-"));
const record = {
  profile,
  diagnosticQualification: false,
  commands: [],
  artifacts: {},
};
const save = () =>
  writeFileSync(
    path.join(reportRoot, `${profile}.json`),
    `${JSON.stringify(record, null, 2)}\n`,
  );
const env = { ...process.env, npm_config_verify_deps_before_run: "false" };
for (const name of ["NODE_TEST_CONTEXT", "NODE_OPTIONS", "NODE_V8_COVERAGE"])
  delete env[name];
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: "utf8",
    timeout: 240_000,
    maxBuffer: 32 * 1024 * 1024,
  });
  const outcome = {
    command,
    args,
    exitCode: result.status,
    signal: result.signal,
    error: result.error?.message ?? null,
    stdout: result.stdout,
    stderr: result.stderr,
  };
  record.commands.push(outcome);
  save();
  assert.equal(outcome.signal, null, `signal from ${command}`);
  assert.equal(outcome.error, null, `tool failure from ${command}`);
  return outcome;
}
function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

try {
  const excluded = new Set([
    "node_modules",
    ".svelte-kit",
    "build",
    "dist",
    "coverage",
    "pnpm-lock.yaml",
  ]);
  cpSync(fixtureRoot, root, {
    recursive: true,
    filter: (source) => !excluded.has(path.basename(source)),
  });
  const manifest = JSON.parse(
    readFileSync(path.join(root, "package.json"), "utf8"),
  );
  manifest.packageManager = "pnpm@11.22.0";
  if (profile !== "current") {
    Object.assign(manifest.dependencies, {
      "bits-ui": "2.19.5",
      svelte: "5.46.4",
      "@internationalized/date": "3.8.2",
    });
    Object.assign(manifest.devDependencies, {
      typescript: "5.9.3",
      "svelte-check": "4.3.1",
      "@sveltejs/kit": "2.49.5",
      "@sveltejs/vite-plugin-svelte": "6.2.0",
      vite: "7.1.5",
      "@types/node": "20.19.16",
      "@sveltejs/package": "2.5.0",
      svelte2tsx: "0.7.34",
    });
    writeFileSync(
      path.join(root, "pnpm-workspace.yaml"),
      `overrides:\n${Object.entries(producerOverrides)
        .map(
          ([name, version]) =>
            `  ${JSON.stringify(name)}: ${JSON.stringify(version)}\n`,
        )
        .join("")}`,
    );
  }
  if (profile === "peer-floor") manifest.dependencies.svelte = "5.33.0";
  writeFileSync(
    path.join(root, "package.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  const config = JSON.parse(
    readFileSync(path.join(root, "tsconfig.json"), "utf8"),
  );
  config.compilerOptions.skipLibCheck = false;
  writeFileSync(
    path.join(root, "tsconfig.json"),
    `${JSON.stringify(config, null, 2)}\n`,
  );
  assert.equal(
    run("pnpm", [
      "install",
      "--ignore-scripts",
      "--strict-peer-dependencies",
      "--engine-strict",
    ]).exitCode,
    0,
    "supported strict installation",
  );
  const require = createRequire(path.join(root, "package.json"));
  const ts = require("typescript");
  record.versions = {};
  for (const name of [
    ...Object.keys(manifest.dependencies),
    ...Object.keys(manifest.devDependencies),
  ]) {
    record.versions[name] = JSON.parse(
      readFileSync(
        path.join(root, "node_modules", name, "package.json"),
        "utf8",
      ),
    ).version;
  }
  const bits = realpathSync(path.join(root, "node_modules/bits-ui"));
  const nativeManifest = JSON.parse(
    readFileSync(path.join(bits, "package.json"), "utf8"),
  );
  record.nativeMetadata = {
    version: nativeManifest.version,
    exports: nativeManifest.exports,
    peers: nativeManifest.peerDependencies,
    engines: nativeManifest.engines,
  };
  record.nativeTransitives = {};
  for (const name of Object.keys(nativeManifest.dependencies)) {
    record.nativeTransitives[name] = JSON.parse(
      readFileSync(path.join(bits, "..", name, "package.json"), "utf8"),
    ).version;
    if (profile !== "current")
      assert.equal(
        record.nativeTransitives[name],
        producerOverrides[name],
        `${name} producer transitive pin`,
      );
  }
  if (profile !== "current") {
    const emitterRequire = createRequire(
      path.join(root, "node_modules/@sveltejs/package/package.json"),
    );
    record.packageEmitterVersion = JSON.parse(
      readFileSync(emitterRequire.resolve("svelte2tsx/package.json"), "utf8"),
    ).version;
    assert.equal(
      record.packageEmitterVersion,
      producerOverrides.svelte2tsx,
      "actual declaration emitter pin",
    );
  }
  for (const rel of [
    "package.json",
    "dist/index.d.ts",
    "dist/bits/button/components/button.svelte.d.ts",
    "dist/bits/button/types.d.ts",
    "dist/bits/calendar/components/calendar.svelte.d.ts",
    "dist/bits/calendar/types.d.ts",
  ]) {
    record.artifacts[rel] = digest(readFileSync(path.join(bits, rel)));
  }
  const lock = readFileSync(path.join(root, "pnpm-lock.yaml"));
  record.lockSha256 = digest(lock);
  writeFileSync(path.join(reportRoot, `${profile}.pnpm-lock.yaml`), lock);
  const minimal = path.join(root, "minimal.ts");
  const options = {
    strict: true,
    skipLibCheck: false,
    noEmit: true,
    target: ts.ScriptTarget.ES2023,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    types: ["node"],
    lib: ["lib.es2023.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
  };
  // Use the actual checker's ambient declarations and resolution environment.
  const shims = path.join(
    root,
    "node_modules/svelte-check/dist/src/svelte-shims-v4.d.ts",
  );
  record.checkerShimsSha256 = digest(readFileSync(shims));
  function check(source) {
    writeFileSync(minimal, source);
    const program = ts.createProgram([minimal, shims], options);
    return ts.getPreEmitDiagnostics(program).map((item) => ({
      code: item.code,
      category: ts.DiagnosticCategory[item.category],
      file: item.file ? path.relative(root, item.file.fileName) : null,
      line:
        item.file && item.start !== undefined
          ? item.file.getLineAndCharacterOfPosition(item.start).line + 1
          : null,
      message: ts.flattenDiagnosticMessageText(item.messageText, "\n"),
    }));
  }
  const publicSource =
    'import { Button, Calendar } from "bits-ui";\nvoid Button.Root;\nvoid Calendar.Root;\n';
  record.minimal = { source: publicSource, diagnostics: check(publicSource) };
  const nativeErrors = record.minimal.diagnostics.length;
  assert.ok(
    nativeErrors === 2 || (profile === "peer-floor" && nativeErrors === 0),
    "known native failure or strict-green supported peer floor",
  );
  for (const item of record.minimal.diagnostics) assert.equal(item.code, 2590);
  assert.deepEqual(
    record.minimal.diagnostics.map((item) => path.basename(item.file)).sort(),
    nativeErrors === 2 ? ["button.svelte.d.ts", "calendar.svelte.d.ts"] : [],
  );
  record.noImportControl = check("export const control = 1;\n");
  assert.deepEqual(
    record.noImportControl,
    [],
    "compiler can check a valid minimal project",
  );
  record.authoredControl = check(
    `${publicSource}const invalid: number = "wrong";\nvoid invalid;\n`,
  );
  assert.equal(record.authoredControl.length, nativeErrors + 1);
  assert.ok(
    record.authoredControl.some(
      (item) => item.code === 2322 && item.file === "minimal.ts",
    ),
  );
  writeFileSync(minimal, publicSource);
  writeFileSync(
    path.join(root, "tsconfig.minimal.json"),
    `${JSON.stringify({ compilerOptions: { strict: true, skipLibCheck: false, noEmit: true, target: "ES2023", module: "ESNext", moduleResolution: "Bundler", types: ["node"], lib: ["ES2023", "DOM", "DOM.Iterable"] }, files: ["minimal.ts", shims] }, null, 2)}\n`,
  );
  const traceRoot = path.join(root, "trace");
  const traced = run(process.execPath, [
    path.join(root, "node_modules/typescript/bin/tsc"),
    "-p",
    "tsconfig.minimal.json",
    "--generateTrace",
    traceRoot,
    "--pretty",
    "false",
  ]);
  assert.equal(
    traced.exitCode,
    nativeErrors === 0 ? 0 : 2,
    "raw compiler failed; diagnostic qualification is not a raw pass",
  );
  const trace = JSON.parse(
    readFileSync(path.join(traceRoot, "trace.json"), "utf8"),
  );
  const types = JSON.parse(
    readFileSync(path.join(traceRoot, "types.json"), "utf8"),
  );
  record.traceLimits = trace.filter((event) =>
    /(?:checkCrossProductUnion|removeSubtypes)_DepthLimit/.test(event.name),
  );
  record.traceTypes = types.filter((type) =>
    record.traceLimits.some((event) => event.args?.typeIds?.includes(type.id)),
  );
  record.traceSummary = record.traceLimits.map((event) => ({
    name: event.name,
    size: event.args.size,
    keySets: event.args.typeIds.map((id) => {
      const type = types.find((item) => item.id === id);
      return {
        count: type.unionTypes.length,
        sample: type.unionTypes.slice(0, 12).map((key) => {
          const value = types.find((item) => item.id === key);
          return value.display ?? value.intrinsicName;
        }),
      };
    }),
  }));
  cpSync(traceRoot, path.join(reportRoot, `${profile}-trace`), {
    recursive: true,
  });
  record.fullConsumer = run("pnpm", ["run", "check"]);
  assert.equal(
    record.fullConsumer.exitCode,
    nativeErrors === 0 ? 0 : 1,
    "actual raw consumer failure remains visible",
  );
  assert.match(
    record.fullConsumer.stdout,
    nativeErrors === 0 ? /0 errors and 0 warnings/ : /2 errors and 0 warnings/,
  );
  record.diagnosticQualification = true;
  save();
  console.log(
    `${profile}: ${nativeErrors} native TS2590 failures; positive and authored-negative controls passed. Full consumer exit ${record.fullConsumer.exitCode}.`,
  );
} finally {
  rmSync(root, { recursive: true, force: true });
  record.ownedProjectRemoved = true;
  save();
}
