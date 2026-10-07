# S087 step report — Complete workflow purity

Current disposition: independently accepted on corrected combined candidate
`dbd54903a5954d1139cda63413a041498379edc8`, with separate review evidence at
`c6aaf147dbf6316a96420fd5136a717f3665f711`. See the matching review and
[RCLD-05 qualification](RCLD-05_QUALIFICATION.md). Original implementation
provenance and author observations below remain historical evidence; earlier
pending-acceptance wording is superseded by this disposition.

Author: Codex. Implemented and locally verified; independent RCLD-05 acceptance
remains pending. Original S087 criteria are preserved.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S087","kind":"report","commit":"c6aaf147dbf6316a96420fd5136a717f3665f711","disposition":"implemented"}
-->

Actual built package workflows use default and explicit custom mapping (including
dynamic Svelte routes). They exercise info/view/init/add/sync/doctor, dry runs,
replays and genuine integration refusals. Complete snapshots include hidden
entries, directory/file modes, bytes and manifests. Two explicit request orders
produce identical complete desired trees, before and after identical user drift.
Package-manager executable traps, a postinstall trap and a side-effect-bearing
project configuration remain unexecuted throughout; no installation, dependency
lock edit or unsafe configuration evaluation occurs.

The retained initial regression reproduces info rejecting a valid explicit
mapping that accepted planners permit. Info now consumes the original captured
shared effective mapping, including installed explicit requests. It preserves
identity, manager, ambiguous/malformed/unsafe configuration refusal and does not
claim an unproven statically detected configuration filename.

Verification: workflow2/2, executable exit22/22 and existing info8/8 (32/32),
build/typecheck/lint/format/projection/contracts pass. The workflow lane was
repeated after adding an explicit pre-customization equivalence assertion.
Logs: ignored `implementation/evidence/logs/codex-r10/s087-*`.

No browser, reference, platform or release acceptance is inferred. AC20 and
mandatory separate S091 review remain open. Next:S088 version-aware parsing
without guessed migration or legacy compatibility.
