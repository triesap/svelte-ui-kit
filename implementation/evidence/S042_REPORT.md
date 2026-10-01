# S042 step report — Validate filesystem ancestry and symlinks

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S042","kind":"report","commit":"07ecd02dc892db63483c30add165eb265967ce96","disposition":"candidate"}
-->

Step ID and title: S042 — Validate filesystem ancestry and symlinks.

Contract/requirement IDs: R16, R24, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/SECURITY_AND_TRANSACTIONS.md`,
`specs/STYLING.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/project/filesystem-paths.ts` canonicalizes the explicitly selected root
  once with `realpath`, records its device/inode identity and rechecks that
  identity before a later mutation.
- `observeTargetAncestry` walks each logical target segment by segment with
  non-following `lstat`: a symlink below the root, a broken link, a
  non-directory intermediate component and a file/directory kind conflict are
  typed failures. A genuinely absent suffix is reported as absent with its
  missing logical ancestors.
- The walk never opens a target, so a FIFO or other special entry is classified
  and rejected without blocking. No directory is created and nothing is written.

## Files touched

- `src/project/filesystem-paths.ts` — new module.
- `tests/integration/filesystem-paths.test.ts` — new integration suite.
- `implementation/evidence/S041_REPORT.md` and `implementation/COMMIT_SEQUENCE.md`
  — S041 pending-review bookkeeping (recorded with this checkpoint).

## Verification

- `pnpm run test:integration -- tests/integration/filesystem-paths.test.ts`
  — exit 0, 6/6, including a FIFO control and a complete-tree snapshot purity
  control.
- `pnpm run test:unit -- tests/unit/logical-paths.test.ts`
  — exit 0, lexical coverage preserved.
- `pnpm run build` — exit 0.
- `pnpm run typecheck` — exit 0, five configs.
- `pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- The trusted-local race limit is unchanged: ancestry is observed, then later
  revalidated under coordination by the (not-yet-implemented) transaction.
