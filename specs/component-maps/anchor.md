# Anchor source and native contract

Source: [component](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/anchor.rs),
[manifest](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/anchor.json)
and [stylesheet](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/styles/anchor.css).
This is a native design/behavior adaptation; no Rust identity or router API is
copied. Source attribution is retained by the package license.

## Exact public surface

Exports: Anchor, AnchorProps and AnchorTarget. Two source files,
`anchor.svelte` and `anchor.types.ts`, form the single anchor compatibility cohort
with one managed `anchor` CSS block. Tokens is the only registry dependency;
there is no npm primitive dependency or styled kit runtime. S149 freezes types
only; registration occurs after complete source/style implementation at S150.

AnchorProps derives from pinned Svelte5.57.1 SvelteHTMLElements["a"], replacing
href and children with the source-required string href and Svelte Snippet.
Ref is deliberately bindable HTMLAnchorElement/null and points to the actual
anchor, never a spread attribute. AnchorTarget maps the source target enum to
the exact native HTMLAttributeAnchorTarget type: _self/_blank/_parent/_top and
named browsing contexts. Rust SameTab maps to an omitted target, whose native
behavior remains the same tab; there is no invented enum compatibility API.

Native target, rel, download, hreflang, referrerpolicy, ping, data/aria, style,
class values and typed events are forwarded. Native download's permissive type
is inherited unchanged from Svelte; this does not introduce a generic props
dictionary. Caller class arrays/objects combine with kit-anchor. Children render
once inside the real anchor. There is no child delegation, polymorphic as,
variant, disabled/loading prop or synthesized role/button activation.

An omitted/null rel defaults to "noopener noreferrer" only when target is
_blank, matching the source. An explicit rel, including an empty string, is
preserved. Other targets leave rel omitted. This is a render-time derivation
from current props; changing target or rel must update the real attributes.

## Native behavior and accessibility

There is no kit navigation, click or keyboard handler: caller cancellation and
event targets retain native semantics. Enter activates a focused native link;
Space retains native document behavior. Target and download retain actual
browser behavior. Native attrs such as aria-disabled do not by themselves
prevent navigation; this kit invents no disabled-like navigation policy. A
surrounding form does not acquire a submit/reset control. Callers supply link
text or an explicit accessible name when using decorative children.

No generated ID, global state, browser-only identity effect or request counter
is required. SSR emits the actual href/target/rel and caller content. Hydration
must retain node/ref identity and attributes without warnings. S151 qualifies
real navigation, cancellation, target/download, refs, dynamic props and computed
CSS in actual CLI-installed default/custom consumers.

The authoring lint SvelteKit navigation rule exempts link resolution only in
`registry/ui/anchor.svelte`: this native wrapper forwards URLs the application
already owns/resolves. Calling $app/paths.resolve here would rewrite caller URLs
and require a routing import in the native component. The rule remains active
for application code and all goto/pushState/replaceState calls; compiler and
accessibility diagnostics remain errors. S152–S154 freeze and qualify explicit
application base-path handling in the optional Router Link recipe.

## Source design coupling

Preserve every source declaration under the kit component layer: kit-anchor
color, text-decoration color/line/thickness, underline offset, hover color and
focus-visible outline/offset. All nine source --kit-anchor-* hooks remain
inherited with their exact fallbacks. No source size/radius/disabled variant or
motion rule exists; native layout and theme tokens remain authoritative.
Direction must preserve link geometry and focus; reduced-motion must retain
the source's absence of animation/transition. Customization metadata records
these existing CSS hooks without changing semantic token defaults.
