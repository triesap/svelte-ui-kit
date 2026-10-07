# S074 step report — Recover published transactions and incomplete cleanup

The separate reviewer independently accepted the original S074 criteria on
`ce54d7d6a93f3f7dd2d1e25038390f6d95deb033`; review evidence is committed at
`fd1d0938d9ad188c5646c153b76fa2989438c727`. Original implementation `9cefe60559121fef54956871e9edeb2047ffb40a` remains provenance.
See `S074_REVIEW.md` and `RCLD-04_QUALIFICATION.md`. Historical author results
below are supplemented by the current repair and qualification records.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S074","kind":"report","commit":"fd1d0938d9ad188c5646c153b76fa2989438c727","disposition":"implemented"}
-->

Step ID and title: S074 — Recover published transactions and incomplete cleanup.

Contract/requirement IDs: R13, R16, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see
`specs/SECURITY_AND_TRANSACTIONS.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `recovery.ts` recognizes a `published`/`cleaned` transaction from its journal
  lock record and the canonical lock's presence, then finishes only safe
  cleanup of owned ephemeral state. A missing canonical lock or an absent
  publication record is refused rather than guessed. Committed source and lock
  bytes are never rolled back, and post-commit user edits survive.
- Same-byte lock publications (recorded `unchanged`) are classified correctly.
- `tests/integration/recovery-published.test.ts` covers post-publication crash,
  same-byte publication and post-commit edits.

## Files touched

- `src/codegen/recovery.ts` — published-transaction recovery path.
- `tests/integration/recovery-published.test.ts` — new focused suite.
- `implementation/COMMIT_SEQUENCE.md` — finalizes the S073 pending ledger row
  and records this checkpoint's implementation hash with the successor.

## Verification

- `pnpm run test:integration -- tests/integration/recovery-published.test.ts` —
  exit 0, 3/3.
- `pnpm run test:integration -- tests/integration/lock-publication.test.ts` —
  exit 0, 3/3 (regression).
- `pnpm run format:check` — exit 0.
- `pnpm run lint` — exit 0, zero warnings.
- `pnpm run typecheck` — exit 0, five configs.
- `git diff --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Consolidated invalid-evidence diagnostics, real-process qualification and the
  composed apply use case remain S075–S077.
