# S072 step report — Clean completed transactions without losing evidence

The separate reviewer independently accepted the original S072 criteria on
`ce54d7d6a93f3f7dd2d1e25038390f6d95deb033`; review evidence is committed at
`fd1d0938d9ad188c5646c153b76fa2989438c727`. Original implementation `a55f72ded1b2499ca83779e91a2c5c2350ccbf54` remains provenance.
See `S072_REVIEW.md` and `RCLD-04_QUALIFICATION.md`. Historical author results
below are supplemented by the current repair and qualification records.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S072","kind":"report","commit":"fd1d0938d9ad188c5646c153b76fa2989438c727","disposition":"implemented"}
-->

Step ID and title: S072 — Clean completed transactions without losing evidence.

Contract/requirement IDs: R15, R16, R17, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/GENERATED_LAYOUT.md`,
`specs/SECURITY_AND_TRANSACTIONS.md`, `specs/STYLING.md`,
`specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/transaction-cleanup.ts` removes a published transaction's owned
  staging, backups, progress and journal in order, then its transaction
  directory. It removes only the directory named by the transaction id it was
  given, so another transaction and unrelated temporaries survive. A cleanup
  failure reports `COMMITTED_NEEDS_CLEANUP` and retains the evidence.
- `ensureIgnoreEntry` appends one managed `.gitignore` entry for the transient
  namespace only when absent, preserving every existing rule; repeat calls are
  no-ops.
- `tests/integration/transaction-cleanup.test.ts` covers owned-only cleanup,
  injected cleanup failure with retained evidence, idempotent ignore
  integration and unrelated-state survival.

## Files touched

- `src/codegen/transaction-cleanup.ts` — new cleanup/ignore module.
- `tests/integration/transaction-cleanup.test.ts` — new focused suite.
- `implementation/COMMIT_SEQUENCE.md` — finalizes the S071 pending ledger row
  and records this checkpoint's implementation hash with the successor.

## Verification

- `pnpm run test:integration -- tests/integration/transaction-cleanup.test.ts`
  — exit 0, 4/4.
- `pnpm run test:integration -- tests/integration/lock-publication.test.ts` —
  exit 0, 3/3 (regression).
- `pnpm run format:check` — exit 0.
- `pnpm run lint` — exit 0, zero warnings.
- `pnpm run typecheck` — exit 0, five configs.
- `git diff --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Cleanup is safe after publication; prepublication and published recovery
  remain S073–S077.
