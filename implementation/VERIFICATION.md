# Verification commands and known-good commits

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

#### Discover before executing

The authorized target is this repository. At S001 record Git root/status, authorized target/reference roots, package manager and lockfile, Node/Svelte/Bits/TS versions, package scripts, CI workflows, OS support, and any Cargo workspaces. Use `git status --short`, `git log -12 --pretty=%s`, manifest inspection, and existing instructions. Do not execute application config or install dependencies merely to enumerate it.

The plan uses the following **proposed command categories for a new target**, not claims that these scripts already exist. Establish actual scripts or map existing equivalents during bootstrap and record the mapping in the implementation evidence. Use the detected package manager rather than replacing its lockfile. Commands must execute meaningful checks; placeholder scripts that always succeed are prohibited.

| Category                          | Proposed invocation                                        | Required meaning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Documentation/contract validation | `node tools/check-contracts.mjs` (establish in S002)       | Validate repository contracts, links, checkpoint order and requirement coverage; allow truthful evolving implementation status. This does not verify product behavior.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Format                            | `pnpm run format:check`                                    | Nonmutating Prettier check over the maintained authoring tree (root configuration, `src`, `tools`, `tests`, and future authored `registry` templates/assets) with the Svelte formatter plugin; the reserved dependency/output trees (`node_modules`, `.pnpm-store`, `dist`, `build`, `.svelte-kit`, `coverage`, `.unit-test-build/`) are excluded at every depth, and the explicitly rooted `tests/fixtures/generated/` boundary and ignored evidence-log trees are excluded, and an unrelated external application is never traversed or rewritten. `pnpm run format` is the explicit authoring-only write command. This is authoring formatting only, not consumer or release readiness.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Lint                              | `pnpm run lint`                                            | Real flat ESLint (`eslint . --max-warnings 0`) using `eslint.config.mjs`: JavaScript, TypeScript and Svelte recommended presets plus the Prettier conflict presets, the actual TypeScript parser inside Svelte `<script lang="ts">` blocks, and Svelte compiler/accessibility diagnostics through `svelte/valid-compile`. Node globals are scoped to CLI/tooling/test/config files and browser globals to Svelte/client authoring contexts. Syntax-aware only (no project-service type-aware architecture); no `--fix`, cache or suppressed new violations. The reserved dependency/output trees (`node_modules`, `.pnpm-store`, `dist`, `build`, `.svelte-kit`, `coverage`, `.unit-test-build/`) are ignored recursively at every depth, alongside the rooted `tests/fixtures/generated/` and evidence-log boundaries.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| CLI typecheck                     | `pnpm run typecheck`                                       | TypeScript compiler checks for Node CLI and tests.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Unit                              | `pnpm run test:unit -- <test-file>`                        | Build the product, then compile every discovered `tests/unit/*.test.ts` entry through an ephemeral configuration inside the ignored `.unit-test-build/unit/` suite tree that extends `tsconfig.unit.json`, and run the selected files through the dependency-free Node runner (`--suite unit`, the default). Discovery is deterministic and includes dot-prefixed names; invalid operands (absolute, parent-directory, symlinked roots/ancestors) fail closed; every selected file must yield a completed per-file summary with at least one executed passing test and no failure event, including TODO-marked ones. Explicit repository-relative operands control execution only; no globs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Unit harness                      | `pnpm run test:harness`                                    | Focused regression suite for the suite runner itself (`tools/run-unit-tests.test.mjs`), covering empty/failed/skipped/TODO selections, imported and inline failure attribution, timeout cancellation, abnormal exit, stale-output and symlink-boundary guards, dot-name compilation agreement, nested-runner isolation, unknown/missing suite rejection, integration-suite selection, suite-scoped output isolation and integration compile diagnostics.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Integration                       | `pnpm run test:integration -- <test-file>`                 | Build the product, then run the typed integration suite (`--suite integration`) over discovered `tests/integration/*.test.ts` entries compiled by `tsconfig.integration.json` into the isolated ignored `.unit-test-build/integration/` tree. Tests use the typed helpers under `tests/helpers/` (owned temp project, complete-tree snapshot, real built-CLI invocation) and invoke the actual executable; they never mock stdout/stderr/exit or target a user project. The same fail-closed selection, compilation, per-file summary, TODO-cancellation and cleanup protections as the unit suite apply. The owned temp project requires an existing final write target to be a regular file, rejecting FIFO, socket and device entries before opening while preserving the symlink and ancestor protections, with an externally bounded owned-child FIFO regression, a real-helper rejection control, a regressed-blocking-writer termination control, and a short-root socket control; a missing `mkfifo` or fixture setup failure fails rather than skips on supported platforms.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Registry                          | `pnpm run test:registry -- <test-file>`                    | Manifest/asset/schema/contract/export integrity.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Components                        | `pnpm run test:components -- <test-file>`                  | Runs the typed component suite (`--suite components`) over `tests/components/*.test.ts` compiled by `tsconfig.components.json` into the isolated ignored `.unit-test-build/components/` tree. The current suite drives the real `svelte-check` on the maintained fixture-only Bits `Switch.Root`/`Switch.Thumb` compatibility component (positive typed `bind:checked`, `bind:ref` and `child`-snippet forwarding plus a delegated native button) and proves incompatible `checked`/`ref`/`child`-snippet examples fail for their intended diagnostics in disposable copies, then restore to green. It introduces no public kit wrapper. It also runs the mandatory strict declaration audit (`tests/components/strict-declaration.test.ts`): the real `skipLibCheck: false` checker runs in an owned copy, exactly the two pinned Bits 2.19.3 union-complexity diagnostics are qualified, and authored or additional dependency errors are rejected. The audit consumes the pinned `svelte-check --output machine-verbose` protocol and fails closed on malformed, truncated, unknown, duplicate or inconsistent output; it validates the executed Bits/TypeScript/Svelte/svelte-check/csstype/date pins and the real installed-package paths, and adds pure parser, synthetic classifier and real authored `.svelte`/`.ts`/referenced `.d.ts`/additional-dependency controls, including colon and space filenames. Every `COMPLETED` summary count must be a finite nonnegative safe integer and the total file count must be at least the problem-file count; START's workspace must resolve to the real audited fixture root; and every owned strict-audit copy registers cleanup immediately, with a bounded child control proving cleanup after success and after a deliberate assertion failure. |
| Consumer check                    | `pnpm run fixture:check`                                   | Real `svelte-kit sync` followed by `svelte-check --tsconfig ./tsconfig.json --fail-on-warnings` over the maintained hand-authored Svelte 5/SvelteKit fixture at `tests/fixtures/consumer/`; it does not yet typecheck generated or tarball output.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Consumer build                    | `pnpm run fixture:build`                                   | Real `vite build` production SvelteKit build of the maintained fixture through the pinned `@sveltejs/adapter-node`; emits the ignored fixture `build/` output.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Consumer SSR                      | `pnpm run test:fixture`                                    | Builds the fixture and runs the focused `node:test` suites at `tests/smoke/consumer-fixture.test.mjs` and `tests/smoke/owned-server.test.mjs`. Hosts the adapter's real `build/handler.js` in an owned child process on an OS-assigned loopback port and asserts status, HTML content type and visible server-rendered markup before client JavaScript; proves distinct repeated/concurrent request values and HTML escaping; and runs disposable-copy controls proving a real Svelte/TypeScript mismatch fails `fixture:check` and that a real SSR-disabled build fails only the specific missing-markup assertion. HTTP status and content type are asserted independently, so an HTTP 500 or a wrong content type fails rather than satisfying the negative control. The owned-server boundary records stderr and the exit event through teardown, distinguishes an intentional stop, bounds startup/request-headers/request-body/stop deadlines, and is driven by deterministic startup-failure, error-stderr, post-ready-exit, stalled-header, stalled-body and cleanup fault controls, including default and explicit launcher operands. Stops owned servers and removes owned temporary copies on success and failure. The owned child environment drops a conflicting `FORCE_COLOR` only when `NO_COLOR` is present, preserving the parent environment and strict stderr checks.                                                                                                                                                                                                                                                                                                                                                                                                                |
| Browser                           | `pnpm run test:browser -- <test-file>`                     | Builds the maintained fixture, then runs Playwright 1.63.0's real runner with bundled headless Chromium over `playwright.config.ts` against `tests/browser/harness.spec.ts`. The spec starts the built Node-adapter production handler through the shared owned-server boundary on an OS-assigned loopback port and asserts the accessible heading/labels, Tab/Shift+Tab focus order, native checkbox Space activation, form navigation with a request-time query update, and a fixture-only client-state interaction that requires hydration. Unexpected server stderr/exits, page exceptions, console errors and hydration warnings fail the lane. Enforcement runs after `page.close()` drains the page lifecycle; a failure screenshot is captured while the page is still available and retained as a real output artifact for collector-detected faults, while ordinary body assertion failures keep Playwright's own artifacts. Bounded per-fault child runs prove console errors, hydration warnings, page exceptions and their teardown emissions each fail for the intended diagnostic, every fault asserts nonempty screenshot and trace artifacts, an ordinary body-assertion fault kind retains its own artifacts, and a clean restoration run leaves isolated, artifact-free output. Startup-ownership controls prove a rejected `startFixtureServer` readiness stops and drains its owned child, and the owned child environment drops a conflicting `FORCE_COLOR` only when `NO_COLOR` is present. Failure traces/screenshots stay in ignored `tests/browser/.output/`. Initial qualified lane is bundled Chromium on macOS/Node 24.21.0; CI targets Ubuntu 24.04. No Firefox/WebKit/Windows qualification is claimed.                                                                  |
| CLI build                         | `pnpm run build`                                           | Build actual executable and bundle/retain required assets.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Package                           | `pnpm pack --json`; `pnpm run test:package -- <test-file>` | Inspect and execute installed tarball outside authoring tree.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Diff health                       | `git diff --check`; `git diff --cached --check`            | Whitespace and final staged-content review.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

