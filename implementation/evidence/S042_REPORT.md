# S042 step report — Validate filesystem ancestry and symlinks

Codex independently accepted this checkpoint at combined evidence anchor
`f46d60fbfb3457f4af66652d7f1bf99f7c725ff7` (see `S042_REVIEW.md` and `RCLD-03_QUALIFICATION.md`).
Original implementation `07ecd02dc892db63483c30add165eb265967ce96` remains provenance. This report is
Pi-authored evidence.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S042","kind":"report","commit":"f46d60fbfb3457f4af66652d7f1bf99f7c725ff7","disposition":"implemented"}
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

## RCLD-03 review-4 reconciliation

This report records the original checkpoint candidate named in its structured
evidence block. The composed planner was subsequently repaired under
independent review 4 (`implementation/COMMIT_SEQUENCE.md`, RCLD03-R4-1/2/3/4).
The authoritative reconciliation of actual scope, artifact identity,
intermediate failures, reruns and raw exits is
`implementation/evidence/RCLD03_R4_REPAIR.md` with the review-4 addendum in
`implementation/evidence/COMPATIBILITY.md`; the original acceptance criteria
are unchanged. This report is Pi implementation evidence, not acceptance.
