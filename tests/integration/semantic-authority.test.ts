import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import type { ApplyPlanInput } from "../../src/codegen/apply.js";
import { composeApplyPlan } from "../../src/codegen/compose.js";
import { planAdd } from "../../src/codegen/plan-add.js";
import { planInit } from "../../src/codegen/plan-init.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
  type KitConfig,
} from "../../src/project/config.js";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import {
  CUSTOM_MULTI_ITEM_CONFIG,
  compoundRegistry,
} from "../helpers/multi-item-fixture.js";

/**
 * RCLD04-R2-1/R2-5 semantic integration authority.
 *
 * The guarded boundary must prove a `layout-v1` integration from the actual
 * Svelte template AST (a real `{@render}` of the `children` binding or a legacy
 * `<slot>`), never from import-looking or render-looking text inside a comment.
 * It must prove an `exports-v1` integration from the effective managed export
 * region against the registry-declared export cohort carried from planning, so
 * a barrel replacement that silently drops or retargets a declared export is
 * refused even though the markers are still present and the file is valid
 * TypeScript.
 *
 * These are the four independent-review d54f7d4 probes plus their positive
 * controls, qualified for the default and the independently rooted custom
 * mapping through the production planner/composition/validation/application
 * core.
 */

const PKG_ROOT = process.cwd();
const CONFIGS: readonly [string, KitConfig][] = [
  ["default", DEFAULT_KIT_CONFIG],
  ["custom", CUSTOM_MULTI_ITEM_CONFIG],
];

function write(root: string, rel: string, data: string | Uint8Array): void {
  const target = path.join(root, ...rel.split("/"));
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, data);
}

function initPaths(config: KitConfig): string[] {
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
  ];
}

function seed(root: string): void {
  write(
    root,
    "package.json",
    JSON.stringify({
      name: "consumer",
      type: "module",
      dependencies: {
        svelte: "5.57.1",
        "@sveltejs/kit": "2.70.3",
        "bits-ui": "2.19.3",
        "@internationalized/date": "3.12.4",
      },
    }),
  );
}

function capturedInit(root: string, config: KitConfig): ApplyPlanInput {
  const registry = loadRegistrySnapshot(createAssetProvider(PKG_ROOT));
  assert.equal(registry.ok, true, JSON.stringify(registry));
  if (!registry.ok) throw new Error("registry invalid");
  const snapshot = captureSnapshot(root, initPaths(config));
  assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
  if (!snapshot.ok) throw new Error("snapshot failed");
  const planned = planInit({
    config,
    layoutFile: config.layoutFile,
    layoutSource: "",
    snapshot: snapshot.value,
    registry: registry.value,
    configHash: "b".repeat(64),
  });
  assert.equal(planned.ok, true, JSON.stringify(planned));
  if (!planned.ok) throw new Error("plan failed");
  const composed = composeApplyPlan({
    root,
    config,
    writes: planned.value.writes,
    snapshot: snapshot.value,
  });
  assert.equal(composed.ok, true, JSON.stringify(composed));
  if (!composed.ok) throw new Error("compose failed");
  return composed.value;
}

function replaceLayout(
  plan: ApplyPlanInput,
  layoutFile: string,
  source: string,
): ApplyPlanInput {
  const bytes = new TextEncoder().encode(source);
  return {
    ...plan,
    targets: plan.targets.map((target) =>
      target.path === layoutFile ? { ...target, bytes } : target,
    ),
  };
}

const IMPORTS = (config: KitConfig): string => {
  const derived = deriveKitPaths(config);
  const from = path.posix.dirname(config.layoutFile);
  return [derived.kitCss, derived.themesCss, derived.appCss]
    .map((target) => {
      const relative = path.posix.relative(from, target);
      const specifier = relative.startsWith(".") ? relative : `./${relative}`;
      return `import "${specifier}";`;
    })
    .join("\n")
    .concat("\n");
};

