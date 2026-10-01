import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { hashBytes } from "../../src/codegen/compare.js";
import { renderManagedBlock } from "../../src/codegen/css.js";
import { exportRegionContent } from "../../src/codegen/exports.js";
import { planSync } from "../../src/codegen/plan-sync.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import type { KitLock } from "../../src/codegen/lock.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import type { RegistrySnapshot } from "../../src/registry/load.js";
import { createSupportedProject } from "../helpers/project.js";
import {
  componentItem,
  registryOf,
  sourceFile,
  styleFile,
} from "../helpers/registry.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * S062 tests: a removed root recalculates the closure, a shared dependency is
 * retained, a clean retired asset is deleted, a customized retired asset is
 * retained with its bytes/spans and detached ownership, and application exports
 * are never silently erased.
 */

const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);
const BUTTON = `${derived.rootExportsDir}/button.svelte`;
const CARD = `${derived.rootExportsDir}/card.svelte`;
const TOKENS = `${derived.rootExportsDir}/tokens.svelte`;
const KIT_CSS = derived.kitCss;
const ROOT_EXPORTS = derived.rootExports;
const TOKEN_BODY = "\n.tokens { color: red; }\n";
const CARD_BODY = "\n.card { color: blue; }\n";

function snapshotPaths(): string[] {
  return [
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    ROOT_EXPORTS,
    KIT_CSS,
    derived.themesCss,
    derived.appCss,
    DEFAULT_KIT_CONFIG.layoutFile,
    BUTTON,
    CARD,
    TOKENS,
  ];
}

function snapshotOf(project: ReturnType<typeof createSupportedProject>) {
  const result = captureSnapshot(project.root, snapshotPaths());
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("snapshot failed");
  return result.value;
}

function registry(): RegistrySnapshot {
  return registryOf([
    componentItem("button", {
      dependencies: ["tokens"],
      files: [sourceFile("button.svelte", "BUTTON", "button")],
      exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
    }),
    componentItem("card", {
      dependencies: ["tokens"],
      files: [
        sourceFile("card.svelte", "CARD", "card"),
        styleFile("kit.css", CARD_BODY, "card", "card"),
      ],
      exports: [{ name: "Card", target: "card.svelte", kind: "value" }],
      styles: [
        {
          source: "registry/styles/card-card.css",
          target: "kit.css",
          blockId: "card",
          cohort: "core",
        },
      ],
    }),
    componentItem("tokens", {
      files: [
        sourceFile("tokens.svelte", "TOKENS", "tokens"),
        styleFile("kit.css", TOKEN_BODY, "tokens", "tokens"),
      ],
      styles: [
        {
          source: "registry/styles/tokens-tokens.css",
          target: "kit.css",
          blockId: "tokens",
          cohort: "core",
        },
      ],
    }),
  ]);
}

function lockFor(): KitLock {
  return {
    schemaVersion: 1,
    toolVersion: "1.0.0",
    registryVersion: "0.1.0",
    registryHash: "a".repeat(64),
    configHash: "b".repeat(64),
    requested: ["button", "card"],
    items: [
      {
        id: "button",
        version: "0.1.0",
        digest: "c".repeat(64),
        origin: "explicit",
      },
      {
        id: "card",
        version: "0.1.0",
        digest: "c".repeat(64),
        origin: "explicit",
      },
      {
        id: "tokens",
        version: "0.1.0",
        digest: "c".repeat(64),
        origin: "transitive",
      },
    ],
    files: [
      {
        path: BUTTON,
        owner: "button",
        baseHash: hashBytes(new TextEncoder().encode("BUTTON")) as string,
        itemVersion: "0.1.0",
        cohort: "core",
      },
      {
        path: CARD,
        owner: "card",
        baseHash: hashBytes(new TextEncoder().encode("CARD")) as string,
        itemVersion: "0.1.0",
        cohort: "core",
      },
      {
        path: TOKENS,
        owner: "tokens",
        baseHash: hashBytes(new TextEncoder().encode("TOKENS")) as string,
        itemVersion: "0.1.0",
        cohort: "core",
      },
    ],
    cssBlocks: [
      {
        path: KIT_CSS,
        owner: "tokens",
        blockId: "tokens",
        baseHash: hashBytes(new TextEncoder().encode(TOKEN_BODY)) as string,
        itemVersion: "0.1.0",
        cohort: "core",
      },
      {
        path: KIT_CSS,
        owner: "card",
        blockId: "card",
        baseHash: hashBytes(new TextEncoder().encode(CARD_BODY)) as string,
        itemVersion: "0.1.0",
        cohort: "core",
      },
    ],
    integrations: [],
  };
}

function seed(
  project: ReturnType<typeof createSupportedProject>,
  cardSource: string,
  cardCss: string,
): void {
  project.writeFile(BUTTON, "BUTTON");
  project.writeFile(CARD, cardSource);
  project.writeFile(TOKENS, "TOKENS");
  project.writeFile(
    KIT_CSS,
    renderManagedBlock("tokens", TOKEN_BODY) +
      renderManagedBlock("card", cardCss),
  );
  project.writeFile(
    `${derived.stateDir}/kit.lock.json`,
    `${JSON.stringify(lockFor(), null, 2)}\n`,
  );
}

