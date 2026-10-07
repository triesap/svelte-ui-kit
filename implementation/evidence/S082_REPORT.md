# S082 step report — Explicit add through guarded apply

Current disposition: independently accepted on corrected combined candidate
`dbd54903a5954d1139cda63413a041498379edc8`, with separate review evidence at
`c6aaf147dbf6316a96420fd5136a717f3665f711`. See the matching review and
[RCLD-05 qualification](RCLD-05_QUALIFICATION.md). Original implementation
provenance and author observations below remain historical evidence; earlier
pending-acceptance wording is superseded by this disposition.

Author: Codex. Implemented and locally verified; independent RCLD-05 acceptance
remains pending. Original checkpoint/contract criteria are unchanged.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S082","kind":"report","commit":"c6aaf147dbf6316a96420fd5136a717f3665f711","disposition":"implemented"}
-->

The executable accepts the frozen one-item grammar and captures effective
mapping, selected incoming closure and existing lock inventory before original
`planAdd`. Captured lock lineage is parsed again from snapshot bytes; new mapping
or inventory gaps refuse without a live recapture. Actual registry, snapshot and
planner export receipts are composed/sealed before dry-run or guarded apply.
Conflicts return no changes and cause no config-only effects. Request projection
keeps transitive provenance separate from explicit config roots.

Dependency states and manual commands are distinct result data. Missing upstream
metadata blocks the original peer audit. An executable source plan with reported
runtime readiness gaps emits warnings and never claims runtime readiness or
installs/edits packages. Required peer and invalid-evidence gates are retained.

Router verification: build/typecheck/lint/format/projection/contracts pass;
add4/4 and established apply7/7 (11/11), bootstrap47/47. Isolated actual executable
cases cover default/custom closure install, value/type ownership, explicit-only
requests, dry-run complete-tree purity, replay, untracked whole-batch conflict,
missing/incompatible runtime states and instructions, and unchanged manifest /
installed metadata after a source-only warning outcome. Raw logs remain ignored
at `implementation/evidence/logs/codex-r10/s082-*`.

Initial test assumptions incorrectly conflated declaration readiness and actual
peer-audit blockers; the final cases match the accepted core policy and preserve
its refusal gates. Placeholder bootstrap expectations for implemented add were
replaced by executable integration coverage. No whole-feature or independent
acceptance is inferred; full command matrix remains S086. No reference/browser
rerun, push or publication is attributed to this slice. Next:S083 sync.
