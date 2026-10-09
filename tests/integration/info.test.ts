import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { DEFAULT_KIT_CONFIG } from "../../src/project/config.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

function write(root: string, file: string, value: unknown) {
  const target = path.join(root, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(value));
}
function run(
  root: string,
  args: readonly string[] = ["info", "--json", "--cwd", root],
) {
  return spawnSync(
    process.execPath,
    [path.resolve("dist/cli/main.js"), ...args],
    { cwd: root, encoding: "utf8" },
  );
}
function manifest(root: string) {
  write(root, "package.json", {
    name: "consumer",
    type: "module",
    packageManager: "pnpm@11.22.0",
    dependencies: {
      svelte: "5.57.1",
      "@sveltejs/kit": "2.70.3",
      "bits-ui": "2.19.3",
      "@internationalized/date": "3.12.4",
    },
  });
}

for (const kind of [
  "default",
  "custom",
  "ambiguous",
  "missing",
  "unsupported",
  "peer-incompatible",
  "ready",
]) {
  test(`actual info ${kind} is truthful and leaves the complete tree unchanged`, () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "suik-info-"));
    try {
      if (kind !== "missing") manifest(root);
      if (kind === "unsupported")
        write(root, "package.json", { name: "plain", type: "module" });
      if (kind === "custom" || kind === "ambiguous")
        write(root, "app/ui/_kit/kit.json", {
          ...DEFAULT_KIT_CONFIG,
          uiDir: "app/ui",
          stylesDir: "assets/styles",
          layoutFile: "app/routes/+layout.svelte",
        });
      if (kind === "ambiguous")
        write(root, "other/ui/_kit/kit.json", {
          ...DEFAULT_KIT_CONFIG,
          uiDir: "other/ui",
        });
      if (kind === "peer-incompatible" || kind === "ready")
        for (const [name, version, peers] of [
          ["svelte", kind === "ready" ? "5.57.1" : "4.0.0", {}],
          [
            "bits-ui",
            "2.19.3",
            { svelte: "^5.33.0", "@internationalized/date": "^3.8.1" },
          ],
          ["@internationalized/date", "3.12.4", {}],
        ] as const)
          write(root, `node_modules/${name}/package.json`, {
            name,
            version,
            peerDependencies: peers,
          });
      if (kind === "ready") {
        // Readiness must authenticate a real native distribution and retained
        // local source; a fabricated version-only manifest cannot prove it.
        for (const file of ["package.json", ".native-build"])
          cpSync(
            path.join("tests/fixtures/consumer", file),
            path.join(root, file),
            {
              recursive: true,
            },
          );
        rmSync(path.join(root, "node_modules/bits-ui"), { recursive: true });
        symlinkSync(
          path.resolve("node_modules/bits-ui"),
          path.join(root, "node_modules/bits-ui"),
        );
      }
      const initial = snapshotTree(root);
      const result = run(root);
      assert.equal(result.stderr, "");
      const envelope = JSON.parse(result.stdout);
      assert.equal(envelope.command, "info");
      assert.equal(
        result.stdout.includes(root),
        false,
        "physical selected root is not public semantic output",
      );
      if (kind === "ambiguous") {
        assert.equal(result.status, 1);
        assert.ok(
          envelope.diagnostics.some(
            (issue: { code: string }) => issue.code === "KIT_CONFIG_AMBIGUOUS",
          ),
        );
      } else if (kind === "unsupported") {
        assert.equal(result.status, 2);
        assert.equal(envelope.status, "unsupported");
        assert.equal(envelope.data.ready, false);
      } else if (kind === "missing") {
        assert.notEqual(result.status, 0);
        assert.equal(envelope.data.ready, false);
      } else {
        assert.equal(result.status, 0);
        assert.equal(
          envelope.data.ready,
          kind === "ready",
          "readiness reflects the captured installed versions",
        );
        assert.equal(envelope.data.registry.version, "0.1.1");
        assert.equal(
          envelope.data.paths.uiDir,
          kind === "custom" ? "app/ui" : DEFAULT_KIT_CONFIG.uiDir,
        );
        if (kind === "peer-incompatible") {
          assert.ok(
            envelope.data.dependencies.some(
              (entry: { name: string; status: string }) =>
                entry.name === "svelte" &&
                entry.status === "install_incompatible",
            ),
          );
          assert.ok(envelope.diagnostics.length > 0);
        }
      }
      assert.deepEqual(snapshotTree(root), initial);
      const human = run(root, ["info", "--cwd", root]);
      assert.equal(human.status, result.status);
      if (result.status !== 0) assert.equal(human.stdout, "");
      assert.deepEqual(snapshotTree(root), initial);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}

test("info honors cwd rather than a sibling and explicitly refuses absent selected directories", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-info-selection-"));
  try {
    mkdirSync(path.join(root, "app"));
    manifest(path.join(root, "app"));
    const before = snapshotTree(root);
    const good = run(root, ["info", "--json", "--cwd", "app"]);
    assert.equal(good.status, 0, good.stderr);
    assert.equal(JSON.parse(good.stdout).data.project.selectedBy, "cwd");
    const absent = run(root, [
      "info",
      "--json",
      "--cwd",
      path.join(root, "absent"),
    ]);
    assert.notEqual(absent.status, 0);
    assert.equal(absent.stdout.includes(root), false);
    assert.deepEqual(snapshotTree(root), before);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
