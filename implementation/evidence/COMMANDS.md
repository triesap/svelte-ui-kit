# Command map and acceptance CI

<!-- Adopted at S010. Implementation/status authority remains `implementation/COMMIT_SEQUENCE.md`. -->

This file records the real local commands for this repository and how the
current CI workflow maps to them. It names no operator-machine path, secret or
private tooling.

## Runtime and platform

- Node.js `24.21.0` (`.node-version`), pnpm `11.22.0`
  (`packageManager`), one root lockfile.
- Locally qualified lane: macOS arm64 with Node `24.21.0` / pnpm `11.22.0`.
- Configured CI: GitHub Actions `ubuntu-24.04`; separate filesystem jobs for
  `ubuntu-24.04` and `macos-15`, with the same Node/pnpm pins. Remote jobs have
  not executed as part of this delivery. Local Linux qualification covers the
  explicitly recorded safety lanes, not every browser/platform combination.
- No Rust/Cargo workspace exists in this repository. Cargo guards are N/A for
  its TypeScript/Svelte changes; do not add Rust solely to satisfy a checklist.

## Command map

| Purpose              | Local command                                                               | Notes                                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Native bootstrap     | `node tools/prepare-native-dependency.mjs --fixture`                        | Before the first install, build or authenticate the frozen native archive and copy it to the maintained fixture.                                                  |
| Frozen install       | `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | Strict peers and engine enforcement; one root lockfile.                                                                                                           |
| Format check         | `pnpm run format:check`                                                     | Nonmutating Prettier over the maintained authoring tree.                                                                                                          |
| Lint                 | `pnpm run lint`                                                             | `eslint . --max-warnings 0`.                                                                                                                                      |
| Typecheck            | `pnpm run typecheck`                                                        | Root, unit, integration, components, registry and package TypeScript configurations.                                                                              |
| Unit                 | `pnpm run test:unit`                                                        | Builds, then runs typed `tests/unit` via the suite runner.                                                                                                        |
| Runner harness       | `pnpm run test:harness`                                                     | Regression suite for `tools/run-unit-tests.mjs`.                                                                                                                  |
| Integration          | `pnpm run test:integration`                                                 | Builds, then runs typed `tests/integration` (`--suite integration`).                                                                                              |
| Components           | `pnpm run test:components`                                                  | Runs typed `tests/components` (`--suite components`): the Bits compatibility fixture and disposable negative copies, plus the mandatory strict declaration audit. |
| Registry             | `pnpm run test:registry`                                                    | Actual registry assets, mapping, CSS, tokens, exports and contract links.                                                                                         |
| Full package         | `pnpm run test:package`                                                     | Actual tarball inventory, installed executable isolation, mutation lifecycles, generated consumers and metadata; no publication.                                  |
| CLI smoke            | `pnpm run test:cli-bootstrap`                                               | Real `dist` CLI process assertions.                                                                                                                               |
| Contract validation  | `pnpm run check:contracts`                                                  | Read-only document/projection/evidence validation.                                                                                                                |
| Contract tests       | `pnpm run test:contracts`                                                   | Focused validator regression suite.                                                                                                                               |
| CI coverage          | `pnpm run check:ci`                                                         | Parses real YAML and validates every job, pinned bootstrap, complete script, platform and timeout against the acceptance policy.                                  |
| CI coverage controls | `pnpm run test:ci`                                                          | Meaningful omission, selector, install, permission, failure-mask, strict-consumer and read-only controls.                                                         |
| Consumer check       | `pnpm run fixture:check`                                                    | `svelte-kit sync` + `svelte-check --fail-on-warnings`.                                                                                                            |
| Consumer SSR         | `pnpm run test:fixture`                                                     | Builds, then owned-server SSR + lifecycle suites.                                                                                                                 |
| Full browser         | `pnpm run test:browser`                                                     | Builds maintained fixture, then all configured Chromium specs with one worker and zero retries.                                                                   |
| Consumer build       | `pnpm run fixture:build`                                                    | Token consistency followed by the actual maintained production build.                                                                                             |
| Chromium install     | `pnpm exec playwright install [--with-deps] chromium`                       | Local (no `--with-deps`); CI adds system dependencies.                                                                                                            |
| Diff health          | `git diff --check`                                                          | No whitespace diagnostics.                                                                                                                                        |

The component qualification lane (`pnpm run test:components`) includes the
mandatory raw strict declaration audit. The maintained fixture and owned audit
use `skipLibCheck: false` with the authenticated local Bits
`2.19.5-svelte-ui-kit.2` dependency. The raw checker must exit zero with no
errors or warnings; malformed output, wrong versions or artifact bytes, tool
failures and authored/additional-dependency defects are refused. The former
two-error exception is historical and cannot satisfy the current audit.

`pnpm run build` authenticates the prepared native dependency, compiles the
CLI and bundles that exact archive under `dist/native`. Generated archives and
preparation caches are uncommitted outputs. Fresh bootstrap runs the direct
Node preparation command before package-manager scripts, which may otherwise
attempt dependency verification before the required local archive exists.

For focused typed execution, build the CLI when applicable and use
`node tools/run-unit-tests.mjs --suite integration tests/integration/docs-recovery.test.ts`
(or `unit`, `components`, `registry`, `package` with their actual files).
The runner receives file selectors directly; a literal `--` is not supported.
For a focused browser file use
`pnpm exec playwright test --config playwright.config.ts tests/browser/composition-examples.spec.ts`.
That example lane builds its own actual generated consumers. Other specs that
use the maintained handler require its production build first. Do not overlap
shared compiler, package or fixture writers.

## CI workflow

`.github/workflows/ci.yml` covers unfiltered `pull_request` and `push` events
with read-only `contents` permission. Each job checks out its own full history
without retaining credentials, sets up pnpm `11.22.0` and Node `24.21.0`,
prepares the authenticated native archive **before** frozen strict installation,
then executes its complete lane. Writers remain serial within each independent
workspace. No build artifacts cross jobs, and no publication, deployment or
secret-backed operation is configured.

| Job         | Complete lane                                                                      | Timeout | Local duration evidence informing headroom                                                                                                                                                               |
| ----------- | ---------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| foundation  | Format, lint, six typechecks, unit, harness, CLI smoke and CI policy controls      | 30 min  | Current F06 foundation commands total 142713 ms; local cached preparation/install, static/unit/harness/CLI/policy controls all pass. Cold producer/bootstrap overhead remains within the bounded budget. |
| integration | Full integration suite                                                             | 120 min | Current complete 895/895 run 2412336 ms. Prior red runs remain retained and are not reused as passes.                                                                                                    |
| components  | Complete component strict audit and registry suites                                | 60 min  | Current components 441/441 in 415911 ms and registry 66/66 in 74972 ms.                                                                                                                                  |
| package     | Complete real tarball/installed/runtime/consumer/metadata suite                    | 45 min  | Current full 10/10 package run 433157 ms, including actual unchanged-command installed controls.                                                                                                         |
| consumer    | CLI build, raw strict consumer check and production build/SSR lifecycle suites     | 60 min  | Current strict 3385 ms, production 3817 ms and all 27 SSR cases 56429 ms, plus CLI build.                                                                                                                |
| browser     | CLI build, bundled Chromium install and full configured suite                      | 120 min | Current full 733/733 isolated source-copy lane 2347813 ms, zero skips/retries; actual preparation/frozen install/build additionally recorded.                                                            |
| contracts   | Live contract validation and full contract regressions                             | 45 min  | Current complete 159/159 regression 840267 ms, plus live contract validation.                                                                                                                            |
| native      | Actual reproducible producer and authenticated preparation/delivery controls       | 45 min  | Current combined actual producer/preparation/delivery 5/5 run 128600 ms.                                                                                                                                 |
| filesystem  | Linux/macOS matrix with all 17 owning recovery/process/durability/filesystem files | 60 min  | Current unprivileged Linux preparation/install/build plus 172 cases 307209 ms. Same 17 macOS files pass in the full current integration lane.                                                            |

These are measured **local** observations and conservative bounded headroom,
not hosted-runner timings. They do not certify a past red integration run.
The successful complete current S201 lane is recorded in
[final verification](FINAL_VERIFICATION.md). Hosted jobs,
Ubuntu system-dependency installation and their actual durations remain
unexecuted. Local Linux runtime evidence covers its explicitly recorded lanes.

The [CI coverage policy](../../tools/check-ci.mjs) parses YAML with the explicit
development pin `yaml@2.9.1`; [its controls](../../tools/check-ci.test.mjs)
reject missing jobs, selected suites, incomplete scripts, unqualified budgets,
weakened installs/strict checking, unsafe actions/permissions and skipped or
masked checks. Actionlint separately verifies GitHub Actions syntax. The policy
is repository development tooling, not a CLI runtime dependency. The selected
native source-fix archive remains reproducibly bundled; applications explicitly
extract, authenticate and install their own archive without CLI installation.

Actions are pinned to immutable revisions:

| Action               | Version | Revision                                   |
| -------------------- | ------- | ------------------------------------------ |
| `actions/checkout`   | v7.0.1  | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| `actions/setup-node` | v7.0.0  | `820762786026740c76f36085b0efc47a31fe5020` |
| `pnpm/action-setup`  | v6.1.0  | `ea17c68df8912ef543352723c149a84f56e3d413` |

### Workflow validation and limits

- The workflow is validated locally with `actionlint 1.7.12` (downloaded into a
  temporary owned tool directory from the official release and checked against
  the published checksum file).
- `shellcheck 0.11.0` is available on the local `PATH`, so actionlint's shell
  checks ran; availability is recorded rather than assumed on other machines.
- The workflow has **not** run remotely: the S010 commit does not push or
  trigger GitHub Actions. Local command results are the only execution evidence
  recorded here. The `ubuntu-24.04` lane, the system-dependency Chromium
  install and any remote-only behavior remain unverified until a future,
  separately authorized run.
