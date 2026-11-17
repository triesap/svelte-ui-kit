import assert from "node:assert/strict";
import { test } from "node:test";
import {
  inspectDependencyStateFromEvidence,
  validatePeerDependenciesFromEvidence,
  type DependencyEvidence,
} from "../../src/project/dependencies.js";
import { NATIVE_BASELINE } from "../../src/project/native-dependency.js";

const requirements = [
  { name: NATIVE_BASELINE.name, range: NATIVE_BASELINE.version },
];
const plan = {
  entries: [
    {
      ...requirements[0]!,
      roles: ["runtime" as const],
      requiredBy: ["switch"],
    },
  ],
};

test("empty invalid archive evidence cannot silently omit a required native dependency", () => {
  const evidence: DependencyEvidence = {
    manifest: {
      kind: "value",
      value: { dependencies: { "bits-ui": "file:./vendor/native.tgz" } },
    },
    nativeFiles: new Map([["bits-ui", { kind: "invalid", issues: [] }]]),
    observe: () => ({
      kind: "value",
      version: NATIVE_BASELINE.version,
      manifest: {
        name: NATIVE_BASELINE.name,
        version: NATIVE_BASELINE.version,
      },
      nativeAuthentication: {
        kind: "authenticated",
        version: NATIVE_BASELINE.version,
        provenanceSha256: NATIVE_BASELINE.provenanceSha256,
      },
    }),
  };
  for (const result of [
    inspectDependencyStateFromEvidence(evidence, requirements),
    validatePeerDependenciesFromEvidence(evidence, plan),
  ]) {
    assert.ok(
      !result.ok,
      "an empty issue array is not positive archive evidence",
    );
    assert.ok(result.issues.some((i) => i.code === "NATIVE_ARCHIVE_REQUIRED"));
  }
});

test("canonical observed version cannot conceal a noncanonical raw manifest", () => {
  for (const raw of [
    `v${NATIVE_BASELINE.version}`,
    `${NATIVE_BASELINE.version}+other`,
  ]) {
    const evidence: DependencyEvidence = {
      manifest: {
        kind: "value",
        value: { dependencies: { "bits-ui": NATIVE_BASELINE.version } },
      },
      nativeFiles: new Map([["bits-ui", { kind: "absent" }]]),
      observe: () => ({
        kind: "value",
        version: NATIVE_BASELINE.version,
        manifest: { name: NATIVE_BASELINE.name, version: raw },
        nativeAuthentication: {
          kind: "authenticated",
          version: NATIVE_BASELINE.version,
          provenanceSha256: NATIVE_BASELINE.provenanceSha256,
        },
      }),
    };
    for (const result of [
      inspectDependencyStateFromEvidence(evidence, requirements),
      validatePeerDependenciesFromEvidence(evidence, plan),
    ]) {
      assert.ok(!result.ok);
      assert.ok(result.issues.some((i) => i.code === "NATIVE_INSTALL_VERSION"));
    }
  }
});

test("package-indexed native evidence is required; a retired singular field cannot authorize readiness", () => {
  const declaration = "file:./vendor/native.tgz";
  const source = {
    kind: "value" as const,
    declaration,
    path: "vendor/native.tgz",
    version: NATIVE_BASELINE.version,
    digest: NATIVE_BASELINE.archiveSha256,
    mode: 0o644,
  };
  const evidence: DependencyEvidence = {
    manifest: {
      kind: "value",
      value: { dependencies: { "bits-ui": declaration } },
    },
    observe: () => ({
      kind: "value",
      version: NATIVE_BASELINE.version,
      manifest: { name: "bits-ui", version: NATIVE_BASELINE.version },
      nativeAuthentication: {
        kind: "authenticated",
        version: NATIVE_BASELINE.version,
        provenanceSha256: NATIVE_BASELINE.provenanceSha256,
      },
    }),
    nativeFiles: new Map([["bits-ui", source]]),
  };
  for (const inspect of [
    () => inspectDependencyStateFromEvidence(evidence, requirements),
    () => validatePeerDependenciesFromEvidence(evidence, plan),
  ])
    assert.equal(inspect().ok, true);
  const singularOnly = {
    manifest: evidence.manifest,
    observe: evidence.observe,
    nativeFile: source,
  };
  for (const result of [
    inspectDependencyStateFromEvidence(singularOnly, requirements),
    validatePeerDependenciesFromEvidence(singularOnly, plan),
  ]) {
    assert.equal(
      result.ok,
      false,
      "retired singular evidence must not become authority",
    );
    if (!result.ok)
      assert.ok(
        result.issues.some((issue) => issue.code === "NATIVE_ARCHIVE_REQUIRED"),
      );
  }
});
