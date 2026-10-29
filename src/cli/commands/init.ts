import {
  generationFields,
  generationTarget,
  initializationFields,
  integrationMapping,
} from "../../project/generation-config.js";
/** S081: orchestration consumes the accepted pure planner and guarded applier. */
import { applyPlan, validateApplyPlan } from "../../codegen/apply.js";
import { composeApplyPlan } from "../../codegen/compose.js";
import { resolveEffectiveConfig } from "../../codegen/effective-config.js";
import { planInit } from "../../codegen/plan-init.js";
import { inspectUnchangedState } from "../../codegen/recovery.js";
import { captureSnapshot, observedText } from "../../codegen/snapshot.js";
import { DEFAULT_KIT_CONFIG, deriveKitPaths } from "../../project/config.js";
import { renderDependencyInstructionsFromEvidence } from "../../project/dependency-instructions.js";
import { inspectDependencyStateFromEvidence } from "../../project/dependencies.js";
import { captureEnvironment } from "../../project/environment.js";
import { generationInputPaths } from "../../project/generation-config.js";
import { resolveProjectRoot } from "../../project/root.js";
import { createAssetProvider } from "../../registry/assets.js";
import { issue, type ModelIssue } from "../../registry/errors.js";
import { loadRegistrySnapshot } from "../../registry/load.js";
import { tokenMetadataPaths } from "../../registry/theme.js";
import type { CommandRequest } from "../args.js";
import { applyOutcomeEnvelope, issueDiagnostics } from "../output.js";
import {
  createEnvelope,
  type EnvelopeChange,
  type FailureClass,
} from "../protocol.js";
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
    ...generationInputPaths(supplied),
    paths.stateDir + "/kit.json",
    paths.stateDir + "/kit.lock.json",
    ...tokenMetadataPaths(paths.stateDir),
    paths.rootExports,
    paths.kitCss,
    paths.themesCss,
    paths.appCss,
    integrationMapping(supplied).path,
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
    integrationMapping(config).path !== integrationMapping(supplied).path
  )
    return failure([
      issue(
        "INIT_DISCOVERY_CHANGED",
        "The discovered mapping changed during capture; retry without concurrent edits.",
        "kit.json",
      ),
    ]);
  const planned = planInit({
    ...initializationFields(
      config,
      observedText(
        snapshot.value.entries.get(integrationMapping(config).path)!,
      ) ?? "",
    ),
    snapshot: snapshot.value,
    registry: registry.value,
    configHash: registry.value.root.contentHash,
  });
  if (!planned.ok) return failure(planned.issues);
  const environment = snapshot.value.environment;
  const runtimeRequirement = {
    name: "svelte",
    range: registry.value.root.compatibility.svelte,
  };
  const readiness = inspectDependencyStateFromEvidence(
    {
      manifest: environment.manifest,
      nativeFiles: environment.nativeFiles,
      observe: (name) =>
        environment.installed.get(name) ??
        (environment.enumerationComplete ? { kind: "absent" } : null),
    },
    [runtimeRequirement],
  );
  if (!readiness.ok) return failure(readiness.issues);
  const diagnostics = readiness.value
    .filter((entry) => entry.status !== "ready")
    .map((entry) => ({
      code: "DEPENDENCY_NOT_READY",
      level: "warn" as const,
      message: `${entry.name}: ${entry.status}; declaration/install readiness has not been established.`,
      locator: "package.json",
      guidance:
        "Use the reported dependency instructions; generated source alone does not qualify the application runtime.",
    }));
  const instructions = renderDependencyInstructionsFromEvidence(
    environment.manager,
    environment.managerIssues,
    {
      runtime: [],
      peers: [`${runtimeRequirement.name}@${runtimeRequirement.range}`],
      target: generationTarget(config),
    },
  );
  if (!instructions.ok) return failure(instructions.issues);
  const data = {
    dependencies: instructions.value,
    dependencyState: readiness.value,
    integration: {
      ...generationFields(config),
      ...deriveKitPaths(config),
    },
  };
  if (planned.value.writes.length === 0) {
    const retained = inspectUnchangedState(
      snapshot.value.root,
      paths.stateDir,
      {
        uiDir: config.uiDir,
        stylesDir: config.stylesDir,
        ...generationFields(config),
      },
    );
    if (retained.length > 0) return failure(retained);
    return {
      envelope: createEnvelope({
        command: "init",
        status: "no_change",
        diagnostics,
        data,
      }),
    };
  }
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
        diagnostics,
        changes,
        data,
      }),
    };
  const outcome = applyPlan(validated.value);
  const envelope = applyOutcomeEnvelope("init", outcome, changes);
  return {
    ...(outcome.kind === "refused" ? failure(outcome.issues) : {}),
    envelope: createEnvelope({
      ...envelope,
      diagnostics: [...envelope.diagnostics, ...diagnostics],
      data,
    }),
  };
}
