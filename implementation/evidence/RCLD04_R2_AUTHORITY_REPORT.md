# RCLD-04 R2 projected-content authority, bounded children and integrated qualification

Status: Pi-authored implementation and execution evidence for the return review
of candidate `0ce552ae26336648eac035ebd5235c22096ed440`. Independent Codex S077
acceptance is still required before S078; this report grants no acceptance.
S064–S077 remain `committed_pending_review` and the counts stay 63 accepted /
14 committed_pending_review / 126 not_started.

This record addresses the five open R2 findings and links each original
criterion to an executed production case and exact outcome rather than a test
filename. It continues, and does not replace, the history in
`RCLD04_RETURN_REVIEW.md` and `RCLD04_Q4_REPORT.md`.

## Ordered green commits (parent `0ce552a`)

1. `9780c1b` — `fix: carry captured content authority through projected batch validation`
   - structural target/preimage failures stop before projection, hashing or
     sealing, so a null or malformed target is a typed refusal, never a thrown
     `TypeError` from the projected-batch map;
   - exact captured evidence bytes are carried through production composition and
     the effective projected configuration is validated whether created, updated
     or unchanged; the lock `configHash` must be that identity and the lock
     `requested` set must equal the projected configuration roots;
   - managed foundation/stylesheet integration and CSS-block contracts are
     validated from exact projected content (a claimed `foundation-tokens-v1`
     stylesheet must contain its owned `tokens` block; every recorded block must
     exist), so path presence alone is no longer accepted as contract proof;
   - the three supplied governance edits (`AGENTS.md`,
     `implementation/COMMIT_SEQUENCE.md`, `implementation/VERIFICATION.md`) are
     included.
2. `18fd894` — `test: bound and terminate owned recovery children`
   - the owned recovery worker gains an enforceable wall-clock bound that
     terminates a stalled child with an untrappable `SIGKILL`;
   - a controlled stalled-child regression proves prompt termination, an
     attributable `SIGKILL`/`ETIMEDOUT` failure and an unchanged whole tree.
3. `9517afc` — `test: qualify projected config and content authority across the lifecycle`
   - explicit lifecycle assertions for written init config identity, requested
     roots and unchanged satisfied-sync authority against the published lock;
   - a positive customized-foundation control plus the omitted-tokens refusal.

## R2-1 — structured malformed-target refusal before projection

`src/codegen/apply.ts` now returns every structural target, preimage and lock
issue before the projected batch is derived (`if (problems.length > 0) return
fail(problems)` immediately after the lock structural checks). The projected
batch is built from the already-sealed target results, so no invalid record can
reach the projection, digest or sealing steps.

Executed cases (`tests/integration/projected-coherence.test.ts`):

- `a null or malformed target is a typed refusal, never a thrown projection
error`: a bare `null` target and a target with missing `bytes` both return
  `PLAN_TARGET_INVALID` with an unchanged whole tree (the previous behavior
  threw a `TypeError` from `plan.targets.map`).
- `unknown plan, target and lock fields are typed refusals before hashing`
  (`PLAN_UNKNOWN_FIELD`, `PLAN_TARGET_INVALID`, `PLAN_LOCK_INVALID`).
- `malformed installed-resolution evidence is typed, never a thrown serializer
error` (missing `digest`; kind-inconsistent absent resolution).

## R2-2 — complete original captured/projected content authority

- `src/codegen/authority.ts`: `PlanReadFile` carries optional exact `bytes`;
  `captureReadFile` populates them; `validateReadset` accepts and, when present,
  re-hashes them against the recorded digest so a fabricated capture is refused.
- `src/codegen/compose.ts`: evidence files carry the exact captured bytes from
  the original immutable snapshot (never a later live read).
- `src/codegen/projected-batch.ts`: `resolveProjectedConfig` derives the
  effective configuration from the planned config write (`created`/`updated`) or
  the carried unchanged capture (`unchanged`); a batch that leaves no
  configuration is `PROJECTED_CONFIG_MISSING` — there is no fabricated
  declaration-root fallback. `validateProjectedLock` requires the lock
  `configHash` to equal the projected configuration identity, the lock
  `requested` set to equal the projected config roots, and each managed
  foundation/stylesheet/CSS block to be backed by exact projected content.

