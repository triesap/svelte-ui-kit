import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";

import {
  detectPackageManager,
  renderDependencyInstructions,
} from "../../src/project/dependency-instructions.js";
import type { ModelResult } from "../../src/registry/errors.js";
import { createTempProject, type TempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * S040 tests (repaired): instructions match the detected manager and
 * requirements, every operand is POSIX single-quoted, unsafe specs are
 * rejected, and reporting never executes a package manager or changes the tree.
 * A controlled shell stub proves the exact literal argv for shell-operator
 * ranges rather than comparing strings alone.
 */

function codes(result: ModelResult<unknown>): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

function render(project: TempProject, runtime: string[], peers: string[]) {
  return renderDependencyInstructions(project.root, { runtime, peers });
}

test("the packageManager field selects the instruction manager", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ packageManager: "pnpm@11.22.0" }),
  );

  const evidence = detectPackageManager(project.root);
  assert.equal(evidence.ok, true);
  if (evidence.ok) {
    assert.equal(evidence.value.manager, "pnpm");
    assert.equal(evidence.value.source, "packageManager");
  }

  const before = snapshotTree(project.root);
  const result = render(project, ["bits-ui@2.19.3"], ["svelte@5.57.1"]);
  const after = snapshotTree(project.root);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.runtimeCommand, "pnpm add 'bits-ui@2.19.3'");
  assert.equal(result.value.peerCommand, "pnpm add 'svelte@5.57.1'");
  // The CLI's own tooling is never part of the consumer instruction.
  assert.ok(!result.value.runtimeCommand?.includes("typescript"));
  assert.deepEqual(after, before, "reporting must not write");
});

test("one unambiguous lockfile family is detected", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "lockfile" }));
  project.writeFile("package-lock.json", "{}\n");

  const evidence = detectPackageManager(project.root);
  assert.equal(evidence.ok, true);
  if (!evidence.ok) return;
  assert.equal(evidence.value.manager, "npm");
  assert.equal(evidence.value.source, "lockfile");
  const result = render(project, ["bits-ui@2.19.3"], []);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok)
    assert.equal(result.value.runtimeCommand, "npm install 'bits-ui@2.19.3'");
});

test("yarn lockfile selects yarn", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "yarn" }));
  project.writeFile("yarn.lock", "# yarn\n");

  const result = render(project, ["bits-ui@2.19.3"], []);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok)
    assert.equal(result.value.runtimeCommand, "yarn add 'bits-ui@2.19.3'");
});

test("conflicting lockfiles produce an actionable diagnostic", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "conflict" }));
  project.writeFile("pnpm-lock.yaml", "lockfileVersion: 9\n");
  project.writeFile("yarn.lock", "# yarn\n");

  const result = render(project, ["bits-ui@2.19.3"], []);
  assert.equal(result.ok, false);
  assert.deepEqual(codes(result), ["DEPENDENCY_MANAGER_CONFLICTING"]);
});

test("no manager evidence yields null manager and manual guidance", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "none" }));

  const result = render(project, ["bits-ui@2.19.3"], ["svelte@5.57.1"]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.manager, null);
  assert.equal(result.value.runtimeCommand, null);
  assert.equal(result.value.peerCommand, null);
  assert.deepEqual(result.value.runtimePackages, ["bits-ui@2.19.3"]);
  assert.match(result.value.manual ?? "", /bits-ui@2\.19\.3/);
  assert.match(result.value.manual ?? "", /svelte@5\.57\.1/);
});

test("a malformed explicit packageManager is not accepted", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ name: "bad-manager", packageManager: "pnpm@garbage" }),
  );
  project.writeFile("package-lock.json", "{}\n");

  const evidence = detectPackageManager(project.root);
  assert.equal(evidence.ok, true);
  if (!evidence.ok) return;
  assert.equal(evidence.value.manager, null);
  assert.equal(evidence.value.source, "unsupported");
  const result = render(project, ["bits-ui@2.19.3"], []);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) assert.equal(result.value.runtimeCommand, null);
});

test("a bare packageManager name is not accepted", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ name: "bare-manager", packageManager: "pnpm" }),
  );

  const evidence = detectPackageManager(project.root);
  assert.equal(evidence.ok, true);
  if (!evidence.ok) return;
  assert.equal(evidence.value.manager, null);
  assert.equal(evidence.value.source, "unsupported");
});

