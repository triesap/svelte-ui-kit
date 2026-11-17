import { isOriginalComposition } from "../../src/codegen/compose.js";
import { derivePlanDigest } from "../../src/codegen/plan.js";
import assert from "node:assert/strict";
import {
  readFileSync,
  writeFileSync,
  renameSync,
  mkdirSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { test, type TestContext } from "node:test";
import { applyPlan, validateApplyPlan } from "../../src/transactions/apply.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { parseKitLock, type KitLock } from "../../src/codegen/lock.js";
import {
  generationFields,
  serializeKitConfig,
  type TargetKind,
} from "../../src/project/config.js";
import { generationFixture } from "../helpers/generation-fixture.js";
import {
  runGeneratedCommand,
  GeneratedCommandFailure,
} from "../helpers/generated-command.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

const directory = path.resolve(".artifacts/verification/canonical-v1");
mkdirSync(directory, { recursive: true });
const reportPath = path.join(
  directory,
  `scv-06-lifecycle-${process.pid}-${Date.now()}.json`,
);
const records: Record<string, unknown>[] = [];
const save = () =>
  writeFileSync(
    reportPath,
    JSON.stringify({ node: process.versions.node, records }, null, 2) + "\n",
  );
type Fixture = ReturnType<typeof generationFixture>;
function withFixture(
  t: TestContext,
  target: TargetKind,
  custom: boolean,
  label: string,
  body: (f: Fixture, entry: Record<string, unknown>) => void,
) {
  let passed = false;
  const f = generationFixture(t, target, custom, () => passed);
  const entry: Record<string, unknown> = {
    label,
    target,
    custom,
    root: f.project.root,
    commands: [],
    before: snapshotTree(f.project.root),
    status: "running",
  };
  records.push(entry);
  save();
  try {
    body(f, entry);
    passed = true;
  } finally {
    entry.status = passed ? "passed" : "failed";
    entry.after = snapshotTree(f.project.root);
    save();
  }
}
function cli(
  f: Fixture,
  entry: Record<string, unknown>,
  args: string[],
  expectedStatus = 0,
) {
  const command: Record<string, unknown> = {
    args,
    expectedStatus,
    cwd: f.project.root,
    deadlineMs: 30000,
    before: snapshotTree(f.project.root),
    startedUtc: new Date().toISOString(),
  };
  (entry.commands as Record<string, unknown>[]).push(command);
  save();
  const started = Date.now();
  try {
    const result = runGeneratedCommand(
      f.project.root,
      path.join(f.owner, "dist/cli/main.js"),
      args,
      { expectedStatus, diagnosticDir: path.join(directory, "scv-06-process") },
    );
    Object.assign(command, {
      pid: result.pid,
      status: result.status,
      signal: result.signal,
      errorCode:
        (result.error as NodeJS.ErrnoException | undefined)?.code ?? null,
      stdout: result.stdout,
      stderr: result.stderr,
    });
    return JSON.parse(result.stdout);
  } catch (error) {
    command.failure = error instanceof Error ? error.message : String(error);
    if (error instanceof GeneratedCommandFailure)
      command.diagnostic = error.diagnostic;
    throw error;
  } finally {
    command.elapsedMs = Date.now() - started;
    command.after = snapshotTree(f.project.root);
    save();
  }
}
const read = (f: Fixture, logical: string) =>
  readFileSync(path.join(f.project.root, logical), "utf8");
function lock(f: Fixture): KitLock {
  const parsed = parseKitLock(
    JSON.parse(read(f, `${f.paths.stateDir}/kit.lock.json`)),
    `${f.paths.stateDir}/kit.lock.json`,
    {
      uiDir: f.config.uiDir,
      stylesDir: f.config.stylesDir,
      stateDir: f.paths.stateDir,
      ...generationFields(f.config),
    },
  );
  assert.ok(parsed.ok, JSON.stringify(parsed));
  return parsed.value;
}
function installed(
  f: Fixture,
  requested: readonly string[],
  stylesheetContract: "foundation-tokens-v1" | "stylesheet-v1",
) {
  const actual = lock(f),
    configBytes = read(f, `${f.paths.stateDir}/kit.json`),
    config = JSON.parse(configBytes);
  assert.equal(actual.schemaVersion, 1);
  assert.equal(actual.target, f.config.target);
  assert.equal(config.schemaVersion, 1);
  assert.equal(config.target, f.config.target);
  assert.deepEqual(actual.requested, requested);
  assert.deepEqual(config.requested, requested);
  assert.equal(actual.configHash, sha256Hex(configBytes));
  assert.equal(actual.registryHash, f.registry.root.contentHash);
  const primary =
    f.config.target === "svelte-library"
      ? {
          kind: "stylesheet-entry",
          path: f.config.styleEntry,
          contract: "library-styles-v1",
        }
      : {
          kind: "layout",
          path: f.config.layoutFile,
          contract:
            f.config.target === "astro" ? "astro-layout-v1" : "layout-v1",
        };
  assert.deepEqual(
    actual.integrations
      .map(({ kind, path, contract }) => ({ kind, path, contract }))
      .sort((a, b) => a.kind.localeCompare(b.kind)),
    [
      primary,
      {
        kind: "stylesheet",
        path: f.paths.kitCss,
        contract: stylesheetContract,
      },
      { kind: "exports", path: f.paths.rootExports, contract: "exports-v1" },
    ].sort((a, b) => a.kind.localeCompare(b.kind)),
  );
  assert.equal(
    Object.hasOwn(
      config,
      f.config.target === "svelte-library" ? "layoutFile" : "styleEntry",
    ),
    false,
  );
  return actual;
}
function desired(f: Fixture, requested: readonly string[]) {
  f.project.writeFile(
    `${f.paths.stateDir}/kit.json`,
    serializeKitConfig({ ...f.config, requested }),
  );
}
function unrelated(
  f: Fixture,
  tree: ReturnType<typeof snapshotTree>,
  previous: KitLock,
) {
  const allowed = new Set([
    `${f.paths.stateDir}/kit.json`,
    `${f.paths.stateDir}/kit.lock.json`,
    ...previous.files.map((v) => v.path),
    ...previous.cssBlocks.map((v) => v.path),
    ...previous.integrations.map((v) => v.path),
  ]);
  assert.deepEqual(
    snapshotTree(f.project.root).filter((v) => !allowed.has(v.path)),
    tree.filter((v) => !allowed.has(v.path)),
  );
}
for (const target of ["sveltekit", "astro", "svelte-library"] as const)
  for (const custom of [false, true])
    test(`${target} ${custom ? "custom" : "standard"}: canonical lifecycle preserves desired state, lineage and customized retirement`, (t) =>
      withFixture(t, target, custom, "lifecycle", (f, entry) => {
        let before = snapshotTree(f.project.root);
        assert.equal(cli(f, entry, ["init", "--dry-run"]).status, "planned");
        assert.deepEqual(snapshotTree(f.project.root), before);
        cli(f, entry, ["init"]);
        installed(f, [], "foundation-tokens-v1");
        before = snapshotTree(f.project.root);
        cli(f, entry, ["add", "button", "--dry-run"]);
        assert.deepEqual(snapshotTree(f.project.root), before);
        cli(f, entry, ["add", "button"]);
        let previous = installed(f, ["button"], "stylesheet-v1");
        assert.deepEqual(previous.items.map((v) => v.id).sort(), [
          "button",
          "spinner",
          "tokens",
        ]);
        for (const file of previous.files)
          assert.equal(sha256Hex(read(f, file.path)), file.baseHash);
        before = snapshotTree(f.project.root);
        for (const args of [["sync", "--dry-run"], ["sync"], ["init"]]) {
          assert.equal(cli(f, entry, args).status, "no_change");
          assert.deepEqual(snapshotTree(f.project.root), before);
        }
        const button = `${f.config.uiDir}/button.svelte`;
        desired(f, []);
        before = snapshotTree(f.project.root);
        cli(f, entry, ["sync", "--dry-run"]);
        assert.deepEqual(snapshotTree(f.project.root), before);
        cli(f, entry, ["sync"]);
        unrelated(f, before, previous);
        assert.equal(
          snapshotTree(f.project.root).some((v) => v.path === button),
          false,
        );
        assert.deepEqual(installed(f, [], "foundation-tokens-v1").items, []);
        assert.ok(
          read(f, f.paths.kitCss).includes("svelte-ui-kit:start tokens"),
        );
        cli(f, entry, ["add", "button"]);
        previous = installed(f, ["button"], "stylesheet-v1");
        const base = previous.files.find((v) => v.path === button)!.baseHash;
        const customized =
          read(f, button) + "\n<!-- application source customization -->\n";
        f.project.writeFile(button, customized);
        const css = read(f, f.paths.kitCss),
          end = "/* svelte-ui-kit:end button */";
        assert.equal(css.split(end).length, 2);
        f.project.writeFile(
          f.paths.kitCss,
          css.replace(end, ".kit-button { outline-offset: 7px; }\n" + end),
        );
        f.project.writeFile(
          f.paths.appCss,
          read(f, f.paths.appCss) +
            "\n.application-owned { color: rebeccapurple; }\n",
        );
        f.project.writeFile(
          f.paths.rootExports,
          read(f, f.paths.rootExports) + "\nexport const AppValue = 42;\n",
        );
        before = snapshotTree(f.project.root);
        const bookkeeping = cli(f, entry, ["sync"]);
        assert.equal(bookkeeping.status, "success");
        const lockPath = `${f.paths.stateDir}/kit.lock.json`;
        assert.deepEqual(
          snapshotTree(f.project.root).filter((row) => row.path !== lockPath),
          before.filter((row) => row.path !== lockPath),
        );
        const customizedLock = lock(f);
        assert.equal(
          customizedLock.files.find((v) => v.path === button)!.baseHash,
          base,
        );
        assert.equal(
          customizedLock.cssBlocks.find((row) => row.owner === "button")!
            .baseHash,
          previous.cssBlocks.find((row) => row.owner === "button")!.baseHash,
        );
        assert.equal(
          customizedLock.integrations.find((row) => row.kind === "stylesheet")!
            .baseline,
          sha256Hex(read(f, f.paths.kitCss)),
        );
        before = snapshotTree(f.project.root);
        assert.equal(cli(f, entry, ["sync"]).status, "no_change");
        assert.deepEqual(snapshotTree(f.project.root), before);
        assert.equal(
          lock(f).files.find((v) => v.path === button)!.baseHash,
          base,
        );
        assert.notEqual(base, sha256Hex(customized));
        const customCss = read(f, f.paths.kitCss);
        const startMarker = "/* svelte-ui-kit:start button */";
        const customSpan = customCss.slice(
          customCss.indexOf(startMarker),
          customCss.indexOf(end) + end.length,
        );
        assert.ok(
          customSpan.startsWith(startMarker) && customSpan.endsWith(end),
        );
        const primary = read(f, f.integration.path),
          appCss = read(f, f.paths.appCss);
        desired(f, []);
        before = snapshotTree(f.project.root);
        cli(f, entry, ["sync"]);
        unrelated(f, before, previous);
        const retired = installed(f, [], "foundation-tokens-v1");
        assert.equal(
          retired.files.some((v) => v.path === button),
          false,
        );
        assert.equal(
          retired.cssBlocks.some((v) => v.owner === "button"),
          false,
        );
        assert.equal(read(f, button), customized);
        assert.ok(
          read(f, f.paths.kitCss).includes(
            ".kit-button { outline-offset: 7px; }",
          ),
        );
        assert.ok(read(f, f.paths.kitCss).includes(customSpan));
        assert.equal(read(f, f.integration.path), primary);
        assert.equal(read(f, f.paths.appCss), appCss);
        assert.ok(
          read(f, f.paths.rootExports).includes("export const AppValue = 42;"),
        );
        before = snapshotTree(f.project.root);
        assert.equal(cli(f, entry, ["add", "button"], 10).status, "conflict");
        assert.deepEqual(snapshotTree(f.project.root), before);
      }));
for (const target of ["sveltekit", "astro", "svelte-library"] as const)
  test(`${target}: a valid foreign-target lock never becomes current ownership`, (t) =>
    withFixture(t, target, true, "foreign-lock", (f, entry) => {
      const sealed = validateApplyPlan(f.composed);
      assert.ok(sealed.ok, JSON.stringify(sealed));
      assert.equal(applyPlan(sealed.value).kind, "applied");
      const actual = JSON.parse(read(f, `${f.paths.stateDir}/kit.lock.json`));
      actual.target = target === "astro" ? "sveltekit" : "astro";
      actual.integrations = actual.integrations.map(
        (row: {
          kind: string;
          path: string;
          contract: string;
          baseline: string;
        }) =>
          row.kind === "layout" || row.kind === "stylesheet-entry"
            ? {
                ...row,
                kind: "layout",
                path:
                  actual.target === "astro"
                    ? "src/layouts/Foreign.astro"
                    : "src/routes/+layout.svelte",
                contract:
                  actual.target === "astro" ? "astro-layout-v1" : "layout-v1",
              }
            : row,
      );
      const schemaValid = parseKitLock(actual);
      assert.ok(schemaValid.ok, JSON.stringify(schemaValid));
      f.project.writeFile(
        `${f.paths.stateDir}/kit.lock.json`,
        JSON.stringify(actual, null, 2) + "\n",
      );
      const before = snapshotTree(f.project.root);
      for (const args of [
        ["info"],
        ["init", "--dry-run"],
        ["add", "button", "--dry-run"],
        ["sync", "--dry-run"],
        ["doctor", "--strict"],
      ]) {
        const result = cli(f, entry, args, args[0] === "doctor" ? 3 : 1);
        assert.ok(
          result.diagnostics.some(
            (d: { code: string }) => d.code === "LOCK_TARGET_CONTEXT",
          ),
          JSON.stringify(result),
        );
        assert.deepEqual(snapshotTree(f.project.root), before);
      }
    }));
for (const target of ["sveltekit", "astro", "svelte-library"] as const)
  for (const mutation of ["desired", "same-byte-primary"] as const)
    test(`${target}: ${mutation} staged drift refuses the whole batch and preserves the operator edit`, (t) =>
      withFixture(t, target, true, mutation, (f, entry) => {
        const sealed = validateApplyPlan(f.composed);
        assert.ok(sealed.ok, JSON.stringify(sealed));
        const before = snapshotTree(f.project.root),
          configuration = `${f.paths.stateDir}/kit.json`,
          backup = `${f.integration.path}.operator-original`;
        let fired = false;
        const outcome = applyPlan(sealed.value, {
          after(boundary) {
            if (boundary !== "stage:write" || fired) return;
            fired = true;
            if (mutation === "desired") desired(f, ["button"]);
            else {
              const file = path.join(f.project.root, f.integration.path),
                bytes = readFileSync(file),
                mode = statSync(file).mode & 0o7777;
              renameSync(file, path.join(f.project.root, backup));
              writeFileSync(file, bytes, { mode });
            }
          },
        });
        entry.outcome = outcome;
        assert.equal(fired, true);
        assert.equal(outcome.kind, "refused", JSON.stringify(outcome));
        assert.ok(
          outcome.issues.some((i) =>
            mutation === "desired"
              ? i.code === "AUTHORITY_READ_CHANGED"
              : i.code === "STALE_PLAN",
          ),
          JSON.stringify(outcome),
        );
        if (mutation === "desired") {
          assert.deepEqual(JSON.parse(read(f, configuration)).requested, [
            "button",
          ]);
          assert.deepEqual(
            snapshotTree(f.project.root).filter(
              (v) => v.path !== configuration,
            ),
            before.filter((v) => v.path !== configuration),
          );
        } else {
          assert.equal(read(f, backup), read(f, f.integration.path));
          assert.deepEqual(
            snapshotTree(f.project.root).filter((v) => v.path !== backup),
            before,
          );
        }
      }));

for (const target of ["sveltekit", "astro", "svelte-library"] as const)
  test(`${target}: a substituted plan target cannot reuse composition authority with a fresh digest`, (t) =>
    withFixture(t, target, true, "substituted-plan", (f, entry) => {
      const original = validateApplyPlan(f.composed);
      assert.ok(original.ok, JSON.stringify(original));
      const candidate: Record<string, unknown> = {
        ...f.composed,
        target: target === "astro" ? "sveltekit" : "astro",
      };
      if (target === "svelte-library") {
        delete candidate.styleEntry;
        candidate.layoutFile = "src/layouts/Foreign.astro";
      }
      candidate.planDigest = derivePlanDigest({
        ...candidate,
        targets: f.composed.targets.map((row) => ({
          ...row,
          resultDigest: sha256Hex(row.bytes),
        })),
      } as never);
      assert.equal(isOriginalComposition(f.composed), true);
      assert.equal(isOriginalComposition(candidate as never), false);
      assert.equal(
        candidate.compositionAuthority,
        f.composed.compositionAuthority,
      );
      entry.claimedTarget = candidate.target;
      entry.recomputedDigest = candidate.planDigest;
      const before = snapshotTree(f.project.root),
        result = validateApplyPlan(candidate as never);
      entry.validation = result;
      assert.equal(result.ok, false);
      assert.deepEqual(snapshotTree(f.project.root), before);
    }));
