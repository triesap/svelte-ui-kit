# Distinct Alert Dialog contract

Alert Dialog is the approved distinct Bits UI 2.19.5-svelte-ui-kit.2 primitive family. The
immutable reference catalog has no Alert Dialog family to mechanically port;
shared visual design will use the established Dialog/token vocabulary at S120.
It is not the reference's simple `alert` item and does not add application
confirmation, async actions or a Dialog role-switch API. Keep MIT source
attribution for any shared reference design declarations.

| Public value           | Public type                 | Exact pinned namespace type  | Owned design class           |
| ---------------------- | --------------------------- | ---------------------------- | ---------------------------- |
| AlertDialogRoot        | AlertDialogRootProps        | AlertDialog.RootProps        | none: no DOM                 |
| AlertDialogTrigger     | AlertDialogTriggerProps     | AlertDialog.TriggerProps     | kit-alert-dialog-trigger     |
| AlertDialogPortal      | AlertDialogPortalProps      | AlertDialog.PortalProps      | none: portal composition     |
| AlertDialogOverlay     | AlertDialogOverlayProps     | AlertDialog.OverlayProps     | kit-alert-dialog-overlay     |
| AlertDialogContent     | AlertDialogContentProps     | AlertDialog.ContentProps     | kit-alert-dialog-content     |
| AlertDialogTitle       | AlertDialogTitleProps       | AlertDialog.TitleProps       | kit-alert-dialog-title       |
| AlertDialogDescription | AlertDialogDescriptionProps | AlertDialog.DescriptionProps | kit-alert-dialog-description |
| AlertDialogAction      | AlertDialogActionProps      | AlertDialog.ActionProps      | kit-alert-dialog-action      |
| AlertDialogCancel      | AlertDialogCancelProps      | AlertDialog.CancelProps      | kit-alert-dialog-cancel      |

These are the exact nine public primitive parts, with eighteen eventual flat
value/type exports and no AlertDialogClose or parallel kit namespace. Native
public types are aliased directly, preserving native attributes, class/style,
refs and callbacks. Root has explicit open binding with native false default,
boolean change/completion callbacks and a no-argument children snippet, but no
DOM ref/class/modal/role/confirmation props. Trigger, Title, Description, Action
and Cancel support native child({props}) delegation. Overlay children receives
{open}, while its child and Content child receive {props, open}. Default Content
children is a no-argument snippet. Exact native HTMLElement/null refs are bound
to actual parts; caller classes merge with the documented design classes.

The actual distinct Root creates the native alert-dialog variant; Content gets
alertdialog semantics and native title/description identities from that context.
Require a real accessible name and an appropriate real description. Do not
manufacture IDs, context, focus traps or application state. Optional physical
description relationships must be valid in their actual tree, as already
qualified for Dialog. SSR, request-local identities and hydration remain enabled.

Pinned Content defaults interactOutsideBehavior to ignore, closes on Escape
unless the native caller callback cancels it, and opens by focusing Content.
Do not assume default Cancel autofocus or generic Dialog outside dismissal.
Native autofocus, Escape, outside, selection and scroll policies are forwarded
with their cancellation semantics. Exact public ContentProps currently aliases
the full native DialogContentProps, including onInteractOutside; a differently
narrowed internal WithoutHTML type is not substituted for the public contract.

Native Action supplies its identity/attributes and forwards caller interaction;
it has no automatic close or confirmation handler. Application code may update
bound open explicitly when its own decision succeeds. Cancel owns native close,
keyboard and disabled behavior. Preserve event ordering/cancellation through the
actual primitive, with no duplicated action/cancel handler or async-state API.
The source-first kit's ordinary button defaults remain type=button with native
explicit submit/reset overrides.

Portal preserves native Element|string to and disabled inline composition.
Default body targets inherit document-level themes; suitable custom hosts may
inherit nested themes with explicit clipping/stacking consequences. No computed
theme copying, target guessing, SSR switch or positioning/presence engine is
added. Exact native guarantees and any independently proven upstream limitations
remain explicit in qualification; they do not waive actual naming/focus/state,
ref/snippet/cancellation or lifecycle evidence.

S116 freezes this API/types only. S117–S119 author the distinct native wrappers;
S120 registers the complete source/style/export family as one compatibility
cohort. Until then, registry view/add must not advertise or install it. S121
qualifies real installed browser confirmation/action/cancel/focus behavior.

