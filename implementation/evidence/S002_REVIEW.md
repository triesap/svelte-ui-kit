# S002 independent review — Codex

Current disposition: **review 4 — accepted**. Earlier reviews below are
historical. All S002-R1 through S002-R9 acceptance findings are resolved.
Codex has independently verified the 83-test candidate and both advanced-state
rehearsals. S002 is complete at
`9ed224f60249ee67732c05737170436e06301c38`. Codex recorded this actual hash
after the commit, without amending history; the factual update travels with S003.

Historical review-1 date: 2026-09-28. Its starting and ending HEAD:
`bb5010e0605b3d0917a9037eafef69ed90d3b36c`.

Historical review-1 disposition: **changes requested**. S002 was `in_progress`; S003 was locked.
No S002 commit or product release is accepted. Pi owns implementation fixes;
Codex has resolved the next dispatch and its decision boundaries in the
governing plan's “Codex correction dispatch — S002 review 1” section.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S002","kind":"review","commit":"9ed224f60249ee67732c05737170436e06301c38","disposition":"accepted"}
-->

## Reviewed scope and successful work

Reviewed the complete validator and test source, all 27 adopted documents,
both JSON projections, the full checkpoint-definition preservation comparison,
package diff, S001/S002 evidence, submitted response and the relevant Pi session
log. The session identifies `ollama` / `deepseek-v4.1-flash:cloud` and records
the supported process-local Node 24.21.0 runtime selection.

An independent comparison against `bb5010e` confirmed all 26 adopted document
bodies after whitespace normalization and the two documented link rewrites;
AGENTS.md is a manually reviewed merge. All 203 complete checkpoint definitions
match after the scheduled contract-link rewrites and whitespace normalization.
This compares the full definitions, not just titles/requirement anchors. The
package change is exactly the two approved scripts; dependencies, engine,
package manager, lockfile and workspace membership are unchanged.

