import assert from "node:assert/strict";
import {
  chmodSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  statfsSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import { parseKitConfig } from "../../src/project/config.js";
import { isSafeLogicalRelativePath } from "../../src/project/paths.js";
import { createTempProject } from "../helpers/project.js";
import {
  abs,
  GUARDED_STYLES,
  makeGuardedPlan,
} from "../helpers/guarded-plan.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

test("portable paths and case collisions fail before filesystem mutation", (t) => {
  const project = createTempProject({ prefix: "suik-platform spaces-é-" });
  t.after(() => project.cleanup());
  project.writeFile("CaseProbe", "case probe");
  const before = snapshotTree(project.root);
  for (const value of [
    "../escape",
    "C:/escape",
    "//host/share",
    "a\\b",
    "a/CON.txt",
    "a/file.",
    "a/file ",
    "a/?file",
  ]) {
    assert.equal(isSafeLogicalRelativePath(value), false, value);
    assert.equal(
      parseKitConfig({ schemaVersion: 1, uiDir: value }).ok,
      false,
      value,
    );
  }
  const collision = parseKitConfig({
    schemaVersion: 1,
    uiDir: "app/UI",
    stylesDir: "app/ui",
  });
  assert.equal(collision.ok, false);
  if (!collision.ok) assert.equal(collision.issues[0]?.code, "PATH_OVERLAP");
  assert.equal(
    parseKitConfig({
      schemaVersion: 1,
      uiDir: "app/ui",
      stylesDir: "app/ui-extra",
    }).ok,
    true,
  );
  assert.equal(isSafeLogicalRelativePath("app/design system/é/ui"), true);
  assert.deepEqual(snapshotTree(project.root), before);
  // Observe actual volume behavior; the safety rule above must hold on both
  // case-sensitive and case-insensitive filesystems.
  const caseSensitive = !existsSync(path.join(project.root, "caseprobe"));
  const evidenceDir = path.join(
    process.cwd(),
    "implementation/evidence/logs/platform-filesystem",
  );
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(
    path.join(evidenceDir, `${process.platform}-${process.arch}.json`),
    JSON.stringify(
      {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        release: os.release(),
        filesystemType: statfsSync(project.root).type,
        caseSensitive,
        tests: "platform-filesystem.test.ts",
        windowsQualified: false,
      },
      null,
      2,
    ) + "\n",
  );
});

test("real replacement preserves mode and leaves an open preimage intact", (t) => {
  const project = createTempProject({ prefix: "suik-platform rename-é-" });
  t.after(() => project.cleanup());
  // Seed the actual guarded transaction fixture before capturing its plan.
  makeGuardedPlan(project.root);
  const css = abs(project.root, `${GUARDED_STYLES}/kit.css`);
  chmodSync(css, 0o640);
  const original = statSync(css);
  const fd = openSync(css, "r");
  t.after(() => closeSync(fd));
  const plan = validateApplyPlan(makeGuardedPlan(project.root));
  assert.equal(plan.ok, true, JSON.stringify(plan));
  if (!plan.ok) return;
  const outcome = applyPlan(plan.value);
  assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));
  assert.equal(statSync(css).mode & 0o777, 0o640);
  assert.equal(statSync(css).dev, original.dev);
  assert.notEqual(statSync(css).ino, original.ino);
  assert.equal(readFileSync(fd, "utf8"), "old css");
  assert.match(readFileSync(css, "utf8"), /svelte-ui-kit:start tokens/);
});

test("a symlink substituted after planning cannot redirect a batch", (t) => {
  const project = createTempProject();
  const outside = createTempProject();
  t.after(() => {
    project.cleanup();
    outside.cleanup();
  });
  const planned = validateApplyPlan(makeGuardedPlan(project.root));
  assert.equal(planned.ok, true, JSON.stringify(planned));
  if (!planned.ok) return;
  // Rename the real ancestor, then create the link explicitly inside the
  // owned fixture. No helper is allowed to write through that link.
  renameSync(
    abs(project.root, GUARDED_STYLES),
    abs(project.root, "saved-styles"),
  );
  outside.writeFile("kit.css", "outside user bytes");
  project.symlink(outside.root, GUARDED_STYLES);
  const localBefore = snapshotTree(project.root);
  const outsideBefore = snapshotTree(outside.root);
  const outcome = applyPlan(planned.value);
  assert.equal(outcome.kind, "refused");
  assert.ok(
    outcome.issues.some((issue) => /ANCESTOR|SYMLINK/.test(issue.code)),
    JSON.stringify(outcome.issues),
  );
  assert.deepEqual(snapshotTree(project.root), localBefore);
  assert.deepEqual(snapshotTree(outside.root), outsideBefore);
});
