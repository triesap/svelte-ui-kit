# Command map and baseline CI

<!-- Adopted at S010. Implementation/status authority remains `implementation/COMMIT_SEQUENCE.md`. -->

This file records the real local commands for this repository and how the
baseline CI workflow maps to them. It names no operator-machine path, secret or
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

| Purpose             | Local command                                                               | Notes                                                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen install      | `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | Strict peers and engine enforcement; one root lockfile.                                                                                                           |
| Format check        | `pnpm run format:check`                                                     | Nonmutating Prettier over the maintained authoring tree.                                                                                                          |
| Lint                | `pnpm run lint`                                                             | `eslint . --max-warnings 0`.                                                                                                                                      |
| Typecheck           | `pnpm run typecheck`                                                        | Root, unit, integration, components, registry and package TypeScript configurations.                                                                              |
| Unit                | `pnpm run test:unit`                                                        | Builds, then runs typed `tests/unit` via the suite runner.                                                                                                        |
| Runner harness      | `pnpm run test:harness`                                                     | Regression suite for `tools/run-unit-tests.mjs`.                                                                                                                  |
| Integration         | `pnpm run test:integration`                                                 | Builds, then runs typed `tests/integration` (`--suite integration`).                                                                                              |
| Components          | `pnpm run test:components`                                                  | Runs typed `tests/components` (`--suite components`): the Bits compatibility fixture and disposable negative copies, plus the mandatory strict declaration audit. |
| Registry            | `pnpm run test:registry`                                                    | Actual registry assets, mapping, CSS, tokens, exports and contract links.                                                                                         |
| Full package        | `pnpm run test:package`                                                     | Actual tarball inventory, installed executable isolation, mutation lifecycles, generated consumers and metadata; no publication.                                  |
| CLI smoke           | `pnpm run test:cli-bootstrap`                                               | Real `dist` CLI process assertions.                                                                                                                               |
| Contract validation | `pnpm run check:contracts`                                                  | Read-only document/projection/evidence validation.                                                                                                                |
| Contract tests      | `pnpm run test:contracts`                                                   | Focused validator regression suite.                                                                                                                               |
| Consumer check      | `pnpm run fixture:check`                                                    | `svelte-kit sync` + `svelte-check --fail-on-warnings`.                                                                                                            |
| Consumer SSR        | `pnpm run test:fixture`                                                     | Builds, then owned-server SSR + lifecycle suites.                                                                                                                 |
| Full browser        | `pnpm run test:browser`                                                     | Builds maintained fixture, then all configured Chromium specs with one worker and zero retries.                                                                   |
| Consumer build      | `pnpm run fixture:build`                                                    | Token consistency followed by the actual maintained production build.                                                                                             |
| Chromium install    | `pnpm exec playwright install [--with-deps] chromium`                       | Local (no `--with-deps`); CI adds system dependencies.                                                                                                            |
| Diff health         | `git diff --check`                                                          | No whitespace diagnostics.                                                                                                                                        |

The component qualification lane (`pnpm run test:components`) is established at
S011; the workflow runs it after the integration lane. It also runs the
mandatory strict declaration audit that pairs with the fixture's temporary
`skipLibCheck: true` exception: the real `skipLibCheck: false` checker runs in
an owned copy and exactly the two pinned Bits 2.19.3 union-complexity
diagnostics are qualified, with authored and additional-dependency errors
rejected. Resolving that upstream exception remains an open release obligation.

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

`.github/workflows/ci.yml` runs on `pull_request` and `push` with read-only
`contents` permission, a `30`-minute job timeout and the `ubuntu-24.04` runner.
It checks out full history, sets up pnpm `11.22.0` and Node `24.21.0`, then runs
the frozen strict install, installs bundled Chromium with system dependencies,
and runs the format, lint, typecheck, unit, harness, integration, components,
registry, the full package suite, CLI smoke, consumer check, consumer SSR,
selected browser harness, contract-validation and contract-test lanes. The
configured browser selector does not execute the full local browser suite;
the package step already runs its full suite despite its inventory label.
The 30-minute job limit is configuration, not demonstrated
cumulative runtime qualification; full local integration/browser lanes alone
have exceeded 20 minutes each. Do not claim CI passed from this file.

The owner-approved 2026-10-08 completion amendment requires R11-F04 to replace
this partial browser/serial-budget setup with full acceptance-suite coverage,
isolated jobs and defensible bounded timeouts. That workflow repair has not yet
been implemented. Until it is, this section describes actual current CI rather
than the approved future configuration. See
[the governing RCLD](../COMMIT_SEQUENCE.md) and
[current verification requirements](../VERIFICATION.md). Native source-fix
delivery, if selected after strict qualification, additionally requires explicit
application-owned archive installation and reproducible dependency instructions;
no such artifact is currently selected or claimed available.

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
