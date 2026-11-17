import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import { serializeKitConfig } from "../../src/project/config.js";
import { generationFixture } from "../helpers/generation-fixture.js";
import { composeGenerationFoundation } from "../helpers/generation-project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
for (const target of ["sveltekit", "astro", "svelte-library"] as const)
  for (const timing of ["after-stage", "first-replacement"] as const)
    for (const foreign of [
      "config",
      "lock",
      "transactions",
      "ordinary-app",
    ] as const)
      test(`${target}: ${foreign} newly appears at ${timing}`, (t) => {
        let passed = false;
        const f = generationFixture(t, target, true, () => passed);
        f.project.writeDir("operator-existing");
        const planned = composeGenerationFoundation(
          f.project.root,
          f.owner,
          f.config,
        );
        const sealed = validateApplyPlan(planned.composed);
        assert.ok(sealed.ok, JSON.stringify(sealed));
        if (!sealed.ok) return;
        const before = snapshotTree(f.project.root);
        let fired = false;
        const mutate = (boundary: string) => {
          if (
            fired ||
            (timing === "after-stage"
              ? boundary !== "stage:write"
              : boundary !== "backup:move" && boundary !== "replace:apply")
          )
            return;
          fired = true;
          const base = path.join(f.project.root, "operator-existing", "new");
          if (foreign === "ordinary-app") {
            mkdirSync(base, { recursive: true });
            writeFileSync(
              path.join(base, "app.ts"),
              "export const operatorValue = 42;\n",
            );
          } else {
            const state = path.join(base, "ui", "_kit");
            mkdirSync(state, { recursive: true });
            if (foreign === "config")
              writeFileSync(
                path.join(state, "kit.json"),
                serializeKitConfig({
                  ...f.config,
                  uiDir: "operator-existing/new/ui",
                  stylesDir: "operator-existing/new/styles",
                }),
              );
            if (foreign === "lock")
              writeFileSync(path.join(state, "kit.lock.json"), "{}\n");
            if (foreign === "transactions")
              mkdirSync(path.join(state, ".svelte-ui-kit", "transactions"), {
                recursive: true,
              });
          }
        };
        const result = applyPlan(
          sealed.value,
          timing === "after-stage" ? { after: mutate } : { before: mutate },
        );
        assert.equal(fired, true);
        if (foreign === "ordinary-app")
          assert.equal(result.kind, "applied", JSON.stringify(result));
        else {
          assert.equal(result.kind, "refused", JSON.stringify(result));
          assert.ok(
            result.issues.some(
              (i) => i.code === "AUTHORITY_INSTALLATION_CHANGED",
            ),
            JSON.stringify(result),
          );
          const after = snapshotTree(f.project.root);
          for (const entry of before)
            assert.deepEqual(
              after.find((v) => v.path === entry.path),
              entry,
              entry.path,
            );
          assert.deepEqual(
            after.filter(
              (v) =>
                v.kind !== "directory" &&
                !v.path.includes("/.svelte-ui-kit/") &&
                !v.path.startsWith("operator-existing/"),
            ),
            before.filter((v) => v.kind !== "directory"),
          );
        }
        assert.equal(
          existsSync(
            path.join(
              f.project.root,
              "operator-existing",
              "new",
              foreign === "ordinary-app" ? "app.ts" : "ui/_kit",
            ),
          ),
          true,
        );
        passed = true;
      });

for (const target of ["sveltekit", "astro", "svelte-library"] as const)
  test(`${target}: failed semantic discovery retains independent raw capture without reusing old planner authority`, async (t) => {
    const { captureSnapshot } = await import("../../src/codegen/snapshot.js");
    const { composeApplyPlan } = await import("../../src/codegen/compose.js");
    const { installationInventoryDigest, verifyInstallationInventory } =
      await import("../../src/project/detect.js");
    let passed = false;
    const f = generationFixture(t, target, true, () => passed);
    const configPath = `${f.paths.stateDir}/kit.json`;
    f.project.writeDir("operator-existing");
    f.project.writeFile(configPath, "{deliberately malformed desired input");
    const captured = captureSnapshot(f.project.root, f.snapshot.paths);
    assert.ok(captured.ok, JSON.stringify(captured));
    if (!captured.ok) return;
    assert.equal(captured.value.environment.kitConfig.ok, false);
    assert.ok(Object.isFrozen(captured.value.installationCandidates));
    const rawBefore = JSON.stringify(captured.value.installationCandidates);
    const expected = {
      stateDir: f.paths.stateDir,
      digest: installationInventoryDigest(
        captured.value.installationCandidates.observations,
        f.paths.stateDir,
      ),
    };
    assert.deepEqual(verifyInstallationInventory(f.project.root, expected), []);
    const state = path.join(f.project.root, "operator-existing", "new", "_kit");
    mkdirSync(state, { recursive: true });
    writeFileSync(path.join(state, "kit.lock.json"), "{}\n");
    assert.ok(
      verifyInstallationInventory(f.project.root, expected).some(
        (row) => row.code === "AUTHORITY_INSTALLATION_CHANGED",
      ),
    );
    assert.equal(
      JSON.stringify(captured.value.installationCandidates),
      rawBefore,
    );
    const before = snapshotTree(f.project.root);
    const composed = composeApplyPlan({
      root: f.project.root,
      config: f.config,
      snapshot: captured.value,
      writes: [
        ...f.composed.targets.filter((row) => row.path !== configPath),
        {
          path: configPath,
          operation: "update",
          bytes: new TextEncoder().encode(serializeKitConfig(f.config)),
        },
        {
          path: `${f.paths.stateDir}/kit.lock.json`,
          operation: "create",
          bytes: f.composed.lock.bytes,
        },
      ],
      exportAuthority: f.composed.exportAuthority,
    });
    assert.equal(
      composed.ok,
      false,
      "old planner authority never blesses a different malformed-input snapshot",
    );
    if (!composed.ok)
      assert.ok(
        composed.issues.some(
          (row) => row.code === "COMPOSE_PLANNING_AUTHORITY_CHANGED",
        ),
        JSON.stringify(composed),
      );
    assert.deepEqual(snapshotTree(f.project.root), before);
    passed = true;
  });
