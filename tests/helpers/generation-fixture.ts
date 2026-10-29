/** Owned mapping/transaction fixtures; native rendering is qualified separately. */
import assert from "node:assert/strict";
import { chmodSync, copyFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseTargetConfig } from "../../src/project/target-config.js";
import { NATIVE_BASELINE } from "../../src/project/native-dependency.js";
import { createTempProject } from "./project.js";
import { writeFixtureWorkspace } from "./workspace-catalog.js";
import { composeGenerationFoundation } from "./generation-project.js";
import { linkQualifiedFixtureRuntime } from "./qualified-runtime.js";

export function generationFixture(
  t: { after(fn: () => void): void },
  target: "astro" | "svelte-library",
  custom = false,
) {
  const owner = process.cwd(),
    project = createTempProject();
  t.after(() => project.cleanup());
  const parsed = parseTargetConfig({
    schemaVersion: 2,
    target,
    uiDir: custom ? "components/design" : "src/lib",
    stylesDir: custom ? "theme/site" : "src/styles",
    ...(target === "astro"
      ? { layoutFile: custom ? "app/shell.astro" : "src/layouts/Layout.astro" }
      : { styleEntry: custom ? "style/index.css" : "src/styles.css" }),
    requested: [],
  });
  assert.ok(parsed.ok, JSON.stringify(parsed));
  const config = parsed.value;
  writeFixtureWorkspace(project.root);
  project.writeFile(
    "package.json",
    JSON.stringify({
      name: "@example/recovery-consumer",
      version: "0.0.0",
      private: true,
      type: "module",
      packageManager: JSON.parse(readFileSync("package.json", "utf8"))
        .packageManager,
      ...(target === "astro"
        ? {
            dependencies: {
              astro: "catalog:",
              "@astrojs/svelte": "catalog:",
              svelte: "catalog:",
            },
          }
        : {
            peerDependencies: { svelte: "catalog:" },
            svelte: "./dist/index.js",
            types: "./dist/index.d.ts",
            exports: {
              ".": {
                types: "./dist/index.d.ts",
                svelte: "./dist/index.js",
                default: "./dist/index.js",
              },
              "./styles.css":
                config.target === "svelte-library"
                  ? `./${config.styleEntry}`
                  : "",
            },
          }),
      devDependencies: {
        "bits-ui": "file:./vendor/native.tgz",
        "@internationalized/date": "catalog:",
      },
    }),
  );
  linkQualifiedFixtureRuntime(
    project,
    target === "astro" ? "dependencies" : "devDependencies",
  );
  project.writeDir("vendor");
  copyFileSync(
    path.join(
      owner,
      ".native-build",
      NATIVE_BASELINE.version,
      NATIVE_BASELINE.archive,
    ),
    path.join(project.root, "vendor/native.tgz"),
  );
  project.writeFile(
    `${config.uiDir}/_kit/kit.json`,
    JSON.stringify(config, null, 2) + "\n",
  );
  if (target === "astro")
    project.writeFile(
      "astro.config.ts",
      'import {defineConfig} from "astro/config"; import svelte from "@astrojs/svelte"; export default defineConfig({integrations:[svelte()]});\n',
    );
  const primary =
    config.target === "astro"
      ? config.layoutFile
      : config.target === "svelte-library"
        ? config.styleEntry
        : "";
  assert.ok(primary);
  project.writeFile(
    primary,
    target === "astro"
      ? '---\nconst heading = "Preserved";\n---\n<main data-owned="original"><h1>{heading}</h1><slot /></main>\n'
      : '@charset "UTF-8";\n/* preserved application entry */\n@layer application;\n',
  );
  project.writeFile(".gitignore", "# application ignore rules\n");
  project.writeFile(".operator-note", "preserve hidden unrelated bytes\n");
  chmodSync(path.join(project.root, ".operator-note"), 0o600);
  project.symlink("missing-operator-target", ".operator-link");
  return {
    project,
    owner,
    ...composeGenerationFoundation(project.root, owner, config),
    config,
  };
}
