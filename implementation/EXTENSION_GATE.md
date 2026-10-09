# Gated extension direction

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

Status: approved direction; **not implemented and not yet API-specified**.
Original S202 reconciles this gate against the verified original-catalog
candidate after the S201 implementation commit. This specification boundary
does not grant final core acceptance or authorization to implement extensions.

The review recommended extending the stable generator/wrapper architecture to select, combobox, popover, date-related components, and higher-level patterns after core and original-catalog parity. This direction remains part of project intent. The approved review did not supply enough public API or behavior detail to write a truthful complete coding sequence for these items.

#### Required next specification inputs

For select/combobox: exact item set and modes, values/generics, controlled/uncontrolled behavior, filtering/search ownership, form/validation behavior, rendering/snippet/ref policy, async behavior only if requested, disabled/empty/loading states, accessibility tests and styling contracts.

For popover: exact composition/defaults and relationship to already qualified portal/floating machinery; focus/dismissal semantics and CSS contract. Do not assume it is Dialog with a renamed class.

For date-related items: exact inventory (not every Bits date component), value types, locale/calendar/timezone responsibility, form serialization, formatting/validation, range behavior only if requested, and dependency/cross-request requirements. No date/timezone policy is invented by this specification.

For higher-level patterns: named examples and scope; distinguish composition recipes from new primitive/state/async systems. Existing accordion-like, alert/status, breadcrumb/pagination and native-table compositions stay lightweight.

#### Output of the scheduled gate

Record stable reusable infrastructure, remaining product questions, exact contracts to freeze, dependency/API evidence, and acceptance criteria. Only after the missing scope is settled should an agent create the next numbered commit sequence. Do not call the core release an implementation of these extensions. Do not substitute hundreds of speculative steps for the missing human intent.

## Verified reusable infrastructure

The original 22-item catalog has actual generated default/custom applications,
strict native types, production SSR/hydration, interaction, form, CSS, theme,
portal and package evidence in [final verification](evidence/FINAL_VERIFICATION.md).
The existing NativeSelectField remains an original native HTML control; it is
not a delivered Bits Select or Combobox family. Neither available upstream
exports nor a passing direct native declaration probe makes an extension part
of the advertised kit catalog.

[Architecture](../specs/ARCHITECTURE.md) and
[catalog contracts](../specs/COMPONENT_CATALOG.md) provide reusable registry
manifests, authenticated bundled assets, requested-root/dependency closure,
source/style/export cohorts, guarded transactions, customization-aware sync,
native sibling imports and per-item public type maps. Reuse the supported
snippet/ref/binding, event ordering/cancellation, form-owner reset, native
identity and lifecycle boundaries; do not invent another behavior engine.
Reusable qualification includes actual CLI-installed source, strict positive
and causal negative type controls, direct native comparisons, generated
default/custom and packed consumers, multi-request SSR/hydration, and complete
tree-preservation/conflict/recovery controls. Reuse does not waive new-item tests.

