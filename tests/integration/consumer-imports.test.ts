import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import ts from "typescript";
import { buildCatalogConsumer } from "../helpers/generated-consumer.js";
import { auditConsumerGraph } from "../helpers/consumer-graph.js";
import { parseGeneratedDeclarations } from "../../src/codegen/exports.js";

for (const custom of [false, true])
  test(`actual full catalog installed export and dependency graph ${custom ? "custom" : "default"}`, () => {
    const consumer = buildCatalogConsumer(custom);
    try {
      const ui = custom ? "app/ui" : "src/lib/components/ui";
      const sources = new Map(
        Object.keys(consumer.evidence.files)
          .filter(
            (file) => file.startsWith(`${ui}/`) && /\.(ts|svelte)$/.test(file),
          )
          .map((file) => [
            file.slice(ui.length + 1),
            readFileSync(path.join(consumer.root, file), "utf8"),
          ]),
      );
      sources.set(
        "index.ts",
        readFileSync(path.join(consumer.root, ui, "index.ts"), "utf8"),
      );
      const edges = auditConsumerGraph(sources);
      const root = sources.get("index.ts")!;
      const declarations = parseGeneratedDeclarations(root);
      const registry = JSON.parse(
        readFileSync("registry/registry.json", "utf8"),
      );
      const expected = registry.items.flatMap(
        (item: { manifest: string }) =>
          JSON.parse(readFileSync(`registry/${item.manifest}`, "utf8")).exports,
      );
      assert.deepEqual(
        declarations.map((entry) => `${entry.name}:${entry.kind}`).sort(),
        expected
          .map(
            (entry: { name: string; kind: string }) =>
              `${entry.name}:${entry.kind}`,
          )
          .sort(),
      );
      const runtime = ts.transpileModule(root, {
        compilerOptions: { module: ts.ModuleKind.ESNext },
      }).outputText;
      assert.deepEqual(
        parseGeneratedDeclarations(runtime)
          .map((entry) => entry.name)
          .sort(),
        declarations
          .filter((entry) => entry.kind === "value")
          .map((entry) => entry.name)
          .sort(),
      );
      assert.ok(sources.size > 70);
      assert.ok(!sources.has("components/index.ts"));
      mkdirSync(".artifacts/verification/consumer-imports", {
        recursive: true,
      });
      writeFileSync(
        `.artifacts/verification/consumer-imports/${custom ? "custom" : "default"}-${process.pid}.json`,
        JSON.stringify(
          {
            evidence: consumer.evidence,
            publicExports: declarations,
            edges,
            runtime,
          },
          null,
          2,
        ),
      );
    } finally {
      consumer.cleanup();
    }
  });
