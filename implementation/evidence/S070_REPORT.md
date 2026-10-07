# S070 step report — Apply per-file replacements with recorded progress

The separate reviewer independently accepted the original S070 criteria on
`ce54d7d6a93f3f7dd2d1e25038390f6d95deb033`; review evidence is committed at
`fd1d0938d9ad188c5646c153b76fa2989438c727`. Original implementation `4ce4de42106726d3657d3e743d156b2098a3ec20` remains provenance.
See `S070_REVIEW.md` and `RCLD-04_QUALIFICATION.md`. Historical author results
below are supplemented by the current repair and qualification records.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S070","kind":"report","commit":"fd1d0938d9ad188c5646c153b76fa2989438c727","disposition":"implemented"}
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
