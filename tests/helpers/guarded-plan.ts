import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";

import type { ApplyPlanInput } from "../../src/codegen/apply.js";

import { lockPath } from "../../src/codegen/transaction-types.js";
import { validKitConfigBytes } from "./kit-config.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import { composeApplyPlan } from "../../src/codegen/compose.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
  type KitConfig,
} from "../../src/project/config.js";
import { existsSync } from "node:fs";
import { ignoreBlockWithEntry } from "../../src/codegen/transaction-cleanup.js";
import { ignoreEntryFor } from "../../src/codegen/transaction-types.js";
import { planInit } from "../../src/codegen/plan-init.js";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";

/** Construct authentic production initialization, including zero-item plans. */
export function capturedFixtureInit(
  root: string,
  config: KitConfig = DEFAULT_KIT_CONFIG,
  seedIgnore = true,
): ApplyPlanInput {
  if (!existsSync(abs(root, "package.json"))) {
    write(
      root,
      "package.json",
      JSON.stringify({
        name: "consumer",
        type: "module",
        dependencies: {
          svelte: "5.57.1",
          "@sveltejs/kit": "2.70.3",
          "bits-ui": "2.19.3",
          "@internationalized/date": "3.12.4",
        },
      }),
    );
  }
  if (seedIgnore && !existsSync(abs(root, ".gitignore")))
    write(
      root,
      ".gitignore",
      ignoreBlockWithEntry("", ignoreEntryFor(deriveKitPaths(config).stateDir)),
    );
  if (
    config.layoutFile !== DEFAULT_KIT_CONFIG.layoutFile &&
    !existsSync(abs(root, "svelte.config.js"))
  ) {
    write(
      root,
      "svelte.config.js",
      "export default " +
        JSON.stringify({
          kit: { files: { routes: path.posix.dirname(config.layoutFile) } },
        }) +
        ";\n",
    );
  }
  const derived = deriveKitPaths(config);
  const snapshot = captureSnapshot(root, [
    derived.stateDir + "/kit.json",
    lockPath(derived.stateDir),
    derived.rootExports,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    config.layoutFile,
    ".gitignore",
  ]);
  if (!snapshot.ok) throw new Error(JSON.stringify(snapshot));
  const registry = loadRegistrySnapshot(createAssetProvider(process.cwd()));
  if (!registry.ok) throw new Error(JSON.stringify(registry));
  const planned = planInit({
    config,
    layoutFile: config.layoutFile,
    layoutSource: existsSync(abs(root, config.layoutFile))
      ? readFileSync(abs(root, config.layoutFile), "utf8")
      : "",
    snapshot: snapshot.value,
    registry: registry.value,
    configHash: "b".repeat(64),
  });
  if (!planned.ok) throw new Error(JSON.stringify(planned));
  const composed = composeApplyPlan({
    root,
    config,
    snapshot: snapshot.value,
    writes:
      planned.value.writes.length > 0
        ? planned.value.writes
        : [
            {
              path: lockPath(derived.stateDir),
              bytes:
                snapshot.value.entries.get(lockPath(derived.stateDir))?.bytes ??
                new TextEncoder().encode(
                  JSON.stringify(planned.value.lock, null, 2) + "\n",
                ),
            },
          ],
    exportAuthority: planned.value.exportAuthority,
  });
  if (!composed.ok) throw new Error(JSON.stringify(composed));
  return composed.value;
}

/**
 * Shared guarded-plan builder for RCLD-04 authority/coordination regressions.
 *
 * Unlike the older `tests/helpers/apply.ts` strict applier, this builds a
 * complete `ApplyPlanInput` (with a physical readset) so the actual production
 * `validateApplyPlan`/`applyPlan` boundary is exercised.
 */
export const GUARDED_UI = "src/lib/components/ui";
export const GUARDED_STYLES = "src/styles";
export const GUARDED_LAYOUT = "src/routes/+layout.svelte";
export const GUARDED_STATE = `${GUARDED_UI}/_kit`;

export function abs(root: string, logical: string): string {
  return path.join(root, ...logical.split("/"));
}

export function write(
  root: string,
  logical: string,
  text: string | Uint8Array,
): void {
  const target = abs(root, logical);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text);
}

export function lockJson(configHash: string): Uint8Array {
  return new TextEncoder().encode(
    `${JSON.stringify(
      {
        schemaVersion: 1,
        toolVersion: "0.1.0",
        registryVersion: "0.1.0",
        registryHash: "a".repeat(64),
        configHash,
        requested: [],
        items: [],
        files: [],
        cssBlocks: [],
        integrations: [],
      },
      null,
      2,
    )}\n`,
  );
}

export interface GuardedPlanOptions {
  readonly uiDir?: string;
  readonly stylesDir?: string;
  readonly layoutFile?: string;
  readonly lockConfigHash?: string;
  readonly metadataOnly?: boolean;
}

export function makeGuardedPlan(
  root: string,
  options: GuardedPlanOptions = {},
): ApplyPlanInput {
  const config = {
    ...DEFAULT_KIT_CONFIG,
    uiDir: options.uiDir ?? GUARDED_UI,
    stylesDir: options.stylesDir ?? GUARDED_STYLES,
    layoutFile: options.layoutFile ?? GUARDED_LAYOUT,
  };
  const stateDir = deriveKitPaths(config).stateDir;
  write(root, config.uiDir + "/old.svelte", "old component");
  write(root, config.uiDir + "/keep.svelte", "keep me");
  write(root, config.stylesDir + "/kit.css", "old css");
  write(root, config.layoutFile, "<main><slot /></main>\n");
  write(root, stateDir + "/kit.json", validKitConfigBytes(config));
  const original = capturedFixtureInit(root, config);
  if (options.metadataOnly) {
    const sealed = validateApplyPlan(original);
    if (!sealed.ok) throw new Error(JSON.stringify(sealed));
    const result = applyPlan(sealed.value);
    if (result.kind !== "applied") throw new Error(JSON.stringify(result));
    const lock = JSON.parse(
      readFileSync(abs(root, lockPath(stateDir)), "utf8"),
    );
    lock.registryHash = "f".repeat(64);
    write(root, lockPath(stateDir), JSON.stringify(lock, null, 2) + "\n");
    return capturedFixtureInit(root, config);
  }
  if (options.lockConfigHash !== undefined) {
    const lock = JSON.parse(Buffer.from(original.lock.bytes).toString("utf8"));
    lock.configHash = options.lockConfigHash;
    return {
      ...original,
      lock: {
        ...original.lock,
        bytes: new TextEncoder().encode(JSON.stringify(lock, null, 2) + "\n"),
      },
    };
  }
  return original;
}
