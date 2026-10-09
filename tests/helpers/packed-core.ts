/** Real offline local-tarball installation into an owned standalone host. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { sha256Hex } from "../../src/codegen/digest.js";

export function installPackedCore() {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-core-install-"));
  const logRoot = ".artifacts/verification/packed-core";
  mkdirSync(logRoot, { recursive: true });
  const prefix = `${process.pid}-${Date.now()}`;
  try {
    const archives = path.join(root, "archives"),
      host = path.join(root, "host");
    mkdirSync(archives);
    mkdirSync(host);
    const run = (
      command: string,
      args: string[],
      cwd: string,
      label: string,
    ) => {
      const result = spawnSync(command, args, {
        cwd,
        encoding: "utf8",
        timeout: 180000,
      });
      const log = `${logRoot}/${prefix}-${label}.log`;
      writeFileSync(
        log,
        `${result.stdout}\n${result.stderr}\nstatus=${result.status}; signal=${result.signal}\n`,
      );
      assert.equal(result.status, 0, result.stdout + result.stderr);
      return { log, stdout: result.stdout };
    };
    const packed = run(
      "pnpm",
      ["pack", "--json", "--pack-destination", archives],
      process.cwd(),
      "pack",
    );
    const names = readdirSync(archives);
    assert.equal(names.length, 1);
    assert.match(names[0]!, /\.tgz$/);
    const archive = path.join(archives, names[0]!);
    writeFileSync(
      path.join(host, "package.json"),
      JSON.stringify({
        name: "owned-packed-core-host",
        private: true,
        type: "module",
        packageManager: "pnpm@11.22.0",
        dependencies: { "svelte-ui-kit": `file:${archive}` },
      }),
    );
    const installed = run(
      "pnpm",
      ["install", "--offline", "--ignore-scripts", "--lockfile=false"],
      host,
      "install",
    );
    const packageRoot = path.join(host, "node_modules/svelte-ui-kit");
    assert.ok(existsSync(path.join(packageRoot, "dist/cli/main.js")));
    for (const absent of ["src", "tests", "implementation", "tools"])
      assert.equal(existsSync(path.join(packageRoot, absent)), false, absent);
    const evidence = {
      archiveSha256: sha256Hex(readFileSync(archive)),
      manifest: JSON.parse(
        readFileSync(path.join(packageRoot, "package.json"), "utf8"),
      ),
      packLog: packed.log,
      installLog: installed.log,
      registrySha256: sha256Hex(
        readFileSync(path.join(packageRoot, "registry/registry.json")),
      ),
      executableSha256: sha256Hex(
        readFileSync(path.join(packageRoot, "dist/cli/main.js")),
      ),
      installedDirectory: realpathSync(packageRoot),
    };
    writeFileSync(
      `${logRoot}/${prefix}-identity.json`,
      JSON.stringify(evidence, null, 2),
    );
    return {
      packageRoot,
      evidence,
      cleanup: () => rmSync(root, { recursive: true, force: true }),
    };
  } catch (error) {
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
}
