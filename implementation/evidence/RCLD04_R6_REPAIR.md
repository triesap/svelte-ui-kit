# RCLD-04 review-16 repair and qualification evidence

Status: Pi-authored implementation and verification evidence for independent
review 16. S064–S077 remain `committed_pending_review`; independent Codex
acceptance of the complete boundary is required before S078. This is not an
acceptance decision. It supersedes the review-15 disposition in
`RCLD04_R5_REPAIR.md` (kept as history) and builds on `RCLD04_R4_REPAIR.md`,
`RCLD04_R3_REPAIR.md`, `RCLD04_R2_REPAIR.md` and `RCLD04_R1_REPAIR.md`.

Original S064–S077 definitions, R01–R34, AC01–AC22, the accepted RCLD-01..RCLD-03
records, the accepted pure-planner behavior and the live RCLD-04 authorization
tuple are unchanged. Counts remain 63 accepted / 14 committed_pending_review /
126 not_started and three complete / eight unfinished sequences.

The review-16 decision is preserved: ten independently reproduced
original-criteria defects were examples, not the batch scope. The repair work
below addresses the shared production authority, durability, recovery and
publication protocols those examples exposed, and adds the required factual
lifecycle/consumer matrix. It does not weaken any original criterion.

## Review-16 repairs (ordered commits)

1. `5f44bb3` — `codegen: complete RCLD-04 review-16 coordination and durability repairs`
   - Coordination authority binds recovery to the exact acquired physical owner
     record: `acquireWriterLock` records the owner file's device/inode and
     `verifyHeldWriterLock` refuses a byte-identical record substituted at a new
     physical identity (`WRITER_LOCK_CONTRADICTED`) before any recovery effect.
   - A failed release never truncates newly appearing unrelated owner evidence:
     `restoreOwnerRecord` only restores the exact validated record when the owner
     path is absent or still holds that exact record, and otherwise retains the
     contradictory bytes and reports the conflict.
   - Partial initial coordination-directory creation is accounted for:
     `ensureStateDirectoryChain` returns the already-created identity list with a
     typed issue and the caller removes exactly the owned empty ancestry before
     the transient namespace is created.
   - Planned recovery validates every recorded created-directory physical
     identity before any removal (`RECOVERY_CREATED_DIR_IDENTITY`), and the
     planned phase now propagates ancestry identity, removal and flush issues as
     a refusal that retains the journal (`RECOVERY_ANCESTRY_FLUSH_FAILED`) rather
     than reporting clean.
   - The applied/prepared rollback restores operations as typed partial outcomes:
     an actual backup-restore rename or post-rename flush failure returns
     `RECOVERY_RESTORE_FAILED` and retains the journal instead of throwing.
   - Recovery cleanup flushes the transaction directory, the transaction
     namespace and the transient parents durably and reports flush faults.
   - `validateApplyPlan` strictly validates the exact nested target and lock
     preimage shape (`{path, kind, digest, mode}`, no unknown/missing keys,
     kind-consistent digest/mode) so a malformed nested value is a typed
     `PLAN_PREIMAGE_MISMATCH` before digesting/sealing rather than a
     serialization exception.
   - `validateReadset` rejects unknown keys, duplicate ancestor/file/installed
     entries and kind-inconsistent nested authority.
   - `parseKitLock` validates stylesheet and exports integrations against their
     mapped roles (`LOCK_STYLESHEET_CONTEXT`, `LOCK_EXPORTS_CONTEXT`) in addition
     to the existing layout mapping, and `validateApplyPlan` passes the derived
     approved paths.
   - The three Codex governance amendments (`AGENTS.md`,
     `implementation/COMMIT_SEQUENCE.md`, `implementation/VERIFICATION.md`) were
     included in this first green target commit.
2. `9657354` — `test: qualify the RCLD-04 lifecycle matrix and generated consumer`
   - `tests/integration/review16-matrix.test.ts` drives default, custom,
     satisfied, metadata-only and conflict dispositions through the production
     `planInit`/`composeApplyPlan`/`validateApplyPlan`/`applyPlan` core using a
     captured original snapshot, and compares the complete generated tree for
     exact bytes, modes, kinds and derived layout/stylesheet/exports ownership.
   - `tests/smoke/lifecycle-consumer.test.mjs` initializes an owned SvelteKit
     consumer copy through the built `dist/` core, then runs `svelte-check`, a
     production `vite build` and an actual server-rendered request from the
     built Node-adapter handler. It is wired into `pnpm run test:fixture`.
3. `38bc34d` — `test: prove guarded cross-device refusal for normal and metadata-only plans`
   - Injects the same foreign-device observation the guarded walk performs into
     the real `applyPlan` path (normal and metadata-only plans), proving a typed
     `STAGE_CROSS_DEVICE` refusal with no target/lock bytes changed and no
     transaction directory created. This is deterministic on a single-volume
     host and does not bypass coordination.
