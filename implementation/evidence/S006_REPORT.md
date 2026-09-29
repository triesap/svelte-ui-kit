# S006 step report — Add nonmutating formatting and lint gates

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S006","kind":"report","commit":null,"disposition":"implemented"}
-->

Step ID and title: S006 — Add nonmutating formatting and lint gates.
Codex review 2 accepts the completed S006-R1 correction. See
`implementation/evidence/S006_REVIEW.md` and the governing correction dispatch.
The checkpoint is verified and awaiting its authorized commit; S007 stays
locked until that commit. Earlier candidate statements below describe the
author's return, not the current independent disposition.
Contract/requirement IDs: R17, R29, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/`).
Actual target root and branch: this repository (`.`) on branch `master`.
Starting commit / baseline status:
`5cf149106fbc7c9fb20eca1f31a0e5b08aff4b11` (`master`, S005 complete and
accepted). The working tree already held the four expected unstaged Codex
post-commit bookkeeping files (`implementation/COMMIT_SEQUENCE.md`,
`implementation/COMMIT_SEQUENCE.json`, `implementation/evidence/S005_REPORT.md`,
`implementation/evidence/S005_REVIEW.md`); they were preserved unchanged, with
their accepted S005 hash and dispositions intact.

Author/provider: Pi, provider `ollama`, model `deepseek-v4.1-flash:cloud`.
Runtime used for target tooling: process-local Node `24.21.0` with
`pnpm 11.22.0`, using the required execution routing after a successful
environment diagnostic (exit 0). No global tool or package-manager
configuration was changed.

## S006-R1 correction — recursive reserved-output exclusions

Correction period: fresh Pi session, provider `ollama`, model
`deepseek-v4.1-flash:cloud`, Node `24.21.0` / pnpm `11.22.0`, using the
required execution routing after a successful environment diagnostic (exit 0).

Codex review 1 found that the initial ESLint global-ignore block used
configuration-root-only directory patterns, so a defect under a _nested_
`dist/`, `build/`, `.svelte-kit/`, `coverage/` or `.pnpm-store/` directory was
still linted, while Prettier's equivalent `.prettierignore` patterns already
matched at any depth. The correction makes the reserved output/dependency
exclusions recursive and extends the typed tooling suite to prove it. The
initial claims in the rest of this report remain as recorded; this section
supersedes them only where the changed configuration/test results differ.

### R1 mapping

| R1 requirement                      | Implementation                                                                                                                                                          | Regression case                                                                                                                                                                                                                                                   |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recursive reserved-output ignores   | `eslint.config.mjs` global `ignores` now uses `**/node_modules/`, `**/.pnpm-store/`, `**/dist/`, `**/build/`, `**/.svelte-kit/`, `**/coverage/`, `**/.unit-test-build/` | `reserved output and dependency trees are excluded at root and nested depths` writes a combined lint/format defect under each of the seven names at root, one nested level, and a deeper level beneath maintained consumer source; both real scripts must exit 0. |
| Preserve rooted boundaries and logs | `tests/fixtures/generated/`, `implementation/evidence/logs/` and `**/*.log` are unchanged                                                                               | the same case writes probes under both rooted boundaries (including a nested level) and asserts both real scripts exit 0.                                                                                                                                         |
| Maintained source still checked     | No ignore was broadened to consumer, tests, registry or source trees; browser globals still cover `tests/fixtures/consumer/**/*.ts`                                     | `maintained consumer and registry source still fail for intended diagnostics and restore green` writes TS and Svelte defects under `registry/components/` and `tests/fixtures/consumer/src/`.                                                                     |
| Prettier boundary preserved         | `.prettierignore` is unchanged                                                                                                                                          | the recursive probes already passed Prettier before the fix and still exit 0; asserted by the reservation case.                                                                                                                                                   |
| `svelte/valid-compile: error` kept  | The rule and all seven exact pins, presets, globals and existing assertions are unchanged                                                                               | existing Svelte a11y/compiler cases plus the maintained-source Svelte `a11y_missing_attribute` case.                                                                                                                                                              |
| Snapshot preservation               | `assertPreserved` compares the full recursive fixture tree, hidden sentinels, link targets and the unrelated external app                                               | both new cases snapshot before/after success and failure; the existing preservation case is retained.                                                                                                                                                             |

The seven names at every depth and the maintained-source negatives are proven
in `tests/unit/tooling.test.ts` (two new `node:test` cases, nine total).

### R1 negative control

Reverting only the seven ignore patterns to their root-only forms made the
explicit tooling run exit 1, failing at
`lint reserved output probes: expected exit 0`; restoring the recursive
configuration returned exit 0 with 9/9 passing. The configuration bytes were
restored identically (sha256
`056e3a0debc0d222749dd0804609f6943db2acef1617c75a573dc61963958e44`). Log:
`s006-r1-negative-regression.log`.

### R1 correction gate results

All mutating commands ran under the same Node/pnpm runtime and routing as the
initial period. Exits are real process exits.

| Step                      | Command                                                                     | Exit | Result                                                     |
| ------------------------- | --------------------------------------------------------------------------- | ---- | ---------------------------------------------------------- |
| Frozen strict install     | `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | 0    | `Already up to date`; strict peers/engines satisfied       |
| Lint                      | `pnpm run lint`                                                             | 0    | `eslint . --max-warnings 0`; no findings                   |
| Format check              | `pnpm run format:check`                                                     | 0    | All matched files use Prettier code style                  |
| Typecheck                 | `pnpm run typecheck`                                                        | 0    | `tsconfig.json` and `tsconfig.unit.json` clean             |
| Build                     | `pnpm run build`                                                            | 0    | `dist/cli/main.js`                                         |
| Unit (default discovery)  | `pnpm run test:unit`                                                        | 0    | 2 files; `tests 14`, `pass 14`, `fail 0`, `skipped 0`      |
| Unit (explicit S006 file) | `pnpm run test:unit -- tests/unit/tooling.test.ts`                          | 0    | 1 file; `tests 9`, `pass 9`, `fail 0`, `skipped 0`         |
| Unit harness              | `pnpm run test:harness`                                                     | 0    | `tests 29`, `pass 29`, `fail 0`, `skipped 0`               |
| CLI smoke                 | `pnpm run test:cli-bootstrap`                                               | 0    | `tests 41`, `pass 41`, `fail 0`, `skipped 0`               |
| Contract validation       | `pnpm run check:contracts`                                                  | 0    | `0 error(s), 0 warning(s)`                                 |
| Contract tests            | `pnpm run test:contracts`                                                   | 0    | `tests 84`, `pass 84`, `fail 0`                            |
| Whitespace (unstaged)     | `git diff --check`                                                          | 0    | No diagnostics                                             |
| Whitespace (staged)       | `git diff --cached --check`                                                 | 0    | No diagnostics; nothing staged                             |
| Negative regression       | root-only patterns + explicit tooling run                                   | 1    | Reproduced the nested-output failure; config then restored |
| Restored regression       | recursive patterns + explicit tooling run                                   | 0    | 1 file; `tests 9`, `pass 9`, `fail 0`                      |

