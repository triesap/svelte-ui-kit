/**
 * Deterministic, lifecycle-independent contract fixtures for the S002 validator
 * regression suite.
 *
 * A fixture is a small allowlisted copy of the adopted contract documents plus
 * a *fixture-owned* scenario: the checkpoint ledger, sequence states, summary
 * counts and synthetic `checkpoint-evidence` records are normalised to an
 * explicit lifecycle state, and completion hashes come only from the fixture's
 * own temporary Git history. The live checkout's progress, its Git objects and
 * its real checkpoint commits are never imported. Future product build output is
 * never copied because every fixture input is named in `FIXTURE_FILES`.
 *
 * This module is shared by `check-contracts.test.mjs` and by the isolated
 * advanced-state rehearsal script so both use exactly the same construction.
 */
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  ADOPTED_CONTRACTS,
  EXPECTED_SEQUENCES,
  EXPECTED_STEP_IDS,
} from "./check-contracts.mjs";

export const PLAN_REL = "implementation/COMMIT_SEQUENCE.md";
export const PLAN_JSON_REL = "implementation/COMMIT_SEQUENCE.json";
export const SOURCES_JSON_REL = "references/SOURCES.json";

/**
 * The complete allowlist of fixture inputs: the 27 approved contracts, the
 * governing plan, both derived projections, the package manifest and the
 * accepted-evidence qualification and exact catalog provenance/worksheets linked
 * by the adopted specification. Nothing
 * else is copied, so no authoring checkout state or future build artifact can
 * leak into a fixture.
 */
export const FIXTURE_FILES = [
  ...ADOPTED_CONTRACTS,
  PLAN_REL,
  PLAN_JSON_REL,
  SOURCES_JSON_REL,
  "package.json",
  "LICENSE-MIT",
  "implementation/evidence/RCLD-03_QUALIFICATION.md",
  "tests/fixtures/catalog-source.json",
  "specs/component-maps/alert.md",
  "specs/component-maps/alert-dialog.md",
  "specs/component-maps/anchor.md",
  "specs/component-maps/avatar.md",
  "specs/component-maps/badge.md",
  "specs/component-maps/button.md",
  "specs/component-maps/card.md",
  "specs/component-maps/checkbox.md",
  "specs/component-maps/collapsible.md",
  "specs/component-maps/dialog.md",
  "specs/component-maps/field.md",
  "specs/component-maps/identity.md",
  "specs/component-maps/menu.md",
  "specs/component-maps/progress.md",
  "specs/component-maps/radio.md",
  "specs/component-maps/router-link.md",
  "specs/component-maps/separator.md",
  "specs/component-maps/skeleton.md",
  "specs/component-maps/spinner.md",
  "specs/component-maps/status.md",
  "specs/component-maps/switch.md",
  "specs/component-maps/tabs.md",
  "specs/component-maps/tokens.md",
];

const SEQUENCE_BY_STEP = new Map();
for (const seq of EXPECTED_SEQUENCES) {
  const start = EXPECTED_STEP_IDS.indexOf(seq.first);
  for (let i = 0; i < seq.count; i++) {
    SEQUENCE_BY_STEP.set(EXPECTED_STEP_IDS[start + i], seq.id);
  }
}

/**
 * The approved owner-authorized batch tuples. A fixture explicitly sets
 * the batch record its scenario needs instead of inheriting whatever live
 * record the copied governing document currently carries, so historical
 * RCLD-01/RCLD-02 fixtures stay valid after the live payload transitions to
 * RCLD-03.
 */
export const BATCH_RCLD01 = {
  schemaVersion: 1,
  sequence: "RCLD-01",
  first: "S007",
  last: "S012",
  mode: "pfc",
  review: "codex-after-sequence",
};

export const BATCH_RCLD02 = {
  schemaVersion: 1,
  sequence: "RCLD-02",
  first: "S013",
  last: "S032",
  mode: "pfc",
  review: "codex-after-sequence",
};

export const BATCH_RCLD03 = {
  schemaVersion: 1,
  sequence: "RCLD-03",
  first: "S033",
  last: "S063",
  mode: "pfc",
  review: "codex-after-sequence",
};

export const BATCH_RCLD04 = {
  schemaVersion: 1,
  sequence: "RCLD-04",
  first: "S064",
  last: "S077",
  mode: "pfc",
  review: "codex-after-sequence",
};

