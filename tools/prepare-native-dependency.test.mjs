import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
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
import { prepareNativeDependency } from "./prepare-native-dependency.mjs";
import { nativeDigest, NATIVE_RECIPE } from "./build-native-dependency.mjs";

const repository = fileURLToPath(new URL("../", import.meta.url));
function project(parent, name) {
  const root = path.join(parent, name);
  mkdirSync(path.join(root, "src/project"), { recursive: true });
  cpSync(
    path.join(repository, "src/project/native-dependency-baseline.json"),
    path.join(root, "src/project/native-dependency-baseline.json"),
  );
  writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({ name: "svelte-ui-kit", private: true }),
  );
  return root;
}

test(
  "preparation uses a real qualified archive, replays unchanged and refuses corrupt or linked artifact state",
  { timeout: 300_000 },
  () => {
    const root = mkdtempSync(
      path.join(os.tmpdir(), "suik-native-preparation-"),
    );
    try {
      const author = project(root, "author");
      mkdirSync(path.join(author, "dist/project"), { recursive: true });
      // This tests the artifact copy boundary; actual compiler/tarball ownership
      // is exercised by the independent installed-package suite.
      cpSync(
        path.join(author, "src/project/native-dependency-baseline.json"),
        path.join(author, "dist/project/native-dependency-baseline.json"),
      );
      mkdirSync(path.join(author, "tests/fixtures/consumer"), {
        recursive: true,
      });
      const prepared = prepareNativeDependency({
        root: author,
        bundle: true,
        fixture: true,
      });
      assert.equal(prepared.built, true);
      assert.equal(prepared.bundled, true);
      assert.equal(prepared.fixture, true);
      const cached = path.join(author, prepared.archive);
      const bundled = path.join(
        author,
        "dist/native",
        NATIVE_RECIPE.native.archive,
      );
      const appOwned = path.join(
        author,
        "tests/fixtures/consumer",
        prepared.archive,
      );
      assert.equal(nativeDigest(readFileSync(cached)), prepared.sha256);
      assert.deepEqual(readFileSync(bundled), readFileSync(cached));
      assert.deepEqual(readFileSync(appOwned), readFileSync(cached));
      const before = [cached, bundled, appOwned].map((file) => ({
        bytes: readFileSync(file),
        inode: lstatSync(file).ino,
        mode: lstatSync(file).mode,
      }));
      const replay = prepareNativeDependency({
        root: author,
        bundle: true,
        fixture: true,
      });
      assert.equal(replay.built, false);
      assert.deepEqual(
        [cached, bundled, appOwned].map((file) => ({
          bytes: readFileSync(file),
          inode: lstatSync(file).ino,
          mode: lstatSync(file).mode,
        })),
        before,
      );
      // Retain the application-owned copy after both CLI staging and producer
      // cache are gone. No live source path is a dependency of its bytes.
      rmSync(path.join(author, "dist"), { recursive: true });
      assert.equal(nativeDigest(readFileSync(appOwned)), prepared.sha256);
      const pristine = path.join(root, "pristine");
      cpSync(author, pristine, { recursive: true, verbatimSymlinks: true });
      for (const fault of [
        "cache-bytes",
        "cache-metadata",
        "cache-extra",
        "cache-link",
        "cache-parent-link",
        "fixture-bytes",
        "fixture-link",
      ]) {
        const owned = path.join(root, fault);
        cpSync(pristine, owned, { recursive: true, verbatimSymlinks: true });
        const archive = path.join(owned, prepared.archive);
        const cache = path.dirname(archive);
        if (fault === "cache-bytes") writeFileSync(archive, "changed archive");
        if (fault === "cache-metadata")
          writeFileSync(path.join(cache, "provenance.json"), "{}");
        if (fault === "cache-extra")
          writeFileSync(path.join(cache, "unrelated.txt"), "preserve");
        if (fault === "cache-link") {
          const original = `${archive}.original`;
          cpSync(archive, original);
          rmSync(archive);
          symlinkSync(original, archive);
        }
        if (fault === "cache-parent-link") {
          const moved = path.join(owned, "preserved-cache");
          cpSync(path.join(owned, ".native-build"), moved, { recursive: true });
          rmSync(path.join(owned, ".native-build"), { recursive: true });
          symlinkSync(moved, path.join(owned, ".native-build"));
        }
        const fixtureArchive = path.join(
          owned,
          "tests/fixtures/consumer",
          prepared.archive,
        );
        if (fault === "fixture-bytes")
          writeFileSync(fixtureArchive, "preserve modified app archive");
        if (fault === "fixture-link") {
          const original = `${fixtureArchive}.original`;
          cpSync(fixtureArchive, original);
          rmSync(fixtureArchive);
          symlinkSync(original, fixtureArchive);
        }
        assert.throws(
          () => prepareNativeDependency({ root: owned, fixture: true }),
          undefined,
          fault,
        );
        if (fault === "fixture-bytes")
          assert.equal(
            readFileSync(fixtureArchive, "utf8"),
            "preserve modified app archive",
          );
        if (fault === "cache-bytes")
          assert.equal(readFileSync(archive, "utf8"), "changed archive");
        if (fault === "cache-extra")
          assert.equal(
            readFileSync(path.join(cache, "unrelated.txt"), "utf8"),
            "preserve",
          );
      }
      rmSync(path.join(author, ".native-build"), { recursive: true });
      assert.ok(existsSync(appOwned));
      assert.equal(nativeDigest(readFileSync(appOwned)), prepared.sha256);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
);

test(
  "actual compiled CLI tarball delivers an app-owned native install after author and CLI removal",
  { timeout: 300_000 },
  () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "suik-native-delivery-"));
    const env = { ...process.env, npm_config_verify_deps_before_run: "false" };
    for (const name of [
      "NODE_OPTIONS",
      "NODE_TEST_CONTEXT",
      "NODE_V8_COVERAGE",
    ])
      delete env[name];
    function run(command, args, cwd, binary = false) {
      const result = spawnSync(command, args, {
        cwd,
        env,
        encoding: binary ? undefined : "utf8",
        timeout: 240_000,
        maxBuffer: 64 * 1024 * 1024,
      });
      assert.equal(result.error, undefined);
      assert.equal(result.signal, null);
      assert.equal(
        result.status,
        0,
        `${command}: ${result.stdout}\n${result.stderr}`,
      );
      return result.stdout;
    }
    try {
      const author = path.join(root, "author");
      mkdirSync(author);
      for (const name of [
        "src",
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
        cpSync(path.join(repository, name), path.join(author, name), {
          recursive: true,
        });
      symlinkSync(
        path.join(repository, "node_modules"),
        path.join(author, "node_modules"),
      );
      run(
        process.execPath,
        [
          path.join(repository, "node_modules/typescript/bin/tsc"),
          "-p",
          "tsconfig.json",
        ],
        author,
      );
      const prepared = prepareNativeDependency({ root: author, bundle: true });
      rmSync(path.join(author, "node_modules"));
      const archives = path.join(root, "archives");
      mkdirSync(archives);
      run("pnpm", ["pack", "--json", "--pack-destination", archives], author);
      const entries = readdirSync(archives);
      assert.equal(entries.length, 1);
      assert.match(entries[0], /\.tgz$/);
      const archive = path.join(archives, entries[0]);
      const member = `package/dist/native/${NATIVE_RECIPE.native.archive}`;
      const delivered = run("tar", ["-xOf", archive, member], root, true);
      assert.equal(nativeDigest(delivered), prepared.sha256);
      const app = path.join(root, "application");
      mkdirSync(path.join(app, "vendor"), { recursive: true });
      writeFileSync(
        path.join(app, "vendor", NATIVE_RECIPE.native.archive),
        delivered,
      );
      writeFileSync(
        path.join(app, "package.json"),
        JSON.stringify({
          private: true,
          type: "module",
          packageManager: "pnpm@11.22.0",
          dependencies: {
            "bits-ui": `file:./vendor/${NATIVE_RECIPE.native.archive}`,
            svelte: "5.57.1",
            "@internationalized/date": "3.12.4",
          },
          devDependencies: {
            csstype: "3.1.3",
            "@types/node": "24.19.0",
            "svelte-check": "4.7.6",
          },
        }),
      );
      rmSync(author, { recursive: true });
      rmSync(archives, { recursive: true });
      assert.equal(existsSync(author), false);
      assert.equal(existsSync(archive), false);
      run(
        "pnpm",
        [
          "install",
          "--offline",
          "--ignore-scripts",
          "--strict-peer-dependencies",
          "--engine-strict",
        ],
        app,
      );
      const installed = JSON.parse(
        readFileSync(
          path.join(app, "node_modules/bits-ui/package.json"),
          "utf8",
        ),
      );
      assert.equal(installed.name, "bits-ui");
      assert.equal(installed.version, NATIVE_RECIPE.native.buildVersion);
      writeFileSync(
        path.join(app, "probe.ts"),
        'import { Button, Calendar } from "bits-ui";\nexport const publicRoots = [Button.Root, Calendar.Root];\n',
      );
      run(
        process.execPath,
        [
          path.join(repository, "node_modules/typescript/bin/tsc"),
          "--noEmit",
          "--strict",
          "--skipLibCheck",
          "false",
          "--module",
          "NodeNext",
          "--moduleResolution",
          "NodeNext",
          "--target",
          "ES2023",
          "--types",
          "node",
          "probe.ts",
          "node_modules/svelte-check/dist/src/svelte-shims-v4.d.ts",
        ],
        app,
      );
      rmSync(path.join(app, "node_modules"), { recursive: true });
      run(
        "pnpm",
        [
          "install",
          "--offline",
          "--frozen-lockfile",
          "--ignore-scripts",
          "--strict-peer-dependencies",
          "--engine-strict",
        ],
        app,
      );
      assert.equal(
        nativeDigest(
          readFileSync(path.join(app, "vendor", NATIVE_RECIPE.native.archive)),
        ),
        prepared.sha256,
      );
      run(
        process.execPath,
        [
          path.join(repository, "node_modules/typescript/bin/tsc"),
          "--noEmit",
          "--strict",
          "--skipLibCheck",
          "false",
          "--module",
          "NodeNext",
          "--moduleResolution",
          "NodeNext",
          "--target",
          "ES2023",
          "--types",
          "node",
          "probe.ts",
          "node_modules/svelte-check/dist/src/svelte-shims-v4.d.ts",
        ],
        app,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
);
