# Canonical component showcase

This editable example shares one Svelte implementation across Astro and SvelteKit.
It uses generated components, the ordinary token defaults, and optional public
recipes. White canvas and pill buttons come from generated kit CSS; page layout,
typography and the dark-theme demonstration belong to this example.

Prepare a supported application and its dependencies using [getting started](../../docs/getting-started.md)
and the [Astro guide](../../docs/guides/astro.md) or [SvelteKit setup](../../docs/getting-started.md).
Use a verified CLI package/archive at an exact source revision. In-progress
packages all report `0.1.0`; record the archive digest to distinguish builds.
Do not put the CLI in the resulting application's runtime dependencies.

## Generate the catalog

Select the application's real canonical config with `--cwd`; Astro needs its
explicit project intent. Run the ordinary CLI initialization. To install the
whole catalog, set the canonical config's `requested` array to the IDs advertised
by `assets/registry/registry.json` in the verified package, then run ordinary
`sync --dry-run --json` and `sync --json`. Desired requests are not dependency
closure. The CLI reports dependency setup; it never runs the package manager.
Review conflicts and preserve existing edits as described in the upgrade guide.

## Add the public example

The package includes this entire example directory. The package's development-only compiled helper (`dist/examples/showcase.js`) copies the five shared source/assets to a **new, absent directory**,
with exactly one explicit module-binding replacement. It records input/output
SHA-256 values. It performs no installation, network request, process execution,
route discovery or overwrite. Failed partial destinations are retained for
inspection; choose a new absent directory rather than deleting unrelated work.

Set `CLI_PACKAGE_ROOT` to the absolute root of your verified extracted/installed
CLI package and `KIT_CONFIG` to the absolute canonical config of the selected app.
From the application root, run Node 24.22.1 or the supported Node 24 version:

```sh
node --input-type=module <<'NODE'
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync, realpathSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const app = realpathSync(process.cwd());
const source = path.join(process.env.CLI_PACKAGE_ROOT, "examples/showcase");
const config = JSON.parse(readFileSync(process.env.KIT_CONFIG, "utf8"));
assert.ok(["astro", "sveltekit"].includes(config.target));
const { materializeShowcase, showcaseHost } = await import(pathToFileURL(path.join(process.env.CLI_PACKAGE_ROOT, "dist/examples/showcase.js")).href);
const destination = path.join(app, "src/lib/showcase");
mkdirSync(path.dirname(destination), { recursive: true });
const relativeModule = (from, to) => {
  const value = path.relative(from, to).split(path.sep).join("/");
  return value.startsWith(".") ? value : `./${value}`;
};
const binding = materializeShowcase(source, destination,
  relativeModule(destination, path.join(app, config.uiDir, "index.js")));
const route = path.join(app, config.target === "astro" ? "src/pages/showcase.astro" : "src/routes/showcase/+page.svelte");
mkdirSync(path.dirname(route), { recursive: true });
const host = showcaseHost(source, config.target,
  relativeModule(path.dirname(route), path.join(app, config.stylesDir, "kit.css")),
  relativeModule(path.dirname(route), path.join(destination, "Gallery.svelte")));
writeFileSync(route, host.text, { flag: "wx" });
const publicRoot = path.join(app, config.target === "astro" ? "public" : "static");
mkdirSync(publicRoot, { recursive: true });
writeFileSync(path.join(publicRoot, "showcase-avatar.svg"), readFileSync(path.join(destination, "avatar.svg")), { flag: "wx" });
console.log(JSON.stringify({ binding, host, route }, null, 2));
NODE
```

For SvelteKit, retain a single viewport declaration in `src/app.html` and add
`showcase-page` to the body's existing classes. Astro's supplied host already
contains that viewport and body class. An independently configured Svelte checker
for Astro must include `vite/client` in its TypeScript `types`, alongside Svelte
and Node, so ordinary CSS asset imports have their actual Vite declarations. Declare Vite explicitly as a development dependency
from your application's shared version catalog rather than relying on transitive
package visibility.
Keep the generated layout's kit/theme/app
CSS integration intact. Build/check with your application's normal commands and
open `/showcase`. The resulting app uses local example files and generated UI;
it does not load this helper or the CLI at runtime. The materializer also works
with an explicitly selected module binding such as `@example/ui` for a normal
installed Svelte-library package; bind the host stylesheet to that package's
ordinary stylesheet export. Never substitute a sibling checkout import.

## Customize and verify

`recipes.css` provides semantic accent/danger buttons, colored feedback, and a
moderate-radius override. Edit those application-owned recipes or layer your own
styles after kit CSS. The main gallery keeps the generated default button radius
unmodified. Component-specific, semantic-role and global radius overrides retain
their ordinary precedence.

The dark-mode controller is visible example code that sets a document-level theme
attribute and restores it on unmount. This lets body-portaled menus/dialogs inherit
colors. It is not a hidden library theme store. No CDN font or external image is
required; the avatar SVG is local. Preserve native Bits wrapper/presence structure
and actual CSP limitations. Keyboard focus, reduced motion, forms, reset and
accessible names remain behavior gates; a screenshot is not their substitute.

The main showcase presents one readable catalog. Keep multi-instance/island and
other technical qualification fixtures separately; do not remove their coverage.
