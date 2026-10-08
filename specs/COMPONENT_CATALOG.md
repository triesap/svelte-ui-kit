# Catalog and component qualification

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

#### Inventory policy

The reference registry contains 22 IDs: alert, anchor, avatar, badge, button, card, checkbox, collapsible, dialog, field, identity, menu, progress, radio, router-link, separator, skeleton, spinner, status, switch, tabs, tokens. Preserve recognizable item names; this is a behavioral/design-system adaptation, not a promise that every Rust file has a Svelte counterpart.

First qualify `tokens`, `spinner`, `button`, `switch`, and `dialog` end-to-end. Then qualify distinct `alert-dialog` behavior and floating `menu` early, followed by the rest of the reference catalog. A separate generated identity item is conditional on actual need, not a placeholder shim. Extensions outside this inventory use the explicit later specification gate.

#### Per-item requirements

| ID           | Implementation boundary and required checks                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tokens       | CSS-only foundation. Preserve semantic vocabulary, layers, theme metadata, customization contract separation, and fallback/default qualification.                                                                                                                                                                                                                                                                                                        |
| spinner      | Native decorative/status presentation as justified by source API. Button uses the decorative mode. Preserve shape-critical circular geometry, reduced motion, and nonduplicated accessible loading text.                                                                                                                                                                                                                                                 |
| button       | Native typed button recommended; primary/secondary/ghost and sm/md/lg. Default type button; explicit submit/reset, disabled/loading/busy, loading label, direct spinner dependency and sibling import. Preserve caller attributes/classes and children semantics.                                                                                                                                                                                        |
| switch       | Bits Root/Thumb wrapper; bind checked/ref deliberately; internal thumb means excluded child/children hooks. Forward form props and events correctly; checked/unchecked styles, RTL, reduced motion, label association, reset, required and disabled cases.                                                                                                                                                                                               |
| dialog       | Bits compound family: Root, Trigger, Portal, Overlay, Content, Title, Description, Close. Preserve open/ref bindings, snippets, accessible names, focus trap/return, escape/outside handling, presence, hydration, nested themes and overlays.                                                                                                                                                                                                           |
| alert-dialog | Distinct primitive-backed family for confirmation/alert interaction. Freeze exact parts from pinned types. Do not emulate it with a Dialog role switch or invent confirmation/application state.                                                                                                                                                                                                                                                         |
| menu         | Bits Dropdown Menu adaptation with kit `Menu*` flat exports. Freeze exact source-parity parts before implementation. Verify floating wrapper structure, keyboard navigation/typeahead, item selection, dismissal/focus return, disabled items, positioning and nested overlays. Extra submenus/selection variants only when the source/API worksheet supports them. See [Approved source-parity clarifications](#approved-source-parity-clarifications). |
| checkbox     | Bits-backed form control. Preserve native participation, checked/bind/ref behavior, indeterminate behavior if represented in the source/primitive contract, labels and disabled/required/reset cases. Preserve fixed-size SVG indicator geometry where mapped from reference.                                                                                                                                                                            |
| radio        | Bits Radio Group adaptation with kit `Radio*` family names frozen from source needs. Preserve value/type contract, arrow-key behavior, disabled items, form participation and labels; verify selection-indicator geometry/colors.                                                                                                                                                                                                                        |
| tabs         | Bits compound adaptation with typed value/activation/orientation behavior justified by source. Preserve tab/panel relationships, keyboard navigation, disabled triggers, refs and snippets, mounted-state/hydration behavior.                                                                                                                                                                                                                            |
| collapsible  | Bits Root/Trigger/Content adaptation. Controlled/uncontrolled bindings, labels/expanded semantics, content presence/motion and reduced-motion qualification. Accordion-like recipes are composition, not a new generalized state engine.                                                                                                                                                                                                                 |
| field        | Svelte semantic field composition; freeze exact control/label/description/error wiring from source. Preserve real labels, unique stable associations, input form props, error semantics and helper relationships. Do not introduce a form-validation library or invented schema engine. See [Approved source-parity clarifications](#approved-source-parity-clarifications).                                                                             |
| anchor       | Native typed anchor presentation. Preserve actual navigation, href/target/rel/download/data attributes and keyboard behavior; use source design classes. Do not synthesize button semantics.                                                                                                                                                                                                                                                             |
| router-link  | Optional thin SvelteKit/native-anchor recipe and documentation. Reuse anchor presentation where appropriate; preserve native routing/link options and base-path policy discovered from target. No copied Leptos router runtime.                                                                                                                                                                                                                          |
| avatar       | Native Svelte markup or thin primitive based on source loading/fallback behavior. Test image success/failure/fallback and accessible alternative text; do not make a purely decorative assumption. See [Approved source-parity clarifications](#approved-source-parity-clarifications).                                                                                                                                                                  |
| badge        | Native presentation with source-supported variants only; semantic text, class forwarding and token/contrast qualification.                                                                                                                                                                                                                                                                                                                               |
| card         | Native compositional surface with source-supported parts only; preserve sensible structure/slots and application content. No business/dashboard behavior.                                                                                                                                                                                                                                                                                                |
| alert        | Native semantic message presentation following source role/variant contract. Verify accessible content and announcement behavior; no notification queue or application-level delivery system.                                                                                                                                                                                                                                                            |
| status       | Native semantic status feedback; preserve suitable announcement behavior and accessible labeling without announcing decorative copies. Distinguish from alert according to source contract.                                                                                                                                                                                                                                                              |
| progress     | Native semantic element or narrowly justified primitive; typed bounds/value/indeterminate semantics from source; accessible name and determinate/indeterminate styling. No timer/async task engine.                                                                                                                                                                                                                                                      |
| separator    | Native/primitive semantic separator as justified by source; decorative and meaningful cases, orientation, role and class forwarding.                                                                                                                                                                                                                                                                                                                     |
| skeleton     | Native decorative loading placeholder; do not fabricate readable content or redundant announcements. Verify reduced motion, dimensions and theme surface contrast.                                                                                                                                                                                                                                                                                       |
| identity     | Preserve stable SSR/client identity and explicit label/control associations using pinned Svelte/Bits facilities. Evaluate whether any app-owned helper is useful. Do not copy Rust provider APIs, counters or compatibility aliases; record an evidence-backed non-generated mapping when no item is needed.                                                                                                                                             |

#### Approved source-parity clarifications

Codex incorporated these already-approved review dispositions at S002. They
clarify existing catalog scope and supersede any less precise interpretation
of the inventory table above; they do not introduce new extension APIs.

- **Field — S145–S148, S181.** Map every source export: FieldRoot,
  FieldSurface, FieldLabel, FieldMessage, FieldRequired, FieldSlot,
  TextInput/TextInputType, TextArea, TextField, TextAreaField, NativeSelect,
  SelectField and SelectIcon. Include native input/textarea/select, label,
  required, invalid, disabled, dynamic-message and composition behavior in the
  worksheet, with an explicit Svelte mapping or justified disposition for each.
  Native select parity belongs to the original catalog; the deferred new
  select/combobox API is a different scope. Preserve behavior without copying
  Rust-specific slot/context APIs.
- **Menu — S122–S128, S181.** Ordinary and radio items, controlled selection,
  and selection indicators are evidenced source requirements. Include them
  alongside activation, keyboard/typeahead, dismissal, focus return and
  placement. Derive necessary pinned Bits parts without adopting its entire
  catalog. No untested strict-CSP promise is allowed.
- **Avatar — S155–S157.** The reference Avatar is a native image with src,
  alt and class; it does not establish a source fallback API. The approved
  target nevertheless requires loading/failure/fallback qualification. Freeze
  minimal typed fallback content, transitions, accessible text and SSR behavior
  at S155 using pinned native/Bits evidence. Describe this as target behavior,
  without inventing unrelated variants or attributing fallback to the source.

#### Complete original catalog disposition

S181 audits the immutable a10fbf06334f4648f5755e05a7147414e4e5fc98 registry:
22 original IDs become 21 generated items plus a documented native identity
mapping. The distinct approved Alert Dialog makes 22 generated items in total.
The [source inventory fixture](../tests/fixtures/catalog-source.json) records
the actual registry/manifest/source/style hashes and every source export; it
does not replace source inspection or behavioral qualification. Every generated
manifest target/export/style is validated and installed together in default/
custom production consumers, including a typed import probe of every advertised
value/type. Individual worksheets and executable tests retain the behavior
evidence; source CSS/defaults are preserved with documented native state mapping.

| Original ID | Target disposition and worksheet                                                                                                                                                                                                                                        |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| alert       | Native fixed-role message; [Alert](component-maps/alert.md).                                                                                                                                                                                                            |
| anchor      | Native Anchor and AnchorTarget; [Anchor](component-maps/anchor.md).                                                                                                                                                                                                     |
| avatar      | Native image plus approved loading/fallback target behavior; [Avatar](component-maps/avatar.md).                                                                                                                                                                        |
| badge       | Native text span; [Badge](component-maps/badge.md).                                                                                                                                                                                                                     |
| button      | Native Button, ButtonVariant and ButtonSize; source ButtonType uses native button type, without a Rust enum alias; [Button](component-maps/button.md).                                                                                                                  |
| card        | Native compositional section; [Card](component-maps/card.md).                                                                                                                                                                                                           |
| checkbox    | Actual Bits checked/indeterminate control with qualified native form reset; [Checkbox](component-maps/checkbox.md).                                                                                                                                                     |
| collapsible | Actual Root/Trigger/Content, explicit native SSR registration and motion limits; [Collapsible](component-maps/collapsible.md).                                                                                                                                          |
| dialog      | Actual named family with Portal/Overlay composition; source DialogContentRole does not switch primitive kind; [Dialog](component-maps/dialog.md).                                                                                                                       |
| field       | All source parts/recipes; FieldSlot becomes Snippet type, TextInputType remains native input union, complete NativeSelect/SelectField/SelectIcon; [Field](component-maps/field.md).                                                                                     |
| identity    | Deliberately non-generated KitIdProvider/use_kit_id mapping to pinned Svelte/Bits instance facilities; real request/hydration proof; [Identity](component-maps/identity.md).                                                                                            |
| menu        | All source ordinary/radio/indicator behavior with native RadioGroup/Portal context; MenuContentAlign/MenuContentSide/MenuDirection/MenuLoop use exact native part props and unions; MenuItemKind maps to distinct Item/RadioItem parts; [Menu](component-maps/menu.md). |
| progress    | Native numeric progress and approved indeterminate omission, native attribute and paint repairs; [Progress](component-maps/progress.md).                                                                                                                                |
| radio       | Source Radio becomes actual RadioGroup/RadioItem string-value composition with qualified reset; [Radio](component-maps/radio.md).                                                                                                                                       |
| router-link | Optional RouterLink/Anchor recipe with application-owned SvelteKit path resolution and no stylesheet/router engine; [RouterLink](component-maps/router-link.md).                                                                                                        |
| separator   | Meaningful/decorative native Separator and SeparatorOrientation, caller-owned parent geometry; [Separator](component-maps/separator.md).                                                                                                                                |
| skeleton    | Empty concealed static decorative span; application owns loading meaning/state; [Skeleton](component-maps/skeleton.md).                                                                                                                                                 |
| spinner     | Native Spinner and SpinnerMode, decorative/status modes and reduced motion; [Spinner](component-maps/spinner.md).                                                                                                                                                       |
| status      | Native paragraph, StatusRole and StatusPoliteness with caller ARIA precedence; [Status](component-maps/status.md).                                                                                                                                                      |
| switch      | Actual native primitive with labels/forms/reset and source track/indicator; [Switch](component-maps/switch.md).                                                                                                                                                         |
| tabs        | Source TabsPanel maps to TabsContent; TabsActivation/TabsDirection/TabsLoop/TabsOrientation use exact native props/unions rather than compatibility enums; [Tabs](component-maps/tabs.md).                                                                              |
| tokens      | CSS-only foundation plus independently versioned semantic/customization/theme metadata; [Tokens](component-maps/tokens.md).                                                                                                                                             |

The sole additional component is the approved distinct [Alert Dialog](component-maps/alert-dialog.md),
not a Dialog role switch. No future combobox/popover/selection extension is
implicitly included. This audit is an implemented candidate awaiting separate
S181 acceptance; later platform/package/AC20 and full-MVP acceptance remain open.
Maintain measured native SSR child registration, runtime floating styles/CSP,
image event recording/CSP, browser-owned progress paint/animation and decorative
surface contrast concerns. No broad accessibility, strict-CSP or cross-browser
certification follows from manifest coverage.

#### Required component worksheet

Before writing each family, capture exact exported names, .svelte/.ts targets, source counterpart, upstream/native props, bindings and refs, snippet policy, event ordering, default markup, CSS classes/state selectors, form behavior, accessibility checks, dependency closure, and source/style compatibility group. Sources not inspected in the original approved review must be inspected by the agent or replaced by explicit conservative spec-defined behavior; an inferred API is not an approved source fact.

A primitive's complete upstream catalog is not automatically this kit's catalog. Keep the wrapper small, preserve available semantics, and document intentional omitted rendering hooks. Distinguish a presentational kit default from a restriction on a behavior that users already rely on.

#### Test fixture policy

Each item/family has an install fixture, positive/negative type cases, a visual state fixture, and applicable browser semantics tests. Test generated application files and root exports, not only imports from authoring templates. Keep common harness utilities small and avoid snapshot-only accessibility assertions. Browser tests must assert actual focus/state/form behavior.

#### Extension direction retained

Select, combobox, popover, date-related components, and higher-level patterns are approved future direction after generator/wrapper stability. They need explicit inventory, values/generics, search/filtering ownership, portal behavior, locale/date/timezone and validation policy where relevant. The scheduled final extension gate captures questions and a subsequent spec/sequence without writing guessed implementations. Do not label these delivered merely because Bits UI offers them.
