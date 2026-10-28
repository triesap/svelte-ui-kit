/** Target-specific structure; shared planners never guess another framework. */
import type { TargetKind } from "../project/target-config.js";
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import {
  materializePassthroughLayout,
  patchLayoutImports,
  type LayoutImport,
} from "./svelte.js";
import { parseSvelteLayout } from "./svelte-parse.js";
import {
  inspectAstroLayout,
  materializeAstroLayout,
  patchAstroLayout,
} from "./astro.js";

export interface IntegrationStructure {
  readonly imports: readonly string[];
  readonly rendersContent: boolean;
}
export interface TargetIntegrationAdapter {
  readonly target: TargetKind;
  readonly contract: string;
  materialize(imports: readonly LayoutImport[]): string;
  patch(source: string, imports: readonly LayoutImport[]): ModelResult<string>;
  inspect(source: string): ModelResult<IntegrationStructure>;
}

export const svelteKitIntegration: TargetIntegrationAdapter = Object.freeze({
  target: "sveltekit",
  contract: "layout-v1",
  materialize: materializePassthroughLayout,
  patch: patchLayoutImports,
  inspect(source: string): ModelResult<IntegrationStructure> {
    const parsed = parseSvelteLayout(source);
    return parsed.ok
      ? ok({
          imports: parsed.value.instanceImports,
          rendersContent: parsed.value.rendersChildren,
        })
      : parsed;
  },
});

/** A validated target is not yet permission to generate an unimplemented integration. */
export function targetIntegrationAdapter(
  target: TargetKind,
): ModelResult<TargetIntegrationAdapter> {
  if (target === "sveltekit") return ok(svelteKitIntegration);
  if (target === "astro") return ok(astroIntegration);
  return fail([
    issue(
      "TARGET_GENERATION_UNAVAILABLE",
      `${target} target discovery is available; its generator is not enabled in this version.`,
      "kit.json",
    ),
  ]);
}

export const astroIntegration: TargetIntegrationAdapter = Object.freeze({
  target: "astro",
  contract: "astro-layout-v1",
  materialize: materializeAstroLayout,
  patch: patchAstroLayout,
  inspect(source: string): ModelResult<IntegrationStructure> {
    const parsed = inspectAstroLayout(source);
    return parsed.ok
      ? ok({
          imports: parsed.value.imports,
          rendersContent: parsed.value.rendersContent,
        })
      : parsed;
  },
});
