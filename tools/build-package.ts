#!/usr/bin/env node
/** One production compiler/packer. Installed CLI commands never load this tool. */
import assert from "node:assert/strict";
import {
  chmodSync,
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { prepareNativeArtifacts } from "./prepare-native-artifacts.ts";
import {
  artifactDigest,
  assertArtifactDestination,
  regularArtifact,
} from "./native-artifacts.ts";

const sourceRoot = fileURLToPath(new URL("../", import.meta.url));

function execute(command: string, args: string[], cwd: string): string {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout: 240000,
    killSignal: "SIGKILL",
  });
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null, result.stdout + result.stderr);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout;
}

/** Copy authored delivery inputs without following any linked child or ancestor. */
function copyInput(root: string, logical: string, destination: string): void {
  const segments = logical.split("/");
  assert.ok(
    segments.every((part) => part && part !== "." && part !== "..") &&
      !logical.includes("\\") &&
      !path.isAbsolute(logical),
    "package files must be contained literal paths",
  );
  let current = root;
  for (const part of segments) {
    current = path.join(current, part);
    assert.equal(lstatSync(current).isSymbolicLink(), false);
  }
  cpSync(current, destination, {
    recursive: true,
    filter(file) {
      const entry = lstatSync(file);
      assert.ok(
        !entry.isSymbolicLink() && (entry.isFile() || entry.isDirectory()),
        "package inputs must be regular files or directories",
      );
      return true;
    },
  });
}

/** A fresh compiled tree is used both for local build output and the real tarball. */
export async function buildPackage({
  root = sourceRoot,
  packDestination,
}: {
  readonly root?: string;
  readonly packDestination?: string;
} = {}): Promise<string | null> {
  const packageRoot = realpathSync(root);
  const manifest = JSON.parse(
    regularArtifact(path.join(packageRoot, "package.json")).toString("utf8"),
  );
  assert.equal(manifest.name, "svelte-ui-kit");
  assert.equal(manifest.private, true);
  const dist = path.join(packageRoot, "dist");
  const prior = lstatSync(dist, { throwIfNoEntry: false });
  if (prior) {
    assert.ok(
      prior.isDirectory() && !prior.isSymbolicLink(),
      "real build output required",
    );
    const native = path.join(dist, "native");
    if (lstatSync(native, { throwIfNoEntry: false })) {
      assert.ok(
        lstatSync(native).isDirectory() && !lstatSync(native).isSymbolicLink(),
      );
      const baselines = [
        "native-dependency-baseline.json",
        "svelte-runtime-baseline.json",
      ].map((name) =>
        JSON.parse(
          regularArtifact(path.join(packageRoot, "src/project", name)).toString(
            "utf8",
          ),
        ),
      );
      assert.ok(
        readdirSync(native).every((name) =>
          baselines.some((b) => b.archive === name),
        ),
        "foreign native bundle entry",
      );
      for (const baseline of baselines)
        assertArtifactDestination(
          packageRoot,
          `dist/native/${baseline.archive}`,
          baseline.archiveSha256,
        );
    }
  }
  // Authenticate before compiling or replacing output. Do not silently erase a
  // corrupt native bundle merely because this build will produce a new tree.
  await prepareNativeArtifacts({ root: packageRoot });
  const stage = mkdtempSync(path.join(os.tmpdir(), "suik-build-"));
  try {
    const compiled = path.join(stage, "compiled");
    const compiler = createRequire(
      path.join(packageRoot, "package.json"),
    ).resolve("typescript/bin/tsc");
    execute(
      process.execPath,
      [compiler, "-p", "tsconfig.json", "--outDir", compiled],
      packageRoot,
    );
    await prepareNativeArtifacts({
      root: packageRoot,
      bundle: true,
      compiledRoot: compiled,
    });
    chmodSync(path.join(compiled, "cli/main.js"), 0o755);
    // dist is an ignored generated tree, never a source input. Keep its directory
    // identity, and publish only the fresh compiler/bundle output after success.
    mkdirSync(dist, { recursive: true });
    for (const name of readdirSync(dist))
      rmSync(path.join(dist, name), { recursive: true, force: true });
    cpSync(compiled, dist, { recursive: true });
    if (packDestination === undefined) return null;
    assert.ok(
      path.isAbsolute(packDestination),
      "absolute archive destination required",
    );
    const destination = realpathSync(packDestination);
    assert.ok(lstatSync(destination).isDirectory());
    assert.deepEqual(
      readdirSync(destination),
      [],
      "fresh empty archive destination required",
    );
    const delivery = path.join(stage, "package");
    mkdirSync(delivery);
    copyInput(packageRoot, "package.json", path.join(delivery, "package.json"));
    copyInput(
      packageRoot,
      "pnpm-workspace.yaml",
      path.join(delivery, "pnpm-workspace.yaml"),
    );
    for (const file of manifest.files as string[]) {
      mkdirSync(path.dirname(path.join(delivery, file)), { recursive: true });
      if (file === "dist")
        cpSync(compiled, path.join(delivery, file), { recursive: true });
      else copyInput(packageRoot, file, path.join(delivery, file));
    }
    const result = execute(
      "pnpm",
      ["pack", "--json", "--pack-destination", destination],
      delivery,
    );
    const names = readdirSync(destination);
    assert.equal(names.length, 1);
    assert.ok(names[0]!.endsWith(".tgz"));
    // Read actual archive bytes; a successful pack's stdout alone is not delivery.
    assert.match(
      artifactDigest(regularArtifact(path.join(destination, names[0]!))),
      /^[0-9a-f]{64}$/,
    );
    return result;
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2);
  assert.ok(
    args.length === 0 ||
      (args.length === 2 && args[0] === "--pack-destination"),
    "usage: build-package.ts [--pack-destination <fresh absolute directory>]",
  );
  const result = await buildPackage({ packDestination: args[1] });
  if (result !== null) process.stdout.write(result);
}
