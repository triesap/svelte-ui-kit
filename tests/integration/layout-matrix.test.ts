import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { copyConsumerFixture, runFixtureScript } from "../helpers/fixture.js";
import { createTempProject } from "../helpers/project.js";
import { runCli } from "../helpers/cli.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

const mappings = [
  {
    label: "default",
    uiDir: DEFAULT_KIT_CONFIG.uiDir,
    stylesDir: DEFAULT_KIT_CONFIG.stylesDir,
    routes: "src/routes",
  },
  {
    label: "outside-src",
    uiDir: "app/ui",
    stylesDir: "assets/styles",
    routes: "src/routes",
  },
  {
    label: "spaces-and-static-routes",
    uiDir: "app/design system/ui",
    stylesDir: "assets/theme styles",
    routes: "app/views",
  },
];
const requested = JSON.parse(
  readFileSync("registry/registry.json", "utf8"),
).items.map((item: { id: string }) => item.id) as string[];
for (const mapping of mappings)
  test(`all catalog explicit mapping and workspace --cwd isolation: ${mapping.label}`, () => {
    const workspace = createTempProject({ prefix: "suik-layout-workspace-" });
    let fixture: ReturnType<typeof copyConsumerFixture> | undefined;
    try {
      workspace.writeDir("apps");
      fixture = copyConsumerFixture({
        parent: path.join(workspace.root, "apps"),
      });
      const selected = path
        .relative(workspace.root, fixture.root)
        .split(path.sep)
        .join("/");
      workspace.writeFile(
        "package.json",
        JSON.stringify({
          name: "layout-workspace",
          private: true,
          workspaces: [selected, "apps/neighbor"],
        }),
      );
      workspace.writeFile(
        "pnpm-workspace.yaml",
        `packages:\n  - '${selected}'\n  - 'apps/neighbor'\n`,
      );
      workspace.writeFile(
        "apps/neighbor/package.json",
        JSON.stringify({
          name: "neighbor",
          private: true,
          devDependencies: { "@sveltejs/kit": "2.70.3" },
        }),
      );
      workspace.writeFile(
        "apps/neighbor/src/routes/+layout.svelte",
        "<p>Untouched neighbor</p>\n",
      );
      workspace.writeFile(
        "apps/neighbor/.env.local",
        "TEST_SENTINEL=owned-fixture-only\n",
      );
      const config = {
        ...DEFAULT_KIT_CONFIG,
        uiDir: mapping.uiDir,
        stylesDir: mapping.stylesDir,
        layoutFile: `${mapping.routes}/+layout.svelte`,
      };
      const derived = deriveKitPaths(config);
      const write = (file: string, contents: string) => {
        const target = path.join(fixture!.root, file);
        mkdirSync(path.dirname(target), { recursive: true });
        writeFileSync(target, contents);
      };
      if (mapping.routes !== "src/routes") {
        mkdirSync(path.dirname(path.join(fixture.root, mapping.routes)), {
          recursive: true,
        });
        renameSync(
          path.join(fixture.root, "src/routes"),
          path.join(fixture.root, mapping.routes),
        );
        const original = readFileSync(
          path.join(fixture.root, "svelte.config.js"),
          "utf8",
        );
        assert.equal(original.split("adapter: adapter(),").length, 2);
        write(
          "svelte.config.js",
          original.replace(
            "adapter: adapter(),",
            `adapter: adapter(), files: { routes: ${JSON.stringify(mapping.routes)} },`,
          ),
        );
      }
      write(`${derived.stateDir}/kit.json`, JSON.stringify(config));
      const outside = () =>
        snapshotTree(workspace.root).filter(
          (entry) =>
            entry.path !== selected && !entry.path.startsWith(`${selected}/`),
        );
      const before = outside();
      const transcript: unknown[] = [];
      const ambiguousBefore = snapshotTree(workspace.root);
      const ambiguous = runCli(["init", "--json"], { cwd: workspace.root });
      assert.notEqual(ambiguous.status, 0);
      assert.match(ambiguous.stdout, /PROJECT_AMBIGUOUS_WORKSPACE/);
      assert.equal(ambiguous.stderr, "");
      assert.deepEqual(snapshotTree(workspace.root), ambiguousBefore);
      transcript.push({ args: ["init", "--json"], result: ambiguous });
      const cli = (args: string[], success = true) => {
        const readOnly = args.includes("--dry-run") || args[0] === "doctor";
        const selectedBefore = readOnly ? snapshotTree(fixture!.root) : null;
        const result = runCli([...args, "--json", "--cwd", selected], {
          cwd: workspace.root,
          timeoutMs: 30000,
        });
        transcript.push({ args, result });
        assert.equal(
          result.status === 0,
          success,
          result.stdout + result.stderr,
        );
        assert.equal(result.stderr, "");
        if (readOnly)
          assert.deepEqual(snapshotTree(fixture!.root), selectedBefore);
        assert.deepEqual(
          outside(),
          before,
          "workspace root and every neighbor retain exact bytes/modes/links",
        );
        return result;
      };
      cli(["init"]);
      for (const id of requested) cli(["add", id]);
      const themes =
        "/* application theme survives full catalog updates */\n:root { --kit-color-accent: #123456; }\n";
      const app =
        "/* application customization */\n.application-only { padding: 7px; }\n";
      write(derived.themesCss, themes);
      write(derived.appCss, app);
      cli(["sync"]);
      cli(["sync", "--dry-run"]);
      cli(["doctor", "--strict"]);
      assert.equal(
        readFileSync(path.join(fixture.root, derived.themesCss), "utf8"),
        themes,
      );
      assert.equal(
        readFileSync(path.join(fixture.root, derived.appCss), "utf8"),
        app,
      );
      const lock = JSON.parse(
        readFileSync(
          path.join(fixture.root, derived.stateDir, "kit.lock.json"),
          "utf8",
        ),
      );
      assert.deepEqual(lock.requested, [...requested].sort());
      for (const file of lock.files as { path: string; baseHash: string }[])
        if (
          file.path.startsWith(`${config.uiDir}/`) &&
          !file.path.startsWith(`${derived.stateDir}/`) &&
          file.path !== derived.rootExports
        ) {
          const bytes: Buffer = readFileSync(
            path.join(fixture.root, file.path),
          );
          assert.equal(sha256Hex(bytes), file.baseHash);
          assert.ok(
            bytes.equals(
              readFileSync(
                path.join(
                  "registry/ui",
                  file.path.slice(config.uiDir.length + 1),
                ),
              ),
            ),
            file.path,
          );
        }
      const folder = `${mapping.routes}/qualification/layout-matrix`;
      let module = path.posix.relative(folder, `${config.uiDir}/index.js`);
      if (!module.startsWith(".")) module = `./${module}`;
      for (const [source, target] of [
        ["+page.svelte", "+page.svelte"],
        ["Catalog.svelte", "Catalog.svelte"],
      ])
        write(
          `${folder}/${target}`,
          readFileSync(
            `tests/fixtures/qualification/catalog-hydration/${source}`,
            "utf8",
          ).replaceAll("__UI_MODULE__", module),
        );
      const checks: unknown[] = [];
      for (const script of ["check", "build"]) {
        const result = runFixtureScript(fixture.root, script);
        checks.push({ script, result });
        assert.equal(result.status, 0, result.stdout + result.stderr);
      }
      const handler = path.join(fixture.root, "build/handler.js");
      const render = spawnSync(
        process.execPath,
        [
          "tests/helpers/render-built-consumer.mjs",
          handler,
          "/qualification/layout-matrix?request=layout-render&on=1&extra=1",
        ],
        { encoding: "utf8", timeout: 90000 },
      );
      assert.equal(render.status, 0, render.stdout + render.stderr);
      assert.equal(render.stderr, "");
      const response = JSON.parse(render.stdout);
      assert.equal(response.status, 200);
      assert.match(response.body, /value="layout-render"/);
      assert.match(response.body, /Catalog request layout-render-extra/);
      assert.match(response.body, /kit-menu-trigger/);
      assert.deepEqual(outside(), before);
      mkdirSync(".artifacts/verification/layout-matrix", {
        recursive: true,
      });
      writeFileSync(
        `.artifacts/verification/layout-matrix/${mapping.label}-${process.pid}.json`,
        JSON.stringify(
          {
            mapping,
            lock,
            transcript,
            checks,
            response,
            handlerSha256: sha256Hex(readFileSync(handler)),
            themesSha256: sha256Hex(Buffer.from(themes)),
            outside: before,
          },
          null,
          2,
        ),
      );
    } finally {
      fixture?.cleanup();
      workspace.cleanup();
    }
  });

