# Reference evidence and limits

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

#### Immutable source baseline

Repository: `https://github.com/triesap/leptos_ui_kit`
Commit: `a10fbf06334f4648f5755e05a7147414e4e5fc98`
Default branch observed: `master`.

Use immutable blob URLs of the form:

```
https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/<path>
```

The important review evidence is summarized below so product intent does not require fetching the repository. Implementers may still inspect original code for exact catalog API/CSS details not defined in the approved review; do not pretend those details were already frozen here.

| Source path                                                              | Observed evidence and relevance                                                                                                                                                                                  |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| README.md / AGENTS.md / CONTRIBUTING.md                                  | Source-first editable components, pure CSS, CLI workflow, supported Leptos modes, no Cargo.toml mutation, naming, theme policy, package validation.                                                              |
| Cargo.toml                                                               | Six workspace crates; package version 0.1.0; edition 2024; rust-version 1.92.0. Framework/schema target is separately observed as 0.9.0-alpha; do not confuse crate package SemVer with framework compatibility. |
| crates/leptos_ui_kit_registry/src/config.rs                              | Defaults `src/components/ui`, `_kit/kit.json`, `styles/kit.css`; strict camelCase config; several schema/framework constants share 0.9.0-alpha.                                                                  |
| crates/leptos_ui_kit_registry/src/builtin_registry.rs                    | Embedded asset snapshot and registry/schema/contract validation; package-local immutable asset model.                                                                                                            |
| crates/leptos_ui_kit_registry/registry/registry.json                     | 22-item inventory; primitive, identity, layer and portal compatibility metadata.                                                                                                                                 |
| crates/leptos_ui_kit_registry/registry/ui/button.json                    | button.rs export declarations; managed CSS block; tokens/spinner dependencies; accessibility/dependency metadata.                                                                                                |
| crates/leptos_ui_kit_registry/registry/ui/button.rs                      | Native button, primary/secondary/ghost, sm/md/lg, explicit native type, disabled/loading/busy behavior and decorative spinner.                                                                                   |
| crates/leptos_ui_kit_registry/registry/ui/dialog.json                    | Compound directory with explicit target files/exports and identity/tokens dependencies; external web_ui_primitives dependency.                                                                                   |
| crates/leptos_ui_kit_registry/registry/ui/dialog/content.rs              | Primitive-backed layers/dismissal/portal/presence and role switch; port should delegate to Bits, with separate Alert Dialog.                                                                                     |
| crates/leptos_ui_kit_registry/registry/styles/{tokens,button,switch}.css | kit class/property vocabulary, managed block markers, cascade layers, radius fallback, checked-state/RTL/motion behavior.                                                                                        |
| crates/leptos_ui_kit_codegen/src/install_lock.rs                         | File/CSS ownership, hashes and reverse indexes, strict lock constants/theme metadata.                                                                                                                            |
| crates/leptos_ui_kit_codegen/src/planning/files.rs                       | Refuses locally edited tracked source on differing incoming output; lock publication is last marker in nonempty cohorts. Not a text merge engine.                                                                |
| crates/leptos_ui_kit_codegen/src/planning/sync.rs                        | Rebuilds desired config from resolved closure, motivating separation of user roots from dependencies.                                                                                                            |
| crates/leptos_ui_kit_codegen/src/planning/init.rs                        | Plans config/CSS/modules/lock instead of scattered writes.                                                                                                                                                       |
| crates/leptos_ui_kit_cli/tests/exit_contract.rs                          | JSON stdout/stderr/exit contracts, idempotence, conflicts and unsafe paths.                                                                                                                                      |
| crates/leptos_ui_kit_cli/tests/{workflow,packaged_runtime}.rs            | End-to-end and packaged-runtime coverage; inspect actual commands before running.                                                                                                                                |
| crates/leptos_ui_kit_codegen/src/path_safety* and transaction*           | Strong filesystem protections; do not claim unqualified Node-equivalent security.                                                                                                                                |
| crates/leptos_ui_kit_codegen_platform                                    | Narrow Windows platform boundary, the exceptional unsafe-code scope in the reference. Not a required Svelte package.                                                                                             |

#### Commit convention evidence

The GitHub connector returned these recent reference subjects at specification preparation:

- `a10fbf0` — `switch: strengthen the unchecked track contrast`
- `db5635f` — `switch: animate track and thumb state`
- `705f972` — `checkbox: constrain svg indicator geometry`
- `494ef17` — `checkbox: render a canonical svg checkmark`
- `689cf8d` — `selection: stabilize white control indicators`
- `e4c128a` — `registry: complete desired item vocabulary`

Inferred convention: lowercase area, colon and space, imperative lower-case summary; optional body explains behavior/tests. Use this fallback only when the actual target has no stronger convention. Do not assume Conventional Commits `feat(scope):` was established by this source.

#### Current-doc checks and version limits

Official Svelte/Bits docs were read during the source review for project layout, bindings, dialog composition, child snippets, portals, handler merging, compiler parsing and request-local state. The [reference URL inventory](SOURCES.json) preserves those pointers for later adoption into `references/SOURCES.json`. These are mutable documentation pointers, not a lockfile or a validated compatibility matrix; recheck selected versions during implementation.

The historical Bits source package manifest observed in the review was version 2.19.3, Svelte peer `^5.33.0`, date peer `^3.8.1`, Node `>=20`; verify actual selected package metadata before using it. No current npm release or package-name availability claim is made.

#### Verification limitations

No Rust/Svelte project test suite ran during specification creation. The source specification validator checked document/plan integrity only. The exact reference revision was available for inspection during the target review; that access does not establish test execution or implementation correctness. Target code and third-party dependencies must still be implemented and verified in the authorized environment.

Retain required upstream license notices when copying CSS/code and inspect the actual target licensing policy before distribution. The reference declares MIT OR Apache-2.0; publisher identity and publication remain outside this implementation scope.
