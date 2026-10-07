# S088 step report — Explicit schema dispatch

Author: Codex. Implemented/locally verified; independent RCLD-05 acceptance pending.
Original schema and migration criteria remain unchanged.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S088","kind":"report","commit":"e58aa2b38b37e292715b271b1b1bbca34e2b80e8","disposition":"candidate"}
-->

Configuration and lock parsers dispatch their independent integer schema1 before
strict schema validation/normalization. Unsupported integer revisions, source
framework version strings, missing identities and known legacy/source-only
configuration fields fail explicitly. No transition is specified for an older
Svelte schema, Leptos or shadcn; none is guessed. Unknown current fields remain
strictly rejected. Existing SCHEMA_INVALID consumer classification is retained
with clear unsupported-version/legacy and no-migration diagnostics.

Executable tests qualify six unsupported versions per document across init,
add, sync and dry paths, three legacy shapes and current-state framework/package
version changes. Every refusal preserves a complete byte/mode/hidden-state tree;
framework changes do not rewrite schema, lock provenance or source ownership.
Current tool/registry version axes remain independent of schema selection.

Checks:16/16 integration,44/44 owning version/config/file-lock/style-lock controls,
build/typecheck/lint/format/projection/contracts pass via the repository router.
Logs:ignored `implementation/evidence/logs/codex-r10/s088-*`.
No browser/reference/platform or full release acceptance is inferred. Mandatory
S091 independent review and later original requirements/AC20 remain open.
Next:S089 explicitly synthetic registry/cohort and contract revision fixtures.
