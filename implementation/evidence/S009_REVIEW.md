# S009 independent review

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S009","kind":"review","commit":null,"disposition":"changes_requested"}
-->

## Final independent review preparation — 2026-09-30

Reviewer: Codex. Tested combined source revision: `7d3401c9a19ca7915ff7f0c9c0280760c81b5509`.
Original implementation revision: `023cdf811505f5803ede334c57ee4a993073483e`.
Applicable repair revisions: `156f0104d5049162bfcce1921bf9b71bb7b6cb86`, `0c02a233e77c02850086cabd364e97a1fd83aa17`, `e8b402311ba8994d3bfea7a1ba77bb38ae48626b`.

Owned typed integration fixtures, byte/mode/tree snapshots, symlink containment, bounded FIFO failure controls, socket rejection without skips and cleanup.

Fresh Codex verification: format/lint/four-config typecheck; unit 20/20; runner harness 35/35; CLI smoke 41/41; fixture check zero errors/warnings; production build and SSR/lifecycle 23/23; components 22/22; Chromium 23/23; integration 15/15 with zero skips; contract validation zero errors/warnings and regressions 108/108. Independent prior-fault probes reject impossible/overflow totals and wrong workspaces, verify no version-test fixture leak, and verify valid PNG/ZIP signatures for all seven browser fault modes. The unchanged reference author-run fmt/check/test exits and logs were audited: 578 passed, zero failed, four ignored; these are not fresh Codex Rust executions. Fresh author checksum-verified actionlint 1.7.12 exited 0. Source, callers, all six original checkpoint criteria, prior reviews and the complete repair chain were inspected.

All applicable original checkpoint requirements and prior review findings pass
on this combined candidate. Structured metadata remains pending solely until
the approved whole-batch evidence commit and atomic acceptance transition.
The original snapshot did not contain the later repairs; preserve its history.

This accepts the bootstrap requirements only. The two genuine upstream Bits declaration complexity errors remain a qualified fixture-only exception and an open release AC20 obligation. Remote CI, other platforms, package/tarball acceptance, human release tests and the remaining 191 checkpoints are not accepted here. One author contract-fixture construction attempt reported ENOTEMPTY during cleanup and masked its cause; subsequent full author runs and the fresh Codex run pass. Preserve the failure and improve cause retention in the next tooling slice without claiming its cause was established.
