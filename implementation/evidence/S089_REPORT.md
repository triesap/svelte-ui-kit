# S089 step report — Synthetic independent upgrades

Author: Codex. Implemented/locally verified; mandatory independent S091
acceptance remains pending. These fixtures are synthetic, not shipped releases.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S089","kind":"report","commit":"9330069735a26e70ee7055c14583836c9d1e17b6","disposition":"candidate"}
-->

A checked-in synthetic fixture independently varies registry release, card item
release, source, CSS customization fallback and cohort declaration. Button keeps
its separate release and file lineage. Actual executable sync consumes loader-
authenticated old/incoming snapshots in default/custom mappings. Source-only,
CSS-only, cohort and metadata upgrades qualify applied bytes and exact bases;
customized changed units refuse the entire batch, and unchanged upstream preserves
custom source with its original base. Dry runs/refusals/replay compare complete
byte/mode trees including hidden state and manifests.

Unchanged files retain their original itemVersion/cohort, even when another
member adopts an incoming declaration; the corrected fixture assertion follows
the original truthful per-target contract. CLI conflict diagnostics use the real
PLAN_DIAGNOSTIC message, not a nonexistent public code. Initial compile/assertion
failures are retained in ignored logs. No product policy changed at this step.

Supported customization contract declarations change their fallback independently
of schema/item/registry versions. Unknown contractVersion2 is refused by the strict
parser; no guessed contract migration or nonexistent historical release is claimed.
Framework/package-independent current lineage is also covered by S088.

Checks: final synthetic upgrades15/15; existing sync14/14 in the preceding combined
run (the six failures were new fixture assertions, repaired and rerun15/15).
Typecheck/lint/format/projection/contracts pass. Logs:ignored
`implementation/evidence/logs/codex-r10/s089-*`.
No independent sequence, browser/reference/platform or release acceptance is
claimed. Original S090 packed inventory and S091 cumulative qualification/review
remain next; AC20 and later requirements stay open.
