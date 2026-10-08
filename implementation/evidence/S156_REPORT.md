# S156 step report — Generate native Avatar and fallback styles

Author: Codex. Locally verified candidate; independent S181 acceptance pending.
Implementation commit will be recorded after the green commit.

Original R02, R03, R04, R06, R08, R20, R22, R25, R26, R32, R33, R34.
Starting `a17b0af3faeee399cf1981cc501a19364e6d7f1b` on `master`.

Generate the frozen native Avatar and register exact Avatar/AvatarProps flat
exports, two source files and one source/style compatibility cohort with tokens
as sole registry dependency and no npm dependencies. Per-instance image-node and
request identity govern loading/loaded/error; source/srcset/sizes/crossorigin and
referrer changes key the actual image. Current native events settle state before
one caller callback; completed images hydrate without synthesizing caller events.
Meaningful fallback uses one alternate-text image name, decorative empty alt
adds none. Image attrs/classes/style/ref and native request selection remain
application-owned.

Preserve all six immutable source CSS declarations and original avatar-radius
metadata. The frame derives dimensions from the image, and fallback uses scoped
visibility hiding to retain native lazy-load viewport geometry. A scoped native
hidden rule preserves caller hiding; fallback stays presentational. Add only two
approved target surface/color hooks, preserving original272 records exactly;
metadata now has274 entries and tokens0.1.11 with exact maintained projection.
Semantic token/theme CSS remains unchanged. The earlier Anchor metadata test
allows later append-only items while retaining its exact263-record hash and exact
nine owning Anchor hooks; it still rejects changes/deletions in its own contract.

Owning install suite verifies no-effect dry run, explicit versus transitive
requests, exact source bytes, all installed source/style hashes, managed block
order, complete-tree repeat add/sync and untouched app files. Both source layouts
check/build and render through actual hashed production handlers. Initial SSR
proves loading state, fallback/naming, decorative/native alt and image attrs.

The first test-authoring helper command failed before emitting the test file;
corrected it and ran the actual lane. Initial real install1/3 exposed a local
`state` binding colliding with the Svelte `$state` rune. Rename only that internal
binding, refresh the content identity and rerun: final3/3, with zero Svelte
errors/warnings. No type/a11y suppression, primitive dependency or runtime waiver.

Verification through the configured build router:

- Avatar native types15/15 plus Avatar/Anchor source CSS and metadata4/4.
- Actual CLI install/check/build/SSR/replay3/3 across default/custom layouts.
- Full registry53/53 and packed package3/3: exit0.
- Maintained fixture check/build and exact token projections: exit0.
- Typecheck, lint, format and governing contracts: exit0.
- Source/staged diff and whitespace review pass; Cargo N/A, no Rust affected.

Changed native component/manifest/CSS, source provenance fixture, owning tests,
append-only customization metadata/projection, registry identity, map, predecessor
bookkeeping and this report. Real browser transitions, stale/cached requests,
responsive image selection, themes and hydration are original S157. No independent
acceptance, full-platform or complete-MVP claim. No blocker; continue S157 after
this green commit; mandatory separate S181 review gates S182. Preserve reference
source, original criteria, parent index and repository identity. No push,
publication or deployment.
