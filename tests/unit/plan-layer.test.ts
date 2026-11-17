import { TRANSACTION_MODULE_MOVES } from "../helpers/transaction-modules.js";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
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
      path.resolve("src/transactions/apply.ts"),
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
// Canonical1 witnesses were calculated by the actual retained prior engine
// against these explicit target inputs. This is pure digest evidence, never
// permission to validate or adopt a retired project format.
const cases = [
  {
    name: "canonical SvelteKit",
    mapping: {
      configSchema: 1,
      target: "sveltekit",
      layoutFile: "src/routes/+layout.svelte",
    },
    expected:
      "124ea97d71dc006cf00d5834a3200b34e557916e416aa4bdb583fba5ffb73d6b",
  },
  {
    name: "explicit Astro",
    mapping: {
      configSchema: 1,
      target: "astro",
      layoutFile: "src/layouts/Layout.astro",
    },
    expected:
      "b912422106201b32403242a372a4ad050b8ec4a4757d0c6bddb31618f899049d",
  },
  {
    name: "standalone library",
    mapping: {
      configSchema: 1,
      target: "svelte-library",
      styleEntry: "src/styles/entry.css",
    },
    expected:
      "3ea3c0dfedfae4bb46db50548f39ff0b451afea8d7e84b75f1d79564eb6d7e79",
  },
] as const;
for (const sample of cases)
  test(`pure digest preserves the existing ${sample.name} protocol witness`, () => {
    assert.equal(
      derivePlanDigest({ ...base, ...sample.mapping }),
      sample.expected,
    );
  });

for (const sample of cases)
  test(`pure digest binds ${sample.name} installation inventory without changing absent-field witnesses`, () => {
    const input = { ...base, ...sample.mapping };
    const installation = { stateDir: base.stateDir, digest: "a".repeat(64) };
    const bound = { ...input, readset: { ...base.readset, installation } };
    const digest = derivePlanDigest(bound);
    assert.notEqual(digest, sample.expected);
    assert.equal(derivePlanDigest(bound), digest);
    for (const changed of [
      { ...installation, digest: "b".repeat(64) },
      { ...installation, stateDir: "different/ui/_kit" },
    ])
      assert.notEqual(
        derivePlanDigest({
          ...input,
          readset: { ...base.readset, installation: changed },
        }),
        digest,
      );
  });

test("composition reaches only pure transaction namespace data, not an effect owner", () => {
  for (const file of reachable("src/codegen/compose.ts").modules)
    if (file.includes(`${path.sep}transactions${path.sep}`))
      assert.equal(path.basename(file), "types.ts", file);
  for (const [oldName, current] of TRANSACTION_MODULE_MOVES) {
    assert.equal(existsSync(`src/codegen/${oldName}.ts`), false);
    assert.equal(existsSync(`src/transactions/${current}.ts`), true);
  }
});
