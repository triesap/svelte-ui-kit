# Avatar source and target contract

Current qualification status: original family gates through S193 are independently
accepted. Checkpoint-era pending/gated statements below retain historical
provenance. The selected native baseline and final release remain candidates
under [current qualification](../../implementation/evidence/COMPATIBILITY.md#current-native-and-source-boundaries)
and the sole governing ledger; separate S203 acceptance remains required.

Original S155–S157, R03, R20, R22, R25, R26, R32, R33, R34.

The immutable source Avatar component is a native image with required string src
and alt plus an optional caller class. Its avatar manifest exports only Avatar,
depends on tokens and installs one managed avatar stylesheet. The six source
declarations make `.kit-avatar` block-level, border-box, 2.5rem square, circular
through `--kit-avatar-radius` falling back to `--kit-radius-full`, and cover-fit.
There are no source size variants, fallback, loading callback or compound parts.
Preserve those source facts; the fallback below is approved target behavior from
the catalog's Avatar clarification, rather than an attributed source API.

Use native Svelte image markup rather than a primitive dependency. Inspected
pinned Bits Avatar uses a separate Image preloader and runtime display styles;
the required native image events, actual srcset/sizes requests and fallback need
no replacement request engine. Depend only on tokens, with no npm dependency.

Freeze flat exports Avatar and AvatarProps, files `avatar.svelte` and
`avatar.types.ts`, and one `avatar` managed CSS block. Props intersect actual
Svelte native image attributes with required string src/alt, optional no-argument
fallback Snippet and bindable HTMLImageElement|null ref. Preserve class/style,
native attrs, srcset/sizes, cross-origin/referrer/loading hints and typed native
events. Actual Svelte load/error handlers use Element currentTarget rather than
an image-specific generic; retain that exact native type and narrow with
HTMLImageElement when reading image-only properties. Do not copy native unions
or erase known data-attribute constraints with
a mapped native type. Omit general children, child replacement, polymorphism,
size/variant enums, loading controls, delays, router state and compound exports.

The native image retains `.kit-avatar` plus caller class. A noninteractive
`.kit-avatar-frame` owns the matching square and fallback presentation. Native
caller attrs/id/style/ref remain on the image. The frame owns `data-state` values
loading, loaded or error without overwriting caller data attributes. The optional
`.kit-avatar-fallback` snippet is shown during loading/error and hidden after a
successful image load. Without a fallback, retain native visible image behavior,
including alternate text on failure. Image visibility during fallback combines
with the caller's native hidden attribute, which remains effective on success.

State is instance-local and request-local. SSR starts loading and renders stable
image/fallback markup; do not preload on the server or initialize from browser
globals. Source/srcset/sizes changes reset the derived request state immediately
and key the native image; old events must not settle a replacement request.
Native load/error settle the current image before invoking its caller callback
once. Handle an already-complete image after hydration without synthesizing or
duplicating caller events. Native decoding/network selection stays with the
browser. Native cancellation does not invent a preventDefault loading guard.

For meaningful alt with an active fallback, the frame supplies one image role
and its alternate-text name; hide image and fallback snippet from redundant
accessible naming. Loaded native image keeps its original alt. Empty alt is
decorative, including fallback, with no redundant image role/name. Keep fallback
content presentational: interactive controls belong outside the avatar. Retain
caller aria-hidden on the frame and image; temporarily hide the image from
accessibility while fallback owns naming. Preserve other native caller ARIA
attributes on the actual image and document that fallback
naming uses the required alternate text. No live region, keyboard/focus API,
global ID allocator or form action is introduced.

Preserve all six source declarations on the image. Frame/fallback additions are
bounded target CSS: matching dimensions/radius, clipping, centered presentation,
and semantic muted background/text for fallback, with independently recorded
fallback surface/color customization hooks. No motion is added. S156 records
exact source CSS parity, target-only additions, metadata and source/style cohort;
S157 measures image transitions, stale/cached requests, names, decorative use,
multiple instances, refs, attrs, theme, RTL, reduced motion and SSR/hydration in
actual default/custom CLI-installed applications. Separate S181 acceptance remains
mandatory; this freeze does not certify runtime behavior.

S156 installs exactly this native two-source cohort and one stylesheet. Preserve
the native image's six source declarations unchanged; the frame shrink-wraps that
image, so application image dimensions still determine the fallback extent. Use
visibility hiding during fallback rather than display hiding: a lazy native
image must retain its viewport geometry to load. Keep explicit native hidden
effective with a scoped display rule while preserving `until-found` behavior.
The fallback uses `--kit-avatar-fallback-background` with surface-hover and
`--kit-avatar-fallback-color` with text-muted. Append only these two target hooks
to the existing272 records, retain the original avatar-radius entry and advance
the tokens metadata cohort to0.1.11. Semantic token CSS remains unchanged.
Real default/custom install checks compile/build and server-render initial
loading, named/decorative fallback, native attrs and exact installed bytes.
Browser transitions and measured presentation remain S157; neither author
verification nor implementation commits grant independent acceptance.

S157's installed browser fixtures expose a real stale-event callback defect in
the initial generation: a detached image's late native event could invoke the
current avatar's normal callback even though internal state was already guarded.
Guard both normal load/error delivery by actual current image and request identity
and advance the Avatar cohort to0.1.1. Native capture listeners remain caller
attributes; current load/error callbacks preserve exact native capture ordering.
The separate S181 reviewer must assess this repair independently.

Actual browser qualification measures source 40px square, cover-fit and default
999px radius, target fallback dimensions/colors, live8px radius/theme, caller
64×48px image dimensions, RTL and zero added motion. Delayed image success, error
and recovery, empty source, independent instances, stale load/error events,
responsive srcset selection, hiding/teardown/ref cleanup and concurrent isolated
SSR pass in real default/custom installations. A completed image source can
return directly to loaded through the browser's image cache; a fresh request
still shows loading until its own response settles.

Pinned Svelte5.57.1 SSR emits native image load/error recorder attributes
(`this.__e=event`), and client replay_events removes those attributes and dispatches
the captured event once after hydration. A browser fixture with client modules
held back proves image completion while SSR remains loading, the actual recorded
load event, retained image node, final loaded state and exactly one replayed native
capture/load callback pair. The kit completion effect adds no callback. This
framework SSR boundary is not a strict-CSP guarantee: inline event recorder
attributes exist before hydration. Preserve this fact for the later cross-catalog
CSP qualification rather than disabling SSR or claiming zero runtime requirements.
Author verification remains a candidate; independent S181 and final platform/MVP
acceptance remain open.