The read-only reference remains clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98`. Pi's task log records successful
reference fmt/check/test exits. Its full test log confirms 562 top-level passes
plus 16 nested subprocess passes, zero failures and four ignored tests. These
are inspected Pi results, not a fresh independent Rust execution in this review.
The reviewer did not repeat the Rust suite because source-level S002 blockers
already prevent acceptance and no reference source changed.

The four ignored reference tests are
`installed_binaries_run_after_package_source_and_build_state_are_deleted`,
`homepage_fixture_cli_workflow_smoke`,
`tests::every_transaction_io_fault_avoids_partial_application_state`, and
`packaged_sources_build_with_cargo_vcs_provenance_outside_and_inside_hostile_git`.
The exhaustive fault matrix is not a packaging test; none of these four is
claimed as executed by the ordinary workspace run.

## Blocking findings

### S002-R1 — Completion validation accepts absent or negative acceptance

`tools/check-contracts.mjs:828` accepts a matching hash in either report or
review, while merely checking that both files exist. Empty review files and
reviews explicitly saying “rejected; do not accept” both validate with zero
errors. At line 853, missing `.git` silently skips commit verification; a
fabricated forty-character hash and fabricated evidence then validate cleanly.
All submitted test fixtures omit Git, so they never exercise the commit check.

Require the structured report/review evidence and real repository checks
specified by Codex's correction dispatch. This is an execution-integrity gate,
not a cryptographic proof of human review; substantive review remains Codex's
responsibility. Add positive temporary Git fixtures and targeted rejection cases.

### S002-R2 — Sequence and status representations can contradict each other

`tools/check-contracts.mjs:556` checks counts and contiguous map ranges, but
does not connect ledger sequence membership, sequence states and the detailed
sequence gates. Independently changing S100's sequence to nonexistent RCLD-99,
marking RCLD-11 complete while all its steps are not started, or deleting every
“Definition of green” gate all pass after regenerating the JSON projection.
The ledger's ID order is not directly compared with S001–S203 either.

Validate the fixed sequence/step identities, membership, order, predecessor
links, scope/green/verification gates, states and summary counts together.
Regeneration must not convert inconsistent input into an accepted plan.

### S002-R3 — Broken links and nonexistent anchors can pass

`tools/check-contracts.mjs:517` treats any absent path beneath selected code
prefixes as a future deliverable. An ordinary README link to a nonexistent
source file returns only a warning and succeeds without any future marker.
`extractLinks` omits reference-style links; a missing reference-style target
passes with no warning. `extractAnchors` suffixes duplicate explicit HTML IDs
as though they were duplicate headings; a link to the invented suffix passes.

Use the explicit future annotation chosen in the dispatch, validate actual
reference-style links, and distinguish explicit IDs from generated heading
slugs. Preserve code-formatted link labels in the regression coverage. Fence
handling also needs focused tests: closing is currently based on marker
character rather than opening length.

### S002-R4 — Regression evidence does not prove complete-tree purity

`tools/check-contracts.test.mjs:103` hashes regular-file contents, including
hidden regular files, but omits empty directories, entry modes and symlink
targets. It cannot detect several changes that the report describes as covered
by a complete-tree snapshot. The passing fixtures omit `.git`, leaving the
completion-resolution branch untested. Explicit generation determinism has no
committed regression test.

Use meaningful self-contained Git fixtures, complete lstat-based snapshots,
and CLI regressions for the reproduced gaps, read-only failures and explicit
generation. Preserve the existing useful tests; do not merely change wording
to excuse the missing checks.

### S002-R5 — Authority and reporting need reconciliation

AGENTS.md sent consequential decisions to the owner rather than Codex despite
the explicit orchestration boundary. Codex corrected that sentence. The adopted
catalog retained broad Menu/Avatar language that needs the already-approved
source-parity clarifications beside it; Codex added the normative clarification
section and authorized reconciliation of the affected rows.

The S002 report's claim of byte-equivalent checkpoint definitions “after
parsing” was based on a parser that retains only IDs, titles and anchors.
Codex's fuller comparison passed, but the original evidence description should
state its actual limits. Some extraction hashes are twelve characters under a
sixteen-character column label. The report also describes three ignored lanes
while reporting four ignored tests. Correct these factual descriptions and
record the resolved five decisions instead of leaving them open.

## Independent verification and reproductions

Executed under Node 26.10.0 using the active environment's required routing;
environment diagnostics were green before verification.

| Check                                                  | Result                                        |
| ------------------------------------------------------ | --------------------------------------------- |
| `pnpm run check:contracts` on submitted candidate      | Passed, 0 errors / 0 warnings                 |
| `pnpm run test:contracts`                              | Passed, 15 tests / 0 failures / 0 skipped     |
| `pnpm run format:check` on submitted candidate         | Passed                                        |
| Full adopted-body and checkpoint-definition comparison | Passed as described above                     |
| Package/lock/workspace scope inspection                | Only the two approved package scripts changed |
| Independent mutation checks below                      | Nine invalid cases incorrectly accepted       |

Each mutation used a disposable copy, preserving the target tree. A Git-dir
pointer to the reviewed repository supplied read-only history for cases that
needed Git; the fabricated-hash case explicitly removed that pointer. The
checkpoint projection was regenerated in the disposable tree before validation,
so failures cannot be hidden behind an unrelated projection-drift error.

| Mutation                                               | Observed result before correction    |
| ------------------------------------------------------ | ------------------------------------ |
| Baseline control                                       | 0 errors, 0 warnings                 |
| Empty S001 review                                      | 0 errors, 0 warnings                 |
| Explicitly rejected S001 review                        | 0 errors, 0 warnings                 |
| Fabricated commit/evidence with no Git                 | 0 errors, 0 warnings                 |
| S100 assigned to RCLD-99                               | 0 errors, 0 warnings                 |
| RCLD-11 falsely marked complete                        | 0 errors, 0 warnings                 |
| All sequence green gates removed                       | 0 errors, 0 warnings                 |
| Ordinary link to nonexistent source file               | 0 errors, future-deliverable warning |
| Reference-style link to missing document               | 0 errors, 0 warnings                 |
| Link to invented suffix for duplicate explicit HTML ID | 0 errors, 0 warnings                 |

The reviewer comparison initially used the template's scheduled repo/AGENTS.md
path instead of its adopted root AGENTS.md path; that inspection failed before
completion, was corrected, and then passed. No target implementation was changed
by the comparison. Execution-policy parsing initially rejected an inline
log-reading command; a standalone routed read-only script completed that same
inspection. Neither event is a product defect or an omitted check.

## Next action

Fresh Pi correction session, S002 only, using the updated governing dispatch.
Codex keeps coordination and acceptance. No product/consumer/browser/release
artifact exists for human testing. RCLD-01 through RCLD-11 remain unfinished;
S002–S203 remain 202 unfinished checkpoints.

## Review 2 — correction-pass assessment

Date: 2026-09-28. Disposition: **changes requested**. HEAD remains
`bb5010e0605b3d0917a9037eafef69ed90d3b36c`. The structured review record above
continues to describe the current disposition. This section supersedes the
historical review-1 next-action details; the governing plan's review-2 dispatch
defines the next implementation assignment.

### Scope and verified improvements

Read the complete corrected validator (1,831 lines), test source (819 lines),
affected contracts and evidence, the supplied correction return and relevant
session/verification logs. The session records `ollama` with
`deepseek-v4.1-flash:cloud` and process-local Node 24.21.0. Independently ran the
target checks and all nine original adversarial cases. All nine now reject the
invalid input; their unchanged baseline still validates. The submitted suite
passes all 46 tests with zero failures and zero skipped tests.

Rechecked preservation of all 203 full checkpoint definitions against the
accepted baseline after the approved link and whitespace normalization. All
pass. Of the 26 extracted document bodies, 21 still match that baseline after
normalization; the five intentionally amended contracts (scope, component
catalog, verification, open questions and report template) and merged AGENTS.md
were reviewed separately. The package change remains the two authorized scripts;
dependency declarations, lockfile, engine and workspace membership are unchanged.

The reference repository remains clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98`. The correction session records green
reference fmt/check/test commands. Its full test log contains 562 top-level
passes plus 16 nested subprocess passes, zero failures and four ignored tests.
These are inspected Pi results. Codex did not rerun the unchanged Rust suite
after reproducing the target acceptance blockers.

