#!/usr/bin/env node
/**
 * RCLD04-R2-5 Q2 resulting-consumer qualification.
 *
 * Drives the approved representative multi-item registry through the production
 * `planAdd`/`planSync`/`composeApplyPlan`/`validateApplyPlan`/`applyPlan` core
 * for a default and an independently rooted custom UI/styles mapping, across
 * add → update → retirement. At each of the six mapping/stage combinations the
 * resulting owned consumer is proved to be a real, consumable application:
 * `svelte-check`, a production `vite build` and an actual server-rendered
 * response from the built Node-adapter handler.
 *
 * The test page imports the generated value and type exports derived from the
 * mapped root and renders the generated components; the SSR response must carry
 * the generated components' own `data-kit-marker` markup and stage-specific
 * content (the added component, its updated body and the retained component
 * after retirement). Every check/build/render subprocess runs with the
 * inherited parent environment; per-stage raw outputs, exits/signals/errors,
 * input/served artifact digests and the response are retained under the ignored
 * `implementation/evidence/logs/` tree.
 *
 * Each mapping's consumer copy, every child process and every server are owned
 * by the suite and removed or stopped on success and failure; the maintained
 * fixture and its shared dependency tree are never mutated.
 */
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

import {
  DEFAULT_LAUNCHER,
  fetchRoute,
  startOwnedServer,
} from "./owned-server.mjs";
import {
  assertGeneratedComponentMarkup,
  assertServerRendered,
} from "./ssr-assertions.mjs";

const PACKAGE_ROOT = process.cwd();
const FIXTURE_ROOT = path.join(PACKAGE_ROOT, "tests", "fixtures", "consumer");
const DIST = path.join(PACKAGE_ROOT, "dist");
const CHECK_TIMEOUT_MS = 180_000;
const BUILD_TIMEOUT_MS = 180_000;
const MAX_BUFFER = 64 * 1024 * 1024;
const EVIDENCE_DIR =
  process.env["RCLD04_Q2_EVIDENCE_DIR"] ??
  path.join(
    PACKAGE_ROOT,
    "implementation",
    "evidence",
    "logs",
    `rcl04-q2-${process.pid}`,
  );

const dist = (rel) => import(pathToFileURL(path.join(DIST, rel)).href);
const abs = (root, rel) => path.join(root, ...rel.split("/"));

const COMPATIBILITY = {
  svelte: "^5.57.1",
  bits: "^2.19.3",
  date: "^3.8.1",
};

const BUTTON_BODY =
  '<button data-kit-marker="BUTTON_RETAINED">Retained button</button>\n';
const CARD_V1 = '<div data-kit-marker="CARD_ADDED_V1">Card v1</div>\n';
const CARD_V2 = '<div data-kit-marker="CARD_UPDATED_V2">Card v2</div>\n';

const BUTTON_ITEM = {
  id: "button",
  body: BUTTON_BODY,
  files: [
    {
      source: "templates/button.svelte",
      target: "button.svelte",
      kind: "svelte",
      cohort: "core",
    },
    {
      source: "templates/button.types.ts",
      target: "button.types.ts",
      kind: "typescript",
      cohort: "types",
    },
  ],
  styles: [
    {
      source: "styles/button.css",
      target: "kit.css",
      blockId: "button",
      cohort: "core",
    },
  ],
  exports: [
    { name: "Button", target: "button.svelte", kind: "value" },
    { name: "ButtonProps", target: "button.types.ts", kind: "type" },
  ],
  dependencies: [],
};

function cardItem(body) {
  return {
    id: "card",
    body,
    files: [
      {
        source: "templates/card.svelte",
        target: "card.svelte",
        kind: "svelte",
        cohort: "core",
      },
      {
        source: "templates/card.types.ts",
        target: "card.types.ts",
        kind: "typescript",
        cohort: "types",
      },
    ],
    styles: [
      {
        source: "styles/card.css",
        target: "kit.css",
        blockId: "card",
        cohort: "core",
      },
      {
        source: "styles/card-extra.css",
        target: "kit.css",
        blockId: "card-extra",
        cohort: "extra",
      },
    ],
    exports: [
      { name: "Card", target: "card.svelte", kind: "value" },
      { name: "CardProps", target: "card.types.ts", kind: "type" },
    ],
    dependencies: ["button"],
  };
}

