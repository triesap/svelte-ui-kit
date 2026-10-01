import assert from "node:assert/strict";
import {
  appendFileSync,
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
import { TOKENS_BODY, planInit } from "../../src/codegen/plan-init.js";
import { toPlanningEnvelope } from "../../src/codegen/plan.js";
import { planSync } from "../../src/codegen/plan-sync.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { createTempProject } from "../helpers/project.js";
import {
  componentItem,
  registryOf,
  sourceFile,
  styleFile,
} from "../helpers/registry.js";

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

/**
 * A test-only applier that enforces the declared operation meaning: `create`
 * requires an absent target, `update` requires an existing one and `retire`
 * removes an existing one. A planner that mislabels an operation fails here.
 */
function strictApply(
  project: ReturnType<typeof createTempProject>,
  writes: readonly {
    path: string;
    bytes: Uint8Array;
    operation?: string;
  }[],
): void {
  for (const write of writes) {
    const abs = path.join(project.root, write.path);
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

test("add rejects a schema-invalid observed config", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    `${derived.stateDir}/kit.json`,
    JSON.stringify({ schemaVersion: 999, requested: 42 }),
  );
  const result = add(project);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.deepEqual(result.value.writes, []);
  assert.ok(
    result.value.diagnostics.some((entry) => entry.includes("is invalid (")),
    JSON.stringify(result.value.diagnostics),
  );
});

test("add rejects a supplied mapping that disagrees with the observed config", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    `${derived.stateDir}/kit.json`,
    JSON.stringify({ ...CONFIG, uiDir: "src/custom/ui" }),
  );
  const result = add(project);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.ok(
    result.value.diagnostics.some((entry) =>
      entry.includes("unexplained mapping/state mismatch"),
    ),
    JSON.stringify(result.value.diagnostics),
  );
});

test("a supplied lock without an observed lock file is a conflict", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const first = add(project);
  assert.equal(first.ok, true, JSON.stringify(first));
  if (!first.ok || first.value.lock === null) return;
  // The lock file is deliberately not applied: the supplied lineage has no
  // observed counterpart, so it cannot authorize ownership writes.
  const result = add(project, registry(), { lock: first.value.lock });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.ok(
    result.value.diagnostics.some((entry) =>
      entry.includes("missing installed lineage cannot authorize ownership"),
    ),
    JSON.stringify(result.value.diagnostics),
  );
});

test("an installed runtime dependency with an absent required peer is a typed conflict", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({
      name: "consumer",
      dependencies: { "bits-ui": "^2.19.3" },
    }),
  );
  project.writeFile(
    "node_modules/bits-ui/package.json",
    JSON.stringify({
      name: "bits-ui",
      version: "2.19.3",
      peerDependencies: { svelte: "^5.0.0" },
    }),
  );
  const reg = registryOf([
    componentItem("button", {
      exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
      npm: [{ name: "bits-ui", range: "^2.19.3", role: "runtime" }],
    }),
  ]);
  const result = planAdd({
    registry: reg,
    config: CONFIG,
    addedRoots: ["button"],
    snapshot: snapshotOf(project),
    lock: null,
    registryVersion: reg.root.registryVersion,
    registryHash: reg.root.contentHash,
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.ok(
    result.value.dependencyIssues.some(
      (entry) => entry.code === "PEER_MISSING",
    ),
    JSON.stringify(result.value.dependencyIssues),
  );
});

