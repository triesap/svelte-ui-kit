import assert from "node:assert/strict";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import type { ValidatedApplyPlan } from "../../src/codegen/apply.js";
import {
  GUARDED_STATE,
  GUARDED_STYLES,
  makeGuardedPlan,
} from "../helpers/guarded-plan.js";

/**
 * RCLD04-R2-2: causal durability coverage for cross-directory renames.
 *
 * Hook ordering alone does not prove which directories were actually flushed.
 * This test instruments the real `fsync` syscalls and asserts that every
 * cross-directory rename flushes *both* affected parent directories, and that
 * the staged publication lock's parent is flushed during lock staging.
 */

function sealed(plan: unknown): ValidatedApplyPlan {
  const result = validateApplyPlan(plan as never);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("plan invalid");
  return result.value;
}

interface Flush {
  readonly boundary: string;
  readonly target: string;
}

interface FlushProbe {
  readonly flushes: Flush[];
  setBoundary(value: string): void;
  restore(): void;
}

function recordFlushes(): FlushProbe {
  let boundary = "setup";
  const fdPaths = new Map<number, string>();
  const flushes: Flush[] = [];
  const originalOpen = fs.openSync.bind(fs);
  const originalClose = fs.closeSync.bind(fs);
  const originalFsync = fs.fsyncSync.bind(fs);
  fs.openSync = ((p: fs.PathLike, ...rest: never[]) => {
    const fd = (originalOpen as (p: fs.PathLike, ...rest: never[]) => number)(
      p,
      ...rest,
    );
    fdPaths.set(fd, String(p));
    return fd;
  }) as typeof fs.openSync;
  fs.closeSync = ((fd: number) => {
    fdPaths.delete(fd);
    return originalClose(fd);
  }) as typeof fs.closeSync;
  fs.fsyncSync = ((fd: number) => {
    const target = fdPaths.get(fd);
    if (target !== undefined) flushes.push({ boundary, target });
    return originalFsync(fd);
  }) as typeof fs.fsyncSync;
  syncBuiltinESMExports();
  return {
    flushes,
    setBoundary: (value) => {
      boundary = value;
    },
    restore: () => {
      fs.openSync = originalOpen;
      fs.closeSync = originalClose;
      fs.fsyncSync = originalFsync;
      syncBuiltinESMExports();
    },
  };
}

test("cross-directory renames flush both affected parents and the staged lock parent", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "suik-flush-paths-"));
  const probe = recordFlushes();
  try {
    const outcome = applyPlan(sealed(makeGuardedPlan(root)), {
      before: (value) => probe.setBoundary(`before:${value}`),
      after: (value) => probe.setBoundary(`after:${value}`),
    });
    assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));

    const flushed = (boundary: string, suffix: string): boolean =>
      probe.flushes.some(
        (entry) =>
          entry.boundary === boundary &&
          entry.target.split(path.sep).join("/").endsWith(suffix),
      );

    // Backup move: the backups directory gained the preimage and the target's
    // parent lost it.
    assert.ok(
      flushed("before:durability:backup", "/backups"),
      `backup parent not flushed: ${JSON.stringify(probe.flushes)}`,
    );
    assert.ok(
      flushed("before:durability:backup", `/${GUARDED_STYLES}`),
      `backup source parent not flushed: ${JSON.stringify(probe.flushes)}`,
    );
    // Replacement: the staged directory lost the image and the target's parent
    // gained it.
    assert.ok(
      flushed("before:durability:replace", "/staged"),
      `replacement source parent not flushed: ${JSON.stringify(probe.flushes)}`,
    );
    assert.ok(
      flushed("before:durability:replace", `/${GUARDED_STATE}`) ||
        flushed("before:durability:replace", `/${GUARDED_STYLES}`),
      `replacement destination parent not flushed: ${JSON.stringify(probe.flushes)}`,
    );
    // Lock staging: the staged lock's parent must be flushed while the staged
    // image is made durable, before the publication intent records it.
    assert.ok(
      flushed("before:durability:lock-stage", "/staged"),
      `staged lock parent not flushed before intent: ${JSON.stringify(probe.flushes)}`,
    );
    // Lock publication: the canonical and staged directories are both flushed.
    assert.ok(
      flushed("before:durability:lock-publish", `/${GUARDED_STATE}`),
      `canonical parent not flushed: ${JSON.stringify(probe.flushes)}`,
    );
    assert.ok(
      flushed("before:durability:lock-publish", "/staged"),
      `publication source parent not flushed: ${JSON.stringify(probe.flushes)}`,
    );
  } finally {
    probe.restore();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
