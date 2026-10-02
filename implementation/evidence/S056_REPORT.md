# S056 step report — Patch ordered stylesheet imports minimally

Codex independently accepted this checkpoint at combined evidence anchor
`f46d60fbfb3457f4af66652d7f1bf99f7c725ff7` (see `S056_REVIEW.md` and `RCLD-03_QUALIFICATION.md`).
Original implementation `b5c7f65682b380a85bcf63ef7f3999008c881093` remains provenance. This report is
Pi-authored evidence.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S056","kind":"report","commit":"f46d60fbfb3457f4af66652d7f1bf99f7c725ff7","disposition":"implemented"}
-->

Step ID and title: S056 — Patch ordered stylesheet imports minimally.

Contract/requirement IDs: R05, R17, R23, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/GENERATED_LAYOUT.md`,
`specs/STYLING.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/svelte.ts` inserts only the missing approved stylesheet imports
  into the instance script, in the required kit then themes then app order. A
  no-script layout receives a created instance script before the body.
- Existing imports, comments and rendering are preserved; the module script is
  never modified. Repeated patching produces identical bytes.
- Existing approved imports placed out of the required relative order produce a
  precise `LAYOUT_IMPORT_ORDER` conflict instead of reordering unrelated code.

## Files touched

- `src/codegen/svelte.ts` — new module.
- `tests/integration/layout-imports.test.ts` — new integration suite.
- `implementation/evidence/S055_REPORT.md` and `implementation/COMMIT_SEQUENCE.md`
  — S055 pending-review bookkeeping (recorded with this checkpoint).

## Verification

- `pnpm run test:integration -- tests/integration/layout-imports.test.ts`
  — exit 0, 6/6.
- `pnpm run typecheck` — exit 0, five configs.
- `pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Composed init/add/sync/cohort/lineage/purity planners remain S057–S063.

## RCLD-03 review-4 reconciliation

This report records the original checkpoint candidate named in its structured
evidence block. The composed planner was subsequently repaired under
independent review 4 (`implementation/COMMIT_SEQUENCE.md`, RCLD03-R4-1/2/3/4).
The authoritative reconciliation of actual scope, artifact identity,
intermediate failures, reruns and raw exits is
`implementation/evidence/RCLD03_R4_REPAIR.md` with the review-4 addendum in
`implementation/evidence/COMPATIBILITY.md`; the original acceptance criteria
are unchanged. This report is Pi implementation evidence, not acceptance.
