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
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-anchor-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(root, "src/anchor.types.ts"),
      readFileSync("registry/ui/anchor.types.ts"),
    );
    const fixture = path.join(root, "src/fixture.ts");
    writeFileSync(
      fixture,
      'import type { Snippet } from "svelte";\nimport type { AnchorProps, AnchorTarget } from "./anchor.types.js";\ndeclare const children: Snippet;\n' +
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
test("native Anchor accepts source targets, navigation attrs, refs, snippets and native events", () => {
  assert.deepEqual(
    diagnostics(
      `const targets: AnchorTarget[] = ["_self", "_blank", "_parent", "_top", "report"]; const props: AnchorProps = { href: "/next?q=1#part", children, target: targets[4], rel: "noopener", download: "report.txt", referrerpolicy: "no-referrer", hreflang: "en", ping: "/audit", ref: document.createElement("a"), class: ["caller", { retained: true }], style: "color:red", "data-caller": "yes", "aria-label": "Next", onclick: event => { const anchor: HTMLAnchorElement = event.currentTarget; event.preventDefault(); anchor.focus(); }, onkeydown: event => { const anchor: HTMLAnchorElement = event.currentTarget; void anchor; } }; const native: AnchorProps = { href: "#next", children, download: true, target: null, rel: null, ref: null }; void props; void native;`,
    ),
    [],
  );
});
for (const [name, body] of [
  ["missing source href", "const value: AnchorProps = { children };"],
  ["missing children", 'const value: AnchorProps = { href: "/next" };'],
  ["non-string href", "const value: AnchorProps = { href: false, children };"],
  ["null source href", "const value: AnchorProps = { href: null, children };"],
  [
    "numeric target",
    'const value: AnchorProps = { href: "/next", children, target: 1 };',
  ],
  [
    "wrong rel",
    'const value: AnchorProps = { href: "/next", children, rel: true };',
  ],
  [
    "foreign ref",
    'const value: AnchorProps = { href: "/next", children, ref: document.createElement("button") };',
  ],
  [
    "non-snippet children",
    'const value: AnchorProps = { href: "/next", children: "Next" };',
  ],
  [
    "button disabled API",
    'const value: AnchorProps = { href: "/next", children, disabled: true };',
  ],
  [
    "unmapped variant",
    'const value: AnchorProps = { href: "/next", children, variant: "primary" };',
  ],
  [
    "polymorphic as",
    'const value: AnchorProps = { href: "/next", children, as: "button" };',
  ],
  [
    "unowned child hook",
    'const value: AnchorProps = { href: "/next", children, child: children };',
  ],
  [
    "foreign native event target",
    'const value: AnchorProps = { href: "/next", children, onclick: event => { const button: HTMLButtonElement = event.currentTarget; void button; } };',
  ],
] as const)
  test(`native Anchor rejects ${name} causally`, () => {
    const actual = diagnostics(body);
    assert.ok(
      actual.some(
        (diagnostic) =>
          diagnostic.file?.endsWith("fixture.ts") &&
          [2322, 2353, 2561, 2740, 2741].includes(diagnostic.code),
      ),
      JSON.stringify(actual),
    );
    assert.ok(
      actual.every((diagnostic) => diagnostic.file?.endsWith("fixture.ts")),
      JSON.stringify(actual),
    );
  });
