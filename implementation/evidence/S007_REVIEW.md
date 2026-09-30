# S007 independent review — accepted

Current disposition: independently accepted by Codex on 2026-09-30 at evidence
anchor `0d7ca2a3798f639dd6f913b2c3ed9839776bcd4c`, containing both report and review
paths and the tested combined implementation. The atomic S007–S012 transition
closes RCLD-01 only; release AC20 and successor requirements remain open.
Earlier pending/change-requested statements below are historical.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S007","kind":"review","commit":"0d7ca2a3798f639dd6f913b2c3ed9839776bcd4c","disposition":"accepted"}
-->

Reviewer: Codex. Date: 2026-09-29. Accepted baseline:
`bce30a4b7b5bf0e885d9991719f807cfda98ad63` (S006, master).
S007 is not accepted or committed. The owner subsequently authorized Pi to
verify and commit the remaining RCLD-01 checkpoints as a batch; the governing
batch dispatch supersedes the earlier return-after-each-checkpoint rule.
Independent acceptance remains with Codex after that batch.

Review covered all eight fixture files, both new smoke files, manifest and
workspace changes, lockfile additions, affected guidance/report, author session
metadata and logs. The fixture dependency set and unchanged root pins match
the dispatch. The real app, request-local server load, typed layout and native
controls are a useful baseline; the findings concern verification reliability.

## S007-R1 — Server lifecycle and request failures can escape the gate (P2)

In `tests/smoke/consumer-fixture.test.mjs`, `startOwnedServer` collects stderr
but never checks it. Its exit listener only rejects the startup promise;
after readiness that promise is already resolved. `stop` silently returns if
the server has already exited, regardless of exit code. `fetchRoute` has no
explicit deadline for either response headers or body consumption. The
candidate therefore does not implement the dispatched bounded-request and
unexpected-server-error requirements.

Independent disposable copies of the actual suite/launcher, still testing the
real built application, produced these false passes:

- Inject `Error: injected production server failure` into launcher stderr:
  exit 0, tests 5/pass 5.
- Make the maintained server exit 17 after readiness and after its initial
  requests: exit 0, tests 5/pass 5. The later negative tests continue while
  the dead shared server is never used again, and teardown ignores the exit.

Require persistent health/error tracking through teardown, distinguish an
intentional shutdown from an unexpected exit, and fail on unexpected stderr.
Apply explicit deadlines covering fetch and response-body reading. Add
fault-driven regression proof for startup failure, post-ready exit/error,
stalled headers/body and cleanup after assertion failure. Register disposable
directory cleanup immediately after allocation, before copying/linking can
throw. Keep child termination bounded and scoped to owned processes.

The documented no-argument launcher also resolves the wrong path:
`../../fixtures/consumer/build/handler.js` points outside `tests/`. Running it
without an operand exits 1 with ERR_MODULE_NOT_FOUND while the maintained
build exists. Correct and test the advertised default (and explicit operand).

## S007-R2 — SSR-disabled control accepts an unrelated failure (P2)

The broad `assert.throws(() => assertServerRendered(...))` accepts a failure
of HTTP status or content type, as well as the intended missing SSR markup.
An independent disposable launcher serving HTTP 500/text/plain only for the
SSR-disabled copy still yields exit 0, tests 5/pass 5 for the full suite.

Assert successful HTTP transport/status and HTML content type outside the
expected-failure assertion. Require the failure to identify missing visible
SSR markup specifically. Add a control showing HTTP 500 or invalid content
type fails the suite rather than satisfying the SSR-disabled case. Preserve
the real disabled-SSR build and the real TypeScript mismatch/restoration proof.

## Independent verification and admitted subwork

Node 24.21.0 / pnpm 11.22.0, after a successful environment diagnostic:

- Frozen strict-peer engine-strict workspace installation passed.
- Real fixture check: 0 errors / 0 warnings. Production build + ordinary SSR
  suite passed 5/5, including the existing type and SSR-disabled controls.
- Both CLI/unit typechecks, product build and unit 14/14 passed.
- Runner harness 29/29, CLI smoke 41/41 and contracts 84/84 passed.
- Lint/format passed after generated output existed and preserved all 82
  tracked/untracked authoring entries before review edits. Whitespace clean.
- Session model-change and assistant metadata confirm provider `ollama`,
  model `deepseek-v4.1-flash:cloud`.
- The author's fresh reference guard has captured fmt/check/test exits 0;
  test evidence has 562 top-level plus 16 nested passes, zero failures and
  four previously identified ignored tests. Initial check contention was
  retried. Reference is clean at
  `a10fbf06334f4648f5755e05a7147414e4e5fc98`. No reviewer Rust rerun claimed.

The ordinary green suite does not close the reproduced false passes. Probe
copies were removed; no implementation source was edited by Codex.

Codex accepts the observed escaped `<` output without requiring `>` escaping,
and the actual assignability diagnostic without requiring a numeric diagnostic
code absent from the tool's human output. These are not compatibility defects.
Public evidence must omit workstation-specific tool names; Codex normalized
the report wording without changing the execution record.

## Disposition and batch continuation

Changes requested for R1 and R2. Pi must fix and verify them before the S007
implementation commit, then continue through S008–S012 under the full bounded
`pfc through RCLD-01` dispatch. Codex owns consequential decisions and reviews
the whole returned sequence. Pi's commits must be labelled pending independent
review, never accepted on Codex's behalf. Stop before S013. Human release
testing is not due.

## Final independent review preparation — 2026-09-30

Reviewer: Codex. Tested combined source revision: `7d3401c9a19ca7915ff7f0c9c0280760c81b5509`.
Original implementation revision: `99212955c2b812ef6bc525c9cdca14fae4e6499a`.
Applicable repair revisions: `8f58879f86b376252125aa52ca39db0384183c6d`, `abeedd301c634461ae791618311462ffd575af23`.

Real SvelteKit/Node-adapter production consumer, typed request-local SSR, safe bounded owned-server lifetime and strict failure controls.

Fresh Codex verification: format/lint/four-config typecheck; unit 20/20; runner harness 35/35; CLI smoke 41/41; fixture check zero errors/warnings; production build and SSR/lifecycle 23/23; components 22/22; Chromium 23/23; integration 15/15 with zero skips; contract validation zero errors/warnings and regressions 108/108. Independent prior-fault probes reject impossible/overflow totals and wrong workspaces, verify no version-test fixture leak, and verify valid PNG/ZIP signatures for all seven browser fault modes. The unchanged reference author-run fmt/check/test exits and logs were audited: 578 passed, zero failed, four ignored; these are not fresh Codex Rust executions. Fresh author checksum-verified actionlint 1.7.12 exited 0. Source, callers, all six original checkpoint criteria, prior reviews and the complete repair chain were inspected.

All applicable original checkpoint requirements and prior review findings pass
on this combined candidate. Structured metadata remains pending solely until
the approved whole-batch evidence commit and atomic acceptance transition.
The original snapshot did not contain the later repairs; preserve its history.

This accepts the bootstrap requirements only. The two genuine upstream Bits declaration complexity errors remain a qualified fixture-only exception and an open release AC20 obligation. Remote CI, other platforms, package/tarball acceptance, human release tests and the remaining 191 checkpoints are not accepted here. One author contract-fixture construction attempt reported ENOTEMPTY during cleanup and masked its cause; subsequent full author runs and the fresh Codex run pass. Preserve the failure and improve cause retention in the next tooling slice without claiming its cause was established.
