import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { hashBytes } from "../../src/codegen/compare.js";
import { planAdd } from "../../src/codegen/plan-add.js";
import { planInit } from "../../src/codegen/plan-init.js";
import { toPlanningEnvelope } from "../../src/codegen/plan.js";
import { planSync } from "../../src/codegen/plan-sync.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { createTempProject } from "../helpers/project.js";
import { componentItem, registryOf } from "../helpers/registry.js";

/**
 * RCLD03-R4 composed planner tests: one validated planning entry, complete
 * minimal effects, ownership/cohort enforcement, truthful integration lineage
 * and explicit retirement operations.
 *
 * These tests use the production planners and immutable snapshots; they assert
 * executable results and apply the planned operations to an owned disposable
 * consumer rather than only inspecting helper strings.
 */

const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);
const CONFIG = DEFAULT_KIT_CONFIG;

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function targetPaths(): string[] {
  return [
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    derived.rootExports,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    CONFIG.layoutFile,
    `${derived.rootExportsDir}/button.svelte`,
  ];
}

function snapshotOf(
  project: ReturnType<typeof createTempProject>,
  paths: readonly string[] = targetPaths(),
) {
  const result = captureSnapshot(project.root, paths);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("snapshot failed");
  return result.value;
}

function registry(
  exports: { name: string; target: string; kind: "value" | "type" }[] = [
    { name: "Button", target: "button.svelte", kind: "value" },
  ],
) {
  return registryOf([
    componentItem("button", {
      exports,
      files: [
        {
          logicalSource: "registry/templates/button.svelte",
          target: "button.svelte",
          owner: "button",
          cohort: "core",
          blockId: null,
          bytes: utf8("<button>button</button>\n"),
          digest: hashBytes(utf8("<button>button</button>\n")) as string,
        },
      ],
    }),
  ]);
}

function add(
  project: ReturnType<typeof createTempProject>,
  reg = registry(),
  overrides: Record<string, unknown> = {},
) {
  return planAdd({
    registry: reg,
    config: CONFIG,
    addedRoots: ["button"],
    snapshot: snapshotOf(project),
    lock: null,
    registryVersion: reg.root.registryVersion,
    registryHash: reg.root.contentHash,
    ...overrides,
  });
}

function applyWrites(
  project: ReturnType<typeof createTempProject>,
  writes: readonly {
    path: string;
    bytes: Uint8Array;
    operation?: string;
  }[],
): void {
  for (const write of writes) {
    const abs = path.join(project.root, write.path);
    if (write.operation === "retire") {
      rmSync(abs, { force: true });
      continue;
    }
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, write.bytes);
  }
}

for (const target of [
  derived.rootExports,
  CONFIG.layoutFile,
  derived.kitCss,
  `${derived.stateDir}/kit.json`,
  `${derived.stateDir}/kit.lock.json`,
]) {
  test(`add refuses to plan a file over a directory at ${target}`, (t) => {
    const project = createTempProject();
    t.after(() => project.cleanup());
    project.writeDir(target);
    const result = add(project);
    assert.equal(result.ok, true, JSON.stringify(result));
    if (!result.ok) return;
    assert.equal(result.value.executable, false);
    assert.deepEqual(result.value.writes, []);
  });
}

test("add rejects an incomplete snapshot for config and lock metadata", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const incomplete = targetPaths().filter(
    (entry) =>
      entry !== `${derived.stateDir}/kit.json` &&
      entry !== `${derived.stateDir}/kit.lock.json`,
  );
  const result = add(project, registry(), {
    snapshot: snapshotOf(project, incomplete),
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.ok(
    result.value.diagnostics.some(
      (entry) =>
        entry.includes("was not observed") ||
        entry.includes("snapshot is incomplete"),
    ),
    JSON.stringify(result.value.diagnostics),
  );
});

test("add rejects malformed observed config and lock metadata", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(`${derived.stateDir}/kit.json`, "not json");
  project.writeFile(`${derived.stateDir}/kit.lock.json`, "not json");
  const result = add(project);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.deepEqual(result.value.writes, []);
});

