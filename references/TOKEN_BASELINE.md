# Reference token defaults and important component observations

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

These are reference values observed in the supplied source-review context, not a new palette or a verified Svelte stylesheet. They are included so the known design vocabulary is recoverable without the approved review. Source path: `crates/leptos_ui_kit_registry/registry/styles/tokens.css` at `a10fbf06334f4648f5755e05a7147414e4e5fc98`. Exact complete source/CSS/customization assets must still be checked when implementing the mapped registry; preserve applicable notices if copying source text.

| Property                         | Reference default               |
| -------------------------------- | ------------------------------- |
| --kit-color-canvas               | #f8fafc                         |
| --kit-color-surface              | #ffffff                         |
| --kit-color-surface-raised       | #ffffff                         |
| --kit-color-surface-hover        | #f3f4f6                         |
| --kit-color-surface-active       | #e5e7eb                         |
| --kit-color-text                 | #111827                         |
| --kit-color-text-secondary       | #374151                         |
| --kit-color-text-muted           | #4b5563                         |
| --kit-color-border               | #d1d5db                         |
| --kit-color-border-strong        | #9ca3af                         |
| --kit-color-primary              | #111827                         |
| --kit-color-primary-hover        | #1f2937                         |
| --kit-color-primary-foreground   | #ffffff                         |
| --kit-color-selection-indicator  | #ffffff                         |
| --kit-color-secondary            | #ffffff                         |
| --kit-color-secondary-hover      | #f3f4f6                         |
| --kit-color-secondary-foreground | #111827                         |
| --kit-color-accent               | #2563eb                         |
| --kit-color-accent-hover         | #1d4ed8                         |
| --kit-color-accent-foreground    | #ffffff                         |
| --kit-color-info                 | #0284c7                         |
| --kit-color-info-foreground      | #ffffff                         |
| --kit-color-success              | #16a34a                         |
| --kit-color-success-foreground   | #ffffff                         |
| --kit-color-warning              | #d97706                         |
| --kit-color-warning-foreground   | #111827                         |
| --kit-color-danger               | #dc2626                         |
| --kit-color-danger-hover         | #b91c1c                         |
| --kit-color-danger-foreground    | #ffffff                         |
| --kit-color-link                 | #111827                         |
| --kit-color-link-hover           | #111827                         |
| --kit-focus-ring                 | #2563eb                         |
| --kit-radius-sm                  | 0.25rem                         |
| --kit-radius-md                  | 0.375rem                        |
| --kit-radius-lg                  | 0.5rem                          |
| --kit-radius-full                | 999px                           |
| --kit-border-width               | 1px                             |
| --kit-shadow-sm                  | 0 1px 2px rgb(15 23 42 / 8%)    |
| --kit-shadow-md                  | 0 12px 28px rgb(15 23 42 / 14%) |
| --kit-shadow-lg                  | 0 20px 40px rgb(15 23 42 / 18%) |
| --kit-duration-fast              | 120ms                           |
| --kit-duration-normal            | 140ms                           |
| --kit-easing-standard            | cubic-bezier(0.2, 0, 0, 1)      |
| --kit-disabled-opacity           | 0.55                            |

The source token layer sets root color-scheme light; application theme selectors own their own color-scheme. Do not infer that all foreground/background combinations are automatically accessibility-compliant; verify actual use before claiming compliance.

#### Button observations

Source variants: primary, secondary, ghost. Sizes: sm/md/lg. Native type choices: button/submit/reset, default button. Disabled state includes loading, loading sets busy semantics, and a decorative Spinner plus loading label replaces visual content while loading. Reference CSS uses inline-flex, inherited font, focus-visible outline, size-specific height/padding/text, and component-level overrides for gap/border/radius/weight/line-height/focus/motion/disabled opacity. Preserve these source-supported contracts rather than inventing a different visual system.

Radius fallback is --kit-button-radius → --kit-radius-control → --kit-radius-default → --kit-radius-md. Primary uses primary/foreground/hover tokens. Secondary uses secondary/border/foreground/hover. Ghost uses optional ghost tokens with surface/text fallbacks. Size reference heights are 2rem/2.5rem/3rem, inline padding .75rem/1rem/1.25rem, and font sizes .875rem/.9375rem/1rem. Inspect the source before promising every component custom-property name.

#### Switch observations

Reference track geometry is 2rem by 1.125rem with .125rem padding; thumb is .875rem square. Checked thumb travel is .875rem and reverses for RTL. Unchecked track fallback uses --kit-color-border-strong; checked fallback uses --kit-color-primary; thumb background falls back to --kit-color-surface. Optional overrides include --kit-switch-track-background-unchecked, --kit-switch-track-background-checked and --kit-switch-thumb-background. The outer radius uses indicator/default/full fallbacks; the thumb stays circular unless its exact radius property overrides it. Transitions use component motion fallbacks and disappear under reduced motion.

These source values are reference observations. Actual Bits markup and computed styles must be tested; no byte-identical copied stylesheet or compiled Svelte implementation is supplied here.