function utf8(value) {
  return new TextEncoder().encode(value);
}

function write(root, rel, data) {
  const target = abs(root, rel);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, data);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fileDigestOrNull(file) {
  return existsSync(file) ? sha256(readFileSync(file)) : null;
}

/** Deterministic digest over the sorted entries and file bytes of a tree. */
function treeDigest(root) {
  if (!existsSync(root)) return null;
  const parts = [];
  const walk = (abs, rel) => {
    const stats = lstatSync(abs);
    if (stats.isDirectory()) {
      parts.push(`d ${rel}`);
      for (const name of readdirSync(abs).sort()) {
        walk(path.join(abs, name), rel === "" ? name : `${rel}/${name}`);
      }
      return;
    }
    if (stats.isSymbolicLink()) {
      parts.push(`l ${rel}`);
      return;
    }
    parts.push(`f ${rel} ${sha256(readFileSync(abs))}`);
  };
  walk(root, "");
  return sha256(utf8(parts.join("\n")));
}

function retain(label, stage, kind, content) {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  writeFileSync(
    path.join(EVIDENCE_DIR, `${label}-${stage}-${kind}.log`),
    typeof content === "string" ? content : JSON.stringify(content, null, 2),
  );
}

function linkFixtureNodeModules(fixtureNodeModules, targetNodeModules) {
  mkdirSync(targetNodeModules, { recursive: true });
  for (const entry of readdirSync(fixtureNodeModules)) {
    if (entry === ".bin") continue;
    symlinkSync(
      path.join(fixtureNodeModules, entry),
      path.join(targetNodeModules, entry),
    );
  }
  const binDir = path.join(targetNodeModules, ".bin");
  mkdirSync(binDir, { recursive: true });
  for (const bin of readdirSync(path.join(fixtureNodeModules, ".bin"))) {
    symlinkSync(
      path.join(fixtureNodeModules, ".bin", bin),
      path.join(binDir, bin),
    );
  }
}

function seedConsumer() {
  const base = mkdtempSync(path.join(os.tmpdir(), "suik-q2-lifecycle-"));
  const root = path.join(base, "consumer");
  for (const file of [
    "package.json",
    "vite.config.ts",
    "svelte.config.js",
    "tsconfig.json",
    "src/app.html",
    "src/routes/+layout.svelte",
    "src/routes/+page.server.ts",
  ]) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    cpSync(path.join(FIXTURE_ROOT, file), path.join(root, file));
  }
  // The maintained fixture's own node_modules tree is linked by entry, never
  // copied or mutated, so the shared dependency pins are identical.
  linkFixtureNodeModules(
    path.join(FIXTURE_ROOT, "node_modules"),
    path.join(root, "node_modules"),
  );
  return { base, root };
}

/**
 * Materialize the representative compound registry with marker-bearing bodies
 * and an explicit value+type hybrid per item, then load its snapshot.
 */
