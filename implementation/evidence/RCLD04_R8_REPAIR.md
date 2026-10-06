# RCLD-04 R8 — semantic layout and export-cohort authority

This report covers the Pi implementation for the independent return review at
`d54f7d45f2c20288d0f22be289c6a4a8f913e89d`. It is repository-relative evidence;
raw runtime logs, exits and checksum inventories stay under the ignored
`implementation/evidence/logs/candidate4/` tree. S064–S077 remain
`committed_pending_review`; independent Codex S077 acceptance still gates S078.

## Ordered green commits

| Order | Commit    | Scope                                                                                               |
| ----- | --------- | --------------------------------------------------------------------------------------------------- |
| 1     | `b0c4047` | AST layout import/rendering authority and registry-declared export-cohort authority; d54f7d4 probes |
| 2     | `684a59e` | Same semantic probes qualified on the default and custom mappings                                   |
| 3     | `88415e5` | Unchanged (no-write) export barrels bound to their recorded baseline                                |
| 4     | `42ff6a7` | Real-consumer check/build/render control for the aliased layout and app-owned export                |

## Finding 1 — rendering proof was a whole-text regex

The validator searched the entire layout text for `{@render children` or a
`<slot>`-like pattern, so a render call inside an HTML comment validated and
applied as `layout-v1` while isolated compiled server rendering emitted no
child.

**Repair.** `parseSvelteLayout` now walks the pinned Svelte template AST. A
`RenderTag` counts only when its rendered expression resolves to a name bound to
the `children` prop, and a `SlotElement` counts as the legacy form. Comment and
string text are separate AST nodes and cannot satisfy the proof.

**Causal case.** `tests/integration/semantic-authority.test.ts` —
`[default|custom] comment-only layout rendering and imports are refused` plans a
real captured initialization and replaces the layout with real mapped imports
plus `<!-- {@render children()} -->`; `validateApplyPlan` refuses with
`PROJECTED_LAYOUT_RENDERING_MISSING` and does not apply. An unrelated render call
(`{@render other()}` with `children` unused) is refused the same way.

## Finding 2 — import proof was a whole-text regex

`parseSvelteLayout` parsed a real AST only to locate script spans, then extracted
imports with a regular expression. Stylesheet imports written inside a script
block comment validated and applied as `layout-v1` although no import executes.

**Repair.** Import specifiers now come from the actual TypeScript
`ImportDeclaration` nodes of each script body (`parseScriptImports`), and only
non-type-only imports are reported.

**Causal case.** `[default|custom] comment-only layout rendering and imports are
refused` also supplies the three approved stylesheet imports only inside a
`/* ... */` block comment and proves a typed
`PROJECTED_LAYOUT_INTEGRATION_MISSING` refusal with no application.

## Finding 3 — a dropped export cohort passed on marker presence

A real registry-backed `planAdd(button)` composed batch could have its managed
barrel target replaced by an empty-but-valid managed region; the lock still
recorded the explicit `button` item and `exports-v1` integration, and apply
published the item while `Button` was absent.

**Repair.** `composeApplyPlan` carries the registry-declared export cohort of
the planned root barrel as internal planning authority
(`ApplyPlanInput.exportAuthority`). The guarded boundary compares the effective
managed region's parsed declarations against that set by
name/kind/exact-target and refuses a dropped or retargeted declaration with
`PROJECTED_EXPORTS_COHORT_MISSING`. A batch that writes no barrel carries no new
cohort authority, so its unchanged managed region must still match the recorded
canonical baseline (`PROJECTED_EXPORTS_BASELINE_MISMATCH`). The authority is
validated strictly with typed refusals before hashing or effects and is bound
into the sealed plan digest. Public command/API scope and the lock schema are
unchanged.

**Causal cases.**
`[default|custom] a real button add control validates and applies` (positive),
`[default|custom] dropped and retargeted export cohorts are refused` (empty
region and a region retargeted to `./elsewhere.svelte`), and
`[default|custom] app-owned declarations outside the markers stay legitimate`
(a valid app export appended outside the markers still validates), and
`[default|custom] an unchanged barrel is bound to its recorded baseline` (a
no-write canonical region validates, an edited region refuses with
`PROJECTED_EXPORTS_BASELINE_MISMATCH`).

## Finding 4 — a valid aliased child render was falsely refused

A mapped layout that destructures `children: content` and executes
`{@render content()}` was refused as missing rendering, although pinned
compilation and isolated server rendering prove the child is present.

**Repair.** Child-binding discovery reads the actual instance script, including
`$props()` object destructuring with a rename and legacy `export let children`,
so the rendering proof follows the bound name rather than one spelling.

**Causal case.** `[default|custom] direct, aliased and legacy children rendering
are accepted` proves `validateApplyPlan` accepts and `applyPlan` applies the
`children: content` form, accepts the direct form, and does not report a
rendering refusal for a legacy `<slot />` layout.

## Unit-level authority

