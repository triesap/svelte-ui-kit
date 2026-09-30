# RCLD-02 cumulative qualification (S013–S032)

Current disposition: S013–S032 independently accepted by Codex at `0e5b1852d02e15159f2ee4dd885152230457e119`. Historical pending statements below describe author qualification before acceptance. See the twenty checkpoint reviews for fresh independent results and limitations. The author also repaired an iterator flatMap type error and a 25/27 ownership-test fixture attempt before the final green product commit; final passing lanes do not erase these attempts.

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
`actionlint 1.7.12` (darwin/arm64, downloaded release archive) with SHA-256
`aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f`, matching
the published checksum file for the archive, ran at exit 0; it was unpacked in
an owned temporary directory outside the repository and is not committed. That
SHA-256 identifies the downloaded archive, not the extracted binary.

This records implementation and verification only. None of the twenty
checkpoints is Codex-accepted, and no acceptance hash or counter changes.

## RCLD-02 review-3 repair batch

Independent review 3 of candidate
`49b12b25c66d1f2d9e5855f65c368a2a1cca8ea9` requested the three RCLD02-R3
groups. The original S013-S032 implementation hashes and the review-1/review-2
repair commits remain provenance; they are not acceptance. All twenty
checkpoints remain `committed_pending_review`; no acceptance counter or
accepted hash changed.

| Group | Repair commit                              | Summary                                                         |
| ----- | ------------------------------------------ | --------------------------------------------------------------- |
| R3-1  | `1e7ae2ddb847a5e0f180b111b3055fc5646c9031` | intersect one constraint set over the complete selected closure |
| R3-2  | `1e7ae2ddb847a5e0f180b111b3055fc5646c9031` | same-category lock file/block case and ancestry checks          |
| R3-3  | `a14a80527b120f960ef58cbd46e00d7afd97ca36` | within-item controls, cumulative qualification and evidence     |

`a14a80527b120f960ef58cbd46e00d7afd97ca36` is the final candidate tip: it adds
the within-one-item output-set controls for owned source files and owned
aggregate stylesheet targets on top of the `1e7ae2d` repairs, with no
production behaviour change. Neither commit is Codex acceptance.

R3-1 replaces the per-item compatibility intersection in
`validateCompatibility` with one joint intersection per mapped axis built from
the qualified root, every selected item's declared compatibility and every
matching explicit npm requirement. Disjoint (`>=3.8.1 <3.10.0` vs
`>=3.10.0 <4.0.0`) and cross-item explicit-peer cases that each overlap the
root but not one another now fail both `validateRegistryHealth` and
`validateResolvedInventory`, with diagnostics that name the package/axis and
the involved owners and ranges in stable order. R3-2 advanced the lexical
ownership checks within each category: resolved UI and style targets reject
file/directory ancestry and case aliases, lock file/block records reject case
aliases and ancestry, multiple uniquely owned blocks may still share one exact
aggregate stylesheet, valid compound siblings and safe nested mappings stay
valid, and no integration record may equal or contain a required namespace
directory. Those per-category checks were not a complete ownership validation:
independent review 4 subsequently found nine cross-role/directory negatives
still accepted by the actual lock parser, and R4-1 below replaced them with one
normalized whole-inventory comparison. Both repairs are exercised through the
real parsers, loaded registry health and the resolved-operation path, including
new installed-copy controls.

### RCLD-02 review-3 cumulative lanes

Run at final candidate tip `a14a80527b120f960ef58cbd46e00d7afd97ca36`
(the R3-1/R3-2 production repairs landed at `1e7ae2d`; the within-item controls
are test-only) from this repository root with Node `24.21.0` / pnpm `11.22.0`.
Raw lane logs are under the git-ignored
`implementation/evidence/logs/r3-20260930/`.