Correction logs (gitignored): `s006-r1-install.log`, `s006-r1-lint.log`,
`s006-r1-format-check.log`, `s006-r1-typecheck.log`, `s006-r1-build.log`,
`s006-r1-unit-default.log`, `s006-r1-unit-tooling.log`, `s006-r1-harness.log`,
`s006-r1-cli-bootstrap.log`, `s006-r1-contracts-check.log`,
`s006-r1-contracts-test.log`, `s006-r1-diff-check.log`,
`s006-r1-diff-cached-check.log`, `s006-r1-negative-regression.log`,
`s006-r1-nonmutation.log`, `s006-r1-nonmutation-entries.log`.

### R1 real-tree nonmutation

All 70 tracked/untracked authoring entries present before the correction plus
Codex's `implementation/evidence/S006_REVIEW.md` (71 entries) were snapshotted
with mode, size, sha256 and symlink target before and after the real
`pnpm run lint` and `pnpm run format:check`. Every entry was byte- and
mode-identical and the porcelain status was unchanged. The previously missing
untracked authoring entries (`eslint.config.mjs`, `tests/unit/tooling.test.ts`,
`implementation/evidence/S006_REPORT.md`, `implementation/evidence/S006_REVIEW.md`)
are included. Evidence: `s006-r1-nonmutation-entries.log`,
`s006-r1-nonmutation.log`.

### R1 reference reuse

