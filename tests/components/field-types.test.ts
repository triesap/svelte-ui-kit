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
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-field-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(root, "src/field.types.ts"),
      readFileSync("registry/ui/field/types.ts"),
    );
    const fixture = path.join(root, "src/fixture.ts");
    writeFileSync(
      fixture,
      'import type { Snippet } from "svelte";\nimport type { FieldSlot, TextInputType, FieldRootProps, FieldSurfaceProps, FieldLabelProps, FieldMessageProps, FieldRequiredProps, TextInputProps, TextAreaProps, NativeSelectProps, SelectIconProps, TextFieldProps, TextAreaFieldProps, SelectFieldProps } from "./field.types.js";\n' +
        body,
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
    return ts.getPreEmitDiagnostics(program).map((d) => ({
      code: d.code,
      file: d.file?.fileName,
      message: ts.flattenDiagnosticMessageText(d.messageText, "\n"),
    }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
test("all fourteen source Field exports map to exact native controls refs snippets and message ownership", () => {
  assert.deepEqual(
    diagnostics(`
declare const children:Snippet;declare const relation:Snippet<[{controlId:string;describedBy:string|undefined;required:boolean;disabled:boolean;invalid:boolean}]>;
const slot:FieldSlot=children;const types:TextInputType[]=["text","email","password","search","tel","url"];
const root:FieldRootProps={id:"field",controlId:"actual-control",required:true,invalid:false,disabled:false,children:relation,messages:[{key:"help",children,class:["helper"],"aria-live":"polite",ref:document.createElement("p")}],ref:document.createElement("div"),dir:"rtl"};
const plain:FieldRootProps={children};const surface:FieldSurfaceProps={children,ref:document.createElement("div")};const label:FieldLabelProps={children,for:"actual-control",ref:document.createElement("label")};
const message:FieldMessageProps={id:"message",children,role:"alert",ref:document.createElement("p")};const required:FieldRequiredProps={ref:document.createElement("span")};const icon:SelectIconProps={children,ref:document.createElement("span")};
const input:TextInputProps={type:"email",value:"",defaultValue:"start",form:"editor",name:"address",required:false,disabled:false,readonly:true,autocomplete:"email",minlength:2,maxlength:80,pattern:".+",ref:document.createElement("input"),"aria-describedby":"help",oninput:event=>{const node:HTMLInputElement=event.currentTarget;node.focus();}};
const area:TextAreaProps={value:"",defaultValue:"start",rows:4,cols:50,name:"body",form:"editor",ref:document.createElement("textarea"),oninput:event=>{const node:HTMLTextAreaElement=event.currentTarget;node.focus();}};
const select:NativeSelectProps={value:"a",children,multiple:false,name:"choice",form:"editor",ref:document.createElement("select"),onchange:event=>{const node:HTMLSelectElement=event.currentTarget;node.focus();}};
const textField:TextFieldProps={label:"Address",name:"address",type:"email",value:"",message:null,labelAction:slot,rootClass:["outer"],surfaceClass:"surface",labelRowClass:"row",labelClass:"label",requiredClass:"marker",messageClass:"message",class:"control",ref:document.createElement("input")};
const areaField:TextAreaFieldProps={label:"Body",name:"body",value:"",rows:8,message:"Help",ref:document.createElement("textarea")};
const selectField:SelectFieldProps={label:"Choice",name:"choice",value:"a",selectedLabel:"Alpha",children,icon:slot,iconClass:"icon",valueClass:"value",valueRowClass:"row",ref:document.createElement("select")};
void slot;void types;void root;void plain;void surface;void label;void message;void required;void icon;void input;void area;void select;void textField;void areaField;void selectField;
`),
    [],
  );
});
for (const [name, body] of [
  [
    "numeric required",
    "declare const children:Snippet;const props:FieldRootProps={children,required:1};",
  ],
  [
    "string invalid",
    'declare const children:Snippet;const props:FieldRootProps={children,invalid:"true"};',
  ],
  [
    "schema engine",
    "declare const children:Snippet;const props:FieldRootProps={children,schema:{}};",
  ],
  [
    "field state store",
    "declare const children:Snippet;const props:FieldRootProps={children,store:{}};",
  ],
  [
    "missing message key",
    "declare const children:Snippet;const props:FieldRootProps={children,messages:[{children}]};",
  ],
  [
    "message render argument",
    'declare const children:Snippet;declare const wrong:Snippet<[string]>;const props:FieldRootProps={children,messages:[{key:"help",children:wrong}]};',
  ],
  [
    "foreign SVG root ref",
    'declare const children:Snippet;const props:FieldRootProps={children,ref:document.createElementNS("http://www.w3.org/2000/svg","svg")};',
  ],
  [
    "missing explicit message ID",
    "declare const children:Snippet;const props:FieldMessageProps={children};",
  ],
  [
    "required accessible marker",
    'const props:FieldRequiredProps={"aria-hidden":false};',
  ],
  [
    "accessible decorative icon",
    'declare const children:Snippet;const props:SelectIconProps={children,"aria-hidden":false};',
  ],
  ["non-source number input", 'const props:TextInputProps={type:"number"};'],
  ["numeric text value", "const props:TextInputProps={value:1};"],
  [
    "foreign input ref",
    'const props:TextInputProps={ref:document.createElement("textarea")};',
  ],
  [
    "foreign textarea event target",
    "const props:TextAreaProps={oninput:event=>{const node:HTMLInputElement=event.currentTarget;void node;}};",
  ],
  [
    "multiple select extension",
    "declare const children:Snippet;const props:NativeSelectProps={children,multiple:true};",
  ],
  [
    "select array value",
    'declare const children:Snippet;const props:NativeSelectProps={children,value:["a"]};',
  ],
  [
    "unsupported select defaultValue",
    'declare const children:Snippet;const props:NativeSelectProps={children,defaultValue:"a"};',
  ],
  ["missing convenience label", 'const props:TextFieldProps={name:"address"};'],
  [
    "missing selected label",
    'declare const children:Snippet;const props:SelectFieldProps={label:"Choice",name:"choice",children};',
  ],
  [
    "Rust callback alias",
    'const props:TextFieldProps={label:"Address",name:"address",on_input:()=>{}};',
  ],
  [
    "Rust slot store",
    "const props:FieldSlot={render:()=>{},is_present:()=>true};",
  ],
] as const)
  test(`native Field contracts reject ${name} causally`, () => {
    const actual = diagnostics(body);
    assert.ok(
      actual.some(
        (d) =>
          d.file?.endsWith("fixture.ts") &&
          [2322, 2353, 2561, 2740, 2741, 2820].includes(d.code),
      ),
      JSON.stringify(actual),
    );
    assert.ok(
      actual.every((d) => d.file?.endsWith("fixture.ts")),
      JSON.stringify(actual),
    );
  });
