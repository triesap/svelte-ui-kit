/** Authenticated owned test setup, never a modified dependency-store package. */
import assert from "node:assert/strict";
import {
  cpSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import {
  copyAuthenticatedArtifact,
  regularArtifact,
} from "../../tools/native-artifacts.js";
import {
  observeNativeInstall,
  SVELTE_RUNTIME_BASELINE as profile,
} from "../../src/project/native-dependency.js";
import {
  assertPhysicalWithin,
  resolveWithin,
  type TempProject,
} from "./project.js";

export function linkQualifiedFixtureRuntime(
  project: TempProject,
  field: "dependencies" | "devDependencies",
): void {
  const owned = path.join(project.root, ".owned-svelte-runtime");
  copyQualifiedFixtureRuntime(project.root, field, owned);
  project.writeDir("node_modules");
  project.symlink(owned, "node_modules/svelte");
}

/** Copy a genuine distribution into an owned test tree (never a shared store).
 * The optional destination preserves tests of direct, hoisted and linked installs.
 */
export function copyQualifiedFixtureRuntime(
  root: string,
  field: "dependencies" | "devDependencies" = "dependencies",
  installedRoot = path.join(root, "node_modules/svelte"),
  ownedBase = root,
): void {
  const logical = `.native-build/${profile.buildId}`;
  // Complete physical preflight before creating any archive/runtime paths. Hoisted
  // destinations require the caller's explicitly owned enclosing fixture base.
  for (const target of [
    root,
    path.join(root, "package.json"),
    path.join(root, "node_modules"),
    path.join(root, logical, profile.archive),
    installedRoot,
  ]) {
    const relative = path.relative(ownedBase, target);
    const contained =
      relative === "" ? ownedBase : resolveWithin(ownedBase, relative);
    assertPhysicalWithin(ownedBase, contained);
  }
  assert.ok(lstatSync(path.join(root, "package.json")).isFile());
  assert.equal(
    lstatSync(installedRoot, {
      throwIfNoEntry: false,
    }),
    undefined,
  );
  const owner = process.cwd();
  const installed = path.join(
    owner,
    "tests/fixtures/consumer/node_modules/svelte",
  );
  assert.equal(
    observeNativeInstall(installed, profile.version, "svelte").kind,
    "authenticated",
    "prepare and install the maintained qualified runtime first",
  );
  mkdirSync(path.join(root, logical), { recursive: true });
  copyAuthenticatedArtifact(
    regularArtifact(path.join(owner, logical, profile.archive)),
    path.join(root, logical, profile.archive),
    profile.archiveSha256,
  );
  mkdirSync(path.dirname(installedRoot), { recursive: true });
  // Recovery tests deliberately alter the installed manifest. Authenticate a
  // private copy so those faults can never write through a shared-store alias.
  const owned = installedRoot;
  cpSync(realpathSync(installed), owned, { recursive: true });
  assert.equal(
    observeNativeInstall(owned, profile.version, "svelte").kind,
    "authenticated",
  );
  const manifest = JSON.parse(
    readFileSync(path.join(root, "package.json"), "utf8"),
  );
  manifest[field] = {
    ...manifest[field],
    svelte: `file:./${logical}/${profile.archive}`,
  };
  writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
}
