/** Closed physical roles at planning/recovery boundaries; intent remains authoritative. */
import type { TargetIntegration } from "./target-config.js";
export interface ApplicationIntegrationFields {
  readonly layoutFile: string;
  readonly styleEntry?: never;
  readonly configSchema?: 2;
  readonly target?: "sveltekit" | "astro";
}
export interface LibraryIntegrationFields {
  readonly configSchema: 2;
  readonly target: "svelte-library";
  readonly styleEntry: string;
  readonly layoutFile?: never;
}
export type IntegrationFields =
  ApplicationIntegrationFields | LibraryIntegrationFields;
/** Only select a role; callers must validate original intent before granting authority. */
export function mappedIntegration(
  fields: Partial<IntegrationFields>,
): TargetIntegration {
  return fields.target === "svelte-library"
    ? {
        kind: "stylesheet-entry",
        path: typeof fields.styleEntry === "string" ? fields.styleEntry : "",
        contract: "library-styles-v1",
      }
    : {
        kind: "layout",
        path: typeof fields.layoutFile === "string" ? fields.layoutFile : "",
        contract: fields.target === "astro" ? "astro-layout-v1" : "layout-v1",
      };
}
export function copyIntegrationFields(
  fields: ApplicationIntegrationFields,
): ApplicationIntegrationFields;
export function copyIntegrationFields(
  fields: LibraryIntegrationFields,
): LibraryIntegrationFields;
export function copyIntegrationFields(
  fields: IntegrationFields,
): IntegrationFields;
export function copyIntegrationFields(
  fields: IntegrationFields,
): IntegrationFields {
  return fields.target === "svelte-library"
    ? {
        configSchema: 2,
        target: "svelte-library",
        styleEntry: fields.styleEntry,
      }
    : {
        ...(fields.configSchema === 2
          ? { configSchema: 2 as const, target: fields.target }
          : {}),
        layoutFile: fields.layoutFile,
      };
}
