# S038 step report — Inspect installed and declared dependency state

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone assigns acceptance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S038","kind":"report","commit":null,"disposition":"candidate"}
-->

Step ID and title: S038 — Inspect installed and declared dependency state.

Contract/requirement IDs: R10, R12, R19, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/API_CONTRACTS.md`,
`specs/DATA_MODEL.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/project/dependencies.ts` reads the selected package's declared ranges
  from `dependencies`/`devDependencies`/`peerDependencies` and the installed
  version from the package resolution context (`node_modules/<name>/package.json`)
  separately, then reports per requirement: `ready`, `missing_install`,
  `missing_declaration` (undeclared and uninstalled) or `incompatible`.
- A hoisted/pnpm-linked installed package is read as dependency evidence even
  when undeclared; it never authorizes generated target traversal or writes.
- Installed versions are compared with strict npm SemVer (`satisfies`,
  prereleases admitted). An invalid required range returns
  `DEPENDENCY_RANGE_INVALID`; a malformed installed manifest counts as absent.
- Inspection is read-only: it never executes a package manager, edits a
  manifest/lockfile or depends on hidden source-checkout state.

## Files touched

- `src/project/dependencies.ts` — new module.
- `tests/integration/dependency-state.test.ts` — new integration suite.
- `implementation/COMMIT_SEQUENCE.md` — S037 pending-review bookkeeping
  (recorded with this checkpoint).

## Verification

- `cargo extbuild run -- pnpm run test:integration -- tests/integration/dependency-state.test.ts`
  — exit 0, 6/6, including a snapshot purity control.
- `cargo extbuild run -- pnpm run build` — exit 0.
- `cargo extbuild run -- pnpm run typecheck` — exit 0, five configs.
- `cargo extbuild run -- pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Peer-specific reconciliation (S039) and manager instruction rendering (S040)
  remain open.
