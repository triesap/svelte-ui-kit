# S052 step report — Freeze and parse managed TypeScript export regions

Codex independently accepted this checkpoint at combined evidence anchor
`f46d60fbfb3457f4af66652d7f1bf99f7c725ff7` (see `S052_REVIEW.md` and `RCLD-03_QUALIFICATION.md`).
Original implementation `f6e3987382128b918fce65b79211dd3d0c9ffec5` remains provenance. This report is
Pi-authored evidence.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S052","kind":"report","commit":"f46d60fbfb3457f4af66652d7f1bf99f7c725ff7","disposition":"implemented"}
-->

Step ID and title: S052 — Freeze and parse managed TypeScript export regions.

Contract/requirement IDs: R06, R16, R17, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/GENERATED_LAYOUT.md`,
`specs/SECURITY_AND_TRANSACTIONS.md`, `specs/STYLING.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. The pinned `typescript`
6.0.3 runtime promotion already recorded for static parsing is used here too; no
new dependency.

## Scope implemented

- `src/codegen/export-parse.ts` freezes the TS export marker syntax
  (`// svelte-ui-kit:start exports` / `// svelte-ui-kit:end exports`), recognized
  only as standalone column-zero comment lines. Marker-like strings and
  template literals are ignored.
- Duplicate, misordered or ambiguous marker structure fails with typed
  `EXPORT_REGION_*` diagnostics.
- The pinned TypeScript parser collects application export declarations
  (aliases, type exports, interfaces, values, wildcard re-exports), and
  `findExportCollisions` reports generated names that collide with app-owned
  declarations.

## Files touched

- `src/codegen/export-parse.ts` — new module.
- `tests/unit/export-regions.test.ts` — new unit suite.
- `implementation/evidence/S051_REPORT.md` and `implementation/COMMIT_SEQUENCE.md`
  — S051 pending-review bookkeeping (recorded with this checkpoint).

## Verification

- `pnpm run test:unit -- tests/unit/export-regions.test.ts`
  — exit 0, 7/7.
- `pnpm run typecheck` — exit 0, five configs.
- `pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Root/compound barrel generation remains S053–S054.

## RCLD-03 review-4 reconciliation

This report records the original checkpoint candidate named in its structured
evidence block. The composed planner was subsequently repaired under
independent review 4 (`implementation/COMMIT_SEQUENCE.md`, RCLD03-R4-1/2/3/4).
The authoritative reconciliation of actual scope, artifact identity,
intermediate failures, reruns and raw exits is
`implementation/evidence/RCLD03_R4_REPAIR.md` with the review-4 addendum in
`implementation/evidence/COMPATIBILITY.md`; the original acceptance criteria
are unchanged. This report is Pi implementation evidence, not acceptance.
