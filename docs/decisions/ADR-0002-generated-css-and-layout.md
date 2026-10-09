# ADR-0002 — Preserve recognizable source and CSS conventions

Status: retained original accepted decision. Current contracts are documented in ../agents and ../reference; this record is rationale, not a new execution dispatch.

#### Decision

Use `src/lib/components/ui`, `_kit`, and `src/styles/kit.css` by default. Simple items use one component file plus optional types; compound items use directories and part files. Export flat PascalCase names through explicit manifest-driven barrels. Keep `.kit-*` and `--kit-*`; rename tool markers/layers to `svelte-ui-kit`.

Use one installed managed stylesheet with block-level ownership. Themes and application overrides stay app-owned and load afterward. Component custom properties and semantic tokens remain separately governed. Preserve radius fallback and shape-critical defaults.

#### Consequences

CSS from the reference can be mapped to Bits DOM without replacing the design vocabulary. Selectors still need verification. The aggregate stylesheet includes all installed blocks and does not promise per-route pruning. Managed export regions/layout imports must preserve application text. A second installed per-component CSS authority or a utility conversion pipeline is not part of the design.
