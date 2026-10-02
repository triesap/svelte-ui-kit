/**
 * CLI result protocol (S022).
 *
 * One JSON invocation emits exactly one envelope. `schemaVersion` is the
 * independent protocol version (`INITIAL_PROTOCOL_VERSION`), never the package
 * or framework version. Diagnostics carry stable machine codes, a level, a
 * human message, an optional *logical* locator and actionable guidance; unsafe
 * physical input (absolute/drive/UNC/traversal) is never echoed as a locator.
 *
 * The exit map is frozen here with the most specific causal class winning:
 *
 * | status/cause                     | exit |
 * | -------------------------------- | ---- |
 * | success / planned / no_change    | 0    |
 * | non-strict warning               | 0    |
 * | ordinary error                   | 1    |
 * | usage / unsupported              | 2    |
 * | strict doctor broken/unsafe      | 3    |
 * | conflict                         | 10   |
 * | unsafe path                      | 11   |
 * | registry failure                 | 12   |
 */
import { canonicalJson } from "../codegen/serialize.js";
import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "../registry/errors.js";
import {
  validateWithSchema,
  type SchemaAuthority,
} from "../registry/schema.js";
import { INITIAL_PROTOCOL_VERSION } from "../registry/versions.js";

/** Schema document that owns the envelope shape. */
export const COMMAND_ENVELOPE_SCHEMA = "command-envelope.schema.json";

export const PROTOCOL_VERSION = INITIAL_PROTOCOL_VERSION;

export type CommandName =
  "info" | "init" | "view" | "add" | "sync" | "doctor" | "help" | "version";

export type ResultStatus =
  | "success"
  | "planned"
  | "no_change"
  | "warning"
  | "conflict"
  | "error"
  | "unsupported";

export type DiagnosticLevel = "info" | "warn" | "error";
export type ChangeAction = "create" | "update" | "retire";

/** The more specific cause behind an ordinary `error` status. */
export type FailureClass =
  "usage" | "strict_doctor" | "unsafe_path" | "registry_failure";

export interface EnvelopeDiagnostic {
  readonly code: string;
  readonly level: DiagnosticLevel;
  readonly message: string;
  readonly locator?: string;
  readonly guidance?: string;
}

export interface EnvelopeChange {
  readonly action: ChangeAction;
  readonly path: string;
  readonly applied: boolean;
}

export interface CommandEnvelope {
  readonly schemaVersion: number;
  readonly command: CommandName;
  readonly status: ResultStatus;
  readonly diagnostics: readonly EnvelopeDiagnostic[];
  readonly changes: readonly EnvelopeChange[];
  readonly data: unknown;
}

/** Base exit outcome per result status. */
export const STATUS_EXITS: Readonly<Record<ResultStatus, number>> = {
  success: 0,
  planned: 0,
  no_change: 0,
  warning: 0,
  error: 1,
  unsupported: 2,
  conflict: 10,
};

/** More specific exit outcomes for an `error` caused by a known class. */
export const FAILURE_CLASS_EXITS: Readonly<Record<FailureClass, number>> = {
  usage: 2,
  strict_doctor: 3,
  unsafe_path: 11,
  registry_failure: 12,
};

/** True for statuses that succeed without a strict-doctor failure. */
export function isSuccessStatus(status: ResultStatus): boolean {
  return (
    status === "success" ||
    status === "planned" ||
    status === "no_change" ||
    status === "warning"
  );
}

/** Resolve the exit code, applying the most specific causal class first. */
export function exitCodeFor(
  status: ResultStatus,
  failureClass?: FailureClass,
): number {
  if (status === "error" && failureClass !== undefined) {
    return FAILURE_CLASS_EXITS[failureClass];
  }
  return STATUS_EXITS[status];
}

const DRIVE_OR_UNC = /^([A-Za-z]:[\\/]|\\\\|\/\/)/;

