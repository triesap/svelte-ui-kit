import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
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
import { after, before, test } from "node:test";
import {
  authenticateNativeInstall,
  nativeArchiveIssues,
  nativeDeclaration,
  nativeInstallIssues,
  observeNativeFile,
  observeNativeInstall,
  qualifiedNativeBaseline,
  SVELTE_RUNTIME_BASELINE as baseline,
} from "../../src/project/native-dependency.js";
import { validateWithSchema } from "../../src/registry/schema.js";
import {
  inspectDependencyState,
  inspectDependencyStateFromEvidence,
  validatePeerDependenciesFromEvidence,
  type DependencyEvidence,
} from "../../src/project/dependencies.js";
import { captureEnvironment } from "../../src/project/environment.js";
import { observeCatalogs } from "../../src/project/catalogs.js";
import {
  verifyInstalledReads,
  verifyReadFiles,
} from "../../src/codegen/authority.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import { SVELTE_RUNTIME_RECIPE as recipe } from "../../tools/native-runtime/recipe.js";

const root = mkdtempSync(path.join(os.tmpdir(), "suik-runtime-auth-"));
const builds = new Map<
  string,
  { output: string; archive: string; packageRoot: string }
>();
const transcript: unknown[] = [];
const log = path.resolve(".artifacts/verification/native-runtime-auth");
mkdirSync(log, { recursive: true });
function run(command: string, args: string[]) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: 120000,
    killSignal: "SIGKILL",
    maxBuffer: 16 * 1024 * 1024,
  });
  transcript.push({
    command,
    args,
    status: result.status,
    signal: result.signal,
    error: result.error?.message ?? null,
    stdout: result.stdout,
    stderr: result.stderr,
  });
  writeFileSync(
    path.join(log, `${process.pid}.json`),
    JSON.stringify(transcript, null, 2),
  );
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout;
}
before(async () => {
  const response = await fetch(recipe.sourceUrl, {
    redirect: "error",
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, 200);
  const upstream = Buffer.from(await response.arrayBuffer());
  assert.equal(
    createHash("sha256").update(upstream).digest("hex"),
    recipe.sourceSha256,
  );
  const source = path.join(root, "upstream.tgz");
  writeFileSync(source, upstream, { flag: "wx" });
  for (const mode of ["complete", "unpatched", "dispatch-only"]) {
    const output = path.join(root, mode);
    const built = JSON.parse(
      run(process.execPath, [
        "tools/build-svelte-runtime.ts",
        "--source",
        source,
        "--output",
        output,
        ...(mode === "unpatched"
          ? ["--baseline"]
          : mode === "dispatch-only"
            ? ["--dispatch-control"]
            : []),
      ]),
    );
    if (mode === "complete") {
      assert.equal(built.sha256, baseline.archiveSha256);
      assert.equal(built.provenanceSha256, baseline.provenanceSha256);
    }
    const packageRoot = path.join(output, "distribution");
    mkdirSync(packageRoot);
    run("tar", [
      "-xzf",
      path.join(output, built.archive),
      "--strip-components=1",
      "-C",
      packageRoot,
    ]);
    builds.set(mode, { output, archive: built.archive, packageRoot });
  }
  const packageRoot = path.join(root, "upstream-distribution");
  mkdirSync(packageRoot);
  run("tar", ["-xzf", source, "--strip-components=1", "-C", packageRoot]);
  builds.set("upstream", {
    output: root,
    archive: "upstream.tgz",
    packageRoot,
  });
});
after(() => rmSync(root, { recursive: true, force: true }));
function consumer(t: { after(callback: () => void): void }, mode = "complete") {
  const source = builds.get(mode)!;
  const app = mkdtempSync(path.join(root, "app-"));
  mkdirSync(path.join(app, "vendor"));
  cpSync(
    path.join(source.output, source.archive),
    path.join(app, "vendor/runtime.tgz"),
  );
  const packageRoot = path.join(app, "distribution");
  cpSync(source.packageRoot, packageRoot, { recursive: true });
  const manifest = { dependencies: { svelte: "file:./vendor/runtime.tgz" } };
  mkdirSync(path.join(app, "node_modules"));
  symlinkSync(packageRoot, path.join(app, "node_modules/svelte"));
  writeFileSync(path.join(app, "package.json"), JSON.stringify(manifest));
  t.after(() => rmSync(app, { recursive: true, force: true }));
  return { app, packageRoot, manifest };
}

const runtimeRequirements = [{ name: "svelte", range: "^5.57.3" }];
const peerPlan = {
  entries: [
    {
      ...runtimeRequirements[0]!,
      roles: ["peer" as const],
      requiredBy: ["field"],
    },
  ],
};
function evidence(app: string): DependencyEvidence {
  const captured = captureEnvironment(app);
  return {
    manifest: captured.manifest,
    nativeFile: captured.nativeFile,
    nativeFiles: captured.nativeFiles,
    observe: (name) => captured.installed.get(name) ?? null,
  };
}
function reads(app: string) {
  return captureEnvironment(app).installedResolution.map((entry) => ({
    ...entry,
    code:
      entry.kind === "unsafe" || entry.kind === "unreadable"
        ? entry.code
        : null,
  }));
}

test("actual and captured runtime readiness and peer-only validation require both proofs", (t) => {
  const { app } = consumer(t);
  const before = snapshotTree(app);
  const captured = evidence(app);
  for (const result of [
    inspectDependencyState(app, runtimeRequirements),
    inspectDependencyStateFromEvidence(captured, runtimeRequirements),
    validatePeerDependenciesFromEvidence(captured, peerPlan),
  ]) {
    assert.ok(result.ok, JSON.stringify(result));
    assert.equal(result.value[0]?.status, "ready");
  }
  assert.deepEqual(verifyInstalledReads(app, reads(app)), []);
  assert.deepEqual(snapshotTree(app), before);
});

test("runtime readiness never falls back to Bits proof or accepts incomplete package-indexed evidence", (t) => {
  const { app } = consumer(t);
  const captured = evidence(app);
  const installed = captured.observe("svelte");
  assert.ok(installed?.kind === "value");
  const sources: DependencyEvidence[] = [
    { ...captured, nativeFiles: undefined },
    { ...captured, nativeFiles: new Map() },
    {
      ...captured,
      nativeFiles: new Map([["bits-ui", captured.nativeFiles!.get("svelte")!]]),
    },
    {
      ...captured,
      nativeFiles: new Map([["svelte", { kind: "invalid", issues: [] }]]),
    },
    ...[
      undefined,
      { kind: "invalid" as const, issues: [] },
      {
        kind: "authenticated" as const,
        version: baseline.version,
        provenanceSha256: "0".repeat(64),
      },
    ].map((nativeAuthentication) => ({
      ...captured,
      observe: () => ({ ...installed, nativeAuthentication }),
    })),
  ];
  for (const source of sources) {
    for (const result of [
      inspectDependencyStateFromEvidence(source, runtimeRequirements),
      validatePeerDependenciesFromEvidence(source, peerPlan),
    ])
      assert.ok(!result.ok, "missing or cross-profile evidence must refuse");
  }
});

for (const mode of ["upstream", "unpatched", "dispatch-only"])
  test(`normal readiness rejects an actual same-version ${mode} installation`, (t) => {
    const { app } = consumer(t, mode);
    const before = snapshotTree(app);
    assert.equal(inspectDependencyState(app, runtimeRequirements).ok, false);
    assert.equal(
      validatePeerDependenciesFromEvidence(evidence(app), peerPlan).ok,
      false,
    );
    assert.deepEqual(snapshotTree(app), before);
  });

test("selected-owner default and named runtime catalogs accept only the owned qualified archive", (t) => {
  for (const named of [false, true]) {
    const { app } = consumer(t);
    writeFileSync(
      path.join(app, "package.json"),
      JSON.stringify({
        dependencies: { svelte: named ? "catalog:native" : "catalog:" },
      }),
    );
    writeFileSync(
      path.join(app, "pnpm-workspace.yaml"),
      `packages:\n  - .\n${named ? "catalogs:\n  native:\n    " : "catalog:\n  "}svelte: file:./vendor/runtime.tgz\n`,
    );
    const before = snapshotTree(app);
    assert.deepEqual(observeCatalogs(app).issues, []);
    const result = inspectDependencyState(app, runtimeRequirements);
    assert.ok(result.ok, JSON.stringify(result));
    assert.equal(result.value[0]?.status, "ready");
    assert.deepEqual(verifyInstalledReads(app, reads(app)), []);
    assert.deepEqual(snapshotTree(app), before);
    const child = path.join(app, "packages/child");
    mkdirSync(child, { recursive: true });
    writeFileSync(
      path.join(child, "package.json"),
      readFileSync(path.join(app, "package.json")),
    );
    writeFileSync(
      path.join(app, "pnpm-workspace.yaml"),
      readFileSync(path.join(app, "pnpm-workspace.yaml"), "utf8").replace(
        "  - .",
        "  - .\n  - packages/*",
      ),
    );
    const memberBefore = snapshotTree(app);
    assert.ok(
      observeCatalogs(child).issues.some(
        (i) => i.code === "DEPENDENCY_CATALOG_INVALID",
      ),
    );
    assert.equal(inspectDependencyState(child, runtimeRequirements).ok, false);
    assert.deepEqual(snapshotTree(app), memberBefore);
  }
});

test("live write authority independently reauthenticates runtime and source after immutable capture", (t) => {
  for (const fault of [
    "runtime",
    "provenance",
    "build-id",
    "archive",
    "declaration",
    "installer-shim",
  ]) {
    const { app, packageRoot } = consumer(t);
    if (fault === "installer-shim") {
      mkdirSync(path.join(packageRoot, "node_modules/.bin"), {
        recursive: true,
      });
      cpSync(
        path.resolve(
          "tests/fixtures/consumer/node_modules/svelte/node_modules/.bin/acorn",
        ),
        path.join(packageRoot, "node_modules/.bin/acorn"),
      );
    }
    const captured = evidence(app);
    const environment = captureEnvironment(app);
    const installedReads = reads(app);
    assert.deepEqual(verifyInstalledReads(app, installedReads), []);
    if (fault === "runtime") {
      const file = path.join(
        packageRoot,
        "src/internal/client/dom/elements/bindings/input.js",
      );
      writeFileSync(file, readFileSync(file, "utf8") + "\n/* changed */\n");
    } else if (fault === "provenance")
      writeFileSync(path.join(packageRoot, "NATIVE_PROVENANCE.json"), "{}");
    else if (fault === "build-id") {
      const file = path.join(packageRoot, "package.json");
      const manifest = JSON.parse(readFileSync(file, "utf8"));
      manifest.svelteUiKitNative.buildId = "other";
      writeFileSync(file, JSON.stringify(manifest));
    } else if (fault === "archive")
      writeFileSync(path.join(app, "vendor/runtime.tgz"), "changed");
    else if (fault === "installer-shim")
      writeFileSync(
        path.join(packageRoot, "node_modules/.bin/acorn"),
        "changed",
      );
    else
      writeFileSync(
        path.join(app, "package.json"),
        JSON.stringify({ dependencies: { svelte: baseline.version } }),
      );
    const before = snapshotTree(app);
    const stale = inspectDependencyStateFromEvidence(
      captured,
      runtimeRequirements,
    );
    assert.ok(stale.ok);
    assert.equal(stale.value[0]?.status, "ready");
    for (const readSet of [installedReads, reads(app)])
      assert.ok(
        verifyInstalledReads(app, readSet).some(
          (i) =>
            i.code === "AUTHORITY_INSTALLED_CHANGED" && i.locator === "svelte",
        ),
        fault,
      );
    if (fault === "archive")
      assert.ok(
        verifyReadFiles(app, environment.evidence).some(
          (i) => i.code === "AUTHORITY_READ_CHANGED",
        ),
      );
    assert.deepEqual(snapshotTree(app), before);
  }
});

test("complete produced Svelte runtime has positive distinct installation and app-owned archive proof", (t) => {
  const { app, packageRoot, manifest } = consumer(t);
  const before = snapshotTree(app);
  const installed = observeNativeInstall(
    packageRoot,
    baseline.version,
    "svelte",
  );
  assert.equal(installed.kind, "authenticated");
  assert.deepEqual(
    nativeInstallIssues(
      baseline.version,
      installed,
      baseline.version,
      "svelte",
    ),
    [],
  );
  const archive = observeNativeFile(app, manifest, "svelte");
  assert.equal(archive.kind, "value");
  assert.deepEqual(
    nativeArchiveIssues(
      nativeDeclaration(manifest, "svelte"),
      archive,
      "svelte",
    ),
    [],
  );
  assert.notDeepEqual(nativeInstallIssues(baseline.version, installed), []);
  assert.deepEqual(snapshotTree(app), before);
});

test("Svelte requires exact raw version and explicit positive proof, including nonempty invalid evidence", (t) => {
  const { packageRoot } = consumer(t);
  const installed = observeNativeInstall(
    packageRoot,
    baseline.version,
    "svelte",
  );
  for (const version of [
    `v${baseline.version}`,
    `${baseline.version}+other`,
    "5.57.2",
  ])
    assert.ok(
      nativeInstallIssues(baseline.version, installed, version, "svelte").some(
        (i) => i.code === "NATIVE_INSTALL_VERSION",
      ),
    );
  for (const proof of [
    undefined,
    { kind: "invalid" as const, issues: [] },
    {
      kind: "authenticated" as const,
      version: baseline.version,
      provenanceSha256: "0".repeat(64),
    },
  ])
    assert.ok(
      nativeInstallIssues(
        baseline.version,
        proof,
        baseline.version,
        "svelte",
      ).some((i) => i.code === "NATIVE_INSTALL_UNAUTHENTICATED"),
    );
  assert.ok(
    nativeArchiveIssues(
      "file:./vendor/runtime.tgz",
      { kind: "invalid", issues: [] },
      "svelte",
    ).some((i) => i.code === "NATIVE_ARCHIVE_REQUIRED"),
  );
  assert.throws(() => qualifiedNativeBaseline("unknown" as "svelte"));
});

test("exact pnpm installer metadata is inventoried while altered, linked, missing and shadowing files refuse", (t) => {
  const shim = readFileSync(
    path.resolve(
      "tests/fixtures/consumer/node_modules/svelte/node_modules/.bin/acorn",
    ),
  );
  for (const fault of [
    "none",
    "bytes",
    "link",
    "missing",
    "shadow",
    "extra",
    "empty-directory",
    "parent-link",
  ]) {
    const { app, packageRoot } = consumer(t);
    const directory = path.join(packageRoot, "node_modules/.bin");
    mkdirSync(directory, { recursive: true });
    const file = path.join(directory, "acorn");
    writeFileSync(file, shim);
    if (fault === "bytes")
      writeFileSync(file, Buffer.concat([shim, Buffer.from("\n# changed\n")]));
    if (fault === "link") {
      const target = path.join(app, "shim");
      writeFileSync(target, shim);
      rmSync(file);
      symlinkSync(target, file);
    }
    if (fault === "missing") rmSync(file);
    if (fault === "shadow") {
      mkdirSync(path.join(packageRoot, "node_modules/acorn"));
      writeFileSync(
        path.join(packageRoot, "node_modules/acorn/index.js"),
        "export {};",
      );
    }
    if (fault === "extra") writeFileSync(path.join(directory, "other"), shim);
    if (fault === "empty-directory") mkdirSync(path.join(directory, "other"));
    if (fault === "parent-link") {
      const target = path.join(app, "bin");
      cpSync(directory, target, { recursive: true });
      rmSync(directory, { recursive: true });
      symlinkSync(target, directory);
    }
    const before = snapshotTree(app);
    assert.equal(
      observeNativeInstall(packageRoot, baseline.version, "svelte").kind,
      fault === "none" ? "authenticated" : "invalid",
      fault,
    );
    assert.deepEqual(snapshotTree(app), before);
  }
});

for (const mode of ["upstream", "unpatched", "dispatch-only"])
  test(`same-version ${mode} control cannot authenticate as the corrected runtime`, (t) => {
    const { app, packageRoot, manifest } = consumer(t, mode);
    assert.equal(
      JSON.parse(readFileSync(path.join(packageRoot, "package.json"), "utf8"))
        .version,
      baseline.version,
    );
    const before = snapshotTree(app);
    assert.ok(
      authenticateNativeInstall(packageRoot, "svelte").some(
        (i) => i.code === "NATIVE_INSTALL_INVALID",
      ),
    );
    assert.equal(observeNativeFile(app, manifest, "svelte").kind, "invalid");
    assert.deepEqual(snapshotTree(app), before);
  });

for (const change of [
  "runtime",
  "manifest",
  "provenance",
  "extra",
  "missing",
  "link",
])
  test(`current Svelte ${change} divergence refuses with complete read-only inventory`, (t) => {
    const { app, packageRoot } = consumer(t);
    const runtime = path.join(
      packageRoot,
      "src/internal/client/dom/elements/bindings/input.js",
    );
    if (change === "runtime")
      writeFileSync(
        runtime,
        readFileSync(runtime, "utf8") + "\n/* changed */\n",
      );
    if (change === "manifest") {
      const file = path.join(packageRoot, "package.json");
      const manifest = JSON.parse(readFileSync(file, "utf8"));
      manifest.svelteUiKitNative.buildId = "other";
      writeFileSync(file, JSON.stringify(manifest));
    }
    if (change === "provenance")
      writeFileSync(path.join(packageRoot, "NATIVE_PROVENANCE.json"), "{}");
    if (change === "extra")
      writeFileSync(path.join(packageRoot, "unexpected.js"), "");
    if (change === "missing") rmSync(runtime);
    if (change === "link") {
      const saved = path.join(app, "saved.js");
      cpSync(runtime, saved);
      rmSync(runtime);
      symlinkSync(saved, runtime);
    }
    const before = snapshotTree(app);
    assert.ok(
      authenticateNativeInstall(packageRoot, "svelte").some(
        (i) => i.code === "NATIVE_INSTALL_INVALID",
      ),
    );
    assert.deepEqual(snapshotTree(app), before);
  });

test("Svelte archive source is selected-app-owned with safe physical ancestry", (t) => {
  const { app, manifest } = consumer(t);
  const parent = path.dirname(app);
  // A file visible from a parent source is not an application-owned declaration.
  assert.equal(
    observeNativeFile(
      app,
      { dependencies: { svelte: "file:../complete/runtime.tgz" } },
      "svelte",
    ).kind,
    "invalid",
  );
  const archive = path.join(app, "vendor/runtime.tgz");
  const saved = path.join(parent, `saved-${path.basename(app)}.tgz`);
  cpSync(archive, saved);
  rmSync(archive);
  symlinkSync(saved, archive);
  assert.equal(observeNativeFile(app, manifest, "svelte").kind, "invalid");
  rmSync(archive);
  cpSync(saved, archive);
  writeFileSync(archive, "unqualified bytes");
  assert.equal(observeNativeFile(app, manifest, "svelte").kind, "invalid");
});

test("closed Svelte provenance schema preserves actual producer identity and rejects malformed claims", () => {
  const file = path.join(
    builds.get("complete")!.packageRoot,
    "NATIVE_PROVENANCE.json",
  );
  const bytes = readFileSync(file);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    baseline.provenanceSha256,
  );
  const original = JSON.parse(bytes.toString());
  assert.equal(
    validateWithSchema("svelte-runtime-provenance.schema.json", original).ok,
    true,
  );
  const cases = [
    { ...original, unknown: true },
    { ...original, compiler: { ...original.compiler, rebuilt: true } },
    { ...original, compiler: { ...original.compiler, extra: true } },
    { ...original, mode: "unknown" },
    { ...original, mode: "dispatch-only" },
    { ...original, corrected: false },
    { ...original, patchSha256: null },
    { ...original, bindingsPatchSha256: null },
    {
      ...original,
      distributionFiles: [{ path: "index.js", sha256: "invalid" }],
    },
    { ...original, bindingsPatchSha256: undefined },
  ];
  for (const value of cases) {
    const before = structuredClone(value);
    assert.equal(
      validateWithSchema("svelte-runtime-provenance.schema.json", value).ok,
      false,
    );
    assert.deepEqual(value, before);
  }
  assert.equal(
    validateWithSchema("native-provenance.schema.json", original).ok,
    false,
  );
});
