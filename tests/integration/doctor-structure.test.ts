import assert from "node:assert/strict";
import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { cliPackage, write } from "../helpers/cli-package.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import {
  writerLockDir,
  transactionDir,
} from "../../src/codegen/transaction-types.js";
for (const scenario of [
  "healthy",
  "missing",
  "metadata",
  "peer",
  "upstream-peer",
  "css",
  "exports",
  "layout",
  "recovery",
  "writer",
] as const)
  test(`actual doctor ${scenario} diagnoses without mutation`, () => {
    const fixture = cliPackage();
    try {
      write(
        fixture.root,
        "node_modules/svelte/package.json",
        JSON.stringify({ name: "svelte", version: "5.57.1" }),
      );
      const installed = fixture.run(["add", "card"]);
      assert.equal(installed.status, 0, installed.stderr + installed.stdout);
      const paths = deriveKitPaths(DEFAULT_KIT_CONFIG);
      if (scenario === "missing")
        rmSync(
          path.join(fixture.root, DEFAULT_KIT_CONFIG.uiDir, "button.svelte"),
        );
      if (scenario === "metadata")
        write(fixture.root, paths.stateDir + "/kit.lock.json", "{bad");
      if (scenario === "peer")
        write(
          fixture.root,
          "node_modules/svelte/package.json",
          JSON.stringify({ name: "svelte", version: "4.0.0" }),
        );
      if (scenario === "css")
        write(
          fixture.root,
          paths.kitCss,
          readFileSync(path.join(fixture.root, paths.kitCss), "utf8").replace(
            "svelte-ui-kit:end button",
            "svelte-ui-kit:end wrong",
          ),
        );
      if (scenario === "exports")
        write(
          fixture.root,
          paths.rootExports,
          readFileSync(
            path.join(fixture.root, paths.rootExports),
            "utf8",
          ).replace(/export \{ default as Button \} from [^;]+;/, ""),
        );
      if (scenario === "layout")
        write(
          fixture.root,
          DEFAULT_KIT_CONFIG.layoutFile,
          "<h1>No children</h1>\n",
        );
      if (scenario === "recovery")
        write(
          fixture.root,
          transactionDir(
            paths.stateDir,
            "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          ) + "/journal.json",
          "{bad",
        );
      if (scenario === "writer")
        write(
          fixture.root,
          writerLockDir(paths.stateDir) + "/owner.json",
          "{bad",
        );
      if (scenario === "upstream-peer") {
        const manifest = JSON.parse(
          readFileSync(path.join(fixture.root, "package.json"), "utf8"),
        );
        write(
          fixture.root,
          "package.json",
          JSON.stringify({
            ...manifest,
            dependencies: {
              ...manifest.dependencies,
              "bits-ui": "2.19.3",
              "@internationalized/date": "3.12.4",
            },
          }),
        );
        write(
          fixture.root,
          "node_modules/bits-ui/package.json",
          JSON.stringify({
            name: "bits-ui",
            version: "2.19.3",
            peerDependencies: { svelte: "^6.0.0" },
          }),
        );
        write(
          fixture.root,
          "node_modules/@internationalized/date/package.json",
          JSON.stringify({
            name: "@internationalized/date",
            version: "3.12.4",
          }),
        );
      }
      const before = snapshotTree(fixture.root);
      for (const strict of [false, true]) {
        const result = fixture.run(["doctor", ...(strict ? ["--strict"] : [])]);
        assert.equal(result.stderr, "");
        const envelope = JSON.parse(result.stdout);
        assert.equal(envelope.command, "doctor");
        assert.deepEqual(envelope.changes, []);
        assert.equal(envelope.data.ready, scenario === "healthy");
        assert.equal(
          result.status,
          scenario === "healthy" || !strict ? 0 : 3,
          result.stdout,
        );
        if (scenario !== "healthy") assert.ok(envelope.diagnostics.length > 0);
        else
          assert.ok(
            envelope.data.checks.every(
              (check: { status: string }) => check.status === "healthy",
            ),
          );
        if (scenario === "upstream-peer")
          assert.ok(
            envelope.diagnostics.some((entry: { code: string }) =>
              entry.code.startsWith("PEER_"),
            ),
          );
        assert.equal(result.stdout.includes(fixture.base), false);
        assert.deepEqual(snapshotTree(fixture.root), before);
      }
    } finally {
      fixture.cleanup();
    }
  });
