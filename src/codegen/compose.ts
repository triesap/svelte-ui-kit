/**
 * Compose a planner's writes into a guarded apply plan (RCLD04-R1-5).
 *
 * The pure planners (`planInit`, `planAdd`, `planSync`) return write lists; the
 * guarded boundary consumes a complete `ApplyPlanInput` with captured
 * preimages and a physical readset. This module is the production link between
 * the two: it classifies the canonical lock as the final publication, validates
 * that each write's declared operation matches the observed filesystem, and
 * captures the exact preimages and physical authority the apply boundary
 * re-proves under coordination.
 *
 * It performs read-only observation only. A planner bug (a `create` over an
 * existing file, a `retire` without a file, a missing or duplicated lock write)
 * is a typed failure, never a silently coerced plan.
 */
import { existsSync, statSync } from "node:fs";
import path from "node:path";

import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "../registry/errors.js";
import { deriveKitPaths, type KitConfig } from "../project/config.js";
import { canonicalContentHash } from "./digest.js";
import {
  captureReadset,
  identityDigest,
  observeRootIdentity,
} from "./authority.js";
import type { ApplyPlanInput, ApplyTarget } from "./apply.js";
import type { PlanWrite } from "./plan.js";
import { capturePreimage } from "./revalidate.js";
import { lockPath } from "./transaction-types.js";

export interface ComposeApplyPlanInput {
  readonly root: string;
  readonly config: KitConfig;
  readonly writes: readonly PlanWrite[];
  /** Relative evidence files whose bytes bound the plan. */
  readonly readFiles?: readonly string[];
  /** Override the root identity digest (tests); defaults to the live root. */
  readonly rootIdentity?: string;
}

function absOf(root: string, logical: string): string {
  return path.join(root, ...logical.split("/"));
}

function modeOf(root: string, logical: string, fallback: number): number {
  try {
    return statSync(absOf(root, logical)).mode & 0o777;
  } catch {
    return fallback;
  }
}

/**
 * Compose a complete guarded apply plan from planner writes. The lock write is
 * the final publication and is removed from the ordinary target set.
 */
export function composeApplyPlan(
  input: ComposeApplyPlanInput,
): ModelResult<ApplyPlanInput> {
  const derived = deriveKitPaths(input.config);
  const stateDir = derived.stateDir;
  const canonicalLock = lockPath(stateDir);
  const problems: ModelIssue[] = [];

  const lockWrites = input.writes.filter(
    (write) => write.path === canonicalLock,
  );
  if (lockWrites.length === 0) {
    problems.push(
      issue(
        "COMPOSE_LOCK_MISSING",
        "a guarded apply plan requires the canonical lock write",
        canonicalLock,
      ),
    );
  }
  if (lockWrites.length > 1) {
    problems.push(
      issue(
        "COMPOSE_LOCK_DUPLICATE",
        "the canonical lock must appear exactly once",
        canonicalLock,
      ),
    );
  }

  const targets: ApplyTarget[] = [];
  const seen = new Set<string>();
  for (const write of input.writes) {
    if (write.path === canonicalLock) continue;
    if (seen.has(write.path)) {
      problems.push(
        issue(
          "COMPOSE_TARGET_DUPLICATE",
          `duplicate planned target ${write.path}`,
          write.path,
        ),
      );
      continue;
    }
    seen.add(write.path);
    const exists = existsSync(absOf(input.root, write.path));
    const operation = write.operation ?? (exists ? "update" : "create");
    if (operation === "create" && exists) {
      problems.push(
        issue(
          "COMPOSE_OPERATION_MISMATCH",
          `planned create target already exists: ${write.path}`,
          write.path,
        ),
      );
      continue;
    }
    if ((operation === "update" || operation === "retire") && !exists) {
      problems.push(
        issue(
          "COMPOSE_OPERATION_MISMATCH",
          `planned ${operation} target is absent: ${write.path}`,
          write.path,
        ),
      );
      continue;
    }
    if (operation === "retire" && write.bytes.byteLength !== 0) {
      problems.push(
        issue(
          "COMPOSE_OPERATION_MISMATCH",
          `planned retire target carries bytes: ${write.path}`,
          write.path,
        ),
      );
      continue;
    }
    targets.push({
      path: write.path,
      operation,
      bytes: write.bytes,
      mode: modeOf(input.root, write.path, 0o644),
      preimage: capturePreimage(input.root, write.path),
    });
  }

  if (problems.length > 0) return fail(problems);
  const lockWrite = lockWrites[0];
  if (lockWrite === undefined) {
    return fail([
      issue(
        "COMPOSE_LOCK_MISSING",
        "a guarded apply plan requires the canonical lock write",
        canonicalLock,
      ),
    ]);
  }

  const readset = captureReadset(
    input.root,
    [...targets.map((target) => target.path), canonicalLock],
    input.readFiles ?? [],
  );
  if (!readset.ok) return readset;

  const rootIdentityResult =
    input.rootIdentity === undefined
      ? identityDigestForRoot(input.root)
      : ok(input.rootIdentity);
  if (!rootIdentityResult.ok) return rootIdentityResult;
  const rootIdentity = rootIdentityResult.value;

  const planDigest = canonicalContentHash({
    targets: targets.map((target) => ({
      path: target.path,
      operation: target.operation,
      digest: capturePreimage(input.root, target.path).digest ?? "",
      mode: target.mode,
    })),
    lock: lockWrite.bytes.byteLength,
  });

  return ok({
    root: input.root,
    stateDir,
    uiDir: input.config.uiDir,
    stylesDir: input.config.stylesDir,
    layoutFile: input.config.layoutFile,
    rootIdentity,
    planDigest,
    readset: readset.value,
    targets,
    lock: {
      bytes: lockWrite.bytes,
      preimage: capturePreimage(input.root, canonicalLock),
    },
  });
}

function identityDigestForRoot(root: string): ModelResult<string> {
  const identity = observeRootIdentity(root);
  if (!identity.ok) return identity;
  return ok(identityDigest(identity.value));
}
