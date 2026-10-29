import assert from "node:assert/strict";
import { test } from "node:test";
import { createTempProject } from "../helpers/project.js";
import { composeGenerationFoundation } from "../helpers/generation-project.js";
import { parseGenerationConfig } from "../../src/project/generation-config.js";
import { deriveKitPaths } from "../../src/project/config.js";
import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
for (const target of ["astro", "svelte-library"] as const)
  test(`${target} keeps invalid unselected Vite observations distinct from proven absence`, (t) => {
    const project = createTempProject();
    t.after(() => project.cleanup());
    const manifest =
      target === "astro"
        ? {
            name: "astro-observation",
            type: "module",
            packageManager: "pnpm@12.16.1",
            dependencies: {
              svelte: "5.57.3",
              astro: "7.4.4",
              "@astrojs/svelte": "9.1.2",
            },
          }
        : {
            name: "@example/observations",
            type: "module",
            packageManager: "pnpm@12.16.1",
            peerDependencies: { svelte: "5.57.3" },
            exports: {
              ".": { types: "./dist/index.d.ts", svelte: "./dist/index.js" },
              "./styles.css": "./src/styles.css",
            },
          };
    project.writeFile("package.json", JSON.stringify(manifest));
    project.writeFile(
      "node_modules/svelte/package.json",
      JSON.stringify({ name: "svelte", version: "5.57.3" }),
    );
    if (target === "astro")
      project.writeFile(
        "astro.config.ts",
        'import svelte from "@astrojs/svelte"; export default {integrations:[svelte()]};',
      );
    project.symlink("unavailable-external", "vite.config.ts");
    const parsed = parseGenerationConfig(
      target === "astro"
        ? { schemaVersion: 2, target, layoutFile: "src/layouts/Layout.astro" }
        : {
            schemaVersion: 2,
            target,
            uiDir: "src/lib",
            styleEntry: "src/styles.css",
          },
    );
    assert.ok(parsed.ok);
    const paths = deriveKitPaths(parsed.value);
    project.writeFile(
      paths.stateDir + "/kit.json",
      JSON.stringify(parsed.value, null, 2) + "\n",
    );
    const prepared = composeGenerationFoundation(
      project.root,
      process.cwd(),
      parsed.value,
    );
    assert.equal(
      prepared.snapshot.environment.configuration.find(
        (entry) => entry.path === "vite.config.ts",
      )?.kind,
      "unsafe",
    );
    assert.equal(
      prepared.snapshot.environment.evidence.some(
        (entry) => entry.path === "vite.config.ts",
      ),
      false,
    );
    assert.equal(
      prepared.composed.readset.files.some(
        (entry) => entry.path === "vite.config.ts",
      ),
      false,
    );
    const sealed = validateApplyPlan(prepared.composed);
    assert.ok(sealed.ok, JSON.stringify(sealed));
    const outcome = applyPlan(sealed.value);
    assert.equal(outcome.kind, "applied", JSON.stringify(outcome));
  });