test("an unsupported explicit manager does not fall back to a stale lockfile", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ name: "bun", packageManager: "bun@1.2.0" }),
  );
  project.writeFile("package-lock.json", "{}\n");

  const evidence = detectPackageManager(project.root);
  assert.equal(evidence.ok, true);
  if (!evidence.ok) return;
  assert.equal(evidence.value.manager, null);
  assert.equal(evidence.value.source, "unsupported");
});

test("shell-operator ranges are single-quoted and delivered as one argv", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ packageManager: "pnpm@11.22.0" }),
  );

  for (const [spec, expected] of [
    ["svelte@>=5", "svelte@>=5"],
    ["svelte@^5||^6", "svelte@^5||^6"],
    ["svelte@*", "svelte@*"],
  ] as const) {
    const result = render(project, [spec], []);
    assert.equal(result.ok, true, JSON.stringify(result));
    if (!result.ok || result.value.runtimeCommand === null) return;
    const rendered = result.value.runtimeCommand;
    // A harmless test-owned stub captures the exact argv the shell builds.
    const probe = spawnSync(
      "/bin/sh",
      ["-c", `pnpm() { printf "ARG:%s\\n" "$@"; }; ${rendered}`],
      { cwd: project.root, encoding: "utf8", timeout: 2000 },
    );
    assert.equal(probe.status, 0, probe.stderr);
    assert.equal(probe.stdout, `ARG:add\nARG:${expected}\n`, `${spec} argv`);
  }
  // No shell redirection or OR expression created stray files.
  assert.deepEqual(
    snapshotTree(project.root)
      .map((entry) => entry.path)
      .sort(),
    ["", "package.json"].sort(),
  );
});

test("specs with spaces are single-quoted and unsafe specs are rejected", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ packageManager: "pnpm@11.22.0" }),
  );

  const spaced = render(project, ["svelte@^5.0.0 || ^6.0.0"], []);
  assert.equal(spaced.ok, true, JSON.stringify(spaced));
  if (spaced.ok) {
    assert.equal(
      spaced.value.runtimeCommand,
      "pnpm add 'svelte@^5.0.0 || ^6.0.0'",
    );
  }

  for (const unsafe of [
    "bits-ui'; rm -rf /",
    "--save-dev",
    "svelte@not a range",
    "svelte\u0000x",
  ]) {
    const result = render(project, [unsafe], []);
    assert.equal(result.ok, false, unsafe);
    assert.deepEqual(codes(result), ["DEPENDENCY_SPEC_UNSAFE"]);
  }
});

test("an unestablished shell yields structured operands, not fabricated quoting", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ packageManager: "pnpm@11.22.0" }),
  );

  const result = renderDependencyInstructions(project.root, {
    runtime: ["svelte@>=5"],
    peers: [],
    shell: "unsupported",
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.manager, "pnpm");
  assert.equal(result.value.runtimeCommand, null);
  assert.deepEqual(result.value.runtimePackages, ["svelte@>=5"]);
  assert.match(result.value.manual ?? "", /svelte@>=5/);
});

test("reporting never executes a manager or changes the tree", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ packageManager: "pnpm@11.22.0" }),
  );
  project.writeDir("node_modules");
  const before = snapshotTree(project.root);
  render(project, ["bits-ui@2.19.3"], ["svelte@5.57.1"]);
  render(project, ["bits-ui@2.19.3"], ["svelte@5.57.1"]);
  assert.deepEqual(snapshotTree(project.root), before);
});

/**
 * RCLD03-R2-1: manager evidence may come from the proven owning workspace when
 * the selected member declares none itself.
 */
test("the proven owning workspace supplies manager evidence", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({
      name: "root",
      packageManager: "pnpm@11.22.0",
      workspaces: ["apps/*"],
    }),
  );
  project.writeFile("apps/app/package.json", JSON.stringify({ name: "app" }));

  const evidence = detectPackageManager(path.join(project.root, "apps", "app"));
  assert.equal(evidence.ok, true, JSON.stringify(evidence));
  if (!evidence.ok) return;
  assert.equal(evidence.value.manager, "pnpm");
  assert.equal(evidence.value.source, "packageManager");
});

/**
 * RCLD03-R2-1: a malformed selected manifest is typed manual guidance, never a
 * stale-lockfile fallback.
 */
test("a malformed manifest does not fall back to a stale lockfile", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", "{ not json");
  project.writeFile("package-lock.json", "{}\n");

  const evidence = detectPackageManager(project.root);
  assert.equal(evidence.ok, true, JSON.stringify(evidence));
  if (!evidence.ok) return;
  assert.equal(evidence.value.manager, null);
  assert.equal(evidence.value.source, "unsupported");
});
