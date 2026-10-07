import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { sha256Hex } from "../../src/codegen/digest.js";
import { copyConsumerFixture, runFixtureScript } from "./fixture.js";

/** Compile actual unregistered parts with explicitly remaining raw primitives. */
export function buildDialogCandidate() {
  const fixture = copyConsumerFixture();
  try {
    const files = ["root.svelte", "trigger.svelte", "types.ts"];
    for (const file of files) {
      const target = path.join(fixture.root, "src/lib/candidate/dialog", file);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, readFileSync(`registry/ui/dialog/${file}`));
    }
    const route = "src/routes/dialog-candidate/+page.svelte";
    mkdirSync(path.dirname(path.join(fixture.root, route)), {
      recursive: true,
    });
    writeFileSync(
      path.join(fixture.root, route),
      readFileSync("tests/fixtures/dialog-candidate/root-trigger.svelte"),
    );
    for (const script of ["check", "build"]) {
      const result = runFixtureScript(fixture.root, script);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    }
    const artifactFiles = [
      ...files.map((file) => `src/lib/candidate/dialog/${file}`),
      route,
      "build/handler.js",
    ];
    return {
      ...fixture,
      handler: path.join(fixture.root, "build/handler.js"),
      evidence: {
        stage: "S106",
        authored: ["Root", "Trigger"],
        raw: ["Content", "Title", "Description", "Close"],
        unregistered: true,
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
