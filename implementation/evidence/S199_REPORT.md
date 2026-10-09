Coordinator acceptance record: the separate final decision is anchored at
`f756d227b6a1dce1396183dec4db138a256e16bf` in [RCLD-11 qualification](RCLD-11_QUALIFICATION.md).
The original implementation/review narrative retains its pre-transition states;
current qualification supersedes historical strict debt and pending-review notes.
This bookkeeping records the separate decision, not implementation self-acceptance.

# S199 implementation report — app-owned composition examples

Author: Codex. Implemented and independently accepted. The narrative below
preserves original candidate-stage provenance and failed attempts.
Implementation commit: `a097624bf8ddba93fa824b9543054e49588f6bb1`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S199","kind":"report","commit":"f756d227b6a1dce1396183dec4db138a256e16bf","disposition":"implemented"}
-->

The documented application page composes existing Collapsible, Alert/Status,
Anchor/RouterLink/Button, native form controls and Dialog exports. Disclosures
have independent app-owned state. The form owns validation, actual FormData
submission and feedback content. Links have native destinations. The app owns
the portal host and live theme properties; Bits owns modal interaction and focus.
No notification queue, accordion coordinator, data grid or registry API was added.

The maintained consumer has no installed UI catalog, so the template lives at
`tests/fixtures/qualification/composition-examples/+page.svelte`, beside the
existing isolated composition pages. Its owning builder substitutes both local
flat-export imports against actual CLI-installed default/custom mappings and
authenticates generated source against registry bytes and lock baselines.
Each consumer runs real check/build before its production handler is hosted.
Generated source, example page and production hashes are retained in browser
artifacts. This placement implements the original app-owned example scope
without placing unresolved UI imports in the maintained empty consumer.

The browser lane passes 6/6 with zero skips or retries: independent Enter/Space
disclosures, keyboard native links, real form submission and checkbox values,
assertive error versus polite status feedback, nested-host portal placement,
live computed dialog theme changes, Escape dismissal and focus restoration.
Unexpected console/page/hydration failures remain enforced by the shared issue
collector. The first run passed four cases and failed both theme cases because
the example incorrectly overrode `--kit-color-surface` while Dialog consumes
`--kit-color-surface-raised`. The app-owned example was corrected; no product
CSS or assertion expectation changed. The failed log/artifacts are retained.

```sh
pnpm run build
pnpm exec playwright test --config playwright.config.ts tests/browser/composition-examples.spec.ts
pnpm run fixture:check
pnpm run fixture:build
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run check:contracts
```

Root build, typecheck, lint, full formatting and contract validation all exit 0.
The maintained fixture check reports zero errors/warnings and its production
build exits 0. Final diff health is clean.
Logs beneath `implementation/evidence/logs` are `s199-build.log`,
`s199-browser.log` (4 passes/2 theme failures), `s199-browser-qualified.log`
(6/6), `s199-browser{,-qualified}-artifacts`, owning builder logs in
`generated-consumer`, and `s199-{fixture-check,fixture-build,typecheck,lint,format,contracts}.log`.
The ordinary fixture and generated consumers retain the qualified temporary
library-check setting; raw strict-declaration debt is not resolved or accepted.
Cargo guards are N/A. S200 follows the verified green candidate commit.
