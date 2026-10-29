import assert from "node:assert/strict";
import {
  constants,
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { prepareNativeArtifacts } from "./prepare-native-artifacts.ts";
import {
  artifactDigest,
  MAINTAINED_NATIVE_FIXTURES,
} from "./native-artifacts.ts";
import { snapshotTree } from "../tests/helpers/tree-snapshot.ts";

const repository = fileURLToPath(new URL("../", import.meta.url));
const bits = JSON.parse(
  readFileSync(
    path.join(repository, "src/project/native-dependency-baseline.json"),
    "utf8",
  ),
);
const svelte = JSON.parse(
  readFileSync(
    path.join(repository, "src/project/svelte-runtime-baseline.json"),
    "utf8",
  ),
);
const clone = (from: string, to: string) =>
  cpSync(from, to, {
    recursive: true,
    verbatimSymlinks: true,
    mode: constants.COPYFILE_FICLONE,
  });

test(
  "both qualified artifacts replay safely and refuse corrupt, foreign, linked or stale delivery state",
  { timeout: 300000 },
  async () => {
    const base = mkdtempSync(
      path.join(os.tmpdir(), "suik-artifact-preparation-"),
    );
    try {
      const author = path.join(base, "author");
      mkdirSync(path.join(author, "src/project"), { recursive: true });
      mkdirSync(path.join(author, "dist/project"), { recursive: true });
      writeFileSync(
        path.join(author, "package.json"),
        JSON.stringify({ name: "svelte-ui-kit", private: true }),
      );
      for (const file of [
        "native-dependency-baseline.json",
        "svelte-runtime-baseline.json",
      ]) {
        cpSync(
          path.join(repository, "src/project", file),
          path.join(author, "src/project", file),
        );
        cpSync(
          path.join(repository, "src/project", file),
          path.join(author, "dist/project", file),
        );
      }
      for (const relative of MAINTAINED_NATIVE_FIXTURES)
        mkdirSync(path.join(author, relative), { recursive: true });
      mkdirSync(path.join(author, ".native-build"));
      clone(
        path.join(repository, ".native-build", bits.version),
        path.join(author, ".native-build", bits.version),
      );
      const first = await prepareNativeArtifacts({
        root: author,
        bundle: true,
        fixture: true,
      });
      assert.equal(first.bits.built, false);
      assert.equal(first.svelte.built, true);
      assert.deepEqual(
        readdirSync(path.join(author, "dist/native")).sort(),
        [bits.archive, svelte.archive].sort(),
      );
      const artifacts = [first.bits, first.svelte];
      const delivered = [];
      for (const [index, artifact] of artifacts.entries()) {
        const profile = [bits, svelte][index];
        for (const file of [
          path.join(author, artifact.archive),
          path.join(author, "dist/native", profile.archive),
          ...MAINTAINED_NATIVE_FIXTURES.map((relative) =>
            path.join(author, relative, artifact.archive),
          ),
        ]) {
          assert.equal(artifactDigest(readFileSync(file)), artifact.sha256);
          delivered.push({
            path: file,
            inode: lstatSync(file).ino,
            mode: lstatSync(file).mode,
            sha256: artifact.sha256,
          });
        }
      }
      const before = snapshotTree(author);
      const replay = await prepareNativeArtifacts({
        root: author,
        bundle: true,
        fixture: true,
      });
      assert.equal(replay.bits.built, false);
      assert.equal(replay.svelte.built, false);
      assert.deepEqual(snapshotTree(author), before);
      for (const file of delivered) {
        assert.equal(lstatSync(file.path).ino, file.inode);
        assert.equal(lstatSync(file.path).mode, file.mode);
        assert.equal(artifactDigest(readFileSync(file.path)), file.sha256);
      }
      const faults = [
        "fixture-mixed-bytes",
        "fixture-late-link",
        "fixture-late-parent-link",
        "cache-bytes",
        "cache-provenance",
        "cache-extra",
        "cache-link",
        "cache-parent-link",
        "report-missing",
        "report-link",
        "fixture-bytes",
        "fixture-link",
        "fixture-parent-link",
        "bundle-extra",
        "bundle-bytes",
        "bundle-link",
        "bundle-parent-link",
        "compiled-bits",
        "compiled-svelte",
      ];
      for (const fault of faults) {
        const owned = path.join(base, fault);
        clone(author, owned);
        const archive = path.join(owned, first.svelte.archive);
        const cache = path.dirname(archive);
        const fixture = path.join(
          owned,
          MAINTAINED_NATIVE_FIXTURES[0]!,
          first.svelte.archive,
        );
        const bundle = path.join(owned, "dist/native", svelte.archive);
        const link = (file: string) => {
          const saved = path.join(owned, "preserved-linked-input");
          clone(file, saved);
          rmSync(file);
          symlinkSync(saved, file);
        };
        if (fault === "fixture-mixed-bytes") {
          rmSync(
            path.join(
              owned,
              MAINTAINED_NATIVE_FIXTURES[0]!,
              first.bits.archive,
            ),
          );
          writeFileSync(fixture, "preserve invalid later artifact");
          rmSync(path.join(owned, "dist/native"), { recursive: true });
        }
        if (
          fault === "fixture-late-link" ||
          fault === "fixture-late-parent-link"
        ) {
          rmSync(
            path.join(owned, MAINTAINED_NATIVE_FIXTURES[0]!, ".native-build"),
            { recursive: true },
          );
          const late = path.join(
            owned,
            MAINTAINED_NATIVE_FIXTURES.at(-1)!,
            first.svelte.archive,
          );
          if (fault === "fixture-late-link") link(late);
          else {
            const directory = path.dirname(late);
            const saved = path.join(owned, "preserved-late-cache");
            clone(directory, saved);
            rmSync(directory, { recursive: true });
            symlinkSync(saved, directory);
          }
          rmSync(path.join(owned, "dist/native"), { recursive: true });
        }
        if (fault === "cache-bytes")
          writeFileSync(archive, "preserve invalid archive");
        if (fault === "cache-provenance")
          writeFileSync(path.join(cache, "provenance.json"), "{}");
        if (fault === "cache-extra")
          writeFileSync(path.join(cache, "foreign.txt"), "preserve");
        if (fault === "cache-link") link(archive);
        if (fault === "cache-parent-link") {
          const from = path.join(owned, ".native-build");
          const to = path.join(owned, "preserved-cache");
          clone(from, to);
          rmSync(from, { recursive: true });
          symlinkSync(to, from);
        }
        if (fault === "report-missing") rmSync(path.join(cache, "report.json"));
        if (fault === "report-link") link(path.join(cache, "report.json"));
        if (fault === "fixture-bytes")
          writeFileSync(fixture, "preserve modified application artifact");
        if (fault === "fixture-link") link(fixture);
        if (fault === "fixture-parent-link") {
          const from = path.join(owned, MAINTAINED_NATIVE_FIXTURES[0]!);
          const to = path.join(owned, "preserved-fixture");
          clone(from, to);
          rmSync(from, { recursive: true });
          symlinkSync(to, from);
        }
        if (fault === "bundle-extra")
          writeFileSync(
            path.join(owned, "dist/native/foreign.txt"),
            "preserve",
          );
        if (fault === "bundle-bytes")
          writeFileSync(bundle, "preserve modified bundled artifact");
        if (fault === "bundle-link") link(bundle);
        if (fault === "bundle-parent-link") {
          const from = path.join(owned, "dist/native");
          const to = path.join(owned, "preserved-bundle");
          clone(from, to);
          rmSync(from, { recursive: true });
          symlinkSync(to, from);
        }
        if (fault.startsWith("compiled-"))
          writeFileSync(
            path.join(
              owned,
              "dist/project",
              fault === "compiled-bits"
                ? "native-dependency-baseline.json"
                : "svelte-runtime-baseline.json",
            ),
            "{}",
          );
        const preimage = snapshotTree(owned);
        await assert.rejects(
          prepareNativeArtifacts({ root: owned, bundle: true, fixture: true }),
          fault,
        );
        assert.deepEqual(snapshotTree(owned), preimage, fault);
      }
      // A report cannot authorize an artifact and its outcome cannot revoke one.
      const diagnostic = path.join(base, "diagnostic-only");
      clone(author, diagnostic);
      writeFileSync(
        path.join(diagnostic, ".native-build", svelte.buildId, "report.json"),
        JSON.stringify({ failure: "diagnostic only" }),
      );
      await prepareNativeArtifacts({
        root: diagnostic,
        bundle: true,
        fixture: true,
      });
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  },
);
