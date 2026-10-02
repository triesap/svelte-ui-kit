# S048 step report — Parse managed CSS markers without whole-file ownership

Codex independently accepted this checkpoint at combined evidence anchor
`f46d60fbfb3457f4af66652d7f1bf99f7c725ff7` (see `S048_REVIEW.md` and `RCLD-03_QUALIFICATION.md`).
Original implementation `3d97bbf191d2c00bfff1a13952b6249ab1a1b3d4` remains provenance. This report is
Pi-authored evidence.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S048","kind":"report","commit":"f46d60fbfb3457f4af66652d7f1bf99f7c725ff7","disposition":"implemented"}
-->

Step ID and title: S048 — Parse managed CSS markers without whole-file ownership.

Contract/requirement IDs: R07, R13, R17, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/GENERATED_LAYOUT.md`,
`specs/STYLING.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/css-parse.ts` scans a stylesheet statefully, skipping CSS strings
  and non-reserved comments, and recognizes exact reserved start/end markers.
  A marker-like sequence inside a string or unrelated comment never creates or
  closes a block.
- Duplicate, unmatched, nested and malformed reserved markers fail with typed
  `CSS_MARKER_*` diagnostics. Unterminated comments fail rather than being
  treated as text.
- Each block keeps its exact byte offsets and the parser returns the unmanaged
  regions, so CRLF and every unrelated byte are retained for a later patch.

## Files touched

- `src/codegen/css-parse.ts` — new module.
- `tests/unit/css-markers.test.ts` — new unit suite.
- `implementation/evidence/S047_REPORT.md` and `implementation/COMMIT_SEQUENCE.md`
  — S047 pending-review bookkeeping (recorded with this checkpoint).

## Verification

- `pnpm run test:unit -- tests/unit/css-markers.test.ts`
  — exit 0, 9/9.
- `pnpm run typecheck` — exit 0, five configs.
- `pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Block-level comparison and stylesheet composition remain S049–S051.

## RCLD-03 review-4 reconciliation

This report records the original checkpoint candidate named in its structured
evidence block. The composed planner was subsequently repaired under
independent review 4 (`implementation/COMMIT_SEQUENCE.md`, RCLD03-R4-1/2/3/4).
The authoritative reconciliation of actual scope, artifact identity,
intermediate failures, reruns and raw exits is
`implementation/evidence/RCLD03_R4_REPAIR.md` with the review-4 addendum in
`implementation/evidence/COMPATIBILITY.md`; the original acceptance criteria
are unchanged. This report is Pi implementation evidence, not acceptance.
