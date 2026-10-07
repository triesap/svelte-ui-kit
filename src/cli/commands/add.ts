/** One explicit add request through original projection and guarded application. */
import type { CommandRequest } from "../args.js";
import { createEnvelope, type EnvelopeChange } from "../protocol.js";
import { applyOutcomeEnvelope, issueDiagnostics } from "../output.js";
import { captureCommandContext } from "./context.js";
import { planAdd, type AddPlan } from "../../codegen/plan-add.js";
import { composeApplyPlan } from "../../codegen/compose.js";
import { validateApplyPlan, applyPlan } from "../../codegen/apply.js";
import { deriveKitPaths } from "../../project/config.js";
import { issue, type ModelIssue } from "../../registry/errors.js";
import type { InfoResult } from "./info.js";
import type { CommandContext } from "./context.js";

export function commandFailure(
  command: "add" | "sync",
  issues: readonly ModelIssue[],
): InfoResult {
  const unsafe = issues.some(
    (entry) =>
      entry.code.includes("UNSAFE") || entry.code.includes("PATH_INVALID"),
  );
  const registry = issues.some(
    (entry) =>
      entry.code.startsWith("REGISTRY_") ||
      entry.code.startsWith("ASSET_") ||
      entry.code.startsWith("SCHEMA_") ||
      entry.code.startsWith("RESOLVE_"),
  );
  return {
    envelope: createEnvelope({
      command,
      status: "error",
      diagnostics: issueDiagnostics(issues),
    }),
    ...(unsafe
      ? { failureClass: "unsafe_path" as const }
      : registry
        ? { failureClass: "registry_failure" as const }
        : {}),
  };
}
export function executeItemPlan(
  command: "add" | "sync",
  request: CommandRequest,
  context: CommandContext,
  plan: AddPlan,
): InfoResult {
  const data = {
    requested: plan.projection.requested,
    items: plan.projection.items,
    dependencies: plan.dependencyState,
    instructions: plan.dependencyInstructions,
  };
  const diagnostics = [
    ...issueDiagnostics(plan.dependencyIssues),
    ...(plan.dependencyState ?? [])
      .filter((entry) => entry.status !== "ready")
      .map((entry) => ({
        code: "DEPENDENCY_NOT_READY",
        level: "warn" as const,
        message: `${entry.name}: ${entry.status}; declaration/install readiness has not been established.`,
        locator: "package.json",
        guidance:
          "Use the reported dependency instructions; package files are never installed or edited automatically.",
      })),
    ...plan.diagnostics.map((message) => ({
      code: "PLAN_DIAGNOSTIC",
      level: plan.executable ? ("info" as const) : ("error" as const),
      message,
      guidance:
        "Inspect incoming source with view and reconcile the reported conflict before retrying.",
    })),
  ];
  if (!plan.executable)
    return {
      envelope: createEnvelope({
        command,
        status: "conflict",
        diagnostics,
        data,
      }),
    };
  if (plan.writes.length === 0)
    return {
      envelope: createEnvelope({
        command,
        status: "no_change",
        diagnostics,
        data,
      }),
    };
  const composed = composeApplyPlan({
    root: context.snapshot.root,
    config: plan.effectiveConfig,
    snapshot: context.snapshot,
    writes: plan.writes,
    exportAuthority: plan.exportAuthority,
  });
  if (!composed.ok) return commandFailure(command, composed.issues);
  const validated = validateApplyPlan(composed.value);
  if (!validated.ok) return commandFailure(command, validated.issues);
  const canonical =
    deriveKitPaths(plan.effectiveConfig).stateDir + "/kit.lock.json";
  const changes: EnvelopeChange[] = [
    ...validated.value.targets.map((target) => ({
      path: target.path,
      action: target.operation,
      applied: false,
    })),
    {
      path: canonical,
      action:
        context.snapshot.entries.get(canonical)?.kind === "absent"
          ? "create"
          : "update",
      applied: false,
    },
  ];
  if (request.dryRun)
    return {
      envelope: createEnvelope({
        command,
        status: "planned",
        diagnostics,
        changes,
        data,
      }),
    };
  const outcome = applyPlan(validated.value);
  const envelope = applyOutcomeEnvelope(command, outcome, changes);
  if (outcome.kind === "refused")
    return {
      ...commandFailure(command, outcome.issues),
      envelope: createEnvelope({ ...envelope, data }),
    };
  return {
    envelope: createEnvelope({
      ...envelope,
      status:
        envelope.status === "success" &&
        diagnostics.some((entry) => entry.level === "warn")
          ? "warning"
          : envelope.status,
      diagnostics: [...diagnostics, ...envelope.diagnostics],
      data,
    }),
  };
}
export function addItem(
  request: CommandRequest,
  registryRoot: string,
): InfoResult {
  const context = captureCommandContext(request, registryRoot);
  if (!context.ok) return commandFailure("add", context.issues);
  if (request.item === null)
    return commandFailure("add", [
      issue("CLI_USAGE_ERROR", "One explicit item is required.", "item"),
    ]);
  const planned = planAdd({
    ...context.value,
    addedRoots: [request.item],
    registryVersion: context.value.registry.root.registryVersion,
    registryHash: context.value.registry.root.contentHash,
  });
  if (!planned.ok) return commandFailure("add", planned.issues);
  return executeItemPlan("add", request, context.value, planned.value);
}
