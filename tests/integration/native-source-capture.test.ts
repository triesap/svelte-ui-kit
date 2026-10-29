import assert from "node:assert/strict";
import {
  chmodSync,
  cpSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import {
  verifyAncestors,
  verifyReadFiles,
} from "../../src/codegen/authority.js";
import { captureEnvironment } from "../../src/project/environment.js";
import {
  NATIVE_BASELINE,
  SVELTE_RUNTIME_BASELINE,
  type NativeFileObservation,
} from "../../src/project/native-dependency.js";
import { createTempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

const declarations = {
  "bits-ui": "vendor/bits/native.tgz",
  svelte: "runtime/source/native.tgz",
};
function consumer(
  t: { after(callback: () => void): void },
  names: readonly (keyof typeof declarations)[] = ["bits-ui", "svelte"],
) {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const dependencies: Record<string, string> = {};
  for (const name of names) {
    const profile =
      name === "bits-ui" ? NATIVE_BASELINE : SVELTE_RUNTIME_BASELINE;
    const cacheId =
      name === "bits-ui"
        ? NATIVE_BASELINE.version
        : SVELTE_RUNTIME_BASELINE.buildId;
    const target = path.join(project.root, declarations[name]);
    mkdirSync(path.dirname(target), { recursive: true });
    cpSync(
      path.join(process.cwd(), ".native-build", cacheId, profile.archive),
      target,
    );
    dependencies[name] = `file:./${declarations[name]}`;
  }
  project.writeFile(
    "package.json",
    JSON.stringify({ private: true, dependencies }),
  );
  return project;
}

test("both package sources are captured read-only with exact evidence and distinct ancestry", (t) => {
  const project = consumer(t);
  const before = snapshotTree(project.root);
  const captured = captureSnapshot(project.root, []);
  assert.ok(captured.ok);
  const environment = captured.value.environment;
  assert.deepEqual([...environment.nativeFiles.keys()], ["bits-ui", "svelte"]);
  assert.equal(environment.nativeFile, environment.nativeFiles.get("bits-ui"));
  for (const name of ["bits-ui", "svelte"] as const) {
    const source = environment.nativeFiles.get(name);
    assert.ok(source?.kind === "value");
    assert.equal(source.path, declarations[name]);
    assert.ok(
      environment.evidence.some(
        (entry) =>
          entry.path === source.path &&
          entry.digest === source.digest &&
          entry.mode === source.mode,
      ),
    );
  }
  assert.ok(captured.value.ancestors.has("vendor/bits"));
  assert.ok(captured.value.ancestors.has("runtime/source"));
  assert.deepEqual(verifyReadFiles(project.root, environment.evidence), []);
  assert.deepEqual(snapshotTree(project.root), before);
});

test("source lookup values and iterator aliases cannot mutate a captured observation", (t) => {
  const project = consumer(t);
  const environment = captureEnvironment(project.root);
  const sources = environment.nativeFiles;
  assert.ok(Object.isFrozen(sources));
  assert.equal((sources as unknown as { set?: unknown }).set, undefined);
  assert.equal((sources as unknown as { delete?: unknown }).delete, undefined);
  assert.equal((sources as unknown as { clear?: unknown }).clear, undefined);
  for (const source of sources.values()) {
    assert.ok(Object.isFrozen(source));
    assert.throws(() => {
      (source as { kind: string }).kind = "absent";
    }, TypeError);
  }
  const entry = sources.entries().next().value!;
  entry[1] = { kind: "absent" };
  assert.equal(sources.get("bits-ui")?.kind, "value");
  sources.forEach((value, name, map) => {
    assert.equal(map, sources);
    assert.equal(value, sources.get(name));
  });
});

test("absent declarations and invalid declared sources remain distinct immutable data", (t) => {
  const project = consumer(t, ["svelte"]);
  rmSync(path.join(project.root, declarations.svelte));
  const environment = captureEnvironment(project.root);
  assert.equal(environment.nativeFile.kind, "absent");
  assert.equal(environment.nativeFile, environment.nativeFiles.get("bits-ui"));
  const source = environment.nativeFiles.get("svelte");
  assert.ok(source?.kind === "invalid");
  assert.ok(source.issues.length > 0);
  assert.ok(Object.isFrozen(source.issues));
  assert.ok(source.issues.every((issue) => Object.isFrozen(issue)));
  assert.equal(
    environment.evidence.some((entry) => entry.path === declarations.svelte),
    false,
  );
});

test("late Svelte archive byte changes leave frozen proof unchanged and fail read authority", (t) => {
  const project = consumer(t);
  const captured = captureSnapshot(project.root, []);
  assert.ok(captured.ok);
  const source = captured.value.environment.nativeFiles.get("svelte");
  assert.ok(source?.kind === "value");
  assert.equal(source.digest, SVELTE_RUNTIME_BASELINE.archiveSha256);
  writeFileSync(
    path.join(project.root, declarations.svelte),
    "changed after capture",
  );
  assert.equal(source.digest, SVELTE_RUNTIME_BASELINE.archiveSha256);
  assert.ok(
    verifyReadFiles(project.root, captured.value.environment.evidence).some(
      (issue) =>
        issue.code === "AUTHORITY_READ_CHANGED" &&
        issue.locator === declarations.svelte,
    ),
  );
  assert.equal(
    captureEnvironment(project.root).nativeFiles.get("svelte")?.kind,
    "invalid",
  );
});

test("late archive mode changes fail independently of unchanged source bytes", (t) => {
  const project = consumer(t);
  const captured = captureSnapshot(project.root, []);
  assert.ok(captured.ok);
  const source = captured.value.environment.nativeFiles.get("svelte");
  assert.ok(source?.kind === "value");
  chmodSync(path.join(project.root, declarations.svelte), 0o600);
  assert.equal(source.mode, 0o644);
  assert.ok(
    verifyReadFiles(project.root, captured.value.environment.evidence).some(
      (issue) => issue.code === "AUTHORITY_READ_CHANGED",
    ),
  );
});

test("same original Svelte bytes through a replaced ancestor cannot retain path authority", (t) => {
  const project = consumer(t);
  const captured = captureSnapshot(project.root, []);
  assert.ok(captured.ok);
  const ancestor = captured.value.ancestors.get("runtime/source");
  assert.ok(ancestor);
  const bytes = readFileSync(path.join(project.root, declarations.svelte));
  renameSync(
    path.join(project.root, "runtime/source"),
    path.join(project.root, "runtime/saved"),
  );
  symlinkSync("saved", path.join(project.root, "runtime/source"));
  assert.deepEqual(
    readFileSync(path.join(project.root, declarations.svelte)),
    bytes,
  );
  assert.ok(
    verifyAncestors(project.root, [
      {
        path: "runtime/source",
        kind: "directory",
        device: ancestor.device,
        inode: ancestor.inode,
      },
    ]).some((issue) => issue.code === "AUTHORITY_ANCESTOR_UNSAFE"),
  );
  assert.equal(
    captureEnvironment(project.root).nativeFiles.get("svelte")?.kind,
    "invalid",
  );
});

test("an authentic parent archive cannot stand in for a selected application's source", (t) => {
  const project = consumer(t, ["svelte"]);
  const selected = path.join(project.root, "selected");
  mkdirSync(selected);
  writeFileSync(
    path.join(selected, "package.json"),
    JSON.stringify({
      private: true,
      dependencies: { svelte: `file:../${declarations.svelte}` },
    }),
  );
  const environment = captureEnvironment(selected);
  const source: NativeFileObservation | undefined =
    environment.nativeFiles.get("svelte");
  assert.ok(source?.kind === "invalid");
  assert.equal(
    environment.evidence.some((entry) => entry.path.includes("..")),
    false,
  );
});
