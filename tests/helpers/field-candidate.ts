import assert from "node:assert/strict";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { sha256Hex } from "../../src/codegen/digest.js";
import { copyConsumerFixture, runFixtureScript } from "./fixture.js";

export function buildFieldCandidate() {
  const fixture = copyConsumerFixture();
  try {
    const sources = [
      ...[
        "root",
        "surface",
        "label",
        "message",
        "required",
        "text-input",
        "text-area",
        "native-select",
        "select-icon",
        "text-field",
        "text-area-field",
        "select-field",
      ].map((part) => `${part}.svelte`),
      "context.ts",
      "types.ts",
    ];
    for (const file of sources) {
      const target = path.join(fixture.root, "src/lib/candidate/field", file);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, readFileSync(`registry/ui/field/${file}`));
    }
    const route = "src/routes/field-candidate/+page.svelte";
    mkdirSync(path.dirname(path.join(fixture.root, route)), {
      recursive: true,
    });
    writeFileSync(
      path.join(fixture.root, route),
      readFileSync("tests/fixtures/field-candidate/+page.svelte"),
    );
    const logRoot = "implementation/evidence/logs/field-candidate";
    mkdirSync(logRoot, { recursive: true });
    const logs: string[] = [];
    for (const script of ["check", "build"]) {
      const result = runFixtureScript(fixture.root, script);
      const log = `${logRoot}/${process.pid}-${Date.now()}-${script}.log`;
      writeFileSync(
        log,
        `${result.stdout}\n${result.stderr}\nstatus=${result.status};signal=${result.signal}\n`,
      );
      logs.push(log);
      assert.equal(result.status, 0, result.stdout + result.stderr);
    }
    const production: string[] = [];
    const inventory = (directory: string) => {
      for (const entry of readdirSync(path.join(fixture.root, directory), {
        withFileTypes: true,
      })) {
        const file = `${directory}/${entry.name}`;
        if (entry.isDirectory()) inventory(file);
        else {
          assert.ok(entry.isFile());
          production.push(file);
        }
      }
    };
    inventory("build");
    const files = [
      ...sources.map((file) => `src/lib/candidate/field/${file}`),
      route,
      "package.json",
      "svelte.config.js",
      ...production.sort(),
    ];
    return {
      ...fixture,
      handler: path.join(fixture.root, "build/handler.js"),
      route: "/field-candidate",
      evidence: {
        stage: "S146",
        installation: "candidate-copy",
        authored: [
          "FieldRoot",
          "FieldSurface",
          "FieldLabel",
          "FieldMessage",
          "FieldRequired",
          "TextInput",
          "TextArea",
          "NativeSelect",
          "SelectIcon",
          "TextField",
          "TextAreaField",
          "SelectField",
        ],
        catalogRegistered: JSON.parse(
          readFileSync("registry/registry.json", "utf8"),
        ).items.some((item: { id: string }) => item.id === "field"),
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