Executed cases (`tests/integration/projected-coherence.test.ts`):

- `a batch that drops the projected config write is refused as incomplete
authority` (`PROJECTED_CONFIG_MISSING`).
- `a metadata-only batch cannot publish an arbitrary configHash over a captured
config` (`PROJECTED_CONFIG_HASH_MISMATCH`) plus a positive control where the
  exact captured configuration identity validates.
- `a lock whose requested roots disagree with the projected config is refused`
  (`PROJECTED_REQUESTED_MISMATCH`; a config requesting `button` can no longer
  publish `requested: []`).
- `a managed foundation stylesheet without its tokens block is refused`
  (`PROJECTED_FOUNDATION_MISSING`).
- `a customized managed foundation still satisfies its contract` (a legitimate
  customized `tokens` body is accepted: contract presence, not byte equality
  with the canonical foundation, is the ownership proof).
- Preserved: `a projected config write that disagrees with the plan mapping is
refused`, `a projected lock that names an absent integration or owned file is
refused`, `a final lock whose configHash is not the projected config identity
is refused`, `a lock that owns a file absent from the projected tree is
refused`, and the default/custom positive controls.

## R2-3 — integration across the full original lifecycle

`tests/integration/composed-lifecycle.test.ts` gains
`projected config and requested authority hold across init, add and satisfied
sync`: a fresh init (`created` config) publishes a lock whose `configHash` is the
written config identity and `requested: []`; an explicit add (`updated` config)
keeps the lock `configHash` equal to the on-disk config and both config and lock
`requested` equal to `["button"]`; an installed satisfied replay carries the
unchanged captured config authority and leaves the whole tree byte-identical.
The existing default/custom, add/update/retirement, cohort, whole-tree and six
resulting-consumer check/build/SSR stages are preserved from the Q2/Q4 records.

## R2-4 — bounded owned recovery children

`tests/helpers/guarded-process.ts`: `runRecoveryWorker` now runs the child under
`spawnSync` with `timeout: DEFAULT_RECOVERY_TIMEOUT_MS` (30s) and
`killSignal: "SIGKILL"`, an enforceable bound the child cannot trap. A test-only
`stallMs` mode blocks the child after it prints its envelope.

Executed case (`tests/integration/cleanup-restart-matrix.test.ts`):

- `a stalled recovery child is terminated at the enforceable bound with no
unrelated changes`: the child reports `signal: SIGKILL` and
  `error.code: ETIMEDOUT`, is terminated promptly, retains its exact
  PID/result envelope (PID differs from the parent), and leaves the whole tree
  unchanged.
- Preserved: the genuinely separate single (`recoverTransaction`) and scanned
  (`recoverTransactions`) fresh-child cases, captured production restart, and
  the `WRITER_BUSY` fail-closed held-writer cases.

## R2-5 — integrated cumulative qualification

Environment: Node `v24.21.0`, pnpm `11.22.0`, macOS arm64 (Darwin 25.5),
single-volume host, TypeScript 6.0.3. Each lane is a portable
repository-relative command, run through `cargo extbuild run --`, with its raw
output and underlying exit retained under the git-ignored
`implementation/evidence/logs/rcld04-r2-cumulative-20261005T233857Z/` tree. The
generated projection is unchanged by `--generate`.

