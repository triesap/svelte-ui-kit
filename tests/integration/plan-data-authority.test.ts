import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { validateApplyPlan } from "../../src/codegen/apply.js";
import { composeApplyPlan } from "../../src/codegen/compose.js";
import { captureSnapshot, observedText } from "../../src/codegen/snapshot.js";
import { planInit } from "../../src/codegen/plan-init.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import {
  generationInputPaths,
  initializationFields,
} from "../../src/project/generation-config.js";
import { parseTargetConfig } from "../../src/project/target-config.js";
import { generationFixture } from "../helpers/generation-fixture.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

for (const target of ["astro", "svelte-library"] as const) {
  test(`${target}: stateful getters cannot drop authenticated manifest and installed evidence during sealing`, (t) => {
    const f = generationFixture(t, target),
      original = f.composed;
    assert.ok(validateApplyPlan(original).ok);
    const reduced = {
      ...original.readset,
      files: original.readset.files.filter(
        (file) => file.path !== "package.json",
      ),
      installed: [],
    };
    let sealing = false,
      invocations = 0;
    const changed = { ...original };
    Object.defineProperty(changed, "compositionAuthority", {
      enumerable: true,
      get() {
        invocations++;
        sealing = true;
        return original.compositionAuthority;
      },
    });
    Object.defineProperty(changed, "readset", {
      enumerable: true,
      get() {
        invocations++;
        return sealing &&
          !(new Error().stack ?? "").includes("isOriginalComposition")
          ? reduced
          : original.readset;
      },
    });
    const before = snapshotTree(f.project.root);
    const result = validateApplyPlan(changed);
    assert.equal(
      result.ok,
      false,
      "a changing decision view must never receive write authority",
    );
    assert.equal(invocations, 0, "data validation must not invoke accessors");
    assert.deepEqual(snapshotTree(f.project.root), before);
  });
  for (const field of [
    "lock",
    "target-bytes",
    "read-file",
    "throwing",
    "proxy",
    "byte-iterator",
    "shared-bytes",
    "shared-buffer",
  ] as const)
    test(`${target}: ${field} input refuses before reading executable properties`, (t) => {
      const f = generationFixture(t, target),
        original = f.composed;
      let invocations = 0;
      const changed = {
        ...original,
        targets: original.targets.map((t) => ({ ...t })),
        lock: { ...original.lock },
        readset: {
          ...original.readset,
          files: original.readset.files.map((file) => ({ ...file })),
        },
      };
      if (field === "shared-bytes" || field === "shared-buffer") {
        const backing = new SharedArrayBuffer(
          original.targets[0]!.bytes.length,
        );
        new Uint8Array(backing).set(original.targets[0]!.bytes);
        changed.targets[0]!.bytes =
          field === "shared-buffer"
            ? Buffer.from(backing)
            : new Uint8Array(backing);
      }
      const getter = () => {
        invocations++;
        if (field === "throwing") throw new Error("caller accessor executed");
        return original.lock;
      };
      if (field === "lock" || field === "throwing")
        Object.defineProperty(changed, "lock", {
          enumerable: true,
          get: getter,
        });
      if (field === "target-bytes")
        Object.defineProperty(changed.targets[0]!, "bytes", {
          get() {
            invocations++;
            return original.targets[0]!.bytes;
          },
        });
      if (field === "read-file")
        Object.defineProperty(changed.readset.files[0]!, "digest", {
          get() {
            invocations++;
            return original.readset.files[0]!.digest;
          },
        });
      if (field === "byte-iterator")
        Object.defineProperty(
          (changed.targets[0]!.bytes = new Uint8Array(
            original.targets[0]!.bytes,
          )),
          Symbol.iterator,
          {
            get() {
              invocations++;
              throw new Error("caller byte iterator executed");
            },
          },
        );
      const input =
        field === "proxy"
          ? new Proxy(changed, {
              get() {
                invocations++;
                throw new Error("caller proxy executed");
              },
            })
          : changed;
      const before = snapshotTree(f.project.root);
      const result = validateApplyPlan(input);
      assert.equal(result.ok, false);
      assert.equal(invocations, 0);
      assert.deepEqual(snapshotTree(f.project.root), before);
    });
  for (const container of ["bytes", "buffer"] as const)
    test(`${target}: ordinary ${container} data retains original composition authority`, (t) => {
      const f = generationFixture(t, target);
      const input = {
        ...f.composed,
        targets: f.composed.targets.map((target) => ({
          ...target,
          bytes:
            container === "buffer"
              ? Buffer.from(target.bytes)
              : new Uint8Array(target.bytes),
        })),
      };
      assert.ok(validateApplyPlan(input).ok);
    });
}

