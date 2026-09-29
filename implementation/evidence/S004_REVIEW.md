# S004 independent review — accepted

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S004","kind":"review","commit":null,"disposition":"accepted"}
-->

Reviewer: Codex. Date: 2026-09-29. Baseline/current HEAD:
`91cdaaefd756021b343465f7ba7dd3afe2f71b6d`. Review 2 accepts S004 as
`verified_uncommitted`, pending the authorized checkpoint commit. S005 remains
gated by that commit. Findings below are historical and are now closed.

## Review 2 — acceptance and resolved decisions

Codex reviewed the complete corrected source and smoke suite, all affected
configuration/docs, the correction session and per-attempt logs. Model events
and response metadata confirm `ollama` / `deepseek-v4.1-flash:cloud`.

- R1 closed: exact product name and full SemVer validation; independent earlier
  malformed cases now exit 1 with empty stdout. Valid changed prerelease/build
  versions print exactly, including `1.2.3-01a`, `1.2.3-0` and `1.2.3+001`.
- R2 closed: deterministic file-content/type/link snapshots and changed-version
  checks are implemented. Codex independently ran a passing unmutated
  disposable control, then reproduced failure of an existing-file-write mutant
  at the seeded-cwd assertion and a hard-coded-version mutant at the
  changed-metadata assertion. No actual source or build artifact was mutated.
- R3 closed: private-tooling wording and failure history are reconciled. The
  candidate report's earlier observations remain historical. Codex corrected
  its minor count: the seeded no-write loop has five supported and seven
  rejected invocations, not ten rejected invocations.

Codex accepts Node's early `ERR_INVALID_PACKAGE_CONFIG` for non-object JSON
and non-string name fields under the same bootstrap exit-1 contract as invalid
JSON. Independent probes confirmed this behavior. No wrapper or metadata
architecture change is required. The CLI still handles metadata that reaches
its own validator; diagnostics do not echo malformed values.

Independent verification under Node 24.21.0 / pnpm 11.22.0: frozen strict-peer
engine-strict install, typecheck, build, CLI smoke **41/41**, contracts **83/83**,
contract validation **0 errors / 0 warnings**, formatting and whitespace checks
all passed. Ordinary smoke has zero skips; nested mutation copies skip only
their two self-recursion probes. Those intentional inner skips are not skipped
product tests. Expected negative mutant runs are separate from ordinary passes.