| Lane                   | Command                                                                     | Exit | Result                                             |
| ---------------------- | --------------------------------------------------------------------------- | ---- | -------------------------------------------------- |
| Frozen strict install  | `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | 0    | already up to date                                 |
| Format                 | `pnpm run format:check`                                                     | 0    | all matched files formatted                        |
| Lint                   | `pnpm run lint`                                                             | 0    | no findings                                        |
| Typecheck              | `pnpm run typecheck` (5 configs)                                            | 0    | exit 0                                             |
| Unit                   | `pnpm run test:unit`                                                        | 0    | 194 tests, 194 pass                                |
| Runner harness         | `pnpm run test:harness`                                                     | 0    | 37 tests, 37 pass                                  |
| Integration            | `pnpm run test:integration`                                                 | 0    | 22 tests, 22 pass (7 installed-copy controls)      |
| Components             | `pnpm run test:components`                                                  | 0    | 22 tests, 22 pass (17 strict-declaration controls) |
| Registry               | `pnpm run test:registry`                                                    | 0    | 38 tests, 38 pass                                  |
| CLI smoke              | `pnpm run test:cli-bootstrap`                                               | 0    | 52 tests, 52 pass                                  |
| Consumer check         | `pnpm run fixture:check`                                                    | 0    | 0 errors, 0 warnings                               |
| Consumer SSR/lifecycle | `pnpm run test:fixture`                                                     | 0    | 23 tests, 23 pass                                  |
| Browser (Chromium)     | `pnpm run test:browser -- tests/browser/harness.spec.ts`                    | 0    | 23 passed                                          |
| Contract validation    | `pnpm run check:contracts`                                                  | 0    | 0 error(s), 0 warning(s)                           |
| Contract regressions   | `pnpm run test:contracts`                                                   | 0    | 117 tests, 117 pass                                |
| Projection             | `node tools/check-contracts.mjs --generate`                                 | 0    | deterministic; no tracked change                   |
| Whitespace             | `git diff --check`, `git diff --cached --check`                             | 0    | no diagnostics                                     |
| Strict raw checker     | pinned `svelte-check` on the disposable strict fixture                      | 1    | exactly two Bits TS2590 errors, zero warnings      |
| Workflow validation    | `actionlint .github/workflows/ci.yml` (v1.7.12)                             | 0    | no findings (shellcheck 0.11.0 on PATH)            |

The strict raw checker remains the qualified fixture-only upstream exception:
an unmodified `svelte-check 4.7.6` run over the strict fixture exits 1 with
exactly the two genuine Bits 2.19.3 union-complexity `TS2590` errors and no
warnings, classified `qualified-upstream-exception` with no rejection reasons.
The release AC20 debt remains open.

The review-3 run had intermediate failures that are retained here rather than
hidden by the final green table: the unit lane initially reported 193/194 while
a custom-context fixture still carried the default file paths, and passed only
after the fixture was corrected; the first format check also failed before the
tree was formatted. A final passing lane does not mean no failed attempt
occurred.

### RCLD-02 review-3 reference guard

Fresh reference guard at clean reference
`a10fbf06334f4648f5755e05a7147414e4e5fc98` on the same workstation, from the
reference Rust workspace root:

| Command                                 | Exit | Result                                           |
| --------------------------------------- | ---- | ------------------------------------------------ |
| `cargo fmt --all -- --check`            | 0    | no diffs                                         |
| `cargo check --workspace --all-targets` | 0    | Finished dev profile                             |
| `cargo test --workspace --all-targets`  | 0    | 43 result lines; 578 passed, 0 failed, 4 ignored |

The reference was clean at that hash before and after and was not modified.
`actionlint 1.7.12` (darwin/arm64 release archive
`actionlint_1.7.12_darwin_arm64.tar.gz`) with SHA-256
`aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f`, matching
the published checksum file for that archive, ran at exit 0; it was unpacked in
an owned `/tmp` directory outside the repository and is not committed. That
SHA-256 is the downloaded archive's, not the extracted binary's.

This records implementation and verification only. None of the twenty
checkpoints is Codex-accepted, and no acceptance hash or counter changes.

## RCLD-02 review-4 repair batch

Independent review 4 of candidate
`e0a23bb3423fe88e109da8e11a52ae58251ae641` requested both RCLD02-R4 groups.
The original S013-S032 implementation hashes and the review-1/2/3 repair commits
remain provenance; they are not acceptance. All twenty checkpoints remain
`committed_pending_review`; no acceptance counter or accepted hash changed.

| Group | Repair commit                              | Summary                                                                          |
| ----- | ------------------------------------------ | -------------------------------------------------------------------------------- |
| R4-1  | `0636f9f1a59ca2c215552764ef0955a43f7fa4a3` | validate one complete normalized lock claim inventory                            |
| R4-2  | this record                                | callers, installed-copy controls, cumulative qualification and truthful evidence |

R4-1 removes the three separate `checkOwnershipPaths` invocations and the
isolated file-versus-block check from `parseKitLock`. Every safe source file,
CSS block and integration record now contributes one normalized claim carrying
its path, role, identity and record locator, and the complete inventory is
compared once: differently spelled ASCII case aliases always fail, a strict
segment-aware ancestor relationship always fails in either input order across
every role pair, and an exact path shared by two claims must be an explicitly
compatible block/block or block/stylesheet pair. Source files never share an
exact path, two integrations never share one, and a CSS block never shares one
with a layout or exports integration. Every file claim is also checked against
the validated UI/styles/state directories, so a source file `src/ui/styles`
fails when the required styles directory is `src/ui/styles/nested`. Valid
compound siblings, prefix siblings, safe directory nesting and compatible
multi-block aggregate stylesheet sharing stay valid. The nine parsed negatives
that independent review 4 reproduced now fail with typed causes and locators.

R4-2 audits the original S013-S032 criteria and the retained review findings
against actual callers after the repair, keeps the separate checkpoint and
sequence reports from describing same-category checks as complete ownership
validation, corrects the public qualification (removing private routing/tooling
details and distinguishing the actionlint archive checksum from the extracted
binary), retains the review-3 intermediate failures, and records the fresh
cumulative qualification below. No pending hash, acceptance counter or
checkpoint state changed.

### RCLD-02 review-4 cumulative lanes

Run at the R4-1 production repair
`0636f9f1a59ca2c215552764ef0955a43f7fa4a3` from this repository root with Node
`24.21.0` / pnpm `11.22.0`; this R4-2 record adds evidence only. Raw lane logs
are under the git-ignored `implementation/evidence/logs/r4-20260930/`.

| Lane                   | Command                                                                     | Exit | Result                                             |
| ---------------------- | --------------------------------------------------------------------------- | ---- | -------------------------------------------------- |
| Frozen strict install  | `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | 0    | already up to date                                 |
| Format                 | `pnpm run format:check`                                                     | 0    | all matched files formatted                        |
| Lint                   | `pnpm run lint`                                                             | 0    | no findings                                        |
| Typecheck              | `pnpm run typecheck` (5 configs)                                            | 0    | exit 0                                             |
| Unit                   | `pnpm run test:unit`                                                        | 0    | 203 tests, 203 pass                                |
| Runner harness         | `pnpm run test:harness`                                                     | 0    | 37 tests, 37 pass                                  |
| Integration            | `pnpm run test:integration`                                                 | 0    | 23 tests, 23 pass (8 installed-copy controls)      |
| Components             | `pnpm run test:components`                                                  | 0    | 22 tests, 22 pass (17 strict-declaration controls) |
| Registry               | `pnpm run test:registry`                                                    | 0    | 38 tests, 38 pass                                  |
| CLI smoke              | `pnpm run test:cli-bootstrap`                                               | 0    | 52 tests, 52 pass                                  |
| Consumer check         | `pnpm run fixture:check`                                                    | 0    | 0 errors, 0 warnings                               |
| Consumer SSR/lifecycle | `pnpm run test:fixture`                                                     | 0    | 23 tests, 23 pass                                  |
| Browser (Chromium)     | `pnpm run test:browser -- tests/browser/harness.spec.ts`                    | 0    | 23 passed                                          |
| Contract validation    | `pnpm run check:contracts`                                                  | 0    | 0 error(s), 0 warning(s)                           |
| Contract regressions   | `pnpm run test:contracts`                                                   | 0    | 117 tests, 117 pass                                |
| Projection             | `node tools/check-contracts.mjs --generate`                                 | 0    | deterministic; no tracked change                   |
| Whitespace             | `git diff --check`, `git diff --cached --check`                             | 0    | no diagnostics                                     |
| Strict raw checker     | pinned `svelte-check` on the disposable strict fixture                      | 1    | exactly two Bits TS2590 errors, zero warnings      |
| Workflow validation    | `actionlint .github/workflows/ci.yml` (v1.7.12)                             | 0    | no findings (shellcheck 0.11.0 on PATH)            |

