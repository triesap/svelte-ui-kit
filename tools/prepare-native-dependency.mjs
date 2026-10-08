#!/usr/bin/env node
/** Developer artifact preparation. The installed CLI never invokes this tool. */
import assert from "node:assert/strict";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildNativeDependency,
  nativeDigest,
  NATIVE_RECIPE,
} from "./build-native-dependency.mjs";

const sourceRoot = fileURLToPath(new URL("../", import.meta.url));
function regular(file) {
  const entry = lstatSync(file);
  assert.ok(
    entry.isFile() && !entry.isSymbolicLink(),
    "regular artifact file required",
  );
  return readFileSync(file);
}
function safeAncestry(root, logical, create = false) {
  let current = root;
  for (const segment of logical.split("/")) {
    current = path.join(current, segment);
    if (!existsSync(current) && create) mkdirSync(current);
    const entry = lstatSync(current);
    assert.ok(
      entry.isDirectory() && !entry.isSymbolicLink(),
      "regular artifact directory required",
    );
  }
  return current;
}
function copyAuthenticated(bytes, target, expected) {
  assert.equal(nativeDigest(bytes), expected, "authenticated artifact bytes");
  if (existsSync(target))
    assert.equal(
      nativeDigest(regular(target)),
      expected,
      "existing artifact must match; refusing overwrite",
    );
  else writeFileSync(target, bytes, { flag: "wx", mode: 0o644 });
}

export function prepareNativeDependency({
  root = sourceRoot,
  bundle = false,
  fixture = false,
} = {}) {
  const packageRoot = realpathSync(root);
  const manifest = JSON.parse(
    regular(path.join(packageRoot, "package.json")).toString("utf8"),
  );
  assert.equal(manifest.name, "svelte-ui-kit", "authoring package identity");
  const expected = JSON.parse(
    regular(
      path.join(packageRoot, "src/project/native-dependency-baseline.json"),
    ).toString("utf8"),
  );
  assert.equal(expected.schemaVersion, 1, "native identity version");
  assert.equal(expected.name, "bits-ui");
  assert.equal(expected.version, NATIVE_RECIPE.native.buildVersion);
  assert.equal(expected.archive, NATIVE_RECIPE.native.archive);
  assert.match(
    expected.version,
    /^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/,
    "portable build-version directory",
  );
  assert.match(
    expected.archive,
    /^[A-Za-z0-9._-]+\.tgz$/,
    "portable archive basename",
  );
  assert.match(expected.archiveSha256, /^[0-9a-f]{64}$/);
  assert.match(expected.provenanceSha256, /^[0-9a-f]{64}$/);
  const parent = safeAncestry(packageRoot, ".native-build", true);
  const cache = path.join(parent, expected.version);
  let built = false;
  if (!existsSync(cache)) {
    buildNativeDependency({ output: cache });
    built = true;
  }
  safeAncestry(parent, expected.version);
  assert.deepEqual(
    readdirSync(cache).sort(),
    [expected.archive, "provenance.json"].sort(),
    "only owned cache entries",
  );
  const bytes = regular(path.join(cache, expected.archive));
  assert.equal(
    nativeDigest(bytes),
    expected.archiveSha256,
    "qualified cached archive",
  );
  const provenance = JSON.parse(
    regular(path.join(cache, "provenance.json")).toString("utf8"),
  );
  assert.equal(provenance.archive, expected.archive);
  assert.equal(provenance.archiveSha256, expected.archiveSha256);
  const inner = { ...provenance };
  delete inner.archive;
  delete inner.archiveSha256;
  assert.equal(
    nativeDigest(Buffer.from(`${JSON.stringify(inner, null, 2)}\n`)),
    expected.provenanceSha256,
    "qualified cached provenance",
  );
  const prepared = {
    built,
    archive: `.native-build/${expected.version}/${expected.archive}`,
    sha256: expected.archiveSha256,
    bundled: false,
    fixture: false,
  };
  if (fixture) {
    const consumer = safeAncestry(packageRoot, "tests/fixtures/consumer");
    const destination = safeAncestry(
      consumer,
      `.native-build/${expected.version}`,
      true,
    );
    copyAuthenticated(
      bytes,
      path.join(destination, expected.archive),
      expected.archiveSha256,
    );
    prepared.fixture = true;
  }
  if (bundle) {
    // The existing compiler output may use the operator's build-output router.
    // Canonicalize that declared output once; internal native paths stay real.
    const dist = realpathSync(path.join(packageRoot, "dist"));
    const compiled = regular(
      path.join(dist, "project/native-dependency-baseline.json"),
    );
    assert.deepEqual(
      JSON.parse(compiled.toString("utf8")),
      expected,
      "compiled CLI uses the same native identity",
    );
    const destination = safeAncestry(dist, "native", true);
    copyAuthenticated(
      bytes,
      path.join(destination, expected.archive),
      expected.archiveSha256,
    );
    assert.deepEqual(
      readdirSync(destination),
      [expected.archive],
      "only the selected native archive is bundled",
    );
    prepared.bundled = true;
  }
  return prepared;
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
      prepareNativeDependency({
        bundle: args.includes("--bundle"),
        fixture: args.includes("--fixture"),
      }),
      null,
      2,
    ),
  );
}
