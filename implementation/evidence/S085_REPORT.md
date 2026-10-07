# S085 step report — Customization and strict failure

Author: Codex. Implemented and locally verified; independent RCLD-05 acceptance
remains pending. Original S085/R19 criteria and ownership rules are unchanged.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S085","kind":"report","commit":null,"disposition":"candidate"}
-->

Doctor parses owned Svelte/TypeScript source and standalone CSS with the pinned
parsers, without executing consumer code. Required named source exports remain
present; valid aliases/classes are not rejected because lexical export kind is
not a complete TypeScript type-system proof. Parseable source/CSS body drift is
reported as customization, preserving lock base hashes and local bytes. Strict
escalation is reserved for broken/unsafe checks, not drift alone. This is a
structural/syntax diagnosis, not a replacement for a consumer typecheck/build.

Router checks:18 default/custom executable customization cases plus10 structural
and2 representative lifecycle controls (30/30), build/typecheck/lint/format and
projection/contracts pass. Valid source, CSS including literal closing-style
text, TypeScript alias and class customization remain strict exit0. Malformed
source/CSS, dropped named exports, missing files and unsafe symlink targets fail
strict exit3. Human failure channel and JSON outcomes agree. Complete-tree
snapshots retain bytes/modes/metadata and hidden state across every diagnosis.

Qualification detected the representative fixture's lowercase `cardProps` body
contradicting its declared `CardProps` export; the helper now emits the declared
name. The separate existing consumer/SSR recipe already used the correct name;
its prior evidence is not relabeled. Failed fixture qualification is retained
in ignored author logs. Final logs: `implementation/evidence/logs/codex-r10/s085-*`.
No browser/reference or whole consumer qualification is inferred from parser
checks. AC20 debt/platform/gates remain open. Next:S086 process exit/JSON matrix.
