# S002 step report — Anchor approved contracts and repository instructions

Codex review 4 update, 2026-09-29: **accepted and complete**, S002 commit
`9ed224f60249ee67732c05737170436e06301c38`. All nine correction findings are
closed. The target and both advanced-state full suites pass 83/83 when run
sequentially; `S002_REVIEW.md` records the shared-temp invocation limitation
scheduled for S005. The authoring records below are historical. Codex recorded
this real hash after the commit without amending history; the factual update
travels with S003. S003 is authorized under the governing dispatch.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S002","kind":"report","commit":"9ed224f60249ee67732c05737170436e06301c38","disposition":"implemented"}
-->

Step ID and title: S002 — Anchor approved contracts and repository instructions.
Contract/requirement IDs: R01, R31, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`).
Actual target root and branch: this repository (`.`) on branch `master`.
Starting commit / baseline status:
`bb5010e0605b3d0917a9037eafef69ed90d3b36c` (`master`, S001 complete). The
working tree already held three expected unstaged Codex governance updates
(plan execution state and the S001 report/review completion hash); they are
preserved and incorporated. Read-only reference: `leptos_ui_kit` at
`a10fbf06334f4648f5755e05a7147414e4e5fc98`, clean.

Author/provider: Pi, provider `ollama`, model `deepseek-v4.1-flash:cloud`.
Candidate status: `in_progress` while Codex review is outstanding. This report
does not claim acceptance; Codex alone assigns `verified_uncommitted` and
`complete`.

## Implemented

Exact behavior added or changed: S002 adopts the durable contract stack,
establishes live contract validation, and projects the plan into derived JSON.
No product code, component wrapper, dependency, CI workflow, or general test
harness was added; S003 remains locked.

Files changed or added and purpose:

| Path                                                                                                                                                                              | Purpose                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `specs/PRODUCT_SPEC.md` … `specs/ACCEPTANCE_CRITERIA.md` (11 files)                                                                                                               | Adopted product-intent specifications.                                                                                                                          |
| `decisions/ADR-0001-architecture.md` … `ADR-0006-scope-and-discovery-gates.md` (6 files)                                                                                          | Adopted rationale records.                                                                                                                                      |
| `implementation/TEST_PLAN.md`, `VERIFICATION.md`, `OPEN_QUESTIONS.md`, `OPERATIONS_RUNBOOK.md`, `STEP_REPORT_TEMPLATE.md`, `DEVIATION_TEMPLATE.md`, `EXTENSION_GATE.md` (7 files) | Adopted implementation guidance.                                                                                                                                |
| `references/SOURCE_BASELINE.md`, `references/TOKEN_BASELINE.md`                                                                                                                   | Adopted reference baseline evidence.                                                                                                                            |
| `AGENTS.md`                                                                                                                                                                       | Adopted instruction template merged with the Pi/Codex authority boundary, validation commands, and repository-relative guidance.                                |
| `references/SOURCES.json`                                                                                                                                                         | Deterministic projection of the sixteen reference pointers.                                                                                                     |
| `implementation/COMMIT_SEQUENCE.json`                                                                                                                                             | Deterministic projection of the governing Markdown plan.                                                                                                        |
| `tools/check-contracts.mjs`                                                                                                                                                       | Dependency-free repository contract validator; supports `--root` fixtures and explicit generation modes.                                                        |
| `tools/check-contracts.test.mjs`                                                                                                                                                  | Focused `node:test` regression suite for the validator.                                                                                                         |
| `package.json`                                                                                                                                                                    | Adds only `check:contracts` and `test:contracts` scripts.                                                                                                       |
| `implementation/COMMIT_SEQUENCE.md`                                                                                                                                               | Replaces the extracted embedded bodies with an explicit adopted-file index, rewrites contract links to the adopted paths, and records the S002 candidate state. |
| `implementation/evidence/S002_REPORT.md`                                                                                                                                          | This report.                                                                                                                                                    |

Preserved Codex governance updates (not authored by this checkpoint, carried
through unchanged in intent):

- `implementation/COMMIT_SEQUENCE.md`: the “Codex correction dispatch — S002
  review 1” section, S001 `complete` evidence, the RCLD-01 predecessor note,
  and the resolved decision boundaries.
- `implementation/evidence/S001_REPORT.md` and `S001_REVIEW.md`: structured
  `checkpoint-evidence` metadata with the S001 completion hash and Codex
  acceptance.
- `specs/COMPONENT_CATALOG.md`: the normative “Approved source-parity
  clarifications” section.

How changes stay within scope: S002 authorizes adopting the specification
contract stack, merging repository instructions, recording requirement/open
question ownership, and establishing the contract validator. No checkpoint ID,
order, requirement, acceptance criterion, sequence gate, or disposition was
removed or changed, and S003 was not started.

## Extraction map and semantic preservation

All 27 embedded contracts were extracted from the committed plan at
`bb5010e` (source column is the inclusive line range in that revision). The
`Scheduled repository file:` adoption boilerplate and the section anchor were
removed; a provenance comment and an `#` title were added. Two cross-links were
rewritten to the adopted locations and the rest of each body was preserved
byte-for-byte after Prettier formatting.