### S002-R6 — Accepting S002 would break the positive test fixtures

The fixture builder copies the live repository's plan and evidence, creates a
new Git history, and rewrites only S001's real hash. It also assumes a current
completed count of one in several cases and silently ignores the projection
generation exit status. This leaves future completed checkpoints referring to
commits that do not exist in the fixture history.

Independently reproduced this in an isolated temporary repository: committed the
candidate there, recorded a legitimate S002 completion and matching report/review
hashes, updated the summary/projection, and confirmed the validator passes with
both S001 and S002 complete. Running the two positive fixture tests from that
same repository failed both tests because S002's hash cannot resolve in their
new histories. This was a real Git lifecycle rehearsal; no commit was made in
the target. The temporary repository was removed afterward.

Codex requires explicit fixture-owned lifecycle scenarios, fixture-owned Git
history, checked generation exits and failure-safe cleanup. Preserve canonical
negative cases independently of current live progress. Demonstrate the entire
suite passing from a two-complete-checkpoint repository and exercise a later
sequence boundary, as specified by the RCLD dispatch.

### S002-R7 — Candidate errors are swallowed and precommit acceptance is undefined

The non-complete evidence branch skips processing when the parser returns no
record, before inspecting the parser's problems. Malformed JSON in S002's
present candidate record and duplicate S002 review records both validate with
zero errors. Optional absence must not excuse malformed present evidence.

The implementation also rejects an accepted review with null commit when the
ledger is `verified_uncommitted`. The preceding Codex dispatch did not define
this accepted-but-uncommitted metadata state explicitly. Codex resolves that
contract ambiguity in review 2: candidate/changes_requested with null hashes
for optional records before acceptance; required implemented/accepted records
with null hashes for `verified_uncommitted`; required implemented/accepted
records with matching real full hashes for `complete`. Only Codex may assign
actual acceptance, and only committed completion unlocks a successor. Keep
unapproved `not_applicable` fail-closed. Align all affected normative guidance
and test these transitions with synthetic evidence.

### S002-R8 — Fenced examples can replace definitions; duplicate bodies disappear

