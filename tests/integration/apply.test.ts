import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  applyPlan,
  validateApplyPlan,
  type ApplyPlanInput,
  type ApplyTarget,
} from "../../src/codegen/apply.js";
import { capturePreimage } from "../../src/codegen/revalidate.js";
import { faultAtOccurrence } from "../../src/codegen/transaction-hooks.js";
import {
  lockPath,
  transactionsDir,
} from "../../src/codegen/transaction-types.js";

const UI = "src/lib/components/ui";
const STYLES = "src/styles";
const LAYOUT = "src/routes/+layout.svelte";
const STATE = `${UI}/_kit`;

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-apply-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const abs = (root: string, logical: string): string =>
  path.join(root, ...logical.split("/"));

function write(root: string, logical: string, text: string): void {
  const target = abs(root, logical);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text);
}

function lockBytes(configHash: string): Uint8Array {
  return new TextEncoder().encode(
    `${JSON.stringify(
      {
        schemaVersion: 1,
        toolVersion: "0.1.0",
        registryVersion: "0.1.0",
        registryHash: "a".repeat(64),
        configHash,
        requested: [],
        items: [],
        files: [],
        cssBlocks: [],
        integrations: [],
      },
      null,
      2,
    )}\n`,
  );
}

interface PlanOptions {
  readonly uiDir?: string;
  readonly stylesDir?: string;
  readonly layoutFile?: string;
  readonly lockConfigHash?: string;
  readonly metadataOnly?: boolean;
}

function makePlan(root: string, options: PlanOptions = {}): ApplyPlanInput {
  const uiDir = options.uiDir ?? UI;
  const stylesDir = options.stylesDir ?? STYLES;
  const layoutFile = options.layoutFile ?? LAYOUT;
  const stateDir = `${uiDir}/_kit`;

  // Live preimages.
  write(root, `${uiDir}/old.svelte`, "old component");
  write(root, `${uiDir}/keep.svelte`, "keep me");
  write(root, `${stylesDir}/kit.css`, "old css");
  write(root, layoutFile, "<script>old layout</script>");
  write(root, `${uiDir}/_kit/kit.json`, "old config");

  const targets: ApplyTarget[] = options.metadataOnly
    ? []
    : [
        {
          path: `${uiDir}/_kit/kit.json`,
          operation: "update",
          bytes: new TextEncoder().encode("new config\n"),
          mode: 0o644,
          preimage: capturePreimage(root, `${uiDir}/_kit/kit.json`),
        },
        {
          path: `${uiDir}/button.svelte`,
          operation: "create",
          bytes: new TextEncoder().encode("<button />\n"),
          mode: 0o644,
          preimage: capturePreimage(root, `${uiDir}/button.svelte`),
        },
        {
          path: `${stylesDir}/kit.css`,
          operation: "update",
          bytes: new TextEncoder().encode("new css\n"),
          mode: 0o644,
          preimage: capturePreimage(root, `${stylesDir}/kit.css`),
        },
        {
          path: layoutFile,
          operation: "update",
          bytes: new TextEncoder().encode("<script>new layout</script>\n"),
          mode: 0o644,
          preimage: capturePreimage(root, layoutFile),
        },
        {
          path: `${uiDir}/old.svelte`,
          operation: "retire",
          bytes: new Uint8Array(0),
          mode: 0o644,
          preimage: capturePreimage(root, `${uiDir}/old.svelte`),
        },
      ];

  return {
    root,
    stateDir,
    uiDir,
    stylesDir,
    layoutFile,
    rootIdentity: "a".repeat(64),
    planDigest: "b".repeat(64),
    targets,
    lock: {
      bytes: lockBytes(options.lockConfigHash ?? "d".repeat(64)),
      preimage: capturePreimage(root, lockPath(stateDir)),
    },
  };
}

function validated(plan: ApplyPlanInput) {
  const result = validateApplyPlan(plan);
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("plan invalid");
  return result.value;
}

test("a successful batch changes exactly the planned files and publishes last", () => {
  withRoot((root) => {
    const plan = makePlan(root);
    const outcome = applyPlan(validated(plan));
    assert.equal(outcome.kind, "applied");
    assert.equal(
      readFileSync(abs(root, `${UI}/_kit/kit.json`), "utf8"),
      "new config\n",
    );
    assert.equal(
      readFileSync(abs(root, `${UI}/button.svelte`), "utf8"),
      "<button />\n",
    );
    assert.equal(
      readFileSync(abs(root, `${STYLES}/kit.css`), "utf8"),
      "new css\n",
    );
    assert.equal(
      readFileSync(abs(root, LAYOUT), "utf8"),
      "<script>new layout</script>\n",
    );
    assert.equal(existsSync(abs(root, `${UI}/old.svelte`)), false);
    assert.equal(
      readFileSync(abs(root, `${UI}/keep.svelte`), "utf8"),
      "keep me",
    );
    assert.equal(
      JSON.parse(readFileSync(abs(root, lockPath(STATE)), "utf8")).configHash,
      "d".repeat(64),
    );
    assert.equal(
      existsSync(abs(root, transactionsDir(STATE))) &&
        readdirSync(abs(root, transactionsDir(STATE))).length > 0,
      false,
    );
  });
});