Digest method (correction pass): the “Source body SHA-256 (16)” column is the
first 16 hex characters of the SHA-256 of the embedded body lines with leading
and trailing blank lines removed, joined with `\n` and **without** a trailing
newline. The earlier submission shortened two entries (12 instead of 16
characters); both are now full 16-character prefixes under the same method.
`AGENTS.md` is the one non-byte-identical adoption: its digest covers the
embedded template body only, while the adopted `AGENTS.md` is a manually
reviewed merge that adds the Pi/Codex authority boundary.

| Adopted file                                           | Source range (bb5010e) | Body lines | Source body SHA-256 (16) |
| ------------------------------------------------------ | ---------------------: | ---------: | ------------------------ |
| `specs/PRODUCT_SPEC.md`                                |            11295–11359 |         58 | `7b07d7116427a4c8`       |
| `specs/SCOPE_AND_ASSUMPTIONS.md`                       |            11360–11401 |         35 | `ceeb19c42385df20`       |
| `specs/ARCHITECTURE.md`                                |            11402–11485 |         77 | `485d2961a1f97701`       |
| `specs/GENERATED_LAYOUT.md`                            |            11486–11560 |         68 | `e81bf9f5be92ca29`       |
| `specs/API_CONTRACTS.md`                               |            11561–11617 |         50 | `785b5e27f1360a2e`       |
| `specs/DATA_MODEL.md`                                  |            11618–11669 |         45 | `c35c3f0510dc9bee`       |
| `specs/STYLING.md`                                     |            11670–11723 |         47 | `5b0392397405bd48`       |
| `specs/SYNCHRONIZATION.md`                             |            11724–11775 |         45 | `a95b5b7d60e683d5`       |
| `specs/SECURITY_AND_TRANSACTIONS.md`                   |            11776–11815 |         33 | `9bf2a6b48305c9ff`       |
| `specs/COMPONENT_CATALOG.md`                           |            11816–11869 |         47 | `cbe29a64452aa5f4`       |
| `specs/ACCEPTANCE_CRITERIA.md`                         |            11870–11935 |         59 | `de65e2c138adb7a9`       |
| `implementation/TEST_PLAN.md`                          |            11936–11989 |         47 | `7db3818923e80675`       |
| `implementation/VERIFICATION.md`                       |            11990–12062 |         66 | `86d9001bf2595649`       |
| `implementation/OPEN_QUESTIONS.md`                     |            12063–12094 |         25 | `07da661cadb121ea`       |
| `implementation/OPERATIONS_RUNBOOK.md`                 |            12095–12132 |         31 | `6be05b311ff40725`       |
| `implementation/STEP_REPORT_TEMPLATE.md`               |            12133–12173 |         34 | `7f47e677f264b36a`       |
| `implementation/DEVIATION_TEMPLATE.md`                 |            12174–12196 |         16 | `b37607ae992ee8ce`       |
| `implementation/EXTENSION_GATE.md`                     |            12197–12220 |         17 | `86093899c91b371a`       |
| `decisions/ADR-0001-architecture.md`                   |            12221–12244 |         17 | `2ce1f31c5c774f0a`       |
| `decisions/ADR-0002-generated-css-and-layout.md`       |            12245–12262 |         11 | `9844baec4b147d98`       |
| `decisions/ADR-0003-customization-aware-sync.md`       |            12263–12280 |         11 | `afe182a7ce6788b9`       |
| `decisions/ADR-0004-primitive-and-theme-boundaries.md` |            12281–12298 |         11 | `4df7ba0b333dc111`       |
| `decisions/ADR-0005-rust-verification-boundary.md`     |            12299–12318 |         13 | `d207336c35177385`       |
| `decisions/ADR-0006-scope-and-discovery-gates.md`      |            12319–12336 |         11 | `d8cd455f8619ef2d`       |
| `references/SOURCE_BASELINE.md`                        |            12337–12402 |         59 | `458458de75c92e9b`       |
| `references/TOKEN_BASELINE.md`                         |            12403–12471 |         62 | `37141dc1573d5b25`       |
| `AGENTS.md` (embedded template)                        |            12472–12509 |         31 | `138c7f22a2368641`       |

Link rewrites: `specs/PRODUCT_SPEC.md` now links
`[SOURCE_BASELINE.md](../references/SOURCE_BASELINE.md)`; the
`references/SOURCE_BASELINE.md` body now links its inventory references to
`(SOURCES.json)`. In the governing plan, all 984 `#contract-*` links in the
203 checkpoint definitions were rewritten to their adopted relative files
(`../specs/…`, `../decisions/…`, `../references/…`, `../AGENTS.md`,
`TEST_PLAN.md`, `VERIFICATION.md`, …), and the embedded bodies were replaced by
an explicit 27-row index of adopted files.

Semantic preservation evidence (read-only comparison against `bb5010e`):

- Every nonblank source body line is present verbatim in its adopted file for
  all 26 extracted documents (only the two documented link rewrites differ);
  the 27th (AGENTS.md template) is present after whitespace normalization.
- The **full** checkpoint-definition comparison (all fields: ID, title,
  contract anchors, purpose, scope, files, tests, commands, expected result and
  commit message) was performed separately from the validator's parser. The
  validator's `parseDefinitions` retains only ID, title and anchors, so its
  output is a subset; the initial report's “byte-equivalent after parsing”
  wording overstated what that parser compares. The full-field comparison
  passed for all **203** definitions.
