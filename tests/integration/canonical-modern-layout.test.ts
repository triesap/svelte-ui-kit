import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { generationFixture } from "../helpers/generation-fixture.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
const directory = path.resolve(".artifacts/verification/canonical-v1");
mkdirSync(directory, { recursive: true });
const reportPath = path.join(
    directory,
    `scv-08-layout-${process.pid}-${Date.now()}.json`,
  ),
  records: Record<string, unknown>[] = [];
const save = () =>
  writeFileSync(
    reportPath,
    JSON.stringify({ node: process.versions.node, records }, null, 2) + "\n",
  );
type Fixture = ReturnType<typeof generationFixture>;
function cli(
  f: Fixture,
  args: string[],
  allowed: readonly number[],
  entry: Record<string, unknown>,
) {
  const before = snapshotTree(f.project.root),
    started = Date.now();
  const result = spawnSync(
    process.execPath,
    [
      path.join(f.owner, "dist/cli/main.js"),
      "--cwd",
      f.project.root,
      ...args,
      "--json",
    ],
    { encoding: "utf8", timeout: 30000, killSignal: "SIGKILL" },
  );
  (entry.commands as unknown[]).push({
    args,
    cwd: f.project.root,
    pid: result.pid,
    deadlineMs: 30000,
    elapsedMs: Date.now() - started,
    status: result.status,
    signal: result.signal,
    error: result.error
      ? {
          message: result.error.message,
          code: (result.error as NodeJS.ErrnoException).code,
        }
      : null,
    stdout: result.stdout,
    stderr: result.stderr,
    before,
    after: snapshotTree(f.project.root),
  });
  save();
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  assert.equal(result.stderr, "");
  assert.ok(allowed.includes(result.status!), result.stdout);
  return JSON.parse(result.stdout) as {
    status: string;
    diagnostics: unknown[];
  };
}
const invalid = [
  ["legacy-slot", "<main><slot /></main>\n"],
  [
    "legacy-prop",
    "<script>export let children;</script>\n{@render children()}\n",
  ],
  ["blank", "<main>Owner content without page rendering</main>\n"],
  [
    "comment-only",
    "<script>let { children } = $props();</script>\n<!-- {@render children()} -->\n",
  ],
  [
    "shadowed",
    "<script>let { children } = $props();</script>\n{#each [1] as children}{@render children()}{/each}\n",
  ],
  [
    "uninvoked",
    "<script>let { children } = $props();</script>\n{#snippet unused()}{@render children()}{/snippet}\n",
  ],
  [
    "unrelated",
    "<script>let { children, other } = $props();</script>\n{@render other()}\n",
  ],
] as const;
for (const custom of [false, true]) {
  for (const [label, source] of invalid)
    test(`${custom ? "custom" : "standard"}: ${label} cannot authorize initialization`, (t) => {
      let passed = false;
      const f = generationFixture(t, "sveltekit", custom, () => passed);
      const entry: Record<string, unknown> = {
        label,
        custom,
        root: f.project.root,
        commands: [],
      };
      records.push(entry);
      save();
      writeFileSync(path.join(f.project.root, f.integration.path), source);
      const before = snapshotTree(f.project.root);
      try {
        for (const args of [["init", "--dry-run"], ["init"]]) {
          const result = cli(f, args, [1], entry);
          assert.match(
            JSON.stringify(result.diagnostics),
            /PROJECTED_LAYOUT_RENDERING_MISSING/,
          );
          assert.match(
            JSON.stringify(result.diagnostics),
            /\$props\(\).*@render children/,
          );
          assert.deepEqual(snapshotTree(f.project.root), before);
        }
        passed = true;
      } finally {
        entry.status = passed ? "passed" : "failed";
        save();
      }
    });
  for (const binding of ["children", "content"])
    test(`${custom ? "custom" : "standard"}: modern ${binding} remains application-owned through init and sync`, (t) => {
      let passed = false;
      const f = generationFixture(t, "sveltekit", custom, () => passed);
      const entry: Record<string, unknown> = {
        binding,
        custom,
        root: f.project.root,
        commands: [],
      };
      records.push(entry);
      save();
      const source = `<script>let { ${binding === "children" ? "children" : "children: content"} } = $props(); const owner = 'preserved';</script>\n<main data-owner={owner}>{@render ${binding}()}</main>\n`;
      writeFileSync(path.join(f.project.root, f.integration.path), source);
      try {
        cli(f, ["init"], [0], entry);
        const initialized = readFileSync(
          path.join(f.project.root, f.integration.path),
          "utf8",
        );
        assert.ok(
          initialized.includes(
            `<main data-owner={owner}>{@render ${binding}()}</main>`,
          ),
        );
        assert.ok(initialized.includes("const owner = 'preserved';"));
        const before = snapshotTree(f.project.root);
        cli(f, ["sync", "--dry-run"], [0], entry);
        assert.deepEqual(snapshotTree(f.project.root), before);
        cli(f, ["sync"], [0], entry);
        assert.deepEqual(snapshotTree(f.project.root), before);
        passed = true;
      } finally {
        entry.status = passed ? "passed" : "failed";
        save();
      }
    });
  for (const [label] of invalid.slice(0, 2))
    test(`${custom ? "custom" : "standard"}: installed ${label} is diagnosed and refused without writes`, (t) => {
      let passed = false;
      const f = generationFixture(t, "sveltekit", custom, () => passed);
      const entry: Record<string, unknown> = {
        label,
        custom,
        installed: true,
        root: f.project.root,
        commands: [],
      };
      records.push(entry);
      save();
      try {
        cli(f, ["init"], [0], entry);
        const layout = path.join(f.project.root, f.integration.path);
        const modern = readFileSync(layout, "utf8");
        const changed =
          label === "legacy-slot"
            ? modern.replace("{@render children()}", "<slot />")
            : modern.replace(
                "let { children } = $props();",
                "export let children;",
              );
        assert.notEqual(changed, modern);
        writeFileSync(layout, changed);
        const before = snapshotTree(f.project.root);
        const doctor = cli(f, ["doctor", "--strict"], [3], entry);
        assert.match(JSON.stringify(doctor), /DOCTOR_CHILD_RENDER_MISSING/);
        assert.match(JSON.stringify(doctor), /\$props\(\).*@render children/);
        assert.deepEqual(snapshotTree(f.project.root), before);
        for (const args of [["init"], ["add", "button"], ["sync"]]) {
          const result = cli(f, args, [1, 10], entry);
          assert.match(
            JSON.stringify(result),
            /PROJECTED_LAYOUT_RENDERING_MISSING/,
          );
          assert.deepEqual(snapshotTree(f.project.root), before);
        }
        passed = true;
      } finally {
        entry.status = passed ? "passed" : "failed";
        save();
      }
    });
  test(`${custom ? "custom" : "standard"}: Astro native slots remain a separate valid rendering contract`, (t) => {
    let passed = false;
    const f = generationFixture(t, "astro", custom, () => passed);
    const entry: Record<string, unknown> = {
      target: "astro",
      custom,
      root: f.project.root,
      commands: [],
    };
    records.push(entry);
    save();
    try {
      cli(f, ["init"], [0], entry);
      assert.ok(
        readFileSync(
          path.join(f.project.root, f.integration.path),
          "utf8",
        ).includes("<slot />"),
      );
      passed = true;
    } finally {
      entry.status = passed ? "passed" : "failed";
      save();
    }
  });
}
