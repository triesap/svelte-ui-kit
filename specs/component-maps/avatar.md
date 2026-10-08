# Avatar source and target contract

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
