# RCLD-04 effective-content authority, integration contracts and cumulative qualification

Status: Pi-authored implementation and execution evidence for the return review
of candidate `4f336322856697b9d8991741677d8453b5a4290d`. Independent Codex S077
acceptance is still required before S078; this report grants no acceptance.
S064–S077 remain `committed_pending_review` and the counts stay 63 accepted /
14 committed_pending_review / 126 not_started.

This record addresses the three production-derived cases and the two audits in
the `4f33632` return review. It links each original criterion to an executed
production case and exact outcome rather than a test filename, and continues,
without replacing, the history in `RCLD04_R2_AUTHORITY_REPORT.md`,
`RCLD04_RETURN_REVIEW.md` and `RCLD04_Q4_REPORT.md`.

## Ordered green commit

1. `98df69c` — `codegen: resolve effective projected content authority`
   - projected content is resolved once: a planned create/update result
     overrides the captured pre-state for the same logical path, a retirement
     removes the content, and ASCII case aliases or duplicate targets are typed
     refusals before any effect;
   - `layout-v1` is proven from the effective bytes with the pinned Svelte
     parser (approved kit/themes/app style integration and child rendering) and
     `exports-v1` with the pinned TypeScript parser (a valid managed export
     region), so path presence alone is no longer accepted as contract proof;
   - the sealed plan owns an isolated copy of every captured authority byte
     buffer and binds its content digest into the immutable plan digest, so a
     caller cannot mutate validation authority after sealing;
   - the supplied `4f33632` governance edits (`AGENTS.md`,
     `implementation/COMMIT_SEQUENCE.md`, `implementation/VERIFICATION.md`) are
     included.

## Effective-content authority

`src/codegen/projected-batch.ts` now derives the complete effective projected
content in one pass. Captured read evidence is keyed by ASCII-folded logical
path, then planned target results are overlaid: a create/update result supplies
the effective bytes, a retire makes the path absent, and captured bytes survive
only for a genuinely unchanged file. Two entries that alias one folded path but
are spelled differently (`PROJECTED_CONTENT_CASE_ALIAS`) or duplicate targets
(`PROJECTED_TARGET_AMBIGUOUS`) are typed refusals before coordination. Every
content-dependent check (`PROJECTED_CONFIG_*`, `PROJECTED_FOUNDATION_*`,
`PROJECTED_BLOCK_*`, layout/exports contracts, ownership presence) reads that
single map, so later read evidence can never shadow a planned target result.

`src/codegen/apply.ts` now carries only the original captured pre-state bytes
into the projected batch (not the target results) and resolves the effective
content once. The sealed plan copies every readset byte buffer and
`derivePlanDigest` binds its `contentDigest`, so `verifySealedTargets` refuses a
post-seal byte mutation with `PLAN_AUTHORITY_STALE`.

Executed cases (`tests/integration/projected-coherence.test.ts`):

- `a token-free target result cannot be shadowed by authentic captured old CSS`:
  after a valid installed initialization, a planned token-free `kit.css` update
  plus the unchanged lock and the authentic captured old `kit.css` read
  evidence validate as `PROJECTED_FOUNDATION_MISSING`, with an unchanged whole
  tree. This is exactly the `captured-old-css-shadows-new-target` review probe.
- `legitimate target/evidence overlap still resolves the planned result`: the
  same overlapping path with a token-preserving target still validates, so the
  legitimate overlap is preserved rather than blanket-refused.
- `the sealed plan isolates and binds captured authority bytes`: the sealed
  buffer is a distinct object; mutating the caller's buffer does not change the
  sealed bytes, and mutating the sealed buffer is refused with
  `PLAN_AUTHORITY_STALE`.

## Original integration/ownership contracts

`layout-v1` is validated from effective content: the layout must parse as a
Svelte component, integrate the exact mapped `kit.css`/`themes.css`/`app.css`
relative specifiers in order, and render child content (`{@render children...}`
or a legacy `<slot>`). `exports-v1` is validated as a valid managed TypeScript
module with a present managed export region. Customized rendering, unmanaged
markup, mapped import forms and the aggregate shared stylesheet are preserved;
contract proof is semantic, never byte equality with canonical upstream bytes.

Executed cases (`tests/integration/projected-coherence.test.ts`):

- `a comment-only layout replacement cannot claim layout-v1`
  (`PROJECTED_LAYOUT_INTEGRATION_MISSING`, plus rendering/order causes).
- `invalid TypeScript cannot claim exports-v1 through path presence`
  (`PROJECTED_EXPORTS_INVALID`).
- `customized mapped layout/export forms still satisfy their contracts`: a
  customized layout with the mapped imports and rendering and a customized
  barrel with a valid managed region (plus application content) validate.

The three review probes were also executed directly against the built
`dist/` and now return `validated:false` with their intended-cause codes; raw
output is retained in the ignored evidence log tree.

## Full production lifecycle qualification

`tests/integration/composed-lifecycle.test.ts` and
`tests/integration/projected-coherence.test.ts` drive the real captured
`planInit`/`planAdd`/`planSync` -> `composeApplyPlan` -> `validateApplyPlan` ->
`applyPlan` path for default and custom mappings: fresh init, add, update,
retirement, metadata-only, satisfied replay and conflict, with complete-tree
comparisons after every step. The shipped bundled registry drives default init,
`pnpm run check` and a satisfied sync. The maintained consumer fixture checks,
builds and server-renders the resulting consumers. Existing whole-tree/mode/
kind/link/ownership and unrelated-content assertions are preserved.

## Per-checkpoint links

