# svelte-ui-kit v1 — governing RCLD sequence

Status: S001–S012 independently accepted; RCLD-01 complete. S013–S032 are authored and committed pending review; independent review 2 requests the complete validation-boundary closure batch below; S033 remains locked behind independent S032 acceptance. Updated 2026-09-30.

This document is the single governing rolling commit loop document for all eleven RCLD sequences below. It carries the complete ordered S001–S203 execution plan and the approved contract snapshots needed to implement it in this repository. Creating this document is planning setup, not completion of S001, S002, or any product checkpoint.

## Authority and completion boundary

The owner approved the complete review recommendations and creation of the full execution plan on 2026-09-28. Implement the specified source-first TypeScript/SvelteKit/Bits UI generator and catalog adaptation in this standalone public repository. The product, package and executable are named `svelte-ui-kit`; the spec identifier is `svelte_ui_kit_v1`.

Durable product contracts govern implementation; the ordered checkpoints implement those contracts. The approved review dispositions below resolve target discovery and source interpretation without removing requirements or changing checkpoint order. New product scope requires a contract amendment; proven obsolete or unsafe plan scope requires a recorded deviation before action.

Completion includes the generator, original catalog adaptation, distinct Alert Dialog, generated-consumer verification, package-shaped artifacts, documentation, and a precise extension specification gate. Select/combobox/popover/date-related controls and unspecified higher-level APIs remain deferred until their own contracts and coding sequence exist. Approval of this plan does not invent those missing APIs or imply their implementation is complete.

Keep all repository content standalone and repository-relative. Record this target as `.` and the reference by its public URL and immutable revision. Do not include operator-machine locations, credentials, runtime state or external coordination paths in committed files. Preserve unrelated work. No push, publication or deployment is part of this plan.

## Execution state and resume procedure

- Governing document: `implementation/COMMIT_SEQUENCE.md` (this file); derived projection `implementation/COMMIT_SEQUENCE.json` (regenerate with `node tools/check-contracts.mjs --generate`).
- Active implementation checkpoint: **none** (S013–S032 implemented and committed pending independent Codex review; S033 stays locked until S032 is independently accepted).
- Execution responsibility (recorded at S001): Pi authors implementation and corrections; Codex reviews the actual changes, independently verifies them, and controls acceptance and progression.
- Completed implementation checkpoints: **12 / 203**. Remaining: **191 / 203**.
- Committed pending review: **20 / 203**. Authored batch range: **S013–S032**.
- Completed RCLD sequences: **1 / 11**. Remaining: **10 / 11**.
- Last safe target commit: `0d7ca2a3798f639dd6f913b2c3ed9839776bcd4c`, branch `master` (independently accepted S007–S012 combined evidence anchor).
- S001 evidence: `implementation/evidence/BASELINE.md`, `implementation/evidence/S001_REPORT.md` and independent `implementation/evidence/S001_REVIEW.md`.
- S002 evidence: `implementation/evidence/S002_REPORT.md`, independent `implementation/evidence/S002_REVIEW.md`, adopted contracts and `tools/check-contracts.mjs`.
- S003 evidence: `implementation/evidence/COMPATIBILITY.md`, `implementation/evidence/S003_REPORT.md` and independent `implementation/evidence/S003_REVIEW.md`.
- S004 evidence: `implementation/evidence/S004_REPORT.md` and `implementation/evidence/S004_REVIEW.md`. All review findings are closed; independent smoke 41/41 and contracts 83/83 pass, along with corrected metadata and mutation probes.
- S005 evidence: `implementation/evidence/S005_REPORT.md` and `implementation/evidence/S005_REVIEW.md`. Review 2 accepts the correction: independent unit 5/5, harness 29/29, smoke 41/41 and contracts 84/84 pass; original boundary/filename/failure probes are corrected. No release acceptance is claimed.
- S006 evidence: `implementation/evidence/S006_REPORT.md` and `implementation/evidence/S006_REVIEW.md`. Review 2 accepts recursive exclusions and maintained-source controls; independent unit 14/14, harness 29/29, smoke 41/41 and contracts 84/84 pass. Original nested probes are corrected; real lint/format preserve all 71 tracked/untracked authoring entries. Accepted and committed at the last safe hash above.
- S007–S012 reviews: each conventional report/review path records the tested combined candidate, original/repair provenance and independent acceptance. All RCLD-01 review findings are closed; the strict upstream declaration exception remains release AC20 debt.
- No checkpoint has been skipped or reordered. S001–S012 are complete; S013 is active and S014–S203 remain not_started. Historical dispatches/reviews below retain their original evidence and are superseded by the current dispatch.

Before execution or after a context reset, read the authority, approved dispositions, sequence gates, current ledger entry, complete current checkpoint and its contract links. Inspect current repository instructions/status and refresh baseline evidence. Only one implementation checkpoint may be active. By default every checkpoint after S001 depends on the reviewed, verified, committed predecessor. The explicit owner-authorized batch below permits verified implementation commits pending Codex review to unlock successors only within the currently dispatched sequence; the RCLD-02 activation rules below govern the transition from the historical S007–S012 batch.

Update the ledger only from actual evidence. Use `not_started`, `in_progress`, `blocked`, `verified_uncommitted`, `complete`, or `not_applicable`; the authorized batch adds `committed_pending_review` under its strict evidence rules. A complete checkpoint requires independent acceptance, commit, test outcomes, self-review and report. An N/A entry requires a prior evidence-backed deviation and equivalent replacement coverage. An uncommitted checkpoint cannot unlock its successor. Repair new relevant failures before continuing; never record an unavailable or skipped check as passed. Commit only under the active execution authorization.

After each green commit, record the hash and report, update this ledger, and reconcile remaining scope. A report may be recorded with the successor checkpoint or linked as factual evidence so it does not need to contain its own commit hash before that commit exists. Do not amend history merely to insert a self-referential hash. At every pause, report the last safe commit, next checkpoint, exact blockers and the full remaining RCLD set.

At S002, adopt the embedded contracts into their scheduled repository-relative files, establish target contract validation and an aligned `implementation/COMMIT_SEQUENCE.json` projection. This document remains the governing execution/status authority; the JSON projection must not drift into a second independently edited plan. Extracted specs govern product intent. Update this document's contract links and supersede embedded snapshots explicitly when extraction is verified; do not maintain conflicting copies silently. S001 baseline evidence and later reports are factual records, not alternate planning backlogs. No additional issue database is required by the current scaffold.

## Codex dispatch decisions — S002

These decisions supplement S002 without changing product requirements or checkpoint order. Codex owns scope, contract/API decisions, dependency-selection approval, deviations, acceptance, commits and dispatch between coding periods. Pi implements and self-reviews within the dispatched checkpoint; routine implementation choices inside an approved contract are allowed. Pi reports new consequential decisions to Codex and completes independent in-scope work while they are unresolved. It must not resolve them by silently weakening, expanding or deferring requirements.

1. Start S002 in a fresh Pi session with the actual provider/model reported. Read this authority, the complete S002 definition, the approved dispositions, all embedded contracts being adopted and S001 evidence. Do not rely on previous conversation memory. Verify Node satisfies `>=24` before any target tooling; use an already available supported runtime per process. The author's Node 24 and reviewer's Node 26 observations are environment evidence, not a new exact pin. S003 owns reproducible dependency selection and returns proposed compatibility decisions to Codex before applying them.
2. Extract all 27 embedded contracts: eleven `specs/` documents, six `decisions/` documents, seven `implementation/` guidance documents, two `references/` baseline documents, and the instruction template into root `AGENTS.md`. Merge stronger applicable instructions and add the Pi/Codex authority boundary. Preserve substantive requirements, examples, source dispositions and acceptance criteria. Project the sixteen source pointers into `references/SOURCES.json`. Rewrite relative links for each destination; replace extracted embedded bodies with an explicit superseded index pointing to adopted files. Preserve all 203 checkpoint definitions, their order, requirement coverage and eleven sequence gates.
3. Create `implementation/COMMIT_SEQUENCE.json` as a deterministic projection of this Markdown plan, not another editable authority. Include a schema version, all step IDs, sequence membership, dependency order, requirement anchors, statuses and completion evidence. An explicit regeneration mode may write this JSON; the default validation path must not write. Document the regeneration command and source of every projected field. Do not use the fixed archive's all-not-started assumptions or its payload manifest as live validation.
4. Implement dependency-free Node tooling in `tools/check-contracts.mjs` and focused regression tests in `tools/check-contracts.test.mjs` using `node:test`. Add only `check:contracts` and `test:contracts` scripts to `package.json` for this tooling; keep dependencies, engines, package manager, lockfile and workspace membership unchanged. This is S002 contract verification, not the general S005 test harness. Permit an explicit `--root` argument for disposable test fixtures. Separate any explicit projection generation mode from validation.
5. Validate required adopted files, local links and anchors, unique requirement/acceptance/checkpoint IDs, all 203 ordered checkpoints and predecessor relationships, eleven sequence boundaries, R01–R34 coverage, AC01–AC22 preservation, and Markdown/JSON semantic agreement. Reject invalid statuses, false completion without a resolvable commit/report/review evidence, and advancement beyond an incomplete predecessor. Completion evidence must resolve in this repository; never fabricate success from nonempty strings. Distinguish actual document links from clearly marked future deliverables and code examples. No network checks are required for historical external URLs.
6. Test representative failures: missing required contract, broken local link/anchor, duplicate or missing ID, invalid predecessor/status, JSON drift, missing completion evidence, and premature successor advancement. Prove default validation is read-only using complete disposable-tree snapshots including hidden files. Include a passing adopted-document fixture and useful failure diagnostics. Preserve all existing source content during extraction and demonstrate semantic comparison, not only counts.
7. Run format, contract validation and its focused tests; maintain the existing conditional reference Rust guard and document all skips. Report full commands, cwd identity, runtime selection, exit codes and log locations. Preserve original command exit statuses when capturing logs; do not infer success from a trailing shell command or truncated output. Record nested subprocess test executions separately from top-level totals.
8. Complete the full unblocked S002 scope, self-review the whole diff, update only S002 candidate state and its report, and return unstaged and uncommitted to Codex. Do not start S003, change completion evidence for later checkpoints, create a new issue database, or modify external coordination state. Codex maintains coordination separately and advances the predecessor ledger from actual accepted commits. No human release test is due at this documentation/tooling checkpoint.

## Codex correction dispatch — S002 review 1

This dispatch supersedes conflicting candidate-status language in the initial
S002 report. Complete this correction within S002; do not create a successor
checkpoint or start dependency selection. Codex reviewed the submitted source,
all adopted documents, the task log and independent disposable-tree mutations.
See `implementation/evidence/S002_REVIEW.md` for findings and reproduction cases.

### Decisions resolved by Codex

1. **Status and ownership.** Pi reports candidates as `in_progress` while
   awaiting review. Codex alone assigns `verified_uncommitted` after independent
   acceptance and `complete` after the checkpoint commit. This S002 candidate
   is `in_progress`, with changes requested, not accepted or externally blocked.
   Consequential decisions return to Codex; ordinary implementation choices
   within this dispatch remain Pi's responsibility.
2. **Evidence paths and metadata.** Keep
   `implementation/evidence/<ID>_REPORT.md` and `<ID>_REVIEW.md`; no new ledger
   column or issue database is needed. Completion requires exactly one
   `checkpoint-evidence` HTML comment in each record, containing one JSON object
   with exactly `schemaVersion`, `checkpoint`, `kind`, `commit`, `disposition`.
   Schema version is `1`; checkpoint equals the ledger ID; kind is `report` or
   `review`; accepted completion uses a full lowercase 40-digit Git hash shared
   by both records, report disposition `implemented`, and review disposition
   `accepted`. Noncomplete candidates may use null commit and report
   `candidate` or review `changes_requested`; they confer no completion.
   Codex owns accepted review metadata and records actual hashes after commits,
   carrying those factual updates with the next checkpoint. S001 metadata is
   now supplied by Codex. Pi must never manufacture acceptance.
3. **Git verification.** Resolve the ledger hash against the actual repository,
   require it to match both evidence records, be reachable from HEAD, and contain
   both evidence paths. The metadata may be recorded in the working tree after
   the commit; do not demand its self-referential hash existed inside that commit.
   Missing Git/history, empty/mismatched/rejected evidence, and an unrelated
   resolvable object are errors for a completed checkpoint, not silent skips.
   Use self-contained temporary Git histories for regression fixtures; do not
   depend on the author's checkout or change its Git configuration/history.
4. **Projection and source inventory.** Keep schemaVersion 1 and the existing
   JSON field names/shape. Document each field's source in VERIFICATION.md.
   Keep the Markdown source-inventory table as authority; SOURCES.json remains
   its deterministic projection. No independent JSON edits. Generation is an
   explicit write; default validation must remain read-only.
5. **Catalog clarity.** The approved Field/Menu/Avatar dispositions now also
   live in `specs/COMPONENT_CATALOG.md#approved-source-parity-clarifications`.
   Reconcile its three inventory rows with that normative section and link the
   plan's historical review dispositions to it. Preserve the original evidence
   and scheduled family gates; do not add component APIs at S002.

### Required corrections and acceptance

- **S002-R1 — Completion evidence.** Implement decisions 2–3. Reject blank
  reviews, explicit rejection, wrong checkpoint/kind/hash, duplicate/malformed
  metadata, fabricated hashes with no Git, unreachable commits and missing
  committed evidence paths. Positive fixtures must prove the legitimate
  post-commit-hash workflow. A matching substring is not acceptance evidence.
- **S002-R2 — Plan consistency.** Validate ledger IDs in exact S001–S203 order,
  fixed approved RCLD-01–RCLD-11 IDs/ranges, each step's sequence membership,
  sequence predecessor links, one nonempty scope/green/verification gate per
  sequence, and agreement between map and sequence-body ranges/state. Derive
  sequence state from its ledger: all not_started means not_started; all
  complete means complete; otherwise in_progress. Check the top-level completed
  and remaining checkpoint/sequence counts against the ledger. Preserve all
  203 full definitions and R01–R34 / AC01–AC22; parse definition IDs outside
  examples and reject extra/unknown IDs. Do not let regeneration legitimize an
  invalid plan. `not_applicable` must fail closed without a separately approved
  evidence-backed deviation; none exists, and this dispatch grants no skipping.
- **S002-R3 — Links and anchors.** Missing ordinary local links are errors
  regardless of `src/`, `tests/` or similar prefixes. If a future deliverable
  truly needs a clickable link, require an explicit same-line annotation
  `<!-- future-deliverable: SNNN -->` naming an existing noncomplete checkpoint;
  only that annotated missing target may warn. Prefer inline-code paths for
  illustrative future files. Support inline and reference-style Markdown links,
  code-formatted link labels, explicit anchors and heading anchors. Reject
  duplicate explicit IDs; do not invent suffixed HTML IDs. Respect fence marker
  length and code spans so examples neither create links/IDs nor hide real ones.
  Add focused parser cases, including nested fences and duplicate headings.
- **S002-R4 — Verification quality.** Add regressions for every independently
  reproduced gap, including default CLI nonzero exits. Snapshot entries with
  lstat: directories (including empty/hidden), file bytes/modes, symlink targets
  and entry kinds; ignore access times, not writes. Prove successful and failing
  default validation leave the full temporary tree unchanged. Exercise explicit
  projection generation, repeated-byte determinism and subsequent validation.
  Keep tests independent of a missing-Git bypass; retain the original useful
  negative cases. No new dependencies or general S005 harness.
- **S002-R5 — Documentation and report accuracy.** Align AGENTS.md,
  SCOPE_AND_ASSUMPTIONS.md, OPEN_QUESTIONS.md, VERIFICATION.md and report guidance
  with Codex's authority and these resolved choices. Keep the report's historical
  initial results, append corrections/retests, and distinguish source comparison
  of all definition fields from parseDefinitions' title/anchor subset. Correct
  shortened/inconsistent extraction digest labels and list all four ignored
  reference tests precisely. Mark obsolete planning-only observations as
  historical; do not claim the candidate is accepted while review is outstanding.

Use a fresh Pi session for this correction dispatch. Preserve the entire
uncommitted S002 candidate and all Codex governance changes. Execute every
unblocked correction, run the target lanes and the existing conditional Rust
guard before returning, and leave all work unstaged/uncommitted for Codex.
No product implementation, S003 work, remote action or publication is authorized.

## Codex correction dispatch — S002 review 2

This is the current dispatch and supersedes conflicting review-1 instructions.
It stays within S002; no product requirement, dependency selection, checkpoint
order or later implementation is added. The 46 submitted tests and the nine
original invalid mutations were independently rerun successfully. Review 2
nevertheless reproduced failures at the next legitimate lifecycle state and
additional false acceptance of malformed evidence/example definitions. See the
review-2 section in `implementation/evidence/S002_REVIEW.md`.

### S002-R6 — Make regression fixtures independent of live checkpoint progress

The current fixture copies the live plan/evidence and substitutes only S001's
hash. A valid repository with S001 and S002 complete passes the validator but
fails both positive fixture tests because S002's commit is absent in their new
Git histories. Hard-coded current counts and the S003-premature-advancement
mutation also assume the checkout never advances.

Codex chooses explicit fixture-owned lifecycle states. Build a small allowlisted
contract fixture from the approved documents, normalize its entire ledger,
sequence states, summaries and evidence to a deliberate test scenario, and
create only its own temporary Git history. Keep canonical negative cases on a
fixed one-complete-checkpoint scenario; create separate two-complete and
sequence-boundary positive scenarios. Do not copy or import the operator's Git
objects, hard-code a real accepted hash, or recursively copy future product
build artifacts just to test contracts. The real checkout remains covered by
`check:contracts` and a read-only structural comparison.

Check fixture-generation exit codes instead of silently discarding failures;
an intentionally invalid scenario may explicitly expect failure. Clean temporary
fixtures even if construction fails. Retain the useful lstat purity and CLI
exit-code assertions.

Acceptance includes an isolated end-to-end rehearsal: copy the candidate tooling
and required documents into a temporary repository, establish at least two
legitimate completed checkpoints with post-commit hash recording, then run the
entire contract test suite from that advanced repository. Also exercise a later
sequence boundary. Validation and tests must pass without importing real
checkpoint commits or mutating the target. Temporary test commits are permitted;
target/reference/parent commits remain prohibited for Pi.

### S002-R7 — Validate evidence throughout the acceptance lifecycle

The review-1 dispatch did not explicitly define accepted-but-uncommitted evidence.
Codex resolves that ambiguity now. Keep schema version 1 and the same five
metadata keys and projection shape. The authoritative state rules are:

| Ledger status                     | Report disposition | Review disposition | Commit field         | Evidence requirement                                                                            |
| --------------------------------- | ------------------ | ------------------ | -------------------- | ----------------------------------------------------------------------------------------------- |
| not_started, in_progress, blocked | candidate          | changes_requested  | null                 | Records optional; every present record must be structurally valid and match its checkpoint/kind |
| verified_uncommitted              | implemented        | accepted           | null                 | Both records required; only Codex may assign this state/acceptance                              |
| complete                          | implemented        | accepted           | Matching full hashes | Both required, with the existing Git resolution, ancestry and committed-path checks             |

An optional absent record is different from a malformed present record. Reject
malformed JSON, non-object payloads and duplicate records for every state;
never discard parser problems merely because parsing produced no record.
Unapproved `not_applicable` remains an error; no deviation or new N/A branch is
authorized. `steps[].completion` stays null until `complete`. No successor may
start from `verified_uncommitted`.

Add positive and negative state-transition tests: candidate to Codex acceptance
with null hashes, accepted precommit to real commit plus post-commit hashes,
and successor eligibility only afterward. These are synthetic fixture states;
Pi must not accept the actual S002 candidate or edit Codex's real review verdict.
Update VERIFICATION.md, report guidance and scope/ownership documents to use
this same matrix without competing prose rules.

### S002-R8 — Count real definitions and preserve structural multiplicity

The validator currently accepts the full R01–R34 table or AC01–AC22 definitions
inside fenced examples, and silently overwrites duplicate RCLD body blocks in
a Map. Apply consistent outside-fence parsing to all structural ID sources,
including requirements, acceptance criteria, sequence titles/bodies, source
inventory and summary counts. Literal fenced examples must neither satisfy
missing definitions nor create duplicate/unknown-ID failures. Evidence comments
inside fenced examples must not count as live checkpoint records.

Retain sequence-body multiplicity until validation: require exactly one body
for each approved sequence and reject duplicate/unknown bodies before indexing.
Keep fixed ranges, order, gate and state checks. Add positive example fixtures
and negative moved-into-example/duplicate-body fixtures; regenerate projections
in the negative cases so the intended structural diagnostic is exercised.
Do not implement an unrelated general Markdown framework or add dependencies.

### Return boundary

Use a fresh Pi session for all three corrections. Preserve the completed
review-1 fixes and the whole existing candidate. Reconcile the report with exact
test outcomes and distinguish the untracked candidate projection from a committed
artifact. Run all target lanes, the advanced-state rehearsal and the existing
conditional reference Rust guard. Return S002 `in_progress`, unstaged and
uncommitted, with no S003 work and no remote or coordination mutation. Codex has
resolved the remaining N/A question: retain fail-closed behavior until a real
approved deviation exists. No owner decision or human release test is needed.

## Codex correction dispatch — S002 review 3

This is the current dispatch and supersedes conflicting earlier dispatches.
S002 remains `in_progress`, unaccepted and uncommitted. Preserve the existing
candidate, all 70 useful regressions, fixture-owned histories and the resolved
state matrix. No checkpoint, product scope or dependency selection is added.

### S002-R9 — Parse live evidence boundaries before extracting JSON

The current `parseEvidenceRecords` regex first consumes comments across the raw
document and only afterward filters matches by whether their opening is fenced.
It also counts only comments with a closing delimiter. Codex reproduced:

1. Removing the closing delimiter from a present S002 candidate record gives
   zero errors: malformed present evidence is treated as optional absence.
2. Appending an unterminated second record to a valid completed S001 review
   gives zero errors: the extra malformed live record is ignored.
3. Placing a fenced, unterminated example comment before a valid completed
   review makes the valid live record disappear and validation fails. The raw
   regex consumes through the live record's closing delimiter before discarding
   the match whose opening was fenced.

Codex's interpretation is explicit: a live checkpoint-evidence opening marker
establishes a present record attempt, even without a terminator. Every live
attempt must be counted and validated; malformed or unterminated attempts must
produce a diagnostic in every ledger state. Fenced literal content contributes
neither delimiters nor records and cannot consume, terminate or hide live
metadata. Keep the existing exact five-key schema and lifecycle matrix.

Implement a bounded scanner or equivalent pre-masking approach that preserves
these boundaries. Do not build a general Markdown parser, add dependencies or
relax malformed/duplicate validation. Add focused parser and CLI regressions
for all three reproductions, including missing delimiters in optional and
required states, an unterminated extra attempt after a valid record, and an
unfinished fenced example before a valid record. Preserve a clean optional
absence case and completed literal-example cases. Include a negative case
where a fenced closing delimiter must not repair a live malformed attempt.

Run contract validation, the entire contract suite, formatting, diff health and
both isolated advanced-state full-suite rehearsals. Preserve complete-tree
read-only behavior and temporary cleanup. Reconcile report wording with the
actual comparison: the ordinary validator checks structural IDs and coverage,
not byte/full-body equivalence of all 203 definitions. Codex's independent
full-definition comparison supplies that separate preservation evidence.

### Reference guard and reporting decision

Use the existing authorized reference worktree, verified clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98`, for the conditional Rust guard. The
previous attempted run selected a different dependency-cache checkout. No new
copy or relaxed machine policy is necessary. The operator dispatch supplies the
local reference path; keep such paths and private tooling out of public files.
Codex's review-3 evidence records the fresh guard results separately from Pi's
previous blocked attempt. No reference source changes are authorized.

Codex's fresh fmt/check/test guard passed for this same S002 checkpoint: 562
top-level test passes plus 16 nested subprocess passes, zero failures and four
explicitly ignored tests. For the next S002 parser-only correction pass, verify
the identical reference hash and clean state, then cite this same-checkpoint
reviewer evidence without claiming a fresh Pi run. Repetition is required if
the reference/Rust scope changes or the evidence is invalidated. This bounded
reuse does not waive the existing guard for later checkpoints.

Codex has reconciled the public candidate report to remove private workstation
tooling details; keep exact operator commands and log locations in the external
return/coordination record. Append the new correction results without changing
Codex's actual review disposition or claiming that historical checks were fresh.

### Return boundary

Use a fresh Pi session for the focused S002-R9 correction and reporting work.
No owner decision remains unresolved. Return unstaged/uncommitted with S002
still `in_progress`, report `candidate`, review `changes_requested`, null hashes
and S003 untouched. Codex independently reviews and accepts before any target
commit or successor dispatch. No human release test is due at this checkpoint.

## Codex dispatch — complete RCLD-02 models and registry resolution

Decision date: 2026-09-30. This is the current execution dispatch. Codex has
independently accepted S007–S012 together at evidence anchor
`0d7ca2a3798f639dd6f913b2c3ed9839776bcd4c`, which contains all twelve
report/review paths and the reviewed source from
`7d3401c9a19ca7915ff7f0c9c0280760c81b5509`. Fresh cumulative target checks
and independent prior-fault probes pass. RCLD-01 is complete; all its review
findings are closed. Twelve checkpoints are accepted; 191 remain. The narrow
fixture declaration exception remains an open release AC20 obligation.

### Independent review 3 — complete joint constraints and ownership validation

Decision date: 2026-09-30. Candidate `49b12b25c66d1f2d9e5855f65c368a2a1cca8ea9`
is **changes requested**. Preserve all five repair/evidence commits, original
S013–S032 hashes and prior accepted work. Twelve checkpoints remain accepted,
twenty remain `committed_pending_review`, and 171 remain `not_started`;
191 checkpoints and ten sequences remain unfinished. S033 is still gated on
independent S032 acceptance. This subsection is the current closure dispatch;
reviews 1 and 2 below are historical findings and retained decisions. Original
R01–R34, AC01–AC22 and all dependency gates remain unchanged. No owner decision,
hardware requirement or external blocker prevents the remaining software work.

Fresh reviewer build/typecheck pass, as do unit191/191, registry22/22,
integration20/20 (including five installed-copy controls), CLI52/52 and
contracts117/117, zero skips. Replayed production probes now reject the prior config overlaps,
same-root provider substitution, removed schemas, independently supplied wrong
snapshot authority, escaping default schema reads, incompatible single items,
CSS case aliases and JSON-order failures. An unreadable owned asset returns a
typed EACCES diagnostic without a physical path. Snapshot immutability and the
previous SemVer/serialization repairs remain intact. The schema/asset R2-2
finding and the CLI implementation part of R2-4 are closed. Config derivation
and exact CSS-alias repairs are also verified progress. R2-1 and R2-3 remain
partial for the failures below; cumulative evidence is not whole acceptance.
Author browser23/components22/SSR23/harness37 and fresh reference578 pass,
zero fail/four ignored plus checksum-verified actionlint evidence were audited;
they are not new reviewer browser/Rust runs. Release/platform and upstream
AC20 obligations remain open.

Execute **`pfc through RCLD-02`** for the entire remaining validation boundary:
the groups below, all remaining original S013–S032 work, integrated maintained
controls, installed-copy verification, evidence reconciliation and cumulative
qualification in green local commits. Continue after each green checkpoint.
Do not stop at one repaired assertion. S033 cannot be combined with this batch
because independent S032 acceptance is a hard dependency. Preserve the single
live authorization record; no new plan, tracker or authorization mechanism.

1. **RCLD02-R3-1 — Intersect constraints over the complete selected closure
   (remaining R2-3; S016–S018/S027/S031/S032).** `validateCompatibility`
   currently intersects root, item and npm constraints separately for each item.
   That is not joint closure validation. Under root date `^3.8.1`, item A date
   `>=3.8.1 <3.10.0` and item B date `>=3.10.0 <4.0.0` pass both
   `validateRegistryHealth` and `validateResolvedInventory`. Replacing B's
   compatibility restriction with an explicit `@internationalized/date` peer
   requirement `>=3.10.0 <4.0.0` also passes. Fully parsed fixtures reproduce
   both failures with validated schemas and content hashes.

   Build one complete constraint set per mapped axis from the qualified root,
   every selected item's compatibility and all selected explicit npm records
   for that package. Evaluate one true joint intersection using the already
   qualified SemVer implementation. Do not substitute pairwise or per-item
   overlap, rewrite root support, drop peer roles, or manufacture runtime
   dependencies from support metadata. Preserve pinned Svelte/Bits admission.
   Diagnostics identify the package/axis and involved item IDs/ranges in stable
   order. Apply this same validation to health and resolved-operation callers.
   Cover disjoint items, cross-item peer conflicts, transitive closure items,
   pairwise-overlapping but jointly empty OR ranges, order permutations, valid
   overlap and exclusion of unselected candidates. Keep these as parsed
   multi-item fixtures, with both success and rejection assertions.

2. **RCLD02-R3-2 — Complete logical file-role ownership validation
   (remaining R2-1/R2-3; S019/S020/S027/S032).** Fully parsed advertised styles
   targeting `kit.css` and `kit.css/card.css` pass health and operation
   validation, although the first target must be a file and the second needs it
   to be a directory. `parseKitLock` accepts case-alias source records
   `src/ui/button.svelte` and `src/ui/Button.svelte`, and accepts a source file
   together with a descendant of that same file. With validated mapping
   UI=`src/ui`, styles=`src/ui/styles`, state=`src/ui/_kit`, it also accepts
   a layout integration whose file path is exactly `src/ui/styles`.

   Finish the existing lexical ownership contract now, before filesystem work.
   Validate the whole set of logical file claims and required directory roles,
   using ASCII case folding and segment-aware ancestry. Apply consistent rules
   to source files, aggregate stylesheet targets and integration records, within
   their actual namespace/context, including within one item's output set and
   across selected items. A file cannot also be a directory or ancestor of
   another file; differently spelled case aliases cannot name distinct owners.
   Every integration path is a file and cannot claim a required namespace
   directory. Reject incompatible overlapping ownership roles across lock
   records; preserve explicitly compatible sharing of one exact aggregate
   stylesheet by distinct blocks and its stylesheet integration. Preserve valid
   compound siblings, safe nested directory mappings and source/style namespace
   separation. Do not ban every shared CSS path or every directory nesting.
   No on-disk project discovery, transaction work or S033 advancement is needed.
   Exercise actual parsers, loaded registry health and resolved inventory, not
   just partial cast objects. Original config/schema/CLI controls must stay green.

3. **RCLD02-R3-3 — Complete integration, qualification and evidence.** After
   the repairs, audit every original S013–S032 criterion and unresolved R1/R2
   finding against actual callers; finish any remaining eligible work within
   this sequence. Run all original direct and cumulative lanes, installed-copy
   positive/negative controls, actionlint and the final reference guard as
   specified below. Retain failed attempts and exact commands/exits/counts,
   tested revision/configuration and evidence paths. Reconcile qualification
   and checkpoint reports without claiming the previous green lanes covered
   these new failure cases. Keep original pending hashes and accepted counters;
   only Codex may promote acceptance atomically. Preserve the narrow upstream
   declaration qualification and release AC20 debt. Public evidence stays
   standalone; runtime/session/coordination metadata belongs outside this repo.

### Independent review 2 — finish the RCLD-02 validation boundary

Decision date: 2026-09-30. Candidate `baebed721b88afa48f6c3af489cb6daa193088ee`
is **changes requested**. Preserve the seven repair commits and all original
S013–S032 hashes. All twenty checkpoints remain `committed_pending_review`;
S001–S012 stay accepted and S033 remains `not_started`. This historical review
is superseded for current execution by review 3 above; review 1 below retains
the original findings and decisions. No original requirement, acceptance criterion or dependency
has been waived. No owner decision or external/hardware blocker is outstanding.

Fresh reviewer checks pass: typecheck, unit179/179, registry18/18,
integration16/16 (including copied installed modules), CLI52/52 and
contracts117/117, zero skips. Original failed probes now confirm strict release
identities, exact initial support, basic traversal/reserved-descendant rejection,
snapshot byte/nested-metadata immutability, the three reported SemVer fixes,
JSON errors when the flag precedes the error, and strict JSON data rejection.
A separate bounded membership probe checked529 range pairs against216 versions
(114264 comparisons), with zero mismatches. RCLD02-R1-3 and RCLD02-R1-6 are
closed; preserve their maintained controls. Provider missing-schema/UTF-8 checks
on cold roots, symlinked listing-start rejection, integrated graph checks and
shared aggregate CSS also represent preserved progress. R1-1, R1-2, R1-4,
R1-5 and R1-7 remain partially addressed for the reasons below. This is not
checkpoint acceptance, release acceptance or a reopening of accepted RCLD-01.

Execute **`pfc through RCLD-02`** for the complete remaining validation boundary:
all four groups below, actual caller integration, maintained negative and
positive controls, evidence and cumulative qualification in green local repair
commits. Continue after every green checkpoint. S033 cannot be combined because
independent S032 acceptance remains a hard dependency. No single-fix endpoint
or further authorization mechanism is needed; preserve the existing live tuple.

1. **RCLD02-R2-1 — Complete role-aware mapping/ownership overlap validation
   (S014/S019/S020).** The parser still accepts layoutFile equal to
   `src/styles/kit.css`, layoutFile equal to the case alias
   `src/lib/components/ui/_KIT`, layoutFile `src/lib` (a file ancestor of
   required directories), and stylesDir equal to the root exports file
   `src/lib/components/ui/index.ts`. Validate the entire derived target set
   with explicit file/directory roles, ASCII case folding and segment-aware
   ancestry. A file cannot equal or be an ancestor of a required directory or
   another differently owned file, and layout cannot alias any generated CSS,
   export or state target. Apply equivalent context-aware lock checks, including
   a managed file claiming a namespace directory or an ancestor of reserved
   state. Preserve the intentional UI/state directory nesting, valid safe custom
   mappings and multiple unique CSS blocks in one aggregate file; do not replace
   these rules with a blanket ban on every nested directory. Reuse the approved
   lexical helper; actual filesystem/project discovery remains S033+ work.
   Add table-driven positive and negative cases through actual model parsers.

2. **RCLD02-R2-2 — Remove schema and asset authority bypasses (S025–S027,
   actual config/lock/theme/envelope callers).** The new provider path coexists
   with `legacyValidatorFor`/raw reads used by default parsers. An isolated copy's
   config parser follows an escaping schema symlink containing `{}` and accepts
   an unknown config field; a missing schema throws raw ENOENT with a physical
   path. Remove the raw legacy path and route every model caller through the
   same contained, typed authority, with a safe installed-package default.
   Lazy initialization may preserve bare CLI bootstrap usability.

   The process-global authority cache uses only `provider.root`: a second
   provider with the same root and a reject-all schema is ignored, and a new
   load after schema removal still succeeds. A caller can also supply another
   root's authority to `loadRegistrySnapshot` and load a package with no schemas.
   Bind authority to one captured operation's validated schema bytes/provider;
   do not trust an independent root string or caller-supplied authority. Each
   new operation must validate its own inputs. Reuse compilation only for the
   same verified captured content; no test-only reset call may be necessary for
   correct production behavior. Completed snapshots remain immutable despite
   later filesystem/provider changes. Prefer an internally owned operation
   context over separately injectable provider/authority objects that disagree.

   `readBytes` also throws EACCES instead of returning a typed failure for an
   unreadable owned fixture. Handle ordinary read/stat/list/resolve failures at
   the provider boundary, retain useful cause codes and safe logical locators,
   and avoid raw host paths/stacks in public diagnostics. Do not invent a hostile
   race guarantee. Add cold/warm, same-root-different-provider, schema replacement
   and deletion, wrong-authority, symlink and I/O controls. Exercise config,
   lock, theme, envelope and snapshot parsing from copied emitted modules.
   Strengthen the positive installed-copy test with missing/corrupt/escaping
   asset negative controls that prove authoring fallback cannot satisfy it.

3. **RCLD02-R2-3 — Finish integrated compatibility and style validation
   (S016–S018/S027–S032).** Fully parsed advertised items declaring Svelte `^4`,
   Bits `^1` and date `^2` pass health under the qualified root. The current
   integration checks npm records but only syntax-checks compatibility fields.
   Validate the joint compatibility constraints of the root and selected items,
   and reconcile matching explicit npm constraints without dropping roles or
   actual peer requirements. The pinned root's qualified Svelte/Bits versions must remain admitted;
   other peer ranges require joint satisfiability. Do not rewrite the root
   compatibility claim to hide a conflict. Map axes to Svelte, bits-ui and
   @internationalized/date explicitly. Keep tested support separate from actual
   peer requirements; do not fabricate runtime dependency records from support
   metadata alone. Installed package discovery remains a later project gate.
   Use the repaired npm semantics and typed diagnostics with involved identities.

   Removing whole-file CSS ownership checks also removed style-target case
   checks: two distinct blocks targeting `kit.css` and `Kit.css` now pass health.
   Distinct block owners may share the exact aggregate target, but differently
   spelled ASCII case aliases must fail. Preserve duplicate block/source/export
   checks and styles-relative target spelling. Add fully parsed valid multi-item
   and failing compatibility/peer/case-alias cases through registry health and
   the operation validation path; do not limit coverage to cast partial objects.

4. **RCLD02-R2-4 — Parse JSON intent and command attribution independently
   of the first error, then qualify the whole sequence (S022/S023 and evidence).**
   Built `info --bogus --json`, `--cwd --json info` and
   `--bogus info --json` still emit no JSON envelope because parsing returns
   before seeing the flag. Use one shared lexical classification for JSON intent
   and command attribution across both usage and adapter metadata failures;
   inspect the complete argument list without executing anything or swallowing
   errors. Respect option-value boundaries: `--cwd=--json` is a value, whereas
   the grammar rejects a separate `--json` as the missing --cwd value and it
   still expresses JSON intent. Do not misclassify a directory value `info` as
   the command. A recognized command stays attributed to that command even
   when an earlier flag is invalid; missing/unknown commands use `help`.
   Metadata errors for `--json info` currently claim `help` and a maintained
   test enshrines that contrary to review1; correct the caller and assertion.
   Preserve one envelope, exits, human-mode output, no writes and stable bare
   help/version. Add spawned executable permutations and copied metadata cases.

   An invalid package.json that Node rejects before this ESM entrypoint executes
   is an explicitly identified runtime-loader failure, not an application
   result; the already accepted bootstrap negative control remains relevant.
   Preserve that evidence boundary rather than claiming the adapter ran or
   redesigning the launcher outside this batch. All metadata errors controlled
   by the running adapter must follow the JSON protocol and attribution rules.

   Reconcile all R1/R2 reports and retained commands/results; do not label the
   remaining groups complete until their production paths and maintained
   controls pass. Keep public evidence standalone and private runtime metadata
   outside this repository. Retain the qualified upstream declaration exception
   with its release AC20 obligation, original hashes, accepted evidence and one
   live batch record. Run all original direct and cumulative target checks,
   fresh installed-copy controls, actual actionlint and final reference guard.
   Codex alone owns independent acceptance and the later atomic transition.

The endpoint is the entire repaired and qualified S013–S032 candidate with all
remaining original criteria and R2 groups addressed, before S033. A commit,
report, partial passing run or long conversation is not a stop. Respect user
stops, actual runtime limits and concrete external blockers; continue other
eligible work where possible. No physical hardware or human-only gate prevents
this batch. No dependency change or product scope expansion is approved.

### Independent review 1 — complete RCLD-02 closure dispatch

Decision date: 2026-09-30. Candidate `9b576117ac1e76b3e724921ca12405a8e079f05f`
is **changes requested**. All twenty S013–S032 implementation commits remain
`committed_pending_review`; no acceptance hashes, counters or original commit
provenance change. S001–S012 remain accepted, RCLD-01 remains complete, and
S033 remains `not_started` behind independent S032 acceptance. This subsection
supersedes contrary implementation deferrals and report claims within this
batch; the original checkpoint criteria and model decisions below remain in
force. No owner-authority decision or external/hardware blocker is outstanding.

Fresh reviewer checks passed: typecheck; unit 148/148; registry 8/8; CLI 49/49;
runner harness 37/37; integration 15/15; contract validation with zero findings;
and contract regressions 117/117, all with zero skips. Isolated reviewer probes
against the built production modules nevertheless reproduce the failures below.
Passing the existing helper tests does not establish whole-sequence acceptance.
Author cumulative browser/component/SSR/reference evidence was inspected, not
re-executed as fresh reviewer evidence. Previously accepted lifecycle, strict
upstream audit, containment and historical/atomic acceptance repairs stand.
The newly implemented bounded authorization, registry runner, explicit-root
provenance and cleanup-error retention are useful verified progress; retain them.

Execute **`pfc through RCLD-02`** for all seven closure groups below, maintained
regressions, installed-artifact qualification, evidence reconciliation and green
local repair commits. Continue after every green checkpoint through the full
boundary. This is the complete remaining eligible models/registry work, not a
single-defect batch. S033 cannot be combined because its predecessor acceptance
gate has not passed. Preserve the one existing live batch record and task-store
identity; no bypass or new status is needed.

1. **RCLD02-R1-1 — Enforce model identities and safe mappings (S013–S020).**
   `parseKitConfig` accepts `uiDir=../outside`, absolute UI roots, styles in
   `uiDir/_kit`, and a layout colliding with state. The current comment/report
   deferring these checks to S033 contradicts the approved dispatch. Enforce
   lexical safety, overlap and reserved-state protection now; real filesystem
   containment and later project discovery remain S033+ work. Apply the same
   reserved-state ownership requirements to lock validation with explicit
   validated mapping context where necessary; retain valid multiple CSS blocks
   in one aggregate file. Root `registryVersion` and lock tool/registry versions
   accept `garbage`; enforce strict SemVer on every release identity at actual
   parse boundaries, not only a standalone helper. Advertised initial support
   must be exact Svelte `5.57.1` and Bits `2.19.3`, not unqualified caret ranges.
   Keep actual Bits peers Svelte `^5.33.0` and date `^3.8.1` distinct from tested
   support and preserve all dependency pins. Record the remaining implemented
   lock/integration field spelling in DATA_MODEL.md as previously required.

2. **RCLD02-R1-2 — Use one validated package asset view (S025–S027).**
   Snapshot loading succeeds without the supplied package's schemas, and health
   accepts a supplied item schema changed to reject everything: `schema.ts`
   still reads schemas independently beside its own module. Replace that stale
   fallback with the same explicit, contained package/provider authority used
   by the operation. Compile/cache only validated schema inputs with identities
   that cannot cross-contaminate different providers. Missing, invalid UTF-8,
   malformed/non-object (`null` currently throws), invalid or incompatible
   schemas must fail with typed logical diagnostics. No remote schema loading.
   Source/style bytes must be UTF-8 validated too; bytes `ff fe` currently pass
   advertised health. `list("registry")` currently follows a symlinked starting
   directory outside the package; validate traversal start and ancestors and
   report filesystem failures through typed results. Keep trusted-local race
   limits honest; no claim of hostile-race resistance is required.
   Freeze the entire snapshot contract: root, manifests, nested arrays/records,
   asset digests and owned bytes. Today mutating exposed bytes breaks their hash,
   and pushing a dependency changes a previously resolved snapshot. Defensive
   copies/read-only access are permitted; shallow Object.freeze and TypeScript
   readonly alone are insufficient. Preserve provider-mutation isolation.
   Add real package-copy/tarball execution from a different CWD, loading emitted
   modules and schemas from that package with no authoring-tree fallback.

3. **RCLD02-R1-3 — Compute a truthful joint npm constraint (S031).**
   `intersectRanges(["*", ">=1.0.0-rc.1 <1.0.0"])` currently returns a
   nonempty range even though the first operand excludes every prerelease and
   the second permits only prereleases. Concatenating comparator sets loses
   each operand's npm prerelease admission rules. The OR case
   `["^1 || ^2", ">=1 <3"]` drops the entire valid 2.x branch by returning the
   first satisfiable clause; a lone unsatisfiable range also returns success.
   Preserve the full intersection, all original per-range semantics, all roles
   and requiredBy provenance. Test membership in the result against membership
   in every operand, with stable/release/prerelease, OR, zero-major, empty and
   permuted/redundant operands. An internal complexity limit may yield a typed
   inability-to-evaluate error, never a false dependency conflict; no arbitrary
   512-combination acceptance restriction is approved. Do not add a dependency
   or substitute pairwise overlap for joint intersection.

4. **RCLD02-R1-4 — Complete integrated registry health and CSS ownership
   (S027–S032).** Health currently declares an item with a missing registry
   dependency installable, without invoking the graph/dependency/collision
   checks. Compose the production validation path so advertised inventory and
   resolved operations fail before planning on cycles/missing items, invalid
   compatibility/dependency requirements and ownership/export collisions.
   Retain candidates outside advertised claims, and preserve empty development
   inventory rather than publishing fixture components. Test actual fully
   parsed fixtures through this path, including valid multi-item inventory;
   handcrafted partial objects cast as RegistryItem are insufficient alone.
   Correct the ownership interpretation: distinct uniquely owned component
   blocks **must share `kit.css`**. S032 currently rejects valid button/card
   blocks solely for sharing that path. This clarifies "style ownership" in
   decision 7 below: block ownership is unique; aggregate CSS is not wholly
   owned by one item. Retain duplicate block/source-file/public symbol and ASCII
   case-collision rejection. Use styles-namespace-relative `kit.css`, not a
   second copy of the project's stylesDir inside manifest targets. Explicit
   dependency order, exports and requested/transitive provenance must survive
   the integrated healthy multi-item case.

5. **RCLD02-R1-5 — Route every JSON failure through the real CLI (S022–S023).**
   Built `--json view`, `info --json --bogus` and `--json nonsense` exit 2 with
   empty stdout and a human stderr usage message. Preserve JSON intent through
   parse failure and emit exactly one valid deterministic envelope, including
   controlled bundled-metadata failures in the Node adapter. Keep human-mode
   failures off stdout, the existing exit map, nonmutation and stable bare
   help/version. For a recognized command use that command in the envelope;
   absent/unknown command uses existing `command: "help"` with a usage
   diagnostic. This is a protocol attribution decision, not an additional
   product command. Never echo raw physical arguments as public locators or
   include incidental stack traces/logging. Cover global flag ordering,
   duplicate flags, missing values, invalid item IDs, unknown commands and
   missing/invalid copied package metadata via spawned built executables.

6. **RCLD02-R1-6 — Validate semantic metadata without losing meaning
   (S021/S024).** Canonical serialization turns Date/Map into `{}` and a sparse
   array into invalid JSON. Accept only JSON data, reject unsupported objects,
   sparse/undefined entries and cycles with controlled typed diagnostics;
   retain exact bytes, key sorting, meaningful array order and one LF.
   Theme validation accepts reversed layer order and `../escape.css` as a
   stylesheet. Enforce the existing exact ordered three-layer contract
   (tokens, themes, components), safe logical stylesheet mapping and unique
   semantic token/property identities; do not equate a sorted set with CSS
   cascade order. Preserve independent contracts, full radius grammar and
   qualified portal capabilities. Add schema/runtime agreement controls.

7. **RCLD02-R1-7 — Reconcile evidence and finish the whole boundary.**
   The cumulative public report contains a parent mount path and workstation
   execution-router command. Remove those from public evidence; all public
   commands/paths must be standalone and repository-relative. Retain exact
   host execution details privately, without copying transcripts into plans
   or issue records. Amend reports to distinguish original implementation,
   repairs, known failures and fresh qualification; preserve every original
   implementation hash. Add the missing production-path negative controls to
   maintained repository lanes/CI and prove their sensitivity to the faults.
   Include real installed-package loading evidence rather than only a tarball
   inventory or an injected provider reading a directory from checkout code.
   Keep the existing qualified two-upstream-error declaration exception and
   its open release AC20 obligation; no broad suppression or dependency upgrade.
   Run all original direct checks and cumulative target qualification, actual
   actionlint and fresh final reference guard. Capture real exit codes. Pi
   reports implementation/evidence only; Codex performs later independent
   acceptance and any atomic twenty-checkpoint state transition.

The legitimate endpoint is the full repaired S013–S032 candidate, with all seven
groups and original criteria verified and recorded, before S033. A green commit,
partial test run, report or conversation length is not a stop. Respect user
stops, actual runtime limits and concrete external blockers; continue other
eligible work if one part is blocked. No physical hardware or human-only gate
prevents this software work.

### Batch boundary and execution authority

Execute `pfc through RCLD-02`: implement, verify, self-review and commit S013–S032
in their original order, including the necessary bounded tracker/runner tooling
below. Continue after every green checkpoint. Return the entire sequence for
independent Codex acceptance before S033. RCLD-03's existing S032 acceptance
dependency is the reason for this endpoint. No product requirement, original
checkpoint definition, R01–R34 or AC01–AC22 is removed or weakened.

Only S013 is active initially. A green committed pending predecessor may unlock
its successor inside this exact batch; independent completion remains with
Codex. No intermediate return for ordinary engineering decisions is required.
S033 and all later checkpoints stay locked. No push, publication, deployment,
reference mutation or new task store is authorized.

The validator originally permitted only the historical RCLD-01 tuple. As the
first S013 prerequisite, Pi extends and tests its existing bounded
authorization mechanism for exactly one of these two approved tuples: the
historical RCLD-01/S007–S012 tuple or RCLD-02/S013–S032. Keep one live record;
do not introduce a generic bypass, another status/schema, or relax completion
evidence. Before the first S013 implementation commit, atomically replace the
old live authorization with the following record only after its validator and
regressions are implemented:

```json
{
  "schemaVersion": 1,
  "sequence": "RCLD-02",
  "first": "S013",
  "last": "S032",
  "mode": "pfc",
  "review": "codex-after-sequence"
}
```

This JSON is the replacement payload, not a second live authorization. The
live record below was atomically transitioned from the completed RCLD-01 tuple
to RCLD-02 before the first S013 implementation commit. The validator still
recognizes the historical RCLD-01 tuple so historical fixtures and accepted
RCLD-01 evidence remain valid, but only one record is live in this plan.

<!-- checkpoint-batch
{"schemaVersion":1,"sequence":"RCLD-02","first":"S013","last":"S032","mode":"pfc","review":"codex-after-sequence"}
-->

Test accepted S012 required
before S013, ordered reachable pending hashes/reports, exact range matching,
malformed/duplicate/fenced/widened authorizations, no S033 advancement, unchanged
complete-state semantics, historical fixtures, and atomic whole-batch acceptance.
Keep all accepted S001–S012 evidence intact. Report pending implementation hashes
truthfully and generate JSON from Markdown. Add the registry suite to the
existing typed runner at S027 with the same explicit selection, containment,
failure and zero-test guarantees; update its tests, typecheck and CI together.

One author contract-fixture attempt failed during construction and cleanup
reported ENOTEMPTY, masking the initial error. Subsequent full author runs and
two fresh Codex runs pass; the original cause is not established. During the
authorized fixture-tooling work, preserve original construction errors with any
cleanup failure attached, use bounded cleanup retries for transient directory
errors, and add controlled failure coverage. Never turn a failed setup into a
passing test or hide the recorded failed attempt.

### Resolved model, schema and protocol decisions

1. **Versions and dependencies (S013–S014).** Use independent positive integer
   schema/protocol/contract versions starting at 1, strict SemVer tool/registry/
   item releases (initial package and empty development registry 0.1.0), and
   separate exact-byte SHA-256 content identities. Framework compatibility is
   a separate npm range, never a schema version. Initial advertised compatibility
   is restricted to the qualified Svelte 5.57.1/Bits 2.19.3 baseline; retain the
   actual Bits date/Svelte peer requirements. Do not broaden tested-support claims.
   Approve exact runtime dependencies `ajv` 6.15.0 and `semver` 7.8.5, already
   present in the locked dependency graph, plus exact development types
   `@types/semver` 7.8.0. No other dependency changes. Use local JSON Schema
   draft-07, fixed local URN identities, no invented hosted schema URLs, remote
   resolution, coercion, default injection or removal of unknown properties.
   Compile shipped schemas once; unknown fields fail. TypeScript model types,
   runtime validators and schema fixtures must agree.

2. **Desired config (S014–S015).** Freeze the top-level spelling as
   `schemaVersion`, `toolVersion`, `registry`, `uiDir`, `stylesDir`, `layoutFile`,
   `requested`; `registry` is the literal `builtin`. Version 1 and default roots
   are `src/lib/components/ui`, `src/styles`, `src/routes/+layout.svelte`.
   State is derived as `uiDir/_kit`, root exports as `uiDir/index.ts`, and kit/
   themes/app CSS filenames remain the specified names under stylesDir. These
   fixed derivations are not extra configurable modes. Explicit custom safe
   mappings are allowed; no arbitrary Svelte config execution. Reject duplicate
   desired requests, invalid item IDs, reserved-state overlap and lexically
   unsafe paths; later filesystem validation remains a distinct required gate.
   Repeated add normalization is idempotent and never replaces explicit roots
   with their dependency closure. Do not generate fake lockfiles at this stage.

3. **Registry and manifests (S016–S018).** Root fields are `schemaVersion`,
   `registryVersion`, `contentHash`, `compatibility`, `items`; items is an array
   of unique `{id, manifest}` records to make duplicate detection explicit.
   The development root advertises no unimplemented items. Use fixture-owned
   sample inventories for resolver tests. Manifest fields are `schemaVersion`,
   `id`, `kind`, `version`, `description`, `compatibility`, `files`, `exports`,
   `styles`, `registryDependencies`, `npmDependencies`, `accessibility`.
   Kind is `component` or `foundation`; simple/compound shape follows explicit
   files/exports. File records identify `source`, `target`, `kind` (svelte or
   typescript), and `cohort`; export records identify `name`, `target`, and
   `kind` (value or type); style records identify `source`, `target`, `blockId`
   and `cohort`. CSS-only foundations have no invented source file/export.
   Targets are validated logical paths relative to their declared UI/styles
   namespace. Dependency records identify npm `name`, `range` and `role`
   (runtime, tooling or peer). Accessibility metadata is descriptive required
   names, keyboard/focus/form behavior and associated test obligations, never
   executable hooks or a claim that untested components are accessible.

4. **Lock and theme contracts (S019–S021).** Lock top-level fields are
   `schemaVersion`, `toolVersion`, `registryVersion`, `registryHash`, `configHash`,
   `requested`, `items`, `files`, `cssBlocks`, `integrations`. Use canonical
   owner records instead of redundant stored reverse indexes. Item records
   retain identity/version/digest and explicit versus transitive origin; each
   file/block record retains logical path, owner, upstream `baseHash`, effective
   `itemVersion` and `cohort`, plus `blockId` for CSS. Integration records retain
   kind/path/baseline/contract identity. A preserved customized target must not
   inherit incoming version/hash metadata falsely. No current local hash is
   relabeled as base, and hashes do not imply stored merge-history bytes.
   Freeze remaining record spelling in DATA_MODEL.md before its first consumer,
   within these prescribed semantics; this is routine schema implementation.
   Theme/token/customization schema versions stay independent. Describe actual
   token roles, CSS grammar/defaults/fallbacks, layer order, producer and portal
   scope capabilities. Preserve full border-radius grammar and the existing
   three named layers; no Rust ABI claims or invented runtime theme store.

5. **CLI protocol and grammar (S022–S023).** Retain the specified single result
   envelope and status vocabulary. Freeze exits: 0 success/planned/no_change/
   non-strict warning; 1 ordinary error; 2 usage/unsupported; 3 strict-doctor
   broken/unsafe result unless a more specific class applies; 10 conflict;
   11 unsafe path; 12 registry failure. Choose the most specific causal class
   deterministically; customization alone remains non-failing. Diagnostic
   fields are `code`, `level`, `message`, optional safe logical `locator` and
   `guidance`; changes distinguish planned from applied actions. JSON stdout
   contains exactly one envelope, without incidental logging or sensitive paths.
   Parse only info/init/view/add/sync/doctor and existing help/version. Add/view
   take exactly one item; bare view is a usage error. Global --json/--cwd may
   precede or follow the command; --dry-run belongs only to init/add/sync,
   --source only to view, --strict only to doctor. Reject duplicate/unknown
   flags, missing values and extra positionals. Keep existing bare help/version
   output stable. Commands whose later handlers do not yet exist must return
   honest unsupported results, never successful fake plans or writes.

6. **Hashes/assets/snapshots (S024–S027).** Exact file/preimage hashes are
   SHA-256 over bytes, represented as lowercase 64-hex strings. Semantic JSON
   serialization recursively sorts keys with code-unit ordering, uses two-space
   indentation plus one LF, rejects non-JSON/nonfinite values, and preserves
   array order unless that array is explicitly a sorted set. Registry content
   identity hashes the canonical root without its own contentHash plus a sorted
   list of logical asset paths and exact-byte digests; never hash itself or host
   paths/timestamps. Name semantic versus byte hashes distinctly. Load only
   bundled package-relative assets, never CWD/reference/network fallback. Reject
   traversal, symlink escape, invalid UTF-8 and missing assets. Freeze a copied
   immutable operation snapshot: later provider mutation must not change bytes.
   Package-copy/build verification is local and eligible now; final release
   packaging acceptance remains in its scheduled sequence.

7. **Graph/requirements/collisions (S028–S032).** Use deterministic dependency-
   before-dependent ordering with code-unit item-ID tie breaking; detect cycles
   with paths, missing IDs and repeated diamond visits. Keep sorted explicit
   roots separate from closure and preserve root provenance through retirement
   projections. Npm constraints use strict npm SemVer behavior, including OR,
   zero-major and prerelease cases; check the joint intersection, not merely
   pairwise overlap, and preserve runtime/tooling/peer roles. Unsupported git/
   file/URL source requirements are typed errors, not guessed registry ranges.
   Reject duplicate source/style ownership, block IDs, public exports and ASCII
   case-folded target collisions across the resolved inventory. No project
   writes, auto-installation, automatic merge or extra commands are authorized.

### Verification and return

Run each original checkpoint's direct tests and format/lint/typecheck before
its green commit. Then run the full existing target lanes, new registry lane,
local installed-package asset checks, schema/protocol/graph negative controls,
workflow validation and contract regressions. Intermediate reference reuse
requires unchanged clean-hash evidence; run a fresh reference guard at the
final sequence milestone. Retain failures/skips and exact source/configuration
evidence; pending commits are not accepted completion. Update governing progress
and reports after each green checkpoint and return all S013–S032 dispositions,
commits, exact checks, evidence and legitimate stopping reason. A green commit,
report or long conversation is not the batch endpoint. Continue independent
eligible work if one slice is blocked. No owner-authority decision is outstanding.

## Historical Codex review dispatch — RCLD-01 closure after repair review

This is the current dispatch, dated 2026-09-30. It supersedes the earlier
takeover's current-work narrative without changing product scope, checkpoint
IDs/order, R01–R34, AC01–AC22 or any sequence dependency. Reviewed candidate:
`206d5dd5ca373dcdb30647390d10f720759bc289`, clean at review, with eight local
repair/bookkeeping commits after `9310790c9900f3cfdc516e4a8cf42b8095c7422a`.
The original S007–S012 pending hashes remain unchanged.

The initial follow-up found no new implementation. A subsequent closure batch
returned seven commits through `370db8501e55388e7347e8a8a076a134fb9fd7bf`,
clean at independent review. The current disposition and execution instructions
below supersede the earlier unfinished-work narrative while preserving its
requirements, historical evidence and original pending hashes.

### Final independent review — evidence preparation (historical transition record)

Codex reviewed the combined candidate `7d3401c9a19ca7915ff7f0c9c0280760c81b5509` on
2026-09-30 against S007–S012 and every prior finding. All RCLD01-R2 and R3
findings are closed. Fresh cumulative target lanes pass, including components
22/22, browser23/23, integration15/15 without skips and contracts108/108.
Independent audit/workspace/cleanup and browser-artifact probes pass. Each
checkpoint report and review records the exact original and repair revisions,
coverage, checks and remaining release limitations. The masked ENOTEMPTY
author attempt is retained and does not recur in the fresh full suite.

The next acceptance action is the previously approved atomic evidence-commit
transition. Until its anchor exists, all six remain pending with original
hashes and changes_requested/null structured review metadata. This paragraph
supersedes the following historical changes-requested disposition; no product
code changes are part of the evidence/acceptance commits. The strict upstream
exception remains a release AC20 obligation; this is not full MVP acceptance.

### Preceding independent review and remaining closure batch

Changes requested on the complete candidate; no checkpoint promotion. Keep
6/203 accepted, six pending, 191 not started and all eleven sequences unfinished.
Preserve the substantive new repairs: real authored Svelte/TypeScript/referenced
declaration/dependency diagnostics now fail the strict qualifier; browser body
and dependent-fixture teardown issues fail; startup rejection stops and drains
the owned child; and existing nonregular write targets are rejected before open.
RCLD01-R2-3 is closed by source review and fresh maintained malformed-readiness,
timeout, spawn-failure and successful-lifecycle controls. The behavioral fixes
for R2-2 and R2-4 are verified; their remaining evidence gaps are below. R2-1
remains incomplete at the protocol consistency and fixture-ownership boundaries.

Fresh independent checks on this candidate: four-config typecheck exit 0;
components 19/19; Chromium production-browser lane 22/22; production build and
SSR/lifecycle 23/23; integration 13 passed, one socket-path skip. A separate
execution of the maintained socket test with an owned short temporary root
passed 1/1 without skips and cleaned its root. The author's full target-lane
results were audited against the unchanged code and retained logs. The clean
reference's author-run fmt/check/test results were also audited (578 passed,
zero failed, four ignored); they are not fresh reviewer Rust runs. Remote CI,
other platforms and release acceptance are not claimed.

Complete all three groups below in the same `pfc through RCLD-01` batch:

1. **RCLD01-R3-1 — complete strict-audit consistency and owned cleanup.**
   An independent real-baseline mutation replacing the COMPLETED total with
   `0 FILES`, `1 FILES`, or an overflowing integer still produces
   `qualified-upstream-exception` with two problem files and no reasons.
   Replacing START's workspace with an unrelated existing directory likewise
   qualifies against a different fixture because the relative diagnostic paths
   still resolve to the same installed Bits files. Require every summary count
   to be a finite nonnegative safe integer, reconcile errors/warnings/problem
   files as before, and require total files to be at least problem files. Do
   not freeze the legitimate total to today's 747. Resolve START's workspace
   and require it to identify the actual fixture passed to the qualifier,
   accepting equivalent real paths but rejecting absent or different roots.
   Keep exact diagnostic, pin, process-outcome and package-path checks intact.

   The version-guard test also calls `prepareStrictFixture()` without retaining
   its cleanup handle. An isolated successful run leaves an owned consumer
   directory behind. Register cleanup immediately for every allocated copy,
   including this test, and prove no owned fixture remains after success or
   intentional assertion failure. Do not remove unrelated temporary trees.
   Add these controls to the maintained component lane; retain the existing
   separate real authored/dependency controls and clean restoration proof.

2. **RCLD01-R3-2 — preserve screenshots for collector-detected failures.**
   The original teardown-error false pass is fixed. However, closing the page
   before the collector assertion means these failures retain a trace and
   error context but no configured failure PNG. All six fresh maintained fault
   children show this omission. A separate dependent-fixture teardown probe
   fails for its intended console diagnostic with no PNG; a normal body
   assertion control does retain a PNG. Preserve a usable screenshot attachment
   for collected body/teardown faults while the page is available, then keep
   enforcement after actual page teardown/close and event draining. Do not
   restore the earlier assertion boundary, suppress messages, or add sleeps.
   Evidence-capture errors must not replace the original browser diagnostic.
   Assert retained nonempty screenshot and trace artifacts in the real fault
   controls, with isolated output and clean restoration. Preserve ordinary
   assertion-failure artifacts and the verified startup-ownership repair.

3. **RCLD01-R3-3 — make nonregular-target regressions genuinely bounded.**
   The current FIFO test calls synchronous `writeFile` in its own test process
   and checks elapsed time only after return. Removing the guard in an isolated
   copy hangs that unchanged test until the reviewer's external 1.5-second
   deadline kills it. The maintained runner provides no deadline for this
   synchronous block. Move the potentially blocking operation into an owned
   child with an enforceable external deadline, explicit exit/signal/error
   assertions, and parent-owned cleanup. Prove a regressed blocking writer is
   terminated and reported as a failure, not a pass or indefinite hang; prove
   the real helper rejects before open and preserves kind/mode/size/bytes.
   A timer in the same blocked process is insufficient. On the supported local
   and CI platforms, missing mkfifo or fixture setup failures are failures,
   not silent skips. Use an owned short socket path so the locally capable
   socket control runs without the avoidable path-length skip. Do not use real
   devices, mutate global temporary-directory settings, or change the trusted
   local threat model. Keep these controls in the maintained integration lane.

Then reconcile stale progress and evidence statements and run the full existing
cumulative qualification, including all new controls in the actual CI lanes.
Use narrow affected checks for each green repair commit, preserve underlying
command exits, and continue after every green checkpoint. Preserve original
pending hashes and append repair hashes; JSON remains derived and completion
stays null. The original narrow declaration exception and release AC20 debt
remain unchanged. No dependency or product-scope expansion is approved.

Endpoint: the entire remaining RCLD-01 candidate, verified and committed for
Codex review before S013. S012's independent acceptance gate still prevents
RCLD-02 advancement; there is no eligible successor implementation to combine
across that gate. No owner decision or hardware blocker remains. Reuse audited
reference results only at unchanged intermediate revisions; run the required
fresh reference guard at the final repaired milestone. Codex alone performs
the previously approved atomic acceptance transition.

### Preceding independent disposition and preserved progress

Changes requested; no additional checkpoint or sequence is accepted. Keep
S001–S006 complete (6/203), S007–S012 pending (6/203), S013–S203 not started
(191), and all eleven RCLDs unfinished. The earlier spawn-error/prior-exit/
shutdown-stderr regressions, symlink containment, actual Thumb rendering/types,
shared CLI executor and historical-plan compatibility have substantive repairs.
Preserve them. Successful tests do not close the remaining failures below.

Fresh independent checks passed: four-config typecheck; unit 20/20;
integration 12/12; component 7/7; CLI smoke 41/41; production build and
SSR/lifecycle 23/23; contract regressions 108/108. Chromium passed 11/11 on
the freshly built fixture with the inherited NO_COLOR/FORCE_COLOR conflict
removed from the command environment. The initial unnormalized browser run
failed 1/11 because the owned server emitted Node's conflicting-color warning;
the strict stderr gate correctly rejected it. No warning suppression is an
acceptable repair. Formatting must be checked again after governance changes.

The reference remains clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98`. The author-run fresh reference
fmt/check/test exits were audited, with 578 passed, zero failed, four ignored;
these are not fresh reviewer Rust runs. Remote CI, other browser/OS lanes,
package acceptance and human release testing remain unproven and are not due
at this bootstrap gate.

### Previous review findings and resolved implementation decisions

These are the preceding review's definitions and evidence. The current
dispositions and three remaining closure groups above govern execution.

1. **RCLD01-R2-1 — strict audit admits extra authored errors (blocking).**
   In an owned copy, a real `src/audit:extra.ts` error produces three checker
   errors but the audit parses only two and qualifies the upstream exception.
   More decisively, a referenced `src/audit:extra.d.ts` with invalid declarations
   passes the normal fixture check with zero diagnostics, while the strict
   checker reports four errors in three files and is still qualified. The
   human-output parser excludes colons from paths; summary errors/files are
   never reconciled with parsed diagnostics. Appending unknown fatal output
   also still qualifies. Only the Bits version is checked and suffix matching
   does not establish that the diagnostic names the installed package file.

   Use the pinned svelte-check 4.7.6 `--output machine-verbose` protocol,
   documented in its installed README, rather than broadening a human-output
   regex. Parse the actual START, timestamped diagnostic JSON, COMPLETED and
   FAILURE records completely and fail closed on malformed, unknown, duplicate,
   truncated or inconsistent output. Keep sync/check outcomes and stderr
   separately attributable. Require expected exit 1, no signal/timeout/tool
   failure, exactly two error diagnostics, zero warnings, exactly two problem
   files and consistent summary totals. Validate numeric TypeScript code 2590,
   source, message, positions and actual resolved package-relative paths in
   the installed Bits root. Check the executed compatibility versions (Bits
   2.19.3, TypeScript 6.0.3, Svelte 5.57.1, svelte-check 4.7.6) and preserve
   existing fixture pins, including csstype/date. Changed compatibility must
   require a new decision, not inherit the exception silently.

   Add independent parser controls for unknown/truncated output, summary
   mismatch, duplicates, warnings, tool errors/signals/timeouts, changed pins
   and misleading path suffixes. Add real separate authored `.svelte`, `.ts`,
   referenced `.d.ts` and additional-dependency controls, including valid local
   filenames containing colons/spaces. Prove normal plus strict qualification
   cannot together admit the declaration probe. Restore and requalify the
   baseline; never mutate shared installed dependencies. The temporary
   skipLibCheck exception is not accepted at this candidate until these audit
   conditions hold. The two genuine upstream errors remain a release AC20
   obligation; no broader exception or dependency change is approved.

2. **RCLD01-R2-2 — browser errors after the collector assertion pass
   (blocking).** The automatic issue fixture depends on `page`, so its
   assertion runs before page-fixture teardown. An isolated real Chromium test
   using the maintained fixture emitted `console.error` during page teardown
   and still passed 1/1, exit 0. Move the enforcement boundary so the relevant
   page/context hooks and teardown complete, close/drain events, and only then
   assert collected errors. Preserve Playwright trace/screenshot artifacts and
   assertion failures. Do not use arbitrary sleeps to approximate closure.

   Add bounded real-run controls for console errors, hydration warnings and
   page exceptions separately, including an event emitted during teardown;
   each must fail for the intended diagnostic. A nonzero child exit or a test
   title substring alone is insufficient proof. Include a clean restoration
   run, check child exit/signal/timeout and preserve output isolation. When
   NO_COLOR is present, remove conflicting FORCE_COLOR only from owned child
   environments and preserve the parent environment. Do not filter stderr or
   disable warnings.

3. **RCLD01-R2-3 — browser startup rejection loses ownership (blocking).**
   `startFixtureServer()` awaits readiness before returning its handle. Both
   callers assign their server only after that await. A disposable copy with
   a controlled malformed-readiness launcher rejects but leaves its owned
   child alive; the caller's afterAll cannot reach it. Ensure the startup helper
   retains ownership and stops/drains the child on every rejected readiness
   path before rethrowing the original diagnostic, with cleanup failures
   retained. A small injected launcher boundary for tests is authorized; no
   product API or general service abstraction. Cover malformed readiness,
   bounded readiness timeout, spawn failure and successful startup/shutdown,
   proving the owned PID/listener is gone and unrelated resources untouched.
4. **RCLD01-R2-4 — nonregular final write target can hang (blocking).**
   `writeFile` rejects directories/symlinks but opens a FIFO. An isolated real
   FIFO probe blocked until its 800 ms child deadline (ETIMEDOUT/SIGTERM).
   Require an existing final file target to be a regular file before opening
   it. Reject FIFO/socket/device targets without side effects, retaining the
   existing symlink/ancestor/cleanup protections and trusted-local threat model.
   Use a real bounded FIFO regression on supported local/CI platforms; verify
   rejection before opening, preserved kinds/modes/bytes and owned cleanup.
   Do not test against actual devices or claim hostile-race resistance.

The native run also records a red formatting check immediately followed by
commit `2c39906c40c5063b816ddf561465ce793d527f53`; the pipeline returned the
tail command's success. `206d5dd` repaired formatting. Preserve history and
disclose this workflow violation, but do not repeat it. Capture each underlying
command's exit explicitly (or use checked pipefail), fail before committing,
and never infer success from a trailing command. Preserve failed attempts,
including the earlier browser artifact collision and declaration-test repair.

### Whole-batch execution, evidence and endpoint

Execute `pfc through RCLD-01`. Implement all four findings, their real negative
controls, caller integration, current documentation and cumulative qualification
as one authorized batch of coherent green commits. Start with RCLD01-R2-1;
then close the coupled browser findings and nonregular-target safety. Continue
other independent eligible work if a slice has a genuine blocker. Current
closure-batch progress is recorded below and assessed by the current review
above. Reconcile this section and report addenda
after every green commit; do not stop after one fix or passing subset.

This is the full remaining eligible implementation within the required review
boundary. RCLD-02 explicitly requires independent S012 acceptance, which the
four failures prevent. S013 stays locked; no hardware or human-only blocker
prevents these software repairs. No new product requirements, wrappers,
schemas or commands are introduced by this dispatch.

Preserve the original six pending ledger/report hashes and all prior repair
hashes. Append the new actual repair commits without rewriting history; keep
completion null and accepted counts unchanged. Regenerate JSON from Markdown
explicitly. The previously approved atomic evidence-commit acceptance design
remains unchanged and belongs to Codex alone. Do not perform real acceptance,
partial promotion or S013 activation based on synthetic transition tests.

Run narrow affected checks before each commit, then the full cumulative target
lane set in VERIFICATION.md: strict frozen install, format/lint/typecheck,
unit/harness/integration/components/CLI smoke, fixture check/production SSR,
Chromium including real failing controls, contract validation/regressions,
actionlint and diff health. Add the new mandatory controls to the actual lanes
and CI, not optional manual probes. Keep raw upstream failure evidence distinct
from successful exception classification. At intermediate commits, reuse the
audited unchanged reference guard with clean-hash checks; run fresh reference
fmt/check/test once at the final repaired milestone as previously required.

Return the entire verified candidate for independent review before S013, with
actual runtime, original/repair revisions, per-finding and per-requirement
dispositions, commands/exits/counts, retained evidence, failures/skips, remaining
work and exact stopping reason. A report, commit, context length or partial
passing run is not an endpoint. Genuine external blockers, user stops, actual
runtime limits and the required independent acceptance gate remain legitimate
stops. No owner decision is outstanding for these repairs.

### Closure-batch progress

S007–S012 remain `committed_pending_review` with their original pending
hashes; completion stays null and no acceptance state changes. Repair commits
are appended separately as they land.

- `9e1b397c7e3429a95178a2e227fcc6c5b525b452` — RCLD01-R2-1: the strict
  declaration audit parses the pinned `svelte-check --output machine-verbose`
  protocol fail-closed (START, timestamped diagnostic JSON, COMPLETED,
  FAILURE), validates the executed compatibility pins and real
  installed-package paths, and adds pure parser, synthetic classifier and real
  authored `.svelte`/`.ts`/referenced `.d.ts`/additional-dependency controls
  including colon and space filenames. Components lane 19/19.
- `abeedd301c634461ae791618311462ffd575af23` — RCLD01-R2-2/R2-3: browser
  issue enforcement runs after `page.close()` drains the lifecycle, per-fault
  bounded child runs cover console, hydration, page-exception and their
  teardown emissions with a clean restoration run, `startFixtureServer`
  retains ownership and stops and drains its child on every rejected readiness
  path, and owned child environments drop a conflicting `FORCE_COLOR` only
  when `NO_COLOR` is set. Browser lane 22/22; SSR/lifecycle lane 23/23.
- `0c02a233e77c02850086cabd364e97a1fd83aa17` — RCLD01-R2-4: the owned
  temp-project write helper requires an existing final target to be a regular
  file, rejecting FIFO, socket and device targets before opening while
  preserving symlink and ancestor protections, with a real bounded FIFO
  regression and a socket control. Integration lane 14 tests (13 pass, 1
  skipped only for the remapped long UNIX-socket path).
- `a71a6c44609cf26992eb57909ea5f30155348c90` — lane/CI integration and
  documentation reconciliation: every
  mandatory control lives in a maintained lane that CI already runs — strict
  audit controls in `test:components`, per-fault and startup-ownership browser
  controls in `test:browser -- tests/browser/harness.spec.ts`, and the
  nonregular-target FIFO control in `test:integration`. Lane meanings are
  updated in `implementation/VERIFICATION.md`; report and compatibility
  addenda record the repair hashes and results.

Closure-batch cumulative qualification ran at `a71a6c4` with all fourteen
target lanes exiting 0 (unit 20/20, harness 35/35, integration 14 tests with
one documented UNIX-socket path skip, components 19/19, CLI smoke 41/41,
SSR/lifecycle 23/23, browser 22/22, contract tests 108/108, `check:contracts`
clean), a fresh reference `cargo fmt`/`check`/`test` guard at the clean
reference revision, and a checksum-verified `actionlint 1.7.12` run. Full
command/exit/count evidence is recorded in
`implementation/evidence/COMPATIBILITY.md` and the git-ignored lane logs. This
is implementation and verification only: S007–S012 remain pending independent
Codex review, completion stays null and S013 is not started.

### RCLD01-R3 closure-batch progress (2026-09-30)

The current review's three remaining groups are repaired on top of the earlier
closure batch. S007–S012 remain `committed_pending_review` with their original
pending hashes; completion stays null and no acceptance state changes. Repair
commits are appended separately as they land.

- `a5422fe26bf671a613959949dd3954bfbad9db46` — RCLD01-R3-1: every COMPLETED
  summary count must be a finite nonnegative safe integer and the total file
  count must be at least the problem-file count (the legitimate total is not
  frozen to any checked-in value); START's workspace must resolve to the real
  audited fixture root; and every owned strict-audit copy registers cleanup
  immediately, with a bounded child control proving cleanup after success and
  after a deliberate assertion failure. Components lane 22/22.
- `6a973b4514d99549fd41dc69a9c3d068f3f12e29` — RCLD01-R3-2: a failure
  screenshot is captured while the page is still available and retained as a
  real output artifact for collector-detected faults, enforcement stays after
  page close and event draining, an ordinary body-assertion fault kind keeps
  Playwright's own artifacts, and every bounded fault control asserts nonempty
  screenshot and trace artifacts. Browser lane 23/23.
- `e8b402311ba8994d3bfea7a1ba77bb38ae48626b` — RCLD01-R3-3: the potentially
  blocking FIFO write runs in an owned child under an enforceable external
  deadline with explicit exit/signal/error checks and parent-owned cleanup, a
  regressed blocking writer is terminated and reported as a failure, missing
  mkfifo or fixture setup failures no longer skip on supported platforms, and
  the socket control runs from an owned short socket root. Integration lane
  15/15 with no skips.

The cumulative RCLD-01 qualification for the final repaired revision
`8cb5abaf72be02f5fdf5ff4c5484cf7ebc195c40` (all fourteen target lanes exit 0;
integration 15/15 with no skips, components 22/22, browser 23/23, contract
tests 108/108), the fresh reference guard at the clean reference
`a10fbf06334f4648f5755e05a7147414e4e5fc98` and the checksum-verified
`actionlint 1.7.12` run are recorded in
`implementation/evidence/COMPATIBILITY.md` and the git-ignored lane logs. This
is implementation and verification only: S007–S012 remain pending independent
Codex review, completion stays null and S013 is not started.

## Codex takeover dispatch — RCLD-01 repair and qualification

Decision date: 2026-09-30. This is the current dispatch within the existing
S007–S012 authorization, superseding stale pre-implementation instructions in
the following historical dispatch. The original checkpoint definitions,
R01–R34, AC01–AC22 and all eleven sequence gates remain intact. This section
is part of the single governing execution plan, not a replacement backlog.

### State, scope and endpoint

The returned implementation is `9310790c9900f3cfdc516e4a8cf42b8095c7422a`.
Only S001–S006 are accepted: 6/203; six further checkpoints are authored pending
review; S013–S203 are not started. No sequence is accepted. The reference is
unchanged and clean at `a10fbf06334f4648f5755e05a7147414e4e5fc98`.

Execute `pfc through RCLD-01`: finish every eligible repair below, complete the
remaining primitive and CLI-boundary implementation, and run cumulative
qualification. Commit coherent green repair slices without rewriting original
commits. Continue after each commit. The endpoint is the fully repaired,
verified S007–S012 candidate returned for independent Codex review, before
S013. RCLD-02 explicitly depends on S012 acceptance; this required gate makes
a wider implementation batch ineligible. A single fix or green commit is not
the endpoint. No hardware dependency prevents the identified software work.

### Confirmed findings and ordered work

1. **S007/S008 lifecycle and failure enforcement.** Isolated reviewer probes
   confirm missing-command and invalid-cwd spawn failures leave `stop()`
   unresolved past its configured deadline; stopping erases an already
   observed exit 17; and SIGTERM stderr appears after callers sample health.
   Settle spawn errors, preserve the first failure, distinguish an intentional
   shutdown from a prior exit, await stdio close/drain, and bound the whole
   termination path including forced shutdown. Both SSR and browser callers
   must enforce health after teardown. Retain the original HTTP/status/HTML,
   request-deadline, SSR-disabled, type-negative and cleanup controls. Cover
   missing command/cwd, late stderr, prior exit, forced termination and
   idempotent cleanup deterministically. Browser issue collection must span
   the test lifecycle through teardown, with an end-to-end deliberately
   failing browser control, not only a collector-array assertion.
2. **S009 physical containment.** A disposable external sentinel was changed
   by writes through ancestor and final symlinks; `writeDir` and symlink
   creation also escaped through a linked parent. Reject these paths before
   mutation, including dangling links and invalid non-directory ancestors.
   Explicit creation of a fixture symlink is still supported, but subsequent
   writes must never follow it. Cover bytes, modes, directory/link inventory,
   cleanup after setup/assertion failure, and owned-root containment. Preserve
   typed-runner suite isolation and strict selection. This does not introduce
   product transactions or claim hostile concurrent-race resistance.
3. **S010/S011 primitive qualification and dependency audit.** The current
   ordinary span is not `Switch.Thumb`. Render and qualify the actual pinned
   Root and Thumb, with real checked/ref/child types and merged props; retain
   SSR, hydration, accessible semantics, pointer/keyboard/programmatic state
   and ref/focus assertions. Close the dependency decision below and wire its
   strict audit into the component lane and CI. Keep the initial platform
   claims bounded to local Chromium and the specified CI configuration.
4. **S012 real adapter boundary.** `main.ts` repeats the executor's dispatch.
   Route the actual adapter through `runCli` (or its existing shared executor),
   retaining package-relative metadata validation and process effects in the
   adapter. Preserve all 41 CLI smoke behaviors, pure/nonmutating imports,
   readonly interfaces and consumer import boundaries. Do not begin schemas,
   registry implementation or new commands from S013 onward.
5. **Governance compatibility and sequence closure.** A valid historical
   fixture with no batch authorization and no pending checkpoints passes
   before removing the new summary and fails solely for that missing summary
   afterward. Restore old rules for this historical shape; present summaries
   must still be accurate, and live batch/pending states must still require
   valid authorization and summary evidence. Preserve malformed/fenced
   evidence, real Git reachability, read-only checks and old completion
   regressions. Add an atomic batch-acceptance rehearsal as described below.
   Update command/compatibility/report claims, remove private host-tool
   references from current public reports, and run all cumulative lanes.

Run the narrow relevant verification before each repair commit; keep one
repair slice active in this section. Later independent eligible repairs may
continue if a slice has a genuine blocker, but no red slice may be committed or
represented as accepted. Preserve original checkpoint IDs/order; these are
follow-up repairs of authored work.

Repair progress (appended after each green commit; these are repair snapshots,
not the original pending implementation hashes recorded in the ledger):

- **RCLD01-REPAIR-1 — S007/S008 lifecycle and browser failure gate.** Commit
  `8f58879f86b376252125aa52ca39db0384183c6d`. Settles spawn failures, retains
  the first failure across `stop()`, drains stdio before teardown resolves,
  forces SIGKILL within a bound, and samples SSR/browser health after teardown.
  Adds an end-to-end browser fault control that fails a real bounded nested run.
  Verified: owned-server 16/16, `test:fixture` 23/23, browser 11/11,
  format/lint/typecheck green.
- **RCLD01-REPAIR-2 — S009 physical containment.** Commit
  `156f0104d5049162bfcce1921bf9b71bb7b6cb86`. Rejects symlinked or invalid
  physical ancestry and final targets before mutation, keeps explicit fixture
  symlink creation supported, and snapshots complete external trees. Verified:
  integration 12/12.
- **RCLD01-REPAIR-3 — S010/S011 primitive and strict-declaration audit.**
  Commit `c9108c459d124e231430a382b21f198ed17eb5ae`. Renders the actual pinned
  `Switch.Thumb`, adds the mandatory strict declaration audit with fault
  controls, and reports the two pinned upstream diagnostics as a qualified
  exception. Verified: components 7/7, fixture 23/23, browser 11/11.
- **RCLD01-REPAIR-4 — S012 shared CLI executor.** Commit
  `024495a0854ce4566678feb1dbb461a2f049e7a3`. Routes the adapter through the
  shared `runCli` executor, keeps metadata validation and process effects in the
  adapter, and retargets the hard-coded-version mutation control. Verified: CLI
  smoke 41/41, unit 20/20, harness 35/35, integration 12/12.
- **RCLD01-REPAIR-5 — governance compatibility and complete qualification.**
  Commit `49a82eca2942bcad3cad0844419481076edca003`. Restores historical-plan
  compatibility (no pending summary required without a batch or pending state)
  while keeping present summaries accurate, adds synthetic atomic
  batch-acceptance, partial-acceptance and negative regressions, and removes
  private host-tooling references from public reports. Verified: contracts
  108/108, the full cumulative lane set green, and a fresh reference guard
  (fmt/check/test exit 0; 578 passes, 4 ignored) at
  `a10fbf06334f4648f5755e05a7147414e4e5fc98`.

Batch return: S001–S006 remain the only independently accepted checkpoints
(6/203). S007–S012 remain `committed_pending_review` with `completion: null`;
their original implementation hashes are unchanged and the repair commits above
are recorded separately. No self-review is represented as Codex acceptance.
This repair batch does not claim MVP, RCLD-01 acceptance or release readiness.
S013 remains locked until a separate Codex dispatch follows successful
independent S012 acceptance.

### Dependency decision and bounded upstream exception

Approve exact fixture dev dependency `csstype 3.1.3`: installed Bits and
svelte-toolbelt declarations import it without a runtime dependency. Keep all
other approved pins. An independent disposable check with `skipLibCheck:false`
reproduced only two errors, zero warnings, exit 1: union-complexity diagnostics
in Bits 2.19.3's `dist/bits/button/components/button.svelte.d.ts:2:23` and
`dist/bits/calendar/components/calendar.svelte.d.ts:2:25`, under TypeScript
6.0.3 / Svelte 5.57.1 / svelte-check 4.7.6.

The fixture-only `skipLibCheck:true` is permitted for the RCLD-01 normal check
only when paired with a mandatory strict declaration audit in `test:components`
and CI. Run the real checker with `skipLibCheck:false` in an owned copy; retain
its actual exit and full diagnostics. Qualify exactly the two pinned upstream
diagnostics by package/version, package-relative path, location, diagnostic
identity and count; reject unknown output, missing diagnostics, additional
errors/warnings, changed pins, tool failure and timeout. Do not whitelist an
entire dependency tree or accept a nonzero exit by itself. Add controls proving
authored `.svelte`, `.ts` and `.d.ts` errors and an additional dependency error
fail the audit, and restoration returns to the known baseline. Never modify
shared installed packages to inject faults; use disposable owned copies.

This is an explicit bootstrap compatibility exception, not a raw strict-check
pass and not release acceptance. No authored diagnostic or API loss is waived.
Keep the raw failure visible in compatibility evidence and carry its resolution
as an open release AC20 obligation in this plan until a Codex-reviewed minimal
compatibility repair removes it. Reevaluate at dependency changes and before
qualifying generated/packed consumers. No dependency upgrade/downgrade, patch
to upstream public APIs, broad suppression, SSR disable or `any` workaround is
authorized. Pi reports genuinely new dependency decisions with evidence while
continuing eligible work.

### Repair evidence and later atomic independent acceptance

Keep the original six implementation hashes in pending ledger/report metadata
during repairs. Record each subsequent repair commit and its exact reviewed
content/tests in report addenda and this section. These hashes identify the
original authored snapshots; reports must not imply repairs existed there.
Do not repoint an early pending hash beyond its still-pending successor, amend
history, invent acceptance, or increment accepted counters. Regenerate JSON
from Markdown explicitly; pending completion remains null.

Codex independently reviews the final combined snapshot and all six checkpoint
requirements. If review succeeds, Codex first records all six review paths,
tested snapshot and per-checkpoint original/repair hashes in a green evidence
commit E, retaining pending states and changes_requested/null review metadata
until formal acceptance. Then Codex transitions all six entries atomically to
complete, report implemented/E and review accepted/E, with ledger E, 12/203
accepted and RCLD-01 complete. E contains both evidence paths for each checkpoint
and all repaired source. A later bookkeeping commit records E without any
self-referential hash or fabricated historical review. Retain original and
repair hashes in report prose. No code changes may slip between the tested
snapshot, E and acceptance; changed content needs new review.

An isolated synthetic-history rehearsal confirmed this transition passes the
existing validator. Add permanent positive/negative transition regressions;
do not weaken complete-state semantics or add a bypass/status/schema for it.
Pi may implement these synthetic tests but never author real Codex acceptance.
Partial acceptance must not break remaining pending ancestry; the planned
transition is the whole six-checkpoint batch. S013 authorization follows a
separate Codex dispatch after successful independent acceptance.

### Verification and report boundary

Use all existing target lanes from `implementation/VERIFICATION.md`: strict
frozen install; format/lint/four-config typecheck; unit/harness/integration/
components; CLI smoke; fixture check/build/SSR; scoped Chromium browser;
contracts/checker regressions; actionlint; diff health. Include new negative
controls, audit failure classification, cleanup and nonmutation evidence.
Keep failed attempts and exact exits/counts. Do not label the raw two-error
upstream audit green; report the qualified exception separately.

For this TS-only repair batch, reuse the previously recorded S012 reference
guard at intermediate repair commits only while the reference remains clean
at the recorded hash; label reuse. Run fresh reference fmt/check/test once at
the repaired S012 milestone. This supersedes repeated intermediate reference
runs, not the final guard or target checks. No remote CI, additional browser/OS
matrix, package acceptance, human release test or publication is claimed now.
Return all repair commits, task/requirement dispositions, exact checks and
retained evidence, known failures/skips and the precise stopping reason.

## Owner-authorized batch — pfc through RCLD-01

This historical dispatch authorized S007–S012 only; that batch is complete and
independently accepted. Its tuple remains an approved validator fixture, but it
is no longer the live plan record. The single live authorization now sits in
the current "Codex dispatch — complete RCLD-02 models and registry resolution"
section above.

The owner explicitly requested entire-sequence authorization on 2026-09-29.
This section supersedes conflicting per-checkpoint return, commit-ownership
and predecessor-acceptance restrictions in earlier dispatches and instructions
for **S007–S012 only**. Pi now implements, verifies, self-reviews and commits
each green checkpoint in order, continuing without a Codex handoff between
them. Codex retains product/scope/API/dependency decisions and independently
reviews the full sequence afterward. Do not mark self-reviewed work as Codex
accepted. No permission is needed to continue within this resolved batch.
Stop before S013; no push, publication, deployment, parent gitlink/index change,
reference-source mutation or unrelated work is authorized.

### Batch evidence and checkpoint progression

Before the first S007 commit, implement the following narrow governance-tool
extension in `tools/check-contracts.mjs`, its existing regression suite and the
verification documentation. This is authorized support for the owner's new
execution requirement, part of the S007 correction scope, not a product API.
Codex changes documents; Pi authors the validator/test implementation.

- Add status `committed_pending_review`. It is legal only for S007–S012 under
  the exact structured authorization above. Preserve projection schemaVersion
  1 and existing fields; `completion` remains null until independent `complete`.
  No new tracker, general policy engine or free-form bypass flag.
- While coding a checkpoint, keep `in_progress`, report `candidate`/null.
  After all its required checks and self-review pass, Pi may create its
  implementation commit. Then record that actual full hash in the ledger and
  report metadata, with report disposition still `candidate`, and set
  `committed_pending_review`. The hash must resolve to a HEAD-reachable commit
  containing that checkpoint's report path. Optional independent reviews stay
  `changes_requested`/null; Pi preserves existing Codex reviews and does not
  write accepted reviews. Author self-review findings belong in the report.
- A verified pending-review predecessor may unlock the next checkpoint only
  when both are inside this exact batch. Require real Git evidence, report
  identity/hash agreement, predecessor ancestry, no gaps/reordering and only
  one active coding checkpoint. S013 remains blocked until S012 is independently
  complete. Outside the batch retain the current accepted-predecessor rule.
- Keep `complete` and `verified_uncommitted` reserved for Codex. Preserve all
  existing complete-state requirements, including report/review dispositions,
  actual reachable commits and committed evidence paths. Pending-review
  checkpoints do not increment completed counts or complete the RCLD. The
  existing completed/remaining counters remain independent acceptance counts;
  report the additional authored/committed-pending-review range separately.
- Validate the authorization as one live structured record (fenced examples
  inert), rejecting malformed, duplicate, unknown-field, wrong-mode, wrong-
  sequence or widened-range records. Existing historical fixtures without a
  batch record retain the old rules; missing authorization cannot admit a
  pending-review status. Generation must not legitimize invalid evidence.
- Extend tests for permitted within-batch progression and rejection of missing,
  fake, unreachable, wrong-report or mismatched commits; invalid authorization;
  premature/uncommitted predecessors; out-of-range S013 advancement; count or
  projection drift; and attempted accepted dispositions on pending work.
  Preserve all existing regressions and read-only validator behavior.

Record each real implementation hash after commit rather than amending a
self-referential hash into its own commit. Carry truthful bookkeeping into the
next checkpoint. After S012, one small verified documentation commit may record
the final hashes and batch return without claiming independent acceptance.
The final tree should be clean and all S007–S012 implementation commits should
be pending review. Codex will review each commit and record acceptance evidence
after the batch; Pi must not anticipate or fabricate that decision.

### S007 corrections and green gate

Read `implementation/evidence/S007_REVIEW.md` in full. Keep the qualified
fixture, approved dependencies and real SSR/type negative cases. Close both
findings before the S007 implementation commit:

1. **R1 — bounded lifecycle and observable failures.** Track server health
   after readiness through teardown. Unexpected stderr and premature exits,
   including a server exiting 17 after its last request, must fail the suite;
   intentional teardown is distinct. Require an explicit HTTP deadline
   covering headers and full body, with useful diagnostics. Register temp-root
   cleanup before setup can fail, bound termination and clean only owned
   resources. Correct the launcher's advertised no-argument handler path.
   Add deterministic fault controls for startup failure, error stderr,
   post-ready exit, stalled headers, stalled body, assertion/setup failure and
   default/explicit launch behavior. Do not rely on the reviewer's disposable
   scripts or arbitrary sleeps as permanent regression coverage.
2. **R2 — specific SSR-disabled failure.** Assert HTTP 200 and HTML content
   type outside the expected missing-markup failure. Match the intended SSR
   assertion, so HTTP 500/wrong content type cannot satisfy the negative case.
   Prove both false-pass probes now fail while a real successfully built
   SSR-disabled page satisfies only the intended missing-markup control.

Update report/guidance claims to match the corrected deadlines, health policy
and cleanup. Complete the batch-state validator extension above and all S007
target gates, then commit S007 and immediately proceed to S008.

### Batch scope S008 — production browser harness

- Approve exactly `@playwright/test: 1.63.0` as a new root dev dependency.
  Codex checked the exact registry manifest: Node >=20, dependency
  `playwright: 1.63.0`. Keep the existing root/fixture pins. Explicit local
  Chromium installation for this pinned version is authorized; no automatic
  install inside tests, browser channel substitution or host configuration.
- Initial executed browser lane: bundled headless Chromium on the current
  macOS/Node 24.21.0 workstation; CI lane Ubuntu 24.04. No Firefox/WebKit or
  Windows qualification claim yet. Use Playwright's actual runner and config,
  `tests/browser/harness.spec.ts`, and root `test:browser` script with explicit
  test operands. Build the production fixture before browser execution.
- Reuse/extract the corrected owned-server boundary, using loopback and an
  OS-assigned port. Never silently reuse an unrelated listener. Bound all
  startup/navigation/action/teardown phases; retain failure traces/screenshots
  in ignored output. Capture and fail unexpected server stderr/exits, page
  exceptions, console errors and hydration warnings. Add controls proving the
  gate detects those errors. Do not blanket-ignore browser messages.
- Test the real page's accessible heading and labels, Tab/Shift+Tab focus
  order, native checkbox keyboard activation, and form navigation/query update.
  Add a small fixture-only Svelte state interaction to prove hydration executes,
  not only static/native behavior. Assert state and visible results using
  accessible locators; no fixed sleep or screenshot-only assertions.
- Document explicit browser setup and exact tested platform. Commit only after
  the scoped browser lane, S007 SSR suite and affected cumulative checks pass.

### Batch scope S009 — isolated typed integration helpers

- Implement the specified temp-project, complete-tree snapshot and actual
  executable invocation helpers under `tests/helpers/`, with typed tests at
  `tests/integration/harness.test.ts`. Use built CLI processes, never mock away
  stdout/stderr/exit or run against a user's project. No new dependency needed.
- Approve a suite selector in the existing dependency-free typed runner for
  `integration` and later `components`; retain the existing unit entrypoint
  behavior and all S005 protections. Root `test:integration` builds product
  before running the explicit/default integration selection. Keep suite-local
  compiler configuration and output inside ignored `.unit-test-build/` with
  an unambiguous suite subdirectory; no cross-suite stale output or destructive
  cleanup, and no shell-glob selection or runtime TypeScript bypass.
- Compile all discovered typed inputs, reject escaping/symlinked operands,
  fail empty/all-skipped/TODO-failed/timeouts, propagate actual failures and
  diagnostics. Extend runner regression tests for the new suite without
  weakening the existing 29-case harness or unit behavior.
- Snapshot file bytes, modes, kinds, hidden entries, directories and link
  targets without following links. Prove cleanup on setup/assertion failures
  leaves external sentinels and symlink targets unchanged. Test cwd paths with
  spaces, malformed input, CLI exit/stdout/stderr and bounded process failure.
  Introduce injected filesystem/asset boundaries only if these tests need
  them; no speculative production transaction implementation.

### Batch scope S010 — command map and executable CI baseline

- Add `implementation/evidence/COMMANDS.md` and one GitHub Actions workflow
  for pull_request and push, read-only contents permission and bounded job
  timeout. Initial runner is `ubuntu-24.04`, Node 24.21.0, pnpm 11.22.0.
  No publication/deployment, secrets, external reference checkout or private
  workstation tooling. Target contains no Rust: explain why no Cargo CI job
  belongs in this public repository; local reference guards remain separate.
- Approved immutable action revisions (verify exact upstream action metadata):
  checkout v7.0.1 `3d3c42e5aac5ba805825da76410c181273ba90b1`;
  setup-node v7.0.0 `820762786026740c76f36085b0efc47a31fe5020`;
  pnpm/action-setup v6.1.0 `ea17c68df8912ef543352723c149a84f56e3d413`.
  Use full Git history for contract evidence. Explicit setup/install steps
  precede checks. Use a frozen strict install and explicit Chromium/system
  dependency setup on CI. Browser/test output remains ignored.
- CI runs the available lint/format/type/unit/harness/integration/smoke/
  consumer/SSR/browser/contract lanes. Add component qualification when S011
  establishes it. Run the same commands locally. Do not claim remote CI ran:
  this authorization does not push or trigger remote workflows.
- Approve actionlint 1.7.12 in an owned temporary tool directory for syntax/
  workflow validation, from its official release and published checksum.
  Record shellcheck availability separately rather than hiding a missing
  optional tool. Do not install host-global configuration or add a second
  Node package manager. Record exact commands/results and remote-only limits.

### Batch scope S011 — pinned Bits state/ref/child qualification

- Add exact fixture runtime pins `bits-ui: 2.19.3` and
  `@internationalized/date: 3.12.4` (already approved at the root; the latter
  satisfies Bits' declared peer). Preserve all other pins. Inspect installed
  source/types and cite package-relative files/version in compatibility
  evidence, not private paths or floating website APIs.
- Codex selects Bits `Switch.Root`/`Switch.Thumb` as the bounded integration
  fixture, with `bind:checked`, `bind:ref` and the real `child` snippet carrying
  merged props and checked state. The installed root has bindable checked/ref
  and renders its hidden input outside the child branch. Exercise a delegated
  native button without losing its props/events/ref or creating nested buttons.
  This qualifies upstream facilities; do not create public kit wrappers yet.
- Put fixture-only components under `src/lib/compatibility/` and expose a
  dedicated route. Establish real `test:components` typed orchestration at
  `tests/components/compatibility.test.ts` using the approved runner suite.
  Compile positive Svelte types and prove incompatible checked/ref/snippet
  examples fail for intended diagnostics in disposable copies, then restore.
  Do not copy upstream `any` into authored proof or use casts to hide errors.
- Extend production SSR and browser tests for hydration, accessible switch
  semantics, pointer/keyboard state updates, programmatic state updates flowing
  back into the primitive, actual ref identity/focus, and child forwarding.
  Keep server state request-local and report any upstream constraint; do not
  invent support by dropping props or disabling SSR. Update compatibility/CI
  evidence and execute the component, app, SSR and browser lanes.

### Batch scope S012 — minimal production boundaries and sequence closure

- Preserve exact existing CLI help/version/usage/metadata behavior. Extract
  pure argument/result handling behind a small Node adapter; keep package-
  relative metadata reading and stdout/stderr/exit effects at the adapter.
  Introduce minimal readonly project-input, registry-snapshot and planning-
  outcome interfaces under their respective `src` boundaries only to express
  the already-approved responsibilities. No schemas, registry implementation,
  product commands or speculative services before their scheduled checkpoints.
- Add meaningful `tests/unit/boundaries.test.ts`: pure imports/execution cause
  no filesystem writes, injected boundaries preserve CLI behavior, compile-
  negative cases reject invalid boundary values, and consumer sources/runtime
  imports cannot depend on CLI/Node/registry internals. Keep all 41 CLI smoke
  assertions and established runner/fault regressions.
- Execute the full cumulative RCLD-01 suite, including contracts and new
  pending-review guards, all typed suites, CLI/SSR failure controls, real
  fixture checks/build, Chromium hydration/interactions, workflow validation,
  formatting/lint and strict frozen install. Record exact counts, cleanup,
  platform limits and pending-review implementation commits. Stop before S013.

### Efficiency, reference guard and final return

The fresh S007 reference guard was audited: fmt/check/test exit 0, 562
top-level plus 16 nested passes, zero failures, four ignored, reference clean
at `a10fbf06334f4648f5755e05a7147414e4e5fc98`. For this TS-only batch,
Codex authorizes reuse through S011 while that identity, Rust scope and evidence
remain unchanged; verify the clean hash at each checkpoint and label reuse.
Run one fresh fmt/check/test reference guard at the S012 milestone with actual
captured exits. Do not modify the reference or claim ignored tests executed.
This bounded exception supersedes repeated per-checkpoint Rust runs for the
batch; any reference/Rust-scope change requires fresh applicable verification.

Run each slice's meaningful checks before committing; reuse unchanged target
results only within the same slice, and run all cumulative lanes at S012.
Avoid redundant builds already performed by composed scripts. Keep failure
logs, never replace captured exits with a trailing shell success. If a genuine
new consequential decision or unrepairable dependency blocks the chain, report
evidence and complete independent in-scope work; do not silently change scope.
Routine implementation choices inside these resolved decisions are Pi's work.

Return one complete sequence report: model/runtime, start/end HEAD, ordered
checkpoint commits and pending-review states, files and requirement mapping,
exact commands/exits/counts/logs, negative controls and cleanup, upstream type
findings, docs/CI status, platform/release limitations, final tree status and
any blockers. Codex controls external coordination; Pi updates only target
RCLD/evidence/projections as specified. No human release testing is due.

Sources: [Playwright 1.63.0 manifest](https://registry.npmjs.org/@playwright/test/1.63.0),
[Playwright server lifecycle](https://playwright.dev/docs/test-webserver),
[Playwright CI](https://playwright.dev/docs/ci-intro),
[actionlint 1.7.12](https://github.com/rhysd/actionlint/releases/tag/v1.7.12).

## Codex dispatch decisions — S007

The owner-authorized RCLD-01 batch above supersedes this original dispatch's
per-checkpoint return/commit/advancement and repeated reference-guard rules.
Its technical fixture scope and dependency selections remain in force.

Begin only after S006 is independently accepted and committed with its real
hash recorded. Use a fresh Pi session and finish the complete S007 fixture,
verification, evidence and self-review in one implementation period. Codex
has resolved the decisions below; do not stop at a scaffold or dependency
proposal. S008 remains locked until Codex accepts and commits S007.

1. **Fixture identity and workspace.** Create the maintained, private ESM
   package `svelte-ui-kit-consumer-fixture` at `tests/fixtures/consumer/`.
   Extend `pnpm-workspace.yaml` with exactly that explicit member alongside
   `.`; keep one root lockfile, no nested lockfile or wildcard membership.
   Keep the root CLI package private and all its existing sixteen exact
   development pins unchanged; no root runtime dependency is introduced.
   This app is a hand-authored qualification baseline, not evidence that the
   future generator or installed tarball already produces it.
2. **Approved fixture dependency set.** Fixture `dependencies` contains
   `svelte: 5.57.1`. Fixture `devDependencies` contains exact pins
   `@sveltejs/kit: 2.70.3`, `@sveltejs/vite-plugin-svelte: 7.3.1`,
   `vite: 8.3.1`, `typescript: 6.0.3`, `@types/node: 24.19.0`,
   `@sveltejs/adapter-node: 5.5.7` and `svelte-check: 4.7.6`.
   The last two are the only new package selections. Codex inspected their
   exact npm manifests: adapter-node admits Kit `^2.4.0`; svelte-check admits
   Svelte `^4.0.0 || ^5.0.0-next.0`, TypeScript `^5.0.0 || ^6.0.0`,
   Node `>=18.0.0`. Preserve Node 24.21.0 / pnpm 11.22.0. Installation and
   execution must still prove compatibility; no substitution or downgrade.
   No Bits wrapper is needed yet, so do not add unused Bits/date consumer
   dependencies or infer component compatibility from this fixture. S011
   owns that integration qualification. Do not add dependency installation
   to check/build/test scripts or lifecycle hooks.
3. **Real SvelteKit app.** Use the pinned Kit Vite plugin, Node adapter and
   `vitePreprocess` as appropriate, a standard app template, strict fixture
   tsconfig extending `./.svelte-kit/tsconfig.json`, and typed Svelte 5 route
   source. Keep CLI and unit tsconfigs separate from app compilation. Include
   a minimal accessible page with a heading and native interactive elements
   useful to the next browser checkpoint. Explicitly retain SSR and CSR, do
   not prerender the qualification route, and do not add browser-only or
   shared mutable server state. Use a small typed server load that renders a
   request-specific query value into visible page markup (with a deterministic
   default); no clock/random counter is needed. Layouts, if used, must render
   their children. No kit wrappers, registry placeholders, generated CLI
   commands, CSS framework or deployment platform integration belongs here.
4. **Owned commands.** Add root `fixture:check` and `fixture:build` scripts
   delegating with `pnpm --dir tests/fixtures/consumer run check` and `... run
build`. Fixture `check` runs real `svelte-kit sync` then `svelte-check
--tsconfig ./tsconfig.json --fail-on-warnings`; fixture `build` runs real
   `vite build` with the Node adapter. A fixture-local `dev` script using Vite
   is allowed for the next checkpoint. Add root `test:fixture` that builds the
   app before executing a focused `node:test` suite at
   `tests/smoke/consumer-fixture.test.mjs`. Keep startup/test helpers local and
   small; do not preimplement S008's browser harness or S009's general helpers.
5. **SSR acceptance and failure controls.** Test the actual production
   adapter output over HTTP, not a mocked render or string search in source.
   The generated `build/handler.js` may be hosted in an owned child process
   using Node HTTP on `127.0.0.1` with an OS-assigned port; this is the
   adapter's supported custom-server boundary and avoids fixed-port races.
   Bound startup, requests and teardown; report unexpected exits/server errors
   and always remove owned temporary artifacts and stop owned servers, including
   assertion failures. Never kill unrelated processes. Assert HTTP 200,
   HTML content type and visible route markup before client JavaScript runs.
   Distinct repeated/concurrent query values must render only their own
   visible values, proving actual request-time SSR rather than static output
   or values present only in serialized hydration data. Check a benign HTML
   escaping case as well. In an owned disposable fixture copy, prove a real
   Svelte/TypeScript type mismatch makes `fixture:check` fail for its intended
   diagnostic and restored valid input passes; disabling SSR must make the
   SSR assertion fail. Record these controls without leaving negative source
   in the maintained app or weakening checks. A focused test should fail if
   the app/build is missing; `test:fixture` itself supplies the real build.
6. **Scope, output and authoring hygiene.** Keep fixture dependencies,
   `.svelte-kit/` and adapter `build/` output ignored. Retain S006's recursive
   exclusions; maintained fixture source/config remains linted and formatted.
   Use narrow parser/global configuration changes only if real fixture files
   require them; retain semantic/compiler/a11y rules and strict types. Do not
   blanket-ignore the fixture or disable SSR, checks, warnings or assertions.
   Verify lint/format after sync/build and verify check/build from clean owned
   generated output. Source, manifest, lockfile, scripts and docs must agree.
7. **Verification and evidence.** Run the strict frozen workspace install,
   fixture check/build/SSR suite and negative controls, both existing CLI/unit
   typechecks, full unit discovery, harness, CLI smoke, lint, format, contract
   validation/tests and whitespace checks. Avoid duplicate successful builds
   where `test:fixture` already performs the required production build; record
   the actual command composition. Update README, CONTRIBUTING,
   VERIFICATION, the compatibility record and S007_REPORT with exact commands,
   package roles/versions, files, results/counts, failure attempts, cleanup
   evidence and limitations. Run the fresh conditional reference fmt/check/test
   guard with captured exits; S006's same-checkpoint reuse exception does not
   extend to S007. Preserve reference source and record its clean identity.
8. **Return and advancement.** Complete all unblocked S007 work and self-review
   before returning unstaged/uncommitted. Keep S007 `in_progress`, author report
   `candidate` with null commit; preserve accepted S006 bookkeeping and the
   independent review. Do not author an accepted review, change external
   coordination state or begin S008. Report any consequential unexpected
   incompatibility to Codex with evidence while completing independent work.
   No browser/hydration, generated-wrapper, tarball, cross-platform or release
   readiness is established by this baseline. No human release testing is due.

Selection references: exact registry manifests for
[svelte-check 4.7.6](https://registry.npmjs.org/svelte-check/4.7.6) and
[adapter-node 5.5.7](https://registry.npmjs.org/@sveltejs/adapter-node/5.5.7);
[SvelteKit Node adapter](https://svelte.dev/docs/kit/adapter-node) and
[project structure](https://svelte.dev/docs/kit/project-structure).

## Codex correction dispatch — S006 review 1

Complete this bounded correction and all remaining S006 verification in a fresh
Pi session. Read `implementation/evidence/S006_REVIEW.md` in full. Codex has
resolved all decisions below; do not return only a patch or stop for another
scope proposal. This supplements the original S006 dispatch without adding
S007 implementation or changing checkpoint order.

1. **R1: recursive reserved-output exclusions.** The current ESLint global
   ignore block uses configuration-root-only directory patterns. Codex
   reproduced exit 1 for a bad file under each of
   `tests/fixtures/consumer/.svelte-kit/`, `build/`, `dist/`, `coverage/`
   and `.pnpm-store/` (the latter four are also beneath the consumer root).
   The equivalent format checks exit 0. Honor the already-approved global
   output boundary at every depth: use directory-subtree patterns
   `**/node_modules/`, `**/.pnpm-store/`, `**/dist/`, `**/build/`,
   `**/.svelte-kit/`, `**/coverage/` and `**/.unit-test-build/` in the
   global ESLint ignore configuration. Preserve the explicitly rooted
   `tests/fixtures/generated/` and `implementation/evidence/logs/` boundaries
   and existing log exclusion. Keep the global-ignore-only object or use
   ESLint's own equivalent helper; no new dependency or tool wrapper.
   These names are reserved output/dependency trees, not permission to ignore
   all consumer, test, registry or source files. Prettier already passes the
   nested probes; preserve its working boundary.
2. **Regression proof and scope preservation.** Extend the existing typed
   tooling tests with bad files under both root and nested output directories,
   including the seven recursive names above and the existing explicit output
   boundaries. Running the actual lint and format scripts must pass despite
   those files. In the same fixture layout, malformed/violating maintained
   TS and Svelte input under `tests/fixtures/consumer/src/` and `registry/`
   must still fail for the intended diagnostics and return green after repair.
   Check nested levels beyond the fixture root, so root-only patterns cannot
   pass the regression. Preserve complete fixture/external-app snapshots on
   success and failure. Do not weaken other assertions, ignore failures or put
   negative probes in real discovery. No S007 app is needed to prove this.
3. **Compiler/accessibility decision.** Codex explicitly accepts and requires
   the additive `svelte/valid-compile: error` configuration. The installed
   recommended preset alone does not satisfy the dispatched compiler/a11y
   negative cases; the added rule implements the existing requirement. Keep
   it enabled, together with the verified real Svelte/TS parsing and all seven
   approved exact dependency pins. No compatibility deviation is needed.
4. **Evidence and real-tree nonmutation.** Update the S006 report and affected
   developer guidance to describe recursive output exclusions truthfully and
   distinguish initial evidence from correction results. For the real-tree
   proof include existing untracked authoring inputs as well as tracked files;
   unchanged porcelain status alone does not establish unchanged bytes in a
   previously untracked file. Codex independently verified all 70 existing
   tracked/untracked authoring entries before this review-document update.
   Preserve failed attempts and report the new fixture counts and actual exits.
5. **Verification and reference reuse.** Run frozen strict-peer engine-strict
   install, lint, format check, both typechecks, build, full unit discovery,
   explicit tooling test, harness, CLI smoke, contract validation/tests and
   target whitespace checks. Snapshot real authoring inputs around the checks.
   Codex audited the author's fresh S006 reference guard: fmt/check/test exit
   0, 562 top-level plus 16 nested passes, zero failures, four ignored.
   For this same-S006 configuration/test correction, verify that the reference
   is still clean at `a10fbf06334f4648f5755e05a7147414e4e5fc98` and cite
   this evidence without another Rust run. Rerun if reference identity, Rust
   scope or the evidence changes; S007 does not inherit the exception. The
   initial timed-out attempt and complete run without a captured exit remain
   historical, distinct from the final run with actual exit 0.
6. **Return boundary.** Finish the entire correction, regression evidence,
   documentation and self-review, then return unstaged/uncommitted with S006
   `in_progress`, report `candidate`, review `changes_requested`, null hashes
   and S007 untouched. Preserve accepted S005 evidence and Codex's factual
   bookkeeping/review. Codex owns independent acceptance, checkpoint commit
   and S007 dispatch. No human release testing is due.

Primary behavior references: [ESLint directory ignores](https://eslint.org/docs/latest/use/configure/ignore#ignore-directories)
and [Svelte compiler validation](https://sveltejs.github.io/eslint-plugin-svelte/rules/valid-compile/).

## Codex dispatch decisions — S006

Begin only after S005 is accepted and committed with its real hash recorded.
Use a fresh Pi session and complete the entire S006 definition and this
dispatch in one implementation period, including self-review and all gates.
Codex owns acceptance/commits and consequential decisions; S007 remains locked.
The next logical delivery is the complete authoring-tooling checkpoint, not a
config-only partial return or an unreviewed batch of later checkpoints.

1. **Approved exact development dependencies.** Add only these seven exact
   pins: `eslint@10.11.0`, `@eslint/js@10.0.1`,
   `typescript-eslint@8.71.0`, `eslint-plugin-svelte@3.23.0`,
   `eslint-config-prettier@10.1.8`, `globals@17.12.0`, and
   `prettier-plugin-svelte@4.1.1`. Codex verified each exact npm registry
   document on 2026-09-29. The TypeScript integration admits TS >=4.8.4 <6.1.0
   and ESLint 10; the Svelte linter admits ESLint 10 and Svelte 5; the formatter
   plugin admits Svelte 5 and Prettier 3. Engine requirements admit Node
   24.21.0. These declarations support the selection; installation and actual
   positive/negative execution must still qualify it. Preserve all nine
   existing pins, Node/pnpm selections, package identity/private/license/ESM,
   and root-only workspace membership. Update the lockfile normally, then prove
   frozen strict-peer engine-strict install. No runtime/consumer dependency or
   automatic package installation is introduced.
2. **ESLint configuration and coverage.** Use ESM flat configuration
   `eslint.config.mjs`, JS recommended, TypeScript recommended and Svelte
   recommended presets. Configure the actual TS parser for Svelte script
   blocks; use syntax-aware recommendations plus the existing compiler checks,
   not a new type-aware project-service architecture. Apply Node globals to
   CLI/tools/tests/config files; scope browser globals to Svelte/client authoring
   contexts instead of enabling them everywhere. Finish with the compatible
   Prettier presets to separate formatting from semantic lint. This approved
   style-only conflict resolution is not permission to disable semantic or
   accessibility rules. Add `lint` as `eslint . --max-warnings 0`, with no
   `--fix`, cache, ignored-error fallback or pass-on-empty wrapper. Do not
   scaffold S007's app or add a fake Svelte config solely for lint.
3. **Formatter and ownership scope.** Preserve `.prettierrc.json` preferences
   and `format` as an explicit authoring-only write command; keep
   `format:check` nonmutating and add the selected Svelte plugin/parser override.
   Lint and format cover maintained root configs/docs as applicable, `src`,
   `tools`, `tests`, and future authored `registry` templates/assets. Future
   maintained consumer fixture source is authoring input, not an excluded
   output directory. Globally exclude dependency/build/cache trees, owned unit
   output, generated fixture outputs and ignored evidence logs. Explicitly
   reserve `tests/fixtures/generated/` for disposable generated-app output and
   exclude it from both tools; no real generated app is created in S006. Keep
   lockfile/license formatter exclusions. Do not broadly ignore tests, tools,
   registry templates or authored consumer fixtures to obtain green. Checks
   must not traverse or rewrite an arbitrary external application. No product
   generator invocation gains implicit formatting/lint or source rewrites.
4. **Current-source cleanup.** Repair actual violations exposed by the chosen
   presets with the smallest behavior-preserving source/test changes. Preserve
   S005 boundary/failure policies, contract validator semantics and S004 CLI
   behavior. No blanket disables, `any`, type weakening, skipped tests,
   broad ignore expansion or assertions removed to pass lint. Routine fixes
   within this boundary are authorized; a required semantic rule/API deviation
   must return to Codex with evidence while independent work continues.
5. **Real nonmutation and detection tests.** Implement the scheduled typed
   `tests/unit/tooling.test.ts`. Invoke the actual package scripts and installed
   tools against disposable package fixtures with the real configurations;
   this must qualify command wiring, not merely call formatter/linter libraries
   or assert configuration text. Use bounded subprocesses, controlled inherited
   test-runner environment and cleanup of owned roots. Verify clean TS and
   Svelte 5 `<script lang="ts">` positives; formatting-defective TS and Svelte
   return nonzero without changing bytes; actual TS semantic lint and Svelte
   compiler/accessibility lint violations return nonzero for their intended
   diagnostics. Prove green restores. Both success and failure checks must
   preserve complete relevant fixture snapshots, including hidden sentinels,
   file kinds/link targets and an unrelated external app. Prove bad maintained
   authoring input is checked while bad files under generated/build output
   paths are excluded. No unconditional-positive stubs, skipped a11y warnings
   or empty Svelte coverage. Keep negative fixtures out of real discovery.
6. **Command semantics and evidence.** Update README, CONTRIBUTING, verification
   guidance and `implementation/evidence/S006_REPORT.md` together. Record exact
   new pins and verified peer/engine facts in the S006 report rather than
   rewriting historical S003 evidence. Standalone `typecheck` intentionally
   checks tracked-config includes; mandatory `test:unit` additionally compiles
   every discovered unit entry, including dot-prefixed names. That S005
   boundary is accepted; do not add another config-writing public command or
   change it silently. Document both lanes as required. Svelte lint/format
   probes do not establish consumer typecheck/build, SSR/browser qualification
   or release readiness. Source-path hints in S005 failure output are not
   source-map-accurate TypeScript coordinates; emitted stack coordinates remain
   authoritative. No source-map feature is required by S006.
7. **Full verification and return.** Run frozen strict install, format check,
   lint, both typechecks, build, full unit discovery and explicit
   `tests/unit/tooling.test.ts`, harness, CLI smoke, contract validation/tests,
   and whitespace checks. Prove lint/format checks leave the real authoring
   source unchanged too. Run a fresh reference fmt/check/test guard after
   checking its clean identity; S005's reuse exception does not carry forward.
   Preserve failed attempts/real exits and separate top-level/nested/negative
   counts. All unblocked S006 work is authorized. Return unstaged/uncommitted,
   S006 `in_progress`, report `candidate`, null hash, accepted S005 evidence
   untouched and S007 not started. Codex performs independent review and the
   next checkpoint commit. No human release testing is due.

Primary setup references: [TypeScript ESLint](https://typescript-eslint.io/getting-started/),
[Svelte ESLint](https://sveltejs.github.io/eslint-plugin-svelte/user-guide/),
[Svelte Prettier](https://github.com/sveltejs/prettier-plugin-svelte), and exact
version documents at `https://registry.npmjs.org/<package>/<version>`.

## Codex correction dispatch — S005 review 1

This dispatch supplements the original S005 dispatch below and supersedes
conflicting candidate claims. Complete R1–R3 in a fresh Pi session, within S005.
Codex has resolved the following decisions; no owner approval is pending.
Read the independent `implementation/evidence/S005_REVIEW.md` in full.

1. **R1: owned selection and cleanup boundaries.** Anchor validation to the
   canonical package root. Reject a symlinked `tests` or `tests/unit` root in
   both discovery and explicit selection before cleanup, compilation or test
   execution. Explicit operands are repository-relative: reject absolute
   operands, final symlinks and symlinked ancestor directories within the test
   tree, even if a link points back inside. Discovery continues to ignore
   nested symlink entries without following them. Validate path components,
   not a textual `..` prefix; a name beginning with two dots is not traversal.
   A symlinked package checkout reached through an otherwise valid working
   directory is not itself an invalid test root. Use non-following metadata
   for the output guard so dangling `.unit-test-build` symlinks are rejected
   before compiler invocation, just like live symlinks. Only a truly absent
   output root is absent. Preserve unrelated targets and sentinels.
2. **R2: discovery and compilation agree.** Keep the promised set of all
   regular `*.test.ts` files, including dot-prefixed filenames and directories;
   do not silently narrow discovery to hide an emission mismatch. Compile all
   discovered unit entries through the pinned compiler. Codex authorizes an
   ephemeral compiler configuration inside the guarded, ignored owned output
   tree, extending `tsconfig.unit.json` and explicitly listing discovered
   entries. Preserve inherited strictness, ordinary source/test includes,
   product configuration, compile-before-run and no stale-output execution.
   Resolve generated configuration paths correctly and do not mutate tracked
   configs to select a run. Explicit selection still controls execution, not
   omission of ordinary unit inputs from typechecking. Default and explicit
   runs must both execute valid dot-prefixed tests successfully.
3. **R3: event attribution, failures and diagnostics.** Attribute child events
   to `entryFile` when present, with a file fallback for wrapper events; retain
   the defining file/line separately. Render the failing test name and actual
   structured error/cause (including useful assertion values and location),
   rather than only a failure type/count. Preserve load-error output. A
   failure must not disappear because it was defined in an imported helper.
   Preserve the initial strict policy: every `test:fail` event, including one
   marked TODO, fails the run; TODO does not exempt a throwing callback.
   Non-failing TODO/skipped tests may coexist with an actual passing test but
   cannot satisfy the per-entry executed-test requirement. Apply this policy
   identically to inline and imported tests and document it. Aggregate
   `success: false`, failed/cancelled counts, or unassigned failure events must
   fail the run even if per-file summaries appear green. Retain all existing
   per-file completion and empty-selection guards.
4. **Focused regression evidence.** Add disposable fixtures proving each
   reproduced case and its intended diagnostic: external root/parent links in
   both modes, ancestor/final links, absolute operands, dangling output link,
   dot-prefixed files/directories including a `..` filename prefix, inline and
   imported named assertion/error details, identical TODO-failure outcomes,
   cancellation via an explicit short test timeout, abnormal nonzero child
   exit, and passing restores. Invalid selection must not clean stale output
   or run a side-effect sentinel. Do not put negative probes in real discovery.
   Bound regression subprocesses so a broken runner cannot hang the harness.
   The reviewer also observed an unsettled-promise timeout under the native
   Node runner; this is not claimed as a new product defect or a passing
   cancellation test. No new public timeout/filter API is authorized here.
5. **Preservation and verification.** Keep the verified owned-parent fixture
   correction, S004 smoke/product behavior, exact pins and dependency-free
   design. Run strict frozen install, both typechecks, build, default/explicit
   unit, expanded harness, smoke, contracts, formatting and diff checks. The
   two overlapping full contract suites are already independently qualified;
   repeat overlap if fixture ownership code changes. Preserve actual failed
   attempts and command exits. Keep public reports repository-relative and
   free of operator tooling/coordination details. Codex has corrected that
   wording in the candidate report; append correction evidence truthfully.
6. **Reference evidence and return.** Codex audited the author's fresh S005
   reference guard: fmt/check/test exit 0, 562 top-level plus 16 nested passes,
   zero failures, four ignored. For this same-checkpoint runner-only correction,
   verify the reference remains clean at
   `a10fbf06334f4648f5755e05a7147414e4e5fc98` and cite that evidence without
   claiming a fresh execution. Rerun if its identity, source/Rust scope or
   evidence changes; S006 does not inherit this exception. Return uncommitted
   and unstaged, S005 `in_progress`, report `candidate`, review
   `changes_requested`, both hashes null. Preserve Codex-owned review and
   accepted predecessor evidence. Codex reviews, accepts, commits and dispatches
   S006 later. No human release test is due.

## Codex dispatch decisions — S005

Start this checkpoint only after S004 is accepted and committed and its actual
hash is recorded. Use a fresh Pi session. These decisions authorize all S005
work, including the previously scheduled contract-fixture isolation correction;
no owner decision is pending. S006 and successors remain locked until S005 is
independently accepted and committed.

1. **Runner and compilation.** Use the existing Node `node:test` runner and
   pinned TypeScript compiler; add no dependency. Create
   `tools/run-unit-tests.mjs`, `tsconfig.unit.json` and
   `tests/unit/cli-bootstrap.test.ts`. Keep the S004 product build/config and
   its `.js` relative ESM import convention. The unit config extends the root
   strict config, overrides `rootDir` to `.`, emits to `.unit-test-build`, and
   includes `src/**/*.ts` and `tests/unit/**/*.ts`. Ignore that output tree.
   No `any`, disabled checks, `skipLibCheck` or ignored compiler failures.
   Extend `typecheck` to check both configurations without emitting.
2. **Commands and lifecycle.** Add `test:unit` using
   `pnpm run build && node tools/run-unit-tests.mjs` and `test:harness` using
   `node --test tools/run-unit-tests.test.mjs`. The runner compiles the unit
   config with the installed compiler before running selected emitted tests;
   compilation failure stops execution. Clean only the fixed, owned unit-build
   output before compiling so stale output cannot pass. Guard that cleanup
   against symlinked/unexpected output roots. No runtime registry/consumer
   changes or new command protocol are part of this checkpoint.
3. **Discovery and arguments.** With no operands discover all regular
   `tests/unit/**/*.test.ts` files in deterministic order. Support one optional
   leading `--` separator and explicit repository-relative test file operands,
   including the plan's `pnpm run test:unit -- tests/unit/cli-bootstrap.test.ts`.
   Resolve all paths against this package root; reject missing files, globs,
   directories, unknown options and paths/symlinks escaping the unit-test tree.
   Do not silently fall back to all files on an invalid selection. Run compiled
   `.js` counterparts, with the package root as the test working directory.
   The unit bootstrap may resolve the actual product bin from that root's
   manifest and invoke the real `dist` CLI; it must not accidentally invoke
   the unit compiler's mirrored CLI or import it for side effects.
4. **Fail-closed results.** Use Node's structured test events with process
   isolation, retaining readable diagnostics and explicit counts. A successful
   import of an empty file is not a real test. Require a completed per-file
   summary and at least one executed, non-skipped/non-TODO test in every
   selected file. Fail on no discovered files, missing summaries, zero tests,
   empty suites, skipped/TODO-only files, assertion/import failures,
   cancellation or abnormal child termination. Propagate failures to a nonzero
   process exit; never infer success from output text or only a cumulative
   count. Codex's local probe confirmed that an empty Node test file can yield
   one passing file wrapper without a per-file summary. See the primary
   [Node test-runner documentation](https://nodejs.org/docs/latest-v24.x/api/test.html).
   Keep suites and leaf tests distinct in totals. Do not expose filters that
   can silently execute zero tests in this initial runner.
5. **Prove the harness.** Add focused dependency-free harness regression tests
   in `tools/run-unit-tests.test.mjs`, using disposable copies/fixtures. Prove
   default and explicit-file success, spaced paths, deterministic selection,
   missing/invalid selection, no discovery, empty file/empty suite,
   skipped/TODO-only selection, genuine named assertion failure, import or
   syntax failure, and nonzero exit propagation. Prove an empty selected file
   fails even beside a passing one. A TypeScript-error fixture must stop before
   stale output can run. Show valid restores green. Negative evidence must
   identify its intended failure, not accept any unrelated setup crash.
   Keep failure fixtures outside normal discovery and clean owned temp roots.
   Strip inherited `NODE_TEST_CONTEXT` when launching an independent runner
   from a test worker, so the nested runner cannot silently no-op. Preserve
   the existing 41-test smoke and its expected nested mutation self-skips.
6. **Resolve the scheduled S005 isolation finding.** Change only fixture
   ownership/cleanup plumbing in `tools/check-contracts.fixtures.mjs` and its
   tests as needed. Let fixture creation accept an optional owned temporary
   parent (default remains the ordinary temporary directory). The failure
   cleanup test must inspect its own parent/allocation, never newly appearing
   global `suik-contracts-*` entries. Preserve cleanup on construction failure,
   lifecycle-independent scenarios and isolated Git histories. Prove an
   unrelated live fixture remains untouched, overlapping independent suites
   both pass, and a deliberately retained owned fixture is detected. Do not
   delete, weaken or skip the leak assertion, and do not change validator
   semantics. Run suites sequentially until the fix itself is established;
   then explicitly run two overlapping contract suites and report both exits.
7. **Documentation and gates.** Update developer commands, verification
   guidance and candidate `implementation/evidence/S005_REPORT.md` together.
   Preserve accepted S004 evidence and factual post-commit bookkeeping. No new
   governing document, tracker, lint/browser/consumer lane or S006 work. Run
   frozen strict install, both typecheck configurations, build, unit runner
   default and explicit file, harness regression tests, existing CLI smoke,
   contract validation/tests including isolation evidence, format and diff
   checks. Run S005's fresh reference fmt/check/test guard; the same-S004
   reuse exception does not carry forward. Preserve failed-attempt logs and
   actual command exits, and separate top-level/nested/expected-negative totals.
8. **Return boundary.** Complete every unblocked S005 requirement and
   self-review, then return unstaged/uncommitted with S005 `in_progress`, report
   `candidate`, null commit and S006 untouched. Codex owns consequential scope,
   API, dependency and deviation decisions, acceptance and commits. Report new
   consequential blockers with evidence while completing independent approved
   work. No push, publication, reference mutation or external coordination
   change is authorized for Pi. No human release test is due.

## Codex correction dispatch — S004 review 1

Codex reviewed all S004 implementation, tests, configuration, documentation and
the actual author session and logs. The normal 27-test bootstrap and 83-test
contract suites pass independently, as do strict frozen install, typecheck,
build, contract validation, formatting and diff checks. That does not close the
findings below. Keep S004 `in_progress`, report `candidate`, review
`changes_requested`, both null hashes; S005 remains locked. The original S004
dispatch remains applicable except for the explicit clarifications here.

### Decisions resolved by Codex

1. The package name is the fixed product identity `svelte-ui-kit`; metadata
   validation must require that exact string. Do not accept a different name,
   whitespace-normalized alias or a name containing control characters.
   Version remains metadata-derived, not pinned in source: accept valid
   [SemVer 2.0.0](https://semver.org/) including prerelease and build metadata.
   Implement validation without another dependency. Reject malformed values
   with exit 1, empty stdout and a clear CLI stderr diagnostic. Do not echo
   untrusted metadata text into that diagnostic.
2. Read/validate metadata before dispatching bootstrap arguments, as the
   candidate already does: a broken installation exits 1 for help/version and
   other invocations. With valid metadata, unsupported arguments still exit 2.
   Syntactically invalid package JSON may be rejected by Node before the module
   runs; Node's clear stderr rejection and exit 1 satisfy this bootstrap
   requirement. Do not add a wrapper or change the ESM/bin architecture to
   intercept it. Full JSON/envelope behavior still belongs to S022–S023.
3. The existing 27-test suite is not sufficient evidence for no writes or
   metadata-derived versions. Strengthen the S004 executable smoke itself,
   without introducing the S005 unit harness or fixing its separate shared-temp
   assertion early. Keep fixtures owned and isolated; no source mutation is
   needed to demonstrate the regressions.
4. The fresh Pi S004 reference guard has been audited: unchanged clean revision
   `a10fbf06334f4648f5755e05a7147414e4e5fc98`, fmt/check/test exit 0,
   562 top-level plus 16 nested subprocess passes, zero failures, four ignored
   slow lanes. For this same-S004 TS/test/documentation correction only, verify
   that identity and clean state and cite the existing guard honestly. Rerun
   it if reference/Rust scope changes or evidence is invalidated. This is not
   permission to waive a fresh guard at the next checkpoint.

### Required corrections and acceptance

- **S004-R1 — Validate metadata completely.** The current name check accepts
  `svelte-ui-kit\nforged line` and the current version expression accepts
  `1.2.3-01`, `1.2.3-..` and `1.2.3+..`, all with exit 0. Fix the name/version
  checks under decision 1. Add executable tests for wrong/control/whitespace
  names, missing and non-string fields, non-object metadata, empty identifiers,
  numeric prerelease leading zeroes, and leading/trailing whitespace/newlines.
  Preserve valid versions such as `2.3.4-rc.1+build.001`, `1.2.3-0` and
  `1.2.3+001`; do not incorrectly prohibit leading zeroes in build identifiers.
- **S004-R2 — Make smoke claims falsifiable.** The current snapshot compares
  entry names only; overwriting `.decoy-hidden` still passes all 27 tests.
  Capture deterministic entry types and regular-file bytes (or hashes), hidden
  and nested entries, and symlink targets without following symlinks. Exclude
  read-induced timestamp changes. Exercise no-write behavior from owned seeded
  fixtures for help, version and representative rejected argument lists.
  Add a disposable built-copy case that changes only its valid package version
  and proves both version flags print the changed value from an unrelated cwd;
  a hard-coded `0.1.0` implementation currently passes every test.
  Demonstrate that the strengthened tests reject both an existing-file-write
  mutant and a hard-coded-version mutant in disposable build copies. Never
  inject these into the actual source or leave them behind. A small focused
  regression for the snapshot helper is also acceptable evidence that a
  same-path, same-length content replacement is detected; the real CLI smoke
  must still use that snapshot.
- **S004-R3 — Reconcile evidence.** Codex has corrected the public report's
  private-tooling references and marked the review outcome. Append actual
  correction results and all failures/retries; preserve earlier failed logs
  and Codex review metadata. Include the initial blocked unrouted formatting
  attempt and later formatting failure, not only the smoke retry. The
  compatibility addendum's version wording was also clarified by Codex; preserve
  that distinction when updating it. Report ordinary suite passes separately
  from negative/mutation evidence and keep all
  generated output, logs and operator paths out of committed public content.

Use a fresh Pi session. Preserve S003 accepted evidence and all existing
candidate work. No dependency/lock/runtime/workspace change is authorized.
Run typecheck, build, strengthened executable smoke, contract validation and
contract tests sequentially, format and diff checks using the pinned runtime
and required execution routing. Record exact commands, real exits, counts and
per-attempt logs. All currently known consequential decisions are resolved;
report newly discovered consequential choices to Codex while completing
independent in-scope work. Return the full corrected S004 candidate unstaged
and uncommitted. No acceptance, successor implementation, staging, commit,
push, publication, reference mutation or external coordination edit by Pi.
No human release test is due.

## Codex dispatch decisions — S004

This dispatch becomes executable only after S003 is accepted and committed and
its actual hash is recorded below. Complete the full S004 scope in a fresh Pi
session. Codex owns the following decisions; no owner clarification is pending.
Earlier dispatches remain historical. S005 and successors remain locked until
S004 itself is independently accepted and committed.

1. **Build boundary.** Use the installed TypeScript compiler, with no new
   dependency or bundler. Add `src/cli/main.ts` and `tsconfig.json` with
   `target: ES2023`, `module: NodeNext`, `moduleResolution: NodeNext`,
   `lib: [ES2023]`, `types: [node]`, `strict: true`, `noEmitOnError: true`,
   `rootDir: src`, `outDir: dist`, and `include: [src/**/*.ts]`. Do not weaken
   type errors with suppressions, `any`, or `skipLibCheck`. Add real scripts
   `build: tsc -p tsconfig.json` and
   `typecheck: tsc -p tsconfig.json --noEmit`. Keep outputs ignored and
   uncommitted; use `.js` specifiers in any relative ESM source imports.
2. **Package and runtime.** Add development package version `0.1.0` and bin
   mapping `svelte-ui-kit: ./dist/cli/main.js`, with a Node shebang on the
   entrypoint. This is private bootstrap metadata, not release approval.
   Preserve private/ESM/license, exact S003 dependencies, engine, runtime pin,
   package manager, root workspace and existing scripts. No runtime dependency,
   consumer export facade, Svelte import or registry asset belongs in this
   entrypoint. Read and validate name/version from this package's metadata
   relative to the built module, independent of cwd; do not duplicate version
   text, consult Git or search the invoking application. A missing/malformed
   package metadata file must fail clearly on stderr with exit 1.
3. **Exact bootstrap behavior.** No arguments, sole `--help` or sole `-h`
   produce concise honest help on stdout, empty stderr and exit 0. Sole
   `--version` or sole `-V` produces `svelte-ui-kit 0.1.0` and a final newline,
   empty stderr and exit 0 (derive version from metadata). All other argument
   lists, including mixed/repeated flags and future product command names,
   produce a useful human usage diagnostic on stderr, empty stdout and exit 2.
   Advertise only implemented help/version behavior; say this is a bootstrap.
   No project inspection, network or writes. `--json` and `--cwd` are not yet
   supported. These bootstrap outcomes do not freeze the complete command
   envelope/exit map or argument grammar scheduled at S022–S023.
4. **Focused executable smoke.** Add dependency-free
   `tests/smoke/cli-bootstrap.test.mjs` using `node:test` and
   `test:cli-bootstrap: node --test tests/smoke/cli-bootstrap.test.mjs`.
   Run after build; missing output must fail, not skip. Exercise all supported
   forms and representative rejected flags/combinations/product commands,
   exact exit/stdout/stderr and no-write behavior. Resolve the entrypoint from
   package bin metadata. Run from an unrelated cwd with spaces and prove cwd
   package/version cannot influence output. Copy only built output and package
   metadata to a disposable location (no source or development dependencies)
   and repeat help/version; exercise missing/malformed metadata there. Snapshot
   owned fixtures including hidden entries and clean only owned directories.
   This is a bootstrap smoke, not the S005 general unit harness or final
   tarball/consumer acceptance. Prove typecheck is real with a temporary
   negative type fixture that fails, then restore and rerun green without
   committing the invalid fixture.
5. **Documentation and evidence.** Align README/CONTRIBUTING with the actual
   pinned setup, existing contract tests and new CLI bootstrap commands; remove
   the stale claim that no test suite exists. Keep later product capabilities
   identified as planned. Update compatibility evidence only as needed for the
   build boundary; do not claim consumer rendering/SSR/browser/packaging green.
   Create `implementation/evidence/S004_REPORT.md` as candidate/null evidence.
   Preserve accepted S003 report/review metadata and post-commit bookkeeping.
   Regenerate the JSON projection from Markdown only when needed. No new
   governing document or local issue database.
6. **Verification and reporting.** Use Node 24.21.0 and pnpm 11.22.0. Run the
   frozen strict-peer engine-strict install, typecheck, build, executable smoke,
   contracts, all contract tests, formatting and diff checks; keep contract
   suites/rehearsals sequential pending S005's owned-temp correction below.
   Preserve each failed attempt in its own log, record real process exits and
   retries, and never treat pipeline/trailing-command success as the check's
   exit. Run this checkpoint's fresh conditional reference fmt/check/test guard
   at the unchanged authorized revision; report top-level and nested subprocess
   totals separately. No reference mutation is authorized.
7. **Return and decisions.** Complete all unblocked S004 implementation and
   self-review, then return unstaged/uncommitted, S004 `in_progress`, report
   `candidate`, null commit and S005 untouched. Codex owns review acceptance,
   commits, deviations and consequential choices between coding periods.
   Report a newly discovered consequential incompatibility with evidence and
   bounded alternatives while finishing independent authorized work; do not
   substitute dependencies or broaden scope. No human release test is due.

## Codex dispatch decisions — S003

This is the next dispatch after the accepted S002 checkpoint is committed and
its actual hash recorded. Earlier S002 instructions remain historical. Codex
owns these dependency choices; Pi may implement the complete S003 scope below
without another approval round. An actual metadata/install incompatibility
returns to Codex with evidence, not an automatic substitution or weakened peer
check. S004 and later implementation remain locked until accepted S003 commit.

### Exact approved development baseline

Codex inspected current registry metadata on 2026-09-29. Select these exact
versions, subject to S003 proving the resolved lock and installation:

| Package/tool                 | Exact version | Role and decision                                                                               |
| ---------------------------- | ------------- | ----------------------------------------------------------------------------------------------- |
| Node                         | 24.21.0       | Reproducible LTS development runtime; record in `.node-version`; preserve package engine `>=24` |
| pnpm                         | 11.22.0       | Preserve existing packageManager and sole lockfile format                                       |
| prettier                     | 3.9.6         | Preserve existing formatter dependency                                                          |
| svelte                       | 5.57.1        | Development/compiler baseline; satisfies Bits and plugin peers                                  |
| @sveltejs/kit                | 2.70.3        | Development baseline for the scheduled consumer harness                                         |
| bits-ui                      | 2.19.3        | Development primitive baseline; no kit runtime facade                                           |
| typescript                   | 6.0.3         | Within Kit's declared TypeScript peer range; do not use current latest 7.0.2                    |
| vite                         | 8.3.1         | Kit/plugin-compatible development build baseline                                                |
| @sveltejs/vite-plugin-svelte | 7.3.1         | Requires Svelte ^5.46.4 and Vite ^8.0.0-beta.7 or ^8.0.0                                        |
| @internationalized/date      | 3.12.4        | Required Bits peer satisfier only; does not authorize deferred date components                  |
| @types/node                  | 24.19.0       | Node 24 development types; satisfies Vite's optional types peer                                 |

Add the eight newly selected npm packages as exact `devDependencies`, without
ranges. Preserve `private: true`, ESM, license, product identity and the existing
four scripts. Do not add a consumer-facing runtime/peer facade to this CLI
package, change workspace membership, or introduce application auto-install.
No extra adapter, runner, lint stack, schema library or build framework is
selected here; those choices belong to their scheduled checkpoints.

Primary evidence: [Node 24.21.0 release](https://nodejs.org/en/blog/release/v24.21.0),
and the version-specific npm registry metadata for
[Svelte](https://registry.npmjs.org/svelte/5.57.1),
[Kit](https://registry.npmjs.org/@sveltejs%2Fkit/2.70.3),
[Bits](https://registry.npmjs.org/bits-ui/2.19.3),
[TypeScript](https://registry.npmjs.org/typescript/6.0.3),
[Vite](https://registry.npmjs.org/vite/8.3.1),
[Svelte plugin](https://registry.npmjs.org/@sveltejs%2Fvite-plugin-svelte/7.3.1),
[date peer](https://registry.npmjs.org/@internationalized%2Fdate/3.12.4) and
[Node types](https://registry.npmjs.org/@types%2Fnode/24.19.0).
Use exact-version metadata in the report; moving latest tags are discovery
inputs, not reproducible pins.

Kit declares TypeScript `^5.3.3 || ^6.0.0` (optional), Svelte
`^4.0.0 || ^5.0.0-next.0`, Vite through `^8.0.0`, and the Svelte plugin through
`^7.0.0`. Bits requires Svelte `^5.33.0` and date `^3.8.1`; its date peer is not
marked optional in the inspected metadata. The selected plugin requires Node
`^20.19 || ^22.12 || >=24`; Vite requires `^20.19.0 || >=22.12.0`. These direct
metadata constraints agree with the selections. Transitive peer and actual
runtime verification remain S003 work, not already-proven behavior.

### Implementation and verification boundary

1. Recheck exact package metadata, engines, peer ranges and optional-peer flags;
   record them with dated public sources and commands in
   `implementation/evidence/COMPATIBILITY.md`. Identify root tool dependencies
   separately from future generated-consumer requirements. Do not mistake
   historical Bits source observations for a promise about the selected release.
2. Add `.node-version`, the approved exact devDependencies and the corresponding
   pnpm lockfile entries. Keep the root-only workspace entry unchanged. Routine
   dependency resolution is allowed; unapproved direct packages or version
   substitutions require Codex. Do not change global tools or package-manager
   configuration. Do not enable dependency build scripts broadly to bypass a
   failure; report a genuinely required new script/exception to Codex.
3. Use the existing pnpm command surface. Record the initial lock-generating
   install explicitly, then prove a separate
   `pnpm install --frozen-lockfile --strict-peer-dependencies` succeeds under
   Node 24.21.0 with engine checking enabled. Confirm the frozen install does not
   alter package/lock bytes. Inspect all resolved peers rather than relying on
   optional-peer auto-install or suppressed warnings. Report each missing
   optional peer and why it is unused; do not install unrelated preprocessors.
4. Run real package-entry/compiler-version smoke checks supported by package
   exports. Temporary probes are allowed; no product CLI, consumer scaffold or
   wrapper API may be implemented ahead of S004/S007–S012. A successful install
   does not prove rendering, SSR/hydration or component behavior; preserve those
   later gates. Do not introduce placeholder-green scripts.
5. Run existing contract validation, full contract tests, formatting and diff
   checks sequentially, plus S003's applicable reference guard. Update the
   compatibility record and `implementation/evidence/S003_REPORT.md` with exact
   commands, resolved versions, changed files, results, skips and limitations.
   Preserve S002's accepted evidence and post-commit bookkeeping. Regenerate
   the checkpoint projection from Markdown when status changes.
6. Return S003 `in_progress`, candidate evidence with null commit, unstaged and
   uncommitted for Codex review. Do not manufacture a Codex review. No S004,
   publication, push, reference change or external coordination mutation is
   authorized. All known choices needed to start S003 are resolved here.

### Scheduled S005 test-isolation follow-up

Review 4 found a bounded limitation in the existing fixture-cleanup regression:
overlapping independent suite processes in one temporary namespace can mistake
each other's active fixture directories for leaks. Execute the existing suite
and advanced rehearsals sequentially through S004; no assertions are waived.
At the already-scheduled S005 harness checkpoint, scope cleanup assertions to
directories owned by that invocation and prove both overlapping-run isolation
and detection of a genuinely leaked owned fixture. Keep actual fixture cleanup
and complete-tree purity coverage. This does not change product scope or
checkpoint order and is not extra work for Pi during S003.

## Resolved baseline and approved review dispositions

1. **Target and tooling.** The target is `https://github.com/triesap/svelte-ui-kit`, using its existing `master` history. The reviewed scaffold has 14 tracked files and no product source, tests or CI workflows. Preserve `pnpm@11.22.0`, Node engine `>=24`, `prettier@3.9.6`, the existing lockfile, and MIT OR Apache-2.0 licensing unless a scheduled evidence-backed compatibility change requires an update. Node `v26.10.0` was observed on the review machine; that observation is not a supported-version matrix or an exact Node pin. Use the established `area: imperative summary` style for checkpoint messages. Revalidate these observations at S001.
2. **Reference identity.** Use [triesap/leptos_ui_kit at a10fbf0](https://github.com/triesap/leptos_ui_kit/tree/a10fbf06334f4648f5755e05a7147414e4e5fc98) as read-only design and source evidence. It is not the target. Its Rust implementation is not a template to translate mechanically. The target has no Cargo manifest; record target Cargo checks as N/A with inventory evidence. Separately inventory and honor the conditional reference Cargo guard described in the verification contract. Reference Rust checks have not been run by this planning setup.
3. **Field parity — S145–S148, S181.** The reference Field exports FieldRoot, FieldSurface, FieldLabel, FieldMessage, FieldRequired, FieldSlot, TextInput/TextInputType, TextArea, TextField, TextAreaField, NativeSelect, SelectField and SelectIcon. The worksheet must give each export and associated native input/textarea/select, label, required, invalid, disabled, dynamic-message and composition behavior an explicit Svelte mapping or justified disposition. Native select parity is part of the original catalog; it is not the deferred new select/combobox API. Preserve behavior without copying Rust-specific slot/context APIs. See [reference Field manifest](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/field.json). Normative S002 clarification: [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md#approved-source-parity-clarifications).
4. **Menu parity — S122–S128, S181.** Map the source's ordinary and radio items, controlled selection and indicators as well as activation, keyboard/typeahead, dismissal, focus return and placement. Selection is evidenced source scope, not an optional feature to omit by default. Derive the necessary pinned Bits parts without adopting its entire catalog. Do not carry over an untested strict-CSP promise. See [reference Menu manifest](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/menu.json). Normative S002 clarification: [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md#approved-source-parity-clarifications).
5. **Avatar — S155–S157.** The [reference Avatar](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/avatar.rs) is a native image with src, alt and class. The approved target requires loading/failure/fallback qualification. Freeze the minimal typed fallback content, transitions, accessible text and SSR behavior at S155 using pinned native/Bits evidence. Describe this as target behavior; do not claim an existing source fallback API or invent unrelated variants. Normative S002 clarification: [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md#approved-source-parity-clarifications).
6. **Ownership — S015, S030, S043–S063.** Explicit requests remain separate from the resolved dependency closure. Compare tracked base/local/incoming bytes and enforce source/CSS/export cohorts; do not translate the source's local-edit refusal or dependency-closure-to-config behavior. Untracked equality grants no silent adoption or deletion rights. Preserve legitimate baselines, detach customized retired assets truthfully, and stop unsafe mixed updates.
7. **Verification independence — S002 onward.** The specification archive's integrity checks validated a fixed payload and all-not-started plan; they do not validate changing implementation status or product behavior. Establish `tools/check-contracts.mjs` at S002 to check live repository links, checkpoint order, requirement coverage and truthful status evidence without assuming the archived manifest. No such target tool is implemented by this planning document.
8. **Public evidence and execution scope.** Keep adopted contracts, commands, provenance, generated fixtures and reports self-contained. The initial planning setup completed no implementation checkpoint. Active implementation now follows the execution state and reviewed commit ledger above. Do not treat prior analysis, dependency hydration or this plan's formatting result as product implementation completion.

## Remaining technical gates

| Gate                        | Scheduled resolution and recommended default                                                                                                                                                         | Risk if unresolved                                                                              | Blocking boundary                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| A.1 — Exact dependencies    | S003 selects reproducible Node/Svelte/Kit/Bits/TS versions from actual metadata with pnpm; S011 proves the typed primitive boundary.                                                                 | Incompatible peers, bindings, refs or snippets.                                                 | Dependency selection before affected code; passing probe before generated wrappers. |
| A.2 — Schemas and protocol  | S013–S024 freeze independent identities, strict fields, exact-byte hashes, deterministic JSON and exit codes; S052 freezes export markers. Use local versioned schemas without invented hosted URLs. | Wire drift, false ownership and ambiguous patching.                                             | Each dependent model/handler/patcher.                                               |
| A.3 — Paths and platforms   | S033–S042 establish defaults, explicit supported mappings and trusted-local limits; S064–S077 prove recovery; S193 qualifies advertised OS lanes.                                                    | Escaped targets, destructive races, ambiguous crash recovery or unsupported portability claims. | Exposing mutation; final platform claims require executed evidence.                 |
| A.4 — Ownership and cohorts | S043 resolves missing/adoption cases; S059 freezes conservative cohort rules. Default to visible missing-target outcomes, no silent adoption and refusal of unsafe mixed updates.                    | Lost edits, accidental deletion or falsely advanced lock state.                                 | Affected planners before guarded apply.                                             |
| A.5 — Component APIs        | Freeze every family against source maps and pinned types before wrappers; include the Field/Menu/Avatar dispositions above and native identity at S179–S180.                                         | Silent catalog omissions, invented APIs or broken forms/SSR.                                    | Each family implementation and final parity audit.                                  |
| A.6 — Accessibility and CSP | Establish an actual initial browser lane at S008; measure themes, contrast, keyboard/forms and floating styles through S128/S188.                                                                    | Unsupported accessibility, browser or strict-CSP claims.                                        | Affected component qualification and release acceptance.                            |
| A.7 — Distribution          | S090/S194–S196 prove package contents, runtime independence, peers, notices and actual name status. Preserve dual licensing; do not publish or silently rename.                                      | Unusable packed output or misleading compatibility/distribution claims.                         | Distribution acceptance; publisher authorization is separate.                       |
| A.8 — Extensions            | S202 records precise missing inventory/value/search/date/locale/timezone contracts and next specification gate.                                                                                      | Invented product behavior or false expanded completion.                                         | Extension implementation only; does not block specified core.                       |

No additional product decision blocks S001. Ordinary technical discovery is resolved at these checkpoints, with evidence; it is not a reason to repeatedly request already approved choices.

## Command mapping and baseline evidence

Run commands from this repository or the exact fixture/reference root named in the checkpoint report, following the active environment's execution policy. This plan uses repository commands without prescribing workstation configuration.

The existing meaningful lane is `pnpm run format:check`. It passed during review with the pinned formatter; both staged and unstaged diff checks passed. The formatter dependency was hydrated by the execution environment. These are review observations and must be refreshed at the execution baseline. No product suite, browser lane, package acceptance or Rust lane has passed on the strength of that check.

The checkpoint command categories use pnpm: `pnpm run <script>` replaces illustrative `npm run <script>`; `pnpm pack --json` replaces illustrative `npm pack --json`. Confirm runner argument forwarding and pack output support in the pinned manager when establishing each lane. These are command translations, not implementation scope deviations. Script names other than format/format:check are proposed until the scheduled step implements and proves them; do not run placeholders or record unavailable scripts as passed. The optional public package's runtime asset loading must remain independent of package-manager setup and the authoring checkout.

## RCLD sequence map

The sequence gates below supplement each checkpoint's exact scope and tests. Run the scoped lane for each checkpoint and all applicable cumulative lanes at milestone exit. Every sequence after RCLD-01 depends on completion of its predecessor's final checkpoint.

| RCLD                | Checkpoints | Count | State       | Predecessor         |
| ------------------- | ----------- | ----- | ----------- | ------------------- |
| [RCLD-01](#rcld-01) | S001–S012   | 12    | complete    | None; S001 complete |
| [RCLD-02](#rcld-02) | S013–S032   | 20    | in_progress | S012                |
| [RCLD-03](#rcld-03) | S033–S063   | 31    | not_started | S032                |
| [RCLD-04](#rcld-04) | S064–S077   | 14    | not_started | S063                |
| [RCLD-05](#rcld-05) | S078–S091   | 14    | not_started | S077                |
| [RCLD-06](#rcld-06) | S092–S115   | 24    | not_started | S091                |
| [RCLD-07](#rcld-07) | S116–S128   | 13    | not_started | S115                |
| [RCLD-08](#rcld-08) | S129–S148   | 20    | not_started | S128                |
| [RCLD-09](#rcld-09) | S149–S181   | 33    | not_started | S148                |
| [RCLD-10](#rcld-10) | S182–S193   | 12    | not_started | S181                |
| [RCLD-11](#rcld-11) | S194–S203   | 10    | not_started | S193                |

<a id="rcld-01"></a>

### RCLD-01 — Baseline and verification harness

Checkpoints: S001–S012. State: complete.

**Scope:** Establish repository evidence, adopt contracts, pin compatible dependencies, build the typed CLI boundary, and qualify a real SSR consumer and primitive probe.

**Definition of green:** Real format/lint/type/unit/consumer/browser lanes exist, run meaningfully, and enforce separated CLI, registry, project and planner boundaries.

**Verification lane:** Bootstrap unit checks; consumer check/build; browser smoke; compatibility types; baseline CI.

<a id="rcld-02"></a>

### RCLD-02 — Versioned models and registry resolution

Checkpoints: S013–S032. State: in_progress.

**Scope:** Freeze independent versions, strict config/registry/lock/theme/protocol schemas, argument grammar, immutable packaged assets, deterministic dependency and export resolution.

**Definition of green:** Malformed schemas, incompatible peers, cycles and ownership/export collisions fail before planning; explicit roots remain distinct from transitive items.

**Verification lane:** Model/protocol unit tests and registry integrity/ownership tests.

<a id="rcld-03"></a>

### RCLD-03 — Project integration and ownership planning

Checkpoints: S033–S063. State: not_started.

**Scope:** Validate paths and project roots, inspect dependencies, freeze ownership cases, patch CSS/exports/layout structurally, and compose init/add/sync/retirement plans.

**Definition of green:** Complete deterministic plans preserve unmanaged bytes and local edits; conflicts cannot advance config or lineage; all planning paths produce zero writes.

**Verification lane:** Filesystem/project integration, B/L/I and cohort unit matrices, patch preservation, complete-tree purity and consumer build.

<a id="rcld-04"></a>

### RCLD-04 — Transactions and recovery

Checkpoints: S064–S077. State: not_started.

**Scope:** Freeze transaction states and platform assumptions; implement strict journals, writer coordination, preimage checks, staging, replacements, lock-last publication and recovery.

**Definition of green:** Faults and process interruption recover consistently or refuse safely; concurrent and post-crash user edits survive; every write uses the same guarded apply boundary.

**Verification lane:** Transaction unit/integration fault injection plus real-process contention and interruption tests.

<a id="rcld-05"></a>

### RCLD-05 — CLI workflows and generator acceptance

Checkpoints: S078–S091. State: not_started.

**Scope:** Wire one outcome renderer and info/view/init/add/sync/doctor to verified use cases, then qualify process results, idempotence, schema boundaries, upgrades and package inventory.

**Definition of green:** All six commands honor JSON/exit/no-write contracts; customization is not strict-doctor failure; the packaged generator operates without hidden asset or dependency installation paths.

**Verification lane:** Built-executable integration matrix, workflow purity, synthetic upgrades, package inventory and cumulative generator lanes.

<a id="rcld-06"></a>

### RCLD-06 — Tokens and core components

Checkpoints: S092–S115. State: not_started.

**Scope:** Freeze/map token contracts, then qualify Spinner, Button, Switch and the complete Dialog family through the generator and an installed tarball.

**Definition of green:** The initial core preserves tokens, radius/shape rules, native forms, bindings/refs/snippets, keyboard/focus, portal themes and SSR/hydration; upgrades preserve customization.

**Verification lane:** Registry/type/install fixtures, computed-style and behavior browser suites, SSR and packed-core acceptance.

<a id="rcld-07"></a>

### RCLD-07 — Alert Dialog and Menu

Checkpoints: S116–S128. State: not_started.

**Scope:** Qualify distinct Alert Dialog semantics and source-parity Menu selection, delegated floating content, themes, positioning and measured CSP behavior.

**Definition of green:** Complete families preserve primitive behavior, source-required selection and focus; floating wrappers retain positioning structure; CSP claims match measured evidence.

**Verification lane:** Family type/install tests, keyboard/focus/nested-overlay browser tests, placement/theme/CSP qualification.

<a id="rcld-08"></a>

### RCLD-08 — Forms and disclosures

Checkpoints: S129–S148. State: not_started.

**Scope:** Qualify Checkbox, Radio, Tabs, Collapsible and the complete Field source-parity mapping, including native input/textarea/select behaviors.

**Definition of green:** Generated controls preserve form submission/reset, required/disabled behavior, labels/IDs, typed state, presence and hydration; Field mappings have no silent omissions.

**Verification lane:** Per-family contract/install checks, real-form/keyboard browser tests, Field SSR and consumer build.

<a id="rcld-09"></a>

### RCLD-09 — Remaining catalog and identity

Checkpoints: S149–S181. State: not_started.

**Scope:** Qualify Anchor/Router Link, Avatar, Badge, Card, Alert, Status, Progress, Separator and Skeleton; resolve native identity and audit all 22 original registry IDs plus Alert Dialog.

**Definition of green:** Every original item/export has an explicit behavioral mapping or justified disposition; Avatar fallback is a frozen target behavior; no fake identity shim or unapproved extension appears.

**Verification lane:** Per-item type/install/browser suites, identity SSR/hydration, full catalog parity and registry checks.

<a id="rcld-10"></a>

### RCLD-10 — Cross-component and platform qualification

Checkpoints: S182–S193. State: not_started.

**Scope:** Audit imports/exports, wrapper contracts, combined forms/overlays, CSS/theme/accessibility/SSR, custom layouts, retirement/re-add, upgrade cohorts and supported filesystems.

**Definition of green:** Catalog composition and ownership lifecycle pass; compatibility and platform claims match actual executed evidence; safety failures are not skipped.

**Verification lane:** Cumulative generated-app browser/SSR/integration tests, registry CSS/import audits, supported-OS transaction lanes.

<a id="rcld-11"></a>

### RCLD-11 — Packed acceptance and delivery

Checkpoints: S194–S203. State: not_started.

**Scope:** Prove installed CLI and generated consumer independence, verify release-shaped metadata/notices, exercise operating/recovery examples, reconcile traceability and record the extension specification gate.

**Definition of green:** AC01–AC22 and R01–R34 have real evidence; all required checkpoints have reviewed commits/reports; artifact/compatibility/remaining limits are reproducible and no publication is implied.

**Verification lane:** Installed-tarball and generated-consumer acceptance, documented workflows/recovery, full code-health/platform lanes, contract/traceability audit.

## Checkpoint ledger

The original IDs, requirement anchors, scope, files, tests, expected results and commit messages are preserved below. Every status starts at not_started. No completion is inferred from a milestone name or plan approval.

| Step | Sequence | Depends on | Status                   | Commit / report                            |
| ---- | -------- | ---------- | ------------------------ | ------------------------------------------ |
| S001 | RCLD-01  | None       | complete                 | `bb5010e`                                  |
| S002 | RCLD-01  | S001       | complete                 | `9ed224f60249ee67732c05737170436e06301c38` |
| S003 | RCLD-01  | S002       | complete                 | `91cdaaefd756021b343465f7ba7dd3afe2f71b6d` |
| S004 | RCLD-01  | S003       | complete                 | `fd5d5162c7e5e3fa22fcc8a0365525f4e0e6a100` |
| S005 | RCLD-01  | S004       | complete                 | `5cf149106fbc7c9fb20eca1f31a0e5b08aff4b11` |
| S006 | RCLD-01  | S005       | complete                 | `bce30a4b7b5bf0e885d9991719f807cfda98ad63` |
| S007 | RCLD-01  | S006       | complete                 | `0d7ca2a3798f639dd6f913b2c3ed9839776bcd4c` |
| S008 | RCLD-01  | S007       | complete                 | `0d7ca2a3798f639dd6f913b2c3ed9839776bcd4c` |
| S009 | RCLD-01  | S008       | complete                 | `0d7ca2a3798f639dd6f913b2c3ed9839776bcd4c` |
| S010 | RCLD-01  | S009       | complete                 | `0d7ca2a3798f639dd6f913b2c3ed9839776bcd4c` |
| S011 | RCLD-01  | S010       | complete                 | `0d7ca2a3798f639dd6f913b2c3ed9839776bcd4c` |
| S012 | RCLD-01  | S011       | complete                 | `0d7ca2a3798f639dd6f913b2c3ed9839776bcd4c` |
| S013 | RCLD-02  | S012       | committed_pending_review | `bbd3cf4b0f07ebb9f82f259577a5d1ff17ed6878` |
| S014 | RCLD-02  | S013       | committed_pending_review | `1dd359fbbd87e846d47558615a003659396ba7bc` |
| S015 | RCLD-02  | S014       | committed_pending_review | `7a4d122c1f92d1f6db7e6c10e0a70fad89c752b9` |
| S016 | RCLD-02  | S015       | committed_pending_review | `ddba4853d36f8eb1980c7caaa71b24ae26b9d30c` |
| S017 | RCLD-02  | S016       | committed_pending_review | `1fb85b7f80fcde988d494c1446e2487ed40e6899` |
| S018 | RCLD-02  | S017       | committed_pending_review | `43d59e1f63fb95ce75eb10f6c38eca888a6de361` |
| S019 | RCLD-02  | S018       | committed_pending_review | `58ee9b84c9ee99c225e69e386c477ea344308d61` |
| S020 | RCLD-02  | S019       | committed_pending_review | `b9cb6cc47313bb23614014f6562140ae89a42932` |
| S021 | RCLD-02  | S020       | committed_pending_review | `6bb1f2564786dd1e5f3f5d65750b22abdf17c9b0` |
| S022 | RCLD-02  | S021       | committed_pending_review | `0e399f17b1e7bb913a5e84ea93a5e9600cff338a` |
| S023 | RCLD-02  | S022       | committed_pending_review | `7625796a1bf7b7865f25fc4192a794fed8f4749a` |
| S024 | RCLD-02  | S023       | committed_pending_review | `00faf8b4feb863da211136f925e357031c14494c` |
| S025 | RCLD-02  | S024       | committed_pending_review | `287e5f5b7f7be4ac87307bd45cd153f7f635ac7b` |
| S026 | RCLD-02  | S025       | committed_pending_review | `466c6ea35b0997dcf57de479adc9d914e1d67bea` |
| S027 | RCLD-02  | S026       | committed_pending_review | `74f6c3b157333b2047755453c6e14d34e6839b9c` |
| S028 | RCLD-02  | S027       | committed_pending_review | `23ad1cd7d042f31fa2597053e0e11cb9da68162e` |
| S029 | RCLD-02  | S028       | committed_pending_review | `3720ea8702e96c293feec91950313623f8e1b6ba` |
| S030 | RCLD-02  | S029       | committed_pending_review | `cb67f7cb6b70e5424b7e51258c631cc119db055e` |
| S031 | RCLD-02  | S030       | committed_pending_review | `07f35d25df24112f8d7fc20ca549a0167ba3f230` |
| S032 | RCLD-02  | S031       | committed_pending_review | `14851a26a8c161d9b2ec87bc0633ced533c3e085` |
| S033 | RCLD-03  | S032       | not_started              | —                                          |
| S034 | RCLD-03  | S033       | not_started              | —                                          |
| S035 | RCLD-03  | S034       | not_started              | —                                          |
| S036 | RCLD-03  | S035       | not_started              | —                                          |
| S037 | RCLD-03  | S036       | not_started              | —                                          |
| S038 | RCLD-03  | S037       | not_started              | —                                          |
| S039 | RCLD-03  | S038       | not_started              | —                                          |
| S040 | RCLD-03  | S039       | not_started              | —                                          |
| S041 | RCLD-03  | S040       | not_started              | —                                          |
| S042 | RCLD-03  | S041       | not_started              | —                                          |
| S043 | RCLD-03  | S042       | not_started              | —                                          |
| S044 | RCLD-03  | S043       | not_started              | —                                          |
| S045 | RCLD-03  | S044       | not_started              | —                                          |
| S046 | RCLD-03  | S045       | not_started              | —                                          |
| S047 | RCLD-03  | S046       | not_started              | —                                          |
| S048 | RCLD-03  | S047       | not_started              | —                                          |
| S049 | RCLD-03  | S048       | not_started              | —                                          |
| S050 | RCLD-03  | S049       | not_started              | —                                          |
| S051 | RCLD-03  | S050       | not_started              | —                                          |
| S052 | RCLD-03  | S051       | not_started              | —                                          |
| S053 | RCLD-03  | S052       | not_started              | —                                          |
| S054 | RCLD-03  | S053       | not_started              | —                                          |
| S055 | RCLD-03  | S054       | not_started              | —                                          |
| S056 | RCLD-03  | S055       | not_started              | —                                          |
| S057 | RCLD-03  | S056       | not_started              | —                                          |
| S058 | RCLD-03  | S057       | not_started              | —                                          |
| S059 | RCLD-03  | S058       | not_started              | —                                          |
| S060 | RCLD-03  | S059       | not_started              | —                                          |
| S061 | RCLD-03  | S060       | not_started              | —                                          |
| S062 | RCLD-03  | S061       | not_started              | —                                          |
| S063 | RCLD-03  | S062       | not_started              | —                                          |
| S064 | RCLD-04  | S063       | not_started              | —                                          |
| S065 | RCLD-04  | S064       | not_started              | —                                          |
| S066 | RCLD-04  | S065       | not_started              | —                                          |
| S067 | RCLD-04  | S066       | not_started              | —                                          |
| S068 | RCLD-04  | S067       | not_started              | —                                          |
| S069 | RCLD-04  | S068       | not_started              | —                                          |
| S070 | RCLD-04  | S069       | not_started              | —                                          |
| S071 | RCLD-04  | S070       | not_started              | —                                          |
| S072 | RCLD-04  | S071       | not_started              | —                                          |
| S073 | RCLD-04  | S072       | not_started              | —                                          |
| S074 | RCLD-04  | S073       | not_started              | —                                          |
| S075 | RCLD-04  | S074       | not_started              | —                                          |
| S076 | RCLD-04  | S075       | not_started              | —                                          |
| S077 | RCLD-04  | S076       | not_started              | —                                          |
| S078 | RCLD-05  | S077       | not_started              | —                                          |
| S079 | RCLD-05  | S078       | not_started              | —                                          |
| S080 | RCLD-05  | S079       | not_started              | —                                          |
| S081 | RCLD-05  | S080       | not_started              | —                                          |
| S082 | RCLD-05  | S081       | not_started              | —                                          |
| S083 | RCLD-05  | S082       | not_started              | —                                          |
| S084 | RCLD-05  | S083       | not_started              | —                                          |
| S085 | RCLD-05  | S084       | not_started              | —                                          |
| S086 | RCLD-05  | S085       | not_started              | —                                          |
| S087 | RCLD-05  | S086       | not_started              | —                                          |
| S088 | RCLD-05  | S087       | not_started              | —                                          |
| S089 | RCLD-05  | S088       | not_started              | —                                          |
| S090 | RCLD-05  | S089       | not_started              | —                                          |
| S091 | RCLD-05  | S090       | not_started              | —                                          |
| S092 | RCLD-06  | S091       | not_started              | —                                          |
| S093 | RCLD-06  | S092       | not_started              | —                                          |
| S094 | RCLD-06  | S093       | not_started              | —                                          |
| S095 | RCLD-06  | S094       | not_started              | —                                          |
| S096 | RCLD-06  | S095       | not_started              | —                                          |
| S097 | RCLD-06  | S096       | not_started              | —                                          |
| S098 | RCLD-06  | S097       | not_started              | —                                          |
| S099 | RCLD-06  | S098       | not_started              | —                                          |
| S100 | RCLD-06  | S099       | not_started              | —                                          |
| S101 | RCLD-06  | S100       | not_started              | —                                          |
| S102 | RCLD-06  | S101       | not_started              | —                                          |
| S103 | RCLD-06  | S102       | not_started              | —                                          |
| S104 | RCLD-06  | S103       | not_started              | —                                          |
| S105 | RCLD-06  | S104       | not_started              | —                                          |
| S106 | RCLD-06  | S105       | not_started              | —                                          |
| S107 | RCLD-06  | S106       | not_started              | —                                          |
| S108 | RCLD-06  | S107       | not_started              | —                                          |
| S109 | RCLD-06  | S108       | not_started              | —                                          |
| S110 | RCLD-06  | S109       | not_started              | —                                          |
| S111 | RCLD-06  | S110       | not_started              | —                                          |
| S112 | RCLD-06  | S111       | not_started              | —                                          |
| S113 | RCLD-06  | S112       | not_started              | —                                          |
| S114 | RCLD-06  | S113       | not_started              | —                                          |
| S115 | RCLD-06  | S114       | not_started              | —                                          |
| S116 | RCLD-07  | S115       | not_started              | —                                          |
| S117 | RCLD-07  | S116       | not_started              | —                                          |
| S118 | RCLD-07  | S117       | not_started              | —                                          |
| S119 | RCLD-07  | S118       | not_started              | —                                          |
| S120 | RCLD-07  | S119       | not_started              | —                                          |
| S121 | RCLD-07  | S120       | not_started              | —                                          |
| S122 | RCLD-07  | S121       | not_started              | —                                          |
| S123 | RCLD-07  | S122       | not_started              | —                                          |
| S124 | RCLD-07  | S123       | not_started              | —                                          |
| S125 | RCLD-07  | S124       | not_started              | —                                          |
| S126 | RCLD-07  | S125       | not_started              | —                                          |
| S127 | RCLD-07  | S126       | not_started              | —                                          |
| S128 | RCLD-07  | S127       | not_started              | —                                          |
| S129 | RCLD-08  | S128       | not_started              | —                                          |
| S130 | RCLD-08  | S129       | not_started              | —                                          |
| S131 | RCLD-08  | S130       | not_started              | —                                          |
| S132 | RCLD-08  | S131       | not_started              | —                                          |
| S133 | RCLD-08  | S132       | not_started              | —                                          |
| S134 | RCLD-08  | S133       | not_started              | —                                          |
| S135 | RCLD-08  | S134       | not_started              | —                                          |
| S136 | RCLD-08  | S135       | not_started              | —                                          |
| S137 | RCLD-08  | S136       | not_started              | —                                          |
| S138 | RCLD-08  | S137       | not_started              | —                                          |
| S139 | RCLD-08  | S138       | not_started              | —                                          |
| S140 | RCLD-08  | S139       | not_started              | —                                          |
| S141 | RCLD-08  | S140       | not_started              | —                                          |
| S142 | RCLD-08  | S141       | not_started              | —                                          |
| S143 | RCLD-08  | S142       | not_started              | —                                          |
| S144 | RCLD-08  | S143       | not_started              | —                                          |
| S145 | RCLD-08  | S144       | not_started              | —                                          |
| S146 | RCLD-08  | S145       | not_started              | —                                          |
| S147 | RCLD-08  | S146       | not_started              | —                                          |
| S148 | RCLD-08  | S147       | not_started              | —                                          |
| S149 | RCLD-09  | S148       | not_started              | —                                          |
| S150 | RCLD-09  | S149       | not_started              | —                                          |
| S151 | RCLD-09  | S150       | not_started              | —                                          |
| S152 | RCLD-09  | S151       | not_started              | —                                          |
| S153 | RCLD-09  | S152       | not_started              | —                                          |
| S154 | RCLD-09  | S153       | not_started              | —                                          |
| S155 | RCLD-09  | S154       | not_started              | —                                          |
| S156 | RCLD-09  | S155       | not_started              | —                                          |
| S157 | RCLD-09  | S156       | not_started              | —                                          |
| S158 | RCLD-09  | S157       | not_started              | —                                          |
| S159 | RCLD-09  | S158       | not_started              | —                                          |
| S160 | RCLD-09  | S159       | not_started              | —                                          |
| S161 | RCLD-09  | S160       | not_started              | —                                          |
| S162 | RCLD-09  | S161       | not_started              | —                                          |
| S163 | RCLD-09  | S162       | not_started              | —                                          |
| S164 | RCLD-09  | S163       | not_started              | —                                          |
| S165 | RCLD-09  | S164       | not_started              | —                                          |
| S166 | RCLD-09  | S165       | not_started              | —                                          |
| S167 | RCLD-09  | S166       | not_started              | —                                          |
| S168 | RCLD-09  | S167       | not_started              | —                                          |
| S169 | RCLD-09  | S168       | not_started              | —                                          |
| S170 | RCLD-09  | S169       | not_started              | —                                          |
| S171 | RCLD-09  | S170       | not_started              | —                                          |
| S172 | RCLD-09  | S171       | not_started              | —                                          |
| S173 | RCLD-09  | S172       | not_started              | —                                          |
| S174 | RCLD-09  | S173       | not_started              | —                                          |
| S175 | RCLD-09  | S174       | not_started              | —                                          |
| S176 | RCLD-09  | S175       | not_started              | —                                          |
| S177 | RCLD-09  | S176       | not_started              | —                                          |
| S178 | RCLD-09  | S177       | not_started              | —                                          |
| S179 | RCLD-09  | S178       | not_started              | —                                          |
| S180 | RCLD-09  | S179       | not_started              | —                                          |
| S181 | RCLD-09  | S180       | not_started              | —                                          |
| S182 | RCLD-10  | S181       | not_started              | —                                          |
| S183 | RCLD-10  | S182       | not_started              | —                                          |
| S184 | RCLD-10  | S183       | not_started              | —                                          |
| S185 | RCLD-10  | S184       | not_started              | —                                          |
| S186 | RCLD-10  | S185       | not_started              | —                                          |
| S187 | RCLD-10  | S186       | not_started              | —                                          |
| S188 | RCLD-10  | S187       | not_started              | —                                          |
| S189 | RCLD-10  | S188       | not_started              | —                                          |
| S190 | RCLD-10  | S189       | not_started              | —                                          |
| S191 | RCLD-10  | S190       | not_started              | —                                          |
| S192 | RCLD-10  | S191       | not_started              | —                                          |
| S193 | RCLD-10  | S192       | not_started              | —                                          |
| S194 | RCLD-11  | S193       | not_started              | —                                          |
| S195 | RCLD-11  | S194       | not_started              | —                                          |
| S196 | RCLD-11  | S195       | not_started              | —                                          |
| S197 | RCLD-11  | S196       | not_started              | —                                          |
| S198 | RCLD-11  | S197       | not_started              | —                                          |
| S199 | RCLD-11  | S198       | not_started              | —                                          |
| S200 | RCLD-11  | S199       | not_started              | —                                          |
| S201 | RCLD-11  | S200       | not_started              | —                                          |
| S202 | RCLD-11  | S201       | not_started              | —                                          |
| S203 | RCLD-11  | S202       | not_started              | —                                          |

## Complete checkpoint definitions

The source execution definitions follow, with pnpm command mapping, in-document contract links and the S002 target-validation adaptation stated above. References to scheduled file paths describe future deliverables unless they already exist. The per-checkpoint Rust guard is conditional, not a request to introduce Rust into this package.

### Checkpoint execution rules

Status: executable plan, **not implemented**. Every step is sequential and commit-sized. All listed code/test paths are proposed target paths or scoped likely modules; actual repository equivalents are resolved during discovery, not presumed to exist in this specification.

## Commit message convention — establish once

The reference repository at the reviewed baseline uses **`area: imperative summary`**, for example `switch: strengthen the unchecked track contrast` and `registry: complete desired item vocabulary`. Use lowercase area, colon/space, and a concise imperative summary; optionally explain behavior/tests in the body. It is not assumed to use `feat(scope):` Conventional Commits. Inspect the actual target repository during S001; its established consistent convention takes precedence. Record any message-format mapping once, then apply it consistently to the proposed messages below without changing scope.

## Non-negotiable execution rule

Read durable specs before coding. Complete, test, review and commit **one step at a time in this exact order**. Do not skip, merge, reorder or broaden steps unless repository evidence proves the step obsolete or unsafe. Record the deviation before acting, preserve its original ID, and use `DEVIATION_TEMPLATE.md`. Efficiency preferences and context limits do not qualify. A step may edit code and its directly related tests/contracts together; it must leave a known-good repository rather than commit red tests or advertise incomplete components.

Every step depends on the immediately preceding completed/committed step; the checkpoint ledger above makes this explicit. S002 will establish an aligned JSON companion with `dependsOn` fields. Milestone headings are navigation only, not permission to collapse steps into phases. Unregistered candidate component parts may compile in candidate fixtures without appearing in the public registry; register the complete item only at its dedicated step. Final qualification always uses installed generated files, not just candidates.

## Verification rule

`VERIFICATION.md` defines actual-command discovery and Cargo applicability. The npm script names below are the proposed command contract for a new target. Establish them at the indicated bootstrap steps or map existing real equivalents; resolve runner argument syntax before implementing each step. Unavailable tooling is unverified, not passed. From S006 onward, add the established nonmutating format/lint/typecheck checks to each step. Always run `git diff --check`, self-review the staged diff, and use the applicable repository baseline.

Every step explicitly repeats the Cargo guard to honor the specification request: run at the actual applicable Rust workspace root, never at an unrelated TS directory. Where no Rust workspace applies, record N/A with discovery evidence. If Rust changes, add scoped crate tests and valid feature/target/platform/package checks from repository instructions. Do not create Rust code, blindly enable all features, or claim that npm verifies Rust. A new relevant failure blocks moving to the next step. Evidence-backed pre-existing/out-of-scope exceptions must remain visible and do not waive final acceptance.

After every commit use `STEP_REPORT_TEMPLATE.md`: step/contract IDs, files changed, exact commands and results, commit hash/message, unverified issues, deviations, and next-step safety. Do not publish or push without separate authorization.

## Scope boundary

The plan covers the complete specified generator, original catalog adaptation, distinct Alert Dialog, safety, tests and distribution. The approved broader extension direction has a final explicit specification gate. No fabricated select/combobox/date APIs or unapproved extra registry items are included. An expanded release claiming those components remains blocked until their contracts and its next sequence are specified.

## Milestones

- **M01 — Authorized baseline and working verification harness:** S001–S012 (12 steps).
- **M02 — Versioned models, strict schemas, and registry resolution:** S013–S032 (20 steps).
- **M03 — Project detection, integration boundaries, and ownership planning:** S033–S063 (31 steps).
- **M04 — Guarded transactions and recovery:** S064–S077 (14 steps).
- **M05 — Complete CLI workflows and generator acceptance:** S078–S091 (14 steps).
- **M06 — Tokens, spinner, button, switch, and dialog vertical slice:** S092–S115 (24 steps).
- **M07 — Distinct alert-dialog and early floating-menu qualification:** S116–S128 (13 steps).
- **M08 — Remaining forms and disclosure components:** S129–S148 (20 steps).
- **M09 — Native navigation, surfaces, feedback, and identity parity:** S149–S181 (33 steps).
- **M10 — Cross-component regression and supported-environment qualification:** S182–S193 (12 steps).
- **M11 — Packed acceptance, operating documentation, and final specification:** S194–S203 (10 steps).

Total: **203 independently reviewed commit-sized steps**. All begin in `not_started` status.

## M01 — Authorized baseline and working verification harness

### S001 — Establish the authorized target and baseline

**Contract anchors:** R32, R33, R34. [PRODUCT_SPEC.md](../specs/PRODUCT_SPEC.md).

**1. Step title:** Establish the authorized target and baseline.

**2. Purpose:** Protect the reference Rust repository and identify the real implementation worktree before any product changes.

**3. Exact scope of code changes:**

- Inspect instructions, Git state, manifests, CI and recent commit subjects
- Record target/reference roots, existing user changes, applicable Cargo workspaces and baseline results
- Do not initialize or replace a repository outside the authorized location

**4. Files/modules likely involved:**

- `implementation evidence/BASELINE.md`
- `existing AGENTS.md`
- `package.json and lockfiles`
- `Cargo.toml and rust-toolchain.toml when present`

**5. Required unit/integration tests:**

- No product tests yet; inventory existing suites and execute their safe baseline
- Record missing tooling and pre-existing failures separately

**6. Verification commands:**

```sh
git status --short
git log -12 --pretty=%s
# DISCOVER/VERIFY: Discover and execute existing type/test/build commands; record literal commands before the next step
git diff --check
```

Run the available repository baseline and record any not-yet-established lanes explicitly. Never install placeholder-green checks. Review the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** An authorized, evidenced target and known baseline exist; an unresolved location blocks further writes.

**8. Commit message:** `repo: record the authorized target and verification baseline`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S002, not an unscheduled expansion.

### S002 — Anchor approved contracts and repository instructions

**Contract anchors:** R01, R31, R32, R33, R34. [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [PRODUCT_SPEC.md](../specs/PRODUCT_SPEC.md), [SCOPE_AND_ASSUMPTIONS.md](../specs/SCOPE_AND_ASSUMPTIONS.md).

**1. Step title:** Anchor approved contracts and repository instructions.

**2. Purpose:** Make durable intent available next to implementation rather than relying on the approved review.

**3. Exact scope of code changes:**

- Adopt this specification contract stack in the target-approved location
- Merge repo/AGENTS.md guidance without replacing stronger instructions
- Record requirement IDs and assumption/open-question ownership

**4. Files/modules likely involved:**

- `specs/`
- `decisions/`
- `implementation/`
- `AGENTS.md`

**5. Required unit/integration tests:**

- Validate required files, local references and requirement IDs
- Review that product/package identity and Rust-guard interpretation remain unchanged

**6. Verification commands:**

```sh
node tools/check-contracts.mjs # establish this repository contract validator in S002
# DISCOVER/VERIFY: Add target document/reference validation for the adopted contracts; preserve checkpoint IDs and coverage while allowing status updates
git diff --check
```

Run the available repository baseline and record any not-yet-established lanes explicitly. Never install placeholder-green checks. Review the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The target has a clear source of intent and no product code or policy change.

**8. Commit message:** `spec: anchor the approved svelte ui kit contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S003, not an unscheduled expansion.

### S003 — Select a reproducible Node and dependency baseline

**Contract anchors:** R01, R10, R12, R20, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [PRODUCT_SPEC.md](../specs/PRODUCT_SPEC.md).

**1. Step title:** Select a reproducible Node and dependency baseline.

**2. Purpose:** Resolve versions and package-manager details before authoring wrapper APIs.

**3. Exact scope of code changes:**

- Inspect actual selected package metadata/peers and existing lockfile conventions
- Create or minimally update target package metadata for svelte-ui-kit with no publication
- Record exact Node, Svelte, Kit, Bits and TypeScript selections and why they satisfy compatibility

**4. Files/modules likely involved:**

- `package.json`
- `detected package-manager lockfile`
- `implementation evidence/COMPATIBILITY.md`

**5. Required unit/integration tests:**

- Validate package metadata and full peer constraints
- Verify historical Bits source observations are not treated as a latest-release guarantee

**6. Verification commands:**

```sh
node --version
# DISCOVER/VERIFY: Execute the detected package manager strict/frozen install command after recording it; never substitute a second lockfile
# DISCOVER/VERIFY: Validate selected peer dependency metadata with the actual package manager
git diff --check
```

Run the available repository baseline and record any not-yet-established lanes explicitly. Never install placeholder-green checks. Review the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Dependency/tool versions are locked and reproducible; consumer auto-install is not introduced.

**8. Commit message:** `build: pin the initial tooling and primitive baseline`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S004, not an unscheduled expansion.

### S004 — Create a minimal typed CLI build boundary

**Contract anchors:** R01, R02, R30, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [PRODUCT_SPEC.md](../specs/PRODUCT_SPEC.md).

**1. Step title:** Create a minimal typed CLI build boundary.

**2. Purpose:** Establish an executable TypeScript target that builds before adding behavior.

**3. Exact scope of code changes:**

- Add minimal CLI entrypoint and TypeScript module/build configuration
- Establish real build and typecheck scripts
- Limit initial command behavior to honest help/version scaffolding; no pretend install success

**4. Files/modules likely involved:**

- `src/cli/main.ts`
- `tsconfig.json`
- `package.json`
- `build configuration`

**5. Required unit/integration tests:**

- Compile entrypoint and invoke built help/version smoke
- Ensure Node-only entrypoint has no consumer Svelte runtime export

**6. Verification commands:**

```sh
pnpm run typecheck
pnpm run build
# DISCOVER/VERIFY: node <discovered-built-entrypoint> --help; resolve the actual path from package.json bin first
git diff --check
```

Run the available repository baseline and record any not-yet-established lanes explicitly. Never install placeholder-green checks. Review the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The target builds and exposes only implemented behavior.

**8. Commit message:** `cli: establish the typed executable boundary`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S005, not an unscheduled expansion.

### S005 — Add a real unit-test harness

**Contract anchors:** R29, R30, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md).

**1. Step title:** Add a real unit-test harness.

**2. Purpose:** Enable independently verified implementation commits from the start.

**3. Exact scope of code changes:**

- Configure the chosen test runner and test:unit script
- Add a passing CLI metadata/entrypoint smoke test
- Establish test discovery that fails on broken assertions and does not silently pass empty suites

**4. Files/modules likely involved:**

- `package.json`
- `unit-test runner configuration`
- `tests/unit/cli-bootstrap.test.ts`

**5. Required unit/integration tests:**

- CLI bootstrap test passes
- A temporary local negative assertion proves runner failure and is reverted before commit

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/cli-bootstrap.test.ts
pnpm run typecheck
git diff --check
```

Run the available repository baseline and record any not-yet-established lanes explicitly. Never install placeholder-green checks. Review the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Unit checks are meaningful and available for subsequent steps.

**8. Commit message:** `test: establish the unit verification harness`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S006, not an unscheduled expansion.

### S006 — Add nonmutating formatting and lint gates

**Contract anchors:** R17, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Add nonmutating formatting and lint gates.

**2. Purpose:** Keep incremental changes readable without reformatting user-owned output implicitly.

**3. Exact scope of code changes:**

- Configure TypeScript/Svelte-aware lint and nonmutating format:check scripts
- Scope authoring checks separately from generated user files
- Preserve existing repo conventions where present

**4. Files/modules likely involved:**

- `package.json`
- `formatter configuration`
- `linter configuration`
- `tests/unit/tooling.test.ts`

**5. Required unit/integration tests:**

- Lint/typecheck current source
- Verify format check exits nonzero on an intentionally malformed temp fixture without rewriting it

**6. Verification commands:**

```sh
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run test:unit -- tests/unit/tooling.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Formatting and lint gates work without modifying application files.

**8. Commit message:** `build: add formatting and lint verification gates`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S007, not an unscheduled expansion.

### S007 — Add an SSR-enabled SvelteKit consumer fixture

**Contract anchors:** R20, R21, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Add an SSR-enabled SvelteKit consumer fixture.

**2. Purpose:** Make generated-code qualification use a real application rather than isolated snippets.

**3. Exact scope of code changes:**

- Create the minimal consumer fixture using selected versions
- Add fixture:check and fixture:build scripts
- Keep SSR enabled and separate fixture dependencies from CLI runtime dependencies

**4. Files/modules likely involved:**

- `tests/fixtures/consumer/`
- `package.json`
- `fixture package manifest and config`

**5. Required unit/integration tests:**

- Fixture Svelte check and production build pass
- A minimal server-rendered route is present without disabling SSR

**6. Verification commands:**

```sh
pnpm run fixture:check
pnpm run fixture:build
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** A reproducible real-app compile/build baseline is available.

**8. Commit message:** `test: add the ssr consumer qualification fixture`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S008, not an unscheduled expansion.

### S008 — Add the generated-app browser harness

**Contract anchors:** R21, R22, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Add the generated-app browser harness.

**2. Purpose:** Establish actual interaction assertions before implementing controls.

**3. Exact scope of code changes:**

- Configure browser tests and deterministic fixture startup/teardown
- Add focus/navigation and console-error smoke assertions
- Document local browser setup and supported initial lane

**4. Files/modules likely involved:**

- `browser-test configuration`
- `tests/browser/harness.spec.ts`
- `package.json`

**5. Required unit/integration tests:**

- Browser visits the real fixture and exercises keyboard focus
- Unexpected server/browser errors fail the test

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/harness.spec.ts
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The application can be tested in a browser with real assertions.

**8. Commit message:** `test: establish the consumer browser harness`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S009, not an unscheduled expansion.

### S009 — Add isolated filesystem and CLI integration helpers

**Contract anchors:** R15, R16, R29, R30, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Add isolated filesystem and CLI integration helpers.

**2. Purpose:** Support safe generation tests without using a developer project as the test target.

**3. Exact scope of code changes:**

- Add temp-root lifecycle, complete-tree snapshot and executable invocation helpers
- Add injectable asset/filesystem interfaces only as needed for tests
- Establish the integration test script

**4. Files/modules likely involved:**

- `tests/helpers/project.ts`
- `tests/helpers/tree-snapshot.ts`
- `tests/helpers/cli.ts`
- `tests/integration/harness.test.ts`
- `package.json`

**5. Required unit/integration tests:**

- Helpers preserve modes/text and clean only their owned temp directories
- Integration harness captures exit/stdout/stderr deterministically

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/harness.test.ts
pnpm run test:unit -- tests/unit/cli-bootstrap.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Later dry-run and transaction tests can observe all filesystem effects.

**8. Commit message:** `test: isolate cli and filesystem integration fixtures`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S010, not an unscheduled expansion.

### S010 — Document commands and add baseline CI

**Contract anchors:** R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md).

**1. Step title:** Document commands and add baseline CI.

**2. Purpose:** Prevent command-name guesses and keep every commit verifiable.

**3. Exact scope of code changes:**

- Record actual commands and valid feature/OS lanes in a target command map
- Add baseline CI for available format/lint/type/unit/fixture lanes
- Preserve conditional Cargo jobs where a Rust workspace applies

**4. Files/modules likely involved:**

- `implementation evidence/COMMANDS.md`
- `CI workflow configuration`
- `CONTRIBUTING.md`

**5. Required unit/integration tests:**

- Run the same baseline commands locally where available
- Validate workflow syntax and document remote-only lanes without claiming execution

**6. Verification commands:**

```sh
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run test:unit
pnpm run fixture:check
pnpm run fixture:build
# DISCOVER/VERIFY: Discover and run repository workflow validation
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Actual scripts and CI baseline are recorded; unrun remote checks stay explicit.

**8. Commit message:** `ci: qualify the initial verification lanes`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S011, not an unscheduled expansion.

### S011 — Qualify the pinned primitive integration boundary

**Contract anchors:** R03, R12, R20, R21, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md).

**1. Step title:** Qualify the pinned primitive integration boundary.

**2. Purpose:** Verify that selected upstream types support the promised Svelte wrapper model.

**3. Exact scope of code changes:**

- Add a compatibility fixture using Bits state/ref binding and delegated child structure
- Test selected versions without introducing public kit wrappers
- Record actual peer/type limitations and API source evidence

**4. Files/modules likely involved:**

- `tests/fixtures/consumer/src/lib/compatibility/`
- `tests/components/compatibility.test.ts`
- `implementation evidence/COMPATIBILITY.md`

**5. Required unit/integration tests:**

- Positive typed binding/ref/delegation cases compile
- Negative incompatible props fail type fixtures
- SSR/hydration smoke remains enabled

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/compatibility.test.ts # establish this real lane in this step
pnpm run fixture:check
pnpm run fixture:build
pnpm run test:browser -- tests/browser/harness.spec.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The pinned upstream boundary is proven before generator templates depend on it.

**8. Commit message:** `test: qualify the pinned svelte and bits boundary`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S012, not an unscheduled expansion.

### S012 — Separate orchestration and pure module interfaces

**Contract anchors:** R01, R02, R03, R15, R32, R33, R34. [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [PRODUCT_SPEC.md](../specs/PRODUCT_SPEC.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Separate orchestration and pure module interfaces.

**2. Purpose:** Keep command presentation, registry reading, planning and filesystem application distinct.

**3. Exact scope of code changes:**

- Introduce minimal typed boundary interfaces for project input, registry snapshot and planning outcome
- Extract bootstrap behavior behind CLI adapters
- Avoid speculative services or multiple npm packages

**4. Files/modules likely involved:**

- `src/cli/`
- `src/project/`
- `src/registry/`
- `src/codegen/`
- `tests/unit/boundaries.test.ts`

**5. Required unit/integration tests:**

- Pure interfaces are usable without filesystem writes
- Consumer fixture does not import CLI modules
- Typecheck detects boundary mistakes

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/boundaries.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Subsequent model work has small, enforceable module boundaries.

**8. Commit message:** `core: separate cli registry and codegen boundaries`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S013, not an unscheduled expansion.

## M02 — Versioned models, strict schemas, and registry resolution

### S013 — Model independent version identities

**Contract anchors:** R12, R32, R33, R34. [DATA_MODEL.md](../specs/DATA_MODEL.md).

**1. Step title:** Model independent version identities.

**2. Purpose:** Avoid copying the source framework/schema version coupling.

**3. Exact scope of code changes:**

- Define distinct schema/tool/registry/item/compatibility/CSS contract identities
- Add comparison/validation only for actual uses
- Record initial values as technical choices, not user-provided constants

**4. Files/modules likely involved:**

- `src/registry/versions.ts`
- `tests/unit/versions.test.ts`
- `specs/DATA_MODEL.md`

**5. Required unit/integration tests:**

- Changing a framework compatibility value does not imply schema migration
- Invalid independent identities receive typed errors

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/versions.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Version axes are represented independently throughout new types.

**8. Commit message:** `registry: separate schema package and compatibility versions`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S014, not an unscheduled expansion.

### S014 — Freeze and validate strict kit configuration

**Contract anchors:** R05, R09, R11, R12, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Freeze and validate strict kit configuration.

**2. Purpose:** Turn semantic configuration requirements into an explicit tested target schema.

**3. Exact scope of code changes:**

- Define exact supported config fields/default roots and schema identity without invented hosted URLs
- Add strict parsing and unknown-field diagnostics
- Keep source Leptos config incompatible by design

**4. Files/modules likely involved:**

- `schema/v1/kit.schema.json`
- `src/project/config.ts`
- `tests/unit/config.test.ts`
- `specs/DATA_MODEL.md`

**5. Required unit/integration tests:**

- Canonical/default config validates
- Unknown/legacy fields, bad types and unsupported schema versions fail
- No source framework version is reused as schema version

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/config.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** A frozen strict configuration schema exists for subsequent planners.

**8. Commit message:** `config: define the independent kit configuration schema`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S015, not an unscheduled expansion.

### S015 — Model explicit requested item sets

**Contract anchors:** R11, R26, R32, R33, R34. [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Model explicit requested item sets.

**2. Purpose:** Preserve user intent separately from dependency resolution.

**3. Exact scope of code changes:**

- Validate and normalize explicit request IDs deterministically
- Reject duplicates or normalize according to a documented exact rule
- Do not add transitive items to requested config

**4. Files/modules likely involved:**

- `src/project/requests.ts`
- `tests/unit/requests.test.ts`
- `schema/v1/kit.schema.json`

**5. Required unit/integration tests:**

- button alone remains the only explicit request after normalization
- Explicit spinner plus button is distinguishable from transitive spinner
- Invalid names are rejected

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/requests.test.ts
pnpm run test:unit -- tests/unit/config.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Requested roots have a standalone validated model.

**8. Commit message:** `config: preserve explicit component requests`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S016, not an unscheduled expansion.

### S016 — Define the registry-root schema

**Contract anchors:** R08, R12, R32, R33, R34. [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [DATA_MODEL.md](../specs/DATA_MODEL.md).

**1. Step title:** Define the registry-root schema.

**2. Purpose:** Give packaged inventory and compatibility a stable explicit contract.

**3. Exact scope of code changes:**

- Define root identity/version/digest and item-to-manifest mapping
- Validate unique item IDs and explicit manifest paths
- Add an empty but valid development registry without advertising missing components

**4. Files/modules likely involved:**

- `schema/v1/registry.schema.json`
- `src/registry/model.ts`
- `registry/registry.json`
- `tests/unit/registry-root.test.ts`

**5. Required unit/integration tests:**

- Empty/development and sample root fixtures validate
- Duplicate IDs, identity mismatch and malformed compatibility fail

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/registry-root.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Registry inventory is explicit and schema-validated.

**8. Commit message:** `registry: define the bundled inventory contract`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S017, not an unscheduled expansion.

### S017 — Define typed item targets and public exports

**Contract anchors:** R06, R07, R08, R32, R33, R34. [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Define typed item targets and public exports.

**2. Purpose:** Avoid inferred filenames and symbol generation.

**3. Exact scope of code changes:**

- Define item identity/kind/version/source targets for Svelte and TypeScript
- Define explicit file-level exports and managed CSS block IDs
- Validate CSS-only foundation shape

**4. Files/modules likely involved:**

- `schema/v1/registry-item.schema.json`
- `src/registry/item.ts`
- `tests/unit/item-targets.test.ts`

**5. Required unit/integration tests:**

- Simple, compound and CSS-only sample items validate
- Wrong file kinds, duplicate local exports and malformed targets fail

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/item-targets.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The manifest can describe the approved generated tree without guessing.

**8. Commit message:** `registry: define component targets and export metadata`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S018, not an unscheduled expansion.

### S018 — Add accessibility and dependency manifest metadata

**Contract anchors:** R03, R10, R22, R30, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Add accessibility and dependency manifest metadata.

**2. Purpose:** Keep behavior obligations and dependencies alongside source assets.

**3. Exact scope of code changes:**

- Extend item schema with accessibility requirements, registry dependencies and npm plan entries
- Distinguish runtime/tooling/peer roles using a minimal documented model
- Keep metadata descriptive rather than executing hooks

**4. Files/modules likely involved:**

- `src/registry/item.ts`
- `schema/v1/registry-item.schema.json`
- `tests/unit/item-metadata.test.ts`

**5. Required unit/integration tests:**

- Required accessibility entries and dependency references parse
- Unknown roles, malformed ranges and duplicate conflicting declarations fail

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/item-metadata.test.ts
pnpm run test:unit -- tests/unit/item-targets.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Items carry their verification and installation obligations explicitly.

**8. Commit message:** `registry: attach accessibility and dependency contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S019, not an unscheduled expansion.

### S019 — Define source-file ownership lock records

**Contract anchors:** R11, R12, R13, R32, R33, R34. [DATA_MODEL.md](../specs/DATA_MODEL.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Define source-file ownership lock records.

**2. Purpose:** Persist truthful source lineage for customization-aware upgrades.

**3. Exact scope of code changes:**

- Define independent lock schema and per-file item owner/base digest records
- Represent requested/transitive origin and effective version provenance
- Validate owner uniqueness and any reverse indexes

**4. Files/modules likely involved:**

- `schema/v1/kit-lock.schema.json`
- `src/codegen/lock.ts`
- `tests/unit/lock-files.test.ts`

**5. Required unit/integration tests:**

- Valid source ownership round-trips
- Duplicate ownership, inconsistent indexes and malformed hashes fail
- Preserved base cannot silently become current local content

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/lock-files.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Source ownership can support the approved comparison model.

**8. Commit message:** `codegen: define source ownership and lineage records`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S020, not an unscheduled expansion.

### S020 — Add CSS-block and integration lock records

**Contract anchors:** R07, R13, R14, R17, R32, R33, R34. [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Add CSS-block and integration lock records.

**2. Purpose:** Track blocks independently from the aggregate stylesheet.

**3. Exact scope of code changes:**

- Add per-block ID/path/owner/base records
- Add stylesheet/export/integration provenance needed for safe planning
- Validate cross-item CSS ownership and reserved-state path overlap

**4. Files/modules likely involved:**

- `src/codegen/lock.ts`
- `schema/v1/kit-lock.schema.json`
- `tests/unit/lock-styles.test.ts`

**5. Required unit/integration tests:**

- Multiple owners in one CSS file remain distinguishable
- Duplicate block IDs and forged indexes fail
- Source and style version metadata cannot contradict their stored baselines

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/lock-styles.test.ts
pnpm run test:unit -- tests/unit/lock-files.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** An aggregate stylesheet no longer implies whole-file ownership.

**8. Commit message:** `codegen: track managed css blocks in install state`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S021, not an unscheduled expansion.

### S021 — Define portable theme and customization metadata schemas

**Contract anchors:** R07, R12, R23, R25, R32, R33, R34. [DATA_MODEL.md](../specs/DATA_MODEL.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Define portable theme and customization metadata schemas.

**2. Purpose:** Retain CSS contracts without copying Rust ABI constants.

**3. Exact scope of code changes:**

- Define semantic token, component customization and theme-integration records
- Separate their independent versions and actual layer/portal capabilities
- Reject Rust package/type identifiers in generated Svelte capability fixtures

**4. Files/modules likely involved:**

- `schema/v1/token-contract.schema.json`
- `schema/v1/component-customization.schema.json`
- `schema/v1/theme-integration.schema.json`
- `tests/unit/theme-metadata.test.ts`

**5. Required unit/integration tests:**

- Token/property roles and complete radius grammar metadata validate
- Inconsistent contract IDs/layers or source-only Rust ABI claims fail

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/theme-metadata.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Portable CSS metadata has explicit target schemas.

**8. Commit message:** `registry: define portable css contract metadata`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S022, not an unscheduled expansion.

### S022 — Freeze CLI envelopes and exit outcomes

**Contract anchors:** R09, R15, R30, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Freeze CLI envelopes and exit outcomes.

**2. Purpose:** Make automation behavior testable before command handlers grow.

**3. Exact scope of code changes:**

- Freeze result/diagnostic/change fields, status strings and numerical exit map with evidence
- Add safe logical locator and JSON serialization rules
- Keep protocol version separate from package/framework versions

**4. Files/modules likely involved:**

- `src/cli/protocol.ts`
- `schema/v1/command-envelope.schema.json`
- `tests/unit/protocol.test.ts`
- `specs/API_CONTRACTS.md`

**5. Required unit/integration tests:**

- Every status has a stable exit outcome
- Golden envelope fixtures contain one result and deterministic diagnostics
- Unsafe physical input is not exposed as a locator

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/protocol.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Command result semantics are frozen and fixture-tested.

**8. Commit message:** `cli: freeze structured outcomes and exit codes`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S023, not an unscheduled expansion.

### S023 — Parse only the approved CLI arguments

**Contract anchors:** R09, R15, R18, R30, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Parse only the approved CLI arguments.

**2. Purpose:** Reject unsupported commands and options before side effects.

**3. Exact scope of code changes:**

- Add typed argument parsing for approved commands/options
- Preserve one-item add/view shape and help/version
- Reject force/remove/auto-install/remote-registry options rather than quietly accepting them

**4. Files/modules likely involved:**

- `src/cli/args.ts`
- `tests/unit/args.test.ts`
- `src/cli/main.ts`

**5. Required unit/integration tests:**

- Missing values/unknown flags/invalid command combinations return protocol errors
- JSON option placement is handled consistently
- Parsing performs no project writes

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/args.test.ts
pnpm run test:unit -- tests/unit/protocol.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The executable has a constrained, testable command grammar.

**8. Commit message:** `cli: parse the approved command surface`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S024, not an unscheduled expansion.

### S024 — Implement exact-byte hashing and deterministic serialization

**Contract anchors:** R12, R13, R15, R32, R33, R34. [DATA_MODEL.md](../specs/DATA_MODEL.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Implement exact-byte hashing and deterministic serialization.

**2. Purpose:** Make ownership comparisons reproducible without rewriting user text.

**3. Exact scope of code changes:**

- Freeze hash algorithm and distinguish exact bytes from canonical semantic JSON
- Add deterministic ordering/serialization for generated metadata
- Preserve local line endings for preimages

**4. Files/modules likely involved:**

- `src/codegen/digest.ts`
- `src/codegen/serialize.ts`
- `tests/unit/digest.test.ts`
- `tests/unit/serialize.test.ts`

**5. Required unit/integration tests:**

- Known UTF-8 vectors and CRLF/LF distinction pass
- Equivalent unordered logical maps serialize identically
- No timestamps/random IDs enter semantic output

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/digest.test.ts
pnpm run test:unit -- tests/unit/serialize.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Hash meanings and canonical metadata bytes are unambiguous.

**8. Commit message:** `core: make digests and metadata output deterministic`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S025, not an unscheduled expansion.

### S025 — Load assets relative to the installed package

**Contract anchors:** R08, R16, R32, R33, R34. [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md).

**1. Step title:** Load assets relative to the installed package.

**2. Purpose:** Remove authoring-root and CWD dependencies from registry access.

**3. Exact scope of code changes:**

- Implement package-relative read-only asset provider
- Restrict it to validated logical registry/schema paths
- Make source-tree provider injectable only for tests/development, not a hidden runtime fallback

**4. Files/modules likely involved:**

- `src/registry/assets.ts`
- `tests/unit/assets.test.ts`
- `package build configuration`

**5. Required unit/integration tests:**

- Assets load from an isolated simulated installed package under a different CWD
- Traversal/missing/nontext asset errors are typed
- No fallback reads from the reference repo

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/assets.test.ts
pnpm run build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Registry access depends only on package assets.

**8. Commit message:** `registry: load assets from the installed package`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S026, not an unscheduled expansion.

### S026 — Build an immutable validated registry snapshot

**Contract anchors:** R08, R15, R32, R33, R34. [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Build an immutable validated registry snapshot.

**2. Purpose:** Prevent planning from observing changing authoring inputs.

**3. Exact scope of code changes:**

- Read and validate root/manifests/source bytes into one immutable operation snapshot
- Verify manifest identity and item paths
- Surface all required missing-asset errors before planning

**4. Files/modules likely involved:**

- `src/registry/load.ts`
- `tests/unit/registry-snapshot.test.ts`

**5. Required unit/integration tests:**

- Provider mutation after snapshot creation does not change resolved bytes
- Wrong item identity/missing schema/invalid manifest fails deterministically

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/registry-snapshot.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Each operation sees a consistent packaged registry.

**8. Commit message:** `registry: validate immutable asset snapshots`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S027, not an unscheduled expansion.

### S027 — Add full registry asset health validation

**Contract anchors:** R08, R26, R30, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md).

**1. Step title:** Add full registry asset health validation.

**2. Purpose:** Catch broken manifests and unreachable required assets during development and packing.

**3. Exact scope of code changes:**

- Validate schema/manifest/source/style relationships and qualified root inventory
- Distinguish unregistered candidate authoring assets from advertised complete items
- Establish test:registry script and explicit qualification inventory

**4. Files/modules likely involved:**

- `src/registry/validate.ts`
- `tests/registry/health.test.ts`
- `package.json`
- `registry/registry.json`

**5. Required unit/integration tests:**

- Advertised items cannot reference missing files or invalid blocks
- Candidate parts are not installable before root registration
- Packaged schema identities match parser expectations

**6. Verification commands:**

```sh
pnpm run test:registry -- tests/registry/health.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Registry health rejects incomplete published items without forcing monolithic authoring commits.

**8. Commit message:** `registry: validate qualified asset inventory health`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S028, not an unscheduled expansion.

### S028 — Resolve dependencies with cycle and missing-item diagnostics

**Contract anchors:** R08, R11, R15, R32, R33, R34. [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Resolve dependencies with cycle and missing-item diagnostics.

**2. Purpose:** Install the actual closure without recursive surprises.

**3. Exact scope of code changes:**

- Implement graph traversal with explicit cycle paths and unknown-item errors
- Do not perform writes while resolving
- Preserve registry identity in diagnostics

**4. Files/modules likely involved:**

- `src/registry/resolve.ts`
- `tests/unit/resolve-errors.test.ts`

**5. Required unit/integration tests:**

- Self-cycle/multinode cycle/missing dependency fail
- Diamond dependency resolves once
- Empty roots resolve safely

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/resolve-errors.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Dependency closure is validated before any project planning.

**8. Commit message:** `registry: resolve item graphs and reject cycles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S029, not an unscheduled expansion.

### S029 — Make closure and export order deterministic

**Contract anchors:** R06, R07, R11, R15, R32, R33, R34. [DATA_MODEL.md](../specs/DATA_MODEL.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [STYLING.md](../specs/STYLING.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Make closure and export order deterministic.

**2. Purpose:** Eliminate filesystem or insertion-order churn from generated output.

**3. Exact scope of code changes:**

- Add stable dependency-before-dependent order with documented tie-breaking
- Normalize export and block order from explicit metadata
- Avoid reordering application-owned text

**4. Files/modules likely involved:**

- `src/registry/resolve.ts`
- `src/registry/order.ts`
- `tests/unit/resolve-order.test.ts`

**5. Required unit/integration tests:**

- Permuted root/manifests yield equivalent closure order
- Tokens precede dependent styles
- Repeated traversal yields byte-stable projections

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/resolve-order.test.ts
pnpm run test:registry -- tests/registry/health.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Equivalent inputs yield stable install order.

**8. Commit message:** `registry: stabilize dependency and export ordering`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S030, not an unscheduled expansion.

### S030 — Project requested versus transitive provenance

**Contract anchors:** R11, R18, R32, R33, R34. [DATA_MODEL.md](../specs/DATA_MODEL.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Project requested versus transitive provenance.

**2. Purpose:** Avoid the reference behavior of writing dependency closure into user config.

**3. Exact scope of code changes:**

- Attach root/transitive origin to resolved items
- Preserve explicit dependency requests separately
- Define retained/retired closure sets for later synchronization

**4. Files/modules likely involved:**

- `src/registry/projection.ts`
- `tests/unit/request-projection.test.ts`

**5. Required unit/integration tests:**

- button closure includes spinner/tokens but config roots stay button
- Removing button preserves explicitly requested spinner
- Shared dependencies remain while any root needs them

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/request-projection.test.ts
pnpm run test:unit -- tests/unit/resolve-order.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Desired intent and effective installed closure are distinct.

**8. Commit message:** `registry: retain requested and transitive provenance`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S031, not an unscheduled expansion.

### S031 — Merge compatible dependency requirements

**Contract anchors:** R10, R12, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [DATA_MODEL.md](../specs/DATA_MODEL.md).

**1. Step title:** Merge compatible dependency requirements.

**2. Purpose:** Produce one truthful npm plan from the selected closure.

**3. Exact scope of code changes:**

- Intersect requirements across items and preserve runtime/peer roles
- Reject incompatible ranges and source-kind conflicts
- Keep exact installed-resolution discovery separate

**4. Files/modules likely involved:**

- `src/registry/dependency-plan.ts`
- `tests/unit/dependency-plan.test.ts`

**5. Required unit/integration tests:**

- Compatible duplicate requirements coalesce
- Disjoint ranges fail with involved item IDs
- Peer requirements are not dropped when a module is not directly imported

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/dependency-plan.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Registry resolution can emit a consistent dependency plan.

**8. Commit message:** `registry: reconcile package and peer requirements`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S032, not an unscheduled expansion.

### S032 — Validate cross-item target and public symbol uniqueness

**Contract anchors:** R06, R08, R16, R32, R33, R34. [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md).

**1. Step title:** Validate cross-item target and public symbol uniqueness.

**2. Purpose:** Stop registry collisions before touching a consumer.

**3. Exact scope of code changes:**

- Validate resolved target ownership, CSS IDs and public exports across the graph
- Detect case-colliding paths even on case-sensitive development systems
- Keep qualified candidate items outside public collision claims until registered

**4. Files/modules likely involved:**

- `src/registry/validate-targets.ts`
- `tests/registry/targets.test.ts`

**5. Required unit/integration tests:**

- Two owners of one path/block/export fail
- ASCII case-folded collision fixtures fail
- Valid compound exports resolve to explicit files

**6. Verification commands:**

```sh
pnpm run test:registry -- tests/registry/targets.test.ts
pnpm run test:registry -- tests/registry/health.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Every advertised output has unambiguous ownership.

**8. Commit message:** `registry: reject conflicting output ownership`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S033, not an unscheduled expansion.

## M03 — Project detection, integration boundaries, and ownership planning

### S033 — Validate lexical logical paths

**Contract anchors:** R05, R16, R30, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md).

**1. Step title:** Validate lexical logical paths.

**2. Purpose:** Reject obvious escape paths before filesystem resolution.

**3. Exact scope of code changes:**

- Implement segment-aware relative-path validation for source/CSS/state targets
- Reject traversal, absolute and unsupported drive/UNC forms
- Preserve safe logical diagnostics

**4. Files/modules likely involved:**

- `src/project/paths.ts`
- `tests/unit/logical-paths.test.ts`

**5. Required unit/integration tests:**

- Traversal, separator/prefix confusion and invalid segments fail
- Valid nested UI paths pass
- Unsafe input is not emitted as an unsanitized locator

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/logical-paths.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Logical output paths are validated independently from filesystem state.

**8. Commit message:** `project: validate logical output paths`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S034, not an unscheduled expansion.

### S034 — Reject overlapping and reserved output roots

**Contract anchors:** R05, R16, R32, R33, R34. [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md).

**1. Step title:** Reject overlapping and reserved output roots.

**2. Purpose:** Keep generated source, metadata and stylesheet targets distinct.

**3. Exact scope of code changes:**

- Validate UI/state/style/export mapping relationships
- Reject targets inside reserved coordination paths or conflicting file/directory roles
- Add deterministic case-collision checks

**4. Files/modules likely involved:**

- `src/project/paths.ts`
- `tests/unit/path-overlap.test.ts`
- `src/project/config.ts`

**5. Required unit/integration tests:**

- CSS/config/export overlap fails before planning
- Prefix siblings are not incorrectly rejected
- Reserved state collisions fail across casing variants

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/path-overlap.test.ts
pnpm run test:unit -- tests/unit/config.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Normalized project roots cannot overwrite each other.

**8. Commit message:** `project: reject overlapping output and state targets`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S035, not an unscheduled expansion.

### S035 — Detect default SvelteKit application packages

**Contract anchors:** R05, R09, R15, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Detect default SvelteKit application packages.

**2. Purpose:** Implement the approved target before expanding configuration detection.

**3. Exact scope of code changes:**

- Read package and supported configuration evidence without executing arbitrary config
- Identify default src/lib and routes/style integration
- Return unsupported/ambiguous diagnostics for non-target projects

**4. Files/modules likely involved:**

- `src/project/detect.ts`
- `tests/integration/detect-default.test.ts`

**5. Required unit/integration tests:**

- Default consumer fixture is detected correctly
- Missing manifest/non-SvelteKit project fails clearly
- Detection creates no files

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/detect-default.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Project information has a supported default interpretation.

**8. Commit message:** `project: detect default sveltekit consumers`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S036, not an unscheduled expansion.

### S036 — Resolve explicit working directories in workspaces

**Contract anchors:** R09, R16, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md).

**1. Step title:** Resolve explicit working directories in workspaces.

**2. Purpose:** Support one selected app package without bulk workspace mutation.

**3. Exact scope of code changes:**

- Apply --cwd to an explicitly selected package root
- Reject ambiguous multi-package roots when no target is proven
- Protect the external reference worktree and sibling packages

**4. Files/modules likely involved:**

- `src/project/root.ts`
- `tests/integration/project-root.test.ts`
- `src/cli/args.ts`

**5. Required unit/integration tests:**

- Nested --cwd selects only its app
- Ambiguous workspace selection is read-only failure
- Symlink/root policy remains explicit for later filesystem validation

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/project-root.test.ts
pnpm run test:unit -- tests/unit/args.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The CLI never chooses or mutates unrelated workspace members.

**8. Commit message:** `project: scope commands to an explicit app package`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S037, not an unscheduled expansion.

### S037 — Freeze supported custom path mappings

**Contract anchors:** R05, R16, R17, R32, R33, R34. [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Freeze supported custom path mappings.

**2. Purpose:** Resolve layout ambiguity conservatively rather than executing guessed config.

**3. Exact scope of code changes:**

- Define safe explicit custom UI/style/integration mappings supported by v1
- Resolve validated config paths relative to the selected package
- Document unsupported dynamic Svelte config and manual integration fallback

**4. Files/modules likely involved:**

- `src/project/config.ts`
- `src/project/detect.ts`
- `tests/integration/custom-paths.test.ts`
- `specs/GENERATED_LAYOUT.md`

**5. Required unit/integration tests:**

- Supported explicit path mappings work
- Dynamic/ambiguous mapping produces an actionable nonmutating diagnostic
- Existing config is not executed for discovery

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/custom-paths.test.ts
pnpm run test:unit -- tests/unit/path-overlap.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Supported customization is frozen and bounded.

**8. Commit message:** `project: bound explicit custom path support`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S038, not an unscheduled expansion.

### S038 — Inspect installed and declared dependency state

**Contract anchors:** R10, R12, R19, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [DATA_MODEL.md](../specs/DATA_MODEL.md).

**1. Step title:** Inspect installed and declared dependency state.

**2. Purpose:** Make info/doctor report actual compatibility rather than assumptions.

**3. Exact scope of code changes:**

- Read package declarations and selected package-manager metadata safely
- Distinguish declared, installed, missing and incompatible packages
- Avoid requiring hidden source checkout state

**4. Files/modules likely involved:**

- `src/project/dependencies.ts`
- `tests/integration/dependency-state.test.ts`

**5. Required unit/integration tests:**

- Missing install differs from missing declaration
- Installed incompatible version produces evidence-backed diagnostic
- Inspection does not mutate package/lock files

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/dependency-state.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Consumer dependency readiness is observable and typed.

**8. Commit message:** `project: inspect consumer dependency compatibility`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S039, not an unscheduled expansion.

### S039 — Validate peer dependencies in the consumer plan

**Contract anchors:** R10, R12, R20, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md).

**1. Step title:** Validate peer dependencies in the consumer plan.

**2. Purpose:** Prevent false readiness when Bits UI peers are absent or incompatible.

**3. Exact scope of code changes:**

- Combine resolved registry requirements with actual selected peer metadata
- Diagnose peer conflicts without silently adding dependencies
- Record exact compatibility evidence in fixture

**4. Files/modules likely involved:**

- `src/project/dependencies.ts`
- `tests/integration/peer-dependencies.test.ts`
- `implementation evidence/COMPATIBILITY.md`

**5. Required unit/integration tests:**

- Required date/Svelte peers are assessed according to actual metadata
- A peer unused by a particular wrapper is not automatically ignored
- Compatible installed peers pass

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/peer-dependencies.test.ts
pnpm run test:unit -- tests/unit/dependency-plan.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Dependency planning honors the full selected upstream contract.

**8. Commit message:** `project: validate primitive peer requirements`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S040, not an unscheduled expansion.

### S040 — Render dependency instructions without execution

**Contract anchors:** R09, R10, R15, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Render dependency instructions without execution.

**2. Purpose:** Keep package-manager changes explicit and outside the generator transaction.

**3. Exact scope of code changes:**

- Render an appropriate installation command for the detected manager
- Separate consumer runtime/peer from CLI tooling requirements
- Make no shell execution or package-manifest writes from reporting

**4. Files/modules likely involved:**

- `src/project/dependency-instructions.ts`
- `tests/integration/dependency-instructions.test.ts`

**5. Required unit/integration tests:**

- Instructions match fixture manager and requirements
- Commands are safely quoted/formatted
- Complete-tree snapshots prove no package/lock/node_modules changes

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/dependency-instructions.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Users receive actionable dependency plans without implicit installs.

**8. Commit message:** `project: report explicit dependency installation plans`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S041, not an unscheduled expansion.

### S041 — Capture read-only project snapshots

**Contract anchors:** R13, R15, R16, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Capture read-only project snapshots.

**2. Purpose:** Provide reliable preimages for planning and later revalidation.

**3. Exact scope of code changes:**

- Read exact source/CSS/config/lock/layout bytes and file kinds into observations
- Represent absence distinctly from empty content
- Keep snapshots and diagnostics free from writes

**4. Files/modules likely involved:**

- `src/codegen/snapshot.ts`
- `tests/integration/snapshot.test.ts`

**5. Required unit/integration tests:**

- Absent/empty/CRLF/nonregular observations remain distinct
- Concurrent later changes do not mutate an already captured snapshot
- Snapshotting leaves the tree unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/snapshot.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Planners can reason about a stable read-only preimage.

**8. Commit message:** `codegen: capture immutable project observations`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S042, not an unscheduled expansion.

### S042 — Validate filesystem ancestry and symlinks

**Contract anchors:** R16, R24, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Validate filesystem ancestry and symlinks.

**2. Purpose:** Extend lexical safety to actual filesystem targets.

**3. Exact scope of code changes:**

- Inspect target ancestry and reject unsupported symlinks/nonregular paths
- Freeze documented trusted-local race limits
- Preserve validated physical root identity for subsequent rechecks

**4. Files/modules likely involved:**

- `src/project/filesystem-paths.ts`
- `tests/integration/filesystem-paths.test.ts`
- `specs/SECURITY_AND_TRANSACTIONS.md`

**5. Required unit/integration tests:**

- Parent link outside root, broken link and directory-at-file-target fail
- Valid existing/new descendants pass
- Platform-specific cases are documented and run where supported

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/filesystem-paths.test.ts
pnpm run test:unit -- tests/unit/logical-paths.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Filesystem path safety has explicit tests and bounded claims.

**8. Commit message:** `codegen: guard target ancestry and symlink paths`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S043, not an unscheduled expansion.

### S043 — Freeze the complete ownership disposition matrix

**Contract anchors:** R13, R14, R18, R19, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Freeze the complete ownership disposition matrix.

**2. Purpose:** Resolve missing/adoption/cohort ambiguities before writing comparison code.

**3. Exact scope of code changes:**

- Record the B/L/I table including missing tracked targets and identical untracked files
- Freeze no-silent-adoption/deletion rights and truthful baseline rules
- Add data-driven policy fixtures reviewed against the spec

**4. Files/modules likely involved:**

- `specs/SYNCHRONIZATION.md`
- `tests/fixtures/ownership-cases.json`
- `tests/unit/ownership-policy.test.ts`

**5. Required unit/integration tests:**

- Every equality/absence/ownership case has exactly one expected disposition
- No case grants overwrite of custom content
- Fixtures explicitly cover local=incoming

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/ownership-policy.test.ts
pnpm run format:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Ownership behavior is explicit before implementation, with unresolved Q08 closed or blocking.

**8. Commit message:** `spec: freeze customization and missing-target dispositions`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S044, not an unscheduled expansion.

### S044 — Implement source base/local/incoming classification

**Contract anchors:** R13, R15, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Implement source base/local/incoming classification.

**2. Purpose:** Protect source edits while allowing safe upstream changes.

**3. Exact scope of code changes:**

- Implement pure per-source classification using frozen ownership cases
- Preserve exact-byte baseline semantics
- Return conflict/customized/satisfied/update dispositions without writes

**4. Files/modules likely involved:**

- `src/codegen/compare.ts`
- `tests/unit/source-compare.test.ts`

**5. Required unit/integration tests:**

- All policy fixtures pass including equality precedence
- Local-only edit preserves base
- Both-different case reports conflict with no plan mutation

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/source-compare.test.ts
pnpm run test:unit -- tests/unit/ownership-policy.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Source update decisions match the approved three-way policy.

**8. Commit message:** `codegen: classify source ownership with three-way comparison`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S045, not an unscheduled expansion.

### S045 — Plan missing and untracked source targets

**Contract anchors:** R13, R15, R18, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Plan missing and untracked source targets.

**2. Purpose:** Handle absence and collisions without confusing them with safe generated updates.

**3. Exact scope of code changes:**

- Apply the frozen missing-target policy with visible restore/conflict records
- Reject untracked conflicting files and enforce explicit adoption rule
- Preserve user deletion intent through clear diagnostics

**4. Files/modules likely involved:**

- `src/codegen/source-targets.ts`
- `tests/integration/source-targets.test.ts`

**5. Required unit/integration tests:**

- Missing tracked target is handled exactly as frozen
- Existing untracked equal/different sources retain documented rights
- No filesystem writes occur

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/source-targets.test.ts
pnpm run test:unit -- tests/unit/source-compare.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Every source target has an explicit, safe ownership disposition.

**8. Commit message:** `codegen: plan absent and application-owned source targets`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S046, not an unscheduled expansion.

### S046 — Plan source retirement with retained customization

**Contract anchors:** R11, R13, R18, R32, R33, R34. [DATA_MODEL.md](../specs/DATA_MODEL.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Plan source retirement with retained customization.

**2. Purpose:** Make removal safe without introducing an unapproved remove command.

**3. Exact scope of code changes:**

- Classify retired files from the recalculated request closure
- Delete only clean owned targets when policy permits
- Retain customized files with truthful detached ownership and diagnostics

**4. Files/modules likely involved:**

- `src/codegen/retire.ts`
- `tests/integration/source-retirement.test.ts`

**5. Required unit/integration tests:**

- Shared required dependency remains
- Clean retired file and customized retired file get different actions
- Re-adding a retained file does not silently reacquire deletion rights

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/source-retirement.test.ts
pnpm run test:unit -- tests/unit/request-projection.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Configuration-driven retirement preserves application work.

**8. Commit message:** `codegen: retain customized source during retirement`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S047, not an unscheduled expansion.

### S047 — Assemble source-file change plans

**Contract anchors:** R06, R13, R15, R32, R33, R34. [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Assemble source-file change plans.

**2. Purpose:** Aggregate source decisions without bypassing ownership guards.

**3. Exact scope of code changes:**

- Build deterministic source change records and produced bytes for resolved items
- Validate owners/paths and collect all conflicts before any apply
- Preserve candidate and installed lineage separately

**4. Files/modules likely involved:**

- `src/codegen/source-plan.ts`
- `tests/integration/source-plan.test.ts`

**5. Required unit/integration tests:**

- Safe multi-file item yields stable plan
- One conflicting file prevents an executable batch
- Multiple diagnostics retain deterministic order

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/source-plan.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Source planning is complete, pure and inspectable.

**8. Commit message:** `codegen: assemble deterministic source change plans`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S048, not an unscheduled expansion.

### S048 — Parse managed CSS markers without whole-file ownership

**Contract anchors:** R07, R13, R17, R32, R33, R34. [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Parse managed CSS markers without whole-file ownership.

**2. Purpose:** Find reliable block boundaries while preserving unrelated CSS.

**3. Exact scope of code changes:**

- Implement exact start/end grammar and scanner behavior for strings/comments
- Reject duplicate, unmatched and nested marker structures
- Retain precise spans and unmanaged byte regions

**4. Files/modules likely involved:**

- `src/codegen/css-parse.ts`
- `tests/unit/css-markers.test.ts`

**5. Required unit/integration tests:**

- Quoted marker-like text does not create a block
- Malformed/duplicate marker fixtures fail
- CRLF/comments/unmanaged bytes remain intact

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/css-markers.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Managed block boundaries are safe and explicit.

**8. Commit message:** `codegen: parse managed css block boundaries`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S049, not an unscheduled expansion.

### S049 — Apply three-way classification to CSS blocks

**Contract anchors:** R07, R13, R19, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [STYLING.md](../specs/STYLING.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Apply three-way classification to CSS blocks.

**2. Purpose:** Preserve local styling independently of other installed blocks.

**3. Exact scope of code changes:**

- Use block-level base/local/incoming comparison and owner records
- Report customized versus conflicted blocks distinctly
- Do not hash the whole stylesheet as one owned asset

**4. Files/modules likely involved:**

- `src/codegen/css-compare.ts`
- `tests/unit/css-compare.test.ts`

**5. Required unit/integration tests:**

- All B/L/I combinations match source policy
- Editing one block does not mark unrelated blocks modified
- Missing/untracked block cases follow frozen rules

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/css-compare.test.ts
pnpm run test:unit -- tests/unit/css-markers.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** CSS updates have the same customization guarantees as source.

**8. Commit message:** `codegen: compare css block lineage independently`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S050, not an unscheduled expansion.

### S050 — Compose stable stylesheet patches

**Contract anchors:** R07, R15, R17, R32, R33, R34. [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [STYLING.md](../specs/STYLING.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Compose stable stylesheet patches.

**2. Purpose:** Install ordered blocks without changing application CSS.

**3. Exact scope of code changes:**

- Insert/update managed spans from safe block decisions
- Put foundation layer declaration before dependent blocks
- Preserve unmanaged text exactly and avoid a formatter pass

**4. Files/modules likely involved:**

- `src/codegen/css.ts`
- `tests/integration/css-patch.test.ts`

**5. Required unit/integration tests:**

- Permuted item input yields stable managed output
- Repeated patch is byte-idempotent
- Leading/trailing/interleaved application CSS survives unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/css-patch.test.ts
pnpm run test:unit -- tests/unit/css-compare.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** One aggregate stylesheet can be safely reconciled.

**8. Commit message:** `codegen: preserve unmanaged css while ordering kit blocks`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S051, not an unscheduled expansion.

### S051 — Retire CSS blocks without deleting custom rules

**Contract anchors:** R13, R17, R18, R32, R33, R34. [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Retire CSS blocks without deleting custom rules.

**2. Purpose:** Keep stylesheet retirement consistent with source ownership.

**3. Exact scope of code changes:**

- Remove only clean obsolete owned blocks
- Preserve customized retired CSS as explicitly application-owned text
- Keep malformed/ambiguous retirement nonmutating

**4. Files/modules likely involved:**

- `src/codegen/css-retire.ts`
- `tests/integration/css-retirement.test.ts`

**5. Required unit/integration tests:**

- Clean/edited/shared-needed block retirement cases pass
- Retained custom CSS is not silently reowned on add
- Unmanaged neighbors remain byte-identical

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/css-retirement.test.ts
pnpm run test:integration -- tests/integration/source-retirement.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Retirement does not erase custom design work.

**8. Commit message:** `codegen: preserve customized css during retirement`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S052, not an unscheduled expansion.

### S052 — Freeze and parse managed TypeScript export regions

**Contract anchors:** R06, R16, R17, R32, R33, R34. [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Freeze and parse managed TypeScript export regions.

**2. Purpose:** Translate Rust module patching into a safe target-specific barrel policy.

**3. Exact scope of code changes:**

- Freeze exact TS marker syntax separately from CSS markers
- Parse/locate region and inspect application export declarations
- Reject duplicate/ambiguous regions and symbol collisions

**4. Files/modules likely involved:**

- `src/codegen/export-parse.ts`
- `specs/GENERATED_LAYOUT.md`
- `tests/unit/export-regions.test.ts`

**5. Required unit/integration tests:**

- Existing comments/imports/aliases remain identifiable
- Duplicate regions and app-owned symbol conflicts fail
- Marker-free untracked barrel follows explicit ownership policy

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/export-regions.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Barrel patching has a tested structural boundary.

**8. Commit message:** `codegen: define managed typescript export regions`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S053, not an unscheduled expansion.

### S053 — Generate the root UI export region

**Contract anchors:** R02, R06, R17, R32, R33, R34. [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Generate the root UI export region.

**2. Purpose:** Expose declared flat names without import cycles or accidental aliases.

**3. Exact scope of code changes:**

- Render source/value/type exports from manifest declarations
- Patch only the managed root region
- Use direct relative targets and preserve unrelated exports

**4. Files/modules likely involved:**

- `src/codegen/exports.ts`
- `tests/integration/root-exports.test.ts`

**5. Required unit/integration tests:**

- Button/compound sample exports use exact declared names
- Same export plan is idempotent
- App-owned duplicate symbol causes a nonmutating conflict

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/root-exports.test.ts
pnpm run test:unit -- tests/unit/export-regions.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Root public exports are deterministic and ownership-safe.

**8. Commit message:** `codegen: generate the flat ui export surface`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S054, not an unscheduled expansion.

### S054 — Generate compound barrels and validate sibling imports

**Contract anchors:** R02, R06, R17, R32, R33, R34. [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Generate compound barrels and validate sibling imports.

**2. Purpose:** Preserve the approved hybrid layout rather than folderizing every item.

**3. Exact scope of code changes:**

- Render compound index.ts from declared part exports
- Reject internal imports through root UI barrel
- Avoid generating unnecessary parent components/index.ts

**4. Files/modules likely involved:**

- `src/codegen/exports.ts`
- `tests/integration/compound-exports.test.ts`

**5. Required unit/integration tests:**

- Simple and compound fixtures produce different correct shapes
- Sibling imports resolve without root-barrel cycles
- No unrequested parent barrel is created

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/compound-exports.test.ts
pnpm run test:integration -- tests/integration/root-exports.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Compound exports match the intended layout and dependency direction.

**8. Commit message:** `codegen: qualify compound barrels and sibling imports`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S055, not an unscheduled expansion.

### S055 — Identify safe Svelte layout edit spans

**Contract anchors:** R17, R20, R21, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Identify safe Svelte layout edit spans.

**2. Purpose:** Avoid regex replacement of route scripts and rendering.

**3. Exact scope of code changes:**

- Use pinned Svelte parser to classify instance/module/no-script layouts
- Return precise supported insertion spans
- Diagnose unsupported/ambiguous syntax without mutation

**4. Files/modules likely involved:**

- `src/codegen/svelte-parse.ts`
- `tests/unit/svelte-layout-parse.test.ts`

**5. Required unit/integration tests:**

- No script, TS instance script, module script and comments parse
- Unsupported fixture yields typed guidance
- Source bytes remain unchanged during inspection

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/svelte-layout-parse.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Integration knows where a safe minimal import edit can occur.

**8. Commit message:** `codegen: identify safe svelte layout integration spans`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S056, not an unscheduled expansion.

### S056 — Patch ordered stylesheet imports minimally

**Contract anchors:** R05, R17, R23, R32, R33, R34. [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Patch ordered stylesheet imports minimally.

**2. Purpose:** Load kit/theme/app CSS without replacing application layout behavior.

**3. Exact scope of code changes:**

- Insert only missing approved imports into the supported instance script
- Preserve existing imports/comments/children rendering
- Resolve relative paths from configured supported roots and detect unsafe reorder cases

**4. Files/modules likely involved:**

- `src/codegen/svelte.ts`
- `tests/integration/layout-imports.test.ts`

**5. Required unit/integration tests:**

- Default and explicit-path fixtures load kit before themes before app
- Repeated patch is unchanged
- Existing route rendering and module script survive
- Ambiguous order/integration is reported safely

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/layout-imports.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Styles integrate without destructive layout replacement.

**8. Commit message:** `codegen: insert ordered css imports without replacing layouts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S057, not an unscheduled expansion.

### S057 — Build a pure initialization plan

**Contract anchors:** R05, R09, R15, R17, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [STYLING.md](../specs/STYLING.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Build a pure initialization plan.

**2. Purpose:** Combine validated config and minimal integration without installing an implicit catalog.

**3. Exact scope of code changes:**

- Plan absent config/export/CSS/integration targets and initial lock
- Preserve existing themes/app CSS
- Include every initialization effect in the plan and no hidden writes

**4. Files/modules likely involved:**

- `src/codegen/plan-init.ts`
- `tests/integration/plan-init.test.ts`

**5. Required unit/integration tests:**

- Empty supported app yields explicit minimal targets
- Existing application styles/layout remain preserved
- Init does not install unrequested component sources

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/plan-init.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Initialization can be inspected before transactions exist.

**8. Commit message:** `codegen: plan initialization without side effects`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S058, not an unscheduled expansion.

### S058 — Build a pure add-request plan

**Contract anchors:** R09, R10, R11, R15, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Build a pure add-request plan.

**2. Purpose:** Add one requested item and its closure without mutating intent during resolution.

**3. Exact scope of code changes:**

- Combine init prerequisites with explicit root addition and resolved source/CSS/export plan
- Include dependency instructions as data only
- Keep conflicts from modifying kit.json independently

**4. Files/modules likely involved:**

- `src/codegen/plan-add.ts`
- `tests/integration/plan-add.test.ts`

**5. Required unit/integration tests:**

- Sample button adds spinner/tokens transitively only
- Repeated add creates no duplicate request/block/export
- Source/CSS conflict prevents executable config-only change

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/plan-add.test.ts
pnpm run test:integration -- tests/integration/plan-init.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Add produces one coherent proposed batch.

**8. Commit message:** `codegen: plan explicit additions with dependency closure`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S059, not an unscheduled expansion.

### S059 — Enforce source-style compatibility cohorts

**Contract anchors:** R13, R14, R15, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Enforce source-style compatibility cohorts.

**2. Purpose:** Prevent locally edited members from being stranded by related upstream changes.

**3. Exact scope of code changes:**

- Freeze conservative cohort rules with examples resolving Q09
- Implement component source/CSS/export group safety and dependency expansion when justified
- Stop genuinely unsafe mixed updates rather than guessing semantic compatibility

**4. Files/modules likely involved:**

- `src/codegen/cohorts.ts`
- `tests/unit/cohorts.test.ts`
- `specs/SYNCHRONIZATION.md`

**5. Required unit/integration tests:**

- Conflict in source blocks CSS update and vice versa
- Locally edited/upstream-unchanged member plus coupled changed member is handled conservatively
- Unrelated unchanged components do not create false conflicts

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/cohorts.test.ts
pnpm run test:integration -- tests/integration/plan-add.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** A batch cannot update only half of a compatible component unit.

**8. Commit message:** `codegen: guard source and style compatibility cohorts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S060, not an unscheduled expansion.

### S060 — Build the full synchronization plan

**Contract anchors:** R09, R11, R13, R14, R15, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Build the full synchronization plan.

**2. Purpose:** Reconcile desired roots with incoming registry through approved ownership policy.

**3. Exact scope of code changes:**

- Resolve desired config, compare all source/style targets and assemble exports/integration
- Apply cohort policy before exposing an executable plan
- Collect deterministic diagnostics for all affected units

**4. Files/modules likely involved:**

- `src/codegen/plan-sync.ts`
- `tests/integration/plan-sync.test.ts`

**5. Required unit/integration tests:**

- Untouched upgrade, local-only customization, real conflict and already-incoming fixtures pass
- Conflicts leave all project state unchanged
- Requested roots remain separate from closure

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/plan-sync.test.ts
pnpm run test:unit -- tests/unit/cohorts.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Sync is a complete read-only reconciliation operation.

**8. Commit message:** `codegen: plan customization-aware synchronization`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S061, not an unscheduled expansion.

### S061 — Project truthful final lock lineage

**Contract anchors:** R12, R13, R14, R15, R32, R33, R34. [DATA_MODEL.md](../specs/DATA_MODEL.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Project truthful final lock lineage.

**2. Purpose:** Prevent preserved customizations from being labeled fully updated.

**3. Exact scope of code changes:**

- Generate lock state from effective target dispositions rather than incoming versions alone
- Preserve legitimate base hashes and record metadata-only transitions explicitly
- Validate indexes and schema before publication planning

**4. Files/modules likely involved:**

- `src/codegen/lock-projection.ts`
- `tests/integration/lock-projection.test.ts`

**5. Required unit/integration tests:**

- Preserved custom source keeps prior base
- Adopted incoming targets advance only their valid lineage
- Mixed cohort state cannot falsely claim complete update
- Second sync is semantically unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/lock-projection.test.ts
pnpm run test:integration -- tests/integration/plan-sync.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Lock metadata accurately describes installed effective state.

**8. Commit message:** `codegen: preserve truthful lineage in planned lock state`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S062, not an unscheduled expansion.

### S062 — Integrate configuration-driven retirement

**Contract anchors:** R11, R17, R18, R32, R33, R34. [DATA_MODEL.md](../specs/DATA_MODEL.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Integrate configuration-driven retirement.

**2. Purpose:** Finish reconciliation without losing shared dependencies or customized assets.

**3. Exact scope of code changes:**

- Compose source/CSS/export retirement with recalculated closure
- Keep customized retired files/rules app-owned and report leftovers
- Do not rewrite arbitrary application imports or add a remove command

**4. Files/modules likely involved:**

- `src/codegen/plan-sync.ts`
- `src/codegen/retire.ts`
- `tests/integration/plan-retirement.test.ts`

**5. Required unit/integration tests:**

- Removed root with shared dependency retains the dependency
- Clean removed item retires safely
- Edited removed item is retained and not falsely tracked as current
- User exports/imports are not silently erased

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/plan-retirement.test.ts
pnpm run test:integration -- tests/integration/lock-projection.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Removal via desired config has a safe complete plan.

**8. Commit message:** `codegen: reconcile retired items without deleting custom work`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S063, not an unscheduled expansion.

### S063 — Qualify deterministic zero-write planning

**Contract anchors:** R10, R15, R30, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Qualify deterministic zero-write planning.

**2. Purpose:** Make plan purity and idempotence an enforceable contract.

**3. Exact scope of code changes:**

- Snapshot complete trees around init/add/sync planning and all conflict cases
- Normalize semantic change ordering without hiding content changes
- Ensure planning never starts writer coordination or package manager work

**4. Files/modules likely involved:**

- `tests/integration/plan-purity.test.ts`
- `src/codegen/plan.ts`

**5. Required unit/integration tests:**

- No hidden files/mode changes appear in dry planning
- Equivalent logical inputs yield identical envelopes/plans
- Repeated satisfied plan is no_change

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/plan-purity.test.ts
pnpm run test:integration -- tests/integration/plan-sync.test.ts
pnpm run test:unit
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Pure planning is proven before mutation commands are wired.

**8. Commit message:** `test: prove deterministic side-effect-free planning`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S064, not an unscheduled expansion.

## M04 — Guarded transactions and recovery

### S064 — Freeze transaction states and safety assumptions

**Contract anchors:** R15, R16, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Freeze transaction states and safety assumptions.

**2. Purpose:** Define recovery correctness before exposing any mutating commands.

**3. Exact scope of code changes:**

- Specify writer coordination, prepared/applied/published/cleanup states and failure dispositions
- Document trusted-local threat model and actual platform limits
- Freeze owned transient paths and ignore policy without changing consumer semantic metadata

**4. Files/modules likely involved:**

- `specs/SECURITY_AND_TRANSACTIONS.md`
- `src/codegen/transaction-types.ts`
- `tests/unit/transaction-state.test.ts`

**5. Required unit/integration tests:**

- State transition table rejects impossible/ambiguous outcomes
- Exact-byte lock equality is not treated as a unique transaction identity
- Dry-run paths have no transition into mutation

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/transaction-state.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The recoverable transaction contract is explicit and reviewable.

**8. Commit message:** `spec: define recoverable transaction state transitions`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S065, not an unscheduled expansion.

### S065 — Validate transient coordination and journal records

**Contract anchors:** R16, R30, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md).

**1. Step title:** Validate transient coordination and journal records.

**2. Purpose:** Make recovery inputs as strict as committed lock metadata.

**3. Exact scope of code changes:**

- Implement strict internal journal/coordination parsing and identity checks
- Validate every journal target against approved roots and owner records
- Reject corrupt/unknown state before any restoration

**4. Files/modules likely involved:**

- `src/codegen/transaction-journal.ts`
- `tests/unit/transaction-journal.test.ts`

**5. Required unit/integration tests:**

- Valid journal round-trips
- Forged path/duplicate target/bad digest/unknown state fails
- Internal transient fields do not leak into semantic CLI output

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/transaction-journal.test.ts
pnpm run test:unit -- tests/unit/transaction-state.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Recovery can only operate on valid owned transaction state.

**8. Commit message:** `codegen: validate transient transaction records`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S066, not an unscheduled expansion.

### S066 — Implement exclusive writer coordination

**Contract anchors:** R15, R16, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Implement exclusive writer coordination.

**2. Purpose:** Serialize mutation without making read-only commands write locks.

**3. Exact scope of code changes:**

- Acquire/release one cooperative writer lock using documented platform-safe primitives
- Define contention/stale-owner behavior without age-only deletion
- Keep snapshot/read-only code independent from lock acquisition

**4. Files/modules likely involved:**

- `src/codegen/write-lock.ts`
- `tests/integration/write-lock.test.ts`

**5. Required unit/integration tests:**

- Second cooperative writer cannot enter mutation
- Read-only commands create no coordination state
- Ambiguous stale lock is not silently removed
- Owned lock cleanup is bounded

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/write-lock.test.ts
pnpm run test:integration -- tests/integration/plan-purity.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** One writer can safely own the mutation phase.

**8. Commit message:** `codegen: coordinate exclusive project writers`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S067, not an unscheduled expansion.

### S067 — Revalidate planned preimages under coordination

**Contract anchors:** R13, R16, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Revalidate planned preimages under coordination.

**2. Purpose:** Refuse stale plans before they replace user changes.

**3. Exact scope of code changes:**

- Compare file kinds/content/ancestry and relevant config/lock observations after writer acquisition
- Invalidate changed plans rather than silently replanning mid-transaction
- Surface safe stale-plan diagnostics

**4. Files/modules likely involved:**

- `src/codegen/revalidate.ts`
- `tests/integration/revalidate.test.ts`

**5. Required unit/integration tests:**

- Source/config/CSS changes after planning fail before staging
- Symlink/ancestor replacement is detected within documented threat model
- Unchanged preimages pass

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/revalidate.test.ts
pnpm run test:integration -- tests/integration/filesystem-paths.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Mutation begins only from the observed safe input state.

**8. Commit message:** `codegen: reject stale or unsafe plan preimages`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S068, not an unscheduled expansion.

### S068 — Stage replacement bytes with owned temporary files

**Contract anchors:** R16, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md).

**1. Step title:** Stage replacement bytes with owned temporary files.

**2. Purpose:** Prepare writes without truncating live application files.

**3. Exact scope of code changes:**

- Stage exact new bytes in approved same-filesystem locations
- Preserve appropriate file modes and track only owned temporary files
- Return explicit staging failures without touching live targets

**4. Files/modules likely involved:**

- `src/codegen/stage.ts`
- `tests/integration/staging.test.ts`

**5. Required unit/integration tests:**

- Staged bytes/digests match plans
- Permission/disk/write failures leave live files unchanged
- Cleanup cannot delete unrelated temp files
- New directories follow path policy

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/staging.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** A replacement batch can be prepared safely before application.

**8. Commit message:** `codegen: stage exact replacement content safely`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S069, not an unscheduled expansion.

### S069 — Persist recoverable prepared-state journals

**Contract anchors:** R13, R16, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Persist recoverable prepared-state journals.

**2. Purpose:** Make interruption survivable independently of process cleanup.

**3. Exact scope of code changes:**

- Record required preimages/backups and staged identifiers before live replacement
- Implement documented flush/durability ordering for supported platforms
- Keep transient recovery history separate from a merge-history feature

**4. Files/modules likely involved:**

- `src/codegen/transaction-journal.ts`
- `src/codegen/stage.ts`
- `tests/integration/journal-preparation.test.ts`

**5. Required unit/integration tests:**

- Failure before prepared publication leaves no live changes
- Restart after preparation identifies exact owned staging
- Missing/invalid backup refuses unsafe recovery

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/journal-preparation.test.ts
pnpm run test:unit -- tests/unit/transaction-journal.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Prepared batches have enough evidence for safe recovery.

**8. Commit message:** `codegen: persist prepared transaction recovery evidence`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S070, not an unscheduled expansion.

### S070 — Apply per-file replacements with recorded progress

**Contract anchors:** R16, R18, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Apply per-file replacements with recorded progress.

**2. Purpose:** Perform multi-file changes through one observable recovery protocol.

**3. Exact scope of code changes:**

- Replace/create/retire planned targets in documented order with atomic per-file operations where supported
- Record progress so interrupted mixed state is detectable
- Do not publish final install lock in this step

**4. Files/modules likely involved:**

- `src/codegen/replace.ts`
- `tests/integration/replacement.test.ts`

**5. Required unit/integration tests:**

- Failure at each replacement boundary is represented correctly
- File modes and preserved neighbors remain correct
- Retirement follows exact ownership decisions
- No native multi-file atomicity claim is made

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/replacement.test.ts
pnpm run test:integration -- tests/integration/journal-preparation.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Live replacements are journaled and individually safe within the stated model.

**8. Commit message:** `codegen: apply journaled file replacements`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S071, not an unscheduled expansion.

### S071 — Publish the canonical install lock last

**Contract anchors:** R12, R13, R16, R32, R33, R34. [DATA_MODEL.md](../specs/DATA_MODEL.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Publish the canonical install lock last.

**2. Purpose:** Make effective installation state the final batch publication.

**3. Exact scope of code changes:**

- Validate final lock against applied plan before replacement
- Publish it after source/CSS/config/export/layout targets
- Distinguish metadata-only and unchanged-byte publication with transaction identity

**4. Files/modules likely involved:**

- `src/codegen/publish-lock.ts`
- `tests/integration/lock-publication.test.ts`

**5. Required unit/integration tests:**

- Event traces prove install lock is final semantic publication
- Invalid planned lock never replaces existing state
- Same-byte lock replacement remains distinguishable in journal protocol

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/lock-publication.test.ts
pnpm run test:integration -- tests/integration/lock-projection.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Successful state publication is coherent and truthfully ordered.

**8. Commit message:** `codegen: publish install state after application files`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S072, not an unscheduled expansion.

### S072 — Clean completed transactions without losing evidence

**Contract anchors:** R15, R16, R17, R32, R33, R34. [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [STYLING.md](../specs/STYLING.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Clean completed transactions without losing evidence.

**2. Purpose:** Remove only safe ephemeral state after committed publication.

**3. Exact scope of code changes:**

- Clean owned staging/backups/journal in documented order
- Retain actionable evidence when cleanup fails
- Plan safe ignore-rule integration only when required and preserve existing rules

**4. Files/modules likely involved:**

- `src/codegen/transaction-cleanup.ts`
- `tests/integration/transaction-cleanup.test.ts`

**5. Required unit/integration tests:**

- Completed batch cleans its own files only
- Cleanup failure reports committed-but-needs-cleanup state accurately
- Existing ignore rules/unrelated temp state survive

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/transaction-cleanup.test.ts
pnpm run test:integration -- tests/integration/lock-publication.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Cleanup cannot invalidate committed application state or erase unrelated data.

**8. Commit message:** `codegen: clean owned transaction state safely`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S073, not an unscheduled expansion.

### S073 — Recover interrupted prepublication transactions

**Contract anchors:** R13, R16, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Recover interrupted prepublication transactions.

**2. Purpose:** Return partially applied uncommitted batches to a known state safely.

**3. Exact scope of code changes:**

- Implement the frozen rollback/roll-forward policy for prepared or partially applied batches without final publication
- Revalidate current bytes before restore
- Preserve post-interruption user edits rather than overwrite them

**4. Files/modules likely involved:**

- `src/codegen/recovery.ts`
- `tests/integration/recovery-prepublication.test.ts`

**5. Required unit/integration tests:**

- Restart at every prepublication boundary recovers or safely refuses
- User edits made after crash block destructive restoration
- Missing backups and unexpected preimages fail closed

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/recovery-prepublication.test.ts
pnpm run test:unit -- tests/unit/transaction-state.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Interrupted uncommitted writes no longer leave undetected ambiguous state.

**8. Commit message:** `codegen: recover interrupted uncommitted batches`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S074, not an unscheduled expansion.

### S074 — Recover published transactions and incomplete cleanup

**Contract anchors:** R13, R16, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Recover published transactions and incomplete cleanup.

**2. Purpose:** Avoid rolling back a successfully published install after restart.

**3. Exact scope of code changes:**

- Recognize committed publication from journal/lock evidence, including unchanged-byte cases
- Finish only safe outstanding cleanup or documented completion
- Refuse contradictions rather than guessing success

**4. Files/modules likely involved:**

- `src/codegen/recovery.ts`
- `tests/integration/recovery-published.test.ts`

**5. Required unit/integration tests:**

- Crash immediately after lock publication preserves committed source
- Same-byte lock publication is classified correctly
- Postcommit user modifications survive cleanup

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/recovery-published.test.ts
pnpm run test:integration -- tests/integration/lock-publication.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Recovery distinguishes committed work from an uncommitted batch.

**8. Commit message:** `codegen: finish recovery after install state publication`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S075, not an unscheduled expansion.

### S075 — Fail closed on corrupt or ambiguous recovery evidence

**Contract anchors:** R09, R16, R30, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md).

**1. Step title:** Fail closed on corrupt or ambiguous recovery evidence.

**2. Purpose:** Prevent convenience recovery from becoming an unsafe overwrite path.

**3. Exact scope of code changes:**

- Consolidate invalid journal/lock/backup/owner diagnostics
- Block new mutation when recovery cannot prove a safe transition
- Provide existing-command/manual recovery guidance without inventing force/recover flags

**4. Files/modules likely involved:**

- `src/codegen/recovery.ts`
- `src/cli/protocol.ts`
- `tests/integration/recovery-invalid.test.ts`

**5. Required unit/integration tests:**

- Corrupt/forged/unknown journal cases do not mutate
- Stale PID/age alone cannot authorize cleanup
- Diagnostics identify safe logical evidence and next actions

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/recovery-invalid.test.ts
pnpm run test:unit -- tests/unit/protocol.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Ambiguous state remains visible and protected.

**8. Commit message:** `codegen: refuse ambiguous transaction recovery`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S076, not an unscheduled expansion.

### S076 — Qualify concurrency and process-interruption behavior

**Contract anchors:** R16, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md).

**1. Step title:** Qualify concurrency and process-interruption behavior.

**2. Purpose:** Verify the protocol using real processes, not only mocked filesystem calls.

**3. Exact scope of code changes:**

- Add cooperative writer contention and process-termination fixtures
- Inject failures around stage/replace/publication/cleanup boundaries
- Record platform-specific limits and available CI lanes

**4. Files/modules likely involved:**

- `tests/integration/transaction-processes.test.ts`
- `tests/helpers/fault-process.ts`
- `CI workflow configuration`

**5. Required unit/integration tests:**

- Two writers cannot interleave an accepted batch
- Killed process leaves recoverable or refused state
- Noncooperative edits are not overwritten
- Platform matrix documents unrun cases explicitly

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/transaction-processes.test.ts
pnpm run test:integration -- tests/integration/recovery-prepublication.test.ts
pnpm run test:integration -- tests/integration/recovery-published.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Concurrency and interruption claims have process-level evidence.

**8. Commit message:** `test: qualify concurrent and interrupted transactions`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S077, not an unscheduled expansion.

### S077 — Compose the guarded apply use case

**Contract anchors:** R13, R14, R15, R16, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Compose the guarded apply use case.

**2. Purpose:** Provide one safe mutation entrypoint for all write commands.

**3. Exact scope of code changes:**

- Wire complete conflict-free plans through recovery check, coordination, revalidation, staging, replacement, publication and cleanup
- Reject unvalidated/partial plans
- Keep pure planning and CLI output separate

**4. Files/modules likely involved:**

- `src/codegen/apply.ts`
- `tests/integration/apply.test.ts`

**5. Required unit/integration tests:**

- Successful batch changes exactly planned files
- Conflicting/stale/unsafe plan yields no new writes
- Recoverable failure reports accurate outcome and preserves evidence

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/apply.test.ts
pnpm run test:integration -- tests/integration/plan-purity.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** All mutations can share one verified transaction boundary.

**8. Commit message:** `codegen: compose guarded plan application`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S078, not an unscheduled expansion.

## M05 — Complete CLI workflows and generator acceptance

### S078 — Render human and JSON command outcomes

**Contract anchors:** R09, R15, R30, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Render human and JSON command outcomes.

**2. Purpose:** Keep machine results clean while making human errors actionable.

**3. Exact scope of code changes:**

- Implement one envelope renderer and human stdout/stderr rules
- Map typed planner/registry/fs errors through frozen statuses
- Exclude random internal transaction details from deterministic semantic output

**4. Files/modules likely involved:**

- `src/cli/output.ts`
- `tests/integration/output.test.ts`

**5. Required unit/integration tests:**

- JSON failure/help/planned/success emit exactly one parseable object
- Human errors leave stdout empty
- No ANSI/progress leakage in JSON mode

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/output.test.ts
pnpm run test:unit -- tests/unit/protocol.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** All command handlers can emit consistent tested outcomes.

**8. Commit message:** `cli: render deterministic human and json outcomes`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S079, not an unscheduled expansion.

### S079 — Implement read-only info

**Contract anchors:** R09, R10, R15, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Implement read-only info.

**2. Purpose:** Expose supported project/dependency readiness without mutation.

**3. Exact scope of code changes:**

- Wire project/root/config/dependency inspection to info
- Include safe paths and explicit unsupported/missing states
- Honor --cwd and --json

**4. Files/modules likely involved:**

- `src/cli/commands/info.ts`
- `tests/integration/info.test.ts`

**5. Required unit/integration tests:**

- Default/custom/ambiguous/missing project cases return expected envelopes
- Complete-tree snapshots prove no writes
- Peer incompatibility appears in data/diagnostics

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/info.test.ts
pnpm run build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Info reports actual readiness through the approved interface.

**8. Commit message:** `cli: inspect projects with read-only info`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S080, not an unscheduled expansion.

### S080 — Implement read-only registry view and source inspection

**Contract anchors:** R08, R09, R13, R15, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Implement read-only registry view and source inspection.

**2. Purpose:** Let developers inspect incoming item content for adoption and conflict resolution.

**3. Exact scope of code changes:**

- Wire packaged item metadata and --source output to view
- Support item inspection without inventing a project where not required
- Use exact bundled assets and typed unknown-item errors

**4. Files/modules likely involved:**

- `src/cli/commands/view.ts`
- `tests/integration/view.test.ts`

**5. Required unit/integration tests:**

- Known sample item metadata/source matches asset snapshot
- Unknown item/invalid flags produce one expected outcome
- View creates no project state and works from another CWD

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/view.test.ts
pnpm run test:unit -- tests/unit/assets.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** View exposes incoming source independently from a runtime package.

**8. Commit message:** `cli: inspect bundled registry items and source`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S081, not an unscheduled expansion.

### S081 — Implement init through plan and guarded apply

**Contract anchors:** R05, R09, R15, R16, R17, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [STYLING.md](../specs/STYLING.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Implement init through plan and guarded apply.

**2. Purpose:** Expose initialization only after safe transactional machinery exists.

**3. Exact scope of code changes:**

- Wire init to pure plan and guarded apply
- Return planned outcome for --dry-run without starting coordination
- Include dependency/integration guidance without package installation

**4. Files/modules likely involved:**

- `src/cli/commands/init.ts`
- `tests/integration/init.test.ts`

**5. Required unit/integration tests:**

- Default init creates exactly planned targets
- Second init is no_change
- Dry run leaves hidden and visible state unchanged
- Existing application layout/styles survive

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/init.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Initialization is usable and non-destructive.

**8. Commit message:** `cli: initialize applications through guarded plans`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S082, not an unscheduled expansion.

### S082 — Implement add through explicit requests

**Contract anchors:** R09, R10, R11, R13, R16, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Implement add through explicit requests.

**2. Purpose:** Expose the first complete source-installation workflow.

**3. Exact scope of code changes:**

- Wire one-item add to request projection and guarded apply
- Surface missing/incompatible dependency instructions separately
- Preserve conflicts without config-only side effects

**4. Files/modules likely involved:**

- `src/cli/commands/add.ts`
- `tests/integration/add.test.ts`

**5. Required unit/integration tests:**

- Sample item and dependencies install with correct ownership
- Repeated add is no_change
- Untracked conflict leaves all files unchanged
- Config roots exclude transitive additions

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/add.test.ts
pnpm run test:integration -- tests/integration/apply.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Applications can install qualified items through the approved command.

**8. Commit message:** `cli: add requested components with safe dependency closure`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S083, not an unscheduled expansion.

### S083 — Implement sync through customization-aware planning

**Contract anchors:** R09, R13, R14, R15, R18, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Implement sync through customization-aware planning.

**2. Purpose:** Make upgrades and config reconciliation preserve user edits.

**3. Exact scope of code changes:**

- Wire sync/dry-run to full planning, cohort protection and apply
- Include retirement and metadata-only outcomes
- No force/automatic merge path

**4. Files/modules likely involved:**

- `src/cli/commands/sync.ts`
- `tests/integration/sync.test.ts`

**5. Required unit/integration tests:**

- Untouched updates apply; local-only edits remain; genuine conflicts write nothing
- Clean/custom retirement follows policy
- Second sync is unchanged and metadata remains truthful

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/sync.test.ts
pnpm run test:integration -- tests/integration/plan-retirement.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Sync implements the central source-ownership product promise.

**8. Commit message:** `cli: synchronize without overwriting customizations`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S084, not an unscheduled expansion.

### S084 — Implement doctor structural and dependency checks

**Contract anchors:** R09, R10, R15, R19, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Implement doctor structural and dependency checks.

**2. Purpose:** Detect broken generated integration independently of mutation.

**3. Exact scope of code changes:**

- Inspect registry/config/lock consistency, missing targets, malformed CSS, exports/layout and dependencies
- Report safe typed per-check results
- Do not repair or write during doctor

**4. Files/modules likely involved:**

- `src/cli/commands/doctor.ts`
- `tests/integration/doctor-structure.test.ts`

**5. Required unit/integration tests:**

- Missing files/invalid metadata/peer conflicts/malformed blocks are diagnosed
- Healthy fixture passes
- No filesystem mutations occur even with stale recovery state

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/doctor-structure.test.ts
pnpm run test:integration -- tests/integration/dependency-state.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Doctor identifies actual installation breakage without side effects.

**8. Commit message:** `cli: diagnose structural and dependency health`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S085, not an unscheduled expansion.

### S085 — Separate doctor customization from strict failures

**Contract anchors:** R13, R19, R30, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Separate doctor customization from strict failures.

**2. Purpose:** Avoid treating editable-source use as installation corruption.

**3. Exact scope of code changes:**

- Classify valid local source/CSS edits as customization rather than failure
- Define strict escalation only for broken/unsafe checks per frozen contract
- Preserve actionable conflict/upgrade warnings

**4. Files/modules likely involved:**

- `src/cli/commands/doctor.ts`
- `tests/integration/doctor-customization.test.ts`
- `specs/API_CONTRACTS.md`

**5. Required unit/integration tests:**

- Customized valid source/CSS does not fail strict solely for drift
- Broken required target and unsafe state fail strict
- JSON/human outcomes and exit codes match protocol

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/doctor-customization.test.ts
pnpm run test:integration -- tests/integration/doctor-structure.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Strict doctor supports legitimate source ownership.

**8. Commit message:** `cli: distinguish customization from broken installs`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S086, not an unscheduled expansion.

### S086 — Qualify the executable exit and JSON matrix

**Contract anchors:** R09, R15, R30, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Qualify the executable exit and JSON matrix.

**2. Purpose:** Match the source-project automation rigor at process level.

**3. Exact scope of code changes:**

- Add complete command/usage/planned/applied/no-change/warning/conflict/unsafe/error golden cases
- Test flags before/after commands as supported by parser
- Assert exactly one envelope on failures

**4. Files/modules likely involved:**

- `tests/integration/exit-contract.test.ts`
- `src/cli/main.ts`

**5. Required unit/integration tests:**

- All frozen exit codes/statuses exercised through built executable
- Human failure stderr/stdout contract passes
- Unknown options cannot trigger writes

**6. Verification commands:**

```sh
pnpm run build
pnpm run test:integration -- tests/integration/exit-contract.test.ts
pnpm run test:unit -- tests/unit/args.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Process behavior is stable for humans and automation.

**8. Commit message:** `test: qualify cli exit and json contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S087, not an unscheduled expansion.

### S087 — Qualify full workflow idempotence and no-write paths

**Contract anchors:** R10, R11, R15, R30, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Qualify full workflow idempotence and no-write paths.

**2. Purpose:** Ensure handlers do not bypass the pure-plan guarantees.

**3. Exact scope of code changes:**

- Exercise info/view/init/add/sync/doctor and dry-run flows in temp apps
- Compare complete trees including ephemeral state and manifests
- Verify no hidden dependency execution

**4. Files/modules likely involved:**

- `tests/integration/workflow-purity.test.ts`
- `tests/helpers/tree-snapshot.ts`

**5. Required unit/integration tests:**

- All read-only/dry-run/conflict paths are byte/mode nonmutating
- Successful repeated workflow is unchanged
- Multiple command sequences produce equivalent desired state

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/workflow-purity.test.ts
pnpm run test:integration -- tests/integration/exit-contract.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** End-to-end commands preserve the planned side-effect contract.

**8. Commit message:** `test: prove workflow idempotence and dry-run purity`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S088, not an unscheduled expansion.

### S088 — Reject unsupported schemas and preserve migration boundaries

**Contract anchors:** R12, R15, R30, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Reject unsupported schemas and preserve migration boundaries.

**2. Purpose:** Avoid accidental compatibility with legacy or future configuration.

**3. Exact scope of code changes:**

- Add version-aware parse dispatch and explicit unsupported-version diagnostics
- Reject Leptos/shadcn config as unsupported input
- Keep mutation blocked before any guessed migration

**4. Files/modules likely involved:**

- `src/project/migrations.ts`
- `src/codegen/lock.ts`
- `tests/integration/schema-versions.test.ts`

**5. Required unit/integration tests:**

- Current independent versions pass
- Unknown future and source-only legacy fields fail without writes
- Framework version changes alone do not trigger migration

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/schema-versions.test.ts
pnpm run test:unit -- tests/unit/versions.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Schema evolution has an explicit safe entry boundary.

**8. Commit message:** `config: reject unsupported schema transitions safely`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S089, not an unscheduled expansion.

### S089 — Add synthetic upgrade and contract-revision fixtures

**Contract anchors:** R12, R13, R14, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Add synthetic upgrade and contract-revision fixtures.

**2. Purpose:** Verify update machinery without inventing a shipped historical version.

**3. Exact scope of code changes:**

- Create clearly synthetic old/incoming registry fixtures with source/CSS and metadata changes
- Test independent item/contract upgrades through sync
- Retain customized targets and cohort conflicts across revisions

**4. Files/modules likely involved:**

- `tests/fixtures/upgrades/`
- `tests/integration/upgrade-fixtures.test.ts`

**5. Required unit/integration tests:**

- Untouched synthetic upgrades succeed with truthful lock
- Customized changed cohort blocks
- Unrelated package/framework versions do not corrupt schema state
- Fixtures are labeled synthetic, not real releases

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/upgrade-fixtures.test.ts
pnpm run test:integration -- tests/integration/sync.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Migration/upgrade behavior has executable coverage before real releases exist.

**8. Commit message:** `test: qualify independent registry and contract upgrades`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S090, not an unscheduled expansion.

### S090 — Build and inspect the package asset inventory

**Contract anchors:** R01, R08, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [PRODUCT_SPEC.md](../specs/PRODUCT_SPEC.md).

**1. Step title:** Build and inspect the package asset inventory.

**2. Purpose:** Catch packaging gaps before the catalog grows.

**3. Exact scope of code changes:**

- Configure bin/module metadata and explicit packed file inclusion
- Include only required distributable assets/contracts/schemas and built executable
- Add no authoring-tree fallback or network registry

**4. Files/modules likely involved:**

- `package.json`
- `build configuration`
- `tests/package/inventory.test.ts`
- `package test configuration`

**5. Required unit/integration tests:**

- Packed manifest lists executable and every qualified registry asset/schema
- Test-only state and unintended dependency/runtime files are excluded
- View works using packed layout

**6. Verification commands:**

```sh
pnpm run build
pnpm pack --json
pnpm run test:package -- tests/package/inventory.test.ts # establish this real lane here
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The package layout is independently inspectable and usable.

**8. Commit message:** `package: include the executable and bundled registry assets`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S091, not an unscheduled expansion.

### S091 — Document the working generator workflow

**Contract anchors:** R02, R09, R13, R19, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Document the working generator workflow.

**2. Purpose:** Keep usable public guidance aligned with implemented behavior.

**3. Exact scope of code changes:**

- Document init/add/view/sync/doctor, explicit dependency setup, ownership and conflict handling
- Record supported default/custom layouts and current catalog qualification status
- Document no publication/auto-install/runtime-package claims

**4. Files/modules likely involved:**

- `README.md`
- `CONTRIBUTING.md`
- `implementation evidence/COMMANDS.md`
- `tests/integration/documented-workflow.test.ts`

**5. Required unit/integration tests:**

- Execute documented workflow against a temp fixture
- Examples use actual commands and no nonexistent published package assumption
- Generator suites remain green

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/documented-workflow.test.ts
pnpm run test:unit
pnpm run test:integration
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The complete generator is documented and cumulatively qualified before catalog work.

**8. Commit message:** `docs: document the verified source-first workflow`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S092, not an unscheduled expansion.

## M06 — Tokens, spinner, button, switch, and dialog vertical slice

### S092 — Freeze the portable token and customization vocabulary

**Contract anchors:** R04, R07, R12, R25, R26, R32, R33, R34. [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Freeze the portable token and customization vocabulary.

**2. Purpose:** Preserve the reference design decisions without importing Rust capability metadata.

**3. Exact scope of code changes:**

- Map source token/customization contracts to independently versioned Svelte contracts
- Record default values, radius roles, shape-critical properties and allowed grammar
- Preserve license/provenance notices for any copied assets

**4. Files/modules likely involved:**

- `registry/contracts/theme-v1.json`
- `registry/contracts/component-customization-v1.json`
- `specs/component-maps/tokens.md`
- `tests/registry/token-contract.test.ts`

**5. Required unit/integration tests:**

- Every intended semantic/customization property has an explicit role/default mapping
- No Rust ABI identifiers remain
- Complete border-radius grammar is not narrowed by schema or property registration

**6. Verification commands:**

```sh
pnpm run test:registry -- tests/registry/token-contract.test.ts
pnpm run test:unit -- tests/unit/theme-metadata.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Token and component-property scope is frozen before CSS installation.

**8. Commit message:** `tokens: define the portable semantic and customization contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S093, not an unscheduled expansion.

### S093 — Install the pure-CSS tokens foundation

**Contract anchors:** R04, R07, R08, R26, R32, R33, R34. [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Install the pure-CSS tokens foundation.

**2. Purpose:** Introduce the first real qualified built-in item.

**3. Exact scope of code changes:**

- Author mapped token CSS with target markers/layer order
- Add CSS-only foundation manifest and register tokens
- Preserve defaults rather than redesigning palette or global reset

**4. Files/modules likely involved:**

- `registry/styles/tokens.css`
- `registry/foundation/tokens.json`
- `registry/registry.json`
- `tests/integration/tokens-install.test.ts`

**5. Required unit/integration tests:**

- Add tokens installs only foundation CSS and correct metadata prerequisites
- Layer order and marker uniqueness pass
- Repeated installation is unchanged and no Tailwind tooling is required

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/tokens-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** A real CSS-only foundation is installable through the CLI.

**8. Commit message:** `tokens: register the pure css foundation`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S094, not an unscheduled expansion.

### S094 — Emit truthful token and theme integration metadata

**Contract anchors:** R07, R12, R23, R25, R32, R33, R34. [DATA_MODEL.md](../specs/DATA_MODEL.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Emit truthful token and theme integration metadata.

**2. Purpose:** Make generated contracts usable by applications and later sync.

**3. Exact scope of code changes:**

- Project token-contract.json and theme-integration.json from actual target contracts
- Include actual stylesheet/layer/producer compatibility
- Add lock digest tracking and safe contract-upgrade fixtures

**4. Files/modules likely involved:**

- `src/codegen/theme-integration.ts`
- `tests/integration/theme-metadata.test.ts`
- `registry/contracts/`

**5. Required unit/integration tests:**

- Generated metadata validates independently
- Digests match installed content
- No Rust primitive/portal type claim appears
- Synthetic contract revision respects customization/cohort policy

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/theme-metadata.test.ts
pnpm run test:registry -- tests/registry/token-contract.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Committed theme metadata accurately describes installed Svelte styling.

**8. Commit message:** `tokens: emit versioned theme integration metadata`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S095, not an unscheduled expansion.

### S095 — Qualify token override and radius fallback behavior

**Contract anchors:** R22, R23, R25, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify token override and radius fallback behavior.

**2. Purpose:** Test CSS contract meaning in a browser rather than only JSON shape.

**3. Exact scope of code changes:**

- Add computed-style fixture for semantic/component/default/reference precedence
- Cover unset properties, multi-corner/elliptical radius and circular shape exceptions
- Record baseline contrast observations without claiming blanket compliance

**4. Files/modules likely involved:**

- `tests/browser/token-contract.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/tokens/`
- `specs/component-maps/tokens.md`

**5. Required unit/integration tests:**

- All fallback levels produce intended computed values
- Theme overrides apply without editing component source
- Invalid values follow documented CSS behavior and full grammar remains accepted

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/token-contract.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Portable CSS customization behavior is browser-qualified.

**8. Commit message:** `test: qualify token overrides and radius precedence`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S096, not an unscheduled expansion.

### S096 — Freeze spinner props and accessible modes

**Contract anchors:** R03, R20, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Freeze spinner props and accessible modes.

**2. Purpose:** Preserve decorative/loading behavior before Button depends on it.

**3. Exact scope of code changes:**

- Inspect source spinner API/CSS and freeze target mode/type/export mapping
- Define decorative usage and status-label behavior without redundant announcements
- Add typed and contract fixtures

**4. Files/modules likely involved:**

- `specs/component-maps/spinner.md`
- `tests/components/spinner-contract.test.ts`
- `registry/ui/spinner.types.ts if justified`

**5. Required unit/integration tests:**

- Supported modes/types and omitted hooks are explicit
- Decorative mode cannot introduce duplicate loading label semantics
- Shape-critical CSS property mapping is documented

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/spinner-contract.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Spinner behavior and design boundary are frozen.

**8. Commit message:** `spinner: define modes and accessibility contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S097, not an unscheduled expansion.

### S097 — Generate the spinner component and CSS

**Contract anchors:** R02, R04, R06, R26, R32, R33, R34. [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Generate the spinner component and CSS.

**2. Purpose:** Provide a real native presentation dependency for Button.

**3. Exact scope of code changes:**

- Author typed native spinner markup, stylesheet and explicit manifest
- Register Spinner and source-supported type exports
- Use tokens and preserve circular geometry/motion contracts

**4. Files/modules likely involved:**

- `registry/ui/spinner.svelte`
- `registry/ui/spinner.json`
- `registry/styles/spinner.css`
- `registry/registry.json`
- `tests/integration/spinner-install.test.ts`

**5. Required unit/integration tests:**

- CLI-installed source compiles and exports declared symbols
- Decorative/status cases render expected semantics
- Registry dependency and block ownership validate

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/spinner-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Spinner installs as editable local source with plain CSS.

**8. Commit message:** `spinner: generate native source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S098, not an unscheduled expansion.

### S098 — Qualify spinner geometry and reduced motion

**Contract anchors:** R22, R23, R25, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify spinner geometry and reduced motion.

**2. Purpose:** Prevent visual or accessibility regressions in its primary use cases.

**3. Exact scope of code changes:**

- Add generated-app spinner state fixture
- Verify reduced motion and explicit shape overrides
- Test labels/decoration and theme inheritance

**4. Files/modules likely involved:**

- `tests/browser/spinner.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/spinner/`

**5. Required unit/integration tests:**

- Default geometry stays circular despite global radius override
- Exact spinner override is honored
- Decorative instance is not redundantly announced
- Reduced-motion case remains meaningful

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/spinner.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Spinner is qualified for standalone and Button composition.

**8. Commit message:** `test: qualify spinner geometry and accessible motion`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S099, not an unscheduled expansion.

### S099 — Freeze Button native props and variant types

**Contract anchors:** R03, R06, R20, R26, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md).

**1. Step title:** Freeze Button native props and variant types.

**2. Purpose:** Carry over recognizable design choices without adding polymorphic behavior.

**3. Exact scope of code changes:**

- Define ButtonProps from native Svelte button attributes and kit additions
- Freeze primary/secondary/ghost, sm/md/lg, default type button and loadingLabel behavior
- Document ref/children/event forwarding and Spinner dependency

**4. Files/modules likely involved:**

- `registry/ui/button.types.ts`
- `specs/component-maps/button.md`
- `tests/components/button-types.test.ts`

**5. Required unit/integration tests:**

- Positive native form/data/aria props typecheck
- Unsupported variants/size and accidental link polymorphism fail
- Loading/ref/children signatures remain explicit without any

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/button-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Button API matches approved semantics and selected Svelte types.

**8. Commit message:** `button: define native props and design variants`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S100, not an unscheduled expansion.

### S100 — Generate Button with loading-safe plain CSS

**Contract anchors:** R02, R04, R06, R11, R20, R26, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Generate Button with loading-safe plain CSS.

**2. Purpose:** Complete the first native component with a transitive source dependency.

**3. Exact scope of code changes:**

- Author native button, loading/disabled/busy markup and decorative spinner composition
- Map full reference Button CSS to target layers/markers
- Register manifest/export/type targets with tokens/spinner dependencies and direct sibling imports

**4. Files/modules likely involved:**

- `registry/ui/button.svelte`
- `registry/ui/button.json`
- `registry/styles/button.css`
- `registry/registry.json`
- `tests/integration/button-install.test.ts`

**5. Required unit/integration tests:**

- add button resolves spinner/tokens without making them requested roots
- Generated local source and types compile
- No import through the root barrel or styled kit runtime
- Native default type and busy markup are correct

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/button-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Button is an installable app-owned native component with authored styles.

**8. Commit message:** `button: generate loading-safe source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S101, not an unscheduled expansion.

### S101 — Qualify Button keyboard, form, and loading behavior

**Contract anchors:** R20, R22, R23, R25, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify Button keyboard, form, and loading behavior.

**2. Purpose:** Verify native behavior was preserved through design wrappers.

**3. Exact scope of code changes:**

- Test default no-submit behavior, explicit submit/reset and disabled/loading guards
- Verify accessible loading text, aria-busy and caller handlers/classes/refs
- Exercise variant/size/theme/focus states

**4. Files/modules likely involved:**

- `tests/browser/button.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/button/`

**5. Required unit/integration tests:**

- Click/keyboard activation and form cases pass
- Loading prevents activation without duplicate announcements
- Focus-visible and token/radius overrides work
- Caller attributes are preserved

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/button.spec.ts
pnpm run test:components -- tests/components/button-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Button behavior and visual states are generated-app qualified.

**8. Commit message:** `test: qualify button forms focus and loading states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S102, not an unscheduled expansion.

### S102 — Freeze Switch binding, ref, and composition contracts

**Contract anchors:** R03, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Freeze Switch binding, ref, and composition contracts.

**2. Purpose:** Avoid accepting rendering hooks that the wrapper owns internally.

**3. Exact scope of code changes:**

- Map pinned Bits Switch Root/Thumb props and actual native form behavior
- Freeze checked/ref bindings and excluded child/children hooks
- Map checked-state selectors and reference track/thumb customization

**4. Files/modules likely involved:**

- `specs/component-maps/switch.md`
- `tests/components/switch-types.test.ts`

**5. Required unit/integration tests:**

- Valid checked/ref/form props compile
- child/children rejected for the internal-thumb wrapper
- No invented alias replaces the pinned primitive contract

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/switch-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Switch has a deliberate typed composition boundary.

**8. Commit message:** `switch: define binding and composition contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S103, not an unscheduled expansion.

### S103 — Generate the primitive-backed Switch

**Contract anchors:** R02, R03, R04, R07, R20, R26, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Generate the primitive-backed Switch.

**2. Purpose:** Prove the architecture combines Bits behavior with app-owned plain CSS.

**3. Exact scope of code changes:**

- Author Switch wrapper with explicit checked/ref binding, class merge and forwarded props
- Map source switch CSS to actual Root/Thumb DOM
- Register item/export/dependencies without a kit runtime helper

**4. Files/modules likely involved:**

- `registry/ui/switch.svelte`
- `registry/ui/switch.json`
- `registry/styles/switch.css`
- `registry/registry.json`
- `tests/integration/switch-install.test.ts`

**5. Required unit/integration tests:**

- Generated wrapper compiles against pinned Bits
- Data-state selectors match real DOM
- Required dependencies and CSS ownership are correct
- Initial state SSR is not disabled

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/switch-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Switch installs as a thin local primitive wrapper.

**8. Commit message:** `switch: generate the bits wrapper and pure css skin`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S104, not an unscheduled expansion.

### S104 — Qualify Switch state, forms, RTL, and motion

**Contract anchors:** R20, R22, R23, R25, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify Switch state, forms, RTL, and motion.

**2. Purpose:** Verify the reference visual contract and upstream behavior together.

**3. Exact scope of code changes:**

- Test two-way state/ref changes, native form submission/reset/required/disabled behavior and labels
- Exercise unchecked strong track, checked color, thumb override and RTL travel
- Verify reduced-motion and caller-event behavior

**4. Files/modules likely involved:**

- `tests/browser/switch.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/switch/`

**5. Required unit/integration tests:**

- State flows both directions without duplicate hidden inputs
- Form and keyboard behavior match the frozen pinned contract
- Visual track/thumb/RTL/motion states pass
- Theme changes propagate

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/switch.spec.ts
pnpm run test:components -- tests/components/switch-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Switch is fully qualified as the first stateful primitive wrapper.

**8. Commit message:** `test: qualify switch state forms and directional motion`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S105, not an unscheduled expansion.

### S105 — Freeze the Dialog family API and ownership cohort

**Contract anchors:** R06, R14, R20, R22, R26, R27, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Freeze the Dialog family API and ownership cohort.

**2. Purpose:** Map compound structure before exposing a partial family publicly.

**3. Exact scope of code changes:**

- Freeze Root/Trigger/Portal/Overlay/Content/Title/Description/Close exports and typed props
- Document binding/ref/snippet/portal and accessible name behavior
- Mark candidate assets unregistered until complete and define one source/style/export cohort

**4. Files/modules likely involved:**

- `specs/component-maps/dialog.md`
- `tests/components/dialog-types.test.ts`
- `tests/fixtures/dialog-candidate/`

**5. Required unit/integration tests:**

- Type fixtures cover open/ref bindings and supported snippets
- Separate Alert Dialog is not represented as a role toggle
- Candidate family is not yet installable

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/dialog-types.test.ts
pnpm run test:registry -- tests/registry/health.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Compound API and qualification boundary are explicit.

**8. Commit message:** `dialog: define the compound family contract`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S106, not an unscheduled expansion.

### S106 — Author Dialog root and trigger parts

**Contract anchors:** R03, R20, R21, R26, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Author Dialog root and trigger parts.

**2. Purpose:** Introduce state and activation forwarding in a small independently compiled change.

**3. Exact scope of code changes:**

- Add candidate Root/Trigger wrappers using pinned Bits parts
- Preserve open binding and trigger native/ref/snippet behavior
- Compile them in a candidate fixture composed with remaining raw primitive parts

**4. Files/modules likely involved:**

- `registry/ui/dialog/root.svelte`
- `registry/ui/dialog/trigger.svelte`
- `tests/components/dialog-root-trigger.test.ts`

**5. Required unit/integration tests:**

- Root state updates in both directions
- Trigger retains native activation/ref/delegation
- Existing registered catalog remains unaffected and valid

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/dialog-root-trigger.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** State/trigger parts are typed and verified without advertising an incomplete item.

**8. Commit message:** `dialog: forward root state and trigger behavior`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S107, not an unscheduled expansion.

### S107 — Author Dialog portal and overlay parts

**Contract anchors:** R20, R21, R23, R26, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Author Dialog portal and overlay parts.

**2. Purpose:** Expose portal placement as composition instead of hidden styling logic.

**3. Exact scope of code changes:**

- Add candidate Portal/Overlay wrappers with the frozen upstream target/ref/snippet API
- Preserve default body behavior and explicit custom target support
- Avoid copying computed theme variables or introducing convenience aliases

**4. Files/modules likely involved:**

- `registry/ui/dialog/portal.svelte`
- `registry/ui/dialog/overlay.svelte`
- `tests/components/dialog-portal-overlay.test.ts`

**5. Required unit/integration tests:**

- Parts compile in the candidate composition
- Default/custom target values preserve upstream types
- No browser global is accessed during module import/SSR

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/dialog-portal-overlay.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Portal and overlay parts are explicit and SSR-safe.

**8. Commit message:** `dialog: expose portal and overlay composition`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S108, not an unscheduled expansion.

### S108 — Author Dialog content forwarding

**Contract anchors:** R03, R20, R21, R27, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Author Dialog content forwarding.

**2. Purpose:** Keep focus/presence/dismissal behavior in Bits rather than recreating it.

**3. Exact scope of code changes:**

- Add candidate Content wrapper with class/ref/snippet forwarding
- Preserve native primitive focus/dismissal/presence controls
- Do not supply Rust layer/context/state machinery or role-based Alert Dialog emulation

**4. Files/modules likely involved:**

- `registry/ui/dialog/content.svelte`
- `tests/components/dialog-content.test.ts`

**5. Required unit/integration tests:**

- Content props and ref compile against pinned primitive
- Child/default rendering paths preserve required semantics
- No custom focus trap/layer stack is introduced

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/dialog-content.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Content preserves the primitive interaction boundary.

**8. Commit message:** `dialog: preserve primitive content behavior and refs`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S109, not an unscheduled expansion.

### S109 — Author Dialog title, description, and close parts

**Contract anchors:** R06, R20, R22, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md).

**1. Step title:** Author Dialog title, description, and close parts.

**2. Purpose:** Complete the accessible labeling and explicit close composition.

**3. Exact scope of code changes:**

- Add candidate text/close wrappers with native/Bits types and design classes
- Preserve title/description ID relationships and close semantics
- Keep all public names aligned with the approved flat scheme

**4. Files/modules likely involved:**

- `registry/ui/dialog/title.svelte`
- `registry/ui/dialog/description.svelte`
- `registry/ui/dialog/close.svelte`
- `tests/components/dialog-labeling.test.ts`

**5. Required unit/integration tests:**

- Accessible relationships are wired by primitive composition
- Close forwards ref/events/snippet as frozen
- Optional description does not manufacture invalid aria references

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/dialog-labeling.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** All required compound parts exist and are individually verified.

**8. Commit message:** `dialog: complete labeling and close components`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S110, not an unscheduled expansion.

### S110 — Map Dialog managed CSS to the actual compound DOM

**Contract anchors:** R04, R07, R22, R25, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Map Dialog managed CSS to the actual compound DOM.

**2. Purpose:** Preserve design intent while adapting source selectors to Bits parts.

**3. Exact scope of code changes:**

- Author overlay/content/title/description/close styles in one managed dialog block
- Map presence/state selectors to pinned output
- Preserve overlay-radius role, themes, focus and reduced-motion behavior

**4. Files/modules likely involved:**

- `registry/styles/dialog.css`
- `tests/components/dialog-css.test.ts`
- `specs/component-maps/dialog.md`

**5. Required unit/integration tests:**

- Every required selector maps to an actual candidate DOM part
- Tokens/fallbacks and state/motion hooks validate
- No global raw-Bits selectors or Tailwind syntax appear

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/dialog-css.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Dialog CSS is mapped explicitly, not blindly copied.

**8. Commit message:** `dialog: map managed styles to primitive markup`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S111, not an unscheduled expansion.

### S111 — Register the complete Dialog family

**Contract anchors:** R05, R06, R08, R14, R26, R28, R32, R33, R34. [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Register the complete Dialog family.

**2. Purpose:** Make the compound item installable only when all parts and styles exist.

**3. Exact scope of code changes:**

- Add dialog manifest, compound barrel and root export declarations
- Register all required source/CSS/metadata dependencies in one compatibility unit
- Generate the consumer fixture through the real CLI

**4. Files/modules likely involved:**

- `registry/ui/dialog.json`
- `registry/ui/dialog/index.ts`
- `registry/registry.json`
- `tests/integration/dialog-install.test.ts`

**5. Required unit/integration tests:**

- CLI installs exactly the approved compound tree and exports
- No unnecessary parent barrel/identity shim appears
- All installed parts typecheck and build
- Registry health and ownership validate

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/dialog-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The full Dialog family is a qualified local-source item.

**8. Commit message:** `dialog: register the complete compound component family`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S112, not an unscheduled expansion.

### S112 — Qualify Dialog keyboard, focus, dismissal, and presence

**Contract anchors:** R20, R22, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Qualify Dialog keyboard, focus, dismissal, and presence.

**2. Purpose:** Verify actual generated overlay interactions rather than attributing correctness to a dependency.

**3. Exact scope of code changes:**

- Add browser cases for accessible names, trap/return focus, Escape/outside interaction and close
- Exercise controlled/uncontrolled open/ref updates and interrupted presence transitions
- Test nested dialog composition as supported by pinned semantics

**4. Files/modules likely involved:**

- `tests/browser/dialog-interactions.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/dialog/`

**5. Required unit/integration tests:**

- Focus cannot escape modal content accidentally and returns correctly
- Dismissal/events honor forwarded policy
- Missing accessible-name cases are caught
- Rapid open/close does not strand focus

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/dialog-interactions.spec.ts
pnpm run test:components -- tests/components/dialog-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Dialog interaction behavior is browser-qualified.

**8. Commit message:** `test: qualify dialog focus dismissal and presence`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S113, not an unscheduled expansion.

### S113 — Qualify Dialog portal theme scopes

**Contract anchors:** R23, R24, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify Dialog portal theme scopes.

**2. Purpose:** Prove documented global and nested theme behavior.

**3. Exact scope of code changes:**

- Add global document-theme and nested custom-portal-host fixtures
- Test theme changes while open and document clipping/stacking caveats
- Confirm no computed-theme inline-copy mechanism appears

**4. Files/modules likely involved:**

- `tests/browser/dialog-themes.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/dialog-themes/`
- `README.md`

**5. Required unit/integration tests:**

- Body-portal inherits documented document theme
- Custom host inherits nested tokens
- Scope changes propagate while open
- Adverse clipping example is documented rather than hidden

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/dialog-themes.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Portal theme strategy has explicit behavioral evidence.

**8. Commit message:** `test: qualify dialog global and nested theme scopes`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S114, not an unscheduled expansion.

### S114 — Qualify initial Dialog state through SSR and hydration

**Contract anchors:** R21, R22, R28, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Qualify initial Dialog state through SSR and hydration.

**2. Purpose:** Prevent browser-only fixes from concealing server render problems.

**3. Exact scope of code changes:**

- Test supported initial open/closed state, multiple instances and request-local identity
- Hydrate generated parts with browser error capture
- Keep source DOM/state behavior aligned with pinned primitive guarantees

**4. Files/modules likely involved:**

- `tests/browser/dialog-hydration.spec.ts`
- `tests/integration/dialog-ssr.test.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- No unexpected hydration/console errors
- Multiple requests/instances do not leak state or IDs
- Browser-only portal work does not access document during server module import

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/dialog-ssr.test.ts
pnpm run test:browser -- tests/browser/dialog-hydration.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Dialog is qualified for the SvelteKit rendering model.

**8. Commit message:** `test: qualify dialog ssr and hydration state`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S115, not an unscheduled expansion.

### S115 — Qualify the complete first vertical slice

**Contract anchors:** R02, R08, R13, R14, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Qualify the complete first vertical slice.

**2. Purpose:** Prove installation, customization, upgrade and browser behavior together before expanding the catalog.

**3. Exact scope of code changes:**

- Install tokens/spinner/button/switch/dialog through the built CLI in a clean fixture
- Apply synthetic safe/conflicting upgrades and customization
- Pack/install and repeat the core workflow outside source layout

**4. Files/modules likely involved:**

- `tests/integration/core-workflow.test.ts`
- `tests/package/core-runtime.test.ts`
- `README.md`

**5. Required unit/integration tests:**

- Core tree/exports/styles/metadata remain deterministic
- Local edits and cohorts behave as specified
- Generated app passes type/build/browser checks
- Packed CLI reads all assets without CWD assumptions

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/core-workflow.test.ts
pnpm run test:package -- tests/package/core-runtime.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
pnpm run test:browser
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The initial core is independently usable and cumulatively verified.

**8. Commit message:** `test: qualify the complete source-first core workflow`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S116, not an unscheduled expansion.

## M07 — Distinct alert-dialog and early floating-menu qualification

### S116 — Freeze a distinct Alert Dialog API

**Contract anchors:** R03, R20, R22, R27, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Freeze a distinct Alert Dialog API.

**2. Purpose:** Preserve the approved separation from generic Dialog role switching.

**3. Exact scope of code changes:**

- Inspect pinned Alert Dialog parts and freeze exact flat family exports
- Map trigger/content/label/action/cancel semantics and theme/portal expectations
- Create typed positive/negative fixtures without inventing application confirmation state

**4. Files/modules likely involved:**

- `specs/component-maps/alert-dialog.md`
- `tests/components/alert-dialog-types.test.ts`

**5. Required unit/integration tests:**

- Types use the distinct primitive contract
- Generic Dialog role-toggle shortcut is not exposed
- Candidate item stays unregistered until complete

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/alert-dialog-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Alert Dialog contract is distinct and scoped.

**8. Commit message:** `alert-dialog: define distinct confirmation semantics`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S117, not an unscheduled expansion.

### S117 — Author Alert Dialog state and activation parts

**Contract anchors:** R03, R20, R27, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Author Alert Dialog state and activation parts.

**2. Purpose:** Keep confirmation interaction state in its proper primitive.

**3. Exact scope of code changes:**

- Add candidate Root/Trigger wrappers with frozen bindings/refs/snippets
- Use distinct Bits Alert Dialog imports
- Compose candidate tests with remaining raw primitive parts

**4. Files/modules likely involved:**

- `registry/ui/alert-dialog/root.svelte`
- `registry/ui/alert-dialog/trigger.svelte`
- `tests/components/alert-dialog-state.test.ts`

**5. Required unit/integration tests:**

- State binding flows both ways
- Trigger retains correct activation/ref semantics
- No generic Dialog state implementation is reused incorrectly

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/alert-dialog-state.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Alert Dialog activation is typed and independently qualified.

**8. Commit message:** `alert-dialog: forward primitive state and activation`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S118, not an unscheduled expansion.

### S118 — Author Alert Dialog portal and content parts

**Contract anchors:** R20, R21, R23, R27, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Author Alert Dialog portal and content parts.

**2. Purpose:** Preserve the separate focus/dismissal behavior while exposing styling.

**3. Exact scope of code changes:**

- Add frozen Portal/Overlay/Content parts using actual pinned primitive types
- Forward configuration without generic Dialog dismissal assumptions
- Retain SSR-safe portal and explicit theme target composition

**4. Files/modules likely involved:**

- `registry/ui/alert-dialog/`
- `tests/components/alert-dialog-content.test.ts`

**5. Required unit/integration tests:**

- Content/ref/portal props compile
- No role-only emulation or custom focus trap is introduced
- Candidate SSR render avoids browser-global access

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/alert-dialog-content.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Alert Dialog content remains behaviorally distinct.

**8. Commit message:** `alert-dialog: preserve content and portal behavior`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S119, not an unscheduled expansion.

### S119 — Author Alert Dialog labeling and decision controls

**Contract anchors:** R03, R20, R22, R27, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Author Alert Dialog labeling and decision controls.

**2. Purpose:** Expose accessible confirmation composition without application business logic.

**3. Exact scope of code changes:**

- Implement exactly the Title/Description/action/cancel parts frozen from pinned API
- Preserve accessible relationships and native button behaviors
- Do not implement confirmation promises, network state or queues

**4. Files/modules likely involved:**

- `registry/ui/alert-dialog/`
- `tests/components/alert-dialog-actions.test.ts`

**5. Required unit/integration tests:**

- Required names/description associations render
- Action and cancel types/refs/events preserve primitive semantics
- No unsolicited application state is added

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/alert-dialog-actions.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The family has complete accessible decision composition.

**8. Commit message:** `alert-dialog: complete labeling and decision controls`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S120, not an unscheduled expansion.

### S120 — Style and register the complete Alert Dialog family

**Contract anchors:** R04, R06, R14, R27, R32, R33, R34. [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Style and register the complete Alert Dialog family.

**2. Purpose:** Install the distinct component with plain CSS and explicit ownership.

**3. Exact scope of code changes:**

- Map supported visual styling to kit tokens and exact Alert Dialog DOM
- Add manifest/barrel/root exports and source-style cohort
- Register only the completed family

**4. Files/modules likely involved:**

- `registry/styles/alert-dialog.css`
- `registry/ui/alert-dialog.json`
- `registry/ui/alert-dialog/index.ts`
- `registry/registry.json`
- `tests/integration/alert-dialog-install.test.ts`

**5. Required unit/integration tests:**

- Generated family compiles/builds through CLI installation
- CSS/state selectors and dependency plan validate
- Generic Dialog and Alert Dialog exports do not collide

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/alert-dialog-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Alert Dialog is separately installable and app-owned.

**8. Commit message:** `alert-dialog: register the distinct styled family`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S121, not an unscheduled expansion.

### S121 — Qualify Alert Dialog focus and confirmation behavior

**Contract anchors:** R20, R22, R27, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Qualify Alert Dialog focus and confirmation behavior.

**2. Purpose:** Verify separate primitive behavior in a real generated app.

**3. Exact scope of code changes:**

- Add browser naming/focus/decision/cancel/dismissal cases from the frozen API
- Test nested interaction and open state bindings
- Verify shared styling does not collapse behavioral distinctions

**4. Files/modules likely involved:**

- `tests/browser/alert-dialog.spec.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- Action/cancel/focus restoration follow actual primitive contract
- Required accessible content is present
- Outside/Escape behavior is asserted from pinned contract rather than assumed identical to Dialog

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/alert-dialog.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Distinct confirmation behavior is proven.

**8. Commit message:** `test: qualify alert dialog focus and decisions`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S122, not an unscheduled expansion.

### S122 — Freeze Menu source-parity and floating APIs

**Contract anchors:** R03, R06, R20, R26, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md).

**1. Step title:** Freeze Menu source-parity and floating APIs.

**2. Purpose:** Exercise floating placement early without adopting every upstream menu feature.

**3. Exact scope of code changes:**

- Map source menu family to pinned Dropdown Menu types and kit Menu names
- Freeze required part inventory, value/event/ref/snippet contracts and source/style cohort
- Document optional upstream parts excluded from current source parity

**4. Files/modules likely involved:**

- `specs/component-maps/menu.md`
- `tests/components/menu-types.test.ts`

**5. Required unit/integration tests:**

- Required Menu types compile with discriminated cases preserved
- No arbitrary full upstream catalog is assumed
- Floating child contract records wrapperProps and inner props distinctly

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/menu-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Menu has a precise source-parity scope and floating contract.

**8. Commit message:** `menu: define source parity and floating contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S123, not an unscheduled expansion.

### S123 — Author Menu root and trigger wrappers

**Contract anchors:** R03, R20, R26, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Author Menu root and trigger wrappers.

**2. Purpose:** Preserve menu activation state without recreating keyboard machinery.

**3. Exact scope of code changes:**

- Implement candidate Root/Trigger with typed open/ref/snippet forwarding
- Preserve caller event behavior and disabled activation
- Compose candidate tests with raw remaining primitive parts

**4. Files/modules likely involved:**

- `registry/ui/menu/root.svelte`
- `registry/ui/menu/trigger.svelte`
- `tests/components/menu-state.test.ts`

**5. Required unit/integration tests:**

- Controlled/uncontrolled open transitions compile and work
- Trigger attributes/ref/delegation remain intact
- No kit keyboard state engine appears

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/menu-state.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Menu state/activation parts are independently verified.

**8. Commit message:** `menu: forward primitive state and activation`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S124, not an unscheduled expansion.

### S124 — Author Menu portal and floating content wrappers

**Contract anchors:** R20, R21, R23, R24, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Author Menu portal and floating content wrappers.

**2. Purpose:** Preserve required positioning structure through local styling wrappers.

**3. Exact scope of code changes:**

- Add candidate Portal/Content parts using pinned types
- Keep outer positioning wrapper and inner styled content separate in delegated rendering
- Do not strip primitive runtime styles to make an unsupported CSP claim

**4. Files/modules likely involved:**

- `registry/ui/menu/portal.svelte`
- `registry/ui/menu/content.svelte`
- `tests/components/menu-content.test.ts`

**5. Required unit/integration tests:**

- Default and child rendering retain required wrapperProps/props layout
- Ref/placement props typecheck
- SSR does not eagerly access DOM globals

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/menu-content.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Menu positioning contract survives wrapper composition.

**8. Commit message:** `menu: preserve floating content and portal structure`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S125, not an unscheduled expansion.

### S125 — Author Menu source-required item parts

**Contract anchors:** R03, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Author Menu source-required item parts.

**2. Purpose:** Complete exactly the approved source-parity interaction surface.

**3. Exact scope of code changes:**

- Implement frozen required item/group/label/separator or selection parts from the menu worksheet
- Preserve disabled/selection/event cancellation and relevant typed unions
- Exclude unsupported optional parts rather than stubbing them

**4. Files/modules likely involved:**

- `registry/ui/menu/`
- `tests/components/menu-items.test.ts`

**5. Required unit/integration tests:**

- Every frozen part compiles with positive/negative types
- Disabled and event forwarding behavior is covered
- No required part is a placeholder-green export

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/menu-items.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The specified menu parts are complete; extra upstream scope is not introduced.

**8. Commit message:** `menu: complete source-required item composition`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S126, not an unscheduled expansion.

### S126 — Style and register the Menu family

**Contract anchors:** R04, R06, R08, R14, R26, R32, R33, R34. [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Style and register the Menu family.

**2. Purpose:** Make the first floating component installable through normal ownership machinery.

**3. Exact scope of code changes:**

- Map menu CSS to actual inner content/item DOM and kit tokens
- Add manifest/barrel/root exports and dependency/cohort metadata
- Register qualified Menu only after all frozen parts exist

**4. Files/modules likely involved:**

- `registry/styles/menu.css`
- `registry/ui/menu.json`
- `registry/ui/menu/index.ts`
- `registry/registry.json`
- `tests/integration/menu-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated menu tree compiles/builds
- Inner kit styles do not alter positioning wrapper
- Export/asset/block inventories validate
- Repeated add is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/menu-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Menu is installed using the same generator architecture as Dialog.

**8. Commit message:** `menu: register the floating family and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S127, not an unscheduled expansion.

### S127 — Qualify Menu keyboard selection and dismissal

**Contract anchors:** R20, R22, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Qualify Menu keyboard selection and dismissal.

**2. Purpose:** Verify real accessible menu interaction in generated output.

**3. Exact scope of code changes:**

- Test keyboard navigation/typeahead/activation/disabled items from the frozen API
- Verify selection/cancellation, Escape/outside dismissal and focus return
- Exercise nested menu/dialog interaction

**4. Files/modules likely involved:**

- `tests/browser/menu-keyboard.spec.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- Focus and selection outcomes match pinned primitive contract
- Disabled items do not activate
- Caller handlers/cancellation are not lost
- Nested overlay interaction restores appropriate focus

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/menu-keyboard.spec.ts
pnpm run test:components -- tests/components/menu-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Menu behavior is browser-qualified rather than assumed from dependency choice.

**8. Commit message:** `test: qualify menu keyboard selection and dismissal`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S128, not an unscheduled expansion.

### S128 — Qualify Menu placement, themes, and CSP limits

**Contract anchors:** R21, R23, R24, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify Menu placement, themes, and CSP limits.

**2. Purpose:** Resolve the port-specific floating integration risk early.

**3. Exact scope of code changes:**

- Exercise viewport/collision/scroll/custom portal/theme cases supported by pinned API
- Inspect actual runtime style output under a documented CSP test fixture
- Publish accurate supported limits without weakening required positioning structure

**4. Files/modules likely involved:**

- `tests/browser/menu-placement.spec.ts`
- `tests/browser/menu-csp.spec.ts`
- `specs/component-maps/menu.md`
- `README.md`

**5. Required unit/integration tests:**

- Floating content stays positioned under tested scroll/viewport changes
- Global/nested themes work as documented
- CSP test reports actual pass/limitation instead of asserting zero inline style
- No hydration workaround disables SSR

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/menu-placement.spec.ts
pnpm run test:browser -- tests/browser/menu-csp.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The highest-risk floating/theme/CSP boundary has measured evidence.

**8. Commit message:** `test: qualify menu placement themes and csp limits`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S129, not an unscheduled expansion.

## M08 — Remaining forms and disclosure components

### S129 — Freeze Checkbox props and semantic mapping

**Contract anchors:** R03, R07, R20, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Freeze Checkbox props and semantic mapping.

**2. Purpose:** Derive a precise checkbox API from approved source intent and actual pinned types before implementation.

**3. Exact scope of code changes:**

- Inspect the source counterpart and freeze checked/ref/form props, source-supported indeterminate state and indicator composition
- Record a thin Bits Checkbox wrapper, exact flat exports, class/state mapping, dependencies and source/style coupling
- Add positive/negative type fixtures; do not add unrelated variants or hooks

**4. Files/modules likely involved:**

- `specs/component-maps/checkbox.md`
- `tests/components/checkbox-types.test.ts`
- `registry/ui/checkbox.types.ts only when a separate public type file is justified`

**5. Required unit/integration tests:**

- The frozen checkbox props and supported/omitted hooks are explicit
- Valid native/primitive attributes compile and invalid values fail
- Checked/unchecked and supported indeterminate cases work; native required/disabled/reset submission is preserved; indicator geometry remains fixed; no duplicate form input is introduced

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/checkbox-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Checkbox has a bounded source-anchored API and test contract.

**8. Commit message:** `checkbox: define typed source and semantic contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S130, not an unscheduled expansion.

### S130 — Generate Checkbox source and managed styles

**Contract anchors:** R02, R03, R04, R06, R07, R08, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Generate Checkbox source and managed styles.

**2. Purpose:** Install checkbox as application-owned source through the existing registry, not a new runtime path.

**3. Exact scope of code changes:**

- Implement state/ref binding, native form participation, label association and noninteractive indicator markup using a thin Bits Checkbox wrapper
- Map fixed-size source indicator geometry, semantic selection color, focus/disabled states and radius properties into one kit-class-scoped managed CSS block
- Add explicit targets/exports/dependencies and register only the complete item; generate the consumer through the CLI

**4. Files/modules likely involved:**

- `registry/ui/checkbox.svelte or frozen compound directory`
- `registry/ui/checkbox.json`
- `registry/styles/checkbox.css`
- `registry/registry.json`
- `tests/integration/checkbox-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated checkbox source/type exports compile and build
- Registry ownership and dependency closure are correct
- Unrelated app files are preserved and repeat install is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/checkbox-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Checkbox is completely registered with editable source and plain CSS.

**8. Commit message:** `checkbox: generate local source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S131, not an unscheduled expansion.

### S131 — Qualify Checkbox behavior in the generated app

**Contract anchors:** R03, R07, R20, R22, R23, R25, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify Checkbox behavior in the generated app.

**2. Purpose:** Prove the exact checkbox semantics and mapped visual states rather than relying on template inspection.

**3. Exact scope of code changes:**

- Add browser assertions for Checked/unchecked and supported indeterminate cases work; native required/disabled/reset submission is preserved; indicator geometry remains fixed; no duplicate form input is introduced
- Exercise caller classes/attributes and relevant refs/bindings from the frozen API
- Check applicable theme, focus, direction and reduced-motion states without inventing new behavior

**4. Files/modules likely involved:**

- `tests/browser/checkbox.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/checkbox/`
- `specs/component-maps/checkbox.md`

**5. Required unit/integration tests:**

- Checked/unchecked and supported indeterminate cases work; native required/disabled/reset submission is preserved; indicator geometry remains fixed; no duplicate form input is introduced
- No unexpected SSR/hydration/browser errors
- Computed style/state mapping matches the contract and any limits are documented

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/checkbox.spec.ts
pnpm run test:components -- tests/components/checkbox-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Checkbox is qualified end-to-end against its frozen contract.

**8. Commit message:** `test: qualify checkbox semantics and visual states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S132, not an unscheduled expansion.

### S132 — Freeze Radio group and item contracts

**Contract anchors:** R03, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Freeze Radio group and item contracts.

**2. Purpose:** Preserve selection typing and native form semantics without inventing a new radio abstraction.

**3. Exact scope of code changes:**

- Map source radio family to pinned Radio Group types and exact flat names
- Freeze value/ref/orientation/disabled/label/form semantics justified by source
- Define item and group composition plus CSS cohort

**4. Files/modules likely involved:**

- `specs/component-maps/radio.md`
- `tests/components/radio-types.test.ts`

**5. Required unit/integration tests:**

- Value type and supported native form props compile
- Unsupported props/hooks fail
- Group/item semantics and label relationships are explicit

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/radio-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Radio family scope is frozen before wrappers.

**8. Commit message:** `radio: define group selection and form contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S133, not an unscheduled expansion.

### S133 — Author Radio group and item wrappers

**Contract anchors:** R03, R20, R21, R28, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Author Radio group and item wrappers.

**2. Purpose:** Implement the behavior-preserving selection composition independently from public registration.

**3. Exact scope of code changes:**

- Create candidate group/item/indicator parts exactly as frozen
- Preserve two-way value/ref and item semantics
- Compose a candidate fixture with source-supported cases; do not advertise an incomplete item

**4. Files/modules likely involved:**

- `registry/ui/radio/ or frozen source layout`
- `tests/components/radio-parts.test.ts`

**5. Required unit/integration tests:**

- Value updates in both directions
- Item refs/attributes/disabled behavior and label composition work
- Candidate SSR build passes without module-global counters

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/radio-parts.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Radio parts are typed and ready for styling/registration.

**8. Commit message:** `radio: preserve primitive group and item behavior`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S134, not an unscheduled expansion.

### S134 — Style and register Radio selection

**Contract anchors:** R04, R06, R07, R25, R26, R32, R33, R34. [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Style and register Radio selection.

**2. Purpose:** Preserve the recognizable selection indicator design and explicit registry targets.

**3. Exact scope of code changes:**

- Map group/item/indicator CSS, focus/disabled and semantic colors
- Add manifest/export targets and dependencies with complete source/style cohort
- Generate a real consumer installation

**4. Files/modules likely involved:**

- `registry/styles/radio.css`
- `registry/ui/radio.json`
- `registry/registry.json`
- `tests/integration/radio-install.test.ts`

**5. Required unit/integration tests:**

- All generated names/paths match frozen map
- Radio mark geometry/colors and selectors match actual DOM
- Install closure/type/build and idempotence pass

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/radio-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Radio is a complete installable family.

**8. Commit message:** `radio: register selection styles and source targets`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S135, not an unscheduled expansion.

### S135 — Qualify Radio keyboard and form behavior

**Contract anchors:** R20, R22, R23, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify Radio keyboard and form behavior.

**2. Purpose:** Verify group semantics in generated application output.

**3. Exact scope of code changes:**

- Test arrow-key/group selection, disabled choices, bound value and native form/reset behavior
- Verify label/indicator/focus states under supported directions/themes
- Assert no redundant hidden inputs or broken names

**4. Files/modules likely involved:**

- `tests/browser/radio.spec.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- Group navigation and selection follow pinned contract
- Required/disabled/submission/reset cases pass
- Bound values and visual indicators remain synchronized

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/radio.spec.ts
pnpm run test:components -- tests/components/radio-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Radio form and keyboard parity is browser-qualified.

**8. Commit message:** `test: qualify radio navigation and form participation`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S136, not an unscheduled expansion.

### S136 — Freeze Tabs parts, value, and activation contracts

**Contract anchors:** R03, R20, R21, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Freeze Tabs parts, value, and activation contracts.

**2. Purpose:** Preserve tab-panel relationships and supported activation semantics.

**3. Exact scope of code changes:**

- Map required source tabs parts to pinned primitive types
- Freeze value/ref, orientation/activation options justified by source, snippets and mounted-state behavior
- Define exact flat exports and source/CSS cohort

**4. Files/modules likely involved:**

- `specs/component-maps/tabs.md`
- `tests/components/tabs-types.test.ts`

**5. Required unit/integration tests:**

- Typed value and supported options compile without union flattening
- Required part inventory and omitted extras are explicit
- Panel identity/labeling assumptions are recorded

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/tabs-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Tabs behavior is bounded and ready for independent parts.

**8. Commit message:** `tabs: define value activation and panel contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S137, not an unscheduled expansion.

### S137 — Author Tabs root and list wrappers

**Contract anchors:** R03, R20, R21, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Author Tabs root and list wrappers.

**2. Purpose:** Introduce typed tab state and grouping without duplicate keyboard machinery.

**3. Exact scope of code changes:**

- Add candidate Root/List parts with the frozen state/ref/snippet policy
- Forward supported orientation/activation options
- Compose candidate test with raw remaining primitive parts

**4. Files/modules likely involved:**

- `registry/ui/tabs/root.svelte`
- `registry/ui/tabs/list.svelte`
- `tests/components/tabs-root-list.test.ts`

**5. Required unit/integration tests:**

- Bound root value and list attributes compile
- Candidate SSR state is stable
- No new tab state engine or hidden global state appears

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/tabs-root-list.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Tabs state/group parts are independently qualified.

**8. Commit message:** `tabs: forward root state and list semantics`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S138, not an unscheduled expansion.

### S138 — Author Tabs trigger and content wrappers

**Contract anchors:** R20, R21, R22, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Author Tabs trigger and content wrappers.

**2. Purpose:** Preserve accessible activation and panel relationships.

**3. Exact scope of code changes:**

- Add candidate Trigger/Content with frozen value/disabled/ref/snippet forwarding
- Preserve pinned panel presence behavior
- Use appropriate kit classes without changing primitive semantic attributes

**4. Files/modules likely involved:**

- `registry/ui/tabs/trigger.svelte`
- `registry/ui/tabs/content.svelte`
- `tests/components/tabs-parts.test.ts`

**5. Required unit/integration tests:**

- Trigger/panel identifiers and relationships render correctly
- Disabled trigger and supported presence props retain types
- Caller handlers/snippets are not dropped

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/tabs-parts.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Tabs has complete source-parity behavior parts.

**8. Commit message:** `tabs: preserve trigger and panel relationships`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S139, not an unscheduled expansion.

### S139 — Style and register the Tabs family

**Contract anchors:** R04, R06, R14, R26, R32, R33, R34. [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Style and register the Tabs family.

**2. Purpose:** Expose a complete tabs installation with source-owned design.

**3. Exact scope of code changes:**

- Map tabs state/orientation/selected/focus styles to actual DOM
- Add explicit manifest/compound exports and dependency records
- Register only the qualified complete family

**4. Files/modules likely involved:**

- `registry/styles/tabs.css`
- `registry/ui/tabs.json`
- `registry/ui/tabs/index.ts`
- `registry/registry.json`
- `tests/integration/tabs-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated tab parts compile/build
- CSS state selectors and export paths validate
- Repeated install and safe sync preserve ownership

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/tabs-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Tabs installs with correct compound layout and managed CSS.

**8. Commit message:** `tabs: register the styled compound family`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S140, not an unscheduled expansion.

### S140 — Qualify Tabs keyboard activation and hydration

**Contract anchors:** R20, R21, R22, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Qualify Tabs keyboard activation and hydration.

**2. Purpose:** Verify actual tab accessibility and render behavior.

**3. Exact scope of code changes:**

- Test source-supported automatic/manual activation, orientation, disabled items and bound values
- Verify panel visibility/presence and relationships
- Exercise SSR initial selection and hydration

**4. Files/modules likely involved:**

- `tests/browser/tabs.spec.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- Keyboard navigation activates/focuses according to frozen options
- Disabled triggers and panel references remain correct
- Initial state hydrates without unexpected errors

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/tabs.spec.ts
pnpm run test:components -- tests/components/tabs-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Tabs is behaviorally and server-rendering qualified.

**8. Commit message:** `test: qualify tabs navigation and hydration`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S141, not an unscheduled expansion.

### S141 — Freeze Collapsible composition and presence contracts

**Contract anchors:** R03, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Freeze Collapsible composition and presence contracts.

**2. Purpose:** Keep disclosure primitive-backed and compositional.

**3. Exact scope of code changes:**

- Freeze source-required Root/Trigger/Content props/exports and open/ref binding
- Document content presence/motion and allowed snippet hooks
- Preserve accordion-like composition as a recipe, not a new state engine

**4. Files/modules likely involved:**

- `specs/component-maps/collapsible.md`
- `tests/components/collapsible-types.test.ts`

**5. Required unit/integration tests:**

- Typed controlled/uncontrolled cases compile
- Unsupported rendering hooks are explicit
- Presence contract does not copy Leptos ABI constants

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/collapsible-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Collapsible has a scoped disclosure contract.

**8. Commit message:** `collapsible: define disclosure and presence contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S142, not an unscheduled expansion.

### S142 — Author Collapsible primitive wrappers

**Contract anchors:** R03, R20, R21, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Author Collapsible primitive wrappers.

**2. Purpose:** Preserve state and disclosure semantics before visual registration.

**3. Exact scope of code changes:**

- Add candidate Root/Trigger/Content with pinned bindings/refs/snippets
- Preserve expanded/controlled relationships and presence hooks
- Avoid additional accordion behavior or custom transition state machinery

**4. Files/modules likely involved:**

- `registry/ui/collapsible/ or frozen source layout`
- `tests/components/collapsible-parts.test.ts`

**5. Required unit/integration tests:**

- Open state and trigger/content relationships are preserved
- Candidate SSR initial state passes
- Caller attributes and events remain present

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/collapsible-parts.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Disclosure parts are independently typed and usable.

**8. Commit message:** `collapsible: forward disclosure state and semantics`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S143, not an unscheduled expansion.

### S143 — Style and register Collapsible

**Contract anchors:** R04, R06, R14, R26, R32, R33, R34. [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Style and register Collapsible.

**2. Purpose:** Provide a complete source-owned disclosure item.

**3. Exact scope of code changes:**

- Map source styles to actual presence/state attributes and tokens
- Add registry targets/exports/dependencies and full source-style cohort
- Generate the installed consumer fixture

**4. Files/modules likely involved:**

- `registry/styles/collapsible.css`
- `registry/ui/collapsible.json`
- `registry/registry.json`
- `tests/integration/collapsible-install.test.ts`

**5. Required unit/integration tests:**

- Generated parts compile/build
- Presence and reduced-motion hooks map to real DOM
- Install/sync/export ownership is correct

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/collapsible-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Collapsible is installable without a separate interaction engine.

**8. Commit message:** `collapsible: register disclosure source and styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S144, not an unscheduled expansion.

### S144 — Qualify Collapsible interactions and composed disclosures

**Contract anchors:** R20, R21, R22, R29, R31, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [SCOPE_AND_ASSUMPTIONS.md](../specs/SCOPE_AND_ASSUMPTIONS.md).

**1. Step title:** Qualify Collapsible interactions and composed disclosures.

**2. Purpose:** Test disclosure semantics and the intended higher-level composition boundary.

**3. Exact scope of code changes:**

- Test open binding, keyboard activation, disabled state if supported and content presence
- Exercise multiple independent disclosures in an accordion-like example
- Verify reduced motion and initial hydration

**4. Files/modules likely involved:**

- `tests/browser/collapsible.spec.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- Disclosure names/expanded relationships are correct
- Multiple items do not share unintended state
- Rapid toggle/reduced-motion cases do not strand content
- Hydration passes

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/collapsible.spec.ts
pnpm run test:components -- tests/components/collapsible-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Disclosure behavior and composition limits are qualified.

**8. Commit message:** `test: qualify collapsible disclosure composition`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S145, not an unscheduled expansion.

### S145 — Freeze Field label, helper, and error composition

**Contract anchors:** R03, R20, R22, R28, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Freeze Field label, helper, and error composition.

**2. Purpose:** Avoid inventing a form library while preserving actual source field semantics.

**3. Exact scope of code changes:**

- Inspect source Field exports and freeze a Svelte-native equivalent
- Define control/label/description/error ID and ref/attribute behavior
- Decide actual primitive/native parts and stable identity source from pinned evidence

**4. Files/modules likely involved:**

- `specs/component-maps/field.md`
- `tests/components/field-types.test.ts`

**5. Required unit/integration tests:**

- Positive native form attributes and composed controls compile
- Required label/helper/error relationships are explicitly specified
- No schema-validation engine or form-state store is introduced

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/field-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Field has a source-anchored semantic contract.

**8. Commit message:** `field: define native label helper and error contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S146, not an unscheduled expansion.

### S146 — Author Field semantic source parts

**Contract anchors:** R03, R20, R21, R22, R28, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Author Field semantic source parts.

**2. Purpose:** Implement accessible composition without generated global state.

**3. Exact scope of code changes:**

- Add frozen field/control/label/helper/error parts or single-file source shape
- Preserve native attributes, refs and association IDs
- Compose with kit controls only where the source contract calls for it

**4. Files/modules likely involved:**

- `registry/ui/field.svelte or frozen field directory`
- `tests/components/field-parts.test.ts`

**5. Required unit/integration tests:**

- Labels target actual controls
- Helpers/errors only create valid described-by references
- Multiple instances and SSR do not reuse unsafe IDs
- Native events/attributes are retained

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/field-parts.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Field semantic composition is implemented without a new form engine.

**8. Commit message:** `field: preserve native control associations`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S147, not an unscheduled expansion.

### S147 — Style and register Field

**Contract anchors:** R02, R04, R06, R10, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Style and register Field.

**2. Purpose:** Install complete source-owned field presentation.

**3. Exact scope of code changes:**

- Map source field/error/helper states to kit CSS tokens/classes
- Add exact manifest/export/dependency targets
- Register only complete frozen source and generate consumer fixture

**4. Files/modules likely involved:**

- `registry/styles/field.css`
- `registry/ui/field.json`
- `registry/registry.json`
- `tests/integration/field-install.test.ts`

**5. Required unit/integration tests:**

- Generated fields typecheck/build
- CSS states match actual rendered parts
- No unrequested form library dependency is emitted

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/field-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Field installs through normal source/CSS ownership.

**8. Commit message:** `field: register accessible source and field styling`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S148, not an unscheduled expansion.

### S148 — Qualify Field labels, validation presentation, and form lifecycle

**Contract anchors:** R20, R21, R22, R28, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Qualify Field labels, validation presentation, and form lifecycle.

**2. Purpose:** Verify semantic relationships across native and kit controls.

**3. Exact scope of code changes:**

- Test label activation, helper/error references, required/disabled native props and reset
- Cover multiple fields and dynamic error presence
- Assert no request-global ID state or phantom ARIA references

**4. Files/modules likely involved:**

- `tests/browser/field.spec.ts`
- `tests/integration/field-ssr.test.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- Label/control and described-by relationships stay valid
- Form lifecycle and focus behavior are preserved
- Multiple-instance SSR/hydration produces stable correct IDs

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/field.spec.ts
pnpm run test:integration -- tests/integration/field-ssr.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Field semantics are browser and SSR qualified.

**8. Commit message:** `test: qualify field associations and form lifecycle`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S149, not an unscheduled expansion.

## M09 — Native navigation, surfaces, feedback, and identity parity

### S149 — Freeze Anchor props and semantic mapping

**Contract anchors:** R03, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Freeze Anchor props and semantic mapping.

**2. Purpose:** Derive a precise anchor API from approved source intent and actual pinned types before implementation.

**3. Exact scope of code changes:**

- Inspect the source counterpart and freeze source-supported anchor presentation, href/target/rel/download/data attributes, refs and children
- Record a native Svelte anchor, exact flat exports, class/state mapping, dependencies and source/style coupling
- Add positive/negative type fixtures; do not add unrelated variants or hooks

**4. Files/modules likely involved:**

- `specs/component-maps/anchor.md`
- `tests/components/anchor-types.test.ts`
- `registry/ui/anchor.types.ts only when a separate public type file is justified`

**5. Required unit/integration tests:**

- The frozen anchor props and supported/omitted hooks are explicit
- Valid native/primitive attributes compile and invalid values fail
- Native keyboard navigation and href/target/rel/download behavior are preserved; caller attributes/classes survive; no button activation semantics are synthesized

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/anchor-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Anchor has a bounded source-anchored API and test contract.

**8. Commit message:** `anchor: define typed source and semantic contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S150, not an unscheduled expansion.

### S150 — Generate Anchor source and managed styles

**Contract anchors:** R02, R03, R04, R06, R08, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Generate Anchor source and managed styles.

**2. Purpose:** Install anchor as application-owned source through the existing registry, not a new runtime path.

**3. Exact scope of code changes:**

- Implement native navigation and typed anchor forwarding without role-button or polymorphic Button behavior using a native Svelte anchor
- Map source anchor link/hover/focus/disabled-like presentation only where semantically justified into one kit-class-scoped managed CSS block
- Add explicit targets/exports/dependencies and register only the complete item; generate the consumer through the CLI

**4. Files/modules likely involved:**

- `registry/ui/anchor.svelte or frozen compound directory`
- `registry/ui/anchor.json`
- `registry/styles/anchor.css`
- `registry/registry.json`
- `tests/integration/anchor-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated anchor source/type exports compile and build
- Registry ownership and dependency closure are correct
- Unrelated app files are preserved and repeat install is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/anchor-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Anchor is completely registered with editable source and plain CSS.

**8. Commit message:** `anchor: generate local source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S151, not an unscheduled expansion.

### S151 — Qualify Anchor behavior in the generated app

**Contract anchors:** R03, R20, R22, R23, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify Anchor behavior in the generated app.

**2. Purpose:** Prove the exact anchor semantics and mapped visual states rather than relying on template inspection.

**3. Exact scope of code changes:**

- Add browser assertions for Native keyboard navigation and href/target/rel/download behavior are preserved; caller attributes/classes survive; no button activation semantics are synthesized
- Exercise caller classes/attributes and relevant refs/bindings from the frozen API
- Check applicable theme, focus, direction and reduced-motion states without inventing new behavior

**4. Files/modules likely involved:**

- `tests/browser/anchor.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/anchor/`
- `specs/component-maps/anchor.md`

**5. Required unit/integration tests:**

- Native keyboard navigation and href/target/rel/download behavior are preserved; caller attributes/classes survive; no button activation semantics are synthesized
- No unexpected SSR/hydration/browser errors
- Computed style/state mapping matches the contract and any limits are documented

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/anchor.spec.ts
pnpm run test:components -- tests/components/anchor-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Anchor is qualified end-to-end against its frozen contract.

**8. Commit message:** `test: qualify anchor semantics and visual states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S152, not an unscheduled expansion.

### S152 — Freeze the optional Router Link recipe

**Contract anchors:** R03, R20, R26, R28, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Freeze the optional Router Link recipe.

**2. Purpose:** Preserve item-name familiarity without copying a Leptos router runtime.

**3. Exact scope of code changes:**

- Inspect target SvelteKit link/base-path conventions and source router-link presentation
- Freeze a thin optional native-anchor recipe and exact exports
- Document any justified Anchor dependency without inventing a routing service

**4. Files/modules likely involved:**

- `specs/component-maps/router-link.md`
- `tests/components/router-link-types.test.ts`

**5. Required unit/integration tests:**

- Native href and supported link options typecheck
- Base-path behavior is explicit and target-derived
- No new router package/context/store is introduced

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/router-link-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The optional recipe boundary is documented and precise.

**8. Commit message:** `router-link: define the native sveltekit link recipe`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S153, not an unscheduled expansion.

### S153 — Generate the thin Router Link recipe

**Contract anchors:** R02, R06, R10, R28, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md).

**1. Step title:** Generate the thin Router Link recipe.

**2. Purpose:** Make the optional item usable through normal local-source installation.

**3. Exact scope of code changes:**

- Implement frozen native anchor recipe using direct sibling reuse where justified
- Reuse or explicitly own styles without duplicate conflicting blocks
- Add manifest/exports and dependencies only for actual needs

**4. Files/modules likely involved:**

- `registry/ui/router-link.svelte`
- `registry/ui/router-link.json`
- `optional registry/styles/router-link.css`
- `registry/registry.json`
- `tests/integration/router-link-install.test.ts`

**5. Required unit/integration tests:**

- CLI installs only the selected recipe and required dependencies
- Generated source typechecks/builds
- No Leptos runtime or unused navigation dependency appears

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/router-link-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Router Link is a thin local optional recipe, not a new router.

**8. Commit message:** `router-link: generate the optional native link recipe`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S154, not an unscheduled expansion.

### S154 — Qualify Router Link navigation and document the recipe

**Contract anchors:** R20, R22, R28, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Qualify Router Link navigation and document the recipe.

**2. Purpose:** Verify SvelteKit integration rather than assuming a styled anchor is enough.

**3. Exact scope of code changes:**

- Test internal/external/native navigation cases and supported base/link options
- Compare native anchor semantics and preserve user attributes
- Document optional install and composition with Anchor/Button

**4. Files/modules likely involved:**

- `tests/browser/router-link.spec.ts`
- `README.md`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- Internal navigation works with target configuration
- External/download/target behavior stays native
- No duplicated navigation handlers or router state is introduced

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/router-link.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The optional recipe is verified and explained without architectural inflation.

**8. Commit message:** `test: qualify the native router link recipe`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S155, not an unscheduled expansion.

### S155 — Freeze Avatar props and semantic mapping

**Contract anchors:** R03, R20, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Freeze Avatar props and semantic mapping.

**2. Purpose:** Derive a precise avatar API from approved source intent and actual pinned types before implementation.

**3. Exact scope of code changes:**

- Inspect the source counterpart and freeze source image/fallback/loading/error states, alternate text, sizes and exported parts actually needed
- Record native Svelte image/fallback markup or a thin primitive justified by the frozen source map, exact flat exports, class/state mapping, dependencies and source/style coupling
- Add positive/negative type fixtures; do not add unrelated variants or hooks

**4. Files/modules likely involved:**

- `specs/component-maps/avatar.md`
- `tests/components/avatar-types.test.ts`
- `registry/ui/avatar.types.ts only when a separate public type file is justified`

**5. Required unit/integration tests:**

- The frozen avatar props and supported/omitted hooks are explicit
- Valid native/primitive attributes compile and invalid values fail
- Image load/failure/fallback transitions are exercised; meaningful alternate text is retained; decorative use avoids redundant naming; multiple instances do not leak loading state

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/avatar-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Avatar has a bounded source-anchored API and test contract.

**8. Commit message:** `avatar: define typed source and semantic contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S156, not an unscheduled expansion.

### S156 — Generate Avatar source and managed styles

**Contract anchors:** R02, R03, R04, R06, R08, R20, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Generate Avatar source and managed styles.

**2. Purpose:** Install avatar as application-owned source through the existing registry, not a new runtime path.

**3. Exact scope of code changes:**

- Implement image success/failure/fallback behavior with correct accessible text and caller attributes using native Svelte image/fallback markup or a thin primitive justified by the frozen source map
- Map source avatar dimensions, shape-critical/radius rules, fallback surface and semantic colors into one kit-class-scoped managed CSS block
- Add explicit targets/exports/dependencies and register only the complete item; generate the consumer through the CLI

**4. Files/modules likely involved:**

- `registry/ui/avatar.svelte or frozen compound directory`
- `registry/ui/avatar.json`
- `registry/styles/avatar.css`
- `registry/registry.json`
- `tests/integration/avatar-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated avatar source/type exports compile and build
- Registry ownership and dependency closure are correct
- Unrelated app files are preserved and repeat install is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/avatar-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Avatar is completely registered with editable source and plain CSS.

**8. Commit message:** `avatar: generate local source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S157, not an unscheduled expansion.

### S157 — Qualify Avatar behavior in the generated app

**Contract anchors:** R03, R20, R22, R23, R25, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify Avatar behavior in the generated app.

**2. Purpose:** Prove the exact avatar semantics and mapped visual states rather than relying on template inspection.

**3. Exact scope of code changes:**

- Add browser assertions for Image load/failure/fallback transitions are exercised; meaningful alternate text is retained; decorative use avoids redundant naming; multiple instances do not leak loading state
- Exercise caller classes/attributes and relevant refs/bindings from the frozen API
- Check applicable theme, focus, direction and reduced-motion states without inventing new behavior

**4. Files/modules likely involved:**

- `tests/browser/avatar.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/avatar/`
- `specs/component-maps/avatar.md`

**5. Required unit/integration tests:**

- Image load/failure/fallback transitions are exercised; meaningful alternate text is retained; decorative use avoids redundant naming; multiple instances do not leak loading state
- No unexpected SSR/hydration/browser errors
- Computed style/state mapping matches the contract and any limits are documented

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/avatar.spec.ts
pnpm run test:components -- tests/components/avatar-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Avatar is qualified end-to-end against its frozen contract.

**8. Commit message:** `test: qualify avatar semantics and visual states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S158, not an unscheduled expansion.

### S158 — Freeze Badge props and semantic mapping

**Contract anchors:** R03, R20, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Freeze Badge props and semantic mapping.

**2. Purpose:** Derive a precise badge API from approved source intent and actual pinned types before implementation.

**3. Exact scope of code changes:**

- Inspect the source counterpart and freeze source-supported variants, children/attributes and semantic text
- Record native typed Svelte presentation, exact flat exports, class/state mapping, dependencies and source/style coupling
- Add positive/negative type fixtures; do not add unrelated variants or hooks

**4. Files/modules likely involved:**

- `specs/component-maps/badge.md`
- `tests/components/badge-types.test.ts`
- `registry/ui/badge.types.ts only when a separate public type file is justified`

**5. Required unit/integration tests:**

- The frozen badge props and supported/omitted hooks are explicit
- Valid native/primitive attributes compile and invalid values fail
- Source variants render meaningful text; caller attributes/classes survive; computed theme/radius values and actual foreground/background combinations are checked

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/badge-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Badge has a bounded source-anchored API and test contract.

**8. Commit message:** `badge: define typed source and semantic contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S159, not an unscheduled expansion.

### S159 — Generate Badge source and managed styles

**Contract anchors:** R02, R03, R04, R06, R08, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Generate Badge source and managed styles.

**2. Purpose:** Install badge as application-owned source through the existing registry, not a new runtime path.

**3. Exact scope of code changes:**

- Implement small presentational label markup without interactive or business behavior using native typed Svelte presentation
- Map source badge token/variant/shape vocabulary without adding a new palette into one kit-class-scoped managed CSS block
- Add explicit targets/exports/dependencies and register only the complete item; generate the consumer through the CLI

**4. Files/modules likely involved:**

- `registry/ui/badge.svelte or frozen compound directory`
- `registry/ui/badge.json`
- `registry/styles/badge.css`
- `registry/registry.json`
- `tests/integration/badge-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated badge source/type exports compile and build
- Registry ownership and dependency closure are correct
- Unrelated app files are preserved and repeat install is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/badge-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Badge is completely registered with editable source and plain CSS.

**8. Commit message:** `badge: generate local source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S160, not an unscheduled expansion.

### S160 — Qualify Badge behavior in the generated app

**Contract anchors:** R03, R20, R22, R23, R25, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify Badge behavior in the generated app.

**2. Purpose:** Prove the exact badge semantics and mapped visual states rather than relying on template inspection.

**3. Exact scope of code changes:**

- Add browser assertions for Source variants render meaningful text; caller attributes/classes survive; computed theme/radius values and actual foreground/background combinations are checked
- Exercise caller classes/attributes and relevant refs/bindings from the frozen API
- Check applicable theme, focus, direction and reduced-motion states without inventing new behavior

**4. Files/modules likely involved:**

- `tests/browser/badge.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/badge/`
- `specs/component-maps/badge.md`

**5. Required unit/integration tests:**

- Source variants render meaningful text; caller attributes/classes survive; computed theme/radius values and actual foreground/background combinations are checked
- No unexpected SSR/hydration/browser errors
- Computed style/state mapping matches the contract and any limits are documented

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/badge.spec.ts
pnpm run test:components -- tests/components/badge-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Badge is qualified end-to-end against its frozen contract.

**8. Commit message:** `test: qualify badge semantics and visual states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S161, not an unscheduled expansion.

### S161 — Freeze Card props and semantic mapping

**Contract anchors:** R03, R20, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Freeze Card props and semantic mapping.

**2. Purpose:** Derive a precise card API from approved source intent and actual pinned types before implementation.

**3. Exact scope of code changes:**

- Inspect the source counterpart and freeze source-supported surface parts, content composition and native attributes
- Record native compositional Svelte markup, exact flat exports, class/state mapping, dependencies and source/style coupling
- Add positive/negative type fixtures; do not add unrelated variants or hooks

**4. Files/modules likely involved:**

- `specs/component-maps/card.md`
- `tests/components/card-types.test.ts`
- `registry/ui/card.types.ts only when a separate public type file is justified`

**5. Required unit/integration tests:**

- The frozen card props and supported/omitted hooks are explicit
- Valid native/primitive attributes compile and invalid values fail
- Composed content structure remains valid; caller content/attributes are not dropped; nested cards preserve independent styles and application semantics

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/card-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Card has a bounded source-anchored API and test contract.

**8. Commit message:** `card: define typed source and semantic contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S162, not an unscheduled expansion.

### S162 — Generate Card source and managed styles

**Contract anchors:** R02, R03, R04, R06, R08, R20, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Generate Card source and managed styles.

**2. Purpose:** Install card as application-owned source through the existing registry, not a new runtime path.

**3. Exact scope of code changes:**

- Implement semantic surface/content composition using only frozen parts using native compositional Svelte markup
- Map source surface, border, shadow, padding and radius roles against actual markup into one kit-class-scoped managed CSS block
- Add explicit targets/exports/dependencies and register only the complete item; generate the consumer through the CLI

**4. Files/modules likely involved:**

- `registry/ui/card.svelte or frozen compound directory`
- `registry/ui/card.json`
- `registry/styles/card.css`
- `registry/registry.json`
- `tests/integration/card-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated card source/type exports compile and build
- Registry ownership and dependency closure are correct
- Unrelated app files are preserved and repeat install is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/card-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Card is completely registered with editable source and plain CSS.

**8. Commit message:** `card: generate local source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S163, not an unscheduled expansion.

### S163 — Qualify Card behavior in the generated app

**Contract anchors:** R03, R20, R22, R23, R25, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify Card behavior in the generated app.

**2. Purpose:** Prove the exact card semantics and mapped visual states rather than relying on template inspection.

**3. Exact scope of code changes:**

- Add browser assertions for Composed content structure remains valid; caller content/attributes are not dropped; nested cards preserve independent styles and application semantics
- Exercise caller classes/attributes and relevant refs/bindings from the frozen API
- Check applicable theme, focus, direction and reduced-motion states without inventing new behavior

**4. Files/modules likely involved:**

- `tests/browser/card.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/card/`
- `specs/component-maps/card.md`

**5. Required unit/integration tests:**

- Composed content structure remains valid; caller content/attributes are not dropped; nested cards preserve independent styles and application semantics
- No unexpected SSR/hydration/browser errors
- Computed style/state mapping matches the contract and any limits are documented

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/card.spec.ts
pnpm run test:components -- tests/components/card-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Card is qualified end-to-end against its frozen contract.

**8. Commit message:** `test: qualify card semantics and visual states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S164, not an unscheduled expansion.

### S164 — Freeze Alert props and semantic mapping

**Contract anchors:** R03, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Freeze Alert props and semantic mapping.

**2. Purpose:** Derive a precise alert API from approved source intent and actual pinned types before implementation.

**3. Exact scope of code changes:**

- Inspect the source counterpart and freeze source role/variant/content and accessible label contract
- Record native semantic Svelte message presentation, exact flat exports, class/state mapping, dependencies and source/style coupling
- Add positive/negative type fixtures; do not add unrelated variants or hooks

**4. Files/modules likely involved:**

- `specs/component-maps/alert.md`
- `tests/components/alert-types.test.ts`
- `registry/ui/alert.types.ts only when a separate public type file is justified`

**5. Required unit/integration tests:**

- The frozen alert props and supported/omitted hooks are explicit
- Valid native/primitive attributes compile and invalid values fail
- Role and accessible content match frozen use cases; decorative duplicates are not announced; dynamic content and theme contrast are reviewed without inventing notifications

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/alert-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Alert has a bounded source-anchored API and test contract.

**8. Commit message:** `alert: define typed source and semantic contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S165, not an unscheduled expansion.

### S165 — Generate Alert source and managed styles

**Contract anchors:** R02, R03, R04, R06, R08, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Generate Alert source and managed styles.

**2. Purpose:** Install alert as application-owned source through the existing registry, not a new runtime path.

**3. Exact scope of code changes:**

- Implement semantic alert content with no notification queue, timer or application delivery engine using native semantic Svelte message presentation
- Map source alert states and semantic text/surface/border roles into one kit-class-scoped managed CSS block
- Add explicit targets/exports/dependencies and register only the complete item; generate the consumer through the CLI

**4. Files/modules likely involved:**

- `registry/ui/alert.svelte or frozen compound directory`
- `registry/ui/alert.json`
- `registry/styles/alert.css`
- `registry/registry.json`
- `tests/integration/alert-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated alert source/type exports compile and build
- Registry ownership and dependency closure are correct
- Unrelated app files are preserved and repeat install is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/alert-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Alert is completely registered with editable source and plain CSS.

**8. Commit message:** `alert: generate local source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S166, not an unscheduled expansion.

### S166 — Qualify Alert behavior in the generated app

**Contract anchors:** R03, R20, R22, R23, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify Alert behavior in the generated app.

**2. Purpose:** Prove the exact alert semantics and mapped visual states rather than relying on template inspection.

**3. Exact scope of code changes:**

- Add browser assertions for Role and accessible content match frozen use cases; decorative duplicates are not announced; dynamic content and theme contrast are reviewed without inventing notifications
- Exercise caller classes/attributes and relevant refs/bindings from the frozen API
- Check applicable theme, focus, direction and reduced-motion states without inventing new behavior

**4. Files/modules likely involved:**

- `tests/browser/alert.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/alert/`
- `specs/component-maps/alert.md`

**5. Required unit/integration tests:**

- Role and accessible content match frozen use cases; decorative duplicates are not announced; dynamic content and theme contrast are reviewed without inventing notifications
- No unexpected SSR/hydration/browser errors
- Computed style/state mapping matches the contract and any limits are documented

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/alert.spec.ts
pnpm run test:components -- tests/components/alert-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Alert is qualified end-to-end against its frozen contract.

**8. Commit message:** `test: qualify alert semantics and visual states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S167, not an unscheduled expansion.

### S167 — Freeze Status props and semantic mapping

**Contract anchors:** R03, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Freeze Status props and semantic mapping.

**2. Purpose:** Derive a precise status API from approved source intent and actual pinned types before implementation.

**3. Exact scope of code changes:**

- Inspect the source counterpart and freeze source status/announcement/decorative distinctions and content props
- Record native semantic Svelte status presentation, exact flat exports, class/state mapping, dependencies and source/style coupling
- Add positive/negative type fixtures; do not add unrelated variants or hooks

**4. Files/modules likely involved:**

- `specs/component-maps/status.md`
- `tests/components/status-types.test.ts`
- `registry/ui/status.types.ts only when a separate public type file is justified`

**5. Required unit/integration tests:**

- The frozen status props and supported/omitted hooks are explicit
- Valid native/primitive attributes compile and invalid values fail
- Status and decorative cases have distinct correct semantics; updates do not create duplicate announcements; caller content and attributes remain intact

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/status-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Status has a bounded source-anchored API and test contract.

**8. Commit message:** `status: define typed source and semantic contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S168, not an unscheduled expansion.

### S168 — Generate Status source and managed styles

**Contract anchors:** R02, R03, R04, R06, R08, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Generate Status source and managed styles.

**2. Purpose:** Install status as application-owned source through the existing registry, not a new runtime path.

**3. Exact scope of code changes:**

- Implement appropriate status feedback without a global announcement store using native semantic Svelte status presentation
- Map source status token/state presentation and optional decorative indicator mapping into one kit-class-scoped managed CSS block
- Add explicit targets/exports/dependencies and register only the complete item; generate the consumer through the CLI

**4. Files/modules likely involved:**

- `registry/ui/status.svelte or frozen compound directory`
- `registry/ui/status.json`
- `registry/styles/status.css`
- `registry/registry.json`
- `tests/integration/status-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated status source/type exports compile and build
- Registry ownership and dependency closure are correct
- Unrelated app files are preserved and repeat install is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/status-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Status is completely registered with editable source and plain CSS.

**8. Commit message:** `status: generate local source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S169, not an unscheduled expansion.

### S169 — Qualify Status behavior in the generated app

**Contract anchors:** R03, R20, R22, R23, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify Status behavior in the generated app.

**2. Purpose:** Prove the exact status semantics and mapped visual states rather than relying on template inspection.

**3. Exact scope of code changes:**

- Add browser assertions for Status and decorative cases have distinct correct semantics; updates do not create duplicate announcements; caller content and attributes remain intact
- Exercise caller classes/attributes and relevant refs/bindings from the frozen API
- Check applicable theme, focus, direction and reduced-motion states without inventing new behavior

**4. Files/modules likely involved:**

- `tests/browser/status.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/status/`
- `specs/component-maps/status.md`

**5. Required unit/integration tests:**

- Status and decorative cases have distinct correct semantics; updates do not create duplicate announcements; caller content and attributes remain intact
- No unexpected SSR/hydration/browser errors
- Computed style/state mapping matches the contract and any limits are documented

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/status.spec.ts
pnpm run test:components -- tests/components/status-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Status is qualified end-to-end against its frozen contract.

**8. Commit message:** `test: qualify status semantics and visual states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S170, not an unscheduled expansion.

### S170 — Freeze Progress props and semantic mapping

**Contract anchors:** R03, R20, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Freeze Progress props and semantic mapping.

**2. Purpose:** Derive a precise progress API from approved source intent and actual pinned types before implementation.

**3. Exact scope of code changes:**

- Inspect the source counterpart and freeze value/bounds/indeterminate state, accessible name and actual native prop behavior
- Record a native semantic progress element or a narrowly justified primitive selected in the source map, exact flat exports, class/state mapping, dependencies and source/style coupling
- Add positive/negative type fixtures; do not add unrelated variants or hooks

**4. Files/modules likely involved:**

- `specs/component-maps/progress.md`
- `tests/components/progress-types.test.ts`
- `registry/ui/progress.types.ts only when a separate public type file is justified`

**5. Required unit/integration tests:**

- The frozen progress props and supported/omitted hooks are explicit
- Valid native/primitive attributes compile and invalid values fail
- Determinate bounds/value and indeterminate semantics are correct; accessible naming is retained; source-supported changes stay synchronized with visual state

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/progress-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Progress has a bounded source-anchored API and test contract.

**8. Commit message:** `progress: define typed source and semantic contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S171, not an unscheduled expansion.

### S171 — Generate Progress source and managed styles

**Contract anchors:** R02, R03, R04, R06, R08, R20, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Generate Progress source and managed styles.

**2. Purpose:** Install progress as application-owned source through the existing registry, not a new runtime path.

**3. Exact scope of code changes:**

- Implement determinate and indeterminate semantic progress without timers or task orchestration using a native semantic progress element or a narrowly justified primitive selected in the source map
- Map source progress track/indicator states and semantic color/shape properties into one kit-class-scoped managed CSS block
- Add explicit targets/exports/dependencies and register only the complete item; generate the consumer through the CLI

**4. Files/modules likely involved:**

- `registry/ui/progress.svelte or frozen compound directory`
- `registry/ui/progress.json`
- `registry/styles/progress.css`
- `registry/registry.json`
- `tests/integration/progress-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated progress source/type exports compile and build
- Registry ownership and dependency closure are correct
- Unrelated app files are preserved and repeat install is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/progress-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Progress is completely registered with editable source and plain CSS.

**8. Commit message:** `progress: generate local source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S172, not an unscheduled expansion.

### S172 — Qualify Progress behavior in the generated app

**Contract anchors:** R03, R20, R22, R23, R25, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify Progress behavior in the generated app.

**2. Purpose:** Prove the exact progress semantics and mapped visual states rather than relying on template inspection.

**3. Exact scope of code changes:**

- Add browser assertions for Determinate bounds/value and indeterminate semantics are correct; accessible naming is retained; source-supported changes stay synchronized with visual state
- Exercise caller classes/attributes and relevant refs/bindings from the frozen API
- Check applicable theme, focus, direction and reduced-motion states without inventing new behavior

**4. Files/modules likely involved:**

- `tests/browser/progress.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/progress/`
- `specs/component-maps/progress.md`

**5. Required unit/integration tests:**

- Determinate bounds/value and indeterminate semantics are correct; accessible naming is retained; source-supported changes stay synchronized with visual state
- No unexpected SSR/hydration/browser errors
- Computed style/state mapping matches the contract and any limits are documented

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/progress.spec.ts
pnpm run test:components -- tests/components/progress-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Progress is qualified end-to-end against its frozen contract.

**8. Commit message:** `test: qualify progress semantics and visual states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S173, not an unscheduled expansion.

### S173 — Freeze Separator props and semantic mapping

**Contract anchors:** R03, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Freeze Separator props and semantic mapping.

**2. Purpose:** Derive a precise separator API from approved source intent and actual pinned types before implementation.

**3. Exact scope of code changes:**

- Inspect the source counterpart and freeze decorative versus meaningful separator, orientation and forwarded native attributes
- Record native or thin primitive separator markup justified by the source map, exact flat exports, class/state mapping, dependencies and source/style coupling
- Add positive/negative type fixtures; do not add unrelated variants or hooks

**4. Files/modules likely involved:**

- `specs/component-maps/separator.md`
- `tests/components/separator-types.test.ts`
- `registry/ui/separator.types.ts only when a separate public type file is justified`

**5. Required unit/integration tests:**

- The frozen separator props and supported/omitted hooks are explicit
- Valid native/primitive attributes compile and invalid values fail
- Meaningful and decorative cases have correct roles; supported orientation is reflected in semantics and CSS; caller attributes/classes are preserved

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/separator-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Separator has a bounded source-anchored API and test contract.

**8. Commit message:** `separator: define typed source and semantic contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S174, not an unscheduled expansion.

### S174 — Generate Separator source and managed styles

**Contract anchors:** R02, R03, R04, R06, R08, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Generate Separator source and managed styles.

**2. Purpose:** Install separator as application-owned source through the existing registry, not a new runtime path.

**3. Exact scope of code changes:**

- Implement semantic or decorative separation without extra interactive behavior using native or thin primitive separator markup justified by the source map
- Map source orientation, sizing and semantic border rules into one kit-class-scoped managed CSS block
- Add explicit targets/exports/dependencies and register only the complete item; generate the consumer through the CLI

**4. Files/modules likely involved:**

- `registry/ui/separator.svelte or frozen compound directory`
- `registry/ui/separator.json`
- `registry/styles/separator.css`
- `registry/registry.json`
- `tests/integration/separator-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated separator source/type exports compile and build
- Registry ownership and dependency closure are correct
- Unrelated app files are preserved and repeat install is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/separator-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Separator is completely registered with editable source and plain CSS.

**8. Commit message:** `separator: generate local source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S175, not an unscheduled expansion.

### S175 — Qualify Separator behavior in the generated app

**Contract anchors:** R03, R20, R22, R23, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify Separator behavior in the generated app.

**2. Purpose:** Prove the exact separator semantics and mapped visual states rather than relying on template inspection.

**3. Exact scope of code changes:**

- Add browser assertions for Meaningful and decorative cases have correct roles; supported orientation is reflected in semantics and CSS; caller attributes/classes are preserved
- Exercise caller classes/attributes and relevant refs/bindings from the frozen API
- Check applicable theme, focus, direction and reduced-motion states without inventing new behavior

**4. Files/modules likely involved:**

- `tests/browser/separator.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/separator/`
- `specs/component-maps/separator.md`

**5. Required unit/integration tests:**

- Meaningful and decorative cases have correct roles; supported orientation is reflected in semantics and CSS; caller attributes/classes are preserved
- No unexpected SSR/hydration/browser errors
- Computed style/state mapping matches the contract and any limits are documented

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/separator.spec.ts
pnpm run test:components -- tests/components/separator-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Separator is qualified end-to-end against its frozen contract.

**8. Commit message:** `test: qualify separator semantics and visual states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S176, not an unscheduled expansion.

### S176 — Freeze Skeleton props and semantic mapping

**Contract anchors:** R03, R20, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Freeze Skeleton props and semantic mapping.

**2. Purpose:** Derive a precise skeleton API from approved source intent and actual pinned types before implementation.

**3. Exact scope of code changes:**

- Inspect the source counterpart and freeze source size/shape/presentation props and non-announcement semantics
- Record native decorative Svelte placeholder markup, exact flat exports, class/state mapping, dependencies and source/style coupling
- Add positive/negative type fixtures; do not add unrelated variants or hooks

**4. Files/modules likely involved:**

- `specs/component-maps/skeleton.md`
- `tests/components/skeleton-types.test.ts`
- `registry/ui/skeleton.types.ts only when a separate public type file is justified`

**5. Required unit/integration tests:**

- The frozen skeleton props and supported/omitted hooks are explicit
- Valid native/primitive attributes compile and invalid values fail
- Placeholder adds no redundant readable or live-region content; reduced motion and theme surfaces work; actual shape/radius overrides follow the contract

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/skeleton-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Skeleton has a bounded source-anchored API and test contract.

**8. Commit message:** `skeleton: define typed source and semantic contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S177, not an unscheduled expansion.

### S177 — Generate Skeleton source and managed styles

**Contract anchors:** R02, R03, R04, R06, R08, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Generate Skeleton source and managed styles.

**2. Purpose:** Install skeleton as application-owned source through the existing registry, not a new runtime path.

**3. Exact scope of code changes:**

- Implement decorative loading placeholder without fabricated readable content or timer state using native decorative Svelte placeholder markup
- Map source surface/motion/shape and component customization rules into one kit-class-scoped managed CSS block
- Add explicit targets/exports/dependencies and register only the complete item; generate the consumer through the CLI

**4. Files/modules likely involved:**

- `registry/ui/skeleton.svelte or frozen compound directory`
- `registry/ui/skeleton.json`
- `registry/styles/skeleton.css`
- `registry/registry.json`
- `tests/integration/skeleton-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated skeleton source/type exports compile and build
- Registry ownership and dependency closure are correct
- Unrelated app files are preserved and repeat install is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/skeleton-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Skeleton is completely registered with editable source and plain CSS.

**8. Commit message:** `skeleton: generate local source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S178, not an unscheduled expansion.

### S178 — Qualify Skeleton behavior in the generated app

**Contract anchors:** R03, R20, R22, R23, R25, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify Skeleton behavior in the generated app.

**2. Purpose:** Prove the exact skeleton semantics and mapped visual states rather than relying on template inspection.

**3. Exact scope of code changes:**

- Add browser assertions for Placeholder adds no redundant readable or live-region content; reduced motion and theme surfaces work; actual shape/radius overrides follow the contract
- Exercise caller classes/attributes and relevant refs/bindings from the frozen API
- Check applicable theme, focus, direction and reduced-motion states without inventing new behavior

**4. Files/modules likely involved:**

- `tests/browser/skeleton.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/skeleton/`
- `specs/component-maps/skeleton.md`

**5. Required unit/integration tests:**

- Placeholder adds no redundant readable or live-region content; reduced motion and theme surfaces work; actual shape/radius overrides follow the contract
- No unexpected SSR/hydration/browser errors
- Computed style/state mapping matches the contract and any limits are documented

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/skeleton.spec.ts
pnpm run test:components -- tests/components/skeleton-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Skeleton is qualified end-to-end against its frozen contract.

**8. Commit message:** `test: qualify skeleton semantics and visual states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S179, not an unscheduled expansion.

### S179 — Resolve identity parity using pinned Svelte and Bits mechanisms

**Contract anchors:** R03, R21, R26, R28, R32, R33, R34. [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Resolve identity parity using pinned Svelte and Bits mechanisms.

**2. Purpose:** Preserve stable identity without shipping an unnecessary Rust-style helper.

**3. Exact scope of code changes:**

- Review generated field/control/dialog relationships and pinned ID facilities
- Record whether any app-owned helper is actually needed
- Prefer documented non-generated identity mapping; only add a minimal helper/item if evidence proves necessity and contract is frozen

**4. Files/modules likely involved:**

- `specs/component-maps/identity.md`
- `tests/components/identity-contract.test.ts`
- `conditional registry identity target only if justified`

**5. Required unit/integration tests:**

- ID strategy is documented per affected component
- No process-global counter/provider clone exists
- Non-generated mapping leaves no fake identity registry alias
- Any necessary helper has explicit types and ownership

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/identity-contract.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The original identity item has an evidence-backed Svelte-native parity disposition.

**8. Commit message:** `identity: resolve stable ids without rust compatibility shims`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S180, not an unscheduled expansion.

### S180 — Qualify cross-request and multi-instance identity

**Contract anchors:** R21, R22, R28, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Qualify cross-request and multi-instance identity.

**2. Purpose:** Verify that label/overlay correctness survives real rendering lifecycles.

**3. Exact scope of code changes:**

- Render multiple control/field/dialog instances and multiple server requests
- Hydrate with stable associations and explicit ID overrides
- Test conditional rendering within the pinned supported contract

**4. Files/modules likely involved:**

- `tests/integration/identity-ssr.test.ts`
- `tests/browser/identity.spec.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- No leaked mutable state or accidental duplicate IDs
- Labels/title/description references point to intended live elements
- Hydration produces no unexpected identity errors

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/identity-ssr.test.ts
pnpm run test:browser -- tests/browser/identity.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Identity parity is verified rather than assumed from primitive choice.

**8. Commit message:** `test: qualify request-local component identity`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S181, not an unscheduled expansion.

### S181 — Audit complete reference-catalog coverage

**Contract anchors:** R06, R26, R27, R28, R31, R32, R33, R34. [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SCOPE_AND_ASSUMPTIONS.md](../specs/SCOPE_AND_ASSUMPTIONS.md).

**1. Step title:** Audit complete reference-catalog coverage.

**2. Purpose:** Ensure the original 22 IDs have no silently omitted or fabricated mappings.

**3. Exact scope of code changes:**

- Compare source inventory with implemented item maps and qualified registry root
- Record optional Router Link and evidence-backed identity disposition
- Verify distinct Alert Dialog and source-only behavior adjustments are documented

**4. Files/modules likely involved:**

- `specs/COMPONENT_CATALOG.md`
- `registry/registry.json`
- `tests/registry/catalog-parity.test.ts`
- `README.md`

**5. Required unit/integration tests:**

- All original entries have explicit disposition
- Every advertised target/part/style exists and compiles
- No unapproved extra component is smuggled into the catalog
- Source-required behavior gaps block completion

**6. Verification commands:**

```sh
pnpm run test:registry -- tests/registry/catalog-parity.test.ts
pnpm run test:registry
pnpm run test:components
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Catalog parity is complete and its deliberate adaptations are traceable.

**8. Commit message:** `registry: qualify complete source catalog coverage`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S182, not an unscheduled expansion.

## M10 — Cross-component regression and supported-environment qualification

### S182 — Audit public exports and consumer dependency direction

**Contract anchors:** R01, R02, R06, R20, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [PRODUCT_SPEC.md](../specs/PRODUCT_SPEC.md).

**1. Step title:** Audit public exports and consumer dependency direction.

**2. Purpose:** Ensure local-source ownership is reflected in actual imports and build output.

**3. Exact scope of code changes:**

- Scan all registered item exports and installed sibling imports
- Detect root-barrel cycles, CLI/Node imports and unintended styled-runtime dependencies
- Verify type-only exports are represented correctly

**4. Files/modules likely involved:**

- `tests/registry/public-exports.test.ts`
- `tests/integration/consumer-imports.test.ts`
- `registry/ui/`

**5. Required unit/integration tests:**

- Every declared public symbol resolves from generated root barrel
- Consumer graph contains no CLI/registry/Node-only implementation
- No unnecessary components/index.ts or parallel namespace aliases appear

**6. Verification commands:**

```sh
pnpm run test:registry -- tests/registry/public-exports.test.ts
pnpm run test:integration -- tests/integration/consumer-imports.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The complete catalog preserves intended import and ownership boundaries.

**8. Commit message:** `test: audit generated exports and dependency direction`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S183, not an unscheduled expansion.

### S183 — Qualify cross-family bindings, refs, and snippet forwarding

**Contract anchors:** R20, R22, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Qualify cross-family bindings, refs, and snippet forwarding.

**2. Purpose:** Catch wrapper regressions hidden by isolated happy-path tests.

**3. Exact scope of code changes:**

- Add shared generated-app qualification across all stateful/compound families
- Exercise getter/setter and ordinary bindings where supported, element refs and delegated snippets
- Assert merge ordering/cancellation and rejected rendering hooks

**4. Files/modules likely involved:**

- `tests/components/wrapper-contracts.test.ts`
- `tests/browser/wrapper-contracts.spec.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- State/ref flows are preserved for every advertised bound prop
- Caller event cancellation/order follows pinned contract
- Floating wrapperProps are not collapsed
- Unsupported children/child usage fails typing rather than disappearing

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/wrapper-contracts.test.ts
pnpm run test:browser -- tests/browser/wrapper-contracts.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The shared wrapper rules have full-catalog evidence.

**8. Commit message:** `test: qualify wrapper bindings refs and delegation`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S184, not an unscheduled expansion.

### S184 — Qualify combined native forms and reset behavior

**Contract anchors:** R03, R20, R22, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Qualify combined native forms and reset behavior.

**2. Purpose:** Verify that multiple generated controls compose into one real form.

**3. Exact scope of code changes:**

- Build combined Button/Field/Checkbox/Radio/Switch form fixtures
- Test submission names/values, required/disabled/loading and reset
- Assert valid associations and no duplicate hidden inputs across controls

**4. Files/modules likely involved:**

- `tests/browser/forms-composition.spec.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- Combined form data is correct
- Native reset synchronizes actual control state according to frozen APIs
- Loading/disabled buttons and controls cannot activate incorrectly
- No extra validation/state framework is needed

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/forms-composition.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Form composition preserves the native behavior contract end-to-end.

**8. Commit message:** `test: qualify combined forms and native reset`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S185, not an unscheduled expansion.

### S185 — Qualify nested overlay interactions across families

**Contract anchors:** R03, R20, R22, R27, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Qualify nested overlay interactions across families.

**2. Purpose:** Ensure distinct primitives compose without duplicate kit-level state.

**3. Exact scope of code changes:**

- Test Menu inside Dialog and supported Alert Dialog nesting/composition
- Verify focus return, Escape/outside handling and rapid presence transitions
- Keep primitive behavior distinctions explicit

**4. Files/modules likely involved:**

- `tests/browser/overlay-composition.spec.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- Focus returns to the intended live trigger
- Closing one overlay does not incorrectly dismiss or strand another
- No hidden kit focus stack/global layer manager exists
- Interrupted transitions clean up correctly

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/overlay-composition.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Overlay composition works through native primitive responsibilities.

**8. Commit message:** `test: qualify cross-family overlay composition`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S186, not an unscheduled expansion.

### S186 — Audit complete CSS property and selector coverage

**Contract anchors:** R04, R07, R25, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Audit complete CSS property and selector coverage.

**2. Purpose:** Ensure reusable visual contracts survived every component mapping.

**3. Exact scope of code changes:**

- Compare all public kit classes/properties with mapped DOM and contract inventory
- Add full-catalog radius/shape/default/token fallback assertions
- Verify aggregate stylesheet ownership and no duplicate authoritative installed CSS

**4. Files/modules likely involved:**

- `tests/registry/css-contract-coverage.test.ts`
- `tests/browser/css-contracts.spec.ts`
- `registry/contracts/`

**5. Required unit/integration tests:**

- No undocumented copied selector targets nonexistent DOM
- Public customization properties have actual behavior coverage
- Shape-critical defaults persist
- No Tailwind/CSS-in-JS syntax or per-component duplicate stylesheet pipeline appears

**6. Verification commands:**

```sh
pnpm run test:registry -- tests/registry/css-contract-coverage.test.ts
pnpm run test:browser -- tests/browser/css-contracts.spec.ts
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Styling contracts are complete and tied to generated DOM.

**8. Commit message:** `test: audit catalog css and customization contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S187, not an unscheduled expansion.

### S187 — Qualify catalog-wide themes and portal changes

**Contract anchors:** R17, R23, R24, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify catalog-wide themes and portal changes.

**2. Purpose:** Verify one design vocabulary works across surfaces, controls, and overlays.

**3. Exact scope of code changes:**

- Add global/nested theme fixtures across the complete catalog
- Exercise open-overlay theme changes and explicit custom hosts
- Document aggregate CSS and application-owned persistence behavior without adding a store

**4. Files/modules likely involved:**

- `tests/browser/catalog-themes.spec.ts`
- `README.md`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- Controls/surfaces and appropriate body-portaled overlays share document theme
- Nested hosts inherit intended tokens within documented stacking limits
- Theme/app CSS stays untouched through sync

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/catalog-themes.spec.ts
pnpm run test:integration -- tests/integration/layout-imports.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Global and nested theme behavior is consistent across the full catalog.

**8. Commit message:** `test: qualify catalog theme scope behavior`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S188, not an unscheduled expansion.

### S188 — Qualify directional, motion, and accessibility state coverage

**Contract anchors:** R22, R24, R25, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify directional, motion, and accessibility state coverage.

**2. Purpose:** Check visual/interaction variants systematically without claiming unsupported certification.

**3. Exact scope of code changes:**

- Extend supported browser fixtures for RTL, reduced motion, focus visibility and label/role state
- Pair accessibility tooling with direct keyboard/semantic assertions
- Record observed contrast/accessibility limits and source-related remediation without inventing a redesign

**4. Files/modules likely involved:**

- `tests/browser/accessibility-states.spec.ts`
- `implementation evidence/ACCESSIBILITY.md`
- `CI browser configuration`

**5. Required unit/integration tests:**

- Applicable directional controls behave correctly
- Motion reduction does not hide essential state
- Names/roles/focus pass explicit assertions
- Any unresolved required issue blocks release rather than being masked

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/accessibility-states.spec.ts
pnpm run test:browser
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Supported accessibility/state coverage is evidenced and honestly bounded.

**8. Commit message:** `test: qualify accessible directional and motion states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S189, not an unscheduled expansion.

### S189 — Qualify full-catalog SSR and hydration

**Contract anchors:** R20, R21, R28, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md).

**1. Step title:** Qualify full-catalog SSR and hydration.

**2. Purpose:** Prove the actual target rendering model across all advertised components.

**3. Exact scope of code changes:**

- Render all qualified items with representative initial values on the server
- Hydrate generated application routes with console/error capture
- Exercise independent requests and conditional/multiple instances within supported contracts

**4. Files/modules likely involved:**

- `tests/integration/catalog-ssr.test.ts`
- `tests/browser/catalog-hydration.spec.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- No unexpected SSR import or hydration errors
- Initial state matches supported pinned behavior
- IDs/labels/state do not leak across requests
- No component is qualified by disabling SSR

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/catalog-ssr.test.ts
pnpm run test:browser -- tests/browser/catalog-hydration.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** All advertised components are qualified for SvelteKit SSR/hydration.

**8. Commit message:** `test: qualify full catalog ssr and hydration`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S190, not an unscheduled expansion.

### S190 — Qualify supported custom-layout and workspace installs

**Contract anchors:** R05, R09, R16, R17, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify supported custom-layout and workspace installs.

**2. Purpose:** Verify declared path support using the complete item set.

**3. Exact scope of code changes:**

- Generate representative simple/compound items into each supported explicit mapping
- Test --cwd isolation within workspace fixtures
- Exercise unsupported layouts as nonmutating diagnostics

**4. Files/modules likely involved:**

- `tests/integration/layout-matrix.test.ts`
- `tests/fixtures/layouts/`
- `implementation evidence/COMPATIBILITY.md`

**5. Required unit/integration tests:**

- Relative sibling/export/CSS/layout paths resolve in supported mappings
- Neighbor workspace packages are unchanged
- Unsupported dynamic layout is not guessed or executed
- Custom theme files survive updates

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/layout-matrix.test.ts
pnpm run test:integration -- tests/integration/project-root.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Advertised integration layouts have complete workflow evidence.

**8. Commit message:** `test: qualify scoped custom-layout installations`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S191, not an unscheduled expansion.

### S191 — Qualify full-catalog retirement and re-add workflows

**Contract anchors:** R11, R13, R17, R18, R32, R33, R34. [DATA_MODEL.md](../specs/DATA_MODEL.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Qualify full-catalog retirement and re-add workflows.

**2. Purpose:** Test ownership lifecycle with real dependency sharing and customized assets.

**3. Exact scope of code changes:**

- Remove selected roots from a generated catalog fixture and synchronize
- Cover shared needed dependencies, clean obsolete files, customized CSS/source and application exports
- Re-add retained targets to verify no silent ownership acquisition

**4. Files/modules likely involved:**

- `tests/integration/catalog-retirement.test.ts`
- `tests/fixtures/retirement/`

**5. Required unit/integration tests:**

- Only safe clean obsolete assets retire
- Customized assets survive with truthful detached ownership/diagnostics
- Needed dependencies remain and request roots are not polluted
- Re-add conflicts/adoption follow frozen policy

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/catalog-retirement.test.ts
pnpm run test:integration -- tests/integration/workflow-purity.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Removal/re-add lifecycle preserves real application work.

**8. Commit message:** `test: qualify catalog retirement and reinstallation`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S192, not an unscheduled expansion.

### S192 — Qualify real component update cohorts

**Contract anchors:** R12, R13, R14, R15, R32, R33, R34. [DATA_MODEL.md](../specs/DATA_MODEL.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Qualify real component update cohorts.

**2. Purpose:** Exercise coupled DOM/CSS/export changes using representative generated families.

**3. Exact scope of code changes:**

- Create labeled synthetic old/incoming Button/Dialog/Menu revisions
- Cover locally edited source, CSS, related exports and dependent API changes
- Inspect per-target lock lineage after safe and blocked transitions

**4. Files/modules likely involved:**

- `tests/fixtures/upgrades/components/`
- `tests/integration/component-upgrades.test.ts`

**5. Required unit/integration tests:**

- Compatible untouched upgrades apply together
- Source/style conflict leaves the entire batch unchanged
- Locally preserved cohort members do not receive falsely advanced bases
- Unrelated unchanged components avoid false conflicts

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/component-upgrades.test.ts
pnpm run test:integration -- tests/integration/lock-projection.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Cohort policy is proven against realistic compound component updates.

**8. Commit message:** `test: qualify component source and style upgrade cohorts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S193, not an unscheduled expansion.

### S193 — Qualify filesystem behavior on supported operating systems

**Contract anchors:** R16, R24, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Qualify filesystem behavior on supported operating systems.

**2. Purpose:** Replace portability assumptions with explicit platform evidence.

**3. Exact scope of code changes:**

- Run path/case/symlink/rename/mode/concurrency/recovery tests on supported OS lanes
- Document actual support and unproven hostile-race limits
- Preserve any applicable Rust transaction platform checks independently

**4. Files/modules likely involved:**

- `CI workflow configuration`
- `tests/integration/platform-filesystem.test.ts`
- `implementation evidence/PLATFORMS.md`

**5. Required unit/integration tests:**

- Advertised Linux/macOS/Windows behavior has passing evidence or remains blocked
- Platform-specific failures are fixed within affected modules, not hidden by skipped safety tests
- No broader capability-security claim is introduced

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/platform-filesystem.test.ts
pnpm run test:integration -- tests/integration/transaction-processes.test.ts
# DISCOVER/VERIFY: Execute discovered supported-OS CI lanes and record actual results; do not claim local execution of remote lanes
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Filesystem support has a documented tested matrix.

**8. Commit message:** `ci: qualify supported filesystem and recovery platforms`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S194, not an unscheduled expansion.

## M11 — Packed acceptance, operating documentation, and final specification

### S194 — Prove installed CLI independence from authoring source

**Contract anchors:** R01, R08, R29, R30, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [PRODUCT_SPEC.md](../specs/PRODUCT_SPEC.md).

**1. Step title:** Prove installed CLI independence from authoring source.

**2. Purpose:** Make packaging acceptance verify the source-first distribution promise.

**3. Exact scope of code changes:**

- Build/pack/install the CLI into an isolated test location
- Make authoring source/build/fixture assets unavailable after installation
- Exercise view/init/add/sync/doctor using only packed assets and explicit consumer setup

**4. Files/modules likely involved:**

- `tests/package/installed-runtime.test.ts`
- `tests/helpers/packaged-cli.ts`
- `package.json`

**5. Required unit/integration tests:**

- Installed executable retains all required assets/contracts/schemas
- Commands do not read deleted/unavailable source paths
- Root/compound item installation and sync still work
- Registry operations do not require live GitHub

**6. Verification commands:**

```sh
pnpm run build
pnpm pack --json
pnpm run test:package -- tests/package/installed-runtime.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Tarball distribution is independently operational.

**8. Commit message:** `package: prove installed runtime source independence`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S195, not an unscheduled expansion.

### S195 — Qualify a consumer generated by the installed tarball

**Contract anchors:** R02, R04, R10, R13, R21, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [STYLING.md](../specs/STYLING.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Qualify a consumer generated by the installed tarball.

**2. Purpose:** Verify the actual distributable output rather than development templates.

**3. Exact scope of code changes:**

- Generate the representative complete-catalog app using the isolated installed CLI
- Install declared consumer dependencies explicitly through the detected manager
- Run type/build/browser and ownership upgrade checks on that app

**4. Files/modules likely involved:**

- `tests/package/generated-consumer.test.ts`
- `tests/fixtures/packaged-consumer/`
- `package acceptance scripts`

**5. Required unit/integration tests:**

- Consumer check/build/SSR/hydration and scoped browser suites pass from packed output
- Local imports and pure CSS have no hidden CLI runtime dependence
- Dependency instructions are sufficient and honest
- Safe/custom/conflicting sync behavior persists

**6. Verification commands:**

```sh
pnpm run test:package -- tests/package/generated-consumer.test.ts
# DISCOVER/VERIFY: Run actual generated consumer svelte-check/build/browser commands recorded by the harness
pnpm run test:package -- tests/package/inventory.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The packed product generates a verified real application.

**8. Commit message:** `package: qualify the generated consumer end to end`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S196, not an unscheduled expansion.

### S196 — Verify advertised compatibility and release metadata

**Contract anchors:** R01, R08, R10, R12, R24, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [PRODUCT_SPEC.md](../specs/PRODUCT_SPEC.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [STYLING.md](../specs/STYLING.md).

**1. Step title:** Verify advertised compatibility and release metadata.

**2. Purpose:** Avoid claiming dependency/version/platform support beyond actual evidence.

**3. Exact scope of code changes:**

- Compare supported version ranges with passing selected baseline/matrix tests
- Verify package bin/engine/module/files/peer metadata and actual name/license status without publishing
- Preserve upstream notices for copied source/CSS and document unresolved ownership/publishing questions

**4. Files/modules likely involved:**

- `package.json`
- `license/notice files as required by target policy`
- `implementation evidence/COMPATIBILITY.md`
- `tests/package/metadata.test.ts`

**5. Required unit/integration tests:**

- Published-shaped metadata does not claim untested major compatibility
- Package includes required notices and no private/unrelated files
- CLI/consumer dependency roles are correct
- npm-name conflict is reported rather than silently renaming product

**6. Verification commands:**

```sh
pnpm run test:package -- tests/package/metadata.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
# DISCOVER/VERIFY: Verify actual package/peer metadata with the selected manager; do not run npm publish
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Compatibility and distribution claims match tested evidence.

**8. Commit message:** `package: align release metadata with verified compatibility`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S197, not an unscheduled expansion.

### S197 — Document install, customization, and upgrade operations

**Contract anchors:** R02, R09, R10, R13, R18, R19, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Document install, customization, and upgrade operations.

**2. Purpose:** Make the approved ownership workflow usable without coding-agent context.

**3. Exact scope of code changes:**

- Write root README/CONTRIBUTING commands using actual executable/package state
- Explain config roots, generated ownership, token/property customization, dry runs and doctor
- Include exact upgrade/conflict/retirement examples and no auto-merge/auto-install promise

**4. Files/modules likely involved:**

- `README.md`
- `CONTRIBUTING.md`
- `tests/integration/docs-upgrade.test.ts`
- `implementation/OPERATIONS_RUNBOOK.md`

**5. Required unit/integration tests:**

- Execute documented installation/upgrade examples in fresh fixtures
- Explanations distinguish customized from broken state
- Commands do not assume a package was published when it was only packed

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/docs-upgrade.test.ts
pnpm run format:check
pnpm run test:integration -- tests/integration/documented-workflow.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Operational guidance reflects actual verified behavior.

**8. Commit message:** `docs: explain installation customization and safe upgrades`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S198, not an unscheduled expansion.

### S198 — Document and exercise recovery procedures

**Contract anchors:** R09, R13, R16, R32, R33, R34. [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md), [SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md).

**1. Step title:** Document and exercise recovery procedures.

**2. Purpose:** Make failure handling actionable without unsafe manual deletion advice.

**3. Exact scope of code changes:**

- Write recovery guidance for locked/stale/ambiguous/committed-cleanup states using implemented outcomes
- Include backing up current work and preserving transaction evidence
- Test all documented safe procedures and avoid undocumented force/recover commands

**4. Files/modules likely involved:**

- `implementation/OPERATIONS_RUNBOOK.md`
- `README.md`
- `tests/integration/docs-recovery.test.ts`

**5. Required unit/integration tests:**

- Documented procedures recover qualified fixtures or stop safely
- Post-crash user edits are retained
- Corrupt evidence never recommends blind journal/lock deletion
- Read-only diagnosis stays nonmutating

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/docs-recovery.test.ts
pnpm run test:integration -- tests/integration/recovery-invalid.test.ts
pnpm run format:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Recovery instructions match the implemented safety protocol.

**8. Commit message:** `docs: qualify safe transaction recovery procedures`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S199, not an unscheduled expansion.

### S199 — Add documented compositional examples without new primitives

**Contract anchors:** R02, R03, R22, R28, R31, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md), [SCOPE_AND_ASSUMPTIONS.md](../specs/SCOPE_AND_ASSUMPTIONS.md).

**1. Step title:** Add documented compositional examples without new primitives.

**2. Purpose:** Show intended higher-level usage while respecting the approved catalog boundary.

**3. Exact scope of code changes:**

- Add examples composing collapsibles, alert/status, anchor/router-link/button and native semantic structure
- Keep examples app-owned and separate from new registry item APIs
- Demonstrate form and overlay/theme composition with actual installed imports

**4. Files/modules likely involved:**

- `tests/fixtures/consumer/src/routes/examples/`
- `README.md`
- `tests/browser/composition-examples.spec.ts`

**5. Required unit/integration tests:**

- Examples compile/build and use local flat exports
- No notification queue/data-grid/accordion state framework is introduced
- Keyboard/semantic smoke tests pass for actual examples

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/composition-examples.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Developers have useful compositional examples without scope expansion.

**8. Commit message:** `docs: add verified compositional usage examples`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S200, not an unscheduled expansion.

### S200 — Reconcile agent instructions and test traceability

**Contract anchors:** R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md).

**1. Step title:** Reconcile agent instructions and test traceability.

**2. Purpose:** Keep future AI-assisted changes anchored to code-health evidence.

**3. Exact scope of code changes:**

- Update AGENTS with actual module boundaries/scripts, supported paths and guard rules
- Map every stable requirement and acceptance criterion to actual tests/records
- Review all deviations and close only evidence-backed ones

**4. Files/modules likely involved:**

- `AGENTS.md`
- `implementation/TRACEABILITY.md`
- `implementation evidence/COMMANDS.md`
- `tests/registry/contract-links.test.ts`

**5. Required unit/integration tests:**

- All requirement IDs have real implementation/test evidence or an explicit blocking status
- No instruction refers to nonexistent successful checks
- Component maps and registry contracts match current source

**6. Verification commands:**

```sh
pnpm run test:registry -- tests/registry/contract-links.test.ts
pnpm run format:check
pnpm run lint
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Durable intent, code and verification evidence are synchronized.

**8. Commit message:** `docs: reconcile agent guidance and requirement evidence`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S201, not an unscheduled expansion.

### S201 — Run the final code-health and cumulative regression lane

**Contract anchors:** R08, R16, R20, R21, R22, R29, R30, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [API_CONTRACTS.md](../specs/API_CONTRACTS.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md), [DATA_MODEL.md](../specs/DATA_MODEL.md), [SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md).

**1. Step title:** Run the final code-health and cumulative regression lane.

**2. Purpose:** Review maintainability and safety without disguising broad refactoring as cleanup.

**3. Exact scope of code changes:**

- Run all cumulative checks and inspect production/packed output
- Remove only step-scoped redundant scaffolding proven obsolete, preserving fixtures and public contracts
- Investigate failures without suppressions, weakened typing or SSR disablement

**4. Files/modules likely involved:**

- `all scoped target modules/tests`
- `package artifacts`
- `implementation evidence/FINAL_VERIFICATION.md`

**5. Required unit/integration tests:**

- Unit/integration/registry/component/browser/package suites pass
- Formatting/lint/type/build and supported platform/feature lanes pass
- Any present Rust workspace satisfies its applicable guard
- No unrelated source changes or temporary secrets are staged

**6. Verification commands:**

```sh
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run test:unit
pnpm run test:integration
pnpm run test:registry
pnpm run test:components
pnpm run fixture:check
pnpm run fixture:build
pnpm run test:browser
pnpm run build
pnpm pack --json
pnpm run test:package
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** All required implementation verification is evidenced; failures remain blockers, not hidden exceptions.

**8. Commit message:** `test: complete the cumulative release qualification`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S202, not an unscheduled expansion.

### S202 — Record the gated extension scope without inventing APIs

**Contract anchors:** R31, R32, R33, R34. [SCOPE_AND_ASSUMPTIONS.md](../specs/SCOPE_AND_ASSUMPTIONS.md).

**1. Step title:** Record the gated extension scope without inventing APIs.

**2. Purpose:** Preserve the approved expansion direction while preventing unrequested implementation.

**3. Exact scope of code changes:**

- Document select/combobox/popover/date-related/higher-level extension questions from actual stable architecture
- Separate known reusable infrastructure from missing item inventory/value/date/locale contracts
- Create only the scoped proposal and decision gate; no extension component code or speculative complete sequence

**4. Files/modules likely involved:**

- `implementation/EXTENSION_GATE.md`
- `implementation/OPEN_QUESTIONS.md`
- `specs/SCOPE_AND_ASSUMPTIONS.md`

**5. Required unit/integration tests:**

- Review shows all named extension directions are retained
- No undefined date/timezone/search/business behavior is called approved
- Core completion and any expanded-v1 blocker are reported separately
- Existing product suites remain unchanged/green

**6. Verification commands:**

```sh
pnpm run format:check
# DISCOVER/VERIFY: Execute target contract/reference validation
pnpm run test:registry
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** Extension work has an explicit next specification boundary and is not falsely claimed implemented.

**8. Commit message:** `spec: preserve the gated component expansion direction`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S203, not an unscheduled expansion.

### S203 — Freeze final implementation evidence and delivery status

**Contract anchors:** R01, R29, R31, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md), [ARCHITECTURE.md](../specs/ARCHITECTURE.md), [PRODUCT_SPEC.md](../specs/PRODUCT_SPEC.md), [SCOPE_AND_ASSUMPTIONS.md](../specs/SCOPE_AND_ASSUMPTIONS.md).

**1. Step title:** Freeze final implementation evidence and delivery status.

**2. Purpose:** Leave the next engineer a truthful, reproducible completion record.

**3. Exact scope of code changes:**

- Record completed step IDs/commit hashes, actual artifact inventory, compatibility matrix and test results
- Resolve acceptance checklist against code and identify any remaining blocker
- Preserve no-publish/no-push boundary and report the exact next safe action

**4. Files/modules likely involved:**

- `implementation evidence/FINAL_VERIFICATION.md`
- `implementation/TRACEABILITY.md`
- `implementation evidence/DELIVERY.md`

**5. Required unit/integration tests:**

- Every nongated completed step has a commit/report and passing required evidence
- Required acceptance criteria are satisfied or completion is explicitly withheld
- Packed artifact/commands can reproduce verification
- Extension gate remains clearly separate from implemented core

**6. Verification commands:**

```sh
git status --short
git log --oneline -12
git diff --check
# DISCOVER/VERIFY: Re-run changed-scope checks after final documentation updates and reference the full recorded release lane; do not claim stale results are new runs
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](VERIFICATION.md).

**7. Expected result:** The verified product or honest blocked/partial state is delivered without unsupported completion claims.

**8. Commit message:** `specification: record verified implementation delivery evidence`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is the explicitly gated next specification/delivery action, not an unscheduled expansion.

## Adopted approved contracts and supporting guidance

S002 adopted the 27 approved contracts into standalone repository files. Their bodies are no longer duplicated here; this is an explicit index of the adopted locations, which govern product intent. `implementation/COMMIT_SEQUENCE.md` remains the execution/status authority for checkpoint order, status and evidence.

| Contract                                               | Adopted file                                                                                                    |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `specs/PRODUCT_SPEC.md`                                | [specs/PRODUCT_SPEC.md](../specs/PRODUCT_SPEC.md)                                                               |
| `specs/SCOPE_AND_ASSUMPTIONS.md`                       | [specs/SCOPE_AND_ASSUMPTIONS.md](../specs/SCOPE_AND_ASSUMPTIONS.md)                                             |
| `specs/ARCHITECTURE.md`                                | [specs/ARCHITECTURE.md](../specs/ARCHITECTURE.md)                                                               |
| `specs/GENERATED_LAYOUT.md`                            | [specs/GENERATED_LAYOUT.md](../specs/GENERATED_LAYOUT.md)                                                       |
| `specs/API_CONTRACTS.md`                               | [specs/API_CONTRACTS.md](../specs/API_CONTRACTS.md)                                                             |
| `specs/DATA_MODEL.md`                                  | [specs/DATA_MODEL.md](../specs/DATA_MODEL.md)                                                                   |
| `specs/STYLING.md`                                     | [specs/STYLING.md](../specs/STYLING.md)                                                                         |
| `specs/SYNCHRONIZATION.md`                             | [specs/SYNCHRONIZATION.md](../specs/SYNCHRONIZATION.md)                                                         |
| `specs/SECURITY_AND_TRANSACTIONS.md`                   | [specs/SECURITY_AND_TRANSACTIONS.md](../specs/SECURITY_AND_TRANSACTIONS.md)                                     |
| `specs/COMPONENT_CATALOG.md`                           | [specs/COMPONENT_CATALOG.md](../specs/COMPONENT_CATALOG.md)                                                     |
| `specs/ACCEPTANCE_CRITERIA.md`                         | [specs/ACCEPTANCE_CRITERIA.md](../specs/ACCEPTANCE_CRITERIA.md)                                                 |
| `implementation/TEST_PLAN.md`                          | [implementation/TEST_PLAN.md](TEST_PLAN.md)                                                                     |
| `implementation/VERIFICATION.md`                       | [implementation/VERIFICATION.md](VERIFICATION.md)                                                               |
| `implementation/OPEN_QUESTIONS.md`                     | [implementation/OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)                                                           |
| `implementation/OPERATIONS_RUNBOOK.md`                 | [implementation/OPERATIONS_RUNBOOK.md](OPERATIONS_RUNBOOK.md)                                                   |
| `implementation/STEP_REPORT_TEMPLATE.md`               | [implementation/STEP_REPORT_TEMPLATE.md](STEP_REPORT_TEMPLATE.md)                                               |
| `implementation/DEVIATION_TEMPLATE.md`                 | [implementation/DEVIATION_TEMPLATE.md](DEVIATION_TEMPLATE.md)                                                   |
| `implementation/EXTENSION_GATE.md`                     | [implementation/EXTENSION_GATE.md](EXTENSION_GATE.md)                                                           |
| `decisions/ADR-0001-architecture.md`                   | [decisions/ADR-0001-architecture.md](../decisions/ADR-0001-architecture.md)                                     |
| `decisions/ADR-0002-generated-css-and-layout.md`       | [decisions/ADR-0002-generated-css-and-layout.md](../decisions/ADR-0002-generated-css-and-layout.md)             |
| `decisions/ADR-0003-customization-aware-sync.md`       | [decisions/ADR-0003-customization-aware-sync.md](../decisions/ADR-0003-customization-aware-sync.md)             |
| `decisions/ADR-0004-primitive-and-theme-boundaries.md` | [decisions/ADR-0004-primitive-and-theme-boundaries.md](../decisions/ADR-0004-primitive-and-theme-boundaries.md) |
| `decisions/ADR-0005-rust-verification-boundary.md`     | [decisions/ADR-0005-rust-verification-boundary.md](../decisions/ADR-0005-rust-verification-boundary.md)         |
| `decisions/ADR-0006-scope-and-discovery-gates.md`      | [decisions/ADR-0006-scope-and-discovery-gates.md](../decisions/ADR-0006-scope-and-discovery-gates.md)           |
| `references/SOURCE_BASELINE.md`                        | [references/SOURCE_BASELINE.md](../references/SOURCE_BASELINE.md)                                               |
| `references/TOKEN_BASELINE.md`                         | [references/TOKEN_BASELINE.md](../references/TOKEN_BASELINE.md)                                                 |
| `AGENTS.md`                                            | [AGENTS.md](../AGENTS.md)                                                                                       |

<a id="reference-url-inventory"></a>

## Reference URL inventory

These pointers preserve source-review provenance. Mutable documentation and source manifests must be rechecked against the versions selected at S003/S011; no current-version claim is made here. S002 can project this inventory into `references/SOURCES.json` without requiring an external planning document.

| ID    | Reference                                                                                                           | Evidence boundary                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| SRC01 | [Leptos immutable baseline](https://github.com/triesap/leptos_ui_kit/tree/a10fbf06334f4648f5755e05a7147414e4e5fc98) | Static reference inspection; no Rust test result implied.          |
| SRC02 | [Reference commit history](https://github.com/triesap/leptos_ui_kit/commits/master)                                 | Convention evidence; use immutable revision for source adaptation. |
| SRC03 | [Bits source manifest](https://github.com/huntabyte/bits-ui/blob/main/packages/bits-ui/package.json)                | Historical source observation, not an exact target dependency pin. |
| SRC04 | [Bits Switch](https://bits-ui.com/docs/components/switch)                                                           | Recheck types, forms and behavior at selected versions.            |
| SRC05 | [Bits Dialog](https://bits-ui.com/docs/components/dialog)                                                           | Composition reference; generated-app qualification required.       |
| SRC06 | [Bits child snippets](https://bits-ui.com/docs/child-snippet)                                                       | Preserve delegated and floating wrapper structure.                 |
| SRC07 | [Bits Portal](https://bits-ui.com/docs/utilities/portal)                                                            | Verify default/custom targets and theme scope.                     |
| SRC08 | [Bits mergeProps](https://bits-ui.com/docs/utilities/merge-props)                                                   | Verify event ordering/cancellation against pinned behavior.        |
| SRC09 | [SvelteKit project structure](https://svelte.dev/docs/kit/project-structure)                                        | Default layout reference; explicit custom mappings need fixtures.  |
| SRC10 | [Svelte bindable props](https://svelte.dev/docs/svelte/$bindable)                                                   | State/ref forwarding needs typed and behavioral tests.             |
| SRC11 | [Svelte compiler](https://svelte.dev/docs/svelte/svelte-compiler)                                                   | Parser API must match selected version.                            |
| SRC12 | [SvelteKit state management](https://svelte.dev/docs/kit/state-management)                                          | Preserve request-local state and SSR.                              |
| SRC13 | [Bits Alert Dialog](https://bits-ui.com/docs/components/alert-dialog)                                               | Freeze distinct primitive API; do not emulate via Dialog role.     |
| SRC14 | [Svelte TypeScript](https://svelte.dev/docs/svelte/typescript)                                                      | Derive native element types from pinned dependencies.              |
| SRC15 | [SvelteKit link options](https://svelte.dev/docs/kit/link-options)                                                  | Verify native routing/base/link behavior in the target fixture.    |
| SRC16 | [Bits styling](https://bits-ui.com/docs/styling)                                                                    | Plain CSS styling; runtime placement/CSP still needs measurement.  |

## Evidence and deviation record

Planning setup: governing plan created with all 203 checkpoint definitions, eleven ordered RCLD sequences, explicit scope/green/verification gates, 34 product requirements, 22 acceptance criteria, embedded contracts, review dispositions and pending-state ledger. No product checkpoint is marked complete.

Planning validation on 2026-09-28: `pnpm run format:check` passed. A read-only comparison against the approved checkpoint definitions verified all 203 IDs in order and 3,243 field values, allowing only the documented command/prose adaptations. Structural checks passed for every ledger predecessor, all eleven scope/green/verification gates, 34 requirements, 22 acceptance criteria, 27 embedded contract sections, internal links, unique anchors, balanced fences and repository portability. The new-file whitespace check produced no diagnostics. These planning checks are not product tests and do not complete an implementation checkpoint. The reusable repository contract validator was established at S002 as `tools/check-contracts.mjs` with `node:test` regressions.

Implementation reports: S001 is independently accepted by Codex at `bb5010e0605b3d0917a9037eafef69ed90d3b36c`. S002 adopted all 27 contracts, the sixteen-source projection, checkpoint projection and dependency-free validator with regressions. Codex review 4 accepts S002 after all nine correction findings were resolved: the target and both advanced-state suites pass 83/83 sequentially, full-definition preservation passes, and the unchanged reference's same-checkpoint Rust guard remains green. S002 is complete at `9ed224f60249ee67732c05737170436e06301c38`; the real hash was recorded afterward without amending history. The shared-temp concurrent-suite limitation is recorded for S005. S003 is now in_progress under the exact dependency dispatch above; S004 remains locked. Record subsequent evidence with the report/deviation formats and update the ledger from real outcomes.
