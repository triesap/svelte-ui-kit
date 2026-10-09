import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { parse, stringify } from "yaml";
import { checkCi, CI_LANES } from "./check-ci.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (file) =>
  readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const source = read(".github/workflows/ci.yml");
const manifest = JSON.parse(read("package.json"));
const fixture = JSON.parse(read("tests/fixtures/consumer/package.json"));
const fixtureConfig = JSON.parse(read("tests/fixtures/consumer/tsconfig.json"));
const actual = () => parse(source);
const errors = (
  workflow,
  pkg = manifest,
  consumer = fixture,
  config = fixtureConfig,
) =>
  checkCi(
    typeof workflow === "string" ? workflow : stringify(workflow),
    pkg,
    consumer,
    config,
  );
const has = (issues, code) =>
  assert.ok(
    issues.some((issue) => issue.code === code),
    JSON.stringify(issues),
  );

test("actual full acceptance workflow and its command implementations validate read-only", () => {
  assert.deepEqual(errors(source), []);
  const files = [
    ".github/workflows/ci.yml",
    "package.json",
    "pnpm-lock.yaml",
    "tests/fixtures/consumer/package.json",
    "tests/fixtures/consumer/tsconfig.json",
  ];
  const hashes = () =>
    files.map((file) => createHash("sha256").update(read(file)).digest("hex"));
  const before = hashes();
  const result = spawnSync(process.execPath, ["tools/check-ci.mjs"], {
    cwd: root,
    encoding: "utf8",
    timeout: 15000,
    killSignal: "SIGKILL",
  });
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /0 issue\(s\), 9 isolated job definitions/);
  assert.deepEqual(hashes(), before);
});

for (const job of Object.keys(CI_LANES))
  test(`omitting the ${job} lane is detected`, () => {
    const workflow = actual();
    delete workflow.jobs[job];
    has(errors(workflow), "CI_JOB_COVERAGE");
  });

test("equivalent mapping order and folded YAML commands preserve semantic coverage", () => {
  const workflow = actual();
  for (const job of Object.values(workflow.jobs))
    for (const step of job.steps)
      if (step.with)
        step.with = Object.fromEntries(Object.entries(step.with).reverse());
  workflow.jobs.filesystem.strategy = {
    matrix: { os: ["ubuntu-24.04", "macos-15"] },
    "fail-fast": false,
  };
  workflow.jobs.filesystem.steps.at(-1).run = workflow.jobs.filesystem.steps
    .at(-1)
    .run.replaceAll(" tests/", "\n  tests/");
  assert.deepEqual(errors(workflow), []);
});

test("a harness-only or otherwise selected browser command cannot certify the full suite", () => {
  for (const selector of [
    " tests/browser/harness.spec.ts",
    " --grep dialog",
    " --project chromium",
  ]) {
    const workflow = actual();
    workflow.jobs.browser.steps.at(-1).run += selector;
    has(errors(workflow), "CI_COMMAND_COVERAGE");
  }
  const pkg = structuredClone(manifest);
  pkg.scripts["test:browser"] += " tests/browser/harness.spec.ts";
  has(errors(source, pkg), "CI_SCRIPT_COVERAGE");
});

test("changing a package/component/integration script to a subset or masking failure is detected", () => {
  for (const name of [
    "test:package",
    "test:components",
    "test:integration",
    "test:docs",
    "typecheck",
    "test:fixture",
  ]) {
    const pkg = structuredClone(manifest);
    pkg.scripts[name] += " || true";
    has(errors(source, pkg), "CI_SCRIPT_COVERAGE");
  }
});

test("commented-out commands and an omitted producer/delivery control do not count as coverage", () => {
  const workflow = actual();
  workflow.jobs.native.steps.at(-1).run =
    "node --test tools/build-native-dependency.test.mjs # tools/prepare-native-dependency.test.mjs";
  has(errors(workflow), "CI_COMMAND_COVERAGE");
  workflow.jobs.contracts.steps.pop();
  has(errors(workflow), "CI_COMMAND_COVERAGE");
});

