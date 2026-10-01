# S033 step report — Validate lexical logical paths

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone assigns acceptance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S033","kind":"report","commit":null,"disposition":"candidate"}
-->

Step ID and title: S033 — Validate lexical logical paths.

Contract/requirement IDs: R05, R16, R30, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/API_CONTRACTS.md`,
`specs/GENERATED_LAYOUT.md`, `specs/SECURITY_AND_TRANSACTIONS.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/project/paths.ts` validates a logical path segment by segment before any
  filesystem resolution. A segment must be non-empty, must not be `.`/`..`,
  must be free of control characters and `:`, must not end in a dot or space,
  and must not be a Windows-reserved device name (`CON`, `PRN`, `AUX`, `NUL`,
  `COM1`–`COM9`, `LPT1`–`LPT9`, with or without an extension) compared ASCII
  case-insensitively.
- Absolute, drive and UNC-style forms, separator confusion and traversal
  segments are rejected. Safe nested UI/style/state paths and prefix siblings
  remain valid; ASCII folding (not locale collation) detects case aliases.
- `unsafeLogicalSegment` returns a JSON-quoted description of the first
  non-portable segment so a diagnostic never echoes unsafe input as an
  unsanitized locator. `parseKitConfig` continues to pass the field name as the
  locator and a JSON-quoted value in the message.

## Files touched

- `src/project/paths.ts` — `isPortableLogicalSegment`, `unsafeLogicalSegment`,
  extended `isSafeLogicalRelativePath`.
- `tests/unit/logical-paths.test.ts` — new focused suite.
- `implementation/COMMIT_SEQUENCE.md` — RCLD-03 authorization and ledger
  bookkeeping (recorded with the successor checkpoint).

## Verification

- `cargo extbuild run -- pnpm run test:unit -- tests/unit/logical-paths.test.ts`
  — exit 0, 10/10.
- `cargo extbuild run -- pnpm run test:unit` — exit 0, 213/213 across the suite
  (config and lock suites included, proving the predicate change is
  non-regressive).
- `cargo extbuild run -- pnpm run format:check` — exit 0.
- `cargo extbuild run -- pnpm run lint` — exit 0, zero warnings.
- `cargo extbuild run -- pnpm run typecheck` — exit 0, five configs.
- `cargo extbuild run -- pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- This checkpoint is lexical only. Real filesystem ancestry, symlink and
  nonregular-target handling remain S041–S042.
