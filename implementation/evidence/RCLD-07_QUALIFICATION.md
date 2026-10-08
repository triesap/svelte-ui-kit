# RCLD-07 independent qualification — original S116–S128

Disposition: accepted by the separate Codex reviewer on 2026-10-08. No blocking
finding or repair remains in this original sequence. The reviewer authored no
product changes in the batch. Reviewed code is
`21c72d21fd78a34f12099b94b0d4fddff779d911`; the clean frozen bookkeeping boundary
was `5383b84c364974e92ab60b6679e62221ad77da48`. This plain evidence deliberately
contains no structured acceptance marker or invented evidence-commit anchor.

## Original criteria and independent assessment

The original thirteen definitions were independently compared byte-for-byte
against `a176387`; all remain unchanged. The worksheet, original requirement
anchors, adopted acceptance criteria, actual pinned native implementation,
registry sources/manifests/styles, generated consumer builders, browser and SSR
assertions, and retained raw artifacts were inspected. Implementation reports
were provenance, not acceptance authority. Every original checkpoint is accepted
in its linked S116_REVIEW.md through S128_REVIEW.md.

Alert Dialog is the actual distinct nine-part primitive family, with eighteen
flat value/type exports. Bindings, native refs/attributes, callbacks and default/
delegated snippets remain exact. Browser tests prove genuine name/description,
container autofocus, focus containment/return, controlled/uncontrolled state,
outside-ignore distinct from generic Dialog, configurable cancellation and nested
layers. Action does not invent automatic confirmation/close; Cancel retains its
native close/disabled/form/keyboard behavior. Shared visual styling does not
collapse these distinctions. Physical-description cleanup, ref replacement and
destruction have causal missing-cleanup controls.

Menu preserves the immutable source's required ordinary/radio selection,
controlled state, indicator, keyboard/typeahead, dismissal/focus, placement,
identity and dynamic cleanup. The exact eight-part target inventory adds native
Portal/RadioGroup integration and a stateless typed span indicator, without an
extra selection or keyboard store. Default/delegated floating rendering retains
outer wrapperProps/attachments/geometry and separate inner props/design. Actual
native refs, attributes, callbacks, unions and checked snippets survive.

The read-only reference remains clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98`. Its actual immutable Menu stylesheet
hash is `281a57e212f74efc5d84c1c9b1a6c54c0bf43de1051601c561ef912ec078bb8a`.
An independent compiler CSS parse matched all67 declarations and selectors
exactly to the frozen inventory. Tests then compare mapped design declarations
to actual authored CSS; the documented changes omit the source virtual wrapper,
leave placement to the native outer wrapper, map native disabled selectors and
add reduced motion. Original token defaults and radius fallbacks remain.

Actual default/custom CLI installations prove exact source/style/export cohorts,
dependency and ownership metadata, dry-run nonmutation, distinct combined Dialog
exports, generated check/build/render, strict doctor, unchanged add/sync replay,
and missing-asset refusal before effects. Independent browser artifact inspection
also matched 440 installed source hashes to registry sources across the first75
retained artifacts, excluding explicitly mutated owned applications. The complete
browser run retained further installed hashes and actual production-file hashes.

## Independently executed checks

`cargo extbuild doctor` exited0 with green configuration/volume/tool routing and
current guard. All following mutating checks ran through `cargo extbuild run --`
with Node24.21.0 and the existing pinned pnpm toolchain.

- `pnpm exec playwright test --config playwright.config.ts tests/browser/alert-dialog-candidate.spec.ts tests/browser/alert-dialog-interactions.spec.ts tests/browser/alert-dialog-themes.spec.ts tests/browser/alert-dialog-hydration.spec.ts tests/browser/menu-candidate.spec.ts tests/browser/menu-keyboard.spec.ts tests/browser/menu-styles.spec.ts tests/browser/menu-placement.spec.ts tests/browser/menu-csp.spec.ts tests/browser/menu-lifecycle.spec.ts --output=implementation/evidence/logs/r7-independent-browser`: exit0, 134/134 Chromium cases passed, zero skipped, 3.8 minutes. One worker, isolated output; no overlapping fixture/browser run.
- `node tools/run-unit-tests.mjs --suite components tests/components/alert-dialog-types.test.ts tests/components/alert-dialog-state.test.ts tests/components/alert-dialog-content.test.ts tests/components/alert-dialog-actions.test.ts tests/components/menu-types.test.ts tests/components/menu-state.test.ts tests/components/menu-content.test.ts tests/components/menu-items.test.ts tests/components/menu-css.test.ts`: exit0, 52/52 across all nine selected files; zero failed/skipped/todo/cancelled.
- `node tools/run-unit-tests.mjs --suite integration tests/integration/alert-dialog-install.test.ts tests/integration/alert-dialog-ssr.test.ts tests/integration/menu-install.test.ts tests/integration/menu-ssr.test.ts`: exit0, 12/12 across all four files; zero failed/skipped/todo/cancelled. Eighty retained concurrent/repeated SSR responses exercise both families and both layouts through actual executed production handlers.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts`: each exit0. Contract check reported zero errors/warnings. The generated-app builders independently execute actual consumer check/build rather than substituting maintained fixture output.
- Independent Node/compiler probes verified immutable CSS hash/AST, installed-source hashes and all13 original checkpoint definitions. `git diff --check` passed; frozen source tree remained clean until these plain evidence documents were added.