test("every job must prepare the native source before a real frozen strict install", () => {
  for (const name of Object.keys(CI_LANES)) {
    const workflow = actual();
    [workflow.jobs[name].steps[3], workflow.jobs[name].steps[4]] = [
      workflow.jobs[name].steps[4],
      workflow.jobs[name].steps[3],
    ];
    has(errors(workflow), "CI_COMMAND_COVERAGE");
    const relaxed = actual();
    relaxed.jobs[name].steps[4].run = "pnpm install --no-frozen-lockfile";
    has(errors(relaxed), "CI_COMMAND_COVERAGE");
  }
});

test("unpinned actions, wrong runtimes, partial history and retained credentials are refused", () => {
  for (const change of [
    (job) => {
      job.steps[0].uses = "actions/checkout@main";
    },
    (job) => {
      job.steps[0].with["fetch-depth"] = 1;
    },
    (job) => {
      job.steps[0].with["persist-credentials"] = true;
    },
    (job) => {
      job.steps[1].with.version = "latest";
    },
    (job) => {
      job.steps[2].with["node-version"] = "24";
    },
  ]) {
    const workflow = actual();
    change(workflow.jobs.foundation);
    has(errors(workflow), "CI_BOOTSTRAP");
  }
});

test("permissions, secrets, conditional skips, failure masks and shared workspace overrides fail closed", () => {
  const permissions = actual();
  permissions.permissions.contents = "write";
  has(errors(permissions), "CI_PERMISSIONS");
  for (const [key, value] of [
    ["if", "false"],
    ["continue-on-error", true],
    ["working-directory", "/shared"],
    ["env", { NODE_OPTIONS: "${{ secrets.RUNTIME }}" }],
    ["shell", "bash --noprofile --norc {0}"],
  ]) {
    const workflow = actual();
    workflow.jobs.integration.steps.at(-1)[key] = value;
    has(errors(workflow), "CI_STEP_OVERRIDE");
  }
  for (const key of [
    "defaults",
    "env",
    "needs",
    "permissions",
    "container",
    "services",
    "environment",
    "if",
    "continue-on-error",
  ]) {
    const workflow = actual();
    workflow.jobs.browser[key] = {};
    has(errors(workflow), "CI_JOB_OVERRIDE");
  }
  const transfer = actual();
  transfer.jobs.package.steps.push({ uses: "actions/download-artifact@main" });
  has(errors(transfer), "CI_COMMAND_COVERAGE");
});

test("both supported filesystem platforms and all owning safety files remain mandatory", () => {
  const workflow = actual();
  workflow.jobs.filesystem.strategy.matrix.os = ["ubuntu-24.04"];
  has(errors(workflow), "CI_PLATFORMS");
  const omitted = actual();
  omitted.jobs.filesystem.steps.at(-1).run = omitted.jobs.filesystem.steps
    .at(-1)
    .run.replace(" tests/integration/unchanged-state.test.ts", "");
  has(errors(omitted), "CI_COMMAND_COVERAGE");
  const narrowed = actual();
  narrowed.jobs.filesystem.steps.at(-1).run += " --test-name-pattern clean";
  has(errors(narrowed), "CI_COMMAND_COVERAGE");
});

test("unqualified 30-minute cumulative budgets, trigger filters and malformed YAML are refused", () => {
  const workflow = actual();
  workflow.jobs.integration["timeout-minutes"] = 30;
  has(errors(workflow), "CI_BUDGET");
  const filtered = actual();
  filtered.on.pull_request = { paths: ["src/**"] };
  has(errors(filtered), "CI_TRIGGERS");
  has(errors("jobs: [unterminated"), "CI_YAML");
  has(errors(source + "\njobs: {}\n"), "CI_YAML");
  has(errors(source + "\n---\nname: ignored\n"), "CI_YAML");
});

test("the consumer cannot silently skip libraries, ignore warnings or replace its real build", () => {
  const config = structuredClone(fixtureConfig);
  config.compilerOptions.skipLibCheck = true;
  has(errors(source, manifest, fixture, config), "CI_CONSUMER_COVERAGE");
  for (const field of ["check", "build"]) {
    const consumer = structuredClone(fixture);
    consumer.scripts[field] = "true";
    has(errors(source, manifest, consumer), "CI_CONSUMER_COVERAGE");
  }
});