test("a stale plan refuses before any new write", () => {
  withRoot((root) => {
    const plan = makePlan(root);
    write(root, `${STYLES}/kit.css`, "user changed this");
    const outcome = applyPlan(validated(plan));
    assert.equal(outcome.kind, "refused");
    assert.match(
      outcome.issues.map((entry) => entry.message).join("; "),
      /changed since planning/,
    );
    assert.equal(
      readFileSync(abs(root, `${STYLES}/kit.css`), "utf8"),
      "user changed this",
    );
    assert.equal(existsSync(abs(root, `${UI}/button.svelte`)), false);
  });
});

test("partial, unsafe and out-of-root plans are rejected", () => {
  assert.equal(validateApplyPlan({}).ok, false);

  withRoot((root) => {
    const plan = makePlan(root);
    const outOfRoot = validateApplyPlan({
      ...plan,
      targets: [
        {
          path: "src/other/evil.css",
          operation: "create",
          bytes: new TextEncoder().encode("x"),
          mode: 0o644,
          preimage: {
            path: "src/other/evil.css",
            kind: "absent",
            digest: null,
            mode: null,
          },
        },
      ],
    });
    assert.equal(outOfRoot.ok, false);
    if (!outOfRoot.ok) {
      assert.equal(outOfRoot.issues[0].code, "PLAN_TARGET_UNAPPROVED");
    }
  });
});

test("a satisfied plan is a no-change with no transaction", () => {
  withRoot((root) => {
    const plan = makePlan(root, {
      metadataOnly: true,
      lockConfigHash: "d".repeat(64),
    });
    // Write the already-satisfied lock.
    write(root, lockPath(STATE), Buffer.from(plan.lock.bytes).toString("utf8"));
    const satisfied: ApplyPlanInput = {
      ...plan,
      lock: { ...plan.lock, preimage: capturePreimage(root, lockPath(STATE)) },
    };
    const outcome = applyPlan(validated(satisfied));
    assert.equal(outcome.kind, "no_change");
    assert.equal(existsSync(abs(root, transactionsDir(STATE))), false);
  });
});

test("a metadata-only plan publishes the lock without touching sources", () => {
  withRoot((root) => {
    const plan = makePlan(root, { metadataOnly: true });
    const outcome = applyPlan(validated(plan));
    assert.equal(outcome.kind, "applied");
    assert.equal(
      readFileSync(abs(root, `${UI}/keep.svelte`), "utf8"),
      "keep me",
    );
    assert.equal(
      JSON.parse(readFileSync(abs(root, lockPath(STATE)), "utf8")).configHash,
      "d".repeat(64),
    );
  });
});

test("a custom mapping applies only within its approved roots", () => {
  withRoot((root) => {
    const plan = makePlan(root, {
      uiDir: "app/ui",
      stylesDir: "app/styles",
      layoutFile: "app/routes/+layout.svelte",
    });
    const outcome = applyPlan(validated(plan));
    assert.equal(outcome.kind, "applied");
    assert.equal(
      readFileSync(abs(root, "app/ui/button.svelte"), "utf8"),
      "<button />\n",
    );
    assert.equal(existsSync(abs(root, "app/ui/old.svelte")), false);
    assert.equal(existsSync(abs(root, lockPath("app/ui/_kit"))), true);
  });
});

test("a recoverable failure rolls back and preserves a consistent state", () => {
  withRoot((root) => {
    const plan = makePlan(root);
    const outcome = applyPlan(
      validated(plan),
      faultAtOccurrence("replace:apply", 2),
    );
    assert.equal(outcome.kind, "refused");
    // The batch is rolled back to the exact preimages: no partial writes remain.
    assert.equal(
      readFileSync(abs(root, `${UI}/_kit/kit.json`), "utf8"),
      "old config",
    );
    assert.equal(existsSync(abs(root, `${UI}/button.svelte`)), false);
    assert.equal(
      readFileSync(abs(root, `${STYLES}/kit.css`), "utf8"),
      "old css",
    );
    assert.equal(
      readFileSync(abs(root, LAYOUT), "utf8"),
      "<script>old layout</script>",
    );
    assert.equal(
      readFileSync(abs(root, `${UI}/old.svelte`), "utf8"),
      "old component",
    );
    assert.equal(
      existsSync(abs(root, transactionsDir(STATE))) &&
        readdirSync(abs(root, transactionsDir(STATE))).length > 0,
      false,
    );
  });
});