In early steps before a lane exists, execute the meaningful already available baseline plus the current step's direct validator. Add the lane and its real test in the same step that introduces that capability. Do not report an unavailable script as passed. Every step lists its direct lane; component steps also need the app's check/build where the feature affects generated output.

#### S002 projection field sources and evidence metadata

The S002 tooling is a derived projection, never an independent authority. Each
projected field has one documented source:

- `schemaVersion` is the validator's schema constant (`1`).
- `source` and `generator` are fixed descriptive literals.
- `sequences[].id`, `first`, `last`, `count`, `state` and `predecessor` come
  from the sequence-map table in `implementation/COMMIT_SEQUENCE.md`;
  `sequences[].title` comes from the matching `### RCLD-NN` heading.
- `steps[].id`, `title` and `requirements` come from the checkpoint definition
  headings and their `**Contract anchors:**` line (deduplicated and sorted);
  `steps[].sequence`, `dependsOn` and `status` come from the checkpoint ledger
  row.
- `steps[].completion` (`commit`, `report`, `review`) is derived from the
  structured `checkpoint-evidence` records in the conventional
  `implementation/evidence/<ID>_REPORT.md` and `<ID>_REVIEW.md` paths, and is
  `null` for any non-complete status.
- `references/SOURCES.json` fields (`id`, `label`, `url`, `boundary`) come from
  the plan's reference URL inventory table.

