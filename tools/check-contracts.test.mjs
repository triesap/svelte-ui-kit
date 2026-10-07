#!/usr/bin/env node
/**
 * Focused regression tests for tools/check-contracts.mjs.
 *
 * Every fixture is a small allowlisted copy of the adopted contracts with a
 * *fixture-owned* lifecycle scenario: ledger statuses, sequence states,
 * summary counts and synthetic evidence are normalised to an explicit state,
 * and completion hashes come only from the fixture's own temporary Git
 * history. The live checkout's progress and real checkpoint commits are never
 * imported, so the suite passes whether the real repository has one, two or a
 * full sequence of completed checkpoints.
 *
 * Tests assert both the expected diagnostic and the CLI exit status, and prove
 * that default validation is read-only using lstat-based complete-tree
 * snapshots (directories, hidden/empty entries, modes, bytes, symlink targets
 * and entry kinds).
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstatSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildFixture,
  FIXTURE_FILES,
  git,
  reportRel,
  reviewRel,
  readLedgerStatuses,
  SCENARIOS,
  setLedgerCell,
  setSequenceCell,
  writeDerivedState,
  writeEvidence,
  writeEvidencePair,
  writeBatchAuthorization,
  BATCH_RCLD05,
} from "./check-contracts.fixtures.mjs";
import {
  computeFenceMask,
  EXPECTED_STEP_IDS,
  extractAnchorData,
  extractLinks,
  parseDefinitions,
  readBatchAuthorization,
  parseEvidenceRecords,
  parseLedger,
  parseSequenceBodies,
  parseSequenceMap,
  parseSequenceTitles,
  parseSourceInventory,
} from "./check-contracts.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..");
const TOOL = path.join(HERE, "check-contracts.mjs");
const PLAN_REL = "implementation/COMMIT_SEQUENCE.md";
const PLAN_JSON_REL = "implementation/COMMIT_SEQUENCE.json";
const SOURCES_JSON_REL = "references/SOURCES.json";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeFixture(opts = {}) {
  return buildFixture({ sourceRoot: REPO_ROOT, toolPath: TOOL, ...opts });
}

function withFixture(fn, opts) {
  const dir = makeFixture(opts);
  try {
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function read(root, rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

function write(root, rel, text) {
  writeFileSync(path.join(root, rel), text);
}

function append(root, rel, text) {
  write(root, rel, `${read(root, rel).replace(/\n*$/, "\n")}${text}\n`);
}

/** Extract the single live `checkpoint-evidence` object from a file. */
function liveRecord(root, rel) {
  const match = read(root, rel).match(
    /<!--\s*checkpoint-evidence\s*([\s\S]*?)-->/,
  );
  assert.ok(match, `no checkpoint-evidence record in ${rel}`);
  return JSON.parse(match[1]);
}

/** Point one checkpoint's ledger cell and both evidence records at `hash`. */
function pointCheckpointAt(root, id, hash) {
  for (const kind of ["report", "review"]) {
    const rel = kind === "report" ? reportRel(id) : reviewRel(id);
    const text = read(root, rel);
    const match = text.match(/"commit":\s*(?:null|"[0-9a-f]{40}")/);
    assert.ok(match, `no commit field in ${rel}`);
    write(
      root,
      rel,
      text.replace(match[0], `"commit":${JSON.stringify(hash)}`),
    );
  }
  setLedgerCell(root, id, 5, hash);
}

function runCli(root, ...args) {
  const result = spawnSync(process.execPath, [TOOL, "--root", root, ...args], {
    encoding: "utf8",
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

/** Regenerate the projection so a plan mutation is not masked by drift. */
function regenerate(root, expectedStatus) {
  const result = runCli(root, "--generate");
  if (expectedStatus !== undefined) {
    assert.equal(
      result.status,
      expectedStatus,
      `--generate exit ${result.status}: ${result.output}`,
    );
  }
  return result;
}

function snapshotTree(root) {
  const entries = [];
  const walk = (abs) => {
    const stat = lstatSync(abs);
    const rel = path.relative(root, abs).split(path.sep).join("/") || ".";
    if (stat.isDirectory()) {
      entries.push(`${rel}\tdir\t${(stat.mode & 0o7777).toString(8)}`);
      for (const name of readdirSync(abs).sort()) walk(path.join(abs, name));
    } else if (stat.isSymbolicLink()) {
      entries.push(`${rel}\tlink\t${readlinkSync(abs)}`);
    } else if (stat.isFile()) {
      const hash = createHash("sha256").update(readFileSync(abs)).digest("hex");
      entries.push(
        `${rel}\tfile\t${(stat.mode & 0o7777).toString(8)}\t${stat.size}\t${hash}`,
      );
    } else {
      entries.push(`${rel}\tother\t${(stat.mode & 0o7777).toString(8)}`);
    }
  };
  walk(root);
  return entries.join("\n");
}

/** Wrap the contiguous lines from a `start` match through an `end` match in a fence. */
function fenceBlock(text, startRe, endRe) {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => startRe.test(line));
  const end = lines.findIndex((line) => endRe.test(line));
  assert.ok(start !== -1 && end >= start, "fence boundaries not found");
  return [
    ...lines.slice(0, start),
    "```md",
    ...lines.slice(start, end + 1),
    "```",
    ...lines.slice(end + 1),
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Parser unit tests (no subprocess)
// ---------------------------------------------------------------------------

test("fence mask respects opening fence length", () => {
  const lines = [
    "````md",
    "```",
    "[fake](missing.md)",
    "```",
    "````",
    "[real](target.md)",
  ];
  assert.deepEqual(computeFenceMask(lines), [
    true,
    true,
    true,
    true,
    true,
    false,
  ]);
});

test("fence mask ignores inline code links but keeps real links", () => {
  const links = extractLinks("`[hidden](no.md)`\n[shown](yes.md)");
  assert.equal(links.length, 1);
  assert.equal(links[0].target, "yes.md");
});

test("reference-style links resolve and missing references are reported", () => {
  const links = extractLinks("[a][ref]\n[ref]: target.md\n[b][missing]");
  const resolved = links.find((link) => link.ref === "ref");
  assert.equal(resolved.target, "target.md");
  const missing = links.find((link) => link.ref === "missing");
  assert.equal(missing.missingRef, true);
});

test("explicit anchors are distinguished from heading slugs", () => {
  const data = extractAnchorData(
    '<a id="dup"></a>\n# Dup\n# Dup\n<a id="dup"></a>',
  );
  assert.deepEqual(data.duplicateExplicit, ["dup"]);
  assert.ok(data.slugSet.has("dup"));
  assert.ok(data.slugSet.has("dup-1"));
  assert.ok(!data.explicitSet.has("dup-1"));
});

test("plan parsers preserve 203 ordered definitions and 11 sequence bodies", () => {
  const text = read(REPO_ROOT, PLAN_REL);
  assert.equal(parseDefinitions(text).length, 203);
  assert.equal(parseLedger(text).length, 203);
  assert.equal(parseSequenceMap(text).length, 11);
  const bodies = parseSequenceBodies(text);
  assert.equal(bodies.length, 11);
  for (const body of bodies) {
    assert.equal(body.scopeCount, 1);
    assert.equal(body.greenCount, 1);
    assert.equal(body.verificationCount, 1);
  }
});

test("structural parsers ignore fenced literal examples", () => {
  const text = read(REPO_ROOT, PLAN_REL);
  const fenced = `${text}
\`\`\`md
### S999 — fake checkpoint

**Contract anchors:** R99.

### RCLD-99 — fake sequence

Checkpoints: S198–S199. State: not_started.

| S999 | RCLD-99 | S998 | not_started | — |
| [RCLD-99](#rcld-99) | S198–S199 | 2 | not_started | None |
| SRC99 | [fake](https://example.invalid) | boundary |
\`\`\`
`;
  assert.equal(parseDefinitions(fenced).length, 203);
  assert.equal(parseLedger(fenced).length, 203);
  assert.equal(parseSequenceMap(fenced).length, 11);
  assert.equal(parseSequenceBodies(fenced).length, 11);
  assert.equal(
    parseSequenceTitles(fenced)["RCLD-01"],
    "Baseline and verification harness",
  );
  assert.ok(!("RCLD-99" in parseSequenceTitles(fenced)));
  assert.equal(parseSourceInventory(fenced).length, 16);
});

test("live evidence opening without a terminator is a counted malformed attempt", () => {
  const text =
    '<!-- checkpoint-evidence\n{"schemaVersion":1,"checkpoint":"S002","kind":"report","commit":null,"disposition":"candidate"}\n';
  const { records, errors, count } = parseEvidenceRecords(text);
  assert.equal(count, 1, "the live attempt must be counted");
  assert.equal(records.length, 0);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /not terminated/);
});

test("clean evidence absence yields no records or diagnostics", () => {
  const { records, errors, count } = parseEvidenceRecords(
    "# heading\n\nno records here\n",
  );
  assert.equal(count, 0);
  assert.deepEqual(records, []);
  assert.deepEqual(errors, []);
});

test("fenced literal evidence contributes no records or delimiters", () => {
  const text = [
    "```md",
    "<!-- checkpoint-evidence {not json} -->",
    "<!-- checkpoint-evidence",
    "-->",
    "```",
    "",
    "<!-- checkpoint-evidence",
    '{"schemaVersion":1,"checkpoint":"S001","kind":"review","commit":null,"disposition":"accepted"}',
    "-->",
  ].join("\n");
  const { records, errors, count } = parseEvidenceRecords(text);
  assert.equal(count, 1);
  assert.equal(records.length, 1);
  assert.equal(records[0].checkpoint, "S001");
  assert.deepEqual(errors, []);
});

test("unterminated extra attempt after a valid record is counted", () => {
  const record =
    '<!-- checkpoint-evidence\n{"schemaVersion":1,"checkpoint":"S001","kind":"review","commit":null,"disposition":"accepted"}\n-->';
  const { records, errors, count } = parseEvidenceRecords(
    `${record}\n\n<!-- checkpoint-evidence\n{"schemaVersion":1}`,
  );
  assert.equal(count, 2);
  assert.equal(records.length, 1);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /not terminated/);
});

test("a fenced closing delimiter does not terminate a live attempt", () => {
  const text = [
    "<!-- checkpoint-evidence",
    '{"schemaVersion":1,"checkpoint":"S002","kind":"report","commit":null,"disposition":"candidate"}',
    "```md",
    "-->",
    "```",
  ].join("\n");
  const { records, errors, count } = parseEvidenceRecords(text);
  assert.equal(count, 1);
  assert.equal(records.length, 0);
  assert.match(errors.join("\n"), /not terminated/);
});

// ---------------------------------------------------------------------------
// Fixture lifecycle design
// ---------------------------------------------------------------------------

test("fixture allowlist is explicit and excludes Git and build output", () => {
  assert.ok(FIXTURE_FILES.includes(PLAN_REL));
  assert.ok(FIXTURE_FILES.includes("specs/PRODUCT_SPEC.md"));
  assert.ok(FIXTURE_FILES.includes("AGENTS.md"));
  assert.equal(new Set(FIXTURE_FILES).size, FIXTURE_FILES.length);
  for (const rel of FIXTURE_FILES) {
    assert.ok(!rel.startsWith(".git"), `unexpected VCS entry: ${rel}`);
    assert.ok(
      !rel.includes("node_modules"),
      `unexpected dependency path: ${rel}`,
    );
    assert.ok(!rel.includes("/dist/"), `unexpected build path: ${rel}`);
  }
});

test("fixture completion hashes are fixture-owned post-commit values", () => {
  withFixture(
    (root) => {
      const log = git(root, "log", "--format=%H").trim().split("\n");
      assert.ok(log.length >= 3, "expected a base and per-checkpoint commits");
      for (const id of SCENARIOS.two.complete) {
        const record = liveRecord(root, reportRel(id));
        assert.ok(
          log.includes(record.commit),
          `${id} completion commit must exist only in the fixture history`,
        );
      }
    },
    { scenario: "two" },
  );
});

test("fixture construction failure cleans only its owned temporary allocation", (t) => {
  const parent = mkdtempSync(path.join(os.tmpdir(), "suik-contracts-owner-"));
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  // An unrelated live fixture in the ordinary namespace must be untouched.
  const unrelated = mkdtempSync(path.join(os.tmpdir(), "suik-contracts-"));
  t.after(() => rmSync(unrelated, { recursive: true, force: true }));

  assert.throws(
    () =>
      makeFixture({
        scenario: "s001",
        statusOverrides: new Map([["S001", "bogus"]]),
        ownedTempParent: parent,
      }),
    (error) => {
      assert.ok(
        error instanceof Error,
        "construction failure must surface an Error",
      );
      assert.match(
        error.message,
        /valid fixture scenario|bogus/,
        "the original construction error must be retained",
      );
      return true;
    },
  );

  assert.deepEqual(
    readdirSync(parent),
    [],
    "a failed owned fixture must leave no directory behind",
  );
  assert.ok(
    existsSync(unrelated),
    "an unrelated live fixture must not be removed by another invocation's cleanup",
  );
});

test("a cleanup failure never replaces the original construction error", (t) => {
  const parent = mkdtempSync(path.join(os.tmpdir(), "suik-contracts-owner-"));
  t.after(() => rmSync(parent, { recursive: true, force: true }));

  assert.throws(
    () =>
      makeFixture({
        scenario: "s001",
        ownedTempParent: parent,
        failAfterCopy: () => {
          throw new Error("injected construction failure");
        },
        cleanupRemove: () => {
          throw Object.assign(new Error("injected cleanup failure"), {
            code: "ENOTEMPTY",
          });
        },
        cleanupAttempts: 1,
      }),
    (error) => {
      assert.match(
        error.message,
        /injected construction failure/,
        "the original construction error must be preserved",
      );
      assert.match(
        error.message,
        /\[cleanup\] failed to remove owned fixture/,
        "the cleanup failure must be attached to the original error",
      );
      assert.ok(
        error.cleanupError instanceof Error,
        "the underlying cleanup error must be retained",
      );
      return true;
    },
  );

  // The injected cleanup failure intentionally left the allocation behind.
  assert.equal(
    readdirSync(parent).filter((name) => name.startsWith("suik-contracts-"))
      .length,
    1,
    "a failed cleanup must not be reported as a removed fixture",
  );
});

test("owned-parent leak detection recognises a retained fixture", (t) => {
  const parent = mkdtempSync(path.join(os.tmpdir(), "suik-contracts-owner-"));
  t.after(() => rmSync(parent, { recursive: true, force: true }));

  const retained = makeFixture({ scenario: "s001", ownedTempParent: parent });
  const leaks = readdirSync(parent).filter((name) =>
    name.startsWith("suik-contracts-"),
  );
  assert.deepEqual(
    leaks,
    [path.basename(retained)],
    "a deliberately retained owned fixture must be detected",
  );

  rmSync(retained, { recursive: true, force: true });
  assert.deepEqual(readdirSync(parent), []);
});

// ---------------------------------------------------------------------------
// Baseline and read-only purity
// ---------------------------------------------------------------------------

test("adopted-document fixture validates clean", () => {
  withFixture((root) => {
    const result = runCli(root);
    assert.equal(result.status, 0, result.output);
    assert.match(result.stdout, /0 error\(s\)/);
  });
});

test("positive: post-commit hash workflow validates", () => {
  withFixture(
    (root) => {
      const fixtureHash = git(root, "rev-parse", "HEAD").trim();
      const committedReport = git(root, "show", `HEAD:${reportRel("S002")}`);
      assert.ok(
        !committedReport.includes(fixtureHash),
        "fixture hash must be recorded in the working tree after the commit",
      );
      const result = runCli(root);
      assert.equal(result.status, 0, result.output);
    },
    { scenario: "two" },
  );
});

test("two-complete and later-boundary scenarios validate with correct counts", () => {
  withFixture(
    (root) => {
      const projection = JSON.parse(read(root, PLAN_JSON_REL));
      assert.equal(
        projection.steps.filter((step) => step.status === "complete").length,
        2,
      );
      assert.equal(projection.sequences[0].state, "in_progress");
      assert.equal(runCli(root).status, 0);
    },
    { scenario: "two" },
  );
  withFixture(
    (root) => {
      const projection = JSON.parse(read(root, PLAN_JSON_REL));
      assert.equal(
        projection.steps.filter((step) => step.status === "complete").length,
        13,
      );
      assert.equal(projection.sequences[0].state, "complete");
      assert.equal(projection.sequences[1].state, "in_progress");
      assert.equal(runCli(root).status, 0);
    },
    { scenario: "boundary" },
  );
});

test("successful default validation is read-only across entry kinds", () => {
  withFixture((root) => {
    mkdirSync(path.join(root, ".empty-dir"));
    write(root, ".hidden-file", "hidden\n");
    symlinkSync("README.md", path.join(root, ".link-to-readme"));
    const before = snapshotTree(root);
    const result = runCli(root);
    assert.equal(result.status, 0, result.output);
    assert.equal(snapshotTree(root), before, "validation altered the tree");
  });
});

test("failing default validation is also read-only", () => {
  withFixture((root) => {
    append(root, "specs/SCOPE_AND_ASSUMPTIONS.md", "[missing](NOPE.md)");
    const before = snapshotTree(root);
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /BROKEN_LINK/);
    assert.equal(
      snapshotTree(root),
      before,
      "failing validation altered the tree",
    );
  });
});

// ---------------------------------------------------------------------------
// Retained baseline regressions
// ---------------------------------------------------------------------------

test("missing required contract is rejected", () => {
  withFixture((root) => {
    unlinkSync(path.join(root, "specs/PRODUCT_SPEC.md"));
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /MISSING_REQUIRED_FILE/);
    assert.match(result.output, /specs\/PRODUCT_SPEC\.md/);
  });
});

