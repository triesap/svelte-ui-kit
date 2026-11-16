import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { after, before, test } from "node:test";
import { documentedExample } from "../helpers/documented-example.js";
import { createTempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import { installIndependentCli } from "../helpers/packaged-cli.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import {
  NATIVE_BASELINE,
  SVELTE_RUNTIME_BASELINE,
} from "../../src/project/native-dependency.js";
let cli: ReturnType<typeof installIndependentCli>;
before(() => {
  cli = installIndependentCli();
});
after(() => cli?.cleanup());
for (const fault of [
  "none",
  "vendor-alias",
  "bits-alias",
  "svelte-alias",
] as const)
  test(`actual documented archive extraction ${fault}`, (t) => {
    const app = createTempProject(),
      outside = createTempProject();
    t.after(() => {
      app.cleanup();
      outside.cleanup();
    });
    const marker = outside.writeFile("marker", "preserve outside fixture\n");
    if (fault === "vendor-alias") app.symlink(outside.root, "vendor");
    if (fault === "bits-alias" || fault === "svelte-alias") {
      app.writeDir("vendor");
      app.symlink(
        marker,
        `vendor/${fault === "bits-alias" ? NATIVE_BASELINE.archive : SVELTE_RUNTIME_BASELINE.archive}`,
      );
    }
    const before = snapshotTree(app.root),
      external = snapshotTree(outside.root);
    const result = spawnSync(
      "sh",
      [
        "-c",
        documentedExample(
          "docs/getting-started.md",
          "documented-native-extraction",
          "sh",
        ),
      ],
      {
        cwd: app.root,
        encoding: "utf8",
        timeout: 30000,
        env: { ...process.env, APP: app.root, ARCHIVE: cli.retainedArchive },
      },
    );
    assert.equal(result.signal, null);
    assert.equal(result.error, undefined);
    assert.equal(result.stderr, "");
    assert.deepEqual(snapshotTree(outside.root), external);
    if (fault === "none") {
      assert.equal(result.status, 0, result.stdout);
      for (const profile of [NATIVE_BASELINE, SVELTE_RUNTIME_BASELINE])
        assert.equal(
          sha256Hex(
            readFileSync(path.join(app.root, "vendor", profile.archive)),
          ),
          profile.archiveSha256,
        );
    } else {
      assert.notEqual(result.status, 0, result.stdout);
      assert.equal(result.stdout, "");
      assert.deepEqual(snapshotTree(app.root), before);
    }
  });
