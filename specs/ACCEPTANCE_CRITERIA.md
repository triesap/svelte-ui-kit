# Acceptance criteria and release gate

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

Each requirement ID in `PRODUCT_SPEC.md` must map to executable tests or explicit evidence in `implementation/TRACEABILITY.md`. Criteria below are release requirements, not a claim that this specification has run them.

#### Product and distribution

AC01. One package-shaped `svelte-ui-kit` CLI with bundled assets/schema/contracts; no consumer styled-runtime dependency on the kit. Installed components import local siblings and Bits/native APIs correctly.

AC02. Generated tree/names/exports, CSS classes/properties/layers/markers and `_kit` locations match the contract. Only requested items and required dependencies appear. Compound families expose flat public names and no invented aliases.

AC03. `npm pack`-equivalent artifact can be installed and exercised outside the source repository. After making authoring source/build fixtures unavailable, packaged `view`, `init`, `add`, `sync`, and `doctor` still work with package assets. Consumer dependency setup is explicit and separately reproducible.

#### CLI and ownership

AC04. Every command has argument/error/help fixtures, stable exit behavior, and deterministic JSON. JSON failure produces exactly one envelope; human errors do not pollute stdout. Unsafe physical path inputs are not echoed as public locators.

AC05. Dry runs, info, view and doctor perform zero project writes, including no coordination/temp/lockfile/package-manager changes. Repeat successful initialization/add/sync is semantically unchanged and does not disturb unmanaged bytes.

AC06. Config stores only explicit roots; lock stores resolved closure with provenance. Removing a root retains needed dependencies, retires clean unneeded assets only safely, and preserves customized content with truthful ownership.

AC07. Every base/local/incoming equality combination is tested for source and CSS. Both changed is a conflict; locally customized/upstream unchanged is preserved; local equals incoming is satisfied. Untracked collisions are never silently overwritten or adopted for deletion. Missing tracked targets have a frozen, visible tested policy.

AC08. A source/CSS compatibility-cohort conflict makes the batch nonmutating. Metadata does not advance retained customized source to a falsely installed baseline. No automatic merges or force-overwrite shortcuts.

AC09. Layout and export patches preserve unrelated content, comments, formatting and existing app semantics; malformed/ambiguous inputs fail safely. Multiple occurrences, duplicate symbols and malformed CSS markers are covered.

AC10. Dependency plans include actual peer constraints and incompatible installed ranges. No implicit dependency install or package-manifest mutation. Unknown/unsupported schema versions and fields fail clearly; migration fixtures prove supported transitions.

#### Safety

AC11. Unsafe paths, parent symlinks, nonregular files, path overlap, drive/UNC edge cases and case collisions are tested for the supported platforms. Document the trusted-local threat model and unproven hostile-race limits.

AC12. Concurrent writers/preimage changes are detected. Fault injection across staging/replacement/lock publication/cleanup proves recoverable consistency or safe refusal. Recovery preserves post-crash user edits and fails closed on corrupt/ambiguous journals.

AC13. Lock metadata is final publication of a coherent planned batch. All ephemeral transaction state is isolated/cleaned or retained as recovery evidence deliberately. No recovery claim relies only on process-finally cleanup.

#### Components and styling

AC14. All original catalog mappings are recorded and implemented to the stated boundary. Initial core is qualified first; floating menu is tested early. Identity is resolved natively without unnecessary Rust shims. Router-link is a thin optional recipe. Alert Dialog uses the distinct primitive.

AC15. Type fixtures preserve state bindings, refs, discriminated unions, native attributes, event semantics and snippets. Unsupported child hooks are rejected rather than silently dropped. No `any`/SSR-disable workaround conceals incompatibility.

AC16. Real generated-app browser tests cover labels, keyboard navigation, focus trap/restoration, outside/Escape behavior, state changes, disabled/loading/required forms and reset, determinate feedback, and nested overlays where applicable.

AC17. SSR render and hydration pass without unexpected console/hydration errors. Multiple requests/instances preserve identity and do not leak mutable state. Browser-only effects are guarded/lifecycle-local.

AC18. CSS mappings match real DOM, pure CSS builds without utility tooling, token defaults and radius fallbacks pass computed-style tests, shape-critical geometry is preserved, and RTL/reduced-motion states work. Document any baseline contrast concerns instead of blindly certifying them.

AC19. Global and nested theme portal scenarios work as documented, including open-overlay theme changes and clipping/stacking caveats. CSP compatibility is tested and bounded; no unsupported no-inline-style guarantee.

#### Engineering completion

AC20. Typecheck, tests, formatting, lint, production build, package acceptance, applicable platform lanes, and any applicable Rust guard pass. Requirements are not waived by incomplete tooling. Record pre-existing failures and final blockers accurately.

AC21. Every nongated commit step is independently completed/tested/reviewed/committed with a report and evidence-backed deviations where necessary. Root docs, developer instructions, upgrade/recovery runbooks, examples, command map, dependency baseline and traceability are current.

AC22. The extension specification gate is documented. Unspecified select/combobox/popover/date/higher-level scope is not implemented or claimed as delivered. Any expanded release including it requires explicit contracts and its own approved coding sequence.

#### Final deliverables

Source and tests, built-in manifests/assets/contracts/schemas, generated SvelteKit consumer fixture, install/upgrade/conflict examples, packed artifact for inspection (not publication), CI and compatibility records, README/CONTRIBUTING/AGENTS, requirement/test evidence, and an honest final report containing last commit, completed step range, unresolved blockers and next safe action.