function withCapturedInit(
  config: KitConfig,
  body: (root: string, plan: ApplyPlanInput) => void,
): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-semantic-"));
  try {
    seed(root);
    body(root, capturedInit(root, config));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

for (const [label, config] of CONFIGS) {
  test(`[${label}] comment-only layout rendering and imports are refused`, () => {
    withCapturedInit(config, (_root, plan) => {
      const renderComment = replaceLayout(
        plan,
        config.layoutFile,
        `<script>\n${IMPORTS(config)}let { children } = $props();\n</script>\n<!-- {@render children()} -->\n`,
      );
      const renderResult = validateApplyPlan(renderComment);
      assert.equal(renderResult.ok, false, JSON.stringify(renderResult));
      if (!renderResult.ok) {
        assert.ok(
          renderResult.issues.some(
            (entry) => entry.code === "PROJECTED_LAYOUT_RENDERING_MISSING",
          ),
          JSON.stringify(renderResult.issues),
        );
      }

      const importComment = replaceLayout(
        plan,
        config.layoutFile,
        `<script>\n/*\n${IMPORTS(config)}*/\nlet { children } = $props();\n</script>\n{@render children()}\n`,
      );
      const importResult = validateApplyPlan(importComment);
      assert.equal(importResult.ok, false, JSON.stringify(importResult));
      if (!importResult.ok) {
        assert.ok(
          importResult.issues.some(
            (entry) => entry.code === "PROJECTED_LAYOUT_INTEGRATION_MISSING",
          ),
          JSON.stringify(importResult.issues),
        );
      }

      const unrelated = replaceLayout(
        plan,
        config.layoutFile,
        `<script>\n${IMPORTS(config)}let { children, other } = $props();\n</script>\n{@render other()}\n`,
      );
      const unrelatedResult = validateApplyPlan(unrelated);
      assert.equal(unrelatedResult.ok, false, JSON.stringify(unrelatedResult));
      if (!unrelatedResult.ok) {
        assert.ok(
          unrelatedResult.issues.some(
            (entry) => entry.code === "PROJECTED_LAYOUT_RENDERING_MISSING",
          ),
          JSON.stringify(unrelatedResult.issues),
        );
      }
    });
  });

  test(`[${label}] direct, aliased and legacy children rendering are accepted`, () => {
    withCapturedInit(config, (_root, plan) => {
      const direct = replaceLayout(
        plan,
        config.layoutFile,
        `<script>\n${IMPORTS(config)}let { children } = $props();\n</script>\n{@render children()}\n`,
      );
      assert.equal(validateApplyPlan(direct).ok, true);

      const aliased = replaceLayout(
        plan,
        config.layoutFile,
        `<script>\n${IMPORTS(config)}let { children: content } = $props();\n</script>\n{@render content()}\n`,
      );
      const aliasedResult = validateApplyPlan(aliased);
      assert.equal(aliasedResult.ok, true, JSON.stringify(aliasedResult));
      if (aliasedResult.ok) {
        const outcome = applyPlan(aliasedResult.value);
        assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));
      }

      const slot = replaceLayout(
        plan,
        config.layoutFile,
        `<main><slot /></main>\n`,
      );
      const slotResult = validateApplyPlan(slot);
      // A legacy slot renders children but still needs the mapped imports, so
      // this stays an integration refusal, never a rendering refusal.
      assert.equal(slotResult.ok, false, JSON.stringify(slotResult));
      if (!slotResult.ok) {
        assert.ok(
          slotResult.issues.every(
            (entry) => entry.code !== "PROJECTED_LAYOUT_RENDERING_MISSING",
          ),
          JSON.stringify(slotResult.issues),
        );
      }
    });
  });
}

/** A real registry-backed `planAdd(button)` composed batch for one mapping. */
function buttonAdd(
  root: string,
  config: KitConfig,
): { readonly plan: ApplyPlanInput; readonly barrelPath: string } {
  const derived = deriveKitPaths(config);
  const registryRoot = mkdtempSync(
    path.join(os.tmpdir(), "suik-semantic-reg-"),
  );
  try {
    const registry = compoundRegistry(registryRoot, { includeCard: false });
    assert.equal(registry.ok, true, JSON.stringify(registry));
    if (!registry.ok) throw new Error("registry invalid");
    const paths = [
      `${derived.stateDir}/kit.json`,
      `${derived.stateDir}/kit.lock.json`,
      derived.rootExports,
      derived.kitCss,
      derived.themesCss,
      derived.appCss,
      config.layoutFile,
      ".gitignore",
      `${derived.rootExportsDir}/button.svelte`,
    ];
    const snapshot = captureSnapshot(root, paths);
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
    const composed = composeApplyPlan({
      root,
      config,
      writes: planned.value.writes,
      snapshot: snapshot.value,
    });
    assert.equal(composed.ok, true, JSON.stringify(composed));
    if (!composed.ok) throw new Error("compose failed");
    return { plan: composed.value, barrelPath: derived.rootExports };
  } finally {
    rmSync(registryRoot, { recursive: true, force: true });
  }
}

