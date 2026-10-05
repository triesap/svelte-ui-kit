import assert from "node:assert/strict";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import { composeApplyPlan } from "../../src/codegen/compose.js";
import { planInit } from "../../src/codegen/plan-init.js";
import {
  captureSnapshot,
  type ProjectSnapshot,
} from "../../src/codegen/snapshot.js";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
  type KitConfig,
} from "../../src/project/config.js";
import type { PlanWrite } from "../../src/codegen/plan.js";
import { planMutations } from "../helpers/lifecycle-assertions.js";
import {
  assertTreeAfterMutations,
  snapshotTree,
} from "../helpers/tree-snapshot.js";

/**
 * RCLD04-R2-1: composition carries the original immutable planning authority.
 *
 * A real bundled-registry init plan is composed from the captured snapshot, not
 * from a live recapture. A post-planning user edit to the layout therefore
 * makes the plan stale and the guarded apply refuses it, preserving the edit.
 */

const PKG_ROOT = process.cwd();
const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function write(root: string, rel: string, data: string): void {
  const abs = path.join(root, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, data);
}

function planRealInit(root: string, layoutSource: string) {
  const registry = loadRegistrySnapshot(createAssetProvider(PKG_ROOT));
  assert.equal(registry.ok, true, JSON.stringify(registry));
  if (!registry.ok) throw new Error("registry invalid");
  const paths = [
    ...Object.values(derived).filter(
      (value): value is string => typeof value === "string",
    ),
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    DEFAULT_KIT_CONFIG.layoutFile,
    ".gitignore",
  ];
  const snapshot = captureSnapshot(root, paths);
  assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
  if (!snapshot.ok) throw new Error("snapshot failed");
  const planned = planInit({
    config: DEFAULT_KIT_CONFIG,
    layoutFile: DEFAULT_KIT_CONFIG.layoutFile,
    layoutSource,
    snapshot: snapshot.value,
    registry: registry.value,
    configHash: "b".repeat(64),
  });
  assert.equal(planned.ok, true, JSON.stringify(planned));
  if (!planned.ok) throw new Error("plan failed");
  return { snapshot: snapshot.value, writes: planned.value.writes };
}

