import assert from "node:assert/strict";
import { test } from "node:test";

import {
  inspectDependencyState,
  peerRequirementsFromPlan,
  validatePeerDependencies,
} from "../../src/project/dependencies.js";
import type { DependencyPlan } from "../../src/registry/dependency-plan.js";
import type { ModelResult } from "../../src/registry/errors.js";
import { createTempProject, type TempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * S039 tests: resolved registry peer requirements are combined with the actual
 * selected peer metadata, every resolved peer is assessed (a peer a particular
 * wrapper does not use is not silently ignored), and conflicts are diagnosed
 * without adding dependencies.
 */

function codes(result: ModelResult<unknown>): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

function install(project: TempProject, name: string, version: string): void {
  project.writeFile(
    `node_modules/${name}/package.json`,
    JSON.stringify({ name, version }),
  );
}

function installWith(
  project: TempProject,
  name: string,
  version: string,
  extra: Record<string, unknown>,
): void {
  project.writeFile(
    `node_modules/${name}/package.json`,
    JSON.stringify({ name, version, ...extra }),
  );
}

function plan(
  entries: readonly {
    name: string;
    range: string;
    roles: readonly ("runtime" | "tooling" | "peer")[];
    requiredBy: readonly string[];
  }[],
): DependencyPlan {
  return { entries: entries.map((entry) => ({ ...entry })) };
}

const PEER_PLAN = plan([
  {
    name: "svelte",
    range: "^5.33.0",
    roles: ["peer"],
    requiredBy: ["button"],
  },
  {
    name: "@internationalized/date",
    range: "^3.8.1",
    roles: ["peer"],
    requiredBy: ["calendar"],
  },
]);

test("compatible installed peers pass", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({
      dependencies: { svelte: "^5.33.0", "@internationalized/date": "^3.8.1" },
    }),
  );
  install(project, "svelte", "5.57.1");
  install(project, "@internationalized/date", "3.12.4");

  const before = snapshotTree(project.root);
  const result = validatePeerDependencies(project.root, PEER_PLAN);
  const after = snapshotTree(project.root);

  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.length, 2);
  assert.ok(result.value.every((entry) => entry.status === "ready"));
  assert.deepEqual(after, before, "peer validation must not write");
});

test("peers are assessed against the actual installed metadata", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ dependencies: { svelte: "^5.33.0" } }),
  );
  install(project, "svelte", "5.32.0");

  const result = validatePeerDependencies(project.root, PEER_PLAN);
  assert.equal(result.ok, false);
  assert.ok(codes(result).includes("PEER_INCOMPATIBLE"));
  assert.ok(codes(result).includes("PEER_MISSING"));
});

test("a peer a particular wrapper does not use is still assessed", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  // Only svelte is installed; the date peer is required by the closure even
  // though the requested button wrapper does not itself consume it.
  project.writeFile(
    "package.json",
    JSON.stringify({ dependencies: { svelte: "^5.33.0" } }),
  );
  install(project, "svelte", "5.57.1");

  const result = validatePeerDependencies(project.root, PEER_PLAN);
  assert.equal(result.ok, false);
  const issues = result.ok ? [] : result.issues;
  assert.ok(
    issues.some(
      (issue) =>
        issue.code === "PEER_MISSING" &&
        issue.message.includes("@internationalized/date"),
    ),
    JSON.stringify(result),
  );
});

test("a declared but uninstalled peer is reported as not installed", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({
      dependencies: { svelte: "^5.33.0", "@internationalized/date": "^3.8.1" },
    }),
  );
  install(project, "svelte", "5.57.1");

  const result = validatePeerDependencies(project.root, PEER_PLAN);
  assert.equal(result.ok, false);
  assert.ok(codes(result).includes("PEER_NOT_INSTALLED"));
});

test("peerRequirementsFromPlan keeps peer roles only and de-duplicates", () => {
  const mixed = plan([
    { name: "svelte", range: "^5.33.0", roles: ["peer"], requiredBy: ["a"] },
    { name: "svelte", range: "^5.33.0", roles: ["runtime"], requiredBy: ["b"] },
    { name: "bits-ui", range: "2.19.3", roles: ["runtime"], requiredBy: ["c"] },
    {
      name: "@internationalized/date",
      range: "^3.8.1",
      roles: ["peer"],
      requiredBy: ["d"],
    },
  ]);
  assert.deepEqual(peerRequirementsFromPlan(mixed), [
    { name: "@internationalized/date", range: "^3.8.1" },
    { name: "svelte", range: "^5.33.0" },
  ]);
});

