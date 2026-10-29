import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { syncBuiltinESMExports } from "node:module";
import os from "node:os";
import path from "node:path";
import { test, type TestContext } from "node:test";
import { verifyNativeInventory } from "../../src/project/native-inventory.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

function fixture(t: TestContext) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "suik-native-inventory-"));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const root = path.join(base, "package");
  const nested = path.join(root, "nested");
  fs.mkdirSync(nested, { recursive: true });
  const files = new Map([
    ["manifest.json", '{"name":"owned-native-fixture"}\n'],
    ["nested/module.js", "export const genuine = true;\n"],
  ]);
  const expected = new Map<string, string>();
  for (const [file, bytes] of files) {
    fs.writeFileSync(path.join(root, file), bytes);
    expected.set(file, createHash("sha256").update(bytes).digest("hex"));
  }
  return { base, root, nested, file: path.join(nested, "module.js"), expected };
}

test("complete native inventory and a stable package-root alias authenticate without writes", (t) => {
  const value = fixture(t);
  const alias = path.join(value.base, "hoisted-link");
  fs.symlinkSync(value.root, alias, "dir");
  const before = snapshotTree(value.base);
  const declared = [...value.expected];
  verifyNativeInventory(value.root, value.expected);
  verifyNativeInventory(alias, value.expected);
  assert.deepEqual([...value.expected], declared);
  assert.deepEqual(snapshotTree(value.base), before);
});

for (const fault of [
  "bytes",
  "missing",
  "extra-file",
  "extra-directory",
  "file-link",
  "directory-link",
] as const) {
  test(`native inventory refuses actual ${fault} and leaves it untouched`, (t) => {
    const value = fixture(t);
    if (fault === "bytes") fs.writeFileSync(value.file, "foreign bytes");
    if (fault === "missing") fs.unlinkSync(value.file);
    if (fault === "extra-file")
      fs.writeFileSync(path.join(value.nested, "extra.js"), "extra");
    if (fault === "extra-directory")
      fs.mkdirSync(path.join(value.root, "extra"));
    if (fault === "file-link") {
      const outside = path.join(value.base, "outside.js");
      fs.copyFileSync(value.file, outside);
      fs.unlinkSync(value.file);
      fs.symlinkSync(outside, value.file);
    }
    if (fault === "directory-link") {
      const moved = path.join(value.base, "outside-directory");
      fs.renameSync(value.nested, moved);
      fs.symlinkSync(moved, value.nested, "dir");
    }
    const before = snapshotTree(value.base);
    assert.throws(() => verifyNativeInventory(value.root, value.expected));
    assert.deepEqual(snapshotTree(value.base), before);
  });
}

/** Mutate only owned real files after an actual descriptor read, without fake stats. */
function afterNativeRead(file: string, mutate: () => void, run: () => void) {
  const inode = fs.statSync(file).ino;
  const original = fs.readFileSync;
  let fired = false;
  fs.readFileSync = ((target: fs.PathOrFileDescriptor, ...rest: never[]) => {
    const bytes = (
      original as (
        target: fs.PathOrFileDescriptor,
        ...rest: never[]
      ) => ReturnType<typeof original>
    )(target, ...rest);
    if (
      !fired &&
      typeof target === "number" &&
      fs.fstatSync(target).ino === inode
    ) {
      fired = true;
      mutate();
    }
    return bytes;
  }) as typeof fs.readFileSync;
  syncBuiltinESMExports();
  try {
    run();
  } finally {
    fs.readFileSync = original;
    syncBuiltinESMExports();
  }
  assert.equal(
    fired,
    true,
    "the actual selected file read must precede the mutation",
  );
}

test("bytes edited after hashing input was read still refuse at closing proof", (t) => {
  const value = fixture(t);
  afterNativeRead(
    value.file,
    () => fs.writeFileSync(value.file, "preserve this late edit"),
    () => {
      assert.throws(() => verifyNativeInventory(value.root, value.expected));
    },
  );
  assert.equal(fs.readFileSync(value.file, "utf8"), "preserve this late edit");
});

test("closing ancestry refuses a newly linked parent even when the file inode and bytes survive", (t) => {
  const value = fixture(t);
  const inode = fs.statSync(value.file).ino;
  afterNativeRead(
    value.file,
    () => {
      const moved = path.join(value.base, "moved-parent");
      fs.renameSync(value.nested, moved);
      fs.symlinkSync(moved, value.nested, "dir");
    },
    () =>
      assert.throws(() => verifyNativeInventory(value.root, value.expected)),
  );
  assert.equal(fs.statSync(value.file).ino, inode);
  assert.equal(fs.lstatSync(value.nested).isSymbolicLink(), true);
});

test("closing proof refuses retargeting a selected package alias to identical foreign bytes", (t) => {
  const value = fixture(t);
  const other = path.join(value.base, "other-package");
  fs.cpSync(value.root, other, { recursive: true });
  const alias = path.join(value.base, "selected-package");
  fs.symlinkSync(value.root, alias, "dir");
  afterNativeRead(
    value.file,
    () => {
      fs.unlinkSync(alias);
      fs.symlinkSync(other, alias, "dir");
    },
    () => assert.throws(() => verifyNativeInventory(alias, value.expected)),
  );
  assert.equal(fs.realpathSync(alias), fs.realpathSync(other));
});

test("closing directory proof refuses changed permission bits without repairing them", (t) => {
  const value = fixture(t);
  fs.chmodSync(value.nested, 0o755);
  afterNativeRead(
    value.file,
    () => fs.chmodSync(value.nested, 0o700),
    () => {
      assert.throws(() => verifyNativeInventory(value.root, value.expected));
    },
  );
  assert.equal(fs.statSync(value.nested).mode & 0o777, 0o700);
});

for (const fault of ["link", "extra"] as const) {
  test(`later sibling read cannot leave a ${fault} in an already visited subtree`, (t) => {
    const value = fixture(t);
    const earlierParent = path.join(value.root, "a", "nested");
    fs.mkdirSync(earlierParent, { recursive: true });
    fs.writeFileSync(path.join(earlierParent, "module.js"), "earlier subtree");
    value.expected.set(
      "a/nested/module.js",
      createHash("sha256").update("earlier subtree").digest("hex"),
    );
    const later = path.join(value.root, "z-last.js");
    fs.writeFileSync(later, "later sibling");
    value.expected.set(
      "z-last.js",
      createHash("sha256").update("later sibling").digest("hex"),
    );
    afterNativeRead(
      later,
      () => {
        if (fault === "link") {
          const moved = path.join(value.base, "late-moved-parent");
          fs.renameSync(earlierParent, moved);
          fs.symlinkSync(moved, earlierParent, "dir");
        } else
          fs.writeFileSync(
            path.join(earlierParent, "foreign.js"),
            "preserve foreign entry",
          );
      },
      () =>
        assert.throws(() => verifyNativeInventory(value.root, value.expected)),
    );
    if (fault === "link")
      assert.equal(fs.lstatSync(earlierParent).isSymbolicLink(), true);
    else
      assert.equal(
        fs.readFileSync(path.join(earlierParent, "foreign.js"), "utf8"),
        "preserve foreign entry",
      );
  });
}
