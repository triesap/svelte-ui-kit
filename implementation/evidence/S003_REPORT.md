# S003 step report — Select a reproducible Node and dependency baseline

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S003","kind":"report","commit":"91cdaaefd756021b343465f7ba7dd3afe2f71b6d","disposition":"implemented"}
-->

Step ID and title: S003 — Select a reproducible Node and dependency baseline.
Contract/requirement IDs: R01, R10, R12, R20, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`).
Actual target root and branch: this repository (`.`) on branch `master`.
Starting commit / baseline status:
`9ed224f60249ee67732c05737170436e06301c38` (`master`, S002 complete). The
working tree already held four expected unstaged Codex post-commit bookkeeping
updates (`implementation/COMMIT_SEQUENCE.md`, `implementation/COMMIT_SEQUENCE.json`,
`implementation/evidence/S002_REPORT.md`, `implementation/evidence/S002_REVIEW.md`);
they were preserved unchanged.

Author/provider: Pi, provider `ollama`, model `deepseek-v4.1-flash:cloud`.
Runtime used for target tooling: process-local Node `24.21.0` with
`pnpm 11.22.0`. Runtime selection was process-local only; no global tool or
package-manager configuration was changed.
Codex reconciliation: S003 is accepted and complete at
`91cdaaefd756021b343465f7ba7dd3afe2f71b6d`. See `S003_REVIEW.md`. The real
hash was recorded after the commit without amending history; these factual
updates travel with S004. Author observations below describe the submission
before Codex's acceptance bookkeeping. S004 is now authorized.

## Implemented

Exact behavior added or changed: S003 pins the approved reproducible development
baseline. It records the Node runtime in `.node-version`, adds the eight
approved npm packages as exact `devDependencies`, regenerates the pnpm lockfile
by a real installation, and records compatibility evidence. No product code, CLI
boundary, consumer scaffold, runtime/peer facade or auto-install was added.

Files changed or added and purpose:

| Path                                       | Change                                                                                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.node-version`                            | New. Records exact development runtime `24.21.0`.                                                                                                         |
| `package.json`                             | Adds eight exact `devDependencies`; every other field is unchanged (`private`, ESM, license, name, repository, scripts, `packageManager`, engine `>=24`). |
| `pnpm-lock.yaml`                           | Regenerated for the eight direct packages and their transitive closure; `lockfileVersion: '9.0'` and existing settings preserved.                         |
| `implementation/evidence/COMPATIBILITY.md` | New. Dated registry/engine/peer evidence, install determinism, smoke checks and role separation.                                                          |
| `implementation/evidence/S003_REPORT.md`   | This report.                                                                                                                                              |

Unchanged as required: `pnpm-workspace.yaml` (root-only membership), the four
existing scripts, `packageManager: pnpm@11.22.0`, `private: true`, `type:
module`, license `(MIT OR Apache-2.0)` and `engines.node: ">=24"`. No package
was added to `dependencies` or `peerDependencies`. No `.npmrc` or other
package-manager configuration was introduced.

Preserved Codex governance updates (carried through unchanged in intent): the
S003 dispatch in `implementation/COMMIT_SEQUENCE.md`, the S002 accepted hash and
the S002 report/review records including Codex's `accepted` verdict. The
Markdown projection already agrees with `implementation/COMMIT_SEQUENCE.json`
(S003 `in_progress`, null commit), so regeneration was not required; the
projection still validates read-only.

### Selected and resolved baseline

| Selected                     | Version   |
| ---------------------------- | --------- |
| Node (`.node-version`)       | `24.21.0` |
| pnpm                         | `11.22.0` |
| prettier                     | `3.9.6`   |
| svelte                       | `5.57.1`  |
| @sveltejs/kit                | `2.70.3`  |
| bits-ui                      | `2.19.3`  |
| typescript                   | `6.0.3`   |
| vite                         | `8.3.1`   |
| @sveltejs/vite-plugin-svelte | `7.3.1`   |
| @internationalized/date      | `3.12.4`  |
| @types/node                  | `24.19.0` |

Full declared engines, exact peer ranges, optional-peer flags, transitive peer
resolutions and unused optional peers are recorded in
`implementation/evidence/COMPATIBILITY.md`.

## Verified

All mutating dependency/verification commands ran under process-local Node
`24.21.0`, following the required environment diagnostics and command routing.

| Step | Command (working directory = this package root)                                   | Exit | Result                                                                                            |
| ---- | --------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------- |
| 0    | `node --version` / `pnpm --version` (process-local Node 24.21.0)                  | 0    | `v24.21.0` / `11.22.0`                                                                            |
| 1    | Required environment diagnostics                                                  | 0    | Green; actual diagnostic retried after unavailable timeout utility                                |
| 2    | initial lock-generating `pnpm install --engine-strict --strict-peer-dependencies` | 0    | Eight devDependencies added; resolved 92 / installed 67 packages; no peer warnings                |
| 3    | `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict`       | 0    | `Already up to date`; `package.json` and `pnpm-lock.yaml` bytes unchanged                         |
| 4    | temporary package-entry/compiler probe with `node`                                | 0    | All entries resolve; `svelte/compiler` 5.57.1, `typescript` 6.0.3, `vite` 8.3.1, `prettier` 3.9.6 |
| 5    | `pnpm run check:contracts`                                                        | 0    | `contract validation: 0 error(s), 0 warning(s)`                                                   |
| 6    | `pnpm run test:contracts`                                                         | 0    | `tests 83`, `pass 83`, `fail 0`, `skipped 0`                                                      |
| 7    | `pnpm run format:check`                                                           | 0    | All matched files use Prettier code style                                                         |
| 8    | `git diff --check` / `git diff --cached --check`                                  | 0    | No whitespace diagnostics; nothing staged                                                         |

