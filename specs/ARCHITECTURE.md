# Architecture

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

#### System boundary

```
CLI commands ──> project detection + config validation
                      │
bundled registry ──> dependency resolution
                      │
application snapshot + previous lock + incoming registry
                      │
                pure change planner
                      │
                diagnostics / dry run
                      │
           guarded recoverable file application
                      │
         app-owned components, CSS, metadata
                      │
                Bits UI + SvelteKit
```

There is one initially publishable npm package. Keep module boundaries without manufacturing a multi-package ecosystem. Consumer components must not import Node-only code, the CLI, registry loader, or a kit runtime facade.

#### Proposed target repository

```
src/
  cli/main.ts
  cli/commands/{info,init,view,add,sync,doctor}.ts
  project/{detect,dependencies,paths}.ts
  registry/{load,resolve,validate}.ts
  codegen/{plan,apply,lock,css,exports,svelte,transaction}.ts
registry/
  registry.json
  foundation/tokens.json
  ui/*.json
  ui/*.svelte
  ui/*.types.ts
  ui/<compound>/{index.ts,root.svelte,...}
  styles/*.css
  contracts/{theme-v1,component-customization-v1}.json
schema/v1/
tests/{fixtures,codegen,components,package}/
```

These are module responsibilities, not a ban on extracting small cohesive helpers. A module may split when supported by actual code, without adding publishable packages. Exact schema subdirectory follows the independent version frozen at the schema step.

#### Responsibilities

**CLI** parses arguments, selects the root, renders one human or JSON outcome, and maps stable statuses to exit codes. It does not implement merge policy or perform unplanned file writes. Command handlers call use cases rather than duplicate them.

**Project detection** reads manifests and approved configuration, identifies an explicit application package, discovers supported paths and dependency state, and reports unsupported layouts. Avoid executing arbitrary Svelte config simply to detect a layout; an explicit safe override or documented manual integration is preferable to guesswork.

**Registry** reads packaged assets through a package-relative provider, validates schemas and manifest identity, validates target ownership/export uniqueness, resolves dependency closure deterministically, and merges dependency requirements. It never loads arbitrary remote registries.

**Planner** receives validated models, immutable asset bytes, current filesystem observations, and previous lock metadata. It emits a complete, deterministic proposal with diagnostics and expected preimages. It does not write files, run a package manager, or initialize coordination state during a dry run.

**Patchers** are narrow transformations for managed CSS blocks, generated export regions, and safe Svelte layout imports. They preserve unrelated source bytes and reject malformed/ambiguous structures. A patcher is not a formatter for the user's entire file.

**Transaction layer** owns exclusive writer coordination, revalidation, staged content, journal/recovery, atomic file replacement where supported, rollback/roll-forward policy, and lock-last publication. Multi-file filesystem writes are not one native atomic operation; document the recovery protocol rather than promising nonexistent atomicity.

**Consumer wrappers** supply design classes and constrained props; preserve upstream behavior, semantics, bindings, references, and snippet structure. No global primitive state clone or hidden module-level mutable request state.

#### Boundaries to preserve from Leptos

Translate `cargoPlan` into `npmPlan`, Rust/module targets into explicit Svelte/TypeScript targets and exports, and compiled-in registry assets into package-bundled assets. Preserve ownership, drift diagnostics, embedded contracts, package independence, and plan/apply separation. Do not translate Rust SSR feature flags or `web_ui_primitives` implementations into new Svelte abstractions.

#### Distribution and dependencies

The CLI's distribution includes all templates/manifests/contracts/schemas used at runtime. Resolve asset paths relative to the installed package, not CWD or source checkout. Package metadata and content digests supply provenance; a `.git` directory must not be necessary in a released tarball.

Consumers depend on Svelte and any Bits UI requirements emitted by installed items. Node tooling dependencies belong to the CLI or development fixture. Version selection must honor actual peer requirements, not only directly imported modules. Do not put all component dependencies into every application's plan without justification.

#### Composition vs expansion

Keep compositional patterns: collapsibles can form accordion-like layouts; alert/status can supply notification content; native anchors/buttons can compose breadcrumbs and pagination; native semantic HTML remains appropriate for data tables and document structure. Do not invent application orchestration, notification queues, or data-grid engines.

A single aggregate stylesheet is intentional. It includes CSS for installed items and is not promised to be route-level tree-shaken. Sibling imports avoid root-barrel cycles. Compound export barrels are generated from explicit manifest declarations.