test("broken heading anchor is rejected", () => {
  withFixture((root) => {
    append(
      root,
      "specs/SCOPE_AND_ASSUMPTIONS.md",
      "[bad](PRODUCT_SPEC.md#no-such-heading)",
    );
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /BROKEN_ANCHOR/);
  });
});

test("duplicate acceptance identifier is rejected", () => {
  withFixture((root) => {
    append(root, "specs/ACCEPTANCE_CRITERIA.md", "AC01. Duplicated criterion.");
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /DUPLICATE_ID/);
  });
});

test("missing checkpoint definition identifier is rejected", () => {
  withFixture((root) => {
    const plan = read(root, PLAN_REL);
    write(root, PLAN_REL, plan.replace(/^### S100 — .*$/m, ""));
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /MISSING_ID/);
  });
});

test("projection drift is rejected", () => {
  withFixture((root) => {
    const projection = JSON.parse(read(root, PLAN_JSON_REL));
    projection.steps[0].status = "not_started";
    projection.steps[0].completion = null;
    write(root, PLAN_JSON_REL, `${JSON.stringify(projection, null, 2)}\n`);
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /PROJECTION_DRIFT/);
  });
});

test("source-inventory projection drift is rejected", () => {
  withFixture((root) => {
    const sources = JSON.parse(read(root, SOURCES_JSON_REL));
    sources.sources[0].url = "https://example.invalid/changed";
    write(root, SOURCES_JSON_REL, `${JSON.stringify(sources, null, 2)}\n`);
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /SOURCES_DRIFT/);
  });
});

test("missing completion-evidence file is rejected", () => {
  withFixture((root) => {
    unlinkSync(path.join(root, reportRel("S001")));
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /MISSING_COMPLETION_EVIDENCE/);
  });
});

// ---------------------------------------------------------------------------
// S002-R1 — completion evidence
// ---------------------------------------------------------------------------

test("empty completion review is rejected", () => {
  withFixture((root) => {
    write(root, reviewRel("S001"), "");
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /MISSING_COMPLETION_EVIDENCE/);
  });
});

test("explicitly rejected completion review is rejected", () => {
  withFixture((root) => {
    write(
      root,
      reviewRel("S001"),
      read(root, reviewRel("S001")).replace(
        '"disposition":"accepted"',
        '"disposition":"rejected"',
      ),
    );
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /MISSING_COMPLETION_EVIDENCE/);
  });
});

test("wrong checkpoint, kind or hash metadata is rejected", () => {
  withFixture((root) => {
    write(
      root,
      reviewRel("S001"),
      read(root, reviewRel("S001"))
        .replace('"checkpoint":"S001"', '"checkpoint":"S002"')
        .replace('"kind":"review"', '"kind":"report"'),
    );
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /MALFORMED_COMPLETION_EVIDENCE/);
  });
});

test("mismatched report/review hashes are rejected", () => {
  withFixture((root) => {
    write(
      root,
      reviewRel("S001"),
      read(root, reviewRel("S001")).replace(
        git(root, "rev-parse", "HEAD").trim(),
        "0".repeat(40),
      ),
    );
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /MISSING_COMPLETION_EVIDENCE/);
  });
});

