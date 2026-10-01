# S048 step report — Parse managed CSS markers without whole-file ownership

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S048","kind":"report","commit":null,"disposition":"candidate"}
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

- `cargo extbuild run -- pnpm run test:unit -- tests/unit/css-markers.test.ts`
  — exit 0, 9/9.
- `cargo extbuild run -- pnpm run typecheck` — exit 0, five configs.
- `cargo extbuild run -- pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Block-level comparison and stylesheet composition remain S049–S051.
