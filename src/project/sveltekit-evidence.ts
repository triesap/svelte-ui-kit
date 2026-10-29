import { inspectNativeSvelteConfigSource } from "./svelte-config.js";
/** Stable Kit2 identity and literal Vite proof, derived only from captured inputs. */
import {
  valid,
  validRange,
  subset,
  satisfies,
  prerelease,
  minVersion,
} from "semver";
import type { InstalledObservation } from "./dependencies.js";
import {
  CONFIGURATION_FILES,
  type ConfigurationInput,
} from "./configuration-inputs.js";
import {
  VITE_CONFIG_FILES,
  inspectSvelteKitViteConfig,
} from "./sveltekit-vite-config.js";
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
export interface SvelteKitCapturedInputs {
  readonly manifest: Record<string, unknown>;
  readonly configuration: readonly ConfigurationInput[];
  readonly installed: InstalledObservation | undefined;
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function validateConfigurationInventory(
  configuration: readonly ConfigurationInput[],
): ModelResult<null> {
  if (
    !Array.isArray(configuration) ||
    configuration.length !== CONFIGURATION_FILES.length ||
    CONFIGURATION_FILES.some(
      (name) =>
        configuration.filter((entry) => entry?.path === name).length !== 1,
    )
  )
    return fail([
      issue(
        "PROJECT_CONFIGURATION_INCOMPLETE",
        "Capture exactly one physical observation for every framework configuration candidate",
      ),
    ]);
  return ok(null);
}
export function inspectSvelteKitInputs(
  input: SvelteKitCapturedInputs,
): ModelResult<null> {
  const refuse = (
    reason: string,
    file = "package.json",
    code = "PROJECT_SVELTEKIT_VERSION_UNSUPPORTED",
  ) => fail([issue(code, reason, file)]);
  const inventory = validateConfigurationInventory(input.configuration);
  if (!inventory.ok) return inventory;
  const ranges = [
    "dependencies",
    "devDependencies",
    "peerDependencies",
  ].flatMap((field) => {
    const entries = input.manifest[field];
    return record(entries) && Object.hasOwn(entries, "@sveltejs/kit")
      ? [entries["@sveltejs/kit"]]
      : [];
  });
  if (
    !ranges.length ||
    ranges.some(
      (value) =>
        typeof value !== "string" ||
        !validRange(value) ||
        !minVersion(value) ||
        prerelease(minVersion(value)!) !== null ||
        !subset(value, ">=2.0.0 <3.0.0"),
    )
  )
    return refuse(
      "Declare a supported stable SvelteKit2-only range; Kit3 requires a separate configuration migration",
    );
  const installed = input.installed;
  if (installed === undefined)
    return refuse(
      "Capture installed Kit metadata or explicit absence",
      "node_modules/@sveltejs/kit/package.json",
      "PROJECT_SVELTEKIT_INPUT_INCOMPLETE",
    );
  const ignored = input.configuration.find(
    (entry) =>
      ["svelte.config.mjs", "svelte.config.cjs"].includes(entry.path) &&
      entry.kind !== "absent",
  );
  if (ignored)
    return refuse(
      "Kit2 discovers only svelte.config.js and svelte.config.ts; the configured file would be ignored",
      ignored.path,
      "PROJECT_SVELTEKIT_FILENAME_UNSUPPORTED",
    );
  if (
    installed &&
    installed.kind !== "absent" &&
    (installed.kind !== "value" ||
      !valid(installed.version) ||
      prerelease(installed.version) !== null ||
      !satisfies(installed.version, ">=2.0.0 <3.0.0") ||
      ranges.some((range) => !satisfies(installed.version, range as string)))
  )
    return refuse(
      "Installed SvelteKit metadata must independently match the declared stable Kit2 range",
      "node_modules/@sveltejs/kit/package.json",
    );
  const supportsFeature = (floor: string): boolean =>
    installed.kind === "value"
      ? satisfies(installed.version, `>=${floor} <3.0.0`)
      : ranges.every((range) => subset(range as string, `>=${floor} <3.0.0`));
  for (const config of input.configuration.filter(
    (entry) =>
      ["svelte.config.js", "svelte.config.ts"].includes(entry.path) &&
      entry.kind === "file",
  )) {
    if (config.kind !== "file") continue;
    if (config.path.endsWith(".ts") && !supportsFeature("2.23.0"))
      return refuse(
        "TypeScript Svelte configuration requires captured Kit>=2.23.0 or wholly compatible absent-install declarations",
        config.path,
        "PROJECT_SVELTEKIT_FEATURE_UNSUPPORTED",
      );
    const native = inspectNativeSvelteConfigSource(config.path, config.source);
    if (
      native.minimumKitVersion !== undefined &&
      !supportsFeature(native.minimumKitVersion)
    )
      return refuse(
        "files.src mapping requires captured Kit>=2.29.0 or wholly compatible absent-install declarations",
        config.path,
        "PROJECT_SVELTEKIT_FEATURE_UNSUPPORTED",
      );
    if (native.kind === "unsupported" && native.nativeBoundary)
      return refuse(
        native.reason,
        config.path,
        native.nativeBoundary === "prototype"
          ? "PROJECT_SVELTEKIT_PROTOTYPE_UNSUPPORTED"
          : "PROJECT_SVELTEKIT_EXTENSIONS_UNSUPPORTED",
      );
  }
  const present = input.configuration.filter(
    (entry) =>
      (VITE_CONFIG_FILES as readonly string[]).includes(entry.path) &&
      entry.kind !== "absent",
  );
  if (present.length > 1)
    return refuse(
      "Keep exactly one supported Vite configuration",
      present[0].path,
      "PROJECT_SVELTEKIT_VITE_UNSUPPORTED",
    );
  if (!present.length) return ok(null); // Unbuilt preparation, with all candidate absences bound.
  const entry = present[0];
  if (entry.kind !== "file" || /\.(cjs|cts)$/.test(entry.path))
    return refuse(
      "Vite configuration must be regular bounded UTF-8 ESM source",
      entry.path,
      "PROJECT_SVELTEKIT_VITE_UNSUPPORTED",
    );
  return inspectSvelteKitViteConfig(entry.source, entry.path);
}