test("malformed and duplicate metadata records are rejected", () => {
  withFixture((root) => {
    const body = read(root, reviewRel("S001"));
    write(
      root,
      reviewRel("S001"),
      body.replace(
        /<!-- checkpoint-evidence[\s\S]*?-->/,
        "<!-- checkpoint-evidence {not json} -->",
      ),
    );
    const malformed = runCli(root);
    assert.equal(malformed.status, 1);
    assert.match(malformed.output, /MALFORMED_COMPLETION_EVIDENCE/);

    write(root, reviewRel("S001"), body);
    append(
      root,
      reviewRel("S001"),
      '<!-- checkpoint-evidence {"schemaVersion":1,"checkpoint":"S001","kind":"review","commit":null,"disposition":"changes_requested"} -->',
    );
    const duplicate = runCli(root);
    assert.equal(duplicate.status, 1);
    assert.match(duplicate.output, /MALFORMED_COMPLETION_EVIDENCE/);
  });
});

test("fabricated hash with no Git is rejected", () => {
  withFixture(
    (root) => {
      pointCheckpointAt(root, "S001", "a".repeat(40));
      regenerate(root, 1);
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /no Git repository/);
    },
    { git: false },
  );
});

test("unreachable commit is rejected", () => {
  withFixture((root) => {
    git(root, "checkout", "-q", "-b", "side");
    append(root, "specs/SCOPE_AND_ASSUMPTIONS.md", "side change");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "side change");
    const side = git(root, "rev-parse", "HEAD").trim();
    git(root, "checkout", "-q", "master");
    pointCheckpointAt(root, "S001", side);
    regenerate(root, 1);
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /not reachable from HEAD/);
  });
});

test("missing committed evidence path is rejected", () => {
  withFixture((root) => {
    const base = git(root, "rev-parse", "HEAD").trim();
    const report = git(root, "show", `${base}:${reportRel("S001")}`);
    const review = git(root, "show", `${base}:${reviewRel("S001")}`);
    git(root, "rm", "-q", "-f", reportRel("S001"), reviewRel("S001"));
    git(root, "commit", "-q", "-m", "remove evidence");
    const removed = git(root, "rev-parse", "HEAD").trim();
    write(root, reportRel("S001"), report);
    write(root, reviewRel("S001"), review);
    pointCheckpointAt(root, "S001", removed);
    regenerate(root, 1);
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /does not exist at commit/);
  });
});

// ---------------------------------------------------------------------------
// S002-R7 — complete evidence lifecycle validation
// ---------------------------------------------------------------------------

test("in_progress candidate records validate with null commits", () => {
  withFixture((root) => {
    const record = liveRecord(root, reportRel("S002"));
    assert.equal(record.disposition, "candidate");
    assert.equal(record.commit, null);
    assert.equal(runCli(root).status, 0);
  });
});

test("precommit acceptance validates with implemented/accepted null hashes", () => {
  withFixture((root) => {
    setLedgerCell(root, "S002", 4, "verified_uncommitted");
    writeEvidencePair(root, "S002", {
      commit: null,
      report: "implemented",
      review: "accepted",
    });
    regenerate(root, 0);
    assert.equal(runCli(root).status, 0);
  });
});

test("verified_uncommitted requires both evidence records", () => {
  withFixture((root) => {
    setLedgerCell(root, "S002", 4, "verified_uncommitted");
    unlinkSync(path.join(root, reviewRel("S002")));
    regenerate(root, 1);
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /MISSING_COMPLETION_EVIDENCE/);
  });
});

test("verified_uncommitted rejects a committed hash", () => {
  withFixture((root) => {
    setLedgerCell(root, "S002", 4, "verified_uncommitted");
    const head = git(root, "rev-parse", "HEAD").trim();
    writeEvidencePair(root, "S002", {
      commit: head,
      report: "implemented",
      review: "accepted",
    });
    regenerate(root, 1);
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /null commit/);
  });
});

test("verified_uncommitted cannot unlock its successor", () => {
  withFixture((root) => {
    setLedgerCell(root, "S002", 4, "verified_uncommitted");
    writeEvidencePair(root, "S002", {
      commit: null,
      report: "implemented",
      review: "accepted",
    });
    setLedgerCell(root, "S003", 4, "in_progress");
    regenerate(root, 1);
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /PREMATURE_ADVANCEMENT/);
  });
});

test("committed completion unlocks its successor", () => {
  withFixture(
    (root) => {
      setLedgerCell(root, "S003", 4, "in_progress");
      regenerate(root, 0);
      assert.equal(runCli(root).status, 0);
    },
    { scenario: "two" },
  );
});

test("malformed candidate evidence is rejected", () => {
  withFixture((root) => {
    write(
      root,
      reportRel("S002"),
      read(root, reportRel("S002")).replace(
        /<!-- checkpoint-evidence[\s\S]*?-->/,
        "<!-- checkpoint-evidence {not json} -->",
      ),
    );
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /MALFORMED_COMPLETION_EVIDENCE/);
  });
});

test("duplicate candidate evidence records are rejected", () => {
  withFixture((root) => {
    append(
      root,
      reviewRel("S002"),
      '<!-- checkpoint-evidence {"schemaVersion":1,"checkpoint":"S002","kind":"review","commit":null,"disposition":"changes_requested"} -->',
    );
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /MALFORMED_COMPLETION_EVIDENCE/);
  });
});

test("non-object evidence payload is rejected", () => {
  withFixture((root) => {
    write(
      root,
      reportRel("S002"),
      read(root, reportRel("S002")).replace(
        /<!-- checkpoint-evidence[\s\S]*?-->/,
        "<!-- checkpoint-evidence [1,2,3] -->",
      ),
    );
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /must be a JSON object/);
  });
});

test("candidate record with an implemented disposition is rejected", () => {
  withFixture((root) => {
    writeEvidencePair(root, "S002", {
      commit: null,
      report: "implemented",
      review: "changes_requested",
    });
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /must be "candidate"/);
  });
});

test("non-complete candidate record with a commit hash is rejected", () => {
  withFixture((root) => {
    const head = git(root, "rev-parse", "HEAD").trim();
    writeEvidencePair(root, "S002", {
      commit: head,
      report: "candidate",
      review: "changes_requested",
    });
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /null commit/);
  });
});

test("synthetic transition candidate -> precommit acceptance -> committed completion", () => {
  withFixture((root) => {
    // 1. Candidate state from the fixture validates.
    assert.equal(runCli(root).status, 0);

    // 2. Codex acceptance with null hashes and no commit.
    setLedgerCell(root, "S002", 4, "verified_uncommitted");
    writeEvidencePair(root, "S002", {
      commit: null,
      report: "implemented",
      review: "accepted",
    });
    regenerate(root, 0);
    assert.equal(runCli(root).status, 0);

    // 3. Commit the accepted checkpoint, then record the post-commit hash.
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "fixture: commit S002");
    const hash = git(root, "rev-parse", "HEAD").trim();
    setLedgerCell(root, "S002", 4, "complete");
    writeEvidencePair(root, "S002", {
      commit: hash,
      report: "implemented",
      review: "accepted",
    });
    setLedgerCell(root, "S002", 5, hash);
    writeDerivedState(root, readLedgerStatuses(root));
    regenerate(root, 0);
    assert.equal(runCli(root).status, 0);

    // 4. Only the committed completion unlocks the successor.
    setLedgerCell(root, "S003", 4, "in_progress");
    regenerate(root, 0);
    assert.equal(runCli(root).status, 0);
  });
});

// ---------------------------------------------------------------------------
// S002-R2 — plan consistency
// ---------------------------------------------------------------------------

test("checkpoint assigned to an unknown sequence is rejected", () => {
  withFixture((root) => {
    setLedgerCell(root, "S100", 2, "RCLD-99");
    regenerate(root, 1);
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /INVALID_SEQUENCE/);
    assert.match(result.output, /S100 belongs to RCLD-06/);
  });
});

test("sequence falsely marked complete is rejected", () => {
  withFixture((root) => {
    setSequenceCell(root, "RCLD-11", 4, "complete");
    regenerate(root, 1);
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /INVALID_SEQUENCE/);
  });
});

test("removed sequence green gates are rejected", () => {
  withFixture((root) => {
    const text = read(root, PLAN_REL).replace(
      /^\*\*Definition of green:\*\*.*$/gm,
      "",
    );
    write(root, PLAN_REL, text);
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /Definition of green/);
  });
});

test("summary count drift is rejected", () => {
  withFixture((root) => {
    write(
      root,
      PLAN_REL,
      read(root, PLAN_REL).replace("**1 / 203**", "**2 / 203**"),
    );
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /INVALID_SUMMARY_COUNT/);
  });
});

test("not_applicable without a deviation is rejected", () => {
  withFixture((root) => {
    setLedgerCell(root, "S002", 4, "not_applicable");
    regenerate(root, 1);
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /NOT_APPLICABLE_WITHOUT_DEVIATION/);
  });
});

test("unknown checkpoint definition ID is rejected", () => {
  withFixture((root) => {
    append(
      root,
      PLAN_REL,
      "### S999 — Unknown step\n\n**Contract anchors:** R01.",
    );
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /UNKNOWN_ID/);
  });
});

test("unknown requirement ID is rejected", () => {
  withFixture((root) => {
    append(root, "specs/PRODUCT_SPEC.md", "| R99 | unknown |");
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /UNKNOWN_REQUIREMENT/);
  });
});

test("unknown acceptance criterion is rejected", () => {
  withFixture((root) => {
    append(root, "specs/ACCEPTANCE_CRITERIA.md", "AC99. Unknown criterion.");
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /UNKNOWN_ACCEPTANCE_CRITERION/);
  });
});

test("invalid status and predecessor remain rejected", () => {
  withFixture((root) => {
    setLedgerCell(root, "S003", 3, "S001");
    const predecessor = runCli(root);
    assert.equal(predecessor.status, 1);
    assert.match(predecessor.output, /INVALID_PREDECESSOR/);
  });
  withFixture((root) => {
    setLedgerCell(root, "S004", 4, "bogus");
    const status = runCli(root);
    assert.equal(status.status, 1);
    assert.match(status.output, /INVALID_STATUS/);
  });
});

test("premature successor advancement is rejected", () => {
  withFixture((root) => {
    setLedgerCell(root, "S003", 4, "in_progress");
    regenerate(root, 1);
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /PREMATURE_ADVANCEMENT/);
  });
});

// ---------------------------------------------------------------------------
// S002-R8 — fenced structural definitions
// ---------------------------------------------------------------------------

test("requirements inside a fenced example do not satisfy coverage", () => {
  withFixture((root) => {
    const fenced = fenceBlock(
      read(root, "specs/PRODUCT_SPEC.md"),
      /^\| R01 \|/,
      /^\| R34 \|/,
    );
    write(root, "specs/PRODUCT_SPEC.md", fenced);
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /MISSING_REQUIREMENT/);
  });
});

