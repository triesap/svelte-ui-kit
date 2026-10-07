import { projectRequests } from "../../registry/projection.js";
import { tokenMetadataPaths } from "../../registry/theme.js";
/** Capture complete command planning authority; never fill snapshot gaps live. */
import path from "node:path";
import type { CommandRequest } from "../args.js";
import { resolveProjectRoot } from "../../project/root.js";
import { captureEnvironment } from "../../project/environment.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
  type KitConfig,
} from "../../project/config.js";
import { readJsonObject } from "../../project/io.js";
import {
  captureSnapshot,
  decodeObservedText,
  type ProjectSnapshot,
} from "../../codegen/snapshot.js";
import { resolveEffectiveConfig } from "../../codegen/effective-config.js";
import { parseKitLock, type KitLock } from "../../codegen/lock.js";
import { createAssetProvider } from "../../registry/assets.js";
import {
  loadRegistrySnapshot,
  type RegistrySnapshot,
} from "../../registry/load.js";
import { fail, issue, ok, type ModelResult } from "../../registry/errors.js";

export interface CommandContext {
  readonly registry: RegistrySnapshot;
  readonly snapshot: ProjectSnapshot;
  readonly config: KitConfig;
  readonly lock: KitLock | null;
}
export function captureCommandContext(
  request: CommandRequest,
  registryRoot: string,
  invocationDir = process.cwd(),
): ModelResult<CommandContext> {
  const selected = resolveProjectRoot({ cwd: request.cwd, invocationDir });
  if (!selected.ok)
    return fail(
      selected.issues.map((entry) => ({
        ...entry,
        message:
          "Select one supported application package with --cwd before planning.",
      })),
    );
  const registry = loadRegistrySnapshot(createAssetProvider(registryRoot));
  if (!registry.ok) return registry;
  const preliminary = captureEnvironment(selected.value.root);
  if (!preliminary.kitConfig.ok) return preliminary.kitConfig;
  const config =
    preliminary.kitConfig.value.kind === "custom"
      ? preliminary.kitConfig.value.config
      : {
          ...DEFAULT_KIT_CONFIG,
          layoutFile: preliminary.project.ok
            ? preliminary.project.value.layoutFile
            : DEFAULT_KIT_CONFIG.layoutFile,
        };
  const derived = deriveKitPaths(config),
    lockPath = derived.stateDir + "/kit.lock.json";
  const mapping = {
    stateDir: derived.stateDir,
    uiDir: config.uiDir,
    stylesDir: config.stylesDir,
    layoutFile: config.layoutFile,
  };
  const preliminaryLock = readJsonObject(
    path.join(selected.value.root, lockPath),
  );
  let old: KitLock | null = null;
  if (preliminaryLock.kind === "value") {
    const parsed = parseKitLock(preliminaryLock.value, lockPath, mapping);
    if (!parsed.ok) return parsed;
    old = parsed.value;
  } else if (preliminaryLock.kind !== "absent")
    return fail([
      issue(
        "COMMAND_LOCK_UNSAFE",
        "The installed lock cannot be read as regular valid metadata.",
        lockPath,
      ),
    ]);
  const paths = new Set([
    derived.stateDir + "/kit.json",
    lockPath,
    derived.rootExports,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    config.layoutFile,
    ".gitignore",
  ]);
  const closure = projectRequests(
    registry.value,
    request.command === "add" && request.item !== null
      ? [...config.requested, request.item]
      : config.requested,
  );
  if (!closure.ok) return closure;
  for (const item of registry.value.items.filter((entry) =>
    closure.value.order.includes(entry.id),
  )) {
    if (item.contracts !== undefined)
      for (const metadataPath of tokenMetadataPaths(derived.stateDir))
        paths.add(metadataPath);
    for (const file of item.files)
      paths.add(
        file.blockId === null
          ? `${config.uiDir}/${file.target}`
          : `${config.stylesDir}/${file.target}`,
      );
  }
  for (const file of old?.files ?? []) paths.add(file.path);
  for (const file of old?.cssBlocks ?? []) paths.add(file.path);
  for (const file of old?.integrations ?? []) paths.add(file.path);
  const snapshot = captureSnapshot(selected.value.root, [...paths]);
  if (!snapshot.ok) return snapshot;
  const effective = resolveEffectiveConfig(snapshot.value, config);
  if (!effective.ok) return effective;
  if (effective.value.issues.length > 0) return fail(effective.value.issues);
  const capturedConfig = {
    ...effective.value.config,
    requested: effective.value.observedRequested,
  };
  if (
    capturedConfig.uiDir !== config.uiDir ||
    capturedConfig.stylesDir !== config.stylesDir ||
    capturedConfig.layoutFile !== config.layoutFile
  )
    return fail([
      issue(
        "COMMAND_MAPPING_CHANGED",
        "The mapping changed during capture; retry without concurrent edits.",
        "kit.json",
      ),
    ]);
  const decoded = decodeObservedText(snapshot.value.entries.get(lockPath)!);
  let lock: KitLock | null = null;
  if (decoded.kind === "text") {
    let value: unknown;
    try {
      value = JSON.parse(decoded.text);
    } catch {
      return fail([
        issue(
          "COMMAND_LOCK_INVALID",
          "The captured installed lock is not valid JSON.",
          lockPath,
        ),
      ]);
    }
    const parsed = parseKitLock(value, lockPath, mapping);
    if (!parsed.ok) return parsed;
    lock = parsed.value;
  } else if (snapshot.value.entries.get(lockPath)?.kind !== "absent")
    return fail([
      issue(
        "COMMAND_LOCK_UNSAFE",
        "The captured lock is not regular valid UTF-8 metadata.",
        lockPath,
      ),
    ]);
  // A changed old inventory needs a fresh invocation, not a live recapture.
  for (const file of [
    ...(lock?.files ?? []),
    ...(lock?.cssBlocks ?? []),
    ...(lock?.integrations ?? []),
  ])
    if (!snapshot.value.entries.has(file.path))
      return fail([
        issue(
          "COMMAND_LOCK_CHANGED",
          "The installed inventory changed during capture; retry without concurrent edits.",
          lockPath,
        ),
      ]);
  return ok({
    registry: registry.value,
    snapshot: snapshot.value,
    config: capturedConfig,
    lock,
  });
}
