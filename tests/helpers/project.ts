import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Owned temporary project boundary for integration tests.
 *
 * The helper allocates a unique directory under the OS temporary directory,
 * exposes narrow write helpers that reject absolute or escaping paths, and
 * removes only its own root. It never touches a caller's real project.
 */
export interface TempProject {
  readonly root: string;
  writeFile(rel: string, contents: string): string;
  writeDir(rel: string): string;
  symlink(target: string, rel: string): string;
  cleanup(): void;
}

export interface TempProjectOptions {
  /** Directory-name prefix; keeps concurrent test runs distinguishable. */
  prefix?: string;
  /** Owned parent directory; defaults to the OS temporary directory. */
  parent?: string;
}

/** Resolve a project-relative path, rejecting absolute or escaping input. */
export function resolveWithin(root: string, rel: string): string {
  if (rel === "") throw new Error("project path must not be empty");
  if (path.isAbsolute(rel)) {
    throw new Error(`project path must be relative: ${rel}`);
  }
  const segments = rel.split(/[\\/]+/).filter((segment) => segment !== "");
  if (segments.includes("..")) {
    throw new Error(`project path must not escape its root: ${rel}`);
  }
  const abs = path.join(root, ...segments);
  const relative = path.relative(root, abs);
  if (
    relative !== "" &&
    (relative === ".." || relative.startsWith(`..${path.sep}`))
  ) {
    throw new Error(`project path must not escape its root: ${rel}`);
  }
  return abs;
}

export function createTempProject(
  options: TempProjectOptions = {},
): TempProject {
  const prefix = options.prefix ?? "suik-integration-";
  const parent = options.parent ?? os.tmpdir();
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(path.join(parent, prefix));
  return {
    root,
    writeFile(rel, contents) {
      const abs = resolveWithin(root, rel);
      mkdirSync(path.dirname(abs), { recursive: true });
      writeFileSync(abs, contents);
      return abs;
    },
    writeDir(rel) {
      const abs = resolveWithin(root, rel);
      mkdirSync(abs, { recursive: true });
      return abs;
    },
    symlink(target, rel) {
      const abs = resolveWithin(root, rel);
      mkdirSync(path.dirname(abs), { recursive: true });
      symlinkSync(target, abs);
      return abs;
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}