test("acceptance criteria inside a fenced example do not satisfy coverage", () => {
  withFixture((root) => {
    const fenced = fenceBlock(
      read(root, "specs/ACCEPTANCE_CRITERIA.md"),
      /^AC01\./,
      /^AC22\./,
    );
    write(root, "specs/ACCEPTANCE_CRITERIA.md", fenced);
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /MISSING_ACCEPTANCE_CRITERION/);
  });
});

test("fenced example definitions introduce no false errors or drift", () => {
  withFixture((root) => {
    append(
      root,
      "specs/PRODUCT_SPEC.md",
      ["", "```md", "| R99 | fake requirement |", "```"].join("\n"),
    );
    append(
      root,
      "specs/ACCEPTANCE_CRITERIA.md",
      ["", "```md", "AC99. fake criterion.", "```"].join("\n"),
    );
    append(
      root,
      PLAN_REL,
      [
        "",
        "```md",
        "### S999 — fake checkpoint",
        "",
        "**Contract anchors:** R99.",
        "",
        "### RCLD-99 — fake sequence",
        "",
        "Checkpoints: S198–S199. State: not_started.",
        "",
        "| S999 | RCLD-99 | S998 | not_started | — |",
        "| [RCLD-99](#rcld-99) | S198–S199 | 2 | not_started | None |",
        "| SRC99 | [fake](https://example.invalid) | boundary |",
        "",
        "Completed implementation checkpoints: **9 / 203**. Remaining: **194 / 203**.",
        "Completed RCLD sequences: **3 / 11**. Remaining: **8 / 11**.",
        "```",
      ].join("\n"),
    );
    const result = runCli(root);
    assert.equal(result.status, 0, result.output);
  });
});

test("fenced evidence comments are not live checkpoint records", () => {
  withFixture((root) => {
    append(
      root,
      reportRel("S002"),
      [
        "```md",
        "<!-- checkpoint-evidence {this is not valid json} -->",
        "```",
      ].join("\n"),
    );
    const result = runCli(root);
    assert.equal(result.status, 0, result.output);
  });
});

test("duplicate sequence body is rejected", () => {
  withFixture((root) => {
    append(
      root,
      PLAN_REL,
      [
        "",
        "### RCLD-01 — Duplicated body",
        "",
        "Checkpoints: S001–S012. State: in_progress.",
        "",
        "**Scope:** duplicate.",
        "",
        "**Definition of green:** duplicate.",
        "",
        "**Verification lane:** duplicate.",
      ].join("\n"),
    );
    regenerate(root, 1);
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /DUPLICATE_ID/);
    assert.match(result.output, /duplicate sequence body: RCLD-01/);
  });
});

test("unknown sequence body is rejected", () => {
  withFixture((root) => {
    append(
      root,
      PLAN_REL,
      [
        "",
        "### RCLD-99 — Unknown body",
        "",
        "Checkpoints: S198–S199. State: not_started.",
      ].join("\n"),
    );
    regenerate(root, 1);
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /unknown sequence body: RCLD-99/);
  });
});

test("fenced sequence body is ignored", () => {
  withFixture((root) => {
    append(
      root,
      PLAN_REL,
      [
        "```md",
        "### RCLD-01 — Fake body",
        "",
        "Checkpoints: S001–S012. State: complete.",
        "```",
      ].join("\n"),
    );
    const result = runCli(root);
    assert.equal(result.status, 0, result.output);
  });
});

// ---------------------------------------------------------------------------
// S002-R3 — links and anchors
// ---------------------------------------------------------------------------

test("ordinary missing link is an error regardless of directory prefix", () => {
  withFixture((root) => {
    append(
      root,
      "specs/SCOPE_AND_ASSUMPTIONS.md",
      "[future](../src/lib/components/ui/button.md)",
    );
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /BROKEN_LINK/);
  });
});

test("annotated future deliverable warns and still passes", () => {
  withFixture((root) => {
    append(
      root,
      "specs/SCOPE_AND_ASSUMPTIONS.md",
      "[future](../src/lib/components/ui/button.md) <!-- future-deliverable: S100 -->",
    );
    const result = runCli(root);
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /FUTURE_DELIVERABLE_LINK/);
  });
});

test("annotation naming a complete or unknown checkpoint is rejected", () => {
  withFixture((root) => {
    append(
      root,
      "specs/SCOPE_AND_ASSUMPTIONS.md",
      "[future](../src/nope.md) <!-- future-deliverable: S001 -->",
    );
    const complete = runCli(root);
    assert.equal(complete.status, 1);
    assert.match(complete.output, /BROKEN_LINK/);
  });
  withFixture((root) => {
    append(
      root,
      "specs/SCOPE_AND_ASSUMPTIONS.md",
      "[future](../src/nope.md) <!-- future-deliverable: S999 -->",
    );
    const unknown = runCli(root);
    assert.equal(unknown.status, 1);
    assert.match(unknown.output, /not a known checkpoint/);
  });
});

test("missing reference-style link target is rejected", () => {
  withFixture((root) => {
    append(root, "specs/SCOPE_AND_ASSUMPTIONS.md", "[text][missingref]");
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /reference-style link target/);
  });
});

test("present reference-style link and code-formatted label resolve", () => {
  withFixture((root) => {
    append(
      root,
      "specs/SCOPE_AND_ASSUMPTIONS.md",
      "[`label`](PRODUCT_SPEC.md)\n[ref][product]\n[product]: PRODUCT_SPEC.md",
    );
    const result = runCli(root);
    assert.equal(result.status, 0, result.output);
  });
});

test("duplicate explicit HTML anchor id is rejected without suffixing", () => {
  withFixture((root) => {
    append(
      root,
      "specs/SCOPE_AND_ASSUMPTIONS.md",
      '<a id="dup-anchor"></a>\n<a id="dup-anchor"></a>\n[link](SCOPE_AND_ASSUMPTIONS.md#dup-anchor-1)',
    );
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /DUPLICATE_EXPLICIT_ID/);
    assert.match(result.output, /BROKEN_ANCHOR/);
  });
});

test("duplicate heading slug with numeric suffix resolves", () => {
  withFixture((root) => {
    append(
      root,
      "specs/SCOPE_AND_ASSUMPTIONS.md",
      "#### Repeated heading\n\n#### Repeated heading\n\n[suffix](SCOPE_AND_ASSUMPTIONS.md#repeated-heading-1)",
    );
    const result = runCli(root);
    assert.equal(result.status, 0, result.output);
  });
});

test("nested fences do not create or hide links", () => {
  withFixture((root) => {
    append(
      root,
      "specs/SCOPE_AND_ASSUMPTIONS.md",
      [
        "````md",
        "```",
        "[fake](missing.md)",
        "```",
        "````",
        "[real](PRODUCT_SPEC.md)",
      ].join("\n"),
    );
    const result = runCli(root);
    assert.equal(result.status, 0, result.output);
  });
});

test("explicit anchor links resolve", () => {
  withFixture((root) => {
    append(
      root,
      "specs/SCOPE_AND_ASSUMPTIONS.md",
      '<a id="custom-target"></a>\n[go](SCOPE_AND_ASSUMPTIONS.md#custom-target)',
    );
    const result = runCli(root);
    assert.equal(result.status, 0, result.output);
  });
});

// ---------------------------------------------------------------------------
// S002-R4 — explicit generation and determinism
// ---------------------------------------------------------------------------

test("explicit generation is byte-deterministic and validates afterward", () => {
  withFixture((root) => {
    const first = runCli(root, "--generate");
    assert.equal(first.status, 0, first.output);
    const firstBytes = read(root, PLAN_JSON_REL);
    const second = runCli(root, "--generate");
    assert.equal(second.status, 0, second.output);
    assert.equal(read(root, PLAN_JSON_REL), firstBytes);
    const validate = runCli(root);
    assert.equal(validate.status, 0, validate.output);
  });
});

test("source-inventory generation is byte-deterministic", () => {
  withFixture((root) => {
    const first = runCli(root, "--generate-sources");
    assert.equal(first.status, 0, first.output);
    const firstBytes = read(root, SOURCES_JSON_REL);
    const second = runCli(root, "--generate-sources");
    assert.equal(second.status, 0, second.output);
    assert.equal(read(root, SOURCES_JSON_REL), firstBytes);
  });
});

test("unknown CLI argument exits 2", () => {
  withFixture((root) => {
    const result = runCli(root, "--bogus");
    assert.equal(result.status, 2);
  });
});

// ---------------------------------------------------------------------------
// S002-R9 — live evidence record boundaries
// ---------------------------------------------------------------------------

test("optional candidate evidence missing its closing delimiter is rejected", () => {
  withFixture((root) => {
    write(
      root,
      reportRel("S002"),
      read(root, reportRel("S002")).replace(/-->/, ""),
    );
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /MALFORMED_COMPLETION_EVIDENCE/);
    assert.match(result.output, /not terminated/);
  });
});

test("required completion evidence missing its closing delimiter is rejected", () => {
  withFixture((root) => {
    write(
      root,
      reportRel("S001"),
      read(root, reportRel("S001")).replace(/-->/, ""),
    );
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /MALFORMED_COMPLETION_EVIDENCE/);
    assert.match(result.output, /not terminated/);
  });
});

test("unterminated extra record after a completed review is rejected", () => {
  withFixture((root) => {
    append(
      root,
      reviewRel("S001"),
      '<!-- checkpoint-evidence {"schemaVersion":1,"checkpoint":"S001","kind":"review","commit":null,"disposition":"accepted"}',
    );
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /MALFORMED_COMPLETION_EVIDENCE/);
    assert.match(result.output, /not terminated/);
  });
});

test("fenced unfinished example before a live required review leaves it valid", () => {
  withFixture((root) => {
    write(
      root,
      reviewRel("S001"),
      [
        "```md",
        "<!-- checkpoint-evidence",
        "```",
        "",
        read(root, reviewRel("S001")),
      ].join("\n"),
    );
    const result = runCli(root);
    assert.equal(result.status, 0, result.output);
  });
});

test("fenced unfinished example before a live candidate record leaves it valid", () => {
  withFixture((root) => {
    write(
      root,
      reportRel("S002"),
      [
        "```md",
        "<!-- checkpoint-evidence",
        "```",
        "",
        read(root, reportRel("S002")),
      ].join("\n"),
    );
    const result = runCli(root);
    assert.equal(result.status, 0, result.output);
  });
});

test("valid fenced example record is inert in a required state", () => {
  withFixture((root) => {
    append(
      root,
      reviewRel("S001"),
      [
        "```md",
        '<!-- checkpoint-evidence {"schemaVersion":1,"checkpoint":"S001","kind":"review","commit":null,"disposition":"rejected"} -->',
        "```",
      ].join("\n"),
    );
    const result = runCli(root);
    assert.equal(result.status, 0, result.output);
  });
});

