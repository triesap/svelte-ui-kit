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

## Cumulative RCLD-03 review-3 qualification

Run at the S063 candidate revision with Node `24.21.0` / `pnpm 11.22.0`; every
lane exited 0 with zero skips:

- Frozen strict install: `pnpm install --frozen-lockfile
--strict-peer-dependencies --engine-strict` — exit 0.
- `format:check`, `lint`, `typecheck` — exit 0.
- `test:unit` 265/265, `test:harness` 29/29, `test:registry` 38/38,
  `test:integration` 196/196, `test:cli-bootstrap` 52/52, `test:components`
  22/22, `test:contracts` 127/127, `check:contracts` 0 errors/0 warnings.
- Fixture/consumer lanes: `fixture:check` (svelte-check 0 errors/0 warnings),
  `test:fixture` 23/23, `test:browser` 23/23 chromium including the fault and
  teardown controls. The maintained consumer check/build is the planned-consumer
  qualification; `installed-package` (in `test:integration`) qualifies the
  emitted modules from an installed package without author-tree fallback.
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

- The conditional Rust guard is N/A for this repository: it has no Cargo
  workspace; the reference guard above is the applicable run.
- S064 remains gated by independent Codex S063 acceptance; no release, remote
  workflow, browser-platform matrix or publication acceptance is implied.
- The qualified upstream Bits declaration exception remains fixture-only
  release AC20 debt.
