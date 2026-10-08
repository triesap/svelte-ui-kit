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
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-wrapper-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    for (const file of [
      "switch.types.ts",
      "checkbox.types.ts",
      "progress.types.ts",
      "skeleton.types.ts",
      "field/types.ts",
      "menu/types.ts",
      "dialog/types.ts",
    ]) {
      mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      writeFileSync(path.join(root, file), readFileSync(`registry/ui/${file}`));
    }
    const fixture = path.join(root, "fixture.ts");
    writeFileSync(
      fixture,
      `import type {Snippet} from "svelte";
import type {SwitchProps} from "./switch.types.js";
import type {CheckboxProps} from "./checkbox.types.js";
import type {ProgressProps} from "./progress.types.js";
import type {SkeletonProps} from "./skeleton.types.js";
import type {FieldRootProps,TextInputProps} from "./field/types.js";
import type {MenuContentProps,MenuRadioItemProps} from "./menu/types.js";
import type {DialogContentProps} from "./dialog/types.js";
declare const children:Snippet;
${body}`,
    );
    const program = ts.createProgram(
      [
        fixture,
        path.resolve(
          "tests/fixtures/consumer/node_modules/svelte-check/dist/src/svelte-shims-v4.d.ts",
        ),
      ],
      {
        strict: true,
        noEmit: true,
        skipLibCheck: false,
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        target: ts.ScriptTarget.ES2023,
        types: ["node"],
        lib: ["lib.es2023.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
      },
    );
    return ts.getPreEmitDiagnostics(program).map((diagnostic) => ({
      code: diagnostic.code,
      file: diagnostic.file?.fileName,
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
    }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("shared native and compound contract accepts precise state ref callback and floating snippet types", () => {
  assert.deepEqual(
    diagnostics(`
declare const floating:Snippet<[{props:Record<string,unknown>,wrapperProps:Record<string,unknown>,open:boolean}]>;
declare const radio:Snippet<[{checked:boolean}]>;
const s:SwitchProps={checked:false,ref:document.createElement('button'),onCheckedChange:value=>{const state:boolean=value;void state;}};
const c:CheckboxProps={checked:false,indeterminate:true,ref:null};
const p:ProgressProps={value:null,ref:document.createElement('progress')};
const skeleton:SkeletonProps={ref:document.createElement('span')};
const field:FieldRootProps={children};const input:TextInputProps={value:'text',ref:document.createElement('input')};
const menu:MenuContentProps={child:floating,ref:document.createElement('div')};
const item:MenuRadioItemProps={value:'a',children:radio};
const dialog:DialogContentProps={children,onEscapeKeydown:event=>event.preventDefault()};
void s;void c;void p;void skeleton;void field;void input;void menu;void item;void dialog;
`),
    [],
  );
});

for (const [name, body] of [
  ["Switch owned child", "const p:SwitchProps={child:children};"],
  ["Switch owned children", "const p:SwitchProps={children};"],
  ["Checkbox owned child", "const p:CheckboxProps={child:children};"],
  ["Checkbox owned children", "const p:CheckboxProps={children};"],
  ["Progress children", "const p:ProgressProps={children};"],
  ["Skeleton children", "const p:SkeletonProps={children};"],
  ["TextInput children", "const p:TextInputProps={children};"],
  ["FieldRoot lost snippet", "const p:FieldRootProps={children:'discarded'};"],
  [
    "Menu flattened wrapper",
    "declare const bad:Snippet<[{props:Record<string,unknown>,wrapperProps:number,open:boolean}]>;const p:MenuContentProps={child:bad};",
  ],
  [
    "Menu lost radio state",
    "declare const bad:Snippet<[{checked:string}]>;const p:MenuRadioItemProps={value:'a',children:bad};",
  ],
  [
    "Dialog lost open state",
    "declare const bad:Snippet<[{props:Record<string,unknown>,open:string}]>;const p:DialogContentProps={child:bad};",
  ],
  [
    "native wrong ref",
    "const p:ProgressProps={ref:document.createElement('button')};",
  ],
] as const)
  test(`shared contract rejects ${name} at the actual caller type`, () => {
    const result = diagnostics(body);
    assert.ok(result.length > 0, name);
    assert.ok(
      result.every((diagnostic) => diagnostic.file?.endsWith("fixture.ts")),
      JSON.stringify(result),
    );
    assert.ok(
      result.some((diagnostic) =>
        [2322, 2353, 2561, 2739, 2740].includes(diagnostic.code),
      ),
      JSON.stringify(result),
    );
  });