test("fenced closing delimiter does not repair malformed live evidence", () => {
  withFixture((root) => {
    const trimmed = read(root, reportRel("S002"))
      .replace(/-->/, "")
      .replace(/\n*$/, "");
    write(
      root,
      reportRel("S002"),
      [trimmed, "```md", "-->", "```", ""].join("\n"),
    );
    const result = runCli(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /MALFORMED_COMPLETION_EVIDENCE/);
    assert.match(result.output, /not terminated/);
  });
});

test("clean optional evidence absence validates", () => {
  withFixture((root) => {
    assert.ok(!existsSync(path.join(root, reportRel("S003"))));
    assert.ok(!existsSync(path.join(root, reviewRel("S003"))));
    const result = runCli(root);
    assert.equal(result.status, 0, result.output);
  });
});

// ---------------------------------------------------------------------------
// Owner-authorized batch — committed_pending_review lifecycle
// ---------------------------------------------------------------------------

test("a pending-review checkpoint validates and unlocks its successor", () => {
  withFixture(
    (root) => {
      assert.equal(runCli(root).status, 0);
      setLedgerCell(root, "S008", 4, "in_progress");
      regenerate(root, 0);
      assert.equal(runCli(root).status, 0);
      // A second active coding checkpoint is still rejected.
      setLedgerCell(root, "S009", 4, "in_progress");
      regenerate(root, 1);
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /PREMATURE_ADVANCEMENT/);
    },
    { scenario: "pendingBatch" },
  );
});

test("every authorized batch checkpoint validates as pending review", () => {
  withFixture(
    (root) => {
      const result = runCli(root);
      assert.equal(result.status, 0, result.output);
    },
    { scenario: "pendingAll" },
  );
});

test("pending review keeps completion null and does not count as complete", () => {
  withFixture(
    (root) => {
      regenerate(root, 0);
      const projection = JSON.parse(read(root, PLAN_JSON_REL));
      const pending = projection.steps.filter(
        (step) => step.status === "committed_pending_review",
      );
      assert.equal(pending.length, 6);
      for (const step of pending) {
        assert.ok(
          ["S007", "S008", "S009", "S010", "S011", "S012"].includes(step.id),
          `unexpected pending step ${step.id}`,
        );
        assert.equal(step.completion, null, `${step.id} completion`);
      }
      const plan = read(root, PLAN_REL);
      assert.match(
        plan,
        /Completed implementation checkpoints: \*\*6 \/ 203\*\*/,
      );
      assert.match(
        plan,
        /Committed pending review: \*\*6 \/ 203\*\*\. Authored batch range: \*\*S007–S012\*\*\./,
      );
      assert.equal(
        runCli(root).status,
        0,
        "pending checkpoints must not complete RCLD-01",
      );
    },
    { scenario: "pendingAll" },
  );
});

test("an uncommitted predecessor cannot unlock a pending successor", () => {
  withFixture(
    (root) => {
      setLedgerCell(root, "S007", 4, "in_progress");
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /PREMATURE_ADVANCEMENT/);
    },
    { scenario: "pendingAll" },
  );
});

test("S013 cannot advance while S012 is only pending review", () => {
  withFixture(
    (root) => {
      setLedgerCell(root, "S013", 4, "in_progress");
      regenerate(root, 1);
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /PREMATURE_ADVANCEMENT/);
    },
    { scenario: "pendingAll" },
  );
});

test("S013 cannot be recorded as committed pending review", () => {
  withFixture(
    (root) => {
      setLedgerCell(root, "S013", 4, "committed_pending_review");
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /INVALID_STATUS/);
    },
    { scenario: "pendingAll" },
  );
});

test("a pending-review status without the batch authorization is rejected", () => {
  withFixture(
    (root) => {
      write(
        root,
        PLAN_REL,
        read(root, PLAN_REL).replace(/<!-- checkpoint-batch[\s\S]*?-->\n?/, ""),
      );
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /INVALID_STATUS/);
      assert.match(result.output, /authorized batch/);
    },
    { scenario: "pendingBatch" },
  );
});

test("a fenced batch authorization does not admit pending review", () => {
  withFixture(
    (root) => {
      write(
        root,
        PLAN_REL,
        fenceBlock(read(root, PLAN_REL), /^<!-- checkpoint-batch/, /^-->$/),
      );
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /INVALID_STATUS/);
    },
    { scenario: "pendingBatch" },
  );
});

test("malformed or non-approved batch authorizations are rejected", () => {
  const mutations = [
    ["widened range", (text) => text.replace('"last":"S012"', '"last":"S013"')],
    ["wrong mode", (text) => text.replace('"mode":"pfc"', '"mode":"batch"')],
    [
      "wrong sequence",
      (text) => text.replace('"sequence":"RCLD-01"', '"sequence":"RCLD-02"'),
    ],
    [
      "missing field",
      (text) => text.replace(',"review":"codex-after-sequence"', ""),
    ],
    [
      "unknown field",
      (text) =>
        text.replace(
          '"review":"codex-after-sequence"',
          '"review":"codex-after-sequence","extra":true',
        ),
    ],
    [
      "malformed JSON",
      (text) => text.replace(/\{"schemaVersion":1[^}]*\}/, "{not json}"),
    ],
  ];
  for (const [label, mutate] of mutations) {
    withFixture(
      (root) => {
        const text = read(root, PLAN_REL);
        const mutated = mutate(text);
        assert.notEqual(mutated, text, `${label} mutation must apply`);
        write(root, PLAN_REL, mutated);
        const result = runCli(root);
        assert.equal(result.status, 1, `${label}: ${result.output}`);
        assert.match(result.output, /INVALID_BATCH_AUTHORIZATION/, label);
      },
      { scenario: "pendingBatch" },
    );
  }
});

test("a duplicate batch authorization is rejected", () => {
  withFixture(
    (root) => {
      const record =
        '<!-- checkpoint-batch\n{"schemaVersion":1,"sequence":"RCLD-01","first":"S007","last":"S012","mode":"pfc","review":"codex-after-sequence"}\n-->';
      write(root, PLAN_REL, `${read(root, PLAN_REL)}\n${record}\n`);
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /INVALID_BATCH_AUTHORIZATION/);
    },
    { scenario: "pendingBatch" },
  );
});

test("pending review with an unresolvable implementation hash is rejected", () => {
  withFixture(
    (root) => {
      const fake = "f".repeat(40);
      setLedgerCell(root, "S007", 5, fake);
      writeEvidence(root, "S007", "report", {
        commit: fake,
        disposition: "candidate",
      });
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /does not resolve/);
    },
    { scenario: "pendingBatch" },
  );
});

test("pending review with an unreachable implementation commit is rejected", () => {
  withFixture(
    (root) => {
      git(root, "checkout", "-q", "-b", "side");
      append(root, "specs/SCOPE_AND_ASSUMPTIONS.md", "side change");
      git(root, "add", "-A");
      git(root, "commit", "-q", "-m", "side change");
      const side = git(root, "rev-parse", "HEAD").trim();
      git(root, "checkout", "-q", "master");
      setLedgerCell(root, "S007", 5, side);
      writeEvidence(root, "S007", "report", {
        commit: side,
        disposition: "candidate",
      });
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /not reachable from HEAD/);
    },
    { scenario: "pendingBatch" },
  );
});

test("pending review whose commit lacks its report path is rejected", () => {
  withFixture(
    (root) => {
      const base = git(root, "rev-list", "--max-parents=0", "HEAD").trim();
      setLedgerCell(root, "S007", 5, base);
      writeEvidence(root, "S007", "report", {
        commit: base,
        disposition: "candidate",
      });
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /does not contain its report path/);
    },
    { scenario: "pendingBatch" },
  );
});

test("pending review report commit must equal the ledger hash", () => {
  withFixture(
    (root) => {
      const base = git(root, "rev-list", "--max-parents=0", "HEAD").trim();
      writeEvidence(root, "S007", "report", {
        commit: base,
        disposition: "candidate",
      });
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /report commit must equal the ledger hash/);
    },
    { scenario: "pendingBatch" },
  );
});

test("pending review rejects accepted report and review dispositions", () => {
  withFixture(
    (root) => {
      const record = liveRecord(root, reportRel("S007"));
      writeEvidence(root, "S007", "report", {
        commit: record.commit,
        disposition: "implemented",
      });
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /must remain "candidate"/);
    },
    { scenario: "pendingBatch" },
  );
  withFixture(
    (root) => {
      writeEvidence(root, "S007", "review", {
        commit: null,
        disposition: "accepted",
      });
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(
        result.output,
        /review disposition must be "changes_requested"/,
      );
    },
    { scenario: "pendingBatch" },
  );
});

test("pending-review summary count and range drift are rejected", () => {
  withFixture(
    (root) => {
      write(
        root,
        PLAN_REL,
        read(root, PLAN_REL).replace("**1 / 203**", "**2 / 203**"),
      );
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /INVALID_SUMMARY_COUNT/);
    },
    { scenario: "pendingBatch" },
  );
  withFixture(
    (root) => {
      write(
        root,
        PLAN_REL,
        read(root, PLAN_REL).replace("**S007–S007**", "**S007–S008**"),
      );
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /INVALID_SUMMARY_COUNT/);
    },
    { scenario: "pendingBatch" },
  );
});

test("generation does not legitimize invalid pending evidence", () => {
  withFixture(
    (root) => {
      const fake = "f".repeat(40);
      setLedgerCell(root, "S007", 5, fake);
      writeEvidence(root, "S007", "report", {
        commit: fake,
        disposition: "candidate",
      });
      const result = runCli(root, "--generate");
      assert.equal(result.status, 1);
      assert.match(result.output, /does not resolve/);
    },
    { scenario: "pendingBatch" },
  );
});

// ---------------------------------------------------------------------------
// Current RCLD-02 batch — S013–S032 pending review
// ---------------------------------------------------------------------------

const RCLD02_BATCH_IDS = EXPECTED_STEP_IDS.slice(12, 32);

test("every RCLD-02 checkpoint validates as pending review", () => {
  withFixture(
    (root) => {
      const result = runCli(root);
      assert.equal(result.status, 0, result.output);
      const projection = JSON.parse(read(root, PLAN_JSON_REL));
      const pending = projection.steps.filter(
        (step) => step.status === "committed_pending_review",
      );
      assert.equal(pending.length, 20);
      for (const step of pending) {
        assert.ok(RCLD02_BATCH_IDS.includes(step.id), step.id);
        assert.equal(step.completion, null, `${step.id} completion`);
      }
      const plan = read(root, PLAN_REL);
      assert.match(
        plan,
        /Completed implementation checkpoints: \*\*12 \/ 203\*\*/,
      );
      assert.match(
        plan,
        /Committed pending review: \*\*20 \/ 203\*\*\. Authored batch range: \*\*S013–S032\*\*\./,
      );
    },
    { scenario: "rcld02All" },
  );
});

