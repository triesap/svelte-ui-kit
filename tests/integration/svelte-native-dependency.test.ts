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
  t.after(() => rmSync(app, { recursive: true, force: true }));
  return { app, packageRoot, manifest };
}

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
