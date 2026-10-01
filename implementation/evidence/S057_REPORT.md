# S057 step report — Build a pure initialization plan

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S057","kind":"report","commit":"ba870579ef1c9e862869e4dfe1b6a47f65d4a045","disposition":"candidate"}
-->

Step ID and title: S057 — Build a pure initialization plan.

Contract/requirement IDs: R05, R09, R15, R17, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/API_CONTRACTS.md`,
`specs/GENERATED_LAYOUT.md`, `specs/SECURITY_AND_TRANSACTIONS.md`,
`specs/STYLING.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/plan-init.ts` builds the minimal initialization plan from the
  selected config and an S041 snapshot: the config file, the empty managed
  export region, the aggregate stylesheet with the frozen tokens layer,
  explicitly reported absent themes/app stylesheets, the ordered layout imports
  and the initial lock.
- Existing application styles and layouts are preserved. No unrequested
  component source is installed. The plan is data only; nothing is written and
  no writer is started.

## Files touched

- `src/codegen/plan-init.ts` — new module.
- `tests/integration/plan-init.test.ts` — new integration suite.
- `implementation/evidence/S056_REPORT.md` and `implementation/COMMIT_SEQUENCE.md`
  — S056 pending-review bookkeeping (recorded with this checkpoint).

## Verification

- `pnpm run test:integration -- tests/integration/plan-init.test.ts`
  — exit 0, 3/3, including a complete-tree snapshot purity control.
- `pnpm run typecheck` — exit 0, five configs.
- `pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Add/sync/cohort/lineage/purity planners remain S058–S063.