Raw independent outputs are retained in the ignored evidence-log boundary:
`logs/r7-independent-browser.log`, `logs/r7-independent-browser/` with attached
installed/candidate/generated artifacts, CSP measurements and observer lifetimes,
`logs/r7-independent-components.log`, `logs/r7-independent-integration.log`,
`logs/r7-independent-typecheck.log`, `logs/r7-independent-lint.log`,
`logs/r7-independent-format.log` and `logs/r7-independent-contracts.log`.
Actual generated consumer check/build hashes/logs and SSR responses are also
retained under `logs/generated-consumer/`, `logs/menu-ssr/`,
`logs/alert-dialog-ssr/` and each family's install/candidate log directories.

## Measured native boundaries; no acceptance waiver

Bits2.19.3 exposes textValue but its DOMTypeahead reads trimmed textContent.
Independent source inspection and installed/direct-native browser controls
confirm alias text is forwarded as an attribute and does not drive search.
Required readable DOM-label typeahead works. Exact native forwarding preserves
the original target-native API contract; this is not an omitted typeahead feature
or permission to replace native behavior with a kit engine.

Actual nonce-script/self-stylesheet CSP responses were tested before hydration
and after hydration in both layouts. Allowing style attributes retains native
absolute placement with zero errors. Denying them produces three exact policy
errors and static outer placement before hydration, and four exact policy errors
with absolute outer placement after hydration. All captured warnings/exceptions
are empty; each expected error is individually attributed to style-src-attr.
Hydrated recovery does not certify strict no-inline SSR parity. Original S128
explicitly requires measured supported limits; the documented limitation meets
that original criterion without stripping required styles or weakening SSR.

Body/inline/custom portal open/closed hydration, viewport flip/collision padding,
ancestor scroll, live document/nested theme inheritance, adverse transformed
clipping, RTL/reduced motion and request/instance identity pass. ResizeObserver
artifacts show no retained targets after native root destruction. Only an owned
copied application receives the actual missing-cleanup mutation; it retains two
disconnected Content nodes and proves detector causality. No reference source,
parent index or product source was altered by the review.

Pinned Alert Dialog server portal omission, pre-child SSR relation registration,
first-opening completion sequence and default restoreScrollDelay forwarding
limits remain explicitly documented and native-controlled. Browser naming,
focus, state, cancellation, hydration and lifecycle obligations still pass.
The earlier strict declaration-audit exception is not relabeled green. Later
catalog/platform/package/release work and AC20 remain open. Target Cargo is N/A
for this TS-only scope; read-only reference Git/hash evidence reuses its existing
immutable Cargo qualification rather than claiming fresh Rust execution.

The coordinator may commit these fourteen plain documents, then atomically
anchor structured reviews and update the ledger/live batch at that real commit.
Only that truthful acceptance transition unlocks original S129/RCLD-08. No push,
publication, deployment or broader approval is granted here.