test("an empty peer plan is trivially satisfied", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "empty" }));

  const result = validatePeerDependencies(project.root, plan([]));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok) assert.deepEqual(result.value, []);
  // Base inspection remains available independently of peer validation.
  const base = inspectDependencyState(project.root, []);
  assert.equal(base.ok, true);
});

test("actual installed upstream peers are assessed even when absent from the plan", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ dependencies: { "bits-ui": "2.19.3" } }),
  );
  installWith(project, "bits-ui", "2.19.3", {
    peerDependencies: {
      "@internationalized/date": "^3.8.1",
      svelte: "^5.33.0",
    },
  });

  const runtimePlan = plan([
    {
      name: "bits-ui",
      range: "2.19.3",
      roles: ["runtime"],
      requiredBy: ["button"],
    },
  ]);
  const result = validatePeerDependencies(project.root, runtimePlan);
  assert.equal(result.ok, false, JSON.stringify(result));
  const issues = result.ok ? [] : result.issues;
  assert.ok(
    issues.some(
      (entry) =>
        entry.code === "PEER_MISSING" &&
        entry.message.includes("@internationalized/date"),
    ),
    JSON.stringify(result),
  );
  assert.ok(
    issues.some(
      (entry) =>
        entry.code === "PEER_MISSING" && entry.message.includes("svelte"),
    ),
    JSON.stringify(result),
  );
});

test("satisfied actual upstream peers pass", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({
      dependencies: {
        "bits-ui": "2.19.3",
        "@internationalized/date": "^3.8.1",
        svelte: "^5.33.0",
      },
    }),
  );
  installWith(project, "bits-ui", "2.19.3", {
    peerDependencies: {
      "@internationalized/date": "^3.8.1",
      svelte: "^5.33.0",
    },
  });
  install(project, "@internationalized/date", "3.12.4");
  install(project, "svelte", "5.57.1");

  const runtimePlan = plan([
    {
      name: "bits-ui",
      range: "2.19.3",
      roles: ["runtime"],
      requiredBy: ["button"],
    },
  ]);
  const result = validatePeerDependencies(project.root, runtimePlan);
  assert.equal(result.ok, true, JSON.stringify(result));
});

test("a missing upstream installation never fabricates a peer audit", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ dependencies: { "bits-ui": "2.19.3" } }),
  );

  const runtimePlan = plan([
    {
      name: "bits-ui",
      range: "2.19.3",
      roles: ["runtime"],
      requiredBy: ["button"],
    },
  ]);
  const result = validatePeerDependencies(project.root, runtimePlan);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.ok(codes(result).includes("PEER_UPSTREAM_NOT_INSTALLED"));
});

test("an optional upstream peer is skipped when not independently required", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ dependencies: { "bits-ui": "2.19.3" } }),
  );
  installWith(project, "bits-ui", "2.19.3", {
    peerDependencies: { "@internationalized/date": "^3.8.1" },
    peerDependenciesMeta: { "@internationalized/date": { optional: true } },
  });

  const runtimePlan = plan([
    {
      name: "bits-ui",
      range: "2.19.3",
      roles: ["runtime"],
      requiredBy: ["button"],
    },
  ]);
  const result = validatePeerDependencies(project.root, runtimePlan);
  assert.equal(result.ok, true, JSON.stringify(result));
});

/**
 * RCLD03-R2-1: a runtime registry requirement makes the package independently
 * required, so an upstream optional peer that conflicts with it is mandatory.
 */
test("a runtime requirement promotes a conflicting optional upstream peer", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ dependencies: { bits: "1.0.0", svelte: "^5" } }),
  );
  installWith(project, "bits", "1.0.0", {
    peerDependencies: { svelte: "^4" },
    peerDependenciesMeta: { svelte: { optional: true } },
  });
  install(project, "svelte", "5.57.1");

  const runtimePlan = plan([
    {
      name: "bits",
      range: "1.0.0",
      roles: ["runtime"],
      requiredBy: ["button"],
    },
    { name: "svelte", range: "^5", roles: ["runtime"], requiredBy: ["button"] },
  ]);
  const result = validatePeerDependencies(project.root, runtimePlan);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.ok(codes(result).includes("PEER_INCOMPATIBLE"));
});

/**
 * RCLD03-R2-1: a present but malformed upstream peer map must not manufacture
 * a successful audit.
 */
test("a malformed upstream peer map is invalid evidence", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ dependencies: { bits: "1.0.0" } }),
  );
  installWith(project, "bits", "1.0.0", { peerDependencies: "nope" });

  const runtimePlan = plan([
    {
      name: "bits",
      range: "1.0.0",
      roles: ["runtime"],
      requiredBy: ["button"],
    },
  ]);
  const result = validatePeerDependencies(project.root, runtimePlan);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.ok(codes(result).includes("PEER_UPSTREAM_INVALID"));
});