function buildRegistry(root, items) {
  cpSync(path.join(PACKAGE_ROOT, "schema"), path.join(root, "schema"), {
    recursive: true,
  });
  const assets = [];
  const entries = [];
  for (const item of items) {
    const manifest = JSON.stringify({
      schemaVersion: 1,
      id: item.id,
      kind: "component",
      version: "0.1.0",
      description: `${item.id} compound Q2 fixture item.`,
      compatibility: COMPATIBILITY,
      files: item.files,
      exports: item.exports,
      styles: item.styles,
      registryDependencies: item.dependencies,
    });
    write(root, `registry/ui/${item.id}.json`, manifest);
    assets.push({
      path: `registry/ui/${item.id}.json`,
      digest: sha256(utf8(manifest)),
    });
    entries.push({ id: item.id, manifest: `ui/${item.id}.json` });
    for (const file of item.files) {
      const body =
        file.kind === "svelte"
          ? item.body
          : `export interface ${pascal(file.target)} { readonly marker?: string }\n`;
      write(root, `registry/${file.source}`, body);
      assets.push({
        path: `registry/${file.source}`,
        digest: sha256(utf8(body)),
      });
    }
    for (const style of item.styles) {
      const body = `.${style.blockId} {}\n`;
      write(root, `registry/${style.source}`, body);
      assets.push({
        path: `registry/${style.source}`,
        digest: sha256(utf8(body)),
      });
    }
  }
  const basis = {
    schemaVersion: 1,
    registryVersion: "0.1.0",
    compatibility: COMPATIBILITY,
    items: entries,
  };
  write(
    root,
    "registry/registry.json",
    JSON.stringify({
      ...basis,
      contentHash: computeRegistryContentHash(basis, assets),
    }),
  );
  return loadRegistrySnapshot(createAssetProvider(root));
}

/** `card.types.ts` → `CardProps`; `button.types.ts` → `ButtonProps`. */
function pascal(target) {
  const base = path.basename(target, path.extname(target));
  const name = base.endsWith(".types") ? base.slice(0, -".types".length) : base;
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}Props`;
}

/**
 * The relative import specifier from the owned page to the mapped generated
 * root barrel. Derived from the actual mapped roots; no path alias or product
 * API is used.
 */
function importSpecifier(consumer, rootExports) {
  const pageDir = path.join(consumer, "src", "routes");
  const target = abs(consumer, rootExports).replace(/\.ts$/i, "");
  const rel = path.relative(pageDir, target).split(path.sep).join("/");
  return rel.startsWith(".") ? rel : `./${rel}`;
}

/**
 * The test page imports the generated value and type exports from the mapped
 * root and renders the generated components, with an explicit `data` attribute
 * marker per component. This is harness-owned application setup, not a
 * generator write.
 */
function pageSource(consumer, config, stage) {
  const spec = importSpecifier(consumer, deriveKitPaths(config).rootExports);
  const cardImports =
    stage === "retirement"
      ? ""
      : `  import { Card } from "${spec}";\n  import type { CardProps } from "${spec}";\n`;
  const cardMarker = stage === "add" ? "CARD_ADDED_V1" : "CARD_UPDATED_V2";
  const cardDeclaration =
    stage === "retirement"
      ? ""
      : `  const cardProps: CardProps = { marker: "${cardMarker}" };\n`;
  const cardRender =
    stage === "retirement"
      ? ""
      : `<div data-card-marker={cardProps.marker}><Card /></div>\n`;
  return `<script lang="ts">
  import { Button } from "${spec}";
  import type { ButtonProps } from "${spec}";
${cardImports}  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
  const buttonProps: ButtonProps = { marker: "BUTTON_RETAINED" };
${cardDeclaration}</script>

