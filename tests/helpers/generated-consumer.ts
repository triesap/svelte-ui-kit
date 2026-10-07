import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { copyConsumerFixture, runFixtureScript } from "./fixture.js";

/** Build real CLI-installed applications; never mutate the maintained fixture. */
function buildComponentConsumer(item: "spinner" | "button", custom: boolean) {
  const fixture = copyConsumerFixture();
  try {
    const config = custom
      ? { ...DEFAULT_KIT_CONFIG, uiDir: "app/ui", stylesDir: "assets/styles" }
      : DEFAULT_KIT_CONFIG;
    const paths = deriveKitPaths(config);
    const write = (file: string, body: string) => {
      const target = path.join(fixture.root, file);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, body);
    };
    if (custom) write(`${paths.stateDir}/kit.json`, JSON.stringify(config));
    for (const args of [["init"], ["add", item]]) {
      const result = spawnSync(
        process.execPath,
        [
          path.resolve("dist/cli/main.js"),
          ...args,
          "--json",
          "--cwd",
          fixture.root,
        ],
        { cwd: fixture.root, encoding: "utf8", timeout: 30000 },
      );
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.equal(result.stderr, "");
    }
    const sources =
      item === "button"
        ? [
            "button.svelte",
            "button.types.ts",
            "spinner.svelte",
            "spinner.types.ts",
          ]
        : ["spinner.svelte", "spinner.types.ts"];
    for (const name of sources) {
      assert.ok(
        readFileSync(path.join(fixture.root, config.uiDir, name)).equals(
          readFileSync(path.join("registry/ui", name)),
        ),
      );
    }
    const route = `src/routes/qualification/${item}/+page.svelte`;
    let module = path.posix.relative(
      path.posix.dirname(route),
      `${config.uiDir}/index.js`,
    );
    if (!module.startsWith(".")) module = `./${module}`;
    const template = readFileSync(
      `tests/fixtures/qualification/${item}/+page.svelte`,
      "utf8",
    );
    assert.equal(template.match(/__UI_MODULE__/g)?.length, 2);
    write(route, template.replaceAll("__UI_MODULE__", module));
    for (const script of ["check", "build"]) {
      const result = runFixtureScript(fixture.root, script);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    }
    const handler = path.join(fixture.root, "build/handler.js");
    const files = [
      ...sources.map((file) => `${config.uiDir}/${file}`),
      route,
      `${config.uiDir}/index.ts`,
      `${paths.stateDir}/kit.lock.json`,
      paths.kitCss,
      "build/handler.js",
    ];
    return {
      ...fixture,
      handler,
      evidence: {
        mapping: config,
        files: Object.fromEntries(
          files.map((file) => [
            file,
            sha256Hex(readFileSync(path.join(fixture.root, file))),
          ]),
        ),
      },
    };
  } catch (error) {
    fixture.cleanup();
    throw error;
  }
}

export const buildSpinnerConsumer = (custom: boolean) =>
  buildComponentConsumer("spinner", custom);
export const buildButtonConsumer = (custom: boolean) =>
  buildComponentConsumer("button", custom);
