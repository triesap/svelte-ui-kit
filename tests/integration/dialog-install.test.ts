import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { copyConsumerFixture, runFixtureScript } from "../helpers/fixture.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { parseManagedCss } from "../../src/codegen/css-parse.js";

const parts = [
  "root",
  "trigger",
  "portal",
  "overlay",
  "content",
  "title",
  "description",
  "close",
];
const names = parts.map(
  (part) => `Dialog${part[0]!.toUpperCase() + part.slice(1)}`,
);
const files = [
  ...parts.map((part) => `${part}.svelte`),
  "index.ts",
  "types.ts",
].sort();
test("complete shipped Dialog has exactly eight flat parts/types and a single source/style/export cohort", () => {
  const loaded = loadRegistrySnapshot(createAssetProvider(process.cwd()));
  assert.equal(loaded.ok, true, JSON.stringify(loaded));
  if (!loaded.ok) return;
  const item = loaded.value.items.find((item) => item.id === "dialog")!;
  assert.deepEqual(item.manifest.registryDependencies, ["tokens"]);
  assert.deepEqual(item.manifest.npmDependencies, [
    { name: "bits-ui", range: "2.19.5-svelte-ui-kit.2", role: "runtime" },
  ]);
  assert.deepEqual(
    item.manifest.exports.map((entry) => entry.name),
    [...names, ...names.map((name) => `${name}Props`)],
  );
  assert.ok(
    item.manifest.exports.every((entry) => entry.target === "dialog/index.ts"),
  );
  assert.equal(item.files.length, 11);
  assert.ok(
    item.files.every(
      (file) => file.owner === "dialog" && file.cohort === "dialog",
    ),
  );
  assert.deepEqual(
    item.manifest.files.map((file) => file.target).sort(),
    files.map((file) => `dialog/${file}`),
  );
});

