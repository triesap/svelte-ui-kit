# S069 step report — Persist recoverable prepared-state journals

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-04 batch. This report is Pi-authored evidence; Codex
alone assigns acceptance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S069","kind":"report","commit":"715a9f8aca50392fd32227fa3d421baaad89b407","disposition":"candidate"}
-->

Step ID and title: S069 — Persist recoverable prepared-state journals.

Contract/requirement IDs: R13, R16, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see
`specs/SECURITY_AND_TRANSACTIONS.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `transaction-journal.ts` gains `prepareJournal` (attach the staged id produced
  by staging and reserve a deterministic backup id for every update/retire
  preimage, moving the phase to `prepared`) and `verifyPreparedJournal` (refuse
  a prepared record missing a staged image or a preimage backup).
- `persistJournal` now exposes the durable ordering as fault-injectable
  `journal:write`/`journal:fsync` boundaries (write temporary, flush file,
  atomic rename, flush directory).
- `tests/integration/journal-preparation.test.ts` covers pre-publication failure
  with unchanged live files, restart identification of exact owned staging, and
  refusal of a missing staged image or backup id.

## Files touched

- `src/codegen/transaction-journal.ts` — prepared-state record/verify helpers
  and journal fault boundaries.
- `tests/integration/journal-preparation.test.ts` — new focused suite.
- `implementation/COMMIT_SEQUENCE.md` — finalizes the S068 pending ledger row
  and records this checkpoint's implementation hash with the successor.

## Verification

- `pnpm run test:integration -- tests/integration/journal-preparation.test.ts` —
  exit 0, 3/3.
- `pnpm run test:unit -- tests/unit/transaction-journal.test.ts` — exit 0, 6/6
  (regression).
- `pnpm run format:check` — exit 0.
- `pnpm run lint` — exit 0, zero warnings.
- `pnpm run typecheck` — exit 0, five configs.
- `git diff --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Prepared state is durable and re-readable; per-file replacement and lock
  publication remain S070–S071.
- No live application target is written by this checkpoint.
