# ADR-0004 — Preserve primitive behavior and explicit portal theme scope

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

Status: accepted by approval.

#### Decision

Keep complex interaction in Bits UI and preserve its typed state/ref/snippet/event interfaces through wrappers. Use Svelte-native bindings and native element types. Keep distinct Alert Dialog semantics. Preserve floating positioning wrapper structure. Do not copy Rust focus/layer/identity internals.

Application-wide themes can live at a document-level scope. Nested themes can use an explicitly suitable custom portal host, with documented stacking/clipping limits. Application code owns theme persistence and color-scheme. Pure CSS design styling is not a guarantee against runtime inline placement styles; CSP support must be measured.

#### Consequences

Small wrappers still require meaningful browser and type tests. Accepting and discarding a snippet is an API bug. Name/ref/event forwarding errors can undermine accessibility even when using an accessible primitive. There is no hidden theme store, computed-style-copy mechanism or unsupported CSP claim.
