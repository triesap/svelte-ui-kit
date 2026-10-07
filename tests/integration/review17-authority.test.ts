import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import type { ApplyPlanInput } from "../../src/codegen/apply.js";
import { composeApplyPlan } from "../../src/codegen/compose.js";
import { planAdd } from "../../src/codegen/plan-add.js";
import { planInit } from "../../src/codegen/plan-init.js";
import { planSync } from "../../src/codegen/plan-sync.js";
import {
  captureSnapshot,
  type ProjectSnapshot,
} from "../../src/codegen/snapshot.js";
import type { KitLock } from "../../src/codegen/lock.js";
import type { PlanWrite } from "../../src/codegen/plan.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
  type KitConfig,
} from "../../src/project/config.js";
import {
  CUSTOM_MULTI_ITEM_CONFIG,
  compoundRegistry,
} from "../helpers/multi-item-fixture.js";

/**
 * RCLD04-R2 independent export/cohort authority (review 6f2d877).
 *
 * These are the reviewer's exact causal probes turned into repository-owned
 * tests:
 *
 * 1. Emptying a real `planAdd` barrel BEFORE composition cannot certify an
 *    empty cohort: composition refuses because the authority is the independent
 *    registry closure, not the candidate bytes.
 * 2. Replacing `default as Button` with `missing as Button` after composition
 *    is refused because the full relationship (source binding) is authority.
 * 3. A captured indentation-only customization that still carries the complete
 *    export surface is preserved by a metadata-only batch and by production
 *    sync, without canonical regeneration, a baseline byte-equality fallback or
 *    fabricated baselines.
 */

const CONFIGS: readonly [string, KitConfig][] = [
  ["default", DEFAULT_KIT_CONFIG],
  ["custom", CUSTOM_MULTI_ITEM_CONFIG],
];

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function abs(root: string, rel: string): string {
  return path.join(root, ...rel.split("/"));
}

function seed(root: string): void {
  const manifest = JSON.stringify({
    name: "consumer",
    type: "module",
    dependencies: {
      svelte: "5.57.1",
      "@sveltejs/kit": "2.70.3",
      "bits-ui": "2.19.3",
      "@internationalized/date": "3.12.4",
    },
  });
  writeFileSync(path.join(root, "package.json"), manifest);
}

function pathsFor(config: KitConfig, extra: readonly string[] = []): string[] {
  const derived = deriveKitPaths(config);
  return [
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    derived.rootExports,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    config.layoutFile,
    ".gitignore",
    ...extra,
  ];
}

/** A real registry-backed `planAdd(button)` before composition. */
function buttonPlan(
  root: string,
  config: KitConfig,
  registryRoot: string,
): {
  readonly snapshot: ProjectSnapshot;
  readonly writes: readonly PlanWrite[];
  readonly exportAuthority: readonly unknown[];
} {
  const registry = compoundRegistry(registryRoot, { includeCard: false });
  assert.equal(registry.ok, true, JSON.stringify(registry));
  if (!registry.ok) throw new Error("registry invalid");
  const derived = deriveKitPaths(config);
  const snapshot = captureSnapshot(
    root,
    pathsFor(config, [`${derived.rootExportsDir}/button.svelte`]),
  );
  assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
  if (!snapshot.ok) throw new Error("snapshot failed");
  const planned = planAdd({
    registry: registry.value,
    config,
    addedRoots: ["button"],
    snapshot: snapshot.value,
    lock: null,
    registryVersion: registry.value.root.registryVersion,
    registryHash: registry.value.root.contentHash,
  });
  assert.equal(planned.ok, true, JSON.stringify(planned));
  if (!planned.ok) throw new Error("planAdd failed");
  assert.equal(
    planned.value.executable,
    true,
    JSON.stringify(planned.value.diagnostics),
  );
  return {
    snapshot: snapshot.value,
    writes: planned.value.writes,
    exportAuthority: planned.value.exportAuthority,
  };
}