The strict raw checker remains the qualified fixture-only upstream exception:
an unmodified `svelte-check 4.7.6` run over the strict fixture exits 1 with
exactly the two genuine Bits 2.19.3 union-complexity `TS2590` errors and no
warnings. The `test:components` lane re-ran that maintained strict-declaration
audit (17 controls) and requalified it; the historical raw output is retained
under `implementation/evidence/logs/rcld01-strict-audit-raw.log`. The release
AC20 debt remains open.

### RCLD-02 review-4 reference guard

Fresh reference guard at clean reference
`a10fbf06334f4648f5755e05a7147414e4e5fc98` on the same workstation, from the
reference Rust workspace root:

| Command                                 | Exit | Result                                           |
| --------------------------------------- | ---- | ------------------------------------------------ |
| `cargo fmt --all -- --check`            | 0    | no diffs                                         |
| `cargo check --workspace --all-targets` | 0    | Finished dev profile                             |
| `cargo test --workspace --all-targets`  | 0    | 43 result lines; 578 passed, 0 failed, 4 ignored |

The reference was clean at that hash before and after and was not modified.
`actionlint 1.7.12` ran against `.github/workflows/ci.yml` at exit 0 with no
findings. The downloaded darwin/arm64 release archive
(`actionlint_1.7.12_darwin_arm64.tar.gz`) has SHA-256
`aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f`, matching
the published checksum file for that archive; the binary extracted from it has
SHA-256 `8db11704dc296f096216db4db65d86cd7f0ebfdf4c38453a1da276b137b88388`. The
archive checksum is not the extracted binary's digest. The tool was unpacked in
an owned `/tmp` directory outside the repository and is not committed.

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
- Joint closure (R3-1): fully parsed multi-item disjoint date ranges,
  cross-item explicit npm peers, transitive closure items, pairwise-overlapping
  but jointly empty OR ranges, order-permutation stability, valid joint overlap,
  unselected-item exclusion and unregistered-candidate exclusion, asserted
  through both registry health and the resolved-operation path.
- Ownership (R3-2, superseded by R4-1): same-category resolved style/UI
  file/directory ancestry, lock per-category ASCII case aliases and lock file
  ancestry, and integration namespace-directory claims, with valid shared
  aggregate stylesheets, compound siblings and nested mappings. Those checks
  did not compare roles against one another; the complete normalized
  cross-role matrix below supersedes them for whole-set validation.
- Cross-role ownership (R4-1): one normalized claim inventory across source
  files, CSS blocks and integrations covering every role pair at exact, ASCII
  alias, ancestor, reverse-ancestor and disjoint paths; required UI/styles/state
  directory equality and ancestry; input permutations; valid compound and prefix
  siblings; and compatible multi-block aggregate stylesheet sharing, asserted
  from the authoring parser and from emitted installed modules.
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
