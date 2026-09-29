# Product contract

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

Status: approved intent, with explicitly labeled discovery gates. Spec: `svelte_ui_kit_v1`.

#### Goal

Reproduce the source-first workflow and recognizable conventions of `leptos_ui_kit` for SvelteKit. The product is a generator and authored registry, not a runtime styled component library. Developers receive editable application code and CSS; upstream interaction remains in Bits UI where useful.

The original review compared registry/configuration, codegen planning and transactions, CSS/token contracts, component manifests, representative native and primitive-backed components, and CLI/package tests at `a10fbf06334f4648f5755e05a7147414e4e5fc98`. It did not execute the Rust suite or compile Svelte prototypes. See [SOURCE_BASELINE.md](../references/SOURCE_BASELINE.md).

#### Stable requirements

| ID  | Contract                                                                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| R01 | Product/package/executable is `svelte-ui-kit`; spec is `svelte_ui_kit_v1`. One published npm package initially; modular TypeScript internals. |
| R02 | Installed `.svelte`, `.ts`, and CSS are application-owned editable source. No imports from a styled kit runtime.                              |
| R03 | Bits UI supplies complex interaction; native Svelte/HTML handles simple presentation. Do not port Rust primitive internals.                   |
| R04 | Pure authored CSS, semantic tokens, no Tailwind/CSS-in-JS/shadcn compatibility or conversion pipeline.                                        |
| R05 | Default UI path is `src/lib/components/ui`; state path is its `_kit` child; CSS is `src/styles/kit.css`.                                      |
| R06 | Simple files and compound directories; flat PascalCase exports; lowercase kebab-case filenames/item IDs; camelCase props/config keys.         |
| R07 | Preserve `.kit-*`, `--kit-*`, managed block IDs, and change only tool-specific markers/layers to `svelte-ui-kit`.                             |
| R08 | Bundle complete registry assets and schemas in the package; built-in registry only; tarball works without authoring tree.                     |
| R09 | CLI: `info`, `init`, `view`, `add`, `sync`, `doctor`; approved `--dry-run`, `--json`, `--cwd`, `doctor --strict`.                             |
| R10 | Plan dependencies accurately, including peers, without implicitly editing `package.json` or invoking a package manager.                       |
| R11 | Keep explicitly requested items in config and resolved dependency closure in lock state.                                                      |
| R12 | Decouple schema, package, registry, item, framework compatibility, and CSS contract versions.                                                 |
| R13 | Use base/local/incoming comparison for sources and CSS. Preserve local edits, detect real conflicts, no automatic merge.                      |
| R14 | Treat coupled source and style changes as compatibility cohorts; conflicts must not partially update a component.                             |
| R15 | Deterministic inspectable plans, all-or-nothing conflict planning, zero-write dry runs, idempotence, one structured result.                   |
| R16 | Validate paths/ownership; detect concurrent changes; stage recoverable writes and publish install lock last.                                  |
| R17 | Preserve unmanaged CSS/barrel/layout content; patch layouts structurally and fail safely on unsupported shapes.                               |
| R18 | Retire unneeded generated assets safely; never silently delete customized assets or manufacture a remove command.                             |
| R19 | `doctor --strict` distinguishes intentional customization from broken/unsafe installations; customization alone is not corruption.            |
| R20 | Preserve primitive/native types, discriminated unions, state bindings, refs, snippets, event semantics, and native form behavior.             |
| R21 | Keep SSR/hydration and request-local state safe; do not disable SSR or use shared mutable server state as a workaround.                       |
| R22 | Test keyboard/focus/accessibility, labels, form submission/reset, disabled state, overlays, motion, RTL, and themes as applicable.            |
| R23 | Application owns themes/persistence/color-scheme. Global and nested portal theme strategies are explicit.                                     |
| R24 | Pure CSS is not a zero-inline-style/CSP guarantee; audit placement behavior and document actual support.                                      |
| R25 | Preserve component-property → semantic-role → default-radius → reference-radius fallback and shape-critical geometry.                         |
| R26 | Deliver tokens/spinner/button/switch/dialog first, then original catalog adaptation; exercise floating menu early.                            |
| R27 | Distinct Alert Dialog behavior uses its primitive, not only `role="alertdialog"` on Dialog.                                                   |
| R28 | Keep identity behavior Svelte-native; router-link is an optional thin native-anchor recipe, not a new router.                                 |
| R29 | Test installed generated output in a real SvelteKit app; run typecheck/build/browser tests and packed artifact acceptance.                    |
| R30 | Preserve the source project's JSON/error/idempotence/conflict/packaging rigor, with independently versioned target wire contracts.            |
| R31 | Preserve approved extension direction without inventing select/combobox/popover/date/higher-level APIs; use a scoped specification gate.      |
| R32 | Follow spec-anchored, one-step/one-commit execution; verify, self-review, report, and document evidence-backed deviations.                    |
| R33 | Preserve any applicable Rust workspace with Cargo/repo checks at each step; Cargo is N/A in a TS-only target.                                 |
| R34 | Use real target conventions, protect unrelated changes, do not publish/push or overwrite the reference repository.                            |

#### User-facing workflow

From an application package root, inspect with `info`, initialize, inspect a registry item with `view`, install with `add`, reconcile selected items with `sync`, and validate with `doctor`. Use dry runs before mutations and JSON for automation. Follow the reported dependency installation instructions separately. Commit generated files and metadata. Customize components directly or use application theme/override CSS. Upgrade the local CLI to a tested version, inspect a sync dry run, then apply only safe changes; resolve genuine conflicts explicitly.

Root requests and transitive items must be distinguishable throughout. For `button`, the initial closure includes `spinner` and `tokens`; it does not make those dependencies explicit user requests. Re-adding the same item is idempotent. Removing a desired item from configuration is the reconciliation input; no separate `remove` command is part of the approved surface.

#### Non-goals

No distributed service, online registry protocol, telemetry, registry authentication, runtime theme store, icon dependency, generic plugin ecosystem, schema hosting deployment, automatic npm install, patch/merge UI, React compatibility, Tailwind option, Rust CLI requirement, or bulk repo migration. Do not add these to fill perceived gaps. Exact visual defaults beyond the reviewed CSS and explicit source contracts must be derived and verified, not redesigned without a spec change.

The consumer dependency install can require network access; package asset loading and regeneration must not rely on live GitHub. One CLI package does not mean zero consumer runtime dependencies: Bits UI and Svelte are still real dependencies.
