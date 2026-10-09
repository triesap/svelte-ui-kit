import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";

const trace = readFileSync("implementation/TRACEABILITY.md", "utf8");
const requirements = [
  ...readFileSync("specs/PRODUCT_SPEC.md", "utf8").matchAll(
    /^\| (R\d{2}) \|/gm,
  ),
].map((m) => m[1]!);
const criteria = [
  ...readFileSync("specs/ACCEPTANCE_CRITERIA.md", "utf8").matchAll(
    /^(AC\d{2})\./gm,
  ),
].map((m) => m[1]!);
const libraryException =
  JSON.parse(readFileSync("tests/fixtures/consumer/tsconfig.json", "utf8"))
    .compilerOptions.skipLibCheck === true;

function problems(text: string) {
  const errors: string[] = [];
  const rows = [...text.matchAll(/^\| (R\d{2}|AC\d{2})\s*\|([^\n]+)$/gm)];
  const ids = rows.map((row) => row[1]!);
  if (ids.length !== new Set(ids).size) errors.push("duplicate evidence ID");
  for (const id of [...requirements, ...criteria])
    if (!ids.includes(id)) errors.push(`missing evidence ID ${id}`);
  for (const row of rows) {
    if (![...requirements, ...criteria].includes(row[1]!))
      errors.push(`unknown ID ${row[1]}`);
    const links = [...row[2]!.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)];
    if (!links.length) errors.push(`missing linked evidence ${row[1]}`);
    for (const link of links) {
      const target = path.resolve("implementation", link[1]!.split("#")[0]!);
      if (
        !target.startsWith(`${process.cwd()}${path.sep}`) ||
        !existsSync(target) ||
        !statSync(target).isFile()
      )
        errors.push(`missing or external evidence ${link[1]}`);
    }
    if (row[1] === "AC20" && libraryException && !row[2]!.includes("BLOCKED:"))
      errors.push(
        "strict library exception requires explicit BLOCKED final AC20",
      );
  }
  return errors;
}

test("every original requirement and acceptance ID links actual evidence or explicit blocking status", () => {
  assert.equal(requirements.length, 34);
  assert.equal(criteria.length, 22);
  assert.deepEqual(problems(trace), []);
});

test("traceability rejects missing evidence duplicate IDs and concealed strict exception", () => {
  assert.ok(
    problems(
      trace.replace(
        "../tests/unit/config.test.ts",
        "../tests/unit/missing-evidence.test.ts",
      ),
    ).some((error) => error.startsWith("missing or external")),
  );
  assert.ok(
    problems(trace.replace("| R34 ", "| R33 ")).includes(
      "duplicate evidence ID",
    ),
  );
  assert.ok(
    problems(trace.replace("| R34 ", "| R33 ")).includes(
      "missing evidence ID R34",
    ),
  );
  if (libraryException)
    assert.ok(
      problems(trace.replace("BLOCKED:", "ACCEPTED:")).some((error) =>
        error.includes("BLOCKED final AC20"),
      ),
    );
});

test("each authenticated advertised item has a maintained source map and real assets", () => {
  const loaded = loadRegistrySnapshot(createAssetProvider(process.cwd()));
  assert.ok(loaded.ok, JSON.stringify(loaded));
  if (!loaded.ok) throw new Error("registry invalid");
  assert.equal(loaded.value.items.length, 22);
  for (const item of loaded.value.items) {
    const map = `docs/reference/components/${item.manifest.id}.md`;
    assert.ok(existsSync(map), map);
    assert.ok(readFileSync(map, "utf8").trim().length > 0);
    for (const asset of [...item.manifest.files, ...item.manifest.styles])
      assert.ok(existsSync(path.join("registry", asset.source)), asset.source);
  }
  assert.ok(existsSync("docs/reference/compatibility.md"));
  assert.equal(
    loaded.value.items.some((item) => item.manifest.id === "identity"),
    false,
    "native identity must not become an invented registry item",
  );
});
