# S058 step report — Build a pure add-request plan

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S058","kind":"report","commit":"7a87786571cf3cb5513e86639fd977e1d1d419e9","disposition":"candidate"}
-->

Step ID and title: S058 — Build a pure add-request plan.

Contract/requirement IDs: R09, R10, R11, R15, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/API_CONTRACTS.md`,
`specs/DATA_MODEL.md`, `specs/SECURITY_AND_TRANSACTIONS.md`,
`specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/plan-add.ts` combines the desired config, the explicit added
  roots and the resolved registry closure into one read-only proposed batch.
- The projection keeps requested roots separate from the transitive closure;
  dependency instructions are reported as data only.
- Source, managed-CSS and root-export changes are classified against the
  immutable snapshot and the recorded lock ownership. Customized managed
  regions are preserved; genuinely diverged content is a collected conflict.
- A genuine conflict makes the whole batch non-executable: `kit.json` and every
  other target stay unchanged and no writer/package manager is started.

## Files touched

- `src/codegen/plan-add.ts` — new module.
- `tests/integration/plan-add.test.ts` — new integration suite.

## Verification

- `pnpm run test:integration -- tests/integration/plan-add.test.ts` — exit 0,
  3/3 (transitive closure, repeated add, source conflict).
- `pnpm run test:integration -- tests/integration/plan-init.test.ts` — exit 0.
- `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck` — exit 0.
- `pnpm run check:contracts` — exit 0, 0 errors / 0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Cohort enforcement (S059), full synchronization (S060), truthful lock lineage
  (S061), configuration-driven retirement (S062) and the purity qualification
  (S063) remain.
