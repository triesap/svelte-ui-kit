# RCLD-03 independent review 8 repair evidence

Implementation evidence recorded by Pi for the owner-authorized `pfc through
RCLD-03` batch. This is a Pi-authored implementation record; it is **not**
independent acceptance. Codex owns acceptance and the S063/S064 gate.

## Scope

Completion of independent review 8 groups RCLD03-R8-1 through RCLD03-R8-3 on top
of the thirty-one `committed_pending_review` checkpoints S033–S063. The
thirty-two accepted S001–S032 checkpoints and the RCLD-01/RCLD-02 acceptance
provenance are unchanged. No original R01–R34, AC01–AC22 or checkpoint criterion
was changed, and every original pending hash, structured status and accepted
review is preserved.

## Ordered implementation commits

| Commit    | Area                                                                        |
| --------- | --------------------------------------------------------------------------- |
| `b122039` | R8-1/2/3 effective mapped planning, owned-content lifecycle and regressions |
| `5ef055d` | R8-3 intended-cause assertions for source/export conflicts                  |

The qualified candidate is `5ef055d17acd00cda9228acb287c180b7656a521`; the
evidence/qualification record in this file is updated separately.

## RCLD03-R8-1 — captured effective mapping across init/add/sync

- `src/project/environment.ts` now captures the bounded `_kit/kit.json`
  discovery (`discoverKitConfig`) at the same instant as the target bytes and
  the selected-package evidence, and deep-freezes it.
- `src/codegen/effective-config.ts` composes the captured selected-package
  detection with that discovery into one immutable `EffectiveConfig`:
  exactly one valid observed custom installation determines the mapping; a
  malformed, ambiguous, unsafe or location-mismatched discovery is a typed
  resolution failure; with no explicit configuration the statically detected
  SvelteKit routes directory determines the layout while the supplied UI/styles
  roots remain the desired configuration; and a valid explicit `kit.json`
  resolves the documented dynamic/unsupported routes case without executing
  Svelte configuration.
- `planInit`, `planAdd` and `planSync` resolve that mapping before planning and
  use it for every derived target, observation, retirement and final lock
  projection. A stale supplied default can no longer override an observed custom
  installation or plan an inactive default layout; an unobserved effective
  target is a typed failure/conflict, never a live read. `planSync` consumes the
  mapping resolved by the shared compose step (`base.value.effectiveConfig`).

Verified by `tests/integration/effective-mapping.test.ts`: fresh defaults,
static nondefault routes (actual planned layout path), stale default rejection,
observed custom installation over a stale default, incomplete custom
observation, explicit fallback for a dynamic routes config and its negative
control, malformed/ambiguous/location-mismatched discovery, and sync retirement
under the effective custom mapping. `tests/integration/invocation-boundary.test.ts`
now asserts the actual `src/views/+layout.svelte` plan. The exact-plan
planned-consumer qualification gained a supported nondefault mapping case
(`tests/integration/planned-consumer.test.ts`) that checks, builds and renders
through the active layout and exercises the emitted plan envelope.

## RCLD03-R8-2 — initialization refuses tracked missing owned content

- `planInit` inspects the managed blocks in the observed stylesheet and refuses
  any block the lock tracks (registry `cssBlocks` or the
  `foundation-tokens-v1` integration) but that is absent, with a causal
  `INIT_OWNERSHIP_CONFLICT`, zero executable writes and unchanged lineage. A
  genuinely empty present body stays distinct from an absent block.
- Regressions in `tests/integration/init-ownership.test.ts` cover a missing
  registry-owned block, a missing foundation block, an empty-but-present block,
  and the existing clean/customized/retired lifecycles.

## RCLD03-R8-3 — exact lifecycle state and behavioral no-writer proof

- `tests/helpers/apply.ts` adds one shared strict operation applier that enforces
  `create`/`update`/`retire` meaning and performs the real retirement before the
  next observation. `init-ownership`, `plan-tree-qualification`,
  `plan-composition` and `planner-lifecycle` use it.
- Intended-cause assertions replace bare `executable === false` checks for the
  unowned-CSS, unowned-export, cohort and detached-token conflicts.
- `tests/integration/planner-no-writer-control.mjs` runs the real planners in a
  child under Node's permission model with all filesystem writes and child
  processes denied; a clean exit plus an unchanged complete tree is behavioral
  evidence that planning starts no writer or package manager, supplementing the
  existing import-scan structure check.

