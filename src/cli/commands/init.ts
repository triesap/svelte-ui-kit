/** S081: orchestration consumes the accepted pure planner and guarded applier. */
import type { CommandRequest } from "../args.js";
import {
  createEnvelope,
  type EnvelopeChange,
  type FailureClass,
} from "../protocol.js";
import { issueDiagnostics, applyOutcomeEnvelope } from "../output.js";
import { resolveProjectRoot } from "../../project/root.js";
import { captureEnvironment } from "../../project/environment.js";
import { DEFAULT_KIT_CONFIG, deriveKitPaths } from "../../project/config.js";
import { renderDependencyInstructionsFromEvidence } from "../../project/dependency-instructions.js";
import { captureSnapshot, observedText } from "../../codegen/snapshot.js";
import { resolveEffectiveConfig } from "../../codegen/effective-config.js";
import { planInit } from "../../codegen/plan-init.js";
import { composeApplyPlan } from "../../codegen/compose.js";
import { applyPlan, validateApplyPlan } from "../../codegen/apply.js";
import { createAssetProvider } from "../../registry/assets.js";
import { loadRegistrySnapshot } from "../../registry/load.js";
import { issue, type ModelIssue } from "../../registry/errors.js";
import type { InfoResult } from "./info.js";

export function initialize(
  request: CommandRequest,
  registryRoot: string,
  invocationDir = process.cwd(),
): InfoResult {
  const failure = (
    issues: readonly ModelIssue[],
    failureClass?: FailureClass,
  ): InfoResult => ({
    envelope: createEnvelope({
      command: "init",
      status: issues.some((entry) => entry.code.includes("UNSAFE"))
        ? "error"
        : issues.some((entry) => entry.code.includes("CONFLICT"))
          ? "conflict"
          : "error",
      diagnostics: issueDiagnostics(issues),
    }),
    ...(issues.some((entry) => entry.code.includes("UNSAFE"))
      ? { failureClass: "unsafe_path" as const }
      : failureClass === undefined
        ? {}
        : { failureClass }),
  });
  const selected = resolveProjectRoot({ cwd: request.cwd, invocationDir });
  if (!selected.ok)
    return failure(
      selected.issues.map((entry) => ({
        ...entry,
        message:
          "Select one supported application package with --cwd before initialization.",
      })),
    );
  const registry = loadRegistrySnapshot(createAssetProvider(registryRoot));
  if (!registry.ok) return failure(registry.issues, "registry_failure");
  // Preflight only locates prospective paths. All semantic planning decisions
  // use the immutable snapshot's environment; discovery drift cannot fill gaps.
  const located = captureEnvironment(selected.value.root);
  if (!located.kitConfig.ok) return failure(located.kitConfig.issues);
  const supplied =
    located.kitConfig.value.kind === "custom"
      ? located.kitConfig.value.config
      : {
          ...DEFAULT_KIT_CONFIG,
          layoutFile: located.project.ok
            ? located.project.value.layoutFile
            : DEFAULT_KIT_CONFIG.layoutFile,
        };
  const paths = deriveKitPaths(supplied);
  const snapshot = captureSnapshot(selected.value.root, [
    paths.stateDir + "/kit.json",
    paths.stateDir + "/kit.lock.json",
    paths.rootExports,
    paths.kitCss,
    paths.themesCss,
    paths.appCss,
    supplied.layoutFile,
    ".gitignore",
  ]);
  if (!snapshot.ok) return failure(snapshot.issues, "unsafe_path");
  const resolved = resolveEffectiveConfig(snapshot.value, supplied);
  if (!resolved.ok) return failure(resolved.issues);
  if (resolved.value.issues.length > 0) return failure(resolved.value.issues);
  const config = {
    ...resolved.value.config,
    requested: resolved.value.observedRequested,
  };
  if (
    config.uiDir !== supplied.uiDir ||
    config.stylesDir !== supplied.stylesDir ||
    config.layoutFile !== supplied.layoutFile
  )
    return failure([
      issue(
        "INIT_DISCOVERY_CHANGED",
        "The discovered mapping changed during capture; retry without concurrent edits.",
        "kit.json",
      ),
    ]);
  const planned = planInit({
    config,
    layoutFile: config.layoutFile,
    layoutSource:
      observedText(snapshot.value.entries.get(config.layoutFile)!) ?? "",
    snapshot: snapshot.value,
    registry: registry.value,
    configHash: registry.value.root.contentHash,
  });
  if (!planned.ok) return failure(planned.issues);
  const environment = snapshot.value.environment;
  const instructions = renderDependencyInstructionsFromEvidence(
    environment.manager,
    environment.managerIssues,
    { runtime: [], peers: [] },
  );
  if (!instructions.ok) return failure(instructions.issues);
  const data = {
    dependencies: instructions.value,
    integration: { layoutFile: config.layoutFile, ...deriveKitPaths(config) },
  };
  if (planned.value.writes.length === 0)
    return {
      envelope: createEnvelope({ command: "init", status: "no_change", data }),
    };
  const composed = composeApplyPlan({
    root: snapshot.value.root,
    config,
    snapshot: snapshot.value,
    writes: planned.value.writes,
    exportAuthority: planned.value.exportAuthority,
  });
  if (!composed.ok) return failure(composed.issues);
  const validated = validateApplyPlan(composed.value);
  if (!validated.ok) return failure(validated.issues);
  const changes: EnvelopeChange[] = [
    ...validated.value.targets.map((target) => ({
      path: target.path,
      action: target.operation,
      applied: false,
    })),
    {
      path: paths.stateDir + "/kit.lock.json",
      action:
        snapshot.value.entries.get(paths.stateDir + "/kit.lock.json")?.kind ===
        "absent"
          ? "create"
          : "update",
      applied: false,
    },
  ];
  if (request.dryRun)
    return {
      envelope: createEnvelope({
        command: "init",
        status: "planned",
        changes,
        data,
      }),
    };
  const outcome = applyPlan(validated.value);
  const envelope = applyOutcomeEnvelope("init", outcome, changes);
  return {
    ...(outcome.kind === "refused" ? failure(outcome.issues) : {}),
    envelope: createEnvelope({ ...envelope, data }),
  };
}
