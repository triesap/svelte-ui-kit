# S049 step report — Apply three-way classification to CSS blocks

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S049","kind":"report","commit":"00d2424e6e8ad8a092f4c8dd5dcf471e8dbb8ffb","disposition":"candidate"}
-->

Step ID and title: S049 — Apply three-way classification to CSS blocks.

Contract/requirement IDs: R07, R13, R19, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/API_CONTRACTS.md`,
`specs/STYLING.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/css-compare.ts` classifies each managed CSS block independently
  with the frozen ownership matrix. Editing one block never marks an unrelated
  block modified, and the stylesheet is never hashed as one owned asset.
- `customized`, `conflict`, `no_change`, `update`, `create` and
  `untracked_conflict` are reported distinctly; missing owned blocks and
  existing untracked blocks follow the frozen rules.
- Results are ordered deterministically by block id.

## Files touched

- `src/codegen/css-compare.ts` — new module.
- `tests/unit/css-compare.test.ts` — new unit suite.
- `implementation/evidence/S048_REPORT.md` and `implementation/COMMIT_SEQUENCE.md`
  — S048 pending-review bookkeeping (recorded with this checkpoint).

## Verification

- `cargo extbuild run -- pnpm run test:unit -- tests/unit/css-compare.test.ts`
  — exit 0, 3/3.
- `cargo extbuild run -- pnpm run test:unit -- tests/unit/css-markers.test.ts`
  — exit 0, 9/9.
- `cargo extbuild run -- pnpm run typecheck` — exit 0, five configs.
- `cargo extbuild run -- pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Stylesheet composition and CSS/CSS retirement remain S050–S051.
