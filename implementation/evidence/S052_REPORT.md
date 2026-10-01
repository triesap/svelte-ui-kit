# S052 step report — Freeze and parse managed TypeScript export regions

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S052","kind":"report","commit":"f6e3987382128b918fce65b79211dd3d0c9ffec5","disposition":"candidate"}
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
