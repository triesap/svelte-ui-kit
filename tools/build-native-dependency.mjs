#!/usr/bin/env node
/** Authentic, isolated producer build. This command never installs into an app. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const inputRoot = fileURLToPath(
  new URL("./native-dependency/", import.meta.url),
);
export const NATIVE_RECIPE = JSON.parse(
  readFileSync(path.join(inputRoot, "recipe.json"), "utf8"),
);
export function nativeDigest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

/** Canonical gzip metadata; genuine packed content and its CRC stay unchanged. */
export function normalizePackedArchive(file) {
  const bytes = readFileSync(file);
  assert.ok(bytes.length >= 18, "complete gzip archive");
  assert.deepEqual(
    [...bytes.subarray(0, 4)],
    [31, 139, 8, 0],
    "ordinary gzip header",
  );
  assert.deepEqual(
    [...bytes.subarray(4, 8)],
    [0, 0, 0, 0],
    "reproducible gzip timestamp",
  );
  assert.equal(NATIVE_RECIPE.archiveFormat.gzipOperatingSystem, 255);
  const content = gunzipSync(bytes);
  bytes[9] = NATIVE_RECIPE.archiveFormat.gzipOperatingSystem;
  assert.deepEqual(
    gunzipSync(bytes),
    content,
    "packaging metadata preserves genuine content",
  );
  writeFileSync(file, bytes);
}

/**
 * Every build owns a fresh temporary tree and a previously absent output
 * directory. Supplied source checkouts are read through their authenticated
 * Git archive, not copied from working trees or mutated in place.
 */