test("malformed installed metadata and a missing install are distinct typed conflicts", (t) => {
  const reg = registryOf([
    componentItem("button", {
      exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
      npm: [{ name: "bits-ui", range: "^2.19.3", role: "runtime" }],
    }),
  ]);
  const malformedProject = createTempProject();
  t.after(() => malformedProject.cleanup());
  malformedProject.writeFile(
    "package.json",
    JSON.stringify({
      name: "consumer",
      dependencies: { "bits-ui": "^2.19.3" },
    }),
  );
  malformedProject.writeFile("node_modules/bits-ui/package.json", "{ not json");
  const malformed = planAdd({
    registry: reg,
    config: CONFIG,
    addedRoots: ["button"],
    snapshot: snapshotOf(malformedProject),
    lock: null,
    registryVersion: reg.root.registryVersion,
    registryHash: reg.root.contentHash,
  });
  assert.equal(malformed.ok, true, JSON.stringify(malformed));
  if (!malformed.ok) return;
  assert.equal(malformed.value.executable, false);
  assert.ok(
    malformed.value.dependencyIssues.some(
      (entry) => entry.code === "DEPENDENCY_INSTALLED_INVALID",
    ),
    JSON.stringify(malformed.value.dependencyIssues),
  );

  const missingProject = createTempProject();
  t.after(() => missingProject.cleanup());
  missingProject.writeFile(
    "package.json",
    JSON.stringify({
      name: "consumer",
      dependencies: { "bits-ui": "^2.19.3" },
    }),
  );
  const missing = planAdd({
    registry: reg,
    config: CONFIG,
    addedRoots: ["button"],
    snapshot: snapshotOf(missingProject),
    lock: null,
    registryVersion: reg.root.registryVersion,
    registryHash: reg.root.contentHash,
  });
  assert.equal(missing.ok, true, JSON.stringify(missing));
  if (!missing.ok) return;
  assert.equal(missing.value.executable, false);
  assert.ok(
    missing.value.dependencyIssues.some(
      (entry) => entry.code === "PEER_UPSTREAM_NOT_INSTALLED",
    ),
    JSON.stringify(missing.value.dependencyIssues),
  );
  assert.ok(
    !missing.value.dependencyIssues.some(
      (entry) => entry.code === "DEPENDENCY_INSTALLED_INVALID",
    ),
    "a missing install must not be reported as malformed evidence",
  );
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

test("a svelte source importing ./index.js is a cycle conflict", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const body =
    '<script lang="ts">\nimport { Button } from "./index.js";\n</script>\n<button>hi</button>\n';
  const reg = registryOf([
    componentItem("button", {
      files: [
        {
          logicalSource: "registry/templates/button.svelte",
          target: "button.svelte",
          owner: "button",
          cohort: "core",
          blockId: null,
          bytes: utf8(body),
          digest: hashBytes(utf8(body)) as string,
        },
      ],
      exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
    }),
  ]);
  const result = add(project, reg);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.ok(
    result.value.diagnostics.some((entry) => entry.includes("root UI barrel")),
    JSON.stringify(result.value.diagnostics),
  );
});

test("a supplied lock that disagrees with the observed bytes conflicts", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const first = add(project);
  assert.equal(first.ok, true, JSON.stringify(first));
  if (!first.ok || !first.value.executable || first.value.lock === null) return;
  applyWrites(project, first.value.writes);
  const stale = { ...first.value.lock, registryVersion: "9.9.9" };
  const result = add(project, registry(), { lock: stale });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.ok(
    result.value.diagnostics.some((entry) =>
      entry.includes("does not match the supplied lock lineage"),
    ),
    JSON.stringify(result.value.diagnostics),
  );
});