test("accepted S012 is required before S013 may be pending review", () => {
  withFixture(
    (root) => {
      setLedgerCell(root, "S012", 4, "in_progress");
      writeEvidencePair(root, "S012", {
        commit: null,
        report: "candidate",
        review: "changes_requested",
      });
      writeDerivedState(root, readLedgerStatuses(root));
      regenerate(root, 1);
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /PREMATURE_ADVANCEMENT/);
    },
    { scenario: "rcld02First" },
  );
});

test("an unreachable RCLD-02 pending implementation hash is rejected", () => {
  withFixture(
    (root) => {
      git(root, "checkout", "-q", "-b", "side");
      append(root, "specs/SCOPE_AND_ASSUMPTIONS.md", "side change");
      git(root, "add", "-A");
      git(root, "commit", "-q", "-m", "side change");
      const side = git(root, "rev-parse", "HEAD").trim();
      git(root, "checkout", "-q", "master");
      setLedgerCell(root, "S013", 5, side);
      writeEvidence(root, "S013", "report", {
        commit: side,
        disposition: "candidate",
      });
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /not reachable from HEAD/);
    },
    { scenario: "rcld02First" },
  );
});

test("RCLD-02 pending commits must respect predecessor order", () => {
  withFixture(
    (root) => {
      const base = (() => {
        git(root, "add", "-A");
        git(root, "commit", "-q", "-m", "settle pending evidence");
        return git(root, "rev-parse", "HEAD").trim();
      })();
      const writeS014 = () => {
        writeEvidence(root, "S014", "report", {
          commit: null,
          disposition: "candidate",
        });
        writeEvidence(root, "S014", "review", {
          commit: null,
          disposition: "changes_requested",
        });
      };
      // Two parallel commits off the settled base, each containing S014's
      // report alongside the already-committed S013 evidence.
      git(root, "checkout", "-q", "-b", "left", base);
      writeS014();
      git(root, "add", "-A");
      git(root, "commit", "-q", "-m", "left evidence");
      const left = git(root, "rev-parse", "HEAD").trim();
      git(root, "checkout", "-q", "master");
      git(root, "checkout", "-q", "-b", "right", base);
      writeS014();
      git(root, "add", "-A");
      git(root, "commit", "-q", "-m", "right evidence");
      const right = git(root, "rev-parse", "HEAD").trim();
      git(root, "checkout", "-q", "master");
      git(root, "merge", "-q", "--no-ff", "-m", "merge", "left", "right");

      // S013 resolves to `left`; S014 resolves to the parallel `right`, which
      // is reachable and contains its report but is not a descendant of S013.
      setLedgerCell(root, "S013", 5, left);
      writeEvidence(root, "S013", "report", {
        commit: left,
        disposition: "candidate",
      });
      setLedgerCell(root, "S014", 4, "committed_pending_review");
      setLedgerCell(root, "S014", 5, right);
      writeEvidence(root, "S014", "report", {
        commit: right,
        disposition: "candidate",
      });
      writeDerivedState(root, readLedgerStatuses(root));
      regenerate(root, 1);
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /is not a descendant of predecessor/);
    },
    { scenario: "rcld02First" },
  );
});

test("S033 cannot be recorded as pending review within the RCLD-02 batch", () => {
  withFixture(
    (root) => {
      setLedgerCell(root, "S033", 4, "committed_pending_review");
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /INVALID_STATUS/);
      assert.match(result.output, /authorized batch/);
    },
    { scenario: "rcld02All" },
  );
});

test("S033 cannot advance while S032 is only pending review", () => {
  withFixture(
    (root) => {
      setLedgerCell(root, "S033", 4, "in_progress");
      writeDerivedState(root, readLedgerStatuses(root));
      regenerate(root, 1);
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /PREMATURE_ADVANCEMENT/);
    },
    { scenario: "rcld02Last" },
  );
});

test("malformed or non-approved RCLD-02 authorizations are rejected", () => {
  const mutations = [
    ["widened range", (text) => text.replace('"last":"S032"', '"last":"S033"')],
    [
      "narrowed range",
      (text) => text.replace('"first":"S013"', '"first":"S014"'),
    ],
    [
      "wrong sequence",
      (text) => text.replace('"sequence":"RCLD-02"', '"sequence":"RCLD-03"'),
    ],
    ["wrong mode", (text) => text.replace('"mode":"pfc"', '"mode":"batch"')],
    [
      "unknown field",
      (text) =>
        text.replace(
          '"review":"codex-after-sequence"',
          '"review":"codex-after-sequence","extra":true',
        ),
    ],
    [
      "malformed JSON",
      (text) => text.replace(/\{"schemaVersion":1[^}]*\}/, "{not json}"),
    ],
  ];
  for (const [label, mutate] of mutations) {
    withFixture(
      (root) => {
        const text = read(root, PLAN_REL);
        const mutated = mutate(text);
        assert.notEqual(mutated, text, `${label} mutation must apply`);
        write(root, PLAN_REL, mutated);
        const result = runCli(root);
        assert.equal(result.status, 1, `${label}: ${result.output}`);
        assert.match(result.output, /INVALID_BATCH_AUTHORIZATION/, label);
      },
      { scenario: "rcld02First" },
    );
  }
});

test("synthetic atomic acceptance completes every RCLD-02 pending checkpoint", () => {
  withFixture(
    (root) => {
      assert.equal(runCli(root).status, 0, "pending batch must validate");
      git(root, "add", "-A");
      git(root, "commit", "-q", "-m", "fixture: RCLD-02 evidence commit");
      const evidence = git(root, "rev-parse", "HEAD").trim();
      for (const id of RCLD02_BATCH_IDS) {
        setLedgerCell(root, id, 4, "complete");
        setLedgerCell(root, id, 5, evidence);
        writeEvidencePair(root, id, {
          commit: evidence,
          report: "implemented",
          review: "accepted",
        });
      }
      writeDerivedState(root, readLedgerStatuses(root));
      regenerate(root, 0);
      const result = runCli(root);
      assert.equal(result.status, 0, result.output);
      const plan = read(root, PLAN_REL);
      assert.match(
        plan,
        /Completed implementation checkpoints: \*\*32 \/ 203\*\*/,
      );
      assert.match(
        plan,
        /Committed pending review: \*\*0 \/ 203\*\*\. Authored batch range: \*\*none\*\*\./,
      );
      const projection = JSON.parse(read(root, PLAN_JSON_REL));
      const rcl02 = projection.sequences.find((seq) => seq.id === "RCLD-02");
      assert.equal(rcl02.state, "complete");
      // S033 is now unlocked by the accepted S032.
      setLedgerCell(root, "S033", 4, "in_progress");
      writeDerivedState(root, readLedgerStatuses(root));
      regenerate(root, 0);
      assert.equal(runCli(root).status, 0);
    },
    { scenario: "rcld02All" },
  );
});

// ---------------------------------------------------------------------------
// Current RCLD-03 batch — S033–S063 pending review
// ---------------------------------------------------------------------------

const RCLD03_BATCH_IDS = EXPECTED_STEP_IDS.slice(32, 63);

test("every RCLD-03 checkpoint validates as pending review", () => {
  withFixture(
    (root) => {
      const result = runCli(root);
      assert.equal(result.status, 0, result.output);
      const projection = JSON.parse(read(root, PLAN_JSON_REL));
      const pending = projection.steps.filter(
        (step) => step.status === "committed_pending_review",
      );
      assert.equal(pending.length, 31);
      for (const step of pending) {
        assert.ok(RCLD03_BATCH_IDS.includes(step.id), step.id);
        assert.equal(step.completion, null, `${step.id} completion`);
      }
      const plan = read(root, PLAN_REL);
      assert.match(
        plan,
        /Completed implementation checkpoints: \*\*32 \/ 203\*\*/,
      );
      assert.match(
        plan,
        /Committed pending review: \*\*31 \/ 203\*\*\. Authored batch range: \*\*S033–S063\*\*\./,
      );
    },
    { scenario: "rcld03All" },
  );
});

test("accepted S032 is required before S033 may be pending review", () => {
  withFixture(
    (root) => {
      setLedgerCell(root, "S032", 4, "in_progress");
      writeEvidencePair(root, "S032", {
        commit: null,
        report: "candidate",
        review: "changes_requested",
      });
      writeDerivedState(root, readLedgerStatuses(root));
      regenerate(root, 1);
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /PREMATURE_ADVANCEMENT/);
    },
    { scenario: "rcld03First" },
  );
});

test("an unreachable RCLD-03 pending implementation hash is rejected", () => {
  withFixture(
    (root) => {
      git(root, "checkout", "-q", "-b", "side");
      append(root, "specs/SCOPE_AND_ASSUMPTIONS.md", "side change");
      git(root, "add", "-A");
      git(root, "commit", "-q", "-m", "side change");
      const side = git(root, "rev-parse", "HEAD").trim();
      git(root, "checkout", "-q", "master");
      setLedgerCell(root, "S033", 5, side);
      writeEvidence(root, "S033", "report", {
        commit: side,
        disposition: "candidate",
      });
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /not reachable from HEAD/);
    },
    { scenario: "rcld03First" },
  );
});

test("RCLD-03 pending commits must respect predecessor order", () => {
  withFixture(
    (root) => {
      const base = (() => {
        git(root, "add", "-A");
        git(root, "commit", "-q", "-m", "settle pending evidence");
        return git(root, "rev-parse", "HEAD").trim();
      })();
      const writeS034 = () => {
        writeEvidence(root, "S034", "report", {
          commit: null,
          disposition: "candidate",
        });
        writeEvidence(root, "S034", "review", {
          commit: null,
          disposition: "changes_requested",
        });
      };
      git(root, "checkout", "-q", "-b", "left", base);
      writeS034();
      git(root, "add", "-A");
      git(root, "commit", "-q", "-m", "left evidence");
      const left = git(root, "rev-parse", "HEAD").trim();
      git(root, "checkout", "-q", "master");
      git(root, "checkout", "-q", "-b", "right", base);
      writeS034();
      git(root, "add", "-A");
      git(root, "commit", "-q", "-m", "right evidence");
      const right = git(root, "rev-parse", "HEAD").trim();
      git(root, "checkout", "-q", "master");
      git(root, "merge", "-q", "--no-ff", "-m", "merge", "left", "right");

      setLedgerCell(root, "S033", 5, left);
      writeEvidence(root, "S033", "report", {
        commit: left,
        disposition: "candidate",
      });
      setLedgerCell(root, "S034", 4, "committed_pending_review");
      setLedgerCell(root, "S034", 5, right);
      writeEvidence(root, "S034", "report", {
        commit: right,
        disposition: "candidate",
      });
      writeDerivedState(root, readLedgerStatuses(root));
      regenerate(root, 1);
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /is not a descendant of predecessor/);
    },
    { scenario: "rcld03First" },
  );
});