export function buildNativeDependency({
  output,
  nativeSource,
  emitterSource,
  recordLocks = false,
  baseline = false,
  report,
} = {}) {
  assert.equal(NATIVE_RECIPE.schemaVersion, 1, "supported recipe version");
  assert.equal(
    process.versions.node,
    "24.21.0",
    "qualified producer Node version",
  );
  assert.ok(output, "explicit fresh output directory required");
  const outputRoot = path.resolve(output);
  assert.equal(existsSync(outputRoot), false, "output must not already exist");
  // Non-following ancestry checks also refuse dangling symlinks.
  for (let current = outputRoot; ; current = path.dirname(current)) {
    try {
      assert.ok(lstatSync(current).isDirectory(), "unsafe output ancestry");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (path.dirname(current) === current) break;
  }
  const work = mkdtempSync(path.join(os.tmpdir(), "suik-native-producer-"));
  writeJson(path.join(work, "package.json"), {
    private: true,
    packageManager: "pnpm@11.22.0",
  });
  const outcomes = [];
  const reportState = { baseline, outcomes };
  const env = { ...process.env, npm_config_verify_deps_before_run: "false" };
  for (const name of ["NODE_TEST_CONTEXT", "NODE_OPTIONS", "NODE_V8_COVERAGE"])
    delete env[name];
  const save = (extra = {}) => {
    Object.assign(reportState, extra);
    if (report) writeJson(path.resolve(report), reportState);
  };
  function run(command, args, cwd, binary = false) {
    const result = spawnSync(command, args, {
      cwd,
      env,
      encoding: binary ? undefined : "utf8",
      timeout: 240_000,
      maxBuffer: 64 * 1024 * 1024,
    });
    outcomes.push({
      command,
      args,
      exitCode: result.status,
      signal: result.signal,
      error: result.error?.message ?? null,
      stdout: binary
        ? {
            bytes: result.stdout?.length,
            sha256: nativeDigest(result.stdout ?? ""),
          }
        : result.stdout,
      stderr: binary ? result.stderr?.toString() : result.stderr,
    });
    save();
    assert.equal(result.error, undefined, `${command} tool failure`);
    assert.equal(result.signal, null, `${command} signal`);
    assert.equal(
      result.status,
      0,
      `${command} failed\n${result.stderr}\n${binary ? "" : result.stdout}`,
    );
    return result.stdout;
  }
  function sourceArchive(role, supplied) {
    const descriptor = NATIVE_RECIPE[role];
    let source = supplied && path.resolve(supplied);
    if (source) {
      assert.equal(
        run("git", ["rev-parse", "HEAD"], source).trim(),
        descriptor.revision,
        `${role} revision`,
      );
      assert.equal(
        run("git", ["status", "--porcelain"], source).trim(),
        "",
        `${role} source must be clean`,
      );
    } else {
      source = path.join(work, `${role}-source`);
      run("git", ["init", "--quiet", source], work);
      run(
        "git",
        ["fetch", "--depth", "1", descriptor.repository, descriptor.revision],
        source,
      );
      assert.equal(
        run("git", ["rev-parse", "FETCH_HEAD"], source).trim(),
        descriptor.revision,
      );
    }
    const bytes = run(
      "git",
      ["archive", descriptor.revision, descriptor.packagePath],
      source,
      true,
    );
    const archive = path.join(work, `${role}-source.tar`);
    writeFileSync(archive, bytes);
    const extracted = path.join(work, `${role}-extracted`);
    mkdirSync(extracted);
    run("tar", ["-xf", archive, "-C", extracted], work);
    const root = path.join(extracted, descriptor.packagePath);
    const manifest = JSON.parse(
      readFileSync(path.join(root, "package.json"), "utf8"),
    );
    assert.equal(
      manifest.version,
      descriptor.sourceVersion,
      `${role} source manifest`,
    );
    return { root, manifest, archiveSha256: nativeDigest(bytes) };
  }
  function install(root, role) {
    const lock = path.join(inputRoot, `${role}.pnpm-lock.yaml`);
    if (!recordLocks) cpSync(lock, path.join(root, "pnpm-lock.yaml"));
    run(
      "pnpm",
      [
        "install",
        "--ignore-scripts",
        "--strict-peer-dependencies",
        "--engine-strict",
        ...(recordLocks || (baseline && role === "native")
          ? ["--no-frozen-lockfile"]
          : ["--frozen-lockfile"]),
      ],
      root,
    );
    if (recordLocks) cpSync(path.join(root, "pnpm-lock.yaml"), lock);
  }
  try {
    assert.equal(
      run("pnpm", ["--version"], work).trim(),
      "11.22.0",
      "qualified producer pnpm version",
    );
    const emitter = sourceArchive("emitter", emitterSource);
    const native = sourceArchive("native", nativeSource);
    const patch = path.join(inputRoot, NATIVE_RECIPE.emitter.patch);
    if (!baseline) {
      run("git", ["apply", "--check", patch], emitter.root);
      run("git", ["apply", patch], emitter.root);
    }
    emitter.manifest.version = NATIVE_RECIPE.emitter.buildVersion;
    emitter.manifest.packageManager = "pnpm@11.22.0";
    Object.assign(
      emitter.manifest.devDependencies,
      NATIVE_RECIPE.emitter.devDependencies,
    );
    writeJson(path.join(emitter.root, "package.json"), emitter.manifest);
    install(emitter.root, "emitter");
    run("pnpm", ["run", "build"], emitter.root);
    const toolArchives = path.join(work, "tool-archives");
    mkdirSync(toolArchives);
    run("pnpm", ["pack", "--pack-destination", toolArchives], emitter.root);
    const toolArchive = path.join(toolArchives, NATIVE_RECIPE.emitter.archive);
    assert.ok(existsSync(toolArchive), "actual emitter archive");
    normalizePackedArchive(toolArchive);

    // The same relative transport is retained across every fresh producer tree.
    const nativeRoot = path.join(work, "native");
    cpSync(native.root, nativeRoot, { recursive: true });
    native.manifest.version = NATIVE_RECIPE.native.buildVersion;
    native.manifest.packageManager = "pnpm@11.22.0";
    Object.assign(
      native.manifest.dependencies,
      NATIVE_RECIPE.nativeDependencies,
    );
    native.manifest.devDependencies = {
      ...NATIVE_RECIPE.nativeDevDependencies,
      svelte2tsx: `file:../tool-archives/${NATIVE_RECIPE.emitter.archive}`,
    };
    writeJson(path.join(nativeRoot, "package.json"), native.manifest);
    writeFileSync(
      path.join(nativeRoot, "pnpm-workspace.yaml"),
      `overrides:\n  svelte2tsx: ${JSON.stringify(native.manifest.devDependencies.svelte2tsx)}\n`,
    );
    install(nativeRoot, "native");
    const require = createRequire(
      path.join(nativeRoot, "node_modules/@sveltejs/package/package.json"),
    );
    const actualEmitter = path.dirname(
      require.resolve("svelte2tsx/package.json"),
    );
    assert.equal(
      JSON.parse(readFileSync(path.join(actualEmitter, "package.json"), "utf8"))
        .version,
      NATIVE_RECIPE.emitter.buildVersion,
      "package tool uses source-built emitter",
    );
    assert.equal(
      nativeDigest(
        readFileSync(path.join(actualEmitter, "svelte-shims-v4.d.ts")),
      ),
      nativeDigest(
        readFileSync(path.join(emitter.root, "svelte-shims-v4.d.ts")),
      ),
      "actual installed source shim",
    );
    run("pnpm", ["run", "package"], nativeRoot);
    for (const [name, bindings] of [
      ["button", '"ref"'],
      ["calendar", '"ref" | "value" | "placeholder"'],
    ]) {
      const declaration = readFileSync(
        path.join(
          nativeRoot,
          `dist/bits/${name}/components/${name}.svelte.d.ts`,
        ),
        "utf8",
      );
      if (!baseline) {
        assert.ok(
          declaration.includes(`z_$$bindings?: ${bindings}`),
          `${name} binding metadata preserved`,
        );
        assert.ok(
          !declaration.includes("new <"),
          `${name} has no constructor signature`,
        );
      }
    }
    const provenance = {
      schemaVersion: 1,
      name: "bits-ui",
      version: NATIVE_RECIPE.native.buildVersion,
      variant: baseline
        ? "unpatched-causal-control"
        : "source-emitter-binding-signature",
      nativeSource: {
        ...NATIVE_RECIPE.native,
        archiveSha256: native.archiveSha256,
      },
      emitterSource: {
        repository: NATIVE_RECIPE.emitter.repository,
        revision: NATIVE_RECIPE.emitter.revision,
        sourceManifestVersion: NATIVE_RECIPE.emitter.sourceVersion,
        sourceTag: NATIVE_RECIPE.emitter.sourceTag,
        buildVersion: NATIVE_RECIPE.emitter.buildVersion,
        archiveSha256: emitter.archiveSha256,
      },
      patchSha256: baseline ? null : nativeDigest(readFileSync(patch)),
      recipeSha256: nativeDigest(
        readFileSync(path.join(inputRoot, "recipe.json")),
      ),
      producerLocks: Object.fromEntries(
        ["emitter", "native"].map((role) => [
          role,
          nativeDigest(
            readFileSync(
              path.join(
                role === "emitter" ? emitter.root : nativeRoot,
                "pnpm-lock.yaml",
              ),
            ),
          ),
        ]),
      ),
      emitterArchiveSha256: nativeDigest(readFileSync(toolArchive)),
      toolchain: {
        node: process.versions.node,
        pnpm: run("pnpm", ["--version"], work).trim(),
        emitter: NATIVE_RECIPE.emitter.devDependencies,
        native: NATIVE_RECIPE.nativeDevDependencies,
      },
    };
    // Pack actual build output into a self-contained native distribution. The
    // producer's dev-only local emitter paths are not consumer requirements.
    const stage = path.join(work, "native-distribution");
    mkdirSync(stage);
    for (const file of ["dist", "LICENSE", "README.md"])
      cpSync(path.join(nativeRoot, file), path.join(stage, file), {
        recursive: true,
      });
    const distribution = { ...native.manifest };
    delete distribution.devDependencies;
    delete distribution.scripts;
    distribution.files = [
      ...distribution.files,
      "NATIVE_PROVENANCE.json",
      "EMITTER_LICENSE",
    ];
    writeJson(path.join(stage, "package.json"), distribution);
    cpSync(
      path.join(emitter.root, "LICENSE"),
      path.join(stage, "EMITTER_LICENSE"),
    );
    const inventory = (directory, prefix = "") =>
      readdirSync(directory, { withFileTypes: true })
        .sort((left, right) =>
          left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
        )
        .flatMap((entry) => {
          const logical = `${prefix}${entry.name}`;
          const file = path.join(directory, entry.name);
          if (entry.isDirectory()) return inventory(file, `${logical}/`);
          assert.ok(
            entry.isFile() && !entry.isSymbolicLink(),
            "regular distribution input",
          );
          return [{ path: logical, sha256: nativeDigest(readFileSync(file)) }];
        });
    // Inventory the package manager's actual file selection, including its
    // upstream test/spec exclusions, rather than certifying staging contents.
    const archives = path.join(work, "native-archives");
    mkdirSync(archives);
    run("pnpm", ["pack", "--pack-destination", archives], stage);
    normalizePackedArchive(path.join(archives, NATIVE_RECIPE.native.archive));
    const selected = path.join(work, "selected-native-distribution");
    mkdirSync(selected);
    run(
      "tar",
      [
        "-xf",
        path.join(archives, NATIVE_RECIPE.native.archive),
        "-C",
        selected,
      ],
      work,
    );
    provenance.distributionFiles = inventory(path.join(selected, "package"));
    writeJson(path.join(stage, "NATIVE_PROVENANCE.json"), provenance);
    run("pnpm", ["pack", "--pack-destination", archives], stage);
    normalizePackedArchive(path.join(archives, NATIVE_RECIPE.native.archive));
    const bytes = readFileSync(
      path.join(archives, NATIVE_RECIPE.native.archive),
    );
    const qualified = {
      ...provenance,
      archive: NATIVE_RECIPE.native.archive,
      archiveSha256: nativeDigest(bytes),
    };
    if (!baseline && !recordLocks) {
      const expected = JSON.parse(
        readFileSync(
          new URL(
            "../src/project/native-dependency-baseline.json",
            import.meta.url,
          ),
          "utf8",
        ),
      );
      assert.equal(expected.schemaVersion, 1, "native identity version");
      assert.equal(
        qualified.version,
        expected.version,
        "qualified native version",
      );
      assert.equal(
        qualified.archiveSha256,
        expected.archiveSha256,
        "qualified native archive identity",
      );
      assert.equal(
        nativeDigest(readFileSync(path.join(stage, "NATIVE_PROVENANCE.json"))),
        expected.provenanceSha256,
        "qualified native provenance identity",
      );
    }
    mkdirSync(outputRoot, { recursive: true });
    writeFileSync(path.join(outputRoot, qualified.archive), bytes);
    writeJson(path.join(outputRoot, "provenance.json"), qualified);
    save({ qualified });
    return qualified;
  } finally {
    rmSync(work, { recursive: true, force: true });
    save({ ownedProducerRemoved: true });
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2);
  const options = {};
  while (args.length) {
    const option = args.shift();
    if (option === "--record-locks") options.recordLocks = true;
    else if (option === "--baseline") options.baseline = true;
    else {
      const names = {
        "--output": "output",
        "--native-source": "nativeSource",
        "--emitter-source": "emitterSource",
        "--report": "report",
      };
      assert.ok(
        Object.hasOwn(names, option) &&
          args[0] &&
          !Object.hasOwn(options, names[option]),
        `unknown or incomplete option ${option}`,
      );
      options[names[option]] = args.shift();
    }
  }
  console.log(JSON.stringify(buildNativeDependency(options), null, 2));
}
