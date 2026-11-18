import { snapshotTree } from "../helpers/tree-snapshot.js";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { installPackedCore } from "../helpers/packed-core.js";

test("actual installed canonical archive has one schema catalog and one CLI/writer identity for every target", () => {
  const installed = installPackedCore();
  const root = mkdtempSync(
    path.join(os.tmpdir(), "suik-packed-canonical-identity-"),
  );
  let passed = false;
  const reportPath = path.resolve(
    ".artifacts/verification/canonical-v1",
    `packed-discovery-${process.pid}-${Date.now()}`,
    "commands.json",
  );
  mkdirSync(path.dirname(reportPath), { recursive: true });
  const commands: Record<string, unknown>[] = [];
  const report = () =>
    writeFileSync(
      reportPath,
      JSON.stringify(
        { passed, root, installed: installed.evidence, commands },
        null,
        2,
      ) + "\n",
    );
  report();
  try {
    const entry = path.join(installed.packageRoot, "dist/cli/main.js");
    const cli = (args: string[], cwd: string, expectedStatus = 0) => {
      const command: Record<string, unknown> = {
        argv: [process.execPath, entry, ...args],
        cwd,
        target: path.basename(cwd),
        deadlineMs: 30000,
        killSignal: "SIGKILL",
        expectedStatus,
        startedUtc: new Date().toISOString(),
        before: snapshotTree(cwd),
      };
      commands.push(command);
      report();
      const started = Date.now();
      const run = spawnSync(process.execPath, [entry, ...args], {
        cwd,
        encoding: "utf8",
        timeout: 30000,
        killSignal: "SIGKILL",
      });
      Object.assign(command, {
        pid: run.pid,
        elapsedMs: Date.now() - started,
        status: run.status,
        signal: run.signal,
        errorCode:
          (run.error as NodeJS.ErrnoException | undefined)?.code ?? null,
        error: run.error?.message ?? null,
        stdout: run.stdout,
        stderr: run.stderr,
        after: snapshotTree(cwd),
      });
      report();
      assert.equal(run.error, undefined, run.stdout + run.stderr);
      assert.equal(run.signal, null, run.stdout + run.stderr);
      assert.equal(run.status, expectedStatus, run.stdout + run.stderr);
      assert.equal(run.stderr, "");
      return run.stdout;
    };
    assert.equal(
      cli(["--version"], root),
      `svelte-ui-kit ${installed.evidence.manifest.version}\n`,
    );
    assert.equal(installed.evidence.manifest.version, "0.2.2");
    const schemas = path.join(installed.packageRoot, "assets/schemas");
    assert.equal(readdirSync(schemas).length, 10);
    assert.ok(
      readdirSync(schemas).every((name) => name.endsWith(".schema.json")),
    );
    assert.equal(
      JSON.parse(readFileSync(path.join(schemas, "kit.schema.json"), "utf8"))
        .$id,
      "urn:svelte-ui-kit:schema:v1:project-config",
    );
    assert.equal(
      JSON.parse(
        readFileSync(path.join(schemas, "kit-lock.schema.json"), "utf8"),
      ).$id,
      "urn:svelte-ui-kit:schema:v1:install-lock",
    );
    for (const target of ["sveltekit", "astro", "svelte-library"]) {
      const app = path.join(root, target);
      mkdirSync(app);
      const library = target === "svelte-library";
      const config = {
        schemaVersion: 1,
        target,
        uiDir: "src/lib",
        stylesDir: "src/styles",
        ...(library
          ? { styleEntry: "src/styles.css" }
          : {
              layoutFile:
                target === "astro"
                  ? "src/layouts/Layout.astro"
                  : "src/routes/+layout.svelte",
            }),
      };
      const manifest = {
        name: `owned-canonical-${target}`,
        version: "0.0.0",
        private: true,
        type: "module",
        packageManager: "pnpm@12.16.1",
        ...(library
          ? {
              peerDependencies: { svelte: "5.57.3" },
              svelte: "./dist/index.js",
              types: "./dist/index.d.ts",
              exports: {
                ".": {
                  types: "./dist/index.d.ts",
                  svelte: "./dist/index.js",
                  default: "./dist/index.js",
                },
                "./styles.css": "./src/styles.css",
              },
            }
          : {
              dependencies: {
                svelte: "5.57.3",
                ...(target === "astro"
                  ? { astro: "7.4.4", "@astrojs/svelte": "9.1.2" }
                  : { "@sveltejs/kit": "2.70.3" }),
              },
            }),
      };
      writeFileSync(path.join(app, "package.json"), JSON.stringify(manifest));
      if (target === "astro")
        writeFileSync(
          path.join(app, "astro.config.ts"),
          'import {defineConfig} from "astro/config"; import svelte from "@astrojs/svelte"; export default defineConfig({integrations:[svelte()]});\n',
        );
      const state = path.join(app, "src/lib/_kit");
      mkdirSync(state, { recursive: true });
      writeFileSync(path.join(state, "kit.json"), JSON.stringify(config));
      const configured = snapshotTree(app);
      const info = JSON.parse(cli(["info", "--json"], app));
      assert.equal(info.data.config.kind, "custom");
      assert.equal(info.data.config.path, "src/lib/_kit/kit.json");
      assert.equal(info.data.paths.target, target);
      assert.equal(info.data.paths.configSchema, 1);
      assert.equal(
        Object.hasOwn(info.data.paths, library ? "layoutFile" : "styleEntry"),
        false,
      );
      assert.equal(info.data.ready, false);
      const doctor = JSON.parse(cli(["doctor", "--strict", "--json"], app, 3));
      assert.ok(
        doctor.diagnostics.some(
          (entry: { code: string }) => entry.code === "DOCTOR_NOT_INITIALIZED",
        ),
      );
      assert.deepEqual(snapshotTree(app), configured);
      const initialized = JSON.parse(cli(["init", "--json"], app));
      assert.equal(initialized.status, "success", JSON.stringify(initialized));
      const installedTree = snapshotTree(app);
      const installedInfo = JSON.parse(cli(["info", "--json"], app));
      assert.equal(installedInfo.data.config.kind, "custom");
      assert.equal(installedInfo.data.paths.target, target);
      assert.deepEqual(snapshotTree(app), installedTree);
      for (const name of ["kit.json", "kit.lock.json"]) {
        const written = JSON.parse(
          readFileSync(path.join(state, name), "utf8"),
        );
        assert.equal(written.schemaVersion, 1);
        assert.equal(written.target, target);
        assert.equal(written.toolVersion, installed.evidence.manifest.version);
      }
    }
    passed = true;
  } finally {
    report();
    if (passed) {
      rmSync(root, { recursive: true, force: true });
      installed.cleanup();
    } else {
      console.error(
        `Retained failed owned packed host and consumer: ${reportPath}`,
      );
    }
  }
});