Completion evidence uses exactly one
`<!-- checkpoint-evidence {...} -->` record per report/review file with exactly
`schemaVersion`, `checkpoint`, `kind`, `commit`, `disposition`. Every live
opening marker establishes a present record attempt even without a closing
delimiter, and every attempt is counted and validated; an unterminated attempt
is malformed evidence in every lifecycle state. Records inside fenced literal
examples are not live records: fenced content contributes neither records nor
delimiters and cannot consume, terminate, repair or hide live metadata. A
non-fenced mention of the marker in prose or inline code is a live attempt, so
literal examples must be fenced.
Malformed JSON, non-object payloads, duplicate records and unterminated
attempts are rejected in every lifecycle state; an absent optional record is
different from a malformed present record. The authoritative state rules are:

| Ledger status                           | Report disposition | Review disposition  | Commit field         | Evidence requirement                                                                                                        |
| --------------------------------------- | ------------------ | ------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `not_started`, `in_progress`, `blocked` | `candidate`        | `changes_requested` | `null`               | Records optional; every present record must resolve to this checkpoint and kind                                             |
| `verified_uncommitted`                  | `implemented`      | `accepted`          | `null`               | Both records required; only Codex assigns this state and its acceptance                                                     |
| `complete`                              | `implemented`      | `accepted`          | matching full hashes | Both required, with the full lowercase 40-digit hash resolving to a HEAD-reachable commit that contains both evidence paths |