/** A safe logical locator: relative, no traversal, no separator confusion. */
export function isSafeLocator(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  if (value.startsWith("/") || value.includes("\\")) return false;
  if (DRIVE_OR_UNC.test(value)) return false;
  return value
    .split("/")
    .every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

/** Build a complete envelope with the frozen protocol version. */
export function createEnvelope(input: {
  readonly command: CommandName;
  readonly status: ResultStatus;
  readonly diagnostics?: readonly EnvelopeDiagnostic[];
  readonly changes?: readonly EnvelopeChange[];
  readonly data?: unknown;
}): CommandEnvelope {
  return {
    schemaVersion: PROTOCOL_VERSION,
    command: input.command,
    status: input.status,
    diagnostics: input.diagnostics ?? [],
    changes: input.changes ?? [],
    data: input.data ?? null,
  };
}

/**
 * Validate an envelope: schema, safe logical locators/paths, and the status
 * invariants (an `error` carries an error diagnostic; `planned` never claims an
 * applied change; `no_change` has no changes).
 */
export function parseEnvelope(
  value: unknown,
  locator = "command envelope",
  authority?: SchemaAuthority,
): ModelResult<CommandEnvelope> {
  const schemaResult = validateWithSchema(
    COMMAND_ENVELOPE_SCHEMA,
    value,
    locator,
    authority,
  );
  if (!schemaResult.ok) return fail(schemaResult.issues);

  const record = value as Record<string, unknown>;
  const issues = [];
  const diagnostics = record["diagnostics"] as readonly Record<
    string,
    unknown
  >[];
  for (const [index, diagnostic] of diagnostics.entries()) {
    if (
      diagnostic["locator"] !== undefined &&
      !isSafeLocator(diagnostic["locator"])
    ) {
      issues.push(
        issue(
          "ENVELOPE_LOCATOR_UNSAFE",
          `diagnostics[${index}].locator must be a safe logical locator`,
          `diagnostics[${index}].locator`,
        ),
      );
    }
  }

  const changes = record["changes"] as readonly Record<string, unknown>[];
  for (const [index, change] of changes.entries()) {
    if (!isSafeLocator(change["path"])) {
      issues.push(
        issue(
          "ENVELOPE_CHANGE_PATH_UNSAFE",
          `changes[${index}].path must be a safe logical path`,
          `changes[${index}].path`,
        ),
      );
    }
  }

  const status = record["status"] as ResultStatus;
  if (
    status === "error" &&
    !diagnostics.some((diagnostic) => diagnostic["level"] === "error")
  ) {
    issues.push(
      issue(
        "ENVELOPE_ERROR_WITHOUT_DIAGNOSTIC",
        "an error envelope must include an error-level diagnostic",
        locator,
      ),
    );
  }
  if (
    status === "planned" &&
    changes.some((change) => change["applied"] === true)
  ) {
    issues.push(
      issue(
        "ENVELOPE_PLANNED_APPLIED",
        "a planned envelope must not mark a change as applied",
        locator,
      ),
    );
  }
  if (status === "no_change" && changes.length > 0) {
    issues.push(
      issue(
        "ENVELOPE_NO_CHANGE_HAS_CHANGES",
        "a no_change envelope must not report changes",
        locator,
      ),
    );
  }

  if (issues.length > 0) return fail(issues);
  return ok({
    schemaVersion: PROTOCOL_VERSION,
    command: record["command"] as CommandName,
    status,
    diagnostics: diagnostics.map((diagnostic) => ({
      code: diagnostic["code"] as string,
      level: diagnostic["level"] as DiagnosticLevel,
      message: diagnostic["message"] as string,
      ...(diagnostic["locator"] === undefined
        ? {}
        : { locator: diagnostic["locator"] as string }),
      ...(diagnostic["guidance"] === undefined
        ? {}
        : { guidance: diagnostic["guidance"] as string }),
    })),
    changes: changes.map((change) => ({
      action: change["action"] as ChangeAction,
      path: change["path"] as string,
      applied: change["applied"] as boolean,
    })),
    data: record["data"],
  });
}

/** Render exactly one deterministic JSON envelope (canonical, one trailing LF). */
export function renderEnvelope(envelope: CommandEnvelope): string {
  return canonicalJson(envelope);
}

/**
 * Safe manual guidance for a fail-closed recovery diagnostic. Recovery never
 * invents a force/recover flag: the developer inspects the retained logical
 * evidence and reconciles using existing commands.
 */
export function recoveryGuidance(code: string): string {
  const guidance: Readonly<Record<string, string>> = {
    RECOVERY_JOURNAL_UNREADABLE:
      "Inspect the retained transaction directory under the reserved _kit state namespace and reconcile it manually before retrying; do not delete unknown state.",
    RECOVERY_IDENTITY_MISMATCH:
      "The journal does not match its directory. Preserve both and reconcile manually before retrying.",
    RECOVERY_BACKUP_MISSING:
      "An owned preimage backup is missing. Restore it from your own copy or reconcile the affected target manually.",
    RECOVERY_USER_EDIT:
      "A managed target was edited after the interruption. Keep your edit and reconcile the batch manually; no automatic overwrite is performed.",
    RECOVERY_AMBIGUOUS_PUBLICATION:
      "The recorded publication cannot be proven from the canonical lock. Inspect kit.lock.json and the journal and reconcile manually.",
  };
  return (
    guidance[code] ??
    "Inspect the retained transaction evidence and reconcile manually before retrying."
  );
}

/** Convert a recovery issue into a fail-closed error diagnostic. */
export function recoveryDiagnostic(issue: ModelIssue): EnvelopeDiagnostic {
  return {
    code: issue.code,
    level: "error",
    message: issue.message,
    ...(issue.locator === undefined ? {} : { locator: issue.locator }),
    guidance: recoveryGuidance(issue.code),
  };
}

/** Parse a rendered envelope back, failing on trailing content or extra docs. */
export function readRenderedEnvelope(
  text: string,
): ModelResult<CommandEnvelope> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return fail([
      issue(
        "ENVELOPE_NOT_JSON",
        `rendered envelope is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      ),
    ]);
  }
  return parseEnvelope(parsed);
}
