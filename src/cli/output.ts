/** S078: pure, shared presentation for typed semantic command outcomes. */
import { canonicalJson } from "../codegen/serialize.js";
import type { ApplyOutcome } from "../codegen/apply.js";
import type { ModelIssue } from "../registry/errors.js";
import {
  createEnvelope,
  exitCodeFor,
  isSafeLocator,
  recoveryGuidance,
  renderEnvelope,
  type CommandEnvelope,
  type CommandName,
  type EnvelopeChange,
  type EnvelopeDiagnostic,
  type FailureClass,
} from "./protocol.js";

export interface CommandOutput {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
}

/** Error adapters preserve typed codes and logical locators, never raw stacks. */
export function issueDiagnostics(
  issues: readonly ModelIssue[],
  level: "error" | "warn" = "error",
): readonly EnvelopeDiagnostic[] {
  return issues.map((issue) => ({
    code: issue.code,
    level,
    message:
      issue.code === "APPLY_INTERNAL_FAILED"
        ? "The guarded batch could not complete; inspect the retained transaction evidence."
        : issue.message.replace(
            /\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b/gi,
            "transaction",
          ),
    ...(issue.locator !== undefined && isSafeLocator(issue.locator)
      ? { locator: issue.locator }
      : {}),
    guidance:
      issue.code.startsWith("RECOVERY_") || issue.code.startsWith("WRITER_")
        ? recoveryGuidance(issue.code)
        : "Resolve the reported issue before retrying; run svelte-ui-kit doctor to inspect installation consistency.",
  }));
}

/** Transient transaction IDs and raw recovery objects are not command data. */
export function applyOutcomeEnvelope(
  command: "init" | "add" | "sync",
  outcome: ApplyOutcome,
  changes: readonly EnvelopeChange[],
): CommandEnvelope {
  const committed =
    outcome.kind === "applied" || outcome.kind === "committed_needs_cleanup";
  return createEnvelope({
    command,
    status:
      outcome.kind === "refused"
        ? "error"
        : outcome.kind === "no_change"
          ? "no_change"
          : outcome.kind === "committed_needs_cleanup"
            ? "warning"
            : "success",
    diagnostics: issueDiagnostics(outcome.issues, committed ? "warn" : "error"),
    changes: committed
      ? changes.map((change) => ({ ...change, applied: true }))
      : [],
  });
}

export function issueEnvelope(
  command: CommandName,
  issues: readonly ModelIssue[],
): CommandEnvelope {
  return createEnvelope({
    command,
    status: "error",
    diagnostics: issueDiagnostics(issues),
  });
}

/** Pure output selection: exactly one JSON object or useful human channels. */
export function renderCommandOutput(
  envelope: CommandEnvelope,
  json: boolean,
  failureClass?: FailureClass,
): CommandOutput {
  const exitCode = exitCodeFor(envelope.status, failureClass);
  if (json) return { stdout: renderEnvelope(envelope), stderr: "", exitCode };
  const diagnostics = envelope.diagnostics.map(
    (diagnostic) =>
      `${diagnostic.code}: ${diagnostic.message}${diagnostic.locator === undefined ? "" : ` (${diagnostic.locator})`}${diagnostic.guidance === undefined ? "" : `\n  ${diagnostic.guidance}`}`,
  );
  if (exitCode !== 0)
    return {
      stdout: "",
      stderr: [
        `svelte-ui-kit ${envelope.command}: ${envelope.status}`,
        ...diagnostics,
        "",
      ].join("\n"),
      exitCode,
    };
  const lines = [`svelte-ui-kit ${envelope.command}: ${envelope.status}`];
  lines.push(
    ...envelope.changes.map(
      (change) =>
        `${change.applied ? "Applied" : "Planned"} ${change.action}: ${change.path}`,
    ),
  );
  if (envelope.data !== null)
    lines.push(
      typeof envelope.data === "string"
        ? envelope.data
        : canonicalJson(envelope.data).trim(),
    );
  const warnings = envelope.diagnostics.some(
    (diagnostic) => diagnostic.level === "warn",
  );
  return {
    stdout: [...lines, ...(!warnings ? diagnostics : []), ""].join("\n"),
    stderr: warnings ? [...diagnostics, ""].join("\n") : "",
    exitCode,
  };
}