test("semantic validation cannot borrow complete evidence then seal an authentic sparse receipt", (t) => {
  const f = generationFixture(t, "svelte-library");
  const cli = (args: string[]) => {
    const child = spawnSync(
      process.execPath,
      [
        path.join(f.owner, "dist/cli/main.js"),
        "--cwd",
        f.project.root,
        ...args,
      ],
      { encoding: "utf8", timeout: 30000 },
    );
    assert.equal(child.error, undefined);
    assert.equal(child.signal, null);
    assert.equal(child.status, 0, child.stdout + child.stderr);
  };
  cli(["init"]);
  cli(["add", "button"]);
  const configText = readFileSync(
    path.join(f.project.root, f.paths.stateDir, "kit.json"),
    "utf8",
  );
  const config = parseTargetConfig(JSON.parse(configText));
  assert.ok(config.ok && config.value.target === "svelte-library");
  const lockPath = `${f.paths.stateDir}/kit.lock.json`,
    lockBytes = readFileSync(path.join(f.project.root, lockPath));
  const lock = JSON.parse(lockBytes.toString());
  const base = [
    ...generationInputPaths(config.value),
    `${f.paths.stateDir}/kit.json`,
    lockPath,
    f.paths.rootExports,
    f.paths.kitCss,
    f.paths.themesCss,
    f.paths.appCss,
    f.integration.path,
    ".gitignore",
  ];
  function compose(complete: boolean) {
    const snapshot = captureSnapshot(f.project.root, [
      ...new Set([
        ...base,
        ...(complete
          ? [...lock.files, ...lock.cssBlocks, ...lock.integrations].map(
              (r: { path: string }) => r.path,
            )
          : []),
      ]),
    ]);
    assert.ok(snapshot.ok);
    assert.ok(config.ok && config.value.target === "svelte-library");
    const init = planInit({
      ...initializationFields(
        config.value,
        observedText(snapshot.value.entries.get(f.integration.path)!) ?? "",
      ),
      snapshot: snapshot.value,
      registry: f.registry,
      configHash: sha256Hex(configText),
    });
    assert.ok(init.ok, JSON.stringify(init));
    const composed = composeApplyPlan({
      root: f.project.root,
      config: config.value,
      snapshot: snapshot.value,
      writes: init.value.writes.length
        ? init.value.writes
        : [{ path: lockPath, bytes: lockBytes }],
      exportAuthority: init.value.exportAuthority,
    });
    assert.ok(composed.ok, JSON.stringify(composed));
    return composed.value;
  }
  const sparse = compose(false),
    complete = compose(true);
  assert.equal(validateApplyPlan(sparse).ok, false);
  const completeValidation = validateApplyPlan(complete);
  assert.ok(completeValidation.ok, JSON.stringify(completeValidation));
  assert.ok(sparse.readset.files.length < complete.readset.files.length);
  let sealing = false,
    invocations = 0;
  const changed = { ...sparse };
  Object.defineProperty(changed, "compositionAuthority", {
    enumerable: true,
    get() {
      invocations++;
      sealing = true;
      return sparse.compositionAuthority;
    },
  });
  Object.defineProperty(changed, "readset", {
    enumerable: true,
    get() {
      invocations++;
      return sealing ? sparse.readset : complete.readset;
    },
  });
  const before = snapshotTree(f.project.root);
  assert.equal(validateApplyPlan(changed).ok, false);
  assert.equal(invocations, 0);
  assert.deepEqual(snapshotTree(f.project.root), before);
});
