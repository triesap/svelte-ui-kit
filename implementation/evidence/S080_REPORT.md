# S080 step report — Bundled item metadata and source

Author: Codex. Implemented and locally verified; independent RCLD-05 acceptance
is pending. Original checkpoint and contract acceptance criteria are preserved.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S080","kind":"report","commit":"e7cefb3c4de25d724bef624e47da00a05c205250","disposition":"candidate"}
-->

The executable lazily injects read-only registry view after valid argument
classification. It uses only the validated package-relative registry snapshot,
returning exact item metadata and, with source mode, exact UTF-8 asset content,
logical source/target paths and digests. Unknown items are typed registry errors;
no application context is fabricated or inspected. Explicit cwd is irrelevant
for this bundled inspection and need not name an existing project.

Router checks: build/typecheck/lint/format/projection/validator pass. Integration
25/25 includes four executable view cases plus unchanged info/output controls;
assets unit8/8; bootstrap50/50. Isolated package tests use a real validated
representative item, compare metadata and source to bundled bytes and prove both
package and unrelated-cwd complete trees unchanged for JSON and human output.
The actual development registry remains honestly empty; no sample item is
advertised as shipped product. Source-item exposure will follow subsequent
catalog checkpoints. Logs:ignored `implementation/evidence/logs/codex-r10/s080-*`.

No project install/write, reference-source, remote or publication action. Rust
is absent in this TypeScript target; the prior unchanged reference guard remains
recorded. No fixture/browser acceptance is inferred. Next:S081 guarded init.
