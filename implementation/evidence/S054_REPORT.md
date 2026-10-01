# S054 step report — Generate compound barrels and validate sibling imports

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S054","kind":"report","commit":"a0b5f7f5b9306cf38bc1ac3926b545dcb9800071","disposition":"candidate"}
-->

Step ID and title: S054 — Generate compound barrels and validate sibling imports.

Contract/requirement IDs: R02, R06, R17, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/ARCHITECTURE.md`,
`specs/GENERATED_LAYOUT.md`, `specs/STYLING.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/exports.ts` gains `shouldGenerateCompoundBarrel`,
  `renderCompoundBarrel` and `findRootBarrelImports`. A compound barrel
  re-exports its declared parts with direct sibling targets only, and an import
  through the root UI barrel is reported so it can fail before writing.
- A simple (single-part) or empty item produces no parent `index.ts`; only a
  multi-part item generates a compound barrel.

## Files touched

- `src/codegen/exports.ts` — compound barrel helpers.
- `tests/integration/compound-exports.test.ts` — new integration suite.
- `implementation/evidence/S053_REPORT.md` and `implementation/COMMIT_SEQUENCE.md`
  — S053 pending-review bookkeeping (recorded with this checkpoint).

## Verification

- `cargo extbuild run -- pnpm run test:integration -- tests/integration/compound-exports.test.ts`
  — exit 0, 4/4.
- `cargo extbuild run -- pnpm run test:integration -- tests/integration/root-exports.test.ts`
  — exit 0, 5/5.
- `cargo extbuild run -- pnpm run typecheck` — exit 0, five configs.
- `cargo extbuild run -- pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Svelte layout parsing/patching remains S055–S056.
