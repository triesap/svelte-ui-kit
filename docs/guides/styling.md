# Styling and application themes

The application owns generated CSS, theme choices and persistence. See
[getting started](../getting-started.md) and [configuration](../reference/configuration.md)
for installation and the supported integration paths.

## Distribution

Registry CSS is authored plain CSS. The CLI installs each item's text as one managed block in `src/styles/kit.css`; it does not generate utility classes, scrape demos, compile Tailwind, or maintain a second installed per-component stylesheet. One registry source and one installed managed block are the authoritative pair.

```
/* svelte-ui-kit:start tokens */
@layer svelte-ui-kit.tokens, svelte-ui-kit.themes, svelte-ui-kit.components;
/* token declarations in their layer */
/* svelte-ui-kit:end tokens */
```

Component blocks use matching item IDs and `@layer svelte-ui-kit.components`. Define marker parsing precisely; reject duplicate/unmatched/nested markers and do not interpret marker-like strings inside CSS strings as structure. Preserve text outside blocks exactly. Order tokens before dependent components deterministically.

## Names and customization

Preserve `.kit-button`, `.kit-button--primary`, `.kit-switch-thumb`, and the semantic `--kit-*` vocabulary. Scope Bits state selectors through kit classes; avoid globally styling every raw Bits primitive. Verify each migrated selector against actual rendered DOM and state attributes. Reuse CSS by contract, not blind byte substitution.

Radius precedence is:

```
component property
  → semantic role
  → --kit-radius-default
  → reference radius
```

For Button: `--kit-button-radius` → `--kit-radius-control` → `--kit-radius-default` → `--kit-radius-md`. Preserve default shapes when optional variables are unset. Shape-critical geometry (spinner, inner circular indicators) remains circular unless its exact component property explicitly overrides it. Accept full CSS border-radius grammar; do not use restrictive `@property` registration. Invalid custom-property values follow ordinary computed-value behavior.

Retain semantic colors, text/surface/border roles, focus ring, shadows, motion/easing, disabled opacity, and per-component customization as observed in the reference assets. A theme token expresses portable design intent; a component property is a separately governed runtime CSS API. Preserve this distinction and test fallback precedence.

## Application themes

Load kit CSS, then application theme CSS, then application overrides. The application owns theme selectors, persistence, color-scheme, and any server-provided initial theme. Do not ship a hidden theme store or browser-local-storage policy. The initialization command must preserve existing application styles.

Global theme scopes belong at a document-level ancestor when body-portaled overlays must share them. Nested scopes can use a suitable custom portal host within the theme. Document clipping/stacking implications. Test both, along with theme changes while an overlay is open. Do not silently copy computed values into inline styles.

## Accessibility and motion

Keep visible focus states, proper disabled state contrast/affordance, meaningful busy/loading presentation, and inherited typography. Verify the reference switch's strong unchecked track, checked primary color, thumb color override, RTL travel, and reduced-motion behavior after mapping to Bits UI. Do not equate inherited source token values with an automatic accessibility certification; assess actual rendered foreground/background combinations and record findings.

Use reduced-motion alternatives for animated controls; verify logical properties/RTL where direction matters. Forms and overlays must remain legible under supported theme scopes. Do not introduce unapproved palettes or reset styles merely to imitate demo screenshots.

## CSP and performance limits

Plain-CSS design styling does not guarantee no inline runtime positioning styles. Audit the pinned primitive output for floating menu/overlay placement and document supported CSP behavior. No strict-CSP parity claim is allowed without a tested policy. Do not remove necessary primitive wrapper structure just to eliminate a style attribute.

The aggregate CSS contains all installed item blocks. No promise of per-route stylesheet tree shaking is made. Application-owned overrides should normally live after kit.css, minimizing future block conflicts without restricting direct editing.
