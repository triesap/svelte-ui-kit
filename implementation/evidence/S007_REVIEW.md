# S007 independent review — changes requested

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S007","kind":"review","commit":null,"disposition":"changes_requested"}
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
