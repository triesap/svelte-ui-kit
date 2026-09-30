import { spawnSync } from "node:child_process";
import { lstatSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Bounded nonregular-target writer control.
 *
 * The maintained integration lane spawns this module as an owned `node --test`
 * -free child under an enforceable external deadline. It creates its own temp
 * project under the parent-owned directory named by `SUIK_FIFO_PARENT`, makes a
 * real FIFO and then either:
 *
 *   guarded   calls the real `writeFile`/`writeDir` helpers and reports whether
 *             they rejected the FIFO without opening it and preserved its kind,
 *             mode and size; or
 *   blocking  calls the raw `writeFileSync` directly, simulating a regressed
 *             guard. It blocks opening the FIFO until the parent's external
 *             deadline kills it, proving the runner reports a failure rather
 *             than hanging.
 *
 * The compiled `project` helper is supplied by `SUIK_PROJECT_MODULE` so the
 * control exercises the same code the lane compiled. All temporary state lives
 * under `SUIK_FIFO_PARENT`; the parent owns cleanup.
 */
const projectModule = process.env["SUIK_PROJECT_MODULE"];
const fifoParent = process.env["SUIK_FIFO_PARENT"];
const mode = process.env["SUIK_NONREGULAR_MODE"];

for (const [name, value] of [
  ["SUIK_PROJECT_MODULE", projectModule],
  ["SUIK_FIFO_PARENT", fifoParent],
  ["SUIK_NONREGULAR_MODE", mode],
]) {
  if (typeof value !== "string" || value === "") {
    throw new Error(`${name} must be set`);
  }
}

const { createTempProject } = await import(projectModule);

const project = createTempProject({ parent: fifoParent, prefix: "child-" });
project.writeDir("pipes");
const fifo = path.join(project.root, "pipes", "input");
const created = spawnSync("mkfifo", [fifo], { encoding: "utf8" });

// Report the owned root before anything can block, so the parent can always
// locate and remove its tree.
process.stdout.write(`SUIK_FIFO_ROOT:${project.root}\n`);

function report(payload) {
  process.stdout.write(`SUIK_FIFO_REPORT:${JSON.stringify(payload)}\n`);
}

if (created.error || created.status !== 0) {
  report({
    root: project.root,
    mkfifoFailed: true,
    mkfifoError: created.error?.message ?? created.stderr ?? "unknown",
  });
  process.exit(3);
}

if (mode === "guarded") {
  const before = lstatSync(fifo);
  let writeMessage = null;
  let dirMessage = null;
  try {
    project.writeFile("pipes/input", "x");
  } catch (error) {
    writeMessage = error instanceof Error ? error.message : String(error);
  }
  try {
    project.writeDir("pipes/input");
  } catch (error) {
    dirMessage = error instanceof Error ? error.message : String(error);
  }
  const after = lstatSync(fifo);
  report({
    root: project.root,
    mkfifoFailed: false,
    writeRejected: writeMessage !== null,
    writeMessage,
    dirRejected: dirMessage !== null,
    dirMessage,
    kindPreserved: before.isFIFO() && after.isFIFO(),
    modePreserved: (before.mode & 0o7777) === (after.mode & 0o7777),
    sizePreserved: before.size === after.size && after.size === 0,
  });
  process.exit(0);
}

// Simulate a regressed guard: the raw write opens the FIFO and blocks until a
// reader appears. No reader ever opens it, so the parent's deadline must kill
// this process and report the timeout as a failure.
writeFileSync(fifo, "x");
process.exit(0);
