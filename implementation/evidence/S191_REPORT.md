# S191 implementation report — catalog retirement and re-add

Author: Codex. Candidate; separate S193 acceptance remains required.
Implementation commit: `9cc50290df4ed68436318833ae33965774695d9f`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S191","kind":"report","commit":"9cc50290df4ed68436318833ae33965774695d9f","disposition":"candidate"}
-->

## Implementation and policy

`tests/integration/catalog-retirement.test.ts` installs all 22 actual catalog
items into default/custom owned consumers. It removes explicit Spinner, tokens
and Anchor requests while retaining Button and RouterLink; those actual shared
dependencies must remain with transitive origin and unpolluted root requests.
It simultaneously removes Badge, Card and Dialog, distinguishing clean source
and CSS retirement from customized Badge source and Card CSS.

Every surviving source record retains its old exact bytes and lock lineage.
Every clean obsolete source disappears; customized source and CSS retain exact
bytes with no remaining item/file/block ownership. Application exports, an
application module, arbitrary imports and unmanaged CSS remain unchanged.
Actual sync emits preserve-and-detach warnings with manual import-review
guidance. Dry runs preserve the full tree. Repeated sync never silently
reacquires detached ownership. Re-add of retained Badge source or Card CSS
conflicts and preserves every file including config/lock. A clean Dialog
re-add succeeds with exact registry source/base hashes. Finally removing
Button/RouterLink retires their now-unneeded Spinner/Anchor dependencies while
tokens stays transitively needed by the rest of the catalog.

The frozen SYNCHRONIZATION.md policy explicitly preserves arbitrary application
imports and warns for manual review rather than promising import rewriting.
The test records a retained original Badge importing its clean retired type
file and an application import of retired Dialog, with exact preservation and
the existing warning. It does not claim detached application code builds or
silently change ownership to retain generated authority. This concrete policy
boundary remains subject to independent S193 review. No product source or
retirement policy is changed.

Independent RCLD-10 review later reproduced a clean-only retirement with no
manual import-review warning: the customization diagnostics above accidentally
masked that distinct case. The bounded follow-up repair and actual positive/
omission controls are recorded in
[retirement warning qualification](RCLD-10_RETIREMENT_WARNING_QUALIFICATION.md).
Its acceptance remains separate and pending; the original checkpoint criteria
and arbitrary-import preservation policy remain unchanged.

An initial test assertion used the conceptual word dependency instead of the
actual lock enum transitive; the assertion was corrected to the frozen model.
The conflict-exit assertion was likewise aligned with the frozen CLI code 10.
Initial diagnostic logs are retained. Surviving bytes are captured before
customization, including metadata assets, rather than guessing their registry
locations from UI source paths.

## Verification

All validation runs through extbuild after the green doctor/current guard;
the lane is Node 24.21.0, pnpm 11.22.0 and macOS arm64.

- `node tools/run-unit-tests.mjs --suite integration tests/integration/catalog-retirement.test.ts tests/integration/workflow-purity.test.ts`: 4/4 passed, zero skips, in `logs/s191-integration-final.log`. Actual transcripts and initial/retired/re-added/final locks are retained in `logs/catalog-retirement/`.
- Final `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts` and diff/staged review passed before this candidate commit; contracts reported zero errors/warnings.

No new public assets/dependencies or browser behavior change; owning fixture
check/build and browser runs remain scoped to preceding S189/S190 evidence.
No Rust changes: Cargo guards N/A. Pinned strict-declaration exceptions/native
boundaries remain explicit final AC20 obligations. Reference source, unrelated
work and repository boundaries are preserved. Only a verified green candidate
enables S192; separate S193 acceptance gates S194.