<h1>Consumer fixture qualification</h1>
<p data-testid="server-value">Server value: {data.serverValue}</p>
<div data-button-marker={buttonProps.marker}><Button /></div>
${cardRender}`;
}

function runFixtureScript(root, script, timeout) {
  const execPath = process.env["npm_execpath"];
  const viaNode =
    typeof execPath === "string" &&
    existsSync(execPath) &&
    /\.[cm]?js$/.test(execPath);
  const command = viaNode ? process.execPath : "pnpm";
  const args = viaNode ? [execPath, "run", script] : ["run", script];
  // Inherit the maintained fixture lane's environment, dropping only the
  // test-runner-specific variables so the nested pnpm/Node invocation behaves
  // exactly as the maintained lane invoked by `pnpm run test:fixture` does.
  const env = { ...process.env };
  delete env["NODE_OPTIONS"];
  delete env["NODE_V8_COVERAGE"];
  delete env["NODE_TEST_CONTEXT"];
  env["npm_config_verify_deps_before_run"] = "false";
  env["PATH"] =
    `${path.dirname(process.execPath)}${path.delimiter}${env["PATH"] ?? ""}`;
  const result = spawnSync(command, args, {
    cwd: root,
    env,
    encoding: "utf8",
    timeout,
    maxBuffer: MAX_BUFFER,
  });
  return {
    command,
    args,
    cwd: root,
    status: result.status,
    signal: result.signal,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error,
  };
}

function assertCompleted(result, label) {
  assert.equal(
    result.error,
    undefined,
    `${label}: subprocess reported an error (possible timeout): ${String(result.error)}`,
  );
  assert.notEqual(
    result.status,
    null,
    `${label}: process ended via signal ${String(result.signal)}`,
  );
  return result.status;
}

const { DEFAULT_KIT_CONFIG, deriveKitPaths } = await dist("project/config.js");
const { captureSnapshot } = await dist("codegen/snapshot.js");
const { planAdd } = await dist("codegen/plan-add.js");
const { planSync } = await dist("codegen/plan-sync.js");
const { composeApplyPlan } = await dist("codegen/compose.js");
const { validateApplyPlan, applyPlan } = await dist("codegen/apply.js");
const { createAssetProvider } = await dist("registry/assets.js");
const { loadRegistrySnapshot } = await dist("registry/load.js");
const { computeRegistryContentHash } = await dist("registry/model.js");

function observedPaths(config) {
  const derived = deriveKitPaths(config);
  return [
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    derived.rootExports,
    `${derived.rootExportsDir}/button.svelte`,
    `${derived.rootExportsDir}/button.types.ts`,
    `${derived.rootExportsDir}/card.svelte`,
    `${derived.rootExportsDir}/card.types.ts`,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    config.layoutFile,
    ".gitignore",
  ];
}

function currentLock(consumer, derived) {
  const lockPath = abs(consumer, `${derived.stateDir}/kit.lock.json`);
  return existsSync(lockPath)
    ? JSON.parse(readFileSync(lockPath, "utf8"))
    : null;
}

function applyGuarded(consumer, config, snapshot, writes) {
  const composed = composeApplyPlan({
    root: consumer,
    config,
    writes,
    snapshot,
  });
  assert.equal(composed.ok, true, JSON.stringify(composed.issues));
  if (!composed.ok) throw new Error("compose failed");
  const validated = validateApplyPlan(composed.value);
  assert.equal(validated.ok, true, JSON.stringify(validated.issues));
  if (!validated.ok) throw new Error("validation failed");
  return applyPlan(validated.value);
}

const STAGE_MARKERS = {
  add: {
    components: [
      { tag: "button", marker: "BUTTON_RETAINED", text: "Retained button" },
      { tag: "div", marker: "CARD_ADDED_V1", text: "Card v1" },
    ],
    absent: ["CARD_UPDATED_V2"],
  },
  update: {
    components: [
      { tag: "button", marker: "BUTTON_RETAINED", text: "Retained button" },
      { tag: "div", marker: "CARD_UPDATED_V2", text: "Card v2" },
    ],
    absent: ["CARD_ADDED_V1"],
  },
  retirement: {
    components: [
      { tag: "button", marker: "BUTTON_RETAINED", text: "Retained button" },
    ],
    absent: ["CARD_ADDED_V1", "CARD_UPDATED_V2"],
  },
};

async function runStage({ label, consumer, config, registry, stage }) {
  const derived = deriveKitPaths(config);
  const stageLog = {
    label,
    stage,
    commands: [],
    server: null,
    failure: null,
  };
  const recordCommand = (result) => ({
    command: result.command,
    args: result.args,
    cwd: result.cwd,
    status: result.status,
    signal: result.signal,
    error: result.error ? String(result.error.message ?? result.error) : null,
  });
  try {
    const snapshot = captureSnapshot(consumer, observedPaths(config));
    assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
    if (!snapshot.ok) return;
    const lock = currentLock(consumer, derived);

    let writes;
    if (stage === "add") {
      const planned = planAdd({
        registry,
        config,
        addedRoots: ["card"],
        snapshot: snapshot.value,
        lock: null,
        registryVersion: registry.root.registryVersion,
        registryHash: registry.root.contentHash,
      });
      assert.equal(planned.ok, true, JSON.stringify(planned));
      if (!planned.ok) return;
      assert.equal(
        planned.value.executable,
        true,
        JSON.stringify(planned.value.diagnostics),
      );
      writes = planned.value.writes;
    } else {
      const requested = stage === "update" ? ["card"] : ["button"];
      const planned = planSync({
        registry,
        config: { ...config, requested },
        snapshot: snapshot.value,
        lock,
        registryVersion: registry.root.registryVersion,
        registryHash: registry.root.contentHash,
      });
      assert.equal(planned.ok, true, JSON.stringify(planned));
      if (!planned.ok) return;
      assert.equal(
        planned.value.executable,
        true,
        JSON.stringify(planned.value.diagnostics),
      );
      writes = planned.value.writes;
    }

    const outcome = applyGuarded(consumer, config, snapshot.value, writes);
    assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));

    // The generated barrel is the mapped, derived import source and must export
    // the stage's value and type cohorts.
    const barrel = readFileSync(abs(consumer, derived.rootExports), "utf8");
    assert.match(barrel, /Button\b/);
    assert.match(barrel, /ButtonProps\b/);
    if (stage === "retirement") {
      assert.doesNotMatch(barrel, /\bCard\b/);
    } else {
      assert.match(barrel, /\bCard\b/);
      assert.match(barrel, /CardProps\b/);
    }
    const cardPath = abs(consumer, `${derived.rootExportsDir}/card.svelte`);
    if (stage === "retirement") {
      assert.equal(existsSync(cardPath), false);
    } else {
      assert.equal(
        readFileSync(cardPath, "utf8"),
        stage === "add" ? CARD_V1 : CARD_V2,
      );
    }

    // Write the harness page and run the real consumer lanes.
    const pagePath = path.join(consumer, "src", "routes", "+page.svelte");
    writeFileSync(pagePath, pageSource(consumer, config, stage));

    const inputIdentity = {
      registryVersion: registry.root.registryVersion,
      registryContentHash: registry.root.contentHash,
      config: { ...config },
      packageJsonSha256: fileDigestOrNull(abs(consumer, "package.json")),
      pnpmLockSha256: fileDigestOrNull(abs(consumer, "pnpm-lock.yaml")),
      installed: snapshot.value.environment.installedResolution.map(
        (entry) => ({
          name: entry.name,
          kind: entry.kind,
          digest: entry.digest,
        }),
      ),
    };

    const check = runFixtureScript(consumer, "check", CHECK_TIMEOUT_MS);
    const checkCommand = recordCommand(check);
    stageLog.commands.push(checkCommand);
    retain(label, stage, "check", {
      ...checkCommand,
      stdout: check.stdout ?? "",
      stderr: check.stderr ?? "",
    });
    assertCompleted(check, `${label}/${stage} svelte-check`);
    assert.equal(
      check.status,
      0,
      `${label}/${stage} svelte-check failed:\n${check.stdout}\n${check.stderr}`,
    );

    const build = runFixtureScript(consumer, "build", BUILD_TIMEOUT_MS);
    const buildCommand = recordCommand(build);
    stageLog.commands.push(buildCommand);
    retain(label, stage, "build", {
      ...buildCommand,
      stdout: build.stdout ?? "",
      stderr: build.stderr ?? "",
    });
    assertCompleted(build, `${label}/${stage} vite build`);
    assert.equal(
      build.status,
      0,
      `${label}/${stage} vite build failed:\n${build.stdout}\n${build.stderr}`,
    );

    const handler = path.join(consumer, "build", "handler.js");
    assert.equal(
      existsSync(handler),
      true,
      `${label}/${stage} missing handler`,
    );
    let server;
    try {
      server = startOwnedServer({
        command: process.execPath,
        args: [DEFAULT_LAUNCHER, handler],
        cwd: consumer,
      });
      stageLog.server = {
        command: process.execPath,
        args: [DEFAULT_LAUNCHER, handler],
        cwd: consumer,
        handlerSha256: fileDigestOrNull(handler),
        buildOutputDigest: treeDigest(path.join(consumer, "build")),
      };
      const port = await server.ready;
      const response = await fetchRoute(`http://127.0.0.1:${port}/`);
      stageLog.server.port = port;
      stageLog.server.responseSha256 = sha256(utf8(response.body));
      stageLog.server.responseStatus = response.status;
      stageLog.server.contentType = response.contentType;
      stageLog.server.stdout = server.stdout();
      stageLog.server.stderr = server.stderr();
      retain(label, stage, "render", {
        status: response.status,
        contentType: response.contentType,
        body: response.body,
      });
      assertServerRendered(response, "world");
      assertGeneratedComponentMarkup(
        response,
        STAGE_MARKERS[stage],
        `${label}/${stage}`,
      );
    } finally {
      if (server) await server.stop();
    }

    // Retain the input identity, source/build identity and the actually served
    // handler/server-output identity for this stage. The identity log is written
    // from the `finally` block so a failed stage still records its commands,
    // exits, signals and failure cause.
    const identity = {
      label,
      stage,
      input: inputIdentity,
      source: {
        pageSha256: fileDigestOrNull(pagePath),
        barrelSha256: fileDigestOrNull(abs(consumer, derived.rootExports)),
        buttonSha256: fileDigestOrNull(
          abs(consumer, `${derived.rootExportsDir}/button.svelte`),
        ),
        cardSha256: fileDigestOrNull(cardPath),
      },
      served: {
        handlerSha256: fileDigestOrNull(handler),
        buildOutputDigest: treeDigest(path.join(consumer, "build")),
        responseSha256: stageLog.server?.responseSha256 ?? null,
        responseStatus: stageLog.server?.responseStatus ?? null,
      },
      commands: stageLog.commands,
      server: stageLog.server,
      markers: STAGE_MARKERS[stage],
    };
    stageLog.identity = identity;
    return identity;
  } catch (error) {
    stageLog.failure = String(error instanceof Error ? error.message : error);
    throw error;
  } finally {
    retain(label, stage, "artifact-identity", stageLog);
  }
}

