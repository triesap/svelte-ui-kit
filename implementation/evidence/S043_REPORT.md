# S043 step report — Freeze the complete ownership disposition matrix

Codex independently accepted this checkpoint at combined evidence anchor
`f46d60fbfb3457f4af66652d7f1bf99f7c725ff7` (see `S043_REVIEW.md` and `RCLD-03_QUALIFICATION.md`).
Original implementation `a2d9d5a26ee2964bfed69d6810e7351dfeb5579c` remains provenance. This report is
Pi-authored evidence.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S043","kind":"report","commit":"f46d60fbfb3457f4af66652d7f1bf99f7c725ff7","disposition":"implemented"}
-->

Step ID and title: S043 — Freeze the complete ownership disposition matrix.

Contract/requirement IDs: R13, R14, R18, R19, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/API_CONTRACTS.md`,
`specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `specs/SYNCHRONIZATION.md` gains the frozen, ordered disposition matrix
  (S043/Q08): tracked missing targets are visible conflicts, existing untracked
  targets never adopt or delete even when identical, and tracked classification
  evaluates L = I before L = B before I = B.
- `src/codegen/ownership-policy.ts` is the single pure decision table; it is the
  authority `src/codegen/compare.ts` (S044) will apply to actual bytes.
- `tests/fixtures/ownership-cases.json` records one expected disposition per
  equality/absence/ownership case; `tests/unit/ownership-policy.test.ts`
  validates the fixture against the policy and asserts that no case grants an
  overwrite of custom content.

## Files touched

- `specs/SYNCHRONIZATION.md` — frozen matrix.
- `src/codegen/ownership-policy.ts` — pure matrix function.
- `tests/fixtures/ownership-cases.json` — data-driven policy fixture.
- `tests/unit/ownership-policy.test.ts` — new unit suite.
- `implementation/evidence/S042_REPORT.md` and `implementation/COMMIT_SEQUENCE.md`
  — S042 pending-review bookkeeping (recorded with this checkpoint).

## Verification

- `pnpm run test:unit -- tests/unit/ownership-policy.test.ts`
  — exit 0, 6/6.
- `pnpm run build` — exit 0.
- `pnpm run typecheck` — exit 0, five configs.
- `pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Byte-level source classification remains S044; this checkpoint freezes the
  policy and fixtures only.

## RCLD-03 review-4 reconciliation

This report records the original checkpoint candidate named in its structured
evidence block. The composed planner was subsequently repaired under
independent review 4 (`implementation/COMMIT_SEQUENCE.md`, RCLD03-R4-1/2/3/4).
The authoritative reconciliation of actual scope, artifact identity,
intermediate failures, reruns and raw exits is
`implementation/evidence/RCLD03_R4_REPAIR.md` with the review-4 addendum in
`implementation/evidence/COMPATIBILITY.md`; the original acceptance criteria
are unchanged. This report is Pi implementation evidence, not acceptance.
