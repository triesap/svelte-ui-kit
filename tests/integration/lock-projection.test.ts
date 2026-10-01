import assert from "node:assert/strict";
import { test } from "node:test";

import { buildLockProjection } from "../../src/codegen/lock-projection.js";
import type { KitLock } from "../../src/codegen/lock.js";
import type {
  SourcePlan,
  SourcePlanChange,
} from "../../src/codegen/source-plan.js";
import type { RequestProjection } from "../../src/registry/projection.js";

/**
 * S061 tests: the lock projection follows effective dispositions, so a
 * preserved customization keeps its prior base, only adopted targets advance
 * lineage, a metadata-only transition is recorded explicitly, and a retired
 * owner's records are detached.
 */

function projection(requested: readonly string[]): RequestProjection {
  return {
    requested,
    order: requested,
    items: requested.map((id) => ({
      id,
      provenance: "explicit" as const,
      requiredBy: [],
    })),
    retained: requested,
    retired: [],
  };
}

function change(
  path: string,
  disposition: SourcePlanChange["disposition"],
  candidateHash: string | null,
): SourcePlanChange {
  return {
    path,
    owner: "button",
    disposition,
    installedBaseHash: null,
    candidateHash,
    producesBytes: disposition === "create" || disposition === "update",
  };
}

function plan(changes: readonly SourcePlanChange[]): SourcePlan {
  return { changes, conflicts: [], executable: true };
}

function baseLock(): KitLock {
  return {
    schemaVersion: 1,
    toolVersion: "1.0.0",
    registryVersion: "0.1.0",
    registryHash: "a".repeat(64),
    configHash: "b".repeat(64),
    requested: ["button"],
    items: [
      {
        id: "button",
        version: "0.1.0",
        digest: "c".repeat(64),
        origin: "explicit",
      },
    ],
    files: [
      {
        path: "src/lib/components/ui/button.svelte",
        owner: "button",
        baseHash: "d".repeat(64),
        itemVersion: "0.1.0",
        cohort: "core",
      },
    ],
    cssBlocks: [],
    integrations: [],
  };
}

function project(
  changes: readonly SourcePlanChange[],
  overrides: Partial<Parameters<typeof buildLockProjection>[0]> = {},
) {
  return buildLockProjection({
    items: baseLock().items,
    desired: projection(["button"]),
    lock: baseLock(),
    sourcePlan: plan(changes),
    sourceMeta: new Map([
      [
        "src/lib/components/ui/button.svelte",
        { owner: "button", cohort: "core", version: "0.2.0" },
      ],
    ]),
    cssOutcomes: [],
    registryVersion: "0.1.0",
    registryHash: "a".repeat(64),
    configHash: "b".repeat(64),
    toolVersion: "1.0.0",
    ...overrides,
  });
}

test("a preserved customization keeps its prior base", () => {
  const result = project([
    change("src/lib/components/ui/button.svelte", "customized", null),
  ]);
  assert.equal(result.lock.files[0]?.baseHash, "d".repeat(64));
  assert.equal(result.lock.files[0]?.itemVersion, "0.1.0");
  assert.equal(result.metadataOnly, true);
});

test("an adopted target advances only its valid lineage", () => {
  const result = project([
    change("src/lib/components/ui/button.svelte", "update", "e".repeat(64)),
  ]);
  assert.equal(result.lock.files[0]?.baseHash, "e".repeat(64));
  assert.equal(result.lock.files[0]?.itemVersion, "0.2.0");
  assert.equal(result.metadataOnly, false);
});

test("a content-free transition is recorded as metadata-only", () => {
  const result = project([
    change("src/lib/components/ui/button.svelte", "no_change", "d".repeat(64)),
  ]);
  assert.equal(result.metadataOnly, true);
  assert.equal(result.lock.files[0]?.baseHash, "d".repeat(64));
});

test("a retired owner's records are detached", () => {
  const result = project(
    [
      change(
        "src/lib/components/ui/button.svelte",
        "no_change",
        "d".repeat(64),
      ),
    ],
    {
      retirement: [
        {
          path: "src/lib/components/ui/button.svelte",
          owner: "button",
          action: "delete",
          detachOwnership: true,
          reason: "clean owned target may be retired",
        },
      ],
      items: [],
      desired: projection([]),
    },
  );
  assert.deepEqual(result.lock.files, []);
  assert.deepEqual(result.lock.requested, []);
});
