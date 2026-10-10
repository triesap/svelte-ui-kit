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
    nativeFile: { kind: "invalid", issues: [] },
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
      nativeFile: { kind: "absent" },
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