- The validator's `parseDefinitions` output is identical between `bb5010e` and
  the current plan for its subset (203 IDs, titles and anchors, in order).
- The ledger differs only by the two intended state changes (S001
  `verified_uncommitted` → `complete` from the preserved Codex update; S002
  `not_started` → `in_progress` from this candidate) and the RCLD-01
  predecessor note. All 201 later checkpoints remain `not_started`.
- All eleven sequence blocks and the sixteen pointer rows are unchanged.
- `specs/PRODUCT_SPEC.md` defines **R01–R34** (34 unique rows) and
  `specs/ACCEPTANCE_CRITERIA.md` preserves **AC01–AC22** (22 unique criteria).
- The approved Field, Menu, and Avatar clarifications are now normative in
  `specs/COMPONENT_CATALOG.md#approved-source-parity-clarifications`, and the
  plan's historical dispositions link to that section.

## Validator design

`tools/check-contracts.mjs` is dependency-free ESM. The default path is
read-only validation. Writes happen only in explicit modes:

- `node tools/check-contracts.mjs` — validate (default, no writes).
- `node tools/check-contracts.mjs --root <dir>` — validate a disposable tree.
- `node tools/check-contracts.mjs --generate` — write
  `implementation/COMMIT_SEQUENCE.json` from the plan, then validate.
- `node tools/check-contracts.mjs --generate-sources` — write
  `references/SOURCES.json` from the plan inventory, then validate.

Checks (correction-pass description; the initial section above is historical):

- The 27 required adopted files plus both JSON projections exist and are
  non-empty; `package.json` exposes `check:contracts`/`test:contracts`.
- Links: inline, reference-style and shortcut links are parsed outside fenced
  code with respect for opening fence length and inline code spans. Ordinary
  missing local links are errors regardless of directory prefix. Only a
  missing target annotated on the same line with
  `<!-- future-deliverable: SNNN -->` naming an existing noncomplete checkpoint
  may warn; other annotations are errors. Anchors resolve through explicit
  HTML IDs or GitHub-style heading slugs (duplicate headings get numeric
  suffixes); duplicate explicit IDs are errors instead of being suffixed.
- Plan: exact S001–S203 definition and ledger order; fixed RCLD-01–RCLD-11
  identities/ranges; per-step sequence membership; sequence predecessor links;
  exactly one nonempty Scope/Definition-of-green/Verification-lane gate per
  sequence; map/body/derived-state agreement; and the top-level completed and
  remaining checkpoint/sequence counts. Unknown definition/ledger IDs,
  requirement IDs and acceptance IDs are rejected; `not_applicable` fails
  closed without an approved evidence-backed deviation.
- Completion evidence: each `<ID>_REPORT.md`/`<ID>_REVIEW.md` may carry exactly
  one structured `checkpoint-evidence` record with exactly
  `schemaVersion`, `checkpoint`, `kind`, `commit`, `disposition`. Malformed,
  non-object and duplicate records are rejected in every lifecycle state. Before
  acceptance the records are optional with a null commit and report `candidate`
  / review `changes_requested`; `verified_uncommitted` requires both records
  with report `implemented` / review `accepted` and a null commit; `complete`
  additionally requires a shared full lowercase 40-digit hash that resolves in
  the real repository, is reachable from HEAD, and has both evidence paths at
  that commit. A `complete` checkpoint with missing, empty or rejected evidence
  is an error. Records inside fenced literal examples are not live records.
- R01–R34 product coverage and AC01–AC22 preservation; sixteen unique source
  pointers; Markdown/JSON structural agreement for both projections.
- Premature successor advancement is rejected. Regeneration is a derived write
  and cannot legitimize an invalid plan because the plan-shape checks read the
  Markdown directly.

Projection field sources are documented in `implementation/VERIFICATION.md`.

## Verified

### Initial submission (historical)

All target commands ran under process-local Node `v24.21.0` (the default host
Node `v22.22.3` is below the declared engine and was not used for tooling).
pnpm `11.22.0`, Prettier `3.9.6`, Git `2.55.0`. Reference Rust commands used the
pinned workspace toolchain `1.92.0`. Target Cargo is N/A: the target has no
`Cargo.toml` or `rust-toolchain.toml`.

| #   | Command                                 | Working dir | Exit | Result                                       |
| --- | --------------------------------------- | ----------- | ---- | -------------------------------------------- |
| 1   | `pnpm run check:contracts`              | target      | 0    | `0 error(s), 0 warning(s)`                   |
| 2   | `pnpm run test:contracts`               | target      | 0    | `15` tests, `15` pass, `0` fail, `0` skipped |
| 3   | `pnpm run format:check`                 | target      | 0    | All matched files use Prettier code style    |
| 4   | `git diff --check`                      | target      | 0    | No whitespace diagnostics                    |
| 5   | `cargo fmt --all -- --check`            | reference   | 0    | No formatting drift                          |
| 6   | `cargo check --workspace --all-targets` | reference   | 0    | Workspace checked                            |
| 7   | `cargo test --workspace --all-targets`  | reference   | 0    | See totals below                             |

### Correction pass retest

All commands ran through the active execution routing under process-local Node
`v24.21.0`, pnpm `11.22.0`, Prettier `3.9.6` and Git `2.55.0`; the reference
Rust guard used the pinned `1.92.0` workspace toolchain. Logs were captured
outside the repository.

