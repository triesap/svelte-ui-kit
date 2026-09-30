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

## RCLD-02 review-1 cumulative lanes

After the RCLD-02 review-1 repair batch, all commands ran from this
repository root with the pinned local Node 24.21.0 and pnpm 11.22.0 toolchain.
The counts below are the fresh repaired-candidate results.

| Lane                   | Command                                                                     | Exit | Result                                                           |
| ---------------------- | --------------------------------------------------------------------------- | ---- | ---------------------------------------------------------------- |
| Frozen strict install  | `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | 0    | already up to date                                               |
| Format                 | `pnpm run format:check`                                                     | 0    | all matched files formatted                                      |
| Lint                   | `pnpm run lint`                                                             | 0    | no findings                                                      |
| Typecheck              | `pnpm run typecheck` (5 configs)                                            | 0    | exit 0                                                           |
| Unit                   | `pnpm run test:unit`                                                        | 0    | 179 tests, 179 pass                                              |
| Runner harness         | `pnpm run test:harness`                                                     | 0    | 37 tests, 37 pass                                                |
| Integration            | `pnpm run test:integration`                                                 | 0    | 16 tests, 16 pass                                                |
| Components             | `pnpm run test:components`                                                  | 0    | 22 tests, 22 pass                                                |
| Registry               | `pnpm run test:registry`                                                    | 0    | 18 tests, 18 pass                                                |
| CLI smoke              | `pnpm run test:cli-bootstrap`                                               | 0    | 52 tests, 52 pass                                                |
| Consumer check         | `pnpm run fixture:check`                                                    | 0    | 0 errors, 0 warnings                                             |
| Consumer SSR/lifecycle | `pnpm run test:fixture`                                                     | 0    | 23 tests, 23 pass                                                |
| Browser (Chromium)     | `pnpm run test:browser -- tests/browser/harness.spec.ts`                    | 0    | 23 passed                                                        |
| Contract validation    | `pnpm run check:contracts`                                                  | 0    | 0 error(s), 0 warning(s)                                         |
| Contract regressions   | `pnpm run test:contracts`                                                   | 0    | 117 tests, 117 pass                                              |
| Installed package      | `pnpm run test:integration -- tests/integration/installed-package.test.ts`  | 0    | emitted modules load from an isolated copy under a different cwd |
| Workflow validation    | `actionlint .github/workflows/ci.yml` (v1.7.12)                             | 0    | no findings (shellcheck 0.11.0 on PATH)                          |
| Whitespace             | `git diff --check`, `git diff --cached --check`                             | 0    | no diagnostics                                                   |
| Projection             | `node tools/check-contracts.mjs --generate`                                 | 0    | deterministic; no tracked change                                 |

## RCLD-02 review-1 repair batch

The original S013–S032 implementation commits above remain unchanged and are
retained as provenance. Independent review 1 requested changes under seven
closure groups; the repairs were committed as green local checkpoints:

| Group | Repair commit                              | Summary                                                    |
| ----- | ------------------------------------------ | ---------------------------------------------------------- |
| R1-1  | `e5256817b4f493836c18c87a5813fe1321b3c161` | enforce model identities and safe mappings                 |
| R1-2  | `2aedcf7ea39cda88c78e44bcf0050688a9159d5f` | load schemas and assets through one package authority      |
| R1-3  | `b7f717492cc5abd5b069f90af435e2b9caeaab52` | compute a truthful joint npm constraint                    |
| R1-4  | `15689777325e1eac1a9df942784759e1835e0cf9` | compose integrated health and shared css ownership         |
| R1-5  | `34bcbae12459c127f9d79f74f55e4f25b0ced2e4` | route every json failure through one envelope              |
| R1-6  | `88e9bd7d0763b50720b00c081a6fe42c2c0206a6` | validate semantic metadata without losing meaning          |
| R1-7  | this record                                | maintained controls, evidence and cumulative qualification |

The repaired candidate is fresh local evidence only. None of the twenty
checkpoints is Codex-accepted, and no acceptance hashes or counters change.

## RCLD-02 review-2 repair batch

Independent review 2 of candidate
`baebed721b88afa48f6c3af489cb6daa193088ee` requested the four RCLD02-R2 groups.
The original S013-S032 implementation hashes above and the review-1 repair
commits remain provenance; they are not acceptance. The repairs were committed
as green local checkpoints, each with its direct controls plus format, lint and
typecheck:

| Group | Repair commit                              | Summary                                                 |
| ----- | ------------------------------------------ | ------------------------------------------------------- |
| R2-1  | `4250f63644f1b0343c57ba1c3a9ad041515575b8` | role-aware mapping/ownership overlap validation         |
| R2-2  | `c726e49315f6a0adb589fdd7ba66b85a6557abae` | one contained provider authority for every schema parse |
| R2-3  | `f3e7ea6bbe8a7b2a2aaf06a25dc19d6baa2e3b96` | joint compatibility and style-target case validation    |
| R2-4  | `9860ce100c5968dd601e41180f94a4d21ed44d29` | whole-argv JSON intent and command attribution          |

### RCLD-02 review-2 cumulative lanes

Run at repaired commit
`9860ce100c5968dd601e41180f94a4d21ed44d29` from this repository root with Node
`24.21.0` / pnpm `11.22.0`. Raw lane logs are under the git-ignored
`implementation/evidence/logs/r2-20260930/`.

| Lane                   | Command                                                                     | Exit | Result                                        |
| ---------------------- | --------------------------------------------------------------------------- | ---- | --------------------------------------------- |
| Frozen strict install  | `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | 0    | already up to date                            |
| Format                 | `pnpm run format:check`                                                     | 0    | all matched files formatted                   |
| Lint                   | `pnpm run lint`                                                             | 0    | no findings                                   |
| Typecheck              | `pnpm run typecheck` (5 configs)                                            | 0    | exit 0                                        |
| Unit                   | `pnpm run test:unit`                                                        | 0    | 191 tests, 191 pass                           |
| Runner harness         | `pnpm run test:harness`                                                     | 0    | 37 tests, 37 pass                             |
| Integration            | `pnpm run test:integration`                                                 | 0    | 20 tests, 20 pass                             |
| Components             | `pnpm run test:components`                                                  | 0    | 22 tests, 22 pass                             |
| Registry               | `pnpm run test:registry`                                                    | 0    | 22 tests, 22 pass                             |
| CLI smoke              | `pnpm run test:cli-bootstrap`                                               | 0    | 52 tests, 52 pass                             |
| Consumer check         | `pnpm run fixture:check`                                                    | 0    | 0 errors, 0 warnings                          |
| Consumer SSR/lifecycle | `pnpm run test:fixture`                                                     | 0    | 23 tests, 23 pass                             |
| Browser (Chromium)     | `pnpm run test:browser -- tests/browser/harness.spec.ts`                    | 0    | 23 passed                                     |
| Contract validation    | `pnpm run check:contracts`                                                  | 0    | 0 error(s), 0 warning(s)                      |
| Contract regressions   | `pnpm run test:contracts`                                                   | 0    | 117 tests, 117 pass                           |
| Installed package      | `pnpm run test:integration` (installed-package suite)                       | 0    | 5 controls pass from an isolated emitted copy |
| Workflow validation    | `actionlint .github/workflows/ci.yml` (v1.7.12)                             | 0    | no findings (shellcheck 0.11.0 on PATH)       |
| Whitespace             | `git diff --check`, `git diff --cached --check`                             | 0    | no diagnostics                                |
| Projection             | `node tools/check-contracts.mjs --generate`                                 | 0    | deterministic; no tracked change              |

