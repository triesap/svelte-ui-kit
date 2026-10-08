import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
  type KitConfig,
} from "../../src/project/config.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { copyConsumerFixture, runFixtureScript } from "./fixture.js";

/** Build real CLI-installed applications; never mutate the maintained fixture. */
function buildComponentConsumer(
  item:
    | "spinner"
    | "button"
    | "switch"
    | "checkbox"
    | "collapsible"
    | "tabs"
    | "radio"
    | "dialog"
    | "alert-dialog"
    | "menu"
    | "core",
  custom: boolean,
  qualification: string = item,
  removeDescriptionObserverCleanup = false,
  packageRoot = process.cwd(),
  beforeBuild?: (root: string, config: KitConfig) => void,
) {
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
    const commands =
      item === "core"
        ? [
            ["init"],
            ...["tokens", "spinner", "button", "switch", "dialog"].map((id) => [
              "add",
              id,
            ]),
          ]
        : item === "alert-dialog" || item === "menu"
          ? [["init"], ["add", "dialog"], ["add", item]]
          : [["init"], ["add", item]];
    const executable = path.join(packageRoot, "dist/cli/main.js");
    for (const args of commands) {
      const result = spawnSync(
        process.execPath,
        [executable, ...args, "--json", "--cwd", fixture.root],
        { cwd: fixture.root, encoding: "utf8", timeout: 30000 },
      );
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.equal(result.stderr, "");
    }
    const sources =
      item === "collapsible"
        ? [
            ...["root", "trigger", "content"].map(
              (part) => `collapsible/${part}.svelte`,
            ),
            "collapsible/types.ts",
            "collapsible/index.ts",
          ]
        : item === "tabs"
          ? [
              ...["root", "list", "trigger", "content"].map(
                (part) => `tabs/${part}.svelte`,
              ),
              "tabs/types.ts",
              "tabs/index.ts",
            ]
          : item === "radio"
            ? [
                "radio/group.svelte",
                "radio/item.svelte",
                "radio/types.ts",
                "radio/index.ts",
              ]
            : item === "menu"
              ? [
                  ...[
                    "root",
                    "trigger",
                    "portal",
                    "content",
                    "item",
                    "radio-group",
                    "radio-item",
                    "item-indicator",
                  ].map((part) => `menu/${part}.svelte`),
                  "menu/types.ts",
                  "menu/index.ts",
                  ...[
                    "root",
                    "trigger",
                    "portal",
                    "overlay",
                    "content",
                    "title",
                    "description",
                    "close",
                  ].map((part) => `dialog/${part}.svelte`),
                  "dialog/types.ts",
                  "dialog/index.ts",
                ]
              : item === "alert-dialog"
                ? [
                    ...[
                      "root",
                      "trigger",
                      "portal",
                      "overlay",
                      "content",
                      "title",
                      "description",
                      "action",
                      "cancel",
                    ].map((part) => `alert-dialog/${part}.svelte`),
                    "alert-dialog/types.ts",
                    "alert-dialog/index.ts",
                    ...[
                      "root",
                      "trigger",
                      "portal",
                      "overlay",
                      "content",
                      "title",
                      "description",
                      "close",
                    ].map((part) => `dialog/${part}.svelte`),
                    "dialog/types.ts",
                    "dialog/index.ts",
                  ]
                : item === "button"
                  ? [
                      "button.svelte",
                      "button.types.ts",
                      "spinner.svelte",
                      "spinner.types.ts",
                    ]
                  : item === "dialog" || item === "core"
                    ? [
                        "root",
                        "trigger",
                        "portal",
                        "overlay",
                        "content",
                        "title",
                        "description",
                        "close",
                      ]
                        .map((part) => `dialog/${part}.svelte`)
                        .concat(
                          ["dialog/types.ts", "dialog/index.ts"],
                          item === "core"
                            ? [
                                "spinner.svelte",
                                "spinner.types.ts",
                                "button.svelte",
                                "button.types.ts",
                                "switch.svelte",
                                "switch.types.ts",
                              ]
                            : [],
                        )
                    : item === "switch" || item === "checkbox"
                      ? [`${item}.svelte`, `${item}.types.ts`]
                      : ["spinner.svelte", "spinner.types.ts"];
    for (const name of sources) {
      assert.ok(
        readFileSync(path.join(fixture.root, config.uiDir, name)).equals(
          readFileSync(path.join(packageRoot, "registry/ui", name)),
        ),
      );
    }
    if (removeDescriptionObserverCleanup) {
      assert.ok(item === "dialog" || item === "alert-dialog");
      const target = path.join(
        fixture.root,
        config.uiDir,
        `${item}/content.svelte`,
      );
      const source = readFileSync(target, "utf8");
      const cleanup = "return () => observer.disconnect();";
      assert.equal(source.split(cleanup).length, 2);
      writeFileSync(
        target,
        source.replace(cleanup, "// Owned negative control: cleanup removed."),
      );
    }
    const route = `src/routes/qualification/${qualification}/+page.svelte`;
    let module = path.posix.relative(
      path.posix.dirname(route),
      `${config.uiDir}/index.js`,
    );
    if (!module.startsWith(".")) module = `./${module}`;
    const template = readFileSync(
      `tests/fixtures/qualification/${qualification}/+page.svelte`,
      "utf8",
    );
    assert.equal(template.match(/__UI_MODULE__/g)?.length, 2);
    write(route, template.replaceAll("__UI_MODULE__", module));
    beforeBuild?.(fixture.root, config);
    const logRoot = "implementation/evidence/logs/generated-consumer";
    mkdirSync(logRoot, { recursive: true });
    const logPrefix = `${qualification}-${custom ? "custom" : "default"}-${process.pid}-${Date.now()}`;
    const logs: string[] = [];
    for (const script of ["check", "build"]) {
      const result = runFixtureScript(fixture.root, script);
      const log = `${logRoot}/${logPrefix}-${script}.log`;
      writeFileSync(
        log,
        `${result.stdout}\n${result.stderr}\nstatus=${result.status}; signal=${result.signal}\n`,
      );
      logs.push(log);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    }
    const handler = path.join(fixture.root, "build/handler.js");
    const productionFiles: string[] = [];
    const inventory = (directory: string) => {
      for (const entry of readdirSync(path.join(fixture.root, directory), {
        withFileTypes: true,
      })) {
        const file = `${directory}/${entry.name}`;
        if (entry.isDirectory()) inventory(file);
        else {
          assert.ok(entry.isFile(), file);
          productionFiles.push(file);
        }
      }
    };
    inventory("build");
    const files = [
      ...sources.map((file) => `${config.uiDir}/${file}`),
      route,
      `${config.uiDir}/index.ts`,
      `${paths.stateDir}/kit.lock.json`,
      paths.kitCss,
      ...productionFiles.sort(),
    ];
    return {
      ...fixture,
      handler,
      executable,
      route: `qualification/${qualification}`,
      evidence: {
        mapping: config,
        item,
        qualification,
        ownedMutation: removeDescriptionObserverCleanup
          ? "description-observer-cleanup-removed"
          : null,
        logs,
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

export const buildSwitchConsumer = (custom: boolean) =>
  buildComponentConsumer("switch", custom);

export const buildDialogConsumer = (
  custom: boolean,
  qualification:
    | "dialog"
    | "dialog-interactions"
    | "dialog-themes"
    | "dialog-hydration"
    | "dialog-shadow" = "dialog",
  removeDescriptionObserverCleanup = false,
) =>
  buildComponentConsumer(
    "dialog",
    custom,
    qualification,
    removeDescriptionObserverCleanup,
  );

export const buildAlertDialogConsumer = (
  custom: boolean,
  qualification:
    | "alert-dialog-interactions"
    | "alert-dialog-themes"
    | "alert-dialog-hydration" = "alert-dialog-interactions",
  removeDescriptionObserverCleanup = false,
) =>
  buildComponentConsumer(
    "alert-dialog",
    custom,
    qualification,
    removeDescriptionObserverCleanup,
  );

export const buildCoreConsumer = (
  custom: boolean,
  packageRoot = process.cwd(),
  beforeBuild?: (root: string, config: KitConfig) => void,
) =>
  buildComponentConsumer(
    "core",
    custom,
    "core",
    false,
    packageRoot,
    beforeBuild,
  );

export const buildMenuConsumer = (
  custom: boolean,
  qualification = "menu",
  beforeBuild?: (root: string, config: KitConfig) => void,
) =>
  buildComponentConsumer(
    "menu",
    custom,
    qualification,
    false,
    process.cwd(),
    beforeBuild,
  );

export const buildCheckboxConsumer = (
  custom: boolean,
  beforeBuild?: (root: string, config: KitConfig) => void,
) =>
  buildComponentConsumer(
    "checkbox",
    custom,
    "checkbox",
    false,
    process.cwd(),
    beforeBuild,
  );

export const buildRadioConsumer = (
  custom: boolean,
  beforeBuild?: (root: string, config: KitConfig) => void,
) =>
  buildComponentConsumer(
    "radio",
    custom,
    "radio",
    false,
    process.cwd(),
    beforeBuild,
  );

export const buildTabsConsumer = (
  custom: boolean,
  beforeBuild?: (root: string, config: KitConfig) => void,
) =>
  buildComponentConsumer(
    "tabs",
    custom,
    "tabs",
    false,
    process.cwd(),
    beforeBuild,
  );

export const buildCollapsibleConsumer = (
  custom: boolean,
  beforeBuild?: (root: string, config: KitConfig) => void,
) =>
  buildComponentConsumer(
    "collapsible",
    custom,
    "collapsible",
    false,
    process.cwd(),
    beforeBuild,
  );
