# S034 step report — Reject overlapping and reserved output roots

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone assigns acceptance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S034","kind":"report","commit":null,"disposition":"candidate"}
-->

Step ID and title: S034 — Reject overlapping and reserved output roots.

Contract/requirement IDs: R05, R16, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/GENERATED_LAYOUT.md`,
`specs/SECURITY_AND_TRANSACTIONS.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `tests/unit/path-overlap.test.ts` locks the normalized project-root
  relationship checks that `src/project/config.ts` already applies through
  `deriveKitPaths`, `isSameOrBelow` and `pathsOverlap`:
  UI/state/style/export mapping relationships are validated with explicit
  file/directory roles; a generated file may not equal or contain a required
  directory; the reserved `_kit` state directory may not be aliased by
  `stylesDir` or `layoutFile`; and two generated files must stay distinct.
- Collisions are ASCII case folded and segment aware, so `_kit`/`_KIT`,
  `src/UI`/`src/ui` and similar aliases fail deterministically on a
  case-sensitive development machine while prefix siblings such as `ui` and
  `ui-kit` remain valid.
- These checks run during strict `kit.json` parsing, before any planning, so no
  state is touched on failure.

## Files touched

- `tests/unit/path-overlap.test.ts` — new focused suite.
- `implementation/COMMIT_SEQUENCE.md` — ledger bookkeeping for S033 pending
  review and S034 (recorded with its own commit).

## Verification

- `cargo extbuild run -- pnpm run test:unit -- tests/unit/path-overlap.test.ts`
  — exit 0, 5/5.
- `cargo extbuild run -- pnpm run test:unit -- tests/unit/config.test.ts`
  — exit 0 (existing strict-config coverage preserved).
- `cargo extbuild run -- pnpm run test:unit` — exit 0, 218/218.
- `cargo extbuild run -- pnpm run format:check` — exit 0.
- `cargo extbuild run -- pnpm run lint` — exit 0, zero warnings.
- `cargo extbuild run -- pnpm run typecheck` — exit 0, five configs.
- `cargo extbuild run -- pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Real filesystem ancestry/symlink handling remains S041–S042; this checkpoint
  is lexical and role-based only.
