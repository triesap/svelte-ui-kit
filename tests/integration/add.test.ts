import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import { cliPackage, write } from "../helpers/cli-package.js";
import { computeRegistryContentHash } from "../../src/registry/model.js";
import { sha256Hex } from "../../src/codegen/digest.js";

for (const custom of [false, true])
  test(`actual add ${custom ? "custom" : "default"} installs closure and retains explicit roots only`, () => {
    const fixture = cliPackage();
    try {
      const config = custom
        ? { ...DEFAULT_KIT_CONFIG, uiDir: "app/ui", stylesDir: "assets/styles" }
        : DEFAULT_KIT_CONFIG;
      const paths = deriveKitPaths(config);
      if (custom)
        write(
          fixture.root,
          paths.stateDir + "/kit.json",
          JSON.stringify(config),
        );
      const initial = snapshotTree(fixture.root);
      const dry = fixture.run(["add", "card", "--dry-run"]);
      assert.equal(dry.status, 0, dry.stderr + dry.stdout);
      const plan = JSON.parse(dry.stdout);
      assert.equal(plan.status, "planned");
      assert.deepEqual(plan.data.requested, ["card"]);
      assert.ok(
        plan.data.items.some(
          (entry: { id: string; provenance: string }) =>
            entry.id === "button" && entry.provenance === "transitive",
        ),
      );
      assert.deepEqual(snapshotTree(fixture.root), initial);
      const apply = fixture.run(["add", "card"]);
      assert.equal(apply.status, 0, apply.stderr + apply.stdout);
      const outcome = JSON.parse(apply.stdout);
      assert.equal(outcome.status, "success");
      assert.ok(
        outcome.changes.every((entry: { applied: boolean }) => entry.applied),
      );
      const installed = JSON.parse(
        readFileSync(
          path.join(fixture.root, paths.stateDir, "kit.json"),
          "utf8",
        ),
      );
      assert.deepEqual(installed.requested, ["card"]);
      const lock = JSON.parse(
        readFileSync(
          path.join(fixture.root, paths.stateDir, "kit.lock.json"),
          "utf8",
        ),
      );
      assert.equal(
        lock.items.find((entry: { id: string }) => entry.id === "button")
          .origin,
        "transitive",
      );
      assert.equal(
        lock.items.find((entry: { id: string }) => entry.id === "card").origin,
        "explicit",
      );
      assert.ok(
        lock.files.some(
          (entry: { owner: string; path: string }) =>
            entry.owner === "card" &&
            entry.path === config.uiDir + "/card.types.ts",
        ),
      );
      assert.equal(
        readFileSync(
          path.join(fixture.root, config.uiDir, "button.svelte"),
          "utf8",
        ),
        "<button>button</button>\n",
      );
      const after = snapshotTree(fixture.root);
      const repeat = fixture.run(["add", "card"]);
      assert.equal(repeat.status, 0, repeat.stderr + repeat.stdout);
      assert.equal(JSON.parse(repeat.stdout).status, "no_change");
      assert.deepEqual(JSON.parse(repeat.stdout).changes, []);
      assert.deepEqual(snapshotTree(fixture.root), after);
    } finally {
      fixture.cleanup();
    }
  });

test("untracked add conflict leaves config and whole tree unchanged", () => {
  const fixture = cliPackage();
  try {
    write(
      fixture.root,
      DEFAULT_KIT_CONFIG.uiDir + "/button.svelte",
      "<button>user-owned</button>\n",
    );
    const before = snapshotTree(fixture.root);
    for (const dry of [true, false]) {
      const result = fixture.run([
        "add",
        "card",
        ...(dry ? ["--dry-run"] : []),
      ]);
      assert.equal(result.status, 10, result.stderr + result.stdout);
      assert.equal(JSON.parse(result.stdout).status, "conflict");
      assert.deepEqual(JSON.parse(result.stdout).changes, []);
      assert.deepEqual(snapshotTree(fixture.root), before);
    }
  } finally {
    fixture.cleanup();
  }
});

test("add reports missing/incompatible dependency instructions without installing", () => {
  const fixture = cliPackage();
  try {
    const manifestPath = "registry/ui/button.json";
    const manifest = JSON.parse(
      readFileSync(path.join(fixture.pkg, manifestPath), "utf8"),
    );
    manifest.npmDependencies = [
      { name: "bits-ui", range: "^2.19.3", role: "runtime" },
    ];
    const text = JSON.stringify(manifest);
    write(fixture.pkg, manifestPath, text);
    const root = { ...fixture.registry.root };
    const assets = fixture.registry.assets.map((entry) =>
      entry.path === manifestPath
        ? { ...entry, digest: sha256Hex(new TextEncoder().encode(text)) }
        : entry,
    );
    write(
      fixture.pkg,
      "registry/registry.json",
      JSON.stringify({
        ...root,
        contentHash: computeRegistryContentHash(root, assets),
      }),
    );
    for (const version of [null, "1.0.0"]) {
      if (version !== null) {
        write(
          fixture.root,
          "package.json",
          JSON.stringify({
            name: "consumer",
            type: "module",
            packageManager: "pnpm@11.22.0",
            dependencies: {
              svelte: "5.57.1",
              "@sveltejs/kit": "2.70.3",
              "bits-ui": "1.0.0",
            },
          }),
        );
        write(
          fixture.root,
          "node_modules/bits-ui/package.json",
          JSON.stringify({ name: "bits-ui", version }),
        );
      }
      const before = snapshotTree(fixture.root);
      const result = fixture.run(["add", "button", "--dry-run"]);
      assert.equal(
        result.status,
        version === null ? 10 : 0,
        result.stderr + result.stdout,
      );
      const envelope = JSON.parse(result.stdout);
      assert.equal(envelope.status, version === null ? "conflict" : "planned");
      assert.ok(
        envelope.data.instructions.runtimePackages.some((entry: string) =>
          entry.startsWith("bits-ui@"),
        ),
      );
      assert.ok(
        envelope.data.dependencies.some(
          (entry: { name: string; status: string }) =>
            entry.name === "bits-ui" && entry.status !== "ready",
        ),
      );
      assert.ok(envelope.diagnostics.length > 0);
      assert.deepEqual(snapshotTree(fixture.root), before);
    }
    const manifestBefore = readFileSync(
      path.join(fixture.root, "package.json"),
      "utf8",
    );
    const installedBefore = readFileSync(
      path.join(fixture.root, "node_modules/bits-ui/package.json"),
      "utf8",
    );
    const applied = fixture.run(["add", "button"]);
    assert.equal(applied.status, 0, applied.stderr + applied.stdout);
    assert.equal(JSON.parse(applied.stdout).status, "warning");
    assert.equal(
      readFileSync(path.join(fixture.root, "package.json"), "utf8"),
      manifestBefore,
    );
    assert.equal(
      readFileSync(
        path.join(fixture.root, "node_modules/bits-ui/package.json"),
        "utf8",
      ),
      installedBefore,
    );
  } finally {
    fixture.cleanup();
  }
});
