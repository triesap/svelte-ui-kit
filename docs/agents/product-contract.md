# Product and scope contract

This guide governs product boundaries for repository maintenance. Use the shared
[component reference](../reference/components/README.md), [CLI contract](../reference/cli.md)
and [configuration](../reference/configuration.md) for the actual public surface.
Manifests, authored types and versioned schemas remain executable authorities;
code disagreement is a defect to investigate, not permission to erase a guarantee.

## Distribution and application ownership

The product/package/executable is `svelte-ui-kit`, specification `svelte_ui_kit_v1`.
It is one package-shaped TypeScript CLI with modular internals and bundled
Svelte/TS/plain-CSS registry assets, contracts and schemas. It remains private
and unpublished; future publication requires explicit authorization and actual
package/release qualification. No multi-package ecosystem is implied.

Installed source and CSS belong to the application and remain editable. Generated
wrappers import local siblings and supported Svelte/Bits APIs, never CLI/Node
internals or a styled kit runtime. The installed tarball must work after authoring
sources, fixtures and build directories are unavailable. Asset resolution is
package-relative and must not rely on live GitHub or Git history.

Bits owns complex interaction; native Svelte/HTML handles simple presentation.
There is no Rust primitive clone, Tailwind, CSS-in-JS, React/shadcn conversion,
online registry, telemetry, icon dependency, theme store or runtime facade.
Dependency setup can require network access; bundled asset operations do not.
Required Svelte/Bits/date peers remain real application dependencies. The CLI
reports complete instructions and never edits manifests/locks or invokes a manager.

## Generated conventions and ownership

Defaults are `src/lib/components/ui`, its `_kit` child, and `src/styles/kit.css`.
Simple components have kebab-case files; compound parts use directories and flat
PascalCase exports. IDs/files are lowercase kebab-case; props/config keys camelCase.
Keep `.kit-*`, `--kit-*`, explicit managed block IDs and tool-namespaced markers/layers.
An aggregate stylesheet is intentional, not a route-level pruning promise.

Schema, protocol, package, registry, item, framework compatibility and CSS contract
versions are independent. Explicit requested roots remain distinct from resolved
transitive lock ownership. No remove/force/automatic-merge API exists. Desired
removal retains needed dependencies and customized assets with truthful detached
ownership; application import repair remains explicit.

Base/local/incoming comparison preserves customization and refuses genuine batch
conflicts. Coupled source/style/export cohorts cannot advance incompatibly.
Unmanaged CSS, exports and layout regions remain byte-preserved; structural
patchers stop on ambiguous/malformed unsupported shapes. No arbitrary base-hash
acceptance, formatting or adoption hides local changes.

Plans are deterministic/read-only, including hidden state, and JSON emits one
complete envelope. Replays are idempotent only with safe absent coordination and
no retained recovery evidence. Strict doctor distinguishes customization from
breakage. Genuine writes validate paths/preimages, use recoverable staging and
publish the semantic install lock last. See [synchronization](synchronization.md)
and [transactions](transactions.md) for exact rules.

## Components and verification

Preserve actual native/Bits types, union discrimination, state bindings, refs,
snippets, event ordering/cancellation and native form behavior. Reject unsupported
render hooks instead of accepting and dropping them. Preserve SSR/hydration and
request-local semantic state; no shared mutable server counter or SSR-off workaround.
Alert Dialog uses its actual distinct primitive. Identity uses native facilities;
RouterLink is a thin optional native Anchor recipe with app-owned URL resolution.

Test installed generated output for type correctness, labels/keyboard/focus,
disabled/loading/required forms and reset, overlays, RTL/reduced motion and
computed themes where applicable. Actual package consumers must survive removal
of CLI hosts and authoring sources. Positive inventory alone does not establish
correctness: causal type/runtime/refusal mutations, whole-tree preservation,
real process interruption and corrupt-state controls remain required.

App-owned themes control selectors, persistence and color-scheme. Body and nested
portal theme strategies must be explicit. CSS is not a zero-inline-style or CSP
guarantee. Preserve source defaults and component → semantic role → default → source
radius chains, including shape-critical exceptions. Keep measured contrast,
callback, reset, SSR identity, clipping and platform limits in [compatibility](../reference/compatibility.md).
No whole-WCAG certification or screen-reader speech claim follows from browser trees.

## Extension and release boundary

Npm name ownership, publisher identity and release destination remain unverified.
Do not infer ownership from an earlier registry 404, rename the product to bypass
a conflict, invent a schema-hosting domain or publish without explicit authority.
SvelteKit is the qualified application target; additional adapters/libraries need
their own approved qualification rather than inheriting another framework's matrix.

NativeSelect in Field implements the original native select; a new select/combobox,
popover/date or higher-level API remains unspecified. Composition with native
document structure, independent disclosures, alerts/status, anchors/buttons is
allowed without inventing queues, data-grid engines or router/state services.
Expanded scope requires approved public types, rendering/ownership/SSR/accessibility
contracts, dependency decisions and its own reviewed implementation sequence.
Do not create issues, implement or claim these extensions merely because direction
was recorded. Publication, push, deployment and reference-source modification need
their own explicit authorization.

Before selection extensions, freeze exact items/modes/exports, string versus other
value/empty/serialization models, controlled/uncontrolled callbacks/reset, form
ownership/validation, keyboard/typeahead/autofill/deselection, search/query versus
selection/filter ownership, labels/states/snippets/refs/portal/CSS. Async, debounce,
virtualization and generic object values need an explicit request. Popover needs
its own composition/defaults, hover/touch, focus/dismissal/nested-layer and floating
versus static/presence/portal/CSP contracts; native declaration comments alone
are not policy. Date-related inventory needs value/date/time/instant meaning,
locale/calendar/timezone responsibility, formatting/parsing/submission, bounds,
validation, reset, range only if requested, cross-request state and dependency
contracts. Higher-level patterns need named scope distinguishing recipes from
new state/async/business engines. Existing infrastructure is reusable test design,
not acceptance evidence for a new family.

Use small verified commits in the approved task sequence, review actual diffs and
protect unrelated work. Independent acceptance, when a task requires it, comes
from a separate reviewer; implementation self-review grants no acceptance.
The completed original checkpoint reports are historical provenance, not the
current execution system. This target is TypeScript-only; do not manufacture Rust
code or repeat irrelevant Cargo gates. Preserve an applicable neighboring Rust
repository through its own boundary if a separately authorized task affects it.

Owning verification lives in [testing](testing.md), actual `tests/{unit,integration,
registry,components,package,browser,smoke}` and the checked-in CI policy.
