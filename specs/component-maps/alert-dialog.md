# Distinct Alert Dialog contract

Alert Dialog is the approved distinct Bits UI 2.19.3 primitive family. The
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