export const BATCH_RCLD05 = {
  schemaVersion: 1,
  sequence: "RCLD-05",
  first: "S078",
  last: "S091",
  mode: "pfc",
  review: "codex-after-sequence",
};

export const BATCH_RCLD06 = {
  schemaVersion: 1,
  sequence: "RCLD-06",
  first: "S092",
  last: "S115",
  mode: "pfc",
  review: "codex-after-sequence",
};

export const BATCH_RCLD07 = {
  schemaVersion: 1,
  sequence: "RCLD-07",
  first: "S116",
  last: "S128",
  mode: "pfc",
  review: "codex-after-sequence",
};

export const BATCH_RCLD08 = {
  schemaVersion: 1,
  sequence: "RCLD-08",
  first: "S129",
  last: "S148",
  mode: "pfc",
  review: "codex-after-sequence",
};

export const BATCH_RCLD09 = {
  schemaVersion: 1,
  sequence: "RCLD-09",
  first: "S149",
  last: "S181",
  mode: "pfc",
  review: "codex-after-sequence",
};

/** Fixed, fixture-owned lifecycle scenarios. `s001` is the canonical negative
 * baseline (one complete checkpoint plus the active candidate); `two` and
 * `boundary` are positive states used to prove the suite is independent of how
 * far the real repository has progressed.
 */
export const SCENARIOS = {
  s001: { complete: ["S001"], candidates: ["S002"], accepted: [] },
  two: { complete: ["S001", "S002"], candidates: [], accepted: [] },
  boundary: {
    complete: EXPECTED_STEP_IDS.slice(0, 13),
    candidates: ["S014"],
    accepted: [],
  },
  // Owner-authorized historical RCLD-01 batch states: S001–S006 accepted,
  // then one or all of the S007–S012 implementation commits pending review.
  pendingBatch: {
    complete: EXPECTED_STEP_IDS.slice(0, 6),
    candidates: [],
    accepted: [],
    pendingReview: ["S007"],
    batch: BATCH_RCLD01,
  },
  pendingAll: {
    complete: EXPECTED_STEP_IDS.slice(0, 6),
    candidates: [],
    accepted: [],
    pendingReview: EXPECTED_STEP_IDS.slice(6, 12),
    batch: BATCH_RCLD01,
  },
  // Current RCLD-02 batch states: S001–S012 accepted, then one, several or all
  // of the S013–S032 implementation commits pending independent review.
  rcld02First: {
    complete: EXPECTED_STEP_IDS.slice(0, 12),
    candidates: [],
    accepted: [],
    pendingReview: ["S013"],
    batch: BATCH_RCLD02,
  },
  rcld02Prefix: {
    complete: EXPECTED_STEP_IDS.slice(0, 12),
    candidates: [],
    accepted: [],
    pendingReview: EXPECTED_STEP_IDS.slice(12, 16),
    batch: BATCH_RCLD02,
  },
  rcld02All: {
    complete: EXPECTED_STEP_IDS.slice(0, 12),
    candidates: [],
    accepted: [],
    pendingReview: EXPECTED_STEP_IDS.slice(12, 32),
    batch: BATCH_RCLD02,
  },
  rcld02Last: {
    complete: EXPECTED_STEP_IDS.slice(0, 31),
    candidates: [],
    accepted: [],
    pendingReview: ["S032"],
    batch: BATCH_RCLD02,
  },
  // Current RCLD-03 batch states: S001–S032 accepted, then one, several or all
  // of the S033–S063 implementation commits pending independent review.
  rcld03First: {
    complete: EXPECTED_STEP_IDS.slice(0, 32),
    candidates: [],
    accepted: [],
    pendingReview: ["S033"],
    batch: BATCH_RCLD03,
  },
  rcld03Prefix: {
    complete: EXPECTED_STEP_IDS.slice(0, 32),
    candidates: [],
    accepted: [],
    pendingReview: EXPECTED_STEP_IDS.slice(32, 36),
    batch: BATCH_RCLD03,
  },
  rcld03All: {
    complete: EXPECTED_STEP_IDS.slice(0, 32),
    candidates: [],
    accepted: [],
    pendingReview: EXPECTED_STEP_IDS.slice(32, 63),
    batch: BATCH_RCLD03,
  },
  rcld03Last: {
    complete: EXPECTED_STEP_IDS.slice(0, 62),
    candidates: [],
    accepted: [],
    pendingReview: ["S063"],
    batch: BATCH_RCLD03,
  },
  // Current RCLD-04 batch states: S001–S063 accepted, then one, several or all
  // of the S064–S077 transaction/recovery implementation commits pending
  // independent review.
  rcld04First: {
    complete: EXPECTED_STEP_IDS.slice(0, 63),
    candidates: [],
    accepted: [],
    pendingReview: ["S064"],
    batch: BATCH_RCLD04,
  },
  rcld04Prefix: {
    complete: EXPECTED_STEP_IDS.slice(0, 63),
    candidates: [],
    accepted: [],
    pendingReview: EXPECTED_STEP_IDS.slice(63, 67),
    batch: BATCH_RCLD04,
  },
  rcld04All: {
    complete: EXPECTED_STEP_IDS.slice(0, 63),
    candidates: [],
    accepted: [],
    pendingReview: EXPECTED_STEP_IDS.slice(63, 77),
    batch: BATCH_RCLD04,
  },
  rcld05All: {
    complete: EXPECTED_STEP_IDS.slice(0, 77),
    candidates: [],
    accepted: [],
    pendingReview: EXPECTED_STEP_IDS.slice(77, 91),
    batch: BATCH_RCLD05,
  },
  rcld06All: {
    complete: EXPECTED_STEP_IDS.slice(0, 91),
    candidates: [],
    accepted: [],
    pendingReview: EXPECTED_STEP_IDS.slice(91, 115),
    batch: BATCH_RCLD06,
  },
  rcld07All: {
    complete: EXPECTED_STEP_IDS.slice(0, 115),
    candidates: [],
    accepted: [],
    pendingReview: EXPECTED_STEP_IDS.slice(115, 128),
    batch: BATCH_RCLD07,
  },
  rcld08All: {
    complete: EXPECTED_STEP_IDS.slice(0, 128),
    candidates: [],
    accepted: [],
    pendingReview: EXPECTED_STEP_IDS.slice(128, 148),
    batch: BATCH_RCLD08,
  },
  rcld09All: {
    complete: EXPECTED_STEP_IDS.slice(0, 148),
    candidates: [],
    accepted: [],
    pendingReview: EXPECTED_STEP_IDS.slice(148, 181),
    batch: BATCH_RCLD09,
  },
  rcld04Last: {
    complete: EXPECTED_STEP_IDS.slice(0, 76),
    candidates: [],
    accepted: [],
    pendingReview: ["S077"],
    batch: BATCH_RCLD04,
  },
};

