# S073 step report — Recover interrupted prepublication transactions

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-04 batch. This report is Pi-authored evidence; Codex
alone assigns acceptance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S073","kind":"report","commit":"68af0a9440728393672dbebb5f3a8ca40a880804","disposition":"candidate"}
-->

Step ID and title: S073 — Recover interrupted prepublication transactions.

Contract/requirement IDs: R13, R16, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see
`specs/SECURITY_AND_TRANSACTIONS.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/recovery.ts` scans owned transaction directories, parses the
  journal strictly (identity-checked against its directory) and rolls a
  `prepared`/`applied` transaction back to its recorded preimages: a created
  target is removed only when it still holds the exact planned result, and an
  update/retire is restored only from its owned backup. A post-interruption user
  edit, a missing backup or an unexpected preimage refuses with a typed
  diagnostic and retains the evidence; a `planned` transaction has no live bytes
  and is discarded.
- `tests/integration/recovery-prepublication.test.ts` covers rollback at three
  interruption boundaries, user-edit refusal and missing-backup refusal.

## Files touched

- `src/codegen/recovery.ts` — new recovery module.
- `tests/integration/recovery-prepublication.test.ts` — new focused suite.
- `implementation/COMMIT_SEQUENCE.md` — finalizes the S072 pending ledger row
  and records this checkpoint's implementation hash with the successor.

## Verification

- `pnpm run test:integration -- tests/integration/recovery-prepublication.test.ts`
  — exit 0, 3/3.
- `pnpm run test:unit -- tests/unit/transaction-state.test.ts` — exit 0, 5/5
  (regression).
- `pnpm run format:check` — exit 0.
- `pnpm run lint` — exit 0, zero warnings.
- `pnpm run typecheck` — exit 0, five configs.
- `git diff --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Published-transaction recovery, consolidated invalid-evidence diagnostics and
  real-process qualification remain S074–S077.