4. `c3771e2` — `docs: record RCLD-04 review-16 repairs and the lifecycle matrix evidence`
   - Records the ordered repair commits, the factual lifecycle/consumer matrix,
     the final qualification table and the honest unrun lanes, and reconciles
     the overbroad review-15 complete/no-gap wording.
5. `594d1d3` — `codegen: flush the apply-layer transient cleanup and removal parents`
   - Flushes the transaction namespace after removing an abandoned owned
     transaction directory and flushes the transient parents after the guarded
     apply removes the empty transactions/transient directories, completing the
     original durability protocol across the apply-layer cleanup paths.

## RCLD04-R2 dispositions after review 16

| Group                                       | State                                                                                                                                                                                                                                                                    | Evidence and remaining                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R2-1 authority                              | Immutable captured readset and strict nested authority; mapped stylesheet/export/layout roles validated before publication; unsafe/absence distinctions preserved without recapture.                                                                                     | `review16-repairs` strict preimage/readset/integration cases, `review15-repairs` capture/absence/unsafe cases, `authority`/`compose-authority`/`revalidate` suites. No deterministic gap identified; a genuinely different physical hoisting platform remains an environment lane.                                                  |
| R2-2 bootstrap/ignore/filesystem/durability | Partial initial creation accounted and rolled back; planned recovery propagates identity/removal/flush faults; recovery and apply cleanup/rollback paths flush parents and report faults; deterministic guarded cross-device refusal for normal and metadata-only plans. | `review16-repairs` cases 2–5, 8, 11–12; `owned-ancestry`, `durability-flush-paths`, `durability-ordering`, `same-filesystem`, `write-lock` suites. A real second physical device and Windows remain unrun platform lanes.                                                                                                           |
| R2-3 publication                            | Physical publication/witness/root/plan/transaction/digest binding and ambiguity refusal preserved; crash/intent/rename/record/cleanup matrix unchanged and green.                                                                                                        | `publication-witness` (same-byte pre-rename, deleted canonical, mode edit, post-publication edit, equal-byte different inode, missing witness, replaced/deleted staged, symlinked witness), `recovery-published`, `lock-publication`, `recovery-prepublication`. No new deterministic gap identified.                               |
| R2-4 recovery                               | Authentic acquired physical owner identity re-proved before effects; failed release retains unrelated owner evidence; exported single recovery returns typed restore/cleanup/ancestry/release outcomes retaining the journal.                                            | `review16-repairs` cases 1, 4, 8, 9, 12; `recovery-ownership`, `recovery-invalid`, `write-lock`, `transaction-processes`. No force/recover flag, PID/age takeover or acquisition bypass was added.                                                                                                                                  |
| R2-5 lifecycle/consumer                     | Full default/custom init, satisfied, metadata-only, conflict and cohort matrix through the production core plus a lifecycle-generated consumer that checks, builds and server-renders.                                                                                   | `review16-matrix` (5), `multi-item-lifecycle` (2, add/sync/update/retirement with dependencies, hybrid sources, multiple CSS blocks and export cohorts), `lifecycle-consumer` (check/build/render), `transaction-processes` (guarded restart). A populated shipped catalog and the CLI S081 commands remain later dependency gates. |

## Factual lifecycle/consumer matrix

Every row below is an executed production path with repository-owned
assertions; prose does not fill a cell.

| Scenario                                | Production path                                                          | Assertions                                                                                                                                   | Where                                       |
| --------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Default init                            | `planInit` → `composeApplyPlan` → `validateApplyPlan` → `applyPlan`      | exact planned bytes, 0o644 modes, file kinds, lock ownership, layout/stylesheet/exports roles, unrelated `package.json` byte-identical       | `review16-matrix`                           |
| Custom init (`app/ui`, `assets/styles`) | same                                                                     | generated under custom roots; mapped integration paths                                                                                       | `review16-matrix`                           |
| Satisfied (no change)                   | `planInit`                                                               | empty write set and byte-identical tree; no transaction opened                                                                               | `review16-matrix`                           |
| Metadata-only                           | `planInit` → guarded apply                                               | only `kit.lock.json` written; applied                                                                                                        | `review16-matrix`                           |
| Conflict                                | `planInit`                                                               | non-regular managed target refused (`INIT_TARGET_UNSAFE`), no writes                                                                         | `review16-matrix`                           |
| Add with dependency                     | `planAdd` → guarded apply                                                | explicit `card` + transitive `button`, hybrid Svelte/TypeScript files, three CSS blocks, value/type export cohorts, unrelated page preserved | `multi-item-lifecycle`                      |
| Update one owner                        | `planSync` → guarded apply                                               | card bytes changed; retained `button` bytes unchanged                                                                                        | `multi-item-lifecycle`                      |
| Retire one owner                        | `planSync` → guarded apply                                               | retired outputs removed; retained owner and its CSS block survive                                                                            | `multi-item-lifecycle`                      |
| Consumer check/build/render             | built `dist/` core → real `svelte-check`, `vite build`, Node-adapter SSR | 0 errors/0 warnings; production build; server-rendered heading and request-local value                                                       | `lifecycle-consumer`                        |
| Guarded process restart                 | real SIGKILL worker → `applyPlan`                                        | automatic `WRITER_BUSY` refusal, documented operator lock clearance, coordinated recovery + restart                                          | `review15-repairs`, `transaction-processes` |

