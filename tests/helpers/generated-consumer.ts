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
    | "anchor"
    | "avatar"
    | "badge"
    | "card"
    | "alert"
    | "status"
    | "progress"
    | "separator"
    | "skeleton"
    | "router-link"
    | "switch"
    | "checkbox"
    | "collapsible"
    | "field"
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
      item === "field"
        ? [
            "field/root.svelte",
            "field/surface.svelte",
            "field/label.svelte",
            "field/message.svelte",
            "field/required.svelte",
            "field/text-input.svelte",
            "field/text-area.svelte",
            "field/native-select.svelte",
            "field/select-icon.svelte",
            "field/text-field.svelte",
            "field/text-area-field.svelte",
            "field/select-field.svelte",
            "field/types.ts",
            "field/context.ts",
            "field/index.ts",
          ]
        : item === "collapsible"
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
                      : item === "router-link"
                        ? [
                            "router-link.svelte",
                            "router-link.types.ts",
                            "anchor.svelte",
                            "anchor.types.ts",
                          ]
                        : item === "switch" ||
                            item === "checkbox" ||
                            item === "anchor" ||
                            item === "avatar" ||
                            item === "badge" ||
                            item === "card" ||
                            item === "alert" ||
                            item === "status" ||
                            item === "progress" ||
                            item === "separator" ||
                            item === "skeleton"
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
    const logRoot = ".artifacts/verification/generated-consumer";
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

export const buildAnchorConsumer = (custom: boolean) =>
  buildComponentConsumer(
    "anchor",
    custom,
    "anchor",
    false,
    process.cwd(),
    (root) => {
      mkdirSync(path.join(root, "static"), { recursive: true });
      writeFileSync(
        path.join(root, "static/anchor-download.txt"),
        "Native Anchor download\n",
      );
    },
  );

export const buildRouterLinkConsumer = (custom: boolean, based: boolean) => {
  const base = based ? "/recipe-base" : "";
  const consumer = buildComponentConsumer(
    "router-link",
    custom,
    "router-link",
    false,
    process.cwd(),
    (root) => {
      mkdirSync(path.join(root, "static"), { recursive: true });
      writeFileSync(
        path.join(root, "static/anchor-download.txt"),
        "Native Anchor download\n",
      );
      const configFile = path.join(root, "svelte.config.js");
      const config = readFileSync(configFile, "utf8");
      assert.equal(config.split("adapter: adapter(),").length, 2);
      writeFileSync(
        configFile,
        config.replace(
          "adapter: adapter(),",
          `adapter: adapter(), paths: { base: ${JSON.stringify(base)} },`,
        ),
      );
      writeFileSync(
        path.join(root, "src/routes/qualification/router-link/+page.server.ts"),
        readFileSync(
          "tests/fixtures/qualification/router-link/+page.server.ts",
        ),
      );
      mkdirSync(
        path.join(root, "src/routes/qualification/router-link-target"),
        { recursive: true },
      );
      writeFileSync(
        path.join(
          root,
          "src/routes/qualification/router-link-target/+page.svelte",
        ),
        "<h1>Native code preload destination</h1>\n",
      );
    },
  );
  return {
    ...consumer,
    route: `${base.slice(1)}${base ? "/" : ""}${consumer.route}`,
    evidence: {
      ...consumer.evidence,
      base,
      files: {
        ...consumer.evidence.files,
        ...Object.fromEntries(
          [
            "svelte.config.js",
            "src/routes/qualification/router-link/+page.server.ts",
            "src/routes/qualification/router-link-target/+page.svelte",
          ].map((file) => [
            file,
            sha256Hex(readFileSync(path.join(consumer.root, file))),
          ]),
        ),
      },
    },
  };
};

export const buildSwitchConsumer = (custom: boolean) =>
  buildComponentConsumer("switch", custom);

export const buildAvatarConsumer = (custom: boolean) =>
  buildComponentConsumer("avatar", custom);

export const buildBadgeConsumer = (custom: boolean) =>
  buildComponentConsumer("badge", custom);

export const buildCardConsumer = (custom: boolean) =>
  buildComponentConsumer("card", custom);