function sync(project: ReturnType<typeof createSupportedProject>) {
  return planSync({
    registry: registry(),
    config: { ...DEFAULT_KIT_CONFIG, requested: ["button"] },
    snapshot: snapshotOf(project),
    lock: lockFor(),
    registryVersion: "0.1.0",
    registryHash: "a".repeat(64),
  });
}

test("a removed root retains a still-shared dependency", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  seed(project, "CARD", CARD_BODY);
  const result = sync(project);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.deepEqual(result.value.projection.retired, ["card"]);
  assert.ok(result.value.projection.items.some((item) => item.id === "tokens"));
  assert.ok(result.value.lock?.files.some((file) => file.path === TOKENS));
  assert.ok(
    result.value.writes.some(
      (write) => write.path === CARD && write.bytes.byteLength === 0,
    ),
    JSON.stringify({
      executable: result.value.executable,
      writes: result.value.writes.map((write) => write.path),
      diagnostics: result.value.diagnostics,
    }),
  );
});

test("a clean retired CSS block is removed", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  seed(project, "CARD", CARD_BODY);
  const result = sync(project);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  const stylesheet = result.value.writes.find(
    (write) => write.path === KIT_CSS,
  );
  assert.ok(stylesheet);
  const text = new TextDecoder().decode(stylesheet?.bytes);
  assert.ok(!text.includes("svelte-ui-kit:start card"));
  assert.ok(text.includes("svelte-ui-kit:start tokens"));
});

test("a customized retired asset is retained and detached", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  seed(project, "CUSTOM CARD", "CUSTOM CSS");
  const before = snapshotTree(project.root);
  const result = sync(project);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.executable, true);
  assert.ok(!result.value.writes.some((write) => write.path === CARD));
  assert.ok(!result.value.lock?.files.some((file) => file.path === CARD));
  assert.deepEqual(snapshotTree(project.root), before);
});

test("application exports are not silently erased", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  seed(project, "CARD", CARD_BODY);
  const region =
    '// svelte-ui-kit:start exports\nexport { Card } from "./card.svelte";\n// svelte-ui-kit:end exports\nexport const AppThing = 1;\n';
  project.writeFile(ROOT_EXPORTS, region);
  // The managed region is only patchable when the lock owns it. Markers alone
  // confer no ownership (RCLD03-R4-2).
  const lock: KitLock = {
    ...lockFor(),
    integrations: [
      {
        kind: "exports",
        path: ROOT_EXPORTS,
        baseline: hashBytes(
          new TextEncoder().encode(
            exportRegionContent(ROOT_EXPORTS, region) ?? "",
          ),
        ) as string,
        contract: "exports-v1",
      },
    ],
  };
  project.writeFile(
    `${derived.stateDir}/kit.lock.json`,
    `${JSON.stringify(lock, null, 2)}\n`,
  );
  const result = planSync({
    registry: registry(),
    config: { ...DEFAULT_KIT_CONFIG, requested: ["button"] },
    snapshot: snapshotOf(project),
    lock,
    registryVersion: "0.1.0",
    registryHash: "a".repeat(64),
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  const write = result.value.writes.find(
    (entry) => entry.path === ROOT_EXPORTS,
  );
  const text = write
    ? new TextDecoder().decode(write.bytes)
    : readFileSync(path.join(project.root, ROOT_EXPORTS), "utf8");
  assert.ok(text.includes("AppThing"), text);
  assert.ok(!text.includes("Card"), text);
});

test("a CSS retirement finalizes the lock baseline against the applied stylesheet", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  seed(project, "CARD", CARD_BODY);
  const result = sync(project);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(
    result.value.executable,
    true,
    JSON.stringify(result.value.diagnostics),
  );
  const write = result.value.writes.find((entry) => entry.path === KIT_CSS);
  assert.ok(write);
  const finalText = new TextDecoder("utf-8", { ignoreBOM: true }).decode(
    write.bytes,
  );
  const integration = result.value.lock?.integrations.find(
    (entry) => entry.kind === "stylesheet" && entry.path === KIT_CSS,
  );
  assert.ok(integration);
  assert.equal(
    integration.baseline,
    hashBytes(new TextEncoder().encode(finalText)),
    "the serialized baseline must describe the final applied stylesheet",
  );
  assert.ok(!finalText.includes("svelte-ui-kit:start card"), finalText);
});

test("a byte-order mark survives a clean retired block removal", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  seed(project, "CARD", CARD_BODY);
  const existing = readFileSync(path.join(project.root, KIT_CSS), "utf8");
  project.writeFile(KIT_CSS, `\uFEFF${existing}`);
  const result = sync(project);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(
    result.value.executable,
    true,
    JSON.stringify(result.value.diagnostics),
  );
  const write = result.value.writes.find((entry) => entry.path === KIT_CSS);
  assert.ok(write);
  assert.deepEqual(Array.from(write.bytes.slice(0, 3)), [0xef, 0xbb, 0xbf]);
  const text = new TextDecoder("utf-8", { ignoreBOM: true }).decode(
    write.bytes,
  );
  assert.ok(!text.includes("svelte-ui-kit:start card"), text);
});
