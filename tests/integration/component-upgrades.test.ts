import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import type { KitLock } from "../../src/codegen/lock.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { copyCorePackage } from "../helpers/core-workflow.js";
import { copyConsumerFixture, runFixtureScript } from "../helpers/fixture.js";
import { refreshRegistryContent } from "../helpers/registry-content.js";
import { runCli } from "../helpers/cli.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

const revisions = JSON.parse(
  readFileSync("tests/fixtures/upgrades/components/revisions.json", "utf8"),
) as {
  synthetic: boolean;
  oldVersion: string;
  incomingVersion: string;
  families: {
    id: string;
    source: string;
    types: string;
    marker: string;
    className: string;
  }[];
  scenarios: string[];
};
assert.equal(revisions.synthetic, true);
const write = (root: string, file: string, text: string) => {
  const target = path.join(root, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text);
};
const read = (root: string, file: string) =>
  readFileSync(path.join(root, file), "utf8");
function version(root: string, id: string, incoming: boolean) {
  const file = `registry/ui/${id}.json`;
  const manifest = JSON.parse(read(root, file));
  manifest.version = incoming
    ? revisions.incomingVersion
    : revisions.oldVersion;
  write(root, file, JSON.stringify(manifest));
  return manifest;
}
function evolve(root: string, id: string) {
  const family = revisions.families.find((entry) => entry.id === id)!;
  const source = `registry/ui/${family.source}`;
  const previous = read(root, source);
  const needle = `"${family.className}",`;
  assert.equal(previous.split(needle).length, 2);
  write(
    root,
    source,
    previous.replace(needle, `${needle} "kit-${id}-synthetic-upgrade",`),
  );
  const style = read(root, `registry/styles/${id}.css`);
  const end = `/* svelte-ui-kit:end ${id} */`;
  assert.equal(style.split(end).length, 2);
  write(
    root,
    `registry/styles/${id}.css`,
    style.replace(
      end,
      `\n/* Synthetic compatible DOM/CSS revision */\n.kit-${id}-synthetic-upgrade { --synthetic-${id}-revision: 1; }\n${end}`,
    ),
  );
  write(
    root,
    `registry/ui/${family.types}`,
    read(root, `registry/ui/${family.types}`) +
      `\nexport type ${family.marker} = "synthetic-incoming";\n`,
  );
  if (id !== "button")
    write(
      root,
      `registry/ui/${id}/index.ts`,
      read(root, `registry/ui/${id}/index.ts`) +
        `\nexport type { ${family.marker} } from "./types.js";\n`,
    );
  const manifest = version(root, id, true);
  manifest.exports.push({
    name: family.marker,
    target: family.types,
    kind: "type",
  });
  write(root, `registry/ui/${id}.json`, JSON.stringify(manifest));
}
for (const custom of [false, true])
  for (const scenario of revisions.scenarios)
    test(`real synthetic component cohorts ${custom ? "custom" : "default"}: ${scenario}`, () => {
      const pkg = copyCorePackage();
      const consumer = copyConsumerFixture();
      try {
        if (scenario === "dropped-barrel-control") {
          // Owned causal control: restore the old predicates in copied CLI
          // output without changing production or authoring source.
          const planner = read(pkg.root, "dist/codegen/plan-add.js");
          const guard =
            /partExports\.length === item\.manifest\.exports\.length &&\s+partExports\.length > 0/g;
          assert.equal([...planner.matchAll(guard)].length, 1);
          write(
            pkg.root,
            "dist/codegen/plan-add.js",
            planner.replace(guard, "partExports.length > 0"),
          );
          const authority = read(pkg.root, "dist/codegen/exports.js");
          assert.equal(
            authority.split("item.manifest.exports.every(").length,
            2,
          );
          write(
            pkg.root,
            "dist/codegen/exports.js",
            authority.replace(
              "item.manifest.exports.every(",
              "item.manifest.exports.some(",
            ),
          );
        }
        const config = custom
          ? {
              ...DEFAULT_KIT_CONFIG,
              uiDir: "app/ui",
              stylesDir: "assets/styles",
            }
          : DEFAULT_KIT_CONFIG;
        const paths = deriveKitPaths(config);
        for (const id of ["button", "dialog", "menu", "spinner", "badge"])
          version(pkg.root, id, false);
        refreshRegistryContent(pkg.root);
        if (custom)
          write(
            consumer.root,
            `${paths.stateDir}/kit.json`,
            JSON.stringify(config),
          );
        const transcript: unknown[] = [];
        const run = (args: string[], expected = 0) => {
          const result = runCli([...args, "--json", "--cwd", consumer.root], {
            packageRoot: pkg.root,
            timeoutMs: 30000,
            cwd: consumer.root,
          });
          transcript.push({ args, result });
          assert.equal(result.status, expected, result.stdout + result.stderr);
          assert.equal(result.stderr, "");
          return JSON.parse(result.stdout);
        };
        run(["init"]);
        for (const id of ["button", "dialog", "menu", "badge"])
          run(["add", id]);
        const lock = () =>
          JSON.parse(
            read(consumer.root, `${paths.stateDir}/kit.lock.json`),
          ) as KitLock;
        const old = lock();
        const button = `${config.uiDir}/button.svelte`,
          menuItem = `${config.uiDir}/menu/item.svelte`,
          badge = `${config.uiDir}/badge.svelte`;
        const local =
          scenario === "source-conflict" || scenario === "dependent-api"
            ? button
            : scenario === "cohort-menu" || scenario === "preserve-menu"
              ? menuItem
              : scenario === "unrelated-badge"
                ? badge
                : null;
        if (local)
          write(
            consumer.root,
            local,
            read(consumer.root, local) +
              "\n<!-- Local application revision -->\n",
          );
        const localBytes = local ? read(consumer.root, local) : null;
        if (scenario === "style-conflict")
          write(
            consumer.root,
            paths.kitCss,
            read(consumer.root, paths.kitCss).replace(
              ".kit-dialog-content {",
              ".kit-dialog-content {\n  --application-local-dialog: 1;",
            ),
          );
        if (scenario === "export-conflict") {
          const barrel = read(consumer.root, paths.rootExports);
          const needle = 'export { DialogClose } from "./dialog/index.js";';
          assert.equal(barrel.split(needle).length, 2);
          write(
            consumer.root,
            paths.rootExports,
            barrel.replace(
              needle,
              'export { DialogClose } from "./menu/index.js";',
            ),
          );
        }
        for (const id of ["button", "dialog", "menu"]) {
          if (id === "button" && scenario === "dependent-api") continue;
          if (id === "menu" && scenario === "preserve-menu")
            version(pkg.root, id, true);
          else evolve(pkg.root, id);
        }
        if (scenario === "dependent-api") {
          const manifest = version(pkg.root, "spinner", true);
          const marker = "SpinnerUpgradeMarker";
          write(
            pkg.root,
            "registry/ui/spinner.types.ts",
            read(pkg.root, "registry/ui/spinner.types.ts") +
              `\nexport type ${marker} = "synthetic-dependent-api";\n`,
          );
          manifest.exports.push({
            name: marker,
            target: "spinner.types.ts",
            kind: "type",
          });
          write(pkg.root, "registry/ui/spinner.json", JSON.stringify(manifest));
        }
        const registry = JSON.parse(read(pkg.root, "registry/registry.json"));
        registry.registryVersion = revisions.incomingVersion;
        write(pkg.root, "registry/registry.json", JSON.stringify(registry));
        refreshRegistryContent(pkg.root);
        const before = snapshotTree(consumer.root);
        const conflicting = [
          "source-conflict",
          "style-conflict",
          "export-conflict",
          "cohort-menu",
          "dependent-api",
        ].includes(scenario);
        const dry = run(["sync", "--dry-run"], conflicting ? 10 : 0);
        assert.deepEqual(
          snapshotTree(consumer.root),
          before,
          "dry-run never starts a transaction",
        );
        const applied = run(["sync"], conflicting ? 10 : 0);
        const after = lock();
        if (conflicting) {
          assert.equal(applied.status, "conflict");
          assert.deepEqual(
            snapshotTree(consumer.root),
            before,
            "source/CSS/export/dependent cohort conflict blocks the entire real batch",
          );
          assert.deepEqual(after, old, "no falsely advanced lock lineage");
          assert.match(JSON.stringify(dry.diagnostics), /cohort|conflict/i);
        } else {
          for (const family of revisions.families) {
            const installed = `${config.uiDir}/${family.source}`;
            assert.equal(
              read(consumer.root, installed),
              read(pkg.root, `registry/ui/${family.source}`),
            );
            if (family.id === "menu" && scenario === "preserve-menu") continue;
            assert.equal(
              after.files.find((entry) => entry.path === installed)?.baseHash,
              sha256Hex(
                readFileSync(
                  path.join(pkg.root, `registry/ui/${family.source}`),
                ),
              ),
            );
            assert.match(
              read(consumer.root, paths.kitCss),
              new RegExp(`kit-${family.id}-synthetic-upgrade`),
            );
            assert.match(
              read(consumer.root, paths.rootExports),
              new RegExp(family.marker),
            );
            assert.equal(
              after.cssBlocks.find((entry) => entry.owner === family.id)
                ?.itemVersion,
              revisions.incomingVersion,
            );
          }
          if (local) {
            assert.equal(read(consumer.root, local), localBytes);
            assert.deepEqual(
              after.files.find((entry) => entry.path === local),
              old.files.find((entry) => entry.path === local),
              "preserved local cohort member keeps its exact old base/version",
            );
            assert.match(
              read(consumer.root, local),
              /Local application revision/,
            );
          }
          for (const record of old.files.filter(
            (entry) => !["button", "dialog", "menu"].includes(entry.owner),
          ))
            assert.deepEqual(
              after.files.find((entry) => entry.path === record.path),
              record,
              "unrelated component lineage remains untouched",
            );
          const settled = snapshotTree(consumer.root);
          run(["sync"]);
          assert.deepEqual(snapshotTree(consumer.root), settled);
          if (scenario === "safe" || scenario === "dropped-barrel-control") {
            const folder = "src/routes/qualification/component-upgrades";
            let module = path.posix.relative(
              folder,
              `${config.uiDir}/index.js`,
            );
            if (!module.startsWith(".")) module = `./${module}`;
            write(
              consumer.root,
              `${folder}/+page.svelte`,
              `<script lang="ts">import {Button,DialogRoot,DialogTrigger,DialogPortal,DialogContent,DialogTitle,MenuRoot,MenuTrigger,MenuPortal,MenuContent,MenuItem} from ${JSON.stringify(module)};import type {ButtonUpgradeMarker,DialogUpgradeMarker,MenuUpgradeMarker} from ${JSON.stringify(module)};const markers:[ButtonUpgradeMarker,DialogUpgradeMarker,MenuUpgradeMarker]=["synthetic-incoming","synthetic-incoming","synthetic-incoming"];</script><h1>Synthetic compatible component revision</h1><p>{markers.join(",")}</p><Button>Revised button</Button><DialogRoot open><DialogTrigger>Trigger</DialogTrigger><DialogPortal disabled><DialogContent><DialogTitle>Revised dialog</DialogTitle></DialogContent></DialogPortal></DialogRoot><MenuRoot open><MenuTrigger>Menu trigger</MenuTrigger><MenuPortal disabled><MenuContent preventScroll={false}><MenuItem>Revised menu</MenuItem></MenuContent></MenuPortal></MenuRoot>`,
            );
            const checks: unknown[] = [];
            for (const script of ["check", "build"]) {
              const result = runFixtureScript(consumer.root, script);
              checks.push({ script, result });
              if (scenario === "dropped-barrel-control") {
                assert.notEqual(
                  result.status,
                  0,
                  "old predicates must fail the real consumer",
                );
                if (script === "check") {
                  assert.match(
                    result.stdout,
                    /has no exported member 'DialogRoot'/,
                  );
                  assert.match(
                    result.stdout,
                    /has no exported member 'MenuRoot'/,
                  );
                } else
                  assert.match(
                    result.stdout + result.stderr,
                    /is not exported|not exported by/,
                  );
              } else
                assert.equal(result.status, 0, result.stdout + result.stderr);
            }
            if (scenario === "dropped-barrel-control")
              transcript.push({
                counterfactual: "old partial compound-barrel generation",
                checks,
              });
            else {
              const rendered = spawnSync(
                process.execPath,
                [
                  "tests/helpers/render-built-consumer.mjs",
                  path.join(consumer.root, "build/handler.js"),
                  "/qualification/component-upgrades",
                ],
                { encoding: "utf8", timeout: 90000 },
              );
              assert.equal(
                rendered.status,
                0,
                rendered.stdout + rendered.stderr,
              );
              assert.equal(rendered.stderr, "");
              const response = JSON.parse(rendered.stdout);
              assert.equal(response.status, 200);
              for (const id of ["button", "dialog", "menu"])
                assert.match(
                  response.body,
                  new RegExp(`kit-${id}-synthetic-upgrade`),
                );
              assert.match(
                response.body,
                /synthetic-incoming,synthetic-incoming,synthetic-incoming/,
              );
              transcript.push({ checks, response });
            }
          }
        }
        mkdirSync(".artifacts/verification/component-upgrades", {
          recursive: true,
        });
        writeFileSync(
          `.artifacts/verification/component-upgrades/${custom ? "custom" : "default"}-${scenario}-${process.pid}.json`,
          JSON.stringify(
            { synthetic: true, scenario, old, after, transcript },
            null,
            2,
          ),
        );
      } finally {
        consumer.cleanup();
        pkg.cleanup();
      }
    });
