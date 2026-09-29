# S006 independent review — accepted

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S006","kind":"review","commit":null,"disposition":"accepted"}
-->

Reviewer: Codex. Date: 2026-09-29. Baseline:
`5cf149106fbc7c9fb20eca1f31a0e5b08aff4b11` (`master`, accepted S005).
S006 is `verified_uncommitted`; S007 stays locked until the checkpoint commit.
Review covered the
complete lint/formatter configuration, typed tooling suite, two smoke edits,
package/lock changes, affected documentation, author session and logs.

## Review 2 acceptance — S006-R1 closed

Codex reviewed the entire corrected configuration and nine-case typed tooling
suite, developer guidance, report, author session metadata and correction logs.
All seven reserved directory names now use recursive global exclusions. The
tests exercise root, nested consumer and deeper consumer-source output trees;
real maintained TS/Svelte source in consumer and registry paths still fails
for intended diagnostics and returns green after repair. The new package-entry
symlinks allow root dependency probes without writing into installed packages.
Fixture and unrelated-application snapshots remain intact.

Independent rerun of the original review probes now gives lint/format exit 0
for all five formerly failing nested directories and the explicit generated
boundary. A maintained `src/lib` defect still gives exit 1 for both tools.
The author's negative-control log records 8/9 passing with root-only patterns
and the intended recursive-boundary failure; the restored configuration is
green. This closes R1; no blocking finding remains.

Independent Node 24.21.0 / pnpm 11.22.0 verification: frozen strict-peer and
engine-strict install, lint, format, both typechecks and build passed; unit
14/14 (5 bootstrap + 9 tooling), harness 29/29, CLI smoke 41/41 and contracts
84/84 passed. Real lint/format preserved all 71 tracked and untracked authoring
entries byte-for-byte and mode-for-mode before these acceptance edits.
Original probes ran in disposable copies and were removed.

Session model-change and assistant metadata confirm correction provider/model
`ollama` / `deepseek-v4.1-flash:cloud`. The reference remains clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98`; audited S006 reference evidence
is reused under the same-checkpoint exception, not reported as a fresh run.
Codex removed a workstation-specific command from the public report while
preserving its execution evidence. No implementation code was authored by Codex.

S007 dispatch now resolves fixture membership, exact dependency additions,
production Node adapter, real check/build/HTTP SSR proof and failure controls.
Browser/hydration, generated wrapper and package/release qualification remain
future checkpoints. No human release testing is due.

## Historical review 1 — S006-R1, nested generated outputs (P2)

`eslint.config.mjs` uses root-relative ignore patterns such as `.svelte-kit/`
and `build/`. ESLint flat-config directory patterns do not implicitly match
those names at every depth. The upcoming maintained consumer fixture is nested,
so its generated output falls back into the authoring lint scope.

In a disposable package with the actual scripts/configurations and installed
tools, Codex wrote `const  unused=1` to `bad.ts` under each directory below:

| Directory                              | Lint exit | Format-check exit | Expected |
| -------------------------------------- | --------- | ----------------- | -------- |
| `tests/fixtures/consumer/.svelte-kit/` | 1         | 0                 | Both 0   |
| `tests/fixtures/consumer/build/`       | 1         | 0                 | Both 0   |
| `tests/fixtures/consumer/dist/`        | 1         | 0                 | Both 0   |
| `tests/fixtures/consumer/coverage/`    | 1         | 0                 | Both 0   |
| `tests/fixtures/consumer/.pnpm-store/` | 1         | 0                 | Both 0   |
| `tests/fixtures/generated/`            | 0         | 0                 | Both 0   |
| `src/lib/` (maintained-source control) | 1         | 1                 | Both 1   |

The lint failures identify the deliberately unused binding, not a setup crash.
A clean control passes both commands. These are direct reproductions of the
scope mismatch, not a claim that a real S007 app already exists. The original
tooling suite exercises root-level build outputs and misses the nested case.

Use recursive reserved-directory exclusions as resolved in the governing
correction dispatch. Add nested positive exclusion and nearby maintained-source
negative cases, without broadening ignores to all consumer/tests/registry code.
The required glob distinction is documented in the
[ESLint directory-ignore guide](https://eslint.org/docs/latest/use/configure/ignore#ignore-directories).

## Verified subwork and resolved decisions

- All seven new exact development pins match the approved selection. Existing
  direct pins, runtime/workspace identity and package metadata are preserved.
  Lock inspection found 113 added package records and no removed existing
  package records; peer-context suffix changes accompany the additions.
  Independent frozen strict-peer engine-strict installation passed.
- The two smoke changes only remove unused destructured bindings. No assertion
  or behavior was removed; independent smoke remains 41/41.
- Codex explicitly accepts `svelte/valid-compile: error`. It supplies required
  compiler/accessibility checks absent from the recommended preset alone.
  Independent tooling execution proves the intended TS lint, Svelte compiler
  and accessibility failures, valid restores and nonmutation. Keep the rule.
- Source/CLI, unit runner, contract validator, both compiler configurations,
  runtime pin and workspace manifest have no S006 changes. Accepted S005
  bookkeeping is preserved.
- Independent real lint and format checks preserved bytes/modes/entry identity
  for all 70 tracked and untracked authoring entries present before review
  edits. This includes the new config/test/report, which the author's
  tracked-only checksum list did not cover. That strengthens the evidence;
  no real-tree mutation was observed.

## Independent verification

Under Node 24.21.0 / pnpm 11.22.0, all these executed successfully:

- Frozen strict install, lint, format check and both compiler typechecks.
- Product build through full unit execution: 13 tests (5 bootstrap + 8 tooling).
- Unit-runner harness: 29/29; CLI smoke: 41/41; contract suite: 84/84.
- Contract validation: 0 errors / 0 warnings; target whitespace checks clean.
- Real authoring nonmutation probe covering tracked and untracked inputs.

These ordinary passes do not close R1: the added nested-output probes fail as
shown above. Fixtures were disposable and removed. No negative input was placed
in the real unit tree and no implementation source was authored by Codex.

Session model-change and response metadata confirm Pi used provider `ollama`,
model `deepseek-v4.1-flash:cloud`. The reported format retry and reference
attempt history are retained. Codex audited fresh S006 reference evidence:
fmt and check exit 0; final test run has a captured exit 0, 562 top-level
passes plus 16 nested passes, zero failures and four ignored. The first test
attempt timed out; the second completed but lacked a captured exit. Only the
third run supplies final exit evidence. No fresh reviewer Rust run is claimed.
The reference remains clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98`; reuse for this same-checkpoint
correction is authorized in the governing dispatch, subject to unchanged
identity/scope/evidence.

## Historical review 1 disposition

Changes requested for S006-R1. Complete the recursive-output scope correction,
regressions, truthful evidence and all S006 target gates in the next Pi work
period. No owner decision remains pending. S007, consumer/SSR/browser testing
and release qualification remain ahead; human release testing is not due.
