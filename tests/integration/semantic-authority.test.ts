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
} from "../../src/project/config.js";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import { compoundRegistry } from "../helpers/multi-item-fixture.js";

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
 * controls.
 */

const PKG_ROOT = process.cwd();
const DEFAULT = DEFAULT_KIT_CONFIG;

function write(root: string, rel: string, data: string | Uint8Array): void {
  const target = path.join(root, ...rel.split("/"));
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, data);
}

function initPaths(): string[] {
  const derived = deriveKitPaths(DEFAULT);
  return [
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    derived.rootExports,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    DEFAULT.layoutFile,
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

/** A real captured `planInit` -> `composeApplyPlan` batch for the default mapping. */
function capturedInit(root: string): ApplyPlanInput {
  const registry = loadRegistrySnapshot(createAssetProvider(PKG_ROOT));
  assert.equal(registry.ok, true, JSON.stringify(registry));
  if (!registry.ok) throw new Error("registry invalid");
  const snapshot = captureSnapshot(root, initPaths());
  assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
  if (!snapshot.ok) throw new Error("snapshot failed");
  const planned = planInit({
    config: DEFAULT,
    layoutFile: DEFAULT.layoutFile,
    layoutSource: "",
    snapshot: snapshot.value,
    registry: registry.value,
    configHash: "b".repeat(64),
  });
  assert.equal(planned.ok, true, JSON.stringify(planned));
  if (!planned.ok) throw new Error("plan failed");
  const composed = composeApplyPlan({
    root,
    config: DEFAULT,
    writes: planned.value.writes,
    snapshot: snapshot.value,
  });
  assert.equal(composed.ok, true, JSON.stringify(composed));
  if (!composed.ok) throw new Error("compose failed");
  return composed.value;
}

function replaceLayout(plan: ApplyPlanInput, source: string): ApplyPlanInput {
  const bytes = new TextEncoder().encode(source);
  return {
    ...plan,
    targets: plan.targets.map((target) =>
      target.path === DEFAULT.layoutFile ? { ...target, bytes } : target,
    ),
  };
}

const IMPORTS =
  'import "../styles/kit.css";\nimport "../styles/themes.css";\nimport "../styles/app.css";\n';

function withCapturedInit(
  body: (root: string, plan: ApplyPlanInput) => void,
): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-semantic-"));
  try {
    seed(root);
    body(root, capturedInit(root));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("child rendering only inside an HTML comment is refused", () => {
  withCapturedInit((_root, plan) => {
    const edited = replaceLayout(
      plan,
      `<script>\n${IMPORTS}let { children } = $props();\n</script>\n<!-- {@render children()} -->\n`,
    );
    const result = validateApplyPlan(edited);
    assert.equal(result.ok, false, JSON.stringify(result));
    if (!result.ok) {
      assert.ok(
        result.issues.some(
          (entry) => entry.code === "PROJECTED_LAYOUT_RENDERING_MISSING",
        ),
        JSON.stringify(result.issues),
      );
    }
  });
});

test("stylesheet imports only inside a script comment are refused", () => {
  withCapturedInit((_root, plan) => {
    const edited = replaceLayout(
      plan,
      `<script>\n/*\n${IMPORTS}*/\nlet { children } = $props();\n</script>\n{@render children()}\n`,
    );
    const result = validateApplyPlan(edited);
    assert.equal(result.ok, false, JSON.stringify(result));
    if (!result.ok) {
      assert.ok(
        result.issues.some(
          (entry) => entry.code === "PROJECTED_LAYOUT_INTEGRATION_MISSING",
        ),
        JSON.stringify(result.issues),
      );
    }
  });
});

test("an unrelated render call is not child-rendering proof", () => {
  withCapturedInit((_root, plan) => {
    const edited = replaceLayout(
      plan,
      `<script>\n${IMPORTS}let { children, other } = $props();\n</script>\n{@render other()}\n`,
    );
    const result = validateApplyPlan(edited);
    assert.equal(result.ok, false, JSON.stringify(result));
    if (!result.ok) {
      assert.ok(
        result.issues.some(
          (entry) => entry.code === "PROJECTED_LAYOUT_RENDERING_MISSING",
        ),
        JSON.stringify(result.issues),
      );
    }
  });
});

test("a destructuring-aliased children render is accepted", () => {
  withCapturedInit((_root, plan) => {
    const edited = replaceLayout(
      plan,
      `<script>\n${IMPORTS}let { children: content } = $props();\n</script>\n{@render content()}\n`,
    );
    const result = validateApplyPlan(edited);
    assert.equal(result.ok, true, JSON.stringify(result));
    if (!result.ok) return;
    const outcome = applyPlan(result.value);
    assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));
  });
});

test("a direct declared children render and a legacy slot are accepted", () => {
  withCapturedInit((_root, plan) => {
    const direct = replaceLayout(
      plan,
      `<script>\n${IMPORTS}let { children } = $props();\n</script>\n{@render children()}\n`,
    );
    assert.equal(validateApplyPlan(direct).ok, true);
    const slot = replaceLayout(plan, `<main><slot /></main>\n`);
    const slotResult = validateApplyPlan(slot);
    // The legacy slot renders children but still needs the mapped imports, so
    // this remains an integration refusal, never a rendering refusal.
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

/** A real registry-backed `planAdd(button)` composed batch. */
function buttonAdd(root: string): {
  readonly plan: ApplyPlanInput;
  readonly barrelPath: string;
} {
  const derived = deriveKitPaths(DEFAULT);
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
      DEFAULT.layoutFile,
      ".gitignore",
      `${derived.rootExportsDir}/button.svelte`,
    ];
    const snapshot = captureSnapshot(root, paths);
    assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
    if (!snapshot.ok) throw new Error("snapshot failed");
    const planned = planAdd({
      registry: registry.value,
      config: DEFAULT,
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
      config: DEFAULT,
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

test("a real button add control validates and applies", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-semantic-button-"));
  try {
    seed(root);
    const { plan } = buttonAdd(root);
    const validated = validateApplyPlan(plan);
    assert.equal(validated.ok, true, JSON.stringify(validated));
    if (!validated.ok) return;
    const outcome = applyPlan(validated.value);
    assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a barrel that drops its declared export cohort is refused", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-semantic-drop-"));
  try {
    seed(root);
    const { plan, barrelPath } = buttonAdd(root);
    const dropped = replaceTarget(
      plan,
      barrelPath,
      new TextEncoder().encode(
        "// svelte-ui-kit:start exports\n// svelte-ui-kit:end exports\n",
      ),
    );
    const validated = validateApplyPlan(dropped);
    assert.equal(validated.ok, false, JSON.stringify(validated));
    if (!validated.ok) {
      assert.ok(
        validated.issues.some(
          (entry) => entry.code === "PROJECTED_EXPORTS_COHORT_MISSING",
        ),
        JSON.stringify(validated.issues),
      );
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a retargeted declared export is refused", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-semantic-retarget-"));
  try {
    seed(root);
    const { plan, barrelPath } = buttonAdd(root);
    const retargeted = replaceTarget(
      plan,
      barrelPath,
      new TextEncoder().encode(
        '// svelte-ui-kit:start exports\nexport { default as Button } from "./elsewhere.svelte";\n// svelte-ui-kit:end exports\n',
      ),
    );
    const validated = validateApplyPlan(retargeted);
    assert.equal(validated.ok, false, JSON.stringify(validated));
    if (!validated.ok) {
      assert.ok(
        validated.issues.some(
          (entry) => entry.code === "PROJECTED_EXPORTS_COHORT_MISSING",
        ),
        JSON.stringify(validated.issues),
      );
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("app-owned declarations outside the markers stay legitimate", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-semantic-app-"));
  try {
    seed(root);
    const { plan, barrelPath } = buttonAdd(root);
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
