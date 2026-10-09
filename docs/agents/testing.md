# Verification and test ownership

Scope: select credible checks for changed contracts, preserve causal controls and
report actual execution. [package.json](../../package.json), the CI workflow and
`tools/check-ci.mjs` own the command surface/pins, not a second evidence database.
Read the owning test before changing a contract; do not waive requirements to
accommodate tool failures or mistake configured remote jobs for executed evidence.

## Bootstrap and authoring

From the repository root with Node 24.21.0/pnpm 11.22.0:

```sh
node tools/prepare-native-dependency.mjs --fixture
pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict
pnpm run typecheck
pnpm run build
pnpm run format:check
pnpm run lint
pnpm run check:ci
pnpm run test:ci
pnpm run check:docs
pnpm run test:docs
```

Preparation comes before installation because frozen dependencies refer to the
authentic local archive. Source fetching/bootstrap can need network access. Do
not suppress strict diagnostics, patch installed packages, loosen peer/engine
checks or change pins to pass. Keep generated output/logs out of contributions.
This product is TypeScript-only; Cargo is inapplicable unless a separately
authorized change affects an actual Rust workspace.

## Typed runner and focused checks

`node tools/run-unit-tests.mjs --suite <unit|integration|components|registry|package>`
accepts repository-relative `*.test.ts` paths under the selected suite. With no
operands it discovers all entries deterministically, including hidden names.
Absolute/traversing/symlinked roots, operands or output ancestry fail closed rather
than silently running the full suite. The direct invocation needs no literal `--`.

The runner compiles every discovered suite entry through an ephemeral configuration
extending the tracked suite tsconfig, even when executing selected files. Selection
does not omit ordinary type inputs. A failing test event, including TODO failures,
fails the command; a selected file with no passing test fails. Outputs are isolated
under `.unit-test-build/<suite>` and cleanup owns only that subdirectory.
Standalone typecheck and runner compilation cover different discovery boundaries.

Build the CLI first when a focused integration/registry/package test invokes it:

```sh
pnpm run build
node tools/run-unit-tests.mjs --suite integration tests/integration/documented-workflow.test.ts tests/integration/docs-upgrade.test.ts tests/integration/docs-recovery.test.ts
```

Those tests read the canonical marked guides and preserve actual command counts,
default/custom layouts, packed-host independence, customization/conflict/retirement,
real crashes, corrupt-state refusal and post-crash edits. A focused pass does not
replace full acceptance or prove arbitrary application behavior.

## Cumulative acceptance lanes

| Lane                | Required command / purpose                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Foundation          | test:unit, test:harness and test:cli-bootstrap; grammar/protocol/observations/planners plus runner/bootstrap refusal controls.                                                                               |
| Integration         | test:integration; full real CLI ownership, structural integration, conflicts, process recovery and zero-write assertions.                                                                                    |
| Components          | test:components; actual authored/native types and causal invalid inputs, not generic prop dictionaries.                                                                                                      |
| Registry            | test:registry; authentic assets/exports/targets/cohorts, source catalog and exact tokens/CSS fallbacks.                                                                                                      |
| Package             | test:package; actual tarball inventory/metadata/local-link closure, separate installed host and unavailable authoring source.                                                                                |
| Maintained consumer | fixture:check and test:fixture; raw strict zero errors/warnings, production build, SSR and guarded owned servers.                                                                                            |
| Browser             | pnpm exec playwright install chromium, then test:browser; full configured Chromium suite, one worker, zero retries, strict page/console/hydration/teardown collection.                                       |
| Native producer     | node --test tools/build-native-dependency.test.mjs and native bootstrap controls; authentic repeat builds, unpatched causal control, notices/inventory, strict/public bindings and resulting consumer build. |
| Filesystem          | Execute the actual check-ci FILESYSTEM_TESTS matrix on available supported macOS/Linux under ordinary unprivileged conditions, including permission-denial proof.                                            |

Use `pnpm run <script>` for the named scripts. Preserve every configured acceptance
job, immutable action pins, read-only permissions, archive-before-frozen-install
bootstrap, nonoverlapping output ownership, failure policy and bounded durations.
The contracts job validates current documentation; completed ledger/history
checks are retired. Documentation validation is read-only and requires no Git
history or network. It rejects bad links/anchors/examples/catalog/source pointers
with causal negative fixtures that must actually fail. Packing validates
links only inside the extracted real archive, never through authoring fallback.

Never overlap shared fixture/compiler/native/package writers. Browser tests own
production servers and enforce stop-before-delete lifecycle; an owned cleanup
mutation must reproduce faults. Match selected tests to the change and broaden
when a failure or unresolved boundary requires it. Final release qualification
requires cumulative lanes and actual clean-checkout/installed-package adoption;
report unsupported/unavailable platform or tool gates explicitly.

## Required behavioral proof

Keep complete byte/mode/link/hidden-state snapshots for read-only/refusal paths;
every base/local/incoming equality and untracked/missing policy; whole-batch cohort
refusal and truthful baselines; unmanaged layout/export/CSS preservation; direct
native controls for forms/events/snippets/refs/cancellation and lifecycle cleanup;
actual SSR/hydration identities/relationships; computed tokens/radius geometry,
RTL/reduced motion, portal themes/clipping and attributed CSP observations.

Transactions require real interruption at each durable phase, concurrent writers,
preimage changes, publication witnesses, corrupt/foreign journals, post-crash edits
and safe cleanup/refusal. No finally-only recovery proof or byte-equal lock shortcut.
Keep authentic native/archive/distribution mismatch and malformed checker-output
controls. Valid inventories/commit counts and author declarations are not independent
acceptance. Use a separate reviewer whenever the authorized task requires that gate.
Report exact revision, commands/exits, failed attempts, changes, risks and unrun
limits; do not relabel historical tests as freshly executed.
