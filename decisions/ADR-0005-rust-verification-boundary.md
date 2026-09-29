# ADR-0005 — Reconcile the Rust specification language with the approved stack

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

Status: necessary implementation assumption A01, explicitly recorded; not a user-requested stack change.

#### Context

The user approved a TypeScript/Svelte generator, then requested a rigorous specification using Rust-architect wording and per-step Cargo checks. No message explicitly requested replacing TypeScript with Rust.

#### Decision

Preserve the approved stack. At every step inventory any actual authorized target/in-place reference Cargo workspace and run its applicable check/test/format/repository lanes. Use exact workspace roots and discovered feature combinations. In a TS-only target mark Cargo N/A with evidence. Do not create Rust code, move the reference workspace, or claim npm checks verify Rust.

#### Consequences

The specification lists conditional Cargo commands in every step and the complete known reference package lane centrally. Target location is resolved to this repository; S001 still records the actual manifest inventory and conditional guard applicability. A truly Rust-based new CLI would be a new product decision, not a silent interpretation.