## Plain CSS design mapping

The distinct family uses the established Dialog geometry, spacing, typography,
focus, disabled and motion defaults. Exact native state selectors are scoped to
Alert Dialog classes. Action and Cancel share the established control design
with separately overridable properties; neither style implements behavior.
There is no new palette, reset or behavioral Dialog dependency. Content uses
logical centered fixed geometry, semantic overlay radius fallback, and reduced
motion removes transitions. Caller classes remain available for application
overrides. Overlay retains the established transparent default.

The independently named 56 properties are recorded in the portable
component-customization contract. Semantic defaults and the original source
radius inventory remain unchanged; four distinct family radii extend it.

| Property                                    | Grammar                                                  | Fallback                                                  |
| ------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| --kit-alert-dialog-z-index                  | <integer>                                                | 50                                                        |
| --kit-alert-dialog-trigger-padding-inline   | <length-percentage>                                      | 0.75rem                                                   |
| --kit-alert-dialog-trigger-padding-block    | <length-percentage>                                      | 0.5rem                                                    |
| --kit-alert-dialog-trigger-min-height       | <length-percentage>                                      | 2.5rem                                                    |
| --kit-alert-dialog-trigger-font-weight      | <number>                                                 | 600                                                       |
| --kit-alert-dialog-trigger-focus-ring       | <color>                                                  | var(--kit-alert-dialog-focus-ring, var(--kit-focus-ring)) |
| --kit-alert-dialog-trigger-disabled-opacity | <number>                                                 | var(--kit-disabled-opacity)                               |
| --kit-alert-dialog-trigger-color            | <color>                                                  | var(--kit-color-text)                                     |
| --kit-alert-dialog-trigger-border-color     | <color>                                                  | var(--kit-color-border)                                   |
| --kit-alert-dialog-trigger-background-hover | <color>                                                  | var(--kit-color-surface-hover)                            |
| --kit-alert-dialog-trigger-background       | <color>                                                  | transparent                                               |
| --kit-alert-dialog-transition-timing        | <easing-function>                                        | var(--kit-easing-standard)                                |
| --kit-alert-dialog-transition-duration      | <time>                                                   | var(--kit-duration-normal)                                |
| --kit-alert-dialog-title-line-height        | <number>                                                 | 1.25                                                      |
| --kit-alert-dialog-title-font-weight        | <number>                                                 | 700                                                       |
| --kit-alert-dialog-title-font-size          | <length-percentage>                                      | 1.125rem                                                  |
| --kit-alert-dialog-padding-inline           | <length-percentage>                                      | 1.25rem                                                   |
| --kit-alert-dialog-padding-block            | <length-percentage>                                      | 1.25rem                                                   |
| --kit-alert-dialog-max-inline-size          | <length-percentage>                                      | min(32rem, calc(100vw - 2rem))                            |
| --kit-alert-dialog-max-block-size           | <length-percentage>                                      | min(42rem, calc(100vh - 2rem))                            |
| --kit-alert-dialog-gap                      | <length-percentage>                                      | 1rem                                                      |
| --kit-alert-dialog-focus-ring               | <color>                                                  | var(--kit-focus-ring)                                     |
| --kit-alert-dialog-focus-outline-width      | <length>                                                 | 2px                                                       |
| --kit-alert-dialog-focus-outline-offset     | <length>                                                 | 2px                                                       |
| --kit-alert-dialog-elevation                | <shadow>                                                 | var(--kit-shadow-lg)                                      |
| --kit-alert-dialog-description-line-height  | <number>                                                 | 1.5                                                       |
| --kit-alert-dialog-description-font-size    | <length-percentage>                                      | 0.9375rem                                                 |
| --kit-alert-dialog-description-color        | <color>                                                  | var(--kit-color-text-muted)                               |
| --kit-alert-dialog-color                    | <color>                                                  | var(--kit-color-text)                                     |
| --kit-alert-dialog-cancel-padding-inline    | <length-percentage>                                      | 0.75rem                                                   |
| --kit-alert-dialog-cancel-padding-block     | <length-percentage>                                      | 0.5rem                                                    |
| --kit-alert-dialog-cancel-min-height        | <length-percentage>                                      | 2.5rem                                                    |
| --kit-alert-dialog-cancel-font-weight       | <number>                                                 | 600                                                       |
| --kit-alert-dialog-cancel-focus-ring        | <color>                                                  | var(--kit-alert-dialog-focus-ring, var(--kit-focus-ring)) |
| --kit-alert-dialog-cancel-disabled-opacity  | <number>                                                 | var(--kit-disabled-opacity)                               |
| --kit-alert-dialog-cancel-color             | <color>                                                  | var(--kit-color-text)                                     |
| --kit-alert-dialog-cancel-border-color      | <color>                                                  | var(--kit-color-border)                                   |
| --kit-alert-dialog-cancel-background-hover  | <color>                                                  | var(--kit-color-surface-hover)                            |
| --kit-alert-dialog-cancel-background        | <color>                                                  | transparent                                               |
| --kit-alert-dialog-border-width             | <length>                                                 | var(--kit-border-width)                                   |
| --kit-alert-dialog-border-color             | <color>                                                  | var(--kit-color-border)                                   |
| --kit-alert-dialog-background               | <color>                                                  | var(--kit-color-surface-raised)                           |
| --kit-alert-dialog-trigger-radius           | <length-percentage>{1,4} [ / <length-percentage>{1,4} ]? | inherit                                                   | initial | unset | revert | revert-layer | var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md))) |
| --kit-alert-dialog-cancel-radius            | <length-percentage>{1,4} [ / <length-percentage>{1,4} ]? | inherit                                                   | initial | unset | revert | revert-layer | var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md))) |
| --kit-alert-dialog-radius                   | <length-percentage>{1,4} [ / <length-percentage>{1,4} ]? | inherit                                                   | initial | unset | revert | revert-layer | var(--kit-radius-overlay, var(--kit-radius-default, var(--kit-radius-md))) |
| --kit-alert-dialog-action-padding-inline    | <length-percentage>                                      | 0.75rem                                                   |
| --kit-alert-dialog-action-padding-block     | <length-percentage>                                      | 0.5rem                                                    |
| --kit-alert-dialog-action-min-height        | <length-percentage>                                      | 2.5rem                                                    |
| --kit-alert-dialog-action-font-weight       | <number>                                                 | 600                                                       |
| --kit-alert-dialog-action-focus-ring        | <color>                                                  | var(--kit-alert-dialog-focus-ring, var(--kit-focus-ring)) |
| --kit-alert-dialog-action-disabled-opacity  | <number>                                                 | var(--kit-disabled-opacity)                               |
| --kit-alert-dialog-action-color             | <color>                                                  | var(--kit-color-text)                                     |
| --kit-alert-dialog-action-border-color      | <color>                                                  | var(--kit-color-border)                                   |
| --kit-alert-dialog-action-background-hover  | <color>                                                  | var(--kit-color-surface-hover)                            |
| --kit-alert-dialog-action-background        | <color>                                                  | transparent                                               |
| --kit-alert-dialog-action-radius            | <length-percentage>{1,4} [ / <length-percentage>{1,4} ]? | inherit                                                   | initial | unset | revert | revert-layer | var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md))) |

