import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import type { KitLock } from "../../src/codegen/lock.js";
import { parseManagedCss } from "../../src/codegen/css-parse.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { copyConsumerFixture } from "../helpers/fixture.js";
import { runCli } from "../helpers/cli.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

const roots = JSON.parse(
  readFileSync("registry/registry.json", "utf8"),
).items.map((i: { id: string }) => i.id) as string[];
for (const custom of [false, true])
  test(`real full catalog retirement, detached customization and re-add ${custom ? "custom" : "default"}`, () => {
    const fixture = copyConsumerFixture();
    try {
      const config = custom
        ? { ...DEFAULT_KIT_CONFIG, uiDir: "app/ui", stylesDir: "assets/styles" }
        : DEFAULT_KIT_CONFIG;
      const derived = deriveKitPaths(config);
      const file = (relative: string) => path.join(fixture.root, relative);
      const read = (relative: string) => readFileSync(file(relative), "utf8");
      const write = (relative: string, text: string) => {
        mkdirSync(path.dirname(file(relative)), { recursive: true });
        writeFileSync(file(relative), text);
      };
      const transcript: unknown[] = [];
      const run = (args: string[], status = 0) => {
        const result = runCli([...args, "--json", "--cwd", fixture.root], {
          timeoutMs: 30000,
        });
        transcript.push({ args, result });
        assert.equal(result.status, status, result.stdout + result.stderr);
        assert.equal(result.stderr, "");
        return JSON.parse(result.stdout);
      };
      if (custom) write(`${derived.stateDir}/kit.json`, JSON.stringify(config));
      run(["init"]);
      for (const id of roots) run(["add", id]);
      const lock = () =>
        JSON.parse(read(`${derived.stateDir}/kit.lock.json`)) as KitLock;
      const initial = lock();
      assert.deepEqual(initial.requested, [...roots].sort());
      const initialBytes = new Map(
        initial.files.map((record) => [record.path, read(record.path)]),
      );
      const badge = `${config.uiDir}/badge.svelte`;
      const customSource =
        read(badge) + "\n<!-- Application-owned badge customization -->\n";
      write(badge, customSource);
      const css = read(derived.kitCss);
      const parsed = parseManagedCss(css);
      assert.equal(parsed.ok, true);
      if (!parsed.ok) throw new Error("CSS parse failed");
      const card = parsed.value.blocks.find((block) => block.id === "card")!;
      const customCard =
        css.slice(card.contentStart, card.contentEnd) +
        "\n.application-card { padding: 13px; }\n";
      write(
        derived.kitCss,
        css.slice(0, card.contentStart) +
          customCard +
          css.slice(card.contentEnd) +
          "\n.application-css { margin: 3px; }\n",
      );
      const appExports =
        "\nexport { applicationValue as AppValue } from './application.js';\n";
      write(
        `${config.uiDir}/application.ts`,
        "export const applicationValue = 'application-owned';\n",
      );
      write(derived.rootExports, read(derived.rootExports) + appExports);
      const applicationImport =
        "import { DialogRoot } from './dialog/index.js';\nexport const applicationDialog = DialogRoot;\n";
      write(`${config.uiDir}/application-import.ts`, applicationImport);
      const removed = new Set([
        "spinner",
        "tokens",
        "anchor",
        "badge",
        "card",
        "dialog",
      ]);
      const desired = roots.filter((root) => !removed.has(root));
      write(
        `${derived.stateDir}/kit.json`,
        JSON.stringify({ ...config, requested: desired }),
      );
      const beforeDry = snapshotTree(fixture.root);
      run(["sync", "--dry-run"]);
      assert.deepEqual(snapshotTree(fixture.root), beforeDry);
      const result = run(["sync"]);
      const retired = lock();
      assert.deepEqual(retired.requested, [...desired].sort());
      for (const dependency of ["spinner", "tokens", "anchor"]) {
        assert.equal(
          retired.items.find((i) => i.id === dependency)?.origin,
          "transitive",
        );
        assert.ok(!retired.requested.includes(dependency));
      }
      for (const owner of ["badge", "card", "dialog"]) {
        assert.ok(!retired.items.some((item) => item.id === owner));
        assert.ok(!retired.files.some((entry) => entry.owner === owner));
        assert.ok(!retired.cssBlocks.some((entry) => entry.owner === owner));
      }
      for (const record of initial.files) {
        if (["badge", "card", "dialog"].includes(record.owner))
          assert.equal(
            existsSync(file(record.path)),
            record.path === badge,
            record.path,
          );
        else {
          assert.deepEqual(
            retired.files.find((entry) => entry.path === record.path),
            record,
          );
          assert.equal(read(record.path), initialBytes.get(record.path));
        }
      }
      assert.equal(read(badge), customSource);
      const afterCss = read(derived.kitCss);
      const afterParsed = parseManagedCss(afterCss);
      assert.equal(afterParsed.ok, true);
      if (!afterParsed.ok) throw new Error("retired CSS parse failed");
      const retainedCard = afterParsed.value.blocks.find(
        (block) => block.id === "card",
      )!;
      assert.equal(
        afterCss.slice(retainedCard.contentStart, retainedCard.contentEnd),
        customCard,
      );
      assert.ok(
        !afterParsed.value.blocks.some((block) =>
          ["badge", "dialog"].includes(block.id),
        ),
      );
      assert.ok(afterCss.endsWith("\n.application-css { margin: 3px; }\n"));
      assert.ok(read(derived.rootExports).endsWith(appExports));
      assert.equal(
        read(`${config.uiDir}/application-import.ts`),
        applicationImport,
      );
      const warnings = result.diagnostics.filter(
        (entry: { code: string }) =>
          entry.code === "RETIRED_CUSTOMIZATION_PRESERVED",
      );
      assert.equal(warnings.length, 2);
      assert.ok(
        warnings.every((entry: { guidance: string }) =>
          /Review application imports.*never rewrites application callsites/.test(
            entry.guidance,
          ),
        ),
      );
      // A retained retired Svelte file can still refer to retired types; policy
      // warns for manual disposition and never claims arbitrary callsite repair.
      assert.match(read(badge), /badge.types.js/);
      assert.equal(existsSync(file(`${config.uiDir}/badge.types.ts`)), false);
      const stable = snapshotTree(fixture.root);
      run(["sync"]);
      assert.deepEqual(
        snapshotTree(fixture.root),
        stable,
        "detached content is never silently reowned on sync",
      );
      for (const id of ["badge", "card"]) {
        const before = snapshotTree(fixture.root);
        const conflict = run(["add", id], 10);
        assert.equal(conflict.status, "conflict");
        assert.deepEqual(
          snapshotTree(fixture.root),
          before,
          "re-add retained source/CSS blocks the entire batch, including lock/config",
        );
        assert.deepEqual(lock(), retired);
      }
      run(["add", "dialog"]);
      const readded = lock();
      assert.ok(readded.requested.includes("dialog"));
      assert.equal(
        readded.items.find((i) => i.id === "dialog")?.origin,
        "explicit",
      );
      for (const record of initial.files.filter(
        (entry) => entry.owner === "dialog",
      )) {
        assert.equal(
          read(record.path),
          readFileSync(
            path.join(
              "registry/ui",
              record.path.slice(config.uiDir.length + 1),
            ),
            "utf8",
          ),
        );
        assert.equal(
          readded.files.find((entry) => entry.path === record.path)?.baseHash,
          record.baseHash,
        );
      }
      assert.equal(read(badge), customSource);
      assert.ok(!readded.files.some((entry) => entry.owner === "badge"));
      assert.ok(!readded.cssBlocks.some((entry) => entry.owner === "card"));
      const finalDesired = readded.requested.filter(
        (id) => !["button", "router-link"].includes(id),
      );
      write(
        `${derived.stateDir}/kit.json`,
        JSON.stringify({ ...config, requested: finalDesired }),
      );
      run(["sync"]);
      const final = lock();
      for (const owner of ["button", "spinner", "router-link", "anchor"]) {
        assert.ok(!final.items.some((item) => item.id === owner));
        for (const record of initial.files.filter(
          (entry) => entry.owner === owner,
        ))
          assert.equal(existsSync(file(record.path)), false, record.path);
      }
      assert.equal(
        final.items.find((item) => item.id === "tokens")?.origin,
        "transitive",
      );
      assert.deepEqual(final.requested, [...finalDesired].sort());
      assert.equal(read(badge), customSource);
      assert.ok(read(derived.rootExports).endsWith(appExports));
      mkdirSync(".artifacts/verification/catalog-retirement", {
        recursive: true,
      });
      writeFileSync(
        `.artifacts/verification/catalog-retirement/${custom ? "custom" : "default"}-${process.pid}.json`,
        JSON.stringify(
          {
            initial,
            retired,
            readded,
            final,
            transcript,
            customSource,
            customCard,
            applicationImport,
          },
          null,
          2,
        ),
      );
    } finally {
      fixture.cleanup();
    }
  });
