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
import { before, after, test } from "node:test";
import { copyConsumerFixture, runFixtureScript } from "../helpers/fixture.js";
let kitFixture: ReturnType<typeof copyConsumerFixture>;
let augmentation: string;
before(() => {
  kitFixture = copyConsumerFixture();
  const result = runFixtureScript(kitFixture.root, "check");
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const actual = readFileSync(
    path.join(kitFixture.root, ".svelte-kit/non-ambient.d.ts"),
    "utf8",
  );
  const end = actual.indexOf("export {};");
  assert.ok(end > 0);
  augmentation = actual.slice(0, end) + "export {};\n";
  assert.match(augmentation, /declare module "svelte\/elements"/);
});
after(() => kitFixture?.cleanup());
import ts from "typescript";

function diagnostics(body: string) {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-router-link-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(root, "src/router-link.types.ts"),
      readFileSync("registry/ui/router-link.types.ts"),
    );
    writeFileSync(
      path.join(root, "src/anchor.types.ts"),
      readFileSync("registry/ui/anchor.types.ts"),
    );
    writeFileSync(path.join(root, "src/sveltekit-elements.d.ts"), augmentation);
    const fixture = path.join(root, "src/fixture.ts");
    writeFileSync(
      fixture,
      'import type { Snippet } from "svelte";\nimport type { RouterLinkProps } from "./router-link.types.js";\ndeclare const children: Snippet;\n' +
        body,
    );
    const program = ts.createProgram(
      [fixture, path.join(root, "src/sveltekit-elements.d.ts")],
      {
        strict: true,
        noEmit: true,
        skipLibCheck: false,
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        target: ts.ScriptTarget.ES2023,
        types: [],
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
test("native RouterLink inherits exact freshly generated SvelteKit options and anchor forwarding", () => {
  assert.deepEqual(
    diagnostics(
      `const props:RouterLinkProps={href:"/base/docs?query=1#part",children,ref:document.createElement("a"),target:"report",rel:"noopener",download:"report.txt",class:["caller"],"aria-current":"page","data-sveltekit-keepfocus":true,"data-sveltekit-noscroll":"","data-sveltekit-reload":"off","data-sveltekit-replacestate":true,"data-sveltekit-preload-code":"viewport","data-sveltekit-preload-data":"tap",onclick:event=>{const anchor:HTMLAnchorElement=event.currentTarget;event.preventDefault();anchor.focus();}};void props;`,
    ),
    [],
  );
});
test("actual raw native anchor augmentation rejects invalid known options independently", () => {
  const actual = diagnostics(
    'import type { SvelteHTMLElements } from "svelte/elements"; const raw: SvelteHTMLElements["a"] = { "data-sveltekit-preload-data": "eager" }; void raw;',
  );
  assert.ok(
    actual.some(
      (diagnostic) =>
        diagnostic.file?.endsWith("fixture.ts") && diagnostic.code === 2322,
    ),
    JSON.stringify(actual),
  );
  assert.ok(
    actual.every((diagnostic) => diagnostic.file?.endsWith("fixture.ts")),
    JSON.stringify(actual),
  );
});
for (const [name, body] of [
  [
    "invalid preload-data",
    'const value: RouterLinkProps = { href:"/next",children,"data-sveltekit-preload-data":"eager" };',
  ],
  [
    "invalid preload-code",
    'const value: RouterLinkProps = { href:"/next",children,"data-sveltekit-preload-code":"instant" };',
  ],
  [
    "invalid keepfocus",
    'const value: RouterLinkProps = { href:"/next",children,"data-sveltekit-keepfocus":"maybe" };',
  ],
  [
    "invented route service",
    'const value: RouterLinkProps = { href:"/next",children,route:"/next" };',
  ],
  [
    "invented camelCase navigation option",
    'const value: RouterLinkProps = { href:"/next",children,noScroll:true };',
  ],
  ["missing source href", "const value: RouterLinkProps = { children };"],
  ["missing children", 'const value: RouterLinkProps = { href: "/next" };'],
  [
    "non-string href",
    "const value: RouterLinkProps = { href: false, children };",
  ],
  [
    "null source href",
    "const value: RouterLinkProps = { href: null, children };",
  ],
  [
    "numeric target",
    'const value: RouterLinkProps = { href: "/next", children, target: 1 };',
  ],
  [
    "wrong rel",
    'const value: RouterLinkProps = { href: "/next", children, rel: true };',
  ],
  [
    "foreign ref",
    'const value: RouterLinkProps = { href: "/next", children, ref: document.createElement("button") };',
  ],
  [
    "non-snippet children",
    'const value: RouterLinkProps = { href: "/next", children: "Next" };',
  ],
  [
    "button disabled API",
    'const value: RouterLinkProps = { href: "/next", children, disabled: true };',
  ],
  [
    "unmapped variant",
    'const value: RouterLinkProps = { href: "/next", children, variant: "primary" };',
  ],
  [
    "polymorphic as",
    'const value: RouterLinkProps = { href: "/next", children, as: "button" };',
  ],
  [
    "unowned child hook",
    'const value: RouterLinkProps = { href: "/next", children, child: children };',
  ],
  [
    "foreign native event target",
    'const value: RouterLinkProps = { href: "/next", children, onclick: event => { const button: HTMLButtonElement = event.currentTarget; void button; } };',
  ],
] as const)
  test(`native RouterLink rejects ${name} causally`, () => {
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