test("S064 cannot be recorded as pending review within the RCLD-03 batch", () => {
  withFixture(
    (root) => {
      setLedgerCell(root, "S064", 4, "committed_pending_review");
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /INVALID_STATUS/);
      assert.match(result.output, /authorized batch/);
    },
    { scenario: "rcld03All" },
  );
});

test("S064 cannot advance while S063 is only pending review", () => {
  withFixture(
    (root) => {
      setLedgerCell(root, "S064", 4, "in_progress");
      writeDerivedState(root, readLedgerStatuses(root));
      regenerate(root, 1);
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /PREMATURE_ADVANCEMENT/);
    },
    { scenario: "rcld03Last" },
  );
});

test("malformed or non-approved RCLD-03 authorizations are rejected", () => {
  const mutations = [
    ["widened range", (text) => text.replace('"last":"S063"', '"last":"S064"')],
    [
      "narrowed range",
      (text) => text.replace('"first":"S033"', '"first":"S034"'),
    ],
    [
      "wrong sequence",
      (text) => text.replace('"sequence":"RCLD-03"', '"sequence":"RCLD-04"'),
    ],
    ["wrong mode", (text) => text.replace('"mode":"pfc"', '"mode":"batch"')],
    [
      "unknown field",
      (text) =>
        text.replace(
          '"review":"codex-after-sequence"',
          '"review":"codex-after-sequence","extra":true',
        ),
    ],
    [
      "malformed JSON",
      (text) => text.replace(/\{"schemaVersion":1[^}]*\}/, "{not json}"),
    ],
  ];
  for (const [label, mutate] of mutations) {
    withFixture(
      (root) => {
        const text = read(root, PLAN_REL);
        const mutated = mutate(text);
        assert.notEqual(mutated, text, `${label} mutation must apply`);
        write(root, PLAN_REL, mutated);
        const result = runCli(root);
        assert.equal(result.status, 1, `${label}: ${result.output}`);
        assert.match(result.output, /INVALID_BATCH_AUTHORIZATION/, label);
      },
      { scenario: "rcld03First" },
    );
  }
});

test("a duplicate RCLD-03 batch authorization is rejected", () => {
  withFixture(
    (root) => {
      const record =
        '<!-- checkpoint-batch\n{"schemaVersion":1,"sequence":"RCLD-03","first":"S033","last":"S063","mode":"pfc","review":"codex-after-sequence"}\n-->';
      write(root, PLAN_REL, `${read(root, PLAN_REL)}\n${record}\n`);
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /INVALID_BATCH_AUTHORIZATION/);
    },
    { scenario: "rcld03First" },
  );
});

test("a fenced RCLD-03 batch authorization does not admit pending review", () => {
  withFixture(
    (root) => {
      write(
        root,
        PLAN_REL,
        fenceBlock(read(root, PLAN_REL), /^<!-- checkpoint-batch/, /^-->$/),
      );
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /INVALID_STATUS/);
    },
    { scenario: "rcld03First" },
  );
});

test("synthetic atomic acceptance completes every RCLD-03 pending checkpoint", () => {
  withFixture(
    (root) => {
      assert.equal(runCli(root).status, 0, "pending batch must validate");
      git(root, "add", "-A");
      git(root, "commit", "-q", "-m", "fixture: RCLD-03 evidence commit");
      const evidence = git(root, "rev-parse", "HEAD").trim();
      for (const id of RCLD03_BATCH_IDS) {
        setLedgerCell(root, id, 4, "complete");
        setLedgerCell(root, id, 5, evidence);
        writeEvidencePair(root, id, {
          commit: evidence,
          report: "implemented",
          review: "accepted",
        });
      }
      writeDerivedState(root, readLedgerStatuses(root));
      regenerate(root, 0);
      const result = runCli(root);
      assert.equal(result.status, 0, result.output);
      const plan = read(root, PLAN_REL);
      assert.match(
        plan,
        /Completed implementation checkpoints: \*\*63 \/ 203\*\*/,
      );
      assert.match(
        plan,
        /Committed pending review: \*\*0 \/ 203\*\*\. Authored batch range: \*\*none\*\*\./,
      );
      const projection = JSON.parse(read(root, PLAN_JSON_REL));
      const rcl03 = projection.sequences.find((seq) => seq.id === "RCLD-03");
      assert.equal(rcl03.state, "complete");
      // S064 is now unlocked by the accepted S063.
      setLedgerCell(root, "S064", 4, "in_progress");
      writeDerivedState(root, readLedgerStatuses(root));
      regenerate(root, 0);
      assert.equal(runCli(root).status, 0);
    },
    { scenario: "rcld03All" },
  );
});

// ---------------------------------------------------------------------------
// Current RCLD-04 batch — S064–S077 pending review
// ---------------------------------------------------------------------------

const RCLD04_BATCH_IDS = EXPECTED_STEP_IDS.slice(63, 77);

test("every RCLD-04 checkpoint validates as pending review", () => {
  withFixture(
    (root) => {
      const result = runCli(root);
      assert.equal(result.status, 0, result.output);
      const projection = JSON.parse(read(root, PLAN_JSON_REL));
      const pending = projection.steps.filter(
        (step) => step.status === "committed_pending_review",
      );
      assert.equal(pending.length, 14);
      for (const step of pending) {
        assert.ok(RCLD04_BATCH_IDS.includes(step.id), step.id);
        assert.equal(step.completion, null, `${step.id} completion`);
      }
      const plan = read(root, PLAN_REL);
      assert.match(
        plan,
        /Completed implementation checkpoints: \*\*63 \/ 203\*\*/,
      );
      assert.match(
        plan,
        /Committed pending review: \*\*14 \/ 203\*\*\. Authored batch range: \*\*S064–S077\*\*\./,
      );
    },
    { scenario: "rcld04All" },
  );
});

test("accepted S063 is required before S064 may be pending review", () => {
  withFixture(
    (root) => {
      setLedgerCell(root, "S063", 4, "in_progress");
      writeEvidencePair(root, "S063", {
        commit: null,
        report: "candidate",
        review: "changes_requested",
      });
      writeDerivedState(root, readLedgerStatuses(root));
      regenerate(root, 1);
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /PREMATURE_ADVANCEMENT/);
    },
    { scenario: "rcld04First" },
  );
});

test("an unreachable RCLD-04 pending implementation hash is rejected", () => {
  withFixture(
    (root) => {
      git(root, "checkout", "-q", "-b", "side");
      append(root, "specs/SCOPE_AND_ASSUMPTIONS.md", "side change");
      git(root, "add", "-A");
      git(root, "commit", "-q", "-m", "side change");
      const side = git(root, "rev-parse", "HEAD").trim();
      git(root, "checkout", "-q", "master");
      setLedgerCell(root, "S064", 5, side);
      writeEvidence(root, "S064", "report", {
        commit: side,
        disposition: "candidate",
      });
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /not reachable from HEAD/);
    },
    { scenario: "rcld04First" },
  );
});

test("RCLD-04 pending commits must respect predecessor order", () => {
  withFixture(
    (root) => {
      const base = (() => {
        git(root, "add", "-A");
        git(root, "commit", "-q", "-m", "settle pending evidence");
        return git(root, "rev-parse", "HEAD").trim();
      })();
      const writeS065 = () => {
        writeEvidence(root, "S065", "report", {
          commit: null,
          disposition: "candidate",
        });
        writeEvidence(root, "S065", "review", {
          commit: null,
          disposition: "changes_requested",
        });
      };
      git(root, "checkout", "-q", "-b", "left", base);
      writeS065();
      git(root, "add", "-A");
      git(root, "commit", "-q", "-m", "left evidence");
      const left = git(root, "rev-parse", "HEAD").trim();
      git(root, "checkout", "-q", "master");
      git(root, "checkout", "-q", "-b", "right", base);
      writeS065();
      git(root, "add", "-A");
      git(root, "commit", "-q", "-m", "right evidence");
      const right = git(root, "rev-parse", "HEAD").trim();
      git(root, "checkout", "-q", "master");
      git(root, "merge", "-q", "--no-ff", "-m", "merge", "left", "right");

      setLedgerCell(root, "S064", 5, left);
      writeEvidence(root, "S064", "report", {
        commit: left,
        disposition: "candidate",
      });
      setLedgerCell(root, "S065", 4, "committed_pending_review");
      setLedgerCell(root, "S065", 5, right);
      writeEvidence(root, "S065", "report", {
        commit: right,
        disposition: "candidate",
      });
      writeDerivedState(root, readLedgerStatuses(root));
      regenerate(root, 1);
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /is not a descendant of predecessor/);
    },
    { scenario: "rcld04First" },
  );
});

test("S078 cannot be recorded as pending review within the RCLD-04 batch", () => {
  withFixture(
    (root) => {
      setLedgerCell(root, "S078", 4, "committed_pending_review");
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /INVALID_STATUS/);
      assert.match(result.output, /authorized batch/);
    },
    { scenario: "rcld04All" },
  );
});

test("S078 cannot advance while S077 is only pending review", () => {
  withFixture(
    (root) => {
      setLedgerCell(root, "S078", 4, "in_progress");
      writeDerivedState(root, readLedgerStatuses(root));
      regenerate(root, 1);
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /PREMATURE_ADVANCEMENT/);
    },
    { scenario: "rcld04Last" },
  );
});

test("malformed or non-approved RCLD-04 authorizations are rejected", () => {
  const mutations = [
    ["widened range", (text) => text.replace('"last":"S077"', '"last":"S078"')],
    [
      "narrowed range",
      (text) => text.replace('"first":"S064"', '"first":"S065"'),
    ],
    [
      "wrong sequence",
      (text) => text.replace('"sequence":"RCLD-04"', '"sequence":"RCLD-05"'),
    ],
    ["wrong mode", (text) => text.replace('"mode":"pfc"', '"mode":"batch"')],
    [
      "unknown field",
      (text) =>
        text.replace(
          '"review":"codex-after-sequence"',
          '"review":"codex-after-sequence","extra":true',
        ),
    ],
    [
      "malformed JSON",
      (text) => text.replace(/\{"schemaVersion":1[^}]*\}/, "{not json}"),
    ],
  ];
  for (const [label, mutate] of mutations) {
    withFixture(
      (root) => {
        const text = read(root, PLAN_REL);
        const mutated = mutate(text);
        assert.notEqual(mutated, text, `${label} mutation must apply`);
        write(root, PLAN_REL, mutated);
        const result = runCli(root);
        assert.equal(result.status, 1, `${label}: ${result.output}`);
        assert.match(result.output, /INVALID_BATCH_AUTHORIZATION/, label);
      },
      { scenario: "rcld04First" },
    );
  }
});

