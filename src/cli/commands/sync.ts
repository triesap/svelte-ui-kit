/** Customization-aware synchronization consumes the accepted full planner. */
import type { CommandRequest } from "../args.js";
import { createEnvelope } from "../protocol.js";
import { captureCommandContext } from "./context.js";
import { commandFailure, executeItemPlan } from "./add.js";
import { planSync } from "../../codegen/plan-sync.js";
import type { InfoResult } from "./info.js";
export function synchronize(
  request: CommandRequest,
  registryRoot: string,
): InfoResult {
  const context = captureCommandContext(request, registryRoot);
  if (!context.ok) return commandFailure("sync", context.issues);
  const plan = planSync({
    ...context.value,
    registryVersion: context.value.registry.root.registryVersion,
    registryHash: context.value.registry.root.contentHash,
  });
  if (!plan.ok) return commandFailure("sync", plan.issues);
  const result = executeItemPlan("sync", request, context.value, plan.value);
  const retained = [
    ...plan.value.retirement,
    ...plan.value.cssRetirement,
  ].filter(
    (entry) =>
      entry.action === "retain" && entry.reason.startsWith("customized"),
  );
  const retainedWarnings = retained.map((entry) => ({
    code: "RETIRED_CUSTOMIZATION_PRESERVED",
    level: "warn" as const,
    message: `Retired customized content at ${entry.path} follows the preserve-and-detach retirement policy.`,
    locator: entry.path,
    guidance:
      "Review application imports and preserved content manually; sync never rewrites application callsites.",
  }));
  const retiredSource = plan.value.retirement.find(
    (entry) => entry.detachOwnership,
  );
  const importWarnings = retiredSource
    ? [
        {
          code: "RETIRED_IMPORTS_REVIEW_REQUIRED",
          level: "warn" as const,
          message:
            "Retiring generated source can leave application imports pointing at removed or detached files.",
          locator: retiredSource.path,
          guidance:
            "Review application imports of retired components manually; sync never rewrites application callsites.",
        },
      ]
    : [];
  const warnings = [...retainedWarnings, ...importWarnings];
  return {
    ...result,
    envelope: createEnvelope({
      ...result.envelope,
      status:
        result.envelope.status === "success" && warnings.length > 0
          ? "warning"
          : result.envelope.status,
      diagnostics: [...result.envelope.diagnostics, ...warnings],
      data: {
        ...((result.envelope.data as object | null) ?? {}),
        retirement: plan.value.retirement,
        cssRetirement: plan.value.cssRetirement,
      },
    }),
  };
}
