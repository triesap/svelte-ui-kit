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
  try {
    const entry = path.join(installed.packageRoot, "dist/cli/main.js");
    const cli = (args: string[], cwd: string) => {
      const run = spawnSync(process.execPath, [entry, ...args], {
        cwd,
        encoding: "utf8",
        timeout: 30000,
        killSignal: "SIGKILL",
      });
      assert.equal(run.error, undefined, run.stdout + run.stderr);
      assert.equal(run.signal, null, run.stdout + run.stderr);
      assert.equal(run.status, 0, run.stdout + run.stderr);
      return run.stdout;
    };
    assert.equal(
      cli(["--version"], root),
      `svelte-ui-kit ${installed.evidence.manifest.version}\n`,
    );
    assert.equal(installed.evidence.manifest.version, "0.2.0");
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
      const initialized = JSON.parse(cli(["init", "--json"], app));
      assert.equal(initialized.status, "success", JSON.stringify(initialized));
      for (const name of ["kit.json", "kit.lock.json"]) {
        const written = JSON.parse(
          readFileSync(path.join(state, name), "utf8"),
        );
        assert.equal(written.schemaVersion, 1);
        assert.equal(written.target, target);
        assert.equal(written.toolVersion, installed.evidence.manifest.version);
      }
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
    installed.cleanup();
  }
});