`steps[].completion` stays `null` until `complete`, and only a committed
completion unlocks a successor. Unapproved `not_applicable` fails closed.
Default validation is read-only; `--generate` and `--generate-sources` are the
only writing modes.

#### Current RCLD-04 complete-boundary qualification

Independent review 16 of clean candidate `dd5a489` requests changes. Follow
current RCLD04-R2-1/2/3/4/5 and ALL original S064–S077 criteria in the sole
COMMIT_SEQUENCE. Preserve 63 accepted / 14 pending / 126 not_started and the
live RCLD-04 tuple; independent acceptance of the full boundary gates S078.

The 51 previous compiled cases retain their scoped safe outcomes. Preserve
those repairs, ignored runtime evidence and standalone public reports. Ten new
causal cases expose physical acquired-owner substitution, discarded planned
ancestry identity/flush failures, absent recovery-cleanup parent durability,
initial coordination creation residue, unmapped stylesheet/export integrations,
raw exported restore exceptions, unrelated owner overwrite on failed release,
and malformed nested target-preimage serialization exceptions. Complete every
original structured authority/protocol path, not only these named examples.

Fresh independent build/typecheck/format/lint pass; unit 283, integration 440,
contracts 0 errors/0 warnings and zero skips. Thirty-three retained author raw
log/probe/exit files match hashes; broader fixture/Chromium/contracts/reference
lanes are author evidence, not newly independent feature acceptance. Retain
unique complete raw outputs and underlying exits for each final lane/attempt,
exact final source/artifact/platform/configuration identity and honest skips.

Multi-item tests currently cover default add/update/retirement with selected
output assertions. Complete the factual default/custom lifecycle/cohort matrix,
complete-tree/physical/ownership comparisons and check/build/render of those
resulting consumers. Shipped foundation, representative multi-item fixtures and
current guarded production-core process restart remain the approved approach;
future S081 CLI and S096/S097 catalog stay at original gates. Complete actual
syscall failure/flush ordering and guarded cross-device refusal qualification,
including metadata-only plans. Single-volume hardware does not block deterministic
software automation. Reconcile R5 complete/no-gap claims with actual evidence;
AC20 and four ignored reference tests remain separately open/explicit.

At each green checkpoint run affected causal tests plus static/contracts. At the
FINAL composed candidate run frozen strict install, build/typecheck/format/lint,
unit/integration/registry/CLI/harness/components including strict declaration
controls, fixture check/build/SSR/browser, projection generation/validation/
contract regressions, checksum-qualified actionlint and applicable unchanged
reference fmt/check/test. Serialize fixture writers. Capture full raw outputs and
underlying exits BEFORE presentation truncation; retain failed attempts, versions,
source/artifact/platform/configuration identity at ignored repository-relative
paths. Do not treat a pipeline status or broad result enum as full qualification.