for (const [label, config] of CONFIGS) {
  test(`[${label}] an emptied barrel before composition cannot certify an empty cohort`, () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "suik-r17-empty-"));
    const registryRoot = mkdtempSync(path.join(os.tmpdir(), "suik-r17-reg-"));
    try {
      seed(root);
      const { snapshot, writes } = buttonPlan(root, config, registryRoot);
      const derived = deriveKitPaths(config);
      // Positive control: the untampered planner write set composes and applies.
      const good = composeApplyPlan({ root, config, writes, snapshot });
      assert.equal(good.ok, true, JSON.stringify(good));
      if (!good.ok) return;
      assert.equal(validateApplyPlan(good.value).ok, true);

      // Neither a copied receipt nor a replaced mirror can supply authority,
      // even when its advertised hash/path matches the real registry exactly.
      const forged = writes.map((entry) => ({
        ...entry,
        ...(entry.path === derived.rootExports
          ? {
              bytes: utf8(
                "// svelte-ui-kit:start exports\n// svelte-ui-kit:end exports\n",
              ),
            }
          : {}),
        ...(entry.exportAuthority === undefined
          ? {}
          : {
              exportAuthority: entry.exportAuthority.map((authority) => ({
                ...authority,
                declarations: [],
              })),
            }),
      }));
      const forgedCompose = composeApplyPlan({
        root,
        config,
        writes: forged,
        snapshot,
      });
      assert.equal(forgedCompose.ok, false, JSON.stringify(forgedCompose));
      if (!forgedCompose.ok)
        assert.ok(
          forgedCompose.issues.some(
            (entry) =>
              entry.code === "COMPOSE_EXPORTS_AUTHORITY_UNAUTHENTICATED",
          ),
        );

      const replacedAuthority = {
        ...good.value,
        exportAuthority: good.value.exportAuthority?.map((entry) => ({
          ...entry,
          declarations: [],
        })),
        targets: good.value.targets.map((entry) =>
          entry.path === derived.rootExports
            ? {
                ...entry,
                bytes: utf8(
                  "// svelte-ui-kit:start exports\n// svelte-ui-kit:end exports\n",
                ),
              }
            : entry,
        ),
      };
      const forgedValidation = validateApplyPlan(replacedAuthority);
      assert.equal(
        forgedValidation.ok,
        false,
        JSON.stringify(forgedValidation),
      );
      if (!forgedValidation.ok)
        assert.ok(
          forgedValidation.issues.some(
            (entry) => entry.code === "PLAN_EXPORT_AUTHORITY_UNAUTHENTICATED",
          ),
        );
      assert.ok(Object.isFrozen(good.value.exportAuthority));
      assert.ok(Object.isFrozen(good.value.exportAuthority?.[0]?.declarations));

      // The reviewer's probe: empty the managed barrel region BEFORE compose.
      const empty =
        "// svelte-ui-kit:start exports\n// svelte-ui-kit:end exports\n";
      const tampered = writes.map((entry) =>
        entry.path === derived.rootExports
          ? { ...entry, bytes: utf8(empty) }
          : entry,
      );
      const bad = composeApplyPlan({
        root,
        config,
        writes: tampered,
        snapshot,
      });
      assert.equal(bad.ok, false, JSON.stringify(bad));
      if (!bad.ok) {
        assert.ok(
          bad.issues.some(
            (entry) =>
              entry.code === "COMPOSE_EXPORTS_AUTHORITY_WRITE_MISMATCH" ||
              entry.code === "COMPOSE_EXPORTS_AUTHORITY_MISSING",
          ),
          JSON.stringify(bad.issues),
        );
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(registryRoot, { recursive: true, force: true });
    }
  });

  test(`[${label}] complete original operations and readset cannot be omitted`, () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "suik-original-plan-"));
    const registryRoot = mkdtempSync(
      path.join(os.tmpdir(), "suik-original-reg-"),
    );
    try {
      seed(root);
      const { snapshot, writes } = buttonPlan(root, config, registryRoot);
      const derived = deriveKitPaths(config);
      const good = composeApplyPlan({ root, config, writes, snapshot });
      assert.equal(good.ok, true, JSON.stringify(good));
      if (!good.ok) return;
      const before = snapshotTree(root);
      const sourcePath = derived.rootExportsDir + "/button.svelte";
      const alteredLock = JSON.parse(
        Buffer.from(good.value.lock.bytes).toString("utf8"),
      );
      alteredLock.files = alteredLock.files.filter(
        (entry: { path: string }) => entry.path !== sourcePath,
      );
      const omittedSource = {
        ...good.value,
        targets: good.value.targets.filter(
          (entry) => entry.path !== sourcePath,
        ),
        lock: {
          ...good.value.lock,
          bytes: utf8(JSON.stringify(alteredLock, null, 2) + "\n"),
        },
      };
      const omittedRead = {
        ...good.value,
        readset: {
          ...good.value.readset,
          files: good.value.readset.files.filter(
            (entry) => entry.path !== "package.json",
          ),
        },
      };
      assert.ok(
        good.value.readset.files.some((entry) => entry.path === "package.json"),
      );
      for (const changed of [
        omittedSource,
        omittedRead,
        { ...good.value, compositionAuthority: {} },
        { ...good.value, compositionAuthority: undefined },
      ]) {
        const result = validateApplyPlan(changed);
        assert.equal(result.ok, false, JSON.stringify(result));
        if (!result.ok)
          assert.ok(
            result.issues.some(
              (entry) => entry.code === "PLAN_COMPOSITION_UNAUTHENTICATED",
            ),
            JSON.stringify(result),
          );
        assert.deepEqual(snapshotTree(root), before);
      }
      const beforeCompose = writes
        .filter((entry) => entry.path !== sourcePath)
        .map((entry) =>
          entry.path === derived.stateDir + "/kit.lock.json"
            ? {
                ...entry,
                bytes: utf8(JSON.stringify(alteredLock, null, 2) + "\n"),
              }
            : entry,
        );
      const refused = composeApplyPlan({
        root,
        config,
        snapshot,
        writes: beforeCompose,
      });
      assert.equal(refused.ok, false, JSON.stringify(refused));
      if (!refused.ok)
        assert.ok(
          refused.issues.some(
            (entry) => entry.code === "COMPOSE_PLANNING_AUTHORITY_CHANGED",
          ),
          JSON.stringify(refused),
        );
      const emptyLock = {
        ...alteredLock,
        requested: [],
        items: [],
        files: [],
        cssBlocks: [],
        integrations: [],
      };
      const stripped = composeApplyPlan({
        root,
        config,
        snapshot,
        writes: [
          {
            path: derived.stateDir + "/kit.lock.json",
            bytes: utf8(JSON.stringify(emptyLock, null, 2) + "\n"),
          },
        ],
      });
      assert.equal(stripped.ok, false, JSON.stringify(stripped));
      if (!stripped.ok)
        assert.ok(
          stripped.issues.some(
            (entry) => entry.code === "COMPOSE_PLANNING_AUTHORITY_CHANGED",
          ),
          JSON.stringify(stripped),
        );
      assert.deepEqual(snapshotTree(root), before);
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(registryRoot, { recursive: true, force: true });
    }
  });

  test(`[${label}] a rebound source binding after composition is refused`, () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "suik-r17-rebind-"));
    const registryRoot = mkdtempSync(path.join(os.tmpdir(), "suik-r17-reg-"));
    try {
      seed(root);
      const { snapshot, writes } = buttonPlan(root, config, registryRoot);
      const derived = deriveKitPaths(config);
      const good = composeApplyPlan({ root, config, writes, snapshot });
      assert.equal(good.ok, true, JSON.stringify(good));
      if (!good.ok) return;
      const barrel = good.value.targets.find(
        (target) => target.path === derived.rootExports,
      );
      assert.ok(barrel, "the add must plan the exports barrel");
      if (barrel === undefined) return;
      const rebound: ApplyPlanInput = {
        ...good.value,
        targets: good.value.targets.map((target) =>
          target.path === derived.rootExports
            ? {
                ...target,
                bytes: utf8(
                  new TextDecoder()
                    .decode(target.bytes)
                    .replace("default as Button", "missing as Button"),
                ),
              }
            : target,
        ),
      };
      const result = validateApplyPlan(rebound);
      assert.equal(result.ok, false, JSON.stringify(result));
      if (!result.ok) {
        assert.ok(
          result.issues.some(
            (entry) => entry.code === "PROJECTED_EXPORTS_COHORT_MISSING",
          ),
          JSON.stringify(result.issues),
        );
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(registryRoot, { recursive: true, force: true });
    }
  });

  test(`[${label}] a customized-but-equivalent barrel is preserved by sync and metadata-only apply`, () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "suik-r17-custom-"));
    const registryRoot = mkdtempSync(path.join(os.tmpdir(), "suik-r17-reg-"));
    try {
      seed(root);
      // Install a real add so the barrel and lock are genuine.
      const registry = compoundRegistry(registryRoot, { includeCard: false });
      assert.equal(registry.ok, true, JSON.stringify(registry));
      if (!registry.ok) return;
      const derived = deriveKitPaths(config);
      const installSnapshot = captureSnapshot(
        root,
        pathsFor(config, [`${derived.rootExportsDir}/button.svelte`]),
      );
      assert.equal(installSnapshot.ok, true, JSON.stringify(installSnapshot));
      if (!installSnapshot.ok) return;
      const planned = planAdd({
        registry: registry.value,
        config,
        addedRoots: ["button"],
        snapshot: installSnapshot.value,
        lock: null,
        registryVersion: registry.value.root.registryVersion,
        registryHash: registry.value.root.contentHash,
      });
      assert.equal(planned.ok, true, JSON.stringify(planned));
      if (!planned.ok) return;
      const install = composeApplyPlan({
        root,
        config,
        writes: planned.value.writes,
        snapshot: installSnapshot.value,
      });
      assert.equal(install.ok, true, JSON.stringify(install));
      if (!install.ok) return;
      const installed = validateApplyPlan(install.value);
      assert.equal(installed.ok, true, JSON.stringify(installed));
      if (!installed.ok) return;
      assert.equal(applyPlan(installed.value).kind, "applied");

      // A user indents the managed region without changing its export surface.
      const barrelPath = abs(root, derived.rootExports);
      const original = readFileSync(barrelPath, "utf8");
      const indented = original
        .split("\n")
        .map((line) =>
          line.startsWith("// svelte-ui-kit:") || line.length === 0
            ? line
            : `  ${line}`,
        )
        .join("\n");
      writeFileSync(barrelPath, indented);

      // Production sync over the customized-but-equivalent barrel: executable
      // with no canonical regeneration of the barrel and no conflict.
      const lock = JSON.parse(
        readFileSync(abs(root, `${derived.stateDir}/kit.lock.json`), "utf8"),
      ) as KitLock;
      const installedConfig = JSON.parse(
        readFileSync(abs(root, `${derived.stateDir}/kit.json`), "utf8"),
      ) as KitConfig;
      const recaptured = captureSnapshot(
        root,
        pathsFor(config, [`${derived.rootExportsDir}/button.svelte`]),
      );
      assert.equal(recaptured.ok, true, JSON.stringify(recaptured));
      if (!recaptured.ok) return;
      const sync = planSync({
        registry: registry.value,
        config: installedConfig,
        snapshot: recaptured.value,
        lock,
        registryVersion: registry.value.root.registryVersion,
        registryHash: registry.value.root.contentHash,
      });
      assert.equal(sync.ok, true, JSON.stringify(sync));
      if (!sync.ok) return;
      assert.equal(
        sync.value.executable,
        true,
        JSON.stringify(sync.value.diagnostics),
      );
      assert.ok(
        !sync.value.writes.some((entry) => entry.path === derived.rootExports),
        "a customized-but-equivalent barrel must not be canonical-regenerated",
      );

      // A metadata-only batch carrying the same independent authority validates
      // and leaves the raw customized bytes untouched.
      assert.deepEqual(
        sync.value.lock?.items.map((item) => item.id),
        lock.items.map((item) => item.id),
        "satisfied sync must retain the installed owners",
      );
      const lockBytes = utf8(`${JSON.stringify(lock, null, 2)}\n`);
      const meta = composeApplyPlan({
        root,
        config,
        writes: [
          {
            path: `${derived.stateDir}/kit.lock.json`,
            bytes: lockBytes,
          },
        ],
        snapshot: recaptured.value,
        exportAuthority: sync.value.exportAuthority,
      });
      const reformatted = composeApplyPlan({
        root,
        config,
        snapshot: recaptured.value,
        writes: [
          {
            path: `${derived.stateDir}/kit.lock.json`,
            bytes: utf8(JSON.stringify(lock)),
          },
        ],
        exportAuthority: sync.value.exportAuthority,
      });
      assert.equal(
        reformatted.ok,
        false,
        "satisfied planning cannot authorize changed publication bytes",
      );
      if (!reformatted.ok)
        assert.ok(
          reformatted.issues.some(
            (entry) => entry.code === "COMPOSE_PLANNING_AUTHORITY_CHANGED",
          ),
          JSON.stringify(reformatted),
        );
      assert.equal(meta.ok, true, JSON.stringify(meta));
      if (!meta.ok) return;
      const metaValidated = validateApplyPlan(meta.value);
      assert.equal(metaValidated.ok, true, JSON.stringify(metaValidated));
      if (!metaValidated.ok) return;
      const outcome = applyPlan(metaValidated.value);
      assert.ok(
        outcome.kind === "applied" || outcome.kind === "no_change",
        JSON.stringify(outcome),
      );
      assert.equal(
        readFileSync(barrelPath, "utf8"),
        indented,
        "the customized managed region must be preserved byte-for-byte",
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(registryRoot, { recursive: true, force: true });
    }
  });
}

test("a plan without exporter authority still composes a non-exporting init", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-r17-init-"));
  const registryRoot = mkdtempSync(path.join(os.tmpdir(), "suik-r17-reg-"));
  try {
    seed(root);
    const registry = compoundRegistry(registryRoot, { includeCard: false });
    assert.equal(registry.ok, true, JSON.stringify(registry));
    if (!registry.ok) return;
    const snapshot = captureSnapshot(root, pathsFor(DEFAULT_KIT_CONFIG));
    assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
    if (!snapshot.ok) return;
    const planned = planInit({
      config: DEFAULT_KIT_CONFIG,
      layoutFile: DEFAULT_KIT_CONFIG.layoutFile,
      layoutSource: "",
      snapshot: snapshot.value,
      registry: registry.value,
      configHash: "b".repeat(64),
    });
    assert.equal(planned.ok, true, JSON.stringify(planned));
    if (!planned.ok) return;
    const composed = composeApplyPlan({
      root,
      config: DEFAULT_KIT_CONFIG,
      writes: planned.value.writes,
      snapshot: snapshot.value,
    });
    assert.equal(composed.ok, true, JSON.stringify(composed));
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(registryRoot, { recursive: true, force: true });
  }
});
