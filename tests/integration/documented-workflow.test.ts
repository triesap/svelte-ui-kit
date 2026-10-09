import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { cliPackage, write } from "../helpers/cli-package.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { documentedExample } from "../helpers/documented-example.js";
const block = documentedExample(
  "docs/getting-started.md",
  "documented-cli-workflow",
  "sh",
);
const commands = block
  .split("\n")
  .filter((line) => line.startsWith('node "$CLI"'));
assert.equal(commands.length, 7);
for (const custom of [false, true])
  test(`documented local workflow executes with real bundled assets in ${custom ? "custom" : "default"} layout`, () => {
    const fixture = cliPackage();
    try {
      const customBlock = documentedExample(
        "docs/reference/configuration.md",
        "documented-custom-mapping",
        "json",
      );
      const config = custom ? JSON.parse(customBlock) : DEFAULT_KIT_CONFIG;
      if (custom)
        write(
          fixture.root,
          deriveKitPaths(config).stateDir + "/kit.json",
          JSON.stringify(config),
        );
      write(
        fixture.root,
        "node_modules/svelte/package.json",
        JSON.stringify({ name: "svelte", version: "5.57.1" }),
      );
      // Use the actual package: public docs must not substitute synthetic items.
      const cli = path.resolve("dist/cli/main.js");
      for (const [index, line] of commands.entries()) {
        const match = /^node "\$CLI" --cwd "\$APP" ([-a-z ]+)$/.exec(line);
        assert.ok(match, line);
        const args = match[1]!.split(" ");
        const before = snapshotTree(fixture.root);
        const result = spawnSync(
          process.execPath,
          [cli, "--cwd", fixture.root, ...args, "--json"],
          { cwd: fixture.root, encoding: "utf8" },
        );
        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.equal(result.stderr, "");
        const envelope = JSON.parse(result.stdout);
        assert.equal(envelope.command, args[0]);
        if (index !== 2) assert.deepEqual(snapshotTree(fixture.root), before);
        if (index === 1) assert.equal(envelope.status, "planned");
        if (index === 2) assert.equal(envelope.status, "success");
        if (index === 6) assert.equal(envelope.status, "no_change");
      }
    } finally {
      fixture.cleanup();
    }
  });
