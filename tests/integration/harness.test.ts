import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { resolveCliEntrypoint, runCli } from "../helpers/cli.js";
import { createTempProject } from "../helpers/project.js";
import { snapshotByPath, snapshotTree } from "../helpers/tree-snapshot.js";

const PACKAGE_ROOT = process.cwd();

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

test("the temp project writes only inside its owned root and cleans up", (t) => {
  const external = createTempProject({ prefix: "suik-int-external-" });
  t.after(() => external.cleanup());
  external.writeFile("sentinel.txt", "keep");

  const project = createTempProject();
  t.after(() => project.cleanup());
  const file = project.writeFile("nested/file.txt", "hello");
  project.writeDir("emptydir");
  project.symlink(path.join(external.root, "sentinel.txt"), "link.txt");

  assert.ok(existsSync(file));
  assert.equal(readFileSync(file, "utf8"), "hello");
  assert.ok(existsSync(path.join(project.root, "emptydir")));
  assert.ok(!existsSync(path.join(external.root, "nested")));

  project.cleanup();
  assert.ok(!existsSync(project.root), "cleanup removes the owned root only");
  assert.ok(
    existsSync(path.join(external.root, "sentinel.txt")),
    "an unrelated project is untouched",
  );
});

test("the temp project rejects absolute and escaping paths", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());

  assert.throws(() => project.writeFile("/absolute.txt", "x"), /relative/);
  assert.throws(
    () => project.writeFile("../escape.txt", "x"),
    /must not escape its root/,
  );
  assert.throws(() => project.writeDir(".."), /must not escape its root/);
  assert.throws(
    () => project.symlink("/tmp", ".."),
    /must not escape its root/,
  );
  assert.throws(() => project.writeFile("", "x"), /must not be empty/);
});

test("snapshotTree captures bytes, modes, kinds, hidden entries, directories and link targets", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(".hidden.txt", "hidden");
  const file = project.writeFile("file.txt", "bytes");
  chmodSync(file, 0o640);
  const dir = project.writeDir("dir");
  const external = createTempProject({ prefix: "suik-int-target-" });
  t.after(() => external.cleanup());
  const target = external.writeFile("target.txt", "target-bytes");
  project.symlink(target, "link.txt");

  const snapshot = snapshotTree(project.root);
  const byPath = snapshotByPath(snapshot);

  assert.equal(byPath.get("file.txt")?.kind, "file");
  assert.equal(byPath.get("file.txt")?.sha256, sha256("bytes"));
  assert.equal(byPath.get("file.txt")?.mode, 0o640);
  assert.equal(byPath.get("file.txt")?.size, 5);
  assert.equal(byPath.get(".hidden.txt")?.kind, "file");
  assert.deepEqual(byPath.get("dir"), {
    path: "dir",
    kind: "directory",
    mode: statSync(dir).mode & 0o7777,
    size: 0,
    sha256: null,
    linkTarget: null,
  });
  assert.equal(byPath.get("link.txt")?.kind, "symbolic-link");
  assert.equal(byPath.get("link.txt")?.linkTarget, target);
  assert.ok(
    !snapshot.some((entry) => entry.path.includes("target.txt")),
    "a symlink target must not be followed into the snapshot",
  );
  assert.deepEqual(
    snapshot,
    snapshotTree(project.root),
    "two snapshots of an unchanged tree are identical",
  );
});

test("snapshotTree detects byte and mode changes between snapshots", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const file = project.writeFile("value.txt", "one");
  const before = snapshotTree(project.root);

  project.writeFile("value.txt", "two");
  const afterBytes = snapshotTree(project.root);
  assert.notDeepEqual(before, afterBytes);

  chmodSync(file, 0o600);
  const afterMode = snapshotTree(project.root);
  assert.notDeepEqual(afterBytes, afterMode);
});

test("runCli captures the built CLI version on stdout with exit 0", () => {
  const manifest = JSON.parse(
    readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8"),
  ) as { name: string; version: string };
  assert.ok(existsSync(resolveCliEntrypoint(PACKAGE_ROOT)));

  const result = runCli(["--version"]);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout, `${manifest.name} ${manifest.version}\n`);
});

test("runCli captures stderr and exit 2 for an unsupported argument", () => {
  const result = runCli(["--not-a-command"]);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /unsupported argument list/);
});

test("runCli works from a working directory containing spaces", (t) => {
  const parent = createTempProject();
  t.after(() => parent.cleanup());
  const spaced = parent.writeDir("dir with spaces");

  const result = runCli(["--help"], { cwd: spaced });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /svelte-ui-kit — bootstrap CLI/);
});

test("runCli bounds a non-terminating child process", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const hang = project.writeFile("hang.mjs", "setInterval(() => {}, 1000);\n");

  const result = runCli([], {
    entrypoint: hang,
    packageRoot: project.root,
    timeoutMs: 500,
  });
  assert.equal(result.timedOut, true);
  assert.equal(result.status, null);
});

test("cleanup after a setup or assertion failure leaves external state unchanged", (t) => {
  const external = createTempProject({ prefix: "suik-int-external-" });
  t.after(() => external.cleanup());
  const target = external.writeFile("target.txt", "target-bytes");
  const targetMode = statSync(target).mode & 0o7777;

  const project = createTempProject();
  try {
    project.writeFile("data.txt", "data");
    project.symlink(target, "link.txt");
    // A malformed setup path throws before any assertion runs.
    assert.throws(
      () => project.writeFile("../escape.txt", "x"),
      /must not escape its root/,
    );
    assert.fail("intentional assertion failure");
  } catch (error) {
    assert.match(
      String((error as Error).message),
      /intentional assertion failure/,
    );
  } finally {
    project.cleanup();
  }

  assert.ok(!existsSync(project.root), "the owned root is removed");
  assert.equal(
    readFileSync(target, "utf8"),
    "target-bytes",
    "an external symlink target keeps its bytes",
  );
  assert.equal(statSync(target).mode & 0o7777, targetMode);
});