export const buildAlertConsumer = (custom: boolean) =>
  buildComponentConsumer("alert", custom);

export const buildStatusConsumer = (custom: boolean) =>
  buildComponentConsumer("status", custom);

export const buildProgressConsumer = (custom: boolean) =>
  buildComponentConsumer("progress", custom);

export const buildSeparatorConsumer = (custom: boolean) =>
  buildComponentConsumer("separator", custom);

export const buildSkeletonConsumer = (custom: boolean) =>
  buildComponentConsumer("skeleton", custom);

/** Identity is a qualification route, never an installable registry alias. */
export function buildIdentityConsumer(custom: boolean) {
  const requested = [
    "field",
    "switch",
    "checkbox",
    "radio",
    "tabs",
    "collapsible",
    "dialog",
    "alert-dialog",
    "menu",
  ];
  return buildInstalledItemsConsumer(custom, "identity", requested);
}

export function buildCatalogConsumer(custom: boolean) {
  const registry = JSON.parse(readFileSync("registry/registry.json", "utf8"));
  return buildInstalledItemsConsumer(
    custom,
    "catalog",
    registry.items.map((item: { id: string }) => item.id),
    (root, config) => {
      const manifests = registry.items.map((item: { manifest: string }) =>
        JSON.parse(readFileSync(`registry/${item.manifest}`, "utf8")),
      );
      const exports = manifests.flatMap(
        (manifest: { exports: { name: string; kind: string }[] }) =>
          manifest.exports,
      );
      const module = `./${path.posix.relative("src", `${config.uiDir}/index.js`)}`;
      const types = exports
        .filter((entry: { kind: string }) => entry.kind === "type")
        .map((entry: { name: string }) => entry.name);
      const values = exports
        .filter((entry: { kind: string }) => entry.kind === "value")
        .map((entry: { name: string }) => `UI.${entry.name}`);
      writeFileSync(
        path.join(root, "src/catalog-exports.ts"),
        `import * as UI from ${JSON.stringify(module)};\nimport type {${types.join(",")}} from ${JSON.stringify(module)};\nexport const catalogValues = [${values.join(",")}];\nexport type CatalogTypes = [${types.join(",")}];\n`,
      );
    },
  );
}

export function buildWrapperConsumer(custom: boolean) {
  const registry = JSON.parse(readFileSync("registry/registry.json", "utf8"));
  return buildInstalledItemsConsumer(
    custom,
    "wrapper-contracts",
    registry.items.map((item: { id: string }) => item.id),
  );
}

export function buildCssConsumer(custom: boolean) {
  const registry = JSON.parse(readFileSync("registry/registry.json", "utf8"));
  return buildInstalledItemsConsumer(
    custom,
    "css-contracts",
    registry.items.map((item: { id: string }) => item.id),
  );
}

export function buildCatalogThemesConsumer(custom: boolean) {
  const registry = JSON.parse(readFileSync("registry/registry.json", "utf8"));
  let preservation: Record<string, string> = {};
  const consumer = buildInstalledItemsConsumer(
    custom,
    "catalog-themes",
    registry.items.map((item: { id: string }) => item.id),
    (root, config) => {
      const paths = deriveKitPaths(config);
      const folder = "src/routes/qualification/catalog-themes";
      let module = path.posix.relative(folder, `${config.uiDir}/index.js`);
      if (!module.startsWith(".")) module = `./${module}`;
      const catalog = readFileSync(
        "tests/fixtures/qualification/css-contracts/+page.svelte",
        "utf8",
      )
        .replaceAll("__UI_MODULE__", module)
        .replace('open={side === "bottom"}', "open={false}")
        .replace(/\s+forceMount\b/g, "");
      assert.ok(!catalog.includes("forceMount"));
      writeFileSync(path.join(root, folder, "Catalog.svelte"), catalog);
      writeFileSync(
        path.join(root, paths.themesCss),
        readFileSync("tests/fixtures/qualification/catalog-themes/themes.css"),
      );
      writeFileSync(
        path.join(root, paths.appCss),
        "/* Application-owned customization must survive sync exactly. */\n.catalog-owned { letter-spacing: 0.013em; }\n",
      );
      const files = [
        paths.themesCss,
        paths.appCss,
        config.layoutFile,
        `${folder}/Catalog.svelte`,
      ];
      const before = files.map((file) => readFileSync(path.join(root, file)));
      const result = spawnSync(
        process.execPath,
        [path.resolve("dist/cli/main.js"), "sync", "--json", "--cwd", root],
        { cwd: root, encoding: "utf8", timeout: 30000 },
      );
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.equal(result.stderr, "");
      preservation = Object.fromEntries(
        files.map((file, index) => {
          assert.ok(
            readFileSync(path.join(root, file)).equals(before[index]!),
            file,
          );
          return [file, sha256Hex(before[index]!)];
        }),
      );
    },
  );
  return {
    ...consumer,
    evidence: {
      ...consumer.evidence,
      themeSyncPreservation: preservation,
      files: { ...consumer.evidence.files, ...preservation },
    },
  };
}

