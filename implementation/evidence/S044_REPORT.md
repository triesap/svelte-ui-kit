# S044 step report — Implement source base/local/incoming classification

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S044","kind":"report","commit":"a4080db4d5a43f19933e70ed76a62eaf0d5bc606","disposition":"candidate"}
-->

Step ID and title: S044 — Implement source base/local/incoming classification.

Contract/requirement IDs: R13, R15, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/SECURITY_AND_TRANSACTIONS.md`,
`specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/compare.ts` applies the frozen S043 ownership matrix to actual
  base/local/incoming bytes and records exact-byte SHA-256 hashes. It is pure:
  no filesystem access, no write and no plan mutation.
- A `customized` result preserves the recorded base; only a clean `update`
  advances the base. `no_change`, `update`, `customized`, `conflict`,
  `untracked_conflict` and `create` are returned without writes.

## Files touched

- `src/codegen/compare.ts` — new module.
- `tests/unit/source-compare.test.ts` — new unit suite.
- `implementation/evidence/S043_REPORT.md` and `implementation/COMMIT_SEQUENCE.md`
  — S043 pending-review bookkeeping (recorded with this checkpoint).

## Verification

- `pnpm run test:unit -- tests/unit/source-compare.test.ts`
  — exit 0, 4/4.
- `pnpm run test:unit -- tests/unit/ownership-policy.test.ts`
  — exit 0, 6/6.
- `pnpm run build` — exit 0.
- `pnpm run typecheck` — exit 0, five configs.
- `pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Immutable target observations and source-target planning remain S045–S047.
