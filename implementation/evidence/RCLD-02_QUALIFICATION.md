# RCLD-02 cumulative qualification (S013–S032)

This record captures the final S013–S032 cumulative qualification for the
owner-authorized `pfc through RCLD-02` batch. All checkpoints are implemented,
verified and committed **pending independent Codex review**; none is
Codex-accepted. S033 was not started.

## Scope and disposition

| Checkpoint | Title                                                        | Commit                                     | Disposition       |
| ---------- | ------------------------------------------------------------ | ------------------------------------------ | ----------------- |
| S013       | Model independent version identities                         | `bbd3cf4b0f07ebb9f82f259577a5d1ff17ed6878` | committed_pending |
| S014       | Freeze and validate strict kit configuration                 | `1dd359fbbd87e846d47558615a003659396ba7bc` | committed_pending |
| S015       | Model explicit requested item sets                           | `7a4d122c1f92d1f6db7e6c10e0a70fad89c752b9` | committed_pending |
| S016       | Define the registry-root schema                              | `ddba4853d36f8eb1980c7caaa71b24ae26b9d30c` | committed_pending |
| S017       | Define typed item targets and public exports                 | `1fb85b7f80fcde988d494c1446e2487ed40e6899` | committed_pending |
| S018       | Add accessibility and dependency manifest metadata           | `43d59e1f63fb95ce75eb10f6c38eca888a6de361` | committed_pending |
| S019       | Define source-file ownership lock records                    | `58ee9b84c9ee99c225e69e386c477ea344308d61` | committed_pending |
| S020       | Add CSS-block and integration lock records                   | `b9cb6cc47313bb23614014f6562140ae89a42932` | committed_pending |
| S021       | Define portable theme and customization metadata schemas     | `6bb1f2564786dd1e5f3f5d65750b22abdf17c9b0` | committed_pending |
| S022       | Freeze CLI envelopes and exit outcomes                       | `0e399f17b1e7bb913a5e84ea93a5e9600cff338a` | committed_pending |
| S023       | Parse only the approved CLI arguments                        | `7625796a1bf7b7865f25fc4192a794fed8f4749a` | committed_pending |
| S024       | Implement exact-byte hashing and deterministic serialization | `00faf8b4feb863da211136f925e357031c14494c` | committed_pending |
| S025       | Load assets relative to the installed package                | `287e5f5b7f7be4ac87307bd45cd153f7f635ac7b` | committed_pending |
| S026       | Build an immutable validated registry snapshot               | `466c6ea35b0997dcf57de479adc9d914e1d67bea` | committed_pending |
| S027       | Add full registry asset health validation                    | `74f6c3b157333b2047755453c6e14d34e6839b9c` | committed_pending |
| S028       | Resolve dependencies with cycle/missing-item diagnostics     | `23ad1cd7d042f31fa2597053e0e11cb9da68162e` | committed_pending |
| S029       | Make closure and export order deterministic                  | `3720ea8702e96c293feec91950313623f8e1b6ba` | committed_pending |
| S030       | Project requested versus transitive provenance               | `cb67f7cb6b70e5424b7e51258c631cc119db055e` | committed_pending |
| S031       | Merge compatible dependency requirements                     | `07f35d25df24112f8d7fc20ca549a0167ba3f230` | committed_pending |
| S032       | Validate cross-item target and public symbol uniqueness      | `14851a26a8c161d9b2ec87bc0633ced533c3e085` | committed_pending |

Prerequisite tooling commit: `fea1667c874e324671b9716b40e2e0acace530bf`.

## Final cumulative lanes

All commands ran from the package root
`/…/domains/triesap/svelte-ui-kit` via `cargo extbuild run -- …`.

| Lane                   | Command                                                                     | Exit | Result                                  |
| ---------------------- | --------------------------------------------------------------------------- | ---- | --------------------------------------- |
| Frozen strict install  | `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | 0    | already up to date                      |
| Format                 | `pnpm run format:check`                                                     | 0    | all matched files formatted             |
| Lint                   | `pnpm run lint`                                                             | 0    | no findings                             |
| Typecheck              | `pnpm run typecheck` (5 configs)                                            | 0    | exit 0                                  |
| Unit                   | `pnpm run test:unit`                                                        | 0    | 148 tests, 148 pass                     |
| Runner harness         | `pnpm run test:harness`                                                     | 0    | 37 tests, 37 pass                       |
| Integration            | `pnpm run test:integration`                                                 | 0    | 15 tests, 15 pass                       |
| Components             | `pnpm run test:components`                                                  | 0    | 22 tests, 22 pass                       |
| Registry               | `pnpm run test:registry`                                                    | 0    | 8 tests, 8 pass                         |
| CLI smoke              | `pnpm run test:cli-bootstrap`                                               | 0    | 49 tests, 49 pass                       |
| Consumer check         | `pnpm run fixture:check`                                                    | 0    | 0 errors, 0 warnings                    |
| Consumer SSR/lifecycle | `pnpm run test:fixture`                                                     | 0    | 17 tests, 17 pass                       |
| Browser (Chromium)     | `pnpm run test:browser -- tests/browser/harness.spec.ts`                    | 0    | 23 passed                               |
| Contract validation    | `pnpm run check:contracts`                                                  | 0    | 0 error(s), 0 warning(s)                |
| Contract regressions   | `pnpm run test:contracts`                                                   | 0    | 117 tests, 117 pass                     |
| Workflow validation    | `actionlint .github/workflows/ci.yml` (v1.7.12)                             | 0    | no findings                             |
| Package inventory      | `pnpm pack --pack-destination /tmp/suik-pack-final`                         | 0    | 41 files; schema/registry/dist included |
| Whitespace             | `git diff --check`, `git diff --cached --check`                             | 0    | no diagnostics                          |

Unit totals shown are the pre-bookkeeping figure for the S032 implementation;
the final pending-bookkeeping commit changes no code, so the lanes remain valid.

## Negative controls exercised

- Schema/identity: duplicate IDs, identity mismatch, malformed compatibility,
  unknown/legacy fields, unsupported schema versions, unsafe manifest paths,
  schema `$id` mismatch.
- Protocol: exit map per status/cause, unsafe locators, planned-applied and
  no-change invariants, single-document rendering.
- Graph: self/multi-node cycles with paths, missing roots/dependencies, diamond
  visited once, permuted-input stability, joint-empty range conflict.
- Collision: duplicate target/block/export, ASCII case-folded collisions,
  candidate exclusion.
- Assets: traversal, symlink asset, escaping symlink ancestor, invalid UTF-8,
  missing asset, no source-checkout fallback.

## Fresh reference guard

From the reference Rust workspace root at clean revision
`a10fbf06334f4648f5755e05a7147414e4e5fc98`:

| Command                                 | Exit | Result                                           |
| --------------------------------------- | ---- | ------------------------------------------------ |
| `cargo fmt --all -- --check`            | 0    | no diffs                                         |
| `cargo check --workspace --all-targets` | 0    | Finished dev profile                             |
| `cargo test --workspace --all-targets`  | 0    | 43 result lines; 578 passed, 0 failed, 4 ignored |

The reference worktree was clean before and after and was not modified.

## Known limitations and open items

- No checkpoint is Codex-accepted; the batch awaits independent review.
- The two genuine upstream Bits 2.19.3 declaration-complexity errors remain a
  qualified fixture-only exception and an open release AC20 obligation.
- Only macOS/Node 24.21.0 with bundled Chromium was exercised locally; remote
  CI, other platforms and release packaging acceptance are not claimed.
- S033+ project integration/planning is not started.