Independent mutations moved the entire R01–R34 requirements table into a fenced
example, and separately fenced all AC01–AC22 definitions. Both still validate
with zero errors after projection regeneration. A duplicate RCLD-01 body also
passes because a Map overwrites the earlier occurrence before validation.

Codex requires consistent outside-fence structural parsing, including sequence
titles/bodies, requirements, acceptance criteria, source inventory, summaries
and live checkpoint metadata. Preserve multiplicity until duplicate/unknown
sequence bodies have been rejected. Add positive literal-example and negative
missing-real-definition/duplicate-body cases without adding dependencies or an
unrelated Markdown framework.

### Independent review-2 verification

Commands ran with the review environment's Node 26.10.0 and required execution
routing. Source files were not modified by the reviewer.

| Check                                                                         | Result                                                     |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `pnpm run check:contracts`                                                    | Passed: zero errors, zero warnings                         |
| `pnpm run test:contracts`                                                     | Passed: 46 tests, zero failures, zero skipped              |
| `pnpm run format:check`                                                       | Passed                                                     |
| Original nine invalid mutations                                               | All nine now reject; baseline passes                       |
| Malformed candidate / duplicate review record                                 | Both incorrectly accepted                                  |
| Accepted precommit lifecycle state                                            | Incorrectly rejected under the now-explicit Codex contract |
| Duplicate sequence body / fenced requirements / fenced acceptance definitions | All three incorrectly accepted                             |
| Valid isolated two-complete-checkpoint state                                  | Validator passes                                           |
| Two positive tests run from that advanced state                               | Both fail; suite is not lifecycle-stable                   |
| Full checkpoint-definition preservation                                       | All 203 pass                                               |

All adversarial mutations were confined to disposable trees, with projections
regenerated to avoid unrelated drift diagnostics. The advanced-state rehearsal
used temporary Git commits only. The two selected positive tests establish the
failure; Codex did not claim to execute the entire suite in the advanced tree.
Pi must run that full rehearsal after fixing the fixture design.

### Current dispatch and release readiness

Complete S002-R6 through S002-R8 together in a fresh Pi session, preserving the
original nine fixes and all useful regressions. Correct the report's reference
to a committed projection: the candidate projection is still untracked. Return
exact commands, results, fixture/lifecycle evidence and remaining concerns for
Codex review. Do not edit the real acceptance verdict, commit S002 or begin S003.

No human release test or owner decision blocks these corrections. There is
still no implemented UI or release candidate to test. All eleven RCLD sequences
remain unfinished, with 202 checkpoints remaining (S002–S203).

## Review 3 — focused evidence-boundary correction

Date: 2026-09-29. Disposition: **changes requested**. Starting and ending target
HEAD remains `bb5010e0605b3d0917a9037eafef69ed90d3b36c`. The sole structured
review record remains `changes_requested` with null commit. No S002 acceptance,
target commit or successor work is authorized by this review.

### Reviewed work and improvements

Read all three tooling sources in full: validator (1,943 lines), regression
suite (1,245 lines), and the new fixture module (372 lines). Reviewed the updated
verification, scope/ownership and report guidance, author report and supplied
return, relevant session commands, projections and Git state. The session's model
record confirms `ollama` / `deepseek-v4.1-flash:cloud`; Pi selected process-local
Node 24.21.0 for its target tooling.

The previous S002-R6 fixture lifecycle failure is corrected: the allowlisted
fixtures normalize all structural state and use their own temporary histories.
The S002-R7 state matrix, non-object/malformed-JSON/duplicate closed records,
and successor eligibility are implemented. S002-R8 correctly excludes fenced
structural definitions and rejects duplicate/unknown sequence bodies. The new
regressions are substantive and the complete 70-test target suite passes with
zero failures or skipped tests. One boundary defect remains where evidence
record extraction interacts with incomplete comments and fences.

Independently repeated the full preservation comparison: all 203 entire
checkpoint definitions match the accepted baseline after approved link and
whitespace normalization. Twenty-one unamended extracted contract bodies also
match. The five intentionally amended contracts and merged AGENTS.md were
reviewed separately. The manifest still changes only the two approved scripts;
no dependency, lockfile, engine or workspace change occurred. The ordinary
validator's structural checks do not themselves establish full-body equivalence;
Codex corrected that overstatement in the candidate report.

