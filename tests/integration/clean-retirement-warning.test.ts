import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import type { KitLock } from "../../src/codegen/lock.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { copyCorePackage } from "../helpers/core-workflow.js";
import { copyConsumerFixture } from "../helpers/fixture.js";
import { runCli } from "../helpers/cli.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

for (const custom of [false, true])
  for (const counterfactual of [false, true])
    test(`clean-only retirement import warning ${custom ? "custom" : "default"} ${counterfactual ? "omission control" : "actual"}`, (t) => {
      const pkg = copyCorePackage();
      const fixture = copyConsumerFixture();
      t.after(() => {
        fixture.cleanup();
        pkg.cleanup();
      });
      if (counterfactual) {
        // Disable only the newly returned warning in an owned compiled CLI.
        // The real deletion/lock transition and existing warnings still run.
        const sync = path.join(pkg.root, "dist/cli/commands/sync.js");
        const code = readFileSync(sync, "utf8");
        const needle = "...retainedWarnings, ...importWarnings";
        assert.equal(code.split(needle).length, 2);
        writeFileSync(sync, code.replace(needle, "...retainedWarnings"));
      }
      const config = custom
        ? { ...DEFAULT_KIT_CONFIG, uiDir: "app/ui", stylesDir: "assets/styles" }
        : DEFAULT_KIT_CONFIG;
      const paths = deriveKitPaths(config);
      const file = (relative: string) => path.join(fixture.root, relative);
      const read = (relative: string) => readFileSync(file(relative), "utf8");
      const write = (relative: string, text: string) => {
        mkdirSync(path.dirname(file(relative)), { recursive: true });
        writeFileSync(file(relative), text);
      };
      const transcript: unknown[] = [];
      const run = (args: string[]) => {
        const result = runCli([...args, "--json", "--cwd", fixture.root], {
          packageRoot: pkg.root,
          timeoutMs: 30000,
        });
        transcript.push({ args, result });
        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.equal(result.stderr, "");
        assert.equal(result.signal, null);
        return JSON.parse(result.stdout);
      };
      if (custom) write(`${paths.stateDir}/kit.json`, JSON.stringify(config));
      run(["init"]);
      run(["add", "field"]);
      run(["add", "dialog"]);
      const lock = () =>
        JSON.parse(read(`${paths.stateDir}/kit.lock.json`)) as KitLock;
      const initial = lock();
      const remaining = initial.files.filter(
        (entry) => entry.owner !== "dialog",
      );
      const remainingBytes = remaining.map(
        (entry) => [entry.path, read(entry.path)] as const,
      );
      const application = `${config.uiDir}/application-import.ts`;
      const applicationBytes =
        "import { DialogRoot } from './dialog/index.js';\nexport const applicationDialog = DialogRoot;\n";
      write(application, applicationBytes);
      const current = JSON.parse(read(`${paths.stateDir}/kit.json`));
      current.requested = current.requested.filter(
        (id: string) => id !== "dialog",
      );
      write(`${paths.stateDir}/kit.json`, JSON.stringify(current));
      const beforeDry = snapshotTree(fixture.root);
      const dry = run(["sync", "--dry-run"]);
      assert.equal(dry.status, "planned");
      assert.deepEqual(snapshotTree(fixture.root), beforeDry);
      const response = run(["sync"]);
      const manualWarnings = (value: typeof response) =>
        value.diagnostics.filter(
          (entry: { level: string; code: string }) =>
            entry.level === "warn" &&
            entry.code === "RETIRED_IMPORTS_REVIEW_REQUIRED",
        );
      assert.equal(response.status, counterfactual ? "success" : "warning");
      assert.equal(manualWarnings(dry).length, counterfactual ? 0 : 1);
      assert.equal(manualWarnings(response).length, counterfactual ? 0 : 1);
      if (!counterfactual) {
        const warning = manualWarnings(response)[0];
        assert.match(warning.guidance, /Review application imports.*manually/);
        assert.match(warning.guidance, /never rewrites application callsites/);
        assert.ok(
          initial.files.some(
            (entry) =>
              entry.owner === "dialog" && entry.path === warning.locator,
          ),
        );
      }
      assert.equal(
        response.diagnostics.some(
          (entry: { code: string }) =>
            entry.code === "RETIRED_CUSTOMIZATION_PRESERVED",
        ),
        false,
      );
      assert.equal(read(application), applicationBytes);
      const retired = lock();
      assert.deepEqual(retired.requested, ["field"]);
      assert.equal(
        retired.items.some((entry) => entry.id === "dialog"),
        false,
      );
      assert.equal(
        retired.files.some((entry) => entry.owner === "dialog"),
        false,
      );
      assert.equal(
        retired.cssBlocks.some((entry) => entry.owner === "dialog"),
        false,
      );
      for (const entry of initial.files.filter(
        (entry) => entry.owner === "dialog",
      ))
        assert.equal(existsSync(file(entry.path)), false, entry.path);
      for (const entry of remaining)
        assert.deepEqual(
          retired.files.find((record) => record.path === entry.path),
          entry,
        );
      for (const [relative, bytes] of remainingBytes)
        assert.equal(read(relative), bytes);
      const stable = snapshotTree(fixture.root);
      const replay = run(["sync"]);
      assert.equal(replay.status, "no_change");
      assert.equal(manualWarnings(replay).length, 0);
      assert.deepEqual(snapshotTree(fixture.root), stable);
      const evidence = ".artifacts/verification/clean-retirement-warning";
      mkdirSync(evidence, { recursive: true });
      writeFileSync(
        `${evidence}/${custom ? "custom" : "default"}-${counterfactual ? "omission" : "actual"}-${process.pid}.json`,
        JSON.stringify(
          { initial, retired, applicationBytes, transcript },
          null,
          2,
        ),
      );
    });
