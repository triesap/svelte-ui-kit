# S005 independent review — accepted

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S005","kind":"review","commit":null,"disposition":"accepted"}
-->

Reviewer: Codex. Date: 2026-09-29. Baseline:
`fd5d5162c7e5e3fa22fcc8a0365525f4e0e6a100` (`master`, accepted S004).
Review 2 accepts S005 as `verified_uncommitted`; S006 unlocks only after the
checkpoint commit. Review 1 below is historical. This review examined
the full runner, its regression suite, typed bootstrap test, fixture changes,
affected configuration/docs, author session and verification logs.

## Review 2 — acceptance

Codex read the corrected runner and complete 29-test harness, all affected
configuration/docs, author session and correction logs. Provider/model metadata
again confirms `ollama` / `deepseek-v4.1-flash:cloud`. R1–R3 are closed.

- R1: independent original root/parent-symlink probes now reject with empty
  stdout, absolute operands reject, and dangling output links stop at the
  non-following guard without creating their target.
- R2: the original regular `..legal.test.ts` probe now succeeds under both
  discovery and explicit selection. The ephemeral config compiles all
  discovered entries without weakening inherited configuration or mutating
  tracked files. Expanded regressions cover dot directories and unselected
  sibling compiler errors.
- R3: imported failure names and error causes are preserved and attributed to
  the selected entry. Ordinary and TODO failures, cancellation and abnormal
  exit fail consistently. The suite includes imported TODO and inline/imported
  diagnostic cases; independent probes confirm original error messages,
  abnormal exit 7 and late errors remain nonzero. Aggregate/stray-failure guards
  are implemented; no separate real-Node aggregate-only reproduction is claimed.

Independent Node 24.21.0 / pnpm 11.22.0 verification passed: frozen strict-peer
engine-strict install, both typechecks, product build through the unit command,
unit 5/5, expanded harness 29/29, smoke 41/41, contracts 84/84, validation
0 errors / 0 warnings, formatting and target whitespace. Ordinary lanes have
zero skips. The existing verified ownership fix is unchanged; the author's
repeated overlapping suites each passed 84/84. Review 1's independent overlap
evidence remains valid; review 2 did not repeat that unchanged concurrency gate.