async function runMapping(label, config) {
  const { base, root } = seedConsumer();
  const registryRoots = [
    mkdtempSync(path.join(os.tmpdir(), "suik-q2-add-")),
    mkdtempSync(path.join(os.tmpdir(), "suik-q2-upd-")),
    mkdtempSync(path.join(os.tmpdir(), "suik-q2-ret-")),
  ];
  try {
    const addRegistry = buildRegistry(registryRoots[0], [
      BUTTON_ITEM,
      cardItem(CARD_V1),
    ]);
    const updateRegistry = buildRegistry(registryRoots[1], [
      BUTTON_ITEM,
      cardItem(CARD_V2),
    ]);
    const retirementRegistry = buildRegistry(registryRoots[2], [BUTTON_ITEM]);
    assert.equal(addRegistry.ok, true, JSON.stringify(addRegistry));
    assert.equal(updateRegistry.ok, true, JSON.stringify(updateRegistry));
    assert.equal(
      retirementRegistry.ok,
      true,
      JSON.stringify(retirementRegistry),
    );
    if (!addRegistry.ok || !updateRegistry.ok || !retirementRegistry.ok) return;

    const identities = [];
    identities.push(
      await runStage({
        label,
        consumer: root,
        config,
        registry: addRegistry.value,
        stage: "add",
      }),
    );
    identities.push(
      await runStage({
        label,
        consumer: root,
        config,
        registry: updateRegistry.value,
        stage: "update",
      }),
    );
    identities.push(
      await runStage({
        label,
        consumer: root,
        config,
        registry: retirementRegistry.value,
        stage: "retirement",
      }),
    );
    return identities;
  } finally {
    rmSync(base, { recursive: true, force: true });
    for (const registryRoot of registryRoots) {
      rmSync(registryRoot, { recursive: true, force: true });
    }
  }
}

