import {
  inspectLibraryStyles,
  materializeLibraryStyles,
  patchLibraryStyles,
} from "./library-styles.js";
/** Target-specific structure; shared planners never guess another framework. */
import type { TargetKind } from "../project/target-config.js";
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import {
  inspectAstroLayout,
  materializeAstroLayout,
  patchAstroLayout,
} from "./astro.js";
import { parseSvelteLayout } from "./svelte-parse.js";
import {
  materializePassthroughLayout,
  patchLayoutImports,
  type LayoutImport,
} from "./svelte.js";

export interface IntegrationStructure {
  readonly imports: readonly string[];
  readonly rendersContent: boolean;
}
export interface TargetIntegrationAdapter {
  readonly target: "sveltekit" | "astro";
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

export interface LibraryIntegrationAdapter extends Omit<
  TargetIntegrationAdapter,
  "target" | "inspect"
> {
  readonly target: "svelte-library";
  inspect(source: string): ModelResult<{ readonly imports: readonly string[] }>;
}
export type ExecutableIntegrationAdapter =
  TargetIntegrationAdapter | LibraryIntegrationAdapter;
export const libraryIntegration: LibraryIntegrationAdapter = Object.freeze({
  target: "svelte-library",
  contract: "library-styles-v1",
  materialize: materializeLibraryStyles,
  patch: patchLibraryStyles,
  inspect: inspectLibraryStyles,
});
export function targetIntegrationAdapter(
  target: "sveltekit" | "astro",
): ModelResult<TargetIntegrationAdapter>;
export function targetIntegrationAdapter(
  target: "svelte-library",
): ModelResult<LibraryIntegrationAdapter>;
export function targetIntegrationAdapter(
  target: TargetKind,
): ModelResult<ExecutableIntegrationAdapter>;
export function targetIntegrationAdapter(
  target: TargetKind,
): ModelResult<ExecutableIntegrationAdapter> {
  if (target === "sveltekit") return ok(svelteKitIntegration);
  if (target === "astro") return ok(astroIntegration);
  if (target === "svelte-library") return ok(libraryIntegration);
  return fail([
    issue(
      "TARGET_UNSUPPORTED",
      "Select a supported explicit target",
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