Floating primitives can reuse the documented application-owned portal host,
theme inheritance, open-theme changes, presence/cleanup and positioning
qualification approach. Preserve [current native boundaries](evidence/COMPATIBILITY.md#current-native-and-source-boundaries):
force-mount locking, callback completion, server relation registration,
nonsemantic floating IDs, CSP style attributes and nested clipping need actual
new-family controls. Existing Dialog/Menu behavior is evidence for test design,
not a substitute for proving Popover or selection behavior.

## Actual dependency evidence and missing contracts

The selected authentic baseline is Bits `2.19.5-svelte-ui-kit.2`, generated from
read-only upstream revision `fd10616a873a8e6e3652e31dcc88c5c2f155a9e2` with
the narrowly qualified declaration-emitter source fix. The
[producer recipe](../tools/native-dependency/README.md) records actual source,
archive identity, type/runtime preservation and explicit local-file delivery.
No new native dependency or registry release is selected by this gate. The
following installed declaration observations identify available upstream APIs;
they are not approved wrapper names, part inventories or defaults.

| Direction             | Observed native API                                                                                                                                                                                                                                          | Contracts required before implementation                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Select                | `dist/bits/select/types.d.ts` defines discriminated `single` string and `multiple` string-array values, callbacks, open state, name/required/disabled, item value/label/disabled pairs, typeahead/autofill inputs, deselection and native composition parts. | Freeze the exact item/part/export inventory, allowed modes, value/empty/serialization model, controlled/uncontrolled bindings and callback/reset ordering, form ownership and validation, keyboard/typeahead/autofill/deselection, grouping/disabled/loading/empty states, snippets/refs/attributes, portal/static/scrolling behavior and DOM/CSS map. Generic object values, virtualization and async data are not approved.                                                |
| Combobox              | `dist/bits/combobox/types.d.ts` reuses the Select single/multiple union and parts, omits root autocomplete, exposes read-only `inputValue`, and defines nonreactive initial input `defaultValue` and `clearOnDeselect`.                                      | Freeze selection versus displayed query ownership, filtering/search/matching policy, editable/free-text policy, labeling, input/selected value and callback/reset synchronization, forms/serialization, keyboard/active-descendant and focus behavior, exact part/snippet/ref inventory, empty/disabled/loading behavior and CSS. Async requests, cancellation, debouncing and result ordering need an explicit request and contracts; upstream presence grants none.        |
| Popover               | `dist/bits/popover/types.d.ts` defines open/callbacks, distinct floating/static Content snippet surfaces, Trigger hover options, Close/Arrow/Portal/Overlay. Declaration comments describe hover default false and delays 700/300 ms.                        | Freeze exact composition/exports and approved defaults, controlled open state and callback/presence ordering, trigger/hover/touch policy, focus management/restoration, outside/Escape and nested-layer behavior, Content static/floating/force-mount ownership, portal/theme/CSP/clipping limits, snippets/refs/attributes and source DOM/CSS map. Do not assume modal Dialog semantics or adopt comment defaults as kit policy.                                            |
| Date-related controls | The available native package includes Calendar/Date-related primitives and uses the pinned `@internationalized/date` model. A direct Calendar strict probe helps qualify the emitter, not the kit inventory.                                                 | Choose the exact components and modes first. Freeze value types and date versus time/instant meaning, calendar/locale/timezone ownership, parsing/formatting/display versus submission serialization, controlled state/reset, bounds/disabled/validation, range selection only if requested, keyboard/focus/labels, snippets/refs/parts, SSR/cross-request locale state, dependencies and CSS. No timezone conversion, date arithmetic or range/business policy is presumed. |
| Higher-level patterns | Current source-owned wrappers support lightweight composition recipes. Original alert/status, accordion-like, breadcrumb/pagination, native-table and router-link boundaries remain fixed.                                                                   | Name each requested pattern and distinguish application composition/example from a new registry item or state/async engine. Define dependencies, ownership, data/action/error behavior, forms/accessibility, slots/snippets, styles and acceptance cases. Data grids, async queues, business workflows and a router engine require their own explicit product contracts.                                                                                                     |

## Gate deliverables and future acceptance

For each proposed family, the next specification must record:

1. A finite requested item/part/export inventory, default/custom generated paths,
   dependency closure, source provenance and the exact supported native pin.
2. Public native-derived props, state/value discriminants, bindings, refs,
   children/delegation snippets and event ordering/cancellation; rejected or
   unsupported surfaces must be explicit rather than accepted and dropped.
3. Product-owned choices for forms/reset/serialization, search/query or
   date/locale/timezone behavior, loading/error/disabled states and composition.
4. Source-to-DOM CSS/token/radius/geometry mapping, theme/portal/RTL/motion,
   contrast dispositions and bounded CSP/SSR/identity/lifecycle behavior.
5. Strict positive and causal negative type fixtures; real native/generated
   browser/form/keyboard/focus controls; repeated/concurrent SSR and hydration;
   both layouts and a real installed source-independent packed consumer.
6. Registry/export/style cohort tests, dependency instructions, upgrade/conflict/
   retirement/customization/replay/recovery controls, notices, documentation,
   full CI coverage and measured local qualification for changed scope.

After those decisions are actually specified and approved, create the scoped
ordered coding sequence with dependency gates and separate independent
acceptance. Keep unsupported platform/browser limits explicit. Do not use the
core's current counts or a direct native probe to accept untested extensions.

The original MVP completes against R01–R34 and AC01–AC22, including this gate.
The missing extension product contracts block only an expanded release that
includes these families. They do not create unfinished original RCLDs, reopen
accepted core requirements or justify delaying eligible core delivery. No
extension component, extra dependency, speculative sequence or undefined API
is implemented by S202.