test("the composed plan carries declared/installed/peer readiness evidence", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({
      name: "consumer",
      type: "module",
      dependencies: { svelte: "5.57.1" },
    }),
  );
  const reg = registryOf([
    componentItem("button", {
      exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
      npm: [{ name: "svelte", range: "^5.57.1", role: "peer" }],
    }),
  ]);
  const result = planAdd({
    registry: reg,
    config: CONFIG,
    addedRoots: ["button"],
    snapshot: snapshotOf(project),
    lock: null,
    registryVersion: reg.root.registryVersion,
    registryHash: reg.root.contentHash,
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.ok(Array.isArray(result.value.dependencyState));
  const svelte = result.value.dependencyState?.find(
    (entry) => entry.name === "svelte",
  );
  assert.ok(svelte, JSON.stringify(result.value.dependencyState));
  assert.equal(svelte.declaredRange, "5.57.1");
  assert.equal(svelte.status, "missing_install");
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

function cssRegistry(cssBody: string, version = "0.1.0") {
  const source = sourceFile(
    "button.svelte",
    "<button>button</button>\n",
    "button",
  );
  const customStyle = styleFile("kit.css", cssBody, "button", "button");
  const item = componentItem("button", {
    files: [source, customStyle],
    styles: [
      {
        source: "registry/styles/button-button.css",
        target: "kit.css",
        blockId: "button",
        cohort: "core",
      },
    ],
    exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
  });
  return registryOf([{ ...item, manifest: { ...item.manifest, version } }]);
}

test("unowned tokens markers do not acquire stylesheet integration ownership", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    derived.kitCss,
    `/* svelte-ui-kit:start tokens */${TOKENS_BODY}/* svelte-ui-kit:end tokens */`,
  );
  const result = add(project);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, false);
  assert.ok(
    result.value.diagnostics.some((entry) =>
      entry.includes("markers alone do not confer ownership"),
    ),
    JSON.stringify(result.value.diagnostics),
  );
});

test("a clean minimal initialization adopts identical registry tokens", (t) => {
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
  const tokenStyle = styleFile("kit.css", TOKENS_BODY, "tokens", "tokens");
  const item = componentItem("tokens", {
    files: [tokenStyle],
    styles: [
      {
        source: "registry/styles/tokens-tokens.css",
        target: "kit.css",
        blockId: "tokens",
        cohort: "core",
      },
    ],
  });
  const reg = registryOf([item]);
  const result = planAdd({
    registry: reg,
    config: CONFIG,
    addedRoots: ["tokens"],
    snapshot: snapshotOf(project),
    lock: init.value.lock,
    registryVersion: reg.root.registryVersion,
    registryHash: reg.root.contentHash,
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(
    result.value.executable,
    true,
    JSON.stringify(result.value.diagnostics),
  );
  assert.ok(
    !result.value.diagnostics.some((entry) => entry.includes("css conflict")),
    JSON.stringify(result.value.diagnostics),
  );
  const record = result.value.lock?.cssBlocks.find(
    (block) => block.blockId === "tokens",
  );
  assert.ok(record, JSON.stringify(result.value.lock?.cssBlocks));
  assert.equal(record.owner, "tokens");
});

test("unmanaged CSS outside managed blocks does not block a clean block update", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const first = add(project, cssRegistry(".button { color: red; }\n"));
  assert.equal(first.ok, true, JSON.stringify(first));
  if (!first.ok || !first.value.executable) return;
  applyWrites(project, first.value.writes);
  appendFileSync(
    path.join(project.root, derived.kitCss),
    "\n.app { color: blue; }\n",
  );
  const second = add(project, cssRegistry(".button { color: green; }\n"), {
    lock: first.value.lock,
  });
  assert.equal(second.ok, true, JSON.stringify(second));
  if (!second.ok) return;
  assert.equal(
    second.value.executable,
    true,
    JSON.stringify(second.value.diagnostics),
  );
  const write = second.value.writes.find(
    (entry) => entry.path === derived.kitCss,
  );
  assert.ok(write);
  const text = new TextDecoder().decode(write?.bytes);
  assert.ok(text.includes(".button { color: green; }"), text);
  assert.ok(text.includes(".app { color: blue; }"), text);
});

test("a comment outside the managed export region does not block a clean update", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const first = add(project);
  assert.equal(first.ok, true, JSON.stringify(first));
  if (!first.ok || !first.value.executable) return;
  applyWrites(project, first.value.writes);
  appendFileSync(
    path.join(project.root, derived.rootExports),
    "\n// app comment\nexport const AppThing = 1;\n",
  );
  const renamed = registryOf([
    componentItem("button", {
      files: [
        sourceFile("button.svelte", "<button>button</button>\n", "button"),
      ],
      exports: [
        { name: "RenamedButton", target: "button.svelte", kind: "value" },
      ],
    }),
  ]);
  const second = add(project, renamed, { lock: first.value.lock });
  assert.equal(second.ok, true, JSON.stringify(second));
  if (!second.ok) return;
  assert.equal(
    second.value.executable,
    true,
    JSON.stringify(second.value.diagnostics),
  );
  const write = second.value.writes.find(
    (entry) => entry.path === derived.rootExports,
  );
  assert.ok(write);
  const text = new TextDecoder().decode(write?.bytes);
  assert.ok(text.includes("RenamedButton"), text);
  assert.ok(text.includes("AppThing"), text);
});

