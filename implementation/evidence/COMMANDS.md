# Command map and baseline CI

<!-- Adopted at S010. Implementation/status authority remains `implementation/COMMIT_SEQUENCE.md`. -->

This file records the real local commands for this repository and how the
baseline CI workflow maps to them. It names no operator-machine path, secret or
private tooling.

## Runtime and platform

- Node.js `24.21.0` (`.node-version`), pnpm `11.22.0`
  (`packageManager`), one root lockfile.
- Locally qualified lane: macOS arm64 with Node `24.21.0` / pnpm `11.22.0`.
- CI lane: GitHub Actions `ubuntu-24.04` with Node `24.21.0` / pnpm `11.22.0`.
- No Rust/Cargo workspace exists in this public repository. The Leptos reference
  guard is a separate, privately hosted worktree, so no Cargo job belongs in
  this workflow and none is added.

## Command map

| Purpose             | Local command                                                               | Notes                                                                |
| ------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Frozen install      | `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | Strict peers and engine enforcement; one root lockfile.              |
| Format check        | `pnpm run format:check`                                                     | Nonmutating Prettier over the maintained authoring tree.             |
| Lint                | `pnpm run lint`                                                             | `eslint . --max-warnings 0`.                                         |
| Typecheck           | `pnpm run typecheck`                                                        | `tsconfig.json`, `tsconfig.unit.json`, `tsconfig.integration.json`.  |
| Unit                | `pnpm run test:unit`                                                        | Builds, then runs typed `tests/unit` via the suite runner.           |
| Runner harness      | `pnpm run test:harness`                                                     | Regression suite for `tools/run-unit-tests.mjs`.                     |
| Integration         | `pnpm run test:integration`                                                 | Builds, then runs typed `tests/integration` (`--suite integration`). |
| CLI smoke           | `pnpm run test:cli-bootstrap`                                               | Real `dist` CLI process assertions.                                  |
| Contract validation | `pnpm run check:contracts`                                                  | Read-only document/projection/evidence validation.                   |
| Contract tests      | `pnpm run test:contracts`                                                   | Focused validator regression suite.                                  |
| Consumer check      | `pnpm run fixture:check`                                                    | `svelte-kit sync` + `svelte-check --fail-on-warnings`.               |
| Consumer SSR        | `pnpm run test:fixture`                                                     | Builds, then owned-server SSR + lifecycle suites.                    |
| Browser             | `pnpm run test:browser -- tests/browser/harness.spec.ts`                    | Builds, then Playwright bundled Chromium.                            |
| Chromium install    | `pnpm exec playwright install [--with-deps] chromium`                       | Local (no `--with-deps`); CI adds system dependencies.               |
| Diff health         | `git diff --check`                                                          | No whitespace diagnostics.                                           |

An explicit component qualification lane (`pnpm run test:components`) is
scheduled for S011; CI gains that step when the lane exists.

## CI workflow

`.github/workflows/ci.yml` runs on `pull_request` and `push` with read-only
`contents` permission, a `30`-minute job timeout and the `ubuntu-24.04` runner.
It checks out full history, sets up pnpm `11.22.0` and Node `24.21.0`, then runs
the frozen strict install, installs bundled Chromium with system dependencies,
and runs the format, lint, typecheck, unit, harness, integration, CLI smoke,
consumer check, consumer SSR, browser, contract-validation and contract-test
lanes — the same commands recorded above.

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
