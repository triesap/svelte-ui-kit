# S068 step report — Stage replacement bytes with owned temporary files

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-04 batch. This report is Pi-authored evidence; Codex
alone assigns acceptance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S068","kind":"report","commit":"fd9697c0046b2a135b5afdca0485bb8dde43d8ed","disposition":"candidate"}
-->

Step ID and title: S068 — Stage replacement bytes with owned temporary files.

Contract/requirement IDs: R16, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see
`specs/SECURITY_AND_TRANSACTIONS.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/stage.ts` writes exact planned bytes into the transaction's owned
  `staged/` directory on the same filesystem, applies the intended mode exactly,
  re-reads and digest-verifies each staged file, and returns explicit staging
  failures without touching any live target.
- Retire operations carry no staged bytes. `verifyStaged` re-proves an exact
  staged image for later replacement/recovery. `cleanupStaged` removes only the
  owned staged directory.
- `tests/integration/staging.test.ts` covers matching digests, injected
  stage-write failure with an unchanged live target, bounded cleanup preserving
  unrelated temporaries, and no live-parent-directory creation.

## Files touched

- `src/codegen/stage.ts` — new staging module.
- `tests/integration/staging.test.ts` — new focused suite.
- `implementation/COMMIT_SEQUENCE.md` — finalizes the S067 pending ledger row
  and records this checkpoint's implementation hash with the successor.

## Verification

- `pnpm run test:integration -- tests/integration/staging.test.ts` — exit 0,
  4/4.
- `pnpm run format:check` — exit 0.
- `pnpm run lint` — exit 0, zero warnings.
- `pnpm run typecheck` — exit 0, five configs.
- `git diff --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Staging is prepared; durable prepared-state persistence and live replacement
  remain S069–S070.
- No live application target is written by this checkpoint.
