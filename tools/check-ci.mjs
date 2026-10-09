/** Repository-owned CI coverage policy; actionlint separately checks Actions syntax. */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "yaml";

const root = fileURLToPath(new URL("../", import.meta.url));
export const CI_ACTIONS = Object.freeze({
  checkout: "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
  pnpm: "pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413",
  node: "actions/setup-node@820762786026740c76f36085b0efc47a31fe5020",
});
export const FILESYSTEM_TESTS = Object.freeze(
  [
    "cleanup-restart-matrix",
    "docs-recovery",
    "durability-flush-paths",
    "durability-ordering",
    "filesystem-paths",
    "lock-publication",
    "platform-filesystem",
    "publication-witness",
    "recovery-invalid",
    "recovery-ownership",
    "recovery-prepublication",
    "recovery-published",
    "transaction-authority",
    "transaction-cleanup",
    "transaction-processes",
    "transaction-safety",
    "unchanged-state",
  ].map((name) => `tests/integration/${name}.test.ts`),
);
const bootstrap = Object.freeze([
  "node tools/prepare-native-dependency.mjs --fixture",
  "pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict",
]);
export const CI_LANES = Object.freeze({
  foundation: {
    minutes: 30,
    commands: [
      "pnpm run format:check",
      "pnpm run lint",
      "pnpm run typecheck",
      "pnpm run test:unit",
      "pnpm run test:harness",
      "pnpm run test:cli-bootstrap",
      "pnpm run check:ci",
      "pnpm run test:ci",
    ],
  },
  integration: { minutes: 120, commands: ["pnpm run test:integration"] },
  components: {
    minutes: 60,
    commands: [
      "pnpm run build",
      "pnpm run test:components",
      "pnpm run test:registry",
    ],
  },
  package: { minutes: 45, commands: ["pnpm run test:package"] },
  consumer: {
    minutes: 60,
    commands: [
      "pnpm run build",
      "pnpm run fixture:check",
      "pnpm run test:fixture",
    ],
  },
  browser: {
    minutes: 120,
    commands: [
      "pnpm run build",
      "pnpm exec playwright install --with-deps chromium",
      "pnpm run test:browser",
    ],
  },
  contracts: {
    minutes: 45,
    commands: ["pnpm run check:contracts", "pnpm run test:contracts"],
  },
  native: {
    minutes: 45,
    commands: [
      "node --test --test-concurrency=1 tools/build-native-dependency.test.mjs tools/prepare-native-dependency.test.mjs",
    ],
  },
  filesystem: {
    minutes: 60,
    commands: [
      "pnpm run build",
      `node tools/run-unit-tests.mjs --suite integration ${FILESYSTEM_TESTS.join(" ")}`,
    ],
  },
});
const scripts = Object.freeze({
  "format:check": "prettier --check .",
  lint: "eslint . --max-warnings 0",
  typecheck: [
    "tsconfig.json",
    "tsconfig.unit.json",
    "tsconfig.integration.json",
    "tsconfig.components.json",
    "tsconfig.registry.json",
    "tsconfig.package.json",
  ]
    .map((file) => `tsc -p ${file} --noEmit`)
    .join(" && "),
  build:
    "node tools/prepare-native-dependency.mjs && tsc -p tsconfig.json && node tools/prepare-native-dependency.mjs --bundle",
  "test:unit": "pnpm run build && node tools/run-unit-tests.mjs",
  "test:integration":
    "pnpm run build && node tools/run-unit-tests.mjs --suite integration",
  "test:components": "node tools/run-unit-tests.mjs --suite components",
  "test:registry":
    "pnpm run build && node tools/run-unit-tests.mjs --suite registry",
  "test:package":
    "pnpm run build && node tools/run-unit-tests.mjs --suite package",
  "test:harness": "node --test tools/run-unit-tests.test.mjs",
  "test:cli-bootstrap": "node --test tests/smoke/cli-bootstrap.test.mjs",
  "fixture:tokens:check": "node tools/project-token-fixture.mjs --check",
  "fixture:check":
    "pnpm run fixture:tokens:check && pnpm --dir tests/fixtures/consumer run check",
  "fixture:build":
    "pnpm run fixture:tokens:check && pnpm --dir tests/fixtures/consumer run build",
  "test:fixture":
    "pnpm run fixture:build && node --test --test-concurrency=1 tests/smoke/consumer-fixture.test.mjs tests/smoke/owned-server.test.mjs tests/smoke/lifecycle-consumer.test.mjs tests/smoke/q2-resulting-consumer.test.mjs",
  "test:browser":
    "pnpm run fixture:build && playwright test --config playwright.config.ts",
  "check:contracts": "node tools/check-contracts.mjs",
  "test:contracts": "node --test tools/check-contracts.test.mjs",
  "check:ci": "node tools/check-ci.mjs",
  "test:ci": "node --test tools/check-ci.test.mjs",
});
const record = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : record(value)
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;
const equal = (a, b) =>
  JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

