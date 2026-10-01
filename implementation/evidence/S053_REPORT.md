# S053 step report — Generate the root UI export region

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S053","kind":"report","commit":"3c961b73fbddf0da44b77278f526aa0736c5c2cc","disposition":"candidate"}
-->

Step ID and title: S053 — Generate the root UI export region.

Contract/requirement IDs: R02, R06, R17, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/ARCHITECTURE.md`,
`specs/GENERATED_LAYOUT.md`, `specs/STYLING.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/exports.ts` renders deterministic `export`/`export type` lines
  from manifest declarations with direct relative targets only.
- Patching touches only the managed export region; a marker-free barrel receives
  a minimal appended region and all application bytes are preserved. Patching is
  idempotent.
- A generated name colliding with an application-owned declaration fails with
  `EXPORT_SYMBOL_COLLISION` before any change.

## Files touched

- `src/codegen/exports.ts` — new module.
- `tests/integration/root-exports.test.ts` — new integration suite.
- `implementation/evidence/S052_REPORT.md` and `implementation/COMMIT_SEQUENCE.md`
  — S052 pending-review bookkeeping (recorded with this checkpoint).

## Verification

- `cargo extbuild run -- pnpm run test:integration -- tests/integration/root-exports.test.ts`
  — exit 0, 5/5.
- `cargo extbuild run -- pnpm run test:unit -- tests/unit/export-regions.test.ts`
  — exit 0, 7/7.
- `cargo extbuild run -- pnpm run typecheck` — exit 0, five configs.
- `cargo extbuild run -- pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Compound barrels and sibling-import validation remain S054.
