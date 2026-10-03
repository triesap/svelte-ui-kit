# RCLD-04 review-13 repair and qualification evidence

Status: implementation repairs and cumulative qualification for independent
review 13 are locally verified. S064–S077 remain `committed_pending_review`;
independent Codex acceptance is required before S078. This is Pi-authored
implementation evidence, not an acceptance decision. It supersedes the specific
review-12/review-13 partial claims contradicted below;
`RCLD04_R2_REPAIR.md` and `RCLD04_R1_REPAIR.md` remain the historical records of
the earlier passes.

Original S064–S077 definitions, R01–R34, AC01–AC22, the accepted RCLD-01..RCLD-03
records and the accepted pure planner behavior are unchanged. Counts remain 63
accepted / 14 committed_pending_review / 126 not_started and three complete /
eight unfinished sequences.

## Repaired and completed review-13 findings

### RCLD04-R2-1 — installed resolution authority carried into apply

`captureEnvironment` records the physical integrity of each resolved installed
`package.json` (nearest `node_modules`, then ancestors) alongside the selected
manifest and package-manager lockfiles, including explicit absence. The captured
evidence is carried into the guarded apply read set by `composeApplyPlan`, so a
post-planning installed metadata change is refused as `AUTHORITY_READ_CHANGED`
before any semantic write. Planning still reasons from the captured snapshot;
no live read is mixed into planning, and an out-of-root hoisted layout is
excluded rather than guessed.

### RCLD04-R2-2 — owned bootstrap, ignore integration and durability

- Absent generated ancestry is created explicitly by the guarded apply, with
  each created directory's exact device/inode recorded in the durable journal.
  An ancestor that appears after planning is refused as
  `AUTHORITY_ANCESTOR_APPEARED`, never adopted. Rollback removes only proven
  empty owned ancestry deepest-first; changed or non-empty directories are
  preserved and reported.
- The managed transient-namespace ignore entry is planned as a guarded
  operation from the captured snapshot, preserving every existing rule and
  skipped when already present; `.gitignore` is an approved guarded target and
  is bound into the sealed plan digest.
- Same-filesystem staging is proven for every target ancestor and for the owned
  state directory, including metadata-only plans, so a cross-device arrangement
  is a typed refusal before any semantic effect.
- Both affected parents are flushed for every cross-directory rename (backup,
  replacement, lock publication, recovery restore); the staged publication
  lock's parent is flushed during lock staging before the durable intent.

### RCLD04-R2-3 — complete publication witness

- The published canonical lock must be the exact physical image recorded as the
  staged publication witness (device/inode) with the recorded bytes, mode,
  transaction id, plan digest and root identity.
- A missing witness is refused rather than treated as a cleanup-tail proof.
- A surviving staged publication image must match the recorded witness identity;
  a replaced or deleted staged image fails closed without rollback or evidence
  deletion.

### RCLD04-R2-4 — complete recovery authority

- Temporary-name prefixes are no longer ownership; only the exact recorded
  temporary journal/publication names are removed. An unrelated notes file that
  resembles a temporary journal is retained and blocks cleanup.
- Journal-less publication witnesses record the validated root identity and
  plan digest and are bound to the live project root before any cleanup-tail
  mutation.
- Recovery acquires the cooperative writer lock when it runs outside the guarded
  apply boundary, reuses the held lock inside it, and refuses `WRITER_BUSY` with
  retained evidence against a live foreign writer. Killed-process tests use this
  coordinated path plus the documented operator lock resolution.
- Every recovery, ownership and ancestry refusal code has actionable manual
  guidance; no force/recover flag or PID/age takeover is introduced.

### RCLD04-R2-5 — composed lifecycle and process qualification

- A composed suite drives real registry `planAdd`/`planSync` through
  `composeApplyPlan`, `validateApplyPlan` and `applyPlan` for add, update,
  retirement, satisfied replay and an export-region conflict, comparing complete
  trees and preserving unowned content.
- A custom discovered mapping init applies through the guarded path and creates
  only the custom generated paths.
- A durability fault at every flush boundary yields a truthful outcome, and the
  pre-witness ambiguity refuses without rollback.
- The existing guarded-process tests prove real contention and SIGKILL outcomes
  through the coordinated path.

## Final qualification (routed through the extbuild launcher)

Environment: Node `v24.21.0`, pnpm `11.22.0`, macOS (Darwin 25.5) arm64.

- `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` — 0
- `pnpm run build` / `typecheck` / `format:check` / `lint` — 0 / 0 / 0 / 0
- `pnpm run test:unit` — 278 pass / 0 fail / 0 skip
- `pnpm run test:integration` — 413 pass / 0 fail / 0 skip
- `pnpm run test:registry` — 38 pass / 0 fail
- `pnpm run test:cli-bootstrap` — 52 pass / 0 fail
- `pnpm run test:harness` — 37 pass / 0 fail
- `pnpm run test:components` — 22 pass / 0 fail
- `pnpm run fixture:check` — 0 errors / 0 warnings
- `pnpm run fixture:build` — exit 0
- `pnpm run test:fixture` — 23 pass / 0 fail
- `pnpm run test:browser` — Chromium 23 pass / 0 fail
- `node tools/check-contracts.mjs --generate` — projection unchanged
- `pnpm run check:contracts` — 0 errors / 0 warnings
- `pnpm run test:contracts` — 137 pass / 0 fail
- `actionlint 1.7.12` (archive SHA-256
  `aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f`) on
  `.github/workflows/ci.yml` — exit 0, no findings
- Read-only reference `leptos_ui_kit` at clean
  `a10fbf06334f4648f5755e05a7147414e4e5fc98`: `cargo fmt --all -- --check`,
  `cargo check --workspace --all-targets`, `cargo test --workspace --all-targets`
  — 0 / 0 / 0; 578 passed, 0 failed, 4 ignored. The four ignored tests are the
  documented AC20 release debt and are not claimed passed.

Raw per-lane logs are retained under the ignored
`implementation/evidence/logs/rcl04-review13/` path. The prior review-12 compiled
probe suites were re-run: the 28 previously-safe cases are semantically
unchanged and the four review-13 cases now produce their safe outcomes.

## Disposition reconciliation

| Group                                       | Final disposition                                                                                                                                        |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R2-1 installed authority                    | implemented and verified (projected lock/config/ownership/cohort coherence enforced by the existing validated lock projection plus the guarded read set) |
| R2-2 bootstrap/ignore/filesystem/durability | implemented and verified except the unavailable cross-device execution lane (typed refusal implemented, single-volume host)                              |
| R2-3 publication proof                      | implemented and verified                                                                                                                                 |
| R2-4 recovery authority                     | implemented and verified                                                                                                                                 |
| R2-5 lifecycle/process                      | implemented and verified for the default and custom composed lifecycle, contention and interruption; Windows platform lane not executed                  |

Historical provenance: the S064–S077 checkpoint reports keep their original
implementation hashes; this file and the R1/R2 repair records reconcile them to
the final source identity. No independent acceptance is claimed for any of the
fourteen pending checkpoints, and S078 remains gated on Codex acceptance.