export function checkCi(source, manifest, fixture, fixtureConfig) {
  const issues = [];
  const fail = (code, message) => issues.push({ code, message });
  let workflow;
  try {
    const document = parseDocument(source, {
      strict: true,
      uniqueKeys: true,
      stringKeys: true,
      version: "1.2",
    });
    if (document.errors.length || document.warnings.length)
      throw Error("invalid or ambiguous YAML");
    workflow = document.toJS({ maxAliasCount: 0 });
  } catch {
    return [
      {
        code: "CI_YAML",
        message: "The workflow must be one unambiguous YAML document.",
      },
    ];
  }
  if (!record(workflow))
    return [{ code: "CI_YAML", message: "The workflow must be a mapping." }];
  if (!equal(workflow.permissions, { contents: "read" }))
    fail("CI_PERMISSIONS", "Only read-only contents permission is approved.");
  if (
    !record(workflow.on) ||
    !equal(Object.keys(workflow.on).sort(), ["pull_request", "push"]) ||
    Object.values(workflow.on).some((value) => value !== null)
  )
    fail(
      "CI_TRIGGERS",
      "Unfiltered push and pull_request triggers must cover every source change.",
    );
  if (workflow.defaults || workflow.env || workflow.concurrency)
    fail(
      "CI_GLOBAL_OVERRIDE",
      "Global command or environment overrides require policy review.",
    );
  const jobs = workflow.jobs;
  if (!record(jobs))
    return [
      ...issues,
      {
        code: "CI_JOBS",
        message: "The workflow must define the acceptance jobs.",
      },
    ];
  if (!equal(Object.keys(jobs).sort(), Object.keys(CI_LANES).sort()))
    fail(
      "CI_JOB_COVERAGE",
      "Every approved isolated acceptance job must be present, with no unreviewed extra job.",
    );
  for (const [name, lane] of Object.entries(CI_LANES)) {
    const job = jobs[name];
    if (!record(job)) continue;
    if (job["timeout-minutes"] !== lane.minutes)
      fail(
        "CI_BUDGET",
        `${name}: retain the documented measured-lane timeout and headroom.`,
      );
    for (const key of [
      "if",
      "continue-on-error",
      "defaults",
      "env",
      "container",
      "services",
      "uses",
      "needs",
      "permissions",
      "environment",
      "outputs",
      "concurrency",
    ])
      if (key in job)
        fail(
          "CI_JOB_OVERRIDE",
          `${name}: ${key} changes independent execution or failure policy.`,
        );
    if (name === "filesystem") {
      if (
        job["runs-on"] !== "${{ matrix.os }}" ||
        !equal(job.strategy, {
          "fail-fast": false,
          matrix: { os: ["ubuntu-24.04", "macos-15"] },
        })
      )
        fail(
          "CI_PLATFORMS",
          "Keep independent Linux/macOS filesystem jobs without hiding failures.",
        );
    } else if (job["runs-on"] !== "ubuntu-24.04" || job.strategy)
      fail("CI_PLATFORMS", `${name}: the approved runner is ubuntu-24.04.`);
    const steps = job.steps;
    if (!Array.isArray(steps)) {
      fail("CI_STEPS", `${name}: steps are missing.`);
      continue;
    }
    const expectedActions = [
      {
        uses: CI_ACTIONS.checkout,
        with: { "fetch-depth": 0, "persist-credentials": false },
      },
      { uses: CI_ACTIONS.pnpm, with: { version: "11.22.0" } },
      {
        uses: CI_ACTIONS.node,
        with: { "node-version": "24.21.0", cache: "pnpm" },
      },
    ];
    expectedActions.forEach((expected, index) => {
      const step = steps[index];
      if (
        !record(step) ||
        step.uses !== expected.uses ||
        !equal(step.with, expected.with) ||
        "run" in step
      )
        fail(
          "CI_BOOTSTRAP",
          `${name}: use pinned actions, full independent history and exact toolchain setup.`,
        );
    });
    const expectedCommands = [...bootstrap, ...lane.commands];
    if (steps.length !== expectedCommands.length + 3)
      fail(
        "CI_COMMAND_COVERAGE",
        `${name}: command coverage is incomplete or unreviewed steps were added.`,
      );
    expectedCommands.forEach((expected, index) => {
      const step = steps[index + 3];
      if (
        !record(step) ||
        typeof step.run !== "string" ||
        step.run.trim().replace(/\s+/g, " ") !== expected ||
        "uses" in step
      )
        fail("CI_COMMAND_COVERAGE", `${name}: require ${expected}.`);
    });
    for (const step of steps) {
      if (
        !record(step) ||
        Object.keys(step).some(
          (key) => !["name", "uses", "with", "run"].includes(key),
        )
      )
        fail(
          "CI_STEP_OVERRIDE",
          `${name}: steps may not bypass checks, share writers or change runtime context.`,
        );
      if (record(step) && "run" in step && "with" in step)
        fail(
          "CI_STEP_OVERRIDE",
          `${name}: command steps cannot carry action configuration.`,
        );
    }
  }
  for (const [name, expected] of Object.entries(scripts))
    if (manifest?.scripts?.[name] !== expected)
      fail(
        "CI_SCRIPT_COVERAGE",
        `${name}: preserve its full repository-owned command without selectors or skipped checks.`,
      );
  if (
    manifest?.packageManager !== "pnpm@11.22.0" ||
    manifest?.devDependencies?.yaml !== "2.9.1"
  )
    fail(
      "CI_TOOLCHAIN",
      "The YAML policy parser and package manager must be explicit frozen pins.",
    );
  if (
    fixture?.scripts?.check !==
      "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --fail-on-warnings" ||
    fixture?.scripts?.build !== "vite build" ||
    fixtureConfig?.compilerOptions?.skipLibCheck !== false
  )
    fail(
      "CI_CONSUMER_COVERAGE",
      "The maintained consumer must retain actual strict check, warnings refusal and production build commands.",
    );
  return issues;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const issues = checkCi(
    readFileSync(path.join(root, ".github/workflows/ci.yml"), "utf8"),
    JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")),
    JSON.parse(
      readFileSync(
        path.join(root, "tests/fixtures/consumer/package.json"),
        "utf8",
      ),
    ),
    JSON.parse(
      readFileSync(
        path.join(root, "tests/fixtures/consumer/tsconfig.json"),
        "utf8",
      ),
    ),
  );
  for (const issue of issues)
    process.stderr.write(`${issue.code}: ${issue.message}\n`);
  process.stdout.write(
    `CI coverage: ${issues.length} issue(s), ${Object.keys(CI_LANES).length} isolated job definitions.\n`,
  );
  if (issues.length > 0) process.exitCode = 1;
}
