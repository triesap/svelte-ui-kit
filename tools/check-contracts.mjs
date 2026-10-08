#!/usr/bin/env node
/**
 * svelte-ui-kit repository contract validator.
 *
 * Dependency-free Node tooling that validates the adopted contract documents,
 * local links and anchors, the 203-checkpoint plan, the eleven sequence gates,
 * requirement/acceptance coverage, completion evidence, and the derived JSON
 * projections.
 *
 * Default behaviour is read-only validation. Projections are written only in
 * the explicit generation modes:
 *
 *   node tools/check-contracts.mjs --generate          # implementation/COMMIT_SEQUENCE.json
 *   node tools/check-contracts.mjs --generate-sources  # references/SOURCES.json
 *
 * Use --root <dir> to validate a disposable fixture tree instead of this
 * repository. See implementation/VERIFICATION.md for the command contract.
 */
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..");

export const SCHEMA_VERSION = 1;
export const PLAN_REL = "implementation/COMMIT_SEQUENCE.md";
export const PLAN_JSON_REL = "implementation/COMMIT_SEQUENCE.json";
export const SOURCES_JSON_REL = "references/SOURCES.json";
export const SOURCES_ANCHOR = "reference-url-inventory";

export const STATUS_VOCABULARY = [
  "not_started",
  "in_progress",
  "blocked",
  "verified_uncommitted",
  "complete",
  "not_applicable",
  "committed_pending_review",
];

/** Checkpoint statuses that require a completed, committed successor gate. */
export const COMPLETE_STATUS = "complete";

/**
 * Author implementation status for the owner-authorized within-sequence batch.
 * It means the checkpoint's implementation commit exists and is recorded, but
 * independent review has not accepted it. It never counts as completion.
 */
export const PENDING_REVIEW_STATUS = "committed_pending_review";

/** Structured batch-authorization schema (one live record in the plan). */
export const BATCH_SCHEMA_VERSION = 1;
export const BATCH_KEYS = [
  "schemaVersion",
  "sequence",
  "first",
  "last",
  "mode",
  "review",
];

/**
 * The ten owner-authorized batch tuples. `committed_pending_review` is legal
 * only for exactly one of these ranges; there is deliberately no general
 * policy engine or free-form bypass. A live record must match one tuple
 * exactly, and the plan may carry only one live record at a time. The
 * historical RCLD-01, RCLD-02 and RCLD-03 tuples stay approved so historical
 * fixtures and their accepted batch evidence remain valid; the current live
 * payload is the RCLD-10 tuple after independent RCLD-09 acceptance.
 */
export const AUTHORIZED_BATCHES = [
  {
    schemaVersion: BATCH_SCHEMA_VERSION,
    sequence: "RCLD-01",
    first: "S007",
    last: "S012",
    mode: "pfc",
    review: "codex-after-sequence",
  },
  {
    schemaVersion: BATCH_SCHEMA_VERSION,
    sequence: "RCLD-02",
    first: "S013",
    last: "S032",
    mode: "pfc",
    review: "codex-after-sequence",
  },
  {
    schemaVersion: BATCH_SCHEMA_VERSION,
    sequence: "RCLD-03",
    first: "S033",
    last: "S063",
    mode: "pfc",
    review: "codex-after-sequence",
  },
  {
    schemaVersion: BATCH_SCHEMA_VERSION,
    sequence: "RCLD-04",
    first: "S064",
    last: "S077",
    mode: "pfc",
    review: "codex-after-sequence",
  },
  {
    schemaVersion: BATCH_SCHEMA_VERSION,
    sequence: "RCLD-05",
    first: "S078",
    last: "S091",
    mode: "pfc",
    review: "codex-after-sequence",
  },
  {
    schemaVersion: BATCH_SCHEMA_VERSION,
    sequence: "RCLD-06",
    first: "S092",
    last: "S115",
    mode: "pfc",
    review: "codex-after-sequence",
  },
  {
    schemaVersion: BATCH_SCHEMA_VERSION,
    sequence: "RCLD-07",
    first: "S116",
    last: "S128",
    mode: "pfc",
    review: "codex-after-sequence",
  },
  {
    schemaVersion: BATCH_SCHEMA_VERSION,
    sequence: "RCLD-08",
    first: "S129",
    last: "S148",
    mode: "pfc",
    review: "codex-after-sequence",
  },
  {
    schemaVersion: BATCH_SCHEMA_VERSION,
    sequence: "RCLD-09",
    first: "S149",
    last: "S181",
    mode: "pfc",
    review: "codex-after-sequence",
  },
  {
    schemaVersion: BATCH_SCHEMA_VERSION,
    sequence: "RCLD-10",
    first: "S182",
    last: "S193",
    mode: "pfc",
    review: "codex-after-sequence",
  },
];

/** Structured completion-evidence schema. */
export const EVIDENCE_SCHEMA_VERSION = 1;
export const EVIDENCE_KEYS = [
  "schemaVersion",
  "checkpoint",
  "kind",
  "commit",
  "disposition",
];

/** The 27 approved contracts adopted at S002. */
export const ADOPTED_CONTRACTS = [
  "specs/PRODUCT_SPEC.md",
  "specs/SCOPE_AND_ASSUMPTIONS.md",
  "specs/ARCHITECTURE.md",
  "specs/GENERATED_LAYOUT.md",
  "specs/API_CONTRACTS.md",
  "specs/DATA_MODEL.md",
  "specs/STYLING.md",
  "specs/SYNCHRONIZATION.md",
  "specs/SECURITY_AND_TRANSACTIONS.md",
  "specs/COMPONENT_CATALOG.md",
  "specs/ACCEPTANCE_CRITERIA.md",
  "implementation/TEST_PLAN.md",
  "implementation/VERIFICATION.md",
  "implementation/OPEN_QUESTIONS.md",
  "implementation/OPERATIONS_RUNBOOK.md",
  "implementation/STEP_REPORT_TEMPLATE.md",
  "implementation/DEVIATION_TEMPLATE.md",
  "implementation/EXTENSION_GATE.md",
  "decisions/ADR-0001-architecture.md",
  "decisions/ADR-0002-generated-css-and-layout.md",
  "decisions/ADR-0003-customization-aware-sync.md",
  "decisions/ADR-0004-primitive-and-theme-boundaries.md",
  "decisions/ADR-0005-rust-verification-boundary.md",
  "decisions/ADR-0006-scope-and-discovery-gates.md",
  "references/SOURCE_BASELINE.md",
  "references/TOKEN_BASELINE.md",
  "AGENTS.md",
];

export const REQUIRED_FILES = [
  ...ADOPTED_CONTRACTS,
  SOURCES_JSON_REL,
  PLAN_JSON_REL,
];

/** The fixed approved RCLD-01–RCLD-11 identities and contiguous ranges. */
export const EXPECTED_SEQUENCES = [
  { id: "RCLD-01", first: "S001", last: "S012", count: 12 },
  { id: "RCLD-02", first: "S013", last: "S032", count: 20 },
  { id: "RCLD-03", first: "S033", last: "S063", count: 31 },
  { id: "RCLD-04", first: "S064", last: "S077", count: 14 },
  { id: "RCLD-05", first: "S078", last: "S091", count: 14 },
  { id: "RCLD-06", first: "S092", last: "S115", count: 24 },
  { id: "RCLD-07", first: "S116", last: "S128", count: 13 },
  { id: "RCLD-08", first: "S129", last: "S148", count: 20 },
  { id: "RCLD-09", first: "S149", last: "S181", count: 33 },
  { id: "RCLD-10", first: "S182", last: "S193", count: 12 },
  { id: "RCLD-11", first: "S194", last: "S203", count: 10 },
];

export const EXPECTED_STEP_IDS = Array.from(
  { length: 203 },
  (_, i) => `S${String(i + 1).padStart(3, "0")}`,
);
const EXPECTED_STEP_ID_SET = new Set(EXPECTED_STEP_IDS);
const EXPECTED_SEQUENCE_ID_SET = new Set(
  EXPECTED_SEQUENCES.map((seq) => seq.id),
);
const EXPECTED_SEQUENCE_BY_STEP = new Map();
for (const seq of EXPECTED_SEQUENCES) {
  const firstIndex = EXPECTED_STEP_IDS.indexOf(seq.first);
  for (let i = 0; i < seq.count; i++) {
    EXPECTED_SEQUENCE_BY_STEP.set(EXPECTED_STEP_IDS[firstIndex + i], seq.id);
  }
}

/** The explicit future-deliverable annotation required for a missing link. */
export const FUTURE_DELIVERABLE_RE =
  /<!--\s*future-deliverable:\s*(S\d{3})\s*-->/;

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".pnpm-store",
  ".svelte-kit",
  "dist",
  "build",
  "coverage",
]);

// ---------------------------------------------------------------------------
// Small IO / text helpers
// ---------------------------------------------------------------------------

function readText(root, rel) {
  const abs = path.join(root, rel);
  if (!existsSync(abs) || !statSync(abs).isFile()) return null;
  return readFileSync(abs, "utf8");
}

export function listMarkdownFiles(root) {
  const out = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.isFile() && entry.name.endsWith(".md")) {
        out.push(path.relative(root, abs).split(path.sep).join("/"));
      }
    }
  };
  walk(root);
  return out.sort();
}

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

