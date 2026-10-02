# S075 step report — Fail closed on corrupt or ambiguous recovery evidence

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-04 batch. This report is Pi-authored evidence; Codex
alone assigns acceptance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S075","kind":"report","commit":"c82decccf777cd3004721bf161b0ac7be30f2a14","disposition":"candidate"}
-->

Step ID and title: S075 — Fail closed on corrupt or ambiguous recovery evidence.

Contract/requirement IDs: R09, R16, R30, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/API_CONTRACTS.md`,
`specs/SECURITY_AND_TRANSACTIONS.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/recovery.ts` consolidates invalid journal/lock/backup/owner
  diagnostics, refuses a corrupt/forged/identity-mismatched journal without
  mutating, and exposes a read-only `inspectTransactions` so a new mutation can
  be blocked while ambiguity is unresolved. Recovery never deletes unknown state
  based on age or a recycled process id.
- `src/cli/protocol.ts` adds `recoveryGuidance`/`recoveryDiagnostic`, mapping
  fail-closed recovery codes to safe error diagnostics with manual next actions
  and no invented force/recover flag.
- `tests/integration/recovery-invalid.test.ts` covers corrupt/forged/identity
  mismatch refusal, age-only refusal on a user-edited batch, non-mutation and
  actionable guidance.

## Files touched

- `src/codegen/recovery.ts` — fail-closed diagnostics and read-only inspection.
- `src/cli/protocol.ts` — recovery diagnostic guidance helper.
- `tests/integration/recovery-invalid.test.ts` — new focused suite.
- `implementation/COMMIT_SEQUENCE.md` — finalizes the S074 pending ledger row
  and records this checkpoint's implementation hash with the successor.

## Verification

- `pnpm run test:integration -- tests/integration/recovery-invalid.test.ts` —
  exit 0, 4/4.
- `pnpm run test:unit -- tests/unit/protocol.test.ts` — exit 0, 9/9
  (regression).
- `pnpm run format:check` — exit 0.
- `pnpm run lint` — exit 0, zero warnings.
- `pnpm run typecheck` — exit 0, five configs.
- `git diff --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Ambiguity is refused, not auto-resolved; real-process qualification and the
  composed apply use case remain S076–S077.
