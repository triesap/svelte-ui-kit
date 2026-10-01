import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
  type Stats,
} from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Owned temporary project boundary for integration tests.
 *
 * The helper allocates a unique directory under the OS temporary directory,
 * exposes narrow write helpers that reject absolute or escaping paths, and
 * removes only its own root. It never touches a caller's real project.
 *
 * Every mutating helper additionally verifies *physical* containment before
 * writing: no existing component on the path may be a symlink (including a
 * dangling link) and no intermediate component may be a non-directory. An
 * explicitly created fixture symlink is still supported, but a later write
 * through it is rejected rather than followed outside the owned root.
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

/** `lstat`, returning null only for a genuinely absent entry. */
function lstatOrNull(abs: string): Stats | null {
  try {
    return lstatSync(abs);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

/**
 * Reject a physically unsafe write path before any mutation.
 *
 * The walk starts at the owned root and inspects each existing component with
 * `lstat`, so symlinks are observed without being followed. It stops at the
 * first missing component because nothing deeper can exist physically. A
 * symlink anywhere (ancestor or final, live or dangling) and a non-directory
 * intermediate component are both rejected.
 */
function assertPhysicalWithin(root: string, abs: string): void {
  const rootStats = lstatOrNull(root);
  if (rootStats === null || !rootStats.isDirectory()) {
    throw new Error(`temp project root is not an existing directory: ${root}`);
  }
  const relative = path.relative(root, abs);
  if (relative === "") return;
  const segments = relative.split(path.sep);
  let current = root;
  for (let index = 0; index < segments.length; index += 1) {
    current = path.join(current, segments[index]);
    const stats = lstatOrNull(current);
    if (stats === null) return;
    if (stats.isSymbolicLink()) {
      const found = segments.slice(0, index + 1).join("/");
      throw new Error(`refusing to follow a symlink at "${found}"`);
    }
    const isLast = index === segments.length - 1;
    if (!isLast && !stats.isDirectory()) {
      const found = segments.slice(0, index + 1).join("/");
      throw new Error(`invalid non-directory ancestor at "${found}"`);
    }
  }
}

/**
 * A manifest for a supported SvelteKit application. Tests that exercise the
 * complete planning entries must seed this so the shared validated invocation
 * boundary accepts the project; an empty directory is deliberately invalid.
 */
export const SUPPORTED_MANIFEST = `${JSON.stringify(
  {
    name: "consumer",
    private: true,
    type: "module",
    packageManager: "pnpm@11.22.0",
    devDependencies: { "@sveltejs/kit": "2.70.3" },
  },
  null,
  2,
)}\n`;

/** Seed a supported SvelteKit manifest into an owned temp project. */
export function seedSupportedManifest(project: TempProject): TempProject {
  project.writeFile("package.json", SUPPORTED_MANIFEST);
  return project;
}

/**
 * Create an owned temp project that represents a supported SvelteKit
 * application (a minimal manifest declaring `@sveltejs/kit`).
 */
export function createSupportedProject(
  options: TempProjectOptions = {},
): TempProject {
  return seedSupportedManifest(createTempProject(options));
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
      assertPhysicalWithin(root, abs);
      const existing = lstatOrNull(abs);
      if (existing !== null) {
        if (existing.isDirectory()) {
          throw new Error(`cannot write a file over a directory: ${rel}`);
        }
        if (!existing.isFile()) {
          throw new Error(
            `cannot write a file over a non-regular entry: ${rel}`,
          );
        }
      }
      mkdirSync(path.dirname(abs), { recursive: true });
      writeFileSync(abs, contents);
      return abs;
    },
    writeDir(rel) {
      const abs = resolveWithin(root, rel);
      assertPhysicalWithin(root, abs);
      const existing = lstatOrNull(abs);
      if (existing !== null && !existing.isDirectory()) {
        throw new Error(
          `cannot create a directory over a non-directory: ${rel}`,
        );
      }
      mkdirSync(abs, { recursive: true });
      return abs;
    },
    symlink(target, rel) {
      const abs = resolveWithin(root, rel);
      assertPhysicalWithin(root, abs);
      if (lstatOrNull(abs) !== null) {
        throw new Error(`refusing to replace an existing entry: ${rel}`);
      }
      mkdirSync(path.dirname(abs), { recursive: true });
      symlinkSync(target, abs);
      return abs;
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}
