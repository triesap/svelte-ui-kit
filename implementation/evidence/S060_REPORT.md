# S060 step report — Build the full synchronization plan

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S060","kind":"report","commit":"8b45bc90038b21b9ab6b789b921b1fa6e217c022","disposition":"candidate"}
-->

Step ID and title: S060 — Build the full synchronization plan.

Contract/requirement IDs: R09, R11, R13, R14, R15, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/API_CONTRACTS.md`,
`specs/DATA_MODEL.md`, `specs/SECURITY_AND_TRANSACTIONS.md`,
`specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/plan-sync.ts` reconciles the config's desired roots with the
  incoming registry through the shared read-only reconciliation engine and the
  S059 cohort rule, then composes the configuration-driven retirement view.
- A retirement conflict (an unobserved retired target) blocks the whole batch;
  otherwise clean retired files become deletions and customized/nonregular ones
  are retained with their ownership detached.
- `tests/helpers/registry.ts` provides the shared in-memory registry snapshot
  builder used by the planner suites.

## Files touched

- `src/codegen/plan-sync.ts` — new module.
- `tests/integration/plan-sync.test.ts` — new integration suite.
- `tests/helpers/registry.ts` — new shared test helper.

## Verification

- `pnpm run test:integration -- tests/integration/plan-sync.test.ts` — exit 0,
  5/5 (untouched upgrade, local-only customization, conflict unchanged, already
  incoming, requested-vs-closure).
- `pnpm run test:integration -- tests/integration/plan-add.test.ts` — exit 0.
- `pnpm run test:unit -- tests/unit/cohorts.test.ts` — exit 0.
- `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck` — exit 0.
- `pnpm run check:contracts` — exit 0, 0 errors / 0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- The shared effective-lineage lock projection is finalized at S061; truthful
  retirement lineage at S062; the purity qualification at S063.

## RCLD-03 review-4 reconciliation

This report records the original checkpoint candidate named in its structured
evidence block. The composed planner was subsequently repaired under
independent review 4 (`implementation/COMMIT_SEQUENCE.md`, RCLD03-R4-1/2/3/4).
The authoritative reconciliation of actual scope, artifact identity,
intermediate failures, reruns and raw exits is
`implementation/evidence/RCLD03_R4_REPAIR.md` with the review-4 addendum in
`implementation/evidence/COMPATIBILITY.md`; the original acceptance criteria
are unchanged. This report is Pi implementation evidence, not acceptance.
