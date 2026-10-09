# Source and dependency notices

Copyright (c) 2026 Tyson Lupul. This package and its authored registry assets
are available under MIT OR Apache-2.0. Retain the included `LICENSE-MIT` and
`LICENSE-APACHE` when redistributing source or substantial portions.

Registry CSS and visual defaults are adapted from
[leptos_ui_kit](https://github.com/triesap/leptos_ui_kit/tree/a10fbf06334f4648f5755e05a7147414e4e5fc98),
revision `a10fbf06334f4648f5755e05a7147414e4e5fc98`, also copyright (c) 2026
Tyson Lupul and licensed MIT OR Apache-2.0. The original license texts are
preserved in this distribution. The adaptation does not distribute its Rust
runtime or imply Leptos framework compatibility.

Generated wrappers import application-installed Svelte and Bits UI.
Svelte and Bits UI carry their own MIT licenses;
`@internationalized/date` carries Apache-2.0. Explicit dependency installation
retains their package notices. These dependency licenses are not replaced by
this package's license. The CLI separately uses its declared Ajv, semver, Svelte
parser and TypeScript dependencies with their respective package licenses.

The locally packed CLI contains the qualified unstyled Bits dependency at
`dist/native/bits-ui-2.19.5-svelte-ui-kit.2.tgz` for explicit application-owned
extraction and installation. Its Bits source is revision
`fd10616a873a8e6e3652e31dcc88c5c2f155a9e2` from
[Bits UI](https://github.com/huntabyte/bits-ui). Its emitter source and narrow
source correction are recorded in the portable producer inputs. The archive
retains Bits `LICENSE`, emitter `EMITTER_LICENSE` and authenticated
`NATIVE_PROVENANCE.json`. Preserve those upstream MIT notices alongside the
kit's own dual-license notices.

This notice records source attribution and dependency roles. It does not grant
registry-name ownership, publication authorization or a trademark assignment.
