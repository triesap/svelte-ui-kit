import assert from "node:assert/strict";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { sha256Hex } from "../../src/codegen/digest.js";
import { copyConsumerFixture, runFixtureScript } from "./fixture.js";

/** Compile actual unregistered parts with explicitly remaining raw primitives. */
export function buildDialogCandidate(
  stage: "root-trigger" | "portal-overlay" | "content" = "root-trigger",
) {
  const fixture = copyConsumerFixture();
  try {
    const files = [
      "root.svelte",
      "trigger.svelte",
      "types.ts",
      ...(stage !== "root-trigger" ? ["portal.svelte", "overlay.svelte"] : []),
      ...(stage === "content" ? ["content.svelte"] : []),
    ];
    for (const file of files) {
      const target = path.join(fixture.root, "src/lib/candidate/dialog", file);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, readFileSync(`registry/ui/dialog/${file}`));
    }
    const routeName = {
      "root-trigger": "dialog-candidate",
      "portal-overlay": "dialog-portal",
      content: "dialog-content",
    }[stage];
    const route = `src/routes/${routeName}/+page.svelte`;
    mkdirSync(path.dirname(path.join(fixture.root, route)), {
      recursive: true,
    });
    writeFileSync(
      path.join(fixture.root, route),
      readFileSync(`tests/fixtures/dialog-candidate/${stage}.svelte`),
    );
    const logRoot = "implementation/evidence/logs/dialog-candidate";
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
    const artifactFiles = [
      ...files.map((file) => `src/lib/candidate/dialog/${file}`),
      route,
      ...productionFiles.sort(),
    ];
    return {
      ...fixture,
      handler: path.join(fixture.root, "build/handler.js"),
      route: `/${routeName}`,
      evidence: {
        stage: {
          "root-trigger": "S106",
          "portal-overlay": "S107",
          content: "S108",
        }[stage],
        authored: [
          "Root",
          "Trigger",
          ...(stage !== "root-trigger" ? ["Portal", "Overlay"] : []),
          ...(stage === "content" ? ["Content"] : []),
        ],
        raw: [
          ...(stage === "content" ? [] : ["Content"]),
          "Title",
          "Description",
          "Close",
        ],
        unregistered: true,
        logs,
        files: Object.fromEntries(
          artifactFiles.map((file) => [
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
