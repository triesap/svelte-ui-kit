# ADR-0003 — Three-way detection, truthful lineage, and cohorts

Status: retained original accepted decision. Current contracts are documented in ../agents and ../reference; this record is rationale, not a new execution dispatch.

#### Decision

Compare base last-installed upstream content, current local content, and incoming registry content per source file and managed CSS block. Preserve local-only changes, update untouched targets, treat local=incoming as satisfied, and stop genuinely conflicting batches. No automatic text merging or force overwrite. Keep component source/styles/exports compatible as a cohort and record effective lineage truthfully.

Store explicit root requests separately from resolved transitive items. On retirement, preserve customized source/CSS and do not silently reacquire ownership. Strict doctor does not treat a legitimate customization as corruption.

#### Consequences

Editable source is a first-class supported state. Hashes support detection but do not reconstruct a merge base. Per-target metadata must not merely claim the latest registry version. Conservative cohorts can require explicit reconciliation rather than a risky partial upgrade. New automatic merge/storage/accept-hash workflows would require a separate contract.
