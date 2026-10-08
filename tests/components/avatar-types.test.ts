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
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-avatar-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(root, "src/avatar.types.ts"),
      readFileSync("registry/ui/avatar.types.ts"),
    );
    const fixture = path.join(root, "src/fixture.ts");
    writeFileSync(
      fixture,
      'import type { Snippet } from "svelte";\nimport type { AvatarProps } from "./avatar.types.js";\ndeclare const children: Snippet;\n' +
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
test("native Avatar accepts required image semantics, fallback, request attrs and exact events", () => {
  assert.deepEqual(
    diagnostics(
      'const props: AvatarProps = {src:"/portrait.png", alt:"Ada", fallback:children, ref:document.createElement("img"),srcset:"/portrait.png 1x, /portrait-2x.png 2x",sizes:"40px",crossorigin:"anonymous",referrerpolicy:"no-referrer",loading:"lazy",decoding:"async",class:["caller"],"aria-label":"Portrait", "data-caller":"yes",onload:event=>{const element:Element=event.currentTarget;if(element instanceof HTMLImageElement){const image:HTMLImageElement=element;void image;}},onerror:event=>{event.preventDefault();const element:Element=event.currentTarget;if(element instanceof HTMLImageElement){const image:HTMLImageElement=element;void image;}}}; const decorative:AvatarProps={src:"/decoration.png",alt:"",ref:null,hidden:true};void props;void decorative;',
    ),
    [],
  );
});
for (const [name, body] of [
  ["missing src", '{alt:"Ada"}'],
  ["missing alt", '{src:"/portrait.png"}'],
  ["null src", '{src:null,alt:"Ada"}'],
  ["numeric alt", '{src:"/portrait.png",alt:1}'],
  [
    "foreign ref",
    '{src:"/portrait.png",alt:"Ada",ref:document.createElement("button")}',
  ],
  ["string fallback", '{src:"/portrait.png",alt:"Ada",fallback:"AD"}'],
  [
    "invalid native loading",
    '{src:"/portrait.png",alt:"Ada",loading:"immediate"}',
  ],
  [
    "invalid crossorigin",
    '{src:"/portrait.png",alt:"Ada",crossorigin:"private"}',
  ],
  ["invalid decoding", '{src:"/portrait.png",alt:"Ada",decoding:"instant"}'],
  ["invented size", '{src:"/portrait.png",alt:"Ada",size:"lg"}'],
  ["invented variant", '{src:"/portrait.png",alt:"Ada",variant:"round"}'],
  ["children", '{src:"/portrait.png",alt:"Ada",children}'],
  ["child replacement", '{src:"/portrait.png",alt:"Ada",child:children}'],
  [
    "foreign event target",
    '{src:"/portrait.png",alt:"Ada",onload:event=>{const button:HTMLButtonElement=event.currentTarget;void button;}}',
  ],
] as const)
  test(`native Avatar rejects ${name} causally`, () => {
    const actual = diagnostics(
      `const value: AvatarProps = ${body};void value;`,
    );
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
