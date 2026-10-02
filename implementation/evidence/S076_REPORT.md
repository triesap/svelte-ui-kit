# S076 step report — Qualify concurrency and process-interruption behavior

Current disposition: implementation candidate committed pending independent
Codex review under the RCLD-04 batch. This report is Pi-authored evidence; Codex
alone assigns acceptance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S076","kind":"report","commit":"f0f2dd1a49288b1c8dc42973d88cc52167afef88","disposition":"candidate"}
-->

Step ID and title: S076 — Qualify concurrency and process-interruption behavior.

Contract/requirement IDs: R16, R29, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/ACCEPTANCE_CRITERIA.md`,
`specs/SECURITY_AND_TRANSACTIONS.md`).

Author: Pi. Runtime: Node `24.21.0` / `pnpm 11.22.0`. No dependency change.

## Scope implemented

- `tests/helpers/fault-process.ts` spawns real Node worker processes that
  acquire the cooperative lock or run the guarded apply with a real `SIGKILL`
  at a named boundary. The worker imports the compiled codegen modules under
  test.
- `tests/integration/transaction-processes.test.ts` proves: two cooperative
  writers cannot interleave an accepted batch (real holder + contender), a
  killed process leaves recoverable state at two boundaries (`replace:apply`
  before the rename and `progress:persist` after the replacement), and a
  noncooperative edit after a crash is refused and preserved.
- The new suite runs under the existing CI `pnpm run test:integration` step; no
  workflow change was required.

## Platform matrix

- Qualified locally: Darwin 25.5.0 arm64 (author host).
- Qualified CI lane: `ubuntu-24.04`, Node `24.21.0`, pnpm `11.22.0`.
- Not run/claimed: Windows and any case-insensitive/network filesystem. The
  trusted-local model, same-filesystem staging and atomic per-file rename are
  the tested assumptions; no native multi-file atomicity is claimed.

## Files touched

- `tests/helpers/fault-process.ts` — new subprocess worker helper.
- `tests/integration/transaction-processes.test.ts` — new focused suite.
- `implementation/COMMIT_SEQUENCE.md` — finalizes the S075 pending ledger row
  and records this checkpoint's implementation hash with the successor.

## Verification

- `pnpm run test:integration -- tests/integration/transaction-processes.test.ts`
  — exit 0, 4/4.
- `pnpm run test:integration -- tests/integration/recovery-prepublication.test.ts`
  — exit 0, 3/3 (regression).
- `pnpm run test:integration -- tests/integration/recovery-published.test.ts` —
  exit 0, 3/3 (regression).
- `pnpm run format:check` — exit 0.
- `pnpm run lint` — exit 0, zero warnings.
- `pnpm run typecheck` — exit 0, five configs.
- `git diff --check` — clean.

## Limitations

- The conditional Rust guard is N/A: this repository has no Cargo workspace.
- Windows and non-local filesystems are documented as unverified rather than
  claimed. The single composed guarded apply use case remains S077.
