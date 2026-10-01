# S063 step report — Qualify deterministic zero-write planning

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S063","kind":"report","commit":"451c13a48a9d0b0866811bd3c94fc0c53bcc8ffc","disposition":"candidate"}
-->

Step ID and title: S063 — Qualify deterministic zero-write planning.

Contract/requirement IDs: R10, R15, R30, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/API_CONTRACTS.md`,
`specs/SECURITY_AND_TRANSACTIONS.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/plan.ts` adds a deterministic plan envelope: writes are sorted by
  logical path and each entry exposes the exact byte length and SHA-256 digest,
  so an equivalent logical reordering is invisible while a content change is
  never hidden.
- `tests/integration/plan-purity.test.ts` snapshots complete trees (hidden
  entries, modes, kinds) around init/add/sync planning and a conflict case, and
  proves equivalent logical inputs yield identical envelopes and a satisfied
  initialization replays as a no_change.

## Files touched

- `src/codegen/plan.ts` — deterministic plan envelope.
- `tests/integration/plan-purity.test.ts` — new integration suite.

## Verification

- `pnpm run test:integration -- tests/integration/plan-purity.test.ts` — exit 0,
  3/3 (side-effect-free init/add/sync, order-independent envelopes, conflict
  no-write).
- `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck` — exit 0.
- `pnpm run check:contracts` — exit 0, 0 errors / 0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Cumulative qualification (review-6 candidate)

Run at the current review-6 candidate revision with Node `24.21.0` / pnpm
`11.22.0` through the configured build router; every lane exited 0 with zero
skips unless stated:

- Frozen strict install: `pnpm install --frozen-lockfile
--strict-peer-dependencies --engine-strict` — exit 0.
- `format:check`, `lint`, `typecheck` — exit 0.
- `test:unit` 265/265, `test:harness` 37/37, `test:registry` 38/38,
  `test:integration` 255/255, `test:cli-bootstrap` 52/52, `test:components`
  22/22, `test:contracts` 127/127, `check:contracts` 0 errors/0 warnings.
- Fixture/consumer lanes: `fixture:check` (svelte-check 0 errors/0 warnings),
  `test:fixture` 23/23, `test:browser` 23/23 chromium including the fault and
  teardown controls. `tests/integration/planned-consumer.test.ts` builds a
  consumer from exactly the composed add plan over a real validated registry
  snapshot and asserts visible SSR page output from the production handler,
  with a missing-child-rendering negative control, distinct from the maintained
  hand-authored fixture. `installed-package` (in `test:integration`) qualifies
  the emitted modules and the promoted TypeScript/Svelte planner/parser paths
  from an installed package without author-tree fallback.
- Strict declaration controls: `tests/components/strict-declaration.test.ts`
  17/17, permitting exactly the two qualified Bits 2.19.3 TS2590 diagnostics at
  `button2:23`/`calendar2:25` with Svelte 5.57.1 / TS 6.0.3 / svelte-check 4.7.6
  (fixture-only release AC20 debt).
- Workflow validation: `actionlint 1.7.12` (darwin/arm64) archive SHA-256
  `aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f` matched the
  published checksums, ran `actionlint .github/workflows/ci.yml` at exit 0 with
  `shellcheck 0.11.0` present.
- Fresh reference guard in the clean `leptos_ui_kit` worktree at
  `a10fbf06334f4648f5755e05a7147414e4e5fc98`: `cargo fmt --all -- --check` exit
  0, `cargo check --workspace --all-targets` exit 0, `cargo test --workspace
--all-targets` exit 0 (578 passed, 0 failed, 4 ignored across 43 result
  blocks). The four ignored tests were not executed and are:
  `installed_binaries_run_after_package_source_and_build_state_are_deleted`,
  `homepage_fixture_cli_workflow_smoke`,
  `tests::every_transaction_io_fault_avoids_partial_application_state` and
  `packaged_sources_build_with_cargo_vcs_provenance_outside_and_inside_hostile_git`.
  No reference mutation.

The review-3 table below is historical: it predates the review-4/5/6 composed
entry, ownership and lifecycle repairs. Its `test:harness` 29/29 and
`test:integration` 196/196 counts are not the current candidate's counts, and
its reference-guard claim of a single ignored test was a tail-excerpt error that
is corrected in this report and in the review-6 addendum of
`implementation/evidence/COMPATIBILITY.md`.

## Historical review-3 qualification (superseded)

Run at the review-3 S063 candidate revision; retained for provenance only.

- Frozen strict install: `pnpm install --frozen-lockfile
--strict-peer-dependencies --engine-strict` — exit 0.
- `format:check`, `lint`, `typecheck` — exit 0.
- `test:unit` 265/265, `test:harness` 29/29, `test:registry` 38/38,
  `test:integration` 196/196, `test:cli-bootstrap` 52/52, `test:components`
  22/22, `test:contracts` 127/127, `check:contracts` 0 errors/0 warnings.
- Fixture/consumer lanes: `fixture:check` (svelte-check 0 errors/0 warnings),
  `test:fixture` 23/23, `test:browser` 23/23 chromium including the fault and
  teardown controls. `tests/integration/planned-consumer.test.ts` builds a
  consumer from exactly the composed add plan over a real validated registry
  snapshot, distinct from the maintained hand-authored fixture.
  `installed-package` (in `test:integration`) qualifies the emitted modules and
  the promoted TypeScript/Svelte planner/parser paths from an installed package
  without author-tree fallback.
- Strict declaration controls: `tests/components/strict-declaration.test.ts`
  17/17, permitting exactly the two qualified Bits 2.19.3 TS2590 diagnostics at
  `button2:23`/`calendar2:25` with Svelte 5.57.1 / TS 6.0.3 / svelte-check 4.7.6
  (fixture-only release AC20 debt).
- Workflow validation: `actionlint 1.7.12` (darwin/arm64) SHA-256
  `aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f` matched the
  published checksums, ran `actionlint .github/workflows/ci.yml` at exit 0 with
  `shellcheck 0.11.0` present.
- Fresh reference guard in the clean `leptos_ui_kit` worktree: `cargo fmt --all
-- --check` exit 0, `cargo check --workspace --all-targets` exit 0, `cargo test
--workspace --all-targets` exit 0 (578 passed, 0 failed, 4 ignored across the
  result blocks). No reference mutation.

## Limitations

- Independent review 4 supersedes the review-3 qualification prose above: the
  review-3 run predates the RCLD03-R4 composed-entry repair. The current
  candidate revision and its exact lane counts are recorded in
  `implementation/VERIFICATION.md` and the RCLD-03 review-4 repair commit; a
  fully qualified S063 candidate still requires the complete cumulative run and
  independent Codex acceptance. No claim in the review-3 section should be read
  as acceptance of the newer revision.
- The conditional Rust guard is N/A for this repository: it has no Cargo
  workspace; the reference guard above is the applicable run.
- S064 remains gated by independent Codex S063 acceptance; no release, remote
  workflow, browser-platform matrix or publication acceptance is implied.
- The qualified upstream Bits declaration exception remains fixture-only
  release AC20 debt.
