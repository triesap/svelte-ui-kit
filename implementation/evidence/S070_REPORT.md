# S070 step report — Apply per-file replacements with recorded progress

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-04 batch. This report is Pi-authored evidence; Codex
alone assigns acceptance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S070","kind":"report","commit":null,"disposition":"candidate"}
-->

Step ID and title: S070 — Apply per-file replacements with recorded progress.

Contract/requirement IDs: R16, R18, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see
`specs/SECURITY_AND_TRANSACTIONS.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/replace.ts` applies the prepared journal in order: an
  update/retire first moves the exact preimage into an owned backup, then a
  create/update atomically renames its verified staged image over the target.
  Progress is persisted after every operation, so an interruption is a
  detectable mixed state. The install lock is not published here.
- Failure at a replacement boundary returns the partial journal with the
  already-applied operations marked, so recovery can act on real state.
- `tests/integration/replacement.test.ts` covers a successful exact batch,
  mode/neighbor preservation, retirement, a mid-batch replacement fault and a
  post-backup fault.

## Files touched

- `src/codegen/replace.ts` — new journaled replacement module.
- `src/codegen/transaction-hooks.ts` — adds occurrence/post-boundary fault
  helpers.
- `tests/integration/replacement.test.ts` — new focused suite.
- `implementation/COMMIT_SEQUENCE.md` — finalizes the S069 pending ledger row
  and records this checkpoint's implementation hash with the successor.

## Verification

- `pnpm run test:integration -- tests/integration/replacement.test.ts` — exit
  0, 3/3.
- `pnpm run test:integration -- tests/integration/journal-preparation.test.ts` —
  exit 0, 3/3 (regression).
- `pnpm run format:check` — exit 0.
- `pnpm run lint` — exit 0, zero warnings.
- `pnpm run typecheck` — exit 0, five configs.
- `git diff --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- No native multi-file atomicity is claimed; each single-file rename is the
  atomic unit. Lock publication and cleanup remain S071–S072.
- The install lock is deliberately not published by this checkpoint.
