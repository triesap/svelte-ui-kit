# S045 step report — Plan missing and untracked source targets

Codex independently accepted this checkpoint at combined evidence anchor
`f46d60fbfb3457f4af66652d7f1bf99f7c725ff7` (see `S045_REVIEW.md` and `RCLD-03_QUALIFICATION.md`).
Original implementation `4f97891a255a4fe64360b199d0b6987ccc895dad` remains provenance. This report is
Pi-authored evidence.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S045","kind":"report","commit":"f46d60fbfb3457f4af66652d7f1bf99f7c725ff7","disposition":"implemented"}
-->

Step ID and title: S045 — Plan missing and untracked source targets.

Contract/requirement IDs: R13, R15, R18, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/SECURITY_AND_TRANSACTIONS.md`,
`specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/source-targets.ts` combines an S041 snapshot, the lock's recorded
  ownership and incoming registry bytes into one disposition per source target.
- A missing tracked target is a visible `conflict` with an explicit "no silent
  restoration" reason. Existing untracked targets are `untracked_conflict` even
  when byte-identical to incoming, so they retain no adoption or deletion
  rights. A new absent untracked target is a planned `create`.
- `classifyOwnershipHashes` applies the S043 matrix to recorded base hashes
  (the lock stores hashes, not base content). Planning is pure and writes
  nothing.

## Files touched

- `src/codegen/compare.ts` — hash-based matrix variant.
- `src/codegen/source-targets.ts` — new module.
- `tests/integration/source-targets.test.ts` — new integration suite.
- `implementation/evidence/S044_REPORT.md` and `implementation/COMMIT_SEQUENCE.md`
  — S044 pending-review bookkeeping (recorded with this checkpoint).

## Verification

- `pnpm run test:integration -- tests/integration/source-targets.test.ts`
  — exit 0, 3/3, including a complete-tree snapshot purity control.
- `pnpm run test:unit -- tests/unit/source-compare.test.ts`
  — exit 0, 4/4.
- `pnpm run build` — exit 0.
- `pnpm run typecheck` — exit 0, five configs.
- `pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Retirement classification remains S046; batch assembly remains S047.

## RCLD-03 review-4 reconciliation

This report records the original checkpoint candidate named in its structured
evidence block. The composed planner was subsequently repaired under
independent review 4 (`implementation/COMMIT_SEQUENCE.md`, RCLD03-R4-1/2/3/4).
The authoritative reconciliation of actual scope, artifact identity,
intermediate failures, reruns and raw exits is
`implementation/evidence/RCLD03_R4_REPAIR.md` with the review-4 addendum in
`implementation/evidence/COMPATIBILITY.md`; the original acceptance criteria
are unchanged. This report is Pi implementation evidence, not acceptance.
