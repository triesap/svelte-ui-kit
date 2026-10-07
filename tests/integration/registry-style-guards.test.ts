import assert from "node:assert/strict";
import { cpSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { cliPackage, write } from "../helpers/cli-package.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import { computeRegistryContentHash } from "../../src/registry/model.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { renderManagedBlock } from "../../src/codegen/css.js";

const malformed = [
  ["mismatched", renderManagedBlock("other", ".sample{}")],
  ["outside content", ".outside{}" + renderManagedBlock("tokens", ".sample{}")],
  [
    "nested",
    renderManagedBlock("tokens", renderManagedBlock("other", ".sample{}")),
  ],
  [
    "multiple",
    renderManagedBlock("tokens", ".sample{}") +
      renderManagedBlock("other", ".other{}"),
  ],
] as const;
for (const [label, body] of malformed)
  test(`real authenticated marked style ${label} refuses without consumer effects`, () => {
    const fixture = cliPackage();
    try {
      // Replace only this allocated synthetic package with actual shipped assets.
      rmSync(path.join(fixture.pkg, "registry"), {
        recursive: true,
        force: true,
      });
      cpSync("registry", path.join(fixture.pkg, "registry"), {
        recursive: true,
      });
      assert.equal(fixture.run(["init"]).status, 0);
      write(fixture.pkg, "registry/styles/tokens.css", body);
      const root = JSON.parse(
        readFileSync(path.join(fixture.pkg, "registry/registry.json"), "utf8"),
      );
      const assets = [
        "registry/foundation/tokens.json",
        "registry/styles/tokens.css",
      ].map((file) => ({
        path: file,
        digest: sha256Hex(readFileSync(path.join(fixture.pkg, file))),
      }));
      write(
        fixture.pkg,
        "registry/registry.json",
        JSON.stringify({
          ...root,
          contentHash: computeRegistryContentHash(root, assets),
        }),
      );
      const before = snapshotTree(fixture.root);
      const result = fixture.run(["add", "tokens"]);
      assert.equal(result.status, 12, result.stdout + result.stderr);
      assert.equal(result.stderr, "");
      const envelope = JSON.parse(result.stdout);
      assert.equal(envelope.status, "error");
      assert.match(
        envelope.diagnostics
          .map((entry: { message: string }) => entry.message)
          .join("\n"),
        label === "nested"
          ? /starts inside another open block/
          : /marked registry stylesheet/,
      );
      assert.deepEqual(snapshotTree(fixture.root), before);
    } finally {
      fixture.cleanup();
    }
  });
