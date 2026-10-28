/** Real production planning entry used by parent and independently killed workers. */
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  type AppProjectConfig,
  targetInputPaths,
} from "../../src/project/app-config.js";
import { deriveKitPaths } from "../../src/project/config.js";
import { captureSnapshot, observedText } from "../../src/codegen/snapshot.js";
import { planInit } from "../../src/codegen/plan-init.js";
import { composeApplyPlan } from "../../src/codegen/compose.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import { createAssetProvider } from "../../src/registry/assets.js";
export function composeApplicationFoundation(
  root: string,
  registryRoot: string,
  config: AppProjectConfig,
) {
  const paths = deriveKitPaths(config);
  const snapshot = captureSnapshot(root, [
    ...targetInputPaths(config),
    `${paths.stateDir}/kit.json`,
    `${paths.stateDir}/kit.lock.json`,
    paths.rootExports,
    paths.kitCss,
    paths.themesCss,
    paths.appCss,
    config.layoutFile,
    ".gitignore",
  ]);
  if (!snapshot.ok) throw new Error(JSON.stringify(snapshot));
  const registry = loadRegistrySnapshot(createAssetProvider(registryRoot));
  if (!registry.ok) throw new Error(JSON.stringify(registry));
  const planned = planInit({
    config,
    layoutFile: config.layoutFile,
    layoutSource:
      observedText(snapshot.value.entries.get(config.layoutFile)!) ?? "",
    snapshot: snapshot.value,
    registry: registry.value,
    configHash: sha256Hex(
      readFileSync(path.join(root, paths.stateDir, "kit.json")),
    ),
  });
  if (!planned.ok) throw new Error(JSON.stringify(planned));
  const composed = composeApplyPlan({
    root,
    config,
    snapshot: snapshot.value,
    writes: planned.value.writes,
    exportAuthority: planned.value.exportAuthority,
  });
  if (!composed.ok) throw new Error(JSON.stringify(composed));
  return {
    config,
    paths,
    snapshot: snapshot.value,
    composed: composed.value,
    registry: registry.value,
  };
}
