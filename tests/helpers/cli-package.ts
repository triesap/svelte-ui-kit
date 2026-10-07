/** Owned isolated executable package and consumer for CLI lifecycle checks. */
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  compoundRegistry,
  type CompoundRegistryOptions,
} from "./multi-item-fixture.js";
export function cliPackage(options: CompoundRegistryOptions = {}) {
  const base = mkdtempSync(path.join(os.tmpdir(), "suik-cli-package-"));
  const pkg = path.join(base, "package"),
    root = path.join(base, "consumer");
  mkdirSync(pkg);
  mkdirSync(root);
  cpSync("dist", path.join(pkg, "dist"), { recursive: true });
  cpSync("package.json", path.join(pkg, "package.json"));
  symlinkSync(path.resolve("node_modules"), path.join(pkg, "node_modules"));
  const loaded = compoundRegistry(pkg, options);
  if (!loaded.ok) {
    rmSync(base, { recursive: true, force: true });
    throw new Error(JSON.stringify(loaded));
  }
  write(
    root,
    "package.json",
    JSON.stringify({
      name: "consumer",
      type: "module",
      packageManager: "pnpm@11.22.0",
      dependencies: { svelte: "5.57.1", "@sveltejs/kit": "2.70.3" },
    }),
  );
  return {
    base,
    pkg,
    root,
    registry: loaded.value,
    run: (args: readonly string[]) =>
      spawnSync(
        process.execPath,
        [path.join(pkg, "dist/cli/main.js"), ...args, "--json", "--cwd", root],
        { cwd: root, encoding: "utf8" },
      ),
    cleanup: () => rmSync(base, { recursive: true, force: true }),
  };
}
export function write(root: string, logical: string, body: string) {
  const target = path.join(root, logical);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, body);
}
