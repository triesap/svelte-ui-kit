import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import ts from "typescript";

function diagnostics(body: string) {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-progress-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(root, "src/progress.types.ts"),
      readFileSync("registry/ui/progress.types.ts"),
    );
    const fixture = path.join(root, "src/fixture.ts");
    writeFileSync(
      fixture,
      'import type { Snippet } from "svelte";\nimport type { ProgressProps } from "./progress.types.js";\ndeclare const children: Snippet;\n' +
        body,
    );
    const program = ts.createProgram([fixture], {
      strict: true,
      noEmit: true,
      skipLibCheck: false,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      target: ts.ScriptTarget.ES2023,
      types: [],
      lib: ["lib.es2023.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
    });
    return ts.getPreEmitDiagnostics(program).map((diagnostic) => ({
      code: diagnostic.code,
      file: diagnostic.file?.fileName,
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
    }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
test("native Progress accepts numeric bounds zero omission naming native attrs events and actual ref", () => {
  assert.deepEqual(
    diagnostics(
      'const props:ProgressProps={value:25,max:100,role:"progressbar",ref:document.createElement("progress"),class:["caller",{retained:true}],style:"width:20rem",id:"progress",title:"Transfer","aria-label":"Upload","aria-valuetext":"One quarter","data-caller":"yes",hidden:false,tabindex:-1,onclick:event=>{const element:HTMLProgressElement=event.currentTarget;event.preventDefault();element.focus();}};const zero:ProgressProps={value:0};const indefinite:ProgressProps={value:null,max:null,ref:null};const omitted:ProgressProps={};const boundary:ProgressProps={value:-1,max:0};void props;void zero;void indefinite;void omitted;void boundary;',
    ),
    [],
  );
});
for (const [name, body] of [
  ["string value", '{value:"25"}'],
  ["array value", '{value:["25"]}'],
  ["boolean value", "{value:true}"],
  ["string max", '{max:"100"}'],
  ["boolean max", "{max:false}"],
  ["caller children", "{children}"],
  ["unsupported min", "{min:0}"],
  ["input name", '{name:"upload"}'],
  ["input disabled", "{disabled:true}"],
  ["indeterminate flag", "{indeterminate:true}"],
  ["timer", "{duration:1000}"],
  ["variant", '{variant:"primary"}'],
  ["size", '{size:"lg"}'],
  ["label recipe", '{label:"Upload"}'],
  ["role replacement", '{role:"meter"}'],
  [
    "foreign SVG ref",
    '{ref:document.createElementNS("http://www.w3.org/2000/svg","svg")}',
  ],
  [
    "foreign event target",
    "{onclick:event=>{const input:HTMLInputElement=event.currentTarget;void input;}}",
  ],
  ["invalid native hidden", '{hidden:"collapsed"}'],
  ["invalid native live", '{"aria-live":"loud"}'],
] as const)
  test(`native Progress rejects ${name} causally`, () => {
    const actual = diagnostics(`const value:ProgressProps=${body};void value;`);
    assert.ok(
      actual.some(
        (d) =>
          d.file?.endsWith("fixture.ts") &&
          [2322, 2353, 2561, 2740, 2741].includes(d.code),
      ),
      JSON.stringify(actual),
    );
    assert.ok(
      actual.every((d) => d.file?.endsWith("fixture.ts")),
      JSON.stringify(actual),
    );
  });