## Verification (qualified candidate `5ef055d`, product code from `b122039`)

Run from this worktree with Node `24.21.0` / pnpm `11.22.0` through the
configured build router. Complete raw logs are retained (git-ignored) under
`implementation/evidence/logs/r8-20261002/`; underlying exits are recorded in
`implementation/evidence/logs/r8-20261002/exits.log`. Every listed lane exited 0
with zero skips unless stated.

| Lane                                                        | Log file                                     | Result                                          |
| ----------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------- |
| `pnpm install --frozen-lockfile --strict-peer-dependencies` | `r8-20261002/install.log`                    | exit 0                                          |
| `pnpm run build`                                            | `r8-20261002/build.log`                      | exit 0                                          |
| `pnpm run format:check`                                     | `r8-20261002/format-check.log`               | exit 0                                          |
| `pnpm run lint`                                             | `r8-20261002/lint.log`                       | exit 0                                          |
| `pnpm run typecheck`                                        | `r8-20261002/typecheck.log`                  | exit 0                                          |
| `pnpm run test:unit`                                        | `r8-20261002/unit.log`                       | 265 / 265                                       |
| `pnpm run test:harness`                                     | `r8-20261002/harness.log`                    | 37 / 37                                         |
| `pnpm run test:registry`                                    | `r8-20261002/registry.log`                   | 38 / 38                                         |
| `pnpm run test:integration`                                 | `r8-20261002/integration.log`                | 294 / 294                                       |
| `pnpm run test:cli-bootstrap`                               | `r8-20261002/cli-bootstrap.log`              | 52 / 52                                         |
| `pnpm run test:components`                                  | `r8-20261002/components.log`                 | 22 / 22 (strict declaration 17 / 17, 2 TS2590)  |
| `pnpm run fixture:check`                                    | `r8-20261002/fixture-check.log`              | svelte-check 0 errors / 0 warnings              |
| `pnpm run test:fixture`                                     | `r8-20261002/test-fixture.log`               | 23 / 23                                         |
| `pnpm run test:browser`                                     | `r8-20261002/test-browser.log`               | 23 / 23 chromium                                |
| `node tools/check-contracts.mjs --generate`                 | `r8-20261002/contracts-generate.log`         | exit 0; `COMMIT_SEQUENCE.json` unchanged        |
| `pnpm run check:contracts`                                  | `r8-20261002/check-contracts.log`            | 0 errors / 0 warnings                           |
| `pnpm run test:contracts`                                   | `r8-20261002/test-contracts.log`             | 127 / 127                                       |
| `actionlint 1.7.12` (checksum-verified)                     | `r8-20261002/workflow-actionlint.log`        | exit 0; shellcheck 0.11.0; no findings          |
| `leptos_ui_kit` reference guard (fmt/check/test)            | `r8-20261002/reference-{fmt,check,test}.log` | exit 0 / 0 / 0; 578 passed, 0 failed, 4 ignored |

`actionlint` ran from the v1.7.12 darwin/arm64 release archive with SHA-256
`aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f`, matching
the published checksum, against `.github/workflows/ci.yml`.

The reference worktree was clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98`; no reference mutation occurred. The
four ignored reference tests were not executed and are not claimed as passed:
`installed_binaries_run_after_package_source_and_build_state_are_deleted`,
`homepage_fixture_cli_workflow_smoke`,
`tests::every_transaction_io_fault_avoids_partial_application_state` and
`packaged_sources_build_with_cargo_vcs_provenance_outside_and_inside_hostile_git`.

## Historical-evidence correction

The review-7 report referenced author commands writing `/tmp/run-*.log` and
`/tmp/ref-*.log`; those files are no longer present and no current repository
copies existed. No historical log is attributed to this candidate. The complete
review-8 lanes are retained only at the `implementation/evidence/logs/r8-20261002/`
paths cited above.

## Remaining / not claimed

- Pi implementation evidence only. Independent S063 acceptance and the S064 gate
  remain with Codex; no sequence gate is bypassed.
- S001–S032 stay accepted; S033–S063 stay `committed_pending_review`;
  S064–S203 stay `not_started`.
- Release AC20's narrowly qualified fixture-only Bits 2.19.3 TS2590 declaration
  exception remains open debt.
- The per-checkpoint pending-review ledger hashes in
  `implementation/COMMIT_SEQUENCE.md` intentionally retain their original
  provenance; these cross-cutting repair commits are not re-pointed onto the
  S033–S063 ledger rows.
