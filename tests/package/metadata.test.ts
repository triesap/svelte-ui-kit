import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import semver from "semver";
import { installIndependentCli } from "../helpers/packaged-cli.js";

test("actual installed metadata bounds runtime support and retains source notices without claiming publication", (t) => {
  const cli = installIndependentCli();
  t.after(cli.cleanup);
  const read = (file: string) =>
    readFileSync(path.join(cli.packageRoot, file), "utf8");
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.name, "svelte-ui-kit");
  assert.equal(pkg.private, true);
  assert.equal(pkg.type, "module");
  assert.equal(pkg.license, "(MIT OR Apache-2.0)");
  assert.deepEqual(pkg.bin, { "svelte-ui-kit": "./dist/cli/main.js" });
  assert.equal(semver.satisfies(process.versions.node, pkg.engines.node), true);
  for (const version of ["22.0.0", "23.0.0", "24.20.0", "25.0.0", "26.0.0"])
    assert.equal(semver.satisfies(version, pkg.engines.node), false, version);
  assert.equal(pkg.dependencies["bits-ui"], undefined);
  assert.equal(pkg.dependencies["@internationalized/date"], undefined);
  assert.equal(pkg.peerDependencies, undefined);
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), [
    "ajv",
    "semver",
    "svelte",
    "typescript",
  ]);
  const fixture = JSON.parse(
    readFileSync("tests/fixtures/consumer/package.json", "utf8"),
  );
  for (const role of ["dependencies", "devDependencies", "peerDependencies"])
    assert.equal(fixture[role]?.[pkg.name], undefined);
  for (const name of ["svelte", "bits-ui", "@internationalized/date"])
    assert.ok(semver.valid(fixture.dependencies[name]), name);
  for (const name of ["typescript", "svelte-check", "@sveltejs/kit"])
    assert.ok(semver.valid(fixture.devDependencies[name]), name);
  for (const file of ["LICENSE-MIT", "LICENSE-APACHE", "NOTICE.md"])
    assert.equal(read(file), readFileSync(file, "utf8"), file);
  assert.match(read("NOTICE.md"), /a10fbf06334f4648f5755e05a7147414e4e5fc98/);
  assert.match(read("LICENSE-MIT"), /Copyright \(c\) 2026 Tyson Lupul/);
  assert.match(read("LICENSE-APACHE"), /Apache License/);
  assert.equal(cli.run(["view", "button", "--source"], cli.root).status, 0);
});
