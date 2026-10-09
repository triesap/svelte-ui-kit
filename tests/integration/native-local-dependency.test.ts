import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import {
  inspectDependencyState,
  inspectDependencyStateFromEvidence,
  resolveInstalledManifestPath,
} from "../../src/project/dependencies.js";
import { captureEnvironment } from "../../src/project/environment.js";
import {
  authenticateNativeInstall,
  NATIVE_BASELINE,
  observeNativeFile,
} from "../../src/project/native-dependency.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import {
  verifyAncestors,
  verifyInstalledReads,
  verifyReadFiles,
} from "../../src/codegen/authority.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import { validateWithSchema } from "../../src/registry/schema.js";

const base = mkdtempSync(path.join(os.tmpdir(), "suik-native-local-"));
const fixture = path.join(base, "installed");
const archivePath = `vendor/${NATIVE_BASELINE.archive}`;
const requirements = [
  { name: NATIVE_BASELINE.name, range: NATIVE_BASELINE.version },
];
const log = path.resolve(".artifacts/verification/native-local-file");
mkdirSync(log, { recursive: true });
const transcript: unknown[] = [];
const env: NodeJS.ProcessEnv = {
  ...process.env,
  npm_config_verify_deps_before_run: "false",
};
for (const key of ["NODE_TEST_CONTEXT", "NODE_OPTIONS", "NODE_V8_COVERAGE"])
  delete env[key];
function run(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: "utf8",
    timeout: 240_000,
    maxBuffer: 64 * 1024 * 1024,
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
}
before(() => {
  const output = path.join(base, "producer");
  run(
    process.execPath,
    ["tools/build-native-dependency.mjs", "--output", output],
    process.cwd(),
  );
  mkdirSync(path.join(fixture, "vendor"), { recursive: true });
  cpSync(
    path.join(output, NATIVE_BASELINE.archive),
    path.join(fixture, archivePath),
  );
  writeFileSync(
    path.join(fixture, "package.json"),
    JSON.stringify({
      private: true,
      packageManager: "pnpm@11.22.0",
      dependencies: {
        "bits-ui": `file:./${archivePath}`,
        svelte: "5.57.1",
        "@internationalized/date": "3.12.4",
      },
    }),
  );
  run(
    "pnpm",
    [
      "install",
      "--ignore-scripts",
      "--strict-peer-dependencies",
      "--engine-strict",
    ],
    fixture,
  );
  rmSync(output, { recursive: true, force: true });
});
after(() => rmSync(base, { recursive: true, force: true }));
function copy(t: { after(callback: () => void): void }): string {
  const root = mkdtempSync(path.join(base, "consumer-"));
  cpSync(fixture, root, { recursive: true, verbatimSymlinks: true });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}
function codes(root: string): string[] {
  const result = inspectDependencyState(root, requirements);
  return result.ok ? [] : result.issues.map((i) => i.code);
}
function packageRoot(root: string): string {
  const manifest = resolveInstalledManifestPath(root, NATIVE_BASELINE.name);
  assert.ok(manifest);
  const physical = realpathSync(path.dirname(manifest));
  assert.ok(
    physical.startsWith(`${realpathSync(root)}${path.sep}`),
    "fault injection owns the installed copy",
  );
  return physical;
}
function installedReads(root: string) {
  return captureEnvironment(root).installedResolution.map((entry) => ({
    ...entry,
    code:
      entry.kind === "unsafe" || entry.kind === "unreadable"
        ? entry.code
        : null,
  }));
}

test("actual file install remains ready with complete identity and read-only capture", (t) => {
  const root = copy(t);
  const original = snapshotTree(root);
  assert.deepEqual(authenticateNativeInstall(packageRoot(root)), []);
  const inspected = inspectDependencyState(root, requirements);
  assert.ok(inspected.ok);
  assert.equal(inspected.value[0]?.status, "ready");
  assert.equal(inspected.value[0]?.declaredRange, `file:./${archivePath}`);
  assert.equal(inspected.value[0]?.installedVersion, NATIVE_BASELINE.version);
  const snapshot = captureSnapshot(root, ["target.ts"]);
  assert.ok(snapshot.ok);
  assert.equal(snapshot.value.environment.nativeFile.kind, "value");
  assert.ok(snapshot.value.ancestors.has("vendor"));
  assert.ok(
    snapshot.value.environment.evidence.some(
      (file) => file.path === archivePath && file.kind === "file",
    ),
  );
  assert.deepEqual(snapshotTree(root), original);
});

