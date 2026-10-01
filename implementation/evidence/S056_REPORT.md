# S056 step report — Patch ordered stylesheet imports minimally

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S056","kind":"report","commit":"b5c7f65682b380a85bcf63ef7f3999008c881093","disposition":"candidate"}
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

- `cargo extbuild run -- pnpm run test:integration -- tests/integration/layout-imports.test.ts`
  — exit 0, 6/6.
- `cargo extbuild run -- pnpm run typecheck` — exit 0, five configs.
- `cargo extbuild run -- pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Composed init/add/sync/cohort/lineage/purity planners remain S057–S063.