| #   | Command                                             | Working dir | Exit | Result                                                                                               |
| --- | --------------------------------------------------- | ----------- | ---- | ---------------------------------------------------------------------------------------------------- |
| 1   | `pnpm run format:check`                             | target      | 0    | All matched files use Prettier code style                                                            |
| 2   | `pnpm run check:contracts`                          | target      | 0    | `0 error(s), 0 warning(s)`                                                                           |
| 3   | `pnpm run test:contracts`                           | target      | 0    | `46` tests, `46` pass, `0` fail, `0` skipped                                                         |
| 4   | `node tools/check-contracts.mjs --generate` (twice) | target      | 0    | `COMMIT_SEQUENCE.json` byte-identical across runs and to the existing untracked candidate projection |
| 5   | `git diff --check`                                  | target      | 0    | No whitespace diagnostics                                                                            |
| 6   | `cargo fmt --all -- --check`                        | reference   | 0    | No formatting drift                                                                                  |
| 7   | `cargo check --workspace --all-targets`             | reference   | 0    | Workspace checked successfully                                                                       |
| 8   | `cargo test --workspace --all-targets`              | reference   | 0    | 562 top-level passes over 27 binaries plus 16 nested subprocess passes; 0 failed, 4 ignored          |

The default validation path was additionally proven read-only for both a
passing and a failing tree by the lstat-based snapshot regressions, and the CLI
exit codes (0 success, 1 validation failure, 2 usage error) are asserted by the
suite.

Reference test totals, separated as required: **562 top-level passes** across
27 test-binary sections (0 failed, 4 ignored), plus **16 nested subprocess
passes** (0 failed), aggregating to 578 passes over 43 `test result:` lines.
The four ignored tests, named exactly, are:

- `installed_binaries_run_after_package_source_and_build_state_are_deleted`
- `homepage_fixture_cli_workflow_smoke`
- `tests::every_transaction_io_fault_avoids_partial_application_state`
- `packaged_sources_build_with_cargo_vcs_provenance_outside_and_inside_hostile_git`

They are unrun, not passed. The first two are the packaged-runtime/provenance
lanes; the third is the exhaustive transaction fault matrix (not a packaging
test); the fourth is the clean-worktree provenance lane. None is claimed as
executed by the ordinary workspace run.

Tests added: `tools/check-contracts.test.mjs`. After the correction pass it
holds 46 focused tests (see the matrix below). They are S002 contract
verification, not the general S005 test harness.

No generated-app/type/lint/build/browser/package lane exists yet; those are
scheduled for S003–S010 and are unverified, not passed. No CI workflow exists.

## Self-review and corrections

Corrections applied during the initial pass:

- Corrected relative links for the seven `implementation/` guidance files in
  the plan index (they would otherwise have resolved as
  `implementation/implementation/…`).
- Made `--generate` emit Prettier-compatible JSON (inline short string arrays)
  so regeneration does not break `format:check`.
- Fixed the semantic-preservation comparison to apply the documented link
  rewrites before comparing, avoiding a false “missing line”.
- Verified only the two intended ledger rows changed.
- Verified the `--generate` output is byte-for-byte Prettier-clean and that
  `git diff --check` and `git diff pnpm-lock.yaml pnpm-workspace.yaml` show no
  dependency, engine, package-manager, lockfile, or workspace-membership change.
- Reviewed the complete diff and every untracked file.

## Correction pass — S002 review 1

Each finding from `implementation/evidence/S002_REVIEW.md` is mapped to its fix
and executable regression. All fixtures use isolated temporary Git histories
and leave the authoring checkout untouched.

