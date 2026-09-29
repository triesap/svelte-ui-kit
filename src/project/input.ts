/**
 * Read-only project input boundary.
 *
 * This expresses the already-approved consumer project facts that planning may
 * depend on. It is a type-only interface: importing it performs no filesystem
 * access and no project inspection. Concrete readers are scheduled for the
 * project-integration checkpoints, not here.
 */
export interface ProjectInput {
  /** Absolute or repository-relative project root. */
  readonly rootDir: string;
  /** Declared package name, or null when the project has no package manifest. */
  readonly packageName: string | null;
  /** Declared dependency name to version range. */
  readonly dependencies: Readonly<Record<string, string>>;
}