export function buildAccessibilityConsumer(custom: boolean) {
  const registry = JSON.parse(readFileSync("registry/registry.json", "utf8"));
  return buildInstalledItemsConsumer(
    custom,
    "accessibility-states",
    registry.items.map((item: { id: string }) => item.id),
  );
}

export function buildCatalogHydrationConsumer(custom: boolean) {
  const registry = JSON.parse(readFileSync("registry/registry.json", "utf8"));
  const consumer = buildInstalledItemsConsumer(
    custom,
    "catalog-hydration",
    registry.items.map((item: { id: string }) => item.id),
    (root, config) => {
      const folder = "src/routes/qualification/catalog-hydration";
      let module = path.posix.relative(folder, `${config.uiDir}/index.js`);
      if (!module.startsWith(".")) module = `./${module}`;
      writeFileSync(
        path.join(root, folder, "Catalog.svelte"),
        readFileSync(
          "tests/fixtures/qualification/catalog-hydration/Catalog.svelte",
          "utf8",
        ).replaceAll("__UI_MODULE__", module),
      );
      mkdirSync(path.join(root, folder, "native"), { recursive: true });
      writeFileSync(
        path.join(root, folder, "native/+page.svelte"),
        readFileSync(
          "tests/fixtures/qualification/catalog-hydration/native-menu.svelte",
          "utf8",
        ),
      );
    },
  );
  const catalog = "src/routes/qualification/catalog-hydration/Catalog.svelte";
  return {
    ...consumer,
    evidence: {
      ...consumer.evidence,
      files: {
        ...consumer.evidence.files,
        [catalog]: sha256Hex(readFileSync(path.join(consumer.root, catalog))),
        "src/routes/qualification/catalog-hydration/native/+page.svelte":
          sha256Hex(
            readFileSync(
              path.join(
                consumer.root,
                "src/routes/qualification/catalog-hydration/native/+page.svelte",
              ),
            ),
          ),
      },
    },
  };
}

export function buildFormsCompositionConsumer(custom: boolean) {
  return buildInstalledItemsConsumer(custom, "forms-composition", [
    "tokens",
    "spinner",
    "button",
    "field",
    "checkbox",
    "radio",
    "switch",
  ]);
}

export function buildCompositionExamplesConsumer(custom: boolean) {
  return buildInstalledItemsConsumer(custom, "composition-examples", [
    "field",
    "tokens",
    "spinner",
    "button",
    "checkbox",
    "anchor",
    "router-link",
    "alert",
    "status",
    "collapsible",
    "dialog",
  ]);
}

export function buildOverlayCompositionConsumer(custom: boolean) {
  return buildInstalledItemsConsumer(custom, "overlay-composition", [
    "field",
    "tokens",
    "dialog",
    "alert-dialog",
    "menu",
  ]);
}

export function buildModalForceMountConsumer(custom: boolean) {
  return buildInstalledItemsConsumer(custom, "modal-force-mount", [
    "tokens",
    "field",
    "dialog",
    "alert-dialog",
  ]);
}

