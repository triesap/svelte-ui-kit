# RCLD03 review-6 repair evidence

Implementation evidence recorded by Pi for the owner-authorized `pfc through
RCLD-03` batch. This is a Pi-authored implementation record; it is **not**
independent acceptance. Codex owns acceptance and the S063/S064 gate.

## Scope

Completion of independent review 6 groups RCLD03-R6-1 through RCLD03-R6-4 on top
of the thirty-one `committed_pending_review` checkpoints S033–S063. The
thirty-two accepted S001–S032 checkpoints and the RCLD-01/RCLD-02 acceptance
provenance are unchanged.

## Ordered implementation commits

| Commit      | Area                                                                            |
| ----------- | ------------------------------------------------------------------------------- |
| `6ec7262`   | R6-1/2/3 validated invocation evidence, truthful token ownership, layout render |
| this commit | R6-4 complete purity coverage and factual evidence reconciliation               |

### R6-1 — validated invocation boundary

- `init` requires a validated registry snapshot and derives its registry
  identity from it; a supplied scalar version/hash is refused as
  `INIT_REGISTRY_UNVERIFIED`, never trusted.
- `init` reconciles a valid observed `kit.json` mapping before planning, so a
  custom `stylesDir`/`uiDir`/`layoutFile` is honored rather than overwritten by
  supplied defaults. A snapshot captured for different paths fails with
  `INIT_OBSERVATION_INCOMPLETE`.
- `captureSnapshot` captures one immutable dependency/manager environment
  (selected manifest, resolved installed metadata for every enumerable
  resolution-context name, and detected package-manager evidence). `add`/`sync`
  derive declared/installed/peer readiness and installation instructions from
  that captured evidence rather than re-reading the live filesystem, so an
  unrelated live edit can no longer change the plan. Dependency resolution
  reads (which follow pnpm/hoisted links) stay separate from the generated-target
  ancestry permissions in `snapshot.ts`.

### R6-2 — truthful foundation token ownership

- The versioned stylesheet integration `contract` field distinguishes explicit
  `foundation-tokens-v1` ownership of the minimal foundation tokens body (its
  baseline hashes that exact owned body) from aggregate `stylesheet-v1`
  bookkeeping that grants no tokens ownership by itself. No schema field,
  tombstone, implicit catalog item or migration feature was added.
- A tracked missing foundation block conflicts instead of being silently
  restored.
- A customized registry `tokens` block retired from the closure stays detached
  application-owned text: re-adding an identical incoming body conflicts and the
  original bytes are never deleted.
- A clean registry `tokens` retirement establishes the required minimal
  foundation once within the same plan, and a replay is a satisfied
  `no_change`.
- A preserved customized foundation keeps its legitimate baseline instead of
  adopting the local bytes.
- Registry-owned `tokens` retain ordinary `cssBlocks` item lineage; a clean
  foundation transfers to a registry item within one plan and a customized one
  conflicts.

### R6-3 — preserve rendered applications

- An absent layout is materialized as a valid minimal Svelte 5 passthrough with
  `children` rendering and the ordered stylesheet imports, for both `init` and
  `add` initialization prerequisites.
- An existing layout keeps its exact rendering/snippet behavior and only
  receives missing imports; rendering is never appended by guess.
- Planned simple and compound consumers now assert visible page SSR output from
  the actual production handler in addition to `check`/`build`, with a
  missing-child-rendering negative control that fails for absent page content
  (not merely HTTP status).

### R6-4 — purity coverage and factual evidence

- The sync purity conflict fixture now writes its supplied lock into the
  observed tree so it reaches the intended B/L/I source conflict without an
  unrelated missing-lock metadata conflict.
- Complete-tree init/add/sync cases cover hidden/empty directories, modes,
  kinds, links and deterministic envelopes, and assert no writer or package
  manager work.
- Factual report bodies, `COMPATIBILITY.md` and implementation progress were
  reconciled while preserving the original pending commit hashes, structured
  statuses and Codex acceptance ownership. The retained reference log totals
  578 passed / 0 failed / 4 ignored; all four ignored tests are recorded
  explicitly and none is claimed as passed.
- Independent review 7 subsequently found this R6-4 purity coverage incomplete:
  the captured environment was only shallow-frozen and executable plans could
  still bypass selected-project evidence, and the complete-tree success/conflict
  matrix did not cover every command. The review-7 candidate
  (`implementation/evidence/RCLD03_R7_REPAIR.md`) completes that work; where the
  claims here and in `S063_REPORT.md`/`COMPATIBILITY.md` were broader than the
  review-6 evidence, the review-7 addenda are authoritative.

## Verification (this candidate)

Run from the svelte-ui-kit worktree with Node `24.21.0` / pnpm `11.22.0`
through the configured build router unless noted. Raw logs are retained in
`implementation/evidence/logs/`.

| Lane                         | Result                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm install` frozen strict | exit 0, already up to date                                                                                                                             |
| `format:check` / `lint`      | exit 0                                                                                                                                                 |
| `typecheck`                  | exit 0                                                                                                                                                 |
| `test:unit`                  | 265 / 265                                                                                                                                              |
| `test:harness`               | 37 / 37                                                                                                                                                |
| `test:registry`              | 38 / 38                                                                                                                                                |
| `test:integration`           | 255 / 255 (includes new lifecycle, evidence and SSR controls)                                                                                          |
| `test:cli-bootstrap`         | 52 / 52                                                                                                                                                |
| `test:components`            | 22 / 22 (strict declaration 17 / 17, two qualified TS2590)                                                                                             |
| `test:fixture`               | 23 / 23                                                                                                                                                |
| `fixture:check`              | svelte-check 0 errors / 0 warnings                                                                                                                     |
| `test:browser`               | 23 / 23 chromium (fault and teardown controls)                                                                                                         |
| `check:contracts`            | 0 errors / 0 warnings                                                                                                                                  |
| `test:contracts`             | 127 / 127                                                                                                                                              |
| `actionlint 1.7.12`          | archive SHA-256 `aba9ced2...e6953f` verified; exit 0                                                                                                   |
| Reference `leptos_ui_kit`    | `cargo fmt` 0, `cargo check --workspace --all-targets` 0, `cargo test --workspace --all-targets` 0; 578 passed, 0 failed, 4 ignored (43 result blocks) |

The four reference ignored tests are
`installed_binaries_run_after_package_source_and_build_state_are_deleted`,
`homepage_fixture_cli_workflow_smoke`,
`tests::every_transaction_io_fault_avoids_partial_application_state` and
`packaged_sources_build_with_cargo_vcs_provenance_outside_and_inside_hostile_git`.
They were not executed.

## Remaining / not claimed

- This is implementation evidence only. Independent S063 acceptance and the
  S064 gate remain with Codex; no sequence gate is bypassed.
- The narrowly qualified upstream Bits 2.19.3 TS2590 strict-declaration
  exception remains release AC20 debt for the maintained fixture only.
- The per-checkpoint pending-review ledger hashes in
  `implementation/COMMIT_SEQUENCE.md` intentionally retain their original
  provenance; these cross-cutting repair commits are not re-pointed onto the
  S033–S063 ledger rows.
