# Architecture and authoritative inputs

Scope: module responsibilities, observation/plan authority and installed asset
composition. The implementation is modular TypeScript in `src`, with authored
assets in `registry`, versioned formats in `schema` and executable controls in
`tests`/`tools`. There is one distributable CLI, not a runtime library ecosystem.

## Data flow and responsibilities

Arguments select one application → static project/config/dependency observations
and authenticated bundled registry → resolved closure and current/previous
ownership → deterministic complete plan → guarded apply/recovery → app-owned
source/CSS/semantic lock. The application then runs SvelteKit with its native
runtime dependencies; CLI internals never become app imports.

| Boundary                         | Responsibility                                                                                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| src/cli                          | Arguments, help/version, use-case orchestration, one result envelope and stable human/JSON channels/exits. No ad hoc writes or duplicate reconciliation engine.                            |
| src/project                      | Explicit package identity, static safe configuration/mappings, physical paths and dependency observations. Do not evaluate app config or mutate workspace neighbors.                       |
| src/registry                     | Package-relative asset provider, authenticated complete manifests/contracts, targets/exports/closure/dependency validation. No remote registry or caller plan self-certification.          |
| src/codegen planners             | Immutable incoming bytes, previous lock and actual read-set observations produce deterministic changes/conflicts/dependency instructions. No writes, coordination or package installation. |
| src/codegen patchers             | Narrow structural CSS/export/layout transformation that preserves unrelated text and rejects malformed/ambiguous structure. No whole-file formatting.                                      |
| src/codegen transaction/recovery | Exclusive cooperative writer, revalidation, same-filesystem stage, journals, replacement, publication witness, rollback/roll-forward and owned cleanup.                                    |
| registry/ui and registry/styles  | App-owned native/Bits wrapper markup, actual public types, source design classes/styles and complete compatibility cohorts. No CLI/Node imports or primitive state clone.                  |

## Machine contracts and authority

`package.json` owns scripts, identity, engines and pinned dependencies.
[Registry inventory](../../registry/registry.json) and each manifest own IDs,
sources, targets, public exports, dependencies and compatibility. Versioned
schemas own serialized input/output fields; reject unknown/unsupported variants.
Schemas/protocol/package/registry/items/CSS/framework versions remain independent.

Config owns desired roots/mappings, lock owns actual installed closure/provenance,
source/CSS/cohort baselines and integration. Canonical deterministic serialization
and content digests do not justify hashing a plan's own claims as authentication.
The planner's approved immutable observations and live apply revalidation must
agree. Dynamic filesystem observations never authorize themselves through journals.

Authored types derive from pinned native/Bits interfaces; component docs interpret
them without making a separate manual JSON API authority. Native producer recipe,
patch and frozen locks are executable reproduction inputs under tools. Build
artifacts, package archives, fixture projections and logs are outputs, not sources.

## Layout and composition

Registry resolution validates one immutable acyclic graph with stable ordering,
unique targets/exports/owners and compatible dependencies before planning. Missing
assets/manifests, identity mismatch, cycles, malformed paths and case collisions
fail. No live authoring reload during plan/apply. Lock reverse indexes, when used,
must agree with canonical records rather than trusting two independent copies.

Exact-byte lowercase SHA-256 identity is distinct from semantic/canonical hashes;
do not normalize CRLF, formatting or comments to conceal edits. Locked file/CSS
records retain owner, real base hash, item version and cohort. Aggregate stylesheet
bookkeeping does not grant ownership of every block: foundation-tokens-v1 owns
its exact minimal foundation body; stylesheet-v1 is whole-stylesheet bookkeeping.
Registry token blocks retain ordinary item lineage. Reserved operational state
cannot become a generated target through a permissive lock record.

The three exact public token metadata files are token-contract.json,
component-customization.json and theme-integration.json, owned by the tokens cohort.
Semantic/customization contracts are independent; their source bytes contribute
to registry identity and generated bytes retain ordinary baseline lineage.
Theme integration's layer order is svelte-ui-kit.tokens, svelte-ui-kit.themes,
svelte-ui-kit.components; a sorted set is not cascade order. Stylesheet paths
remain safe styles-relative paths and names stay unique within each contract.
No Rust ABI/presence/portal identity is copied into target metadata.

Defaults and custom mappings preserve one selected package, config discovery,
source ownership, semantic lock and styles. Generated root barrels use explicit
manifest exports; internal templates use sibling imports. Themes/app overrides
load after aggregate managed kit.css; patches preserve existing route rendering
and refuse unsupported config/layout shapes. No parent-barrel imitation or
per-route CSS pruning is promised.

If any compound export uses an authored directory barrel, preserve that complete
barrel even when other exports target direct parts. When every public export
targets direct parts, generate a barrel from the complete declaration set; never
replace an authored mixed-target barrel with a direct subset. Existing source/
export/final-composition validation applies to both shapes. Initialization may
create absent empty themes/app styles only as explicitly reported plan entries;
existing app-owned styles must never be replaced. Unsupported/future schemas
fail; migration requires explicit fixture-tested transitions preserving local
work, ownership and truthful state. V1 does not read Leptos config as Svelte or
provide shadcn migration aliases.

Compound family presence, delegated snippets and actual refs remain native.
Floating Menu preserves outer wrapperProps and inner props; modals do not invent
that floating structure. Native portal hosts inherit their real document/nested
CSS scope, clipping and stacking. Identity uses `$props.id()` and actual native
registration, with the nonsemantic floating process-counter distinction in
[compatibility](../reference/compatibility.md).

Composition can supply document sections/tables, breadcrumbs/pagination, independent
disclosures and alert/status content. This adds no queue, data-grid, keyboard
collection, router or validation engine. New features need the scope contract.

Own checks include package source-unavailable tests, registry/target authentication,
actual import/render AST and lexical child-render proof, strict types/native
provenance, structural patchers and installed consumers. Preserve authenticated
immutable export/cohort authority and equivalent-customization controls: neither
planned output nor a test inventory can certify its own correctness.
