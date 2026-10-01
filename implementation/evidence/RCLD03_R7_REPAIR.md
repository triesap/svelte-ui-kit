# RCLD03 review-7 repair evidence

Implementation evidence recorded by Pi for the owner-authorized `pfc through
RCLD-03` batch. This is a Pi-authored implementation record; it is **not**
independent acceptance. Codex owns acceptance and the S063/S064 gate.

## Scope

Completion of independent review 7 groups RCLD03-R7-1 through RCLD03-R7-3 on top
of the thirty-one `committed_pending_review` checkpoints S033–S063. The
thirty-two accepted S001–S032 checkpoints and the RCLD-01/RCLD-02 acceptance
provenance are unchanged. No original R01–R34, AC01–AC22 or checkpoint criterion
was changed.

## Ordered implementation commits

| Commit    | Area                                                                         |
| --------- | ---------------------------------------------------------------------------- |
| `ec7a014` | R7-1 one deeply immutable validated invocation boundary across init/add/sync |
| `88f0109` | R7-2 ownership/lifecycle lineage enforced through initialization             |
| `ea01f7e` | R7-3 complete-tree success/conflict qualification matrix                     |
| this      | R7-4 cumulative qualification and factual evidence reconciliation            |

### R7-1 — one validated, deeply immutable invocation boundary

- `src/project/immutable.ts` adds a recursive `deepFreeze` and a truly read-only
  `FrozenMap` (no `set`/`delete`/`clear`). `src/project/environment.ts` now
  deep-freezes the manifest, installed observations, manager evidence and issue
  arrays, and captures the S035 `detectDefaultProject` selection result at the
  same instant as the target bytes.
- `src/codegen/invocation.ts` composes the captured selected-project and
  package-manager rules into one read-only `validateInvocation` boundary. Both
  `planInit` and `planAdd` (and therefore `planSync`) call it before producing
  any executable plan, so an absent, malformed, non-SvelteKit or
  ambiguous-manager package is a logical failure with no executable writes.
- Positive fixtures were adapted to supported SvelteKit applications rather than
  preserving empty-directory exemptions. New regressions cover the four entry
  failures on all three commands, accepted default and static route mappings,
  rejected unsupported configuration, and deep-immutability/plan-stability under
  attempted mutation and later disk edits.

### R7-2 — ownership and lifecycle lineage through initialization

- `planInit` now preserves the recorded stylesheet integration contract and
  legitimate baseline instead of always declaring `foundation-tokens-v1` with
  the `TOKENS_BODY` hash. Aggregate `stylesheet-v1` bookkeeping, marker presence
  and byte equality can no longer reclaim a detached application-owned block.
- `planInit` preserves already-tracked managed blocks by their observed bodies
  and preserves an installed, baseline-matching export region verbatim, so
  initialization after installation is a clean `no_change` rather than a lossy
  rewrite. A customized export region still conflicts.
- New regressions cover init after installation, customization and retirement,
  clean foundation lineage, detached-token non-reacquisition, and a satisfied
  initialization replay.

### R7-3 — complete-tree qualification

- `tests/integration/plan-tree-qualification.test.ts` compares complete trees
  (bytes, modes, kinds, links, hidden and empty entries) around successful and
  intended-cause-conflicting init/add/sync plans. Conflict causes include
  invocation failures, source conflicts, unowned managed CSS/export regions,
  cohort conflicts and the detached-token lifecycle.
- Equivalent observations are proven to yield identical deterministic plan
  envelopes for init, add and sync; the planning modules are asserted to import
  neither `node:child_process` nor `node:fs`.

### R7-4 — evidence reconciliation and cumulative qualification

- `S063_REPORT.md` and `COMPATIBILITY.md` gained review-7 addenda; the R6 report's
  private routing reference was removed and its broader R6-4 claims are marked
  superseded by the review-7 evidence. Original pending hashes, structured
  statuses and Codex acceptance ownership are preserved.

## Verification (this candidate)

Run from the svelte-ui-kit worktree with Node `24.21.0` / pnpm `11.22.0`
through the configured build router; raw logs retained in
`implementation/evidence/logs/`. Every listed lane exited 0 with zero skips
unless stated.

| Lane                                                        | Result                                                                |
| ----------------------------------------------------------- | --------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile --strict-peer-dependencies` | exit 0, already up to date                                            |
| `pnpm run build` / `format:check` / `lint`                  | exit 0 / exit 0 / exit 0                                              |
| `pnpm run typecheck`                                        | exit 0                                                                |
| `pnpm run test:unit`                                        | 265 / 265                                                             |
| `pnpm run test:harness`                                     | 37 / 37                                                               |
| `pnpm run test:registry`                                    | 38 / 38                                                               |
| `pnpm run test:integration`                                 | 278 / 278 (was 255; +23 validated-entry/ownership/tree cases)         |
| `pnpm run test:cli-bootstrap`                               | 52 / 52                                                               |
| `pnpm run test:components`                                  | 22 / 22 (strict declaration 17 / 17, two qualified TS2590)            |
| `pnpm run fixture:check`                                    | svelte-check 0 errors / 0 warnings                                    |
| `pnpm run test:fixture`                                     | 23 / 23                                                               |
| `pnpm run test:browser`                                     | 23 / 23 chromium (fault and teardown controls)                        |
| `node tools/check-contracts.mjs --generate`                 | exit 0; `COMMIT_SEQUENCE.json` unchanged                              |
| `pnpm run check:contracts`                                  | 0 errors / 0 warnings                                                 |
| `pnpm run test:contracts`                                   | 127 / 127                                                             |
| `actionlint 1.7.12` (checksum-verified)                     | archive SHA-256 `aba9ced2…e6953f` verified; exit 0, shellcheck 0.11.0 |
| `leptos_ui_kit` reference guard                             | fmt 0, check 0, test 0; 578 passed, 0 failed, 4 ignored (43 blocks)   |

The four reference ignored tests — not executed, not passed — are
`installed_binaries_run_after_package_source_and_build_state_are_deleted`,
`homepage_fixture_cli_workflow_smoke`,
`tests::every_transaction_io_fault_avoids_partial_application_state` and
`packaged_sources_build_with_cargo_vcs_provenance_outside_and_inside_hostile_git`.

## Remaining / not claimed

- This is implementation evidence only. Independent S063 acceptance and the
  S064 gate remain with Codex; no sequence gate is bypassed.
- The narrowly qualified upstream Bits 2.19.3 TS2590 strict-declaration
  exception remains release AC20 debt for the maintained fixture only.
- The per-checkpoint pending-review ledger hashes in
  `implementation/COMMIT_SEQUENCE.md` intentionally retain their original
  provenance; these cross-cutting repair commits are not re-pointed onto the
  S033–S063 ledger rows.
