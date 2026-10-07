import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { compoundRegistry } from "../helpers/multi-item-fixture.js";
import { cliPackage, write } from "../helpers/cli-package.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

for (const custom of [false, true])
  for (const scenario of [
    "update",
    "local-only",
    "conflict",
    "clean-retire",
    "custom-retire",
    "custom-css-retire",
    "metadata",
  ] as const)
    test(`actual sync ${custom ? "custom" : "default"} ${scenario} preserves ownership policy and truthful replay`, () => {
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
          "src/routes/+page.svelte",
          '<script>import {Card} from "$lib/components/ui/index.js";</script><Card />',
        );
        const page = readFileSync(
          path.join(fixture.root, "src/routes/+page.svelte"),
          "utf8",
        );
        const installed = fixture.run(["add", "card"]);
        assert.equal(installed.status, 0, installed.stderr + installed.stdout);
        const card = config.uiDir + "/card.svelte";
        const customized = '<div class="card">LOCAL_CUSTOM</div>\n';
        if (
          scenario === "local-only" ||
          scenario === "conflict" ||
          scenario === "custom-retire"
        )
          write(fixture.root, card, customized);
        if (
          scenario === "update" ||
          scenario === "conflict" ||
          scenario === "metadata"
        ) {
          const registry = compoundRegistry(fixture.pkg, {
            version: "0.1.1",
            ...(scenario === "metadata"
              ? {}
              : { cardBody: '<div class="card">INCOMING_UPDATE</div>\n' }),
          });
          assert.equal(registry.ok, true, JSON.stringify(registry));
        }
        if (scenario.endsWith("retire")) {
          const config = JSON.parse(
            readFileSync(
              path.join(fixture.root, paths.stateDir, "kit.json"),
              "utf8",
            ),
          );
          write(
            fixture.root,
            paths.stateDir + "/kit.json",
            JSON.stringify({ ...config, requested: ["button"] }, null, 2) +
              "\n",
          );
        }
        if (scenario === "custom-css-retire")
          write(
            fixture.root,
            paths.kitCss,
            readFileSync(path.join(fixture.root, paths.kitCss), "utf8").replace(
              ".card {}",
              ".card { color: purple; }",
            ),
          );
        const before = snapshotTree(fixture.root);
        const dry = fixture.run(["sync", "--dry-run"]);
        assert.equal(
          dry.status,
          scenario === "conflict" ? 10 : 0,
          dry.stderr + dry.stdout,
        );
        assert.deepEqual(snapshotTree(fixture.root), before);
        const result = fixture.run(["sync"]);
        assert.equal(
          result.status,
          scenario === "conflict" ? 10 : 0,
          result.stderr + result.stdout,
        );
        const envelope = JSON.parse(result.stdout);
        if (scenario === "conflict") {
          assert.equal(envelope.status, "conflict");
          assert.deepEqual(envelope.changes, []);
          assert.deepEqual(snapshotTree(fixture.root), before);
          return;
        }
        if (scenario === "update")
          assert.match(
            readFileSync(path.join(fixture.root, card), "utf8"),
            /INCOMING_UPDATE/,
          );
        if (scenario === "local-only") {
          assert.equal(
            readFileSync(path.join(fixture.root, card), "utf8"),
            customized,
          );
          assert.equal(envelope.status, "no_change");
          assert.deepEqual(snapshotTree(fixture.root), before);
        }
        if (scenario === "clean-retire") {
          assert.equal(existsSync(path.join(fixture.root, card)), false);
          assert.ok(
            envelope.changes.some(
              (entry: { path: string; action: string; applied: boolean }) =>
                entry.path === card &&
                entry.action === "retire" &&
                entry.applied,
            ),
          );
        }
        if (scenario === "custom-retire") {
          assert.equal(
            readFileSync(path.join(fixture.root, card), "utf8"),
            customized,
          );
          assert.equal(envelope.status, "warning");
          assert.ok(
            envelope.diagnostics.some(
              (entry: { code: string }) =>
                entry.code === "RETIRED_CUSTOMIZATION_PRESERVED",
            ),
          );
        }
        assert.equal(
          readFileSync(
            path.join(fixture.root, "src/routes/+page.svelte"),
            "utf8",
          ),
          page,
        );
        if (scenario === "custom-css-retire") {
          assert.match(
            readFileSync(path.join(fixture.root, paths.kitCss), "utf8"),
            /color: purple/,
          );
          assert.equal(envelope.status, "warning");
          assert.ok(
            envelope.diagnostics.some(
              (entry: { code: string }) =>
                entry.code === "RETIRED_CUSTOMIZATION_PRESERVED",
            ),
          );
        }
        const lock = JSON.parse(
          readFileSync(
            path.join(fixture.root, paths.stateDir, "kit.lock.json"),
            "utf8",
          ),
        );
        if (scenario.endsWith("retire")) {
          assert.deepEqual(lock.requested, ["button"]);
          assert.equal(
            lock.files.some(
              (entry: { owner: string }) => entry.owner === "card",
            ),
            false,
          );
          assert.equal(
            lock.items.some((entry: { id: string }) => entry.id === "card"),
            false,
          );
          assert.equal(
            existsSync(path.join(fixture.root, config.uiDir, "button.svelte")),
            true,
          );
        }
        if (scenario === "metadata") {
          assert.equal(lock.registryVersion, "0.1.1");
          assert.ok(
            envelope.changes.every((entry: { path: string }) =>
              entry.path.endsWith("kit.lock.json"),
            ),
          );
        }
        const after = snapshotTree(fixture.root);
        const repeat = fixture.run(["sync"]);
        assert.equal(repeat.status, 0, repeat.stderr + repeat.stdout);
        assert.equal(JSON.parse(repeat.stdout).status, "no_change");
        assert.deepEqual(JSON.parse(repeat.stdout).changes, []);
        assert.deepEqual(snapshotTree(fixture.root), after);
        if (scenario === "custom-css-retire") {
          const reacquire = fixture.run(["add", "card"]);
          assert.equal(
            reacquire.status,
            10,
            reacquire.stderr + reacquire.stdout,
          );
          assert.deepEqual(JSON.parse(reacquire.stdout).changes, []);
          assert.deepEqual(snapshotTree(fixture.root), after);
        }
      } finally {
        fixture.cleanup();
      }
    });
