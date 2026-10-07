import { capturePreimage } from "../../src/codegen/revalidate.js";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import type { ApplyPlanInput } from "../../src/codegen/apply.js";
import {
  captureReadset,
  captureReadFile,
} from "../../src/codegen/authority.js";
import { composeApplyPlan } from "../../src/codegen/compose.js";
import { planInit } from "../../src/codegen/plan-init.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import {
  deriveKitPaths,
  DEFAULT_KIT_CONFIG,
} from "../../src/project/config.js";
import type { KitConfig } from "../../src/project/config.js";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import { planMutations } from "../helpers/lifecycle-assertions.js";
import { makeGuardedPlan } from "../helpers/guarded-plan.js";
import { validKitConfigBytes } from "../helpers/kit-config.js";
import {
  assertTreeAfterMutations,
  snapshotTree,
} from "../helpers/tree-snapshot.js";

/**
 * RCLD04-R2-1/R2-2: strict structured validation and complete projected-batch
 * coherence at the guarded boundary.
 *
 * These cases reproduce the independent return-review probes on a real captured
 * production initialization plan: unknown plan/target/lock fields, a malformed
 * installed-resolution record that previously threw from canonical hashing, a
 * projected config write that disagrees with the published lock mapping, and a
 * lock integration whose projected file no longer exists. Every refusal is
 * typed, happens before coordination or writes, and leaves the selected tree
 * byte-identical.
 */

const PKG_ROOT = process.cwd();
const DEFAULT = DEFAULT_KIT_CONFIG;
const CUSTOM: KitConfig = {
  ...DEFAULT_KIT_CONFIG,
  uiDir: "app/ui",
  stylesDir: "assets/styles",
};

/** A deliberately mutable view of a captured plan for negative probes. */
interface MutablePlan {
  readset: ApplyPlanInput["readset"];
  targets: ApplyPlanInput["targets"];
  lock: ApplyPlanInput["lock"];
}

function write(root: string, rel: string, data: string | Uint8Array): void {
  const target = path.join(root, ...rel.split("/"));
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, data);
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

/** A real captured `planInit` -> `composeApplyPlan` batch for one mapping. */
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
    layoutSource: existsSync(path.join(root, config.layoutFile))
      ? readFileSync(path.join(root, config.layoutFile), "utf8")
      : "",
    snapshot: snapshot.value,
    registry: registry.value,
    configHash: "b".repeat(64),
  });
  assert.equal(planned.ok, true, JSON.stringify(planned));
  if (!planned.ok) throw new Error("plan failed");
  const composed = composeApplyPlan({
    root,
    config,
    writes:
      planned.value.writes.length > 0
        ? planned.value.writes
        : [
            {
              path: deriveKitPaths(config).stateDir + "/kit.lock.json",
              bytes: new TextEncoder().encode(
                JSON.stringify(planned.value.lock, null, 2) + "\n",
              ),
            },
          ],
    exportAuthority: planned.value.exportAuthority,
    snapshot: snapshot.value,
  });
  assert.equal(composed.ok, true, JSON.stringify(composed));
  if (!composed.ok) throw new Error("compose failed");
  return composed.value;
}

