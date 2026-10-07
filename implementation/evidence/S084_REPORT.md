# S084 step report — Read-only structural doctor

Current disposition: independently accepted on corrected combined candidate
`dbd54903a5954d1139cda63413a041498379edc8`, with separate review evidence at
`c6aaf147dbf6316a96420fd5136a717f3665f711`. See the matching review and
[RCLD-05 qualification](RCLD-05_QUALIFICATION.md). Original implementation
provenance and author observations below remain historical evidence; earlier
pending-acceptance wording is superseded by this disposition.

Author: Codex. Implemented and locally verified; separate RCLD-05 acceptance
remains pending. Original S084 requirements and contracts are preserved.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S084","kind":"report","commit":"c6aaf147dbf6316a96420fd5136a717f3665f711","disposition":"implemented"}
-->

Doctor consumes captured selected-project/config/lock/incoming inventory and
reports typed per-check states. Required regular files, CSS markers/owned blocks,
actual export relationships, layout child rendering/import integration, config
identity, request closure and dependency/actual peer evidence are checked.
Current registry authority is used only when it matches installed registry
identity; historical mismatch is an explicit upgrade/unverified warning, never
new authority for old exports or a claim of complete readiness.

Retained journals are inspected through the read-only inspector, with no
coordination acquisition, recovery or deletion. Writer evidence is diagnosed;
PID/age is not takeover authority. Non-strict broken checks warn; strict broken
and unsafe checks use the frozen exit3. Customization qualification remains S085.

Router verification:10 actual executable structural cases and14 dependency
controls (24/24), bootstrap44/44; build/typecheck/lint/format and governing
projection/validator pass. Cases cover healthy installation, missing required
source, invalid lock, framework incompatibility, actual upstream peer conflict,
malformed CSS, dropped exports, missing child rendering, stale journals and
writer evidence. Both strict and non-strict command outcomes are inspected;
complete-tree snapshots prove no writes even for stale recovery state. Semantic
output excludes physical package/project root paths. Logs remain ignored at
`implementation/evidence/logs/codex-r10/s084-*`.

No repair is performed by doctor. No fixture/browser/reference rerun is claimed
for this diagnosis adapter; earlier unchanged guards and AC20/platform debt
remain explicit. No push/publication/deployment/parent or reference changes.
Next:S085 customization and strict escalation qualification.