for (const custom of [false, true])
  test(`complete Dialog installs, compiles and replays in ${custom ? "custom" : "default"} consumer`, () => {
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
      const run = (args: string[]) => {
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
        return JSON.parse(result.stdout);
      };
      run(["init"]);
      const before = snapshotTree(fixture.root);
      run(["add", "dialog", "--dry-run"]);
      assert.deepEqual(snapshotTree(fixture.root), before);
      run(["add", "dialog"]);
      const lock = JSON.parse(
        readFileSync(
          path.join(fixture.root, `${paths.stateDir}/kit.lock.json`),
          "utf8",
        ),
      );
      assert.deepEqual(lock.requested, ["dialog"]);
      assert.deepEqual(
        lock.items.map((item: { id: string; origin: string }) => [
          item.id,
          item.origin,
        ]),
        [
          ["dialog", "explicit"],
          ["tokens", "transitive"],
        ],
      );
      assert.equal(
        lock.files.filter((file: { owner: string }) => file.owner === "dialog")
          .length,
        10,
      );
      assert.deepEqual(
        readdirSync(path.join(fixture.root, config.uiDir, "dialog")).sort(),
        files,
      );
      for (const name of files)
        assert.ok(
          readFileSync(
            path.join(fixture.root, config.uiDir, "dialog", name),
          ).equals(readFileSync(`registry/ui/dialog/${name}`)),
          name,
        );
      for (const file of lock.files)
        assert.equal(
          file.baseHash,
          sha256Hex(readFileSync(path.join(fixture.root, file.path))),
          file.path,
        );
      const css = parseManagedCss(
        readFileSync(path.join(fixture.root, paths.kitCss), "utf8"),
      );
      assert.equal(css.ok, true, JSON.stringify(css));
      if (css.ok)
        assert.deepEqual(
          css.value.blocks.map((block) => block.id),
          ["tokens", "dialog"],
        );
      const rootBarrel = readFileSync(
        path.join(fixture.root, config.uiDir, "index.ts"),
        "utf8",
      );
      for (const name of [...names, ...names.map((name) => `${name}Props`)])
        assert.match(rootBarrel, new RegExp(`\\b${name}\\b`));
      assert.equal(
        existsSync(
          path.join(fixture.root, path.posix.dirname(config.uiDir), "index.ts"),
        ),
        false,
      );
      const route = "src/routes/qualification/dialog/+page.svelte";
      let module = path.posix.relative(
        path.posix.dirname(route),
        `${config.uiDir}/index.js`,
      );
      if (!module.startsWith(".")) module = `./${module}`;
      const template = readFileSync(
        "tests/fixtures/qualification/dialog/+page.svelte",
        "utf8",
      );
      assert.equal(template.match(/__UI_MODULE__/g)?.length, 2);
      write(route, template.replaceAll("__UI_MODULE__", module));
      const typeFixture = "src/lib/qualification/dialog-public-types.ts";
      let typeModule = path.posix.relative(
        path.posix.dirname(typeFixture),
        `${config.uiDir}/index.js`,
      );
      if (!typeModule.startsWith(".")) typeModule = `./${typeModule}`;
      write(
        typeFixture,
        `import type {${names.map((name) => `${name}Props`).join(",")}} from ${JSON.stringify(typeModule)};\n${names.map((name, i) => `const part${i}: ${name}Props = {}; void part${i};`).join("\n")}\n`,
      );
      const evidenceRoot = ".artifacts/verification/dialog-install";
      mkdirSync(evidenceRoot, { recursive: true });
      const evidenceName = `${custom ? "custom" : "default"}-${process.pid}-${Date.now()}`;
      for (const script of ["check", "build"]) {
        const result = runFixtureScript(fixture.root, script);
        writeFileSync(
          `${evidenceRoot}/${evidenceName}-${script}.log`,
          `${result.stdout}\n${result.stderr}\nstatus=${result.status}; signal=${result.signal}\n`,
        );
        assert.equal(result.status, 0, result.stdout + result.stderr);
      }
      const rendered = spawnSync(
        process.execPath,
        [
          path.resolve("tests/helpers/render-built-consumer.mjs"),
          path.join(fixture.root, "build/handler.js"),
          "/qualification/dialog",
        ],
        { encoding: "utf8", timeout: 30000 },
      );
      assert.equal(rendered.status, 0, rendered.stdout + rendered.stderr);
      const response = JSON.parse(rendered.stdout);
      assert.equal(response.status, 200);
      assert.equal(
        response.handlerSha256,
        sha256Hex(readFileSync(path.join(fixture.root, "build/handler.js"))),
      );
      assert.match(response.body, /kit-dialog-trigger/);
      assert.match(response.body, /aria-expanded="false"/);
      assert.doesNotMatch(response.body, /id="generated-content"/);
      const artifactFiles = [
        ...files.map((file) => `${config.uiDir}/dialog/${file}`),
        `${config.uiDir}/index.ts`,
        paths.kitCss,
        `${paths.stateDir}/kit.json`,
        `${paths.stateDir}/kit.lock.json`,
        route,
        typeFixture,
        "build/handler.js",
      ];
      writeFileSync(
        `${evidenceRoot}/${evidenceName}-artifact.json`,
        JSON.stringify(
          {
            mapping: config,
            files: Object.fromEntries(
              artifactFiles.map((file) => [
                file,
                sha256Hex(readFileSync(path.join(fixture.root, file))),
              ]),
            ),
            response,
          },
          null,
          2,
        ),
      );
      const installed = snapshotTree(fixture.root);
      run(["add", "dialog"]);
      run(["sync"]);
      run(["doctor", "--strict"]);
      assert.deepEqual(snapshotTree(fixture.root), installed);
    } finally {
      fixture.cleanup();
    }
  });

test("actual built CLI refuses a required missing Dialog asset before any consumer effects", () => {
  const fixture = copyConsumerFixture();
  const packageRoot = mkdtempSync(
    path.join(os.tmpdir(), "suik-dialog-package-"),
  );
  try {
    for (const directory of ["registry", "schema", "dist"])
      cpSync(directory, path.join(packageRoot, directory), { recursive: true });
    cpSync("package.json", path.join(packageRoot, "package.json"));
    symlinkSync(
      path.resolve("node_modules"),
      path.join(packageRoot, "node_modules"),
    );
    const executable = path.join(packageRoot, "dist/cli/main.js");
    const run = (args: string[]) =>
      spawnSync(
        process.execPath,
        [executable, ...args, "--json", "--cwd", fixture.root],
        { cwd: fixture.root, encoding: "utf8", timeout: 30000 },
      );
    const initialized = run(["init"]);
    assert.equal(
      initialized.status,
      0,
      initialized.stdout + initialized.stderr,
    );
    rmSync(path.join(packageRoot, "registry/ui/dialog/content.svelte"));
    const before = snapshotTree(fixture.root);
    const refused = run(["add", "dialog"]);
    assert.equal(refused.status, 12, refused.stdout + refused.stderr);
    assert.equal(refused.stderr, "");
    assert.match(
      refused.stdout,
      /ASSET_IO_FAILURE|ASSET_NOT_FOUND|ASSET_MISSING/,
    );
    assert.deepEqual(snapshotTree(fixture.root), before);
  } finally {
    fixture.cleanup();
    rmSync(packageRoot, { recursive: true, force: true });
  }
});