test("unsupported dynamic Svelte mapping is diagnosed without execution or mutation", () => {
  const fixture = copyConsumerFixture();
  try {
    writeFileSync(
      path.join(fixture.root, "svelte.config.js"),
      `import fs from 'node:fs';\nfs.writeFileSync('CONFIG_EXECUTED','must never run');\nconst route=process.env.ROUTES;\nexport default {kit:{files:{routes:route}}};\n`,
    );
    const before = snapshotTree(fixture.root);
    for (const args of [
      ["init"],
      ["init", "--dry-run"],
      ["add", "button"],
      ["doctor"],
      ["doctor", "--strict"],
    ]) {
      const result = runCli([...args, "--json", "--cwd", fixture.root]);
      if (args[0] === "doctor" && args.length === 1) {
        assert.equal(result.status, 0);
        const diagnostic = JSON.parse(result.stdout);
        assert.equal(diagnostic.status, "warning");
        assert.equal(diagnostic.data.ready, false);
      } else assert.notEqual(result.status, 0);
      assert.equal(result.stderr, "");
      assert.match(result.stdout, /PROJECT_SVELTEKIT_CONFIG_UNSUPPORTED/);
      assert.deepEqual(
        snapshotTree(fixture.root),
        before,
        "no managed state, sentinel execution, or hidden transaction files",
      );
    }
  } finally {
    fixture.cleanup();
  }
});