Every RCLD02-R2 group has a maintained production-path control in an existing
CI lane: file/directory role collisions and namespace/reserved-state claims
(`test:unit`), contained schema authority, cold/warm, same-root-different-
provider, removal/replacement, escaping-symlink and I/O faults (`test:unit`),
installed-copy config/lock/theme/envelope/snapshot plus missing/corrupt/escaping
asset negatives (`test:integration`), joint compatibility and CSS case aliases
(`test:registry`) and whole-argv JSON/attribution permutations (`test:unit` and
`test:cli-bootstrap`).

### RCLD-02 review-2 reference guard

Fresh routed reference guard at clean reference
`a10fbf06334f4648f5755e05a7147414e4e5fc98` on the same workstation, from the
reference Rust workspace root:

| Command                                 | Exit | Result                                           |
| --------------------------------------- | ---- | ------------------------------------------------ |
| `cargo fmt --all -- --check`            | 0    | no diffs                                         |
| `cargo check --workspace --all-targets` | 0    | Finished dev profile                             |
| `cargo test --workspace --all-targets`  | 0    | 43 result lines; 578 passed, 0 failed, 4 ignored |

The reference was clean at that hash before and after and was not modified.
`actionlint 1.7.12` (darwin/arm64) with SHA-256
`aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f`, matching
the published checksum file, ran at exit 0; it was unpacked in an owned
temporary directory outside the repository and is not committed.

This records implementation and verification only. None of the twenty
checkpoints is Codex-accepted, and no acceptance hash or counter changes.

## Negative controls exercised

- Schema/identity: duplicate IDs, identity mismatch, malformed compatibility,
  unknown/legacy fields, unsupported schema versions, unsafe manifest paths,
  schema `$id` mismatch, missing/malformed/non-object provider schemas, and a
  provider item schema that rejects everything.
- Config/model safety: traversal, absolute/drive/UNC roots, `..` segments,
  state-directory overlap, layout/state and layout/root-export collisions, and
  strict-SemVer rejection for registry and lock release identities.
- Protocol: exit map per status/cause, JSON usage/metadata failures with exactly
  one envelope, human stderr preservation, unsafe locators, planned-applied and
  no-change invariants, single-document rendering.
- Graph: self/multi-node cycles with paths, missing roots/dependencies, diamond
  visited once, permuted-input stability, joint-empty range conflict, and
  integrated health rejection of missing dependencies, cycles and unsupported
  npm requirements.
- Collision: duplicate target/block/export, ASCII case-folded collisions,
  candidate exclusion, and distinct blocks sharing one aggregate stylesheet.
- Assets: traversal, symlink asset, escaping symlink ancestor, symlinked listing
  start, invalid UTF-8 source/style bytes, missing asset, no source-checkout
  fallback, and deeply frozen snapshots with defensive byte copies.
- Serialization/theme: `Date`/`Map`/`Set`/class instances, sparse-array holes,
  `undefined` entries and cycles; reversed/imprecise layer order, unsafe
  stylesheet mappings and duplicate semantic token identities.

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