export const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: "Fixture Author",
  GIT_AUTHOR_EMAIL: "fixture@example.invalid",
  GIT_COMMITTER_NAME: "Fixture Author",
  GIT_COMMITTER_EMAIL: "fixture@example.invalid",
  GIT_AUTHOR_DATE: "2001-01-01T00:00:00Z",
  GIT_COMMITTER_DATE: "2001-01-01T00:00:00Z",
};

export function git(dir, ...args) {
  const result = spawnSync(
    "git",
    [
      "-C",
      dir,
      "-c",
      "commit.gpgsign=false",
      "-c",
      "tag.gpgsign=false",
      ...args,
    ],
    { encoding: "utf8", env: GIT_ENV },
  );
  if (result.status !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed (${result.status}): ${result.stderr}`,
    );
  }
  return result.stdout ?? "";
}

export function reportRel(id) {
  return `implementation/evidence/${id}_REPORT.md`;
}

export function reviewRel(id) {
  return `implementation/evidence/${id}_REVIEW.md`;
}

export function evidenceText(id, kind, commit, disposition) {
  const record = JSON.stringify({
    schemaVersion: 1,
    checkpoint: id,
    kind,
    commit,
    disposition,
  });
  return `# ${id} ${kind} evidence (fixture)\n\n<!-- checkpoint-evidence\n${record}\n-->\n`;
}

export function writeEvidence(root, id, kind, { commit = null, disposition }) {
  const rel = kind === "report" ? reportRel(id) : reviewRel(id);
  const abs = path.join(root, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, evidenceText(id, kind, commit, disposition));
}

export function writeEvidencePair(
  root,
  id,
  { commit = null, report = "candidate", review = "changes_requested" } = {},
) {
  writeEvidence(root, id, "report", { commit, disposition: report });
  writeEvidence(root, id, "review", { commit, disposition: review });
}

export function setLedgerCell(root, id, index, value) {
  const abs = path.join(root, PLAN_REL);
  const lines = readFileSync(abs, "utf8").split("\n");
  const rowIndex = lines.findIndex((line) => line.startsWith(`| ${id} |`));
  if (rowIndex === -1) throw new Error(`ledger row ${id} not found`);
  const cells = lines[rowIndex].split("|");
  cells[index] = ` ${value} `;
  lines[rowIndex] = cells.join("|");
  writeFileSync(abs, lines.join("\n"));
}

export function setSequenceCell(root, seqId, index, value) {
  const abs = path.join(root, PLAN_REL);
  const lines = readFileSync(abs, "utf8").split("\n");
  const rowIndex = lines.findIndex((line) => line.includes(`[${seqId}]`));
  if (rowIndex === -1) throw new Error(`sequence row ${seqId} not found`);
  const cells = lines[rowIndex].split("|");
  cells[index] = ` ${value} `;
  lines[rowIndex] = cells.join("|");
  writeFileSync(abs, lines.join("\n"));
}

export function deriveSequenceState(seqId, statuses) {
  const ids = EXPECTED_STEP_IDS.filter(
    (id) => SEQUENCE_BY_STEP.get(id) === seqId,
  );
  const states = ids.map((id) => statuses.get(id));
  if (states.every((state) => state === "complete")) return "complete";
  if (states.every((state) => state === "not_started")) return "not_started";
  return "in_progress";
}

/**
 * Recompute and rewrite the derived structural state (sequence map states,
 * sequence body states and both summary count lines) from `statuses` without
 * touching the checkpoint ledger cells. Used after a scenario transition so a
 * status change is reflected consistently across the whole plan.
 */
export function writeDerivedState(root, statuses) {
  const abs = path.join(root, PLAN_REL);
  let text = readFileSync(abs, "utf8");

  const mapLines = text.split("\n");
  for (let i = 0; i < mapLines.length; i++) {
    const m = mapLines[i].match(/^\|\s*\[(RCLD-\d{2})\]\(#/);
    if (!m) continue;
    const seq = EXPECTED_SEQUENCES.find((entry) => entry.id === m[1]);
    if (!seq) continue;
    const cells = mapLines[i].split("|");
    cells[4] = ` ${deriveSequenceState(seq.id, statuses)} `;
    mapLines[i] = cells.join("|");
  }
  text = mapLines.join("\n");

  text = text.replace(
    /^(Checkpoints: (S\d{3})[–-](S\d{3})\. State: )([a-z_]+)(\.)/gm,
    (whole, pre, first, last, _state, post) => {
      const seq = EXPECTED_SEQUENCES.find(
        (entry) => entry.first === first && entry.last === last,
      );
      if (!seq) return whole;
      return `${pre}${deriveSequenceState(seq.id, statuses)}${post}`;
    },
  );

  const completeCount = EXPECTED_STEP_IDS.filter(
    (id) => statuses.get(id) === "complete",
  ).length;
  const completeSequences = EXPECTED_SEQUENCES.filter(
    (seq) => deriveSequenceState(seq.id, statuses) === "complete",
  ).length;
  text = text.replace(
    /(Completed implementation checkpoints:\s*\*\*\s*)\d+(\s*\/\s*203\s*\*\*\.\s*Remaining:\s*\*\*\s*)\d+(\s*\/\s*203)/,
    (_m, a, b, c) => `${a}${completeCount}${b}${203 - completeCount}${c}`,
  );
  text = text.replace(
    /(Completed RCLD sequences:\s*\*\*\s*)\d+(\s*\/\s*11\s*\*\*\.\s*Remaining:\s*\*\*\s*)\d+(\s*\/\s*11)/,
    (_m, a, b, c) =>
      `${a}${completeSequences}${b}${11 - completeSequences}${c}`,
  );

  const pendingIds = EXPECTED_STEP_IDS.filter(
    (id) => statuses.get(id) === "committed_pending_review",
  );
  const pendingRange =
    pendingIds.length === 0
      ? "none"
      : `${pendingIds[0]}\u2013${pendingIds[pendingIds.length - 1]}`;
  text = text.replace(
    /(Committed pending review:\s*\*\*\s*)\d+(\s*\/\s*203\s*\*\*\.\s*Authored batch range:\s*\*\*\s*)[^*]+?(\s*\*\*\.)/,
    (_m, a, b, c) => `${a}${pendingIds.length}${b}${pendingRange}${c}`,
  );
  writeFileSync(abs, text);
}

/** Read the current per-checkpoint statuses from the plan ledger. */
export function readLedgerStatuses(root) {
  const statuses = new Map();
  const lines = readFileSync(path.join(root, PLAN_REL), "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^\|\s*(S\d{3})\s*\|/);
    if (!m) continue;
    const cells = line.split("|");
    if (!/^S\d{3}$/.test(cells[1].trim())) continue;
    statuses.set(cells[1].trim(), cells[4].trim());
  }
  return statuses;
}

/**
 * Rewrite the whole structural plan to `statuses`: every ledger status cell,
 * every sequence map state, every sequence body state and both summary count
 * lines. Complete rows start with a placeholder commit cell that is replaced
 * after the fixture commit exists.
 */
export function normalizePlan(root, statuses) {
  const abs = path.join(root, PLAN_REL);
  const lines = readFileSync(abs, "utf8").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\|\s*(S\d{3})\s*\|/);
    if (!m) continue;
    const cells = lines[i].split("|");
    if (!/^S\d{3}$/.test(cells[1].trim())) continue;
    const status = statuses.get(cells[1].trim());
    if (!status) continue;
    cells[4] = ` ${status} `;
    cells[5] = status === "complete" ? " `—` " : " — ";
    lines[i] = cells.join("|");
  }
  writeFileSync(abs, lines.join("\n"));
  writeDerivedState(root, statuses);
}

/**
 * Replace any live `checkpoint-batch` record in a fixture plan with `payload`.
 * Exactly one live record is written, so a fixture scenario never depends on
 * the live governing document's current authorization.
 */
export function writeBatchAuthorization(root, payload) {
  const abs = path.join(root, PLAN_REL);
  const text = readFileSync(abs, "utf8");
  const withoutLive = text.replace(/<!-- checkpoint-batch[\s\S]*?-->\n?/, "");
  const record = `<!-- checkpoint-batch\n${JSON.stringify(payload)}\n-->\n`;
  writeFileSync(abs, `${withoutLive}\n${record}`);
}

function copyFixtureInputs(sourceRoot, dir) {
  for (const rel of FIXTURE_FILES) {
    const src = path.join(sourceRoot, rel);
    if (!existsSync(src)) {
      throw new Error(`fixture input is missing: ${rel}`);
    }
    const dest = path.join(dir, rel);
    mkdirSync(path.dirname(dest), { recursive: true });
    cpSync(src, dest);
  }
}

export function runTool(toolPath, root, extraArgs = []) {
  return spawnSync(process.execPath, [toolPath, "--root", root, ...extraArgs], {
    encoding: "utf8",
  });
}

/** Cleanup error codes that a bounded retry can plausibly resolve. */
const TRANSIENT_CLEANUP_CODES = new Set([
  "ENOTEMPTY",
  "EBUSY",
  "EMFILE",
  "ENFILE",
  "EPERM",
]);

function sleepSync(milliseconds) {
  const buffer = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(buffer, 0, 0, milliseconds);
}

/**
 * Remove an owned fixture directory with a bounded number of retries for
 * transient directory errors. Returns normally on success and rethrows the
 * last cleanup error otherwise; it never silently swallows a failure.
 */
export function removeOwnedDir(
  dir,
  { attempts = 5, delayMs = 25, remove = rmSync } = {},
) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      remove(dir, { recursive: true, force: true });
      return;
    } catch (error) {
      lastError = error;
      const code = error && error.code;
      if (!TRANSIENT_CLEANUP_CODES.has(code) || attempt === attempts) break;
      sleepSync(delayMs * attempt);
    }
  }
  throw lastError ?? new Error(`could not remove owned fixture: ${dir}`);
}

