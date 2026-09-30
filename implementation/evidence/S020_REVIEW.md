# S020 independent review

Current disposition: independently accepted by Codex on 2026-09-30 at combined evidence anchor `0e5b1852d02e15159f2ee4dd885152230457e119`. Original implementation `b9cb6cc47313bb23614014f6562140ae89a42932` remains provenance. Historical candidate/pending statements below are superseded by this acceptance; later requirements and release AC20 remain open.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S020","kind":"review","commit":"0e5b1852d02e15159f2ee4dd885152230457e119","disposition":"accepted"}
-->

## Final independent review preparation — 2026-09-30

Reviewer: Codex. Combined tested candidate: `78869b98cea57b79abb287d135fe73524a40a517`. Original implementation: `b9cb6cc47313bb23614014f6562140ae89a42932`. Final production repair: `0636f9f1a59ca2c215552764ef0955a43f7fa4a3`. Earlier implementation and repair history remains provenance.

Reviewed scope: Add CSS-block and integration lock records. Compared the original S020 definition, associated contracts, actual source/callers, emitted modules and tests with every outstanding RCLD-02 review finding. RCLD02-R4-1 and R4-2 are closed on this combined candidate; previous closures and RCLD-01 acceptance remain valid.

Fresh Codex checks on the combined candidate: build, format, lint and five-config typecheck exit 0; unit 203/203; runner harness 37/37; registry 38/38; integration 23/23 including eight emitted installed-copy controls; CLI 52/52; components 22/22 including the strict-declaration negative controls; consumer check zero errors/warnings; fresh production build and SSR/lifecycle 23/23; Chromium 23/23; contract regressions 117/117. All these lanes passed with zero skipped tests. Browser invocation removed inherited NO_COLOR per process. Replayed original schema/asset/CLI/joint-compatibility/ownership/I/O probes pass, including all nine former cross-role negatives and the valid aggregate-sharing control.

Audited author qualification at the production repair: frozen strict install and checksum-verified actionlint 1.7.12 passed; reference fmt/check/test passed at unchanged clean `a10fbf06334f4648f5755e05a7147414e4e5fc98`, 578 passed, zero failed, four ignored. These are audited author results, not fresh Codex Rust/install/actionlint executions. See `RCLD-02_QUALIFICATION.md` for the retained author evidence.

The author encountered an iterator flatMap type error and a 25/27 ownership-test attempt caused by an incorrectly constructed ancestor fixture; both were corrected before the final green product commit. The earlier malformed-context unit and formatting failures remain historical. Some native shell pipelines reported a trailing command status; acceptance relies on explicit underlying exits, complete retained evidence and fresh checks above, not those pipeline statuses.

All applicable original criteria pass. This record is pending only until the whole-batch evidence anchor and atomic twenty-checkpoint acceptance transition. It is not permission to advance early. The two qualified upstream Bits declaration complexity diagnostics remain fixture-only exception/release AC20 debt. Later planner, transaction, CLI workflow, catalog, cross-platform and packed-release requirements are not accepted here.