| Finding | Fix                                                                                                                                                                                                                                                                                                                                                                             | Regression tests                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S002-R1 | Structured `checkpoint-evidence` metadata parsed with exact keys/shape; complete checkpoints require `implemented`/`accepted`, a shared full lowercase hash that resolves in the real repo, is reachable from HEAD and contains both evidence paths; malformed/duplicate/absent records rejected; fabricated hash without Git rejected.                                         | `positive: post-commit hash workflow validates`; `empty completion review is rejected`; `explicitly rejected completion review is rejected`; `wrong checkpoint, kind or hash metadata is rejected`; `mismatched report/review hashes are rejected`; `malformed and duplicate metadata records are rejected`; `fabricated hash with no Git is rejected`; `unreachable commit is rejected`; `missing committed evidence path is rejected`                                                                                                                                                                                                                                                                                                                                          |
| S002-R2 | Fixed sequence identities/ranges/membership/predecessors; one nonempty scope/green/verification gate per sequence; map/body/derived-state agreement; summary counts; unknown definition/requirement/acceptance IDs rejected; `not_applicable` fails closed; regeneration cannot legitimize an invalid plan.                                                                     | `checkpoint assigned to an unknown sequence is rejected`; `sequence falsely marked complete is rejected`; `removed sequence green gates are rejected`; `summary count drift is rejected`; `not_applicable without a deviation is rejected`; `unknown checkpoint definition ID is rejected`; `unknown requirement ID is rejected`; `unknown acceptance criterion is rejected`; `invalid status and predecessor remain rejected`; `premature successor advancement is rejected`; plus parser test `plan parsers preserve 203 ordered definitions and 11 sequence bodies`                                                                                                                                                                                                           |
| S002-R3 | Missing local links are errors regardless of prefix; only an explicit same-line `<!-- future-deliverable: SNNN -->` for an existing noncomplete checkpoint warns; reference-style and code-formatted links handled; explicit IDs separated from heading slugs; duplicate explicit IDs rejected; fence length respected.                                                         | `ordinary missing link is an error regardless of directory prefix`; `annotated future deliverable warns and still passes`; `annotation naming a complete or unknown checkpoint is rejected`; `missing reference-style link target is rejected`; `present reference-style link and code-formatted label resolve`; `duplicate explicit HTML anchor id is rejected without suffixing`; `duplicate heading slug with numeric suffix resolves`; `nested fences do not create or hide links`; `explicit anchor links resolve`; plus parser tests `fence mask respects opening fence length`, `fence mask ignores inline code links but keeps real links`, `reference-style links resolve and missing references are reported`, `explicit anchors are distinguished from heading slugs` |
| S002-R4 | lstat-based complete-tree snapshots (directories including hidden/empty, file bytes/modes, symlink targets, entry kinds); successful and failing default validation proven read-only; explicit generation determinism and subsequent validation; CLI exit codes asserted.                                                                                                       | `successful default validation is read-only across entry kinds`; `failing default validation is also read-only`; `explicit generation is byte-deterministic and validates afterward`; `source-inventory generation is byte-deterministic`; `unknown CLI argument exits 2`; plus every negative test asserts `status === 1`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| S002-R5 | Catalog rows and plan dispositions reconciled with the normative clarification; AGENTS.md, SCOPE_AND_ASSUMPTIONS.md, OPEN_QUESTIONS.md, VERIFICATION.md and the report template aligned with resolved decisions; digest labels corrected; all four ignored tests named; source-comparison limits stated; obsolete status wording replaced; candidate not described as accepted. | Contract validation over the edited documents (`pnpm run check:contracts`); link/label checks by the validator; manual review table above                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

Corrected extraction digests (full 16-character prefixes) are in the extraction
map. The two previously shortened entries are `references/TOKEN_BASELINE.md` →
`37141dc1573d5b25` and the `AGENTS.md` embedded template → `138c7f22a2368641`.

### Resolved decisions (Codex, S002 review 1)

The five items the initial report raised are resolved by Codex; none remains
open:

1. **Candidate status.** Pi reports candidates as `in_progress`; Codex alone
   assigns `verified_uncommitted` and `complete`. The plan ledger records S002
   as `in_progress`.
2. **Completion-evidence convention.** Keep the conventional
   `implementation/evidence/<ID>_REPORT.md`/`<ID>_REVIEW.md` paths with the
   structured `checkpoint-evidence` record; no new ledger column or database.
3. **JSON schema shape.** Keep `schemaVersion` 1 and the existing field names
   and shape; document each projected field's source in
   `implementation/VERIFICATION.md`.
4. **Reference inventory representation.** The Markdown inventory table stays
   authoritative; `references/SOURCES.json` remains its deterministic
   projection.
5. **Field/Menu/Avatar dispositions.** The normative clarifications live in
   `specs/COMPONENT_CATALOG.md#approved-source-parity-clarifications`; the
   plan's historical dispositions link to that section.

## Exceptions

- **Target Cargo:** N/A with manifest inventory (no `Cargo.toml`/
  `rust-toolchain.toml` anywhere in the target). No Rust lane was claimed for
  the target.
- **Reference ignored lanes:** the four tests named above were not run; S002
  changes no Rust packaging or provenance. Unrun, not passed.
- **Environment:** default Node `v22.22.3` violates the declared `>=24` engine;
  all tooling used `v24.21.0` per process. This is environmental and does not
  change the pinned engine.
- **No product behavior** is verified by this checkpoint; it is documentation
  and validation tooling only.
- No deviations were applied; `implementation/DEVIATION_TEMPLATE.md` is unused.

## Commit and next action

Actual commit hash and message: **pending** — S002 is returned unstaged and
uncommitted for Codex independent review, acceptance, and commit. Proposed
message per the plan: `spec: anchor the approved svelte ui kit contracts`.
This candidate is not accepted; S002 remains `in_progress`.

Requirements/test evidence updated: R01, R31, R32, R33, R34 evidenced by the
adopted contracts, `tools/check-contracts.mjs`, its `node:test` suite, the
derived projections, and this report. The plan ledger and execution state were
updated narrowly for the S002 candidate only.

Next step ID: S003 (not started; locked).

Is the next step safe to begin? No. S003 must not begin until S002 is
independently reviewed, verified, and committed by Codex. This candidate is
unstaged and uncommitted, and no successor work was performed.

## Correction pass — S002 review 2

Date: 2026-09-28. Disposition: **changes requested**, S002 `in_progress`; no
S002 acceptance or commit is recorded and S003 remains locked. Author/provider:
Pi, provider `ollama`, model `deepseek-v4.1-flash:cloud`. Starting and ending
HEAD: `bb5010e0605b3d0917a9037eafef69ed90d3b36c`. Tooling ran under
process-local Node `v24.21.0` (default host Node `v22.22.3` is below the declared
engine), pnpm `11.22.0`, Prettier `3.9.6`, Git `2.55.0`. Required environment
diagnostics were green before the first mutating command; operator commands
and logs are retained outside this public repository.