### S002-R9 — Raw comment matching can hide malformed or valid evidence

At `parseEvidenceRecords` in `tools/check-contracts.mjs`, the regular expression
matches complete comments over the raw document before filtering fenced starts.
Consequently an opening marker without a closing delimiter is not counted at
all, and a fenced opening can consume a later live record before being discarded.

Independent disposable-repository probes produced:

| Probe                                                                   | Observed result                   | Required result                                   |
| ----------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------- |
| Unchanged canonical fixture                                             | Zero errors / warnings            | Pass                                              |
| Remove the closing delimiter from S002's candidate record               | Zero errors / warnings            | Reject malformed present evidence                 |
| Append an unterminated extra record to a valid completed S001 review    | Zero errors / warnings            | Reject malformed extra live evidence              |
| Put a fenced unfinished example comment before a valid completed review | Missing completion-evidence error | Pass; literal example cannot hide the live record |

The first two cases are false acceptance; the third is false rejection of a
valid record after an inert example. All changes were confined to disposable
fixtures, and the real candidate's implementation sources were not edited.

Codex resolves the exact parser boundary in the governing review-3 dispatch:
count every live opening attempt, diagnose missing termination in every state,
and prevent fenced content from contributing or consuming live delimiters.
Keep the five-key schema and accepted lifecycle rules. A focused scanner or
equivalent masking fix with positive/negative parser and CLI regressions is
sufficient; no dependency or broader Markdown framework is warranted.

### Reference selection and report reconciliation

Pi's failed Rust attempt used an alternate cached checkout outside the permitted
build area. Codex located the already-authorized reference worktree inside that
area, confirmed its clean state at
`a10fbf06334f4648f5755e05a7147414e4e5fc98`, and ran fresh verification there.
The existing worktree resolves the reported environment decision without a new
copy or policy override. Future Pi returns must select that worktree from the
operator dispatch and report any unexpected identity mismatch to Codex.

The candidate report had introduced private workstation tooling names/config
details into public content. Codex removed those details while preserving the
distinction between Pi's blocked attempt and fresh reviewer execution. Exact
local paths, routing commands and logs remain external coordination evidence.
Keep that boundary when appending the next correction report.

### Current verification and next action

Independent target contract validation passed with zero errors and warnings;
the full suite passed 70/70 with no skipped tests; formatting passed. The
completed advanced-state and reference guard results are recorded below.
Review commands used Node 26.10.0 with required execution routing. No product,
browser or package lane exists at this checkpoint.

Complete S002-R9 and its report reconciliation in a fresh Pi session, preserving
all previous fixes and rerunning target lanes plus both full advanced-state
rehearsals. The remaining work is entirely within S002; no owner decision or
human release test is needed. All eleven sequences and S002–S203 remain
unfinished (202 checkpoints).

### Completed independent verification

All commands below completed with exit 0. The adversarial S002-R9 probes above
remain acceptance blockers despite these green existing lanes.

| Lane                                                       | Result                                                                       |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `pnpm run check:contracts`                                 | Zero errors / warnings                                                       |
| `pnpm run test:contracts`                                  | 70 passes, zero failures or skipped tests                                    |
| `pnpm run format:check`                                    | Passed, including the final governance edits                                 |
| Explicit checkpoint projection generation                  | Passed; Markdown/projection aligned                                          |
| Isolated two-complete-checkpoint validation and full suite | Zero validation errors / warnings; 70 passes, zero failures or skipped tests |
| Isolated sequence-boundary validation and full suite       | Zero validation errors / warnings; 70 passes, zero failures or skipped tests |
| Reference `cargo fmt --all -- --check`                     | Passed                                                                       |
| Reference `cargo check --workspace --all-targets`          | Passed                                                                       |
| Reference `cargo test --workspace --all-targets`           | 562 top-level passes plus 16 nested passes; zero failures, four ignored      |
| Target `git diff --check`                                  | Passed; nothing staged                                                       |
| Reference final identity/status                            | Still clean at `a10fbf06334f4648f5755e05a7147414e4e5fc98`                    |

The four ignored reference tests are the same named lanes listed in review 1;
none is reported as executed. No target Cargo manifest, product UI, browser
fixture or release package exists yet. No platform or release qualification is
claimed by these checks.