test("default mapping: resulting consumer checks, builds and renders after add, update and retirement", async () => {
  await runMapping("default", DEFAULT_KIT_CONFIG);
});

test("custom mapping: resulting consumer checks, builds and renders after add, update and retirement", async () => {
  await runMapping("custom", {
    ...DEFAULT_KIT_CONFIG,
    uiDir: "app/ui",
    stylesDir: "assets/styles",
  });
});

/**
 * Causal controls for the generated-component assertion itself. These prove
 * the assertion cannot be satisfied by page wrappers alone, by markup present
 * only in a serialized script or an HTML comment, by a missing component or by
 * stale generated markup, while the real generated component markup passes.
 * Synthetic responses isolate the assertion's decision so the control is
 * deterministic and does not depend on a build.
 */
test("generated-component assertion has positive and causal negative controls", () => {
  const html = (body) => ({ status: 200, contentType: "text/html", body });
  const stage = STAGE_MARKERS.add;
  const realComponent =
    '<div><button data-kit-marker="BUTTON_RETAINED">Retained button</button>' +
    '<div data-kit-marker="CARD_ADDED_V1">Card v1</div></div>';

  // Positive control: the actual generated component markup passes.
  assert.doesNotThrow(() =>
    assertGeneratedComponentMarkup(html(realComponent), stage, "control"),
  );

  // Wrapper-only: page-level markers without the generated components.
  assert.throws(
    () =>
      assertGeneratedComponentMarkup(
        html(
          '<div data-button-marker="BUTTON_RETAINED"></div><div data-card-marker="CARD_ADDED_V1"></div>',
        ),
        stage,
        "wrapper-only",
      ),
    /generated <button>/,
  );

  // Script-only and comment-only markers are stripped and cannot pass.
  assert.throws(
    () =>
      assertGeneratedComponentMarkup(
        html(
          `<script>const x = '<button data-kit-marker="BUTTON_RETAINED">Retained button</button><div data-kit-marker="CARD_ADDED_V1">Card v1</div>';</script>`,
        ),
        stage,
        "script-only",
      ),
    /generated <button>/,
  );
  assert.throws(
    () =>
      assertGeneratedComponentMarkup(
        html(
          '<!-- <button data-kit-marker="BUTTON_RETAINED">Retained button</button><div data-kit-marker="CARD_ADDED_V1">Card v1</div> -->',
        ),
        stage,
        "comment-only",
      ),
    /generated <button>/,
  );

  // Missing component: only the retained button renders.
  assert.throws(
    () =>
      assertGeneratedComponentMarkup(
        html(
          '<button data-kit-marker="BUTTON_RETAINED">Retained button</button>',
        ),
        stage,
        "missing-card",
      ),
    /generated <div>/,
  );

  // Stale markup: the previous card stage renders instead of the expected one.
  assert.throws(
    () =>
      assertGeneratedComponentMarkup(
        html(
          '<button data-kit-marker="BUTTON_RETAINED">Retained button</button><div data-kit-marker="CARD_UPDATED_V2">Card v2</div>',
        ),
        stage,
        "stale-card",
      ),
    /generated <div>/,
  );

  // A stale marker is also rejected as an unexpected generated marker.
  assert.throws(
    () =>
      assertGeneratedComponentMarkup(
        html(realComponent),
        { components: stage.components, absent: ["CARD_ADDED_V1"] },
        "stale-absent",
      ),
    /unexpected generated component marker/,
  );

  // The expected text must appear *inside* its own marked element. An empty
  // marked element followed by the expected text in an unrelated element must
  // not satisfy the assertion.
  assert.throws(
    () =>
      assertGeneratedComponentMarkup(
        html(
          '<button data-kit-marker="BUTTON_RETAINED"></button><button>Retained button</button>' +
            '<div data-kit-marker="CARD_ADDED_V1"></div><div>Card v1</div>',
        ),
        stage,
        "text-outside-element",
      ),
    /generated <button>/,
  );
});
