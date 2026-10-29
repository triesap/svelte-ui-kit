#!/usr/bin/env node
/** Repackage authenticated upstream source; never edit an installed dependency. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPackedFiles, normalizeGzip } from "./native-runtime/archive.ts";
import {
  SVELTE_RUNTIME_RECIPE as recipe,
  type SvelteRuntimeMode,
} from "./native-runtime/recipe.ts";

const digest = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const inputs = fileURLToPath(new URL("./native-runtime/", import.meta.url));

export async function buildSvelteRuntime(options: {
  output: string;
  sourceArchive?: string;
  mode?: SvelteRuntimeMode;
}) {
  assert.equal(process.versions.node, recipe.node, "qualified producer Node");
  const mode = options.mode ?? "complete";
  assert.ok(
    ["complete", "dispatch-only", "unpatched"].includes(mode),
    "known correction mode",
  );
  const corrected = mode === "complete";
  const output = path.resolve(options.output);
  for (let current = output; ; current = path.dirname(current)) {
    const entry = lstatSync(current, { throwIfNoEntry: false });
    if (current === output)
      assert.equal(entry, undefined, "output must be absent");
    else if (entry)
      assert.ok(
        entry.isDirectory() && !entry.isSymbolicLink(),
        "regular output ancestry",
      );
    if (path.dirname(current) === current) break;
  }
  const work = mkdtempSync(path.join(os.tmpdir(), "suik-svelte-producer-"));
  const outcomes: {
    command: string;
    args: string[];
    status: number | null;
    signal: string | null;
    stdout: string;
    stderr: string;
  }[] = [];
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    pnpm_config_verify_deps_before_run: "false",
  };
  for (const name of ["NODE_OPTIONS", "NODE_TEST_CONTEXT", "NODE_V8_COVERAGE"])
    delete env[name];
  const run = (command: string, args: string[], cwd: string) => {
    const result = spawnSync(command, args, {
      cwd,
      env,
      encoding: "utf8",
      timeout: 240000,
      maxBuffer: 16 * 1024 * 1024,
    });
    outcomes.push({
      command,
      args,
      status: result.status,
      signal: result.signal,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    });
    assert.equal(result.error, undefined, `${command} must finish`);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    return result.stdout;
  };
  try {
    writeFileSync(
      path.join(work, "package.json"),
      json({ private: true, packageManager: `pnpm@${recipe.pnpm}` }),
    );
    assert.equal(
      run("pnpm", ["--version"], work).trim(),
      recipe.pnpm,
      "qualified package manager",
    );
    let packed: Buffer;
    if (options.sourceArchive) {
      const source = lstatSync(options.sourceArchive);
      assert.ok(
        source.isFile() && !source.isSymbolicLink(),
        "regular source archive",
      );
      assert.ok(source.size <= 8 * 1024 * 1024, "bounded source archive");
      packed = readFileSync(options.sourceArchive);
    } else {
      const response = await fetch(recipe.sourceUrl, {
        signal: AbortSignal.timeout(30000),
        redirect: "error",
      });
      assert.equal(response.status, 200, "immutable upstream source available");
      assert.ok(response.body, "upstream source body");
      const chunks: Uint8Array[] = [];
      let length = 0;
      for await (const chunk of response.body) {
        length += chunk.byteLength;
        assert.ok(length <= 8 * 1024 * 1024, "bounded upstream source body");
        chunks.push(chunk);
      }
      packed = Buffer.concat(chunks, length);
    }
    assert.equal(
      digest(packed),
      recipe.sourceSha256,
      "authenticated upstream archive",
    );
    assert.equal(
      `sha512-${createHash("sha512").update(packed).digest("base64")}`,
      recipe.sourceIntegrity,
      "upstream registry integrity",
    );
    const files = readPackedFiles(packed);
    assert.equal(
      digest(files.get("compiler/index.js")!.bytes),
      recipe.compilerSha256,
      "authentic upstream compiler",
    );
    const stage = path.join(work, "source");
    mkdirSync(stage);
    for (const [logical, file] of files) {
      const target = path.join(stage, logical);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, file.bytes, { flag: "wx", mode: file.mode });
    }
    const patch = readFileSync(path.join(inputs, "reset-dispatch.patch"));
    const bindingsPatch = readFileSync(
      path.join(inputs, "bindings-reset.patch"),
    );
    for (const [index, bytes] of (mode === "unpatched"
      ? []
      : corrected
        ? [patch, bindingsPatch]
        : [patch]
    ).entries()) {
      const patchFile = path.join(work, `reset-${index}.patch`);
      writeFileSync(patchFile, bytes);
      // Zero context preserves upstream tab indentation in a whitespace-clean
      // patch file. Exact authenticated source bytes remain the preimage gate.
      run("git", ["apply", "--unidiff-zero", "--check", patchFile], stage);
      run("git", ["apply", "--unidiff-zero", patchFile], stage);
    }
    const manifest = JSON.parse(
      files.get("package.json")!.bytes.toString("utf8"),
    );
    assert.equal(manifest.name, recipe.name);
    assert.equal(manifest.version, recipe.sourceVersion);
    const version = recipe.sourceVersion;
    const buildId =
      mode === "unpatched"
        ? recipe.controlId
        : mode === "dispatch-only"
          ? recipe.dispatchControlId
          : recipe.buildId;
    manifest.svelteUiKitNative = {
      buildId,
      sourceVersion: version,
      corrected,
      mode,
    };
    delete manifest.scripts;
    delete manifest.devDependencies;
    manifest.files = [...manifest.files, "NATIVE_PROVENANCE.json"];
    writeFileSync(path.join(stage, "package.json"), json(manifest));
    const archives = path.join(work, "archives");
    mkdirSync(archives);
    const archive = `svelte-${buildId}.tgz`;
    // pnpm's tarball basename uses SemVer precedence, which omits build
    // metadata. Authenticate the raw manifest version separately.
    const target = path.join(archives, `svelte-${recipe.sourceVersion}.tgz`);
    run("pnpm", ["pack", "--pack-destination", archives], stage);
    normalizeGzip(target);
    const selected = readPackedFiles(readFileSync(target));
    assert.equal(
      JSON.parse(selected.get("package.json")!.bytes.toString()).version,
      version,
      "upstream semantic version retained",
    );
    const provenance = {
      schemaVersion: 1,
      name: recipe.name,
      version,
      buildId,
      corrected,
      mode,
      source: {
        url: recipe.sourceUrl,
        version: recipe.sourceVersion,
        integrity: recipe.sourceIntegrity,
        sha256: recipe.sourceSha256,
      },
      compiler: {
        version: recipe.compilerVersion,
        sha256: recipe.compilerSha256,
        rebuilt: false,
      },
      recipeSha256: digest(readFileSync(path.join(inputs, "recipe.ts"))),
      producerSha256: digest(readFileSync(fileURLToPath(import.meta.url))),
      archiveReaderSha256: digest(
        readFileSync(path.join(inputs, "archive.ts")),
      ),
      patchSha256: digest(patch),
      bindingsPatchSha256: digest(bindingsPatch),
      toolchain: { node: process.versions.node, pnpm: recipe.pnpm },
      distributionFiles: [...selected]
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([logical, file]) => ({
          path: logical,
          sha256: digest(file.bytes),
        })),
    };
    writeFileSync(path.join(stage, "NATIVE_PROVENANCE.json"), json(provenance));
    run("pnpm", ["pack", "--pack-destination", archives], stage);
    normalizeGzip(target);
    const result = readFileSync(target);
    const distribution = readPackedFiles(result);
    assert.equal(
      distribution.size,
      selected.size + 1,
      "only provenance added by final pack",
    );
    for (const [logical, file] of selected)
      assert.deepEqual(
        distribution.get(logical),
        file,
        `preserved packed input ${logical}`,
      );
    assert.equal(
      digest(distribution.get("compiler/index.js")!.bytes),
      recipe.compilerSha256,
      "compiler unchanged",
    );
    assert.deepEqual(
      distribution.get("LICENSE.md")?.bytes,
      files.get("LICENSE.md")?.bytes,
      "upstream notice retained",
    );
    mkdirSync(output, { recursive: true });
    writeFileSync(path.join(output, archive), result, { flag: "wx" });
    writeFileSync(
      path.join(output, "provenance.json"),
      json({ ...provenance, archive, archiveSha256: digest(result) }),
      { flag: "wx" },
    );
    writeFileSync(path.join(output, "report.json"), json({ outcomes }), {
      flag: "wx",
    });
    return {
      archive,
      sha256: digest(result),
      provenanceSha256: digest(Buffer.from(json(provenance))),
    };
  } catch (error) {
    // Retain diagnostics, without replacing an existing output tree.
    if (!existsSync(output)) {
      mkdirSync(output, { recursive: true });
      writeFileSync(
        path.join(output, "report.json"),
        json({ outcomes, failure: String(error) }),
        { flag: "wx" },
      );
    }
    throw error;
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const { parseArgs } = await import("node:util");
  const { values } = parseArgs({
    options: {
      output: { type: "string" },
      source: { type: "string" },
      baseline: { type: "boolean", default: false },
      "dispatch-control": { type: "boolean", default: false },
    },
  });
  assert.ok(values.output, "--output is required");
  assert.ok(
    !(values.baseline && values["dispatch-control"]),
    "select one causal control",
  );
  console.log(
    json(
      await buildSvelteRuntime({
        output: values.output,
        sourceArchive: values.source,
        mode: values.baseline
          ? "unpatched"
          : values["dispatch-control"]
            ? "dispatch-only"
            : "complete",
      }),
    ),
  );
}
