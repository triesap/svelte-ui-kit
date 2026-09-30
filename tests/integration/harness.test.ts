import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  readFileSync,
  readlinkSync,
  statSync,
} from "node:fs";
import { createServer } from "node:net";
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
  external.writeDir("empty");
  external.symlink(target, "alias.txt");
  const before = snapshotTree(external.root);

  const project = createTempProject();
  try {
    project.writeFile("data.txt", "data");
    project.symlink(target, "link.txt");
    // A write through the fixture symlink is rejected before any mutation.
    assert.throws(
      () => project.writeFile("link.txt", "changed"),
      /refusing to follow a symlink/,
    );
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
  assert.deepEqual(
    snapshotTree(external.root),
    before,
    "the external tree keeps its bytes, modes and link inventory",
  );
});

test("writes must not follow an ancestor symlink into an external tree", (t) => {
  const external = createTempProject({ prefix: "suik-int-external-" });
  t.after(() => external.cleanup());
  external.writeDir("sub");
  external.writeFile("sub/sentinel.txt", "keep");
  external.symlink(path.join(external.root, "sub"), "alias");
  const before = snapshotTree(external.root);

  const project = createTempProject();
  t.after(() => project.cleanup());
  project.symlink(external.root, "linked");

  assert.throws(
    () => project.writeFile("linked/sentinel.txt", "changed"),
    /refusing to follow a symlink/,
  );
  assert.throws(
    () => project.writeFile("linked/sub/new.txt", "changed"),
    /refusing to follow a symlink/,
  );
  assert.throws(
    () => project.writeDir("linked/newdir"),
    /refusing to follow a symlink/,
  );
  assert.throws(
    () => project.symlink(path.join(external.root, "x"), "linked/newlink"),
    /refusing to follow a symlink/,
  );

  assert.deepEqual(
    snapshotTree(external.root),
    before,
    "the external tree is unchanged after rejected writes",
  );
  const projectSnapshot = snapshotByPath(snapshotTree(project.root));
  assert.equal(projectSnapshot.get("linked")?.kind, "symbolic-link");
  assert.equal(
    readlinkSync(path.join(project.root, "linked")),
    external.root,
    "the fixture symlink itself is preserved",
  );
});

test("writes must not follow a final symlink", (t) => {
  const external = createTempProject({ prefix: "suik-int-external-" });
  t.after(() => external.cleanup());
  const target = external.writeFile("target.txt", "keep");
  const targetMode = statSync(target).mode & 0o7777;
  const before = snapshotTree(external.root);

  const project = createTempProject();
  t.after(() => project.cleanup());
  project.symlink(target, "link.txt");

  assert.throws(
    () => project.writeFile("link.txt", "changed"),
    /refusing to follow a symlink/,
  );
  assert.throws(
    () => project.writeDir("link.txt"),
    /refusing to follow a symlink/,
  );

  assert.deepEqual(
    snapshotTree(external.root),
    before,
    "the symlink target is unchanged",
  );
  assert.equal(readFileSync(target, "utf8"), "keep");
  assert.equal(statSync(target).mode & 0o7777, targetMode);
});

test("dangling links and invalid non-directory ancestors are rejected", (t) => {
  const external = createTempProject({ prefix: "suik-int-external-" });
  t.after(() => external.cleanup());
  const project = createTempProject();
  t.after(() => project.cleanup());

  project.symlink(path.join(external.root, "missing.txt"), "dangling.txt");
  assert.throws(
    () => project.writeFile("dangling.txt", "x"),
    /refusing to follow a symlink/,
  );
  assert.throws(
    () => project.writeFile("dangling.txt/child", "x"),
    /refusing to follow a symlink/,
  );

  project.writeFile("file.txt", "x");
  assert.throws(
    () => project.writeFile("file.txt/child", "y"),
    /invalid non-directory ancestor/,
  );
  assert.throws(
    () => project.writeDir("file.txt/child"),
    /invalid non-directory ancestor/,
  );
  assert.throws(
    () => project.symlink("/tmp", "file.txt/child"),
    /invalid non-directory ancestor/,
  );
});

test("writes reject a FIFO final target without opening it", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeDir("pipes");
  const fifo = path.join(project.root, "pipes", "input");
  const created = spawnSync("mkfifo", [fifo], { encoding: "utf8" });
  if (created.error || created.status !== 0) {
    t.skip(`mkfifo unavailable: ${created.error?.message ?? created.stderr}`);
    return;
  }

  const before = snapshotByPath(snapshotTree(project.root));
  assert.equal(
    before.get("pipes/input")?.kind,
    "other",
    "the FIFO must be recorded as a non-regular entry",
  );

  const started = Date.now();
  assert.throws(
    () => project.writeFile("pipes/input", "x"),
    /non-regular entry/,
  );
  assert.ok(
    Date.now() - started < 1_000,
    "the rejection must not block on opening the FIFO",
  );
  assert.throws(
    () => project.writeDir("pipes/input"),
    /cannot create a directory over a non-directory/,
  );

  const after = snapshotByPath(snapshotTree(project.root));
  assert.deepEqual(
    after.get("pipes/input"),
    before.get("pipes/input"),
    "the FIFO kind, mode and size are preserved",
  );

  project.cleanup();
  assert.ok(!existsSync(project.root), "owned cleanup removes the FIFO root");
});

test("writes reject a socket final target without side effects", async (t) => {
  const project = createTempProject();
  const socketPath = path.join(project.root, "control.sock");
  const server = createServer();
  let listening = false;
  try {
    try {
      await new Promise<void>((resolve, reject) => {
        server.once("listening", () => resolve());
        server.once("error", reject);
        server.listen(socketPath);
      });
      listening = true;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "EINVAL" || code === "ENAMETOOLONG") {
        t.skip(`UNIX socket path unsupported here: ${code}`);
        return;
      }
      throw error;
    }

    const before = snapshotByPath(snapshotTree(project.root));
    assert.equal(before.get("control.sock")?.kind, "other");

    assert.throws(
      () => project.writeFile("control.sock", "x"),
      /non-regular entry/,
    );
    assert.throws(
      () => project.writeDir("control.sock"),
      /cannot create a directory over a non-directory/,
    );

    const after = snapshotByPath(snapshotTree(project.root));
    assert.deepEqual(
      after.get("control.sock"),
      before.get("control.sock"),
      "the socket kind and mode are preserved",
    );
  } finally {
    if (listening) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    project.cleanup();
  }
});
