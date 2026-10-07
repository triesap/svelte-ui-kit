# S086 step report — Executable exit and JSON matrix

Author: Codex. Implemented and locally verified; separate RCLD-05 acceptance
remains pending. Original S086 criteria and frozen protocol are preserved.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S086","kind":"report","commit":"5c70614220fb82b3fc55510df4f0d1931122a531","disposition":"candidate"}
-->

The built executable is qualified across all approved commands and frozen exit
classes/statuses. JSON flags before/after commands produce byte-identical
semantic output from separately rooted equivalent applications. Exactly one
schema-valid envelope is parsed even on failure; human failures use stderr with
empty stdout. Complete-tree snapshots guard read-only, dry-run and refused
paths. Planned/applied flags remain truthful.

Process qualification exposed causal adapter gaps: invalid consumer schema is
an ordinary error, not bundled registry failure; nonregular selected generated
write targets use unsafe exit11, not generic conflict. Unexpected command-load /
execution exceptions are sanitized into one error envelope (or human stderr)
with exit1, rather than a raw host stack. Controlled model/registry/conflict
outcomes retain their specific exits and approved mutation boundaries.

Router verification:22 process golden cases (three executions each:JSON before,
JSON after, human),13 output,4 add and14 sync controls (53/53), args unit lane,
bootstrap44/44, build/typecheck/lint/format/projection/contracts pass. All exits
0/1/2/3/10/11/12 are exercised, including unsupported project, no-change, warning,
conflict, selected unsafe target, invalid config and broken CLI dependency load.
No physical root paths, ANSI progress, second JSON object or stack leakage.
Logs:ignored `implementation/evidence/logs/codex-r10/s086-*`.

No browser/reference or publication acceptance is inferred. Independent sequence
review and remaining original gates/AC20 debt stay open. Next:S087 full workflow
purity/idempotence, without hidden package-manager or project-config execution.
