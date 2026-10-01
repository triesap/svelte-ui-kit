/**
 * One read-only validated invocation boundary (RCLD03-R7-1).
 *
 * Every complete planning entry point (`planInit`, `planAdd` and `planSync`)
 * reasons about a supported application. The selected-project evidence is
 * captured once in the snapshot environment (`detectDefaultProject` plus the
 * package-manager evidence) and validated here before any executable plan is
 * produced. Composing the shared rules in one place means an empty directory, a
 * malformed manifest, a non-SvelteKit package or an ambiguous package manager
 * can never be silently treated as a supported application by one command
 * while another refuses it.
 *
 * Internal helpers may consume already-validated inputs; this boundary is what
 * makes those inputs trustworthy. It performs no filesystem access beyond the
 * captured evidence and starts no writer or package manager.
 */
import type { ModelResult } from "../registry/errors.js";
import { fail, ok } from "../registry/errors.js";
import type { DetectedProject } from "../project/detect.js";
import type { ProjectSnapshot } from "./snapshot.js";

export interface ValidatedInvocation {
  /** The captured static project-selection evidence. */
  readonly project: DetectedProject;
}

/**
 * Validate the captured selected-project and package-manager evidence. A
 * detected non-SvelteKit/absent/malformed/unsafe package or a manager conflict
 * is a logical typed failure with no executable writes.
 */
export function validateInvocation(
  snapshot: ProjectSnapshot,
): ModelResult<ValidatedInvocation> {
  const project = snapshot.environment.project;
  if (!project.ok) return fail(project.issues);
  if (snapshot.environment.managerIssues.length > 0) {
    return fail([...snapshot.environment.managerIssues]);
  }
  return ok({ project: project.value });
}
