# Verification commands and known-good commits

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

#### Discover before executing

The authorized target is this repository. At S001 record Git root/status, authorized target/reference roots, package manager and lockfile, Node/Svelte/Bits/TS versions, package scripts, CI workflows, OS support, and any Cargo workspaces. Use `git status --short`, `git log -12 --pretty=%s`, manifest inspection, and existing instructions. Do not execute application config or install dependencies merely to enumerate it.

The plan uses the following **proposed command categories for a new target**, not claims that these scripts already exist. Establish actual scripts or map existing equivalents during bootstrap and record the mapping in the implementation evidence. Use the detected package manager rather than replacing its lockfile. Commands must execute meaningful checks; placeholder scripts that always succeed are prohibited.

| Category                          | Proposed invocation                                        | Required meaning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Documentation/contract validation | `node tools/check-contracts.mjs` (establish in S002)       | Validate repository contracts, links, checkpoint order and requirement coverage; allow truthful evolving implementation status. This does not verify product behavior.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Format                            | `pnpm run format:check`                                    | Nonmutating format check on scoped target code/docs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Lint                              | `pnpm run lint`                                            | Real configured TS/Svelte lint, no ignored new violations.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| CLI typecheck                     | `pnpm run typecheck`                                       | TypeScript compiler checks for Node CLI and tests.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Unit                              | `pnpm run test:unit -- <test-file>`                        | Build the product, then compile every discovered `tests/unit/*.test.ts` entry through an ephemeral configuration inside the ignored `.unit-test-build/` tree that extends `tsconfig.unit.json`, and run the selected files through the dependency-free Node runner. Discovery is deterministic and includes dot-prefixed names; invalid operands (absolute, parent-directory, symlinked roots/ancestors) fail closed; every selected file must yield a completed per-file summary with at least one executed passing test and no failure event, including TODO-marked ones. Explicit repository-relative operands control execution only; no globs. |
| Unit harness                      | `pnpm run test:harness`                                    | Focused regression suite for the unit runner itself (`tools/run-unit-tests.test.mjs`), covering empty/failed/skipped/TODO selections, imported and inline failure attribution, timeout cancellation, abnormal exit, stale-output and symlink-boundary guards, dot-name compilation agreement, and nested-runner isolation.                                                                                                                                                                                                                                                                                                                          |
| Integration                       | `pnpm run test:integration -- <test-file>`                 | Temporary filesystem/CLI/registry integration suite.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Registry                          | `pnpm run test:registry -- <test-file>`                    | Manifest/asset/schema/contract/export integrity.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Components                        | `pnpm run test:components -- <test-file>`                  | Generated wrapper typing and render/component semantics.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Consumer check                    | `pnpm run fixture:check`                                   | Real `svelte-check`/SvelteKit sync of generated app.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Consumer build                    | `pnpm run fixture:build`                                   | Real production SvelteKit build from generated app.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Browser                           | `pnpm run test:browser -- <test-file>`                     | Browser tests against generated app; runner file syntax discovered first.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| CLI build                         | `pnpm run build`                                           | Build actual executable and bundle/retain required assets.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Package                           | `pnpm pack --json`; `pnpm run test:package -- <test-file>` | Inspect and execute installed tarball outside authoring tree.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Diff health                       | `git diff --check`; `git diff --cached --check`            | Whitespace and final staged-content review.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

In early steps before a lane exists, execute the meaningful already available baseline plus the current step's direct validator. Add the lane and its real test in the same step that introduces that capability. Do not report an unavailable script as passed. Every step lists its direct lane; component steps also need the app's check/build where the feature affects generated output.

#### S002 projection field sources and evidence metadata

The S002 tooling is a derived projection, never an independent authority. Each
projected field has one documented source:

- `schemaVersion` is the validator's schema constant (`1`).
- `source` and `generator` are fixed descriptive literals.
- `sequences[].id`, `first`, `last`, `count`, `state` and `predecessor` come
  from the sequence-map table in `implementation/COMMIT_SEQUENCE.md`;
  `sequences[].title` comes from the matching `### RCLD-NN` heading.
- `steps[].id`, `title` and `requirements` come from the checkpoint definition
  headings and their `**Contract anchors:**` line (deduplicated and sorted);
  `steps[].sequence`, `dependsOn` and `status` come from the checkpoint ledger
  row.
- `steps[].completion` (`commit`, `report`, `review`) is derived from the
  structured `checkpoint-evidence` records in the conventional
  `implementation/evidence/<ID>_REPORT.md` and `<ID>_REVIEW.md` paths, and is
  `null` for any non-complete status.
- `references/SOURCES.json` fields (`id`, `label`, `url`, `boundary`) come from
  the plan's reference URL inventory table.

