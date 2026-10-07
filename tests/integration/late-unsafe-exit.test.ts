import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readlinkSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { cliPackage, write } from "../helpers/cli-package.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";

// Change only an owned filesystem input after genuine planning/revalidation.
// No planner/applier result is replaced and no product fault flag is introduced.
const lateHook = `import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
const original = fs.lstatSync;
let injected = false;
fs.lstatSync = function(target, ...args) {
  if (!injected && String(target) === process.env.SUIK_TEST_STYLES && new Error().stack.includes("verifySameFilesystem")) {
    injected = true;
    fs.symlinkSync(process.env.SUIK_TEST_OUTSIDE, target);
    fs.writeFileSync(process.env.SUIK_TEST_MARKER, "injected");
  }
  return original.call(this, target, ...args);
};
syncBuiltinESMExports();\n`;
for (const custom of [false, true])
  for (const command of ["init", "add"] as const)
    test(`actual ${command} ${custom ? "custom" : "default"} late unsafe apply refusal keeps exit11 and has no semantic effects`, () => {
      const fixture = cliPackage();
      try {
        const config = custom
          ? {
              ...DEFAULT_KIT_CONFIG,
              uiDir: "app/ui",
              stylesDir: "assets/styles",
            }
          : DEFAULT_KIT_CONFIG;
        if (custom)
          write(
            fixture.root,
            deriveKitPaths(config).stateDir + "/kit.json",
            JSON.stringify(config),
          );
        write(
          fixture.root,
          "node_modules/svelte/package.json",
          JSON.stringify({ name: "svelte", version: "5.57.1" }),
        );
        const outside = path.join(fixture.base, "outside"),
          marker = path.join(fixture.base, "injected");
        mkdirSync(outside);
        mkdirSync(path.dirname(path.join(fixture.root, config.stylesDir)), {
          recursive: true,
        });
        write(fixture.base, "late-fs.mjs", lateHook);
        const before = snapshotTree(fixture.root),
          outsideBefore = snapshotTree(outside);
        const result = spawnSync(
          process.execPath,
          [
            "--import",
            path.join(fixture.base, "late-fs.mjs"),
            path.join(fixture.pkg, "dist/cli/main.js"),
            command,
            ...(command === "add" ? ["card"] : []),
            "--json",
            "--cwd",
            fixture.root,
          ],
          {
            cwd: fixture.root,
            encoding: "utf8",
            timeout: 30_000,
            env: {
              ...process.env,
              SUIK_TEST_STYLES: path.join(fixture.root, config.stylesDir),
              SUIK_TEST_OUTSIDE: outside,
              SUIK_TEST_MARKER: marker,
            },
          },
        );
        assert.equal(
          existsSync(marker),
          true,
          "the substitution occurred at the guarded physical boundary",
        );
        assert.equal(readFileSync(marker, "utf8"), "injected");
        assert.equal(result.stderr, "");
        const envelope = JSON.parse(result.stdout);
        assert.equal(envelope.status, "error");
        assert.deepEqual(envelope.changes, []);
        assert.ok(
          envelope.diagnostics.some(
            (entry: { code: string }) =>
              entry.code === "AUTHORITY_ANCESTOR_UNSAFE",
          ),
        );
        assert.equal(
          readlinkSync(path.join(fixture.root, config.stylesDir)),
          outside,
        );
        // The injected symlink is the sole input change; no generated targets,
        // coordination, journal, manifests or outside content may remain changed.
        assert.deepEqual(
          snapshotTree(fixture.root).filter(
            (entry) => entry.path !== config.stylesDir,
          ),
          before,
        );
        assert.deepEqual(snapshotTree(outside), outsideBefore);
        assert.equal(result.status, 11, result.stdout);
      } finally {
        fixture.cleanup();
      }
    });