function replaceTarget(
  plan: ApplyPlanInput,
  targetPath: string,
  bytes: Uint8Array,
): ApplyPlanInput {
  return {
    ...plan,
    targets: plan.targets.map((target) =>
      target.path === targetPath ? { ...target, bytes } : target,
    ),
  };
}

for (const [label, config] of CONFIGS) {
  test(`[${label}] a real button add control validates and applies`, () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "suik-semantic-button-"));
    try {
      seed(root);
      const { plan } = buttonAdd(root, config);
      const validated = validateApplyPlan(plan);
      assert.equal(validated.ok, true, JSON.stringify(validated));
      if (!validated.ok) return;
      const outcome = applyPlan(validated.value);
      assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test(`[${label}] dropped and retargeted export cohorts are refused`, () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "suik-semantic-drop-"));
    try {
      seed(root);
      const { plan, barrelPath } = buttonAdd(root, config);
      const dropped = replaceTarget(
        plan,
        barrelPath,
        new TextEncoder().encode(
          "// svelte-ui-kit:start exports\n// svelte-ui-kit:end exports\n",
        ),
      );
      const droppedResult = validateApplyPlan(dropped);
      assert.equal(droppedResult.ok, false, JSON.stringify(droppedResult));
      if (!droppedResult.ok) {
        assert.ok(
          droppedResult.issues.some(
            (entry) => entry.code === "PROJECTED_EXPORTS_COHORT_MISSING",
          ),
          JSON.stringify(droppedResult.issues),
        );
      }

      const retargeted = replaceTarget(
        plan,
        barrelPath,
        new TextEncoder().encode(
          '// svelte-ui-kit:start exports\nexport { default as Button } from "./elsewhere.svelte";\n// svelte-ui-kit:end exports\n',
        ),
      );
      const retargetedResult = validateApplyPlan(retargeted);
      assert.equal(
        retargetedResult.ok,
        false,
        JSON.stringify(retargetedResult),
      );
      if (!retargetedResult.ok) {
        assert.ok(
          retargetedResult.issues.some(
            (entry) => entry.code === "PROJECTED_EXPORTS_COHORT_MISSING",
          ),
          JSON.stringify(retargetedResult.issues),
        );
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test(`[${label}] app-owned declarations outside the markers stay legitimate`, () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "suik-semantic-app-"));
    try {
      seed(root);
      const { plan, barrelPath } = buttonAdd(root, config);
      const baselineBarrel = plan.targets.find(
        (target) => target.path === barrelPath,
      );
      assert.ok(baselineBarrel, "the button add must plan the exports barrel");
      if (baselineBarrel === undefined) return;
      const decoder = new TextDecoder("utf-8");
      const withApp =
        decoder.decode(baselineBarrel.bytes) + "export const AppThing = 1;\n";
      const customized = replaceTarget(
        plan,
        barrelPath,
        new TextEncoder().encode(withApp),
      );
      const validated = validateApplyPlan(customized);
      assert.equal(validated.ok, true, JSON.stringify(validated));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test(`[${label}] an unchanged barrel is bound to its recorded baseline`, () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "suik-semantic-base-"));
    try {
      seed(root);
      const { plan, barrelPath } = buttonAdd(root, config);
      // A batch that does not write the barrel carries no new cohort authority;
      // the installed region must then still match its recorded baseline.
      const unchanged = { ...plan, exportAuthority: [] };
      assert.equal(validateApplyPlan(unchanged).ok, true, "canonical region");
      const emptied = replaceTarget(
        unchanged,
        barrelPath,
        new TextEncoder().encode(
          "// svelte-ui-kit:start exports\n// svelte-ui-kit:end exports\n",
        ),
      );
      const result = validateApplyPlan(emptied);
      assert.equal(result.ok, false, JSON.stringify(result));
      if (!result.ok) {
        assert.ok(
          result.issues.some(
            (entry) => entry.code === "PROJECTED_EXPORTS_BASELINE_MISMATCH",
          ),
          JSON.stringify(result.issues),
        );
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}