This pass implements S002-R6, S002-R7 and S002-R8 together, subject to independent
acceptance. It preserves the nine review-1 mutation fixes and all existing
regressions; the focused suite grew from 46 to **70 tests**. Review 3 identifies
one remaining evidence-parser boundary correction, S002-R9.

### S002-R6 — Lifecycle-independent fixtures

The former builder copied the live plan/evidence and rewrote only S001's hash,
so a legitimately advanced checkout (S002 complete) made the two positive tests
fail. The replacement is fixture-owned:

- `tools/check-contracts.fixtures.mjs` copies an explicit allowlist,
  `FIXTURE_FILES` (the 27 adopted contracts, the governing plan and both
  derived projections), and the package manifest. No `.git`, dependency tree or
  future build artifact is copied.
- `normalizePlan`/`writeDerivedState` rewrite the entire ledger statuses,
  sequence-map states, sequence-body states and both summary counts to the
  chosen scenario, so no live completion state survives.
- Three fixed scenarios exist: `s001` (canonical one-complete negative
  baseline with the active candidate), `two` (S001+S002 complete) and
  `boundary` (S001–S013 complete, RCLD-01 complete and RCLD-02 in progress with
  the S014 candidate).
- Each completed checkpoint gets its own temporary commit that contains both
  evidence paths; only afterward is the post-commit hash recorded in the working
  tree. Evidence records are synthetic and fixture-owned; no operator Git object
  is imported.
- `buildFixture` asserts the final generation exit status is 0 for valid
  scenarios, and removes the partial temporary directory on any construction
  failure (regression: `fixture construction failure removes its temporary
directory`).
- The existing lstat complete-tree read-only assertions and CLI exit-code
  assertions are retained.

Regression tests added: `fixture allowlist is explicit and excludes Git and
build output`; `fixture completion hashes are fixture-owned post-commit values`;
`fixture construction failure removes its temporary directory`; `two-complete
and later-boundary scenarios validate with correct counts`; and the rewritten
`positive: post-commit hash workflow validates` (now on the `two` scenario).

**Advanced-state full-suite rehearsal (fresh):** the same module built isolated
repositories for the `two` and `boundary` scenarios, the candidate `tools/` were
copied in, and the entire suite ran from inside each advanced repository.

| Rehearsal repository          | `check:contracts` | `test:contracts`                  |
| ----------------------------- | ----------------- | --------------------------------- |
| `two` (S001+S002 complete)    | exit 0, 0/0       | exit 0, 70 tests, 70 pass, 0 fail |
| `boundary` (RCLD-01 complete) | exit 0, 0/0       | exit 0, 70 tests, 70 pass, 0 fail |

Logs were captured outside the repository; the isolated rehearsal script and
its full `node:test` output are held in the session log directory alongside the
other correction-pass logs.

### S002-R7 — Complete evidence lifecycle validation

The validator now implements the authoritative matrix. Malformed JSON,
non-object payloads and duplicate records are rejected in every state, while an
absent optional record remains acceptable before acceptance:

| Ledger status                           | Report / review               | Commit | Evidence                          |
| --------------------------------------- | ----------------------------- | ------ | --------------------------------- |
| `not_started`, `in_progress`, `blocked` | candidate / changes_requested | null   | optional; present records checked |
| `verified_uncommitted`                  | implemented / accepted        | null   | both required                     |
| `complete`                              | implemented / accepted        | match  | both required + Git resolution    |

`steps[].completion` stays null until `complete`; only committed completion
unlocks a successor; unapproved `not_applicable` stays fail-closed. The
generation exit status of a scenario transition is asserted rather than
discarded. `implementation/VERIFICATION.md`, `specs/SCOPE_AND_ASSUMPTIONS.md`
and `implementation/STEP_REPORT_TEMPLATE.md` were reconciled to this same
matrix without competing prose.

Regression tests added: `in_progress candidate records validate with null
commits`; `precommit acceptance validates with implemented/accepted null
hashes`; `verified_uncommitted requires both evidence records`;
`verified_uncommitted rejects a committed hash`; `verified_uncommitted cannot
unlock its successor`; `committed completion unlocks its successor`; `malformed
candidate evidence is rejected`; `duplicate candidate evidence records are
rejected`; `non-object evidence payload is rejected`; `candidate record with an
implemented disposition is rejected`; `non-complete candidate record with a
commit hash is rejected`; and the end-to-end `synthetic transition candidate ->
precommit acceptance -> committed completion`.

### S002-R8 — Structural parsing

Structural definitions are now read consistently outside fenced examples:
sequence titles and bodies, source inventory, summary counts, product
requirements and acceptance criteria, and live `checkpoint-evidence` comments.
`parseSequenceBodies` returns one record per body occurrence instead of a
last-wins `Map`, so duplicate and unknown bodies are rejected before indexing.
Fixed identities, ordering, ranges, predecessor links and gate checks are
unchanged.

Regression tests added: `requirements inside a fenced example do not satisfy
coverage`; `acceptance criteria inside a fenced example do not satisfy
coverage`; `fenced example definitions introduce no false errors or drift`;
`fenced evidence comments are not live checkpoint records`; `duplicate sequence
body is rejected`; `unknown sequence body is rejected`; `fenced sequence body is
ignored`; and the parser test `structural parsers ignore fenced literal
examples`. Negative body/example cases regenerate the projection so the intended
structural diagnostic (not projection drift) is exercised.