test("a duplicate RCLD-04 batch authorization is rejected", () => {
  withFixture(
    (root) => {
      const record =
        '<!-- checkpoint-batch\n{"schemaVersion":1,"sequence":"RCLD-04","first":"S064","last":"S077","mode":"pfc","review":"codex-after-sequence"}\n-->';
      write(root, PLAN_REL, `${read(root, PLAN_REL)}\n${record}\n`);
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /INVALID_BATCH_AUTHORIZATION/);
    },
    { scenario: "rcld04First" },
  );
});

test("a fenced RCLD-04 batch authorization does not admit pending review", () => {
  withFixture(
    (root) => {
      write(
        root,
        PLAN_REL,
        fenceBlock(read(root, PLAN_REL), /^<!-- checkpoint-batch/, /^-->$/),
      );
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /INVALID_STATUS/);
    },
    { scenario: "rcld04First" },
  );
});

test("synthetic atomic acceptance completes every RCLD-04 pending checkpoint", () => {
  withFixture(
    (root) => {
      assert.equal(runCli(root).status, 0, "pending batch must validate");
      git(root, "add", "-A");
      git(root, "commit", "-q", "-m", "fixture: RCLD-04 evidence commit");
      const evidence = git(root, "rev-parse", "HEAD").trim();
      for (const id of RCLD04_BATCH_IDS) {
        setLedgerCell(root, id, 4, "complete");
        setLedgerCell(root, id, 5, evidence);
        writeEvidencePair(root, id, {
          commit: evidence,
          report: "implemented",
          review: "accepted",
        });
      }
      writeDerivedState(root, readLedgerStatuses(root));
      regenerate(root, 0);
      const result = runCli(root);
      assert.equal(result.status, 0, result.output);
      const plan = read(root, PLAN_REL);
      assert.match(
        plan,
        /Completed implementation checkpoints: \*\*77 \/ 203\*\*/,
      );
      assert.match(
        plan,
        /Committed pending review: \*\*0 \/ 203\*\*\. Authored batch range: \*\*none\*\*\./,
      );
      const projection = JSON.parse(read(root, PLAN_JSON_REL));
      const rcl04 = projection.sequences.find((seq) => seq.id === "RCLD-04");
      assert.equal(rcl04.state, "complete");
      // S078 is now unlocked by the accepted S077.
      setLedgerCell(root, "S078", 4, "in_progress");
      writeDerivedState(root, readLedgerStatuses(root));
      regenerate(root, 0);
      assert.equal(runCli(root).status, 0);
    },
    { scenario: "rcld04All" },
  );
});

// ---------------------------------------------------------------------------
// Governance compatibility and the atomic batch-acceptance transition
// ---------------------------------------------------------------------------

/** Remove the single live batch authorization block from a fixture plan. */
function removeBatchAuthorization(root) {
  const text = read(root, PLAN_REL);
  const stripped = text.replace(/<!-- checkpoint-batch[\s\S]*?-->\n?/, "");
  assert.notEqual(stripped, text, "the batch authorization must be removed");
  write(root, PLAN_REL, stripped);
}

/** Remove the top-level committed-pending-review summary line. */
function removePendingSummary(root) {
  const text = read(root, PLAN_REL);
  const stripped = text.replace(/^- Committed pending review:.*\n/m, "");
  assert.notEqual(stripped, text, "the pending summary line must be removed");
  write(root, PLAN_REL, stripped);
}

const BATCH_IDS = ["S007", "S008", "S009", "S010", "S011", "S012"];

test("a historical plan without batch authorization or pending state needs no pending summary", () => {
  withFixture(
    (root) => {
      removeBatchAuthorization(root);
      removePendingSummary(root);
      regenerate(root, 0);
      const result = runCli(root);
      assert.equal(result.status, 0, result.output);
    },
    { scenario: "two" },
  );
});

test("a present pending summary must stay accurate even without a batch", () => {
  withFixture(
    (root) => {
      removeBatchAuthorization(root);
      write(
        root,
        PLAN_REL,
        read(root, PLAN_REL).replace(
          /Committed pending review: \*\*0 \/ 203\*\*/,
          "Committed pending review: **3 / 203**",
        ),
      );
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /INVALID_SUMMARY_COUNT/);
    },
    { scenario: "two" },
  );
});

test("synthetic atomic acceptance completes all six pending checkpoints", () => {
  withFixture(
    (root) => {
      // 1. The pending batch validates.
      assert.equal(runCli(root).status, 0, "pending batch must validate");

      // 2. A green evidence commit E contains both evidence paths per
      //    checkpoint (already present) and the pending records.
      git(root, "add", "-A");
      git(root, "commit", "-q", "-m", "fixture: evidence commit E");
      const evidence = git(root, "rev-parse", "HEAD").trim();

      // 3. Atomic acceptance: all six become complete against E.
      for (const id of BATCH_IDS) {
        setLedgerCell(root, id, 4, "complete");
        setLedgerCell(root, id, 5, evidence);
        writeEvidencePair(root, id, {
          commit: evidence,
          report: "implemented",
          review: "accepted",
        });
      }
      writeDerivedState(root, readLedgerStatuses(root));
      regenerate(root, 0);
      const result = runCli(root);
      assert.equal(result.status, 0, result.output);

      const plan = read(root, PLAN_REL);
      assert.match(
        plan,
        /Completed implementation checkpoints: \*\*12 \/ 203\*\*/,
      );
      assert.match(
        plan,
        /Committed pending review: \*\*0 \/ 203\*\*\. Authored batch range: \*\*none\*\*\./,
      );
      const projection = JSON.parse(read(root, PLAN_JSON_REL));
      const rcl01 = projection.sequences.find((seq) => seq.id === "RCLD-01");
      assert.equal(rcl01.state, "complete");

      // 4. S013 is now unlocked by the accepted S012.
      setLedgerCell(root, "S013", 4, "in_progress");
      writeDerivedState(root, readLedgerStatuses(root));
      regenerate(root, 0);
      assert.equal(runCli(root).status, 0);
    },
    { scenario: "pendingAll" },
  );
});

test("partial acceptance of a pending prefix preserves the remaining pending ancestry", () => {
  withFixture(
    (root) => {
      // Accept S007 at its own already-committed pending implementation hash
      // (the real implementation commit), not a later evidence commit, so the
      // remaining pending commits stay descendants of the accepted predecessor.
      const row = read(root, PLAN_REL)
        .split("\n")
        .find((line) => line.startsWith("| S007 |"));
      const implementationHash = row.match(/\b[0-9a-f]{40}\b/)[0];
      setLedgerCell(root, "S007", 4, "complete");
      setLedgerCell(root, "S007", 5, implementationHash);
      writeEvidencePair(root, "S007", {
        commit: implementationHash,
        report: "implemented",
        review: "accepted",
      });
      writeDerivedState(root, readLedgerStatuses(root));
      regenerate(root, 0);
      const result = runCli(root);
      assert.equal(result.status, 0, result.output);
      // S008–S012 remain pending and still validate.
      const statuses = readLedgerStatuses(root);
      for (const id of ["S008", "S009", "S010", "S011", "S012"]) {
        assert.equal(statuses.get(id), "committed_pending_review", id);
      }
    },
    { scenario: "pendingAll" },
  );
});

test("accepted completion with an unresolvable hash is rejected", () => {
  withFixture(
    (root) => {
      const fake = "f".repeat(40);
      setLedgerCell(root, "S009", 4, "complete");
      setLedgerCell(root, "S009", 5, fake);
      writeEvidencePair(root, "S009", {
        commit: fake,
        report: "implemented",
        review: "accepted",
      });
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /does not resolve/);
    },
    { scenario: "pendingAll" },
  );
});

test("accepted completion with a missing review record is rejected", () => {
  withFixture(
    (root) => {
      git(root, "add", "-A");
      git(root, "commit", "-q", "-m", "fixture: evidence commit for S010");
      const evidence = git(root, "rev-parse", "HEAD").trim();
      unlinkSync(path.join(root, reviewRel("S010")));
      setLedgerCell(root, "S010", 4, "complete");
      setLedgerCell(root, "S010", 5, evidence);
      writeEvidence(root, "S010", "report", {
        commit: evidence,
        disposition: "implemented",
      });
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /MISSING_COMPLETION_EVIDENCE/);
    },
    { scenario: "pendingAll" },
  );
});

test("accepted completion with a changes_requested review is rejected", () => {
  withFixture(
    (root) => {
      git(root, "add", "-A");
      git(root, "commit", "-q", "-m", "fixture: evidence commit for S011");
      const evidence = git(root, "rev-parse", "HEAD").trim();
      setLedgerCell(root, "S011", 4, "complete");
      setLedgerCell(root, "S011", 5, evidence);
      writeEvidencePair(root, "S011", {
        commit: evidence,
        report: "implemented",
        review: "changes_requested",
      });
      const result = runCli(root);
      assert.equal(result.status, 1);
      assert.match(result.output, /disposition must be "accepted"/);
    },
    { scenario: "pendingAll" },
  );
});

test("RCLD-05 authorizes exactly the original CLI sequence after accepted S077", () => {
  withFixture(
    (root) => {
      const good = runCli(root);
      assert.equal(good.status, 0, good.output);
      const projection = JSON.parse(read(root, PLAN_JSON_REL));
      assert.equal(projection.steps[76].status, "complete");
      assert.deepEqual(
        projection.steps
          .filter((step) => step.status === "committed_pending_review")
          .map((step) => step.id),
        EXPECTED_STEP_IDS.slice(77, 91),
      );
      setLedgerCell(root, "S092", 4, "committed_pending_review");
      writeDerivedState(root, readLedgerStatuses(root));
      regenerate(root, 1);
      assert.match(
        runCli(root).output,
        /outside.*batch|not within.*batch|MISSING_COMPLETION_EVIDENCE/,
      );
    },
    { scenario: "rcld05All" },
  );
});

test("RCLD-05 rejects narrowed widened and incomplete authority", () => {
  withFixture(
    (root) => {
      for (const change of [
        { first: "S079" },
        { last: "S092" },
        { review: "self-accept" },
        { extra: true },
      ]) {
        writeBatchAuthorization(root, { ...BATCH_RCLD05, ...change });
        const issues = [];
        assert.equal(readBatchAuthorization(root, issues), null);
        assert.ok(
          issues.some((issue) => issue.code === "INVALID_BATCH_AUTHORIZATION"),
        );
      }
    },
    { scenario: "s001", git: false },
  );
});
