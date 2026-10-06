# RCLD-04 R9 — independent export/cohort authority and reachable child proof

This report covers the Pi implementation for the independent return review at
`6f2d877c5a78f2c05702fcbca7ae938cb93b87e6`. It is repository-relative evidence;
raw runtime logs, exits and checksum inventories stay under the ignored
`implementation/evidence/logs/review17-20261006/` tree. S064–S077 remain
`committed_pending_review`; independent Codex S077 acceptance still gates S078.

## Ordered green commit

| Order | Commit    | Scope                                                                                                                                          |
| ----- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `cecdab9` | Independent registry-declared export authority, full source/owner binding, reachable scoped child rendering and customized-region preservation |

## Finding 1 — candidate output certified its own export cohort

A real `planAdd(button)` barrel emptied **before** composition caused
`composeApplyPlan` to derive `exportAuthority.declarations=[]` from those same
result bytes, so validation and apply published the explicit item, file and
`exports-v1` integration with `Button` absent.

**Repair.** The export authority is now resolved by the planner from the
validated registry closure (owner, source binding, public name, runtime target
and value/type role) and travels on the canonical lock publication
(`PlanWrite.exportAuthority`). Composition consumes that independent authority
for every managed `exports-v1` integration the projected lock declares, whether
or not the batch writes the barrel. A planned barrel write must carry every
authority relationship or composition refuses with
`COMPOSE_EXPORTS_AUTHORITY_WRITE_MISMATCH`; a missing, stale, malformed,
duplicated or unexpected authority entry is a typed refusal. Expectations are
never parsed from the candidate barrel.

**Causal case.** `tests/integration/review17-authority.test.ts` —
`[default|custom] an emptied barrel before composition cannot certify an empty
cohort` proves the untampered planner write set composes/validates and that
emptying the barrel before composition refuses at the composition boundary.

## Finding 2 — the source binding was discarded

After composition, replacing `export { default as Button }` with
`export { missing as Button }` validated and applied because the declaration key
ignored the source binding.

**Repair.** `ExportDeclaration` now carries `source`, `parseGeneratedDeclarations`
reads `propertyName ?? name`, and the authority comparison key includes the
source binding, public name, value/type role and runtime target
(`authoritativeExportKey`). Valid aliases and mapped runtime specifiers are
preserved.

**Causal cases.** `tests/integration/semantic-authority.test.ts` —
`[default|custom] a rebound source binding after composition is refused` and the
rebound control in `[default|custom] an unchanged barrel is proven against
independent authority` prove a typed `PROJECTED_EXPORTS_COHORT_MISSING` refusal
while the authentic cohort still validates.

## Finding 3 — dormant snippet rendering was counted

A `{@render children()}` inside a declared-but-never-invoked snippet counted as
child rendering, so validation/apply published `layout-v1` while pinned
isolated server rendering emitted no child.

**Repair.** `parseSvelteLayout` now performs a binding- and reachability-aware
walk of the pinned Svelte template AST. A snippet body is deferred content: it is
not proof unless a reachable `{@render snippet()}` invokes it, at which point the
walker recurses with the snippet parameters and block bindings shadowing the
`children` prop. Direct/aliased children, conditionals, `each`/`await` branches,
actually invoked wrappers and legacy `<slot>` remain accepted; unsupported or
ambiguous proof is conservatively not-rendered (a typed refusal).

**Causal cases.** `tests/unit/svelte-layout-parse.test.ts` adds the uncalled
snippet (false), invoked/nested wrappers (true), snippet-parameter/each-context/
snippet-name shadowing (false) and conditional/each rendering (true) cases.
`tests/integration/semantic-authority.test.ts` —
`[default|custom] reachable, invoked and shadowed snippet rendering is proven
causally` proves the integration refusal and the positive wrapper control.

## Finding 4 — customized unchanged content needed relationship authority

An indentation-only managed barrel with the complete export surface was refused
by a no-authority baseline fallback in metadata-only application, and production
sync reported a coupled canonical-regeneration conflict.

**Repair.** The recorded baseline is no longer used as semantic authority.
`planAdd` preserves a customized owned region when every incoming registry
declaration is already present by full relationship (no write, no conflict,
truthful prior baseline kept), and refuses only a genuine public-surface change.
`validateProjectedLock` proves every managed `exports-v1` region against the
independent authority (unchanged, satisfied and metadata-only included), so a
customized-but-equivalent region is accepted while a dropped or rebound
relationship is refused. No auto-format, merge, baseline rebasing or blanket
acceptance of arbitrary edits is introduced.

**Causal case.** `tests/integration/review17-authority.test.ts` —
`[default|custom] a customized-but-equivalent barrel is preserved by sync and
metadata-only apply` installs a real add, indents the managed region, proves
`planSync` is executable with no barrel regeneration, and proves a metadata-only
batch carrying the same authority preserves the raw customized bytes exactly.

## Preserved behavior

- Real AST import parsing, comment/unrelated-render refusals, valid aliased
  children, post-composition dropped/retargeted export checks, isolated/bound
  bytes and the real customized-layout/app-owned-export consumer controls are
  unchanged.
- Public command/flag surface, registry schema modes, dependencies, component
  APIs and the threat model are unchanged; the authority is internal plan
  evidence validated strictly before hashing, sealing or effects and bound into
  the sealed plan digest.
- Conservative initialization ownership and all original conflict rules are
  preserved.

## Cumulative qualification

The full candidate ran on `cecdab9` (Node 24.21.0, pnpm 11.22.0, macOS arm64,
TypeScript 6.0.3). Each lane is routed through the extbuild router and its
underlying exit is captured before any echo, pipeline or tail in
`implementation/evidence/logs/review17-20261006/exits.tsv`.

| Lane                 | Command                                                                     | Exit | Count                                             |
| -------------------- | --------------------------------------------------------------------------- | ---- | ------------------------------------------------- |
| install              | `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | 0    | —                                                 |
| build                | `pnpm run build`                                                            | 0    | —                                                 |
| typecheck            | `pnpm run typecheck`                                                        | 0    | —                                                 |
| format               | `pnpm run format:check`                                                     | 0    | —                                                 |
| lint                 | `pnpm run lint`                                                             | 0    | —                                                 |
| unit                 | `pnpm run test:unit`                                                        | 0    | 290                                               |
| integration          | `pnpm run test:integration`                                                 | 0    | 540                                               |
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
`aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f`; binary
SHA-256 `8db11704dc296f096216db4db65d86cd7f0ebfdf4c38453a1da276b137b88388`)
validated `.github/workflows/ci.yml` (SHA-256
`b76ffb6a97ae859b892f86565192d2571825e318a7b35868cd9237d932ce4549`) at exit 0
with ShellCheck 0.11.0 and no findings. The existing local binary was
re-verified against the recorded checksum before reuse; no host-wide install
occurred.

### Unchanged read-only reference guard

The reference `leptos_ui_kit` workspace stayed clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98` (no edits). Through its own extbuild
router: `cargo fmt --all -- --check`, `cargo check --workspace --all-targets`
and `cargo test --workspace --all-targets` all exited 0, with 578 passed, 0
failed and four ignored tests. Source, toolchain, lockfile and features are
unchanged.

## Preserved exceptions and honestly unrun

- AC20 keeps its two fixture-only upstream Bits 2.19.3 TS2590 exceptions and the
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

All four `6f2d877` findings and their positive controls are implemented and
verified on the default and custom mappings, and the cumulative lanes are green.
No whole checkpoint, R2 group or RCLD-04 acceptance is claimed here. S064–S077
stay `committed_pending_review` for independent Codex S077 review; S078 remains
gated.
