# S045 step report — Plan missing and untracked source targets

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S045","kind":"report","commit":null,"disposition":"candidate"}
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

- `cargo extbuild run -- pnpm run test:integration -- tests/integration/source-targets.test.ts`
  — exit 0, 3/3, including a complete-tree snapshot purity control.
- `cargo extbuild run -- pnpm run test:unit -- tests/unit/source-compare.test.ts`
  — exit 0, 4/4.
- `cargo extbuild run -- pnpm run build` — exit 0.
- `cargo extbuild run -- pnpm run typecheck` — exit 0, five configs.
- `cargo extbuild run -- pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Retirement classification remains S046; batch assembly remains S047.
