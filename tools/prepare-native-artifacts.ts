#!/usr/bin/env node
/** Typed orchestration of both independently qualified native archives. */
import assert from "node:assert/strict";
import { existsSync, lstatSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSvelteRuntime } from "./build-svelte-runtime.ts";
import { SVELTE_RUNTIME_RECIPE } from "./native-runtime/recipe.ts";
import {
  artifactDigest,
  artifactDirectory,
  copyAuthenticatedArtifact,
  nativeFixtureRoots,
  regularArtifact,
  assertArtifactDestination,
} from "./native-artifacts.ts";

interface PreparationOptions {
  readonly root?: string;
  readonly bundle?: boolean;
  readonly fixture?: boolean;
}
interface PreparedArtifact {
  readonly built: boolean;
  readonly archive: string;
  readonly sha256: string;
  readonly bundled: boolean;
  readonly fixture: boolean;
}
// Preserve the existing synchronous Bits API. The fixed owned module is loaded
// through its URL; this bridge does not load application-selected code.
const legacy: {
  prepareNativeDependency(options?: PreparationOptions): PreparedArtifact;
} = await import(
  new URL("./prepare-native-dependency.mjs", import.meta.url).href
);
const sourceRoot = fileURLToPath(new URL("../", import.meta.url));

export async function prepareNativeArtifacts({
  root = sourceRoot,
  bundle = false,
  fixture = false,
}: PreparationOptions = {}): Promise<{
  readonly bits: PreparedArtifact;
  readonly svelte: PreparedArtifact;
}> {
  const packageRoot = realpathSync(root);
  const bits = legacy.prepareNativeDependency({ root: packageRoot });
  const baselineFile = "src/project/svelte-runtime-baseline.json";
  const expected = JSON.parse(
    regularArtifact(path.join(packageRoot, baselineFile)).toString("utf8"),
  );
  assert.equal(expected.schemaVersion, 1);
  assert.equal(expected.name, "svelte");
  assert.equal(expected.version, SVELTE_RUNTIME_RECIPE.sourceVersion);
  assert.equal(expected.buildId, SVELTE_RUNTIME_RECIPE.buildId);
  assert.match(expected.buildId, /^[A-Za-z0-9][A-Za-z0-9._-]*$/);
  assert.equal(expected.archive, `svelte-${SVELTE_RUNTIME_RECIPE.buildId}.tgz`);
  assert.match(expected.archiveSha256, /^[0-9a-f]{64}$/);
  assert.match(expected.provenanceSha256, /^[0-9a-f]{64}$/);
  const parent = artifactDirectory(packageRoot, ".native-build", true);
  const cache = path.join(parent, expected.buildId);
  let built = false;
  if (!existsSync(cache)) {
    await buildSvelteRuntime({ output: cache, mode: "complete" });
    built = true;
  }
  artifactDirectory(parent, expected.buildId);
  assert.deepEqual(
    readdirSync(cache).sort(),
    [expected.archive, "provenance.json", "report.json"].sort(),
    "only owned Svelte cache entries",
  );
  const bytes = regularArtifact(path.join(cache, expected.archive));
  assert.equal(
    artifactDigest(bytes),
    expected.archiveSha256,
    "qualified cached Svelte archive",
  );
  const provenance = JSON.parse(
    regularArtifact(path.join(cache, "provenance.json")).toString("utf8"),
  );
  assert.equal(provenance.archive, expected.archive);
  assert.equal(provenance.archiveSha256, expected.archiveSha256);
  assert.equal(provenance.buildId, expected.buildId);
  assert.equal(provenance.corrected, true);
  assert.equal(provenance.mode, "complete");
  const inner = { ...provenance };
  delete inner.archive;
  delete inner.archiveSha256;
  assert.equal(
    artifactDigest(Buffer.from(`${JSON.stringify(inner, null, 2)}\n`)),
    expected.provenanceSha256,
    "qualified cached Svelte provenance",
  );
  // A retained report is diagnostic data, never authentication authority.
  regularArtifact(path.join(cache, "report.json"));
  const bitsExpected = JSON.parse(
    regularArtifact(
      path.join(packageRoot, "src/project/native-dependency-baseline.json"),
    ).toString("utf8"),
  );
  const artifacts = [
    {
      bytes: regularArtifact(path.join(packageRoot, bits.archive)),
      baseline: bitsExpected,
      cacheId: bitsExpected.version,
    },
    { bytes, baseline: expected, cacheId: expected.buildId },
  ];
  for (const artifact of artifacts)
    assert.equal(
      artifactDigest(artifact.bytes),
      artifact.baseline.archiveSha256,
    );
  const deliveries: {
    root: string;
    directory: string;
    artifact: (typeof artifacts)[number];
  }[] = [];
  let bundleRoot: string | undefined;
  if (bundle) {
    const dist = realpathSync(path.join(packageRoot, "dist"));
    for (const [name, value] of [
      ["native-dependency-baseline.json", bitsExpected],
      ["svelte-runtime-baseline.json", expected],
    ] as const)
      assert.deepEqual(
        JSON.parse(
          regularArtifact(path.join(dist, "project", name)).toString("utf8"),
        ),
        value,
        "compiled CLI uses the qualified native identity",
      );
    bundleRoot = dist;
    const bundleDestination = path.join(dist, "native");
    const allowed = artifacts.map((artifact) => artifact.baseline.archive);
    if (lstatSync(bundleDestination, { throwIfNoEntry: false }) !== undefined) {
      artifactDirectory(dist, "native");
      assert.ok(
        readdirSync(bundleDestination).every((name) => allowed.includes(name)),
        "foreign bundle entries refuse before delivery",
      );
    }
    for (const artifact of artifacts) {
      deliveries.push({ root: dist, directory: "native", artifact });
    }
  }
  if (fixture)
    for (const consumer of nativeFixtureRoots(packageRoot))
      for (const artifact of artifacts) {
        deliveries.push({
          root: consumer,
          directory: `.native-build/${artifact.cacheId}`,
          artifact,
        });
      }
  // Reject known bad state across the complete delivery set before creating
  // any delivery directory or file. Storage faults after this preflight can
  // still leave a valid subset; matching archives remain safe to replay.
  for (const delivery of deliveries)
    assertArtifactDestination(
      delivery.root,
      `${delivery.directory}/${delivery.artifact.baseline.archive}`,
      delivery.artifact.baseline.archiveSha256,
    );
  for (const delivery of deliveries) {
    const destination = artifactDirectory(
      delivery.root,
      delivery.directory,
      true,
    );
    copyAuthenticatedArtifact(
      delivery.artifact.bytes,
      path.join(destination, delivery.artifact.baseline.archive),
      delivery.artifact.baseline.archiveSha256,
    );
  }
  if (bundleRoot) {
    assert.deepEqual(
      readdirSync(path.join(bundleRoot, "native")).sort(),
      artifacts.map((artifact) => artifact.baseline.archive).sort(),
      "only the two qualified native archives are bundled",
    );
  }
  return {
    bits: { ...bits, bundled: bundle, fixture },
    svelte: {
      built,
      archive: `.native-build/${expected.buildId}/${expected.archive}`,
      sha256: expected.archiveSha256,
      bundled: bundle,
      fixture,
    },
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2);
  assert.ok(
    args.every((arg) => ["--bundle", "--fixture"].includes(arg)) &&
      new Set(args).size === args.length,
    "supported unique options: --bundle --fixture",
  );
  console.log(
    JSON.stringify(
      await prepareNativeArtifacts({
        bundle: args.includes("--bundle"),
        fixture: args.includes("--fixture"),
      }),
      null,
      2,
    ),
  );
}