Use original immutable snapshots through real production planners, composition,
validation and guarded application. Qualify actual shipped foundation init/sync;
for current item lifecycle use representative multi-item registry fixtures under
already approved contracts, including dependencies, hybrid sources, multiple CSS
blocks and export/layout cohorts. Cover default/custom add/sync/update/retirement/
metadata/satisfied/conflict, compare complete trees/bytes/modes/kinds/links/ownership
and unrelated content, and check/build/render resulting consumers. Current empty
catalog and later CLI commands are intentional dependency boundaries; do not
implement S081 or S096/S097 early or defer eligible core qualification to them.
Process interruption/restart uses current guarded production core with original
snapshots/replanning, automatic busy refusal and the documented bounded operator
resolution before coordinated restart. No uncoordinated shortcut or test-only
lock bypass. Qualify deterministic cross-device refusal, actual creation/removal/
release/recovery flush failures and publication witness states. Record genuinely
unrun physical/platform lanes honestly without classifying software as blocked.

Preserve AC20's exact fixture-only two upstream Bits TS2590 exception and strict
17 controls; no extra suppression, weakened tests, accessibility bypass or SSR
change. Reconcile every S064–S077 and repair report to actual final coverage;
passing old probes does not supersede unfinished original criteria. Continue
all eligible work after each green checkpoint until the full boundary or a
legitimate observed stop. Pi records implementation/evidence; Codex accepts.

#### Historical owner-authorized RCLD-03 batch verification

Independent review 8 of candidate `a4c2e4a0bfd68e2463090b9e4886ab4509f7d12e`
requests RCLD03-R8-1/2/3 and every unfinished S033–S063 criterion together.
Fresh independent build/typecheck/format/lint pass; unit 265/265, integration
278/278, registry 38/38, CLI 52/52, harness 37/37 and contracts 127/127 pass
without skips. Prior manifest/manager, environment-immutability and detached-token
init probes are repaired, as are earlier token/rendering cases. Preserve this
verified progress. The actual planned production page/control remains qualified;
whole-sequence acceptance is withheld.

Four real-registry probes exposed the remaining effective mapping/ownership
criteria. These are now implemented through candidate `2fa0cd3` (see
`implementation/evidence/RCLD03_R8_REPAIR.md`): the bounded `_kit/kit.json`
discovery is captured with the selected-package evidence and composed into one
effective mapping used by init/add/sync, so a static nondefault routes
directory, an observed custom installation and an explicit fallback for a
dynamic routes config all plan their actual targets, while malformed,
ambiguous, unsafe, location-mismatched or stale/incomplete inputs are refused
without a live read. `planInit` now refuses tracked missing owned stylesheet
content with a causal conflict, zero writes and unchanged lineage, keeping an
empty present body distinct from an absent block. Lifecycle tests use one
shared strict create/update/retire applier, assert intended diagnostic causes,
and the planners run under a denied-permission child that behaviorally proves no
writer or package manager starts.

A supported nondefault mapping is also qualified end to end in
`tests/integration/planned-consumer.test.ts`: the exact add plan writes the
active `src/views/+layout.svelte`, that layout imports the intended styles, and
the production handler checks, builds and renders the page, with the emitted
plan envelope asserted.

After all eligible implementation the full S063 qualification ran on this
candidate: strict frozen install, build/format/lint/typecheck,
unit/harness/registry/integration/CLI, components, fixture check/SSR/browser,
contracts, planned default and custom consumers, emitted planning, strict
declaration controls, workflow validation and a fresh conditional reference
guard. Raw logs are retained in the ignored
`implementation/evidence/logs/r8-20261002/` paths (underlying exits in
`exits.log`); all 16 lanes exited 0 and the counts are unit 265, harness 37,
registry 38, integration 295, CLI 52, components 22 (strict declaration 17/17),
fixture 23, browser 23, contracts 127. `actionlint 1.7.12` (archive SHA-256
`aba9ced2…e6953f`) validated `.github/workflows/ci.yml` at exit 0 with
shellcheck 0.11.0, and the clean `leptos_ui_kit` reference guard at
`a10fbf06334f4648f5755e05a7147414e4e5fc98` ran fmt/check/test at exit 0 with
578 passed, 0 failed and four ignored tests. The complete current logs replace
the prior `/tmp` references, which are historical and are not attributed to
this candidate. The four reference ignored tests
(`installed_binaries_run_after_package_source_and_build_state_are_deleted`,
`homepage_fixture_cli_workflow_smoke`,
`tests::every_transaction_io_fault_avoids_partial_application_state` and
`packaged_sources_build_with_cargo_vcs_provenance_outside_and_inside_hostile_git`)
were not executed and are not claimed as passed. Release AC20's narrowly
qualified fixture-only Bits 2.19.3 declaration exception remains open.

