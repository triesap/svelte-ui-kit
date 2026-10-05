import { DEFAULT_KIT_CONFIG } from "../../src/project/config.js";

/**
 * Shared valid `_kit/kit.json` bytes for guarded-plan test builders.
 *
 * A real planner-authored config write is a strict configuration document whose
 * mapping matches the declared roots. Synthetic guarded plans must carry the
 * same valid evidence, otherwise the projected-batch coherence check would (and
 * should) refuse them. These helpers keep that invariant in one place.
 */
export interface KitConfigOverrides {
  readonly uiDir?: string;
  readonly stylesDir?: string;
  readonly layoutFile?: string;
  readonly requested?: readonly string[];
}

export function validKitConfigText(overrides: KitConfigOverrides = {}): string {
  return `${JSON.stringify(
    {
      schemaVersion: 1,
      toolVersion: "0.1.0",
      registry: "builtin",
      uiDir: overrides.uiDir ?? DEFAULT_KIT_CONFIG.uiDir,
      stylesDir: overrides.stylesDir ?? DEFAULT_KIT_CONFIG.stylesDir,
      layoutFile: overrides.layoutFile ?? DEFAULT_KIT_CONFIG.layoutFile,
      requested: [...(overrides.requested ?? [])],
    },
    null,
    2,
  )}\n`;
}

export function validKitConfigBytes(
  overrides: KitConfigOverrides = {},
): Uint8Array {
  return new TextEncoder().encode(validKitConfigText(overrides));
}
