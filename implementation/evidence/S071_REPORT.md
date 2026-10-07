# S071 step report — Publish the canonical install lock last

The separate reviewer independently accepted the original S071 criteria on
`ce54d7d6a93f3f7dd2d1e25038390f6d95deb033`; review evidence is committed at
`fd1d0938d9ad188c5646c153b76fa2989438c727`. Original implementation `6f4d0cbf5e4538eb7d03aac53181ede2b7f5e066` remains provenance.
See `S071_REVIEW.md` and `RCLD-04_QUALIFICATION.md`. Historical author results
below are supplemented by the current repair and qualification records.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S071","kind":"report","commit":"fd1d0938d9ad188c5646c153b76fa2989438c727","disposition":"implemented"}
-->

Step ID and title: S071 — Publish the canonical install lock last.

Contract/requirement IDs: R12, R13, R16, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/DATA_MODEL.md`,
`specs/SECURITY_AND_TRANSACTIONS.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/publish-lock.ts` validates the complete planned lock (schema and
  state-dir context) and requires a fully applied journal before any
  replacement. It stages the lock on the same filesystem and renames it over
  `_kit/kit.lock.json` as the final semantic publication, then records
  `published`/`unchanged` plus the unique transaction id in the journal and
  moves the phase to `published`.
- An invalid planned lock is refused and never replaces existing state. A
  same-byte publication remains distinguishable through the transaction id.
- `tests/integration/lock-publication.test.ts` covers lock-last ordering,
  invalid-lock refusal and same-byte publication identity.

## Files touched

- `src/codegen/publish-lock.ts` — new lock publication module.
- `tests/integration/lock-publication.test.ts` — new focused suite.
- `implementation/COMMIT_SEQUENCE.md` — finalizes the S070 pending ledger row
  and records this checkpoint's implementation hash with the successor.

## Verification

- `pnpm run test:integration -- tests/integration/lock-publication.test.ts` —
  exit 0, 3/3.
- `pnpm run test:integration -- tests/integration/lock-projection.test.ts` —
  exit 0, 4/4 (regression).
- `pnpm run format:check` — exit 0.
- `pnpm run lint` — exit 0, zero warnings.
- `pnpm run typecheck` — exit 0, five configs.
- `git diff --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Lock publication is the commit point; cleanup and recovery remain
  S072–S077.
