/**
 * Shared typed model-validation vocabulary.
 *
 * Every registry/project/config model in this package reports problems as
 * structured `ModelIssue` records with a stable machine `code`, a human
 * message and an optional *logical* locator. A logical locator is a
 * repository/registry-relative path or field name, never an absolute host
 * path, so diagnostics stay safe to print and stable across machines.
 *
 * Validators return `ModelResult<T>` rather than throwing, so a caller can
 * collect every problem in one pass. `assert*` wrappers and `ModelError` exist
 * for the call sites that genuinely cannot continue (for example, an
 * executable boundary that must exit non-zero).
 */
export interface ModelIssue {
  /** Stable machine-readable problem code (for example `SEMVER_INVALID`). */
  readonly code: string;
  /** Human-readable explanation. */
  readonly message: string;
  /** Safe logical locator (field or relative path), never a host path. */
  readonly locator?: string;
}

export type ModelResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly issues: readonly ModelIssue[] };

/** Build one issue, omitting `locator` when it is not meaningful. */
export function issue(
  code: string,
  message: string,
  locator?: string,
): ModelIssue {
  return locator === undefined ? { code, message } : { code, message, locator };
}

export function ok<T>(value: T): ModelResult<T> {
  return { ok: true, value };
}

export function fail<T = never>(issues: readonly ModelIssue[]): ModelResult<T> {
  return { ok: false, issues };
}

/**
 * Thrown by `assert*` wrappers. Carries the complete issue list so a caller
 * can render every problem, not just the first.
 */
export class ModelError extends Error {
  readonly issues: readonly ModelIssue[];

  constructor(issues: readonly ModelIssue[]) {
    super(
      issues.length > 0
        ? issues.map((entry) => entry.message).join("; ")
        : "model validation failed",
    );
    this.name = "ModelError";
    this.issues = issues;
  }

  /** The first issue's stable code, or `MODEL_ERROR` for an empty list. */
  get code(): string {
    return this.issues[0]?.code ?? "MODEL_ERROR";
  }
}
