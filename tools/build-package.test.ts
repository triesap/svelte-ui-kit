import assert from "node:assert/strict";
import {
  constants,
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { buildPackage } from "./build-package.ts";
import { snapshotTree } from "../tests/helpers/tree-snapshot.ts";

const repository = fileURLToPath(new URL("../", import.meta.url));
function fixture(t: { after(callback: () => void): void }) {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-production-pack-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const file of [
    "src",
    "tools",
    "registry",
    "schema",
    "package.json",
    "pnpm-workspace.yaml",
    "tsconfig.json",
    "README.md",
    "NOTICE.md",
    "LICENSE-MIT",
    "LICENSE-APACHE",
    "docs",
    ".native-build",
  ])
    cpSync(path.join(repository, file), path.join(root, file), {
      recursive: true,
      verbatimSymlinks: true,
      mode: constants.COPYFILE_FICLONE,
    });
  symlinkSync(
    path.join(repository, "node_modules"),
    path.join(root, "node_modules"),
    "dir",
  );
  return root;
}

test("production packaging excludes actual removed compiler inputs after a dirty rebuild", async (t) => {
  const root = fixture(t);
  writeFileSync(
    path.join(root, "src/retired-module.ts"),
    'export const retired = "must disappear";\n',
  );
  await buildPackage({ root });
  assert.equal(
    lstatSync(path.join(root, "dist/retired-module.js")).isFile(),
    true,
  );
  rmSync(path.join(root, "src/retired-module.ts"));
  const destination = path.join(root, "archives");
  mkdirSync(destination);
  const result = await buildPackage({ root, packDestination: destination });
  assert.equal(JSON.parse(result!).name, "svelte-ui-kit");
  assert.equal(
    lstatSync(path.join(root, "dist/retired-module.js"), {
      throwIfNoEntry: false,
    }),
    undefined,
  );
  const names = readdirSync(destination);
  assert.equal(names.length, 1);
  const archive = path.join(destination, names[0]!);
  const list = spawnSync("tar", ["-tzf", archive], {
    encoding: "utf8",
    timeout: 30000,
  });
  assert.equal(list.status, 0, list.stderr);
  assert.doesNotMatch(list.stdout, /retired-module/);
  const extracted = path.join(root, "extracted");
  mkdirSync(extracted);
  const unpack = spawnSync("tar", ["-xzf", archive, "-C", extracted], {
    encoding: "utf8",
    timeout: 30000,
  });
  assert.equal(unpack.status, 0, unpack.stderr);
  const pkg = path.join(extracted, "package");
  assert.equal(
    lstatSync(path.join(pkg, "dist/cli/main.js")).mode & 0o777,
    0o755,
  );
  assert.equal(readdirSync(path.join(pkg, "dist/native")).length, 2);
  for (const file of ["LICENSE-MIT", "LICENSE-APACHE", "NOTICE.md"])
    assert.equal(
      readFileSync(path.join(pkg, file), "utf8"),
      readFileSync(path.join(root, file), "utf8"),
    );
});

for (const fault of ["corrupt", "linked", "foreign"] as const)
  test(`production rebuild preserves and refuses ${fault} native delivery evidence`, async (t) => {
    const root = fixture(t);
    const native = path.join(root, "dist/native");
    mkdirSync(native, { recursive: true });
    const profile = JSON.parse(
      readFileSync(
        path.join(root, "src/project/native-dependency-baseline.json"),
        "utf8",
      ),
    );
    const archive = path.join(
      root,
      ".native-build",
      profile.version,
      profile.archive,
    );
    if (fault === "corrupt")
      writeFileSync(
        path.join(native, profile.archive),
        "corrupt retained archive",
      );
    if (fault === "linked")
      symlinkSync(archive, path.join(native, profile.archive));
    if (fault === "foreign")
      writeFileSync(path.join(native, "foreign.tgz"), "unowned");
    const before = snapshotTree(root);
    await assert.rejects(buildPackage({ root }));
    assert.deepEqual(snapshotTree(root), before);
  });
