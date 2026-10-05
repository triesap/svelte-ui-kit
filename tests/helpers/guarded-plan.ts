import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { captureReadset } from "../../src/codegen/authority.js";
import type { ApplyPlanInput, ApplyTarget } from "../../src/codegen/apply.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { capturePreimage } from "../../src/codegen/revalidate.js";
import { lockPath } from "../../src/codegen/transaction-types.js";
import { validKitConfigBytes } from "./kit-config.js";

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

export function write(root: string, logical: string, text: string): void {
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
  const uiDir = options.uiDir ?? GUARDED_UI;
  const stylesDir = options.stylesDir ?? GUARDED_STYLES;
  const layoutFile = options.layoutFile ?? GUARDED_LAYOUT;
  const stateDir = `${uiDir}/_kit`;

  write(root, `${uiDir}/old.svelte`, "old component");
  write(root, `${uiDir}/keep.svelte`, "keep me");
  write(root, `${stylesDir}/kit.css`, "old css");
  write(root, layoutFile, "<script>old layout</script>");
  write(root, `${uiDir}/_kit/kit.json`, "old config");

  const configBytes = validKitConfigBytes({ uiDir, stylesDir, layoutFile });

  const targets: ApplyTarget[] = options.metadataOnly
    ? []
    : [
        {
          path: `${uiDir}/_kit/kit.json`,
          operation: "update",
          bytes: configBytes,
          mode: 0o644,
          preimage: capturePreimage(root, `${uiDir}/_kit/kit.json`),
        },
        {
          path: `${uiDir}/button.svelte`,
          operation: "create",
          bytes: new TextEncoder().encode("<button />\n"),
          mode: 0o644,
          preimage: capturePreimage(root, `${uiDir}/button.svelte`),
        },
        {
          path: `${stylesDir}/kit.css`,
          operation: "update",
          bytes: new TextEncoder().encode("new css\n"),
          mode: 0o644,
          preimage: capturePreimage(root, `${stylesDir}/kit.css`),
        },
        {
          path: layoutFile,
          operation: "update",
          bytes: new TextEncoder().encode("<script>new layout</script>\n"),
          mode: 0o644,
          preimage: capturePreimage(root, layoutFile),
        },
      ];

  const readset = captureReadset(
    root,
    [...targets.map((target) => target.path), lockPath(stateDir)],
    [`${uiDir}/_kit/kit.json`],
  );
  if (!readset.ok) throw new Error("readset capture failed");

  return {
    root,
    stateDir,
    uiDir,
    stylesDir,
    layoutFile,
    rootIdentity: "a".repeat(64),
    planDigest: "b".repeat(64),
    readset: readset.value,
    targets,
    lock: {
      bytes: lockJson(options.lockConfigHash ?? sha256Hex(configBytes)),
      preimage: capturePreimage(root, lockPath(stateDir)),
    },
  };
}