### Verified (fresh executions, correction pass 2)

| #   | Command                                             | Dir    | Exit | Result                                                           |
| --- | --------------------------------------------------- | ------ | ---- | ---------------------------------------------------------------- |
| 1   | Required environment diagnostics                    | target | 0    | Green; exact operator command retained outside this repository   |
| 2   | `pnpm run check:contracts`                          | target | 0    | `0 error(s), 0 warning(s)`                                       |
| 3   | `pnpm run test:contracts`                           | target | 0    | 70 tests, 70 pass, 0 fail, 0 skipped                             |
| 4   | `pnpm run format:check`                             | target | 0    | All matched files use Prettier code style                        |
| 5   | `node tools/check-contracts.mjs --generate` (×2)    | target | 0    | `COMMIT_SEQUENCE.json` byte-identical to the untracked candidate |
| 6   | `node tools/check-contracts.mjs --generate-sources` | target | 0    | `SOURCES.json` byte-identical to the untracked candidate         |
| 7   | `git diff --check` / `git diff --cached --check`    | target | 0    | No whitespace diagnostics                                        |
| 8   | isolated rehearsal script                           | target | 0    | two + boundary advanced states: each 70/70, 0 errors             |

Logs were captured outside the repository; the correction-pass logs and the
rehearsal output are held in the session log directory.
Projection hashes after regeneration: `COMMIT_SEQUENCE.json`
`f26e68c084472504d21b4a7de08a6330909482e331fa6d69b3a2598a89c2dc2a`, `SOURCES.json`
`8c4094b024a73c80ce2c8f465f477246552d2dcfb8f8c14ba19bdc4c2f0c726c`; both are
untracked candidate projections, not committed artifacts.

### Reference Rust guard

S002 changes no Rust source. Pi attempted the guard from an alternate cached
reference checkout outside the permitted build area, so no fresh Rust guard
completed in this authoring pass. Prior results (562 top-level passes, 16 nested
subprocess passes, zero failures, four ignored) were supporting evidence only.

Codex's review 3 identified the existing authorized reference worktree, clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98`, within the permitted build area.
Use that worktree for subsequent verification. Fresh Codex guard results are
recorded separately in `S002_REVIEW.md`; they do not turn Pi's historical blocked
attempt into a passing execution. Exact operator commands and paths remain in
external coordination evidence.

### Self-review

- Projection regeneration is byte-identical, so the fence-aware parser changes
  do not alter the real candidate projection.
- No dependency, lockfile, engine, package-manager or workspace-membership
  change; `package.json` still exposes only `check:contracts`/`test:contracts`.
- The real `check:contracts` run verifies structural checkpoint identities,
  sequence gates and requirement/acceptance coverage. It does not compare every
  checkpoint definition's complete text. Codex's separate full-definition
  comparison supplies that preservation evidence.
- The real S002 evidence record still reads report `candidate` / review
  `changes_requested` with a null commit; Codex's review verdict was not edited.
- This entire candidate is unstaged and uncommitted; S003 was not started.

## Correction pass — S002 review 3 (S002-R9)

Date: 2026-09-29. Disposition: **changes requested**, S002 `in_progress`; no
S002 acceptance or commit is recorded and S003 remains locked. Author/provider:
Pi, provider `ollama`, model `deepseek-v4.1-flash:cloud`. Starting and ending
HEAD: `bb5010e0605b3d0917a9037eafef69ed90d3b36c`. Tooling ran under
process-local Node `v24.21.0` (default host Node `v22.22.3` is below the declared
engine), pnpm `11.22.0`, Prettier `3.9.6`, Git `2.55.0`. Required environment
diagnostics were green before the first mutating command; operator commands and
log locations are retained outside this public repository.

This focused pass implements S002-R9 and preserves the review-1/review-2 fixes,
all 70 previous regressions, the fixture-owned histories and the resolved state
matrix. The focused suite grew from 70 to **83 tests**.

### S002-R9 — Live evidence boundaries parsed before JSON extraction

`parseEvidenceRecords` previously matched complete checkpoint-evidence HTML
comments with one raw document-wide regex and only afterward filtered
matches whose _opening_ was fenced. That produced two defects: an opening marker
without a closing delimiter was never matched at all (so malformed present
evidence looked like optional absence), and a fenced opening could consume a
later live record's closing delimiter before the match was discarded (so the
live record disappeared).

The replacement masks fenced-code lines to equal-length spaces and scans the
masked document for live opening markers and live `-->` delimiters. Every live
opening establishes a present record attempt whether or not it is terminated;
each attempt is counted, and a missing delimiter is malformed evidence in every
lifecycle state. Fenced content contributes neither opening markers nor
delimiters, so a literal example can neither satisfy, hide, repair nor terminate
live metadata, and stray delimiters before any opening are inert. The exact
five-key schema, the accepted lifecycle matrix, genuine optional absence,
duplicate rejection and fixture-owned histories are unchanged. No dependency or
general Markdown framework was added.

The three Codex reproductions map to the fix and its regressions:

| Codex reproduction                                                | Fix                                                                                  | Regression tests                                                                                                                                                                                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Closing delimiter removed from a present candidate record         | Unterminated live opening counts as a malformed present attempt                      | parser `live evidence opening without a terminator is a counted malformed attempt`; CLI `optional candidate evidence missing its closing delimiter is rejected`                                             |
| Unterminated extra record appended after a valid completed review | Every live opening is counted; the extra malformed attempt is validated, not ignored | parser `unterminated extra attempt after a valid record is counted`; CLI `unterminated extra record after a completed review is rejected`                                                                   |
| Fenced unfinished example comment before a valid live review      | Fenced lines are masked, so the example is inert and the live record is accepted     | parser `fenced literal evidence contributes no records or delimiters`; CLI `fenced unfinished example before a live required review leaves it valid` and `… before a live candidate record leaves it valid` |

Additional S002-R9 regressions: required-state missing delimiter
(`required completion evidence missing its closing delimiter is rejected`),
clean absence (`clean evidence absence yields no records or diagnostics`;
`clean optional evidence absence validates`), a valid fenced example in a
required state (`valid fenced example record is inert in a required state`) and
a fenced delimiter that must not repair a malformed live attempt
(`a fenced closing delimiter does not terminate a live attempt`;
`fenced closing delimiter does not repair malformed live evidence`). The old
raw-regex implementation was replayed on the new cases as discriminating
evidence: 8 of the 12 replayed new parser/CLI tests fail under it, including all
three Codex reproductions.

### Guidance reconciliation

`implementation/VERIFICATION.md`, `specs/SCOPE_AND_ASSUMPTIONS.md` and
`implementation/STEP_REPORT_TEMPLATE.md` now state that an unterminated live
opening is a malformed record in every state and that fenced content contributes
neither records nor delimiters. The lifecycle matrix itself is unchanged. No
checkpoint definition, requirement, acceptance criterion, sequence gate or
ordering was altered by this pass.

### Structural validation versus full-definition preservation

The ordinary validator checks structural identities, ordering, sequence
gates, requirement/acceptance coverage, live evidence structure and
Markdown/projection agreement; it does **not** compare byte-for-byte full-body
equivalence of all 203 checkpoint definitions or of every adopted document.
Codex's separate independent full-definition comparison supplies that
preservation evidence for the candidate. This correction pass touches only the
evidence parser, three guidance sentences and the test suite, so those
definitions remain as reviewed.

### Verified (fresh executions, correction pass 3)

All commands ran through the required execution routing under process-local
Node `v24.21.0`. Logs are retained outside the repository.

| #   | Command                                                           | Dir    | Exit | Result                                                          |
| --- | ----------------------------------------------------------------- | ------ | ---- | --------------------------------------------------------------- |
| 1   | Required environment diagnostics                                  | target | 0    | Green before the first mutating command                         |
| 2   | `pnpm run check:contracts`                                        | target | 0    | `0 error(s), 0 warning(s)`                                      |
| 3   | `pnpm run test:contracts`                                         | target | 0    | 83 tests, 83 pass, 0 fail, 0 skipped                            |
| 4   | `pnpm run format:check`                                           | target | 0    | All matched files use Prettier code style                       |
| 5   | `node tools/check-contracts.mjs --generate` (×2)                  | target | 0    | `COMMIT_SEQUENCE.json` byte-identical across runs and unchanged |
| 6   | isolated rehearsal: `two` (S001+S002 complete)                    | target | 0    | `check:contracts` 0/0; full suite 83/83, 0 fail, 0 skipped      |
| 7   | isolated rehearsal: `boundary` (RCLD-01 complete, S014 candidate) | target | 0    | `check:contracts` 0/0; full suite 83/83, 0 fail, 0 skipped      |
| 8   | `git diff --check` / `git diff --cached --check`                  | target | 0    | No whitespace diagnostics; nothing staged                       |

Projection determinism: `COMMIT_SEQUENCE.json`
`f26e68c084472504d21b4a7de08a6330909482e331fa6d69b3a2598a89c2dc2a` and
`SOURCES.json`
`8c4094b024a73c80ce2c8f465f477246552d2dcfb8f8c14ba19bdc4c2f0c726c` are
byte-identical before and after two explicit `--generate` runs and remain
untracked candidate projections, not committed artifacts. Temporary fixtures
were removed after every run (no leaked `suik-contracts-*` directories).

### Reference Rust guard

No Rust source is in S002 scope and the reference is unchanged. The authorized
reference worktree was verified clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98`, and `review 3` in
`implementation/evidence/S002_REVIEW.md` records Codex's fresh same-checkpoint
guard: `cargo fmt --all -- --check`, `cargo check --workspace --all-targets` and
`cargo test --workspace --all-targets` each exit 0, with 562 top-level passes
plus 16 nested subprocess passes, zero failures and four explicitly ignored
tests. That is cited reviewer evidence; Pi did not run a fresh Rust guard in this
parser-only pass and does not claim one. No reference source was changed.

### Self-review

- Re-read the complete validator, suite and fixture module; the masking scanner
  is bounded and dependency-free, and its offsets address the original document
  because masked lines preserve length and line breaks.
- Replayed the pre-fix parser against the new cases to confirm the regressions
  are discriminating rather than tautological.
- Confirmed the real S001/S002 evidence records still parse, the projection is
  unchanged, no dependency/lockfile/engine/workspace change occurred, and the
  S002 record still reads report `candidate` / review `changes_requested` with a
  null commit. Codex's review verdict was not edited.
- This entire candidate remains unstaged and uncommitted; S003 was not started.