The reference remains clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98`. Same-S005 audited guard reuse
is explicit: fmt/check/test exit 0, 562 top-level plus 16 nested passes, zero
failures, four ignored. No fresh Rust execution is claimed. S006 requires a
fresh guard.

Codex resolves the author's typecheck observation: standalone `typecheck`
retains tracked-config glob coverage, while mandatory `test:unit` compiles the
full discovered set including dot-prefixed entries. Both lanes are required;
no additional command or config mutation is needed for S005. Diagnostic source
filenames are hints: line/column values and raw stacks describe emitted code,
not source-map-accurate TypeScript positions. This is an explicit diagnostic
limitation, not an unverified failure gate or a claim of source-map support.

Codex again removed an operator-specific command from the appended public
report and retained the author's failed-attempt history. No implementation
source was authored by Codex. No blocking finding remains. S006's complete
lint/format dispatch is prepared with exact dependency decisions and meaningful
nonmutation/negative gates. No consumer, SSR/browser or release readiness is
claimed.

## Historical review 1 findings

### S005-R1 — Symlinked roots bypass selection containment (P2)

`tools/run-unit-tests.mjs` follows `tests/unit` in discovery and compares an
explicit operand against the resolved unit root itself. In disposable package
copies, replacing `tests/unit` with a link to an external test directory yields
exit 0 and executes that directory's test under both default and explicit
selection. Replacing the parent `tests` directory also yields exit 0. The
boundary therefore moves with the link instead of rejecting an escape.

An absolute operand inside the tree is also accepted despite the documented
repository-relative contract. A dangling output symlink bypasses the
`existsSync` guard and reaches the compiler. That probe exits 1 on compiler
ENOENT and does not write an external target; it is a missing early guard,
not evidence of external deletion or a successful run.

The correction dispatch requires package-anchored component checks and a
non-following output-root check, with sentinels proving rejection precedes
cleanup/compilation/execution.

### S005-R2 — Discovery accepts files the compiler never emits (P2)

A regular `tests/unit/..legal.test.ts` containing one passing test is selected
by default discovery, but the glob-based TypeScript include does not emit it.
The runner exits 1 with `compiled output missing` after a successful compile.
Explicit selection rejects the same in-tree filename as an escape because
`isContained` mistakes every `..` prefix for a parent path segment.

All regular test entries remain in scope. The dispatch authorizes an ignored
extending compiler configuration with an explicit discovered file set; no
dependency, weakened typecheck or tracked-config mutation is needed. Add
positive coverage for dot-prefixed files and directories in both modes.

### S005-R3 — Failure details and policy depend on definition location (P2)

The event handler keys failures only by `data.file`, not the child `entryFile`.
A failing test defined in an imported helper returns exit 1 from the summary,
but prints only `1 failing test(s)` and loses its name and error. Even an inline
named assertion drops its explicit assertion message and actual/expected values.
The load-error probe does preserve captured exception text; it is not the same
failure as the structured assertion-detail loss.

The same throwing TODO callback beside a passing test exits 1 when defined
inline, but exits 0 when defined in an imported helper. The imported failure
event is never associated with the selected file, while Node's summary counts
the callback as TODO rather than failed. The strict policy is now explicit:
every failure event is fatal, including TODO-marked ones; moving the definition
must not change the result. TODO/skipped-only selections still fail.

Use entry identity for attribution and preserve source identity for diagnostics,
as described by the [Node test event documentation](https://nodejs.org/docs/latest-v24.x/api/test.html#class-testsstream).
Also honor unsuccessful aggregate summaries and unassigned failure events; the
current aggregate branch only checks cancellations. No separate aggregate-only
false-green was reproduced, so that guard is a resolved implementation
requirement, not an additional claimed reproduction.

## Independent verification and accepted subwork

Under Node 24.21.0 / pnpm 11.22.0, Codex independently ran:

- Both TypeScript checks: exit 0.
- Product build through `test:unit`, default unit 5/5: exit 0.
- Existing harness 13/13 and CLI smoke 41/41: exit 0, zero ordinary skips.
- Contract validation: 0 errors / 0 warnings; contract suite 84/84: exit 0.
- Two overlapping full contract suites: each 84/84, both actual exits 0.
- Formatting and unstaged/staged whitespace checks: exit 0 before review edits.

The owned-parent construction-failure cleanup correction is verified. Unrelated
live allocations are preserved, and the retained-owned-fixture test still
detects a leak. No contract validator semantics were changed. Product source,
product compiler config, smoke suite, runtime pins, lockfile and workspace
manifest have no S005 diff. The existing four S004 post-commit bookkeeping
changes remain intact.

Disposable reviewer probes additionally confirm abnormal exit 7, a late
uncaught exception, skipped-only suites, imported ordinary assertion failure
and explicit test-timeout cancellation all return nonzero. Ordinary controls
pass. An unsettled promise exceeded the reviewer's watchdog with both the
candidate and the native Node invocation; it is unverified completion behavior,
not an accepted cancellation test or a candidate-specific defect. No reviewer
probe was placed in the real unit source tree and owned fixtures were removed.

The author session confirms provider `ollama`, model
`deepseek-v4.1-flash:cloud`. Author logs/session confirm the strict frozen
install, default/explicit unit execution and fresh conditional reference guard.
Codex audited reference fmt/check/test exit 0, 562 top-level plus 16 nested
passes, zero failures, four ignored; no fresh reviewer Rust run is claimed.
The reference is still clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98`. Same-S005 correction reuse is
authorized by the governing dispatch, conditional on unchanged identity/scope.

The initial report included operator-specific command wording despite the
public-repository boundary. Codex removed it and added the review disposition;
this documentation issue is corrected. The author's formatting retries and
failed overlap setup remain historical, not passing test executions.

During the review-document update, Codex initially inserted an ordinary link
to current S005 evidence into the governing plan. Historical fixture scenarios
intentionally omit that later evidence, so the post-edit contract run failed
at fixture construction (14 passes, 70 failures). Codex restored the established
plain code-path reference convention; no fixture/validator code or assertion
was weakened. The failed run is retained separately. The restored full suite
passed 84/84 (exit 0); final contract validation, formatting and target
whitespace checks also passed.

## Disposition

Review 1 requested R1–R3; review 2 above closes them and accepts S005 pending
its checkpoint commit. Human release testing is not due.