test("planned operations are truthful across create, update and retire", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const reg = registryOf([
    componentItem("button", {
      files: [
        sourceFile("button.svelte", "<button>button</button>\n", "button"),
      ],
      exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
    }),
    componentItem("spinner", {
      files: [sourceFile("spinner.svelte", "<spinner/>\n", "spinner")],
      exports: [{ name: "Spinner", target: "spinner.svelte", kind: "value" }],
    }),
  ]);
  const spinnerPath = `${derived.rootExportsDir}/spinner.svelte`;
  const paths = [...targetPaths(), spinnerPath];

  const first = planAdd({
    registry: reg,
    config: CONFIG,
    addedRoots: ["button"],
    snapshot: snapshotOf(project, paths),
    lock: null,
    registryVersion: reg.root.registryVersion,
    registryHash: reg.root.contentHash,
  });
  assert.equal(first.ok, true, JSON.stringify(first));
  if (!first.ok || !first.value.executable) return;
  const firstOps = new Map(
    first.value.writes.map((w) => [w.path, w.operation]),
  );
  assert.equal(firstOps.get(`${derived.stateDir}/kit.json`), "create");
  assert.equal(
    firstOps.get(`${derived.rootExportsDir}/button.svelte`),
    "create",
  );
  assert.equal(firstOps.get(derived.kitCss), "create");
  strictApply(project, first.value.writes);

  const second = planAdd({
    registry: reg,
    config: { ...CONFIG, requested: ["button"] },
    addedRoots: ["spinner"],
    snapshot: snapshotOf(project, paths),
    lock: first.value.lock,
    registryVersion: reg.root.registryVersion,
    registryHash: reg.root.contentHash,
  });
  assert.equal(second.ok, true, JSON.stringify(second));
  if (!second.ok || !second.value.executable) return;
  const secondOps = new Map(
    second.value.writes.map((w) => [w.path, w.operation]),
  );
  assert.equal(secondOps.get(spinnerPath), "create");
  assert.equal(secondOps.get(`${derived.stateDir}/kit.json`), "update");
  strictApply(project, second.value.writes);

  const sync = planSync({
    registry: reg,
    config: { ...CONFIG, requested: ["button"] },
    snapshot: snapshotOf(project, paths),
    lock: second.value.lock,
    registryVersion: reg.root.registryVersion,
    registryHash: reg.root.contentHash,
  });
  assert.equal(sync.ok, true, JSON.stringify(sync));
  if (!sync.ok || !sync.value.executable) return;
  const retire = sync.value.writes.find((w) => w.path === spinnerPath);
  assert.ok(retire);
  assert.equal(retire.operation, "retire");
  strictApply(project, sync.value.writes);
  assert.equal(existsSync(path.join(project.root, spinnerPath)), false);

  const replay = planSync({
    registry: reg,
    config: { ...CONFIG, requested: ["button"] },
    snapshot: snapshotOf(project, paths),
    lock: sync.value.lock,
    registryVersion: reg.root.registryVersion,
    registryHash: reg.root.contentHash,
  });
  assert.equal(replay.ok, true, JSON.stringify(replay));
  if (!replay.ok) return;
  assert.deepEqual(replay.value.writes, []);
  strictApply(project, replay.value.writes);
});