test("an observed lock without a supplied lock is a typed conflict", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    `${derived.stateDir}/kit.lock.json`,
    JSON.stringify({ schemaVersion: 1 }),
  );
  const result = add(project);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
});

test("add preserves a byte-order mark in a composed export region", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(derived.rootExports, "\uFEFF// APP\n");
  const result = add(project);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, true);
  const write = result.value.writes.find(
    (entry) => entry.path === derived.rootExports,
  );
  assert.ok(write);
  assert.deepEqual(Array.from(write.bytes.slice(0, 3)), [0xef, 0xbb, 0xbf]);
});

test("add derives the registry identity from the snapshot, not a spoofed scalar", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const reg = registry();
  const result = add(project, reg, {
    registryVersion: "9.9.9",
    registryHash: "a".repeat(64),
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.lock?.registryVersion, reg.root.registryVersion);
  assert.equal(result.value.lock?.registryHash, reg.root.contentHash);
});

test("a fresh add emits the minimal initialization prerequisites and integrations", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const result = add(project);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, true);
  const written = new Set(result.value.writes.map((entry) => entry.path));
  assert.ok(written.has(derived.kitCss));
  assert.ok(written.has(derived.themesCss));
  assert.ok(written.has(derived.appCss));
  const kinds = (result.value.lock?.integrations ?? []).map(
    (entry) => entry.kind,
  );
  assert.deepEqual([...kinds].sort(), ["exports", "layout", "stylesheet"]);
  for (const integration of result.value.lock?.integrations ?? []) {
    assert.match(integration.baseline, /^[0-9a-f]{64}$/);
    assert.notEqual(integration.baseline, "0".repeat(64));
  }
});

test("initialization followed by add retains every integration record", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const init = planInit({
    config: CONFIG,
    layoutFile: CONFIG.layoutFile,
    layoutSource: "<main />",
    snapshot: snapshotOf(project),
    registryVersion: "0.1.0",
    registryHash: "a".repeat(64),
    configHash: "b".repeat(64),
  });
  assert.equal(init.ok, true, JSON.stringify(init));
  if (!init.ok) return;
  applyWrites(project, init.value.writes);
  assert.equal(init.value.lock.integrations.length, 3);
  const result = add(project, registry(), { lock: init.value.lock });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, true);
  assert.deepEqual(
    (result.value.lock?.integrations ?? []).map((entry) => entry.kind).sort(),
    ["exports", "layout", "stylesheet"],
  );
});

test("an unowned managed export region conflicts instead of being erased", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    derived.rootExports,
    "// svelte-ui-kit:start exports\nexport const Local = 42;\n// svelte-ui-kit:end exports\n",
  );
  const result = add(project);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.deepEqual(result.value.writes, []);
});