| Checkpoint | Production source                     | Executed cases                                                                                                                        |
| ---------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| S064       | `transaction-types`                   | `transaction-state`, `transaction-safety`                                                                                             |
| S065       | `transaction-journal`                 | `transaction-journal`, `recovery-ownership`, `recovery-invalid`                                                                       |
| S066       | `write-lock`                          | `write-lock`, `transaction-processes` (live holder), captured production held-writer refusal                                          |
| S067       | `revalidate`, `authority`             | `revalidate`, `compose-authority`, `transaction-authority`, strict readset cases                                                      |
| S068       | `stage`, `durability`                 | `staging`, `durability-ordering`, `durability-flush-paths`                                                                            |
| S069       | `transaction-journal`                 | `journal-preparation`, `recovery-prepublication`                                                                                      |
| S070       | `replace`                             | `replacement`, `replacement-guards`, `recovery-prepublication`                                                                        |
| S071       | `publish-lock`, `publication-intent`  | `lock-publication`, `publication-witness`, `lock-projection`                                                                          |
| S072       | `transaction-cleanup`                 | `transaction-cleanup`, `durability-flush-paths`, namespace-removal cases                                                              |
| S073       | `recovery`                            | `recovery-prepublication`, `recovery-invalid`, captured production restart matrix                                                     |
| S074       | `recovery`                            | `recovery-published`, fresh single/scanned recovery child cases                                                                       |
| S075       | `recovery`, `owned-ancestry`          | `recovery-ownership`, `recovery-invalid`, fail-closed held-writer child cases                                                         |
| S076       | process helpers/tests                 | `transaction-processes`, `cleanup-restart-matrix` (fresh + bounded stalled child)                                                     |
| S077       | `apply`, `compose`, `projected-batch` | `guarded-composition`, `composed-lifecycle`, `projected-coherence` (effective content, layout/exports contracts), six consumer stages |

## Cumulative qualification (candidate `98df69c`)

Environment: Node `v24.21.0`, pnpm `11.22.0`, macOS arm64 (Darwin 25.5),
TypeScript 6.0.3, single-volume host. Each lane is a portable
repository-relative command run through `cargo extbuild run --`, with its raw
output and underlying exit retained under the git-ignored
`implementation/evidence/logs/rcld04-r3-20261006T0600Z/` tree. The lanes ran on
the product commit `98df69c`; the following evidence/governing-sequence commits
change no product, schema, test or workflow bytes, so the qualification applies
to the final candidate transitively.

| Lane                                                                        | Result                                      | Exit |
| --------------------------------------------------------------------------- | ------------------------------------------- | ---- |
| `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | up to date                                  | 0    |
| `pnpm run build`                                                            | built                                       | 0    |
| `pnpm run typecheck`                                                        | 0 errors across five configs                | 0    |
| `pnpm run format:check`                                                     | clean                                       | 0    |
| `pnpm run lint`                                                             | 0 warnings / 0 errors                       | 0    |
| `pnpm run test:unit`                                                        | 283 pass / 0 fail / 0 skip / 0 todo         | 0    |
| `pnpm run test:integration`                                                 | 518 pass / 0 fail / 0 skip / 0 todo         | 0    |
| `pnpm run test:registry`                                                    | 38 pass / 0 fail                            | 0    |
| `pnpm run test:cli-bootstrap`                                               | 52 pass / 0 fail                            | 0    |
| `pnpm run test:harness`                                                     | 37 pass / 0 fail                            | 0    |
| `pnpm run test:components`                                                  | 22 pass / 0 fail (strict declaration 17/17) | 0    |
| `pnpm run fixture:check`                                                    | 0 errors / 0 warnings                       | 0    |
| `pnpm run fixture:build`                                                    | built (adapter-node)                        | 0    |
| `pnpm run test:fixture`                                                     | 27 pass / 0 fail (six consumer stages)      | 0    |
| `pnpm run test:browser`                                                     | 23 pass / 0 fail                            | 0    |
| `node tools/check-contracts.mjs --generate`                                 | projection unchanged                        | 0    |
| `pnpm run check:contracts`                                                  | 0 error(s) / 0 warning(s)                   | 0    |
| `pnpm run test:contracts`                                                   | 137 pass / 0 fail                           | 0    |
| reference `cargo fmt --all -- --check`                                      | clean                                       | 0    |
| reference `cargo check --workspace --all-targets`                           | finished                                    | 0    |
| reference `cargo test --workspace --all-targets`                            | 578 passed / 0 failed / 4 ignored           | 0    |

### Fresh checksum-qualified workflow validation

`actionlint 1.7.12` (darwin/arm64 release archive SHA-256
`aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f`, extracted
binary SHA-256 `8db11704dc296f096216db4db65d86cd7f0ebfdf4c38453a1da276b137b88388`)
ran fresh over `.github/workflows/ci.yml` (SHA-256
`b76ffb6a97ae859b892f86565192d2571825e318a7b35868cd9237d932ce4549`) with
shellcheck 0.11.0 at exit 0 and no findings. This is a fresh execution on the
current workflow, not the historical result.

## Preserved exceptions and honestly unrun

- AC20's exactly two fixture-only upstream Bits 2.19.3 TS2590 declarations and
  the strict-17 declaration controls are preserved, not waived.
- The four reference Rust tests remain ignored existing debt
  (`installed_binaries_run_after_package_source_and_build_state_are_deleted`,
  `homepage_fixture_cli_workflow_smoke`,
  `tests::every_transaction_io_fault_avoids_partial_application_state`,
  `packaged_sources_build_with_cargo_vcs_provenance_outside_and_inside_hostile_git`).
- Windows and a second physical cross-device host remain unexecuted; no
  device-dependent claim is made. Remote CI was not dispatched.

## Disposition

All original S064–S077 checkpoints remain `committed_pending_review`; none is
self-accepted. S078 stays gated on independent Codex S077 acceptance of the
completed RCLD-04 candidate. Pi records implementation and evidence only.