The `leptos_ui_kit` reference worktree was verified clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98` with no source changes. Identity,
Rust scope and the audited evidence are unchanged, so the audited S006
fmt/check/test guard evidence is cited without another Rust run for this
same-checkpoint configuration/test correction. No new Rust result is claimed.

## Implemented

S006 adds the authoring lint and nonmutating format gates without changing
product behavior. It pins the seven approved exact development dependencies,
introduces the flat ESLint configuration, adds the Svelte formatter plugin,
scopes both tools to maintained authoring inputs, repairs the real
current-source violations the presets exposed, and adds a disposable-fixture
tooling regression suite. It does not scaffold S007's consumer app, change the
S004 CLI or S005 runner/contract semantics, or add a runtime/consumer
dependency.

Files changed or added and purpose:

| Path                                     | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                           | Adds the `lint` script (`eslint . --max-warnings 0`) and the seven approved exact `devDependencies` pins; all nine existing pins, name/version/private/license/ESM/engines/packageManager and root-only workspace membership are preserved.                                                                                                                                                                                                                                                                    |
| `pnpm-lock.yaml`                         | Regenerated by a normal install for the seven new pins; no other dependency or importer change.                                                                                                                                                                                                                                                                                                                                                                                                                |
| `eslint.config.mjs`                      | New ESM flat config: JS/TS/Svelte recommended presets, Prettier conflict presets, actual TypeScript parser in Svelte `<script>`, `svelte/valid-compile` for compiler/accessibility diagnostics, scoped Node/browser globals, and recursive reserved-output/dependency ignores (`**/node_modules/`, `**/.pnpm-store/`, `**/dist/`, `**/build/`, `**/.svelte-kit/`, `**/coverage/`, `**/.unit-test-build/`) plus the rooted `tests/fixtures/generated/`, `implementation/evidence/logs/` and `*.log` boundaries. |
| `.prettierrc.json`                       | Preserves the existing preferences and adds the `prettier-plugin-svelte` plugin plus the `.svelte` parser override.                                                                                                                                                                                                                                                                                                                                                                                            |
| `.prettierignore`                        | Adds the reserved `tests/fixtures/generated/` output boundary and ignored `implementation/evidence/logs/`; existing dependency/build/cache/unit-output/lockfile/license exclusions are preserved.                                                                                                                                                                                                                                                                                                              |
| `tests/unit/tooling.test.ts`             | New. Disposable-fixture regression suite exercising the real `lint` and `format:check` package scripts with the real configuration.                                                                                                                                                                                                                                                                                                                                                                            |
| `tests/smoke/cli-bootstrap.test.mjs`     | Minimal behavior-preserving repair of two unused destructured bindings flagged by `@typescript-eslint/no-unused-vars`.                                                                                                                                                                                                                                                                                                                                                                                         |
| `README.md`, `CONTRIBUTING.md`           | Document the lint/format commands, scope, exclusions and nonmutation.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `implementation/VERIFICATION.md`         | Replaces the proposed Format/Lint command meanings with the implemented behavior.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `implementation/evidence/S006_REPORT.md` | This candidate report.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

Unchanged as required: `pnpm-workspace.yaml`, `.node-version`, the engine,
package manager, package identity/license and all module metadata;
`src/cli/main.ts`; `tools/check-contracts.mjs` and its fixtures/tests;
`tools/run-unit-tests.mjs` and its regression suite; `tsconfig.json`;
`tsconfig.unit.json`; and the accepted S004/S005 evidence. No new public
configuration-writing command was added.

### Approved dependency decisions and verified facts

Exactly these seven exact pins were added and installed:

| Package                  | Pin       | Engines (installed document)          | Declared peers (installed document)                                                 |
| ------------------------ | --------- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| `eslint`                 | `10.11.0` | `^20.19.0 \|\| ^22.13.0 \|\| >=24`    | `jiti` (optional peer metadata)                                                     |
| `@eslint/js`             | `10.0.1`  | `^20.19.0 \|\| ^22.13.0 \|\| >=24`    | `eslint ^10.0.0`                                                                    |
| `typescript-eslint`      | `8.71.0`  | `^18.18.0 \|\| ^20.9.0 \|\| >=21.1.0` | `eslint ^8.57.0 \|\| ^9.0.0 \|\| ^10.0.0`, `typescript >=4.8.4 <6.1.0`              |
| `eslint-plugin-svelte`   | `3.23.0`  | `^18.18.0 \|\| ^20.9.0 \|\| >=21.1.0` | `eslint ^8.57.1 \|\| ^9.0.0 \|\| ^10.0.0`, `svelte ^3.37.0 \|\| ^4.0.0 \|\| ^5.0.0` |
| `eslint-config-prettier` | `10.1.8`  | —                                     | `eslint >=7.0.0`                                                                    |
| `globals`                | `17.12.0` | `>=18`                                | —                                                                                   |
| `prettier-plugin-svelte` | `4.1.1`   | `>=20`                                | `prettier ^3.0.0`, `svelte ^5.0.0`                                                  |

Existing pins the new tooling consumes: `prettier 3.9.6`, `svelte 5.57.1`,
`typescript 6.0.3`. The installed peer declarations therefore admit the pinned
ESLint 10, Svelte 5, Prettier 3 and TypeScript 6.0.3, and all engine ranges
admit Node 24.21.0. The seven-pin set is exactly the approved set; no
substitution, unapproved dependency or automatic package installation was
introduced. `pnpm install --frozen-lockfile --strict-peer-dependencies
--engine-strict` exits 0, qualifying the selection against the frozen lockfile
and strict engines/peers.

### Configuration summary

- **ESLint (`eslint.config.mjs`).** `js.configs.recommended`,
  `tseslint.configs.recommended`, `svelte.configs.recommended`, the
  `eslint-config-prettier/flat` preset and the Svelte Prettier conflict preset,
  plus `svelte/valid-compile` as `error`. The TypeScript parser
  (`tseslint.parser`) is configured as `parserOptions.parser` for
  `**/*.svelte`, `**/*.svelte.ts` and `**/*.svelte.js`, so `<script lang="ts">`
  is parsed by the real TypeScript parser. Node globals are limited to
  `src/cli`, `src/project`, `src/registry`, `src/codegen`, `tools`, `tests` and
  root configuration; browser globals are scoped to `**/*.svelte`,
  `registry/**/*.ts`, `src/lib/**/*.ts` and the future consumer-fixture source.
  Reserved dependency/output trees are ignored at every depth: `node_modules`,
  `.pnpm-store`, `dist`, `build`, `.svelte-kit`, `coverage` and
  `.unit-test-build`; the explicitly rooted `tests/fixtures/generated/` and
  `implementation/evidence/logs/` boundaries and `*.log` are also excluded.
  Lint is syntax-aware only; no project-service/type-aware architecture was
  added.
- **Prettier.** The existing `tabWidth`/`useTabs`/`endOfLine`/`proseWrap`
  preferences are preserved and the Svelte plugin plus `.svelte` parser
  override are added. `format:check` stays nonmutating; `format` is the
  explicit `--write` command. Scope is the maintained authoring tree; the same
  dependency/build/cache/unit-output/reserved-output/log trees and the
  lockfile/licenses stay excluded.
- The `svelte/valid-compile` rule is required to surface Svelte compiler and
  accessibility diagnostics; the Svelte recommended preset alone does not
  include it or any `a11y-*` rules in this plugin version. This is additive and
  does not disable any accessibility rule.

### Current-source repairs

Only two genuine violations existed across the current source, both in
`tests/smoke/cli-bootstrap.test.mjs`, and both were the same
`@typescript-eslint/no-unused-vars` finding on an unused destructured binding:

- The "disposable copy runs with built output and metadata only" test now
  destructures only `dir` (it already used `copyEntrypoint`, not `entry`).
- The "a changed valid package version is printed by both version flags" test
  now destructures only `entry` (it never used `dir`).

Both changes are behavior-preserving; the smoke suite remains 41/41. No blanket
disable, `any`, weakened type, skipped test, removed assertion, ignored-error
fallback or broad ignore expansion was used.

### Tooling regression suite

`tests/unit/tooling.test.ts` runs inside the S005 typed unit runner. It creates
owned disposable fixtures in the operating-system temporary directory (so no
negative probe enters real unit discovery), copies the real `eslint.config.mjs`,
`.prettierrc.json` and `.prettierignore` byte-for-byte, resolves the real
installed tools through a real `node_modules` directory whose entries symlink
the installed packages, and invokes the real
`lint`/`format:check` package scripts (read from the repository manifest) with
bounded subprocesses and a neutralized inherited `node:test` environment
(`NODE_OPTIONS`, `NODE_V8_COVERAGE` and `NODE_TEST_CONTEXT` removed; pnpm's
dependency pre-check disabled so no install or external write can occur). Each
fixture is removed on completion. Proofs:

- Clean TypeScript and clean Svelte 5 `<script lang="ts">` inputs (with runes)
  pass both `lint` and `format:check`.
- Malformed TypeScript and malformed Svelte formatting make `format:check` exit
  nonzero while leaving the file bytes identical, and restoring valid input
  returns green.
- A real TypeScript lint defect fails with
  `@typescript-eslint/no-unused-vars` naming the identifier; a Svelte `<img>`
  without `alt` fails with `svelte/valid-compile` /
  `a11y_missing_attribute`; an unclosed Svelte block fails with
  `block_unclosed`. Each restores green.
- A lint/format defect under each of the seven recursive reserved names
  (`node_modules`, `.pnpm-store`, `dist`, `build`, `.svelte-kit`, `coverage`,
  `.unit-test-build`) is excluded by both real scripts at the fixture root, one
  nested level, and a deeper level beneath maintained consumer source; probes
  under the rooted `tests/fixtures/generated/` and
  `implementation/evidence/logs/` boundaries (including a nested level) are
  excluded too.
- Maintained TS and Svelte input under both `registry/components/` and
  `tests/fixtures/consumer/src/` still fails for its intended diagnostic
  (`@typescript-eslint/no-unused-vars`, `svelte/valid-compile`
  `a11y_missing_attribute`, malformed formatting) and returns green after
  repair.
- Success and failure preserve a complete recursive fixture snapshot
  (file bytes/sha256, modes, entry kinds, symlink targets), a hidden sentinel,
  and a byte-identical unrelated external application linked into the fixture
  but never traversed or rewritten.

The suite contains nine executed `node:test` cases with no skips.

## Verified

All mutating dependency/build/test commands ran under process-local Node
`24.21.0` and `pnpm 11.22.0`, from this package root, routed through the
required execution wrapper after a successful environment diagnostic (exit 0).
Exits are real process exits. Per-attempt logs are kept under the gitignored
`implementation/evidence/logs/` directory and are not committed. This table
records the **initial** S006 candidate run; the changed lint/format and tooling
suites are superseded by the R1 correction table above (14 discovered unit tests
and 9 explicit tooling tests after the correction, versus 13 and 8 initially).

| Step                      | Command                                                                     | Exit | Result                                                |
| ------------------------- | --------------------------------------------------------------------------- | ---- | ----------------------------------------------------- |
| Frozen strict install     | `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | 0    | `Already up to date`; strict peers/engines satisfied  |
| Format check              | `pnpm run format:check`                                                     | 0    | All matched files use Prettier code style             |
| Lint                      | `pnpm run lint`                                                             | 0    | `eslint . --max-warnings 0`; no findings              |
| Typecheck                 | `pnpm run typecheck`                                                        | 0    | `tsconfig.json` and `tsconfig.unit.json` clean        |
| Build                     | `pnpm run build`                                                            | 0    | `dist/cli/main.js`                                    |
| Unit (default discovery)  | `pnpm run test:unit`                                                        | 0    | 2 files; `tests 13`, `pass 13`, `fail 0`, `skipped 0` |
| Unit (explicit S006 file) | `pnpm run test:unit -- tests/unit/tooling.test.ts`                          | 0    | 1 file; `tests 8`, `pass 8`, `fail 0`, `skipped 0`    |
| Unit harness              | `pnpm run test:harness`                                                     | 0    | `tests 29`, `pass 29`, `fail 0`, `skipped 0`          |
| CLI smoke                 | `pnpm run test:cli-bootstrap`                                               | 0    | `tests 41`, `pass 41`, `fail 0`, `skipped 0`          |
| Contract validation       | `pnpm run check:contracts`                                                  | 0    | `0 error(s), 0 warning(s)`                            |
| Contract tests            | `pnpm run test:contracts`                                                   | 0    | `tests 84`, `pass 84`, `fail 0`                       |
| Whitespace (unstaged)     | `git diff --check`                                                          | 0    | No diagnostics                                        |
| Whitespace (staged)       | `git diff --cached --check`                                                 | 0    | No diagnostics; nothing staged                        |

