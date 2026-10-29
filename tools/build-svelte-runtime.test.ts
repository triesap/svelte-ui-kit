import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync, symlinkSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { gzipSync, gunzipSync } from "node:zlib";
import { buildSvelteRuntime } from "./build-svelte-runtime.ts";
import { readPackedFiles } from "./native-runtime/archive.ts";
import { SVELTE_RUNTIME_RECIPE as recipe } from "./native-runtime/recipe.ts";

const digest = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

test(
  "authentic runtime producer repeats bytes and preserves the unpatched causal control",
  { timeout: 120000 },
  async () => {
    const root = mkdtempSync(
      path.join(os.tmpdir(), "suik-svelte-reproduction-"),
    );
    const source = path.join(root, "upstream.tgz");
    const response = await fetch(recipe.sourceUrl, {
      redirect: "error",
      signal: AbortSignal.timeout(30000),
    });
    assert.equal(response.status, 200);
    const upstream = Buffer.from(await response.arrayBuffer());
    assert.equal(digest(upstream), recipe.sourceSha256);
    writeFileSync(source, upstream);
    const original = readPackedFiles(upstream);
    const builds = [];
    for (const name of ["first", "repeat", "control", "dispatch-control"]) {
      const output = path.join(root, name);
      const result = await buildSvelteRuntime({
        output,
        sourceArchive: source,
        mode:
          name === "control"
            ? "unpatched"
            : name === "dispatch-control"
              ? "dispatch-only"
              : "complete",
      });
      const bytes = readFileSync(path.join(output, result.archive));
      const files = readPackedFiles(bytes);
      const provenance = JSON.parse(
        files.get("NATIVE_PROVENANCE.json")!.bytes.toString(),
      );
      assert.equal(digest(bytes), result.sha256);
      assert.equal(
        digest(files.get("NATIVE_PROVENANCE.json")!.bytes),
        result.provenanceSha256,
      );
      assert.deepEqual(
        [...files.keys()].sort(),
        [...original.keys(), "NATIVE_PROVENANCE.json"].sort(),
      );
      assert.deepEqual(
        files.get("compiler/index.js"),
        original.get("compiler/index.js"),
      );
      assert.deepEqual(files.get("LICENSE.md"), original.get("LICENSE.md"));
      assert.equal(provenance.compiler.rebuilt, false);
      assert.equal(provenance.corrected, name === "first" || name === "repeat");
      const manifest = JSON.parse(files.get("package.json")!.bytes.toString());
      assert.equal(manifest.version, recipe.sourceVersion);
      assert.equal(
        manifest.svelteUiKitNative.buildId,
        name === "control"
          ? recipe.controlId
          : name === "dispatch-control"
            ? recipe.dispatchControlId
            : recipe.buildId,
      );
      for (const file of provenance.distributionFiles)
        assert.equal(
          digest(files.get(file.path)!.bytes),
          file.sha256,
          file.path,
        );
      builds.push({ bytes, files, result });
    }
    assert.deepEqual(
      builds[0].bytes,
      builds[1].bytes,
      "independent actual pnpm packs reproduce bytes",
    );
    assert.notEqual(builds[0].result.sha256, builds[2].result.sha256);
    const corrected = [
      "src/internal/client/dom/elements/misc.js",
      "src/internal/client/dom/elements/bindings/shared.js",
      "src/internal/client/dom/elements/bindings/input.js",
    ];
    for (const [logical, file] of original) {
      if (logical === "package.json") continue;
      assert.deepEqual(
        builds[2].files.get(logical),
        file,
        `unmodified control ${logical}`,
      );
      if (corrected.includes(logical))
        assert.notDeepEqual(
          builds[0].files.get(logical),
          file,
          `real upstream correction ${logical}`,
        );
      else
        assert.deepEqual(
          builds[0].files.get(logical),
          file,
          `untouched runtime/compiler/types ${logical}`,
        );
      if (corrected.slice(0, 2).includes(logical))
        assert.deepEqual(
          builds[3].files.get(logical),
          builds[0].files.get(logical),
          `dispatch-only correction ${logical}`,
        );
      else
        assert.deepEqual(
          builds[3].files.get(logical),
          file,
          `group control original ${logical}`,
        );
    }
    const corrupt = path.join(root, "corrupt.tgz");
    const tampered = Buffer.from(upstream);
    tampered[tampered.length - 1] ^= 1;
    writeFileSync(corrupt, tampered);
    await assert.rejects(
      buildSvelteRuntime({
        output: path.join(root, "corrupt-output"),
        sourceArchive: corrupt,
      }),
      /authenticated upstream archive/,
    );
    const marker = path.join(root, "first", "marker");
    writeFileSync(marker, "preserve existing output");
    await assert.rejects(
      buildSvelteRuntime({
        output: path.join(root, "first"),
        sourceArchive: source,
      }),
      /output must be absent/,
    );
    assert.equal(readFileSync(marker, "utf8"), "preserve existing output");
    const link = path.join(root, "linked-source.tgz");
    symlinkSync(source, link);
    await assert.rejects(
      buildSvelteRuntime({
        output: path.join(root, "linked-output"),
        sourceArchive: link,
      }),
      /regular source archive/,
    );
    const linkedParent = path.join(root, "linked-parent");
    symlinkSync(path.join(root, "first"), linkedParent);
    await assert.rejects(
      buildSvelteRuntime({
        output: path.join(linkedParent, "new"),
        sourceArchive: source,
      }),
      /regular output ancestry/,
    );
    const invalidTar = gunzipSync(upstream);
    invalidTar[0] ^= 1;
    assert.throws(
      () => readPackedFiles(gzipSync(invalidTar)),
      /genuine tar checksum/,
    );
    assert.throws(() =>
      readPackedFiles(upstream.subarray(0, upstream.length - 1)),
    );
    console.log(
      JSON.stringify({ root, outputs: builds.map((build) => build.result) }),
    );
  },
);
