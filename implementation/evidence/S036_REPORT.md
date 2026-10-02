# S036 step report — Resolve explicit working directories in workspaces

Codex independently accepted this checkpoint at combined evidence anchor
`f46d60fbfb3457f4af66652d7f1bf99f7c725ff7` (see `S036_REVIEW.md` and `RCLD-03_QUALIFICATION.md`).
Original implementation `450a090dd448095838c81aeeb8e48d2393c77d18` remains provenance. This report is
Pi-authored evidence.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S036","kind":"report","commit":"f46d60fbfb3457f4af66652d7f1bf99f7c725ff7","disposition":"implemented"}
-->

Step ID and title: S036 — Resolve explicit working directories in workspaces.

Contract/requirement IDs: R09, R16, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/API_CONTRACTS.md`,
`specs/SECURITY_AND_TRANSACTIONS.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/project/root.ts` resolves exactly one application package root from
  `--cwd` or from the invocation directory. An explicit `--cwd` selects the
  named package directly; a workspace root is accepted only when it expands to
  exactly one application member, otherwise `PROJECT_AMBIGUOUS_WORKSPACE`
  requests an exact package.
- Without `--cwd`, the nearest enclosing `package.json` walking strictly upward
  from the invocation directory is selected. Upward discovery never inspects or
  selects a workspace sibling.
- Workspace membership is derived read-only from `package.json` `workspaces` or
  a simple `pnpm-workspace.yaml` `packages:` list, expanding literal paths and a
  single trailing `/*` only. No config/script execution occurs.
- Missing `--cwd` directories and non-package directories return
  `PROJECT_CWD_NOT_FOUND` / `PROJECT_PACKAGE_NOT_FOUND`; every outcome is
  read-only. Canonical root identity/symlink policy stays with S041–S042.

## Files touched

- `src/project/root.ts` — new module.
- `tests/integration/project-root.test.ts` — new integration suite.
- `implementation/COMMIT_SEQUENCE.md` — S035 pending-review bookkeeping
  (recorded with this checkpoint).

## Verification

- `pnpm run test:integration -- tests/integration/project-root.test.ts`
  — exit 0, 6/6, including a complete-tree snapshot equality control.
- `pnpm run test:unit -- tests/unit/args.test.ts` —
  existing `--cwd` grammar coverage preserved.
- `pnpm run build` — exit 0.
- `pnpm run typecheck` — exit 0, five configs.
- `pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Explicit custom mappings and `_kit/kit.json` discovery remain S037.

## RCLD-03 review 1 repair addendum (2026-10-01)

Independent review 1 reproduced that `../outside` members resolved, `!` patterns
became positive members and unsupported globs were ignored before a false single
target was claimed. Repair commit 69ce8ed infers only contained, non-symlink,
proven SvelteKit application members, applies `!` exclusions, diagnoses escaping
paths and deeper globs with an explicit `--cwd` instruction, and recognizes an
ambiguous workspace root in default discovery. The repaired direct suite passes
(project-root 12/12).

## RCLD-03 review-4 reconciliation

This report records the original checkpoint candidate named in its structured
evidence block. The composed planner was subsequently repaired under
independent review 4 (`implementation/COMMIT_SEQUENCE.md`, RCLD03-R4-1/2/3/4).
The authoritative reconciliation of actual scope, artifact identity,
intermediate failures, reruns and raw exits is
`implementation/evidence/RCLD03_R4_REPAIR.md` with the review-4 addendum in
`implementation/evidence/COMPATIBILITY.md`; the original acceptance criteria
are unchanged. This report is Pi implementation evidence, not acceptance.