test("native provenance v1 rejects unknown formats/fields and never defaults missing identity", (t) => {
  const root = copy(t);
  const data = JSON.parse(
    readFileSync(
      path.join(packageRoot(root), "NATIVE_PROVENANCE.json"),
      "utf8",
    ),
  );
  const before = JSON.stringify(data);
  assert.ok(validateWithSchema("native-provenance.schema.json", data).ok);
  assert.equal(JSON.stringify(data), before);
  for (const variant of [
    { ...data, schemaVersion: 2 },
    { ...data, unknown: true },
    {
      ...data,
      producerLocks: { ...data.producerLocks, unknown: "0".repeat(64) },
    },
    {
      ...data,
      distributionFiles: [{ path: "dist/index.js", sha256: "wrong" }],
    },
  ]) {
    const original = JSON.stringify(variant);
    assert.equal(
      validateWithSchema("native-provenance.schema.json", variant).ok,
      false,
    );
    assert.equal(JSON.stringify(variant), original);
  }
  const missing = { ...data };
  delete missing.version;
  assert.equal(
    validateWithSchema("native-provenance.schema.json", missing).ok,
    false,
  );
  assert.equal(Object.hasOwn(missing, "version"), false);
});

test("an authenticated declaration still requires an actual compatible install", (t) => {
  const root = copy(t);
  rmSync(path.join(root, "node_modules"), { recursive: true, force: true });
  const state = inspectDependencyState(root, requirements);
  assert.ok(state.ok);
  assert.equal(state.value[0]?.status, "missing_install");
  mkdirSync(path.join(root, "node_modules/bits-ui"), { recursive: true });
  writeFileSync(
    path.join(root, "node_modules/bits-ui/package.json"),
    JSON.stringify({ name: "bits-ui", version: NATIVE_BASELINE.version }),
  );
  assert.deepEqual(
    codes(root),
    ["NATIVE_INSTALL_INVALID"],
    "a fabricated same-version manifest is insufficient",
  );
});

test("a same-version SemVer declaration cannot replace the explicit reproducible local source", (t) => {
  const root = copy(t);
  const reads = installedReads(root);
  const manifest = JSON.parse(
    readFileSync(path.join(root, "package.json"), "utf8"),
  );
  manifest.dependencies["bits-ui"] = NATIVE_BASELINE.version;
  writeFileSync(path.join(root, "package.json"), JSON.stringify(manifest));
  assert.deepEqual(codes(root), ["NATIVE_ARCHIVE_REQUIRED"]);
  assert.ok(
    verifyInstalledReads(root, reads).some(
      (i) => i.code === "AUTHORITY_INSTALLED_CHANGED",
    ),
  );
});

test("wrong archive bytes and unsafe file/parent/escaping declarations fail closed", (t) => {
  for (const kind of [
    "bytes",
    "file-link",
    "parent-link",
    "escape",
    "absolute",
  ]) {
    const root = copy(t);
    const archive = path.join(root, archivePath);
    if (kind === "bytes") writeFileSync(archive, "unqualified archive");
    if (kind === "file-link") {
      const original = `${archive}.original`;
      cpSync(archive, original);
      rmSync(archive);
      symlinkSync(original, archive);
    }
    if (kind === "parent-link") {
      cpSync(path.join(root, "vendor"), path.join(root, "linked-target"), {
        recursive: true,
      });
      rmSync(path.join(root, "vendor"), { recursive: true });
      symlinkSync("linked-target", path.join(root, "vendor"));
    }
    if (kind === "escape" || kind === "absolute") {
      const manifest = JSON.parse(
        readFileSync(path.join(root, "package.json"), "utf8"),
      );
      manifest.dependencies["bits-ui"] =
        kind === "escape"
          ? `file:../installed/${archivePath}`
          : `file:${path.join(fixture, archivePath)}`;
      writeFileSync(path.join(root, "package.json"), JSON.stringify(manifest));
    }
    const before = snapshotTree(root);
    assert.deepEqual(codes(root), ["NATIVE_ARCHIVE_INVALID"], kind);
    assert.deepEqual(snapshotTree(root), before, kind);
  }
});

