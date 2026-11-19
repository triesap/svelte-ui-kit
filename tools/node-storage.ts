/** Optional native storage routing; unmanaged public checkouts use normal pnpm. */
import path from "node:path";
import { existsSync, readFileSync } from "node:fs";

export function nodeStorageCommand(
  command: string,
  args: readonly string[],
  cwd: string,
  env: NodeJS.ProcessEnv = process.env,
): { command: string; args: string[]; cwd: string } {
  const plain = { command, args: [...args], cwd };
  if (path.basename(command) !== "pnpm" || !env.EXTBUILD_EXECUTABLE)
    return plain;
  const executable = env.EXTBUILD_EXECUTABLE;
  const profile = env.EXTBUILD_MACHINE_CONFIG;
  const owner = env.EXTBUILD_PROJECT_ROOT;
  if (
    !profile ||
    !owner ||
    ![executable, profile, owner].every((value) => path.isAbsolute(value))
  ) {
    throw new Error(
      "Managed Node commands require absolute executable, profile and source owner",
    );
  }
  const relative = path.relative(owner, cwd);
  const inSource =
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative));
  let workspace = cwd;
  let fixtureArgs = [...args];
  if (!inSource) {
    let cursor = cwd;
    while (true) {
      const manifest = path.join(cursor, "package.json");
      if (
        existsSync(manifest) &&
        typeof JSON.parse(readFileSync(manifest, "utf8")).packageManager ===
          "string"
      ) {
        workspace = cursor;
        if (cursor !== cwd) fixtureArgs = ["--dir", cwd, ...args];
        break;
      }
      if (
        existsSync(path.join(cursor, ".git")) ||
        path.dirname(cursor) === cursor
      )
        break;
      cursor = path.dirname(cursor);
    }
  }
  return {
    command: executable,
    args: [
      "--machine-config",
      profile,
      ...(inSource
        ? ["run"]
        : ["node", "fixture_run", "--workspace", workspace]),
      "--",
      command,
      ...fixtureArgs,
    ],
    cwd: inSource ? cwd : owner,
  };
}
