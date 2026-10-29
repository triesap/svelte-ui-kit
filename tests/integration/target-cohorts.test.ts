import assert from "node:assert/strict";
import { cpSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { generationFixture } from "../helpers/generation-fixture.js";
import { createTempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import { parseTargetConfig } from "../../src/project/target-config.js";
import { generationLockContext } from "../../src/project/generation-config.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import { parseKitLock } from "../../src/codegen/lock.js";
import { planSync } from "../../src/codegen/plan-sync.js";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import { computeRegistryContentHash } from "../../src/registry/model.js";
import { sha256Hex } from "../../src/codegen/digest.js";

for (const target of ["astro", "svelte-library"] as const)
  test(`${target}: an authenticated incoming style cannot split a locally customized source cohort`, (t) => {
    const f = generationFixture(t, target, true);
    for (const args of [["init"], ["add", "button"]]) {
      const child = spawnSync(
        process.execPath,
        [
          path.join(f.owner, "dist/cli/main.js"),
          "--cwd",
          f.project.root,
          ...args,
        ],
        { encoding: "utf8", timeout: 30000 },
      );
      assert.equal(child.error, undefined);
      assert.equal(child.signal, null);
      assert.equal(child.status, 0, child.stdout + child.stderr);
    }
    const source = `${f.config.uiDir}/button.svelte`;
    f.project.writeFile(
      source,
      readFileSync(path.join(f.project.root, source), "utf8") +
        "\n<!-- local source customization -->\n",
    );
    const incomingOwner = createTempProject();
    t.after(() => incomingOwner.cleanup());
    for (const name of ["registry", "schema"])
      cpSync(path.join(f.owner, name), path.join(incomingOwner.root, name), {
        recursive: true,
      });
    const item = f.registry.items.find((item) => item.id === "button")!;
    const style = path.join(
      incomingOwner.root,
      "registry",
      item.manifest.styles[0]!.source,
    );
    const styleSource = readFileSync(style, "utf8"),
      endMarker = "/* svelte-ui-kit:end button */";
    assert.equal(styleSource.split(endMarker).length, 2);
    writeFileSync(
      style,
      styleSource.replace(
        endMarker,
        `.kit-button { outline-offset: 7px; }\n${endMarker}`,
      ),
    );
    const manifestPath = path.join(incomingOwner.root, item.manifestPath);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.version = "0.1.99";
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    const { contentHash: originalHash, ...basis } = f.registry.root;
    assert.ok(originalHash);
    const assets = f.registry.assets.map((asset) => ({
      path: asset.path,
      digest: sha256Hex(
        readFileSync(path.join(incomingOwner.root, asset.path)),
      ),
    }));
    writeFileSync(
      path.join(incomingOwner.root, "registry/registry.json"),
      JSON.stringify(
        { ...basis, contentHash: computeRegistryContentHash(basis, assets) },
        null,
        2,
      ) + "\n",
    );
    const incoming = loadRegistrySnapshot(
      createAssetProvider(incomingOwner.root),
    );
    assert.ok(incoming.ok, JSON.stringify(incoming));
    const config = parseTargetConfig(
      JSON.parse(
        readFileSync(
          path.join(f.project.root, f.paths.stateDir, "kit.json"),
          "utf8",
        ),
      ),
    );
    assert.ok(config.ok);
    const lock = parseKitLock(
      JSON.parse(
        readFileSync(
          path.join(f.project.root, f.paths.stateDir, "kit.lock.json"),
          "utf8",
        ),
      ),
      "kit.lock.json",
      {
        uiDir: f.config.uiDir,
        stylesDir: f.config.stylesDir,
        stateDir: f.paths.stateDir,
        ...generationLockContext(config.value),
      },
    );
    assert.ok(lock.ok, JSON.stringify(lock));
    const paths = [
      ...new Set([
        ...f.snapshot.entries.keys(),
        ...lock.value.files.map((row) => row.path),
        ...lock.value.cssBlocks.map((row) => row.path),
        ...lock.value.integrations.map((row) => row.path),
      ]),
    ];
    const snapshot = captureSnapshot(f.project.root, paths);
    assert.ok(snapshot.ok);
    const before = snapshotTree(f.project.root),
      incomingBefore = snapshotTree(incomingOwner.root);
    const sync = planSync({
      config: config.value,
      registry: incoming.value,
      snapshot: snapshot.value,
      lock: lock.value,
      registryVersion: incoming.value.root.registryVersion,
      registryHash: incoming.value.root.contentHash,
    });
    assert.ok(sync.ok, JSON.stringify(sync));
    assert.equal(sync.value.executable, false);
    assert.deepEqual(sync.value.writes, []);
    assert.match(sync.value.diagnostics.join("\n"), /cohort/i);
    assert.deepEqual(snapshotTree(f.project.root), before);
    assert.deepEqual(snapshotTree(incomingOwner.root), incomingBefore);
  });
