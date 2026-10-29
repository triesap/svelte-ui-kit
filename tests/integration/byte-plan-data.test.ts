import assert from "node:assert/strict";
import { test } from "node:test";
import { validateApplyPlan } from "../../src/codegen/apply.js";
import { generationFixture } from "../helpers/generation-fixture.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

for (const target of ["astro", "svelte-library"] as const)
  for (const position of ["lock", "captured-config"] as const)
    for (const container of ["bytes", "buffer"] as const)
      for (const property of ["valueOf", Symbol.toPrimitive] as const)
        for (const kind of ["accessor", "function"] as const)
          test(`${target}: ${container} ${position} ${String(property)} ${kind} refuses without conversion calls`, (t) => {
            const f = generationFixture(t, target),
              original = f.composed;
            const changed = {
              ...original,
              lock: { ...original.lock },
              readset: {
                ...original.readset,
                files: original.readset.files.map((file) => ({ ...file })),
              },
            };
            const selected =
              position === "lock"
                ? changed.lock
                : changed.readset.files.find(
                    (file) => file.path === `${f.paths.stateDir}/kit.json`,
                  )!;
            assert.ok(selected.bytes instanceof Uint8Array);
            const bytes =
              container === "buffer"
                ? Buffer.from(selected.bytes)
                : new Uint8Array(selected.bytes);
            selected.bytes = bytes;
            let calls = 0;
            const hook = () => {
              calls++;
              return selected.bytes;
            };
            Object.defineProperty(
              bytes,
              property,
              kind === "accessor"
                ? {
                    get() {
                      calls++;
                      return hook;
                    },
                  }
                : { value: hook },
            );
            const before = snapshotTree(f.project.root),
              result = validateApplyPlan(changed);
            assert.equal(result.ok, false);
            assert.ok(
              !result.ok &&
                result.issues.some(
                  (issue) => issue.code === "PLAN_DATA_REQUIRED",
                ),
            );
            assert.equal(calls, 0);
            assert.deepEqual(snapshotTree(f.project.root), before);
          });