Keep original pending hashes, structured statuses, accepted reviews and public
repository boundaries. All remaining RCLD-03 work is one batch with no intermediate
repair stop. S001–S032 stay accepted, S033–S063 pending and S064–S203 not_started;
independent S063 acceptance remains required before transaction writer work.

#### Historical owner-authorized RCLD-02 batch verification

The following review4 changes-requested state is historical and superseded by
the independent S013–S032 acceptance in the current RCLD-03 dispatch.

Current independent review4 of `e0a23bb3423fe88e109da8e11a52ae58251ae641`
requests both RCLD02-R4 groups in COMMIT_SEQUENCE.md. R3-1 joint compatibility
is closed; registry within-item/cross-item ancestry, lock same-category
case/ancestry and integration-directory checks are verified progress. Preserve
previous closed findings and accepted RCLD-01. Fresh reviewer typecheck,
unit194/194, registry 38/38, integration22/22, CLI 52/52 and contracts117/117
pass without skips. Replayed original probes pass, but nine cross-role or
required-directory lock negatives still pass the actual parser incorrectly.

Validate one complete normalized lock claim inventory against the current
role-compatibility matrix. Cover exact sharing, ASCII aliases, strict ancestry
in both directions, directory roles and safe siblings across all source/block/
integration pairs, with parsed and emitted-installed controls. Only distinct
CSS blocks and compatible stylesheet integration may share an exact aggregate
path; preserve compound siblings and valid directory nesting. No separate
per-category check establishes whole-set validation.

Run all original direct and cumulative checks and the final reference guard.
Keep repaired intermediate failures, final failures, ignored tests and the
qualified upstream exception distinct. The prior native run had a193/194 unit
attempt from a malformed custom-context fixture and an initial formatting
failure; both were repaired before final green lanes. A final pass cannot be
reported as no failed attempts. Public evidence must exclude operator-specific
router metadata and distinguish archive checksums from extracted binary hashes.
No acceptance counter/pending hash changes until Codex independently accepts;
release AC20 debt and platform/package limitations remain explicit.

The following review1 record is historical evidence and its unresolved original
criteria remain in scope under the current review4 dispatch.

Independent review of candidate `9b576117ac1e76b3e724921ca12405a8e079f05f`
requests changes under all seven RCLD02-R1 groups in COMMIT_SEQUENCE.md.
Fresh reviewer typecheck, unit148/148, registry8/8, CLI49/49, harness37/37,
integration15/15 and contracts117/117 passed with zero skips, but built-module
probes demonstrate unmet original criteria. Acceptance remains12/203; twenty
checkpoints remain pending. Keep S033 locked and all accepted evidence intact.

Required repair controls cover unsafe config/lock mappings and release identities;
provider-bound schema compilation, missing/corrupt schemas and UTF-8 source;
listing containment and deeply immutable snapshot observations; strict joint
SemVer membership; healthy shared aggregate CSS plus integrated graph/ownership
failure cases; spawned JSON usage/metadata failures; and canonical JSON/layer
order validation. Exercise actual emitted modules in an isolated installed
package from a different CWD, with explicit runtime dependencies and no source
fallback. Record original failures and repaired controls separately, without
host coordination paths or routing commands in this public repository.

