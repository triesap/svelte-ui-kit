# RCLD03 review-5 repair evidence

Implementation evidence recorded by Pi for the owner-authorized `pfc through
RCLD-03` batch. This is a Pi-authored implementation record; it is **not**
independent acceptance. Codex owns acceptance and the S063/S064 gate.

## Scope

Completion of independent review 5 groups RCLD03-R5-1 through RCLD03-R5-4 on
top of the thirty-one `committed_pending_review` checkpoints S033–S063. The
thirty-two accepted S001–S032 checkpoints and the RCLD-01/RCLD-02 acceptance
provenance are unchanged.

## Ordered implementation commits

| Commit    | Area                                                             |
| --------- | ---------------------------------------------------------------- |
| `b57edf4` | R5-1 observed config/lock schema validation and dependency audit |
| `98c558a` | R5-2 managed-region ownership and foundation-token transitions   |
| `b64a8a4` | R5-3 retirement finalization, operation kinds and BOM handling   |
| `7d371e2` | R5-4 real root-barrel imports and planned-consumer check/build   |
| `7cffd8c` | R5-4 manifest-driven compound barrel generation                  |

### R5-1 — observed state and actual dependency evidence

- `add`/`sync` parse the observed `kit.json` and `kit.lock.json` through the
  real validators and conflict on invalid or unexplained mapping/state
  mismatches instead of ignoring malformed observed metadata.
- A supplied lock with no observed lock file is now a typed conflict: missing
  installed lineage cannot authorize ownership writes.
- `init` refuses to overwrite malformed observed configuration.
- The composed plan performs the actual upstream peer audit and keeps
  declaration, install, malformed-evidence and peer causes distinct and
  blocking, while a project with no `package.json` still has no fabricated
  evidence.

### R5-2 — ownership scoped to managed content

- The foundation `tokens` layer is only recognized when the stylesheet
  integration record proves ownership; arbitrary unowned `tokens` markers are a
  conflict.
- A clean minimal initialization now adopts identical validated registry
  `tokens` instead of conflicting.
- The exports integration baseline is computed over the managed region content,
  so application edits outside the markers no longer mark it customized.
- The whole-file stylesheet veto was removed; per-block lineage classifies
  managed blocks while every unmanaged byte is preserved.

### R5-3 — final retirement projection and operation kinds

- The lock stylesheet baseline is recomputed after CSS retirement and the lock
  is re-validated, so serialized evidence matches the applied bytes.
- `create`/`update`/`retire` are derived from actual observations for config,
  source and retirement writes.
- Retirement decoding preserves a byte-order mark.

### R5-4 — generated imports and consumer qualification

- Root-barrel references are resolved from supported relative, extension and
  `$lib` spellings using the actual Svelte script bodies, not whole-file text.
- Generated TypeScript re-exports use runtime `.js` specifiers accepted by the
  consumer's TypeScript check.
- The planned simple and compound consumers run the real Svelte/TypeScript
  check and production build, with a live negative type-error control.
- The installed-copy runner executes successful emitted planning with complete
  observations and the packaged validated registry outside the checkout.
- A compound item's directory barrel is generated from its part-targeting
  manifest exports; a pre-authored template is not trusted as generation
  evidence.

## Verification (this revision)

Run from the svelte-ui-kit worktree with Node 24.21.0 / pnpm 11.22.0 through the
configured build router unless noted.

| Lane                         | Result                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm install` frozen strict | exit 0, already up to date                                                                                                                             |
| `format:check` / `lint`      | exit 0                                                                                                                                                 |
| `typecheck`                  | exit 0                                                                                                                                                 |
| `test:unit`                  | 265 / 265                                                                                                                                              |
| `test:registry`              | 38 / 38                                                                                                                                                |
| `test:integration`           | 238 / 238 (includes new R5 regressions)                                                                                                                |
| `test:harness`               | 37 / 37                                                                                                                                                |
| `test:cli-bootstrap`         | 52 / 52                                                                                                                                                |
| `test:components`            | 22 / 22                                                                                                                                                |
| `test:fixture`               | 23 / 23                                                                                                                                                |
| `fixture:check`              | svelte-check 0 errors / 0 warnings                                                                                                                     |
| `test:browser`               | 23 / 23 chromium (fault and teardown controls)                                                                                                         |
| `check:contracts`            | 0 errors / 0 warnings                                                                                                                                  |
| `test:contracts`             | 127 / 127                                                                                                                                              |
| `actionlint 1.7.12`          | archive SHA-256 `aba9ced2...e6953f` verified; exit 0                                                                                                   |
| Reference `leptos_ui_kit`    | `cargo fmt` 0, `cargo check --workspace --all-targets` 0, `cargo test --workspace --all-targets` 0; 578 passed, 0 failed, 4 ignored (43 result blocks) |

The reference log has four explicitly ignored tests, none of which passed:

- `installed_binaries_run_after_package_source_and_build_state_are_deleted`
- `homepage_fixture_cli_workflow_smoke`
- `tests::every_transaction_io_fault_avoids_partial_application_state`
- `packaged_sources_build_with_cargo_vcs_provenance_outside_and_inside_hostile_git`

This report is standalone repository evidence and carries no operator routing or
coordination details.

## Remaining / not claimed

- This is implementation evidence only. Independent S063 acceptance and the
  S064 gate remain with Codex; no sequence gate is bypassed.
- The narrowly qualified upstream Bits 2.19.3 TS2590 strict-declaration
  exception remains release AC20 debt for the maintained fixture only.
- The per-checkpoint pending-review ledger hashes in
  `implementation/COMMIT_SEQUENCE.md` intentionally retain their original
  provenance; these cross-cutting repair commits are not re-pointed onto the
  S033–S063 ledger rows.
