# S050 step report — Compose stable stylesheet patches

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S050","kind":"report","commit":null,"disposition":"candidate"}
-->

Step ID and title: S050 — Compose stable stylesheet patches.

Contract/requirement IDs: R07, R15, R17, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/GENERATED_LAYOUT.md`,
`specs/SECURITY_AND_TRANSACTIONS.md`, `specs/STYLING.md`,
`specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/css.ts` updates existing managed block bodies in place and
  appends missing blocks in canonical order with the `tokens` foundation block
  before dependents. Leading, interleaved and trailing application CSS is copied
  byte-for-byte; no formatter pass runs.
- Composition is byte-idempotent and independent of desired-input permutation.
  A malformed existing stylesheet fails without producing output.

## Files touched

- `src/codegen/css.ts` — new module.
- `tests/integration/css-patch.test.ts` — new integration suite.
- `implementation/evidence/S049_REPORT.md` and `implementation/COMMIT_SEQUENCE.md`
  — S049 pending-review bookkeeping (recorded with this checkpoint).

## Verification

- `cargo extbuild run -- pnpm run test:integration -- tests/integration/css-patch.test.ts`
  — exit 0, 5/5.
- `cargo extbuild run -- pnpm run test:unit -- tests/unit/css-compare.test.ts`
  — exit 0, 3/3.
- `cargo extbuild run -- pnpm run typecheck` — exit 0, five configs.
- `cargo extbuild run -- pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- CSS block retirement remains S051.
