import assert from "node:assert/strict";
import { test } from "node:test";
import { CONFIGURATION_FILES } from "../../src/project/configuration-inputs.js";
import { inspectSvelteKitInputs } from "../../src/project/sveltekit-evidence.js";
import { detectDefaultProject } from "../../src/project/detect.js";
const configuration = CONFIGURATION_FILES.map((path) => ({
  path,
  kind: "absent" as const,
}));
const manifest = { dependencies: { "@sveltejs/kit": "^2.70.3" } };
test("captured Kit evidence requires explicit installation absence and a complete unique configuration inventory", () => {
  const input = {
    manifest,
    configuration,
    installed: { kind: "absent" as const },
  };
  assert.ok(inspectSvelteKitInputs(input).ok);
  for (const changed of [
    { ...input, installed: undefined },
    { ...input, configuration: [] },
    { ...input, configuration: [...configuration.slice(1), configuration[1]] },
  ]) {
    assert.equal(inspectSvelteKitInputs(changed).ok, false);
    assert.equal(detectDefaultProject(process.cwd(), changed).ok, false);
  }
});
test("empty and prerelease-only Kit declarations cannot claim an absent stable installation", () => {
  for (const range of [">=3 <2", ">=2.1.0-beta <2.1.0", "*", ">=2"])
    assert.equal(
      inspectSvelteKitInputs({
        manifest: { dependencies: { "@sveltejs/kit": range } },
        configuration,
        installed: { kind: "absent" },
      }).ok,
      false,
      range,
    );
});
