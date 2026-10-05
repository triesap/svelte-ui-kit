# RCLD-04 return-review repairs and per-criterion qualification

Status: Pi-authored implementation and execution evidence for the return review
of candidate `a0016eb`. Independent Codex S077 acceptance is still required
before S078; this report grants no acceptance. S064–S077 remain
`committed_pending_review` and the counts stay 63 accepted / 14
committed_pending_review / 126 not_started.

This record addresses the two open R2-1/R2-2 findings and the fresh-process
recovery finding from the independent return review, and links each original
criterion to an executed production case rather than a test filename.

## Ordered green commits

1. `36fc866` — `fix: validate structured evidence and projected batch coherence`
   - strict plan/target/lock key inventories and complete kind-consistent
     installed-resolution validation before digest/sealing;
   - effective projected config, target results and unchanged captured evidence
     derived and validated against the final lock before coordination;
   - governance edits adopted; guarded-plan fixtures now carry valid config
     evidence.
2. `70b57a4` — `test: qualify recovery in separately launched processes`
   - bounded recovery child for the exported single and scanned callers with
     attributable PID/exit/signal/output and whole-tree assertions.

## R2-1 — structured authority validation before effects

`validateApplyPlan` now rejects unknown top-level plan keys, unknown target keys
and unknown lock-wrapper keys, and `validateReadset` requires the complete
installed-resolution shape with kind-consistent null/identity rules. A malformed
absent record can no longer reach canonical serialization as `undefined` and
throw a `ModelError`; it is a typed `PLAN_READSET_INVALID` refusal before hashing,
sealing, coordination or writes.

Executed cases (`tests/integration/projected-coherence.test.ts`), each run
against a real captured `planInit` → `composeApplyPlan` batch:

- `unknown plan, target and lock fields are typed refusals before hashing`
  (`PLAN_UNKNOWN_FIELD`, `PLAN_TARGET_INVALID`, `PLAN_LOCK_INVALID`).
- `malformed installed-resolution evidence is typed, never a thrown serializer
error` (missing `digest`; non-null digest/mode/device/inode on an absent
  resolution).
- positive controls prove the valid direct/hoisted/linked readset still applies.

Each refusal case snapshots the complete selected root before and after, and
asserts no residue and no `.svelte-ui-kit` coordination namespace.

## R2-2 — complete projected-batch coherence

`src/codegen/projected-batch.ts` derives the effective projected configuration
from the planned config write, the projected target results and the unchanged
captured read-only evidence. Before any effect it requires:

- the projected config to be a strict valid configuration whose mapping matches
  the declared roots;
- the final lock to satisfy its schema/roles under the projected mapping;
- the lock `configHash` to be the exact projected config identity;
- every lock integration, owned file and CSS block to exist in the projected
  tree (a created/updated target or unchanged captured evidence).

Executed cases (same file):

- `a projected config write that disagrees with the plan mapping is refused`
  (`PROJECTED_CONFIG_MISMATCH`; the previous behavior published the old-mapped
  lock while writing a different `uiDir`).
- `a projected lock that names an absent integration or owned file is refused`
  (`PROJECTED_INTEGRATION_MISSING`; removing the planned layout write no longer
  publishes a layout integration for an absent file).
- `a final lock whose configHash is not the projected config identity is refused`
  (`PROJECTED_CONFIG_HASH_MISMATCH`).
- `a lock that owns a file absent from the projected tree is refused`
  (`PROJECTED_OWNERSHIP_MISSING`).
- `positive controls: default and custom captured init plans validate and apply
exactly` proves legitimate customized mappings, shared aggregate stylesheet
  and mapped app/layout integration roles are preserved, with an exact
  whole-tree comparison derived from the captured pre-state and the planned
  mutations.

## R2-4 — genuine separate-process recovery

`tests/helpers/guarded-process.ts` gains a bounded recovery worker that imports
the compiled `recoverTransaction` (single) or `recoverTransactions` (scanned)
caller, runs it in a _fresh_ child process and prints `SUIK_RECOVERY_PID` and
`SUIK_RECOVERY_RESULT` envelopes. The parent asserts the child's exact exit,
signal, PID (which must differ from the parent) and typed results, never a zero
exit alone.

Executed cases (`tests/integration/cleanup-restart-matrix.test.ts`), for the
default and custom mappings:

- a completed commit is re-observed by a scanned recovery child without any tree
  change;
- a prepublication refusal is rolled back and re-observed by a scanned recovery
  child with the exact captured tree restored;
- a metadata-only commit is re-observed by a scanned recovery child;
- a captured production commit killed after writer release is finished by a
  scanned recovery child to the exact committed reference tree;
- a captured production or synthetic holder killed while owning the writer lock
  and a production holder killed in the publication window both fail closed with
  `WRITER_BUSY` through a fresh recovery child, retaining the owner lock and
  unresolved transaction evidence and leaving the tree unchanged;
- a synthetic interrupted transaction is rolled back by a fresh single-recovery
  child (`rolled_back`, exact restored bytes, no owned residue).

The previous in-parent `recoverTransactions` calls and the helper wording that
described them as a separate process are corrected here.

## R2-3 / R2-5 — preserved coverage

The publication-witness (staged/canonical identity, changed/same-byte, missing,
replaced and edited witness), staging/durability ordering, replacement guards,
journal preparation, cleanup, release and recovery-prepublication/published
matrices are preserved unchanged and remain green. The default/custom
lifecycle, cohort, whole-tree and six resulting-consumer check/build/SSR stages
are preserved from the Q2/Q4 records.