function buildInstalledItemsConsumer(
  custom: boolean,
  qualification: string,
  requested: string[],
  beforeBuild?: (root: string, config: KitConfig) => void,
) {
  let additional: Record<string, string> = {};
  const consumer = buildComponentConsumer(
    "field",
    custom,
    qualification,
    false,
    process.cwd(),
    (root, config) => {
      for (const item of requested.filter((item) => item !== "field")) {
        const result = spawnSync(
          process.execPath,
          [
            path.resolve("dist/cli/main.js"),
            "add",
            item,
            "--json",
            "--cwd",
            root,
          ],
          { cwd: root, encoding: "utf8", timeout: 30000 },
        );
        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.equal(result.stderr, "");
      }
      const lock = JSON.parse(
        readFileSync(
          path.join(root, deriveKitPaths(config).stateDir, "kit.lock.json"),
          "utf8",
        ),
      );
      assert.deepEqual(lock.requested, [...requested].sort());
      additional = Object.fromEntries(
        lock.files
          .filter(
            (file: { path: string }) =>
              file.path.startsWith(`${config.uiDir}/`) &&
              file.path !== `${config.uiDir}/index.ts`,
          )
          .map((file: { path: string; baseHash: string }) => {
            const bytes = readFileSync(path.join(root, file.path));
            const relative = file.path.slice(config.uiDir.length + 1);
            if (!relative.startsWith("_kit/"))
              assert.ok(
                bytes.equals(readFileSync(path.join("registry/ui", relative))),
                file.path,
              );
            assert.equal(sha256Hex(bytes), file.baseHash);
            return [file.path, file.baseHash];
          }),
      );
      beforeBuild?.(root, config);
      if (qualification === "catalog")
        additional["src/catalog-exports.ts"] = sha256Hex(
          readFileSync(path.join(root, "src/catalog-exports.ts")),
        );
    },
  );
  return {
    ...consumer,
    evidence: {
      ...consumer.evidence,
      coinstalled: requested,
      files: { ...consumer.evidence.files, ...additional },
    },
  };
}

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

export const buildFieldConsumer = (
  custom: boolean,
  beforeBuild?: (root: string, config: KitConfig) => void,
) =>
  buildComponentConsumer(
    "field",
    custom,
    "field",
    false,
    process.cwd(),
    beforeBuild,
  );

/** Mixed form qualification installs each kit control through the real CLI. */
export function buildFieldFormsConsumer(custom: boolean) {
  const extra = [
    "checkbox.svelte",
    "checkbox.types.ts",
    "switch.svelte",
    "switch.types.ts",
    "radio/group.svelte",
    "radio/item.svelte",
    "radio/types.ts",
    "radio/index.ts",
  ];
  let additional: Record<string, string> = {};
  const consumer = buildComponentConsumer(
    "field",
    custom,
    "field-forms",
    false,
    process.cwd(),
    (root, config) => {
      for (const item of ["checkbox", "switch", "radio"]) {
        const result = spawnSync(
          process.execPath,
          [
            path.resolve("dist/cli/main.js"),
            "add",
            item,
            "--json",
            "--cwd",
            root,
          ],
          { cwd: root, encoding: "utf8", timeout: 30000 },
        );
        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.equal(result.stderr, "");
      }
      const lock = JSON.parse(
        readFileSync(
          path.join(root, deriveKitPaths(config).stateDir, "kit.lock.json"),
          "utf8",
        ),
      );
      assert.deepEqual(lock.requested, [
        "checkbox",
        "field",
        "radio",
        "switch",
      ]);
      additional = Object.fromEntries(
        extra.map((file) => {
          const relative = `${config.uiDir}/${file}`,
            bytes = readFileSync(path.join(root, relative));
          assert.ok(
            bytes.equals(readFileSync(`registry/ui/${file}`)),
            relative,
          );
          return [relative, sha256Hex(bytes)];
        }),
      );
    },
  );
  return {
    ...consumer,
    evidence: {
      ...consumer.evidence,
      coinstalled: ["checkbox", "switch", "radio"],
      files: { ...consumer.evidence.files, ...additional },
    },
  };
}