Completion evidence uses exactly one
`<!-- checkpoint-evidence {...} -->` record per report/review file with exactly
`schemaVersion`, `checkpoint`, `kind`, `commit`, `disposition`. Every live
opening marker establishes a present record attempt even without a closing
delimiter, and every attempt is counted and validated; an unterminated attempt
is malformed evidence in every lifecycle state. Records inside fenced literal
examples are not live records: fenced content contributes neither records nor
delimiters and cannot consume, terminate, repair or hide live metadata. A
non-fenced mention of the marker in prose or inline code is a live attempt, so
literal examples must be fenced.
Malformed JSON, non-object payloads, duplicate records and unterminated
attempts are rejected in every lifecycle state; an absent optional record is
different from a malformed present record. The authoritative state rules are:

| Ledger status                           | Report disposition | Review disposition  | Commit field         | Evidence requirement                                                                                                        |
| --------------------------------------- | ------------------ | ------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `not_started`, `in_progress`, `blocked` | `candidate`        | `changes_requested` | `null`               | Records optional; every present record must resolve to this checkpoint and kind                                             |
| `verified_uncommitted`                  | `implemented`      | `accepted`          | `null`               | Both records required; only Codex assigns this state and its acceptance                                                     |
| `complete`                              | `implemented`      | `accepted`          | matching full hashes | Both required, with the full lowercase 40-digit hash resolving to a HEAD-reachable commit that contains both evidence paths |

`steps[].completion` stays `null` until `complete`, and only a committed
completion unlocks a successor. Unapproved `not_applicable` fails closed.
Default validation is read-only; `--generate` and `--generate-sources` are the
only writing modes.

#### Cargo guard — applies to every commit step

If an authorized target or in-place reference worktree contains Cargo manifests, keep the applicable Rust baseline known-good. A TS-only change does not authorize Rust modifications. A read-only external reference that is unavailable locally can be recorded unavailable; it must not be falsely reported as tested. No Cargo manifest in target/reference scope means Cargo is N/A, with manifest inventory evidence.

For the reviewed Leptos workspace, known commands are:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

The source contribution contract explicitly names fmt/test; cargo check is added to honor the user's specification requirement. Run at the actual Rust workspace root, not the TypeScript package root. Baseline toolchain declares Rust 1.92.0 / edition 2024; respect actual rust-toolchain.toml and lockfiles rather than upgrading them as part of the port.

When specific Rust files are affected, run `cargo check -p <affected-crate> --all-targets` and `cargo test -p <affected-crate> --all-targets`, plus dependent/workspace tests justified by the change. Do not literally pass angle-bracket placeholders: discover actual crate IDs first. Full workspace check/test are the safe default if scope cannot be established. If Rust is present but untouched, run/check the baseline guard at each step; an unchanged verified hash can be noted as supporting evidence but is not a fresh executed test.

Run the existing lint lane discovered from repository instructions/CI. A proposed `cargo clippy --workspace --all-targets -- -D warnings` is not assumed baseline-green or newly required without discovery. Do not enable `--all-features` blindly: CSR, SSR, hydrate and render-neutral libraries have mutually constrained combinations. Discover feature names, targets and commands from Cargo manifests and fixtures and test valid combinations separately. Do not invent feature flags or install a target just to silence failure.

For Rust packaging/provenance/install changes, the known reference package lane is:

```sh
cargo package --workspace --allow-dirty --no-verify --locked
cargo test -p leptos_ui_kit_registry --test package_source \
  packaged_sources_build_with_cargo_vcs_provenance_outside_and_inside_hostile_git -- \
  --ignored --exact --nocapture
cargo test -p leptos_ui_kit_cli --test packaged_runtime \
  installed_binaries_run_after_package_source_and_build_state_are_deleted -- \
  --ignored --exact --nocapture
```

The ignored tests are not executed by the ordinary workspace suite. The source contribution notes require them from a clean Git worktree because dirty VCS metadata is rejected. Use an isolated clean worktree/staging flow when needed; do not clean/reset unrelated user work. Transaction changes in that workspace require Linux/macOS/Windows qualification. These Rust lanes are conditional on actual Rust scope, not a requirement to rewrite Rust for a Svelte product.

#### Per-step minimum

Run the current step's unit/integration checks, relevant type/lint/format checks, `git diff --check`, self-review, and the conditional Cargo guard. Generated output changes require consumer check/build; browser-affecting changes require scoped browser tests. Filesystem/packaging changes require their acceptance/fault lanes. Run full cumulative suites at milestone and final boundaries, not only snapshots of the latest item.

A new relevant test failure stops the next commit step. A demonstrably pre-existing/out-of-scope failure can be recorded without blocking unrelated safe work only with baseline evidence, impact reasoning and a named blocker; it cannot be called a passing lane or silently waived at release. Environmental blockers (network/compiler/browser unavailable) mean unverified, not successful.

#### Final verification

Regenerate fixtures with the packed CLI; install declared consumer dependencies explicitly; run all cumulative lanes, supported OS variants, SSR/hydration/browser scenarios, package-source-unavailable test, safety/recovery tests, and applicable Cargo guards. Inspect packed file inventory and consumer runtime imports. Update traceability with actual test file names and results. Do not publish or push as part of verification.
