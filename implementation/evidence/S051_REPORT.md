# S051 step report — Retire CSS blocks without deleting custom rules

Codex independently accepted this checkpoint at combined evidence anchor
`f46d60fbfb3457f4af66652d7f1bf99f7c725ff7` (see `S051_REVIEW.md` and `RCLD-03_QUALIFICATION.md`).
Original implementation `a747fc58d317f5c7ec6bac80bd36e6f8a61f580c` remains provenance. This report is
Pi-authored evidence.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S051","kind":"report","commit":"f46d60fbfb3457f4af66652d7f1bf99f7c725ff7","disposition":"implemented"}
-->

Step ID and title: S051 — Retire CSS blocks without deleting custom rules.

Contract/requirement IDs: R13, R17, R18, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/GENERATED_LAYOUT.md`,
`specs/STYLING.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/css-retire.ts` removes only a clean obsolete owned block. A
  customized retired block retains its complete marked span byte-for-byte as
  application-owned text, and its lock ownership is detached.
- Unmanaged neighbours are copied byte-for-byte. Malformed or ambiguous input
  returns a typed failure and produces no output, so retirement is nonmutating.

## Files touched

- `src/codegen/css-retire.ts` — new module.
- `tests/integration/css-retirement.test.ts` — new integration suite.
- `implementation/evidence/S050_REPORT.md` and `implementation/COMMIT_SEQUENCE.md`
  — S050 pending-review bookkeeping (recorded with this checkpoint).

## Verification

- `pnpm run test:integration -- tests/integration/css-retirement.test.ts`
  — exit 0, 3/3.
- `pnpm run test:integration -- tests/integration/source-retirement.test.ts`
  — exit 0, 3/3.
- `pnpm run typecheck` — exit 0, five configs.
- `pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- TypeScript export regions remain S052–S054.

## RCLD-03 review-4 reconciliation

This report records the original checkpoint candidate named in its structured
evidence block. The composed planner was subsequently repaired under
independent review 4 (`implementation/COMMIT_SEQUENCE.md`, RCLD03-R4-1/2/3/4).
The authoritative reconciliation of actual scope, artifact identity,
intermediate failures, reruns and raw exits is
`implementation/evidence/RCLD03_R4_REPAIR.md` with the review-4 addendum in
`implementation/evidence/COMPATIBILITY.md`; the original acceptance criteria
are unchanged. This report is Pi implementation evidence, not acceptance.
