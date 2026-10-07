import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { cliPackage, write } from "../helpers/cli-package.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";

for (const mapping of ["default", "explicit-dynamic"] as const)
  test(`complete ${mapping} workflows are pure, replayable and sequence equivalent`, () => {
    const fixtures = [cliPackage(), cliPackage()];
    const desiredTrees: ReturnType<typeof snapshotTree>[] = [];
    try {
      const config =
        mapping === "default"
          ? DEFAULT_KIT_CONFIG
          : {
              ...DEFAULT_KIT_CONFIG,
              uiDir: "app/ui",
              stylesDir: "assets/styles",
              layoutFile: "app/routes/+layout.svelte",
            };
      const paths = deriveKitPaths(config);
      for (const fixture of fixtures) {
        const probe = path.join(fixture.base, "executed");
        write(
          fixture.root,
          "node_modules/svelte/package.json",
          JSON.stringify({ name: "svelte", version: "5.57.1" }),
        );
        const manifest = JSON.parse(
          readFileSync(path.join(fixture.root, "package.json"), "utf8"),
        );
        manifest.scripts = {
          postinstall:
            "node -e \"require('fs').writeFileSync(process.env.SUIK_EXECUTION_PROBE,'EXECUTED')\"",
        };
        write(fixture.root, "package.json", JSON.stringify(manifest));
        if (mapping === "explicit-dynamic") {
          write(
            fixture.root,
            paths.stateDir + "/kit.json",
            JSON.stringify(config),
          );
          write(
            fixture.root,
            "svelte.config.js",
            'import { writeFileSync } from "node:fs";\nwriteFileSync(process.env.SUIK_EXECUTION_PROBE, "EXECUTED");\nexport default { kit: { files: { routes: process.env.ROUTES } } };\n',
          );
        }
        for (const manager of ["pnpm", "npm", "yarn", "bun"]) {
          write(
            fixture.base,
            "bin/" + manager,
            '#!/bin/sh\nprintf EXECUTED > "$SUIK_EXECUTION_PROBE"\nexit 97\n',
          );
          chmodSync(path.join(fixture.base, "bin", manager), 0o755);
        }
        const run = (args: readonly string[], pure = true, expected = 0) => {
          const before = snapshotTree(fixture.root);
          const result = spawnSync(
            process.execPath,
            [
              path.join(fixture.pkg, "dist/cli/main.js"),
              ...args,
              "--json",
              "--cwd",
              fixture.root,
            ],
            {
              cwd: fixture.root,
              encoding: "utf8",
              env: {
                ...process.env,
                PATH:
                  path.join(fixture.base, "bin") +
                  path.delimiter +
                  process.env.PATH,
                SUIK_EXECUTION_PROBE: probe,
              },
            },
          );
          assert.equal(result.status, expected, result.stdout + result.stderr);
          assert.equal(result.stderr, "");
          assert.equal(
            existsSync(probe),
            false,
            "no project configuration or package manager execution",
          );
          if (pure) assert.deepEqual(snapshotTree(fixture.root), before);
          return JSON.parse(result.stdout);
        };
        const info = run(["info"]);
        assert.equal(info.data.paths.uiDir, config.uiDir);
        assert.equal(info.data.paths.layoutFile, config.layoutFile);
        run(["view", "card", "--source"]);
        run(["init", "--dry-run"]);
        run(["add", "card", "--dry-run"]);
        run(["sync", "--dry-run"]);
        run(["doctor"]);
        const sequence =
          fixture === fixtures[0]
            ? [["init"], ["add", "card"], ["add", "button"]]
            : [["add", "button"], ["add", "card"], ["init"]];
        for (const args of sequence) run(args, false);
        for (const args of [
          ["info"],
          ["view", "button"],
          ["init"],
          ["add", "card"],
          ["add", "button"],
          ["sync"],
          ["doctor", "--strict"],
          ["init", "--dry-run"],
          ["add", "card", "--dry-run"],
          ["sync", "--dry-run"],
        ])
          run(args);
        desiredTrees.push(snapshotTree(fixture.root));
        write(
          fixture.root,
          config.uiDir + "/button.svelte",
          "<button>LOCAL</button>\n",
        );
        // Local-only drift is preserved; a dropped required export is a genuine
        // integration conflict and cannot create coordination or other effects.
        write(
          fixture.root,
          paths.rootExports,
          "// user barrel without required exports\n",
        );
        run(["add", "card"], true, 10);
        run(["sync"], true, 10);
        run(["add", "card", "--dry-run"], true, 10);
      }
      assert.deepEqual(
        desiredTrees[0],
        desiredTrees[1],
        "successful sequences have identical complete desired state before customization",
      );
      assert.deepEqual(
        snapshotTree(fixtures[0]!.root),
        snapshotTree(fixtures[1]!.root),
        "equivalent explicit request sequences preserve identical complete desired trees",
      );
    } finally {
      for (const fixture of fixtures) fixture.cleanup();
    }
  });
