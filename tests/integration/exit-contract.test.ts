import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, symlinkSync, unlinkSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { cliPackage, write } from "../helpers/cli-package.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import { readRenderedEnvelope } from "../../src/cli/protocol.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
const cases = [
  ["help", ["--help"], "success", 0, true],
  ["info", ["info"], "success", 0, true],
  ["view", ["view", "card", "--source"], "success", 0, true],
  ["init-plan", ["init", "--dry-run"], "planned", 0, true],
  ["init-apply", ["init"], "success", 0, false],
  ["init-repeat", ["init"], "no_change", 0, true],
  ["add-plan", ["add", "card", "--dry-run"], "planned", 0, true],
  ["add-apply", ["add", "card"], "success", 0, false],
  ["add-repeat", ["add", "card"], "no_change", 0, true],
  ["sync", ["sync"], "no_change", 0, true],
  ["doctor", ["doctor", "--strict"], "success", 0, true],
  ["doctor-warning", ["doctor"], "warning", 0, true],
  ["broken-cli", ["info"], "error", 1, true],
  ["ordinary-error", ["init"], "error", 1, true],
  ["usage", ["init", "--bogus"], "error", 2, true],
  ["unsupported", ["info"], "unsupported", 2, true],
  ["strict", ["doctor", "--strict"], "error", 3, true],
  ["conflict", ["add", "card"], "conflict", 10, true],
  ["unsafe", ["init"], "error", 11, true],
  ["unsafe-add", ["add", "card"], "error", 11, true],
  ["registry", ["view", "unknown"], "error", 12, true],
  ["config-schema", ["add", "card"], "error", 1, true],
] as const;
function setup(label: string, fixture: ReturnType<typeof cliPackage>) {
  write(
    fixture.root,
    "node_modules/svelte/package.json",
    JSON.stringify({ name: "svelte", version: "5.57.1" }),
  );
  if (label === "broken-cli")
    unlinkSync(path.join(fixture.pkg, "node_modules"));
  if (["init-repeat", "doctor"].includes(label))
    assert.equal(fixture.run(["init"]).status, 0);
  if (["add-repeat", "sync"].includes(label))
    assert.equal(fixture.run(["add", "card"]).status, 0);
  if (label === "ordinary-error" || label === "config-schema")
    write(
      fixture.root,
      deriveKitPaths(DEFAULT_KIT_CONFIG).stateDir + "/kit.json",
      JSON.stringify({ invalid: true }),
    );
  if (label === "unsupported")
    write(
      fixture.root,
      "package.json",
      JSON.stringify({ name: "plain", type: "module" }),
    );
  if (label === "conflict")
    write(
      fixture.root,
      DEFAULT_KIT_CONFIG.uiDir + "/button.svelte",
      "<button>USER</button>\n",
    );
  if (label === "unsafe") {
    mkdirSync(path.join(fixture.root, "src/lib"), { recursive: true });
    symlinkSync(fixture.pkg, path.join(fixture.root, "src/lib/components"));
  }
  if (label === "unsafe-add") {
    mkdirSync(path.join(fixture.root, DEFAULT_KIT_CONFIG.uiDir), {
      recursive: true,
    });
    symlinkSync(
      path.join(fixture.pkg, "registry/templates/button.svelte"),
      path.join(fixture.root, DEFAULT_KIT_CONFIG.uiDir, "button.svelte"),
    );
  }
}
for (const [label, args, status, exit, readonly] of cases)
  test(`built process golden ${label}: ${status}/${exit}`, () => {
    let golden: string | undefined;
    for (const mode of ["json-after", "json-before", "human"] as const) {
      const fixture = cliPackage();
      try {
        setup(label, fixture);
        const before = snapshotTree(fixture.root);
        const cli = path.join(fixture.pkg, "dist/cli/main.js");
        const flags = mode === "human" ? [] : ["--json"];
        // JSON help intentionally allows only the two existing help/json flags.
        const actual =
          label === "help"
            ? mode === "json-before"
              ? [...flags, ...args]
              : [...args, ...flags]
            : mode === "json-before"
              ? [...flags, "--cwd", fixture.root, ...args]
              : [...args, ...flags, "--cwd", fixture.root];
        const result = spawnSync(process.execPath, [cli, ...actual], {
          cwd: fixture.root,
          encoding: "utf8",
        });
        assert.equal(result.status, exit, result.stderr + result.stdout);
        if (mode !== "human") {
          assert.equal(result.stderr, "");
          const parsed = readRenderedEnvelope(result.stdout);
          assert.equal(parsed.ok, true, JSON.stringify(parsed));
          const envelope = JSON.parse(result.stdout);
          assert.equal(envelope.status, status);
          assert.deepEqual(
            Object.keys(envelope).sort(),
            [
              "schemaVersion",
              "command",
              "status",
              "diagnostics",
              "changes",
              "data",
            ].sort(),
          );
          assert.equal(result.stdout.includes(fixture.base), false);
          assert.equal(result.stdout.includes("\u001b"), false);
          if (status === "planned")
            assert.ok(
              envelope.changes.every(
                (entry: { applied: boolean }) => !entry.applied,
              ),
            );
          if (status === "success" && !readonly)
            assert.ok(
              envelope.changes.every(
                (entry: { applied: boolean }) => entry.applied,
              ),
            );
          if (golden === undefined) golden = result.stdout;
          else
            assert.equal(
              result.stdout,
              golden,
              "flag order and physical root do not change semantic output",
            );
        } else if (exit !== 0) {
          assert.equal(result.stdout, "");
          assert.ok(result.stderr.length > 0);
        }
        if (readonly) assert.deepEqual(snapshotTree(fixture.root), before);
      } finally {
        fixture.cleanup();
      }
    }
  });
