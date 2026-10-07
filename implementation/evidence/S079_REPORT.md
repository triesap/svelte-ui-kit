# S079 step report — Read-only info

Author: Codex. Implemented and locally verified; independent RCLD-05 acceptance
remains pending. Original S079 criteria and anchored contracts remain unchanged.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S079","kind":"report","commit":null,"disposition":"candidate"}
-->

The executable injects `inspectInfo` only after valid info argument parsing.
Package-relative registry loading has no consumer-CWD fallback. Help/version,
metadata failures and usage errors do not load project/dependency inspection.
Info uses selected-root resolution, captured project/config/installed evidence,
configured registry closure, dependency state and actual upstream peer checks.
Safe derived mappings and compatibility identity are reported without physical
root paths. Missing and incompatible installs remain explicit non-ready states;
unsupported projects use the frozen unsupported outcome. No install or write.

Executable integration:8/8 info cases (default/custom/ambiguous/missing,
unsupported, peer-incompatible, ready, explicit relative/absent cwd),21/21
including output regression controls. Complete-tree snapshots cover human and
JSON execution. Bootstrap51/51 retains metadata, standalone help/version,
argument grammar, no-write and mutation controls after info ceased being a
placeholder. Build/typecheck/lint/format and governing projection validation pass.
Checks use the configured router; raw logs remain ignored at
`implementation/evidence/logs/codex-r10/s079-*`.

Failed eager-import and path-disclosure attempts are retained in author logs;
causes were repaired and rebuilt before the green candidate. No fixture/browser
or reference rerun is attributed to this read-only CLI slice. The unchanged
reference guard and AC20/platform debt remain as recorded. Full command matrix
and independent sequence acceptance remain S086/S091. Next checkpoint:S080.
