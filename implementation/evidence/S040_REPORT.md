# S040 step report — Render dependency instructions without execution

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-03 batch. This report is Pi-authored evidence; Codex
alone assigns acceptance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S040","kind":"report","commit":null,"disposition":"candidate"}
-->

Step ID and title: S040 — Render dependency instructions without execution.

Contract/requirement IDs: R09, R10, R15, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/API_CONTRACTS.md`,
`specs/SECURITY_AND_TRANSACTIONS.md`, `specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/project/dependency-instructions.ts` detects the package manager from a
  valid `packageManager` field, otherwise from exactly one recognized lockfile
  family (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`). Conflicting
  lockfiles return `DEPENDENCY_MANAGER_CONFLICTING`; no evidence returns an
  actionable manual instruction instead of a guessed command.
- `renderDependencyInstructions` renders a shell-safe `pnpm`/`npm`/`yarn`
  command for consumer runtime and peer specs separately. Specs are validated
  and single-quoted when they contain spaces; specs with unsafe quoting
  characters or control characters produce `DEPENDENCY_SPEC_UNSAFE`.
- Reporting is side-effect free: no package manager is executed and no
  manifest, lockfile or `node_modules` entry is written. CLI tooling
  requirements are never included in the consumer command.

## Files touched

- `src/project/dependency-instructions.ts` — new module.
- `tests/integration/dependency-instructions.test.ts` — new integration suite.
- `implementation/COMMIT_SEQUENCE.md` — S039 pending-review bookkeeping
  (recorded with this checkpoint).

## Verification

- `cargo extbuild run -- pnpm run test:integration -- tests/integration/dependency-instructions.test.ts`
  — exit 0, 7/7, including two snapshot purity controls.
- `cargo extbuild run -- pnpm run build` — exit 0.
- `cargo extbuild run -- pnpm run typecheck` — exit 0, five configs.
- `cargo extbuild run -- pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Filesystem snapshots/ancestry remain S041–S042.
