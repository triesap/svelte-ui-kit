import assert from "node:assert/strict";
import { test } from "node:test";
import {
  inspectAstroLayout,
  materializeAstroLayout,
  patchAstroLayout,
} from "../../src/codegen/astro.js";
const imports = [
  "../styles/kit.css",
  "../styles/themes.css",
  "../styles/app.css",
].map((specifier) => ({ specifier }));
test("Astro native materialization preserves ordered styles and a real default slot", () => {
  const source = materializeAstroLayout(imports);
  const parsed = inspectAstroLayout(source);
  assert.ok(parsed.ok);
  assert.deepEqual(
    parsed.value.imports,
    imports.map((entry) => entry.specifier),
  );
  assert.equal(parsed.value.rendersContent, true);
  assert.deepEqual(patchAstroLayout(source, imports), {
    ok: true,
    value: source,
  });
});
test("Astro frontmatter patches preserve exact Unicode, comments, props and document source", () => {
  for (const newline of ["\n", "\r\n"]) {
    const source = [
      "---",
      '// é😀 import "../styles/kit.css";',
      'const label: string = "Farmer 🌱";',
      'import "../styles/themes.css";',
      "const {title} = Astro.props;",
      "---",
      "<html><head><title>{title}</title></head><body><header>{label}</header><slot /><footer>Keep</footer></body></html>",
    ].join(newline);
    const patched = patchAstroLayout(source, imports);
    assert.ok(patched.ok, JSON.stringify(patched));
    assert.ok(patched.value.includes('// é😀 import "../styles/kit.css";'));
    assert.ok(patched.value.includes('const label: string = "Farmer 🌱";'));
    assert.ok(patched.value.endsWith(source.slice(source.indexOf("<html>"))));
    assert.deepEqual(patchAstroLayout(patched.value, imports), {
      ok: true,
      value: patched.value,
    });
  }
});
test("Astro source without frontmatter retains application content", () => {
  const source = "<!-- preserve -->\n<main><slot /></main>\n";
  const patched = patchAstroLayout(source, imports);
  assert.ok(patched.ok);
  assert.ok(patched.value.endsWith(source));
});

test("real empty Astro frontmatter remains distinct from absent frontmatter", () => {
  for (const source of ["---\n---\n<slot />\n", "---\n\n---\n<slot />\n"]) {
    const original = inspectAstroLayout(source);
    assert.ok(original.ok);
    assert.notEqual(original.value.span, null);
    const patched = patchAstroLayout(source, imports);
    assert.ok(patched.ok, JSON.stringify(patched));
    assert.equal(patched.value.match(/^---$/gm)?.length, 2);
    assert.deepEqual(patchAstroLayout(patched.value, imports), {
      ok: true,
      value: patched.value,
    });
  }
});
test("Astro comment, named, conditional, component and template slots cannot certify default content", () => {
  for (const source of [
    "<!-- <slot /> -->",
    '<slot name="header" />',
    "{true && <slot />}",
    "<Frame><slot /></Frame>",
    "<template><slot /></template>",
    '<body set:html={"x"}><slot /></body>',
  ])
    assert.equal(patchAstroLayout(source, imports).ok, false, source);
});
test("raw-text and fallback containers cannot establish rendered default content", () => {
  for (const tag of ["textarea", "title", "noscript", "iframe"]) {
    const source = `<${tag}><slot /></${tag}>`;
    const parsed = inspectAstroLayout(source);
    assert.ok(parsed.ok, tag);
    assert.equal(parsed.value.rendersContent, false, tag);
    assert.equal(patchAstroLayout(source, imports).ok, false, tag);
    assert.ok(patchAstroLayout(`${source}\n<slot />`, imports).ok, tag);
  }
});

test("plaintext cannot let a later lexical slot certify rendered content", () => {
  for (const source of [
    "<plaintext><slot /></plaintext>",
    "<plaintext>raw</plaintext><slot />",
  ]) {
    assert.equal(inspectAstroLayout(source).ok, false);
    assert.equal(patchAstroLayout(source, imports).ok, false);
  }
  assert.ok(patchAstroLayout("<!-- <plaintext> -->\n<slot />", imports).ok);
});

test("malformed, dynamic and out-of-order Astro inputs refuse without rewriting source", () => {
  for (const source of [
    "---\nconst x = ;\n---\n<slot />",
    '---\nawait import("x");\n---\n<slot />',
    `---\nimport "../styles/app.css";import "../styles/kit.css";\n---\n<slot />`,
  ]) {
    const original = source;
    assert.equal(patchAstroLayout(source, imports).ok, false, source);
    assert.equal(source, original);
  }
});
