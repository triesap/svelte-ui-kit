/** Authenticated owned test setup, never a modified dependency-store package. */
import assert from "node:assert/strict";
import { cpSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import {
  copyAuthenticatedArtifact,
  regularArtifact,
} from "../../tools/native-artifacts.js";
import {
  observeNativeInstall,
  SVELTE_RUNTIME_BASELINE as profile,
} from "../../src/project/native-dependency.js";
import type { TempProject } from "./project.js";

export function linkQualifiedFixtureRuntime(
  project: TempProject,
  field: "dependencies" | "devDependencies",
): void {
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
  const logical = `.native-build/${profile.buildId}`;
  project.writeDir(logical);
  copyAuthenticatedArtifact(
    regularArtifact(path.join(owner, logical, profile.archive)),
    path.join(project.root, logical, profile.archive),
    profile.archiveSha256,
  );
  project.writeDir("node_modules");
  assert.equal(
    lstatSync(path.join(project.root, "node_modules/svelte"), {
      throwIfNoEntry: false,
    }),
    undefined,
  );
  // Recovery tests deliberately alter the installed manifest. Authenticate a
  // private copy so those faults can never write through a shared-store alias.
  const owned = project.writeDir(".owned-svelte-runtime");
  cpSync(realpathSync(installed), owned, { recursive: true });
  assert.equal(
    observeNativeInstall(owned, profile.version, "svelte").kind,
    "authenticated",
  );
  project.symlink(owned, "node_modules/svelte");
  const manifest = JSON.parse(
    readFileSync(path.join(project.root, "package.json"), "utf8"),
  );
  manifest[field] = {
    ...manifest[field],
    svelte: `file:./${logical}/${profile.archive}`,
  };
  project.writeFile("package.json", JSON.stringify(manifest, null, 2) + "\n");
}
