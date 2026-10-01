# S062 step report — Integrate configuration-driven retirement

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S062","kind":"report","commit":"9ffbf9e3fa502eff09345e7707f6767002edb512","disposition":"candidate"}
-->

Step ID and title: S062 — Integrate configuration-driven retirement.

Contract/requirement IDs: R11, R17, R18, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/DATA_MODEL.md`,
`specs/GENERATED_LAYOUT.md`, `specs/STYLING.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/retire.ts` adds `planCssRetirement`: a clean retired managed block
  is removed, a customized block keeps its complete marked span and detaches
  ownership, and an unobserved/malformed target is a conflict.
- `src/codegen/plan-add.ts` excludes owners that left the closure from the
  forward source/CSS/cohort reconciliation, so a removal is decided by
  retirement rather than misreported as an untracked conflict.
- `src/codegen/plan-sync.ts` composes source and CSS retirement with the
  recalculated closure: a still-shared dependency is retained, clean assets are
  deleted, customized assets are retained with warnings, and application exports
  are preserved (the root barrel is regenerated only from the retained closure).

## Files touched

- `src/codegen/retire.ts` — CSS retirement planner.
- `src/codegen/plan-add.ts` — exclude retired owners from reconciliation.
- `src/codegen/plan-sync.ts` — compose source/CSS retirement.
- `tests/integration/plan-retirement.test.ts` — new integration suite.

## Verification

- `pnpm run test:integration -- tests/integration/plan-retirement.test.ts` — exit
  0, 4/4 (shared dependency retained, clean block removed, customized retained
  and detached, application exports preserved).
- `pnpm run test:integration -- tests/integration/plan-sync.test.ts` and
  `tests/integration/plan-add.test.ts` — exit 0.
- `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck` — exit 0.
- `pnpm run check:contracts` — exit 0, 0 errors / 0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- S063's purity qualification and the cumulative milestone evidence remain.

## RCLD-03 review-4 reconciliation

This report records the original checkpoint candidate named in its structured
evidence block. The composed planner was subsequently repaired under
independent review 4 (`implementation/COMMIT_SEQUENCE.md`, RCLD03-R4-1/2/3/4).
The authoritative reconciliation of actual scope, artifact identity,
intermediate failures, reruns and raw exits is
`implementation/evidence/RCLD03_R4_REPAIR.md` with the review-4 addendum in
`implementation/evidence/COMPATIBILITY.md`; the original acceptance criteria
are unchanged. This report is Pi implementation evidence, not acceptance.