Install determinism (SHA-256): `package.json` changed from
`5cc02dbe…` to `3d313d4f639b03164efac186ef7968db5c6e0155f13c18c5e1b6016c8f16e0ab`;
`pnpm-lock.yaml` changed from `c5a3a699…` to
`81b9ba06e6fc68932d6cdc83fb33c175f139828c62d36b9cf9bedeaab54a3dff`; the frozen
install left both unchanged. `pnpm-workspace.yaml`
(`226909e7…`) is unchanged.

Tests added/updated: none. S003 adds no product test; it exercises the existing
S002 contract suite unchanged and adds the compatibility evidence document.

Generated-app/type/build/browser/package checks: not applicable at S003. No
consumer scaffold, build lane, typecheck/lint script or package acceptance
exists yet; none is claimed as passing. The temporary compiler probe is a
resolution/compiler smoke check, not a rendering or SSR test.

Cargo checks: the target has no Cargo manifest, so target Cargo is N/A with
manifest-inventory evidence. The conditional **reference** guard was executed
fresh in the authorized worktree:

| Step | Reference command (clean worktree at `a10fbf06334f4648f5755e05a7147414e4e5fc98`) | Exit | Result                                                              |
| ---- | -------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------- |
| R1   | `cargo fmt --all -- --check`                                                     | 0    | No diffs                                                            |
| R2   | `cargo check --workspace --all-targets`                                          | 0    | Finished successfully                                               |
| R3   | `cargo test --workspace --all-targets`                                           | 0    | 562 top-level plus 16 nested subprocess passes, 0 failed, 4 ignored |

The reference worktree was verified clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98` before and after the guard; no
reference source was changed. The four ignored reference tests are
`installed_binaries_run_after_package_source_and_build_state_are_deleted`,
`homepage_fixture_cli_workflow_smoke`,
`tests::every_transaction_io_fault_avoids_partial_application_state`, and
`packaged_sources_build_with_cargo_vcs_provenance_outside_and_inside_hostile_git`.
They remain ignored and are not claimed as executed. The aggregate 578 counts
16 nested subprocess executions separately from 562 top-level passes; it does
not mean 578 distinct top-level tests. Codex inspected this fresh Pi execution
and confirmed the reference HEAD and clean status; Codex did not rerun Rust.

Ignored/skipped tests in the target suite: none (83 pass, 0 skipped).

Self-review and staged-diff findings:

- `package.json` diff is exactly the `devDependencies` block; all other keys are
  byte-identical.
- The lockfile importer declares exactly nine `devDependencies` and no importer
  `dependencies` block, so no peer was silently promoted into the package's own
  declarations by `autoInstallPeers`.
- `--strict-peer-dependencies` passed on both installs with no suppressed
  warnings; only genuinely optional peers are unresolved and each is explained
  in COMPATIBILITY.md.
- No dependency build script was needed; none was enabled.
- `.node-version` is a dotfile, which Prettier's directory expansion skips; this
  matches the existing `.editorconfig`/`.prettierrc.json` treatment.
- Codex's four bookkeeping files remain modified but unedited by this step.

## Exceptions

Codex reconciled failures against the actual session log. Two smoke attempts
exited `1`: the first ran outside package resolution scope and could not find
the dependencies; the second read the plugin's unexported `package.json`
subpath. The corrected probe passed. Earlier failures were overwritten in the
author's smoke log but remain visible in the session history. Also, the first
environment-diagnostic invocation used an unavailable timeout utility; the
direct diagnostic subsequently passed. Explicit formatting of `.node-version`
exited `2` because Prettier has no inferred parser; its exact single-line
content was inspected instead. These are probe/environment limitations, not
passing checks or dependency defects. Keep separate attempt logs in later work.

Unverified behavior and release impact: consumer install/build, SSR/hydration,
component rendering, date components, typed primitive boundary and package
acceptance remain unverified by design and are scheduled later (S004 onward).
Passing installation and a compiler probe do not prove those behaviors.

Deviations with record ID and repository evidence: none. No deviation was
required; every approved choice resolved cleanly. No `not_applicable` scope was
introduced.

Unresolved issues: none blocking. The S005 test-isolation limitation recorded in
`implementation/evidence/S002_REVIEW.md` is unchanged and intentionally not
addressed here; the target suite and any rehearsals were run sequentially.

## Commit and next action

Actual commit hash: `91cdaaefd756021b343465f7ba7dd3afe2f71b6d`; structured
evidence is `implemented`. Codex accepted and committed S003 after independent
verification. Commit message:
`build: pin the initial tooling and primitive baseline`.

Requirements/test evidence updated: compatibility record, this report and
Codex's independent review. Codex reconciled the governing ledger/projection
and prepared the S004 dispatch after review; no product contract was changed.

Next step ID: S004 — Create a minimal typed CLI build boundary. It is authorized
by the governing Codex dispatch after the accepted S003 commit.

Is the next step safe to begin? Yes, under the complete S004 dispatch. Codex
recorded the accepted S003 commit and activated S004; no S004 implementation
was performed during this review.

### Decisions requiring Codex

None. All S003 choices were pre-approved by the dispatch and resolved without a
substitution or incompatibility. There is no unresolved decision for Codex
beyond the ordinary independent acceptance review.
