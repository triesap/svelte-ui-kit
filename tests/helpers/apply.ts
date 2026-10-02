import assert from "node:assert/strict";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Shared strict operation applier for lifecycle qualification.
 *
 * It enforces the declared meaning of every planned operation: `create`
 * requires an absent target, `update` requires an existing file and `retire`
 * removes an existing target. A planner that skips a retirement, mislabels an
 * operation or leaves a planned target unobserved fails here, so a lifecycle
 * test always observes the real post-operation state before recapturing.
 */
export interface PlannedOperation {
  readonly path: string;
  readonly bytes: Uint8Array;
  readonly operation?: string;
}

export function strictApply(
  root: string,
  writes: readonly PlannedOperation[],
): void {
  for (const write of writes) {
    const abs = path.join(root, write.path);
    const exists = existsSync(abs);
    assert.ok(write.operation, `write ${write.path} must declare an operation`);
    if (write.operation === "retire") {
      assert.equal(exists, true, `retire target must exist: ${write.path}`);
      rmSync(abs, { force: true });
      continue;
    }
    if (write.operation === "create") {
      assert.equal(
        exists,
        false,
        `create target must be absent: ${write.path}`,
      );
    } else {
      assert.equal(exists, true, `update target must exist: ${write.path}`);
    }
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, write.bytes);
  }
}