## Final candidate qualification

Environment: Node `v24.21.0`, pnpm `11.22.0`, macOS arm64, single-volume host.
Every lane is a portable repository command; raw logs and underlying exits are
retained as ignored local runtime evidence.

| Lane                                                                                 | Result                                                         | Exit |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ---- |
| `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict`          | already up to date                                             | 0    |
| `pnpm run build`                                                                     | built                                                          | 0    |
| `pnpm run typecheck`                                                                 | 0 errors                                                       | 0    |
| `pnpm run format:check`                                                              | clean                                                          | 0    |
| `pnpm run lint`                                                                      | 0 warnings/errors                                              | 0    |
| `pnpm run test:unit`                                                                 | 283 pass / 0 fail / 0 skip                                     | 0    |
| `pnpm run test:integration`                                                          | 457 pass / 0 fail / 0 skip                                     | 0    |
| `pnpm run test:registry`                                                             | 38 pass / 0 fail                                               | 0    |
| `pnpm run test:cli-bootstrap`                                                        | 52 pass / 0 fail                                               | 0    |
| `pnpm run test:harness`                                                              | 37 pass / 0 fail                                               | 0    |
| `pnpm run test:components`                                                           | 22 pass / 0 fail (5 compatibility + 17 strict declaration)     | 0    |
| `pnpm run fixture:check`                                                             | 0 errors / 0 warnings                                          | 0    |
| `pnpm run fixture:build`                                                             | built                                                          | 0    |
| `pnpm run test:fixture`                                                              | 24 pass / 0 fail (incl. generated-consumer check/build/render) | 0    |
| `pnpm run test:browser`                                                              | Chromium 23 passed / 0 failed                                  | 0    |
| `node tools/check-contracts.mjs --generate`                                          | projection unchanged                                           | 0    |
| `pnpm run check:contracts`                                                           | 0 errors / 0 warnings                                          | 0    |
| `pnpm run test:contracts`                                                            | 137 pass / 0 fail / 0 skip                                     | 0    |
| `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.12 .github/workflows/ci.yml` | no findings                                                    | 0    |
| reference `leptos_ui_kit` `cargo fmt --all -- --check`                               | clean                                                          | 0    |
| reference `cargo check --workspace --all-targets`                                    | clean                                                          | 0    |
| reference `cargo test --workspace --all-targets`                                     | pass (4 ignored baseline tests)                                | 0    |

The reference `leptos_ui_kit` stayed at clean
`a10fbf06334f4648f5755e05a7147414e4e5fc98` with no edits.

## Reconciliation of prior complete/no-gap claims

The review-15 `RCLD04_R5_REPAIR.md` wording that R2-2 and R2-4 had "no
deterministic gap identified" was overbroad: the review-16 probes showed that
acquired-transaction identity alone did not prove physical owner authority, that
planned recovery discarded ancestry identity/flush faults, that recovery cleanup
omitted required parent flushes, that initial coordination creation leaked
partially created ancestry, and that an exported restore failure escaped as a raw
exception. Those claims are corrected here; the prior record is retained as
history. The review-15 R2-5 statement that a populated shipped catalog and the
CLI S081 commands are later dependency gates still stands.

## Honestly unrun and open

- A second physical device (real cross-device) and Windows are not executed; the
  cross-device refusal is qualified deterministically by injecting the walk's own
  device observation into the real guarded apply path.
- AC20's fixture-only two upstream Bits TS2590 exception and the strict-17
  controls are preserved unchanged; the four ignored reference `leptos_ui_kit`
  Rust tests remain a separate baseline limitation.
- The shipped registry catalog is empty by original scope; add/sync/update/
  retirement are qualified through representative multi-item fixtures conforming
  to the approved manifest/template/component contracts, not a populated catalog.
- The CLI S081 commands and catalog S096/S097 remain at their original later
  gates and were not implemented early.

## Disposition

All original S064–S077 checkpoints remain `committed_pending_review`; none is
self-accepted. S078 stays gated on independent Codex acceptance of the completed
RCLD-04 boundary. Historical provenance in the earlier repair records is kept.
