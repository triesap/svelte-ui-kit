# S067 step report — Revalidate planned preimages under coordination

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-04 batch. This report is Pi-authored evidence; Codex
alone assigns acceptance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S067","kind":"report","commit":null,"disposition":"candidate"}
-->

Step ID and title: S067 — Revalidate planned preimages under coordination.

Contract/requirement IDs: R13, R16, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/SECURITY_AND_TRANSACTIONS.md`,
`specs/SYNCHRONIZATION.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `src/codegen/revalidate.ts` re-observes every planned target (non-following
  kind, exact-byte digest, mode) and its ancestor chain after coordination is
  acquired. A changed source/config/CSS/layout preimage, an absent target that
  appeared, or a replaced/symlinked ancestor yields typed `STALE_PLAN` issues
  and refuses the batch. No silent replan occurs mid-transaction.
- `capturePreimage`/`observeTarget` provide the exact preimage observations the
  journal records.
- `tests/integration/revalidate.test.ts` covers changed source/config/CSS,
  appeared-absent targets, symlink/ancestor replacement and repeated unchanged
  success.

## Files touched

- `src/codegen/revalidate.ts` — new preimage revalidation module.
- `tests/integration/revalidate.test.ts` — new focused suite.
- `implementation/COMMIT_SEQUENCE.md` — finalizes the S066 pending ledger row
  and records this checkpoint's implementation hash with the successor.

## Verification

- `pnpm run test:integration -- tests/integration/revalidate.test.ts` — exit 0,
  3/3.
- `pnpm run test:integration -- tests/integration/filesystem-paths.test.ts` —
  exit 0, 6/6 (regression).
- `pnpm run format:check` — exit 0.
- `pnpm run lint` — exit 0, zero warnings.
- `pnpm run typecheck` — exit 0, five configs.
- `git diff --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Revalidation consumes captured observations; staging, replacement,
  publication, cleanup and recovery remain S068–S077.
- No live application target is written by this checkpoint.
