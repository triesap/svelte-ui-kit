/**
 * Behavioral no-writer/no-manager control (RCLD03-R8-3).
 *
 * The maintained integration lane spawns this module as a child under Node's
 * permission model (`--permission --allow-fs-read=*`), which denies every
 * filesystem write and every child process by default. It imports the real
 * compiled planners and runs init/add/sync against a parent-prepared project;
 * if any planner attempted a write or started a package manager, the child
 * would abort with `ERR_ACCESS_DENIED`. A clean exit is behavioral evidence,
 * not a source-text scan.
 *
 * Inputs are supplied through the environment:
 *   SUIK_DIST      absolute path to the built `dist/` tree
 *   SUIK_HELPERS   absolute path to the compiled `tests/helpers/registry.js`
 *   SUIK_PLAN_ROOT absolute path to the prepared supported project
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dist = process.env["SUIK_DIST"];
const helpers = process.env["SUIK_HELPERS"];
const root = process.env["SUIK_PLAN_ROOT"];
for (const [name, value] of [
  ["SUIK_DIST", dist],
  ["SUIK_HELPERS", helpers],
  ["SUIK_PLAN_ROOT", root],
]) {
  if (typeof value !== "string" || value === "") {
    throw new Error(`${name} must be set`);
  }
}

const load = (abs) => import(pathToFileURL(abs).href);
const { planInit } = await load(path.join(dist, "codegen/plan-init.js"));
const { planAdd } = await load(path.join(dist, "codegen/plan-add.js"));
const { planSync } = await load(path.join(dist, "codegen/plan-sync.js"));
const { captureSnapshot } = await load(path.join(dist, "codegen/snapshot.js"));
const { DEFAULT_KIT_CONFIG, deriveKitPaths } = await load(
  path.join(dist, "project/config.js"),
);
const { componentItem, registryOf } = await load(helpers);

const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);
const paths = [
  `${derived.stateDir}/kit.json`,
  `${derived.stateDir}/kit.lock.json`,
  derived.rootExports,
  derived.kitCss,
  derived.themesCss,
  derived.appCss,
  DEFAULT_KIT_CONFIG.layoutFile,
  `${derived.rootExportsDir}/button.svelte`,
  "package.json",
];
const snapshot = captureSnapshot(root, paths);
if (!snapshot.ok) throw new Error(JSON.stringify(snapshot));

const registry = registryOf([
  componentItem("button", {
    exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
  }),
]);
let layoutSource = "";
try {
  layoutSource = readFileSync(
    path.join(root, DEFAULT_KIT_CONFIG.layoutFile),
    "utf8",
  );
} catch {
  // An absent layout is materialized by the planner; an empty source is the
  // correct preimage.
}
const common = {
  registry,
  snapshot: snapshot.value,
  registryVersion: registry.root.registryVersion,
  registryHash: registry.root.contentHash,
};
const init = planInit({
  config: DEFAULT_KIT_CONFIG,
  layoutFile: DEFAULT_KIT_CONFIG.layoutFile,
  layoutSource,
  snapshot: snapshot.value,
  registry,
  configHash: "b".repeat(64),
});
const add = planAdd({
  ...common,
  config: DEFAULT_KIT_CONFIG,
  addedRoots: ["button"],
  lock: null,
});
const sync = planSync({ ...common, config: DEFAULT_KIT_CONFIG, lock: null });
process.stdout.write(
  `${JSON.stringify({ init: init.ok, add: add.ok, sync: sync.ok })}\n`,
);
