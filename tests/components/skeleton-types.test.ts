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
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-skeleton-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(root, "src/skeleton.types.ts"),
      readFileSync("registry/ui/skeleton.types.ts"),
    );
    const fixture = path.join(root, "src/fixture.ts");
    writeFileSync(
      fixture,
      'import type { Snippet } from "svelte";\nimport type { SkeletonProps } from "./skeleton.types.js";\ndeclare const children: Snippet;\n' +
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
test("native Skeleton accepts empty decorative attrs native styles events and span refs", () => {
  assert.deepEqual(
    diagnostics(
      'const props:SkeletonProps={ref:document.createElement("span"),class:["caller",{retained:true}],style:"width:80px;height:24px;border-radius:50%",id:"skeleton",title:"Decorative placeholder","aria-hidden":true,"aria-label":"Concealed duplicate","data-caller":"yes",hidden:false,dir:"rtl",onclick:event=>{const element:HTMLSpanElement=event.currentTarget;event.preventDefault();void element;}};const omitted:SkeletonProps={};const matching:SkeletonProps={ref:null,"aria-hidden":"true"};void props;void omitted;void matching;',
    ),
    [],
  );
});
for (const [name, body] of [
  ["caller children", "{children}"],
  ["readable children", '{children:"Loading"}'],
  ["hidden contradiction", '{"aria-hidden":false}'],
  ["hidden string contradiction", '{"aria-hidden":"false"}'],
  ["hidden null contradiction", '{"aria-hidden":null}'],
  ["live region", '{"aria-live":"polite"}'],
  ["status role", '{role:"status"}'],
  ["focusable tabindex", "{tabindex:0}"],
  ["negative tabindex", "{tabindex:-1}"],
  ["input name", '{name:"placeholder"}'],
  ["input value", "{value:25}"],
  ["input disabled", "{disabled:true}"],
  ["loading state", "{loading:true}"],
  ["busy recipe", "{busy:true}"],
  ["pulse recipe", '{animation:"pulse"}'],
  ["timer", "{duration:1000}"],
  ["variant", '{variant:"primary"}'],
  ["shape enum", '{shape:"circle"}'],
  ["width recipe", "{width:80}"],
  ["height recipe", "{height:24}"],
  ["size enum", '{size:"lg"}'],
  ["readable label recipe", '{label:"Loading"}'],
  ["replacement child", "{child:children}"],
  [
    "foreign SVG ref",
    '{ref:document.createElementNS("http://www.w3.org/2000/svg","svg")}',
  ],
  [
    "foreign event target",
    "{onclick:event=>{const input:HTMLInputElement=event.currentTarget;void input;}}",
  ],
  ["invalid native hidden", '{hidden:"collapsed"}'],
] as const)
  test(`native Skeleton rejects ${name} causally`, () => {
    const actual = diagnostics(`const value:SkeletonProps=${body};void value;`);
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