## Per-checkpoint links

| Checkpoint | Production source                    | Executed cases                                                                               |
| ---------- | ------------------------------------ | -------------------------------------------------------------------------------------------- |
| S064       | `transaction-types`                  | `transaction-state`, `transaction-safety`                                                    |
| S065       | `transaction-journal`                | `transaction-journal`, `recovery-ownership`, `recovery-invalid`                              |
| S066       | `write-lock`                         | `write-lock`, `transaction-processes` (live holder), captured production held-writer refusal |
| S067       | `revalidate`, `authority`            | `revalidate`, `compose-authority`, `transaction-authority`, strict readset cases             |
| S068       | `stage`, `durability`                | `staging`, `durability-ordering`, `durability-flush-paths`                                   |
| S069       | `transaction-journal`                | `journal-preparation`, `recovery-prepublication`                                             |
| S070       | `replace`                            | `replacement`, `replacement-guards`, `recovery-prepublication`                               |
| S071       | `publish-lock`, `publication-intent` | `lock-publication`, `publication-witness`, `lock-projection`                                 |
| S072       | `transaction-cleanup`                | `transaction-cleanup`, `durability-flush-paths`, namespace-removal cases                     |
| S073       | `recovery`                           | `recovery-prepublication`, `recovery-invalid`, captured production restart matrix            |
| S074       | `recovery`                           | `recovery-published`, fresh single/scanned recovery child cases                              |
| S075       | `recovery`, `owned-ancestry`         | `recovery-ownership`, `recovery-invalid`, fail-closed held-writer child cases                |
| S076       | process helpers/tests                | `transaction-processes`, `cleanup-restart-matrix` fresh-child cases                          |
| S077       | `apply`                              | `guarded-composition`, `composed-lifecycle`, `projected-coherence`, six consumer stages      |

## Preserved exceptions and honestly unrun

- AC20's exactly two fixture-only upstream Bits 2.19.3 TS2590 declarations and
  the strict-17 declaration controls are preserved, not waived.
- The four reference Rust tests listed in the Q4 record remain ignored existing
  debt.
- Windows and a second physical cross-device host remain unexecuted; no
  device-dependent claim is made.
- Remote CI was not dispatched; the workflow file is validated locally with
  checksum-qualified actionlint.

## Disposition

All original S064–S077 checkpoints remain `committed_pending_review`; none is
self-accepted. S078 stays gated on independent Codex S077 acceptance.

## Integrated cumulative qualification

Environment: Node `v24.21.0`, pnpm `11.22.0`, macOS arm64 (Darwin 25.5),
single-volume host, TypeScript 6.0.3. Every lane below is a portable
repository-relative command run on candidate `70b57a4` with its raw output,
underlying exit and identity retained under the ignored
`implementation/evidence/logs/rcld04-return-20261005T191959Z/` tree. The
generated projection is unchanged by `--generate`.

| Lane                                                                        | Result                                      | Exit |
| --------------------------------------------------------------------------- | ------------------------------------------- | ---- |
| `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | up to date                                  | 0    |
| `pnpm run build`                                                            | built                                       | 0    |
| `pnpm run typecheck`                                                        | 0 errors across five configs                | 0    |
| `pnpm run format:check`                                                     | clean                                       | 0    |
| `pnpm run lint`                                                             | 0 warnings / 0 errors                       | 0    |
| `pnpm run test:unit`                                                        | 283 pass / 0 fail / 0 skip / 0 todo         | 0    |
| `pnpm run test:integration`                                                 | 504 pass / 0 fail / 0 skip / 0 todo         | 0    |
| `pnpm run test:registry`                                                    | 38 pass / 0 fail                            | 0    |
| `pnpm run test:cli-bootstrap`                                               | 52 pass / 0 fail                            | 0    |
| `pnpm run test:harness`                                                     | 37 pass / 0 fail                            | 0    |
| `pnpm run test:components`                                                  | 22 pass / 0 fail (strict declaration 17/17) | 0    |
| `pnpm run fixture:check`                                                    | 0 errors / 0 warnings                       | 0    |
| `pnpm run fixture:build`                                                    | built                                       | 0    |
| `pnpm run test:fixture`                                                     | 27 pass / 0 fail (six consumer stages)      | 0    |
| `pnpm run test:browser`                                                     | 23 pass / 0 fail                            | 0    |
| `node tools/check-contracts.mjs --generate`                                 | projection unchanged                        | 0    |
| `pnpm run check:contracts`                                                  | 0 error(s) / 0 warning(s)                   | 0    |
| `pnpm run test:contracts`                                                   | 137 pass / 0 fail                           | 0    |
| actionlint 1.7.12 on `.github/workflows/ci.yml`                             | no findings (shellcheck 0.11.0)             | 0    |
| reference `cargo fmt --all -- --check`                                      | clean                                       | 0    |
| reference `cargo check --workspace --all-targets`                           | finished                                    | 0    |
| reference `cargo test --workspace --all-targets`                            | 578 passed / 0 failed / 4 ignored           | 0    |

Actionlint provenance: archive `actionlint_1.7.12_darwin_arm64.tar.gz`, SHA-256
`aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f`; binary
SHA-256 `8db11704dc296f096216db4db65d86cd7f0ebfdf4c38453a1da276b137b88388`.
The read-only reference workspace stayed clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98` with its four known ignored tests.
