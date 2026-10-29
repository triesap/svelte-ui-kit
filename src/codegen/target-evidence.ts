import { inspectSvelteKitInputs } from "../project/sveltekit-evidence.js";
/** Immutable target intent/input evidence, separate from executable generation authority. */
import { deriveKitPaths } from "../project/config.js";
import { deepFreeze } from "../project/immutable.js";
import { inspectAstroConfig } from "../project/astro-config.js";
import { isSafeLogicalRelativePath } from "../project/paths.js";
import { inspectSvelteConfigSource } from "../project/svelte-config.js";
import { validRange } from "semver";
import {
  integrationFor,
  parseTargetConfig,
  type TargetConfig,
  type TargetIntegration,
} from "../project/target-config.js";
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import {
  captureSnapshot,
  decodeObservedText,
  type ProjectSnapshot,
} from "./snapshot.js";

export {
  ASTRO_CONFIG_FILES,
  TARGET_CONFIG_FILES,
} from "../project/target-config.js";
import {
  ASTRO_CONFIG_FILES,
  TARGET_CONFIG_FILES,
} from "../project/target-config.js";
export interface TargetEvidence {
  readonly config: TargetConfig;
  readonly snapshot: ProjectSnapshot;
  readonly integration: TargetIntegration;
  readonly packageName: string | null;
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function objectText(
  snapshot: ProjectSnapshot,
  file: string,
): ModelResult<Record<string, unknown>> {
  const entry = snapshot.entries.get(file);
  if (entry) {
    const decoded = decodeObservedText(entry);
    if (decoded.kind === "text") {
      try {
        const value: unknown = JSON.parse(decoded.text);
        if (record(value)) return ok(value);
      } catch {
        /* typed refusal below */
      }
    }
  }
  return fail([
    issue(
      "TARGET_INPUT_INVALID",
      "Target input must be a regular UTF-8 JSON object",
      file,
    ),
  ]);
}

/** Every decision is derived from exact captured input bytes, including candidate absence. */
export function captureTargetEvidence(
  root: string,
  input: unknown,
): ModelResult<TargetEvidence> {
  const parsed = parseTargetConfig(input);
  if (!parsed.ok) return parsed;
  const config = parsed.value;
  const configPath = `${deriveKitPaths(config).stateDir}/kit.json`;
  const captured = captureSnapshot(root, [
    "package.json",
    ...TARGET_CONFIG_FILES,
    configPath,
  ]);
  if (!captured.ok) return captured;
  return inspectTargetEvidence(captured.value, input);
}

/** Inspect only original immutable observations; never recapture inside planners. */
export function inspectTargetEvidence(
  snapshot: ProjectSnapshot,
  input: unknown,
): ModelResult<TargetEvidence> {
  const parsed = parseTargetConfig(input);
  if (!parsed.ok) return parsed;
  const config = parsed.value;
  const configPath = `${deriveKitPaths(config).stateDir}/kit.json`;
  for (const file of ["package.json", ...TARGET_CONFIG_FILES, configPath])
    if (!snapshot.entries.has(file))
      return fail([
        issue(
          "TARGET_INPUT_INCOMPLETE",
          "Capture all target package/config candidates before planning",
          file,
        ),
      ]);
  if (snapshot.environment.catalogIssues.length)
    return fail(snapshot.environment.catalogIssues);
  const manifest = objectText(snapshot, "package.json");
  if (!manifest.ok) return manifest;
  const normalized = snapshot.environment.manifest;
  const physical = snapshot.environment.evidence.find(
    (entry) => entry.path === "package.json",
  );
  const raw = snapshot.entries.get("package.json")!;
  if (
    normalized.kind !== "value" ||
    physical?.kind !== "file" ||
    physical.digest !== raw.hash ||
    physical.mode !== raw.mode
  )
    return fail([
      issue(
        "TARGET_INPUT_CHANGED",
        "Target manifest changed during original capture; retry",
        "package.json",
      ),
    ]);
  const projected = { ...manifest.value };
  for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
    const declared = manifest.value[field],
      resolved = normalized.value[field];
    if (!record(declared)) continue;
    if (
      Object.entries(declared).some(
        ([name, value]) =>
          typeof value === "string" &&
          value.startsWith("catalog:") &&
          (!snapshot.environment.catalogDigest ||
            !record(resolved) ||
            typeof resolved[name] !== "string" ||
            (resolved[name] as string).startsWith("catalog:")),
      )
    )
      return fail([
        issue(
          "TARGET_INPUT_CHANGED",
          "Catalog declarations require complete authenticated normalized evidence",
          "package.json",
        ),
      ]);
    projected[field] = Object.fromEntries(
      Object.entries(declared).map(([name, value]) => [
        name,
        typeof value === "string" &&
        value.startsWith("catalog:") &&
        record(resolved)
          ? resolved[name]
          : value,
      ]),
    );
  }
  if (JSON.stringify(projected) !== JSON.stringify(normalized.value))
    return fail([
      issue(
        "TARGET_INPUT_CHANGED",
        "Captured target declarations disagree with captured normalized catalog evidence",
        "package.json",
      ),
    ]);
  const normalizedManifest = normalized.value;
  const has = (name: string) =>
    ["dependencies", "devDependencies", "peerDependencies"].some((field) => {
      const declarations = manifest.value[field];
      return (
        record(declarations) &&
        typeof declarations[name] === "string" &&
        (declarations[name] as string).length > 0
      );
    });
  const invalid = (reason: string, file = "package.json") =>
    fail([issue("PROJECT_TARGET_INVALID", reason, file)]);
  const configs = TARGET_CONFIG_FILES.filter(
    (file) => snapshot.entries.get(file)?.kind !== "absent",
  );
  if (configs.some((file) => snapshot.entries.get(file)?.kind !== "file"))
    return invalid(
      "Target configuration candidates must be regular files",
      configs[0],
    );
  if (has("astro") && has("@sveltejs/kit"))
    return invalid(
      "Conflicting application frameworks require one selected package target",
    );
  if (!has("svelte")) return invalid("The selected target must declare Svelte");
  if (config.target === "astro") {
    if (configs.includes("astro.config.cjs"))
      return invalid(
        "Astro does not discover astro.config.cjs; use a supported default configuration filename",
        "astro.config.cjs",
      );
    if (!has("astro") || !has("@astrojs/svelte") || has("@sveltejs/kit"))
      return invalid(
        "Astro requires actual astro and @astrojs/svelte declarations",
      );
    const candidates = configs.filter((file) =>
      (ASTRO_CONFIG_FILES as readonly string[]).includes(file),
    );
    if (candidates.length !== 1)
      return invalid(
        "Keep exactly one statically supported Astro configuration",
      );
    const text = decodeObservedText(snapshot.entries.get(candidates[0])!);
    if (text.kind !== "text")
      return invalid("Astro configuration must be valid UTF-8", candidates[0]);
    const inspected = inspectAstroConfig(text.text, candidates[0]);
    if (!inspected.ok) return inspected;
  } else if (config.target === "sveltekit") {
    const framework = inspectSvelteKitInputs({
      manifest: normalizedManifest,
      installed: snapshot.environment.installed.get("@sveltejs/kit"),
      configuration: snapshot.environment.configuration,
    });
    if (!framework.ok) return framework;
    if (!has("@sveltejs/kit") || has("astro"))
      return invalid("SvelteKit requires its actual framework declaration");
    if (configs.filter((file) => file.startsWith("svelte.config.")).length > 1)
      return invalid("Keep exactly one Svelte configuration");
    for (const file of configs.filter((file) =>
      file.startsWith("svelte.config."),
    )) {
      const text = decodeObservedText(snapshot.entries.get(file)!);
      if (
        text.kind !== "text" ||
        inspectSvelteConfigSource(file, text.text).kind !== "static"
      )
        return invalid("Svelte mapping cannot be proven statically", file);
    }
  } else {
    if (
      typeof manifest.value.name !== "string" ||
      manifest.value.name.length === 0 ||
      manifest.value.type !== "module"
    )
      return invalid(
        "A standalone library requires an explicit package name and type: module",
      );
    if (has("astro") || has("@sveltejs/kit") || has("@astrojs/svelte"))
      return invalid(
        "A standalone library must not declare an application framework",
      );
    const peers = normalizedManifest.peerDependencies;
    const exports = manifest.value.exports;
    const main = record(exports) ? exports["."] : null;
    if (
      !record(peers) ||
      typeof peers.svelte !== "string" ||
      peers.svelte.trim().length === 0 ||
      validRange(peers.svelte) === null ||
      !record(main) ||
      typeof main.svelte !== "string" ||
      typeof main.types !== "string"
    )
      return invalid(
        "A library requires a Svelte peer plus actual typed Svelte-condition package exports",
      );
    for (const key of ["svelte", "types", "default"]) {
      const value = main[key];
      if (
        value !== undefined &&
        (typeof value !== "string" ||
          !value.startsWith("./") ||
          !isSafeLogicalRelativePath(value.slice(2)))
      )
        return invalid(
          "Library package entries must be safe package-relative export paths",
        );
    }
    if (
      (manifest.value.svelte !== undefined &&
        manifest.value.svelte !== main.svelte) ||
      (manifest.value.types !== undefined &&
        manifest.value.types !== main.types) ||
      (main.default !== undefined && main.default !== main.svelte)
    )
      return invalid(
        "Contradictory library source/type/export entries are unsupported",
      );
    if (
      !record(exports) ||
      Object.keys(exports).some(
        (key) =>
          key !== "." &&
          (!key.startsWith("./") || !isSafeLogicalRelativePath(key.slice(2))),
      )
    )
      return invalid(
        "Library exports must use literal safe package subpaths without mixed condition keys",
      );
    if (
      !Object.entries(exports).some(
        ([key, value]) =>
          key.startsWith("./") && value === `./${config.styleEntry}`,
      )
    )
      return invalid(
        "A library must explicitly export its configured stylesheet entry",
      );
  }
  const observedConfig = snapshot.entries.get(configPath)!;
  if (observedConfig.kind !== "absent") {
    const actual = objectText(snapshot, configPath);
    if (!actual.ok) return actual;
    const normalized = parseTargetConfig(actual.value, configPath);
    if (!normalized.ok) return normalized;
    if (JSON.stringify(normalized.value) !== JSON.stringify(config))
      return invalid(
        "Configured target differs from captured target intent",
        configPath,
      );
  }
  return ok(
    deepFreeze({
      config,
      snapshot,
      integration: integrationFor(config),
      packageName:
        typeof manifest.value.name === "string" ? manifest.value.name : null,
    }),
  );
}