Codex authorizes reuse of this fresh same-checkpoint Rust guard for the next
S002 parser-only correction, conditional on the same reference hash and clean
state and no changed Rust scope. Pi must label it as reviewer evidence rather
than a fresh author execution. Later checkpoint guards remain required.

## Review 4 — accepted S002

Date: 2026-09-29. Disposition: **accepted**. Starting target HEAD is
`bb5010e0605b3d0917a9037eafef69ed90d3b36c`. Codex accepts the complete S002
candidate after the final R9 correction. No product/release completion is
implied. Commit evidence follows the authorized post-commit recording procedure.

### Resolution and independent checks

Reviewed the replacement fence-masking evidence scanner, all thirteen added
parser/CLI regressions, surrounding evidence validation and fixture behavior,
the three reconciled guidance documents, author report and relevant Pi session
and verification logs. Earlier complete source reviews remain applicable to
unchanged tooling. The session model record confirms
`ollama` / `deepseek-v4.1-flash:cloud`; Pi used process-local Node 24.21.0.

The scanner counts every live opening attempt and reports unterminated attempts;
fenced examples cannot consume or repair live delimiters. Independently replayed
the three original R9 probes: the unterminated candidate and extra live attempt
now reject as malformed, while a valid review following an unfinished fenced
example validates. The unchanged control also validates. The documented
outside-fence definition of live metadata includes inline marker mentions;
literal examples must remain fenced.

| Independent lane                                  | Result                                                                                       |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Target contract validation                        | Zero errors / warnings                                                                       |
| Target full suite, sequential execution           | 83 passes, zero failures or skipped tests                                                    |
| Two-complete-checkpoint validation and full suite | Zero errors / warnings; 83 passes, zero failures or skipped tests                            |
| Sequence-boundary validation and full suite       | Zero errors / warnings; 83 passes, zero failures or skipped tests                            |
| R9 boundary probes                                | All three now have the required outcome; control passes                                      |
| Formatting and diff health                        | Passed                                                                                       |
| Full-definition preservation comparison           | All 203 complete definitions preserved after approved link/whitespace normalization          |
| Unamended adopted-body comparison                 | 21 bodies match; five approved amended contracts and merged instructions reviewed separately |
| Manifest and lock scope                           | Only the two approved scripts added; dependencies/lock/engine/workspace unchanged            |

The same-checkpoint reference guard from review 3 remains applicable: the
reference is still clean at `a10fbf06334f4648f5755e05a7147414e4e5fc98` and no
Rust scope changed. Its fresh reviewer fmt/check/test results were all exit 0,
with 562 top-level plus 16 nested passes, zero failures and four ignored tests.
Neither Pi nor Codex repeated that unchanged Rust suite for R9, and neither
claims an additional fresh Rust execution here.

### Test-invocation limitation and scheduled follow-up

The reviewer initially launched the target suite and advanced-state rehearsal
concurrently in a shared temporary namespace. The existing cleanup regression
enumerates every directory with the fixture prefix; it falsely attributed the
other live process's newly created fixture to a leak. The target run reported
82 passes / one failure, and the overlapping rehearsal also failed that
assertion. This is an invocation-isolation limitation in the pre-existing
cleanup assertion, not an R9 evidence-parser or actual fixture-cleanup failure.

The subsequent sequential target and both rehearsal runs all passed 83/83.
No assertion was disabled or weakened. Codex records sequential suite execution
as the current verified invocation and assigns per-invocation cleanup ownership
to the already-scheduled S005 test-harness work. S005 must prove overlapping
independent runs do not confuse each other's fixtures and still detect a real
owned leak. Concurrent suite support was not an S002 acceptance requirement;
this bounded tooling limitation does not block its verified contract behavior.

### Acceptance and next boundary

All nine S002 correction findings are closed. Codex owns the accepted checkpoint
commit and real-hash bookkeeping. The next checkpoint is S003 after that commit.
The governing S003 dispatch fixes dependency choices from current primary
metadata, requires strict/frozen lock verification, and preserves later CLI,
consumer and component milestones. Pi continues to author implementation.
No human release test is available or required at this stage.