Pi must complete the full eligible RCLD-02 closure work and cumulative lane set
before returning. Existing reports and pending hashes are provenance, not proof
of acceptance; independent Codex review and atomic acceptance remain required.

S001–S012 and RCLD-01 are independently accepted at the evidence anchor in
COMMIT_SEQUENCE.md. The current dispatch authorizes the full S013–S032 sequence
with green local Pi implementation commits pending Codex review. S033 remains
locked until independent S032 acceptance. Preserve all original direct and
cumulative checks and the fixture-only upstream exception's release AC20 debt.

Before the first S013 commit, implement the exact bounded authorization
extension and activation defined in the governing dispatch. Keep one live
record, historical fixtures, reachable pending hashes and existing acceptance
semantics. Add registry selection to the typed runner/typecheck/CI at S027;
verify real negative controls, selection containment and no false zero-test
success. Schema, installed-asset, graph, dependency and collision tests must
cover actual production callers. Resolve the known fixture cleanup diagnostic
loss without hiding failed setup or broadening acceptance. Run all existing
target lanes plus the new registry lane and local installed-package asset
checks at the sequence boundary, with an actual actionlint run and fresh
reference guard. Pi records implementation evidence; Codex alone accepts.

#### Historical owner-authorized RCLD-01 batch verification

The 2026-09-30 "Codex review dispatch" in `COMMIT_SEQUENCE.md` governs the
current complete repair/qualification batch. Its current independent review
requires all three RCLD01-R3 closure groups: consistent strict-audit totals and
workspace identity plus owned fixture cleanup; screenshot/trace retention for
collector-detected browser failures; and externally bounded FIFO regression
coverage with locally executable socket coverage. Preserve the verified R2
behavioral repairs and the closed startup-ownership finding.
It requires a fail-closed machine-readable strict audit, browser enforcement
after page teardown, ownership cleanup on startup rejection, and nonregular
write-target rejection. It preserves the earlier requirements: lifecycle checks
through teardown, physical containment, actual Switch.Thumb coverage, the
shared CLI executor, historical validator compatibility and a synthetic atomic
acceptance rehearsal. Keep original pending implementation hashes while adding
repair evidence. Codex alone performs the later real acceptance transition.

The fixture's temporary declaration-check exception is valid only with the
mandatory strict audit and diagnostic controls specified in that dispatch.
The raw strict audit currently exits 1 with two pinned upstream errors; report
that failure and the qualified baseline separately. Authored diagnostics stay
fatal. Resolving the upstream exception remains an open release AC20 obligation.

The `pfc through RCLD-01` dispatch in the governing document permits Pi's
green implementation commits for S007–S012, followed by independent Codex
review of the sequence. Its explicit within-batch advancement and reference
reuse rules supersede the default per-checkpoint restrictions for that range.
It does not waive target verification or permit a false acceptance claim.

Pi must implement and test the dispatched validator extension before the first
batch implementation commit. New status `committed_pending_review` requires
the exact live batch authorization, a candidate report with the actual
HEAD-reachable implementation hash containing that report, ledger/hash
agreement and ordered predecessor evidence. Independent reviews are optional
and remain `changes_requested`/null while pending; `completion` in the JSON
projection stays null. Only a valid within-batch committed predecessor unlocks
the next coding checkpoint. Missing/widened authorization and S013 advancement
remain errors. Historical fixtures without authorization retain their rules.

Existing `complete`/`verified_uncommitted` evidence semantics stay reserved
for Codex. Pending implementation commits do not count as independent completed
checkpoints or sequences. Record authored/committed progress separately in the
governing document and reports. The validator implements this status
(`tools/check-contracts.mjs`, `STATUS_VOCABULARY` and the live
`checkpoint-batch` authorization parser), with the governing document
carrying a separate `Committed pending review` counter/range line and the
focused regression suite covering permitted within-batch progression,
missing/fake/unreachable/wrong-report/mismatched commits, invalid or duplicate
authorization, premature or uncommitted predecessors, out-of-range S013
advancement, count/projection drift, accepted dispositions on pending work and
non-legitimising generation.

