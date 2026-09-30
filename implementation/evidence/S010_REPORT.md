# S010 step report — Document commands and add baseline CI

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S010","kind":"report","commit":"a148a3163e5fa38e4f684292c902ac5707637299","disposition":"candidate"}
-->

Step ID and title: S010 — Document commands and add baseline CI.

Contract/requirement IDs: R29, R32, R33, R34
(`implementation/COMMIT_SEQUENCE.md`; see `specs/ACCEPTANCE_CRITERIA.md`).

Author: Pi, provider `ollama`, model `deepseek-v4.1-flash:cloud`. Runtime:
Node `24.21.0` / `pnpm 11.22.0`. No new dependency was added.

Under the owner-authorized batch this report is a candidate; the S010
implementation commit makes it `committed_pending_review` pending independent
Codex review.

## Dispatch mapping

| #   | Dispatch decision          | Implementation                                                                                                                                                                                                                  | Evidence                                  |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1   | Command map                | `implementation/evidence/COMMANDS.md` records runtime, platform, every real local command, the CI mapping and the remote-only limits.                                                                                           | `implementation/evidence/COMMANDS.md`     |
| 2   | Baseline CI workflow       | `.github/workflows/ci.yml` on `pull_request`/`push`, `contents: read`, `timeout-minutes: 30`, `ubuntu-24.04`, Node 24.21.0, pnpm 11.22.0, full-history checkout, frozen strict install, `--with-deps` Chromium, then all lanes. | `.github/workflows/ci.yml`                |
| 3   | Immutable action revisions | `actions/checkout` `3d3c42e5…`, `actions/setup-node` `82076278…`, `pnpm/action-setup` `ea17c68d…` (full SHAs with version comments).                                                                                            | `.github/workflows/ci.yml`                |
| 4   | No Rust job                | The workflow states the public repository has no Cargo workspace and the Leptos reference guard is a separate private worktree; no Cargo job is added.                                                                          | `.github/workflows/ci.yml`, `COMMANDS.md` |
| 5   | Workflow validation        | `actionlint 1.7.12` downloaded to an owned temp directory from the official release, checksum-verified, run over the workflow at exit 0; `shellcheck 0.11.0` availability recorded.                                             | This report; `COMMANDS.md`                |
| 6   | No remote claim            | COMMANDS/CONTRIBUTING/README state the workflow has not been run remotely.                                                                                                                                                      | Those files                               |

## Files changed or added

| Path                                  | Change   | Purpose                                                        |
| ------------------------------------- | -------- | -------------------------------------------------------------- |
| `implementation/evidence/COMMANDS.md` | new      | Command map, CI mapping, action revisions, remote-only limits. |
| `.github/workflows/ci.yml`            | new      | Baseline CI workflow.                                          |
| `CONTRIBUTING.md`                     | modified | Continuous-integration section and PR checklist.               |
| `README.md`                           | modified | Points to the command map and CI workflow.                     |
| `implementation/COMMIT_SEQUENCE.md`   | modified | S009 recorded pending review; S010 active.                     |

## Verification

Locally recorded results (Node `24.21.0`/`pnpm 11.22.0`):

| Step                | Command                                                  | Exit | Result                                    |
| ------------------- | -------------------------------------------------------- | ---- | ----------------------------------------- |
| Workflow validation | `actionlint .github/workflows/ci.yml`                    | 0    | no findings (shellcheck 0.11.0 on PATH)   |
| Format check        | `pnpm run format:check`                                  | 0    | All matched files use Prettier code style |
| Lint                | `pnpm run lint`                                          | 0    | no findings                               |
| Typecheck           | `pnpm run typecheck`                                     | 0    | exit 0                                    |
| Unit                | `pnpm run test:unit`                                     | 0    | 14 tests, 14 pass                         |
| Runner harness      | `pnpm run test:harness`                                  | 0    | 35 tests, 35 pass                         |
| Integration         | `pnpm run test:integration`                              | 0    | 9 tests, 9 pass                           |
| CLI smoke           | `pnpm run test:cli-bootstrap`                            | 0    | 41 tests, 41 pass                         |
| Consumer check      | `pnpm run fixture:check`                                 | 0    | 0 errors, 0 warnings                      |
| Consumer SSR        | `pnpm run test:fixture`                                  | 0    | 16 tests, 16 pass                         |
| Browser             | `pnpm run test:browser -- tests/browser/harness.spec.ts` | 0    | 6 passed                                  |
| Contract validation | `pnpm run check:contracts`                               | 0    | 0 error(s), 0 warning(s)                  |
| Contract tests      | `pnpm run test:contracts`                                | 0    | 101 tests, 101 pass                       |
| Diff health         | `git diff --check`                                       | 0    | no diagnostics                            |

The actionlint archive's SHA-256 was verified against
`actionlint_1.7.12_checksums.txt` before execution (darwin/arm64).

## Remote-only limits

- The workflow has not executed on GitHub Actions; only local validation and
  local command runs are claimed. No push or workflow dispatch occurred.
- The `ubuntu-24.04` runner, `--with-deps` Chromium system libraries and any
  remote cache behavior remain unverified until a separately authorized run.
- `shellcheck 0.11.0` is present locally; CI relies on actionlint's bundled
  behavior/runners rather than the local shellcheck.
- No publication, deployment, release, secrets or external reference checkout
  is part of the workflow.

## Self-review findings

- Only approved action revisions are used, pinned by full commit SHA.
- The workflow grants read-only contents permission and a bounded timeout and
  performs no write/deploy step.
- The command map matches the actual `package.json` scripts and the commands
  run locally; it does not claim a lane that does not exist (the component
  lane is deferred to S011).
- No Rust job is added and the absence is explained.

## Commit and next action

Commit message: `ci: qualify the initial verification lanes`. The commit hash is
recorded in this report's evidence after the commit. Next checkpoint: S011,
authorized to proceed after the S010 green commit. Nothing was pushed or
published and S013 was not started.
