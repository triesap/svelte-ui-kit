import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { cliPackage, write } from "../helpers/cli-package.js";
import {
  compoundRegistry,
  type CompoundRegistryOptions,
} from "../helpers/multi-item-fixture.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { hashBytes } from "../../src/codegen/compare.js";
import type { RegistrySnapshotFile } from "../../src/registry/load.js";
import { parseComponentCustomization } from "../../src/registry/theme.js";
const revisions = JSON.parse(
  readFileSync("tests/fixtures/upgrades/revisions.json", "utf8"),
);
assert.equal(revisions.synthetic, true);
for (const custom of [false, true])
  for (const scenario of [
    "source",
    "css",
    "cohort",
    "metadata",
    "custom-source",
    "custom-css",
    "preserve",
  ] as const)
    test(`synthetic ${custom ? "custom" : "default"} ${scenario} upgrade preserves truthful independent lineage`, () => {
      const fixture = cliPackage(revisions.old as CompoundRegistryOptions);
      try {
        const config = custom
          ? {
              ...DEFAULT_KIT_CONFIG,
              uiDir: "app/ui",
              stylesDir: "assets/styles",
            }
          : DEFAULT_KIT_CONFIG;
        const paths = deriveKitPaths(config);
        if (custom)
          write(
            fixture.root,
            paths.stateDir + "/kit.json",
            JSON.stringify(config),
          );
        assert.equal(fixture.run(["add", "card"]).status, 0);
        const readLock = () =>
          JSON.parse(
            readFileSync(
              path.join(fixture.root, paths.stateDir, "kit.lock.json"),
              "utf8",
            ),
          );
        const oldLock = readLock();
        const source = config.uiDir + "/card.svelte";
        if (scenario === "custom-source" || scenario === "preserve")
          write(fixture.root, source, '<div class="card">LOCAL</div>\n');
        if (scenario === "custom-css")
          write(
            fixture.root,
            paths.kitCss,
            readFileSync(path.join(fixture.root, paths.kitCss), "utf8").replace(
              ".card {}",
              ".card { padding: 5rem; }",
            ),
          );
        const incoming = scenario.startsWith("custom-")
          ? revisions.cohort
          : scenario === "preserve"
            ? revisions.old
            : revisions[scenario];
        const registry = compoundRegistry(fixture.pkg, incoming);
        assert.equal(registry.ok, true, JSON.stringify(registry));
        if (!registry.ok) return;
        const before = snapshotTree(fixture.root);
        const conflict = scenario.startsWith("custom-");
        const dry = fixture.run(["sync", "--dry-run"]);
        assert.equal(dry.status, conflict ? 10 : 0, dry.stdout);
        assert.deepEqual(snapshotTree(fixture.root), before);
        const result = fixture.run(["sync"]);
        assert.equal(result.status, conflict ? 10 : 0, result.stdout);
        if (conflict) {
          assert.deepEqual(snapshotTree(fixture.root), before);
          assert.deepEqual(readLock(), oldLock);
          assert.ok(
            JSON.parse(result.stdout).diagnostics.some(
              (entry: { code: string; message: string }) =>
                entry.code === "PLAN_DIAGNOSTIC" &&
                /cohort|conflict/i.test(entry.message),
            ),
          );
          return;
        }
        const lock = readLock();
        assert.equal(lock.schemaVersion, 1);
        assert.equal(lock.registryVersion, incoming.version);
        assert.equal(lock.registryHash, registry.value.root.contentHash);
        assert.equal(
          lock.items.find((entry: { id: string }) => entry.id === "button")
            .version,
          "1.0.0",
        );
        assert.deepEqual(
          lock.files.filter(
            (entry: { owner: string }) => entry.owner === "button",
          ),
          oldLock.files.filter(
            (entry: { owner: string }) => entry.owner === "button",
          ),
        );
        for (const file of lock.files.filter(
          (entry: { owner: string }) => entry.owner === "card",
        )) {
          const expected: RegistrySnapshotFile = registry.value.items
            .find((entry) => entry.id === "card")!
            .files.find(
              (entry) => config.uiDir + "/" + entry.target === file.path,
            )!;
          assert.equal(file.baseHash, expected.digest);
          if (scenario !== "preserve")
            assert.equal(
              file.baseHash,
              hashBytes(readFileSync(path.join(fixture.root, file.path))),
            );
          if (scenario === "cohort") {
            const prior = oldLock.files.find(
              (entry: { path: string }) => entry.path === file.path,
            );
            if (prior.baseHash === expected.digest)
              assert.deepEqual(file, prior);
            else {
              assert.equal(file.cohort, "synthetic-v2");
              assert.equal(file.itemVersion, "2.1.0");
            }
          }
        }
        if (scenario === "css" || scenario === "cohort") {
          assert.match(
            readFileSync(path.join(fixture.root, paths.kitCss), "utf8"),
            /--kit-card-synthetic-gap, 1rem/,
          );
          const block = lock.cssBlocks.find(
            (entry: { blockId: string }) => entry.blockId === "card",
          );
          assert.equal(
            block.baseHash,
            hashBytes(Buffer.from(incoming.cssBodyOverrides.card)),
          );
        }
        if (scenario === "source" || scenario === "cohort")
          assert.match(
            readFileSync(path.join(fixture.root, source), "utf8"),
            /SYNTHETIC_SOURCE_REVISION/,
          );
        if (scenario === "preserve") {
          assert.match(
            readFileSync(path.join(fixture.root, source), "utf8"),
            /LOCAL/,
          );
          assert.deepEqual(lock, oldLock);
          assert.deepEqual(snapshotTree(fixture.root), before);
        }
        if (scenario === "metadata")
          assert.deepEqual(lock.files, oldLock.files);
        const after = snapshotTree(fixture.root);
        const repeat = fixture.run(["sync"]);
        assert.equal(repeat.status, 0, repeat.stdout);
        assert.equal(JSON.parse(repeat.stdout).status, "no_change");
        assert.deepEqual(snapshotTree(fixture.root), after);
      } finally {
        fixture.cleanup();
      }
    });
test("synthetic customization declarations change independently without accepting unknown contract versions", () => {
  const old = parseComponentCustomization(revisions.customizationOld);
  const incoming = parseComponentCustomization(revisions.customizationIncoming);
  assert.equal(old.ok, true);
  assert.equal(incoming.ok, true);
  if (old.ok && incoming.ok) {
    assert.equal(old.value.contractVersion, incoming.value.contractVersion);
    assert.notEqual(
      old.value.properties[0]!.fallback,
      incoming.value.properties[0]!.fallback,
    );
  }
  assert.equal(
    parseComponentCustomization({
      ...revisions.customizationIncoming,
      contractVersion: 2,
    }).ok,
    false,
  );
});