## Installed qualification and observed native boundaries

S121 candidate qualification uses real CLI-installed production apps in both
layouts. Actual Alert Dialog role/name/description, container autofocus, focus
containment/return, native Action/Cancel, default outside-ignore, configured
cancellation and nested layers are verified against the pinned behavior. Shared
visual defaults preserve the distinct primitive semantics. Document/body and
nested/custom-host theme changes, adverse clipping, RTL/reduced motion and
independent decision radius hooks are exercised in rendered DOM.

Same-worker concurrent/repeated SSR preserves request state/identities. Enabled
portals omit server content; inline native Content precedes child relation
registration on the server, so hydration completes actual naming/description.
Direct native controls establish that boundary. Physical description removal,
ref replacement and teardown release actual-tree observers; an owned missing
cleanup control fails the same assertion. No SSR or warning-suppression escape.

Pinned first portaled opening does not emit an opening-completion callback;
completed close emits false, matching direct Alert Dialog controls. Exact native
forwarding is retained without a second presence engine. Default native Content
also does not pass restoreScrollDelay to ScrollLock in its default rendering
branch; delegated rendering does. The wrapper forwards the public prop exactly
and does not promise stronger behavior than the pinned primitive. Separate S128
acceptance remains pending, with all original criteria and later platform/package
obligations preserved.
