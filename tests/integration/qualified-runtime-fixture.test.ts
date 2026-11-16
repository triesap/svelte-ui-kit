import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import {
  createSupportedProject,
  createTempProject,
} from "../helpers/project.js";
import {
  copyQualifiedFixtureRuntime,
  linkQualifiedFixtureRuntime,
} from "../helpers/qualified-runtime.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

for (const fault of [
  "archive-ancestor",
  "manifest",
  "runtime-parent",
  "unowned-destination",
] as const)
  test(`qualified fixture refuses ${fault} before mutating either tree`, (t) => {
    const project = createSupportedProject();
    const outside = createTempProject();
    t.after(() => {
      project.cleanup();
      outside.cleanup();
    });
    outside.writeFile("marker", "owned external fixture; preserve exactly\n");
    if (fault === "manifest") {
      // A separate fresh root permits the intentional manifest alias.
      const alias = createTempProject();
      t.after(() => alias.cleanup());
      alias.symlink(
        outside.writeFile("package.json", '{"name":"external"}'),
        "package.json",
      );
      const before = snapshotTree(alias.root),
        external = snapshotTree(outside.root);
      assert.throws(
        () => linkQualifiedFixtureRuntime(alias, "dependencies"),
        /symlink/,
      );
      assert.deepEqual(snapshotTree(alias.root), before);
      assert.deepEqual(snapshotTree(outside.root), external);
      return;
    }
    if (fault === "archive-ancestor")
      project.symlink(outside.root, ".native-build");
    if (fault === "runtime-parent")
      project.symlink(outside.root, "node_modules");
    const before = snapshotTree(project.root),
      external = snapshotTree(outside.root);
    assert.throws(
      () =>
        copyQualifiedFixtureRuntime(
          project.root,
          "dependencies",
          fault === "unowned-destination"
            ? path.join(outside.root, "svelte")
            : undefined,
        ),
      /symlink|escape/,
    );
    assert.deepEqual(snapshotTree(project.root), before);
    assert.deepEqual(snapshotTree(outside.root), external);
  });
