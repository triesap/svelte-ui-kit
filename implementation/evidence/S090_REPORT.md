# S090 step report — Packed standalone inventory

Current disposition: independently accepted on corrected combined candidate
`dbd54903a5954d1139cda63413a041498379edc8`, with separate review evidence at
`c6aaf147dbf6316a96420fd5136a717f3665f711`. See the matching review and
[RCLD-05 qualification](RCLD-05_QUALIFICATION.md). Original implementation
provenance and author observations below remain historical evidence; earlier
pending-acceptance wording is superseded by this disposition.

Author: Codex. Implemented/locally verified; independent S091 acceptance pending.
Original packaging and no-authoring-fallback criteria remain unchanged.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S090","kind":"report","commit":"c6aaf147dbf6316a96420fd5136a717f3665f711","disposition":"implemented"}
-->

The existing explicit files/bin/module metadata is qualified against a real pnpm
pack --json tarball created in owned temporary storage. Every built module,
schema and registry file matches exact authoring bytes; the executable has its
shebang and executable permission. Inventory excludes tests, tools, source,
implementation logs/state, dependencies and Git contents. Licenses remain packed.
The package remains private; packing does not publish or install it.

An extracted package with explicit existing dependency linkage loads the same
integrity-checked registry and executes help/view from an unrelated empty CWD.
The current shipped registry is honestly empty: view refuses an unknown item
with REGISTRY_ITEM_UNKNOWN, rather than claiming fictional shipped components.
The test automatically qualifies every actual shipped item as the catalog grows.
No authoring-tree source/registry fallback is introduced.

The established guarded typed runner now has a separate package lane/output
configuration, included in typecheck and local/CI command maps. Two causal harness
controls verify selection/output isolation and empty-suite failure; no new test
framework/dependency is introduced.

Checks: real packed inventory1/1, package harness2/2, build/typecheck/lint,
actionlint1.7.12, format/projection/contracts pass. Initial incorrect fixture
expectation for an unknown-item diagnostic was corrected to the actual public
code; the red log is retained. Logs:ignored
`implementation/evidence/logs/codex-r10/s090-*`.
No remote CI, Windows, publication or full release acceptance is claimed. Next:
S091 current workflow docs and cumulative generator qualification, then separate
independent review before S092. AC20 and later original gates remain open.
