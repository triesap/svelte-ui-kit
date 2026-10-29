/** Real production planning entry used by parent and independently killed workers. */
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  type GenerationConfig,
  generationInputPaths,
  integrationMapping,
  initializationFields,
} from "../../src/project/generation-config.js";
import { deriveKitPaths } from "../../src/project/config.js";
import { captureSnapshot, observedText } from "../../src/codegen/snapshot.js";
import { planInit } from "../../src/codegen/plan-init.js";
import { composeApplyPlan } from "../../src/codegen/compose.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import { createAssetProvider } from "../../src/registry/assets.js";
function prepareFoundation<C extends GenerationConfig>(
  root: string,
  registryRoot: string,
  config: C,
) {
  const paths = deriveKitPaths(config);
  const snapshot = captureSnapshot(root, [
    ...generationInputPaths(config),
    `${paths.stateDir}/kit.json`,
    `${paths.stateDir}/kit.lock.json`,
    paths.rootExports,
    paths.kitCss,
    paths.themesCss,
    paths.appCss,
    integrationMapping(config).path,
    ".gitignore",
  ]);
  if (!snapshot.ok) throw new Error(JSON.stringify(snapshot));
  const registry = loadRegistrySnapshot(createAssetProvider(registryRoot));
  if (!registry.ok) throw new Error(JSON.stringify(registry));
  const planned = planInit({
    ...initializationFields(
      config,
      observedText(
        snapshot.value.entries.get(integrationMapping(config).path)!,
      ) ?? "",
    ),
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
    integration: integrationMapping(config),
    paths,
    snapshot: snapshot.value,
    composed: composed.value,
    registry: registry.value,
  };
}

type Foundation<C extends GenerationConfig, P> = Omit<
  ReturnType<typeof prepareFoundation>,
  "config" | "composed"
> & { readonly config: C; readonly composed: P };
export function composeGenerationFoundation(
  root: string,
  registryRoot: string,
  config: import("../../src/project/app-config.js").AppProjectConfig,
): Foundation<
  import("../../src/project/app-config.js").AppProjectConfig,
  import("../../src/codegen/apply.js").ApplyPlanInput
>;
export function composeGenerationFoundation(
  root: string,
  registryRoot: string,
  config: import("../../src/project/generation-config.js").LibraryConfig,
): Foundation<
  import("../../src/project/generation-config.js").LibraryConfig,
  import("../../src/codegen/apply.js").LibraryApplyPlanInput
>;
export function composeGenerationFoundation(
  root: string,
  registryRoot: string,
  config: GenerationConfig,
): ReturnType<typeof prepareFoundation>;
export function composeGenerationFoundation(
  root: string,
  registryRoot: string,
  config: GenerationConfig,
) {
  return prepareFoundation(root, registryRoot, config);
}
