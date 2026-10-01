# S051 step report — Retire CSS blocks without deleting custom rules

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S051","kind":"report","commit":"a747fc58d317f5c7ec6bac80bd36e6f8a61f580c","disposition":"candidate"}
-->

Step ID and title: S051 — Retire CSS blocks without deleting custom rules.

Contract/requirement IDs: R13, R17, R18, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/GENERATED_LAYOUT.md`,
`specs/STYLING.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/css-retire.ts` removes only a clean obsolete owned block. A
  customized retired block retains its complete marked span byte-for-byte as
  application-owned text, and its lock ownership is detached.
- Unmanaged neighbours are copied byte-for-byte. Malformed or ambiguous input
  returns a typed failure and produces no output, so retirement is nonmutating.

## Files touched

- `src/codegen/css-retire.ts` — new module.
- `tests/integration/css-retirement.test.ts` — new integration suite.
- `implementation/evidence/S050_REPORT.md` and `implementation/COMMIT_SEQUENCE.md`
  — S050 pending-review bookkeeping (recorded with this checkpoint).

## Verification

- `pnpm run test:integration -- tests/integration/css-retirement.test.ts`
  — exit 0, 3/3.
- `pnpm run test:integration -- tests/integration/source-retirement.test.ts`
  — exit 0, 3/3.
- `pnpm run typecheck` — exit 0, five configs.
- `pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- TypeScript export regions remain S052–S054.