test("other package file declarations and unsupported native sources remain invalid", (t) => {
  const root = copy(t);
  for (const spec of [
    "link:./vendor",
    "git+https://example.invalid/bits.git",
    "file:./unknown.tgz",
  ]) {
    const manifest = {
      dependencies: { "bits-ui": spec, svelte: `file:./${archivePath}` },
    };
    writeFileSync(path.join(root, "package.json"), JSON.stringify(manifest));
    const result = inspectDependencyState(root, [
      ...requirements,
      { name: "svelte", range: "5.57.1" },
    ]);
    assert.ok(!result.ok);
    assert.ok(
      result.issues.some((i) => i.code === "DEPENDENCY_DECLARED_INVALID"),
    );
  }
});

test("captured readiness stays immutable while archive and ancestry changes refuse guarded writes", (t) => {
  const root = copy(t);
  const snapshot = captureSnapshot(root, ["target.ts"]);
  assert.ok(snapshot.ok);
  const captured = snapshot.value.environment;
  const evidence = {
    manifest: captured.manifest,
    nativeFile: captured.nativeFile,
    observe: (name: string) => captured.installed.get(name) ?? null,
  };
  const reads = installedReads(root);
  assert.deepEqual(verifyInstalledReads(root, reads), []);
  writeFileSync(path.join(root, archivePath), "changed after capture");
  const stale = inspectDependencyStateFromEvidence(evidence, requirements);
  assert.ok(stale.ok);
  assert.equal(
    stale.value[0]?.status,
    "ready",
    "planning uses the immutable capture",
  );
  assert.ok(
    verifyReadFiles(root, captured.evidence).some(
      (i) => i.code === "AUTHORITY_READ_CHANGED",
    ),
  );
  // Even omitted/forged archive read authority cannot certify a live invalid
  // source: installed revalidation independently re-proves the declaration.
  assert.ok(
    verifyInstalledReads(root, reads).some(
      (i) => i.code === "AUTHORITY_INSTALLED_CHANGED",
    ),
  );
  const ancestor = snapshot.value.ancestors.get("vendor");
  assert.ok(ancestor);
  cpSync(path.join(root, "vendor"), path.join(root, "replacement"), {
    recursive: true,
  });
  rmSync(path.join(root, "vendor"), { recursive: true });
  symlinkSync("replacement", path.join(root, "vendor"));
  assert.ok(
    verifyAncestors(root, [
      {
        path: "vendor",
        kind: "directory",
        device: ancestor.device,
        inode: ancestor.inode,
      },
    ]).some((i) => i.code === "AUTHORITY_ANCESTOR_UNSAFE"),
  );
});

test("same-version provenance, runtime, missing and extra file faults invalidate the install", (t) => {
  for (const fault of [
    "provenance",
    "runtime",
    "missing",
    "extra",
    "empty-directory",
  ]) {
    const root = copy(t),
      native = packageRoot(root);
    const runtime = path.join(native, "dist/index.js");
    if (fault === "provenance") {
      const file = path.join(native, "NATIVE_PROVENANCE.json");
      chmodSync(file, 0o600);
      writeFileSync(file, "{}");
    }
    if (fault === "runtime") {
      chmodSync(runtime, 0o600);
      writeFileSync(runtime, "export {};\n");
    }
    if (fault === "missing") rmSync(runtime);
    if (fault === "extra")
      writeFileSync(path.join(native, "unrecorded.js"), "export {};\n");
    if (fault === "empty-directory")
      mkdirSync(path.join(native, "unrecorded-directory"));
    const before = snapshotTree(root);
    assert.deepEqual(codes(root), ["NATIVE_INSTALL_INVALID"], fault);
    assert.deepEqual(snapshotTree(root), before, fault);
  }
});

test("guarded installed revalidation detects changed native content with unchanged manifest", (t) => {
  const root = copy(t),
    native = packageRoot(root);
  const reads = installedReads(root);
  assert.deepEqual(verifyInstalledReads(root, reads), []);
  const runtime = path.join(native, "dist/index.js");
  chmodSync(runtime, 0o600);
  writeFileSync(runtime, "export {};\n");
  const issues = verifyInstalledReads(root, reads);
  assert.ok(
    issues.some(
      (i) =>
        i.code === "AUTHORITY_INSTALLED_CHANGED" &&
        i.locator === NATIVE_BASELINE.name,
    ),
  );
  assert.equal(
    observeNativeFile(root, {
      dependencies: { "bits-ui": `file:./${archivePath}` },
    }).kind,
    "value",
    "the unchanged archive cannot certify changed installed code",
  );
});
