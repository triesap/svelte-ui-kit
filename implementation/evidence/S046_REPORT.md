# S046 step report — Plan source retirement with retained customization

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone accepts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S046","kind":"report","commit":"70d7d49e841cf4395e6576220cc373271ad40c33","disposition":"candidate"}
-->

Step ID and title: S046 — Plan source retirement with retained customization.

Contract/requirement IDs: R11, R13, R18, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/DATA_MODEL.md`,
`specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/retire.ts` plans retirement only for lock files whose owner left
  the recalculated closure. A file whose owner remains (including a shared
  transitive dependency) is untouched.
- A clean retired target is `delete`; a customized, absent or nonregular retired
  target is `retain` with ownership detached truthfully. Because ownership is
  detached, a later add sees the retained file as untracked and conflicts rather
  than silently reacquiring it.
- Planning is pure and writes nothing.

## Files touched

- `src/codegen/retire.ts` — new module.
- `tests/integration/source-retirement.test.ts` — new integration suite.
- `implementation/evidence/S045_REPORT.md` and `implementation/COMMIT_SEQUENCE.md`
  — S045 pending-review bookkeeping (recorded with this checkpoint).

## Verification

- `cargo extbuild run -- pnpm run test:integration -- tests/integration/source-retirement.test.ts`
  — exit 0, 3/3, including a complete-tree snapshot purity control.
- `cargo extbuild run -- pnpm run test:unit -- tests/unit/request-projection.test.ts`
  — exit 0 (closure projection preserved).
- `cargo extbuild run -- pnpm run build` — exit 0.
- `cargo extbuild run -- pnpm run typecheck` — exit 0, five configs.
- `cargo extbuild run -- pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Batch assembly and CSS/export retirements remain S047/S051/S062.
