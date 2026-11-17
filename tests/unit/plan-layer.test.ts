import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { test } from "node:test";
import ts from "typescript";
import { derivePlanDigest } from "../../src/codegen/plan.js";

function runtimeImports(file: string): string[] {
  const ast = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  return ast.statements.flatMap((statement) => {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    )
      return [];
    const clause = statement.importClause;
    if (clause?.isTypeOnly) return [];
    if (
      clause &&
      !clause.name &&
      clause.namedBindings &&
      ts.isNamedImports(clause.namedBindings) &&
      clause.namedBindings.elements.every((item) => item.isTypeOnly)
    )
      return [];
    return [statement.moduleSpecifier.text];
  });
}
function reachable(start: string) {
  const modules = new Set<string>(),
    external = new Set<string>();
  function visit(file: string) {
    if (modules.has(file)) return;
    modules.add(file);
    for (const dependency of runtimeImports(file))
      if (dependency.startsWith("."))
        visit(
          path.resolve(path.dirname(file), dependency.replace(/\.js$/, ".ts")),
        );
      else external.add(dependency);
  }
  visit(path.resolve(start));
  return { modules, external };
}

test("composition cannot reach the application engine through runtime imports", () => {
  assert.equal(
    reachable("src/codegen/compose.ts").modules.has(
      path.resolve("src/codegen/apply.ts"),
    ),
    false,
  );
});
test("plan data and digest imports stay pure and cannot load effect modules", () => {
  const graph = reachable("src/codegen/plan.ts");
  assert.deepEqual([...graph.external].sort(), ["node:crypto"]);
  for (const file of graph.modules)
    assert.equal(
      /\/(?:apply|recovery|stage|write-lock|publish-lock)\.ts$/.test(file),
      false,
      file,
    );
});

const bytes = (text: string) => new Uint8Array(Buffer.from(text));
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const base = {
  root: "/qualified/project",
  stateDir: "src/ui/_kit",
  uiDir: "src/ui",
  stylesDir: "src/styles",
  rootIdentity: "1".repeat(64),
  ignoreFiles: [".gitignore"],
  exportAuthority: [],
  readset: {
    root: { device: 1, inode: 2, mode: 0o755 },
    ancestors: [
      { path: "src", kind: "directory", device: 1, inode: 3, mode: 0o755 },
    ],
    files: [
      {
        path: "package.json",
        kind: "file",
        digest: hash("{}\n"),
        mode: 0o644,
        bytes: bytes("{}\n"),
      },
    ],
    installed: [],
  },
  targets: [
    {
      path: "src/ui/button.svelte",
      operation: "create",
      bytes: bytes("<button />\n"),
      mode: 0o644,
      resultDigest: hash("<button />\n"),
      preimage: {
        path: "src/ui/button.svelte",
        kind: "absent",
        digest: null,
        mode: null,
      },
    },
  ],
  lock: {
    bytes: bytes("{}\n"),
    preimage: {
      path: "src/ui/_kit/kit.lock.json",
      kind: "absent",
      digest: null,
      mode: null,
    },
  },
} as const;
// These fixed protocol witnesses were obtained from the pre-extraction actual
// compiled engine at ae41e53, before rebuilding this candidate. Moving a pure
// calculation must not silently alter its domain or optional-field treatment.
const cases = [
  {
    name: "legacy application",
    mapping: { layoutFile: "src/routes/+layout.svelte" },
    expected:
      "124ea97d71dc006cf00d5834a3200b34e557916e416aa4bdb583fba5ffb73d6b",
  },
  {
    name: "explicit Astro",
    mapping: {
      configSchema: 2,
      target: "astro",
      layoutFile: "src/layouts/Layout.astro",
    },
    expected:
      "dd090624fb192c067953ca7b9a223714e84acc1ac11e5ac35d80ed18e98cac03",
  },
  {
    name: "standalone library",
    mapping: {
      configSchema: 2,
      target: "svelte-library",
      styleEntry: "src/styles/entry.css",
    },
    expected:
      "185cd3f7f6313b2ac46e95fcda53d9a3e370e418d4a2614a8e41555edf898a92",
  },
] as const;
for (const sample of cases)
  test(`pure digest preserves the existing ${sample.name} protocol witness`, () => {
    assert.equal(
      derivePlanDigest({ ...base, ...sample.mapping }),
      sample.expected,
    );
  });