| Lane                                                                        | Result                                      | Exit |
| --------------------------------------------------------------------------- | ------------------------------------------- | ---- |
| `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | up to date                                  | 0    |
| `pnpm run build`                                                            | built                                       | 0    |
| `pnpm run typecheck`                                                        | 0 errors across five configs                | 0    |
| `pnpm run format:check`                                                     | clean                                       | 0    |
| `pnpm run lint`                                                             | 0 warnings / 0 errors                       | 0    |
| `pnpm run test:unit`                                                        | 283 pass / 0 fail / 0 skip / 0 todo         | 0    |
| `pnpm run test:integration`                                                 | 512 pass / 0 fail / 0 skip / 0 todo         | 0    |
| `pnpm run test:registry`                                                    | 38 pass / 0 fail                            | 0    |
| `pnpm run test:cli-bootstrap`                                               | 52 pass / 0 fail                            | 0    |
| `pnpm run test:harness`                                                     | 37 pass / 0 fail                            | 0    |
| `pnpm run test:components`                                                  | 22 pass / 0 fail (strict declaration 17/17) | 0    |
| `pnpm run fixture:check`                                                    | 0 errors / 0 warnings                       | 0    |
| `pnpm run test:fixture`                                                     | 27 pass / 0 fail (six consumer stages)      | 0    |
| `pnpm run test:browser`                                                     | 23 pass / 0 fail                            | 0    |
| `node tools/check-contracts.mjs --generate`                                 | projection unchanged                        | 0    |
| `pnpm run check:contracts`                                                  | 0 error(s) / 0 warning(s)                   | 0    |
| `pnpm run test:contracts`                                                   | 137 pass / 0 fail                           | 0    |
| reference `cargo fmt --all -- --check`                                      | clean                                       | 0    |
| reference `cargo check --workspace --all-targets`                           | finished                                    | 0    |
| reference `cargo test --workspace --all-targets`                            | 578 passed / 0 failed / 4 ignored           | 0    |

The read-only reference workspace stayed clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98` with its four known ignored tests.

## Per-checkpoint links

| Checkpoint | Production source                     | Executed cases                                                                                                            |
| ---------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| S064       | `transaction-types`                   | `transaction-state`, `transaction-safety`                                                                                 |
| S065       | `transaction-journal`                 | `transaction-journal`, `recovery-ownership`, `recovery-invalid`                                                           |
| S066       | `write-lock`                          | `write-lock`, `transaction-processes` (live holder), captured production held-writer refusal                              |
| S067       | `revalidate`, `authority`             | `revalidate`, `compose-authority`, `transaction-authority`, strict readset cases                                          |
| S068       | `stage`, `durability`                 | `staging`, `durability-ordering`, `durability-flush-paths`                                                                |
| S069       | `transaction-journal`                 | `journal-preparation`, `recovery-prepublication`                                                                          |
| S070       | `replace`                             | `replacement`, `replacement-guards`, `recovery-prepublication`                                                            |
| S071       | `publish-lock`, `publication-intent`  | `lock-publication`, `publication-witness`, `lock-projection`                                                              |
| S072       | `transaction-cleanup`                 | `transaction-cleanup`, `durability-flush-paths`, namespace-removal cases                                                  |
| S073       | `recovery`                            | `recovery-prepublication`, `recovery-invalid`, captured production restart matrix                                         |
| S074       | `recovery`                            | `recovery-published`, fresh single/scanned recovery child cases                                                           |
| S075       | `recovery`, `owned-ancestry`          | `recovery-ownership`, `recovery-invalid`, fail-closed held-writer child cases                                             |
| S076       | process helpers/tests                 | `transaction-processes`, `cleanup-restart-matrix` (fresh + bounded stalled child)                                         |
| S077       | `apply`, `compose`, `projected-batch` | `guarded-composition`, `composed-lifecycle` (lifecycle authority), `projected-coherence` (R2-1/R2-2), six consumer stages |

## Preserved exceptions and honestly unrun

- AC20's exactly two fixture-only upstream Bits 2.19.3 TS2590 declarations and
  the strict-17 declaration controls are preserved, not waived.
- The four reference Rust tests remain ignored existing debt
  (`installed_binaries_run_after_package_source_and_build_state_are_deleted`,
  `homepage_fixture_cli_workflow_smoke`,
  `tests::every_transaction_io_fault_avoids_partial_application_state`,
  `packaged_sources_build_with_cargo_vcs_provenance_outside_and_inside_hostile_git`).
- Windows and a second physical cross-device host remain unexecuted; no
  device-dependent claim is made.
- `.github/workflows/ci.yml` was not modified in this batch (working tree clean),
  so the previously recorded checksum-qualified actionlint 1.7.12 result still
  applies; actionlint was not re-fetched in this run. Remote CI was not
  dispatched.

## Disposition

All original S064–S077 checkpoints remain `committed_pending_review`; none is
self-accepted. S078 stays gated on independent Codex S077 acceptance of the
completed RCLD-04 candidate. Pi records implementation and evidence only.
