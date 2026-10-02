# S040 step report — Render dependency instructions without execution

Codex independently accepted this checkpoint at combined evidence anchor
`f46d60fbfb3457f4af66652d7f1bf99f7c725ff7` (see `S040_REVIEW.md` and `RCLD-03_QUALIFICATION.md`).
Original implementation `95833391745ed23512f2bbccf63b676030c4e222` remains provenance. This report is
Pi-authored evidence.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S040","kind":"report","commit":"f46d60fbfb3457f4af66652d7f1bf99f7c725ff7","disposition":"implemented"}
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

- `pnpm run test:integration -- tests/integration/dependency-instructions.test.ts`
  — exit 0, 7/7, including two snapshot purity controls.
- `pnpm run build` — exit 0.
- `pnpm run typecheck` — exit 0, five configs.
- `pnpm run check:contracts` — exit 0, 0 errors/0 warnings.
- `git diff --check` / `git diff --cached --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Filesystem snapshots/ancestry remain S041–S042.

## RCLD-03 review 1 repair addendum (2026-10-01)

Independent review 1 reproduced that `pnpm add svelte@>=5` was interpreted by a
shell as redirection (creating `=5`), `svelte@^5||^6` lost an argument, and
`pnpm@garbage`/`bun@1.2.0` selected a guessed manager. Repair commit 7331461
validates every operand and always POSIX single-quotes it so shell operators are
literal, rejects malformed names/options/control bytes, and validates
`packageManager` syntax/version and known managers while never falling back to a
stale lockfile or fabricating `npm` when unknown. The repaired direct suite
passes (dependency-instructions 12/12).

## RCLD-03 review-4 reconciliation

This report records the original checkpoint candidate named in its structured
evidence block. The composed planner was subsequently repaired under
independent review 4 (`implementation/COMMIT_SEQUENCE.md`, RCLD03-R4-1/2/3/4).
The authoritative reconciliation of actual scope, artifact identity,
intermediate failures, reruns and raw exits is
`implementation/evidence/RCLD03_R4_REPAIR.md` with the review-4 addendum in
`implementation/evidence/COMPATIBILITY.md`; the original acceptance criteria
are unchanged. This report is Pi implementation evidence, not acceptance.