Log locations (gitignored): `s006-install.log`, `s006-format-check.log`,
`s006-lint.log`, `s006-typecheck.log`, `s006-build.log`,
`s006-unit-default.log`, `s006-unit-tooling.log`, `s006-harness.log`,
`s006-cli-bootstrap.log`, `s006-contracts-check.log`, `s006-contracts-test.log`,
`s006-diff-check.log`, `s006-diff-cached-check.log`.

### Real authoring-tree nonmutation proof

Initial run: the tracked-file SHA-256 manifest and the porcelain status were
captured, then the real `pnpm run lint` and `pnpm run format:check` were run,
then both were recaptured. All 67 tracked files were byte-identical, no status
entry appeared, and no untracked file was created. Log: `s006-nonmutation.log`.

R1 correction: the snapshot was extended to every tracked **and untracked**
authoring entry, because unchanged porcelain status does not prove unchanged
bytes in a previously untracked file. All 71 entries (70 from before the
correction plus Codex's `implementation/evidence/S006_REVIEW.md`) were captured
with mode, size, sha256 and symlink target before and after the real
`pnpm run lint` and `pnpm run format:check`. Every entry and the porcelain
status were identical. Logs: `s006-r1-nonmutation-entries.log` and
`s006-r1-nonmutation.log`. This proves the authoring-tree checks are genuinely
nonmutating for both tracked and untracked inputs.

### Dependency compatibility findings

- All seven new pins resolve and install under the strict-peer, engine-strict
  frozen install (exit 0). Peer ranges admit the pinned ESLint 10, Svelte 5,
  Prettier 3 and TypeScript 6.0.3; engine ranges admit Node 24.21.0.
- `eslint`'s `jiti` peer is optional (its peer metadata marks it optional), so
  it does not require an extra dependency; the strict install confirms this.
- `@eslint/js` requires `eslint ^10`, `typescript-eslint` admits `>=4.8.4
<6.1.0`, `eslint-plugin-svelte` admits ESLint 10 and Svelte 5, and
  `prettier-plugin-svelte` admits Svelte 5 and Prettier 3 — all satisfied by
  the existing pins. No version substitution was needed.

### Conditional reference guard — initial fresh run and R1 reuse

Initial S006 run: verified the reference worktree clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98` before the guard; no reference
source was modified and the tree remained clean afterward. Commands ran from
the reference workspace root using the required execution routing after a
successful environment diagnostic (exit 0). That was a fresh S006 run; the S005
same-checkpoint reuse exception did not carry forward then.

R1 correction: the reference worktree was re-verified clean at the same commit
with no source changes. Because identity, Rust scope and the audited evidence
are unchanged, the governing dispatch authorizes citing this same-checkpoint
S006 evidence for the configuration/test correction without another Rust run.
No fresh Pi Rust run or result is claimed here. The audited S006 results being
cited for reuse are:

| Step | Command                                 | Exit | Result                                                                                                                                 |
| ---- | --------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------- |
| R1   | `cargo fmt --all -- --check`            | 0    | No diffs (empty output)                                                                                                                |
| R2   | `cargo check --workspace --all-targets` | 0    | `Finished dev profile`                                                                                                                 |
| R3   | `cargo test --workspace --all-targets`  | 0    | 578 passed, 0 failed, 4 ignored across 43 `test result:` lines (27 top-level test-binary summaries + 16 nested subprocess invocations) |

The four ignored tests remain the ones previously identified
(`installed_binaries_run_after_package_source_and_build_state_are_deleted`,
`homepage_fixture_cli_workflow_smoke`,
`tests::every_transaction_io_fault_avoids_partial_application_state`,
`packaged_sources_build_with_cargo_vcs_provenance_outside_and_inside_hostile_git`);
they remain ignored and are not claimed as executed. Raw output is in
`s006-reference-fmt.log`, `s006-reference-check.log` and
`s006-reference-test.log`, whose final line records the captured process exit
status (`0`).

## Exceptions

Failures and retries:

- The first `pnpm run format:check` after adding `tests/unit/tooling.test.ts`
  exited 1 for that new file. A scoped `prettier --write tests/unit/tooling.test.ts`
  fixed exactly that file, after which `format:check` exited 0. The tooling
  suite was re-run and stayed green. (Tracked-file bytes were confirmed
  unchanged by the lint/format runs themselves, so this failure is a real
  formatting defect in new authoring output, not a check side effect.)
- The first fresh reference `cargo test --workspace --all-targets` attempt was
  interrupted by the agent tool's command timeout under heavy concurrent
  machine load; its partial output is preserved as
  `s006-reference-test-attempt1-partial.log`. A background attempt then
  completed the full suite (578 passed, 0 failed, 4 ignored, every suite
  `ok`), but its launcher did not record the process exit code; it is preserved
  as `s006-reference-test-attempt2-complete-uncaptured-exit.log`. A third run
  re-ran the identical command and captured the real process exit (0), logged
  at the end of `s006-reference-test.log`. These are
  execution-budget/evidence-capture retries, not test failures.

Skipped checks: none in the S006 target lanes. No consumer `svelte-check`,
SSR/browser, package/tarball or publication lane belongs to S006 and none was
run or claimed. Lint/format probes do not establish consumer typecheck/build,
SSR/browser qualification or release readiness.

Unverified behavior and release impact: component rendering, SSR/hydration,
browser qualification, consumer typecheck/build, package acceptance and the
CLI command envelope/exit map (S022–S023) do not exist and are not claimed. As
recorded at S005, source-path hints in runner failure output are not
source-map-accurate TypeScript coordinates; emitted stack coordinates remain
authoritative, and no source-map feature is provided or required.

Deviations with record ID and repository evidence: none. The only public
command-surface change is the approved `lint` script; no additional public
configuration-writing command was added.

Unresolved issues after completion: none known within S006 scope.

## Self-review findings

- `package.json` adds only the approved `lint` script and seven exact pins;
  name/version/description/private/license/repository/bugs/homepage/type/bin/
  packageManager/engines and all nine pre-existing pins are byte-preserved.
- `pnpm-workspace.yaml`, `.node-version`, `tsconfig.json`, `tsconfig.unit.json`,
  `src/cli/main.ts`, the S005 unit runner, the contract validator and the
  accepted S004/S005 evidence are unchanged; the four expected Codex
  bookkeeping files are untouched.
- The lint/format ignores recursively reserve the dependency/output trees
  (`node_modules`, `.pnpm-store`, `dist`, `build`, `.svelte-kit`, `coverage`,
  `.unit-test-build`) at every depth, and keep the rooted
  `tests/fixtures/generated/` and evidence-log boundaries, without broadly
  ignoring real `src`, `tools`, `tests` or future `registry` authoring inputs.
  The R1 negative control proves the new regression fails with root-only
  patterns and passes with the recursive configuration.
- Lint keeps compiler typechecking separate: no project service was added, and
  `typecheck` still checks the tracked-config includes while `test:unit` also
  compiles every discovered unit entry (the accepted S005 boundary).
- No `any`, blanket disable, weakened type, skipped test, removed assertion,
  `--fix`/cache/ignored-error fallback or assertion-free stub was introduced.
  The tooling suite fails on real diagnostics and proves nonmutation rather
  than asserting configuration text.
- The real authoring-tree lint/format runs leave all tracked and untracked
  authoring bytes and the working-tree status byte-identical.
- The R1 correction does not change `svelte/valid-compile: error`, any exact
  dependency pin, preset, global scope, package identity or runtime selection,
  and does not scaffold S007.

## Commit and next action

Actual commit hash: pending; Codex accepted this report as implemented with a
null precommit hash. Authorized message: `build: add formatting and lint verification gates`.

Structured record: report `implemented`, null precommit hash. Codex owns the
independent accepted review and the checkpoint commit; Pi did not self-accept.

Requirements/test evidence updated: this report, `README.md`,
`CONTRIBUTING.md` and `implementation/VERIFICATION.md`. The governing ledger and
JSON projection were unchanged by the author; Codex reconciles acceptance and
commit state through the governing ledger.

Next step ID: S007 — Add an SSR-enabled SvelteKit consumer fixture. It remains
locked until Codex commits the independently accepted S006 checkpoint.

Is the next step safe to begin? Not before the accepted checkpoint is committed.
S006 is `verified_uncommitted`; S007 and all successors remain locked.

### Decisions requiring Codex

None blocking. All consequential S006 choices were pre-approved by the dispatch
and implemented without substitution, weakened checks or dependency changes.
