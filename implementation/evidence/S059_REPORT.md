# S059 step report — Enforce source-style compatibility cohorts

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S059","kind":"report","commit":null,"disposition":"candidate"}
-->

Step ID and title: S059 — Enforce source-style compatibility cohorts.

Contract/requirement IDs: R13, R14, R15, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see
`specs/SECURITY_AND_TRANSACTIONS.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/cohorts.ts` freezes the conservative Q09 compatibility rule: the
  component (item id) is the unit; a unit that mixes an incoming adoption with a
  customized or conflicting member is blocked as a whole. A standalone
  customization with unchanged upstream is not a conflict, unrelated units stay
  independent, and a changed public export surface widens the unit to its
  transitive dependents.
- `src/codegen/plan-add.ts` now assembles source, managed-CSS and export
  members and applies the cohort policy before producing an executable batch.
- `specs/SYNCHRONIZATION.md` records the frozen rule and its examples.

## Files touched

- `src/codegen/cohorts.ts` — new module.
- `src/codegen/plan-add.ts` — cohort assembly and policy application.
- `tests/unit/cohorts.test.ts` — new unit suite.
- `specs/SYNCHRONIZATION.md` — frozen cohort rule.

## Verification

- `pnpm run test:unit -- tests/unit/cohorts.test.ts` — exit 0, 6/6.
- `pnpm run test:integration -- tests/integration/plan-add.test.ts` — exit 0.
- `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck` — exit 0.
- `pnpm run check:contracts` — exit 0, 0 errors / 0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Full synchronization (S060), truthful lock lineage (S061), configuration-driven
  retirement (S062) and the purity qualification (S063) remain.
