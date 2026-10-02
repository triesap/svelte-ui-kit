# S041 step report — Capture read-only project snapshots

Codex independently accepted this checkpoint at combined evidence anchor
`f46d60fbfb3457f4af66652d7f1bf99f7c725ff7` (see `S041_REVIEW.md` and `RCLD-03_QUALIFICATION.md`).
Original implementation `ba7eb15e79c96faf8c7478e7e7ee4c7a53e770be` remains provenance. This report is
Pi-authored evidence.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S041","kind":"report","commit":"f46d60fbfb3457f4af66652d7f1bf99f7c725ff7","disposition":"implemented"}
-->

Step ID and title: S041 — Capture read-only project snapshots.

Contract/requirement IDs: R13, R15, R16, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/SECURITY_AND_TRANSACTIONS.md`,
`specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/snapshot.ts` captures exact bytes, kind, mode, size and link
  target for the logical targets a plan depends on. Absence (`kind: "absent"`)
  is distinct from empty content (`kind: "file"`, zero-length bytes).
- Captured bytes are a private defensive copy exposed through a copying getter
  on a frozen observation, so a later filesystem change or caller mutation
  cannot alter an already captured snapshot.
- Capturing performs no write: it opens no writer, creates no temporary file and
  never creates a missing directory. Non-ENOENT metadata failures and read
  failures become typed `unreadable` observations with a stable code.

## Files touched

- `src/codegen/snapshot.ts` — new module.
- `tests/integration/snapshot.test.ts` — new integration suite.

## Verification

- `pnpm run test:integration -- tests/integration/snapshot.test.ts`
  — exit 0, 4/4, including a complete-tree snapshot purity control.
- `pnpm run build` — exit 0.
- `pnpm run typecheck` — exit 0, five configs.
- `pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Filesystem ancestry/symlink validation is S042.

## RCLD-03 review-4 reconciliation

This report records the original checkpoint candidate named in its structured
evidence block. The composed planner was subsequently repaired under
independent review 4 (`implementation/COMMIT_SEQUENCE.md`, RCLD03-R4-1/2/3/4).
The authoritative reconciliation of actual scope, artifact identity,
intermediate failures, reruns and raw exits is
`implementation/evidence/RCLD03_R4_REPAIR.md` with the review-4 addendum in
`implementation/evidence/COMPATIBILITY.md`; the original acceptance criteria
are unchanged. This report is Pi implementation evidence, not acceptance.
