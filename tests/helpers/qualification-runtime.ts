/** Producer qualification installs into a new owned host, never a package store. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  linkedFixtureEnvironment,
  verifyFixtureManager,
} from "./package-manager.js";
import type { SvelteRuntimeMode } from "../../tools/native-runtime/recipe.js";

export interface QualificationRuntime {
  readonly archive: string;
  readonly sha256: string;
  readonly provenanceSha256: string;
  readonly buildId: string;
}
const digest = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

export function qualificationRuntimeMode(): SvelteRuntimeMode {
  const mode = process.env["SUIK_RESET_CAUSAL_CONTROL"];
  if (mode === undefined || mode === "") return "complete";
  if (mode === "unpatched" || mode === "dispatch-only") return mode;
  throw new Error("Unknown native runtime causal control");
}

export function buildQualificationRuntime(
  mode: SvelteRuntimeMode = "complete",
): QualificationRuntime {
  const output = path.join(
    mkdtempSync(path.join(os.tmpdir(), "suik-reset-runtime-")),
    mode,
  );
  const result = spawnSync(
    process.execPath,
    [
      "tools/build-svelte-runtime.ts",
      "--output",
      output,
      ...(mode === "unpatched"
        ? ["--baseline"]
        : mode === "dispatch-only"
          ? ["--dispatch-control"]
          : []),
    ],
    { encoding: "utf8", timeout: 120000 },
  );
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const built = JSON.parse(result.stdout);
  const provenance = JSON.parse(
    readFileSync(path.join(output, "provenance.json"), "utf8"),
  );
  return {
    archive: path.join(output, built.archive),
    sha256: built.sha256,
    provenanceSha256: built.provenanceSha256,
    buildId: provenance.buildId,
  };
}

/**
 * The CLI has generated the actual application sources before this native
 * producer lane installs the candidate. Normal CLI adoption/authentication is
 * a separate contract; this helper makes no readiness claim for a new runtime.
 */
export function installQualificationRuntime(
  root: string,
  runtime: QualificationRuntime,
): void {
  assert.ok(
    lstatSync(runtime.archive).isFile() &&
      !lstatSync(runtime.archive).isSymbolicLink(),
  );
  const bytes = readFileSync(runtime.archive);
  assert.equal(digest(bytes), runtime.sha256, "actual producer archive");
  const directory = path.join(root, ".native-build", "svelte-runtime");
  mkdirSync(directory, { recursive: true });
  const archive = path.join(directory, path.basename(runtime.archive));
  writeFileSync(archive, bytes, { flag: "wx" });
  const manifestPath = path.join(root, "package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.dependencies.svelte = `file:./.native-build/svelte-runtime/${path.basename(archive)}`;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  // Remove only this owned host's linked dependency tree. The package manager
  // creates a fresh installation; no installed file or store entry is patched.
  const modules = path.join(root, "node_modules");
  assert.ok(
    lstatSync(modules).isDirectory() && !lstatSync(modules).isSymbolicLink(),
  );
  rmSync(modules, { recursive: true });
  const env = linkedFixtureEnvironment();
  verifyFixtureManager("pnpm", [], root, env);
  for (const frozen of [false, true]) {
    const result = spawnSync(
      "pnpm",
      [
        "install",
        "--strict-peer-dependencies",
        "--engine-strict",
        ...(frozen ? ["--frozen-lockfile"] : []),
      ],
      {
        cwd: root,
        env,
        encoding: "utf8",
        timeout: 180000,
        maxBuffer: 8 * 1024 * 1024,
      },
    );
    assert.equal(result.error, undefined);
    assert.equal(result.signal, null);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  const installed = realpathSync(path.join(modules, "svelte"));
  const installedManifest = JSON.parse(
    readFileSync(path.join(installed, "package.json"), "utf8"),
  );
  assert.equal(installedManifest.svelteUiKitNative.buildId, runtime.buildId);
  const provenanceBytes = readFileSync(
    path.join(installed, "NATIVE_PROVENANCE.json"),
  );
  assert.equal(digest(provenanceBytes), runtime.provenanceSha256);
  const provenance = JSON.parse(provenanceBytes.toString());
  for (const file of provenance.distributionFiles) {
    assert.ok(
      typeof file.path === "string" &&
        !file.path
          .split("/")
          .some(
            (segment: string) =>
              !segment || segment === "." || segment === "..",
          ) &&
        !file.path.includes("\\"),
    );
    const target = path.join(installed, file.path);
    assert.ok(
      lstatSync(target).isFile() && !lstatSync(target).isSymbolicLink(),
    );
    assert.equal(
      digest(readFileSync(target)),
      file.sha256,
      `actual installed native file ${file.path}`,
    );
  }
  assert.equal(
    digest(readFileSync(path.join(installed, "compiler/index.js"))),
    provenance.compiler.sha256,
  );
}