The reference is still clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98`. Review 2 reuses the audited
same-S004 fmt/check/test guard (562 top-level plus 16 nested passes, zero
failures, four ignored) under the recorded bounded exception; no fresh Rust
execution is claimed. S005 must run its fresh guard.

No blocking finding remains. S005's existing shared-temp cleanup assertion
limitation is unchanged, explicitly dispatched next, and does not affect the
CLI. Keep independent contract suites sequential until fixed. No consumer,
SSR/browser or release-package acceptance is claimed. The S005 dispatch selects
the existing TypeScript compiler and Node runner without new dependencies and
specifies meaningful empty-run/failure and concurrency gates.

## Historical review 1 findings

### S004-R1 — Malformed metadata succeeds (P2)

`src/cli/main.ts` checks only that the name is a nonblank string. The version
expression permits empty prerelease/build identifiers and leading zeroes in
numeric prerelease identifiers. In disposable copies of the actual build,
Codex reproduced these results for `--version`:

| Metadata                                       | Actual result                 | Required result                      |
| ---------------------------------------------- | ----------------------------- | ------------------------------------ |
| name `wrong-package`                           | exit 0, `wrong-package 0.1.0` | exit 1; fixed product identity       |
| name containing a newline before `forged line` | exit 0, multiple stdout lines | exit 1; malformed name               |
| version `1.2.3-01`                             | exit 0                        | exit 1; invalid numeric prerelease   |
| version `1.2.3-..`                             | exit 0                        | exit 1; empty prerelease identifiers |
| version `1.2.3+..`                             | exit 0                        | exit 1; empty build identifiers      |

The version defects violate [SemVer 2.0.0](https://semver.org/) sections 9–10.
The valid changed version `2.3.4-rc.1+build.001` already prints correctly;
preserve that behavior. The source currently rejects a trailing version newline;
that check is passing, not an additional reproduced defect.

Codex clarified exact identity/valid-version requirements in the correction
dispatch. Keep validation dependency-free and diagnostics independent of raw
malformed values.

### S004-R2 — Smoke suite misses forbidden writes and hard-coded output (P2)

`tests/smoke/cli-bootstrap.test.mjs` snapshots only sorted path names and a
directory suffix. It does not compare file bytes, entry types or link targets.
The no-write assertions therefore miss modification of existing files.

Codex copied only the manifest, built output and smoke tests to a disposable
directory and applied two independent changes to the copied build:

1. Overwrite the pre-existing `.decoy-hidden` file when present in the cwd.
   All 27 smoke tests still passed, including the no-write assertion.
2. Replace metadata-derived version output with literal `svelte-ui-kit 0.1.0`.
   All 27 smoke tests still passed.

The real candidate source does not write files and does derive its version;
these are reproduced false-green regression gaps, not claims of existing
destructive product behavior. Snapshot actual contents and vary valid copied
package metadata so these requirements are independently enforced. Cover
representative rejected invocations in owned no-write fixtures as well.

### S004-R3 — Public evidence needs reconciliation (P3)

The candidate report reintroduced private workstation command names despite
the repository boundary rule, and omitted the initially blocked unrouted
format command and later formatting failure from its failure history. Codex
removed the private command names and marked this review as authoritative;
Pi must append complete correction evidence. Codex also clarified the
compatibility addendum to distinguish unchanged dependency versions from the
new package version. These reporting issues do not imply dependency drift.

## Independent passing evidence

Reviewed all new source/tests/configuration and changed docs/metadata, the S004
dispatch and relevant contracts, the actual author session and check logs.
Session model event and assistant metadata both confirm Pi used `ollama` /
`deepseek-v4.1-flash:cloud`. Initial four Codex bookkeeping hashes match the
author's preserved files. Lock/workspace/runtime-pin hashes match S003.

Using Node 24.21.0 and pnpm 11.22.0 with required environment diagnostics and
routing, Codex independently ran:

- Frozen strict-peer engine-strict install: exit 0.
- Typecheck and build: exit 0; dispatched strict configuration, no new deps.
- Executable smoke: 27/27, no failures or skips.
- Contract validation: zero errors and warnings.
- Contract suite: 83/83, no failures or skips, sequential.
- Formatting and Git whitespace checks: green.

The malformed-metadata probes and two disposable mutants above ran after those
normal checks and demonstrate why green suites do not confer acceptance.
All review fixtures were removed; actual implementation source was untouched.
The author log also confirms a real negative typecheck (TS2322, exit 2),
fixture removal and successful restored typecheck.

## Reference guard and resolved observation

Inspected Pi's fresh S004 fmt/check/test executions and their actual exits:
all 0; tests report 562 top-level plus 16 nested subprocess passes, zero
failures and four ignored slow tests. Codex independently verified clean
reference HEAD `a10fbf06334f4648f5755e05a7147414e4e5fc98`; no fresh
Codex Rust run is claimed. The report names the ignored tests.

Codex accepts Node's pre-module rejection of syntactically invalid package
JSON as satisfying this bootstrap's stderr/exit-1 contract. No wrapper or ESM
change is needed. Missing or semantically malformed metadata remains the CLI's
responsibility. Same-checkpoint reference evidence may be reused only under
the exact condition stated in the correction dispatch.

## Next action

Fresh Pi session: complete S004-R1–R3 and the original S004 scope, return a
candidate with null hash unstaged/uncommitted for independent review. Codex
owns scope decisions and acceptance. S005's separate contract-test temporary
namespace issue remains scheduled and untouched; run suites sequentially.
No consumer, SSR, browser or release-package acceptance exists yet, and no
human release test is due. Three checkpoints are complete; 200 remain across
all eleven unfinished sequences.
