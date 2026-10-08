import assert from "node:assert/strict";
import { test } from "node:test";
import ts from "typescript";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import {
  parseGeneratedDeclarations,
  renderExportLines,
} from "../../src/codegen/exports.js";
import { auditConsumerGraph } from "../helpers/consumer-graph.js";

test("every complete catalog root export retains exact name target and type-only direction", () => {
  const loaded = loadRegistrySnapshot(createAssetProvider(process.cwd()));
  assert.ok(loaded.ok, JSON.stringify(loaded));
  if (!loaded.ok) return;
  const declarations = loaded.value.items.flatMap((item) =>
    item.manifest.exports.map((entry) => ({
      ...entry,
      target: `./${entry.target}`,
    })),
  );
  const root = renderExportLines(declarations);
  const parsed = parseGeneratedDeclarations(root);
  assert.equal(parsed.length, declarations.length);
  assert.equal(new Set(parsed.map((entry) => entry.name)).size, parsed.length);
  for (const entry of declarations) {
    const actual = parsed.find((other) => other.name === entry.name)!;
    assert.equal(actual.kind, entry.kind, entry.name);
    assert.equal(
      actual.target,
      entry.target.replace(/\.ts$/, ".js"),
      entry.name,
    );
  }
  const emitted = ts.transpileModule(root, {
    compilerOptions: { module: ts.ModuleKind.ESNext },
  }).outputText;
  assert.deepEqual(
    parseGeneratedDeclarations(emitted)
      .map((entry) => entry.name)
      .sort(),
    declarations
      .filter((entry) => entry.kind === "value")
      .map((entry) => entry.name)
      .sort(),
  );
  const files = new Map(
    loaded.value.items.flatMap((item) =>
      item.files
        .filter((file) => /\.(ts|svelte)$/.test(file.target))
        .map(
          (file) =>
            [file.target, new TextDecoder().decode(file.bytes)] as const,
        ),
    ),
  );
  files.set("index.ts", root);
  const edges = auditConsumerGraph(files);
  assert.ok(edges.length > 100);
  assert.ok(!files.has("components/index.ts"));
  assert.ok(!parsed.some((entry) => /^(Root|Trigger|UI|Kit)/.test(entry.name)));
});

test("consumer graph refuses executable forbidden loads missing peers and root cycles but ignores prose", () => {
  const good = new Map([
    ["index.ts", 'export { default as Button } from "./button.svelte";'],
    [
      "button.svelte",
      '<script lang="ts">import type { Snippet } from "svelte"; const prose = "import fs from node:fs";</script><button>{prose}</button>',
    ],
  ]);
  auditConsumerGraph(good);
  for (const source of [
    'import fs from "node:fs";',
    'export { x } from "svelte-ui-kit";',
    'import "tailwindcss";',
    'import "../../../src/cli/main.js";',
    'import { Button } from "./index.js";',
    'const module = import("node:path");',
    'const module = require("fs");',
    "const module = import(name);",
    'type T = import("node:fs").Stats;',
  ]) {
    const mutated = new Map(good);
    mutated.set(
      "button.svelte",
      `<script lang="ts">${source}</script><button>bad</button>`,
    );
    assert.throws(
      () => auditConsumerGraph(mutated),
      /forbidden dependency|unresolved or escaped|root barrel cycle|opaque module load/,
      source,
    );
  }
  assert.throws(
    () =>
      auditConsumerGraph(
        new Map([
          ["a.ts", 'import "./b.js";'],
          ["b.ts", 'import "./a.js";'],
        ]),
      ),
    /runtime cycle/,
  );
});