function withCapturedInit(
  config: KitConfig,
  body: (root: string, plan: ApplyPlanInput) => void,
): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-projected-"));
  try {
    seed(root);
    body(root, capturedInit(root, config));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/** Validate a mutated captured plan and prove a typed refusal with no effect. */
function assertRefusedWithoutEffect(
  root: string,
  plan: ApplyPlanInput,
  mutate: (plan: MutablePlan) => void,
  expectedCode: string,
): void {
  const mutated = {
    ...structuredClone(plan),
    exportAuthority: plan.exportAuthority,
  } as unknown as MutablePlan;
  mutate(mutated);
  const before = snapshotTree(root);
  const result = validateApplyPlan(mutated as unknown as ApplyPlanInput);
  assert.equal(result.ok, false, JSON.stringify(result));
  if (!result.ok) {
    assert.ok(
      result.issues.some((entry) => entry.code === expectedCode),
      `expected ${expectedCode} in ${JSON.stringify(result.issues)}`,
    );
  }
  assert.deepEqual(
    snapshotTree(root),
    before,
    "a refused projection must not create files, coordination or residue",
  );
  const derived = deriveKitPaths(DEFAULT);
  assert.equal(
    existsSync(path.join(root, derived.stateDir, ".svelte-ui-kit")),
    false,
  );
}

test("unknown plan, target and lock fields are typed refusals before hashing", () => {
  withCapturedInit(DEFAULT, (root, plan) => {
    assertRefusedWithoutEffect(
      root,
      plan,
      (value) => {
        (value as unknown as Record<string, unknown>).unapproved = true;
      },
      "PLAN_UNKNOWN_FIELD",
    );
    assertRefusedWithoutEffect(
      root,
      plan,
      (value) => {
        (value.targets[0] as unknown as Record<string, unknown>).unapproved =
          true;
      },
      "PLAN_TARGET_INVALID",
    );
    assertRefusedWithoutEffect(
      root,
      plan,
      (value) => {
        (value.lock as unknown as Record<string, unknown>).unapproved = true;
      },
      "PLAN_LOCK_INVALID",
    );
  });
});

test("malformed installed-resolution evidence is typed, never a thrown serializer error", () => {
  withCapturedInit(DEFAULT, (root, plan) => {
    const base = {
      name: "not-installed",
      kind: "absent" as const,
      path: null,
      realPath: null,
      digest: null,
      mode: null,
      device: null,
      inode: null,
      code: null,
    };
    // A missing required key previously reached canonical hashing as
    // `undefined` and threw a `ModelError` from digest serialization.
    assertRefusedWithoutEffect(
      root,
      plan,
      (value) => {
        const missingKey = { ...base } as Record<string, unknown>;
        delete missingKey.digest;
        value.readset = {
          ...value.readset,
          installed: [missingKey] as never,
        };
      },
      "PLAN_READSET_INVALID",
    );
    // An absent resolution carrying a non-null digest/mode/device/inode is
    // kind-inconsistent and must not validate as authority.
    assertRefusedWithoutEffect(
      root,
      plan,
      (value) => {
        value.readset = {
          ...value.readset,
          installed: [
            {
              ...base,
              digest: "a".repeat(64),
              mode: 0o644,
              device: 1,
              inode: 2,
            },
          ],
        };
      },
      "PLAN_READSET_INVALID",
    );
  });
});

test("positive controls: default and custom captured init plans validate and apply exactly", () => {
  for (const config of [DEFAULT, CUSTOM]) {
    const root = mkdtempSync(path.join(os.tmpdir(), "suik-projected-ok-"));
    try {
      seed(root);
      const plan = capturedInit(root, config);
      const before = snapshotTree(root);
      const validated = validateApplyPlan(plan);
      assert.equal(validated.ok, true, JSON.stringify(validated));
      if (!validated.ok) continue;
      const outcome = applyPlan(validated.value);
      assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));
      assertTreeAfterMutations(
        root,
        before,
        planMutations(validated.value, deriveKitPaths(config)),
      );
      const derived = deriveKitPaths(config);
      const configBytes = readFileSync(
        path.join(root, ...`${derived.stateDir}/kit.json`.split("/")),
      );
      const lock = JSON.parse(
        Buffer.from(validated.value.lock.bytes).toString("utf8"),
      ) as { configHash: string };
      assert.equal(lock.configHash, sha256Hex(configBytes));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

test("a projected config write that disagrees with the plan mapping is refused", () => {
  withCapturedInit(DEFAULT, (root, plan) => {
    assertRefusedWithoutEffect(
      root,
      plan,
      (value) => {
        const derived = deriveKitPaths(DEFAULT);
        const index = value.targets.findIndex(
          (entry) => entry.path === `${derived.stateDir}/kit.json`,
        );
        assert.ok(index >= 0, "the captured init must plan the config write");
        const target = value.targets[index];
        if (target === undefined) return;
        const config = JSON.parse(Buffer.from(target.bytes).toString("utf8"));
        config.uiDir = "other/ui";
        const bytes = new TextEncoder().encode(`${JSON.stringify(config)}\n`);
        value.targets = value.targets.map((entry, position) =>
          position === index ? { ...entry, bytes } : entry,
        );
      },
      "PROJECTED_CONFIG_MISMATCH",
    );
  });
});

test("a projected lock that names an absent integration or owned file is refused", () => {
  withCapturedInit(DEFAULT, (root, plan) => {
    // Remove the planned layout write while the lock still records a layout
    // integration for it: the published lock would describe a file that does
    // not exist.
    assertRefusedWithoutEffect(
      root,
      plan,
      (value) => {
        value.targets = value.targets.filter(
          (target) => target.path !== DEFAULT.layoutFile,
        );
      },
      "PROJECTED_INTEGRATION_MISSING",
    );
  });
});

test("a final lock whose configHash is not the projected config identity is refused", () => {
  withCapturedInit(DEFAULT, (root, plan) => {
    assertRefusedWithoutEffect(
      root,
      plan,
      (value) => {
        const lock = JSON.parse(
          Buffer.from(value.lock.bytes).toString("utf8"),
        ) as Record<string, unknown>;
        lock.configHash = "c".repeat(64);
        value.lock = {
          ...value.lock,
          bytes: new TextEncoder().encode(`${JSON.stringify(lock, null, 2)}\n`),
        };
      },
      "PROJECTED_CONFIG_HASH_MISMATCH",
    );
  });
});

test("a lock that owns a file absent from the projected tree is refused", () => {
  withCapturedInit(DEFAULT, (root, plan) => {
    assertRefusedWithoutEffect(
      root,
      plan,
      (value) => {
        const derived = deriveKitPaths(DEFAULT);
        const lock = JSON.parse(
          Buffer.from(value.lock.bytes).toString("utf8"),
        ) as {
          requested: string[];
          items: unknown[];
          files: unknown[];
        };
        lock.items.push({
          id: "button",
          version: "0.1.0",
          digest: sha256Hex("button"),
          origin: "explicit",
        });
        lock.requested.push("button");
        lock.files.push({
          path: `${derived.rootExportsDir}/ghost.svelte`,
          owner: "button",
          baseHash: sha256Hex("ghost"),
          itemVersion: "0.1.0",
          cohort: "core",
        });
        value.lock = {
          ...value.lock,
          bytes: new TextEncoder().encode(`${JSON.stringify(lock, null, 2)}\n`),
        };
      },
      "PROJECTED_OWNERSHIP_MISSING",
    );
  });
});

/** A canonical lock document for direct projection probes. */
function lockDoc(overrides: Record<string, unknown> = {}): Uint8Array {
  return new TextEncoder().encode(
    `${JSON.stringify(
      {
        schemaVersion: 1,
        toolVersion: "0.1.0",
        registryVersion: "0.1.0",
        registryHash: "a".repeat(64),
        configHash: "c".repeat(64),
        requested: [],
        items: [],
        files: [],
        cssBlocks: [],
        integrations: [],
        ...overrides,
      },
      null,
      2,
    )}\n`,
  );
}

/**
 * Compose and validate a real batch built from a captured snapshot, asserting
 * a typed refusal with an unchanged whole tree. Never a thrown serializer or
 * projection error.
 */
function assertComposedRefused(
  root: string,
  config: KitConfig,
  writes: { path: string; operation: "create" | "update"; bytes: Uint8Array }[],
  paths: string[],
  expectedCode: string,
): void {
  const snapshot = captureSnapshot(root, paths);
  assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
  if (!snapshot.ok) return;
  const derived = deriveKitPaths(config);
  const lockLogical = derived.stateDir + "/kit.lock.json";
  const publication = writes.find((entry) => entry.path === lockLogical);
  assert.ok(publication);
  if (!publication) return;
  const targets = writes.filter((entry) => entry.path !== lockLogical);
  const readset = captureReadset(
    root,
    writes.map((entry) => entry.path),
    paths.filter((p) => !writes.some((entry) => entry.path === p)),
  );
  assert.equal(readset.ok, true);
  if (!readset.ok) return;
  const before = snapshotTree(root);
  // Structural/projection diagnostics precede provenance checks. Negative raw
  // inputs can exercise those diagnostics but can never be applied.
  const result = validateApplyPlan({
    root,
    stateDir: derived.stateDir,
    uiDir: config.uiDir,
    stylesDir: config.stylesDir,
    layoutFile: config.layoutFile,
    rootIdentity: "a".repeat(64),
    planDigest: "b".repeat(64),
    readset: readset.value,
    targets: targets.map((entry) => ({
      ...entry,
      mode: 0o644,
      preimage: capturePreimage(root, entry.path),
    })),
    lock: {
      bytes: publication.bytes,
      preimage: capturePreimage(root, lockLogical),
    },
  });
  assert.equal(result.ok, false, JSON.stringify(result));
  if (!result.ok) {
    assert.ok(
      result.issues.some((entry) => entry.code === expectedCode),
      `expected ${expectedCode} in ${JSON.stringify(result.issues)}`,
    );
  }
  assert.deepEqual(
    snapshotTree(root),
    before,
    "a refused projection must leave the whole tree unchanged",
  );
}

test("a null or malformed target is a typed refusal, never a thrown projection error", () => {
  withCapturedInit(DEFAULT, (root, plan) => {
    // A bare null entry previously reached the projected-batch map and threw a
    // TypeError after the target loop had already recorded a typed issue.
    assertRefusedWithoutEffect(
      root,
      plan,
      (value) => {
        value.targets = [null as never];
      },
      "PLAN_TARGET_INVALID",
    );
    // A target whose bytes are missing is likewise typed before projection.
    assertRefusedWithoutEffect(
      root,
      plan,
      (value) => {
        const first = value.targets[0];
        if (first === undefined) return;
        value.targets = [{ ...first, bytes: undefined } as never];
      },
      "PLAN_TARGET_INVALID",
    );
  });
});

test("a batch that drops the projected config write is refused as incomplete authority", () => {
  withCapturedInit(DEFAULT, (root, plan) => {
    const derived = deriveKitPaths(DEFAULT);
    assertRefusedWithoutEffect(
      root,
      plan,
      (value) => {
        value.targets = value.targets.filter(
          (target) => target.path !== `${derived.stateDir}/kit.json`,
        );
      },
      "PROJECTED_CONFIG_MISSING",
    );
  });
});

test("a metadata-only batch cannot publish an arbitrary configHash over a captured config", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-projected-cfg-"));
  try {
    seed(root);
    const derived = deriveKitPaths(DEFAULT);
    const configPath = `${derived.stateDir}/kit.json`;
    const lockPath = `${derived.stateDir}/kit.lock.json`;
    const configBytes = validKitConfigBytes();
    write(root, configPath, configBytes);
    const paths = [configPath, lockPath, ".gitignore"];
    const wrong = lockDoc({ configHash: sha256Hex("not the config") });
    assertComposedRefused(
      root,
      DEFAULT,
      [
        {
          path: lockPath,
          operation: "create",
          bytes: wrong,
        },
      ],
      paths,
      "PROJECTED_CONFIG_HASH_MISMATCH",
    );
    // Positive control: the exact captured configuration identity validates.
    const good = capturedInit(root, DEFAULT);
    assert.equal(validateApplyPlan(good).ok, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a lock whose requested roots disagree with the projected config is refused", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-projected-req-"));
  try {
    seed(root);
    const derived = deriveKitPaths(DEFAULT);
    const configPath = `${derived.stateDir}/kit.json`;
    const lockPath = `${derived.stateDir}/kit.lock.json`;
    const configBytes = validKitConfigBytes({ requested: ["button"] });
    // The config write requests `button`; the lock silently drops it.
    assertComposedRefused(
      root,
      DEFAULT,
      [
        { path: configPath, operation: "create", bytes: configBytes },
        {
          path: lockPath,
          operation: "create",
          bytes: lockDoc({ configHash: sha256Hex(configBytes), requested: [] }),
        },
      ],
      [configPath, lockPath, ".gitignore"],
      "PROJECTED_REQUESTED_MISMATCH",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a managed foundation stylesheet without its tokens block is refused", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-projected-css-"));
  try {
    seed(root);
    const derived = deriveKitPaths(DEFAULT);
    const configPath = `${derived.stateDir}/kit.json`;
    const lockPath = `${derived.stateDir}/kit.lock.json`;
    const configBytes = validKitConfigBytes();
    // Projected stylesheet has no managed foundation tokens block while the
    // lock claims the contract; existence alone is not contract proof.
    assertComposedRefused(
      root,
      DEFAULT,
      [
        { path: configPath, operation: "create", bytes: configBytes },
        {
          path: derived.kitCss,
          operation: "create",
          bytes: new TextEncoder().encode("body { color: red; }\n"),
        },
        {
          path: lockPath,
          operation: "create",
          bytes: lockDoc({
            configHash: sha256Hex(configBytes),
            integrations: [
              {
                kind: "stylesheet",
                path: derived.kitCss,
                baseline: sha256Hex("tokens"),
                contract: "foundation-tokens-v1",
              },
            ],
          }),
        },
      ],
      [configPath, lockPath, derived.kitCss, ".gitignore"],
      "PROJECTED_FOUNDATION_MISSING",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a customized managed foundation still satisfies its contract", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-projected-css-ok-"));
  try {
    seed(root);
    const derived = deriveKitPaths(DEFAULT);
    const installed = validateApplyPlan(capturedInit(root, DEFAULT));
    assert.equal(installed.ok, true, JSON.stringify(installed));
    if (!installed.ok) return;
    assert.equal(applyPlan(installed.value).kind, "applied");
    write(
      root,
      derived.kitCss,
      "/* svelte-ui-kit:start tokens */\n@layer svelte-ui-kit.tokens;\n/* svelte-ui-kit:end tokens */\n.keep { color: blue; }\n",
    );
    const result = validateApplyPlan(capturedInit(root, DEFAULT));
    assert.equal(result.ok, true, JSON.stringify(result));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * RCLD04-R3 effective-content authority: a later captured pre-state read can
 * never shadow a planned target result. These reproduce the independent
 * return-review probes through the real captured planInit/compose/validate
 * production path.
 */

test("a token-free target result cannot be shadowed by authentic captured old CSS", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-effective-css-"));
  try {
    seed(root);
    const derived = deriveKitPaths(DEFAULT);
    write(root, derived.kitCss, "/* captured application CSS */\n");
    const original = capturedInit(root, DEFAULT);
    const corrupted: ApplyPlanInput = {
      ...original,
      targets: original.targets.map((target) =>
        target.path === derived.kitCss
          ? {
              ...target,
              bytes: new TextEncoder().encode("/* no foundation */\n"),
            }
          : target,
      ),
    };
    // Authentic pre-state evidence for the same path: it must not override the
    // planned token-free target result.
    const evidence = captureReadFile(root, derived.kitCss);
    assert.equal(evidence.ok, true, JSON.stringify(evidence));
    if (!evidence.ok) return;
    const withEvidence: ApplyPlanInput = {
      ...corrupted,
      readset: {
        ...corrupted.readset,
        files: [...corrupted.readset.files, evidence.value],
      },
    };
    assert.ok(
      (evidence.value.bytes as Uint8Array).byteLength > 0,
      "the captured pre-state must carry authentic bytes",
    );
    const before = snapshotTree(root);
    const result = validateApplyPlan(withEvidence);
    assert.equal(result.ok, false, JSON.stringify(result));
    if (!result.ok) {
      assert.ok(
        result.issues.some(
          (entry) => entry.code === "PROJECTED_FOUNDATION_MISSING",
        ),
        JSON.stringify(result.issues),
      );
    }
    assert.deepEqual(snapshotTree(root), before);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("legitimate captured CSS update resolves the planned result", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-effective-overlap-"));
  try {
    seed(root);
    const derived = deriveKitPaths(DEFAULT);
    write(
      root,
      derived.kitCss,
      "/* application CSS */\n.keep { color: blue; }\n",
    );
    const original = capturedInit(root, DEFAULT);
    const target = original.targets.find(
      (entry) => entry.path === derived.kitCss,
    );
    assert.equal(target?.operation, "update");
    const result = validateApplyPlan(original);
    assert.equal(result.ok, true, JSON.stringify(result));
    if (result.ok) assert.equal(applyPlan(result.value).kind, "applied");
    assert.match(
      readFileSync(path.join(root, derived.kitCss), "utf8"),
      /color: blue/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a comment-only layout replacement cannot claim layout-v1", () => {
  withCapturedInit(DEFAULT, (root, plan) => {
    assertRefusedWithoutEffect(
      root,
      plan,
      (value) => {
        const target = value.targets.find(
          (entry) => entry.path === DEFAULT.layoutFile,
        );
        assert.ok(target, "the captured init must plan the layout");
        if (target === undefined) return;
        value.targets = value.targets.map((entry) =>
          entry.path === DEFAULT.layoutFile
            ? {
                ...entry,
                bytes: new TextEncoder().encode(
                  "<!-- no rendering or style integration -->\n",
                ),
              }
            : entry,
        );
      },
      "PROJECTED_LAYOUT_INTEGRATION_MISSING",
    );
  });
});

test("invalid TypeScript cannot claim exports-v1 through path presence", () => {
  withCapturedInit(DEFAULT, (root, plan) => {
    const derived = deriveKitPaths(DEFAULT);
    assertRefusedWithoutEffect(
      root,
      plan,
      (value) => {
        const target = value.targets.find(
          (entry) => entry.path === derived.rootExports,
        );
        assert.ok(target, "the captured init must plan the exports barrel");
        if (target === undefined) return;
        value.targets = value.targets.map((entry) =>
          entry.path === derived.rootExports
            ? {
                ...entry,
                bytes: new TextEncoder().encode("not typescript at all\n"),
              }
            : entry,
        );
      },
      "PROJECTED_EXPORTS_INVALID",
    );
  });
});

test("customized mapped layout/export forms still satisfy their contracts", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-effective-custom-"));
  try {
    seed(root);
    const derived = deriveKitPaths(DEFAULT);
    write(
      root,
      DEFAULT.layoutFile,
      '<script>let { children } = $props();</script>\n<main class="shell">{@render children()}</main>\n',
    );
    write(root, derived.rootExports, "export const AppThing = 1;\n");
    const result = validateApplyPlan(capturedInit(root, DEFAULT));
    assert.equal(result.ok, true, JSON.stringify(result));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the sealed plan isolates and binds captured authority bytes", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-effective-seal-"));
  try {
    const plan = makeGuardedPlan(root);
    const validated = validateApplyPlan(plan);
    assert.equal(validated.ok, true, JSON.stringify(validated));
    if (!validated.ok) return;
    const callerFile = plan.readset.files.find(
      (file) => file.bytes instanceof Uint8Array,
    );
    const sealedFile = validated.value.readset.files.find(
      (file) => file.bytes instanceof Uint8Array,
    );
    assert.ok(callerFile !== undefined && sealedFile !== undefined);
    if (callerFile === undefined || sealedFile === undefined) return;
    const callerBytes = callerFile.bytes as Uint8Array;
    const sealedBytes = sealedFile.bytes as Uint8Array;
    // Distinct buffers: the seal owns an isolated copy.
    assert.notStrictEqual(callerBytes, sealedBytes);
    const sealedBefore = new Uint8Array(sealedBytes);
    callerBytes[0] = (callerBytes[0] as number) ^ 0xff;
    assert.deepEqual(
      new Uint8Array(sealedBytes),
      sealedBefore,
      "mutating the caller's buffer after sealing must not change the sealed authority",
    );
    // The seal binds the bytes: mutating the sealed buffer is detected.
    sealedBytes[0] = (sealedBytes[0] as number) ^ 0xff;
    const outcome = applyPlan(validated.value);
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some((entry) => entry.code === "PLAN_AUTHORITY_STALE"),
      JSON.stringify(outcome.issues),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