function gitOutput(root, args) {
  try {
    return execFileSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

/** True when `root` is inside a resolvable Git repository/worktree. */
export function hasGitRepo(root) {
  return gitOutput(root, ["rev-parse", "--git-dir"]) !== null;
}

/** Resolve any commit-ish to its full lowercase commit hash, or null. */
export function resolveCommit(root, ref) {
  if (typeof ref !== "string" || ref.trim() === "") return null;
  const out = gitOutput(root, ["rev-parse", "--verify", `${ref}^{commit}`]);
  return out && /^[0-9a-f]{40}$/.test(out) ? out : null;
}

/** True when `commit` is an ancestor of HEAD (or HEAD itself). */
export function isReachableFromHead(root, commit) {
  try {
    execFileSync(
      "git",
      ["-C", root, "merge-base", "--is-ancestor", commit, "HEAD"],
      { stdio: ["ignore", "ignore", "ignore"] },
    );
    return true;
  } catch {
    return false;
  }
}

/** True when `ancestor` is an ancestor of `descendant` (identity included). */
export function isAncestor(root, ancestor, descendant) {
  if (!ancestor || !descendant) return false;
  try {
    execFileSync(
      "git",
      ["-C", root, "merge-base", "--is-ancestor", ancestor, descendant],
      { stdio: ["ignore", "ignore", "ignore"] },
    );
    return true;
  } catch {
    return false;
  }
}

/** True when `rel` exists as a blob at `commit`. */
export function pathExistsAtCommit(root, commit, rel) {
  try {
    execFileSync("git", ["-C", root, "cat-file", "-e", `${commit}:${rel}`], {
      stdio: ["ignore", "ignore", "ignore"],
    });
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Markdown structural helpers (fences, code spans, slugs)
// ---------------------------------------------------------------------------

/**
 * Return a per-line boolean mask marking fenced-code lines. A fence closes
 * only on a marker of the same character whose length is at least the opening
 * length, so nested/short fences do not terminate a longer fence early.
 */
export function computeFenceMask(lines) {
  const mask = new Array(lines.length).fill(false);
  let open = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (open === null) {
      const m = line.match(/^ {0,3}(`{3,}|~{3,})/);
      if (m) {
        open = { marker: m[1][0], length: m[1].length };
        mask[i] = true;
      }
      continue;
    }
    mask[i] = true;
    const close = line.match(/^ {0,3}(`{3,}|~{3,})\s*$/);
    if (
      close &&
      close[1][0] === open.marker &&
      close[1].length >= open.length
    ) {
      open = null;
    }
  }
  return mask;
}

/**
 * Return only the lines outside fenced code blocks. Structural definitions (IDs,
 * ranges, gate lines, summaries, evidence records) must never be satisfied or
 * duplicated by content inside a literal example fence.
 */
export function stripFencedLines(text) {
  const lines = text.split("\n");
  const fence = computeFenceMask(lines);
  return lines.filter((_, i) => !fence[i]);
}

/** Replace inline code spans with equal-length spaces so links/anchors inside them are ignored. */
export function maskInlineCode(line) {
  let out = "";
  let i = 0;
  while (i < line.length) {
    if (line[i] === "`") {
      let n = 1;
      while (line[i + n] === "`") n++;
      const open = "`".repeat(n);
      const closeIdx = line.indexOf(open, i + n);
      if (closeIdx !== -1) {
        out += " ".repeat(closeIdx + n - i);
        i = closeIdx + n;
        continue;
      }
    }
    out += line[i];
    i++;
  }
  return out;
}

export function slugifyHeading(text) {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/[`*_~[\]]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]/gu, "");
}

/**
 * Collect explicit HTML anchors and heading-derived slugs. Explicit IDs keep
 * their literal value and duplicates are reported instead of being suffixed;
 * duplicate headings receive GitHub-style numeric suffixes.
 */
export function extractAnchorData(text) {
  const lines = text.split("\n");
  const fence = computeFenceMask(lines);
  const explicit = [];
  const explicitSet = new Set();
  const duplicateExplicit = [];
  const slugs = [];
  const slugSet = new Set();
  for (let i = 0; i < lines.length; i++) {
    if (fence[i]) continue;
    const scan = maskInlineCode(lines[i]);
    for (const m of scan.matchAll(
      /<a\s+[^>]*?(?:id|name)\s*=\s*(?:"([^"]+)"|'([^']+)')/g,
    )) {
      const id = m[1] ?? m[2];
      if (explicitSet.has(id)) duplicateExplicit.push(id);
      explicitSet.add(id);
      explicit.push(id);
    }
    const heading = lines[i].match(/^#{1,6}\s+(.*?)\s*#*\s*$/);
    if (!heading) continue;
    const base = slugifyHeading(heading[1]);
    if (!base) continue;
    let candidate = base;
    let n = 1;
    while (slugSet.has(candidate)) candidate = `${base}-${n++}`;
    slugSet.add(candidate);
    slugs.push(candidate);
  }
  return { explicit, explicitSet, duplicateExplicit, slugs, slugSet };
}

/** Backwards-compatible union of explicit anchors and heading slugs. */
export function extractAnchors(text) {
  const { explicit, slugs } = extractAnchorData(text);
  return [...explicit, ...slugs];
}

/**
 * Extract Markdown links outside fenced code blocks. Supports inline links,
 * reference-style links (`[label][ref]`, `[label][]`) and shortcut references
 * that resolve to a definition; image links are included. Inline code is
 * masked so code examples neither create nor hide links.
 */
export function extractLinks(text) {
  const lines = text.split("\n");
  const fence = computeFenceMask(lines);
  const definitions = new Map();
  const definitionLines = new Set();
  const normalizeRef = (value) =>
    value.trim().toLowerCase().replace(/\s+/g, " ");
  for (let i = 0; i < lines.length; i++) {
    if (fence[i]) continue;
    const m = lines[i].match(
      /^ {0,3}\[([^\]]+)\]:\s*(<[^>]*>|\S+)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*$/,
    );
    if (m) {
      definitionLines.add(i);
      const key = normalizeRef(m[1]);
      if (!definitions.has(key)) {
        definitions.set(key, {
          target: m[2].replace(/^<|>$/g, ""),
          line: i + 1,
        });
      }
    }
  }
  const links = [];
  for (let i = 0; i < lines.length; i++) {
    if (fence[i] || definitionLines.has(i)) continue;
    const masked = maskInlineCode(lines[i]);
    for (const m of masked.matchAll(
      /!?\[([^\]]*)\]\(\s*(<[^>]*>|[^()\s]+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g,
    )) {
      links.push({
        text: m[1],
        target: m[2].replace(/^<|>$/g, ""),
        line: i + 1,
      });
    }
    for (const m of masked.matchAll(/(?<!!)\[([^\]]*)\]\[([^\]]*)\]/g)) {
      const label = m[2] === "" ? m[1] : m[2];
      const key = normalizeRef(label);
      const def = definitions.get(key);
      links.push({
        text: m[1],
        ref: key,
        target: def ? def.target : null,
        missingRef: !def,
        line: i + 1,
      });
    }
    for (const m of masked.matchAll(/(?<!!)\[([^\]]+)\](?!\(|\[)/g)) {
      const key = normalizeRef(m[1]);
      const def = definitions.get(key);
      if (def) {
        links.push({ text: m[1], ref: key, target: def.target, line: i + 1 });
      }
    }
  }
  return links;
}

// ---------------------------------------------------------------------------
// Plan parsing
// ---------------------------------------------------------------------------

function splitRow(line) {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

export function parseSequenceMap(text) {
  const lines = text.split("\n");
  const fence = computeFenceMask(lines);
  const sequences = [];
  for (let i = 0; i < lines.length; i++) {
    if (fence[i]) continue;
    const line = lines[i];
    if (!/^\|\s*\[RCLD-\d{2}\]/.test(line)) continue;
    const cells = splitRow(line);
    const idMatch = cells[0].match(/RCLD-\d{2}/);
    const range = cells[1].match(/(S\d{3})\s*[–-]\s*(S\d{3})/);
    if (!idMatch || !range) continue;
    sequences.push({
      id: idMatch[0],
      first: range[1],
      last: range[2],
      count: Number(cells[2]),
      state: cells[3],
      predecessor: cells[4],
    });
  }
  return sequences;
}

export function parseLedger(text) {
  const lines = text.split("\n");
  const fence = computeFenceMask(lines);
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    if (fence[i]) continue;
    if (!/^\|\s*S\d{3}\s*\|/.test(lines[i])) continue;
    const cells = splitRow(lines[i]);
    if (!/^S\d{3}$/.test(cells[0])) continue;
    rows.push({
      id: cells[0],
      sequence: cells[1],
      dependsOn: cells[2] === "None" ? null : cells[2],
      status: cells[3],
      evidence: cells[4],
    });
  }
  return rows;
}

export function parseDefinitions(text) {
  const lines = text.split("\n");
  const fence = computeFenceMask(lines);
  const steps = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    if (fence[i]) continue;
    const heading = lines[i].match(/^### (S\d+) — (.*)$/);
    if (heading) {
      current = { id: heading[1], title: heading[2].trim(), requirements: [] };
      steps.push(current);
      continue;
    }
    if (current && /^\*\*Contract anchors:\*\*/.test(lines[i])) {
      current.requirements = [...lines[i].matchAll(/R\d{2}/g)].map((m) => m[0]);
      current = null;
    }
  }
  return steps;
}

/**
 * Parse the `### RCLD-NN` bodies: range, state and the three gates. Returns one
 * record per body occurrence (in document order) so duplicate or unknown bodies
 * can be rejected before indexing rather than silently overwritten.
 */
export function parseSequenceBodies(text) {
  const lines = text.split("\n");
  const fence = computeFenceMask(lines);
  const bodies = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    if (fence[i]) continue;
    const line = lines[i];
    const heading = line.match(/^### (RCLD-\d{2}) — (.*)$/);
    if (heading) {
      current = {
        id: heading[1],
        title: heading[2].trim(),
        first: null,
        last: null,
        state: null,
        scope: null,
        green: null,
        verification: null,
        scopeCount: 0,
        greenCount: 0,
        verificationCount: 0,
      };
      bodies.push(current);
      continue;
    }
    if (/^#{1,6}\s/.test(line) || /^<a\s/.test(line)) {
      current = null;
      continue;
    }
    if (!current) continue;
    const cp = line.match(
      /^Checkpoints:\s*(S\d{3})\s*[–-]\s*(S\d{3})\.\s*State:\s*([a-z_]+)\./,
    );
    if (cp) {
      current.first = cp[1];
      current.last = cp[2];
      current.state = cp[3];
      continue;
    }
    const scope = line.match(/^\*\*Scope:\*\*\s*(.*)$/);
    if (scope) {
      current.scopeCount++;
      if (scope[1].trim()) current.scope = scope[1].trim();
      continue;
    }
    const green = line.match(/^\*\*Definition of green:\*\*\s*(.*)$/);
    if (green) {
      current.greenCount++;
      if (green[1].trim()) current.green = green[1].trim();
      continue;
    }
    const lane = line.match(/^\*\*Verification lane:\*\*\s*(.*)$/);
    if (lane) {
      current.verificationCount++;
      if (lane[1].trim()) current.verification = lane[1].trim();
      continue;
    }
  }
  return bodies;
}

export function parseSequenceTitles(text) {
  const titles = {};
  const lines = text.split("\n");
  const fence = computeFenceMask(lines);
  for (let i = 0; i < lines.length; i++) {
    if (fence[i]) continue;
    const m = lines[i].match(/^### (RCLD-\d{2}) — (.*)$/);
    if (!m) continue;
    titles[m[1]] = m[2].trim();
  }
  return titles;
}

export function parseSourceInventory(text) {
  const sources = [];
  const lines = text.split("\n");
  const fence = computeFenceMask(lines);
  for (let i = 0; i < lines.length; i++) {
    if (fence[i]) continue;
    const line = lines[i];
    if (!/^\|\s*SRC\d{2}\s*\|/.test(line)) continue;
    const cells = splitRow(line);
    const label = cells[1].match(/\[([^\]]+)\]/);
    const url = cells[1].match(/\]\(([^)\s]+)\)/);
    sources.push({
      id: cells[0],
      label: label ? label[1] : "",
      url: url ? url[1] : "",
      boundary: cells[2] ?? "",
    });
  }
  return sources;
}

// ---------------------------------------------------------------------------
// Completion evidence
// ---------------------------------------------------------------------------

/**
 * Return a same-length copy of `text` with every character on a fenced-code
 * line replaced by a space (line breaks preserved), so token offsets in the
 * masked string still address the original document.
 */
function maskFencedText(text) {
  const lines = text.split("\n");
  const fence = computeFenceMask(lines);
  return lines
    .map((line, i) => (fence[i] ? " ".repeat(line.length) : line))
    .join("\n");
}

/**
 * Parse every live `<!-- <marker> ... -->` attempt in a document.
 *
 * A live opening marker establishes a present record attempt even when it is
 * never terminated. Fenced literal content is masked before scanning, so it
 * contributes neither opening markers nor closing delimiters and cannot
 * consume, terminate, repair or hide live metadata; every live attempt is
 * counted and either parsed as one record or reported as malformed. Stray
 * closing delimiters that precede any opening marker are inert.
 */
function parseStructuredCommentRecords(text, marker) {
  const masked = maskFencedText(text);
  const tokens = [];
  const openRe = new RegExp(`<!--\\s*${marker}\\b`, "g");
  for (const match of masked.matchAll(openRe)) {
    tokens.push({
      type: "open",
      index: match.index,
      end: match.index + match[0].length,
    });
  }
  for (
    let index = masked.indexOf("-->");
    index !== -1;
    index = masked.indexOf("-->", index + 3)
  ) {
    tokens.push({ type: "close", index, end: index + 3 });
  }
  tokens.sort((a, b) => a.index - b.index || a.end - b.end);

  const records = [];
  const errors = [];
  let count = 0;
  let bodyStart = -1;
  const reportUnterminated = () =>
    errors.push(`${marker} comment is not terminated with -->`);
  for (const token of tokens) {
    if (token.type === "open") {
      if (bodyStart !== -1) reportUnterminated();
      bodyStart = token.end;
      count++;
      continue;
    }
    if (bodyStart === -1) continue; // stray delimiter before any attempt
    const body = text.slice(bodyStart, token.index).trim();
    try {
      records.push(JSON.parse(body));
    } catch (error) {
      errors.push(`${marker} JSON did not parse: ${error.message}`);
    }
    bodyStart = -1;
  }
  if (bodyStart !== -1) reportUnterminated();
  return { records, errors, count };
}

/**
 * Parse every live `<!-- checkpoint-evidence ... -->` attempt in a document.
 * See `parseStructuredCommentRecords` for the fenced/termination semantics.
 */
export function parseEvidenceRecords(text) {
  return parseStructuredCommentRecords(text, "checkpoint-evidence");
}

/**
 * Parse every live `<!-- checkpoint-batch ... -->` authorization attempt. This
 * is a separate, single-record structured comment; fenced examples are inert.
 */
export function parseBatchAuthorizations(text) {
  return parseStructuredCommentRecords(text, "checkpoint-batch");
}

/**
 * Read and validate the single live owner-authorized batch record for `root`.
 *
 * Returns `null` when the record is absent or invalid. Malformed or
 * non-approved present records push diagnostics; an absent record is reported
 * only indirectly (a pending-review status without one is an error elsewhere).
 * The returned object carries the authorized contiguous step-id set.
 */
export function readBatchAuthorization(root, errors) {
  const text = readText(root, PLAN_REL);
  if (text === null) return null;
  const {
    records,
    errors: parseErrors,
    count,
  } = parseBatchAuthorizations(text);
  for (const message of parseErrors) {
    errors.push({
      code: "INVALID_BATCH_AUTHORIZATION",
      path: PLAN_REL,
      message,
    });
  }
  if (count === 0) return null;
  if (count > 1) {
    errors.push({
      code: "INVALID_BATCH_AUTHORIZATION",
      path: PLAN_REL,
      message: `expected exactly one checkpoint-batch authorization, found ${count}`,
    });
    return null;
  }
  const record = records[0];
  if (record === null || typeof record !== "object" || Array.isArray(record)) {
    errors.push({
      code: "INVALID_BATCH_AUTHORIZATION",
      path: PLAN_REL,
      message: "checkpoint-batch must be a JSON object",
    });
    return null;
  }
  const keys = Object.keys(record).sort();
  const expectedKeys = [...BATCH_KEYS].sort();
  if (
    keys.length !== expectedKeys.length ||
    !keys.every((key, i) => key === expectedKeys[i])
  ) {
    errors.push({
      code: "INVALID_BATCH_AUTHORIZATION",
      path: PLAN_REL,
      message: `checkpoint-batch keys must be exactly ${BATCH_KEYS.join(", ")}`,
    });
    return null;
  }
  const approved = AUTHORIZED_BATCHES.find((candidate) =>
    BATCH_KEYS.every((key) => record[key] === candidate[key]),
  );
  if (!approved) {
    errors.push({
      code: "INVALID_BATCH_AUTHORIZATION",
      path: PLAN_REL,
      message: `checkpoint-batch must exactly match one approved authorization tuple (${AUTHORIZED_BATCHES.map(
        (candidate) =>
          `${candidate.sequence} ${candidate.first}-${candidate.last}`,
      ).join(", ")}); found ${JSON.stringify(record)}`,
    });
    return null;
  }
  const firstIndex = EXPECTED_STEP_IDS.indexOf(approved.first);
  const lastIndex = EXPECTED_STEP_IDS.indexOf(approved.last);
  const ids = new Set(EXPECTED_STEP_IDS.slice(firstIndex, lastIndex + 1));
  return {
    sequence: approved.sequence,
    first: approved.first,
    last: approved.last,
    ids,
  };
}

/**
 * Read and validate the single structured evidence record for one file.
 * Returns null when the record is absent; reports malformed records as errors.
 */
function readSingleEvidence(root, rel, expected) {
  const text = readText(root, rel);
  const problems = [];
  if (text === null) return { record: null, missing: true, problems };
  const { records, errors, count } = parseEvidenceRecords(text);
  for (const message of errors) problems.push(message);
  if (count === 0) return { record: null, missing: true, problems };
  if (count > 1) {
    problems.push(
      `expected exactly one checkpoint-evidence record, found ${count}`,
    );
    return { record: null, missing: false, problems };
  }
  const record = records[0];
  if (record === null || typeof record !== "object" || Array.isArray(record)) {
    problems.push("checkpoint-evidence must be a JSON object");
    return { record: null, missing: false, problems };
  }
  const keys = Object.keys(record).sort();
  const expectedKeys = [...EVIDENCE_KEYS].sort();
  if (
    keys.length !== expectedKeys.length ||
    !keys.every((key, i) => key === expectedKeys[i])
  ) {
    problems.push(
      `checkpoint-evidence keys must be exactly ${EVIDENCE_KEYS.join(", ")}`,
    );
  }
  if (record.schemaVersion !== EVIDENCE_SCHEMA_VERSION) {
    problems.push(
      `checkpoint-evidence schemaVersion must be ${EVIDENCE_SCHEMA_VERSION}`,
    );
  }
  if (record.checkpoint !== expected.checkpoint) {
    problems.push(
      `checkpoint-evidence checkpoint must be ${expected.checkpoint}, found ${record.checkpoint}`,
    );
  }
  if (record.kind !== expected.kind) {
    problems.push(
      `checkpoint-evidence kind must be ${expected.kind}, found ${record.kind}`,
    );
  }
  if (record.commit !== null) {
    if (
      typeof record.commit !== "string" ||
      !/^[0-9a-f]{40}$/.test(record.commit)
    ) {
      problems.push(
        "checkpoint-evidence commit must be null or a full lowercase 40-digit Git hash",
      );
    }
  }
  if (typeof record.disposition !== "string") {
    problems.push("checkpoint-evidence disposition must be a string");
  }
  return { record, missing: false, problems };
}

function ledgerHashFor(row) {
  const match = (row?.evidence ?? "").match(/\b[0-9a-f]{7,40}\b/i);
  return match ? match[0].toLowerCase() : null;
}

/**
 * Validate one `committed_pending_review` checkpoint: the ledger must record
 * the real post-commit implementation hash, the report stays `candidate` with
 * that hash, an optional independent review stays `changes_requested`/null,
 * and the commit must be reachable, contain the report path, and be a
 * descendant of a committed predecessor. Pending review never counts as
 * completion and never records `implemented`/`accepted`.
 */
function validatePendingReviewEvidence(root, step, ctx) {
  const {
    report,
    review,
    reportRel,
    reviewRel,
    ledgerById,
    projection,
    batch,
    errors,
  } = ctx;
  const push = (message, pathRel) =>
    errors.push({
      code: "MISSING_COMPLETION_EVIDENCE",
      path: pathRel,
      message,
    });

  if (!batch || !batch.ids.has(step.id)) {
    push(
      `checkpoint ${step.id} is committed_pending_review but is not within the authorized batch range`,
      PLAN_REL,
    );
  }

  const row = ledgerById.get(step.id);
  const hash = ledgerHashFor(row);
  const fullHash = hash && /^[0-9a-f]{40}$/.test(hash) ? hash : null;
  if (!fullHash) {
    push(
      `pending-review checkpoint ${step.id} must record its full 40-digit implementation hash in the ledger`,
      PLAN_REL,
    );
  }

  if (report.missing) {
    push(
      `pending-review checkpoint ${step.id} is missing its report checkpoint-evidence record`,
      reportRel,
    );
  } else if (report.record) {
    if (report.record.disposition !== "candidate") {
      push(
        `pending-review checkpoint ${step.id} report disposition must remain "candidate", found "${report.record.disposition}"`,
        reportRel,
      );
    }
    if (fullHash && report.record.commit !== fullHash) {
      push(
        `pending-review checkpoint ${step.id} report commit must equal the ledger hash ${fullHash}`,
        reportRel,
      );
    }
  }

  if (review.record) {
    if (review.record.disposition !== "changes_requested") {
      push(
        `pending-review checkpoint ${step.id} review disposition must be "changes_requested", found "${review.record.disposition}"`,
        reviewRel,
      );
    }
    if (review.record.commit !== null) {
      push(
        `pending-review checkpoint ${step.id} review record must use a null commit while pending`,
        reviewRel,
      );
    }
  }

  if (!fullHash) return;

  if (!hasGitRepo(root)) {
    push(
      `pending-review checkpoint ${step.id} cannot be verified: no Git repository at ${root}`,
      PLAN_JSON_REL,
    );
    return;
  }

  const resolved = resolveCommit(root, fullHash);
  if (!resolved) {
    push(
      `pending-review checkpoint ${step.id} implementation hash ${fullHash} does not resolve in this repository`,
      PLAN_JSON_REL,
    );
    return;
  }
  if (!isReachableFromHead(root, resolved)) {
    push(
      `pending-review checkpoint ${step.id} implementation commit ${fullHash} is not reachable from HEAD`,
      PLAN_JSON_REL,
    );
  }
  if (!pathExistsAtCommit(root, resolved, reportRel)) {
    push(
      `pending-review checkpoint ${step.id} implementation commit ${fullHash} does not contain its report path ${reportRel}`,
      PLAN_JSON_REL,
    );
  }

  const order = projection.steps.map((candidate) => candidate.id);
  const index = order.indexOf(step.id);
  if (index > 0) {
    const previous = projection.steps[index - 1];
    const previousHash = ledgerHashFor(ledgerById.get(previous.id));
    const previousResolved =
      previousHash && /^[0-9a-f]{40}$/.test(previousHash)
        ? resolveCommit(root, previousHash)
        : null;
    if (previousResolved && !isAncestor(root, previousResolved, resolved)) {
      push(
        `pending-review checkpoint ${step.id} commit ${fullHash} is not a descendant of predecessor ${previous.id} commit ${previousResolved}`,
        PLAN_JSON_REL,
      );
    }
  }
}

function validateCompletionEvidence(root, projection, errors, batch) {
  const ledgerById = new Map(parseLedgerSafe(root).map((r) => [r.id, r]));
  const git = hasGitRepo(root);

  for (const step of projection.steps) {
    const reportRel = `implementation/evidence/${step.id}_REPORT.md`;
    const reviewRel = `implementation/evidence/${step.id}_REVIEW.md`;
    const report = readSingleEvidence(root, reportRel, {
      checkpoint: step.id,
      kind: "report",
    });
    const review = readSingleEvidence(root, reviewRel, {
      checkpoint: step.id,
      kind: "review",
    });

    // Malformed present evidence is always an error, in every lifecycle state.
    // Absent optional evidence is different from malformed present evidence and
    // is handled per state below.
    for (const [read, rel] of [
      [report, reportRel],
      [review, reviewRel],
    ]) {
      for (const problem of read.problems) {
        errors.push({
          code: "MALFORMED_COMPLETION_EVIDENCE",
          path: rel,
          message: `checkpoint ${step.id}: ${problem}`,
        });
      }
    }

    if (step.status !== COMPLETE_STATUS) {
      if (step.completion !== null) {
        errors.push({
          code: "MISSING_COMPLETION_EVIDENCE",
          path: PLAN_JSON_REL,
          message: `checkpoint ${step.id} is "${step.status}" but carries completion evidence`,
        });
      }
      if (step.status === PENDING_REVIEW_STATUS) {
        validatePendingReviewEvidence(root, step, {
          report,
          review,
          reportRel,
          reviewRel,
          ledgerById,
          projection,
          batch,
          errors,
        });
        continue;
      }
      if (step.status === "verified_uncommitted") {
        // Accepted but uncommitted: both records required with null hashes.
        for (const [read, rel, kind, disposition] of [
          [report, reportRel, "report", "implemented"],
          [review, reviewRel, "review", "accepted"],
        ]) {
          if (read.missing) {
            errors.push({
              code: "MISSING_COMPLETION_EVIDENCE",
              path: rel,
              message: `verified_uncommitted checkpoint ${step.id} is missing its ${kind} checkpoint-evidence record`,
            });
          }
          if (read.record && read.record.disposition !== disposition) {
            errors.push({
              code: "MISSING_COMPLETION_EVIDENCE",
              path: rel,
              message: `verified_uncommitted checkpoint ${step.id} ${kind} disposition must be "${disposition}", found "${read.record.disposition}"`,
            });
          }
          if (read.record && read.record.commit !== null) {
            errors.push({
              code: "MISSING_COMPLETION_EVIDENCE",
              path: rel,
              message: `verified_uncommitted checkpoint ${step.id} ${kind} record must use a null commit until committed`,
            });
          }
        }
        continue;
      }
      // not_started / in_progress / blocked: records are optional, but every
      // present record must be a valid candidate/review for this checkpoint.
      for (const [read, rel, kind, disposition] of [
        [report, reportRel, "report", "candidate"],
        [review, reviewRel, "review", "changes_requested"],
      ]) {
        if (!read.record) continue;
        if (read.record.commit !== null) {
          errors.push({
            code: "MISSING_COMPLETION_EVIDENCE",
            path: rel,
            message: `non-complete checkpoint ${step.id} ${kind} record must use a null commit`,
          });
        }
        if (read.record.disposition !== disposition) {
          errors.push({
            code: "MISSING_COMPLETION_EVIDENCE",
            path: rel,
            message: `non-complete checkpoint ${step.id} ${kind} disposition "${read.record.disposition}" must be "${disposition}"`,
          });
        }
      }
      continue;
    }

    // Completed checkpoint: require truthy structured evidence in both records.
    const row = ledgerById.get(step.id);
    const hash = ledgerHashFor(row);
    if (!hash) {
      errors.push({
        code: "MISSING_COMPLETION_EVIDENCE",
        path: PLAN_REL,
        message: `complete checkpoint ${step.id} has no commit recorded in the ledger`,
      });
    }

    for (const [read, rel, kind, disposition] of [
      [report, reportRel, "report", "implemented"],
      [review, reviewRel, "review", "accepted"],
    ]) {
      if (read.missing) {
        errors.push({
          code: "MISSING_COMPLETION_EVIDENCE",
          path: rel,
          message: `complete checkpoint ${step.id} is missing its ${kind} checkpoint-evidence record`,
        });
      }
      if (read.record && read.record.disposition !== disposition) {
        errors.push({
          code: "MISSING_COMPLETION_EVIDENCE",
          path: rel,
          message: `complete checkpoint ${step.id} ${kind} disposition must be "${disposition}", found "${read.record.disposition}"`,
        });
      }
    }

    if (!hash || !report.record || !review.record) continue;

    const reportCommit = report.record.commit;
    const reviewCommit = review.record.commit;
    if (reportCommit === null || reviewCommit === null) {
      errors.push({
        code: "MISSING_COMPLETION_EVIDENCE",
        path: PLAN_JSON_REL,
        message: `complete checkpoint ${step.id} requires a full commit hash in both evidence records`,
      });
      continue;
    }
    if (reportCommit !== reviewCommit) {
      errors.push({
        code: "MISSING_COMPLETION_EVIDENCE",
        path: PLAN_JSON_REL,
        message: `complete checkpoint ${step.id} report commit ${reportCommit} does not match review commit ${reviewCommit}`,
      });
    }

    if (!git) {
      errors.push({
        code: "MISSING_COMPLETION_EVIDENCE",
        path: PLAN_JSON_REL,
        message: `complete checkpoint ${step.id} cannot be verified: no Git repository at ${root}`,
      });
      continue;
    }

    const resolved = resolveCommit(root, hash);
    if (!resolved) {
      errors.push({
        code: "MISSING_COMPLETION_EVIDENCE",
        path: PLAN_JSON_REL,
        message: `complete checkpoint ${step.id} ledger commit ${hash} does not resolve in this repository`,
      });
      continue;
    }
    if (reportCommit !== resolved || reviewCommit !== resolved) {
      errors.push({
        code: "MISSING_COMPLETION_EVIDENCE",
        path: PLAN_JSON_REL,
        message: `complete checkpoint ${step.id} evidence commit must equal the resolved ledger commit ${resolved}`,
      });
    }
    if (!isReachableFromHead(root, resolved)) {
      errors.push({
        code: "MISSING_COMPLETION_EVIDENCE",
        path: PLAN_JSON_REL,
        message: `complete checkpoint ${step.id} commit ${resolved} is not reachable from HEAD`,
      });
    }
    for (const rel of [reportRel, reviewRel]) {
      if (!pathExistsAtCommit(root, resolved, rel)) {
        errors.push({
          code: "MISSING_COMPLETION_EVIDENCE",
          path: PLAN_JSON_REL,
          message: `complete checkpoint ${step.id} evidence path ${rel} does not exist at commit ${resolved}`,
        });
      }
    }
  }
}

function parseLedgerSafe(root) {
  const text = readText(root, PLAN_REL);
  return text === null ? [] : parseLedger(text);
}

// ---------------------------------------------------------------------------
// Projection building
// ---------------------------------------------------------------------------

function evidenceCommit(root, rel) {
  const text = readText(root, rel);
  if (text === null) return null;
  const { records } = parseEvidenceRecords(text);
  for (const record of records) {
    if (
      typeof record?.commit === "string" &&
      /^[0-9a-f]{40}$/.test(record.commit)
    ) {
      return record.commit;
    }
  }
  return null;
}

function completionFor(root, step, ledgerRow) {
  if (step.status !== COMPLETE_STATUS) return null;
  const report = `implementation/evidence/${step.id}_REPORT.md`;
  const review = `implementation/evidence/${step.id}_REVIEW.md`;
  let commit = evidenceCommit(root, report) ?? evidenceCommit(root, review);
  if (!commit) {
    commit = ledgerHashFor(ledgerRow);
  }
  return { commit, report, review };
}

/** Build the deterministic checkpoint projection from the governing Markdown. */
export function buildCheckpointProjection(root) {
  const text = readText(root, PLAN_REL);
  if (text === null) throw new Error(`missing ${PLAN_REL}`);
  const ledger = parseLedger(text);
  const byId = new Map(ledger.map((r) => [r.id, r]));
  const definitions = parseDefinitions(text);
  const steps = definitions.map((def) => {
    const row = byId.get(def.id);
    const status = row ? row.status : "not_started";
    return {
      id: def.id,
      title: def.title,
      sequence: row ? row.sequence : null,
      dependsOn: row ? row.dependsOn : null,
      requirements: [...new Set(def.requirements)].sort(),
      status,
      completion: completionFor(root, { id: def.id, status }, row),
    };
  });
  const titles = parseSequenceTitles(text);
  const sequences = parseSequenceMap(text).map((seq) => ({
    id: seq.id,
    title: titles[seq.id] ?? null,
    first: seq.first,
    last: seq.last,
    count: seq.count,
    state: seq.state,
    predecessor: seq.predecessor,
  }));
  return {
    schemaVersion: SCHEMA_VERSION,
    source: PLAN_REL,
    generator: "tools/check-contracts.mjs --generate",
    sequences,
    steps,
  };
}

/** Build the deterministic source-inventory projection from the plan. */
export function buildSourcesProjection(root) {
  const text = readText(root, PLAN_REL);
  if (text === null) throw new Error(`missing ${PLAN_REL}`);
  return {
    schemaVersion: SCHEMA_VERSION,
    source: `${PLAN_REL}#${SOURCES_ANCHOR}`,
    generator: "tools/check-contracts.mjs --generate-sources",
    sources: parseSourceInventory(text),
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
      return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === "object") {
    const ak = Object.keys(a).sort();
    const bk = Object.keys(b).sort();
    if (ak.length !== bk.length || ak.some((k, i) => k !== bk[i])) return false;
    return ak.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

function validateRequiredFiles(root, errors) {
  for (const rel of REQUIRED_FILES) {
    const body = readText(root, rel);
    if (body === null) {
      errors.push({
        code: "MISSING_REQUIRED_FILE",
        path: rel,
        message: `required adopted file is missing: ${rel}`,
      });
    } else if (body.trim() === "") {
      errors.push({
        code: "MISSING_REQUIRED_FILE",
        path: rel,
        message: `required adopted file is empty: ${rel}`,
      });
    }
  }
}

function validatePackageScripts(root, errors) {
  const pkgText = readText(root, "package.json");
  if (pkgText === null) {
    errors.push({
      code: "MISSING_REQUIRED_FILE",
      path: "package.json",
      message: "package.json is missing",
    });
    return;
  }
  let pkg;
  try {
    pkg = JSON.parse(pkgText);
  } catch {
    errors.push({
      code: "INVALID_JSON",
      path: "package.json",
      message: "package.json is not valid JSON",
    });
    return;
  }
  for (const script of ["check:contracts", "test:contracts"]) {
    if (!pkg.scripts || typeof pkg.scripts[script] !== "string") {
      errors.push({
        code: "MISSING_REQUIRED_FILE",
        path: "package.json",
        message: `package.json is missing the "${script}" script`,
      });
    }
  }
}

function isExternalTarget(target) {
  return (
    target === "" ||
    /^(https?:|mailto:|tel:|data:)/i.test(target) ||
    target.startsWith("//")
  );
}

function validateLinks(root, errors, warnings, ledgerById) {
  for (const rel of listMarkdownFiles(root)) {
    const text = readText(root, rel);
    if (text === null) continue;
    const lines = text.split("\n");
    const { duplicateExplicit } = extractAnchorData(text);
    for (const id of duplicateExplicit) {
      errors.push({
        code: "DUPLICATE_EXPLICIT_ID",
        path: rel,
        message: `duplicate explicit HTML anchor id: ${id}`,
      });
    }
    const anchorsInTargets = new Map();
    const anchorsFor = (targetRel) => {
      let data = anchorsInTargets.get(targetRel);
      if (!data) {
        data = extractAnchorData(readText(root, targetRel) ?? "");
        anchorsInTargets.set(targetRel, data);
      }
      return data;
    };
    for (const link of extractLinks(text)) {
      if (link.missingRef) {
        errors.push({
          code: "BROKEN_LINK",
          path: rel,
          line: link.line,
          message: `reference-style link target [${link.ref}] is not defined`,
        });
        continue;
      }
      const target = link.target;
      if (target === null || target === undefined) continue;
      if (isExternalTarget(target)) continue;
      const [rawPath, anchor] = target.split("#");
      const filePart = rawPath.split("?")[0];
      let targetRel;
      if (filePart === "") {
        targetRel = rel;
      } else if (filePart.startsWith("/")) {
        errors.push({
          code: "BROKEN_LINK",
          path: rel,
          line: link.line,
          message: `root-absolute link is not repository-relative: ${target}`,
        });
        continue;
      } else {
        targetRel = path
          .normalize(path.join(path.dirname(rel), filePart))
          .split(path.sep)
          .join("/");
      }
      if (targetRel.startsWith("..")) {
        errors.push({
          code: "BROKEN_LINK",
          path: rel,
          line: link.line,
          message: `link escapes the repository root: ${target}`,
        });
        continue;
      }
      const abs = path.join(root, targetRel);
      if (!existsSync(abs) || !statSync(abs).isFile()) {
        const annotation = (lines[link.line - 1] ?? "").match(
          FUTURE_DELIVERABLE_RE,
        );
        if (annotation) {
          const checkpoint = annotation[1];
          const row = ledgerById.get(checkpoint);
          if (row && row.status !== COMPLETE_STATUS) {
            warnings.push({
              code: "FUTURE_DELIVERABLE_LINK",
              path: rel,
              line: link.line,
              message: `annotated future deliverable (${checkpoint}) is not present yet: ${target}`,
            });
          } else {
            errors.push({
              code: "BROKEN_LINK",
              path: rel,
              line: link.line,
              message: `future-deliverable annotation names ${checkpoint}, which is ${row ? `"${row.status}" not a noncomplete checkpoint` : "not a known checkpoint"}: ${target}`,
            });
          }
          continue;
        }
        errors.push({
          code: "BROKEN_LINK",
          path: rel,
          line: link.line,
          message: `local link target does not exist: ${target}`,
        });
        continue;
      }
      if (anchor && targetRel.endsWith(".md")) {
        const data = anchorsFor(targetRel);
        if (!data.explicitSet.has(anchor) && !data.slugSet.has(anchor)) {
          errors.push({
            code: "BROKEN_ANCHOR",
            path: rel,
            line: link.line,
            message: `anchor #${anchor} not found in ${targetRel}`,
          });
        }
      }
    }
  }
}

function countStatuses(rows) {
  const counts = { complete: 0, not_started: 0 };
  for (const row of rows) {
    if (row.status === COMPLETE_STATUS) counts.complete++;
    if (row.status === "not_started") counts.not_started++;
  }
  return counts;
}

function derivedSequenceState(rows) {
  if (rows.length === 0) return null;
  if (rows.every((r) => r.status === COMPLETE_STATUS)) return "complete";
  if (rows.every((r) => r.status === "not_started")) return "not_started";
  return "in_progress";
}

function validatePlanStructure(root, errors, batch) {
  const text = readText(root, PLAN_REL);
  if (text === null) return;
  const lines = text.split("\n");
  const fence = computeFenceMask(lines);
  const definitions = parseDefinitions(text);
  const ledger = parseLedger(text);
  const sequences = parseSequenceMap(text);
  const bodies = parseSequenceBodies(text);
  const bodyById = new Map();
  for (const body of bodies) {
    if (bodyById.has(body.id)) {
      errors.push({
        code: "DUPLICATE_ID",
        path: PLAN_REL,
        message: `duplicate sequence body: ${body.id}`,
      });
    } else {
      bodyById.set(body.id, body);
    }
    if (!EXPECTED_SEQUENCE_ID_SET.has(body.id)) {
      errors.push({
        code: "UNKNOWN_ID",
        path: PLAN_REL,
        message: `unknown sequence body: ${body.id}`,
      });
    }
  }

  // Unknown/extra checkpoint IDs outside code fences.
  for (let i = 0; i < lines.length; i++) {
    if (fence[i]) continue;
    const heading = lines[i].match(/^### (S\d+) — /);
    if (heading && !EXPECTED_STEP_ID_SET.has(heading[1])) {
      errors.push({
        code: "UNKNOWN_ID",
        path: PLAN_REL,
        message: `unknown checkpoint definition ID: ${heading[1]}`,
      });
    }
    const ledgerRow = lines[i].match(/^\|\s*(S\d+)\s*\|/);
    if (ledgerRow && !EXPECTED_STEP_ID_SET.has(ledgerRow[1])) {
      errors.push({
        code: "UNKNOWN_ID",
        path: PLAN_REL,
        message: `unknown ledger row ID: ${ledgerRow[1]}`,
      });
    }
  }

  // Uniqueness.
  const seenDef = new Set();
  for (const def of definitions) {
    if (seenDef.has(def.id)) {
      errors.push({
        code: "DUPLICATE_ID",
        path: PLAN_REL,
        message: `duplicate checkpoint definition: ${def.id}`,
      });
    }
    seenDef.add(def.id);
  }
  const seenLedger = new Set();
  for (const row of ledger) {
    if (seenLedger.has(row.id)) {
      errors.push({
        code: "DUPLICATE_ID",
        path: PLAN_REL,
        message: `duplicate ledger row: ${row.id}`,
      });
    }
    seenLedger.add(row.id);
  }

  // 203 ordered checkpoints.
  if (definitions.length !== 203) {
    errors.push({
      code: "MISSING_ID",
      path: PLAN_REL,
      message: `expected 203 checkpoint definitions, found ${definitions.length}`,
    });
  }
  if (ledger.length !== 203) {
    errors.push({
      code: "MISSING_ID",
      path: PLAN_REL,
      message: `expected 203 ledger rows, found ${ledger.length}`,
    });
  }
  definitions.forEach((def, i) => {
    if (def.id !== EXPECTED_STEP_IDS[i]) {
      errors.push({
        code: "MISSING_ID",
        path: PLAN_REL,
        message: `checkpoint order breaks at index ${i}: expected ${EXPECTED_STEP_IDS[i]}, found ${def.id}`,
      });
    }
  });
  ledger.forEach((row, i) => {
    if (row.id !== EXPECTED_STEP_IDS[i]) {
      errors.push({
        code: "MISSING_ID",
        path: PLAN_REL,
        message: `ledger order breaks at index ${i}: expected ${EXPECTED_STEP_IDS[i]}, found ${row.id}`,
      });
    }
  });

  // Definition completeness and ledger/definition parity.
  for (const def of definitions) {
    if (!def.title) {
      errors.push({
        code: "MISSING_ID",
        path: PLAN_REL,
        message: `checkpoint ${def.id} has an empty title`,
      });
    }
    if (def.requirements.length === 0) {
      errors.push({
        code: "MISSING_REQUIREMENT",
        path: PLAN_REL,
        message: `checkpoint ${def.id} has no contract anchors`,
      });
    }
    if (!seenLedger.has(def.id)) {
      errors.push({
        code: "MISSING_ID",
        path: PLAN_REL,
        message: `checkpoint ${def.id} has no ledger row`,
      });
    }
  }
  for (const row of ledger) {
    if (!seenDef.has(row.id)) {
      errors.push({
        code: "MISSING_ID",
        path: PLAN_REL,
        message: `ledger row ${row.id} has no checkpoint definition`,
      });
    }
  }

  // Predecessor chain, statuses and membership.
  ledger.forEach((row, i) => {
    const expected = i === 0 ? null : ledger[i - 1].id;
    if (row.dependsOn !== expected) {
      errors.push({
        code: "INVALID_PREDECESSOR",
        path: PLAN_REL,
        message: `checkpoint ${row.id} depends on ${row.dependsOn}; expected ${expected}`,
      });
    }
    if (!STATUS_VOCABULARY.includes(row.status)) {
      errors.push({
        code: "INVALID_STATUS",
        path: PLAN_REL,
        message: `checkpoint ${row.id} has invalid status "${row.status}"`,
      });
    }
    if (row.status === "not_applicable") {
      errors.push({
        code: "NOT_APPLICABLE_WITHOUT_DEVIATION",
        path: PLAN_REL,
        message: `checkpoint ${row.id} is not_applicable without an approved evidence-backed deviation`,
      });
    }
    if (
      row.status === PENDING_REVIEW_STATUS &&
      (!batch || !batch.ids.has(row.id))
    ) {
      errors.push({
        code: "INVALID_STATUS",
        path: PLAN_REL,
        message: `checkpoint ${row.id} is "${PENDING_REVIEW_STATUS}" without the authorized batch record`,
      });
    }
    const expectedSeq = EXPECTED_SEQUENCE_BY_STEP.get(row.id);
    if (expectedSeq && row.sequence !== expectedSeq) {
      errors.push({
        code: "INVALID_SEQUENCE",
        path: PLAN_REL,
        message: `checkpoint ${row.id} belongs to ${expectedSeq}, found ${row.sequence}`,
      });
    }
  });

  // Premature advancement. An accepted `complete` predecessor unlocks its
  // successor. Inside the exact owner-authorized batch, a verified
  // `committed_pending_review` predecessor unlocks the next batch checkpoint;
  // outside it, the accepted-predecessor rule is retained. A pending review
  // never unlocks S013 or any other out-of-range successor.
  const canUnlock = (previous, current) => {
    if (previous.status === COMPLETE_STATUS) return true;
    return Boolean(
      batch &&
      batch.ids.has(previous.id) &&
      batch.ids.has(current.id) &&
      previous.status === PENDING_REVIEW_STATUS,
    );
  };
  for (let i = 1; i < ledger.length; i++) {
    if (
      ledger[i].status !== "not_started" &&
      !canUnlock(ledger[i - 1], ledger[i])
    ) {
      errors.push({
        code: "PREMATURE_ADVANCEMENT",
        path: PLAN_REL,
        message: `checkpoint ${ledger[i].id} is "${ledger[i].status}" before ${ledger[i - 1].id} is complete`,
      });
    }
  }

  // Fixed sequence identities and ranges.
  if (sequences.length !== 11) {
    errors.push({
      code: "INVALID_SEQUENCE",
      path: PLAN_REL,
      message: `expected 11 sequences, found ${sequences.length}`,
    });
  }
  const sequenceIds = new Set();
  for (const seq of sequences) {
    if (sequenceIds.has(seq.id)) {
      errors.push({
        code: "DUPLICATE_ID",
        path: PLAN_REL,
        message: `duplicate sequence id: ${seq.id}`,
      });
    }
    sequenceIds.add(seq.id);
  }
  const mapById = new Map(sequences.map((seq) => [seq.id, seq]));
  for (let i = 0; i < EXPECTED_SEQUENCES.length; i++) {
    const expected = EXPECTED_SEQUENCES[i];
    const seq = mapById.get(expected.id);
    if (!seq) {
      errors.push({
        code: "INVALID_SEQUENCE",
        path: PLAN_REL,
        message: `missing sequence ${expected.id}`,
      });
      continue;
    }
    if (seq.first !== expected.first || seq.last !== expected.last) {
      errors.push({
        code: "INVALID_SEQUENCE",
        path: PLAN_REL,
        message: `sequence ${seq.id} range ${seq.first}–${seq.last} does not match approved ${expected.first}–${expected.last}`,
      });
    }
    if (seq.count !== expected.count) {
      errors.push({
        code: "INVALID_SEQUENCE",
        path: PLAN_REL,
        message: `sequence ${seq.id} count ${seq.count} does not match approved ${expected.count}`,
      });
    }
    // Predecessor link.
    if (i === 0) {
      if (!/^None\b/.test(seq.predecessor)) {
        errors.push({
          code: "INVALID_SEQUENCE",
          path: PLAN_REL,
          message: `sequence ${seq.id} predecessor must start with None, found "${seq.predecessor}"`,
        });
      }
    } else if (seq.predecessor !== EXPECTED_SEQUENCES[i - 1].last) {
      errors.push({
        code: "INVALID_SEQUENCE",
        path: PLAN_REL,
        message: `sequence ${seq.id} predecessor must be ${EXPECTED_SEQUENCES[i - 1].last}, found "${seq.predecessor}"`,
      });
    }

    // Sequence body agreement and nonempty gates.
    const body = bodyById.get(expected.id);
    if (!body) {
      errors.push({
        code: "INVALID_SEQUENCE",
        path: PLAN_REL,
        message: `sequence ${expected.id} has no body block`,
      });
    } else {
      if (body.first !== expected.first || body.last !== expected.last) {
        errors.push({
          code: "INVALID_SEQUENCE",
          path: PLAN_REL,
          message: `sequence ${expected.id} body range ${body.first}–${body.last} disagrees with the map`,
        });
      }
      if (body.scopeCount !== 1 || !body.scope) {
        errors.push({
          code: "INVALID_SEQUENCE",
          path: PLAN_REL,
          message: `sequence ${expected.id} must have exactly one nonempty Scope gate`,
        });
      }
      if (body.greenCount !== 1 || !body.green) {
        errors.push({
          code: "INVALID_SEQUENCE",
          path: PLAN_REL,
          message: `sequence ${expected.id} must have exactly one nonempty Definition of green gate`,
        });
      }
      if (body.verificationCount !== 1 || !body.verification) {
        errors.push({
          code: "INVALID_SEQUENCE",
          path: PLAN_REL,
          message: `sequence ${expected.id} must have exactly one nonempty Verification lane gate`,
        });
      }
    }

    // Derived state from the ledger must agree with the map and body.
    const rows = ledger.filter((row) => row.sequence === expected.id);
    const derived = derivedSequenceState(rows);
    if (derived === null) {
      errors.push({
        code: "INVALID_SEQUENCE",
        path: PLAN_REL,
        message: `sequence ${expected.id} has no ledger rows`,
      });
    } else if (seq.state !== derived) {
      errors.push({
        code: "INVALID_SEQUENCE",
        path: PLAN_REL,
        message: `sequence ${expected.id} state "${seq.state}" disagrees with the ledger-derived "${derived}"`,
      });
    }
    if (body && body.state !== seq.state) {
      errors.push({
        code: "INVALID_SEQUENCE",
        path: PLAN_REL,
        message: `sequence ${expected.id} body state "${body.state}" disagrees with the map state "${seq.state}"`,
      });
    }
  }

  // Top-level summary counts must match the ledger.
  const cpCounts = countStatuses(ledger);
  const completedSequences = EXPECTED_SEQUENCES.filter(
    (expected) =>
      derivedSequenceState(
        ledger.filter((row) => row.sequence === expected.id),
      ) === "complete",
  ).length;
  const cpSummary = stripFencedLines(text)
    .join("\n")
    .match(
      /Completed implementation checkpoints:\s*\*\*\s*(\d+)\s*\/\s*203\s*\*\*\.\s*Remaining:\s*\*\*\s*(\d+)\s*\/\s*203\s*\*\*\./,
    );
  if (!cpSummary) {
    errors.push({
      code: "INVALID_SUMMARY_COUNT",
      path: PLAN_REL,
      message: "missing the top-level completed-checkpoint summary",
    });
  } else {
    if (Number(cpSummary[1]) !== cpCounts.complete) {
      errors.push({
        code: "INVALID_SUMMARY_COUNT",
        path: PLAN_REL,
        message: `summary completed checkpoints ${cpSummary[1]} != ledger complete ${cpCounts.complete}`,
      });
    }
    if (Number(cpSummary[2]) !== 203 - cpCounts.complete) {
      errors.push({
        code: "INVALID_SUMMARY_COUNT",
        path: PLAN_REL,
        message: `summary remaining checkpoints ${cpSummary[2]} != ledger remaining ${203 - cpCounts.complete}`,
      });
    }
  }
  const seqSummary = stripFencedLines(text)
    .join("\n")
    .match(
      /Completed RCLD sequences:\s*\*\*\s*(\d+)\s*\/\s*11\s*\*\*\.\s*Remaining:\s*\*\*\s*(\d+)\s*\/\s*11\s*\*\*\./,
    );
  if (!seqSummary) {
    errors.push({
      code: "INVALID_SUMMARY_COUNT",
      path: PLAN_REL,
      message: "missing the top-level completed-sequence summary",
    });
  } else {
    if (Number(seqSummary[1]) !== completedSequences) {
      errors.push({
        code: "INVALID_SUMMARY_COUNT",
        path: PLAN_REL,
        message: `summary completed sequences ${seqSummary[1]} != ledger complete ${completedSequences}`,
      });
    }
    if (Number(seqSummary[2]) !== 11 - completedSequences) {
      errors.push({
        code: "INVALID_SUMMARY_COUNT",
        path: PLAN_REL,
        message: `summary remaining sequences ${seqSummary[2]} != ledger remaining ${11 - completedSequences}`,
      });
    }
  }

  // Pending-review checkpoints are authored/committed progress, not accepted
  // completion, so they are reported separately from the completed counters.
  const pendingIds = ledger
    .filter((row) => row.status === PENDING_REVIEW_STATUS)
    .map((row) => row.id);
  const pendingSummary = stripFencedLines(text)
    .join("\n")
    .match(
      /Committed pending review:\s*\*\*\s*(\d+)\s*\/\s*203\s*\*\*\.\s*Authored batch range:\s*\*\*\s*([^*]+?)\s*\*\*\./,
    );
  if (!pendingSummary) {
    // Historical plans predate the batch feature: a plan with neither a batch
    // authorization nor any pending-review checkpoint need not carry the new
    // summary. A live batch or any pending-review state still requires it.
    if (batch || pendingIds.length > 0) {
      errors.push({
        code: "INVALID_SUMMARY_COUNT",
        path: PLAN_REL,
        message: "missing the top-level committed-pending-review summary",
      });
    }
  } else {
    if (Number(pendingSummary[1]) !== pendingIds.length) {
      errors.push({
        code: "INVALID_SUMMARY_COUNT",
        path: PLAN_REL,
        message: `summary committed pending review ${pendingSummary[1]} != ledger pending ${pendingIds.length}`,
      });
    }
    const range = pendingSummary[2].trim();
    if (pendingIds.length === 0) {
      if (range !== "none") {
        errors.push({
          code: "INVALID_SUMMARY_COUNT",
          path: PLAN_REL,
          message: `summary authored batch range must be "none" with no pending-review checkpoint, found "${range}"`,
        });
      }
    } else {
      const rangeMatch = range.match(/^(S\d{3})\s*[\u2013-]\s*(S\d{3})$/);
      if (!rangeMatch) {
        errors.push({
          code: "INVALID_SUMMARY_COUNT",
          path: PLAN_REL,
          message: `summary authored batch range "${range}" must be one Sxxx\u2013Sxxx range or "none"`,
        });
      } else if (
        rangeMatch[1] !== pendingIds[0] ||
        rangeMatch[2] !== pendingIds[pendingIds.length - 1]
      ) {
        errors.push({
          code: "INVALID_SUMMARY_COUNT",
          path: PLAN_REL,
          message: `summary authored batch range ${rangeMatch[1]}\u2013${rangeMatch[2]} does not match ledger pending range ${pendingIds[0]}\u2013${pendingIds[pendingIds.length - 1]}`,
        });
      } else {
        const contiguous = EXPECTED_STEP_IDS.slice(
          EXPECTED_STEP_IDS.indexOf(rangeMatch[1]),
          EXPECTED_STEP_IDS.indexOf(rangeMatch[2]) + 1,
        );
        if (
          contiguous.length !== pendingIds.length ||
          !contiguous.every((id, index) => id === pendingIds[index])
        ) {
          errors.push({
            code: "INVALID_SUMMARY_COUNT",
            path: PLAN_REL,
            message: `pending-review checkpoints are not the contiguous authorized range ${range}`,
          });
        }
      }
    }
  }
}

function validateRequirementCoverage(root, errors) {
  const product = readText(root, "specs/PRODUCT_SPEC.md");
  const plan = readText(root, PLAN_REL);
  if (product === null || plan === null) return;
  const defined = [
    ...stripFencedLines(product)
      .join("\n")
      .matchAll(/^\|\s*(R\d{2})\s*\|/gm),
  ].map((m) => m[1]);
  const expected = Array.from(
    { length: 34 },
    (_, i) => `R${String(i + 1).padStart(2, "0")}`,
  );
  const expectedSet = new Set(expected);
  const seen = new Set();
  for (const id of defined) {
    if (seen.has(id)) {
      errors.push({
        code: "DUPLICATE_ID",
        path: "specs/PRODUCT_SPEC.md",
        message: `duplicate requirement ID: ${id}`,
      });
    }
    seen.add(id);
    if (!expectedSet.has(id)) {
      errors.push({
        code: "UNKNOWN_REQUIREMENT",
        path: "specs/PRODUCT_SPEC.md",
        message: `unknown requirement ID: ${id}`,
      });
    }
  }
  for (const id of expected) {
    if (!seen.has(id)) {
      errors.push({
        code: "MISSING_REQUIREMENT",
        path: "specs/PRODUCT_SPEC.md",
        message: `requirement ${id} is not defined in the product specification`,
      });
    }
  }
  const anchored = new Set();
  for (const def of parseDefinitions(plan)) {
    for (const id of def.requirements) {
      if (!expectedSet.has(id)) {
        errors.push({
          code: "UNKNOWN_REQUIREMENT",
          path: PLAN_REL,
          message: `checkpoint ${def.id} anchors unknown requirement ${id}`,
        });
      } else if (!seen.has(id)) {
        errors.push({
          code: "MISSING_REQUIREMENT",
          path: PLAN_REL,
          message: `checkpoint ${def.id} anchors undefined requirement ${id}`,
        });
      }
      anchored.add(id);
    }
  }
  for (const id of expected) {
    if (!anchored.has(id)) {
      errors.push({
        code: "MISSING_REQUIREMENT",
        path: PLAN_REL,
        message: `requirement ${id} is not anchored by any checkpoint`,
      });
    }
  }
}

function validateAcceptanceCriteria(root, errors) {
  const text = readText(root, "specs/ACCEPTANCE_CRITERIA.md");
  if (text === null) return;
  const found = [
    ...stripFencedLines(text)
      .join("\n")
      .matchAll(/^(AC\d{2})\./gm),
  ].map((m) => m[1]);
  const expected = Array.from(
    { length: 22 },
    (_, i) => `AC${String(i + 1).padStart(2, "0")}`,
  );
  const expectedSet = new Set(expected);
  const seen = new Set();
  for (const id of found) {
    if (seen.has(id)) {
      errors.push({
        code: "DUPLICATE_ID",
        path: "specs/ACCEPTANCE_CRITERIA.md",
        message: `duplicate acceptance criterion: ${id}`,
      });
    }
    seen.add(id);
    if (!expectedSet.has(id)) {
      errors.push({
        code: "UNKNOWN_ACCEPTANCE_CRITERION",
        path: "specs/ACCEPTANCE_CRITERIA.md",
        message: `unknown acceptance criterion: ${id}`,
      });
    }
  }
  for (const id of expected) {
    if (!seen.has(id)) {
      errors.push({
        code: "MISSING_ACCEPTANCE_CRITERION",
        path: "specs/ACCEPTANCE_CRITERIA.md",
        message: `acceptance criterion ${id} is not preserved`,
      });
    }
  }
}

function validateProjection(root, errors) {
  let generated;
  try {
    generated = buildCheckpointProjection(root);
  } catch (error) {
    errors.push({
      code: "PROJECTION_DRIFT",
      path: PLAN_JSON_REL,
      message: `could not build checkpoint projection: ${error.message}`,
    });
    return;
  }
  if (generated.schemaVersion !== SCHEMA_VERSION) {
    errors.push({
      code: "INVALID_SCHEMA_VERSION",
      path: PLAN_JSON_REL,
      message: `unexpected projection schema version: ${generated.schemaVersion}`,
    });
  }
  const text = readText(root, PLAN_JSON_REL);
  if (text === null) return;
  let committed;
  try {
    committed = JSON.parse(text);
  } catch {
    errors.push({
      code: "INVALID_JSON",
      path: PLAN_JSON_REL,
      message: "COMMIT_SEQUENCE.json is not valid JSON",
    });
    return;
  }
  if (!deepEqual(committed, generated)) {
    errors.push({
      code: "PROJECTION_DRIFT",
      path: PLAN_JSON_REL,
      message:
        "COMMIT_SEQUENCE.json does not match the governing Markdown (regenerate with --generate)",
    });
  }
}

function validateSourcesProjection(root, errors) {
  let generated;
  try {
    generated = buildSourcesProjection(root);
  } catch (error) {
    errors.push({
      code: "SOURCES_DRIFT",
      path: SOURCES_JSON_REL,
      message: `could not build source projection: ${error.message}`,
    });
    return;
  }
  const text = readText(root, SOURCES_JSON_REL);
  if (text === null) return;
  let committed;
  try {
    committed = JSON.parse(text);
  } catch {
    errors.push({
      code: "INVALID_JSON",
      path: SOURCES_JSON_REL,
      message: "SOURCES.json is not valid JSON",
    });
    return;
  }
  const ids = new Set();
  for (const source of generated.sources) {
    if (ids.has(source.id)) {
      errors.push({
        code: "DUPLICATE_ID",
        path: SOURCES_JSON_REL,
        message: `duplicate source id: ${source.id}`,
      });
    }
    ids.add(source.id);
  }
  if (generated.sources.length !== 16) {
    errors.push({
      code: "SOURCES_DRIFT",
      path: SOURCES_JSON_REL,
      message: `expected 16 reference pointers, found ${generated.sources.length}`,
    });
  }
  if (!deepEqual(committed, generated)) {
    errors.push({
      code: "SOURCES_DRIFT",
      path: SOURCES_JSON_REL,
      message: "SOURCES.json does not match the plan reference inventory",
    });
  }
}

/** Run every contract check against `root`. Read-only. */
export function validateRepository(root) {
  const errors = [];
  const warnings = [];
  const ledgerText = readText(root, PLAN_REL);
  const ledger = ledgerText === null ? [] : parseLedger(ledgerText);
  const ledgerById = new Map(ledger.map((row) => [row.id, row]));
  const batch = readBatchAuthorization(root, errors);
  validateRequiredFiles(root, errors);
  validatePackageScripts(root, errors);
  validateLinks(root, errors, warnings, ledgerById);
  validatePlanStructure(root, errors, batch);
  validateRequirementCoverage(root, errors);
  validateAcceptanceCriteria(root, errors);
  validateSourcesProjection(root, errors);
  validateProjection(root, errors);
  try {
    const projection = buildCheckpointProjection(root);
    validateCompletionEvidence(root, projection, errors, batch);
  } catch (error) {
    errors.push({
      code: "MISSING_COMPLETION_EVIDENCE",
      path: PLAN_REL,
      message: `could not evaluate completion evidence: ${error.message}`,
    });
  }
  return { errors, warnings, root };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = {
    root: REPO_ROOT,
    generate: false,
    generateSources: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--root") {
      const value = argv[++i];
      if (!value) throw new Error("--root requires a directory");
      opts.root = path.resolve(value);
    } else if (arg.startsWith("--root=")) {
      opts.root = path.resolve(arg.slice("--root=".length));
    } else if (arg === "--generate") {
      opts.generate = true;
    } else if (arg === "--generate-sources") {
      opts.generateSources = true;
    } else if (arg === "--help" || arg === "-h") {
      opts.help = true;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return opts;
}

function serializeJson(value, indent = 0, prefixLength = 0) {
  const pad = "  ".repeat(indent);
  const inner = "  ".repeat(indent + 1);
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const scalar = value.every((v) => v === null || typeof v !== "object");
    if (scalar) {
      const inline = `[${value.map((v) => serializeJson(v, 0)).join(", ")}]`;
      if (prefixLength + inline.length <= 80) return inline;
    }
    const items = value.map((v) => inner + serializeJson(v, indent + 1));
    return `[\n${items.join(",\n")}\n${pad}]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) return "{}";
    const body = keys
      .map((key) => {
        const prefix = inner.length + JSON.stringify(key).length + 2;
        return `${inner}${JSON.stringify(key)}: ${serializeJson(value[key], indent + 1, prefix)}`;
      })
      .join(",\n");
    return `{\n${body}\n${pad}}`;
  }
  throw new Error(`unsupported JSON value: ${typeof value}`);
}

function writeProjection(root, rel, value) {
  const abs = path.join(root, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, `${serializeJson(value)}\n`);
}

function printResult(result) {
  for (const warning of result.warnings) {
    const where = warning.line
      ? `${warning.path}:${warning.line}`
      : warning.path;
    process.stderr.write(
      `warning [${warning.code}] ${where}: ${warning.message}\n`,
    );
  }
  for (const error of result.errors) {
    const where = error.line ? `${error.path}:${error.line}` : error.path;
    process.stderr.write(`error [${error.code}] ${where}: ${error.message}\n`);
  }
  process.stdout.write(
    `contract validation: ${result.errors.length} error(s), ${result.warnings.length} warning(s)\n`,
  );
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
    return;
  }
  if (opts.help) {
    process.stdout.write(
      [
        "usage: node tools/check-contracts.mjs [--root <dir>] [--generate] [--generate-sources]",
        "",
        "Default: read-only contract validation.",
        "--generate: write implementation/COMMIT_SEQUENCE.json from the plan, then validate.",
        "--generate-sources: write references/SOURCES.json from the plan, then validate.",
        "",
      ].join("\n"),
    );
    return;
  }
  try {
    if (opts.generateSources) {
      writeProjection(
        opts.root,
        SOURCES_JSON_REL,
        buildSourcesProjection(opts.root),
      );
      process.stdout.write(`wrote ${SOURCES_JSON_REL}\n`);
    }
    if (opts.generate) {
      writeProjection(
        opts.root,
        PLAN_JSON_REL,
        buildCheckpointProjection(opts.root),
      );
      process.stdout.write(`wrote ${PLAN_JSON_REL}\n`);
    }
    const result = validateRepository(opts.root);
    printResult(result);
    if (result.errors.length > 0) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`error [INTERNAL] ${error.message}\n`);
    process.exitCode = 2;
  }
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) main();