/**
 * Attach a cleanup failure to the original construction error without
 * replacing or losing the original message, so a masked setup failure can
 * never be mistaken for a successful construction.
 */
function withCleanupFailure(error, dir, cleanupError) {
  const wrapped = error instanceof Error ? error : new Error(String(error));
  wrapped.cleanupError = cleanupError;
  wrapped.message = `${wrapped.message}\n[cleanup] failed to remove owned fixture ${dir}: ${cleanupError && cleanupError.message ? cleanupError.message : String(cleanupError)}`;
  return wrapped;
}

/**
 * Build a fixture into a fresh temporary directory. Returns the directory.
 * The caller owns cleanup. On any construction failure the partial fixture is
 * removed before the error is re-thrown.
 */
export function buildFixture({
  sourceRoot,
  toolPath,
  scenario = "s001",
  git: useGit = true,
  statusOverrides = null,
  ownedTempParent = os.tmpdir(),
  // Test-only seams: a caller may override directory removal or inject a
  // construction failure after the fixture inputs are copied. The production
  // path uses `removeOwnedDir` with its bounded transient retries.
  cleanupRemove = rmSync,
  cleanupAttempts = 5,
  failAfterCopy = null,
} = {}) {
  const spec = SCENARIOS[scenario];
  if (!spec) throw new Error(`unknown fixture scenario: ${scenario}`);
  if (typeof ownedTempParent !== "string" || ownedTempParent === "") {
    throw new Error("ownedTempParent must be a non-empty directory path");
  }
  mkdirSync(ownedTempParent, { recursive: true });
  const dir = mkdtempSync(path.join(ownedTempParent, "suik-contracts-"));
  try {
    copyFixtureInputs(sourceRoot, dir);
    if (typeof failAfterCopy === "function") failAfterCopy(dir);
    const statuses = new Map(
      EXPECTED_STEP_IDS.map((id) => [id, "not_started"]),
    );
    for (const id of spec.complete) statuses.set(id, "complete");
    for (const id of spec.accepted) statuses.set(id, "verified_uncommitted");
    for (const id of spec.candidates) statuses.set(id, "in_progress");
    for (const id of spec.pendingReview ?? []) {
      statuses.set(id, "committed_pending_review");
    }
    if (statusOverrides) {
      for (const [id, status] of statusOverrides) statuses.set(id, status);
    }
    normalizePlan(dir, statuses);
    if (spec.batch) writeBatchAuthorization(dir, spec.batch);
    for (const id of spec.candidates) {
      writeEvidencePair(dir, id, {
        commit: null,
        report: "candidate",
        review: "changes_requested",
      });
    }
    for (const id of spec.accepted) {
      writeEvidencePair(dir, id, {
        commit: null,
        report: "implemented",
        review: "accepted",
      });
    }

    if (useGit) {
      git(dir, "init", "-q", "-b", "master");
      git(dir, "add", "-A");
      git(dir, "commit", "-q", "-m", "fixture: base scenario");
      for (const id of spec.complete) {
        // The evidence file is committed before its own hash is recorded, so
        // the recorded hash is a genuine post-commit value that contains both
        // evidence paths.
        writeEvidencePair(dir, id, {
          commit: null,
          report: "implemented",
          review: "accepted",
        });
        git(dir, "add", "-A");
        git(dir, "commit", "-q", "-m", `fixture: complete ${id}`);
        const hash = git(dir, "rev-parse", "HEAD").trim();
        writeEvidencePair(dir, id, {
          commit: hash,
          report: "implemented",
          review: "accepted",
        });
        setLedgerCell(dir, id, 5, hash);
      }
      for (const id of spec.pendingReview ?? []) {
        // Commit the candidate report, then record the real post-commit hash
        // while keeping the report disposition candidate and the review
        // changes_requested/null.
        writeEvidence(dir, id, "report", {
          commit: null,
          disposition: "candidate",
        });
        writeEvidence(dir, id, "review", {
          commit: null,
          disposition: "changes_requested",
        });
        git(dir, "add", "-A");
        git(dir, "commit", "-q", "-m", `fixture: pending review ${id}`);
        const hash = git(dir, "rev-parse", "HEAD").trim();
        writeEvidence(dir, id, "report", {
          commit: hash,
          disposition: "candidate",
        });
        setLedgerCell(dir, id, 5, hash);
      }
    } else {
      // No Git: completions cannot resolve. Write the records with null hashes
      // so a caller can point a fabricated ledger hash at an absent repository.
      for (const id of spec.complete) {
        writeEvidencePair(dir, id, {
          commit: null,
          report: "implemented",
          review: "accepted",
        });
      }
      for (const id of spec.pendingReview ?? []) {
        writeEvidence(dir, id, "report", {
          commit: null,
          disposition: "candidate",
        });
        writeEvidence(dir, id, "review", {
          commit: null,
          disposition: "changes_requested",
        });
      }
    }

    const generated = runTool(toolPath, dir, ["--generate"]);
    if (useGit && generated.status !== 0) {
      throw new Error(
        `valid fixture scenario "${scenario}" failed validation ` +
          `(exit ${generated.status}):\n${generated.stdout}${generated.stderr}`,
      );
    }
    return dir;
  } catch (error) {
    try {
      removeOwnedDir(dir, {
        attempts: cleanupAttempts,
        remove: cleanupRemove,
      });
    } catch (cleanupError) {
      throw withCleanupFailure(error, dir, cleanupError);
    }
    throw error;
  }
}
