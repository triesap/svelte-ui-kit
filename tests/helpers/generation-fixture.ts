/** Owned mapping/transaction fixtures; native rendering is qualified separately. */
import assert from "node:assert/strict";
import { chmodSync, copyFileSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  DEFAULT_UI_DIR,
  parseKitConfig,
  serializeKitConfig,
  type TargetKind,
} from "../../src/project/config.js";
import { NATIVE_BASELINE } from "../../src/project/native-dependency.js";
import { composeGenerationFoundation } from "./generation-project.js";
import { createTempProject } from "./project.js";
import { linkQualifiedFixtureRuntime } from "./qualified-runtime.js";
import { writeFixtureWorkspace } from "./workspace-catalog.js";

export function generationFixture(
  t: { after(fn: () => void): void },
  target: TargetKind,
  custom = false,
  cleanupWhen: () => boolean = () => true,
) {
  const owner = process.cwd(),
    project = createTempProject();
  t.after(() => {
    if (cleanupWhen()) project.cleanup();
    else
      console.error(
        `Retained failed owned generation fixture: ${project.root}`,
      );
  });
  const parsed = parseKitConfig({
    schemaVersion: 1,
    target,
    uiDir: custom
      ? "components/design"
      : target === "sveltekit"
        ? DEFAULT_UI_DIR
        : "src/lib",
    stylesDir: custom ? "theme/site" : "src/styles",
    ...(target === "svelte-library"
      ? { styleEntry: custom ? "style/index.css" : "src/styles.css" }
      : {
          layoutFile:
            target === "astro"
              ? custom
                ? "app/shell.astro"
                : "src/layouts/Layout.astro"
              : custom
                ? "app/routes/+layout.svelte"
                : "src/routes/+layout.svelte",
        }),
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
        : target === "sveltekit"
          ? {
              dependencies: { svelte: "catalog:", "@sveltejs/kit": "catalog:" },
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
    target === "svelte-library" ? "devDependencies" : "dependencies",
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
    serializeKitConfig(config),
  );
  if (target === "astro")
    project.writeFile(
      "astro.config.ts",
      'import {defineConfig} from "astro/config"; import svelte from "@astrojs/svelte"; export default defineConfig({integrations:[svelte()]});\n',
    );
  if (target === "sveltekit" && config.target === "sveltekit")
    project.writeFile(
      "svelte.config.ts",
      `export default {kit:{files:{routes:${JSON.stringify(path.posix.dirname(config.layoutFile))}}}};\n`,
    );
  const primary =
    config.target === "svelte-library" ? config.styleEntry : config.layoutFile;
  assert.ok(primary);
  project.writeFile(
    primary,
    target === "astro"
      ? '---\nconst heading = "Preserved";\n---\n<main data-owned="original"><h1>{heading}</h1><slot /></main>\n'
      : target === "sveltekit"
        ? '<script>let { children } = $props();</script>\n<main data-owned="original">{@render children()}</main>\n'
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
