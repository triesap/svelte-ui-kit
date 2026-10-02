# S034 step report — Reject overlapping and reserved output roots

Codex independently accepted this checkpoint at combined evidence anchor
`f46d60fbfb3457f4af66652d7f1bf99f7c725ff7` (see `S034_REVIEW.md` and `RCLD-03_QUALIFICATION.md`).
Original implementation `98336763f3970c9a77af9a772af816431813ff04` remains provenance. This report is
Pi-authored evidence.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S034","kind":"report","commit":"f46d60fbfb3457f4af66652d7f1bf99f7c725ff7","disposition":"implemented"}
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

- `pnpm run test:unit -- tests/unit/path-overlap.test.ts`
  — exit 0, 5/5.
- `pnpm run test:unit -- tests/unit/config.test.ts`
  — exit 0 (existing strict-config coverage preserved).
- `pnpm run test:unit` — exit 0, 218/218.
- `pnpm run format:check` — exit 0.
- `pnpm run lint` — exit 0, zero warnings.
- `pnpm run typecheck` — exit 0, five configs.
- `pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Real filesystem ancestry/symlink handling remains S041–S042; this checkpoint
  is lexical and role-based only.

## RCLD-03 review 1 repair addendum (2026-10-01)

Independent review 1 preserved S034's valid mapping and collision controls and
requested no behavioral change. Its earlier intermediate formatting failure
remains recorded as a failed attempt; the repaired tree keeps S034 formatting
green.

## RCLD-03 review-4 reconciliation

This report records the original checkpoint candidate named in its structured
evidence block. The composed planner was subsequently repaired under
independent review 4 (`implementation/COMMIT_SEQUENCE.md`, RCLD03-R4-1/2/3/4).
The authoritative reconciliation of actual scope, artifact identity,
intermediate failures, reruns and raw exits is
`implementation/evidence/RCLD03_R4_REPAIR.md` with the review-4 addendum in
`implementation/evidence/COMPATIBILITY.md`; the original acceptance criteria
are unchanged. This report is Pi implementation evidence, not acceptance.
