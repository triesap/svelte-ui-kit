import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, rmSync, symlinkSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { cliPackage, write } from "../helpers/cli-package.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
for (const custom of [false, true])
  for (const scenario of [
    "source",
    "typescript-valid",
    "typescript-class",
    "css",
    "source-invalid",
    "typescript-export",
    "css-invalid",
    "missing",
    "unsafe",
  ] as const)
    test(`strict doctor ${custom ? "custom" : "default"} ${scenario} distinguishes customization from breakage`, () => {
      const fixture = cliPackage();
      try {
        const config = custom
          ? {
              ...DEFAULT_KIT_CONFIG,
              uiDir: "app/ui",
              stylesDir: "assets/styles",
            }
          : DEFAULT_KIT_CONFIG;
        const paths = deriveKitPaths(config);
        if (custom)
          write(
            fixture.root,
            paths.stateDir + "/kit.json",
            JSON.stringify(config),
          );
        write(
          fixture.root,
          "node_modules/svelte/package.json",
          JSON.stringify({ name: "svelte", version: "5.57.1" }),
        );
        const added = fixture.run(["add", "card"]);
        assert.equal(added.status, 0, added.stderr + added.stdout);
        const card = config.uiDir + "/card.svelte";
        if (scenario === "source")
          write(fixture.root, card, "<div class='card'>LOCAL_VALID</div>\n");
        if (scenario === "css")
          write(
            fixture.root,
            paths.kitCss,
            readFileSync(path.join(fixture.root, paths.kitCss), "utf8").replace(
              ".card {}",
              '.card { color: rebeccapurple; content: "</style>"; }',
            ),
          );
        if (scenario === "typescript-valid")
          write(
            fixture.root,
            config.uiDir + "/card.types.ts",
            "interface Local {}\nexport { Local as CardProps };\n",
          );
        if (scenario === "typescript-class")
          write(
            fixture.root,
            config.uiDir + "/card.types.ts",
            "export class CardProps {}\n",
          );
        if (scenario === "source-invalid") write(fixture.root, card, "<div");
        if (scenario === "typescript-export")
          write(
            fixture.root,
            config.uiDir + "/card.types.ts",
            "export interface WrongProps {}\n",
          );
        if (scenario === "css-invalid")
          write(
            fixture.root,
            paths.kitCss,
            readFileSync(path.join(fixture.root, paths.kitCss), "utf8").replace(
              ".card {}",
              ".card { color:",
            ),
          );
        if (scenario === "missing") rmSync(path.join(fixture.root, card));
        if (scenario === "unsafe") {
          rmSync(path.join(fixture.root, card));
          symlinkSync(
            path.join(fixture.pkg, "registry/templates/card.svelte"),
            path.join(fixture.root, card),
          );
        }
        const before = snapshotTree(fixture.root);
        const valid =
          scenario === "source" ||
          scenario === "css" ||
          scenario === "typescript-valid" ||
          scenario === "typescript-class";
        const json = fixture.run(["doctor", "--strict"]);
        assert.equal(json.status, valid ? 0 : 3, json.stderr + json.stdout);
        const envelope = JSON.parse(json.stdout);
        assert.equal(envelope.data.ready, valid);
        assert.equal(envelope.status, valid ? "warning" : "error");
        assert.ok(
          envelope.data.checks.some(
            (check: { status: string }) =>
              check.status ===
              (valid
                ? "customized"
                : scenario === "unsafe"
                  ? "unsafe"
                  : "broken"),
          ),
        );
        const human = spawnSync(
          process.execPath,
          [
            path.join(fixture.pkg, "dist/cli/main.js"),
            "doctor",
            "--strict",
            "--cwd",
            fixture.root,
          ],
          { cwd: fixture.root, encoding: "utf8" },
        );
        assert.equal(human.status, json.status);
        if (!valid) {
          assert.equal(human.stdout, "");
          assert.ok(human.stderr.length > 0);
        } else {
          assert.ok(human.stdout.length > 0);
          assert.equal(human.stderr, "");
        }
        assert.deepEqual(snapshotTree(fixture.root), before);
      } finally {
        fixture.cleanup();
      }
    });
