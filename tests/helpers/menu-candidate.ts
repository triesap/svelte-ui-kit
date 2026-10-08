import assert from "node:assert/strict";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { sha256Hex } from "../../src/codegen/digest.js";
import { copyConsumerFixture, runFixtureScript } from "./fixture.js";

/** Owned incremental candidate-copy composition, distinct from CLI installation. */
export function buildMenuCandidate(
  stage: "root-trigger" | "content" = "root-trigger",
) {
  const fixture = copyConsumerFixture();
  try {
    const sources = [
      "root.svelte",
      "trigger.svelte",
      "types.ts",
      ...(stage === "content" ? ["portal.svelte", "content.svelte"] : []),
    ];
    for (const file of sources) {
      const target = path.join(fixture.root, "src/lib/candidate/menu", file);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, readFileSync(`registry/ui/menu/${file}`));
    }
    const routeName = stage === "content" ? "menu-content" : "menu-candidate";
    const route = `src/routes/${routeName}/+page.svelte`;
    mkdirSync(path.dirname(path.join(fixture.root, route)), {
      recursive: true,
    });
    writeFileSync(
      path.join(fixture.root, route),
      readFileSync(`tests/fixtures/menu-candidate/${stage}.svelte`),
    );
    const logRoot = "implementation/evidence/logs/menu-candidate";
    mkdirSync(logRoot, { recursive: true });
    const logs: string[] = [];
    for (const script of ["check", "build"]) {
      const result = runFixtureScript(fixture.root, script);
      const log = `${logRoot}/${stage}-${process.pid}-${Date.now()}-${script}.log`;
      writeFileSync(
        log,
        `${result.stdout}\n${result.stderr}\nstatus=${result.status}; signal=${result.signal}\n`,
      );
      logs.push(log);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    }
    const productionFiles: string[] = [];
    const inventory = (directory: string) => {
      for (const entry of readdirSync(path.join(fixture.root, directory), {
        withFileTypes: true,
      })) {
        const name = `${directory}/${entry.name}`;
        if (entry.isDirectory()) inventory(name);
        else if (entry.isFile()) productionFiles.push(name);
        else throw new Error(`Unexpected candidate artifact: ${name}`);
      }
    };
    inventory("build");
    const files = [
      ...sources.map((file) => `src/lib/candidate/menu/${file}`),
      route,
      "package.json",
      "svelte.config.js",
      ...productionFiles.sort(),
    ];
    return {
      ...fixture,
      handler: path.join(fixture.root, "build/handler.js"),
      route: `/${routeName}`,
      evidence: {
        stage: stage === "content" ? "S124" : "S123",
        authored: [
          "Root",
          "Trigger",
          ...(stage === "content" ? ["Portal", "Content"] : []),
        ],
        raw: [...(stage === "root-trigger" ? ["Content"] : []), "Item"],
        installation: "candidate-copy",
        catalogRegistered: JSON.parse(
          readFileSync("registry/registry.json", "utf8"),
        ).items.some((item: { id: string }) => item.id === "menu"),
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