test("a customized source with a renamed public export blocks the whole batch", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const first = add(project);
  assert.equal(first.ok, true, JSON.stringify(first));
  if (!first.ok || !first.value.executable) return;
  applyWrites(project, first.value.writes);
  project.writeFile(
    `${derived.rootExportsDir}/button.svelte`,
    "<button>CUSTOM</button>\n",
  );
  const renamed = registry([
    { name: "Renamed", target: "button.svelte", kind: "value" },
  ]);
  const result = add(project, renamed, {
    config: { ...CONFIG, requested: ["button"] },
    lock: first.value.lock,
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.ok(
    result.value.diagnostics.some((entry) => entry.includes("cohort conflict")),
    JSON.stringify(result.value.diagnostics),
  );
});

test("a registry source importing the root barrel is a cycle conflict", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const barrel = 'import { Button } from "../index";\nexport default Button;\n';
  const part = "<div></div>\n";
  const reg = registryOf([
    componentItem("dialog", {
      exports: [
        { name: "DialogRoot", target: "dialog/index.ts", kind: "value" },
      ],
      files: [
        {
          logicalSource: "registry/templates/dialog/index.ts",
          target: "dialog/index.ts",
          owner: "dialog",
          cohort: "dialog",
          blockId: null,
          bytes: utf8(barrel),
          digest: hashBytes(utf8(barrel)) as string,
        },
        {
          logicalSource: "registry/templates/dialog/root.svelte",
          target: "dialog/root.svelte",
          owner: "dialog",
          cohort: "dialog",
          blockId: null,
          bytes: utf8(part),
          digest: hashBytes(utf8(part)) as string,
        },
      ],
    }),
  ]);
  const result = planAdd({
    registry: reg,
    config: CONFIG,
    addedRoots: ["dialog"],
    snapshot: snapshotOf(project, [
      ...targetPaths(),
      `${derived.rootExportsDir}/dialog/index.ts`,
      `${derived.rootExportsDir}/dialog/root.svelte`,
    ]),
    lock: null,
    registryVersion: reg.root.registryVersion,
    registryHash: reg.root.contentHash,
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.ok(
    result.value.diagnostics.some((entry) => entry.includes("root UI barrel")),
    JSON.stringify(result.value.diagnostics),
  );
});

test("a lock-owned integration whose target is missing conflicts", (t) => {
  for (const target of [
    derived.kitCss,
    derived.rootExports,
    CONFIG.layoutFile,
  ]) {
    const project = createTempProject();
    t.after(() => project.cleanup());
    const first = add(project);
    assert.equal(first.ok, true, JSON.stringify(first));
    if (!first.ok || !first.value.executable) continue;
    applyWrites(project, first.value.writes);
    rmSync(path.join(project.root, target), { force: true });
    const result = add(project, registry(), { lock: first.value.lock });
    assert.equal(result.ok, true, JSON.stringify(result));
    if (!result.ok) continue;
    assert.equal(result.value.executable, false, target);
    assert.ok(
      result.value.diagnostics.some((entry) =>
        entry.includes("reconcile the missing integration"),
      ),
      `${target}: ${JSON.stringify(result.value.diagnostics)}`,
    );
  }
});

test("a clean retirement is an explicit operation whose application removes the file", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const first = add(project);
  assert.equal(first.ok, true, JSON.stringify(first));
  if (!first.ok || !first.value.executable) return;
  applyWrites(project, first.value.writes);
  const source = `${derived.rootExportsDir}/button.svelte`;
  assert.equal(existsSync(path.join(project.root, source)), true);
  const sync = planSync({
    registry: registry(),
    config: CONFIG,
    snapshot: snapshotOf(project),
    lock: first.value.lock,
    registryVersion: "0.1.0",
    registryHash: "a".repeat(64),
  });
  assert.equal(sync.ok, true, JSON.stringify(sync));
  if (!sync.ok) return;
  assert.equal(sync.value.executable, true);
  const retirement = sync.value.writes.find((entry) => entry.path === source);
  assert.ok(retirement, JSON.stringify(sync.value.writes));
  assert.equal(retirement.operation, "retire");
  const envelope = toPlanningEnvelope(
    "sync",
    sync.value.executable,
    sync.value.writes,
    sync.value.diagnostics,
  );
  const envelopeEntry = envelope.writes.find((entry) => entry.path === source);
  assert.equal(envelopeEntry?.operation, "retire");
  applyWrites(project, sync.value.writes);
  assert.equal(existsSync(path.join(project.root, source)), false);
  // A satisfied replay writes nothing.
  const replay = planSync({
    registry: registry(),
    config: CONFIG,
    snapshot: snapshotOf(project),
    lock: sync.value.lock,
    registryVersion: "0.1.0",
    registryHash: "a".repeat(64),
  });
  assert.equal(replay.ok, true, JSON.stringify(replay));
  if (!replay.ok) return;
  assert.deepEqual(replay.value.writes, []);
  assert.equal(
    readFileSync(path.join(project.root, derived.kitCss), "utf8").length > 0,
    true,
  );
});