`tests/unit/svelte-layout-parse.test.ts` additionally proves that import-looking
text inside comments and strings is not an import, that rendering proof follows
the actual render node and binding (direct, aliased, legacy export and slot), and
that comment text, an unrelated render call and an undeclared name are not child
proof.

## Full production lifecycle qualification

A real resulting-consumer control in `tests/integration/planned-consumer.test.ts`
installs the planned default consumer, rewrites its layout to the destructuring
`children: content` form, appends an application-owned export outside the
managed barrel region, then runs the real `svelte-check`, production `vite
build` and served Node-adapter SSR render; the page child renders. The existing
suppressed-child control at the same boundary remains the intended-cause
counterpart.

The semantic probes ran through the production
`planInit`/`planAdd` → `composeApplyPlan` → `validateApplyPlan` → `applyPlan`
core for the default mapping and the independently rooted custom mapping
(`uiDir = app/ui`, `stylesDir = assets/styles`). The registry-backed add uses the
approved representative multi-item fixture (`tests/helpers/multi-item-fixture.ts`)
with a real manifest, template and `Button` value export.

## Cumulative qualification

The full candidate ran on `42ff6a7` (Node 24.21.0, pnpm 11.22.0, macOS arm64,
TypeScript 6.0.3). Each lane is routed through the extbuild router and its
underlying exit is captured before any echo, pipeline or tail in
`implementation/evidence/logs/candidate4/summary.tsv`.

| Lane                 | Command                                                                     | Exit | Count                                             |
| -------------------- | --------------------------------------------------------------------------- | ---- | ------------------------------------------------- |
| install              | `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | 0    | —                                                 |
| build                | `pnpm run build`                                                            | 0    | —                                                 |
| typecheck            | `pnpm run typecheck`                                                        | 0    | —                                                 |
| format               | `pnpm run format:check`                                                     | 0    | —                                                 |
| lint                 | `pnpm run lint`                                                             | 0    | —                                                 |
| unit                 | `pnpm run test:unit`                                                        | 0    | 286                                               |
| integration          | `pnpm run test:integration`                                                 | 0    | 531                                               |
| registry             | `pnpm run test:registry`                                                    | 0    | 38                                                |
| cli-bootstrap        | `pnpm run test:cli-bootstrap`                                               | 0    | 52                                                |
| harness              | `pnpm run test:harness`                                                     | 0    | 37                                                |
| components           | `pnpm run test:components`                                                  | 0    | 22 (strict declaration 17/17)                     |
| fixture-check        | `pnpm run fixture:check`                                                    | 0    | —                                                 |
| fixture-build        | `pnpm run fixture:build`                                                    | 0    | —                                                 |
| fixture              | `pnpm run test:fixture`                                                     | 0    | 27 (six default/custom check/build/render stages) |
| browser              | `pnpm run test:browser`                                                     | 0    | 23                                                |
| contracts projection | `node tools/check-contracts.mjs --generate`                                 | 0    | no tracked change                                 |
| contracts            | `pnpm run check:contracts`                                                  | 0    | 0 errors, 0 warnings                              |
| contract tests       | `pnpm run test:contracts`                                                   | 0    | 137                                               |

### Checksum-qualified workflow validation

`actionlint 1.7.12` (release archive SHA-256
`aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f`,
re-verified against the retained archive before reuse) validated
`.github/workflows/ci.yml` at exit 0 with ShellCheck 0.11.0 and no findings.
The run used an existing local binary; no host-wide install occurred.

### Unchanged read-only reference guard

The reference `leptos_ui_kit` workspace stayed clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98` (no edits). Through its own
extbuild router: `cargo fmt --all -- --check`, `cargo check --workspace
--all-targets` and `cargo test --workspace --all-targets` all exited 0, with
578 passed, 0 failed and four ignored tests. Source, toolchain, lockfile and
features are unchanged.

## Provenance reconciliation

The earlier reference-test exit sidecar was written after an echo, so it did not
record the command's own status. All statuses in this report were captured
immediately after each underlying command and before any echo/pipeline/tail. Raw
underlying outputs are retained in the ignored evidence tree; no transcript or
operator-specific metadata is published.

## Preserved exceptions and honestly unrun

- AC20 keeps its fixture-only two upstream Bits 2.19.3 TS2590 exceptions and the
  strict-17 declaration controls; this remains explicit debt.
- The four reference Rust tests
  (`installed_binaries_run_after_package_source_and_build_state_are_deleted`,
  `homepage_fixture_cli_workflow_smoke`,
  `tests::every_transaction_io_fault_avoids_partial_application_state` and
  `packaged_sources_build_with_cargo_vcs_provenance_outside_and_inside_hostile_git`)
  are ignored and are not claimed as passed.
- Windows execution, a second physical cross-device arrangement and remote CI
  remain honestly unrun in this environment; they are not described as
  hardware-blocked.

## Disposition

All four d54f7d4 findings and their positive controls are implemented and
verified on the default and custom mappings, and the cumulative lanes are green.
No whole checkpoint, R2 group or RCLD-04 acceptance is claimed here. S064–S077
stay `committed_pending_review` for independent Codex S077 review; S078 remains
gated.
