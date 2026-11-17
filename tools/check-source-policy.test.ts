import assert from "node:assert/strict";
import {
  cpSync,
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
import { fileURLToPath } from "node:url";
import { checkSourcePolicy } from "./check-source-policy.ts";

const source = fileURLToPath(new URL("../", import.meta.url));
test("actual source inventory and strict tooling coverage pass", () =>
  assert.deepEqual(checkSourcePolicy(source), []));
for (const fault of [
  "js",
  "mjs",
  "cjs",
  "mts",
  "cts",
  "hidden",
  "symlink",
  "narrow",
  "exclude",
  "strict",
  "skipLibCheck",
]) {
  test(`source policy rejects ${fault} without changing its fixture`, (t) => {
    const root = mkdtempSync(path.join(os.tmpdir(), "suik-source-policy-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    mkdirSync(path.join(root, "tests"));
    mkdirSync(path.join(root, "tools"));
    for (const name of ["tsconfig.json", "tsconfig.tooling.json"])
      cpSync(path.join(source, name), path.join(root, name));
    if (["js", "mjs", "cjs", "mts", "cts"].includes(fault))
      writeFileSync(path.join(root, `tools/entry.${fault}`), "export {};\n");
    if (fault === "hidden") {
      mkdirSync(path.join(root, "tools/.hidden"));
      writeFileSync(path.join(root, "tools/.hidden/entry.mjs"), "export {};\n");
    }
    if (fault === "symlink")
      symlinkSync(
        path.join(root, "tsconfig.json"),
        path.join(root, "tests/entry.ts"),
      );
    const configName = ["strict", "skipLibCheck"].includes(fault)
      ? "tsconfig.json"
      : "tsconfig.tooling.json";
    const file = path.join(root, configName);
    const config = JSON.parse(readFileSync(file, "utf8"));
    if (fault === "narrow") config.include = ["tools/check-source-policy.ts"];
    if (fault === "exclude") config.exclude.push("tests/smoke/**");
    if (fault === "strict") config.compilerOptions.strict = false;
    if (fault === "skipLibCheck") config.compilerOptions.skipLibCheck = true;
    writeFileSync(file, JSON.stringify(config));
    const before = readFileSync(file);
    assert.ok(checkSourcePolicy(root).length > 0);
    assert.deepEqual(readFileSync(file), before);
  });
}
