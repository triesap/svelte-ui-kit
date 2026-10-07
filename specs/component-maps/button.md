# Button source and native contract

Source: [component](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/button.rs)
and [stylesheet](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/styles/button.css).
The package MIT notice retains source attribution; this is a design/behavior
adaptation, with native target types rather than a Rust ABI or identity shim.

Public exports: Button, ButtonProps, ButtonVariant and ButtonSize. Native
attributes derive from pinned Svelte 5.57.1 SvelteHTMLElements["button"].
ButtonVariant is primary/secondary/ghost (default primary); ButtonSize is
sm/md/lg (default md). Default type="button"; explicit submit/reset retain
native form behavior. Name/value/form/disabled, data/aria, style, class arrays
and typed event handlers remain native. No href, as, link polymorphism,
delegated child or generic attribute dictionary is supported.

Children is a required Svelte Snippet, rendered inside kit-button-content.
Ref is an optional bindable HTMLButtonElement/null, forwarded to the actual
button through bind:this; it is not silently spread as an attribute. There is
no internal click handler to merge: native onclick is forwarded once and native
disabled prevents activation. Other native events retain their typed target.
Caller classes are combined with kit-button and exact variant/size classes.

Loading defaults false, loadingLabel defaults Loading. Effective disabled is
disabled || loading. The wrapper owns aria-busy=true only during loading;
caller aria-busy is omitted from ButtonProps to prevent contradictory state.
Visible children are hidden while loading, a kit-button-loading-label replaces
them, and a direct sibling Spinner in decorative mode supplies a hidden mark.
No redundant Spinner status is announced. This retains the source content node
and snippet lifecycle rather than discarding caller children while busy.

The component/source/types/style/export cohort is button. Registry dependencies
are spinner and tokens; sibling imports never traverse the generated root
barrel. No npm primitive or styled kit runtime dependency is required.
Style selectors remain kit-button, kit-button-spinner, kit-button-content,
kit-button-loading-label, kit-button--{variant}, kit-button--{size}, :disabled
and :focus-visible. The entire source Button stylesheet is adapted to the
svelte-ui-kit.components layer and matching managed block at S100, preserving
all source variables/fallbacks and the documented control-radius cascade.
S101 independently exercises native activation, forms, disabled/loading,
accessible label changes, ref and children forwarding, and CSS customization.
