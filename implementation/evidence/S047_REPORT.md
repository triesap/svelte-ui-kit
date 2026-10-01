# S047 step report — Assemble source-file change plans

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S047","kind":"report","commit":"aa84b8078ccc8c0ff173bad41fb72c6a654c51b1","disposition":"candidate"}
-->

Step ID and title: S047 — Assemble source-file change plans.

Contract/requirement IDs: R06, R13, R15, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/GENERATED_LAYOUT.md`,
`specs/SECURITY_AND_TRANSACTIONS.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/source-plan.ts` assembles deterministic source changes from the
  S045 target records and the incoming files. Every target has one owner; a
  target with no owner is itself a conflict.
- Any conflict makes the whole batch non-executable and every conflict is
  collected in deterministic path order rather than stopping at the first.
- Candidate (incoming) and installed (recorded base) lineage are recorded
  separately, and only `create`/`update` dispositions produce bytes.

## Files touched

- `src/codegen/source-targets.ts` — records the lock owner on each target.
- `src/codegen/source-plan.ts` — new module.
- `tests/integration/source-plan.test.ts` — new integration suite.
- `implementation/evidence/S046_REPORT.md` and `implementation/COMMIT_SEQUENCE.md`
  — S046 pending-review bookkeeping (recorded with this checkpoint).

## Verification

- `pnpm run test:integration -- tests/integration/source-plan.test.ts`
  — exit 0, 3/3, including a complete-tree snapshot purity control.
- `pnpm run typecheck` — exit 0, five configs.
- `pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- CSS/export/layout patch planning remains S048–S056.
