# Generated layout, ownership, and names

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

#### Default consumer tree

```
src/
  lib/components/ui/
    index.ts
    button.svelte
    button.types.ts
    spinner.svelte
    switch.svelte
    dialog/
      index.ts
      root.svelte
      trigger.svelte
      portal.svelte
      overlay.svelte
      content.svelte
      title.svelte
      description.svelte
      close.svelte
    _kit/
      kit.json
      kit.lock.json
      token-contract.json
      theme-integration.json
  styles/
    kit.css
    themes.css
    app.css
  routes/+layout.svelte
```

This is an illustrative tree after installing the listed items, not a requirement for `init` to install all of them. Unrequested source must not appear. The original default was `src/components/ui` with `_kit` and `styles/kit.css`; the Svelte adaptation deliberately uses `src/lib` and `src/styles`.

`themes.css` and `app.css` are application-owned. A generator may create an absent empty integration target only when part of an explicitly reported initialization plan; it must never replace an existing theme or reset stylesheet. A tokens install produces token/theme metadata when its contracts exist. The metadata must not claim a Rust ABI or primitive package that is not used by Svelte.

#### Naming

| Concept                                   | Name/pattern                                               |
| ----------------------------------------- | ---------------------------------------------------------- |
| Spec identifier                           | `svelte_ui_kit_v1`                                         |
| Package, CLI, namespace in markers/layers | `svelte-ui-kit`                                            |
| Registry IDs and filename segments        | lowercase kebab-case (`router-link`, `button.svelte`)      |
| Simple component                          | one `.svelte` file, optional adjacent `.types.ts`          |
| Compound component                        | directory with `index.ts` and named part files             |
| Public values/types                       | PascalCase (`Button`, `DialogRoot`, `ButtonVariant`)       |
| Public props/config fields                | camelCase (`loadingLabel`, `schemaVersion`, `uiDir`)       |
| CSS classes                               | `.kit-*`, BEM-like variants such as `.kit-button--primary` |
| CSS properties                            | `--kit-*`                                                  |
| Root import                               | `$lib/components/ui`                                       |

Public dialog exports: `DialogRoot`, `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogClose`. There is one canonical flat naming surface; do not add parallel `Dialog.Root` aliases. Public use of Bits UI namespaces inside generated wrappers is not a kit namespace alias.

Do not generate `src/lib/components/index.ts` merely to imitate Rust parent modules. Generated source uses direct sibling imports, not the generated root barrel. Manifest declarations determine source targets and public exports. Reject duplicate symbols, conflicting paths, and case-colliding names before writes.

#### Ownership

Component sources and their supporting TS files are initially generated but freely editable. The root and compound barrels have clearly managed export regions; preserve unrelated application text and detect conflicting declarations. Exact TS comment marker syntax is frozen at its dedicated contract step; CSS marker syntax is already specified.

`kit.json` records user-editable desired installation and validated integration settings. `kit.lock.json` and contract metadata are tool-managed and committed. Keep ephemeral writer coordination/journals separate from semantic committed metadata; their exact paths are internal choices and must be documented, ignored appropriately, and handled safely after interruption.

The stylesheet has separately managed blocks, not whole-file generator ownership. Preserve all text outside managed regions, including comments and application overrides. A customized managed block is still user work and must not be overwritten silently.

#### Layout imports

Ensure the application loads `kit.css`, then `themes.css`, then `app.css`, preserving existing layout code and avoiding duplicate imports. Resolve relative paths from the actual supported layout; the default is `../styles/<name>.css` from `src/routes/+layout.svelte`. Parse Svelte, identify an appropriate instance script, and apply a minimal text edit. Test layouts with no script, existing instance/module scripts, TypeScript, comments, and existing imports. Do not inject into the wrong script or replace route rendering.

Custom UI/styles/root layouts require explicit validated mapping. `--cwd` chooses one package; do not scan and mutate all workspace members. Unsupported or ambiguous integration must produce a diagnostic and an explicit manual step rather than a guessed edit.
