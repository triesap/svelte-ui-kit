# S036 step report — Resolve explicit working directories in workspaces

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone assigns acceptance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S036","kind":"report","commit":"450a090dd448095838c81aeeb8e48d2393c77d18","disposition":"candidate"}
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

- `cargo extbuild run -- pnpm run test:integration -- tests/integration/project-root.test.ts`
  — exit 0, 6/6, including a complete-tree snapshot equality control.
- `cargo extbuild run -- pnpm run test:unit -- tests/unit/args.test.ts` —
  existing `--cwd` grammar coverage preserved.
- `cargo extbuild run -- pnpm run build` — exit 0.
- `cargo extbuild run -- pnpm run typecheck` — exit 0, five configs.
- `cargo extbuild run -- pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Explicit custom mappings and `_kit/kit.json` discovery remain S037.
