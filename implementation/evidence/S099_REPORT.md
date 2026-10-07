# S099 step report — Native Button API and types

Author: Codex. Candidate; independent S115 acceptance remains pending.
Original requirements and accepted S001–S091 are preserved.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S099","kind":"report","commit":null,"disposition":"candidate"}
-->

The source component and full stylesheet mapping records immutable source links,
native Svelte button attributes, public Button/Props/Variant/Size names and the
exact primary/secondary/ghost and sm/md/lg unions. Default type button and
submit/reset opt-in remain native. Children is a required Svelte Snippet; ref
is an optional explicit HTMLButtonElement/null binding rather than an attribute.
Loading/disabled/busy ownership, Loading label default, decorative sibling
Spinner, direct imports, caller classes and native handler forwarding are
specified before implementation. Caller aria-busy is omitted to avoid state
contradiction; native form/data/aria/event attributes remain supported. No
polymorphism, generic dictionary, hidden primitive runtime or event merge is
introduced. Actual binding/runtime behavior is scheduled for S100/S101.

Twelve real pinned TypeScript compiler fixtures pass: positive native forms,
data/aria/classes/handlers, loading, ref and snippet types; negative unknown
variants/sizes, href/as, foreign ref/event targets, invalid/missing children,
contradictory busy, and invalid loading/label types. Every refusal is in the
actual consuming fixture, not an unresolved library/import. The first href
control correctly emitted TS2561 with a ref spelling suggestion; its expected
excess-property diagnostic inventory was corrected without changing product
types. Original failure is retained. Fixture check zero errors/warnings,
typecheck, lint, formatting and governing contracts/projection pass.

Raw evidence: `implementation/evidence/logs/codex-r10/s099-*`. Conditional Cargo
is N/A. Runtime implementation, CSS, registry installation and browser/form
qualification remain S100/S101. AC20, later requirements and independent
sequence acceptance remain open; no complete Button/MVP acceptance is claimed.