test("a post-planning layout edit is refused rather than blessed as a preimage", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-compose-authority-"));
  try {
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
    const original =
      "<script>let original = 1;</script>\n{@render children()}\n";
    write(root, DEFAULT_KIT_CONFIG.layoutFile, original);

    const { snapshot, writes } = planRealInit(root, original);
    const edited = "<h1>USER EDIT AFTER PLAN</h1>\n";
    write(root, DEFAULT_KIT_CONFIG.layoutFile, edited);

    const composed = composeApplyPlan({
      root,
      config: DEFAULT_KIT_CONFIG,
      writes,
      snapshot,
    });
    assert.equal(composed.ok, true, JSON.stringify(composed));
    if (!composed.ok) return;
    const validated = validateApplyPlan(composed.value);
    assert.equal(validated.ok, true, JSON.stringify(validated));
    if (!validated.ok) return;
    const outcome = applyPlan(validated.value);
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some((issue) => issue.code === "STALE_PLAN"),
      JSON.stringify(outcome.issues),
    );
    assert.equal(
      readFileSync(path.join(root, DEFAULT_KIT_CONFIG.layoutFile), "utf8"),
      edited,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a post-planning manifest dependency change is refused from captured environment evidence", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-compose-env-"));
  try {
    const manifest = {
      name: "consumer",
      type: "module",
      dependencies: {
        svelte: "5.57.1",
        "@sveltejs/kit": "2.70.3",
        "bits-ui": "2.19.3",
        "@internationalized/date": "3.12.4",
      },
    };
    write(root, "package.json", JSON.stringify(manifest));
    const original =
      "<script>let original = 1;</script>\n{@render children()}\n";
    write(root, DEFAULT_KIT_CONFIG.layoutFile, original);

    const { snapshot, writes } = planRealInit(root, original);
    // A dependency declaration change after planning must be carried as stale
    // manifest evidence, not silently omitted from the apply read set.
    write(
      root,
      "package.json",
      JSON.stringify({
        ...manifest,
        dependencies: { ...manifest.dependencies, svelte: "4.2.0" },
      }),
    );

    const composed = composeApplyPlan({
      root,
      config: DEFAULT_KIT_CONFIG,
      writes,
      snapshot,
    });
    assert.equal(composed.ok, true, JSON.stringify(composed));
    if (!composed.ok) return;
    assert.ok(
      composed.value.readset.files.some(
        (file) => file.path === "package.json" && file.kind === "file",
      ),
      "the manifest must be carried into the read set",
    );
    const validated = validateApplyPlan(composed.value);
    assert.equal(validated.ok, true, JSON.stringify(validated));
    if (!validated.ok) return;
    const outcome = applyPlan(validated.value);
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some((issue) => issue.code === "AUTHORITY_READ_CHANGED"),
      JSON.stringify(outcome.issues),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("composing without the original snapshot is a typed refusal", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-compose-nosnap-"));
  try {
    const writes: PlanWrite[] = [
      {
        path: `${derived.stateDir}/kit.lock.json`,
        operation: "update",
        bytes: utf8("{}"),
      },
    ];
    const composed = composeApplyPlan({
      root,
      config: DEFAULT_KIT_CONFIG,
      writes,
      snapshot: undefined as never,
    });
    assert.equal(composed.ok, false);
    if (!composed.ok) {
      assert.equal(composed.issues[0].code, "COMPOSE_SNAPSHOT_REQUIRED");
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

const INSTALLED_MANIFEST = {
  name: "consumer",
  type: "module",
  dependencies: {
    svelte: "5.57.1",
    "@sveltejs/kit": "2.70.3",
    "bits-ui": "2.19.3",
    "@internationalized/date": "3.12.4",
  },
};

function writeInstalledDependencies(root: string): void {
  write(root, "package.json", JSON.stringify(INSTALLED_MANIFEST));
  for (const [name, version] of Object.entries(
    INSTALLED_MANIFEST.dependencies,
  )) {
    write(
      root,
      `node_modules/${name}/package.json`,
      JSON.stringify({ name, version }),
    );
  }
}

test("a guarded init plans and applies the managed ignore entry", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-compose-ignore-"));
  try {
    writeInstalledDependencies(root);
    write(root, ".gitignore", "node_modules/\n# keep me\n");
    const original =
      "<script>let original = 1;</script>\n{@render children()}\n";
    write(root, DEFAULT_KIT_CONFIG.layoutFile, original);

    const { snapshot, writes } = planRealInit(root, original);
    const composed = composeApplyPlan({
      root,
      config: DEFAULT_KIT_CONFIG,
      writes,
      snapshot,
    });
    assert.equal(composed.ok, true, JSON.stringify(composed));
    if (!composed.ok) return;
    assert.ok(
      composed.value.targets.some((target) => target.path === ".gitignore"),
      JSON.stringify(composed.value.targets.map((t) => t.path)),
    );
    assert.deepEqual(composed.value.ignoreFiles, [".gitignore"]);

    const validated = validateApplyPlan(composed.value);
    assert.equal(validated.ok, true, JSON.stringify(validated));
    if (!validated.ok) return;
    const outcome = applyPlan(validated.value);
    assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));

    const ignore = readFileSync(path.join(root, ".gitignore"), "utf8");
    assert.ok(ignore.startsWith("node_modules/\n# keep me\n"), ignore);
    assert.ok(ignore.includes(`${derived.stateDir}/.svelte-ui-kit/`), ignore);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a post-planning installed-package metadata change is refused", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-compose-installed-"));
  try {
    writeInstalledDependencies(root);
    const original =
      "<script>let original = 1;</script>\n{@render children()}\n";
    write(root, DEFAULT_KIT_CONFIG.layoutFile, original);

    const { snapshot, writes } = planRealInit(root, original);
    // The resolved installed manifest is captured as physical integrity
    // evidence alongside the selected manifest and manager lockfiles.
    assert.ok(
      snapshot.environment.evidence.some(
        (entry) =>
          entry.path === "node_modules/svelte/package.json" &&
          entry.kind === "file",
      ),
      "the resolved installed manifest must be captured as evidence",
    );

    // A post-planning installed metadata change (Svelte downgraded) must be a
    // stale-authority refusal, never silently applied.
    write(
      root,
      "node_modules/svelte/package.json",
      JSON.stringify({ name: "svelte", version: "4.2.0" }),
    );

    const composed = composeApplyPlan({
      root,
      config: DEFAULT_KIT_CONFIG,
      writes,
      snapshot,
    });
    assert.equal(composed.ok, true, JSON.stringify(composed));
    if (!composed.ok) return;
    const validated = validateApplyPlan(composed.value);
    assert.equal(validated.ok, true, JSON.stringify(validated));
    if (!validated.ok) return;
    const outcome = applyPlan(validated.value);
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some((issue) => issue.code === "AUTHORITY_READ_CHANGED"),
      JSON.stringify(outcome.issues),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Installed-resolution authority through the production capture/plan/compose/
// validate/apply path (RCLD04-R2-1).
// ---------------------------------------------------------------------------

const AUTHORITY_CONFIGS: readonly (readonly [string, KitConfig])[] = [
  ["default", DEFAULT_KIT_CONFIG],
  [
    "custom",
    { ...DEFAULT_KIT_CONFIG, uiDir: "app/ui", stylesDir: "assets/styles" },
  ],
];

const SVELTE_MANIFEST = JSON.stringify({ name: "svelte", version: "5.57.1" });

function seedAuthorityConsumer(root: string): void {
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

function authorityInitPaths(config: KitConfig): string[] {
  const d = deriveKitPaths(config);
  return [
    `${d.stateDir}/kit.json`,
    `${d.stateDir}/kit.lock.json`,
    d.rootExports,
    d.kitCss,
    d.themesCss,
    d.appCss,
    config.layoutFile,
    ".gitignore",
  ];
}

function planAuthorityInit(root: string, config: KitConfig) {
  const registry = loadRegistrySnapshot(createAssetProvider(PKG_ROOT));
  assert.equal(registry.ok, true, JSON.stringify(registry));
  if (!registry.ok) throw new Error("registry invalid");
  const snapshot = captureSnapshot(root, authorityInitPaths(config));
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
  assert.ok(
    planned.value.writes.length > 0,
    "a fresh init plan must carry executable writes",
  );
  return { snapshot: snapshot.value, writes: planned.value.writes };
}

function applyAuthority(
  root: string,
  config: KitConfig,
  snapshot: ProjectSnapshot,
  writes: readonly PlanWrite[],
) {
  const composed = composeApplyPlan({ root, config, writes, snapshot });
  assert.equal(composed.ok, true, JSON.stringify(composed));
  if (!composed.ok) throw new Error("compose failed");
  const validated = validateApplyPlan(composed.value);
  assert.equal(validated.ok, true, JSON.stringify(validated));
  if (!validated.ok) throw new Error("validate failed");
  const outcome = applyPlan(validated.value);
  return { composed: composed.value, plan: validated.value, outcome };
}

/**
 * Apply a plan that must be refused by installed-resolution authority, then
 * prove the selected root is byte-for-byte as planned against and every named
 * external dependency tree is untouched. The refusal is proven by the exact
 * typed code, not a broad outcome.
 */
function assertAuthorityRefusal(
  root: string,
  config: KitConfig,
  snapshot: ProjectSnapshot,
  writes: readonly PlanWrite[],
  externalRoots: readonly string[] = [],
): void {
  const rootBefore = snapshotTree(root);
  const externalBefore = externalRoots.map(
    (external) => [external, snapshotTree(external)] as const,
  );
  const { outcome } = applyAuthority(root, config, snapshot, writes);
  assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
  assert.ok(
    outcome.issues.some(
      (entry) => entry.code === "AUTHORITY_INSTALLED_CHANGED",
    ),
    JSON.stringify(outcome.issues),
  );
  assert.deepEqual(
    snapshotTree(root),
    rootBefore,
    "a refused installed-resolution drift must preserve the selected root exactly",
  );
  for (const [external, before] of externalBefore) {
    assert.deepEqual(
      snapshotTree(external),
      before,
      `external dependency tree ${external} must remain read-only`,
    );
  }
}

for (const [label, config] of AUTHORITY_CONFIGS) {
  test(`${label}: unchanged direct, hoisted and package-linked installs apply`, () => {
    // ---- direct: root/node_modules/<name>/package.json ---------------------
    {
      const base = mkdtempSync(path.join(os.tmpdir(), "suik-auth-direct-"));
      try {
        const root = path.join(base, "consumer");
        mkdirSync(root, { recursive: true });
        seedAuthorityConsumer(root);
        write(root, "node_modules/svelte/package.json", SVELTE_MANIFEST);
        const { snapshot, writes } = planAuthorityInit(root, config);
        const before = snapshotTree(root);
        const { plan, outcome } = applyAuthority(
          root,
          config,
          snapshot,
          writes,
        );
        assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));
        assertTreeAfterMutations(
          root,
          before,
          planMutations(plan, deriveKitPaths(config)),
        );
      } finally {
        rmSync(base, { recursive: true, force: true });
      }
    }

    // ---- ancestor-hoisted: ../node_modules/<name>/package.json -------------
    {
      const base = mkdtempSync(path.join(os.tmpdir(), "suik-auth-hoist-"));
      try {
        const root = path.join(base, "consumer");
        mkdirSync(root, { recursive: true });
        seedAuthorityConsumer(root);
        write(base, "node_modules/svelte/package.json", SVELTE_MANIFEST);
        const { snapshot, writes } = planAuthorityInit(root, config);
        const external = path.join(base, "node_modules");
        const externalBefore = snapshotTree(external);
        const before = snapshotTree(root);
        const { plan, outcome } = applyAuthority(
          root,
          config,
          snapshot,
          writes,
        );
        assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));
        assertTreeAfterMutations(
          root,
          before,
          planMutations(plan, deriveKitPaths(config)),
        );
        assert.deepEqual(
          snapshotTree(external),
          externalBefore,
          "hoisted dependency tree must stay read-only",
        );
      } finally {
        rmSync(base, { recursive: true, force: true });
      }
    }

    // ---- package-directory-linked: node_modules/<name> -> store/<name> -----
    {
      const base = mkdtempSync(path.join(os.tmpdir(), "suik-auth-link-"));
      try {
        const root = path.join(base, "consumer");
        mkdirSync(root, { recursive: true });
        seedAuthorityConsumer(root);
        const store = path.join(base, "store", "svelte");
        write(base, "store/svelte/package.json", SVELTE_MANIFEST);
        mkdirSync(path.join(root, "node_modules"), { recursive: true });
        symlinkSync(store, path.join(root, "node_modules", "svelte"), "dir");
        const { snapshot, writes } = planAuthorityInit(root, config);
        const externalBefore = snapshotTree(path.join(base, "store"));
        const before = snapshotTree(root);
        const { plan, outcome } = applyAuthority(
          root,
          config,
          snapshot,
          writes,
        );
        assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));
        assertTreeAfterMutations(
          root,
          before,
          planMutations(plan, deriveKitPaths(config)),
        );
        assert.deepEqual(
          snapshotTree(path.join(base, "store")),
          externalBefore,
          "linked dependency store must stay read-only",
        );
      } finally {
        rmSync(base, { recursive: true, force: true });
      }
    }
  });

  test(`${label}: a post-planning nearer shadow is refused with preserved trees`, () => {
    const base = mkdtempSync(path.join(os.tmpdir(), "suik-auth-shadow-"));
    try {
      const root = path.join(base, "consumer");
      mkdirSync(root, { recursive: true });
      seedAuthorityConsumer(root);
      write(base, "node_modules/svelte/package.json", SVELTE_MANIFEST);
      const { snapshot, writes } = planAuthorityInit(root, config);
      // A nearer incompatible install appears after planning.
      write(
        root,
        "node_modules/svelte/package.json",
        JSON.stringify({ name: "svelte", version: "4.2.0" }),
      );
      assertAuthorityRefusal(root, config, snapshot, writes, [
        path.join(base, "node_modules"),
      ]);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test(`${label}: hoisted byte, mode and physical manifest replacement are refused`, () => {
    for (const kind of ["bytes", "mode", "physical"] as const) {
      const base = mkdtempSync(
        path.join(os.tmpdir(), "suik-auth-hoist-drift-"),
      );
      try {
        const root = path.join(base, "consumer");
        mkdirSync(root, { recursive: true });
        seedAuthorityConsumer(root);
        const manifest = path.join(
          base,
          "node_modules",
          "svelte",
          "package.json",
        );
        write(base, "node_modules/svelte/package.json", SVELTE_MANIFEST);
        const { snapshot, writes } = planAuthorityInit(root, config);
        if (kind === "bytes") {
          writeFileSync(
            manifest,
            JSON.stringify({ name: "svelte", version: "4.2.0" }),
          );
        } else if (kind === "mode") {
          chmodSync(manifest, 0o600);
        } else {
          rmSync(manifest);
          writeFileSync(manifest, SVELTE_MANIFEST);
        }
        assertAuthorityRefusal(root, config, snapshot, writes, [
          path.join(base, "node_modules"),
        ]);
      } finally {
        rmSync(base, { recursive: true, force: true });
      }
    }
  });

  test(`${label}: same-byte package-link retargeting is refused`, () => {
    const base = mkdtempSync(path.join(os.tmpdir(), "suik-auth-retarget-"));
    try {
      const root = path.join(base, "consumer");
      mkdirSync(root, { recursive: true });
      seedAuthorityConsumer(root);
      write(base, "store/a/package.json", SVELTE_MANIFEST);
      write(base, "store/b/package.json", SVELTE_MANIFEST);
      mkdirSync(path.join(root, "node_modules"), { recursive: true });
      const link = path.join(root, "node_modules", "svelte");
      symlinkSync(path.join(base, "store", "a"), link, "dir");
      const { snapshot, writes } = planAuthorityInit(root, config);
      unlinkSync(link);
      symlinkSync(path.join(base, "store", "b"), link, "dir");
      assertAuthorityRefusal(root, config, snapshot, writes, [
        path.join(base, "store"),
      ]);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test(`${label}: captured absence followed by appearance is refused`, () => {
    const base = mkdtempSync(path.join(os.tmpdir(), "suik-auth-absent-"));
    try {
      const root = path.join(base, "consumer");
      mkdirSync(root, { recursive: true });
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
            "suik-resolution-probe": "1.0.0",
          },
        }),
      );
      const { snapshot, writes } = planAuthorityInit(root, config);
      const captured = snapshot.environment.installedResolution.find(
        (entry) => entry.name === "suik-resolution-probe",
      );
      assert.ok(captured, "the declared absent dependency must be captured");
      assert.equal(captured?.kind, "absent");
      write(
        root,
        "node_modules/suik-resolution-probe/package.json",
        JSON.stringify({ name: "suik-resolution-probe", version: "1.0.0" }),
      );
      assertAuthorityRefusal(root, config, snapshot, writes);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test(`${label}: an unsafe final manifest entry is refused, not read as absence`, () => {
    const base = mkdtempSync(path.join(os.tmpdir(), "suik-auth-unsafe-"));
    try {
      const root = path.join(base, "consumer");
      mkdirSync(root, { recursive: true });
      seedAuthorityConsumer(root);
      write(base, "store/package.json", SVELTE_MANIFEST);
      mkdirSync(path.join(root, "node_modules", "svelte"), { recursive: true });
      symlinkSync(
        path.join(base, "store", "package.json"),
        path.join(root, "node_modules", "svelte", "package.json"),
      );
      const { snapshot, writes } = planAuthorityInit(root, config);
      const captured = snapshot.environment.installedResolution.find(
        (entry) => entry.name === "svelte",
      );
      assert.equal(captured?.kind, "unsafe");
      assertAuthorityRefusal(root, config, snapshot, writes, [
        path.join(base, "store"),
      ]);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test(`${label}: an unreadable/incomplete enumeration is distinct from absence and refused`, () => {
    const base = mkdtempSync(path.join(os.tmpdir(), "suik-auth-unreadable-"));
    try {
      const root = path.join(base, "consumer");
      mkdirSync(root, { recursive: true });
      seedAuthorityConsumer(root);
      // A regular file where the resolution context expects a directory makes
      // every lookup fail with ENOTDIR deterministically: the enumeration is
      // incomplete and the declared name is unreadable, never a proven absence.
      writeFileSync(path.join(root, "node_modules"), "not a directory\n");
      const { snapshot, writes } = planAuthorityInit(root, config);
      const captured = snapshot.environment.installedResolution.find(
        (entry) => entry.name === "svelte",
      );
      assert.equal(captured?.kind, "unreadable");
      assert.equal(snapshot.environment.enumerationComplete, false);
      const rootBefore = snapshotTree(root);
      const { composed, outcome } = applyAuthority(
        root,
        config,
        snapshot,
        writes,
      );
      const composedEntry = composed.readset.installed?.find(
        (entry) => entry.name === "svelte",
      );
      assert.equal(composedEntry?.kind, "unreadable");
      assert.notEqual(composedEntry?.kind, "absent");
      assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
      assert.ok(
        outcome.issues.some(
          (entry) => entry.code === "AUTHORITY_INSTALLED_CHANGED",
        ),
        JSON.stringify(outcome.issues),
      );
      assert.deepEqual(
        snapshotTree(root),
        rootBefore,
        "an unreadable/incomplete enumeration refusal must preserve the selected root exactly",
      );
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
}
