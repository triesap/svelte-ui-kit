# S043 step report — Freeze the complete ownership disposition matrix

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S043","kind":"report","commit":null,"disposition":"candidate"}
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

- `cargo extbuild run -- pnpm run test:unit -- tests/unit/ownership-policy.test.ts`
  — exit 0, 6/6.
- `cargo extbuild run -- pnpm run build` — exit 0.
- `cargo extbuild run -- pnpm run typecheck` — exit 0, five configs.
- `cargo extbuild run -- pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Byte-level source classification remains S044; this checkpoint freezes the
  policy and fixtures only.
