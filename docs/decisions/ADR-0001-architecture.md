# ADR-0001 — Source-first TypeScript generator, not a styled runtime

Status: retained original accepted decision. Current contracts are documented in ../agents and ../reference; this record is rationale, not a new execution dispatch.

#### Context

The user wants a SvelteKit equivalent of the Leptos source-first installation/styling system. The source's value includes explicit manifests, local code ownership, CSS contracts, deterministic plans, locks and packaging rigor; its Rust primitives and module system are framework-specific.

#### Decision

Use one initially publishable npm package named `svelte-ui-kit`, modular TypeScript internals, and bundled JSON/Svelte/TS/CSS/schema assets. Generate local components and styles; use Bits UI for interaction and native markup for appropriate simple components. Consumer imports are local, not from a styled runtime package.

#### Consequences

The generator is a development/install tool, while Bits and Svelte are genuine consumer dependencies. Asset lookup must work from a tarball. Internal modules can evolve independently without inventing multiple public packages. Native semantic source remains editable. A Rust rewrite, runtime styling layer or remote registry would require a separate product decision.

#### Alternatives not selected

A runtime styled component package would undermine source ownership. A literal Rust-to-Svelte primitive translation would duplicate Bits responsibilities. A multi-package framework is unnecessary for the initial approved architecture.