The batch returns all six implementation checkpoints committed and pending
review, with truthful final bookkeeping and a clean target tree. Codex reviews
the actual sequence and records acceptance afterward; Pi never fabricates an
accepted Codex review to unblock itself.

#### Cargo guard — applies to every commit step

If an authorized target or in-place reference worktree contains Cargo manifests, keep the applicable Rust baseline known-good. A TS-only change does not authorize Rust modifications. A read-only external reference that is unavailable locally can be recorded unavailable; it must not be falsely reported as tested. No Cargo manifest in target/reference scope means Cargo is N/A, with manifest inventory evidence.

For the reviewed Leptos workspace, known commands are:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

The source contribution contract explicitly names fmt/test; cargo check is added to honor the user's specification requirement. Run at the actual Rust workspace root, not the TypeScript package root. Baseline toolchain declares Rust 1.92.0 / edition 2024; respect actual rust-toolchain.toml and lockfiles rather than upgrading them as part of the port.

When specific Rust files are affected, run `cargo check -p <affected-crate> --all-targets` and `cargo test -p <affected-crate> --all-targets`, plus dependent/workspace tests justified by the change. Do not literally pass angle-bracket placeholders: discover actual crate IDs first. Full workspace check/test are the safe default if scope cannot be established. If Rust is present but untouched, run/check the baseline guard at each step; an unchanged verified hash can be noted as supporting evidence but is not a fresh executed test.

Run the existing lint lane discovered from repository instructions/CI. A proposed `cargo clippy --workspace --all-targets -- -D warnings` is not assumed baseline-green or newly required without discovery. Do not enable `--all-features` blindly: CSR, SSR, hydrate and render-neutral libraries have mutually constrained combinations. Discover feature names, targets and commands from Cargo manifests and fixtures and test valid combinations separately. Do not invent feature flags or install a target just to silence failure.

For Rust packaging/provenance/install changes, the known reference package lane is:

```sh
cargo package --workspace --allow-dirty --no-verify --locked
cargo test -p leptos_ui_kit_registry --test package_source \
  packaged_sources_build_with_cargo_vcs_provenance_outside_and_inside_hostile_git -- \
  --ignored --exact --nocapture
cargo test -p leptos_ui_kit_cli --test packaged_runtime \
  installed_binaries_run_after_package_source_and_build_state_are_deleted -- \
  --ignored --exact --nocapture
```

The ignored tests are not executed by the ordinary workspace suite. The source contribution notes require them from a clean Git worktree because dirty VCS metadata is rejected. Use an isolated clean worktree/staging flow when needed; do not clean/reset unrelated user work. Transaction changes in that workspace require Linux/macOS/Windows qualification. These Rust lanes are conditional on actual Rust scope, not a requirement to rewrite Rust for a Svelte product.

#### Per-step minimum

Run the current step's unit/integration checks, relevant type/lint/format checks, `git diff --check`, self-review, and the conditional Cargo guard. Generated output changes require consumer check/build; browser-affecting changes require scoped browser tests. Filesystem/packaging changes require their acceptance/fault lanes. Run full cumulative suites at milestone and final boundaries, not only snapshots of the latest item.

A new relevant test failure stops the next commit step. A demonstrably pre-existing/out-of-scope failure can be recorded without blocking unrelated safe work only with baseline evidence, impact reasoning and a named blocker; it cannot be called a passing lane or silently waived at release. Environmental blockers (network/compiler/browser unavailable) mean unverified, not successful.

#### Final verification

Regenerate fixtures with the packed CLI; install declared consumer dependencies explicitly; run all cumulative lanes, supported OS variants, SSR/hydration/browser scenarios, package-source-unavailable test, safety/recovery tests, and applicable Cargo guards. Inspect packed file inventory and consumer runtime imports. Update traceability with actual test file names and results. Do not publish or push as part of verification.
