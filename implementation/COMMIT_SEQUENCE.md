# svelte-ui-kit v1 — governing RCLD sequence

Status: approved plan; S001 independently accepted, awaiting commit. Updated 2026-09-28.

This document is the single governing rolling commit loop document for all eleven RCLD sequences below. It carries the complete ordered S001–S203 execution plan and the approved contract snapshots needed to implement it in this repository. Creating this document is planning setup, not completion of S001, S002, or any product checkpoint.

## Authority and completion boundary

The owner approved the complete review recommendations and creation of the full execution plan on 2026-09-28. Implement the specified source-first TypeScript/SvelteKit/Bits UI generator and catalog adaptation in this standalone public repository. The product, package and executable are named `svelte-ui-kit`; the spec identifier is `svelte_ui_kit_v1`.

Durable product contracts govern implementation; the ordered checkpoints implement those contracts. The approved review dispositions below resolve target discovery and source interpretation without removing requirements or changing checkpoint order. New product scope requires a contract amendment; proven obsolete or unsafe plan scope requires a recorded deviation before action.

Completion includes the generator, original catalog adaptation, distinct Alert Dialog, generated-consumer verification, package-shaped artifacts, documentation, and a precise extension specification gate. Select/combobox/popover/date-related controls and unspecified higher-level APIs remain deferred until their own contracts and coding sequence exist. Approval of this plan does not invent those missing APIs or imply their implementation is complete.

Keep all repository content standalone and repository-relative. Record this target as `.` and the reference by its public URL and immutable revision. Do not include operator-machine locations, credentials, runtime state or external coordination paths in committed files. Preserve unrelated work. No push, publication or deployment is part of this plan.

## Execution state and resume procedure

- Governing document: `implementation/COMMIT_SEQUENCE.md` (this file).
- Active implementation checkpoint: **S001** in **RCLD-01** — independently reviewed and verified; awaiting commit.
- Execution responsibility (recorded at S001): Pi authors implementation and corrections; Codex reviews the actual changes, independently verifies them, and controls acceptance and progression.
- Completed implementation checkpoints: **0 / 203**. Remaining: **203 / 203**.
- Completed RCLD sequences: **0 / 11**. Remaining: **11 / 11**.
- Last target commit observed: `0616306`, branch `master`; the scaffold was clean before this planning document was added.
- S001 evidence: `implementation/evidence/BASELINE.md`, `implementation/evidence/S001_REPORT.md` and independent `implementation/evidence/S001_REVIEW.md`.
- No implementation deviations have been applied. S001 is accepted; its commit is the remaining predecessor gate for S002.

Before execution or after a context reset, read the authority, approved dispositions, sequence gates, current ledger entry, complete current checkpoint and its contract links. Inspect current repository instructions/status and refresh baseline evidence. Only one implementation checkpoint may be active. Every checkpoint after S001 depends on the reviewed, verified, committed predecessor; milestone boundaries never waive that dependency.

Update the ledger only from actual evidence. Use `not_started`, `in_progress`, `blocked`, `verified_uncommitted`, `complete`, or `not_applicable`. A complete checkpoint requires its commit, test outcomes, self-review and report. An N/A entry requires a prior evidence-backed deviation and equivalent replacement coverage. A verified but uncommitted checkpoint cannot unlock its successor. Repair new relevant failures before continuing; never record an unavailable or skipped check as passed. Commit only under the active execution authorization.

After each green commit, record the hash and report, update this ledger, and reconcile remaining scope. A report may be recorded with the successor checkpoint or linked as factual evidence so it does not need to contain its own commit hash before that commit exists. Do not amend history merely to insert a self-referential hash. At every pause, report the last safe commit, next checkpoint, exact blockers and the full remaining RCLD set.

At S002, adopt the embedded contracts into their scheduled repository-relative files, establish target contract validation and an aligned `implementation/COMMIT_SEQUENCE.json` projection. This document remains the governing execution/status authority; the JSON projection must not drift into a second independently edited plan. Extracted specs govern product intent. Update this document's contract links and supersede embedded snapshots explicitly when extraction is verified; do not maintain conflicting copies silently. S001 baseline evidence and later reports are factual records, not alternate planning backlogs. No additional issue database is required by the current scaffold.

## Codex dispatch decisions — S002

These decisions supplement S002 without changing product requirements or checkpoint order. Codex owns scope, contract/API decisions, dependency-selection approval, deviations, acceptance, commits and dispatch between coding periods. Pi implements and self-reviews within the dispatched checkpoint; routine implementation choices inside an approved contract are allowed. Pi reports new consequential decisions to Codex and completes independent in-scope work while they are unresolved. It must not resolve them by silently weakening, expanding or deferring requirements.

1. Start S002 in a fresh Pi session with the actual provider/model reported. Read this authority, the complete S002 definition, the approved dispositions, all embedded contracts being adopted and S001 evidence. Do not rely on previous conversation memory. Verify Node satisfies `>=24` before any target tooling; use an already available supported runtime per process. The author's Node 24 and reviewer's Node 26 observations are environment evidence, not a new exact pin. S003 owns reproducible dependency selection and returns proposed compatibility decisions to Codex before applying them.
2. Extract all 27 embedded contracts: eleven `specs/` documents, six `decisions/` documents, seven `implementation/` guidance documents, two `references/` baseline documents, and the instruction template into root `AGENTS.md`. Merge stronger applicable instructions and add the Pi/Codex authority boundary. Preserve substantive requirements, examples, source dispositions and acceptance criteria. Project the sixteen source pointers into `references/SOURCES.json`. Rewrite relative links for each destination; replace extracted embedded bodies with an explicit superseded index pointing to adopted files. Preserve all 203 checkpoint definitions, their order, requirement coverage and eleven sequence gates.
3. Create `implementation/COMMIT_SEQUENCE.json` as a deterministic projection of this Markdown plan, not another editable authority. Include a schema version, all step IDs, sequence membership, dependency order, requirement anchors, statuses and completion evidence. An explicit regeneration mode may write this JSON; the default validation path must not write. Document the regeneration command and source of every projected field. Do not use the fixed archive's all-not-started assumptions or its payload manifest as live validation.
4. Implement dependency-free Node tooling in `tools/check-contracts.mjs` and focused regression tests in `tools/check-contracts.test.mjs` using `node:test`. Add only `check:contracts` and `test:contracts` scripts to `package.json` for this tooling; keep dependencies, engines, package manager, lockfile and workspace membership unchanged. This is S002 contract verification, not the general S005 test harness. Permit an explicit `--root` argument for disposable test fixtures. Separate any explicit projection generation mode from validation.
5. Validate required adopted files, local links and anchors, unique requirement/acceptance/checkpoint IDs, all 203 ordered checkpoints and predecessor relationships, eleven sequence boundaries, R01–R34 coverage, AC01–AC22 preservation, and Markdown/JSON semantic agreement. Reject invalid statuses, false completion without a resolvable commit/report/review evidence, and advancement beyond an incomplete predecessor. Completion evidence must resolve in this repository; never fabricate success from nonempty strings. Distinguish actual document links from clearly marked future deliverables and code examples. No network checks are required for historical external URLs.
6. Test representative failures: missing required contract, broken local link/anchor, duplicate or missing ID, invalid predecessor/status, JSON drift, missing completion evidence, and premature successor advancement. Prove default validation is read-only using complete disposable-tree snapshots including hidden files. Include a passing adopted-document fixture and useful failure diagnostics. Preserve all existing source content during extraction and demonstrate semantic comparison, not only counts.
7. Run format, contract validation and its focused tests; maintain the existing conditional reference Rust guard and document all skips. Report full commands, cwd identity, runtime selection, exit codes and log locations. Preserve original command exit statuses when capturing logs; do not infer success from a trailing shell command or truncated output. Record nested subprocess test executions separately from top-level totals.
8. Complete the full unblocked S002 scope, self-review the whole diff, update only S002 candidate state and its report, and return unstaged and uncommitted to Codex. Do not start S003, change completion evidence for later checkpoints, create a new issue database, or modify external coordination state. Codex maintains coordination separately and advances the predecessor ledger from actual accepted commits. No human release test is due at this documentation/tooling checkpoint.

## Resolved baseline and approved review dispositions

1. **Target and tooling.** The target is `https://github.com/triesap/svelte-ui-kit`, using its existing `master` history. The reviewed scaffold has 14 tracked files and no product source, tests or CI workflows. Preserve `pnpm@11.22.0`, Node engine `>=24`, `prettier@3.9.6`, the existing lockfile, and MIT OR Apache-2.0 licensing unless a scheduled evidence-backed compatibility change requires an update. Node `v26.10.0` was observed on the review machine; that observation is not a supported-version matrix or an exact Node pin. Use the established `area: imperative summary` style for checkpoint messages. Revalidate these observations at S001.
2. **Reference identity.** Use [triesap/leptos_ui_kit at a10fbf0](https://github.com/triesap/leptos_ui_kit/tree/a10fbf06334f4648f5755e05a7147414e4e5fc98) as read-only design and source evidence. It is not the target. Its Rust implementation is not a template to translate mechanically. The target has no Cargo manifest; record target Cargo checks as N/A with inventory evidence. Separately inventory and honor the conditional reference Cargo guard described in the verification contract. Reference Rust checks have not been run by this planning setup.
3. **Field parity — S145–S148, S181.** The reference Field exports FieldRoot, FieldSurface, FieldLabel, FieldMessage, FieldRequired, FieldSlot, TextInput/TextInputType, TextArea, TextField, TextAreaField, NativeSelect, SelectField and SelectIcon. The worksheet must give each export and associated native input/textarea/select, label, required, invalid, disabled, dynamic-message and composition behavior an explicit Svelte mapping or justified disposition. Native select parity is part of the original catalog; it is not the deferred new select/combobox API. Preserve behavior without copying Rust-specific slot/context APIs. See [reference Field manifest](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/field.json).
4. **Menu parity — S122–S128, S181.** Map the source's ordinary and radio items, controlled selection and indicators as well as activation, keyboard/typeahead, dismissal, focus return and placement. Selection is evidenced source scope, not an optional feature to omit by default. Derive the necessary pinned Bits parts without adopting its entire catalog. Do not carry over an untested strict-CSP promise. See [reference Menu manifest](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/menu.json).
5. **Avatar — S155–S157.** The [reference Avatar](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/avatar.rs) is a native image with src, alt and class. The approved target requires loading/failure/fallback qualification. Freeze the minimal typed fallback content, transitions, accessible text and SSR behavior at S155 using pinned native/Bits evidence. Describe this as target behavior; do not claim an existing source fallback API or invent unrelated variants.
6. **Ownership — S015, S030, S043–S063.** Explicit requests remain separate from the resolved dependency closure. Compare tracked base/local/incoming bytes and enforce source/CSS/export cohorts; do not translate the source's local-edit refusal or dependency-closure-to-config behavior. Untracked equality grants no silent adoption or deletion rights. Preserve legitimate baselines, detach customized retired assets truthfully, and stop unsafe mixed updates.
7. **Verification independence — S002 onward.** The specification archive's integrity checks validated a fixed payload and all-not-started plan; they do not validate changing implementation status or product behavior. Establish `tools/check-contracts.mjs` at S002 to check live repository links, checkpoint order, requirement coverage and truthful status evidence without assuming the archived manifest. No such target tool is implemented by this planning document.
8. **Public evidence and execution scope.** Keep adopted contracts, commands, provenance, generated fixtures and reports self-contained. The initial planning setup completed no implementation checkpoint. Active implementation now follows the execution state and reviewed commit ledger above. Do not treat prior analysis, dependency hydration or this plan's formatting result as product implementation completion.

## Remaining technical gates

| Gate                        | Scheduled resolution and recommended default                                                                                                                                                         | Risk if unresolved                                                                              | Blocking boundary                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| A.1 — Exact dependencies    | S003 selects reproducible Node/Svelte/Kit/Bits/TS versions from actual metadata with pnpm; S011 proves the typed primitive boundary.                                                                 | Incompatible peers, bindings, refs or snippets.                                                 | Dependency selection before affected code; passing probe before generated wrappers. |
| A.2 — Schemas and protocol  | S013–S024 freeze independent identities, strict fields, exact-byte hashes, deterministic JSON and exit codes; S052 freezes export markers. Use local versioned schemas without invented hosted URLs. | Wire drift, false ownership and ambiguous patching.                                             | Each dependent model/handler/patcher.                                               |
| A.3 — Paths and platforms   | S033–S042 establish defaults, explicit supported mappings and trusted-local limits; S064–S077 prove recovery; S193 qualifies advertised OS lanes.                                                    | Escaped targets, destructive races, ambiguous crash recovery or unsupported portability claims. | Exposing mutation; final platform claims require executed evidence.                 |
| A.4 — Ownership and cohorts | S043 resolves missing/adoption cases; S059 freezes conservative cohort rules. Default to visible missing-target outcomes, no silent adoption and refusal of unsafe mixed updates.                    | Lost edits, accidental deletion or falsely advanced lock state.                                 | Affected planners before guarded apply.                                             |
| A.5 — Component APIs        | Freeze every family against source maps and pinned types before wrappers; include the Field/Menu/Avatar dispositions above and native identity at S179–S180.                                         | Silent catalog omissions, invented APIs or broken forms/SSR.                                    | Each family implementation and final parity audit.                                  |
| A.6 — Accessibility and CSP | Establish an actual initial browser lane at S008; measure themes, contrast, keyboard/forms and floating styles through S128/S188.                                                                    | Unsupported accessibility, browser or strict-CSP claims.                                        | Affected component qualification and release acceptance.                            |
| A.7 — Distribution          | S090/S194–S196 prove package contents, runtime independence, peers, notices and actual name status. Preserve dual licensing; do not publish or silently rename.                                      | Unusable packed output or misleading compatibility/distribution claims.                         | Distribution acceptance; publisher authorization is separate.                       |
| A.8 — Extensions            | S202 records precise missing inventory/value/search/date/locale/timezone contracts and next specification gate.                                                                                      | Invented product behavior or false expanded completion.                                         | Extension implementation only; does not block specified core.                       |

No additional product decision blocks S001. Ordinary technical discovery is resolved at these checkpoints, with evidence; it is not a reason to repeatedly request already approved choices.

## Command mapping and baseline evidence

Run commands from this repository or the exact fixture/reference root named in the checkpoint report, following the active environment's execution policy. This plan uses repository commands without prescribing workstation configuration.

The existing meaningful lane is `pnpm run format:check`. It passed during review with the pinned formatter; both staged and unstaged diff checks passed. The formatter dependency was hydrated by the execution environment. These are review observations and must be refreshed at the execution baseline. No product suite, browser lane, package acceptance or Rust lane has passed on the strength of that check.

The checkpoint command categories use pnpm: `pnpm run <script>` replaces illustrative `npm run <script>`; `pnpm pack --json` replaces illustrative `npm pack --json`. Confirm runner argument forwarding and pack output support in the pinned manager when establishing each lane. These are command translations, not implementation scope deviations. Script names other than format/format:check are proposed until the scheduled step implements and proves them; do not run placeholders or record unavailable scripts as passed. The optional public package's runtime asset loading must remain independent of package-manager setup and the authoring checkout.

## RCLD sequence map

The sequence gates below supplement each checkpoint's exact scope and tests. Run the scoped lane for each checkpoint and all applicable cumulative lanes at milestone exit. Every sequence after RCLD-01 depends on completion of its predecessor's final checkpoint.

| RCLD                | Checkpoints | Count | State       | Predecessor       |
| ------------------- | ----------- | ----- | ----------- | ----------------- |
| [RCLD-01](#rcld-01) | S001–S012   | 12    | in_progress | None; S001 review |
| [RCLD-02](#rcld-02) | S013–S032   | 20    | not_started | S012              |
| [RCLD-03](#rcld-03) | S033–S063   | 31    | not_started | S032              |
| [RCLD-04](#rcld-04) | S064–S077   | 14    | not_started | S063              |
| [RCLD-05](#rcld-05) | S078–S091   | 14    | not_started | S077              |
| [RCLD-06](#rcld-06) | S092–S115   | 24    | not_started | S091              |
| [RCLD-07](#rcld-07) | S116–S128   | 13    | not_started | S115              |
| [RCLD-08](#rcld-08) | S129–S148   | 20    | not_started | S128              |
| [RCLD-09](#rcld-09) | S149–S181   | 33    | not_started | S148              |
| [RCLD-10](#rcld-10) | S182–S193   | 12    | not_started | S181              |
| [RCLD-11](#rcld-11) | S194–S203   | 10    | not_started | S193              |

<a id="rcld-01"></a>

### RCLD-01 — Baseline and verification harness

Checkpoints: S001–S012. State: in_progress.

**Scope:** Establish repository evidence, adopt contracts, pin compatible dependencies, build the typed CLI boundary, and qualify a real SSR consumer and primitive probe.

**Definition of green:** Real format/lint/type/unit/consumer/browser lanes exist, run meaningfully, and enforce separated CLI, registry, project and planner boundaries.

**Verification lane:** Bootstrap unit checks; consumer check/build; browser smoke; compatibility types; baseline CI.

<a id="rcld-02"></a>

### RCLD-02 — Versioned models and registry resolution

Checkpoints: S013–S032. State: not_started.

**Scope:** Freeze independent versions, strict config/registry/lock/theme/protocol schemas, argument grammar, immutable packaged assets, deterministic dependency and export resolution.

**Definition of green:** Malformed schemas, incompatible peers, cycles and ownership/export collisions fail before planning; explicit roots remain distinct from transitive items.

**Verification lane:** Model/protocol unit tests and registry integrity/ownership tests.

<a id="rcld-03"></a>

### RCLD-03 — Project integration and ownership planning

Checkpoints: S033–S063. State: not_started.

**Scope:** Validate paths and project roots, inspect dependencies, freeze ownership cases, patch CSS/exports/layout structurally, and compose init/add/sync/retirement plans.

**Definition of green:** Complete deterministic plans preserve unmanaged bytes and local edits; conflicts cannot advance config or lineage; all planning paths produce zero writes.

**Verification lane:** Filesystem/project integration, B/L/I and cohort unit matrices, patch preservation, complete-tree purity and consumer build.

<a id="rcld-04"></a>

### RCLD-04 — Transactions and recovery

Checkpoints: S064–S077. State: not_started.

**Scope:** Freeze transaction states and platform assumptions; implement strict journals, writer coordination, preimage checks, staging, replacements, lock-last publication and recovery.

**Definition of green:** Faults and process interruption recover consistently or refuse safely; concurrent and post-crash user edits survive; every write uses the same guarded apply boundary.

**Verification lane:** Transaction unit/integration fault injection plus real-process contention and interruption tests.

<a id="rcld-05"></a>

### RCLD-05 — CLI workflows and generator acceptance

Checkpoints: S078–S091. State: not_started.

**Scope:** Wire one outcome renderer and info/view/init/add/sync/doctor to verified use cases, then qualify process results, idempotence, schema boundaries, upgrades and package inventory.

**Definition of green:** All six commands honor JSON/exit/no-write contracts; customization is not strict-doctor failure; the packaged generator operates without hidden asset or dependency installation paths.

**Verification lane:** Built-executable integration matrix, workflow purity, synthetic upgrades, package inventory and cumulative generator lanes.

<a id="rcld-06"></a>

### RCLD-06 — Tokens and core components

Checkpoints: S092–S115. State: not_started.

**Scope:** Freeze/map token contracts, then qualify Spinner, Button, Switch and the complete Dialog family through the generator and an installed tarball.

**Definition of green:** The initial core preserves tokens, radius/shape rules, native forms, bindings/refs/snippets, keyboard/focus, portal themes and SSR/hydration; upgrades preserve customization.

**Verification lane:** Registry/type/install fixtures, computed-style and behavior browser suites, SSR and packed-core acceptance.

<a id="rcld-07"></a>

### RCLD-07 — Alert Dialog and Menu

Checkpoints: S116–S128. State: not_started.

**Scope:** Qualify distinct Alert Dialog semantics and source-parity Menu selection, delegated floating content, themes, positioning and measured CSP behavior.

**Definition of green:** Complete families preserve primitive behavior, source-required selection and focus; floating wrappers retain positioning structure; CSP claims match measured evidence.

**Verification lane:** Family type/install tests, keyboard/focus/nested-overlay browser tests, placement/theme/CSP qualification.

<a id="rcld-08"></a>

### RCLD-08 — Forms and disclosures

Checkpoints: S129–S148. State: not_started.

**Scope:** Qualify Checkbox, Radio, Tabs, Collapsible and the complete Field source-parity mapping, including native input/textarea/select behaviors.

**Definition of green:** Generated controls preserve form submission/reset, required/disabled behavior, labels/IDs, typed state, presence and hydration; Field mappings have no silent omissions.

**Verification lane:** Per-family contract/install checks, real-form/keyboard browser tests, Field SSR and consumer build.

<a id="rcld-09"></a>

### RCLD-09 — Remaining catalog and identity

Checkpoints: S149–S181. State: not_started.

**Scope:** Qualify Anchor/Router Link, Avatar, Badge, Card, Alert, Status, Progress, Separator and Skeleton; resolve native identity and audit all 22 original registry IDs plus Alert Dialog.

**Definition of green:** Every original item/export has an explicit behavioral mapping or justified disposition; Avatar fallback is a frozen target behavior; no fake identity shim or unapproved extension appears.

**Verification lane:** Per-item type/install/browser suites, identity SSR/hydration, full catalog parity and registry checks.

<a id="rcld-10"></a>

### RCLD-10 — Cross-component and platform qualification

Checkpoints: S182–S193. State: not_started.

**Scope:** Audit imports/exports, wrapper contracts, combined forms/overlays, CSS/theme/accessibility/SSR, custom layouts, retirement/re-add, upgrade cohorts and supported filesystems.

**Definition of green:** Catalog composition and ownership lifecycle pass; compatibility and platform claims match actual executed evidence; safety failures are not skipped.

**Verification lane:** Cumulative generated-app browser/SSR/integration tests, registry CSS/import audits, supported-OS transaction lanes.

<a id="rcld-11"></a>

### RCLD-11 — Packed acceptance and delivery

Checkpoints: S194–S203. State: not_started.

**Scope:** Prove installed CLI and generated consumer independence, verify release-shaped metadata/notices, exercise operating/recovery examples, reconcile traceability and record the extension specification gate.

**Definition of green:** AC01–AC22 and R01–R34 have real evidence; all required checkpoints have reviewed commits/reports; artifact/compatibility/remaining limits are reproducible and no publication is implied.

**Verification lane:** Installed-tarball and generated-consumer acceptance, documented workflows/recovery, full code-health/platform lanes, contract/traceability audit.

## Checkpoint ledger

The original IDs, requirement anchors, scope, files, tests, expected results and commit messages are preserved below. Every status starts at not_started. No completion is inferred from a milestone name or plan approval.

| Step | Sequence | Depends on | Status               | Commit / report |
| ---- | -------- | ---------- | -------------------- | --------------- |
| S001 | RCLD-01  | None       | verified_uncommitted | —               |
| S002 | RCLD-01  | S001       | not_started          | —               |
| S003 | RCLD-01  | S002       | not_started          | —               |
| S004 | RCLD-01  | S003       | not_started          | —               |
| S005 | RCLD-01  | S004       | not_started          | —               |
| S006 | RCLD-01  | S005       | not_started          | —               |
| S007 | RCLD-01  | S006       | not_started          | —               |
| S008 | RCLD-01  | S007       | not_started          | —               |
| S009 | RCLD-01  | S008       | not_started          | —               |
| S010 | RCLD-01  | S009       | not_started          | —               |
| S011 | RCLD-01  | S010       | not_started          | —               |
| S012 | RCLD-01  | S011       | not_started          | —               |
| S013 | RCLD-02  | S012       | not_started          | —               |
| S014 | RCLD-02  | S013       | not_started          | —               |
| S015 | RCLD-02  | S014       | not_started          | —               |
| S016 | RCLD-02  | S015       | not_started          | —               |
| S017 | RCLD-02  | S016       | not_started          | —               |
| S018 | RCLD-02  | S017       | not_started          | —               |
| S019 | RCLD-02  | S018       | not_started          | —               |
| S020 | RCLD-02  | S019       | not_started          | —               |
| S021 | RCLD-02  | S020       | not_started          | —               |
| S022 | RCLD-02  | S021       | not_started          | —               |
| S023 | RCLD-02  | S022       | not_started          | —               |
| S024 | RCLD-02  | S023       | not_started          | —               |
| S025 | RCLD-02  | S024       | not_started          | —               |
| S026 | RCLD-02  | S025       | not_started          | —               |
| S027 | RCLD-02  | S026       | not_started          | —               |
| S028 | RCLD-02  | S027       | not_started          | —               |
| S029 | RCLD-02  | S028       | not_started          | —               |
| S030 | RCLD-02  | S029       | not_started          | —               |
| S031 | RCLD-02  | S030       | not_started          | —               |
| S032 | RCLD-02  | S031       | not_started          | —               |
| S033 | RCLD-03  | S032       | not_started          | —               |
| S034 | RCLD-03  | S033       | not_started          | —               |
| S035 | RCLD-03  | S034       | not_started          | —               |
| S036 | RCLD-03  | S035       | not_started          | —               |
| S037 | RCLD-03  | S036       | not_started          | —               |
| S038 | RCLD-03  | S037       | not_started          | —               |
| S039 | RCLD-03  | S038       | not_started          | —               |
| S040 | RCLD-03  | S039       | not_started          | —               |
| S041 | RCLD-03  | S040       | not_started          | —               |
| S042 | RCLD-03  | S041       | not_started          | —               |
| S043 | RCLD-03  | S042       | not_started          | —               |
| S044 | RCLD-03  | S043       | not_started          | —               |
| S045 | RCLD-03  | S044       | not_started          | —               |
| S046 | RCLD-03  | S045       | not_started          | —               |
| S047 | RCLD-03  | S046       | not_started          | —               |
| S048 | RCLD-03  | S047       | not_started          | —               |
| S049 | RCLD-03  | S048       | not_started          | —               |
| S050 | RCLD-03  | S049       | not_started          | —               |
| S051 | RCLD-03  | S050       | not_started          | —               |
| S052 | RCLD-03  | S051       | not_started          | —               |
| S053 | RCLD-03  | S052       | not_started          | —               |
| S054 | RCLD-03  | S053       | not_started          | —               |
| S055 | RCLD-03  | S054       | not_started          | —               |
| S056 | RCLD-03  | S055       | not_started          | —               |
| S057 | RCLD-03  | S056       | not_started          | —               |
| S058 | RCLD-03  | S057       | not_started          | —               |
| S059 | RCLD-03  | S058       | not_started          | —               |
| S060 | RCLD-03  | S059       | not_started          | —               |
| S061 | RCLD-03  | S060       | not_started          | —               |
| S062 | RCLD-03  | S061       | not_started          | —               |
| S063 | RCLD-03  | S062       | not_started          | —               |
| S064 | RCLD-04  | S063       | not_started          | —               |
| S065 | RCLD-04  | S064       | not_started          | —               |
| S066 | RCLD-04  | S065       | not_started          | —               |
| S067 | RCLD-04  | S066       | not_started          | —               |
| S068 | RCLD-04  | S067       | not_started          | —               |
| S069 | RCLD-04  | S068       | not_started          | —               |
| S070 | RCLD-04  | S069       | not_started          | —               |
| S071 | RCLD-04  | S070       | not_started          | —               |
| S072 | RCLD-04  | S071       | not_started          | —               |
| S073 | RCLD-04  | S072       | not_started          | —               |
| S074 | RCLD-04  | S073       | not_started          | —               |
| S075 | RCLD-04  | S074       | not_started          | —               |
| S076 | RCLD-04  | S075       | not_started          | —               |
| S077 | RCLD-04  | S076       | not_started          | —               |
| S078 | RCLD-05  | S077       | not_started          | —               |
| S079 | RCLD-05  | S078       | not_started          | —               |
| S080 | RCLD-05  | S079       | not_started          | —               |
| S081 | RCLD-05  | S080       | not_started          | —               |
| S082 | RCLD-05  | S081       | not_started          | —               |
| S083 | RCLD-05  | S082       | not_started          | —               |
| S084 | RCLD-05  | S083       | not_started          | —               |
| S085 | RCLD-05  | S084       | not_started          | —               |
| S086 | RCLD-05  | S085       | not_started          | —               |
| S087 | RCLD-05  | S086       | not_started          | —               |
| S088 | RCLD-05  | S087       | not_started          | —               |
| S089 | RCLD-05  | S088       | not_started          | —               |
| S090 | RCLD-05  | S089       | not_started          | —               |
| S091 | RCLD-05  | S090       | not_started          | —               |
| S092 | RCLD-06  | S091       | not_started          | —               |
| S093 | RCLD-06  | S092       | not_started          | —               |
| S094 | RCLD-06  | S093       | not_started          | —               |
| S095 | RCLD-06  | S094       | not_started          | —               |
| S096 | RCLD-06  | S095       | not_started          | —               |
| S097 | RCLD-06  | S096       | not_started          | —               |
| S098 | RCLD-06  | S097       | not_started          | —               |
| S099 | RCLD-06  | S098       | not_started          | —               |
| S100 | RCLD-06  | S099       | not_started          | —               |
| S101 | RCLD-06  | S100       | not_started          | —               |
| S102 | RCLD-06  | S101       | not_started          | —               |
| S103 | RCLD-06  | S102       | not_started          | —               |
| S104 | RCLD-06  | S103       | not_started          | —               |
| S105 | RCLD-06  | S104       | not_started          | —               |
| S106 | RCLD-06  | S105       | not_started          | —               |
| S107 | RCLD-06  | S106       | not_started          | —               |
| S108 | RCLD-06  | S107       | not_started          | —               |
| S109 | RCLD-06  | S108       | not_started          | —               |
| S110 | RCLD-06  | S109       | not_started          | —               |
| S111 | RCLD-06  | S110       | not_started          | —               |
| S112 | RCLD-06  | S111       | not_started          | —               |
| S113 | RCLD-06  | S112       | not_started          | —               |
| S114 | RCLD-06  | S113       | not_started          | —               |
| S115 | RCLD-06  | S114       | not_started          | —               |
| S116 | RCLD-07  | S115       | not_started          | —               |
| S117 | RCLD-07  | S116       | not_started          | —               |
| S118 | RCLD-07  | S117       | not_started          | —               |
| S119 | RCLD-07  | S118       | not_started          | —               |
| S120 | RCLD-07  | S119       | not_started          | —               |
| S121 | RCLD-07  | S120       | not_started          | —               |
| S122 | RCLD-07  | S121       | not_started          | —               |
| S123 | RCLD-07  | S122       | not_started          | —               |
| S124 | RCLD-07  | S123       | not_started          | —               |
| S125 | RCLD-07  | S124       | not_started          | —               |
| S126 | RCLD-07  | S125       | not_started          | —               |
| S127 | RCLD-07  | S126       | not_started          | —               |
| S128 | RCLD-07  | S127       | not_started          | —               |
| S129 | RCLD-08  | S128       | not_started          | —               |
| S130 | RCLD-08  | S129       | not_started          | —               |
| S131 | RCLD-08  | S130       | not_started          | —               |
| S132 | RCLD-08  | S131       | not_started          | —               |
| S133 | RCLD-08  | S132       | not_started          | —               |
| S134 | RCLD-08  | S133       | not_started          | —               |
| S135 | RCLD-08  | S134       | not_started          | —               |
| S136 | RCLD-08  | S135       | not_started          | —               |
| S137 | RCLD-08  | S136       | not_started          | —               |
| S138 | RCLD-08  | S137       | not_started          | —               |
| S139 | RCLD-08  | S138       | not_started          | —               |
| S140 | RCLD-08  | S139       | not_started          | —               |
| S141 | RCLD-08  | S140       | not_started          | —               |
| S142 | RCLD-08  | S141       | not_started          | —               |
| S143 | RCLD-08  | S142       | not_started          | —               |
| S144 | RCLD-08  | S143       | not_started          | —               |
| S145 | RCLD-08  | S144       | not_started          | —               |
| S146 | RCLD-08  | S145       | not_started          | —               |
| S147 | RCLD-08  | S146       | not_started          | —               |
| S148 | RCLD-08  | S147       | not_started          | —               |
| S149 | RCLD-09  | S148       | not_started          | —               |
| S150 | RCLD-09  | S149       | not_started          | —               |
| S151 | RCLD-09  | S150       | not_started          | —               |
| S152 | RCLD-09  | S151       | not_started          | —               |
| S153 | RCLD-09  | S152       | not_started          | —               |
| S154 | RCLD-09  | S153       | not_started          | —               |
| S155 | RCLD-09  | S154       | not_started          | —               |
| S156 | RCLD-09  | S155       | not_started          | —               |
| S157 | RCLD-09  | S156       | not_started          | —               |
| S158 | RCLD-09  | S157       | not_started          | —               |
| S159 | RCLD-09  | S158       | not_started          | —               |
| S160 | RCLD-09  | S159       | not_started          | —               |
| S161 | RCLD-09  | S160       | not_started          | —               |
| S162 | RCLD-09  | S161       | not_started          | —               |
| S163 | RCLD-09  | S162       | not_started          | —               |
| S164 | RCLD-09  | S163       | not_started          | —               |
| S165 | RCLD-09  | S164       | not_started          | —               |
| S166 | RCLD-09  | S165       | not_started          | —               |
| S167 | RCLD-09  | S166       | not_started          | —               |
| S168 | RCLD-09  | S167       | not_started          | —               |
| S169 | RCLD-09  | S168       | not_started          | —               |
| S170 | RCLD-09  | S169       | not_started          | —               |
| S171 | RCLD-09  | S170       | not_started          | —               |
| S172 | RCLD-09  | S171       | not_started          | —               |
| S173 | RCLD-09  | S172       | not_started          | —               |
| S174 | RCLD-09  | S173       | not_started          | —               |
| S175 | RCLD-09  | S174       | not_started          | —               |
| S176 | RCLD-09  | S175       | not_started          | —               |
| S177 | RCLD-09  | S176       | not_started          | —               |
| S178 | RCLD-09  | S177       | not_started          | —               |
| S179 | RCLD-09  | S178       | not_started          | —               |
| S180 | RCLD-09  | S179       | not_started          | —               |
| S181 | RCLD-09  | S180       | not_started          | —               |
| S182 | RCLD-10  | S181       | not_started          | —               |
| S183 | RCLD-10  | S182       | not_started          | —               |
| S184 | RCLD-10  | S183       | not_started          | —               |
| S185 | RCLD-10  | S184       | not_started          | —               |
| S186 | RCLD-10  | S185       | not_started          | —               |
| S187 | RCLD-10  | S186       | not_started          | —               |
| S188 | RCLD-10  | S187       | not_started          | —               |
| S189 | RCLD-10  | S188       | not_started          | —               |
| S190 | RCLD-10  | S189       | not_started          | —               |
| S191 | RCLD-10  | S190       | not_started          | —               |
| S192 | RCLD-10  | S191       | not_started          | —               |
| S193 | RCLD-10  | S192       | not_started          | —               |
| S194 | RCLD-11  | S193       | not_started          | —               |
| S195 | RCLD-11  | S194       | not_started          | —               |
| S196 | RCLD-11  | S195       | not_started          | —               |
| S197 | RCLD-11  | S196       | not_started          | —               |
| S198 | RCLD-11  | S197       | not_started          | —               |
| S199 | RCLD-11  | S198       | not_started          | —               |
| S200 | RCLD-11  | S199       | not_started          | —               |
| S201 | RCLD-11  | S200       | not_started          | —               |
| S202 | RCLD-11  | S201       | not_started          | —               |
| S203 | RCLD-11  | S202       | not_started          | —               |

## Complete checkpoint definitions

The source execution definitions follow, with pnpm command mapping, in-document contract links and the S002 target-validation adaptation stated above. References to scheduled file paths describe future deliverables unless they already exist. The per-checkpoint Rust guard is conditional, not a request to introduce Rust into this package.

### Checkpoint execution rules

Status: executable plan, **not implemented**. Every step is sequential and commit-sized. All listed code/test paths are proposed target paths or scoped likely modules; actual repository equivalents are resolved during discovery, not presumed to exist in this specification.

## Commit message convention — establish once

The reference repository at the reviewed baseline uses **`area: imperative summary`**, for example `switch: strengthen the unchecked track contrast` and `registry: complete desired item vocabulary`. Use lowercase area, colon/space, and a concise imperative summary; optionally explain behavior/tests in the body. It is not assumed to use `feat(scope):` Conventional Commits. Inspect the actual target repository during S001; its established consistent convention takes precedence. Record any message-format mapping once, then apply it consistently to the proposed messages below without changing scope.

## Non-negotiable execution rule

Read durable specs before coding. Complete, test, review and commit **one step at a time in this exact order**. Do not skip, merge, reorder or broaden steps unless repository evidence proves the step obsolete or unsafe. Record the deviation before acting, preserve its original ID, and use `DEVIATION_TEMPLATE.md`. Efficiency preferences and context limits do not qualify. A step may edit code and its directly related tests/contracts together; it must leave a known-good repository rather than commit red tests or advertise incomplete components.

Every step depends on the immediately preceding completed/committed step; the checkpoint ledger above makes this explicit. S002 will establish an aligned JSON companion with `dependsOn` fields. Milestone headings are navigation only, not permission to collapse steps into phases. Unregistered candidate component parts may compile in candidate fixtures without appearing in the public registry; register the complete item only at its dedicated step. Final qualification always uses installed generated files, not just candidates.

## Verification rule

`VERIFICATION.md` defines actual-command discovery and Cargo applicability. The npm script names below are the proposed command contract for a new target. Establish them at the indicated bootstrap steps or map existing real equivalents; resolve runner argument syntax before implementing each step. Unavailable tooling is unverified, not passed. From S006 onward, add the established nonmutating format/lint/typecheck checks to each step. Always run `git diff --check`, self-review the staged diff, and use the applicable repository baseline.

Every step explicitly repeats the Cargo guard to honor the specification request: run at the actual applicable Rust workspace root, never at an unrelated TS directory. Where no Rust workspace applies, record N/A with discovery evidence. If Rust changes, add scoped crate tests and valid feature/target/platform/package checks from repository instructions. Do not create Rust code, blindly enable all features, or claim that npm verifies Rust. A new relevant failure blocks moving to the next step. Evidence-backed pre-existing/out-of-scope exceptions must remain visible and do not waive final acceptance.

After every commit use `STEP_REPORT_TEMPLATE.md`: step/contract IDs, files changed, exact commands and results, commit hash/message, unverified issues, deviations, and next-step safety. Do not publish or push without separate authorization.

## Scope boundary

The plan covers the complete specified generator, original catalog adaptation, distinct Alert Dialog, safety, tests and distribution. The approved broader extension direction has a final explicit specification gate. No fabricated select/combobox/date APIs or unapproved extra registry items are included. An expanded release claiming those components remains blocked until their contracts and its next sequence are specified.

## Milestones

- **M01 — Authorized baseline and working verification harness:** S001–S012 (12 steps).
- **M02 — Versioned models, strict schemas, and registry resolution:** S013–S032 (20 steps).
- **M03 — Project detection, integration boundaries, and ownership planning:** S033–S063 (31 steps).
- **M04 — Guarded transactions and recovery:** S064–S077 (14 steps).
- **M05 — Complete CLI workflows and generator acceptance:** S078–S091 (14 steps).
- **M06 — Tokens, spinner, button, switch, and dialog vertical slice:** S092–S115 (24 steps).
- **M07 — Distinct alert-dialog and early floating-menu qualification:** S116–S128 (13 steps).
- **M08 — Remaining forms and disclosure components:** S129–S148 (20 steps).
- **M09 — Native navigation, surfaces, feedback, and identity parity:** S149–S181 (33 steps).
- **M10 — Cross-component regression and supported-environment qualification:** S182–S193 (12 steps).
- **M11 — Packed acceptance, operating documentation, and final specification:** S194–S203 (10 steps).

Total: **203 independently reviewed commit-sized steps**. All begin in `not_started` status.

## M01 — Authorized baseline and working verification harness

### S001 — Establish the authorized target and baseline

**Contract anchors:** R32, R33, R34. [PRODUCT_SPEC.md](#contract-specs-product-spec).

**1. Step title:** Establish the authorized target and baseline.

**2. Purpose:** Protect the reference Rust repository and identify the real implementation worktree before any product changes.

**3. Exact scope of code changes:**

- Inspect instructions, Git state, manifests, CI and recent commit subjects
- Record target/reference roots, existing user changes, applicable Cargo workspaces and baseline results
- Do not initialize or replace a repository outside the authorized location

**4. Files/modules likely involved:**

- `implementation evidence/BASELINE.md`
- `existing AGENTS.md`
- `package.json and lockfiles`
- `Cargo.toml and rust-toolchain.toml when present`

**5. Required unit/integration tests:**

- No product tests yet; inventory existing suites and execute their safe baseline
- Record missing tooling and pre-existing failures separately

**6. Verification commands:**

```sh
git status --short
git log -12 --pretty=%s
# DISCOVER/VERIFY: Discover and execute existing type/test/build commands; record literal commands before the next step
git diff --check
```

Run the available repository baseline and record any not-yet-established lanes explicitly. Never install placeholder-green checks. Review the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** An authorized, evidenced target and known baseline exist; an unresolved location blocks further writes.

**8. Commit message:** `repo: record the authorized target and verification baseline`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S002, not an unscheduled expansion.

### S002 — Anchor approved contracts and repository instructions

**Contract anchors:** R01, R31, R32, R33, R34. [ARCHITECTURE.md](#contract-specs-architecture), [PRODUCT_SPEC.md](#contract-specs-product-spec), [SCOPE_AND_ASSUMPTIONS.md](#contract-specs-scope-and-assumptions).

**1. Step title:** Anchor approved contracts and repository instructions.

**2. Purpose:** Make durable intent available next to implementation rather than relying on the approved review.

**3. Exact scope of code changes:**

- Adopt this specification contract stack in the target-approved location
- Merge repo/AGENTS.md guidance without replacing stronger instructions
- Record requirement IDs and assumption/open-question ownership

**4. Files/modules likely involved:**

- `specs/`
- `decisions/`
- `implementation/`
- `AGENTS.md`

**5. Required unit/integration tests:**

- Validate required files, local references and requirement IDs
- Review that product/package identity and Rust-guard interpretation remain unchanged

**6. Verification commands:**

```sh
node tools/check-contracts.mjs # establish this repository contract validator in S002
# DISCOVER/VERIFY: Add target document/reference validation for the adopted contracts; preserve checkpoint IDs and coverage while allowing status updates
git diff --check
```

Run the available repository baseline and record any not-yet-established lanes explicitly. Never install placeholder-green checks. Review the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The target has a clear source of intent and no product code or policy change.

**8. Commit message:** `spec: anchor the approved svelte ui kit contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S003, not an unscheduled expansion.

### S003 — Select a reproducible Node and dependency baseline

**Contract anchors:** R01, R10, R12, R20, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model), [PRODUCT_SPEC.md](#contract-specs-product-spec).

**1. Step title:** Select a reproducible Node and dependency baseline.

**2. Purpose:** Resolve versions and package-manager details before authoring wrapper APIs.

**3. Exact scope of code changes:**

- Inspect actual selected package metadata/peers and existing lockfile conventions
- Create or minimally update target package metadata for svelte-ui-kit with no publication
- Record exact Node, Svelte, Kit, Bits and TypeScript selections and why they satisfy compatibility

**4. Files/modules likely involved:**

- `package.json`
- `detected package-manager lockfile`
- `implementation evidence/COMPATIBILITY.md`

**5. Required unit/integration tests:**

- Validate package metadata and full peer constraints
- Verify historical Bits source observations are not treated as a latest-release guarantee

**6. Verification commands:**

```sh
node --version
# DISCOVER/VERIFY: Execute the detected package manager strict/frozen install command after recording it; never substitute a second lockfile
# DISCOVER/VERIFY: Validate selected peer dependency metadata with the actual package manager
git diff --check
```

Run the available repository baseline and record any not-yet-established lanes explicitly. Never install placeholder-green checks. Review the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Dependency/tool versions are locked and reproducible; consumer auto-install is not introduced.

**8. Commit message:** `build: pin the initial tooling and primitive baseline`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S004, not an unscheduled expansion.

### S004 — Create a minimal typed CLI build boundary

**Contract anchors:** R01, R02, R30, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [PRODUCT_SPEC.md](#contract-specs-product-spec).

**1. Step title:** Create a minimal typed CLI build boundary.

**2. Purpose:** Establish an executable TypeScript target that builds before adding behavior.

**3. Exact scope of code changes:**

- Add minimal CLI entrypoint and TypeScript module/build configuration
- Establish real build and typecheck scripts
- Limit initial command behavior to honest help/version scaffolding; no pretend install success

**4. Files/modules likely involved:**

- `src/cli/main.ts`
- `tsconfig.json`
- `package.json`
- `build configuration`

**5. Required unit/integration tests:**

- Compile entrypoint and invoke built help/version smoke
- Ensure Node-only entrypoint has no consumer Svelte runtime export

**6. Verification commands:**

```sh
pnpm run typecheck
pnpm run build
# DISCOVER/VERIFY: node <discovered-built-entrypoint> --help; resolve the actual path from package.json bin first
git diff --check
```

Run the available repository baseline and record any not-yet-established lanes explicitly. Never install placeholder-green checks. Review the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The target builds and exposes only implemented behavior.

**8. Commit message:** `cli: establish the typed executable boundary`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S005, not an unscheduled expansion.

### S005 — Add a real unit-test harness

**Contract anchors:** R29, R30, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts).

**1. Step title:** Add a real unit-test harness.

**2. Purpose:** Enable independently verified implementation commits from the start.

**3. Exact scope of code changes:**

- Configure the chosen test runner and test:unit script
- Add a passing CLI metadata/entrypoint smoke test
- Establish test discovery that fails on broken assertions and does not silently pass empty suites

**4. Files/modules likely involved:**

- `package.json`
- `unit-test runner configuration`
- `tests/unit/cli-bootstrap.test.ts`

**5. Required unit/integration tests:**

- CLI bootstrap test passes
- A temporary local negative assertion proves runner failure and is reverted before commit

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/cli-bootstrap.test.ts
pnpm run typecheck
git diff --check
```

Run the available repository baseline and record any not-yet-established lanes explicitly. Never install placeholder-green checks. Review the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Unit checks are meaningful and available for subsequent steps.

**8. Commit message:** `test: establish the unit verification harness`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S006, not an unscheduled expansion.

### S006 — Add nonmutating formatting and lint gates

**Contract anchors:** R17, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling).

**1. Step title:** Add nonmutating formatting and lint gates.

**2. Purpose:** Keep incremental changes readable without reformatting user-owned output implicitly.

**3. Exact scope of code changes:**

- Configure TypeScript/Svelte-aware lint and nonmutating format:check scripts
- Scope authoring checks separately from generated user files
- Preserve existing repo conventions where present

**4. Files/modules likely involved:**

- `package.json`
- `formatter configuration`
- `linter configuration`
- `tests/unit/tooling.test.ts`

**5. Required unit/integration tests:**

- Lint/typecheck current source
- Verify format check exits nonzero on an intentionally malformed temp fixture without rewriting it

**6. Verification commands:**

```sh
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run test:unit -- tests/unit/tooling.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Formatting and lint gates work without modifying application files.

**8. Commit message:** `build: add formatting and lint verification gates`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S007, not an unscheduled expansion.

### S007 — Add an SSR-enabled SvelteKit consumer fixture

**Contract anchors:** R20, R21, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Add an SSR-enabled SvelteKit consumer fixture.

**2. Purpose:** Make generated-code qualification use a real application rather than isolated snippets.

**3. Exact scope of code changes:**

- Create the minimal consumer fixture using selected versions
- Add fixture:check and fixture:build scripts
- Keep SSR enabled and separate fixture dependencies from CLI runtime dependencies

**4. Files/modules likely involved:**

- `tests/fixtures/consumer/`
- `package.json`
- `fixture package manifest and config`

**5. Required unit/integration tests:**

- Fixture Svelte check and production build pass
- A minimal server-rendered route is present without disabling SSR

**6. Verification commands:**

```sh
pnpm run fixture:check
pnpm run fixture:build
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** A reproducible real-app compile/build baseline is available.

**8. Commit message:** `test: add the ssr consumer qualification fixture`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S008, not an unscheduled expansion.

### S008 — Add the generated-app browser harness

**Contract anchors:** R21, R22, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Add the generated-app browser harness.

**2. Purpose:** Establish actual interaction assertions before implementing controls.

**3. Exact scope of code changes:**

- Configure browser tests and deterministic fixture startup/teardown
- Add focus/navigation and console-error smoke assertions
- Document local browser setup and supported initial lane

**4. Files/modules likely involved:**

- `browser-test configuration`
- `tests/browser/harness.spec.ts`
- `package.json`

**5. Required unit/integration tests:**

- Browser visits the real fixture and exercises keyboard focus
- Unexpected server/browser errors fail the test

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/harness.spec.ts
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The application can be tested in a browser with real assertions.

**8. Commit message:** `test: establish the consumer browser harness`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S009, not an unscheduled expansion.

### S009 — Add isolated filesystem and CLI integration helpers

**Contract anchors:** R15, R16, R29, R30, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Add isolated filesystem and CLI integration helpers.

**2. Purpose:** Support safe generation tests without using a developer project as the test target.

**3. Exact scope of code changes:**

- Add temp-root lifecycle, complete-tree snapshot and executable invocation helpers
- Add injectable asset/filesystem interfaces only as needed for tests
- Establish the integration test script

**4. Files/modules likely involved:**

- `tests/helpers/project.ts`
- `tests/helpers/tree-snapshot.ts`
- `tests/helpers/cli.ts`
- `tests/integration/harness.test.ts`
- `package.json`

**5. Required unit/integration tests:**

- Helpers preserve modes/text and clean only their owned temp directories
- Integration harness captures exit/stdout/stderr deterministically

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/harness.test.ts
pnpm run test:unit -- tests/unit/cli-bootstrap.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Later dry-run and transaction tests can observe all filesystem effects.

**8. Commit message:** `test: isolate cli and filesystem integration fixtures`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S010, not an unscheduled expansion.

### S010 — Document commands and add baseline CI

**Contract anchors:** R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria).

**1. Step title:** Document commands and add baseline CI.

**2. Purpose:** Prevent command-name guesses and keep every commit verifiable.

**3. Exact scope of code changes:**

- Record actual commands and valid feature/OS lanes in a target command map
- Add baseline CI for available format/lint/type/unit/fixture lanes
- Preserve conditional Cargo jobs where a Rust workspace applies

**4. Files/modules likely involved:**

- `implementation evidence/COMMANDS.md`
- `CI workflow configuration`
- `CONTRIBUTING.md`

**5. Required unit/integration tests:**

- Run the same baseline commands locally where available
- Validate workflow syntax and document remote-only lanes without claiming execution

**6. Verification commands:**

```sh
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run test:unit
pnpm run fixture:check
pnpm run fixture:build
# DISCOVER/VERIFY: Discover and run repository workflow validation
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Actual scripts and CI baseline are recorded; unrun remote checks stay explicit.

**8. Commit message:** `ci: qualify the initial verification lanes`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S011, not an unscheduled expansion.

### S011 — Qualify the pinned primitive integration boundary

**Contract anchors:** R03, R12, R20, R21, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model).

**1. Step title:** Qualify the pinned primitive integration boundary.

**2. Purpose:** Verify that selected upstream types support the promised Svelte wrapper model.

**3. Exact scope of code changes:**

- Add a compatibility fixture using Bits state/ref binding and delegated child structure
- Test selected versions without introducing public kit wrappers
- Record actual peer/type limitations and API source evidence

**4. Files/modules likely involved:**

- `tests/fixtures/consumer/src/lib/compatibility/`
- `tests/components/compatibility.test.ts`
- `implementation evidence/COMPATIBILITY.md`

**5. Required unit/integration tests:**

- Positive typed binding/ref/delegation cases compile
- Negative incompatible props fail type fixtures
- SSR/hydration smoke remains enabled

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/compatibility.test.ts # establish this real lane in this step
pnpm run fixture:check
pnpm run fixture:build
pnpm run test:browser -- tests/browser/harness.spec.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The pinned upstream boundary is proven before generator templates depend on it.

**8. Commit message:** `test: qualify the pinned svelte and bits boundary`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S012, not an unscheduled expansion.

### S012 — Separate orchestration and pure module interfaces

**Contract anchors:** R01, R02, R03, R15, R32, R33, R34. [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [PRODUCT_SPEC.md](#contract-specs-product-spec), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Separate orchestration and pure module interfaces.

**2. Purpose:** Keep command presentation, registry reading, planning and filesystem application distinct.

**3. Exact scope of code changes:**

- Introduce minimal typed boundary interfaces for project input, registry snapshot and planning outcome
- Extract bootstrap behavior behind CLI adapters
- Avoid speculative services or multiple npm packages

**4. Files/modules likely involved:**

- `src/cli/`
- `src/project/`
- `src/registry/`
- `src/codegen/`
- `tests/unit/boundaries.test.ts`

**5. Required unit/integration tests:**

- Pure interfaces are usable without filesystem writes
- Consumer fixture does not import CLI modules
- Typecheck detects boundary mistakes

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/boundaries.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Subsequent model work has small, enforceable module boundaries.

**8. Commit message:** `core: separate cli registry and codegen boundaries`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S013, not an unscheduled expansion.

## M02 — Versioned models, strict schemas, and registry resolution

### S013 — Model independent version identities

**Contract anchors:** R12, R32, R33, R34. [DATA_MODEL.md](#contract-specs-data-model).

**1. Step title:** Model independent version identities.

**2. Purpose:** Avoid copying the source framework/schema version coupling.

**3. Exact scope of code changes:**

- Define distinct schema/tool/registry/item/compatibility/CSS contract identities
- Add comparison/validation only for actual uses
- Record initial values as technical choices, not user-provided constants

**4. Files/modules likely involved:**

- `src/registry/versions.ts`
- `tests/unit/versions.test.ts`
- `specs/DATA_MODEL.md`

**5. Required unit/integration tests:**

- Changing a framework compatibility value does not imply schema migration
- Invalid independent identities receive typed errors

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/versions.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Version axes are represented independently throughout new types.

**8. Commit message:** `registry: separate schema package and compatibility versions`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S014, not an unscheduled expansion.

### S014 — Freeze and validate strict kit configuration

**Contract anchors:** R05, R09, R11, R12, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [DATA_MODEL.md](#contract-specs-data-model), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Freeze and validate strict kit configuration.

**2. Purpose:** Turn semantic configuration requirements into an explicit tested target schema.

**3. Exact scope of code changes:**

- Define exact supported config fields/default roots and schema identity without invented hosted URLs
- Add strict parsing and unknown-field diagnostics
- Keep source Leptos config incompatible by design

**4. Files/modules likely involved:**

- `schema/v1/kit.schema.json`
- `src/project/config.ts`
- `tests/unit/config.test.ts`
- `specs/DATA_MODEL.md`

**5. Required unit/integration tests:**

- Canonical/default config validates
- Unknown/legacy fields, bad types and unsupported schema versions fail
- No source framework version is reused as schema version

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/config.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** A frozen strict configuration schema exists for subsequent planners.

**8. Commit message:** `config: define the independent kit configuration schema`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S015, not an unscheduled expansion.

### S015 — Model explicit requested item sets

**Contract anchors:** R11, R26, R32, R33, R34. [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Model explicit requested item sets.

**2. Purpose:** Preserve user intent separately from dependency resolution.

**3. Exact scope of code changes:**

- Validate and normalize explicit request IDs deterministically
- Reject duplicates or normalize according to a documented exact rule
- Do not add transitive items to requested config

**4. Files/modules likely involved:**

- `src/project/requests.ts`
- `tests/unit/requests.test.ts`
- `schema/v1/kit.schema.json`

**5. Required unit/integration tests:**

- button alone remains the only explicit request after normalization
- Explicit spinner plus button is distinguishable from transitive spinner
- Invalid names are rejected

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/requests.test.ts
pnpm run test:unit -- tests/unit/config.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Requested roots have a standalone validated model.

**8. Commit message:** `config: preserve explicit component requests`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S016, not an unscheduled expansion.

### S016 — Define the registry-root schema

**Contract anchors:** R08, R12, R32, R33, R34. [ARCHITECTURE.md](#contract-specs-architecture), [DATA_MODEL.md](#contract-specs-data-model).

**1. Step title:** Define the registry-root schema.

**2. Purpose:** Give packaged inventory and compatibility a stable explicit contract.

**3. Exact scope of code changes:**

- Define root identity/version/digest and item-to-manifest mapping
- Validate unique item IDs and explicit manifest paths
- Add an empty but valid development registry without advertising missing components

**4. Files/modules likely involved:**

- `schema/v1/registry.schema.json`
- `src/registry/model.ts`
- `registry/registry.json`
- `tests/unit/registry-root.test.ts`

**5. Required unit/integration tests:**

- Empty/development and sample root fixtures validate
- Duplicate IDs, identity mismatch and malformed compatibility fail

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/registry-root.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Registry inventory is explicit and schema-validated.

**8. Commit message:** `registry: define the bundled inventory contract`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S017, not an unscheduled expansion.

### S017 — Define typed item targets and public exports

**Contract anchors:** R06, R07, R08, R32, R33, R34. [ARCHITECTURE.md](#contract-specs-architecture), [DATA_MODEL.md](#contract-specs-data-model), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling).

**1. Step title:** Define typed item targets and public exports.

**2. Purpose:** Avoid inferred filenames and symbol generation.

**3. Exact scope of code changes:**

- Define item identity/kind/version/source targets for Svelte and TypeScript
- Define explicit file-level exports and managed CSS block IDs
- Validate CSS-only foundation shape

**4. Files/modules likely involved:**

- `schema/v1/registry-item.schema.json`
- `src/registry/item.ts`
- `tests/unit/item-targets.test.ts`

**5. Required unit/integration tests:**

- Simple, compound and CSS-only sample items validate
- Wrong file kinds, duplicate local exports and malformed targets fail

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/item-targets.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The manifest can describe the approved generated tree without guessing.

**8. Commit message:** `registry: define component targets and export metadata`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S018, not an unscheduled expansion.

### S018 — Add accessibility and dependency manifest metadata

**Contract anchors:** R03, R10, R22, R30, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Add accessibility and dependency manifest metadata.

**2. Purpose:** Keep behavior obligations and dependencies alongside source assets.

**3. Exact scope of code changes:**

- Extend item schema with accessibility requirements, registry dependencies and npm plan entries
- Distinguish runtime/tooling/peer roles using a minimal documented model
- Keep metadata descriptive rather than executing hooks

**4. Files/modules likely involved:**

- `src/registry/item.ts`
- `schema/v1/registry-item.schema.json`
- `tests/unit/item-metadata.test.ts`

**5. Required unit/integration tests:**

- Required accessibility entries and dependency references parse
- Unknown roles, malformed ranges and duplicate conflicting declarations fail

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/item-metadata.test.ts
pnpm run test:unit -- tests/unit/item-targets.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Items carry their verification and installation obligations explicitly.

**8. Commit message:** `registry: attach accessibility and dependency contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S019, not an unscheduled expansion.

### S019 — Define source-file ownership lock records

**Contract anchors:** R11, R12, R13, R32, R33, R34. [DATA_MODEL.md](#contract-specs-data-model), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Define source-file ownership lock records.

**2. Purpose:** Persist truthful source lineage for customization-aware upgrades.

**3. Exact scope of code changes:**

- Define independent lock schema and per-file item owner/base digest records
- Represent requested/transitive origin and effective version provenance
- Validate owner uniqueness and any reverse indexes

**4. Files/modules likely involved:**

- `schema/v1/kit-lock.schema.json`
- `src/codegen/lock.ts`
- `tests/unit/lock-files.test.ts`

**5. Required unit/integration tests:**

- Valid source ownership round-trips
- Duplicate ownership, inconsistent indexes and malformed hashes fail
- Preserved base cannot silently become current local content

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/lock-files.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Source ownership can support the approved comparison model.

**8. Commit message:** `codegen: define source ownership and lineage records`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S020, not an unscheduled expansion.

### S020 — Add CSS-block and integration lock records

**Contract anchors:** R07, R13, R14, R17, R32, R33, R34. [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Add CSS-block and integration lock records.

**2. Purpose:** Track blocks independently from the aggregate stylesheet.

**3. Exact scope of code changes:**

- Add per-block ID/path/owner/base records
- Add stylesheet/export/integration provenance needed for safe planning
- Validate cross-item CSS ownership and reserved-state path overlap

**4. Files/modules likely involved:**

- `src/codegen/lock.ts`
- `schema/v1/kit-lock.schema.json`
- `tests/unit/lock-styles.test.ts`

**5. Required unit/integration tests:**

- Multiple owners in one CSS file remain distinguishable
- Duplicate block IDs and forged indexes fail
- Source and style version metadata cannot contradict their stored baselines

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/lock-styles.test.ts
pnpm run test:unit -- tests/unit/lock-files.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** An aggregate stylesheet no longer implies whole-file ownership.

**8. Commit message:** `codegen: track managed css blocks in install state`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S021, not an unscheduled expansion.

### S021 — Define portable theme and customization metadata schemas

**Contract anchors:** R07, R12, R23, R25, R32, R33, R34. [DATA_MODEL.md](#contract-specs-data-model), [STYLING.md](#contract-specs-styling).

**1. Step title:** Define portable theme and customization metadata schemas.

**2. Purpose:** Retain CSS contracts without copying Rust ABI constants.

**3. Exact scope of code changes:**

- Define semantic token, component customization and theme-integration records
- Separate their independent versions and actual layer/portal capabilities
- Reject Rust package/type identifiers in generated Svelte capability fixtures

**4. Files/modules likely involved:**

- `schema/v1/token-contract.schema.json`
- `schema/v1/component-customization.schema.json`
- `schema/v1/theme-integration.schema.json`
- `tests/unit/theme-metadata.test.ts`

**5. Required unit/integration tests:**

- Token/property roles and complete radius grammar metadata validate
- Inconsistent contract IDs/layers or source-only Rust ABI claims fail

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/theme-metadata.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Portable CSS metadata has explicit target schemas.

**8. Commit message:** `registry: define portable css contract metadata`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S022, not an unscheduled expansion.

### S022 — Freeze CLI envelopes and exit outcomes

**Contract anchors:** R09, R15, R30, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Freeze CLI envelopes and exit outcomes.

**2. Purpose:** Make automation behavior testable before command handlers grow.

**3. Exact scope of code changes:**

- Freeze result/diagnostic/change fields, status strings and numerical exit map with evidence
- Add safe logical locator and JSON serialization rules
- Keep protocol version separate from package/framework versions

**4. Files/modules likely involved:**

- `src/cli/protocol.ts`
- `schema/v1/command-envelope.schema.json`
- `tests/unit/protocol.test.ts`
- `specs/API_CONTRACTS.md`

**5. Required unit/integration tests:**

- Every status has a stable exit outcome
- Golden envelope fixtures contain one result and deterministic diagnostics
- Unsafe physical input is not exposed as a locator

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/protocol.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Command result semantics are frozen and fixture-tested.

**8. Commit message:** `cli: freeze structured outcomes and exit codes`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S023, not an unscheduled expansion.

### S023 — Parse only the approved CLI arguments

**Contract anchors:** R09, R15, R18, R30, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Parse only the approved CLI arguments.

**2. Purpose:** Reject unsupported commands and options before side effects.

**3. Exact scope of code changes:**

- Add typed argument parsing for approved commands/options
- Preserve one-item add/view shape and help/version
- Reject force/remove/auto-install/remote-registry options rather than quietly accepting them

**4. Files/modules likely involved:**

- `src/cli/args.ts`
- `tests/unit/args.test.ts`
- `src/cli/main.ts`

**5. Required unit/integration tests:**

- Missing values/unknown flags/invalid command combinations return protocol errors
- JSON option placement is handled consistently
- Parsing performs no project writes

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/args.test.ts
pnpm run test:unit -- tests/unit/protocol.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The executable has a constrained, testable command grammar.

**8. Commit message:** `cli: parse the approved command surface`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S024, not an unscheduled expansion.

### S024 — Implement exact-byte hashing and deterministic serialization

**Contract anchors:** R12, R13, R15, R32, R33, R34. [DATA_MODEL.md](#contract-specs-data-model), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Implement exact-byte hashing and deterministic serialization.

**2. Purpose:** Make ownership comparisons reproducible without rewriting user text.

**3. Exact scope of code changes:**

- Freeze hash algorithm and distinguish exact bytes from canonical semantic JSON
- Add deterministic ordering/serialization for generated metadata
- Preserve local line endings for preimages

**4. Files/modules likely involved:**

- `src/codegen/digest.ts`
- `src/codegen/serialize.ts`
- `tests/unit/digest.test.ts`
- `tests/unit/serialize.test.ts`

**5. Required unit/integration tests:**

- Known UTF-8 vectors and CRLF/LF distinction pass
- Equivalent unordered logical maps serialize identically
- No timestamps/random IDs enter semantic output

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/digest.test.ts
pnpm run test:unit -- tests/unit/serialize.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Hash meanings and canonical metadata bytes are unambiguous.

**8. Commit message:** `core: make digests and metadata output deterministic`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S025, not an unscheduled expansion.

### S025 — Load assets relative to the installed package

**Contract anchors:** R08, R16, R32, R33, R34. [ARCHITECTURE.md](#contract-specs-architecture), [DATA_MODEL.md](#contract-specs-data-model), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions).

**1. Step title:** Load assets relative to the installed package.

**2. Purpose:** Remove authoring-root and CWD dependencies from registry access.

**3. Exact scope of code changes:**

- Implement package-relative read-only asset provider
- Restrict it to validated logical registry/schema paths
- Make source-tree provider injectable only for tests/development, not a hidden runtime fallback

**4. Files/modules likely involved:**

- `src/registry/assets.ts`
- `tests/unit/assets.test.ts`
- `package build configuration`

**5. Required unit/integration tests:**

- Assets load from an isolated simulated installed package under a different CWD
- Traversal/missing/nontext asset errors are typed
- No fallback reads from the reference repo

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/assets.test.ts
pnpm run build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Registry access depends only on package assets.

**8. Commit message:** `registry: load assets from the installed package`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S026, not an unscheduled expansion.

### S026 — Build an immutable validated registry snapshot

**Contract anchors:** R08, R15, R32, R33, R34. [ARCHITECTURE.md](#contract-specs-architecture), [DATA_MODEL.md](#contract-specs-data-model), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Build an immutable validated registry snapshot.

**2. Purpose:** Prevent planning from observing changing authoring inputs.

**3. Exact scope of code changes:**

- Read and validate root/manifests/source bytes into one immutable operation snapshot
- Verify manifest identity and item paths
- Surface all required missing-asset errors before planning

**4. Files/modules likely involved:**

- `src/registry/load.ts`
- `tests/unit/registry-snapshot.test.ts`

**5. Required unit/integration tests:**

- Provider mutation after snapshot creation does not change resolved bytes
- Wrong item identity/missing schema/invalid manifest fails deterministically

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/registry-snapshot.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Each operation sees a consistent packaged registry.

**8. Commit message:** `registry: validate immutable asset snapshots`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S027, not an unscheduled expansion.

### S027 — Add full registry asset health validation

**Contract anchors:** R08, R26, R30, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model).

**1. Step title:** Add full registry asset health validation.

**2. Purpose:** Catch broken manifests and unreachable required assets during development and packing.

**3. Exact scope of code changes:**

- Validate schema/manifest/source/style relationships and qualified root inventory
- Distinguish unregistered candidate authoring assets from advertised complete items
- Establish test:registry script and explicit qualification inventory

**4. Files/modules likely involved:**

- `src/registry/validate.ts`
- `tests/registry/health.test.ts`
- `package.json`
- `registry/registry.json`

**5. Required unit/integration tests:**

- Advertised items cannot reference missing files or invalid blocks
- Candidate parts are not installable before root registration
- Packaged schema identities match parser expectations

**6. Verification commands:**

```sh
pnpm run test:registry -- tests/registry/health.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Registry health rejects incomplete published items without forcing monolithic authoring commits.

**8. Commit message:** `registry: validate qualified asset inventory health`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S028, not an unscheduled expansion.

### S028 — Resolve dependencies with cycle and missing-item diagnostics

**Contract anchors:** R08, R11, R15, R32, R33, R34. [ARCHITECTURE.md](#contract-specs-architecture), [DATA_MODEL.md](#contract-specs-data-model), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Resolve dependencies with cycle and missing-item diagnostics.

**2. Purpose:** Install the actual closure without recursive surprises.

**3. Exact scope of code changes:**

- Implement graph traversal with explicit cycle paths and unknown-item errors
- Do not perform writes while resolving
- Preserve registry identity in diagnostics

**4. Files/modules likely involved:**

- `src/registry/resolve.ts`
- `tests/unit/resolve-errors.test.ts`

**5. Required unit/integration tests:**

- Self-cycle/multinode cycle/missing dependency fail
- Diamond dependency resolves once
- Empty roots resolve safely

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/resolve-errors.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Dependency closure is validated before any project planning.

**8. Commit message:** `registry: resolve item graphs and reject cycles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S029, not an unscheduled expansion.

### S029 — Make closure and export order deterministic

**Contract anchors:** R06, R07, R11, R15, R32, R33, R34. [DATA_MODEL.md](#contract-specs-data-model), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [STYLING.md](#contract-specs-styling), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Make closure and export order deterministic.

**2. Purpose:** Eliminate filesystem or insertion-order churn from generated output.

**3. Exact scope of code changes:**

- Add stable dependency-before-dependent order with documented tie-breaking
- Normalize export and block order from explicit metadata
- Avoid reordering application-owned text

**4. Files/modules likely involved:**

- `src/registry/resolve.ts`
- `src/registry/order.ts`
- `tests/unit/resolve-order.test.ts`

**5. Required unit/integration tests:**

- Permuted root/manifests yield equivalent closure order
- Tokens precede dependent styles
- Repeated traversal yields byte-stable projections

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/resolve-order.test.ts
pnpm run test:registry -- tests/registry/health.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Equivalent inputs yield stable install order.

**8. Commit message:** `registry: stabilize dependency and export ordering`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S030, not an unscheduled expansion.

### S030 — Project requested versus transitive provenance

**Contract anchors:** R11, R18, R32, R33, R34. [DATA_MODEL.md](#contract-specs-data-model), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Project requested versus transitive provenance.

**2. Purpose:** Avoid the reference behavior of writing dependency closure into user config.

**3. Exact scope of code changes:**

- Attach root/transitive origin to resolved items
- Preserve explicit dependency requests separately
- Define retained/retired closure sets for later synchronization

**4. Files/modules likely involved:**

- `src/registry/projection.ts`
- `tests/unit/request-projection.test.ts`

**5. Required unit/integration tests:**

- button closure includes spinner/tokens but config roots stay button
- Removing button preserves explicitly requested spinner
- Shared dependencies remain while any root needs them

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/request-projection.test.ts
pnpm run test:unit -- tests/unit/resolve-order.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Desired intent and effective installed closure are distinct.

**8. Commit message:** `registry: retain requested and transitive provenance`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S031, not an unscheduled expansion.

### S031 — Merge compatible dependency requirements

**Contract anchors:** R10, R12, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [DATA_MODEL.md](#contract-specs-data-model).

**1. Step title:** Merge compatible dependency requirements.

**2. Purpose:** Produce one truthful npm plan from the selected closure.

**3. Exact scope of code changes:**

- Intersect requirements across items and preserve runtime/peer roles
- Reject incompatible ranges and source-kind conflicts
- Keep exact installed-resolution discovery separate

**4. Files/modules likely involved:**

- `src/registry/dependency-plan.ts`
- `tests/unit/dependency-plan.test.ts`

**5. Required unit/integration tests:**

- Compatible duplicate requirements coalesce
- Disjoint ranges fail with involved item IDs
- Peer requirements are not dropped when a module is not directly imported

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/dependency-plan.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Registry resolution can emit a consistent dependency plan.

**8. Commit message:** `registry: reconcile package and peer requirements`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S032, not an unscheduled expansion.

### S032 — Validate cross-item target and public symbol uniqueness

**Contract anchors:** R06, R08, R16, R32, R33, R34. [ARCHITECTURE.md](#contract-specs-architecture), [DATA_MODEL.md](#contract-specs-data-model), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions).

**1. Step title:** Validate cross-item target and public symbol uniqueness.

**2. Purpose:** Stop registry collisions before touching a consumer.

**3. Exact scope of code changes:**

- Validate resolved target ownership, CSS IDs and public exports across the graph
- Detect case-colliding paths even on case-sensitive development systems
- Keep qualified candidate items outside public collision claims until registered

**4. Files/modules likely involved:**

- `src/registry/validate-targets.ts`
- `tests/registry/targets.test.ts`

**5. Required unit/integration tests:**

- Two owners of one path/block/export fail
- ASCII case-folded collision fixtures fail
- Valid compound exports resolve to explicit files

**6. Verification commands:**

```sh
pnpm run test:registry -- tests/registry/targets.test.ts
pnpm run test:registry -- tests/registry/health.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Every advertised output has unambiguous ownership.

**8. Commit message:** `registry: reject conflicting output ownership`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S033, not an unscheduled expansion.

## M03 — Project detection, integration boundaries, and ownership planning

### S033 — Validate lexical logical paths

**Contract anchors:** R05, R16, R30, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions).

**1. Step title:** Validate lexical logical paths.

**2. Purpose:** Reject obvious escape paths before filesystem resolution.

**3. Exact scope of code changes:**

- Implement segment-aware relative-path validation for source/CSS/state targets
- Reject traversal, absolute and unsupported drive/UNC forms
- Preserve safe logical diagnostics

**4. Files/modules likely involved:**

- `src/project/paths.ts`
- `tests/unit/logical-paths.test.ts`

**5. Required unit/integration tests:**

- Traversal, separator/prefix confusion and invalid segments fail
- Valid nested UI paths pass
- Unsafe input is not emitted as an unsanitized locator

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/logical-paths.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Logical output paths are validated independently from filesystem state.

**8. Commit message:** `project: validate logical output paths`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S034, not an unscheduled expansion.

### S034 — Reject overlapping and reserved output roots

**Contract anchors:** R05, R16, R32, R33, R34. [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions).

**1. Step title:** Reject overlapping and reserved output roots.

**2. Purpose:** Keep generated source, metadata and stylesheet targets distinct.

**3. Exact scope of code changes:**

- Validate UI/state/style/export mapping relationships
- Reject targets inside reserved coordination paths or conflicting file/directory roles
- Add deterministic case-collision checks

**4. Files/modules likely involved:**

- `src/project/paths.ts`
- `tests/unit/path-overlap.test.ts`
- `src/project/config.ts`

**5. Required unit/integration tests:**

- CSS/config/export overlap fails before planning
- Prefix siblings are not incorrectly rejected
- Reserved state collisions fail across casing variants

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/path-overlap.test.ts
pnpm run test:unit -- tests/unit/config.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Normalized project roots cannot overwrite each other.

**8. Commit message:** `project: reject overlapping output and state targets`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S035, not an unscheduled expansion.

### S035 — Detect default SvelteKit application packages

**Contract anchors:** R05, R09, R15, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Detect default SvelteKit application packages.

**2. Purpose:** Implement the approved target before expanding configuration detection.

**3. Exact scope of code changes:**

- Read package and supported configuration evidence without executing arbitrary config
- Identify default src/lib and routes/style integration
- Return unsupported/ambiguous diagnostics for non-target projects

**4. Files/modules likely involved:**

- `src/project/detect.ts`
- `tests/integration/detect-default.test.ts`

**5. Required unit/integration tests:**

- Default consumer fixture is detected correctly
- Missing manifest/non-SvelteKit project fails clearly
- Detection creates no files

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/detect-default.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Project information has a supported default interpretation.

**8. Commit message:** `project: detect default sveltekit consumers`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S036, not an unscheduled expansion.

### S036 — Resolve explicit working directories in workspaces

**Contract anchors:** R09, R16, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions).

**1. Step title:** Resolve explicit working directories in workspaces.

**2. Purpose:** Support one selected app package without bulk workspace mutation.

**3. Exact scope of code changes:**

- Apply --cwd to an explicitly selected package root
- Reject ambiguous multi-package roots when no target is proven
- Protect the external reference worktree and sibling packages

**4. Files/modules likely involved:**

- `src/project/root.ts`
- `tests/integration/project-root.test.ts`
- `src/cli/args.ts`

**5. Required unit/integration tests:**

- Nested --cwd selects only its app
- Ambiguous workspace selection is read-only failure
- Symlink/root policy remains explicit for later filesystem validation

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/project-root.test.ts
pnpm run test:unit -- tests/unit/args.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The CLI never chooses or mutates unrelated workspace members.

**8. Commit message:** `project: scope commands to an explicit app package`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S037, not an unscheduled expansion.

### S037 — Freeze supported custom path mappings

**Contract anchors:** R05, R16, R17, R32, R33, R34. [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [STYLING.md](#contract-specs-styling).

**1. Step title:** Freeze supported custom path mappings.

**2. Purpose:** Resolve layout ambiguity conservatively rather than executing guessed config.

**3. Exact scope of code changes:**

- Define safe explicit custom UI/style/integration mappings supported by v1
- Resolve validated config paths relative to the selected package
- Document unsupported dynamic Svelte config and manual integration fallback

**4. Files/modules likely involved:**

- `src/project/config.ts`
- `src/project/detect.ts`
- `tests/integration/custom-paths.test.ts`
- `specs/GENERATED_LAYOUT.md`

**5. Required unit/integration tests:**

- Supported explicit path mappings work
- Dynamic/ambiguous mapping produces an actionable nonmutating diagnostic
- Existing config is not executed for discovery

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/custom-paths.test.ts
pnpm run test:unit -- tests/unit/path-overlap.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Supported customization is frozen and bounded.

**8. Commit message:** `project: bound explicit custom path support`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S038, not an unscheduled expansion.

### S038 — Inspect installed and declared dependency state

**Contract anchors:** R10, R12, R19, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [DATA_MODEL.md](#contract-specs-data-model).

**1. Step title:** Inspect installed and declared dependency state.

**2. Purpose:** Make info/doctor report actual compatibility rather than assumptions.

**3. Exact scope of code changes:**

- Read package declarations and selected package-manager metadata safely
- Distinguish declared, installed, missing and incompatible packages
- Avoid requiring hidden source checkout state

**4. Files/modules likely involved:**

- `src/project/dependencies.ts`
- `tests/integration/dependency-state.test.ts`

**5. Required unit/integration tests:**

- Missing install differs from missing declaration
- Installed incompatible version produces evidence-backed diagnostic
- Inspection does not mutate package/lock files

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/dependency-state.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Consumer dependency readiness is observable and typed.

**8. Commit message:** `project: inspect consumer dependency compatibility`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S039, not an unscheduled expansion.

### S039 — Validate peer dependencies in the consumer plan

**Contract anchors:** R10, R12, R20, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model).

**1. Step title:** Validate peer dependencies in the consumer plan.

**2. Purpose:** Prevent false readiness when Bits UI peers are absent or incompatible.

**3. Exact scope of code changes:**

- Combine resolved registry requirements with actual selected peer metadata
- Diagnose peer conflicts without silently adding dependencies
- Record exact compatibility evidence in fixture

**4. Files/modules likely involved:**

- `src/project/dependencies.ts`
- `tests/integration/peer-dependencies.test.ts`
- `implementation evidence/COMPATIBILITY.md`

**5. Required unit/integration tests:**

- Required date/Svelte peers are assessed according to actual metadata
- A peer unused by a particular wrapper is not automatically ignored
- Compatible installed peers pass

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/peer-dependencies.test.ts
pnpm run test:unit -- tests/unit/dependency-plan.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Dependency planning honors the full selected upstream contract.

**8. Commit message:** `project: validate primitive peer requirements`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S040, not an unscheduled expansion.

### S040 — Render dependency instructions without execution

**Contract anchors:** R09, R10, R15, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Render dependency instructions without execution.

**2. Purpose:** Keep package-manager changes explicit and outside the generator transaction.

**3. Exact scope of code changes:**

- Render an appropriate installation command for the detected manager
- Separate consumer runtime/peer from CLI tooling requirements
- Make no shell execution or package-manifest writes from reporting

**4. Files/modules likely involved:**

- `src/project/dependency-instructions.ts`
- `tests/integration/dependency-instructions.test.ts`

**5. Required unit/integration tests:**

- Instructions match fixture manager and requirements
- Commands are safely quoted/formatted
- Complete-tree snapshots prove no package/lock/node_modules changes

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/dependency-instructions.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Users receive actionable dependency plans without implicit installs.

**8. Commit message:** `project: report explicit dependency installation plans`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S041, not an unscheduled expansion.

### S041 — Capture read-only project snapshots

**Contract anchors:** R13, R15, R16, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Capture read-only project snapshots.

**2. Purpose:** Provide reliable preimages for planning and later revalidation.

**3. Exact scope of code changes:**

- Read exact source/CSS/config/lock/layout bytes and file kinds into observations
- Represent absence distinctly from empty content
- Keep snapshots and diagnostics free from writes

**4. Files/modules likely involved:**

- `src/codegen/snapshot.ts`
- `tests/integration/snapshot.test.ts`

**5. Required unit/integration tests:**

- Absent/empty/CRLF/nonregular observations remain distinct
- Concurrent later changes do not mutate an already captured snapshot
- Snapshotting leaves the tree unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/snapshot.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Planners can reason about a stable read-only preimage.

**8. Commit message:** `codegen: capture immutable project observations`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S042, not an unscheduled expansion.

### S042 — Validate filesystem ancestry and symlinks

**Contract anchors:** R16, R24, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [STYLING.md](#contract-specs-styling).

**1. Step title:** Validate filesystem ancestry and symlinks.

**2. Purpose:** Extend lexical safety to actual filesystem targets.

**3. Exact scope of code changes:**

- Inspect target ancestry and reject unsupported symlinks/nonregular paths
- Freeze documented trusted-local race limits
- Preserve validated physical root identity for subsequent rechecks

**4. Files/modules likely involved:**

- `src/project/filesystem-paths.ts`
- `tests/integration/filesystem-paths.test.ts`
- `specs/SECURITY_AND_TRANSACTIONS.md`

**5. Required unit/integration tests:**

- Parent link outside root, broken link and directory-at-file-target fail
- Valid existing/new descendants pass
- Platform-specific cases are documented and run where supported

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/filesystem-paths.test.ts
pnpm run test:unit -- tests/unit/logical-paths.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Filesystem path safety has explicit tests and bounded claims.

**8. Commit message:** `codegen: guard target ancestry and symlink paths`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S043, not an unscheduled expansion.

### S043 — Freeze the complete ownership disposition matrix

**Contract anchors:** R13, R14, R18, R19, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Freeze the complete ownership disposition matrix.

**2. Purpose:** Resolve missing/adoption/cohort ambiguities before writing comparison code.

**3. Exact scope of code changes:**

- Record the B/L/I table including missing tracked targets and identical untracked files
- Freeze no-silent-adoption/deletion rights and truthful baseline rules
- Add data-driven policy fixtures reviewed against the spec

**4. Files/modules likely involved:**

- `specs/SYNCHRONIZATION.md`
- `tests/fixtures/ownership-cases.json`
- `tests/unit/ownership-policy.test.ts`

**5. Required unit/integration tests:**

- Every equality/absence/ownership case has exactly one expected disposition
- No case grants overwrite of custom content
- Fixtures explicitly cover local=incoming

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/ownership-policy.test.ts
pnpm run format:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Ownership behavior is explicit before implementation, with unresolved Q08 closed or blocking.

**8. Commit message:** `spec: freeze customization and missing-target dispositions`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S044, not an unscheduled expansion.

### S044 — Implement source base/local/incoming classification

**Contract anchors:** R13, R15, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Implement source base/local/incoming classification.

**2. Purpose:** Protect source edits while allowing safe upstream changes.

**3. Exact scope of code changes:**

- Implement pure per-source classification using frozen ownership cases
- Preserve exact-byte baseline semantics
- Return conflict/customized/satisfied/update dispositions without writes

**4. Files/modules likely involved:**

- `src/codegen/compare.ts`
- `tests/unit/source-compare.test.ts`

**5. Required unit/integration tests:**

- All policy fixtures pass including equality precedence
- Local-only edit preserves base
- Both-different case reports conflict with no plan mutation

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/source-compare.test.ts
pnpm run test:unit -- tests/unit/ownership-policy.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Source update decisions match the approved three-way policy.

**8. Commit message:** `codegen: classify source ownership with three-way comparison`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S045, not an unscheduled expansion.

### S045 — Plan missing and untracked source targets

**Contract anchors:** R13, R15, R18, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Plan missing and untracked source targets.

**2. Purpose:** Handle absence and collisions without confusing them with safe generated updates.

**3. Exact scope of code changes:**

- Apply the frozen missing-target policy with visible restore/conflict records
- Reject untracked conflicting files and enforce explicit adoption rule
- Preserve user deletion intent through clear diagnostics

**4. Files/modules likely involved:**

- `src/codegen/source-targets.ts`
- `tests/integration/source-targets.test.ts`

**5. Required unit/integration tests:**

- Missing tracked target is handled exactly as frozen
- Existing untracked equal/different sources retain documented rights
- No filesystem writes occur

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/source-targets.test.ts
pnpm run test:unit -- tests/unit/source-compare.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Every source target has an explicit, safe ownership disposition.

**8. Commit message:** `codegen: plan absent and application-owned source targets`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S046, not an unscheduled expansion.

### S046 — Plan source retirement with retained customization

**Contract anchors:** R11, R13, R18, R32, R33, R34. [DATA_MODEL.md](#contract-specs-data-model), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Plan source retirement with retained customization.

**2. Purpose:** Make removal safe without introducing an unapproved remove command.

**3. Exact scope of code changes:**

- Classify retired files from the recalculated request closure
- Delete only clean owned targets when policy permits
- Retain customized files with truthful detached ownership and diagnostics

**4. Files/modules likely involved:**

- `src/codegen/retire.ts`
- `tests/integration/source-retirement.test.ts`

**5. Required unit/integration tests:**

- Shared required dependency remains
- Clean retired file and customized retired file get different actions
- Re-adding a retained file does not silently reacquire deletion rights

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/source-retirement.test.ts
pnpm run test:unit -- tests/unit/request-projection.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Configuration-driven retirement preserves application work.

**8. Commit message:** `codegen: retain customized source during retirement`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S047, not an unscheduled expansion.

### S047 — Assemble source-file change plans

**Contract anchors:** R06, R13, R15, R32, R33, R34. [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Assemble source-file change plans.

**2. Purpose:** Aggregate source decisions without bypassing ownership guards.

**3. Exact scope of code changes:**

- Build deterministic source change records and produced bytes for resolved items
- Validate owners/paths and collect all conflicts before any apply
- Preserve candidate and installed lineage separately

**4. Files/modules likely involved:**

- `src/codegen/source-plan.ts`
- `tests/integration/source-plan.test.ts`

**5. Required unit/integration tests:**

- Safe multi-file item yields stable plan
- One conflicting file prevents an executable batch
- Multiple diagnostics retain deterministic order

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/source-plan.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Source planning is complete, pure and inspectable.

**8. Commit message:** `codegen: assemble deterministic source change plans`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S048, not an unscheduled expansion.

### S048 — Parse managed CSS markers without whole-file ownership

**Contract anchors:** R07, R13, R17, R32, R33, R34. [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Parse managed CSS markers without whole-file ownership.

**2. Purpose:** Find reliable block boundaries while preserving unrelated CSS.

**3. Exact scope of code changes:**

- Implement exact start/end grammar and scanner behavior for strings/comments
- Reject duplicate, unmatched and nested marker structures
- Retain precise spans and unmanaged byte regions

**4. Files/modules likely involved:**

- `src/codegen/css-parse.ts`
- `tests/unit/css-markers.test.ts`

**5. Required unit/integration tests:**

- Quoted marker-like text does not create a block
- Malformed/duplicate marker fixtures fail
- CRLF/comments/unmanaged bytes remain intact

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/css-markers.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Managed block boundaries are safe and explicit.

**8. Commit message:** `codegen: parse managed css block boundaries`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S049, not an unscheduled expansion.

### S049 — Apply three-way classification to CSS blocks

**Contract anchors:** R07, R13, R19, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [STYLING.md](#contract-specs-styling), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Apply three-way classification to CSS blocks.

**2. Purpose:** Preserve local styling independently of other installed blocks.

**3. Exact scope of code changes:**

- Use block-level base/local/incoming comparison and owner records
- Report customized versus conflicted blocks distinctly
- Do not hash the whole stylesheet as one owned asset

**4. Files/modules likely involved:**

- `src/codegen/css-compare.ts`
- `tests/unit/css-compare.test.ts`

**5. Required unit/integration tests:**

- All B/L/I combinations match source policy
- Editing one block does not mark unrelated blocks modified
- Missing/untracked block cases follow frozen rules

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/css-compare.test.ts
pnpm run test:unit -- tests/unit/css-markers.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** CSS updates have the same customization guarantees as source.

**8. Commit message:** `codegen: compare css block lineage independently`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S050, not an unscheduled expansion.

### S050 — Compose stable stylesheet patches

**Contract anchors:** R07, R15, R17, R32, R33, R34. [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [STYLING.md](#contract-specs-styling), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Compose stable stylesheet patches.

**2. Purpose:** Install ordered blocks without changing application CSS.

**3. Exact scope of code changes:**

- Insert/update managed spans from safe block decisions
- Put foundation layer declaration before dependent blocks
- Preserve unmanaged text exactly and avoid a formatter pass

**4. Files/modules likely involved:**

- `src/codegen/css.ts`
- `tests/integration/css-patch.test.ts`

**5. Required unit/integration tests:**

- Permuted item input yields stable managed output
- Repeated patch is byte-idempotent
- Leading/trailing/interleaved application CSS survives unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/css-patch.test.ts
pnpm run test:unit -- tests/unit/css-compare.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** One aggregate stylesheet can be safely reconciled.

**8. Commit message:** `codegen: preserve unmanaged css while ordering kit blocks`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S051, not an unscheduled expansion.

### S051 — Retire CSS blocks without deleting custom rules

**Contract anchors:** R13, R17, R18, R32, R33, R34. [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Retire CSS blocks without deleting custom rules.

**2. Purpose:** Keep stylesheet retirement consistent with source ownership.

**3. Exact scope of code changes:**

- Remove only clean obsolete owned blocks
- Preserve customized retired CSS as explicitly application-owned text
- Keep malformed/ambiguous retirement nonmutating

**4. Files/modules likely involved:**

- `src/codegen/css-retire.ts`
- `tests/integration/css-retirement.test.ts`

**5. Required unit/integration tests:**

- Clean/edited/shared-needed block retirement cases pass
- Retained custom CSS is not silently reowned on add
- Unmanaged neighbors remain byte-identical

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/css-retirement.test.ts
pnpm run test:integration -- tests/integration/source-retirement.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Retirement does not erase custom design work.

**8. Commit message:** `codegen: preserve customized css during retirement`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S052, not an unscheduled expansion.

### S052 — Freeze and parse managed TypeScript export regions

**Contract anchors:** R06, R16, R17, R32, R33, R34. [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [STYLING.md](#contract-specs-styling).

**1. Step title:** Freeze and parse managed TypeScript export regions.

**2. Purpose:** Translate Rust module patching into a safe target-specific barrel policy.

**3. Exact scope of code changes:**

- Freeze exact TS marker syntax separately from CSS markers
- Parse/locate region and inspect application export declarations
- Reject duplicate/ambiguous regions and symbol collisions

**4. Files/modules likely involved:**

- `src/codegen/export-parse.ts`
- `specs/GENERATED_LAYOUT.md`
- `tests/unit/export-regions.test.ts`

**5. Required unit/integration tests:**

- Existing comments/imports/aliases remain identifiable
- Duplicate regions and app-owned symbol conflicts fail
- Marker-free untracked barrel follows explicit ownership policy

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/export-regions.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Barrel patching has a tested structural boundary.

**8. Commit message:** `codegen: define managed typescript export regions`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S053, not an unscheduled expansion.

### S053 — Generate the root UI export region

**Contract anchors:** R02, R06, R17, R32, R33, R34. [ARCHITECTURE.md](#contract-specs-architecture), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling).

**1. Step title:** Generate the root UI export region.

**2. Purpose:** Expose declared flat names without import cycles or accidental aliases.

**3. Exact scope of code changes:**

- Render source/value/type exports from manifest declarations
- Patch only the managed root region
- Use direct relative targets and preserve unrelated exports

**4. Files/modules likely involved:**

- `src/codegen/exports.ts`
- `tests/integration/root-exports.test.ts`

**5. Required unit/integration tests:**

- Button/compound sample exports use exact declared names
- Same export plan is idempotent
- App-owned duplicate symbol causes a nonmutating conflict

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/root-exports.test.ts
pnpm run test:unit -- tests/unit/export-regions.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Root public exports are deterministic and ownership-safe.

**8. Commit message:** `codegen: generate the flat ui export surface`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S054, not an unscheduled expansion.

### S054 — Generate compound barrels and validate sibling imports

**Contract anchors:** R02, R06, R17, R32, R33, R34. [ARCHITECTURE.md](#contract-specs-architecture), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling).

**1. Step title:** Generate compound barrels and validate sibling imports.

**2. Purpose:** Preserve the approved hybrid layout rather than folderizing every item.

**3. Exact scope of code changes:**

- Render compound index.ts from declared part exports
- Reject internal imports through root UI barrel
- Avoid generating unnecessary parent components/index.ts

**4. Files/modules likely involved:**

- `src/codegen/exports.ts`
- `tests/integration/compound-exports.test.ts`

**5. Required unit/integration tests:**

- Simple and compound fixtures produce different correct shapes
- Sibling imports resolve without root-barrel cycles
- No unrequested parent barrel is created

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/compound-exports.test.ts
pnpm run test:integration -- tests/integration/root-exports.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Compound exports match the intended layout and dependency direction.

**8. Commit message:** `codegen: qualify compound barrels and sibling imports`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S055, not an unscheduled expansion.

### S055 — Identify safe Svelte layout edit spans

**Contract anchors:** R17, R20, R21, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling).

**1. Step title:** Identify safe Svelte layout edit spans.

**2. Purpose:** Avoid regex replacement of route scripts and rendering.

**3. Exact scope of code changes:**

- Use pinned Svelte parser to classify instance/module/no-script layouts
- Return precise supported insertion spans
- Diagnose unsupported/ambiguous syntax without mutation

**4. Files/modules likely involved:**

- `src/codegen/svelte-parse.ts`
- `tests/unit/svelte-layout-parse.test.ts`

**5. Required unit/integration tests:**

- No script, TS instance script, module script and comments parse
- Unsupported fixture yields typed guidance
- Source bytes remain unchanged during inspection

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/svelte-layout-parse.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Integration knows where a safe minimal import edit can occur.

**8. Commit message:** `codegen: identify safe svelte layout integration spans`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S056, not an unscheduled expansion.

### S056 — Patch ordered stylesheet imports minimally

**Contract anchors:** R05, R17, R23, R32, R33, R34. [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling).

**1. Step title:** Patch ordered stylesheet imports minimally.

**2. Purpose:** Load kit/theme/app CSS without replacing application layout behavior.

**3. Exact scope of code changes:**

- Insert only missing approved imports into the supported instance script
- Preserve existing imports/comments/children rendering
- Resolve relative paths from configured supported roots and detect unsafe reorder cases

**4. Files/modules likely involved:**

- `src/codegen/svelte.ts`
- `tests/integration/layout-imports.test.ts`

**5. Required unit/integration tests:**

- Default and explicit-path fixtures load kit before themes before app
- Repeated patch is unchanged
- Existing route rendering and module script survive
- Ambiguous order/integration is reported safely

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/layout-imports.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Styles integrate without destructive layout replacement.

**8. Commit message:** `codegen: insert ordered css imports without replacing layouts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S057, not an unscheduled expansion.

### S057 — Build a pure initialization plan

**Contract anchors:** R05, R09, R15, R17, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [STYLING.md](#contract-specs-styling), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Build a pure initialization plan.

**2. Purpose:** Combine validated config and minimal integration without installing an implicit catalog.

**3. Exact scope of code changes:**

- Plan absent config/export/CSS/integration targets and initial lock
- Preserve existing themes/app CSS
- Include every initialization effect in the plan and no hidden writes

**4. Files/modules likely involved:**

- `src/codegen/plan-init.ts`
- `tests/integration/plan-init.test.ts`

**5. Required unit/integration tests:**

- Empty supported app yields explicit minimal targets
- Existing application styles/layout remain preserved
- Init does not install unrequested component sources

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/plan-init.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Initialization can be inspected before transactions exist.

**8. Commit message:** `codegen: plan initialization without side effects`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S058, not an unscheduled expansion.

### S058 — Build a pure add-request plan

**Contract anchors:** R09, R10, R11, R15, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [DATA_MODEL.md](#contract-specs-data-model), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Build a pure add-request plan.

**2. Purpose:** Add one requested item and its closure without mutating intent during resolution.

**3. Exact scope of code changes:**

- Combine init prerequisites with explicit root addition and resolved source/CSS/export plan
- Include dependency instructions as data only
- Keep conflicts from modifying kit.json independently

**4. Files/modules likely involved:**

- `src/codegen/plan-add.ts`
- `tests/integration/plan-add.test.ts`

**5. Required unit/integration tests:**

- Sample button adds spinner/tokens transitively only
- Repeated add creates no duplicate request/block/export
- Source/CSS conflict prevents executable config-only change

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/plan-add.test.ts
pnpm run test:integration -- tests/integration/plan-init.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Add produces one coherent proposed batch.

**8. Commit message:** `codegen: plan explicit additions with dependency closure`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S059, not an unscheduled expansion.

### S059 — Enforce source-style compatibility cohorts

**Contract anchors:** R13, R14, R15, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Enforce source-style compatibility cohorts.

**2. Purpose:** Prevent locally edited members from being stranded by related upstream changes.

**3. Exact scope of code changes:**

- Freeze conservative cohort rules with examples resolving Q09
- Implement component source/CSS/export group safety and dependency expansion when justified
- Stop genuinely unsafe mixed updates rather than guessing semantic compatibility

**4. Files/modules likely involved:**

- `src/codegen/cohorts.ts`
- `tests/unit/cohorts.test.ts`
- `specs/SYNCHRONIZATION.md`

**5. Required unit/integration tests:**

- Conflict in source blocks CSS update and vice versa
- Locally edited/upstream-unchanged member plus coupled changed member is handled conservatively
- Unrelated unchanged components do not create false conflicts

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/cohorts.test.ts
pnpm run test:integration -- tests/integration/plan-add.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** A batch cannot update only half of a compatible component unit.

**8. Commit message:** `codegen: guard source and style compatibility cohorts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S060, not an unscheduled expansion.

### S060 — Build the full synchronization plan

**Contract anchors:** R09, R11, R13, R14, R15, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [DATA_MODEL.md](#contract-specs-data-model), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Build the full synchronization plan.

**2. Purpose:** Reconcile desired roots with incoming registry through approved ownership policy.

**3. Exact scope of code changes:**

- Resolve desired config, compare all source/style targets and assemble exports/integration
- Apply cohort policy before exposing an executable plan
- Collect deterministic diagnostics for all affected units

**4. Files/modules likely involved:**

- `src/codegen/plan-sync.ts`
- `tests/integration/plan-sync.test.ts`

**5. Required unit/integration tests:**

- Untouched upgrade, local-only customization, real conflict and already-incoming fixtures pass
- Conflicts leave all project state unchanged
- Requested roots remain separate from closure

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/plan-sync.test.ts
pnpm run test:unit -- tests/unit/cohorts.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Sync is a complete read-only reconciliation operation.

**8. Commit message:** `codegen: plan customization-aware synchronization`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S061, not an unscheduled expansion.

### S061 — Project truthful final lock lineage

**Contract anchors:** R12, R13, R14, R15, R32, R33, R34. [DATA_MODEL.md](#contract-specs-data-model), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Project truthful final lock lineage.

**2. Purpose:** Prevent preserved customizations from being labeled fully updated.

**3. Exact scope of code changes:**

- Generate lock state from effective target dispositions rather than incoming versions alone
- Preserve legitimate base hashes and record metadata-only transitions explicitly
- Validate indexes and schema before publication planning

**4. Files/modules likely involved:**

- `src/codegen/lock-projection.ts`
- `tests/integration/lock-projection.test.ts`

**5. Required unit/integration tests:**

- Preserved custom source keeps prior base
- Adopted incoming targets advance only their valid lineage
- Mixed cohort state cannot falsely claim complete update
- Second sync is semantically unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/lock-projection.test.ts
pnpm run test:integration -- tests/integration/plan-sync.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Lock metadata accurately describes installed effective state.

**8. Commit message:** `codegen: preserve truthful lineage in planned lock state`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S062, not an unscheduled expansion.

### S062 — Integrate configuration-driven retirement

**Contract anchors:** R11, R17, R18, R32, R33, R34. [DATA_MODEL.md](#contract-specs-data-model), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Integrate configuration-driven retirement.

**2. Purpose:** Finish reconciliation without losing shared dependencies or customized assets.

**3. Exact scope of code changes:**

- Compose source/CSS/export retirement with recalculated closure
- Keep customized retired files/rules app-owned and report leftovers
- Do not rewrite arbitrary application imports or add a remove command

**4. Files/modules likely involved:**

- `src/codegen/plan-sync.ts`
- `src/codegen/retire.ts`
- `tests/integration/plan-retirement.test.ts`

**5. Required unit/integration tests:**

- Removed root with shared dependency retains the dependency
- Clean removed item retires safely
- Edited removed item is retained and not falsely tracked as current
- User exports/imports are not silently erased

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/plan-retirement.test.ts
pnpm run test:integration -- tests/integration/lock-projection.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Removal via desired config has a safe complete plan.

**8. Commit message:** `codegen: reconcile retired items without deleting custom work`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S063, not an unscheduled expansion.

### S063 — Qualify deterministic zero-write planning

**Contract anchors:** R10, R15, R30, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Qualify deterministic zero-write planning.

**2. Purpose:** Make plan purity and idempotence an enforceable contract.

**3. Exact scope of code changes:**

- Snapshot complete trees around init/add/sync planning and all conflict cases
- Normalize semantic change ordering without hiding content changes
- Ensure planning never starts writer coordination or package manager work

**4. Files/modules likely involved:**

- `tests/integration/plan-purity.test.ts`
- `src/codegen/plan.ts`

**5. Required unit/integration tests:**

- No hidden files/mode changes appear in dry planning
- Equivalent logical inputs yield identical envelopes/plans
- Repeated satisfied plan is no_change

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/plan-purity.test.ts
pnpm run test:integration -- tests/integration/plan-sync.test.ts
pnpm run test:unit
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Pure planning is proven before mutation commands are wired.

**8. Commit message:** `test: prove deterministic side-effect-free planning`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S064, not an unscheduled expansion.

## M04 — Guarded transactions and recovery

### S064 — Freeze transaction states and safety assumptions

**Contract anchors:** R15, R16, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Freeze transaction states and safety assumptions.

**2. Purpose:** Define recovery correctness before exposing any mutating commands.

**3. Exact scope of code changes:**

- Specify writer coordination, prepared/applied/published/cleanup states and failure dispositions
- Document trusted-local threat model and actual platform limits
- Freeze owned transient paths and ignore policy without changing consumer semantic metadata

**4. Files/modules likely involved:**

- `specs/SECURITY_AND_TRANSACTIONS.md`
- `src/codegen/transaction-types.ts`
- `tests/unit/transaction-state.test.ts`

**5. Required unit/integration tests:**

- State transition table rejects impossible/ambiguous outcomes
- Exact-byte lock equality is not treated as a unique transaction identity
- Dry-run paths have no transition into mutation

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/transaction-state.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The recoverable transaction contract is explicit and reviewable.

**8. Commit message:** `spec: define recoverable transaction state transitions`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S065, not an unscheduled expansion.

### S065 — Validate transient coordination and journal records

**Contract anchors:** R16, R30, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions).

**1. Step title:** Validate transient coordination and journal records.

**2. Purpose:** Make recovery inputs as strict as committed lock metadata.

**3. Exact scope of code changes:**

- Implement strict internal journal/coordination parsing and identity checks
- Validate every journal target against approved roots and owner records
- Reject corrupt/unknown state before any restoration

**4. Files/modules likely involved:**

- `src/codegen/transaction-journal.ts`
- `tests/unit/transaction-journal.test.ts`

**5. Required unit/integration tests:**

- Valid journal round-trips
- Forged path/duplicate target/bad digest/unknown state fails
- Internal transient fields do not leak into semantic CLI output

**6. Verification commands:**

```sh
pnpm run test:unit -- tests/unit/transaction-journal.test.ts
pnpm run test:unit -- tests/unit/transaction-state.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Recovery can only operate on valid owned transaction state.

**8. Commit message:** `codegen: validate transient transaction records`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S066, not an unscheduled expansion.

### S066 — Implement exclusive writer coordination

**Contract anchors:** R15, R16, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Implement exclusive writer coordination.

**2. Purpose:** Serialize mutation without making read-only commands write locks.

**3. Exact scope of code changes:**

- Acquire/release one cooperative writer lock using documented platform-safe primitives
- Define contention/stale-owner behavior without age-only deletion
- Keep snapshot/read-only code independent from lock acquisition

**4. Files/modules likely involved:**

- `src/codegen/write-lock.ts`
- `tests/integration/write-lock.test.ts`

**5. Required unit/integration tests:**

- Second cooperative writer cannot enter mutation
- Read-only commands create no coordination state
- Ambiguous stale lock is not silently removed
- Owned lock cleanup is bounded

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/write-lock.test.ts
pnpm run test:integration -- tests/integration/plan-purity.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** One writer can safely own the mutation phase.

**8. Commit message:** `codegen: coordinate exclusive project writers`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S067, not an unscheduled expansion.

### S067 — Revalidate planned preimages under coordination

**Contract anchors:** R13, R16, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Revalidate planned preimages under coordination.

**2. Purpose:** Refuse stale plans before they replace user changes.

**3. Exact scope of code changes:**

- Compare file kinds/content/ancestry and relevant config/lock observations after writer acquisition
- Invalidate changed plans rather than silently replanning mid-transaction
- Surface safe stale-plan diagnostics

**4. Files/modules likely involved:**

- `src/codegen/revalidate.ts`
- `tests/integration/revalidate.test.ts`

**5. Required unit/integration tests:**

- Source/config/CSS changes after planning fail before staging
- Symlink/ancestor replacement is detected within documented threat model
- Unchanged preimages pass

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/revalidate.test.ts
pnpm run test:integration -- tests/integration/filesystem-paths.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Mutation begins only from the observed safe input state.

**8. Commit message:** `codegen: reject stale or unsafe plan preimages`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S068, not an unscheduled expansion.

### S068 — Stage replacement bytes with owned temporary files

**Contract anchors:** R16, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions).

**1. Step title:** Stage replacement bytes with owned temporary files.

**2. Purpose:** Prepare writes without truncating live application files.

**3. Exact scope of code changes:**

- Stage exact new bytes in approved same-filesystem locations
- Preserve appropriate file modes and track only owned temporary files
- Return explicit staging failures without touching live targets

**4. Files/modules likely involved:**

- `src/codegen/stage.ts`
- `tests/integration/staging.test.ts`

**5. Required unit/integration tests:**

- Staged bytes/digests match plans
- Permission/disk/write failures leave live files unchanged
- Cleanup cannot delete unrelated temp files
- New directories follow path policy

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/staging.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** A replacement batch can be prepared safely before application.

**8. Commit message:** `codegen: stage exact replacement content safely`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S069, not an unscheduled expansion.

### S069 — Persist recoverable prepared-state journals

**Contract anchors:** R13, R16, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Persist recoverable prepared-state journals.

**2. Purpose:** Make interruption survivable independently of process cleanup.

**3. Exact scope of code changes:**

- Record required preimages/backups and staged identifiers before live replacement
- Implement documented flush/durability ordering for supported platforms
- Keep transient recovery history separate from a merge-history feature

**4. Files/modules likely involved:**

- `src/codegen/transaction-journal.ts`
- `src/codegen/stage.ts`
- `tests/integration/journal-preparation.test.ts`

**5. Required unit/integration tests:**

- Failure before prepared publication leaves no live changes
- Restart after preparation identifies exact owned staging
- Missing/invalid backup refuses unsafe recovery

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/journal-preparation.test.ts
pnpm run test:unit -- tests/unit/transaction-journal.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Prepared batches have enough evidence for safe recovery.

**8. Commit message:** `codegen: persist prepared transaction recovery evidence`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S070, not an unscheduled expansion.

### S070 — Apply per-file replacements with recorded progress

**Contract anchors:** R16, R18, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Apply per-file replacements with recorded progress.

**2. Purpose:** Perform multi-file changes through one observable recovery protocol.

**3. Exact scope of code changes:**

- Replace/create/retire planned targets in documented order with atomic per-file operations where supported
- Record progress so interrupted mixed state is detectable
- Do not publish final install lock in this step

**4. Files/modules likely involved:**

- `src/codegen/replace.ts`
- `tests/integration/replacement.test.ts`

**5. Required unit/integration tests:**

- Failure at each replacement boundary is represented correctly
- File modes and preserved neighbors remain correct
- Retirement follows exact ownership decisions
- No native multi-file atomicity claim is made

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/replacement.test.ts
pnpm run test:integration -- tests/integration/journal-preparation.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Live replacements are journaled and individually safe within the stated model.

**8. Commit message:** `codegen: apply journaled file replacements`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S071, not an unscheduled expansion.

### S071 — Publish the canonical install lock last

**Contract anchors:** R12, R13, R16, R32, R33, R34. [DATA_MODEL.md](#contract-specs-data-model), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Publish the canonical install lock last.

**2. Purpose:** Make effective installation state the final batch publication.

**3. Exact scope of code changes:**

- Validate final lock against applied plan before replacement
- Publish it after source/CSS/config/export/layout targets
- Distinguish metadata-only and unchanged-byte publication with transaction identity

**4. Files/modules likely involved:**

- `src/codegen/publish-lock.ts`
- `tests/integration/lock-publication.test.ts`

**5. Required unit/integration tests:**

- Event traces prove install lock is final semantic publication
- Invalid planned lock never replaces existing state
- Same-byte lock replacement remains distinguishable in journal protocol

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/lock-publication.test.ts
pnpm run test:integration -- tests/integration/lock-projection.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Successful state publication is coherent and truthfully ordered.

**8. Commit message:** `codegen: publish install state after application files`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S072, not an unscheduled expansion.

### S072 — Clean completed transactions without losing evidence

**Contract anchors:** R15, R16, R17, R32, R33, R34. [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [STYLING.md](#contract-specs-styling), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Clean completed transactions without losing evidence.

**2. Purpose:** Remove only safe ephemeral state after committed publication.

**3. Exact scope of code changes:**

- Clean owned staging/backups/journal in documented order
- Retain actionable evidence when cleanup fails
- Plan safe ignore-rule integration only when required and preserve existing rules

**4. Files/modules likely involved:**

- `src/codegen/transaction-cleanup.ts`
- `tests/integration/transaction-cleanup.test.ts`

**5. Required unit/integration tests:**

- Completed batch cleans its own files only
- Cleanup failure reports committed-but-needs-cleanup state accurately
- Existing ignore rules/unrelated temp state survive

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/transaction-cleanup.test.ts
pnpm run test:integration -- tests/integration/lock-publication.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Cleanup cannot invalidate committed application state or erase unrelated data.

**8. Commit message:** `codegen: clean owned transaction state safely`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S073, not an unscheduled expansion.

### S073 — Recover interrupted prepublication transactions

**Contract anchors:** R13, R16, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Recover interrupted prepublication transactions.

**2. Purpose:** Return partially applied uncommitted batches to a known state safely.

**3. Exact scope of code changes:**

- Implement the frozen rollback/roll-forward policy for prepared or partially applied batches without final publication
- Revalidate current bytes before restore
- Preserve post-interruption user edits rather than overwrite them

**4. Files/modules likely involved:**

- `src/codegen/recovery.ts`
- `tests/integration/recovery-prepublication.test.ts`

**5. Required unit/integration tests:**

- Restart at every prepublication boundary recovers or safely refuses
- User edits made after crash block destructive restoration
- Missing backups and unexpected preimages fail closed

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/recovery-prepublication.test.ts
pnpm run test:unit -- tests/unit/transaction-state.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Interrupted uncommitted writes no longer leave undetected ambiguous state.

**8. Commit message:** `codegen: recover interrupted uncommitted batches`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S074, not an unscheduled expansion.

### S074 — Recover published transactions and incomplete cleanup

**Contract anchors:** R13, R16, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Recover published transactions and incomplete cleanup.

**2. Purpose:** Avoid rolling back a successfully published install after restart.

**3. Exact scope of code changes:**

- Recognize committed publication from journal/lock evidence, including unchanged-byte cases
- Finish only safe outstanding cleanup or documented completion
- Refuse contradictions rather than guessing success

**4. Files/modules likely involved:**

- `src/codegen/recovery.ts`
- `tests/integration/recovery-published.test.ts`

**5. Required unit/integration tests:**

- Crash immediately after lock publication preserves committed source
- Same-byte lock publication is classified correctly
- Postcommit user modifications survive cleanup

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/recovery-published.test.ts
pnpm run test:integration -- tests/integration/lock-publication.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Recovery distinguishes committed work from an uncommitted batch.

**8. Commit message:** `codegen: finish recovery after install state publication`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S075, not an unscheduled expansion.

### S075 — Fail closed on corrupt or ambiguous recovery evidence

**Contract anchors:** R09, R16, R30, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions).

**1. Step title:** Fail closed on corrupt or ambiguous recovery evidence.

**2. Purpose:** Prevent convenience recovery from becoming an unsafe overwrite path.

**3. Exact scope of code changes:**

- Consolidate invalid journal/lock/backup/owner diagnostics
- Block new mutation when recovery cannot prove a safe transition
- Provide existing-command/manual recovery guidance without inventing force/recover flags

**4. Files/modules likely involved:**

- `src/codegen/recovery.ts`
- `src/cli/protocol.ts`
- `tests/integration/recovery-invalid.test.ts`

**5. Required unit/integration tests:**

- Corrupt/forged/unknown journal cases do not mutate
- Stale PID/age alone cannot authorize cleanup
- Diagnostics identify safe logical evidence and next actions

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/recovery-invalid.test.ts
pnpm run test:unit -- tests/unit/protocol.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Ambiguous state remains visible and protected.

**8. Commit message:** `codegen: refuse ambiguous transaction recovery`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S076, not an unscheduled expansion.

### S076 — Qualify concurrency and process-interruption behavior

**Contract anchors:** R16, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions).

**1. Step title:** Qualify concurrency and process-interruption behavior.

**2. Purpose:** Verify the protocol using real processes, not only mocked filesystem calls.

**3. Exact scope of code changes:**

- Add cooperative writer contention and process-termination fixtures
- Inject failures around stage/replace/publication/cleanup boundaries
- Record platform-specific limits and available CI lanes

**4. Files/modules likely involved:**

- `tests/integration/transaction-processes.test.ts`
- `tests/helpers/fault-process.ts`
- `CI workflow configuration`

**5. Required unit/integration tests:**

- Two writers cannot interleave an accepted batch
- Killed process leaves recoverable or refused state
- Noncooperative edits are not overwritten
- Platform matrix documents unrun cases explicitly

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/transaction-processes.test.ts
pnpm run test:integration -- tests/integration/recovery-prepublication.test.ts
pnpm run test:integration -- tests/integration/recovery-published.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Concurrency and interruption claims have process-level evidence.

**8. Commit message:** `test: qualify concurrent and interrupted transactions`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S077, not an unscheduled expansion.

### S077 — Compose the guarded apply use case

**Contract anchors:** R13, R14, R15, R16, R32, R33, R34. [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Compose the guarded apply use case.

**2. Purpose:** Provide one safe mutation entrypoint for all write commands.

**3. Exact scope of code changes:**

- Wire complete conflict-free plans through recovery check, coordination, revalidation, staging, replacement, publication and cleanup
- Reject unvalidated/partial plans
- Keep pure planning and CLI output separate

**4. Files/modules likely involved:**

- `src/codegen/apply.ts`
- `tests/integration/apply.test.ts`

**5. Required unit/integration tests:**

- Successful batch changes exactly planned files
- Conflicting/stale/unsafe plan yields no new writes
- Recoverable failure reports accurate outcome and preserves evidence

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/apply.test.ts
pnpm run test:integration -- tests/integration/plan-purity.test.ts
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** All mutations can share one verified transaction boundary.

**8. Commit message:** `codegen: compose guarded plan application`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S078, not an unscheduled expansion.

## M05 — Complete CLI workflows and generator acceptance

### S078 — Render human and JSON command outcomes

**Contract anchors:** R09, R15, R30, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Render human and JSON command outcomes.

**2. Purpose:** Keep machine results clean while making human errors actionable.

**3. Exact scope of code changes:**

- Implement one envelope renderer and human stdout/stderr rules
- Map typed planner/registry/fs errors through frozen statuses
- Exclude random internal transaction details from deterministic semantic output

**4. Files/modules likely involved:**

- `src/cli/output.ts`
- `tests/integration/output.test.ts`

**5. Required unit/integration tests:**

- JSON failure/help/planned/success emit exactly one parseable object
- Human errors leave stdout empty
- No ANSI/progress leakage in JSON mode

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/output.test.ts
pnpm run test:unit -- tests/unit/protocol.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** All command handlers can emit consistent tested outcomes.

**8. Commit message:** `cli: render deterministic human and json outcomes`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S079, not an unscheduled expansion.

### S079 — Implement read-only info

**Contract anchors:** R09, R10, R15, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Implement read-only info.

**2. Purpose:** Expose supported project/dependency readiness without mutation.

**3. Exact scope of code changes:**

- Wire project/root/config/dependency inspection to info
- Include safe paths and explicit unsupported/missing states
- Honor --cwd and --json

**4. Files/modules likely involved:**

- `src/cli/commands/info.ts`
- `tests/integration/info.test.ts`

**5. Required unit/integration tests:**

- Default/custom/ambiguous/missing project cases return expected envelopes
- Complete-tree snapshots prove no writes
- Peer incompatibility appears in data/diagnostics

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/info.test.ts
pnpm run build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Info reports actual readiness through the approved interface.

**8. Commit message:** `cli: inspect projects with read-only info`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S080, not an unscheduled expansion.

### S080 — Implement read-only registry view and source inspection

**Contract anchors:** R08, R09, R13, R15, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [DATA_MODEL.md](#contract-specs-data-model), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Implement read-only registry view and source inspection.

**2. Purpose:** Let developers inspect incoming item content for adoption and conflict resolution.

**3. Exact scope of code changes:**

- Wire packaged item metadata and --source output to view
- Support item inspection without inventing a project where not required
- Use exact bundled assets and typed unknown-item errors

**4. Files/modules likely involved:**

- `src/cli/commands/view.ts`
- `tests/integration/view.test.ts`

**5. Required unit/integration tests:**

- Known sample item metadata/source matches asset snapshot
- Unknown item/invalid flags produce one expected outcome
- View creates no project state and works from another CWD

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/view.test.ts
pnpm run test:unit -- tests/unit/assets.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** View exposes incoming source independently from a runtime package.

**8. Commit message:** `cli: inspect bundled registry items and source`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S081, not an unscheduled expansion.

### S081 — Implement init through plan and guarded apply

**Contract anchors:** R05, R09, R15, R16, R17, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [STYLING.md](#contract-specs-styling), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Implement init through plan and guarded apply.

**2. Purpose:** Expose initialization only after safe transactional machinery exists.

**3. Exact scope of code changes:**

- Wire init to pure plan and guarded apply
- Return planned outcome for --dry-run without starting coordination
- Include dependency/integration guidance without package installation

**4. Files/modules likely involved:**

- `src/cli/commands/init.ts`
- `tests/integration/init.test.ts`

**5. Required unit/integration tests:**

- Default init creates exactly planned targets
- Second init is no_change
- Dry run leaves hidden and visible state unchanged
- Existing application layout/styles survive

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/init.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Initialization is usable and non-destructive.

**8. Commit message:** `cli: initialize applications through guarded plans`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S082, not an unscheduled expansion.

### S082 — Implement add through explicit requests

**Contract anchors:** R09, R10, R11, R13, R16, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [DATA_MODEL.md](#contract-specs-data-model), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Implement add through explicit requests.

**2. Purpose:** Expose the first complete source-installation workflow.

**3. Exact scope of code changes:**

- Wire one-item add to request projection and guarded apply
- Surface missing/incompatible dependency instructions separately
- Preserve conflicts without config-only side effects

**4. Files/modules likely involved:**

- `src/cli/commands/add.ts`
- `tests/integration/add.test.ts`

**5. Required unit/integration tests:**

- Sample item and dependencies install with correct ownership
- Repeated add is no_change
- Untracked conflict leaves all files unchanged
- Config roots exclude transitive additions

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/add.test.ts
pnpm run test:integration -- tests/integration/apply.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Applications can install qualified items through the approved command.

**8. Commit message:** `cli: add requested components with safe dependency closure`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S083, not an unscheduled expansion.

### S083 — Implement sync through customization-aware planning

**Contract anchors:** R09, R13, R14, R15, R18, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Implement sync through customization-aware planning.

**2. Purpose:** Make upgrades and config reconciliation preserve user edits.

**3. Exact scope of code changes:**

- Wire sync/dry-run to full planning, cohort protection and apply
- Include retirement and metadata-only outcomes
- No force/automatic merge path

**4. Files/modules likely involved:**

- `src/cli/commands/sync.ts`
- `tests/integration/sync.test.ts`

**5. Required unit/integration tests:**

- Untouched updates apply; local-only edits remain; genuine conflicts write nothing
- Clean/custom retirement follows policy
- Second sync is unchanged and metadata remains truthful

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/sync.test.ts
pnpm run test:integration -- tests/integration/plan-retirement.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Sync implements the central source-ownership product promise.

**8. Commit message:** `cli: synchronize without overwriting customizations`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S084, not an unscheduled expansion.

### S084 — Implement doctor structural and dependency checks

**Contract anchors:** R09, R10, R15, R19, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Implement doctor structural and dependency checks.

**2. Purpose:** Detect broken generated integration independently of mutation.

**3. Exact scope of code changes:**

- Inspect registry/config/lock consistency, missing targets, malformed CSS, exports/layout and dependencies
- Report safe typed per-check results
- Do not repair or write during doctor

**4. Files/modules likely involved:**

- `src/cli/commands/doctor.ts`
- `tests/integration/doctor-structure.test.ts`

**5. Required unit/integration tests:**

- Missing files/invalid metadata/peer conflicts/malformed blocks are diagnosed
- Healthy fixture passes
- No filesystem mutations occur even with stale recovery state

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/doctor-structure.test.ts
pnpm run test:integration -- tests/integration/dependency-state.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Doctor identifies actual installation breakage without side effects.

**8. Commit message:** `cli: diagnose structural and dependency health`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S085, not an unscheduled expansion.

### S085 — Separate doctor customization from strict failures

**Contract anchors:** R13, R19, R30, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Separate doctor customization from strict failures.

**2. Purpose:** Avoid treating editable-source use as installation corruption.

**3. Exact scope of code changes:**

- Classify valid local source/CSS edits as customization rather than failure
- Define strict escalation only for broken/unsafe checks per frozen contract
- Preserve actionable conflict/upgrade warnings

**4. Files/modules likely involved:**

- `src/cli/commands/doctor.ts`
- `tests/integration/doctor-customization.test.ts`
- `specs/API_CONTRACTS.md`

**5. Required unit/integration tests:**

- Customized valid source/CSS does not fail strict solely for drift
- Broken required target and unsafe state fail strict
- JSON/human outcomes and exit codes match protocol

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/doctor-customization.test.ts
pnpm run test:integration -- tests/integration/doctor-structure.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Strict doctor supports legitimate source ownership.

**8. Commit message:** `cli: distinguish customization from broken installs`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S086, not an unscheduled expansion.

### S086 — Qualify the executable exit and JSON matrix

**Contract anchors:** R09, R15, R30, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Qualify the executable exit and JSON matrix.

**2. Purpose:** Match the source-project automation rigor at process level.

**3. Exact scope of code changes:**

- Add complete command/usage/planned/applied/no-change/warning/conflict/unsafe/error golden cases
- Test flags before/after commands as supported by parser
- Assert exactly one envelope on failures

**4. Files/modules likely involved:**

- `tests/integration/exit-contract.test.ts`
- `src/cli/main.ts`

**5. Required unit/integration tests:**

- All frozen exit codes/statuses exercised through built executable
- Human failure stderr/stdout contract passes
- Unknown options cannot trigger writes

**6. Verification commands:**

```sh
pnpm run build
pnpm run test:integration -- tests/integration/exit-contract.test.ts
pnpm run test:unit -- tests/unit/args.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Process behavior is stable for humans and automation.

**8. Commit message:** `test: qualify cli exit and json contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S087, not an unscheduled expansion.

### S087 — Qualify full workflow idempotence and no-write paths

**Contract anchors:** R10, R11, R15, R30, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [DATA_MODEL.md](#contract-specs-data-model), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Qualify full workflow idempotence and no-write paths.

**2. Purpose:** Ensure handlers do not bypass the pure-plan guarantees.

**3. Exact scope of code changes:**

- Exercise info/view/init/add/sync/doctor and dry-run flows in temp apps
- Compare complete trees including ephemeral state and manifests
- Verify no hidden dependency execution

**4. Files/modules likely involved:**

- `tests/integration/workflow-purity.test.ts`
- `tests/helpers/tree-snapshot.ts`

**5. Required unit/integration tests:**

- All read-only/dry-run/conflict paths are byte/mode nonmutating
- Successful repeated workflow is unchanged
- Multiple command sequences produce equivalent desired state

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/workflow-purity.test.ts
pnpm run test:integration -- tests/integration/exit-contract.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** End-to-end commands preserve the planned side-effect contract.

**8. Commit message:** `test: prove workflow idempotence and dry-run purity`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S088, not an unscheduled expansion.

### S088 — Reject unsupported schemas and preserve migration boundaries

**Contract anchors:** R12, R15, R30, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [DATA_MODEL.md](#contract-specs-data-model), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Reject unsupported schemas and preserve migration boundaries.

**2. Purpose:** Avoid accidental compatibility with legacy or future configuration.

**3. Exact scope of code changes:**

- Add version-aware parse dispatch and explicit unsupported-version diagnostics
- Reject Leptos/shadcn config as unsupported input
- Keep mutation blocked before any guessed migration

**4. Files/modules likely involved:**

- `src/project/migrations.ts`
- `src/codegen/lock.ts`
- `tests/integration/schema-versions.test.ts`

**5. Required unit/integration tests:**

- Current independent versions pass
- Unknown future and source-only legacy fields fail without writes
- Framework version changes alone do not trigger migration

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/schema-versions.test.ts
pnpm run test:unit -- tests/unit/versions.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Schema evolution has an explicit safe entry boundary.

**8. Commit message:** `config: reject unsupported schema transitions safely`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S089, not an unscheduled expansion.

### S089 — Add synthetic upgrade and contract-revision fixtures

**Contract anchors:** R12, R13, R14, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [DATA_MODEL.md](#contract-specs-data-model), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Add synthetic upgrade and contract-revision fixtures.

**2. Purpose:** Verify update machinery without inventing a shipped historical version.

**3. Exact scope of code changes:**

- Create clearly synthetic old/incoming registry fixtures with source/CSS and metadata changes
- Test independent item/contract upgrades through sync
- Retain customized targets and cohort conflicts across revisions

**4. Files/modules likely involved:**

- `tests/fixtures/upgrades/`
- `tests/integration/upgrade-fixtures.test.ts`

**5. Required unit/integration tests:**

- Untouched synthetic upgrades succeed with truthful lock
- Customized changed cohort blocks
- Unrelated package/framework versions do not corrupt schema state
- Fixtures are labeled synthetic, not real releases

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/upgrade-fixtures.test.ts
pnpm run test:integration -- tests/integration/sync.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Migration/upgrade behavior has executable coverage before real releases exist.

**8. Commit message:** `test: qualify independent registry and contract upgrades`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S090, not an unscheduled expansion.

### S090 — Build and inspect the package asset inventory

**Contract anchors:** R01, R08, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [ARCHITECTURE.md](#contract-specs-architecture), [DATA_MODEL.md](#contract-specs-data-model), [PRODUCT_SPEC.md](#contract-specs-product-spec).

**1. Step title:** Build and inspect the package asset inventory.

**2. Purpose:** Catch packaging gaps before the catalog grows.

**3. Exact scope of code changes:**

- Configure bin/module metadata and explicit packed file inclusion
- Include only required distributable assets/contracts/schemas and built executable
- Add no authoring-tree fallback or network registry

**4. Files/modules likely involved:**

- `package.json`
- `build configuration`
- `tests/package/inventory.test.ts`
- `package test configuration`

**5. Required unit/integration tests:**

- Packed manifest lists executable and every qualified registry asset/schema
- Test-only state and unintended dependency/runtime files are excluded
- View works using packed layout

**6. Verification commands:**

```sh
pnpm run build
pnpm pack --json
pnpm run test:package -- tests/package/inventory.test.ts # establish this real lane here
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The package layout is independently inspectable and usable.

**8. Commit message:** `package: include the executable and bundled registry assets`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S091, not an unscheduled expansion.

### S091 — Document the working generator workflow

**Contract anchors:** R02, R09, R13, R19, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Document the working generator workflow.

**2. Purpose:** Keep usable public guidance aligned with implemented behavior.

**3. Exact scope of code changes:**

- Document init/add/view/sync/doctor, explicit dependency setup, ownership and conflict handling
- Record supported default/custom layouts and current catalog qualification status
- Document no publication/auto-install/runtime-package claims

**4. Files/modules likely involved:**

- `README.md`
- `CONTRIBUTING.md`
- `implementation evidence/COMMANDS.md`
- `tests/integration/documented-workflow.test.ts`

**5. Required unit/integration tests:**

- Execute documented workflow against a temp fixture
- Examples use actual commands and no nonexistent published package assumption
- Generator suites remain green

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/documented-workflow.test.ts
pnpm run test:unit
pnpm run test:integration
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The complete generator is documented and cumulatively qualified before catalog work.

**8. Commit message:** `docs: document the verified source-first workflow`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S092, not an unscheduled expansion.

## M06 — Tokens, spinner, button, switch, and dialog vertical slice

### S092 — Freeze the portable token and customization vocabulary

**Contract anchors:** R04, R07, R12, R25, R26, R32, R33, R34. [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model), [STYLING.md](#contract-specs-styling).

**1. Step title:** Freeze the portable token and customization vocabulary.

**2. Purpose:** Preserve the reference design decisions without importing Rust capability metadata.

**3. Exact scope of code changes:**

- Map source token/customization contracts to independently versioned Svelte contracts
- Record default values, radius roles, shape-critical properties and allowed grammar
- Preserve license/provenance notices for any copied assets

**4. Files/modules likely involved:**

- `registry/contracts/theme-v1.json`
- `registry/contracts/component-customization-v1.json`
- `specs/component-maps/tokens.md`
- `tests/registry/token-contract.test.ts`

**5. Required unit/integration tests:**

- Every intended semantic/customization property has an explicit role/default mapping
- No Rust ABI identifiers remain
- Complete border-radius grammar is not narrowed by schema or property registration

**6. Verification commands:**

```sh
pnpm run test:registry -- tests/registry/token-contract.test.ts
pnpm run test:unit -- tests/unit/theme-metadata.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Token and component-property scope is frozen before CSS installation.

**8. Commit message:** `tokens: define the portable semantic and customization contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S093, not an unscheduled expansion.

### S093 — Install the pure-CSS tokens foundation

**Contract anchors:** R04, R07, R08, R26, R32, R33, R34. [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model), [STYLING.md](#contract-specs-styling).

**1. Step title:** Install the pure-CSS tokens foundation.

**2. Purpose:** Introduce the first real qualified built-in item.

**3. Exact scope of code changes:**

- Author mapped token CSS with target markers/layer order
- Add CSS-only foundation manifest and register tokens
- Preserve defaults rather than redesigning palette or global reset

**4. Files/modules likely involved:**

- `registry/styles/tokens.css`
- `registry/foundation/tokens.json`
- `registry/registry.json`
- `tests/integration/tokens-install.test.ts`

**5. Required unit/integration tests:**

- Add tokens installs only foundation CSS and correct metadata prerequisites
- Layer order and marker uniqueness pass
- Repeated installation is unchanged and no Tailwind tooling is required

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/tokens-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** A real CSS-only foundation is installable through the CLI.

**8. Commit message:** `tokens: register the pure css foundation`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S094, not an unscheduled expansion.

### S094 — Emit truthful token and theme integration metadata

**Contract anchors:** R07, R12, R23, R25, R32, R33, R34. [DATA_MODEL.md](#contract-specs-data-model), [STYLING.md](#contract-specs-styling).

**1. Step title:** Emit truthful token and theme integration metadata.

**2. Purpose:** Make generated contracts usable by applications and later sync.

**3. Exact scope of code changes:**

- Project token-contract.json and theme-integration.json from actual target contracts
- Include actual stylesheet/layer/producer compatibility
- Add lock digest tracking and safe contract-upgrade fixtures

**4. Files/modules likely involved:**

- `src/codegen/theme-integration.ts`
- `tests/integration/theme-metadata.test.ts`
- `registry/contracts/`

**5. Required unit/integration tests:**

- Generated metadata validates independently
- Digests match installed content
- No Rust primitive/portal type claim appears
- Synthetic contract revision respects customization/cohort policy

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/theme-metadata.test.ts
pnpm run test:registry -- tests/registry/token-contract.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Committed theme metadata accurately describes installed Svelte styling.

**8. Commit message:** `tokens: emit versioned theme integration metadata`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S095, not an unscheduled expansion.

### S095 — Qualify token override and radius fallback behavior

**Contract anchors:** R22, R23, R25, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify token override and radius fallback behavior.

**2. Purpose:** Test CSS contract meaning in a browser rather than only JSON shape.

**3. Exact scope of code changes:**

- Add computed-style fixture for semantic/component/default/reference precedence
- Cover unset properties, multi-corner/elliptical radius and circular shape exceptions
- Record baseline contrast observations without claiming blanket compliance

**4. Files/modules likely involved:**

- `tests/browser/token-contract.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/tokens/`
- `specs/component-maps/tokens.md`

**5. Required unit/integration tests:**

- All fallback levels produce intended computed values
- Theme overrides apply without editing component source
- Invalid values follow documented CSS behavior and full grammar remains accepted

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/token-contract.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Portable CSS customization behavior is browser-qualified.

**8. Commit message:** `test: qualify token overrides and radius precedence`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S096, not an unscheduled expansion.

### S096 — Freeze spinner props and accessible modes

**Contract anchors:** R03, R20, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Freeze spinner props and accessible modes.

**2. Purpose:** Preserve decorative/loading behavior before Button depends on it.

**3. Exact scope of code changes:**

- Inspect source spinner API/CSS and freeze target mode/type/export mapping
- Define decorative usage and status-label behavior without redundant announcements
- Add typed and contract fixtures

**4. Files/modules likely involved:**

- `specs/component-maps/spinner.md`
- `tests/components/spinner-contract.test.ts`
- `registry/ui/spinner.types.ts if justified`

**5. Required unit/integration tests:**

- Supported modes/types and omitted hooks are explicit
- Decorative mode cannot introduce duplicate loading label semantics
- Shape-critical CSS property mapping is documented

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/spinner-contract.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Spinner behavior and design boundary are frozen.

**8. Commit message:** `spinner: define modes and accessibility contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S097, not an unscheduled expansion.

### S097 — Generate the spinner component and CSS

**Contract anchors:** R02, R04, R06, R26, R32, R33, R34. [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling).

**1. Step title:** Generate the spinner component and CSS.

**2. Purpose:** Provide a real native presentation dependency for Button.

**3. Exact scope of code changes:**

- Author typed native spinner markup, stylesheet and explicit manifest
- Register Spinner and source-supported type exports
- Use tokens and preserve circular geometry/motion contracts

**4. Files/modules likely involved:**

- `registry/ui/spinner.svelte`
- `registry/ui/spinner.json`
- `registry/styles/spinner.css`
- `registry/registry.json`
- `tests/integration/spinner-install.test.ts`

**5. Required unit/integration tests:**

- CLI-installed source compiles and exports declared symbols
- Decorative/status cases render expected semantics
- Registry dependency and block ownership validate

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/spinner-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Spinner installs as editable local source with plain CSS.

**8. Commit message:** `spinner: generate native source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S098, not an unscheduled expansion.

### S098 — Qualify spinner geometry and reduced motion

**Contract anchors:** R22, R23, R25, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify spinner geometry and reduced motion.

**2. Purpose:** Prevent visual or accessibility regressions in its primary use cases.

**3. Exact scope of code changes:**

- Add generated-app spinner state fixture
- Verify reduced motion and explicit shape overrides
- Test labels/decoration and theme inheritance

**4. Files/modules likely involved:**

- `tests/browser/spinner.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/spinner/`

**5. Required unit/integration tests:**

- Default geometry stays circular despite global radius override
- Exact spinner override is honored
- Decorative instance is not redundantly announced
- Reduced-motion case remains meaningful

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/spinner.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Spinner is qualified for standalone and Button composition.

**8. Commit message:** `test: qualify spinner geometry and accessible motion`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S099, not an unscheduled expansion.

### S099 — Freeze Button native props and variant types

**Contract anchors:** R03, R06, R20, R26, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [GENERATED_LAYOUT.md](#contract-specs-generated-layout).

**1. Step title:** Freeze Button native props and variant types.

**2. Purpose:** Carry over recognizable design choices without adding polymorphic behavior.

**3. Exact scope of code changes:**

- Define ButtonProps from native Svelte button attributes and kit additions
- Freeze primary/secondary/ghost, sm/md/lg, default type button and loadingLabel behavior
- Document ref/children/event forwarding and Spinner dependency

**4. Files/modules likely involved:**

- `registry/ui/button.types.ts`
- `specs/component-maps/button.md`
- `tests/components/button-types.test.ts`

**5. Required unit/integration tests:**

- Positive native form/data/aria props typecheck
- Unsupported variants/size and accidental link polymorphism fail
- Loading/ref/children signatures remain explicit without any

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/button-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Button API matches approved semantics and selected Svelte types.

**8. Commit message:** `button: define native props and design variants`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S100, not an unscheduled expansion.

### S100 — Generate Button with loading-safe plain CSS

**Contract anchors:** R02, R04, R06, R11, R20, R26, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Generate Button with loading-safe plain CSS.

**2. Purpose:** Complete the first native component with a transitive source dependency.

**3. Exact scope of code changes:**

- Author native button, loading/disabled/busy markup and decorative spinner composition
- Map full reference Button CSS to target layers/markers
- Register manifest/export/type targets with tokens/spinner dependencies and direct sibling imports

**4. Files/modules likely involved:**

- `registry/ui/button.svelte`
- `registry/ui/button.json`
- `registry/styles/button.css`
- `registry/registry.json`
- `tests/integration/button-install.test.ts`

**5. Required unit/integration tests:**

- add button resolves spinner/tokens without making them requested roots
- Generated local source and types compile
- No import through the root barrel or styled kit runtime
- Native default type and busy markup are correct

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/button-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Button is an installable app-owned native component with authored styles.

**8. Commit message:** `button: generate loading-safe source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S101, not an unscheduled expansion.

### S101 — Qualify Button keyboard, form, and loading behavior

**Contract anchors:** R20, R22, R23, R25, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify Button keyboard, form, and loading behavior.

**2. Purpose:** Verify native behavior was preserved through design wrappers.

**3. Exact scope of code changes:**

- Test default no-submit behavior, explicit submit/reset and disabled/loading guards
- Verify accessible loading text, aria-busy and caller handlers/classes/refs
- Exercise variant/size/theme/focus states

**4. Files/modules likely involved:**

- `tests/browser/button.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/button/`

**5. Required unit/integration tests:**

- Click/keyboard activation and form cases pass
- Loading prevents activation without duplicate announcements
- Focus-visible and token/radius overrides work
- Caller attributes are preserved

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/button.spec.ts
pnpm run test:components -- tests/components/button-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Button behavior and visual states are generated-app qualified.

**8. Commit message:** `test: qualify button forms focus and loading states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S102, not an unscheduled expansion.

### S102 — Freeze Switch binding, ref, and composition contracts

**Contract anchors:** R03, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Freeze Switch binding, ref, and composition contracts.

**2. Purpose:** Avoid accepting rendering hooks that the wrapper owns internally.

**3. Exact scope of code changes:**

- Map pinned Bits Switch Root/Thumb props and actual native form behavior
- Freeze checked/ref bindings and excluded child/children hooks
- Map checked-state selectors and reference track/thumb customization

**4. Files/modules likely involved:**

- `specs/component-maps/switch.md`
- `tests/components/switch-types.test.ts`

**5. Required unit/integration tests:**

- Valid checked/ref/form props compile
- child/children rejected for the internal-thumb wrapper
- No invented alias replaces the pinned primitive contract

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/switch-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Switch has a deliberate typed composition boundary.

**8. Commit message:** `switch: define binding and composition contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S103, not an unscheduled expansion.

### S103 — Generate the primitive-backed Switch

**Contract anchors:** R02, R03, R04, R07, R20, R26, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling).

**1. Step title:** Generate the primitive-backed Switch.

**2. Purpose:** Prove the architecture combines Bits behavior with app-owned plain CSS.

**3. Exact scope of code changes:**

- Author Switch wrapper with explicit checked/ref binding, class merge and forwarded props
- Map source switch CSS to actual Root/Thumb DOM
- Register item/export/dependencies without a kit runtime helper

**4. Files/modules likely involved:**

- `registry/ui/switch.svelte`
- `registry/ui/switch.json`
- `registry/styles/switch.css`
- `registry/registry.json`
- `tests/integration/switch-install.test.ts`

**5. Required unit/integration tests:**

- Generated wrapper compiles against pinned Bits
- Data-state selectors match real DOM
- Required dependencies and CSS ownership are correct
- Initial state SSR is not disabled

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/switch-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Switch installs as a thin local primitive wrapper.

**8. Commit message:** `switch: generate the bits wrapper and pure css skin`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S104, not an unscheduled expansion.

### S104 — Qualify Switch state, forms, RTL, and motion

**Contract anchors:** R20, R22, R23, R25, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify Switch state, forms, RTL, and motion.

**2. Purpose:** Verify the reference visual contract and upstream behavior together.

**3. Exact scope of code changes:**

- Test two-way state/ref changes, native form submission/reset/required/disabled behavior and labels
- Exercise unchecked strong track, checked color, thumb override and RTL travel
- Verify reduced-motion and caller-event behavior

**4. Files/modules likely involved:**

- `tests/browser/switch.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/switch/`

**5. Required unit/integration tests:**

- State flows both directions without duplicate hidden inputs
- Form and keyboard behavior match the frozen pinned contract
- Visual track/thumb/RTL/motion states pass
- Theme changes propagate

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/switch.spec.ts
pnpm run test:components -- tests/components/switch-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Switch is fully qualified as the first stateful primitive wrapper.

**8. Commit message:** `test: qualify switch state forms and directional motion`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S105, not an unscheduled expansion.

### S105 — Freeze the Dialog family API and ownership cohort

**Contract anchors:** R06, R14, R20, R22, R26, R27, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Freeze the Dialog family API and ownership cohort.

**2. Purpose:** Map compound structure before exposing a partial family publicly.

**3. Exact scope of code changes:**

- Freeze Root/Trigger/Portal/Overlay/Content/Title/Description/Close exports and typed props
- Document binding/ref/snippet/portal and accessible name behavior
- Mark candidate assets unregistered until complete and define one source/style/export cohort

**4. Files/modules likely involved:**

- `specs/component-maps/dialog.md`
- `tests/components/dialog-types.test.ts`
- `tests/fixtures/dialog-candidate/`

**5. Required unit/integration tests:**

- Type fixtures cover open/ref bindings and supported snippets
- Separate Alert Dialog is not represented as a role toggle
- Candidate family is not yet installable

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/dialog-types.test.ts
pnpm run test:registry -- tests/registry/health.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Compound API and qualification boundary are explicit.

**8. Commit message:** `dialog: define the compound family contract`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S106, not an unscheduled expansion.

### S106 — Author Dialog root and trigger parts

**Contract anchors:** R03, R20, R21, R26, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Author Dialog root and trigger parts.

**2. Purpose:** Introduce state and activation forwarding in a small independently compiled change.

**3. Exact scope of code changes:**

- Add candidate Root/Trigger wrappers using pinned Bits parts
- Preserve open binding and trigger native/ref/snippet behavior
- Compile them in a candidate fixture composed with remaining raw primitive parts

**4. Files/modules likely involved:**

- `registry/ui/dialog/root.svelte`
- `registry/ui/dialog/trigger.svelte`
- `tests/components/dialog-root-trigger.test.ts`

**5. Required unit/integration tests:**

- Root state updates in both directions
- Trigger retains native activation/ref/delegation
- Existing registered catalog remains unaffected and valid

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/dialog-root-trigger.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** State/trigger parts are typed and verified without advertising an incomplete item.

**8. Commit message:** `dialog: forward root state and trigger behavior`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S107, not an unscheduled expansion.

### S107 — Author Dialog portal and overlay parts

**Contract anchors:** R20, R21, R23, R26, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Author Dialog portal and overlay parts.

**2. Purpose:** Expose portal placement as composition instead of hidden styling logic.

**3. Exact scope of code changes:**

- Add candidate Portal/Overlay wrappers with the frozen upstream target/ref/snippet API
- Preserve default body behavior and explicit custom target support
- Avoid copying computed theme variables or introducing convenience aliases

**4. Files/modules likely involved:**

- `registry/ui/dialog/portal.svelte`
- `registry/ui/dialog/overlay.svelte`
- `tests/components/dialog-portal-overlay.test.ts`

**5. Required unit/integration tests:**

- Parts compile in the candidate composition
- Default/custom target values preserve upstream types
- No browser global is accessed during module import/SSR

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/dialog-portal-overlay.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Portal and overlay parts are explicit and SSR-safe.

**8. Commit message:** `dialog: expose portal and overlay composition`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S108, not an unscheduled expansion.

### S108 — Author Dialog content forwarding

**Contract anchors:** R03, R20, R21, R27, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Author Dialog content forwarding.

**2. Purpose:** Keep focus/presence/dismissal behavior in Bits rather than recreating it.

**3. Exact scope of code changes:**

- Add candidate Content wrapper with class/ref/snippet forwarding
- Preserve native primitive focus/dismissal/presence controls
- Do not supply Rust layer/context/state machinery or role-based Alert Dialog emulation

**4. Files/modules likely involved:**

- `registry/ui/dialog/content.svelte`
- `tests/components/dialog-content.test.ts`

**5. Required unit/integration tests:**

- Content props and ref compile against pinned primitive
- Child/default rendering paths preserve required semantics
- No custom focus trap/layer stack is introduced

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/dialog-content.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Content preserves the primitive interaction boundary.

**8. Commit message:** `dialog: preserve primitive content behavior and refs`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S109, not an unscheduled expansion.

### S109 — Author Dialog title, description, and close parts

**Contract anchors:** R06, R20, R22, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [GENERATED_LAYOUT.md](#contract-specs-generated-layout).

**1. Step title:** Author Dialog title, description, and close parts.

**2. Purpose:** Complete the accessible labeling and explicit close composition.

**3. Exact scope of code changes:**

- Add candidate text/close wrappers with native/Bits types and design classes
- Preserve title/description ID relationships and close semantics
- Keep all public names aligned with the approved flat scheme

**4. Files/modules likely involved:**

- `registry/ui/dialog/title.svelte`
- `registry/ui/dialog/description.svelte`
- `registry/ui/dialog/close.svelte`
- `tests/components/dialog-labeling.test.ts`

**5. Required unit/integration tests:**

- Accessible relationships are wired by primitive composition
- Close forwards ref/events/snippet as frozen
- Optional description does not manufacture invalid aria references

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/dialog-labeling.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** All required compound parts exist and are individually verified.

**8. Commit message:** `dialog: complete labeling and close components`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S110, not an unscheduled expansion.

### S110 — Map Dialog managed CSS to the actual compound DOM

**Contract anchors:** R04, R07, R22, R25, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Map Dialog managed CSS to the actual compound DOM.

**2. Purpose:** Preserve design intent while adapting source selectors to Bits parts.

**3. Exact scope of code changes:**

- Author overlay/content/title/description/close styles in one managed dialog block
- Map presence/state selectors to pinned output
- Preserve overlay-radius role, themes, focus and reduced-motion behavior

**4. Files/modules likely involved:**

- `registry/styles/dialog.css`
- `tests/components/dialog-css.test.ts`
- `specs/component-maps/dialog.md`

**5. Required unit/integration tests:**

- Every required selector maps to an actual candidate DOM part
- Tokens/fallbacks and state/motion hooks validate
- No global raw-Bits selectors or Tailwind syntax appear

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/dialog-css.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Dialog CSS is mapped explicitly, not blindly copied.

**8. Commit message:** `dialog: map managed styles to primitive markup`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S111, not an unscheduled expansion.

### S111 — Register the complete Dialog family

**Contract anchors:** R05, R06, R08, R14, R26, R28, R32, R33, R34. [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Register the complete Dialog family.

**2. Purpose:** Make the compound item installable only when all parts and styles exist.

**3. Exact scope of code changes:**

- Add dialog manifest, compound barrel and root export declarations
- Register all required source/CSS/metadata dependencies in one compatibility unit
- Generate the consumer fixture through the real CLI

**4. Files/modules likely involved:**

- `registry/ui/dialog.json`
- `registry/ui/dialog/index.ts`
- `registry/registry.json`
- `tests/integration/dialog-install.test.ts`

**5. Required unit/integration tests:**

- CLI installs exactly the approved compound tree and exports
- No unnecessary parent barrel/identity shim appears
- All installed parts typecheck and build
- Registry health and ownership validate

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/dialog-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The full Dialog family is a qualified local-source item.

**8. Commit message:** `dialog: register the complete compound component family`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S112, not an unscheduled expansion.

### S112 — Qualify Dialog keyboard, focus, dismissal, and presence

**Contract anchors:** R20, R22, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Qualify Dialog keyboard, focus, dismissal, and presence.

**2. Purpose:** Verify actual generated overlay interactions rather than attributing correctness to a dependency.

**3. Exact scope of code changes:**

- Add browser cases for accessible names, trap/return focus, Escape/outside interaction and close
- Exercise controlled/uncontrolled open/ref updates and interrupted presence transitions
- Test nested dialog composition as supported by pinned semantics

**4. Files/modules likely involved:**

- `tests/browser/dialog-interactions.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/dialog/`

**5. Required unit/integration tests:**

- Focus cannot escape modal content accidentally and returns correctly
- Dismissal/events honor forwarded policy
- Missing accessible-name cases are caught
- Rapid open/close does not strand focus

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/dialog-interactions.spec.ts
pnpm run test:components -- tests/components/dialog-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Dialog interaction behavior is browser-qualified.

**8. Commit message:** `test: qualify dialog focus dismissal and presence`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S113, not an unscheduled expansion.

### S113 — Qualify Dialog portal theme scopes

**Contract anchors:** R23, R24, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify Dialog portal theme scopes.

**2. Purpose:** Prove documented global and nested theme behavior.

**3. Exact scope of code changes:**

- Add global document-theme and nested custom-portal-host fixtures
- Test theme changes while open and document clipping/stacking caveats
- Confirm no computed-theme inline-copy mechanism appears

**4. Files/modules likely involved:**

- `tests/browser/dialog-themes.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/dialog-themes/`
- `README.md`

**5. Required unit/integration tests:**

- Body-portal inherits documented document theme
- Custom host inherits nested tokens
- Scope changes propagate while open
- Adverse clipping example is documented rather than hidden

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/dialog-themes.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Portal theme strategy has explicit behavioral evidence.

**8. Commit message:** `test: qualify dialog global and nested theme scopes`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S114, not an unscheduled expansion.

### S114 — Qualify initial Dialog state through SSR and hydration

**Contract anchors:** R21, R22, R28, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Qualify initial Dialog state through SSR and hydration.

**2. Purpose:** Prevent browser-only fixes from concealing server render problems.

**3. Exact scope of code changes:**

- Test supported initial open/closed state, multiple instances and request-local identity
- Hydrate generated parts with browser error capture
- Keep source DOM/state behavior aligned with pinned primitive guarantees

**4. Files/modules likely involved:**

- `tests/browser/dialog-hydration.spec.ts`
- `tests/integration/dialog-ssr.test.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- No unexpected hydration/console errors
- Multiple requests/instances do not leak state or IDs
- Browser-only portal work does not access document during server module import

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/dialog-ssr.test.ts
pnpm run test:browser -- tests/browser/dialog-hydration.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Dialog is qualified for the SvelteKit rendering model.

**8. Commit message:** `test: qualify dialog ssr and hydration state`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S115, not an unscheduled expansion.

### S115 — Qualify the complete first vertical slice

**Contract anchors:** R02, R08, R13, R14, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Qualify the complete first vertical slice.

**2. Purpose:** Prove installation, customization, upgrade and browser behavior together before expanding the catalog.

**3. Exact scope of code changes:**

- Install tokens/spinner/button/switch/dialog through the built CLI in a clean fixture
- Apply synthetic safe/conflicting upgrades and customization
- Pack/install and repeat the core workflow outside source layout

**4. Files/modules likely involved:**

- `tests/integration/core-workflow.test.ts`
- `tests/package/core-runtime.test.ts`
- `README.md`

**5. Required unit/integration tests:**

- Core tree/exports/styles/metadata remain deterministic
- Local edits and cohorts behave as specified
- Generated app passes type/build/browser checks
- Packed CLI reads all assets without CWD assumptions

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/core-workflow.test.ts
pnpm run test:package -- tests/package/core-runtime.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
pnpm run test:browser
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The initial core is independently usable and cumulatively verified.

**8. Commit message:** `test: qualify the complete source-first core workflow`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S116, not an unscheduled expansion.

## M07 — Distinct alert-dialog and early floating-menu qualification

### S116 — Freeze a distinct Alert Dialog API

**Contract anchors:** R03, R20, R22, R27, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Freeze a distinct Alert Dialog API.

**2. Purpose:** Preserve the approved separation from generic Dialog role switching.

**3. Exact scope of code changes:**

- Inspect pinned Alert Dialog parts and freeze exact flat family exports
- Map trigger/content/label/action/cancel semantics and theme/portal expectations
- Create typed positive/negative fixtures without inventing application confirmation state

**4. Files/modules likely involved:**

- `specs/component-maps/alert-dialog.md`
- `tests/components/alert-dialog-types.test.ts`

**5. Required unit/integration tests:**

- Types use the distinct primitive contract
- Generic Dialog role-toggle shortcut is not exposed
- Candidate item stays unregistered until complete

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/alert-dialog-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Alert Dialog contract is distinct and scoped.

**8. Commit message:** `alert-dialog: define distinct confirmation semantics`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S117, not an unscheduled expansion.

### S117 — Author Alert Dialog state and activation parts

**Contract anchors:** R03, R20, R27, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Author Alert Dialog state and activation parts.

**2. Purpose:** Keep confirmation interaction state in its proper primitive.

**3. Exact scope of code changes:**

- Add candidate Root/Trigger wrappers with frozen bindings/refs/snippets
- Use distinct Bits Alert Dialog imports
- Compose candidate tests with remaining raw primitive parts

**4. Files/modules likely involved:**

- `registry/ui/alert-dialog/root.svelte`
- `registry/ui/alert-dialog/trigger.svelte`
- `tests/components/alert-dialog-state.test.ts`

**5. Required unit/integration tests:**

- State binding flows both ways
- Trigger retains correct activation/ref semantics
- No generic Dialog state implementation is reused incorrectly

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/alert-dialog-state.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Alert Dialog activation is typed and independently qualified.

**8. Commit message:** `alert-dialog: forward primitive state and activation`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S118, not an unscheduled expansion.

### S118 — Author Alert Dialog portal and content parts

**Contract anchors:** R20, R21, R23, R27, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Author Alert Dialog portal and content parts.

**2. Purpose:** Preserve the separate focus/dismissal behavior while exposing styling.

**3. Exact scope of code changes:**

- Add frozen Portal/Overlay/Content parts using actual pinned primitive types
- Forward configuration without generic Dialog dismissal assumptions
- Retain SSR-safe portal and explicit theme target composition

**4. Files/modules likely involved:**

- `registry/ui/alert-dialog/`
- `tests/components/alert-dialog-content.test.ts`

**5. Required unit/integration tests:**

- Content/ref/portal props compile
- No role-only emulation or custom focus trap is introduced
- Candidate SSR render avoids browser-global access

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/alert-dialog-content.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Alert Dialog content remains behaviorally distinct.

**8. Commit message:** `alert-dialog: preserve content and portal behavior`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S119, not an unscheduled expansion.

### S119 — Author Alert Dialog labeling and decision controls

**Contract anchors:** R03, R20, R22, R27, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Author Alert Dialog labeling and decision controls.

**2. Purpose:** Expose accessible confirmation composition without application business logic.

**3. Exact scope of code changes:**

- Implement exactly the Title/Description/action/cancel parts frozen from pinned API
- Preserve accessible relationships and native button behaviors
- Do not implement confirmation promises, network state or queues

**4. Files/modules likely involved:**

- `registry/ui/alert-dialog/`
- `tests/components/alert-dialog-actions.test.ts`

**5. Required unit/integration tests:**

- Required names/description associations render
- Action and cancel types/refs/events preserve primitive semantics
- No unsolicited application state is added

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/alert-dialog-actions.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The family has complete accessible decision composition.

**8. Commit message:** `alert-dialog: complete labeling and decision controls`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S120, not an unscheduled expansion.

### S120 — Style and register the complete Alert Dialog family

**Contract anchors:** R04, R06, R14, R27, R32, R33, R34. [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Style and register the complete Alert Dialog family.

**2. Purpose:** Install the distinct component with plain CSS and explicit ownership.

**3. Exact scope of code changes:**

- Map supported visual styling to kit tokens and exact Alert Dialog DOM
- Add manifest/barrel/root exports and source-style cohort
- Register only the completed family

**4. Files/modules likely involved:**

- `registry/styles/alert-dialog.css`
- `registry/ui/alert-dialog.json`
- `registry/ui/alert-dialog/index.ts`
- `registry/registry.json`
- `tests/integration/alert-dialog-install.test.ts`

**5. Required unit/integration tests:**

- Generated family compiles/builds through CLI installation
- CSS/state selectors and dependency plan validate
- Generic Dialog and Alert Dialog exports do not collide

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/alert-dialog-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Alert Dialog is separately installable and app-owned.

**8. Commit message:** `alert-dialog: register the distinct styled family`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S121, not an unscheduled expansion.

### S121 — Qualify Alert Dialog focus and confirmation behavior

**Contract anchors:** R20, R22, R27, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Qualify Alert Dialog focus and confirmation behavior.

**2. Purpose:** Verify separate primitive behavior in a real generated app.

**3. Exact scope of code changes:**

- Add browser naming/focus/decision/cancel/dismissal cases from the frozen API
- Test nested interaction and open state bindings
- Verify shared styling does not collapse behavioral distinctions

**4. Files/modules likely involved:**

- `tests/browser/alert-dialog.spec.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- Action/cancel/focus restoration follow actual primitive contract
- Required accessible content is present
- Outside/Escape behavior is asserted from pinned contract rather than assumed identical to Dialog

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/alert-dialog.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Distinct confirmation behavior is proven.

**8. Commit message:** `test: qualify alert dialog focus and decisions`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S122, not an unscheduled expansion.

### S122 — Freeze Menu source-parity and floating APIs

**Contract anchors:** R03, R06, R20, R26, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [GENERATED_LAYOUT.md](#contract-specs-generated-layout).

**1. Step title:** Freeze Menu source-parity and floating APIs.

**2. Purpose:** Exercise floating placement early without adopting every upstream menu feature.

**3. Exact scope of code changes:**

- Map source menu family to pinned Dropdown Menu types and kit Menu names
- Freeze required part inventory, value/event/ref/snippet contracts and source/style cohort
- Document optional upstream parts excluded from current source parity

**4. Files/modules likely involved:**

- `specs/component-maps/menu.md`
- `tests/components/menu-types.test.ts`

**5. Required unit/integration tests:**

- Required Menu types compile with discriminated cases preserved
- No arbitrary full upstream catalog is assumed
- Floating child contract records wrapperProps and inner props distinctly

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/menu-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Menu has a precise source-parity scope and floating contract.

**8. Commit message:** `menu: define source parity and floating contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S123, not an unscheduled expansion.

### S123 — Author Menu root and trigger wrappers

**Contract anchors:** R03, R20, R26, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Author Menu root and trigger wrappers.

**2. Purpose:** Preserve menu activation state without recreating keyboard machinery.

**3. Exact scope of code changes:**

- Implement candidate Root/Trigger with typed open/ref/snippet forwarding
- Preserve caller event behavior and disabled activation
- Compose candidate tests with raw remaining primitive parts

**4. Files/modules likely involved:**

- `registry/ui/menu/root.svelte`
- `registry/ui/menu/trigger.svelte`
- `tests/components/menu-state.test.ts`

**5. Required unit/integration tests:**

- Controlled/uncontrolled open transitions compile and work
- Trigger attributes/ref/delegation remain intact
- No kit keyboard state engine appears

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/menu-state.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Menu state/activation parts are independently verified.

**8. Commit message:** `menu: forward primitive state and activation`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S124, not an unscheduled expansion.

### S124 — Author Menu portal and floating content wrappers

**Contract anchors:** R20, R21, R23, R24, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [STYLING.md](#contract-specs-styling).

**1. Step title:** Author Menu portal and floating content wrappers.

**2. Purpose:** Preserve required positioning structure through local styling wrappers.

**3. Exact scope of code changes:**

- Add candidate Portal/Content parts using pinned types
- Keep outer positioning wrapper and inner styled content separate in delegated rendering
- Do not strip primitive runtime styles to make an unsupported CSP claim

**4. Files/modules likely involved:**

- `registry/ui/menu/portal.svelte`
- `registry/ui/menu/content.svelte`
- `tests/components/menu-content.test.ts`

**5. Required unit/integration tests:**

- Default and child rendering retain required wrapperProps/props layout
- Ref/placement props typecheck
- SSR does not eagerly access DOM globals

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/menu-content.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Menu positioning contract survives wrapper composition.

**8. Commit message:** `menu: preserve floating content and portal structure`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S125, not an unscheduled expansion.

### S125 — Author Menu source-required item parts

**Contract anchors:** R03, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Author Menu source-required item parts.

**2. Purpose:** Complete exactly the approved source-parity interaction surface.

**3. Exact scope of code changes:**

- Implement frozen required item/group/label/separator or selection parts from the menu worksheet
- Preserve disabled/selection/event cancellation and relevant typed unions
- Exclude unsupported optional parts rather than stubbing them

**4. Files/modules likely involved:**

- `registry/ui/menu/`
- `tests/components/menu-items.test.ts`

**5. Required unit/integration tests:**

- Every frozen part compiles with positive/negative types
- Disabled and event forwarding behavior is covered
- No required part is a placeholder-green export

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/menu-items.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The specified menu parts are complete; extra upstream scope is not introduced.

**8. Commit message:** `menu: complete source-required item composition`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S126, not an unscheduled expansion.

### S126 — Style and register the Menu family

**Contract anchors:** R04, R06, R08, R14, R26, R32, R33, R34. [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Style and register the Menu family.

**2. Purpose:** Make the first floating component installable through normal ownership machinery.

**3. Exact scope of code changes:**

- Map menu CSS to actual inner content/item DOM and kit tokens
- Add manifest/barrel/root exports and dependency/cohort metadata
- Register qualified Menu only after all frozen parts exist

**4. Files/modules likely involved:**

- `registry/styles/menu.css`
- `registry/ui/menu.json`
- `registry/ui/menu/index.ts`
- `registry/registry.json`
- `tests/integration/menu-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated menu tree compiles/builds
- Inner kit styles do not alter positioning wrapper
- Export/asset/block inventories validate
- Repeated add is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/menu-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Menu is installed using the same generator architecture as Dialog.

**8. Commit message:** `menu: register the floating family and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S127, not an unscheduled expansion.

### S127 — Qualify Menu keyboard selection and dismissal

**Contract anchors:** R20, R22, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Qualify Menu keyboard selection and dismissal.

**2. Purpose:** Verify real accessible menu interaction in generated output.

**3. Exact scope of code changes:**

- Test keyboard navigation/typeahead/activation/disabled items from the frozen API
- Verify selection/cancellation, Escape/outside dismissal and focus return
- Exercise nested menu/dialog interaction

**4. Files/modules likely involved:**

- `tests/browser/menu-keyboard.spec.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- Focus and selection outcomes match pinned primitive contract
- Disabled items do not activate
- Caller handlers/cancellation are not lost
- Nested overlay interaction restores appropriate focus

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/menu-keyboard.spec.ts
pnpm run test:components -- tests/components/menu-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Menu behavior is browser-qualified rather than assumed from dependency choice.

**8. Commit message:** `test: qualify menu keyboard selection and dismissal`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S128, not an unscheduled expansion.

### S128 — Qualify Menu placement, themes, and CSP limits

**Contract anchors:** R21, R23, R24, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify Menu placement, themes, and CSP limits.

**2. Purpose:** Resolve the port-specific floating integration risk early.

**3. Exact scope of code changes:**

- Exercise viewport/collision/scroll/custom portal/theme cases supported by pinned API
- Inspect actual runtime style output under a documented CSP test fixture
- Publish accurate supported limits without weakening required positioning structure

**4. Files/modules likely involved:**

- `tests/browser/menu-placement.spec.ts`
- `tests/browser/menu-csp.spec.ts`
- `specs/component-maps/menu.md`
- `README.md`

**5. Required unit/integration tests:**

- Floating content stays positioned under tested scroll/viewport changes
- Global/nested themes work as documented
- CSP test reports actual pass/limitation instead of asserting zero inline style
- No hydration workaround disables SSR

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/menu-placement.spec.ts
pnpm run test:browser -- tests/browser/menu-csp.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The highest-risk floating/theme/CSP boundary has measured evidence.

**8. Commit message:** `test: qualify menu placement themes and csp limits`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S129, not an unscheduled expansion.

## M08 — Remaining forms and disclosure components

### S129 — Freeze Checkbox props and semantic mapping

**Contract anchors:** R03, R07, R20, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Freeze Checkbox props and semantic mapping.

**2. Purpose:** Derive a precise checkbox API from approved source intent and actual pinned types before implementation.

**3. Exact scope of code changes:**

- Inspect the source counterpart and freeze checked/ref/form props, source-supported indeterminate state and indicator composition
- Record a thin Bits Checkbox wrapper, exact flat exports, class/state mapping, dependencies and source/style coupling
- Add positive/negative type fixtures; do not add unrelated variants or hooks

**4. Files/modules likely involved:**

- `specs/component-maps/checkbox.md`
- `tests/components/checkbox-types.test.ts`
- `registry/ui/checkbox.types.ts only when a separate public type file is justified`

**5. Required unit/integration tests:**

- The frozen checkbox props and supported/omitted hooks are explicit
- Valid native/primitive attributes compile and invalid values fail
- Checked/unchecked and supported indeterminate cases work; native required/disabled/reset submission is preserved; indicator geometry remains fixed; no duplicate form input is introduced

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/checkbox-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Checkbox has a bounded source-anchored API and test contract.

**8. Commit message:** `checkbox: define typed source and semantic contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S130, not an unscheduled expansion.

### S130 — Generate Checkbox source and managed styles

**Contract anchors:** R02, R03, R04, R06, R07, R08, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling).

**1. Step title:** Generate Checkbox source and managed styles.

**2. Purpose:** Install checkbox as application-owned source through the existing registry, not a new runtime path.

**3. Exact scope of code changes:**

- Implement state/ref binding, native form participation, label association and noninteractive indicator markup using a thin Bits Checkbox wrapper
- Map fixed-size source indicator geometry, semantic selection color, focus/disabled states and radius properties into one kit-class-scoped managed CSS block
- Add explicit targets/exports/dependencies and register only the complete item; generate the consumer through the CLI

**4. Files/modules likely involved:**

- `registry/ui/checkbox.svelte or frozen compound directory`
- `registry/ui/checkbox.json`
- `registry/styles/checkbox.css`
- `registry/registry.json`
- `tests/integration/checkbox-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated checkbox source/type exports compile and build
- Registry ownership and dependency closure are correct
- Unrelated app files are preserved and repeat install is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/checkbox-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Checkbox is completely registered with editable source and plain CSS.

**8. Commit message:** `checkbox: generate local source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S131, not an unscheduled expansion.

### S131 — Qualify Checkbox behavior in the generated app

**Contract anchors:** R03, R07, R20, R22, R23, R25, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify Checkbox behavior in the generated app.

**2. Purpose:** Prove the exact checkbox semantics and mapped visual states rather than relying on template inspection.

**3. Exact scope of code changes:**

- Add browser assertions for Checked/unchecked and supported indeterminate cases work; native required/disabled/reset submission is preserved; indicator geometry remains fixed; no duplicate form input is introduced
- Exercise caller classes/attributes and relevant refs/bindings from the frozen API
- Check applicable theme, focus, direction and reduced-motion states without inventing new behavior

**4. Files/modules likely involved:**

- `tests/browser/checkbox.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/checkbox/`
- `specs/component-maps/checkbox.md`

**5. Required unit/integration tests:**

- Checked/unchecked and supported indeterminate cases work; native required/disabled/reset submission is preserved; indicator geometry remains fixed; no duplicate form input is introduced
- No unexpected SSR/hydration/browser errors
- Computed style/state mapping matches the contract and any limits are documented

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/checkbox.spec.ts
pnpm run test:components -- tests/components/checkbox-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Checkbox is qualified end-to-end against its frozen contract.

**8. Commit message:** `test: qualify checkbox semantics and visual states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S132, not an unscheduled expansion.

### S132 — Freeze Radio group and item contracts

**Contract anchors:** R03, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Freeze Radio group and item contracts.

**2. Purpose:** Preserve selection typing and native form semantics without inventing a new radio abstraction.

**3. Exact scope of code changes:**

- Map source radio family to pinned Radio Group types and exact flat names
- Freeze value/ref/orientation/disabled/label/form semantics justified by source
- Define item and group composition plus CSS cohort

**4. Files/modules likely involved:**

- `specs/component-maps/radio.md`
- `tests/components/radio-types.test.ts`

**5. Required unit/integration tests:**

- Value type and supported native form props compile
- Unsupported props/hooks fail
- Group/item semantics and label relationships are explicit

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/radio-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Radio family scope is frozen before wrappers.

**8. Commit message:** `radio: define group selection and form contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S133, not an unscheduled expansion.

### S133 — Author Radio group and item wrappers

**Contract anchors:** R03, R20, R21, R28, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Author Radio group and item wrappers.

**2. Purpose:** Implement the behavior-preserving selection composition independently from public registration.

**3. Exact scope of code changes:**

- Create candidate group/item/indicator parts exactly as frozen
- Preserve two-way value/ref and item semantics
- Compose a candidate fixture with source-supported cases; do not advertise an incomplete item

**4. Files/modules likely involved:**

- `registry/ui/radio/ or frozen source layout`
- `tests/components/radio-parts.test.ts`

**5. Required unit/integration tests:**

- Value updates in both directions
- Item refs/attributes/disabled behavior and label composition work
- Candidate SSR build passes without module-global counters

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/radio-parts.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Radio parts are typed and ready for styling/registration.

**8. Commit message:** `radio: preserve primitive group and item behavior`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S134, not an unscheduled expansion.

### S134 — Style and register Radio selection

**Contract anchors:** R04, R06, R07, R25, R26, R32, R33, R34. [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling).

**1. Step title:** Style and register Radio selection.

**2. Purpose:** Preserve the recognizable selection indicator design and explicit registry targets.

**3. Exact scope of code changes:**

- Map group/item/indicator CSS, focus/disabled and semantic colors
- Add manifest/export targets and dependencies with complete source/style cohort
- Generate a real consumer installation

**4. Files/modules likely involved:**

- `registry/styles/radio.css`
- `registry/ui/radio.json`
- `registry/registry.json`
- `tests/integration/radio-install.test.ts`

**5. Required unit/integration tests:**

- All generated names/paths match frozen map
- Radio mark geometry/colors and selectors match actual DOM
- Install closure/type/build and idempotence pass

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/radio-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Radio is a complete installable family.

**8. Commit message:** `radio: register selection styles and source targets`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S135, not an unscheduled expansion.

### S135 — Qualify Radio keyboard and form behavior

**Contract anchors:** R20, R22, R23, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify Radio keyboard and form behavior.

**2. Purpose:** Verify group semantics in generated application output.

**3. Exact scope of code changes:**

- Test arrow-key/group selection, disabled choices, bound value and native form/reset behavior
- Verify label/indicator/focus states under supported directions/themes
- Assert no redundant hidden inputs or broken names

**4. Files/modules likely involved:**

- `tests/browser/radio.spec.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- Group navigation and selection follow pinned contract
- Required/disabled/submission/reset cases pass
- Bound values and visual indicators remain synchronized

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/radio.spec.ts
pnpm run test:components -- tests/components/radio-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Radio form and keyboard parity is browser-qualified.

**8. Commit message:** `test: qualify radio navigation and form participation`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S136, not an unscheduled expansion.

### S136 — Freeze Tabs parts, value, and activation contracts

**Contract anchors:** R03, R20, R21, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Freeze Tabs parts, value, and activation contracts.

**2. Purpose:** Preserve tab-panel relationships and supported activation semantics.

**3. Exact scope of code changes:**

- Map required source tabs parts to pinned primitive types
- Freeze value/ref, orientation/activation options justified by source, snippets and mounted-state behavior
- Define exact flat exports and source/CSS cohort

**4. Files/modules likely involved:**

- `specs/component-maps/tabs.md`
- `tests/components/tabs-types.test.ts`

**5. Required unit/integration tests:**

- Typed value and supported options compile without union flattening
- Required part inventory and omitted extras are explicit
- Panel identity/labeling assumptions are recorded

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/tabs-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Tabs behavior is bounded and ready for independent parts.

**8. Commit message:** `tabs: define value activation and panel contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S137, not an unscheduled expansion.

### S137 — Author Tabs root and list wrappers

**Contract anchors:** R03, R20, R21, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Author Tabs root and list wrappers.

**2. Purpose:** Introduce typed tab state and grouping without duplicate keyboard machinery.

**3. Exact scope of code changes:**

- Add candidate Root/List parts with the frozen state/ref/snippet policy
- Forward supported orientation/activation options
- Compose candidate test with raw remaining primitive parts

**4. Files/modules likely involved:**

- `registry/ui/tabs/root.svelte`
- `registry/ui/tabs/list.svelte`
- `tests/components/tabs-root-list.test.ts`

**5. Required unit/integration tests:**

- Bound root value and list attributes compile
- Candidate SSR state is stable
- No new tab state engine or hidden global state appears

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/tabs-root-list.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Tabs state/group parts are independently qualified.

**8. Commit message:** `tabs: forward root state and list semantics`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S138, not an unscheduled expansion.

### S138 — Author Tabs trigger and content wrappers

**Contract anchors:** R20, R21, R22, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Author Tabs trigger and content wrappers.

**2. Purpose:** Preserve accessible activation and panel relationships.

**3. Exact scope of code changes:**

- Add candidate Trigger/Content with frozen value/disabled/ref/snippet forwarding
- Preserve pinned panel presence behavior
- Use appropriate kit classes without changing primitive semantic attributes

**4. Files/modules likely involved:**

- `registry/ui/tabs/trigger.svelte`
- `registry/ui/tabs/content.svelte`
- `tests/components/tabs-parts.test.ts`

**5. Required unit/integration tests:**

- Trigger/panel identifiers and relationships render correctly
- Disabled trigger and supported presence props retain types
- Caller handlers/snippets are not dropped

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/tabs-parts.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Tabs has complete source-parity behavior parts.

**8. Commit message:** `tabs: preserve trigger and panel relationships`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S139, not an unscheduled expansion.

### S139 — Style and register the Tabs family

**Contract anchors:** R04, R06, R14, R26, R32, R33, R34. [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Style and register the Tabs family.

**2. Purpose:** Expose a complete tabs installation with source-owned design.

**3. Exact scope of code changes:**

- Map tabs state/orientation/selected/focus styles to actual DOM
- Add explicit manifest/compound exports and dependency records
- Register only the qualified complete family

**4. Files/modules likely involved:**

- `registry/styles/tabs.css`
- `registry/ui/tabs.json`
- `registry/ui/tabs/index.ts`
- `registry/registry.json`
- `tests/integration/tabs-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated tab parts compile/build
- CSS state selectors and export paths validate
- Repeated install and safe sync preserve ownership

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/tabs-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Tabs installs with correct compound layout and managed CSS.

**8. Commit message:** `tabs: register the styled compound family`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S140, not an unscheduled expansion.

### S140 — Qualify Tabs keyboard activation and hydration

**Contract anchors:** R20, R21, R22, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Qualify Tabs keyboard activation and hydration.

**2. Purpose:** Verify actual tab accessibility and render behavior.

**3. Exact scope of code changes:**

- Test source-supported automatic/manual activation, orientation, disabled items and bound values
- Verify panel visibility/presence and relationships
- Exercise SSR initial selection and hydration

**4. Files/modules likely involved:**

- `tests/browser/tabs.spec.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- Keyboard navigation activates/focuses according to frozen options
- Disabled triggers and panel references remain correct
- Initial state hydrates without unexpected errors

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/tabs.spec.ts
pnpm run test:components -- tests/components/tabs-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Tabs is behaviorally and server-rendering qualified.

**8. Commit message:** `test: qualify tabs navigation and hydration`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S141, not an unscheduled expansion.

### S141 — Freeze Collapsible composition and presence contracts

**Contract anchors:** R03, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Freeze Collapsible composition and presence contracts.

**2. Purpose:** Keep disclosure primitive-backed and compositional.

**3. Exact scope of code changes:**

- Freeze source-required Root/Trigger/Content props/exports and open/ref binding
- Document content presence/motion and allowed snippet hooks
- Preserve accordion-like composition as a recipe, not a new state engine

**4. Files/modules likely involved:**

- `specs/component-maps/collapsible.md`
- `tests/components/collapsible-types.test.ts`

**5. Required unit/integration tests:**

- Typed controlled/uncontrolled cases compile
- Unsupported rendering hooks are explicit
- Presence contract does not copy Leptos ABI constants

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/collapsible-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Collapsible has a scoped disclosure contract.

**8. Commit message:** `collapsible: define disclosure and presence contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S142, not an unscheduled expansion.

### S142 — Author Collapsible primitive wrappers

**Contract anchors:** R03, R20, R21, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Author Collapsible primitive wrappers.

**2. Purpose:** Preserve state and disclosure semantics before visual registration.

**3. Exact scope of code changes:**

- Add candidate Root/Trigger/Content with pinned bindings/refs/snippets
- Preserve expanded/controlled relationships and presence hooks
- Avoid additional accordion behavior or custom transition state machinery

**4. Files/modules likely involved:**

- `registry/ui/collapsible/ or frozen source layout`
- `tests/components/collapsible-parts.test.ts`

**5. Required unit/integration tests:**

- Open state and trigger/content relationships are preserved
- Candidate SSR initial state passes
- Caller attributes and events remain present

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/collapsible-parts.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Disclosure parts are independently typed and usable.

**8. Commit message:** `collapsible: forward disclosure state and semantics`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S143, not an unscheduled expansion.

### S143 — Style and register Collapsible

**Contract anchors:** R04, R06, R14, R26, R32, R33, R34. [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Style and register Collapsible.

**2. Purpose:** Provide a complete source-owned disclosure item.

**3. Exact scope of code changes:**

- Map source styles to actual presence/state attributes and tokens
- Add registry targets/exports/dependencies and full source-style cohort
- Generate the installed consumer fixture

**4. Files/modules likely involved:**

- `registry/styles/collapsible.css`
- `registry/ui/collapsible.json`
- `registry/registry.json`
- `tests/integration/collapsible-install.test.ts`

**5. Required unit/integration tests:**

- Generated parts compile/build
- Presence and reduced-motion hooks map to real DOM
- Install/sync/export ownership is correct

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/collapsible-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Collapsible is installable without a separate interaction engine.

**8. Commit message:** `collapsible: register disclosure source and styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S144, not an unscheduled expansion.

### S144 — Qualify Collapsible interactions and composed disclosures

**Contract anchors:** R20, R21, R22, R29, R31, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [SCOPE_AND_ASSUMPTIONS.md](#contract-specs-scope-and-assumptions).

**1. Step title:** Qualify Collapsible interactions and composed disclosures.

**2. Purpose:** Test disclosure semantics and the intended higher-level composition boundary.

**3. Exact scope of code changes:**

- Test open binding, keyboard activation, disabled state if supported and content presence
- Exercise multiple independent disclosures in an accordion-like example
- Verify reduced motion and initial hydration

**4. Files/modules likely involved:**

- `tests/browser/collapsible.spec.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- Disclosure names/expanded relationships are correct
- Multiple items do not share unintended state
- Rapid toggle/reduced-motion cases do not strand content
- Hydration passes

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/collapsible.spec.ts
pnpm run test:components -- tests/components/collapsible-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Disclosure behavior and composition limits are qualified.

**8. Commit message:** `test: qualify collapsible disclosure composition`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S145, not an unscheduled expansion.

### S145 — Freeze Field label, helper, and error composition

**Contract anchors:** R03, R20, R22, R28, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Freeze Field label, helper, and error composition.

**2. Purpose:** Avoid inventing a form library while preserving actual source field semantics.

**3. Exact scope of code changes:**

- Inspect source Field exports and freeze a Svelte-native equivalent
- Define control/label/description/error ID and ref/attribute behavior
- Decide actual primitive/native parts and stable identity source from pinned evidence

**4. Files/modules likely involved:**

- `specs/component-maps/field.md`
- `tests/components/field-types.test.ts`

**5. Required unit/integration tests:**

- Positive native form attributes and composed controls compile
- Required label/helper/error relationships are explicitly specified
- No schema-validation engine or form-state store is introduced

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/field-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Field has a source-anchored semantic contract.

**8. Commit message:** `field: define native label helper and error contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S146, not an unscheduled expansion.

### S146 — Author Field semantic source parts

**Contract anchors:** R03, R20, R21, R22, R28, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Author Field semantic source parts.

**2. Purpose:** Implement accessible composition without generated global state.

**3. Exact scope of code changes:**

- Add frozen field/control/label/helper/error parts or single-file source shape
- Preserve native attributes, refs and association IDs
- Compose with kit controls only where the source contract calls for it

**4. Files/modules likely involved:**

- `registry/ui/field.svelte or frozen field directory`
- `tests/components/field-parts.test.ts`

**5. Required unit/integration tests:**

- Labels target actual controls
- Helpers/errors only create valid described-by references
- Multiple instances and SSR do not reuse unsafe IDs
- Native events/attributes are retained

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/field-parts.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Field semantic composition is implemented without a new form engine.

**8. Commit message:** `field: preserve native control associations`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S147, not an unscheduled expansion.

### S147 — Style and register Field

**Contract anchors:** R02, R04, R06, R10, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling).

**1. Step title:** Style and register Field.

**2. Purpose:** Install complete source-owned field presentation.

**3. Exact scope of code changes:**

- Map source field/error/helper states to kit CSS tokens/classes
- Add exact manifest/export/dependency targets
- Register only complete frozen source and generate consumer fixture

**4. Files/modules likely involved:**

- `registry/styles/field.css`
- `registry/ui/field.json`
- `registry/registry.json`
- `tests/integration/field-install.test.ts`

**5. Required unit/integration tests:**

- Generated fields typecheck/build
- CSS states match actual rendered parts
- No unrequested form library dependency is emitted

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/field-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Field installs through normal source/CSS ownership.

**8. Commit message:** `field: register accessible source and field styling`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S148, not an unscheduled expansion.

### S148 — Qualify Field labels, validation presentation, and form lifecycle

**Contract anchors:** R20, R21, R22, R28, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Qualify Field labels, validation presentation, and form lifecycle.

**2. Purpose:** Verify semantic relationships across native and kit controls.

**3. Exact scope of code changes:**

- Test label activation, helper/error references, required/disabled native props and reset
- Cover multiple fields and dynamic error presence
- Assert no request-global ID state or phantom ARIA references

**4. Files/modules likely involved:**

- `tests/browser/field.spec.ts`
- `tests/integration/field-ssr.test.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- Label/control and described-by relationships stay valid
- Form lifecycle and focus behavior are preserved
- Multiple-instance SSR/hydration produces stable correct IDs

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/field.spec.ts
pnpm run test:integration -- tests/integration/field-ssr.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Field semantics are browser and SSR qualified.

**8. Commit message:** `test: qualify field associations and form lifecycle`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S149, not an unscheduled expansion.

## M09 — Native navigation, surfaces, feedback, and identity parity

### S149 — Freeze Anchor props and semantic mapping

**Contract anchors:** R03, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Freeze Anchor props and semantic mapping.

**2. Purpose:** Derive a precise anchor API from approved source intent and actual pinned types before implementation.

**3. Exact scope of code changes:**

- Inspect the source counterpart and freeze source-supported anchor presentation, href/target/rel/download/data attributes, refs and children
- Record a native Svelte anchor, exact flat exports, class/state mapping, dependencies and source/style coupling
- Add positive/negative type fixtures; do not add unrelated variants or hooks

**4. Files/modules likely involved:**

- `specs/component-maps/anchor.md`
- `tests/components/anchor-types.test.ts`
- `registry/ui/anchor.types.ts only when a separate public type file is justified`

**5. Required unit/integration tests:**

- The frozen anchor props and supported/omitted hooks are explicit
- Valid native/primitive attributes compile and invalid values fail
- Native keyboard navigation and href/target/rel/download behavior are preserved; caller attributes/classes survive; no button activation semantics are synthesized

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/anchor-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Anchor has a bounded source-anchored API and test contract.

**8. Commit message:** `anchor: define typed source and semantic contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S150, not an unscheduled expansion.

### S150 — Generate Anchor source and managed styles

**Contract anchors:** R02, R03, R04, R06, R08, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling).

**1. Step title:** Generate Anchor source and managed styles.

**2. Purpose:** Install anchor as application-owned source through the existing registry, not a new runtime path.

**3. Exact scope of code changes:**

- Implement native navigation and typed anchor forwarding without role-button or polymorphic Button behavior using a native Svelte anchor
- Map source anchor link/hover/focus/disabled-like presentation only where semantically justified into one kit-class-scoped managed CSS block
- Add explicit targets/exports/dependencies and register only the complete item; generate the consumer through the CLI

**4. Files/modules likely involved:**

- `registry/ui/anchor.svelte or frozen compound directory`
- `registry/ui/anchor.json`
- `registry/styles/anchor.css`
- `registry/registry.json`
- `tests/integration/anchor-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated anchor source/type exports compile and build
- Registry ownership and dependency closure are correct
- Unrelated app files are preserved and repeat install is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/anchor-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Anchor is completely registered with editable source and plain CSS.

**8. Commit message:** `anchor: generate local source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S151, not an unscheduled expansion.

### S151 — Qualify Anchor behavior in the generated app

**Contract anchors:** R03, R20, R22, R23, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify Anchor behavior in the generated app.

**2. Purpose:** Prove the exact anchor semantics and mapped visual states rather than relying on template inspection.

**3. Exact scope of code changes:**

- Add browser assertions for Native keyboard navigation and href/target/rel/download behavior are preserved; caller attributes/classes survive; no button activation semantics are synthesized
- Exercise caller classes/attributes and relevant refs/bindings from the frozen API
- Check applicable theme, focus, direction and reduced-motion states without inventing new behavior

**4. Files/modules likely involved:**

- `tests/browser/anchor.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/anchor/`
- `specs/component-maps/anchor.md`

**5. Required unit/integration tests:**

- Native keyboard navigation and href/target/rel/download behavior are preserved; caller attributes/classes survive; no button activation semantics are synthesized
- No unexpected SSR/hydration/browser errors
- Computed style/state mapping matches the contract and any limits are documented

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/anchor.spec.ts
pnpm run test:components -- tests/components/anchor-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Anchor is qualified end-to-end against its frozen contract.

**8. Commit message:** `test: qualify anchor semantics and visual states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S152, not an unscheduled expansion.

### S152 — Freeze the optional Router Link recipe

**Contract anchors:** R03, R20, R26, R28, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Freeze the optional Router Link recipe.

**2. Purpose:** Preserve item-name familiarity without copying a Leptos router runtime.

**3. Exact scope of code changes:**

- Inspect target SvelteKit link/base-path conventions and source router-link presentation
- Freeze a thin optional native-anchor recipe and exact exports
- Document any justified Anchor dependency without inventing a routing service

**4. Files/modules likely involved:**

- `specs/component-maps/router-link.md`
- `tests/components/router-link-types.test.ts`

**5. Required unit/integration tests:**

- Native href and supported link options typecheck
- Base-path behavior is explicit and target-derived
- No new router package/context/store is introduced

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/router-link-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The optional recipe boundary is documented and precise.

**8. Commit message:** `router-link: define the native sveltekit link recipe`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S153, not an unscheduled expansion.

### S153 — Generate the thin Router Link recipe

**Contract anchors:** R02, R06, R10, R28, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [GENERATED_LAYOUT.md](#contract-specs-generated-layout).

**1. Step title:** Generate the thin Router Link recipe.

**2. Purpose:** Make the optional item usable through normal local-source installation.

**3. Exact scope of code changes:**

- Implement frozen native anchor recipe using direct sibling reuse where justified
- Reuse or explicitly own styles without duplicate conflicting blocks
- Add manifest/exports and dependencies only for actual needs

**4. Files/modules likely involved:**

- `registry/ui/router-link.svelte`
- `registry/ui/router-link.json`
- `optional registry/styles/router-link.css`
- `registry/registry.json`
- `tests/integration/router-link-install.test.ts`

**5. Required unit/integration tests:**

- CLI installs only the selected recipe and required dependencies
- Generated source typechecks/builds
- No Leptos runtime or unused navigation dependency appears

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/router-link-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Router Link is a thin local optional recipe, not a new router.

**8. Commit message:** `router-link: generate the optional native link recipe`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S154, not an unscheduled expansion.

### S154 — Qualify Router Link navigation and document the recipe

**Contract anchors:** R20, R22, R28, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Qualify Router Link navigation and document the recipe.

**2. Purpose:** Verify SvelteKit integration rather than assuming a styled anchor is enough.

**3. Exact scope of code changes:**

- Test internal/external/native navigation cases and supported base/link options
- Compare native anchor semantics and preserve user attributes
- Document optional install and composition with Anchor/Button

**4. Files/modules likely involved:**

- `tests/browser/router-link.spec.ts`
- `README.md`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- Internal navigation works with target configuration
- External/download/target behavior stays native
- No duplicated navigation handlers or router state is introduced

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/router-link.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The optional recipe is verified and explained without architectural inflation.

**8. Commit message:** `test: qualify the native router link recipe`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S155, not an unscheduled expansion.

### S155 — Freeze Avatar props and semantic mapping

**Contract anchors:** R03, R20, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Freeze Avatar props and semantic mapping.

**2. Purpose:** Derive a precise avatar API from approved source intent and actual pinned types before implementation.

**3. Exact scope of code changes:**

- Inspect the source counterpart and freeze source image/fallback/loading/error states, alternate text, sizes and exported parts actually needed
- Record native Svelte image/fallback markup or a thin primitive justified by the frozen source map, exact flat exports, class/state mapping, dependencies and source/style coupling
- Add positive/negative type fixtures; do not add unrelated variants or hooks

**4. Files/modules likely involved:**

- `specs/component-maps/avatar.md`
- `tests/components/avatar-types.test.ts`
- `registry/ui/avatar.types.ts only when a separate public type file is justified`

**5. Required unit/integration tests:**

- The frozen avatar props and supported/omitted hooks are explicit
- Valid native/primitive attributes compile and invalid values fail
- Image load/failure/fallback transitions are exercised; meaningful alternate text is retained; decorative use avoids redundant naming; multiple instances do not leak loading state

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/avatar-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Avatar has a bounded source-anchored API and test contract.

**8. Commit message:** `avatar: define typed source and semantic contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S156, not an unscheduled expansion.

### S156 — Generate Avatar source and managed styles

**Contract anchors:** R02, R03, R04, R06, R08, R20, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling).

**1. Step title:** Generate Avatar source and managed styles.

**2. Purpose:** Install avatar as application-owned source through the existing registry, not a new runtime path.

**3. Exact scope of code changes:**

- Implement image success/failure/fallback behavior with correct accessible text and caller attributes using native Svelte image/fallback markup or a thin primitive justified by the frozen source map
- Map source avatar dimensions, shape-critical/radius rules, fallback surface and semantic colors into one kit-class-scoped managed CSS block
- Add explicit targets/exports/dependencies and register only the complete item; generate the consumer through the CLI

**4. Files/modules likely involved:**

- `registry/ui/avatar.svelte or frozen compound directory`
- `registry/ui/avatar.json`
- `registry/styles/avatar.css`
- `registry/registry.json`
- `tests/integration/avatar-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated avatar source/type exports compile and build
- Registry ownership and dependency closure are correct
- Unrelated app files are preserved and repeat install is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/avatar-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Avatar is completely registered with editable source and plain CSS.

**8. Commit message:** `avatar: generate local source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S157, not an unscheduled expansion.

### S157 — Qualify Avatar behavior in the generated app

**Contract anchors:** R03, R20, R22, R23, R25, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify Avatar behavior in the generated app.

**2. Purpose:** Prove the exact avatar semantics and mapped visual states rather than relying on template inspection.

**3. Exact scope of code changes:**

- Add browser assertions for Image load/failure/fallback transitions are exercised; meaningful alternate text is retained; decorative use avoids redundant naming; multiple instances do not leak loading state
- Exercise caller classes/attributes and relevant refs/bindings from the frozen API
- Check applicable theme, focus, direction and reduced-motion states without inventing new behavior

**4. Files/modules likely involved:**

- `tests/browser/avatar.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/avatar/`
- `specs/component-maps/avatar.md`

**5. Required unit/integration tests:**

- Image load/failure/fallback transitions are exercised; meaningful alternate text is retained; decorative use avoids redundant naming; multiple instances do not leak loading state
- No unexpected SSR/hydration/browser errors
- Computed style/state mapping matches the contract and any limits are documented

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/avatar.spec.ts
pnpm run test:components -- tests/components/avatar-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Avatar is qualified end-to-end against its frozen contract.

**8. Commit message:** `test: qualify avatar semantics and visual states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S158, not an unscheduled expansion.

### S158 — Freeze Badge props and semantic mapping

**Contract anchors:** R03, R20, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Freeze Badge props and semantic mapping.

**2. Purpose:** Derive a precise badge API from approved source intent and actual pinned types before implementation.

**3. Exact scope of code changes:**

- Inspect the source counterpart and freeze source-supported variants, children/attributes and semantic text
- Record native typed Svelte presentation, exact flat exports, class/state mapping, dependencies and source/style coupling
- Add positive/negative type fixtures; do not add unrelated variants or hooks

**4. Files/modules likely involved:**

- `specs/component-maps/badge.md`
- `tests/components/badge-types.test.ts`
- `registry/ui/badge.types.ts only when a separate public type file is justified`

**5. Required unit/integration tests:**

- The frozen badge props and supported/omitted hooks are explicit
- Valid native/primitive attributes compile and invalid values fail
- Source variants render meaningful text; caller attributes/classes survive; computed theme/radius values and actual foreground/background combinations are checked

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/badge-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Badge has a bounded source-anchored API and test contract.

**8. Commit message:** `badge: define typed source and semantic contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S159, not an unscheduled expansion.

### S159 — Generate Badge source and managed styles

**Contract anchors:** R02, R03, R04, R06, R08, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling).

**1. Step title:** Generate Badge source and managed styles.

**2. Purpose:** Install badge as application-owned source through the existing registry, not a new runtime path.

**3. Exact scope of code changes:**

- Implement small presentational label markup without interactive or business behavior using native typed Svelte presentation
- Map source badge token/variant/shape vocabulary without adding a new palette into one kit-class-scoped managed CSS block
- Add explicit targets/exports/dependencies and register only the complete item; generate the consumer through the CLI

**4. Files/modules likely involved:**

- `registry/ui/badge.svelte or frozen compound directory`
- `registry/ui/badge.json`
- `registry/styles/badge.css`
- `registry/registry.json`
- `tests/integration/badge-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated badge source/type exports compile and build
- Registry ownership and dependency closure are correct
- Unrelated app files are preserved and repeat install is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/badge-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Badge is completely registered with editable source and plain CSS.

**8. Commit message:** `badge: generate local source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S160, not an unscheduled expansion.

### S160 — Qualify Badge behavior in the generated app

**Contract anchors:** R03, R20, R22, R23, R25, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify Badge behavior in the generated app.

**2. Purpose:** Prove the exact badge semantics and mapped visual states rather than relying on template inspection.

**3. Exact scope of code changes:**

- Add browser assertions for Source variants render meaningful text; caller attributes/classes survive; computed theme/radius values and actual foreground/background combinations are checked
- Exercise caller classes/attributes and relevant refs/bindings from the frozen API
- Check applicable theme, focus, direction and reduced-motion states without inventing new behavior

**4. Files/modules likely involved:**

- `tests/browser/badge.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/badge/`
- `specs/component-maps/badge.md`

**5. Required unit/integration tests:**

- Source variants render meaningful text; caller attributes/classes survive; computed theme/radius values and actual foreground/background combinations are checked
- No unexpected SSR/hydration/browser errors
- Computed style/state mapping matches the contract and any limits are documented

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/badge.spec.ts
pnpm run test:components -- tests/components/badge-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Badge is qualified end-to-end against its frozen contract.

**8. Commit message:** `test: qualify badge semantics and visual states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S161, not an unscheduled expansion.

### S161 — Freeze Card props and semantic mapping

**Contract anchors:** R03, R20, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Freeze Card props and semantic mapping.

**2. Purpose:** Derive a precise card API from approved source intent and actual pinned types before implementation.

**3. Exact scope of code changes:**

- Inspect the source counterpart and freeze source-supported surface parts, content composition and native attributes
- Record native compositional Svelte markup, exact flat exports, class/state mapping, dependencies and source/style coupling
- Add positive/negative type fixtures; do not add unrelated variants or hooks

**4. Files/modules likely involved:**

- `specs/component-maps/card.md`
- `tests/components/card-types.test.ts`
- `registry/ui/card.types.ts only when a separate public type file is justified`

**5. Required unit/integration tests:**

- The frozen card props and supported/omitted hooks are explicit
- Valid native/primitive attributes compile and invalid values fail
- Composed content structure remains valid; caller content/attributes are not dropped; nested cards preserve independent styles and application semantics

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/card-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Card has a bounded source-anchored API and test contract.

**8. Commit message:** `card: define typed source and semantic contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S162, not an unscheduled expansion.

### S162 — Generate Card source and managed styles

**Contract anchors:** R02, R03, R04, R06, R08, R20, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling).

**1. Step title:** Generate Card source and managed styles.

**2. Purpose:** Install card as application-owned source through the existing registry, not a new runtime path.

**3. Exact scope of code changes:**

- Implement semantic surface/content composition using only frozen parts using native compositional Svelte markup
- Map source surface, border, shadow, padding and radius roles against actual markup into one kit-class-scoped managed CSS block
- Add explicit targets/exports/dependencies and register only the complete item; generate the consumer through the CLI

**4. Files/modules likely involved:**

- `registry/ui/card.svelte or frozen compound directory`
- `registry/ui/card.json`
- `registry/styles/card.css`
- `registry/registry.json`
- `tests/integration/card-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated card source/type exports compile and build
- Registry ownership and dependency closure are correct
- Unrelated app files are preserved and repeat install is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/card-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Card is completely registered with editable source and plain CSS.

**8. Commit message:** `card: generate local source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S163, not an unscheduled expansion.

### S163 — Qualify Card behavior in the generated app

**Contract anchors:** R03, R20, R22, R23, R25, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify Card behavior in the generated app.

**2. Purpose:** Prove the exact card semantics and mapped visual states rather than relying on template inspection.

**3. Exact scope of code changes:**

- Add browser assertions for Composed content structure remains valid; caller content/attributes are not dropped; nested cards preserve independent styles and application semantics
- Exercise caller classes/attributes and relevant refs/bindings from the frozen API
- Check applicable theme, focus, direction and reduced-motion states without inventing new behavior

**4. Files/modules likely involved:**

- `tests/browser/card.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/card/`
- `specs/component-maps/card.md`

**5. Required unit/integration tests:**

- Composed content structure remains valid; caller content/attributes are not dropped; nested cards preserve independent styles and application semantics
- No unexpected SSR/hydration/browser errors
- Computed style/state mapping matches the contract and any limits are documented

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/card.spec.ts
pnpm run test:components -- tests/components/card-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Card is qualified end-to-end against its frozen contract.

**8. Commit message:** `test: qualify card semantics and visual states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S164, not an unscheduled expansion.

### S164 — Freeze Alert props and semantic mapping

**Contract anchors:** R03, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Freeze Alert props and semantic mapping.

**2. Purpose:** Derive a precise alert API from approved source intent and actual pinned types before implementation.

**3. Exact scope of code changes:**

- Inspect the source counterpart and freeze source role/variant/content and accessible label contract
- Record native semantic Svelte message presentation, exact flat exports, class/state mapping, dependencies and source/style coupling
- Add positive/negative type fixtures; do not add unrelated variants or hooks

**4. Files/modules likely involved:**

- `specs/component-maps/alert.md`
- `tests/components/alert-types.test.ts`
- `registry/ui/alert.types.ts only when a separate public type file is justified`

**5. Required unit/integration tests:**

- The frozen alert props and supported/omitted hooks are explicit
- Valid native/primitive attributes compile and invalid values fail
- Role and accessible content match frozen use cases; decorative duplicates are not announced; dynamic content and theme contrast are reviewed without inventing notifications

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/alert-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Alert has a bounded source-anchored API and test contract.

**8. Commit message:** `alert: define typed source and semantic contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S165, not an unscheduled expansion.

### S165 — Generate Alert source and managed styles

**Contract anchors:** R02, R03, R04, R06, R08, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling).

**1. Step title:** Generate Alert source and managed styles.

**2. Purpose:** Install alert as application-owned source through the existing registry, not a new runtime path.

**3. Exact scope of code changes:**

- Implement semantic alert content with no notification queue, timer or application delivery engine using native semantic Svelte message presentation
- Map source alert states and semantic text/surface/border roles into one kit-class-scoped managed CSS block
- Add explicit targets/exports/dependencies and register only the complete item; generate the consumer through the CLI

**4. Files/modules likely involved:**

- `registry/ui/alert.svelte or frozen compound directory`
- `registry/ui/alert.json`
- `registry/styles/alert.css`
- `registry/registry.json`
- `tests/integration/alert-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated alert source/type exports compile and build
- Registry ownership and dependency closure are correct
- Unrelated app files are preserved and repeat install is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/alert-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Alert is completely registered with editable source and plain CSS.

**8. Commit message:** `alert: generate local source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S166, not an unscheduled expansion.

### S166 — Qualify Alert behavior in the generated app

**Contract anchors:** R03, R20, R22, R23, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify Alert behavior in the generated app.

**2. Purpose:** Prove the exact alert semantics and mapped visual states rather than relying on template inspection.

**3. Exact scope of code changes:**

- Add browser assertions for Role and accessible content match frozen use cases; decorative duplicates are not announced; dynamic content and theme contrast are reviewed without inventing notifications
- Exercise caller classes/attributes and relevant refs/bindings from the frozen API
- Check applicable theme, focus, direction and reduced-motion states without inventing new behavior

**4. Files/modules likely involved:**

- `tests/browser/alert.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/alert/`
- `specs/component-maps/alert.md`

**5. Required unit/integration tests:**

- Role and accessible content match frozen use cases; decorative duplicates are not announced; dynamic content and theme contrast are reviewed without inventing notifications
- No unexpected SSR/hydration/browser errors
- Computed style/state mapping matches the contract and any limits are documented

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/alert.spec.ts
pnpm run test:components -- tests/components/alert-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Alert is qualified end-to-end against its frozen contract.

**8. Commit message:** `test: qualify alert semantics and visual states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S167, not an unscheduled expansion.

### S167 — Freeze Status props and semantic mapping

**Contract anchors:** R03, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Freeze Status props and semantic mapping.

**2. Purpose:** Derive a precise status API from approved source intent and actual pinned types before implementation.

**3. Exact scope of code changes:**

- Inspect the source counterpart and freeze source status/announcement/decorative distinctions and content props
- Record native semantic Svelte status presentation, exact flat exports, class/state mapping, dependencies and source/style coupling
- Add positive/negative type fixtures; do not add unrelated variants or hooks

**4. Files/modules likely involved:**

- `specs/component-maps/status.md`
- `tests/components/status-types.test.ts`
- `registry/ui/status.types.ts only when a separate public type file is justified`

**5. Required unit/integration tests:**

- The frozen status props and supported/omitted hooks are explicit
- Valid native/primitive attributes compile and invalid values fail
- Status and decorative cases have distinct correct semantics; updates do not create duplicate announcements; caller content and attributes remain intact

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/status-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Status has a bounded source-anchored API and test contract.

**8. Commit message:** `status: define typed source and semantic contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S168, not an unscheduled expansion.

### S168 — Generate Status source and managed styles

**Contract anchors:** R02, R03, R04, R06, R08, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling).

**1. Step title:** Generate Status source and managed styles.

**2. Purpose:** Install status as application-owned source through the existing registry, not a new runtime path.

**3. Exact scope of code changes:**

- Implement appropriate status feedback without a global announcement store using native semantic Svelte status presentation
- Map source status token/state presentation and optional decorative indicator mapping into one kit-class-scoped managed CSS block
- Add explicit targets/exports/dependencies and register only the complete item; generate the consumer through the CLI

**4. Files/modules likely involved:**

- `registry/ui/status.svelte or frozen compound directory`
- `registry/ui/status.json`
- `registry/styles/status.css`
- `registry/registry.json`
- `tests/integration/status-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated status source/type exports compile and build
- Registry ownership and dependency closure are correct
- Unrelated app files are preserved and repeat install is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/status-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Status is completely registered with editable source and plain CSS.

**8. Commit message:** `status: generate local source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S169, not an unscheduled expansion.

### S169 — Qualify Status behavior in the generated app

**Contract anchors:** R03, R20, R22, R23, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify Status behavior in the generated app.

**2. Purpose:** Prove the exact status semantics and mapped visual states rather than relying on template inspection.

**3. Exact scope of code changes:**

- Add browser assertions for Status and decorative cases have distinct correct semantics; updates do not create duplicate announcements; caller content and attributes remain intact
- Exercise caller classes/attributes and relevant refs/bindings from the frozen API
- Check applicable theme, focus, direction and reduced-motion states without inventing new behavior

**4. Files/modules likely involved:**

- `tests/browser/status.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/status/`
- `specs/component-maps/status.md`

**5. Required unit/integration tests:**

- Status and decorative cases have distinct correct semantics; updates do not create duplicate announcements; caller content and attributes remain intact
- No unexpected SSR/hydration/browser errors
- Computed style/state mapping matches the contract and any limits are documented

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/status.spec.ts
pnpm run test:components -- tests/components/status-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Status is qualified end-to-end against its frozen contract.

**8. Commit message:** `test: qualify status semantics and visual states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S170, not an unscheduled expansion.

### S170 — Freeze Progress props and semantic mapping

**Contract anchors:** R03, R20, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Freeze Progress props and semantic mapping.

**2. Purpose:** Derive a precise progress API from approved source intent and actual pinned types before implementation.

**3. Exact scope of code changes:**

- Inspect the source counterpart and freeze value/bounds/indeterminate state, accessible name and actual native prop behavior
- Record a native semantic progress element or a narrowly justified primitive selected in the source map, exact flat exports, class/state mapping, dependencies and source/style coupling
- Add positive/negative type fixtures; do not add unrelated variants or hooks

**4. Files/modules likely involved:**

- `specs/component-maps/progress.md`
- `tests/components/progress-types.test.ts`
- `registry/ui/progress.types.ts only when a separate public type file is justified`

**5. Required unit/integration tests:**

- The frozen progress props and supported/omitted hooks are explicit
- Valid native/primitive attributes compile and invalid values fail
- Determinate bounds/value and indeterminate semantics are correct; accessible naming is retained; source-supported changes stay synchronized with visual state

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/progress-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Progress has a bounded source-anchored API and test contract.

**8. Commit message:** `progress: define typed source and semantic contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S171, not an unscheduled expansion.

### S171 — Generate Progress source and managed styles

**Contract anchors:** R02, R03, R04, R06, R08, R20, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling).

**1. Step title:** Generate Progress source and managed styles.

**2. Purpose:** Install progress as application-owned source through the existing registry, not a new runtime path.

**3. Exact scope of code changes:**

- Implement determinate and indeterminate semantic progress without timers or task orchestration using a native semantic progress element or a narrowly justified primitive selected in the source map
- Map source progress track/indicator states and semantic color/shape properties into one kit-class-scoped managed CSS block
- Add explicit targets/exports/dependencies and register only the complete item; generate the consumer through the CLI

**4. Files/modules likely involved:**

- `registry/ui/progress.svelte or frozen compound directory`
- `registry/ui/progress.json`
- `registry/styles/progress.css`
- `registry/registry.json`
- `tests/integration/progress-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated progress source/type exports compile and build
- Registry ownership and dependency closure are correct
- Unrelated app files are preserved and repeat install is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/progress-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Progress is completely registered with editable source and plain CSS.

**8. Commit message:** `progress: generate local source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S172, not an unscheduled expansion.

### S172 — Qualify Progress behavior in the generated app

**Contract anchors:** R03, R20, R22, R23, R25, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify Progress behavior in the generated app.

**2. Purpose:** Prove the exact progress semantics and mapped visual states rather than relying on template inspection.

**3. Exact scope of code changes:**

- Add browser assertions for Determinate bounds/value and indeterminate semantics are correct; accessible naming is retained; source-supported changes stay synchronized with visual state
- Exercise caller classes/attributes and relevant refs/bindings from the frozen API
- Check applicable theme, focus, direction and reduced-motion states without inventing new behavior

**4. Files/modules likely involved:**

- `tests/browser/progress.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/progress/`
- `specs/component-maps/progress.md`

**5. Required unit/integration tests:**

- Determinate bounds/value and indeterminate semantics are correct; accessible naming is retained; source-supported changes stay synchronized with visual state
- No unexpected SSR/hydration/browser errors
- Computed style/state mapping matches the contract and any limits are documented

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/progress.spec.ts
pnpm run test:components -- tests/components/progress-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Progress is qualified end-to-end against its frozen contract.

**8. Commit message:** `test: qualify progress semantics and visual states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S173, not an unscheduled expansion.

### S173 — Freeze Separator props and semantic mapping

**Contract anchors:** R03, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Freeze Separator props and semantic mapping.

**2. Purpose:** Derive a precise separator API from approved source intent and actual pinned types before implementation.

**3. Exact scope of code changes:**

- Inspect the source counterpart and freeze decorative versus meaningful separator, orientation and forwarded native attributes
- Record native or thin primitive separator markup justified by the source map, exact flat exports, class/state mapping, dependencies and source/style coupling
- Add positive/negative type fixtures; do not add unrelated variants or hooks

**4. Files/modules likely involved:**

- `specs/component-maps/separator.md`
- `tests/components/separator-types.test.ts`
- `registry/ui/separator.types.ts only when a separate public type file is justified`

**5. Required unit/integration tests:**

- The frozen separator props and supported/omitted hooks are explicit
- Valid native/primitive attributes compile and invalid values fail
- Meaningful and decorative cases have correct roles; supported orientation is reflected in semantics and CSS; caller attributes/classes are preserved

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/separator-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Separator has a bounded source-anchored API and test contract.

**8. Commit message:** `separator: define typed source and semantic contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S174, not an unscheduled expansion.

### S174 — Generate Separator source and managed styles

**Contract anchors:** R02, R03, R04, R06, R08, R20, R22, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling).

**1. Step title:** Generate Separator source and managed styles.

**2. Purpose:** Install separator as application-owned source through the existing registry, not a new runtime path.

**3. Exact scope of code changes:**

- Implement semantic or decorative separation without extra interactive behavior using native or thin primitive separator markup justified by the source map
- Map source orientation, sizing and semantic border rules into one kit-class-scoped managed CSS block
- Add explicit targets/exports/dependencies and register only the complete item; generate the consumer through the CLI

**4. Files/modules likely involved:**

- `registry/ui/separator.svelte or frozen compound directory`
- `registry/ui/separator.json`
- `registry/styles/separator.css`
- `registry/registry.json`
- `tests/integration/separator-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated separator source/type exports compile and build
- Registry ownership and dependency closure are correct
- Unrelated app files are preserved and repeat install is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/separator-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Separator is completely registered with editable source and plain CSS.

**8. Commit message:** `separator: generate local source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S175, not an unscheduled expansion.

### S175 — Qualify Separator behavior in the generated app

**Contract anchors:** R03, R20, R22, R23, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify Separator behavior in the generated app.

**2. Purpose:** Prove the exact separator semantics and mapped visual states rather than relying on template inspection.

**3. Exact scope of code changes:**

- Add browser assertions for Meaningful and decorative cases have correct roles; supported orientation is reflected in semantics and CSS; caller attributes/classes are preserved
- Exercise caller classes/attributes and relevant refs/bindings from the frozen API
- Check applicable theme, focus, direction and reduced-motion states without inventing new behavior

**4. Files/modules likely involved:**

- `tests/browser/separator.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/separator/`
- `specs/component-maps/separator.md`

**5. Required unit/integration tests:**

- Meaningful and decorative cases have correct roles; supported orientation is reflected in semantics and CSS; caller attributes/classes are preserved
- No unexpected SSR/hydration/browser errors
- Computed style/state mapping matches the contract and any limits are documented

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/separator.spec.ts
pnpm run test:components -- tests/components/separator-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Separator is qualified end-to-end against its frozen contract.

**8. Commit message:** `test: qualify separator semantics and visual states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S176, not an unscheduled expansion.

### S176 — Freeze Skeleton props and semantic mapping

**Contract anchors:** R03, R20, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Freeze Skeleton props and semantic mapping.

**2. Purpose:** Derive a precise skeleton API from approved source intent and actual pinned types before implementation.

**3. Exact scope of code changes:**

- Inspect the source counterpart and freeze source size/shape/presentation props and non-announcement semantics
- Record native decorative Svelte placeholder markup, exact flat exports, class/state mapping, dependencies and source/style coupling
- Add positive/negative type fixtures; do not add unrelated variants or hooks

**4. Files/modules likely involved:**

- `specs/component-maps/skeleton.md`
- `tests/components/skeleton-types.test.ts`
- `registry/ui/skeleton.types.ts only when a separate public type file is justified`

**5. Required unit/integration tests:**

- The frozen skeleton props and supported/omitted hooks are explicit
- Valid native/primitive attributes compile and invalid values fail
- Placeholder adds no redundant readable or live-region content; reduced motion and theme surfaces work; actual shape/radius overrides follow the contract

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/skeleton-types.test.ts
pnpm run fixture:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Skeleton has a bounded source-anchored API and test contract.

**8. Commit message:** `skeleton: define typed source and semantic contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S177, not an unscheduled expansion.

### S177 — Generate Skeleton source and managed styles

**Contract anchors:** R02, R03, R04, R06, R08, R22, R25, R26, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling).

**1. Step title:** Generate Skeleton source and managed styles.

**2. Purpose:** Install skeleton as application-owned source through the existing registry, not a new runtime path.

**3. Exact scope of code changes:**

- Implement decorative loading placeholder without fabricated readable content or timer state using native decorative Svelte placeholder markup
- Map source surface/motion/shape and component customization rules into one kit-class-scoped managed CSS block
- Add explicit targets/exports/dependencies and register only the complete item; generate the consumer through the CLI

**4. Files/modules likely involved:**

- `registry/ui/skeleton.svelte or frozen compound directory`
- `registry/ui/skeleton.json`
- `registry/styles/skeleton.css`
- `registry/registry.json`
- `tests/integration/skeleton-install.test.ts`

**5. Required unit/integration tests:**

- CLI-generated skeleton source/type exports compile and build
- Registry ownership and dependency closure are correct
- Unrelated app files are preserved and repeat install is unchanged

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/skeleton-install.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Skeleton is completely registered with editable source and plain CSS.

**8. Commit message:** `skeleton: generate local source and managed styles`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S178, not an unscheduled expansion.

### S178 — Qualify Skeleton behavior in the generated app

**Contract anchors:** R03, R20, R22, R23, R25, R26, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify Skeleton behavior in the generated app.

**2. Purpose:** Prove the exact skeleton semantics and mapped visual states rather than relying on template inspection.

**3. Exact scope of code changes:**

- Add browser assertions for Placeholder adds no redundant readable or live-region content; reduced motion and theme surfaces work; actual shape/radius overrides follow the contract
- Exercise caller classes/attributes and relevant refs/bindings from the frozen API
- Check applicable theme, focus, direction and reduced-motion states without inventing new behavior

**4. Files/modules likely involved:**

- `tests/browser/skeleton.spec.ts`
- `tests/fixtures/consumer/src/routes/qualification/skeleton/`
- `specs/component-maps/skeleton.md`

**5. Required unit/integration tests:**

- Placeholder adds no redundant readable or live-region content; reduced motion and theme surfaces work; actual shape/radius overrides follow the contract
- No unexpected SSR/hydration/browser errors
- Computed style/state mapping matches the contract and any limits are documented

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/skeleton.spec.ts
pnpm run test:components -- tests/components/skeleton-types.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Skeleton is qualified end-to-end against its frozen contract.

**8. Commit message:** `test: qualify skeleton semantics and visual states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S179, not an unscheduled expansion.

### S179 — Resolve identity parity using pinned Svelte and Bits mechanisms

**Contract anchors:** R03, R21, R26, R28, R32, R33, R34. [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Resolve identity parity using pinned Svelte and Bits mechanisms.

**2. Purpose:** Preserve stable identity without shipping an unnecessary Rust-style helper.

**3. Exact scope of code changes:**

- Review generated field/control/dialog relationships and pinned ID facilities
- Record whether any app-owned helper is actually needed
- Prefer documented non-generated identity mapping; only add a minimal helper/item if evidence proves necessity and contract is frozen

**4. Files/modules likely involved:**

- `specs/component-maps/identity.md`
- `tests/components/identity-contract.test.ts`
- `conditional registry identity target only if justified`

**5. Required unit/integration tests:**

- ID strategy is documented per affected component
- No process-global counter/provider clone exists
- Non-generated mapping leaves no fake identity registry alias
- Any necessary helper has explicit types and ownership

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/identity-contract.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The original identity item has an evidence-backed Svelte-native parity disposition.

**8. Commit message:** `identity: resolve stable ids without rust compatibility shims`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S180, not an unscheduled expansion.

### S180 — Qualify cross-request and multi-instance identity

**Contract anchors:** R21, R22, R28, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Qualify cross-request and multi-instance identity.

**2. Purpose:** Verify that label/overlay correctness survives real rendering lifecycles.

**3. Exact scope of code changes:**

- Render multiple control/field/dialog instances and multiple server requests
- Hydrate with stable associations and explicit ID overrides
- Test conditional rendering within the pinned supported contract

**4. Files/modules likely involved:**

- `tests/integration/identity-ssr.test.ts`
- `tests/browser/identity.spec.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- No leaked mutable state or accidental duplicate IDs
- Labels/title/description references point to intended live elements
- Hydration produces no unexpected identity errors

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/identity-ssr.test.ts
pnpm run test:browser -- tests/browser/identity.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Identity parity is verified rather than assumed from primitive choice.

**8. Commit message:** `test: qualify request-local component identity`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S181, not an unscheduled expansion.

### S181 — Audit complete reference-catalog coverage

**Contract anchors:** R06, R26, R27, R28, R31, R32, R33, R34. [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SCOPE_AND_ASSUMPTIONS.md](#contract-specs-scope-and-assumptions).

**1. Step title:** Audit complete reference-catalog coverage.

**2. Purpose:** Ensure the original 22 IDs have no silently omitted or fabricated mappings.

**3. Exact scope of code changes:**

- Compare source inventory with implemented item maps and qualified registry root
- Record optional Router Link and evidence-backed identity disposition
- Verify distinct Alert Dialog and source-only behavior adjustments are documented

**4. Files/modules likely involved:**

- `specs/COMPONENT_CATALOG.md`
- `registry/registry.json`
- `tests/registry/catalog-parity.test.ts`
- `README.md`

**5. Required unit/integration tests:**

- All original entries have explicit disposition
- Every advertised target/part/style exists and compiles
- No unapproved extra component is smuggled into the catalog
- Source-required behavior gaps block completion

**6. Verification commands:**

```sh
pnpm run test:registry -- tests/registry/catalog-parity.test.ts
pnpm run test:registry
pnpm run test:components
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Catalog parity is complete and its deliberate adaptations are traceable.

**8. Commit message:** `registry: qualify complete source catalog coverage`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S182, not an unscheduled expansion.

## M10 — Cross-component regression and supported-environment qualification

### S182 — Audit public exports and consumer dependency direction

**Contract anchors:** R01, R02, R06, R20, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [PRODUCT_SPEC.md](#contract-specs-product-spec).

**1. Step title:** Audit public exports and consumer dependency direction.

**2. Purpose:** Ensure local-source ownership is reflected in actual imports and build output.

**3. Exact scope of code changes:**

- Scan all registered item exports and installed sibling imports
- Detect root-barrel cycles, CLI/Node imports and unintended styled-runtime dependencies
- Verify type-only exports are represented correctly

**4. Files/modules likely involved:**

- `tests/registry/public-exports.test.ts`
- `tests/integration/consumer-imports.test.ts`
- `registry/ui/`

**5. Required unit/integration tests:**

- Every declared public symbol resolves from generated root barrel
- Consumer graph contains no CLI/registry/Node-only implementation
- No unnecessary components/index.ts or parallel namespace aliases appear

**6. Verification commands:**

```sh
pnpm run test:registry -- tests/registry/public-exports.test.ts
pnpm run test:integration -- tests/integration/consumer-imports.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The complete catalog preserves intended import and ownership boundaries.

**8. Commit message:** `test: audit generated exports and dependency direction`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S183, not an unscheduled expansion.

### S183 — Qualify cross-family bindings, refs, and snippet forwarding

**Contract anchors:** R20, R22, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Qualify cross-family bindings, refs, and snippet forwarding.

**2. Purpose:** Catch wrapper regressions hidden by isolated happy-path tests.

**3. Exact scope of code changes:**

- Add shared generated-app qualification across all stateful/compound families
- Exercise getter/setter and ordinary bindings where supported, element refs and delegated snippets
- Assert merge ordering/cancellation and rejected rendering hooks

**4. Files/modules likely involved:**

- `tests/components/wrapper-contracts.test.ts`
- `tests/browser/wrapper-contracts.spec.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- State/ref flows are preserved for every advertised bound prop
- Caller event cancellation/order follows pinned contract
- Floating wrapperProps are not collapsed
- Unsupported children/child usage fails typing rather than disappearing

**6. Verification commands:**

```sh
pnpm run test:components -- tests/components/wrapper-contracts.test.ts
pnpm run test:browser -- tests/browser/wrapper-contracts.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The shared wrapper rules have full-catalog evidence.

**8. Commit message:** `test: qualify wrapper bindings refs and delegation`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S184, not an unscheduled expansion.

### S184 — Qualify combined native forms and reset behavior

**Contract anchors:** R03, R20, R22, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Qualify combined native forms and reset behavior.

**2. Purpose:** Verify that multiple generated controls compose into one real form.

**3. Exact scope of code changes:**

- Build combined Button/Field/Checkbox/Radio/Switch form fixtures
- Test submission names/values, required/disabled/loading and reset
- Assert valid associations and no duplicate hidden inputs across controls

**4. Files/modules likely involved:**

- `tests/browser/forms-composition.spec.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- Combined form data is correct
- Native reset synchronizes actual control state according to frozen APIs
- Loading/disabled buttons and controls cannot activate incorrectly
- No extra validation/state framework is needed

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/forms-composition.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Form composition preserves the native behavior contract end-to-end.

**8. Commit message:** `test: qualify combined forms and native reset`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S185, not an unscheduled expansion.

### S185 — Qualify nested overlay interactions across families

**Contract anchors:** R03, R20, R22, R27, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Qualify nested overlay interactions across families.

**2. Purpose:** Ensure distinct primitives compose without duplicate kit-level state.

**3. Exact scope of code changes:**

- Test Menu inside Dialog and supported Alert Dialog nesting/composition
- Verify focus return, Escape/outside handling and rapid presence transitions
- Keep primitive behavior distinctions explicit

**4. Files/modules likely involved:**

- `tests/browser/overlay-composition.spec.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- Focus returns to the intended live trigger
- Closing one overlay does not incorrectly dismiss or strand another
- No hidden kit focus stack/global layer manager exists
- Interrupted transitions clean up correctly

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/overlay-composition.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Overlay composition works through native primitive responsibilities.

**8. Commit message:** `test: qualify cross-family overlay composition`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S186, not an unscheduled expansion.

### S186 — Audit complete CSS property and selector coverage

**Contract anchors:** R04, R07, R25, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [STYLING.md](#contract-specs-styling).

**1. Step title:** Audit complete CSS property and selector coverage.

**2. Purpose:** Ensure reusable visual contracts survived every component mapping.

**3. Exact scope of code changes:**

- Compare all public kit classes/properties with mapped DOM and contract inventory
- Add full-catalog radius/shape/default/token fallback assertions
- Verify aggregate stylesheet ownership and no duplicate authoritative installed CSS

**4. Files/modules likely involved:**

- `tests/registry/css-contract-coverage.test.ts`
- `tests/browser/css-contracts.spec.ts`
- `registry/contracts/`

**5. Required unit/integration tests:**

- No undocumented copied selector targets nonexistent DOM
- Public customization properties have actual behavior coverage
- Shape-critical defaults persist
- No Tailwind/CSS-in-JS syntax or per-component duplicate stylesheet pipeline appears

**6. Verification commands:**

```sh
pnpm run test:registry -- tests/registry/css-contract-coverage.test.ts
pnpm run test:browser -- tests/browser/css-contracts.spec.ts
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Styling contracts are complete and tied to generated DOM.

**8. Commit message:** `test: audit catalog css and customization contracts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S187, not an unscheduled expansion.

### S187 — Qualify catalog-wide themes and portal changes

**Contract anchors:** R17, R23, R24, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify catalog-wide themes and portal changes.

**2. Purpose:** Verify one design vocabulary works across surfaces, controls, and overlays.

**3. Exact scope of code changes:**

- Add global/nested theme fixtures across the complete catalog
- Exercise open-overlay theme changes and explicit custom hosts
- Document aggregate CSS and application-owned persistence behavior without adding a store

**4. Files/modules likely involved:**

- `tests/browser/catalog-themes.spec.ts`
- `README.md`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- Controls/surfaces and appropriate body-portaled overlays share document theme
- Nested hosts inherit intended tokens within documented stacking limits
- Theme/app CSS stays untouched through sync

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/catalog-themes.spec.ts
pnpm run test:integration -- tests/integration/layout-imports.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Global and nested theme behavior is consistent across the full catalog.

**8. Commit message:** `test: qualify catalog theme scope behavior`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S188, not an unscheduled expansion.

### S188 — Qualify directional, motion, and accessibility state coverage

**Contract anchors:** R22, R24, R25, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify directional, motion, and accessibility state coverage.

**2. Purpose:** Check visual/interaction variants systematically without claiming unsupported certification.

**3. Exact scope of code changes:**

- Extend supported browser fixtures for RTL, reduced motion, focus visibility and label/role state
- Pair accessibility tooling with direct keyboard/semantic assertions
- Record observed contrast/accessibility limits and source-related remediation without inventing a redesign

**4. Files/modules likely involved:**

- `tests/browser/accessibility-states.spec.ts`
- `implementation evidence/ACCESSIBILITY.md`
- `CI browser configuration`

**5. Required unit/integration tests:**

- Applicable directional controls behave correctly
- Motion reduction does not hide essential state
- Names/roles/focus pass explicit assertions
- Any unresolved required issue blocks release rather than being masked

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/accessibility-states.spec.ts
pnpm run test:browser
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Supported accessibility/state coverage is evidenced and honestly bounded.

**8. Commit message:** `test: qualify accessible directional and motion states`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S189, not an unscheduled expansion.

### S189 — Qualify full-catalog SSR and hydration

**Contract anchors:** R20, R21, R28, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog).

**1. Step title:** Qualify full-catalog SSR and hydration.

**2. Purpose:** Prove the actual target rendering model across all advertised components.

**3. Exact scope of code changes:**

- Render all qualified items with representative initial values on the server
- Hydrate generated application routes with console/error capture
- Exercise independent requests and conditional/multiple instances within supported contracts

**4. Files/modules likely involved:**

- `tests/integration/catalog-ssr.test.ts`
- `tests/browser/catalog-hydration.spec.ts`
- `consumer qualification routes`

**5. Required unit/integration tests:**

- No unexpected SSR import or hydration errors
- Initial state matches supported pinned behavior
- IDs/labels/state do not leak across requests
- No component is qualified by disabling SSR

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/catalog-ssr.test.ts
pnpm run test:browser -- tests/browser/catalog-hydration.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** All advertised components are qualified for SvelteKit SSR/hydration.

**8. Commit message:** `test: qualify full catalog ssr and hydration`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S190, not an unscheduled expansion.

### S190 — Qualify supported custom-layout and workspace installs

**Contract anchors:** R05, R09, R16, R17, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify supported custom-layout and workspace installs.

**2. Purpose:** Verify declared path support using the complete item set.

**3. Exact scope of code changes:**

- Generate representative simple/compound items into each supported explicit mapping
- Test --cwd isolation within workspace fixtures
- Exercise unsupported layouts as nonmutating diagnostics

**4. Files/modules likely involved:**

- `tests/integration/layout-matrix.test.ts`
- `tests/fixtures/layouts/`
- `implementation evidence/COMPATIBILITY.md`

**5. Required unit/integration tests:**

- Relative sibling/export/CSS/layout paths resolve in supported mappings
- Neighbor workspace packages are unchanged
- Unsupported dynamic layout is not guessed or executed
- Custom theme files survive updates

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/layout-matrix.test.ts
pnpm run test:integration -- tests/integration/project-root.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Advertised integration layouts have complete workflow evidence.

**8. Commit message:** `test: qualify scoped custom-layout installations`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S191, not an unscheduled expansion.

### S191 — Qualify full-catalog retirement and re-add workflows

**Contract anchors:** R11, R13, R17, R18, R32, R33, R34. [DATA_MODEL.md](#contract-specs-data-model), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Qualify full-catalog retirement and re-add workflows.

**2. Purpose:** Test ownership lifecycle with real dependency sharing and customized assets.

**3. Exact scope of code changes:**

- Remove selected roots from a generated catalog fixture and synchronize
- Cover shared needed dependencies, clean obsolete files, customized CSS/source and application exports
- Re-add retained targets to verify no silent ownership acquisition

**4. Files/modules likely involved:**

- `tests/integration/catalog-retirement.test.ts`
- `tests/fixtures/retirement/`

**5. Required unit/integration tests:**

- Only safe clean obsolete assets retire
- Customized assets survive with truthful detached ownership/diagnostics
- Needed dependencies remain and request roots are not polluted
- Re-add conflicts/adoption follow frozen policy

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/catalog-retirement.test.ts
pnpm run test:integration -- tests/integration/workflow-purity.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Removal/re-add lifecycle preserves real application work.

**8. Commit message:** `test: qualify catalog retirement and reinstallation`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S192, not an unscheduled expansion.

### S192 — Qualify real component update cohorts

**Contract anchors:** R12, R13, R14, R15, R32, R33, R34. [DATA_MODEL.md](#contract-specs-data-model), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Qualify real component update cohorts.

**2. Purpose:** Exercise coupled DOM/CSS/export changes using representative generated families.

**3. Exact scope of code changes:**

- Create labeled synthetic old/incoming Button/Dialog/Menu revisions
- Cover locally edited source, CSS, related exports and dependent API changes
- Inspect per-target lock lineage after safe and blocked transitions

**4. Files/modules likely involved:**

- `tests/fixtures/upgrades/components/`
- `tests/integration/component-upgrades.test.ts`

**5. Required unit/integration tests:**

- Compatible untouched upgrades apply together
- Source/style conflict leaves the entire batch unchanged
- Locally preserved cohort members do not receive falsely advanced bases
- Unrelated unchanged components avoid false conflicts

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/component-upgrades.test.ts
pnpm run test:integration -- tests/integration/lock-projection.test.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Cohort policy is proven against realistic compound component updates.

**8. Commit message:** `test: qualify component source and style upgrade cohorts`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S193, not an unscheduled expansion.

### S193 — Qualify filesystem behavior on supported operating systems

**Contract anchors:** R16, R24, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [STYLING.md](#contract-specs-styling).

**1. Step title:** Qualify filesystem behavior on supported operating systems.

**2. Purpose:** Replace portability assumptions with explicit platform evidence.

**3. Exact scope of code changes:**

- Run path/case/symlink/rename/mode/concurrency/recovery tests on supported OS lanes
- Document actual support and unproven hostile-race limits
- Preserve any applicable Rust transaction platform checks independently

**4. Files/modules likely involved:**

- `CI workflow configuration`
- `tests/integration/platform-filesystem.test.ts`
- `implementation evidence/PLATFORMS.md`

**5. Required unit/integration tests:**

- Advertised Linux/macOS/Windows behavior has passing evidence or remains blocked
- Platform-specific failures are fixed within affected modules, not hidden by skipped safety tests
- No broader capability-security claim is introduced

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/platform-filesystem.test.ts
pnpm run test:integration -- tests/integration/transaction-processes.test.ts
# DISCOVER/VERIFY: Execute discovered supported-OS CI lanes and record actual results; do not claim local execution of remote lanes
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Filesystem support has a documented tested matrix.

**8. Commit message:** `ci: qualify supported filesystem and recovery platforms`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S194, not an unscheduled expansion.

## M11 — Packed acceptance, operating documentation, and final specification

### S194 — Prove installed CLI independence from authoring source

**Contract anchors:** R01, R08, R29, R30, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [DATA_MODEL.md](#contract-specs-data-model), [PRODUCT_SPEC.md](#contract-specs-product-spec).

**1. Step title:** Prove installed CLI independence from authoring source.

**2. Purpose:** Make packaging acceptance verify the source-first distribution promise.

**3. Exact scope of code changes:**

- Build/pack/install the CLI into an isolated test location
- Make authoring source/build/fixture assets unavailable after installation
- Exercise view/init/add/sync/doctor using only packed assets and explicit consumer setup

**4. Files/modules likely involved:**

- `tests/package/installed-runtime.test.ts`
- `tests/helpers/packaged-cli.ts`
- `package.json`

**5. Required unit/integration tests:**

- Installed executable retains all required assets/contracts/schemas
- Commands do not read deleted/unavailable source paths
- Root/compound item installation and sync still work
- Registry operations do not require live GitHub

**6. Verification commands:**

```sh
pnpm run build
pnpm pack --json
pnpm run test:package -- tests/package/installed-runtime.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Tarball distribution is independently operational.

**8. Commit message:** `package: prove installed runtime source independence`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S195, not an unscheduled expansion.

### S195 — Qualify a consumer generated by the installed tarball

**Contract anchors:** R02, R04, R10, R13, R21, R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [STYLING.md](#contract-specs-styling), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Qualify a consumer generated by the installed tarball.

**2. Purpose:** Verify the actual distributable output rather than development templates.

**3. Exact scope of code changes:**

- Generate the representative complete-catalog app using the isolated installed CLI
- Install declared consumer dependencies explicitly through the detected manager
- Run type/build/browser and ownership upgrade checks on that app

**4. Files/modules likely involved:**

- `tests/package/generated-consumer.test.ts`
- `tests/fixtures/packaged-consumer/`
- `package acceptance scripts`

**5. Required unit/integration tests:**

- Consumer check/build/SSR/hydration and scoped browser suites pass from packed output
- Local imports and pure CSS have no hidden CLI runtime dependence
- Dependency instructions are sufficient and honest
- Safe/custom/conflicting sync behavior persists

**6. Verification commands:**

```sh
pnpm run test:package -- tests/package/generated-consumer.test.ts
# DISCOVER/VERIFY: Run actual generated consumer svelte-check/build/browser commands recorded by the harness
pnpm run test:package -- tests/package/inventory.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The packed product generates a verified real application.

**8. Commit message:** `package: qualify the generated consumer end to end`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S196, not an unscheduled expansion.

### S196 — Verify advertised compatibility and release metadata

**Contract anchors:** R01, R08, R10, R12, R24, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [DATA_MODEL.md](#contract-specs-data-model), [PRODUCT_SPEC.md](#contract-specs-product-spec), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [STYLING.md](#contract-specs-styling).

**1. Step title:** Verify advertised compatibility and release metadata.

**2. Purpose:** Avoid claiming dependency/version/platform support beyond actual evidence.

**3. Exact scope of code changes:**

- Compare supported version ranges with passing selected baseline/matrix tests
- Verify package bin/engine/module/files/peer metadata and actual name/license status without publishing
- Preserve upstream notices for copied source/CSS and document unresolved ownership/publishing questions

**4. Files/modules likely involved:**

- `package.json`
- `license/notice files as required by target policy`
- `implementation evidence/COMPATIBILITY.md`
- `tests/package/metadata.test.ts`

**5. Required unit/integration tests:**

- Published-shaped metadata does not claim untested major compatibility
- Package includes required notices and no private/unrelated files
- CLI/consumer dependency roles are correct
- npm-name conflict is reported rather than silently renaming product

**6. Verification commands:**

```sh
pnpm run test:package -- tests/package/metadata.test.ts
pnpm run test:registry
pnpm run fixture:check
pnpm run fixture:build
# DISCOVER/VERIFY: Verify actual package/peer metadata with the selected manager; do not run npm publish
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Compatibility and distribution claims match tested evidence.

**8. Commit message:** `package: align release metadata with verified compatibility`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S197, not an unscheduled expansion.

### S197 — Document install, customization, and upgrade operations

**Contract anchors:** R02, R09, R10, R13, R18, R19, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Document install, customization, and upgrade operations.

**2. Purpose:** Make the approved ownership workflow usable without coding-agent context.

**3. Exact scope of code changes:**

- Write root README/CONTRIBUTING commands using actual executable/package state
- Explain config roots, generated ownership, token/property customization, dry runs and doctor
- Include exact upgrade/conflict/retirement examples and no auto-merge/auto-install promise

**4. Files/modules likely involved:**

- `README.md`
- `CONTRIBUTING.md`
- `tests/integration/docs-upgrade.test.ts`
- `implementation/OPERATIONS_RUNBOOK.md`

**5. Required unit/integration tests:**

- Execute documented installation/upgrade examples in fresh fixtures
- Explanations distinguish customized from broken state
- Commands do not assume a package was published when it was only packed

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/docs-upgrade.test.ts
pnpm run format:check
pnpm run test:integration -- tests/integration/documented-workflow.test.ts
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Operational guidance reflects actual verified behavior.

**8. Commit message:** `docs: explain installation customization and safe upgrades`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S198, not an unscheduled expansion.

### S198 — Document and exercise recovery procedures

**Contract anchors:** R09, R13, R16, R32, R33, R34. [API_CONTRACTS.md](#contract-specs-api-contracts), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions), [SYNCHRONIZATION.md](#contract-specs-synchronization).

**1. Step title:** Document and exercise recovery procedures.

**2. Purpose:** Make failure handling actionable without unsafe manual deletion advice.

**3. Exact scope of code changes:**

- Write recovery guidance for locked/stale/ambiguous/committed-cleanup states using implemented outcomes
- Include backing up current work and preserving transaction evidence
- Test all documented safe procedures and avoid undocumented force/recover commands

**4. Files/modules likely involved:**

- `implementation/OPERATIONS_RUNBOOK.md`
- `README.md`
- `tests/integration/docs-recovery.test.ts`

**5. Required unit/integration tests:**

- Documented procedures recover qualified fixtures or stop safely
- Post-crash user edits are retained
- Corrupt evidence never recommends blind journal/lock deletion
- Read-only diagnosis stays nonmutating

**6. Verification commands:**

```sh
pnpm run test:integration -- tests/integration/docs-recovery.test.ts
pnpm run test:integration -- tests/integration/recovery-invalid.test.ts
pnpm run format:check
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Recovery instructions match the implemented safety protocol.

**8. Commit message:** `docs: qualify safe transaction recovery procedures`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S199, not an unscheduled expansion.

### S199 — Add documented compositional examples without new primitives

**Contract anchors:** R02, R03, R22, R28, R31, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [GENERATED_LAYOUT.md](#contract-specs-generated-layout), [SCOPE_AND_ASSUMPTIONS.md](#contract-specs-scope-and-assumptions).

**1. Step title:** Add documented compositional examples without new primitives.

**2. Purpose:** Show intended higher-level usage while respecting the approved catalog boundary.

**3. Exact scope of code changes:**

- Add examples composing collapsibles, alert/status, anchor/router-link/button and native semantic structure
- Keep examples app-owned and separate from new registry item APIs
- Demonstrate form and overlay/theme composition with actual installed imports

**4. Files/modules likely involved:**

- `tests/fixtures/consumer/src/routes/examples/`
- `README.md`
- `tests/browser/composition-examples.spec.ts`

**5. Required unit/integration tests:**

- Examples compile/build and use local flat exports
- No notification queue/data-grid/accordion state framework is introduced
- Keyboard/semantic smoke tests pass for actual examples

**6. Verification commands:**

```sh
pnpm run test:browser -- tests/browser/composition-examples.spec.ts
pnpm run fixture:check
pnpm run fixture:build
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Developers have useful compositional examples without scope expansion.

**8. Commit message:** `docs: add verified compositional usage examples`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S200, not an unscheduled expansion.

### S200 — Reconcile agent instructions and test traceability

**Contract anchors:** R29, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria).

**1. Step title:** Reconcile agent instructions and test traceability.

**2. Purpose:** Keep future AI-assisted changes anchored to code-health evidence.

**3. Exact scope of code changes:**

- Update AGENTS with actual module boundaries/scripts, supported paths and guard rules
- Map every stable requirement and acceptance criterion to actual tests/records
- Review all deviations and close only evidence-backed ones

**4. Files/modules likely involved:**

- `AGENTS.md`
- `implementation/TRACEABILITY.md`
- `implementation evidence/COMMANDS.md`
- `tests/registry/contract-links.test.ts`

**5. Required unit/integration tests:**

- All requirement IDs have real implementation/test evidence or an explicit blocking status
- No instruction refers to nonexistent successful checks
- Component maps and registry contracts match current source

**6. Verification commands:**

```sh
pnpm run test:registry -- tests/registry/contract-links.test.ts
pnpm run format:check
pnpm run lint
pnpm run typecheck
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Durable intent, code and verification evidence are synchronized.

**8. Commit message:** `docs: reconcile agent guidance and requirement evidence`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S201, not an unscheduled expansion.

### S201 — Run the final code-health and cumulative regression lane

**Contract anchors:** R08, R16, R20, R21, R22, R29, R30, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [API_CONTRACTS.md](#contract-specs-api-contracts), [ARCHITECTURE.md](#contract-specs-architecture), [COMPONENT_CATALOG.md](#contract-specs-component-catalog), [DATA_MODEL.md](#contract-specs-data-model), [SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions).

**1. Step title:** Run the final code-health and cumulative regression lane.

**2. Purpose:** Review maintainability and safety without disguising broad refactoring as cleanup.

**3. Exact scope of code changes:**

- Run all cumulative checks and inspect production/packed output
- Remove only step-scoped redundant scaffolding proven obsolete, preserving fixtures and public contracts
- Investigate failures without suppressions, weakened typing or SSR disablement

**4. Files/modules likely involved:**

- `all scoped target modules/tests`
- `package artifacts`
- `implementation evidence/FINAL_VERIFICATION.md`

**5. Required unit/integration tests:**

- Unit/integration/registry/component/browser/package suites pass
- Formatting/lint/type/build and supported platform/feature lanes pass
- Any present Rust workspace satisfies its applicable guard
- No unrelated source changes or temporary secrets are staged

**6. Verification commands:**

```sh
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run test:unit
pnpm run test:integration
pnpm run test:registry
pnpm run test:components
pnpm run fixture:check
pnpm run fixture:build
pnpm run test:browser
pnpm run build
pnpm pack --json
pnpm run test:package
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** All required implementation verification is evidenced; failures remain blockers, not hidden exceptions.

**8. Commit message:** `test: complete the cumulative release qualification`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S202, not an unscheduled expansion.

### S202 — Record the gated extension scope without inventing APIs

**Contract anchors:** R31, R32, R33, R34. [SCOPE_AND_ASSUMPTIONS.md](#contract-specs-scope-and-assumptions).

**1. Step title:** Record the gated extension scope without inventing APIs.

**2. Purpose:** Preserve the approved expansion direction while preventing unrequested implementation.

**3. Exact scope of code changes:**

- Document select/combobox/popover/date-related/higher-level extension questions from actual stable architecture
- Separate known reusable infrastructure from missing item inventory/value/date/locale contracts
- Create only the scoped proposal and decision gate; no extension component code or speculative complete sequence

**4. Files/modules likely involved:**

- `implementation/EXTENSION_GATE.md`
- `implementation/OPEN_QUESTIONS.md`
- `specs/SCOPE_AND_ASSUMPTIONS.md`

**5. Required unit/integration tests:**

- Review shows all named extension directions are retained
- No undefined date/timezone/search/business behavior is called approved
- Core completion and any expanded-v1 blocker are reported separately
- Existing product suites remain unchanged/green

**6. Verification commands:**

```sh
pnpm run format:check
# DISCOVER/VERIFY: Execute target contract/reference validation
pnpm run test:registry
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** Extension work has an explicit next specification boundary and is not falsely claimed implemented.

**8. Commit message:** `spec: preserve the gated component expansion direction`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is S203, not an unscheduled expansion.

### S203 — Freeze final implementation evidence and delivery status

**Contract anchors:** R01, R29, R31, R32, R33, R34. [ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria), [ARCHITECTURE.md](#contract-specs-architecture), [PRODUCT_SPEC.md](#contract-specs-product-spec), [SCOPE_AND_ASSUMPTIONS.md](#contract-specs-scope-and-assumptions).

**1. Step title:** Freeze final implementation evidence and delivery status.

**2. Purpose:** Leave the next engineer a truthful, reproducible completion record.

**3. Exact scope of code changes:**

- Record completed step IDs/commit hashes, actual artifact inventory, compatibility matrix and test results
- Resolve acceptance checklist against code and identify any remaining blocker
- Preserve no-publish/no-push boundary and report the exact next safe action

**4. Files/modules likely involved:**

- `implementation evidence/FINAL_VERIFICATION.md`
- `implementation/TRACEABILITY.md`
- `implementation evidence/DELIVERY.md`

**5. Required unit/integration tests:**

- Every nongated completed step has a commit/report and passing required evidence
- Required acceptance criteria are satisfied or completion is explicitly withheld
- Packed artifact/commands can reproduce verification
- Extension gate remains clearly separate from implemented core

**6. Verification commands:**

```sh
git status --short
git log --oneline -12
git diff --check
# DISCOVER/VERIFY: Re-run changed-scope checks after final documentation updates and reference the full recorded release lane; do not claim stale results are new runs
git diff --check
```

Also run the established `pnpm run format:check`, `pnpm run lint`, and `pnpm run typecheck` (or discovered exact equivalents). Review `git diff --cached --check` and the staged diff before committing.

Conditional Rust guard — from each applicable Cargo workspace root; otherwise record N/A:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

Add affected-crate, valid feature/target, repository lint, platform and packaging checks when relevant; discover their exact commands from manifests/CI before this step. See [verification rules](#contract-implementation-verification).

**7. Expected result:** The verified product or honest blocked/partial state is delivered without unsupported completion claims.

**8. Commit message:** `specification: record verified implementation delivery evidence`

**Exit gate:** Required checks pass; scope and staged diff reviewed; commit and step report recorded. Next step is the explicitly gated next specification/delivery action, not an unscheduled expansion.

## Embedded approved contracts and supporting guidance

- [specs/PRODUCT_SPEC.md](#contract-specs-product-spec)
- [specs/SCOPE_AND_ASSUMPTIONS.md](#contract-specs-scope-and-assumptions)
- [specs/ARCHITECTURE.md](#contract-specs-architecture)
- [specs/GENERATED_LAYOUT.md](#contract-specs-generated-layout)
- [specs/API_CONTRACTS.md](#contract-specs-api-contracts)
- [specs/DATA_MODEL.md](#contract-specs-data-model)
- [specs/STYLING.md](#contract-specs-styling)
- [specs/SYNCHRONIZATION.md](#contract-specs-synchronization)
- [specs/SECURITY_AND_TRANSACTIONS.md](#contract-specs-security-and-transactions)
- [specs/COMPONENT_CATALOG.md](#contract-specs-component-catalog)
- [specs/ACCEPTANCE_CRITERIA.md](#contract-specs-acceptance-criteria)
- [implementation/TEST_PLAN.md](#contract-implementation-test-plan)
- [implementation/VERIFICATION.md](#contract-implementation-verification)
- [implementation/OPEN_QUESTIONS.md](#contract-implementation-open-questions)
- [implementation/OPERATIONS_RUNBOOK.md](#contract-implementation-operations-runbook)
- [implementation/STEP_REPORT_TEMPLATE.md](#contract-implementation-step-report-template)
- [implementation/DEVIATION_TEMPLATE.md](#contract-implementation-deviation-template)
- [implementation/EXTENSION_GATE.md](#contract-implementation-extension-gate)
- [decisions/ADR-0001-architecture.md](#contract-decisions-adr-0001-architecture)
- [decisions/ADR-0002-generated-css-and-layout.md](#contract-decisions-adr-0002-generated-css-and-layout)
- [decisions/ADR-0003-customization-aware-sync.md](#contract-decisions-adr-0003-customization-aware-sync)
- [decisions/ADR-0004-primitive-and-theme-boundaries.md](#contract-decisions-adr-0004-primitive-and-theme-boundaries)
- [decisions/ADR-0005-rust-verification-boundary.md](#contract-decisions-adr-0005-rust-verification-boundary)
- [decisions/ADR-0006-scope-and-discovery-gates.md](#contract-decisions-adr-0006-scope-and-discovery-gates)
- [references/SOURCE_BASELINE.md](#contract-references-source-baseline)
- [references/TOKEN_BASELINE.md](#contract-references-token-baseline)
- [repo/AGENTS.md](#contract-repo-agents)

<a id="contract-specs-product-spec"></a>

### Product contract

Scheduled repository file: `specs/PRODUCT_SPEC.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

Status: approved intent, with explicitly labeled discovery gates. Spec: `svelte_ui_kit_v1`.

#### Goal

Reproduce the source-first workflow and recognizable conventions of `leptos_ui_kit` for SvelteKit. The product is a generator and authored registry, not a runtime styled component library. Developers receive editable application code and CSS; upstream interaction remains in Bits UI where useful.

The original review compared registry/configuration, codegen planning and transactions, CSS/token contracts, component manifests, representative native and primitive-backed components, and CLI/package tests at `a10fbf06334f4648f5755e05a7147414e4e5fc98`. It did not execute the Rust suite or compile Svelte prototypes. See [SOURCE_BASELINE.md](#contract-references-source-baseline).

#### Stable requirements

| ID  | Contract                                                                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| R01 | Product/package/executable is `svelte-ui-kit`; spec is `svelte_ui_kit_v1`. One published npm package initially; modular TypeScript internals. |
| R02 | Installed `.svelte`, `.ts`, and CSS are application-owned editable source. No imports from a styled kit runtime.                              |
| R03 | Bits UI supplies complex interaction; native Svelte/HTML handles simple presentation. Do not port Rust primitive internals.                   |
| R04 | Pure authored CSS, semantic tokens, no Tailwind/CSS-in-JS/shadcn compatibility or conversion pipeline.                                        |
| R05 | Default UI path is `src/lib/components/ui`; state path is its `_kit` child; CSS is `src/styles/kit.css`.                                      |
| R06 | Simple files and compound directories; flat PascalCase exports; lowercase kebab-case filenames/item IDs; camelCase props/config keys.         |
| R07 | Preserve `.kit-*`, `--kit-*`, managed block IDs, and change only tool-specific markers/layers to `svelte-ui-kit`.                             |
| R08 | Bundle complete registry assets and schemas in the package; built-in registry only; tarball works without authoring tree.                     |
| R09 | CLI: `info`, `init`, `view`, `add`, `sync`, `doctor`; approved `--dry-run`, `--json`, `--cwd`, `doctor --strict`.                             |
| R10 | Plan dependencies accurately, including peers, without implicitly editing `package.json` or invoking a package manager.                       |
| R11 | Keep explicitly requested items in config and resolved dependency closure in lock state.                                                      |
| R12 | Decouple schema, package, registry, item, framework compatibility, and CSS contract versions.                                                 |
| R13 | Use base/local/incoming comparison for sources and CSS. Preserve local edits, detect real conflicts, no automatic merge.                      |
| R14 | Treat coupled source and style changes as compatibility cohorts; conflicts must not partially update a component.                             |
| R15 | Deterministic inspectable plans, all-or-nothing conflict planning, zero-write dry runs, idempotence, one structured result.                   |
| R16 | Validate paths/ownership; detect concurrent changes; stage recoverable writes and publish install lock last.                                  |
| R17 | Preserve unmanaged CSS/barrel/layout content; patch layouts structurally and fail safely on unsupported shapes.                               |
| R18 | Retire unneeded generated assets safely; never silently delete customized assets or manufacture a remove command.                             |
| R19 | `doctor --strict` distinguishes intentional customization from broken/unsafe installations; customization alone is not corruption.            |
| R20 | Preserve primitive/native types, discriminated unions, state bindings, refs, snippets, event semantics, and native form behavior.             |
| R21 | Keep SSR/hydration and request-local state safe; do not disable SSR or use shared mutable server state as a workaround.                       |
| R22 | Test keyboard/focus/accessibility, labels, form submission/reset, disabled state, overlays, motion, RTL, and themes as applicable.            |
| R23 | Application owns themes/persistence/color-scheme. Global and nested portal theme strategies are explicit.                                     |
| R24 | Pure CSS is not a zero-inline-style/CSP guarantee; audit placement behavior and document actual support.                                      |
| R25 | Preserve component-property → semantic-role → default-radius → reference-radius fallback and shape-critical geometry.                         |
| R26 | Deliver tokens/spinner/button/switch/dialog first, then original catalog adaptation; exercise floating menu early.                            |
| R27 | Distinct Alert Dialog behavior uses its primitive, not only `role="alertdialog"` on Dialog.                                                   |
| R28 | Keep identity behavior Svelte-native; router-link is an optional thin native-anchor recipe, not a new router.                                 |
| R29 | Test installed generated output in a real SvelteKit app; run typecheck/build/browser tests and packed artifact acceptance.                    |
| R30 | Preserve the source project's JSON/error/idempotence/conflict/packaging rigor, with independently versioned target wire contracts.            |
| R31 | Preserve approved extension direction without inventing select/combobox/popover/date/higher-level APIs; use a scoped specification gate.      |
| R32 | Follow spec-anchored, one-step/one-commit execution; verify, self-review, report, and document evidence-backed deviations.                    |
| R33 | Preserve any applicable Rust workspace with Cargo/repo checks at each step; Cargo is N/A in a TS-only target.                                 |
| R34 | Use real target conventions, protect unrelated changes, do not publish/push or overwrite the reference repository.                            |

#### User-facing workflow

From an application package root, inspect with `info`, initialize, inspect a registry item with `view`, install with `add`, reconcile selected items with `sync`, and validate with `doctor`. Use dry runs before mutations and JSON for automation. Follow the reported dependency installation instructions separately. Commit generated files and metadata. Customize components directly or use application theme/override CSS. Upgrade the local CLI to a tested version, inspect a sync dry run, then apply only safe changes; resolve genuine conflicts explicitly.

Root requests and transitive items must be distinguishable throughout. For `button`, the initial closure includes `spinner` and `tokens`; it does not make those dependencies explicit user requests. Re-adding the same item is idempotent. Removing a desired item from configuration is the reconciliation input; no separate `remove` command is part of the approved surface.

#### Non-goals

No distributed service, online registry protocol, telemetry, registry authentication, runtime theme store, icon dependency, generic plugin ecosystem, schema hosting deployment, automatic npm install, patch/merge UI, React compatibility, Tailwind option, Rust CLI requirement, or bulk repo migration. Do not add these to fill perceived gaps. Exact visual defaults beyond the reviewed CSS and explicit source contracts must be derived and verified, not redesigned without a spec change.

The consumer dependency install can require network access; package asset loading and regeneration must not rely on live GitHub. One CLI package does not mean zero consumer runtime dependencies: Bits UI and Svelte are still real dependencies.

<a id="contract-specs-scope-and-assumptions"></a>

### Scope, assumptions, and decision authority

Scheduled repository file: `specs/SCOPE_AND_ASSUMPTIONS.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

#### Status vocabulary

**Confirmed** means the user approved the prior review recommendation. **Observed** means source/doc evidence, not target implementation. **Implementation assumption** means a necessary reversible engineering choice within the approved design; record it before encoding it. **Unresolved** means evidence or a product choice is still required. **Deferred** means the direction is preserved but not a license to invent its scope.

#### Confirmed vs inferred

The approved stack is TypeScript/SvelteKit/Bits UI with a Node-distributed generator. The later request mentions a senior Rust architect and Cargo checks; it does not explicitly revoke the approved stack. **A01:** retain the stack and interpret Rust checks as a guard on any present/affected Rust repository. This reconciles both requests without silently making a different product.

**A02:** use the operator-supplied target worktree; absent an existing target architecture, a standalone `svelte-ui-kit` package is the default. The source repository is read-only reference. The authorized target is this standalone repository; retain its existing identity and scaffold.

**A03:** exact minor versions, Node engine, package manager, TypeScript test runner, lint configuration, and minimum browser matrix are selected from actual target evidence and a passing compatibility probe. A concrete, locked baseline is required before generated wrappers. No version labeled “latest” is frozen from conversational memory.

**A04:** preserve the observed envelope shape/status vocabulary as a target protocol starting point. Numerical exit codes, envelope schema version, serialization details, export-region marker grammar, and exact JSON field spellings not fixed in the review are frozen in dedicated contract commits, with tests. They are not retroactively described as human-specified wire values.

**A05:** the Node filesystem implementation initially targets a trusted local developer checkout, with explicit path/symlink/concurrency protections. It must not claim the Leptos capability-handle protection against a hostile concurrent filesystem. Threat model and supported OS evidence are required before writes become available.

**A06:** config and lock are strict JSON. The plan proposes versioned bundled JSON Schemas; exact `$id` hosting and initial independent schema-version value need discovery. No invented published domain or URL. Stable item/source/CSS ownership and hashes are mandatory regardless of serialization choice.

**A07:** internal test files and npm script names in the plan are proposed paths/categories for a new target. Existing equivalents win after discovery. Adding one script is not permission to pretend an unavailable command passed.

**A08:** simple presentation can use native elements or a thin primitive where source behavior warrants it. Avatar loading/fallback and semantic progress require behavioral review rather than treating them as inert styling. Component worksheets freeze those choices before implementation.

#### Catalog scope and the extension boundary

The approved three-stage direction was: prove the full core installation/update path; achieve source-catalog/browser parity; extend to select, combobox, popover, date-related controls, and higher-level patterns after contracts stabilize.

The first two stages have concrete product scope and form this specification's coding deliverable. The third is an approved direction, but no exact item set, type/API surface, date/timezone model, locale behavior, or higher-level pattern inventory was specified. **A09:** finish a precise extension scope/spec gate as the last planning step, and do not invent an extension coding backlog as though those details were approved. Completing core v1 does not mean those extensions have been implemented. An expanded v1 claim including them is blocked until their contracts and independent commit sequence exist. This boundary must remain visible in status reports.

The original `identity` entry describes a Leptos requirement. In the port, preserve stable identity semantics using Svelte/Bits mechanisms, not a cargo-style identity component. Whether there is any useful generated `identity` item is decided by a parity worksheet; do not ship an empty compatibility shim. `router-link` remains optional to install but its thin documented recipe is part of catalog adaptation.

#### Technical choices vs product changes

Agents may resolve exact type names already defined by a pinned primitive, choose an existing repository script, or select an appropriate parser after inspecting evidence. They must record the result at the scheduled contract step. They may not add a runtime component package, remote registries, broad polymorphism, automatic merging, dependency mutation, or extra components under that authority.

A repository-proven obsolete/unsafe plan step needs a deviation record before execution changes. A new product requirement needs a durable spec amendment; planning notes cannot approve it. Do not repeatedly request already supplied choices, and do not treat genuine technical uncertainty as permission to invent APIs.

<a id="contract-specs-architecture"></a>

### Architecture

Scheduled repository file: `specs/ARCHITECTURE.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

#### System boundary

```
CLI commands ──> project detection + config validation
                      │
bundled registry ──> dependency resolution
                      │
application snapshot + previous lock + incoming registry
                      │
                pure change planner
                      │
                diagnostics / dry run
                      │
           guarded recoverable file application
                      │
         app-owned components, CSS, metadata
                      │
                Bits UI + SvelteKit
```

There is one initially publishable npm package. Keep module boundaries without manufacturing a multi-package ecosystem. Consumer components must not import Node-only code, the CLI, registry loader, or a kit runtime facade.

#### Proposed target repository

```
src/
  cli/main.ts
  cli/commands/{info,init,view,add,sync,doctor}.ts
  project/{detect,dependencies,paths}.ts
  registry/{load,resolve,validate}.ts
  codegen/{plan,apply,lock,css,exports,svelte,transaction}.ts
registry/
  registry.json
  foundation/tokens.json
  ui/*.json
  ui/*.svelte
  ui/*.types.ts
  ui/<compound>/{index.ts,root.svelte,...}
  styles/*.css
  contracts/{theme-v1,component-customization-v1}.json
schema/v1/
tests/{fixtures,codegen,components,package}/
```

These are module responsibilities, not a ban on extracting small cohesive helpers. A module may split when supported by actual code, without adding publishable packages. Exact schema subdirectory follows the independent version frozen at the schema step.

#### Responsibilities

**CLI** parses arguments, selects the root, renders one human or JSON outcome, and maps stable statuses to exit codes. It does not implement merge policy or perform unplanned file writes. Command handlers call use cases rather than duplicate them.

**Project detection** reads manifests and approved configuration, identifies an explicit application package, discovers supported paths and dependency state, and reports unsupported layouts. Avoid executing arbitrary Svelte config simply to detect a layout; an explicit safe override or documented manual integration is preferable to guesswork.

**Registry** reads packaged assets through a package-relative provider, validates schemas and manifest identity, validates target ownership/export uniqueness, resolves dependency closure deterministically, and merges dependency requirements. It never loads arbitrary remote registries.

**Planner** receives validated models, immutable asset bytes, current filesystem observations, and previous lock metadata. It emits a complete, deterministic proposal with diagnostics and expected preimages. It does not write files, run a package manager, or initialize coordination state during a dry run.

**Patchers** are narrow transformations for managed CSS blocks, generated export regions, and safe Svelte layout imports. They preserve unrelated source bytes and reject malformed/ambiguous structures. A patcher is not a formatter for the user's entire file.

**Transaction layer** owns exclusive writer coordination, revalidation, staged content, journal/recovery, atomic file replacement where supported, rollback/roll-forward policy, and lock-last publication. Multi-file filesystem writes are not one native atomic operation; document the recovery protocol rather than promising nonexistent atomicity.

**Consumer wrappers** supply design classes and constrained props; preserve upstream behavior, semantics, bindings, references, and snippet structure. No global primitive state clone or hidden module-level mutable request state.

#### Boundaries to preserve from Leptos

Translate `cargoPlan` into `npmPlan`, Rust/module targets into explicit Svelte/TypeScript targets and exports, and compiled-in registry assets into package-bundled assets. Preserve ownership, drift diagnostics, embedded contracts, package independence, and plan/apply separation. Do not translate Rust SSR feature flags or `web_ui_primitives` implementations into new Svelte abstractions.

#### Distribution and dependencies

The CLI's distribution includes all templates/manifests/contracts/schemas used at runtime. Resolve asset paths relative to the installed package, not CWD or source checkout. Package metadata and content digests supply provenance; a `.git` directory must not be necessary in a released tarball.

Consumers depend on Svelte and any Bits UI requirements emitted by installed items. Node tooling dependencies belong to the CLI or development fixture. Version selection must honor actual peer requirements, not only directly imported modules. Do not put all component dependencies into every application's plan without justification.

#### Composition vs expansion

Keep compositional patterns: collapsibles can form accordion-like layouts; alert/status can supply notification content; native anchors/buttons can compose breadcrumbs and pagination; native semantic HTML remains appropriate for data tables and document structure. Do not invent application orchestration, notification queues, or data-grid engines.

A single aggregate stylesheet is intentional. It includes CSS for installed items and is not promised to be route-level tree-shaken. Sibling imports avoid root-barrel cycles. Compound export barrels are generated from explicit manifest declarations.

<a id="contract-specs-generated-layout"></a>

### Generated layout, ownership, and names

Scheduled repository file: `specs/GENERATED_LAYOUT.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

#### Default consumer tree

```
src/
  lib/components/ui/
    index.ts
    button.svelte
    button.types.ts
    spinner.svelte
    switch.svelte
    dialog/
      index.ts
      root.svelte
      trigger.svelte
      portal.svelte
      overlay.svelte
      content.svelte
      title.svelte
      description.svelte
      close.svelte
    _kit/
      kit.json
      kit.lock.json
      token-contract.json
      theme-integration.json
  styles/
    kit.css
    themes.css
    app.css
  routes/+layout.svelte
```

This is an illustrative tree after installing the listed items, not a requirement for `init` to install all of them. Unrequested source must not appear. The original default was `src/components/ui` with `_kit` and `styles/kit.css`; the Svelte adaptation deliberately uses `src/lib` and `src/styles`.

`themes.css` and `app.css` are application-owned. A generator may create an absent empty integration target only when part of an explicitly reported initialization plan; it must never replace an existing theme or reset stylesheet. A tokens install produces token/theme metadata when its contracts exist. The metadata must not claim a Rust ABI or primitive package that is not used by Svelte.

#### Naming

| Concept                                   | Name/pattern                                               |
| ----------------------------------------- | ---------------------------------------------------------- |
| Spec identifier                           | `svelte_ui_kit_v1`                                         |
| Package, CLI, namespace in markers/layers | `svelte-ui-kit`                                            |
| Registry IDs and filename segments        | lowercase kebab-case (`router-link`, `button.svelte`)      |
| Simple component                          | one `.svelte` file, optional adjacent `.types.ts`          |
| Compound component                        | directory with `index.ts` and named part files             |
| Public values/types                       | PascalCase (`Button`, `DialogRoot`, `ButtonVariant`)       |
| Public props/config fields                | camelCase (`loadingLabel`, `schemaVersion`, `uiDir`)       |
| CSS classes                               | `.kit-*`, BEM-like variants such as `.kit-button--primary` |
| CSS properties                            | `--kit-*`                                                  |
| Root import                               | `$lib/components/ui`                                       |

Public dialog exports: `DialogRoot`, `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogClose`. There is one canonical flat naming surface; do not add parallel `Dialog.Root` aliases. Public use of Bits UI namespaces inside generated wrappers is not a kit namespace alias.

Do not generate `src/lib/components/index.ts` merely to imitate Rust parent modules. Generated source uses direct sibling imports, not the generated root barrel. Manifest declarations determine source targets and public exports. Reject duplicate symbols, conflicting paths, and case-colliding names before writes.

#### Ownership

Component sources and their supporting TS files are initially generated but freely editable. The root and compound barrels have clearly managed export regions; preserve unrelated application text and detect conflicting declarations. Exact TS comment marker syntax is frozen at its dedicated contract step; CSS marker syntax is already specified.

`kit.json` records user-editable desired installation and validated integration settings. `kit.lock.json` and contract metadata are tool-managed and committed. Keep ephemeral writer coordination/journals separate from semantic committed metadata; their exact paths are internal choices and must be documented, ignored appropriately, and handled safely after interruption.

The stylesheet has separately managed blocks, not whole-file generator ownership. Preserve all text outside managed regions, including comments and application overrides. A customized managed block is still user work and must not be overwritten silently.

#### Layout imports

Ensure the application loads `kit.css`, then `themes.css`, then `app.css`, preserving existing layout code and avoiding duplicate imports. Resolve relative paths from the actual supported layout; the default is `../styles/<name>.css` from `src/routes/+layout.svelte`. Parse Svelte, identify an appropriate instance script, and apply a minimal text edit. Test layouts with no script, existing instance/module scripts, TypeScript, comments, and existing imports. Do not inject into the wrong script or replace route rendering.

Custom UI/styles/root layouts require explicit validated mapping. `--cwd` chooses one package; do not scan and mutate all workspace members. Unsupported or ambiguous integration must produce a diagnostic and an explicit manual step rather than a guessed edit.

<a id="contract-specs-api-contracts"></a>

### Public API and CLI contracts

Scheduled repository file: `specs/API_CONTRACTS.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

#### CLI surface

| Command       | Behavior                                                                                                 | Mutation           |
| ------------- | -------------------------------------------------------------------------------------------------------- | ------------------ |
| `info`        | Inspect supported project, paths, dependencies, compatibility, and readiness.                            | None               |
| `init`        | Plan/apply config, safe integration targets/imports, export infrastructure, and initial lock state.      | Explicit plan only |
| `view <item>` | Show bundled item metadata; source inspection should preserve the reviewed `--source` capability.        | None               |
| `add <item>`  | Add an explicit root request, resolve dependencies, plan/apply source, CSS, exports and state.           | Explicit plan only |
| `sync`        | Reconcile desired config with incoming packaged registry using prior ownership baselines.                | Explicit plan only |
| `doctor`      | Report installation consistency, dependencies, source/CSS customization, integration, and unsafe states. | None               |

Write commands support `--dry-run`; structured command results support `--json`. `--cwd <path>` chooses the application package explicitly. `doctor --strict` makes broken/unsafe installation checks fail CI but must not treat customization alone as failure. Preserve help/version usability as ordinary CLI concerns. Do not add automatic installation, a remove command, compatibility aliases, or a `--force` overwrite escape hatch.

The original tool accepts one item per `add`; multi-item syntax was not approved. Unknown commands/options, missing values, conflicting arguments, and malformed input need deterministic diagnostics before any write. Bare `view` must not mutate a project. Whether project context is needed for a particular information field is explicit, not an excuse to fabricate one.

#### Structured results

Observed source shape to carry over and freeze in the target protocol step:

```
{ schemaVersion, command, status, diagnostics, changes, data }
```

Status vocabulary: `success`, `planned`, `no_change`, `warning`, `conflict`, `error`, `unsupported`. Diagnostics include stable machine code, level, human explanation, safe logical locator where appropriate, and actionable guidance. Change records distinguish actual writes from planned actions. Dry-run output is not a report that writes occurred.

In JSON mode emit exactly one complete envelope to stdout, including failures; do not mix progress text, color codes, or a second error object into it. Human failures belong on stderr. Decide and fixture the numerical exit map at the protocol step. The reference's observed mapping is a starting point, not a newly implied target requirement: 0 successful/planned/unchanged/non-strict warning; 1 ordinary failure; 2 usage/unsupported; 3 strict doctor failure; 10 conflict; 11 unsafe path; 12 registry failure. Confirm target convention before freezing it.

Command schema version is independent from Svelte and package versions. Output is deterministic for equivalent logical inputs; avoid timestamps, random transaction identifiers, absolute sensitive paths, or filesystem iteration order in semantic output unless explicitly necessary and documented.

#### Dependency planning

Report direct package requirements, runtime versus tooling roles, relevant peer requirements, installed/declaration status, incompatible ranges, and an appropriate command for the detected package manager. Do not silently edit `package.json`/lockfiles, execute npm/pnpm/yarn, fetch mutable remote templates, or pretend missing peer dependencies are optional.

The initial Bits UI source observation was 2.19.3 with Svelte `^5.33.0`, a date peer `^3.8.1`, and Node `>=20` in that source manifest. This is historical evidence, not a validated distribution baseline. Before implementation choose installed, reproducible versions that pass fixtures and record actual peer metadata. Do not automatically adopt a newer major version.

#### Component interface rules

Use Svelte 5 typed props and deliberate binding through wrappers. `open`, `checked`, `value`, and DOM `ref` are not made two-way merely by spreading props. Derive primitive props from the pinned Bits UI definitions; preserve union discrimination. Use native Svelte element types for native components. Do not replace a real prop contract with `any` or a generic attribute dictionary.

Own design classes without erasing caller classes. Use the existing variant vocabulary where defined: `ButtonVariant` primary/secondary/ghost and `ButtonSize` sm/md/lg. Default a native Button to `type="button"`; preserve disabled/loading/busy/label behavior and native submit/reset opt-in. Do not turn Anchor into a role-button or Button into an automatically polymorphic link.

For composed parts, support upstream `child`/`children` deliberately. A wrapper that owns internal markup, such as the proposed Switch with its Thumb, should exclude those customization hooks rather than accept and drop them. Floating delegated content must retain outer positioning `wrapperProps` and inner content `props` structure. Merge custom handlers only with an explicit ordering/cancellation policy; a spread is not a merge.

Dialog is an exposed compound family. Portal/overlay are explicit parts; preserve custom portal targets and document composition. Do not introduce an ambiguous `portalTo` convenience alias unless the API worksheet justifies it; the earlier name was illustrative camelCase, not a frozen prop signature. Use pinned primitive names for forwarded configuration where possible.

Alert Dialog gets a separate primitive-backed family, preserving accessible naming, focus and dismissal semantics. It is not Dialog with a role property. Native semantic content remains the default for tables/document structure.

#### API freezing procedure

Before each component family, document its source counterpart, exact pinned Bits/native types, exported names, binding/ref/snippet policy, forwarded attributes, classes/state selectors, native form behavior, accessibility expectations, dependencies, and source/CSS coupling. Add positive and negative type fixtures. Only then add wrappers. Undocumented upstream subcomponents or advanced variants are not automatically product scope.

<a id="contract-specs-data-model"></a>

### Data models and persistence contracts

Scheduled repository file: `specs/DATA_MODEL.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

This file fixes semantic responsibilities. Exact JSON spelling not already approved is a scheduled schema-design choice; there are intentionally no fabricated production `$schema` URLs or prevalidated example lockfiles in this specification.

#### Version axes

Track configuration/lock schema, CLI package, registry release/content digest, individual item/template versions, Svelte/Bits compatibility ranges, and token/customization contracts independently. A framework bump is not automatically a schema migration. Item version/digest identifies incoming content; baseline content must not be relabeled as updated when preserved due to customization/conflict.

#### Kit configuration (desired state)

Contains schema identity/version, tool provenance as applicable, supported project and integration roots, UI/export/style mappings, built-in registry selection, and **explicit root item requests only**. Validate unknown fields, malformed values, unsafe/overlapping paths, duplicate requests, unsupported modes, and invalid names. Default state directory is under the UI root. Root requests are not replaced by the full dependency closure.

A useful conceptual example is `requested=[button]`, with `resolved=[tokens, spinner, button]` in the lock. Repeated request normalization must preserve that distinction. Selecting a dependency explicitly is different from merely resolving it.

#### Registry root and item

Root identifies registry version/digest, compatibility policy, and item ID → manifest mapping. Each manifest identifies its own name/kind/version, public description, framework/primitive compatibility, explicit source file targets/kinds and exports, managed CSS targets and block IDs, `registryDependencies`, npm requirements, and accessibility behaviors. Foundation tokens can be CSS-only.

Resolve dependencies through a validated acyclic graph with stable ordering; reject missing manifests/assets, manifest/name mismatch, cycles, duplicate exports, duplicate ownership, case collisions, malformed source paths, and incompatible requirements before planning writes. Freeze one immutable asset view per operation. No live authoring-tree reload during planning/apply.

#### Install lock (observed installed lineage)

Record schema/tool/registry provenance, configuration identity, requested-versus-transitive provenance, resolved item identities/versions, source-file owners and installed baseline digests, CSS-block owners and baseline digests, integration/contract references/digests, and reverse indexes if used. Validate reverse indexes against canonical records rather than trusting both independently.

For each managed target distinguish the base last accepted upstream content, current local observation, and incoming registry content. Persistent base hash is required; local hash can be observed per plan. Do not invent an automatic merge requiring base bytes when only hashes exist. Transient transaction backups are not a general merge history database.

A preserved customized target retains its legitimate upstream base so future incoming changes can still be detected. A current incoming version is not proof that every local target has adopted it. Track effective per-target/cohort lineage or block the mixed transition; never write misleading lock metadata.

#### Theme/integration metadata

`token-contract.json` describes semantic token names/types/default expectations and a versioned contract identity. `theme-integration.json` identifies stylesheet path, layers, producer, relevant primitive compatibility, and actual portal integration characteristics. Preserve separation between theme tokens and component customization properties. Do not copy the Leptos identity/presence/portal ABI numbers or Rust type names into a Svelte claim.

Version the component customization contract independently. Record property scope, intended CSS grammar and fallback relationships; preserve complete border-radius grammar, including multi-corner and elliptical forms, rather than narrowing it with a typed registration accidentally.

#### Plan and diagnostics

A plan contains validated logical targets, intended create/update/retire actions, preserved/customized/conflicting dispositions, ownership/cohort identity, preimage observations, produced bytes/digests, dependency plan, diagnostics, and final metadata publication. No write is allowed merely because a command handler has enough information to guess one.

Use stable logical paths in output. Keep content hashes deterministic; using SHA-256 on exact UTF-8 bytes is a proposed implementation convention consistent with the reference and must be frozen/tested. Do not normalize an application's CRLF, comments, or formatter output implicitly to hide edits. Semantic/canonical hashes and exact-byte preimage hashes serve different purposes and must be named distinctly.

#### Transaction state

An internal journal records enough before/after information to recover an interrupted multi-file batch and distinguish prepared/applied/committed outcomes. Record ownership of temporary files, expected preimages, commit marker status, and restoration policy. Keep ephemeral coordination outside committed semantic state; document paths, modes, cleanup, and stale-lock handling. Fail closed on ambiguous or corrupted recovery state. New `--force`/`recover` commands are not part of this contract; safe automatic recovery or an explicit documented recovery procedure must fit existing commands.

#### Migration

Reject unsupported future schemas with a clear diagnostic. Migrate older target schemas only through explicit, fixture-tested transitions. V1 does not read Leptos kit.json as if it were Svelte config and does not provide shadcn aliases. Source/CSS fixture migrations must protect local edits, preserve ownership, and publish truthful state. Config reformatting alone must not become a source-ownership reset.

<a id="contract-specs-styling"></a>

### CSS, themes, and visual contracts

Scheduled repository file: `specs/STYLING.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

#### Distribution

Registry CSS is authored plain CSS. The CLI installs each item's text as one managed block in `src/styles/kit.css`; it does not generate utility classes, scrape demos, compile Tailwind, or maintain a second installed per-component stylesheet. One registry source and one installed managed block are the authoritative pair.

```
/* svelte-ui-kit:start tokens */
@layer svelte-ui-kit.tokens, svelte-ui-kit.themes, svelte-ui-kit.components;
/* token declarations in their layer */
/* svelte-ui-kit:end tokens */
```

Component blocks use matching item IDs and `@layer svelte-ui-kit.components`. Define marker parsing precisely; reject duplicate/unmatched/nested markers and do not interpret marker-like strings inside CSS strings as structure. Preserve text outside blocks exactly. Order tokens before dependent components deterministically.

#### Names and customization

Preserve `.kit-button`, `.kit-button--primary`, `.kit-switch-thumb`, and the semantic `--kit-*` vocabulary. Scope Bits state selectors through kit classes; avoid globally styling every raw Bits primitive. Verify each migrated selector against actual rendered DOM and state attributes. Reuse CSS by contract, not blind byte substitution.

Radius precedence is:

```
component property
  → semantic role
  → --kit-radius-default
  → reference radius
```

For Button: `--kit-button-radius` → `--kit-radius-control` → `--kit-radius-default` → `--kit-radius-md`. Preserve default shapes when optional variables are unset. Shape-critical geometry (spinner, inner circular indicators) remains circular unless its exact component property explicitly overrides it. Accept full CSS border-radius grammar; do not use restrictive `@property` registration. Invalid custom-property values follow ordinary computed-value behavior.

Retain semantic colors, text/surface/border roles, focus ring, shadows, motion/easing, disabled opacity, and per-component customization as observed in the reference assets. A theme token expresses portable design intent; a component property is a separately governed runtime CSS API. Preserve this distinction and test fallback precedence.

#### Application themes

Load kit CSS, then application theme CSS, then application overrides. The application owns theme selectors, persistence, color-scheme, and any server-provided initial theme. Do not ship a hidden theme store or browser-local-storage policy. The initialization command must preserve existing application styles.

Global theme scopes belong at a document-level ancestor when body-portaled overlays must share them. Nested scopes can use a suitable custom portal host within the theme. Document clipping/stacking implications. Test both, along with theme changes while an overlay is open. Do not silently copy computed values into inline styles.

#### Accessibility and motion

Keep visible focus states, proper disabled state contrast/affordance, meaningful busy/loading presentation, and inherited typography. Verify the reference switch's strong unchecked track, checked primary color, thumb color override, RTL travel, and reduced-motion behavior after mapping to Bits UI. Do not equate inherited source token values with an automatic accessibility certification; assess actual rendered foreground/background combinations and record findings.

Use reduced-motion alternatives for animated controls; verify logical properties/RTL where direction matters. Forms and overlays must remain legible under supported theme scopes. Do not introduce unapproved palettes or reset styles merely to imitate demo screenshots.

#### CSP and performance limits

Plain-CSS design styling does not guarantee no inline runtime positioning styles. Audit the pinned primitive output for floating menu/overlay placement and document supported CSP behavior. No strict-CSP parity claim is allowed without a tested policy. Do not remove necessary primitive wrapper structure just to eliminate a style attribute.

The aggregate CSS contains all installed item blocks. No promise of per-route stylesheet tree shaking is made. Application-owned overrides should normally live after kit.css, minimizing future block conflicts without restricting direct editing.

<a id="contract-specs-synchronization"></a>

### Ownership and synchronization

Scheduled repository file: `specs/SYNCHRONIZATION.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

#### Comparison table

Evaluate ownership before content equality. For a tracked target, let B be the base upstream content last installed, L the local content now, and I the incoming packaged source. The first four rows below apply to tracked targets only. Untracked targets have no legitimate B and follow the final row even when their bytes equal I. Apply independently to sources and managed CSS blocks, then enforce component/cohort compatibility.

| Condition                  | Disposition                                                                       |
| -------------------------- | --------------------------------------------------------------------------------- |
| L = I                      | Already satisfied; no content write. Preserve or advance lineage only truthfully. |
| L = B and I differs        | Untouched locally; safe incoming update.                                          |
| I = B and L differs        | Preserve local customization.                                                     |
| B, L, I differ with L != I | Genuine conflict; no overwrite and no partial batch.                              |
| Untracked target exists    | Preserve application-owned content; explicit reconciliation required.             |

The equality-to-incoming case precedes conflict classification. Identical untracked content does not grant silent deletion rights; exact adoption policy is frozen/tested before implementation. Do not reset base hashes to arbitrary local bytes just to silence drift.

#### Missing targets and removal

Absence is not a hash. The review did not fully define whether deletion of a tracked file is intentional. At its contract step choose a conservative, visible behavior: report the missing target and planned restoration or conflict explicitly; never silently adopt absence as an upstream baseline. The source tool restores missing tracked files, but target policy must be documented.

Configuration removals recalculate the closure from explicit requests. Assets still required transitively remain. Clean obsolete generated assets may be retired in the planned transaction after safety checks. Customized or untracked assets are retained with diagnostics; do not delete them. Remove ownership only through a truthful transition; subsequent commands must not silently reacquire a retained file.

A customized retired CSS block requires an explicit disposition (retain as application-owned text rather than continuing to claim current generated ownership). Likewise preserve unrelated exports and warn about application imports left behind. Do not promise arbitrary import rewriting or safe deletion based only on the registry graph.

#### Compatibility cohorts

Source shape, exported parts, CSS selectors, and dependent component APIs can be coupled. Treat a component's source files, managed block, and relevant exports as a compatibility unit. A conflict in one member must not leave the others newly installed while claiming the unit is updated. The default initial policy is to stop the write batch on a genuine conflict.

A local customization with unchanged upstream is not itself a conflict; however, if another member of its compatibility unit changes and compatibility cannot be established, preserve the whole unit or report a cohort conflict. Document the exact conservative rule and fixtures rather than guessing semantic compatibility from text hashes. Dependencies may require widening a cohort when exported APIs change; not every unrelated component belongs to one permanent giant cohort.

#### Planning and lock truth

Resolve all requested items, read all current managed targets, calculate CSS/barrel/layout changes and dependency status, and detect every relevant conflict before applying any writes. A source conflict must not leave kit.json updated independently. Staging begins only after a safe complete plan exists.

The final lock identifies actual effective lineage, not merely the incoming registry's newest item version. Preserve base hashes when retaining customization. A no-content-write lineage update must still be planned and transactionally published if metadata really changes. Repeated add/sync after a satisfied state must have no semantic changes.

#### CSS and exports

Parse markers, validate unique owners, perform block-level comparison, preserve unmanaged text, and deterministic order. Reject malformed marker structure. Source formatting changes count as local edits unless a separately approved canonicalization policy says otherwise. Do not reformat whole stylesheets/barrels to simplify updates.

Use managed export regions and AST-aware conflict detection for colliding application declarations. Preserve unrelated aliases/imports/comments. Registry export declarations are the source of generated public exports; do not guess PascalCase names from arbitrary filenames.

#### Conflict resolution workflow

`sync --dry-run` reports old/local/incoming identifiers, affected logical paths, and why the batch cannot apply. `view <item> --source` supplies incoming source for inspection. The developer explicitly reconciles or moves conflicting material, then reruns the dry run and verification. No automatic text merge, force overwrite, or synthetic “accepted” hash updates are part of v1.

Hashes are enough for detection, not a three-way text merge. Base-byte retention can be a later feature only with a separate storage/migration/security contract. Transaction recovery backups do not imply a merge-history feature.

<a id="contract-specs-security-and-transactions"></a>

### Filesystem safety, concurrency, and recovery

Scheduled repository file: `specs/SECURITY_AND_TRANSACTIONS.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

#### Threat model and limits

Proposed initial scope: a trusted local developer checkout that may contain accidental unsafe paths, symlinks, stale metadata, concurrent cooperative writers, interrupted processes, and user edits. This is not a hostile multi-user filesystem guarantee. Record actual OS/filesystem support and the accepted race limits before exposing mutating commands.

Do not claim Node `path.resolve` plus rename equals Leptos's capability-relative handle operations. A hostile attacker able to replace directories between checks needs a stronger design; changing this threat model is an explicit architecture decision, not a hidden portability fix.

#### Path and ownership validation

Validate lexical paths before joining: reject absolute paths where relative is required, parent traversal, invalid/reserved segments, unexpected drive/UNC forms, overlap between reserved state and generated targets, duplicate/case-colliding targets, and inappropriate file kinds. Use actual filesystem observations to reject unsupported symlinks and nonregular targets. Containment must use segment-aware checks, not naive string-prefix tests.

Treat symlinked parents, broken links, existing directories at file targets, and project-root aliases deliberately. Do not follow a link outside the authorized root. Recheck safe target ancestry/preimages before writes. Public diagnostics should use safe logical paths rather than leaking unsanitized path input.

#### Plan/apply protocol

The planner is read-only, including dry-run and doctor; it must not leave temporary directories, journals, lockfiles, package-manager state, or formatting changes. A write invocation obtains exclusive coordination before committing a staged plan, revalidates observed inputs, and refuses stale or unsafe plans. The particular acquisition timing may allow a read-only speculative plan first, but the mutation phase must always revalidate under coordination.

Stage new bytes on an appropriate same-filesystem location for replacement. Journal expected old/new states and target sequence. Preserve modes where appropriate, use atomic per-file replacement when supported, and publish canonical `kit.lock.json` last as the successful state marker. Explicitly test durability/order assumptions; no claim of native multi-file atomicity.

The transaction must include config, source, CSS, export/layout integration, and lock metadata as one planned batch. Package dependency installation is outside the transaction because it is not performed by the CLI.

#### Recovery

Inject failures before/after staging, before/after individual replacement, before lock publication, during publication, and during cleanup. After restart, either recover safely to a documented consistent state or fail closed with actionable guidance. Do not silently delete a stale journal based solely on age or a recycled process ID.

A recovery operation must not overwrite user changes made after the interrupted operation. Validate the expected preimage or exact staged image before restore/roll-forward. Corrupted journals, mismatched transaction identity, missing backups, and ambiguous lock-last states are explicit errors. Lock publication with unchanged bytes still needs distinguishable transaction bookkeeping; byte equality alone is not a unique commit event.

Transient coordination and recovery files are not app-owned components and should not be committed. Safe ignore-file changes, when needed, must themselves be planned and preserve existing ignore rules. Do not add an undocumented recovery command/force flag; fit safe recovery and actionable manual instructions into the approved command surface.

#### Resource and error handling

Bound parsing and diagnostics sensibly to the packaged local asset model; validate before allocating or writing large user-controlled structures. Prefer a single serialized writer rather than unnecessary parallel mutation. Propagate filesystem and parser errors with context, close handles, clean only owned temporary files, and retain recovery evidence when cleanup cannot safely finish.

Cancellation and process termination cannot always run cleanup; durable recovery must not depend solely on a finally block. A dry run is safe precisely because it does not start a transaction. Prove these properties with fault-injection tests and platform lanes, not prose assertions.

<a id="contract-specs-component-catalog"></a>

### Catalog and component qualification

Scheduled repository file: `specs/COMPONENT_CATALOG.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

#### Inventory policy

The reference registry contains 22 IDs: alert, anchor, avatar, badge, button, card, checkbox, collapsible, dialog, field, identity, menu, progress, radio, router-link, separator, skeleton, spinner, status, switch, tabs, tokens. Preserve recognizable item names; this is a behavioral/design-system adaptation, not a promise that every Rust file has a Svelte counterpart.

First qualify `tokens`, `spinner`, `button`, `switch`, and `dialog` end-to-end. Then qualify distinct `alert-dialog` behavior and floating `menu` early, followed by the rest of the reference catalog. A separate generated identity item is conditional on actual need, not a placeholder shim. Extensions outside this inventory use the explicit later specification gate.

#### Per-item requirements

| ID           | Implementation boundary and required checks                                                                                                                                                                                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tokens       | CSS-only foundation. Preserve semantic vocabulary, layers, theme metadata, customization contract separation, and fallback/default qualification.                                                                                                                                                                                                                   |
| spinner      | Native decorative/status presentation as justified by source API. Button uses the decorative mode. Preserve shape-critical circular geometry, reduced motion, and nonduplicated accessible loading text.                                                                                                                                                            |
| button       | Native typed button recommended; primary/secondary/ghost and sm/md/lg. Default type button; explicit submit/reset, disabled/loading/busy, loading label, direct spinner dependency and sibling import. Preserve caller attributes/classes and children semantics.                                                                                                   |
| switch       | Bits Root/Thumb wrapper; bind checked/ref deliberately; internal thumb means excluded child/children hooks. Forward form props and events correctly; checked/unchecked styles, RTL, reduced motion, label association, reset, required and disabled cases.                                                                                                          |
| dialog       | Bits compound family: Root, Trigger, Portal, Overlay, Content, Title, Description, Close. Preserve open/ref bindings, snippets, accessible names, focus trap/return, escape/outside handling, presence, hydration, nested themes and overlays.                                                                                                                      |
| alert-dialog | Distinct primitive-backed family for confirmation/alert interaction. Freeze exact parts from pinned types. Do not emulate it with a Dialog role switch or invent confirmation/application state.                                                                                                                                                                    |
| menu         | Bits Dropdown Menu adaptation with kit `Menu*` flat exports. Freeze exact source-parity parts before implementation. Verify floating wrapper structure, keyboard navigation/typeahead, item selection, dismissal/focus return, disabled items, positioning and nested overlays. Extra submenus/selection variants only when the source/API worksheet supports them. |
| checkbox     | Bits-backed form control. Preserve native participation, checked/bind/ref behavior, indeterminate behavior if represented in the source/primitive contract, labels and disabled/required/reset cases. Preserve fixed-size SVG indicator geometry where mapped from reference.                                                                                       |
| radio        | Bits Radio Group adaptation with kit `Radio*` family names frozen from source needs. Preserve value/type contract, arrow-key behavior, disabled items, form participation and labels; verify selection-indicator geometry/colors.                                                                                                                                   |
| tabs         | Bits compound adaptation with typed value/activation/orientation behavior justified by source. Preserve tab/panel relationships, keyboard navigation, disabled triggers, refs and snippets, mounted-state/hydration behavior.                                                                                                                                       |
| collapsible  | Bits Root/Trigger/Content adaptation. Controlled/uncontrolled bindings, labels/expanded semantics, content presence/motion and reduced-motion qualification. Accordion-like recipes are composition, not a new generalized state engine.                                                                                                                            |
| field        | Svelte semantic field composition; freeze exact control/label/description/error wiring from source. Preserve real labels, unique stable associations, input form props, error semantics and helper relationships. Do not introduce a form-validation library or invented schema engine.                                                                             |
| anchor       | Native typed anchor presentation. Preserve actual navigation, href/target/rel/download/data attributes and keyboard behavior; use source design classes. Do not synthesize button semantics.                                                                                                                                                                        |
| router-link  | Optional thin SvelteKit/native-anchor recipe and documentation. Reuse anchor presentation where appropriate; preserve native routing/link options and base-path policy discovered from target. No copied Leptos router runtime.                                                                                                                                     |
| avatar       | Native Svelte markup or thin primitive based on source loading/fallback behavior. Test image success/failure/fallback and accessible alternative text; do not make a purely decorative assumption.                                                                                                                                                                  |
| badge        | Native presentation with source-supported variants only; semantic text, class forwarding and token/contrast qualification.                                                                                                                                                                                                                                          |
| card         | Native compositional surface with source-supported parts only; preserve sensible structure/slots and application content. No business/dashboard behavior.                                                                                                                                                                                                           |
| alert        | Native semantic message presentation following source role/variant contract. Verify accessible content and announcement behavior; no notification queue or application-level delivery system.                                                                                                                                                                       |
| status       | Native semantic status feedback; preserve suitable announcement behavior and accessible labeling without announcing decorative copies. Distinguish from alert according to source contract.                                                                                                                                                                         |
| progress     | Native semantic element or narrowly justified primitive; typed bounds/value/indeterminate semantics from source; accessible name and determinate/indeterminate styling. No timer/async task engine.                                                                                                                                                                 |
| separator    | Native/primitive semantic separator as justified by source; decorative and meaningful cases, orientation, role and class forwarding.                                                                                                                                                                                                                                |
| skeleton     | Native decorative loading placeholder; do not fabricate readable content or redundant announcements. Verify reduced motion, dimensions and theme surface contrast.                                                                                                                                                                                                  |
| identity     | Preserve stable SSR/client identity and explicit label/control associations using pinned Svelte/Bits facilities. Evaluate whether any app-owned helper is useful. Do not copy Rust provider APIs, counters or compatibility aliases; record an evidence-backed non-generated mapping when no item is needed.                                                        |

#### Required component worksheet

Before writing each family, capture exact exported names, .svelte/.ts targets, source counterpart, upstream/native props, bindings and refs, snippet policy, event ordering, default markup, CSS classes/state selectors, form behavior, accessibility checks, dependency closure, and source/style compatibility group. Sources not inspected in the original approved review must be inspected by the agent or replaced by explicit conservative spec-defined behavior; an inferred API is not an approved source fact.

A primitive's complete upstream catalog is not automatically this kit's catalog. Keep the wrapper small, preserve available semantics, and document intentional omitted rendering hooks. Distinguish a presentational kit default from a restriction on a behavior that users already rely on.

#### Test fixture policy

Each item/family has an install fixture, positive/negative type cases, a visual state fixture, and applicable browser semantics tests. Test generated application files and root exports, not only imports from authoring templates. Keep common harness utilities small and avoid snapshot-only accessibility assertions. Browser tests must assert actual focus/state/form behavior.

#### Extension direction retained

Select, combobox, popover, date-related components, and higher-level patterns are approved future direction after generator/wrapper stability. They need explicit inventory, values/generics, search/filtering ownership, portal behavior, locale/date/timezone and validation policy where relevant. The scheduled final extension gate captures questions and a subsequent spec/sequence without writing guessed implementations. Do not label these delivered merely because Bits UI offers them.

<a id="contract-specs-acceptance-criteria"></a>

### Acceptance criteria and release gate

Scheduled repository file: `specs/ACCEPTANCE_CRITERIA.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

Each requirement ID in `PRODUCT_SPEC.md` must map to executable tests or explicit evidence in `implementation/TRACEABILITY.md`. Criteria below are release requirements, not a claim that this specification has run them.

#### Product and distribution

AC01. One package-shaped `svelte-ui-kit` CLI with bundled assets/schema/contracts; no consumer styled-runtime dependency on the kit. Installed components import local siblings and Bits/native APIs correctly.

AC02. Generated tree/names/exports, CSS classes/properties/layers/markers and `_kit` locations match the contract. Only requested items and required dependencies appear. Compound families expose flat public names and no invented aliases.

AC03. `npm pack`-equivalent artifact can be installed and exercised outside the source repository. After making authoring source/build fixtures unavailable, packaged `view`, `init`, `add`, `sync`, and `doctor` still work with package assets. Consumer dependency setup is explicit and separately reproducible.

#### CLI and ownership

AC04. Every command has argument/error/help fixtures, stable exit behavior, and deterministic JSON. JSON failure produces exactly one envelope; human errors do not pollute stdout. Unsafe physical path inputs are not echoed as public locators.

AC05. Dry runs, info, view and doctor perform zero project writes, including no coordination/temp/lockfile/package-manager changes. Repeat successful initialization/add/sync is semantically unchanged and does not disturb unmanaged bytes.

AC06. Config stores only explicit roots; lock stores resolved closure with provenance. Removing a root retains needed dependencies, retires clean unneeded assets only safely, and preserves customized content with truthful ownership.

AC07. Every base/local/incoming equality combination is tested for source and CSS. Both changed is a conflict; locally customized/upstream unchanged is preserved; local equals incoming is satisfied. Untracked collisions are never silently overwritten or adopted for deletion. Missing tracked targets have a frozen, visible tested policy.

AC08. A source/CSS compatibility-cohort conflict makes the batch nonmutating. Metadata does not advance retained customized source to a falsely installed baseline. No automatic merges or force-overwrite shortcuts.

AC09. Layout and export patches preserve unrelated content, comments, formatting and existing app semantics; malformed/ambiguous inputs fail safely. Multiple occurrences, duplicate symbols and malformed CSS markers are covered.

AC10. Dependency plans include actual peer constraints and incompatible installed ranges. No implicit dependency install or package-manifest mutation. Unknown/unsupported schema versions and fields fail clearly; migration fixtures prove supported transitions.

#### Safety

AC11. Unsafe paths, parent symlinks, nonregular files, path overlap, drive/UNC edge cases and case collisions are tested for the supported platforms. Document the trusted-local threat model and unproven hostile-race limits.

AC12. Concurrent writers/preimage changes are detected. Fault injection across staging/replacement/lock publication/cleanup proves recoverable consistency or safe refusal. Recovery preserves post-crash user edits and fails closed on corrupt/ambiguous journals.

AC13. Lock metadata is final publication of a coherent planned batch. All ephemeral transaction state is isolated/cleaned or retained as recovery evidence deliberately. No recovery claim relies only on process-finally cleanup.

#### Components and styling

AC14. All original catalog mappings are recorded and implemented to the stated boundary. Initial core is qualified first; floating menu is tested early. Identity is resolved natively without unnecessary Rust shims. Router-link is a thin optional recipe. Alert Dialog uses the distinct primitive.

AC15. Type fixtures preserve state bindings, refs, discriminated unions, native attributes, event semantics and snippets. Unsupported child hooks are rejected rather than silently dropped. No `any`/SSR-disable workaround conceals incompatibility.

AC16. Real generated-app browser tests cover labels, keyboard navigation, focus trap/restoration, outside/Escape behavior, state changes, disabled/loading/required forms and reset, determinate feedback, and nested overlays where applicable.

AC17. SSR render and hydration pass without unexpected console/hydration errors. Multiple requests/instances preserve identity and do not leak mutable state. Browser-only effects are guarded/lifecycle-local.

AC18. CSS mappings match real DOM, pure CSS builds without utility tooling, token defaults and radius fallbacks pass computed-style tests, shape-critical geometry is preserved, and RTL/reduced-motion states work. Document any baseline contrast concerns instead of blindly certifying them.

AC19. Global and nested theme portal scenarios work as documented, including open-overlay theme changes and clipping/stacking caveats. CSP compatibility is tested and bounded; no unsupported no-inline-style guarantee.

#### Engineering completion

AC20. Typecheck, tests, formatting, lint, production build, package acceptance, applicable platform lanes, and any applicable Rust guard pass. Requirements are not waived by incomplete tooling. Record pre-existing failures and final blockers accurately.

AC21. Every nongated commit step is independently completed/tested/reviewed/committed with a report and evidence-backed deviations where necessary. Root docs, developer instructions, upgrade/recovery runbooks, examples, command map, dependency baseline and traceability are current.

AC22. The extension specification gate is documented. Unspecified select/combobox/popover/date/higher-level scope is not implemented or claimed as delivered. Any expanded release including it requires explicit contracts and its own approved coding sequence.

#### Final deliverables

Source and tests, built-in manifests/assets/contracts/schemas, generated SvelteKit consumer fixture, install/upgrade/conflict examples, packed artifact for inspection (not publication), CI and compatibility records, README/CONTRIBUTING/AGENTS, requirement/test evidence, and an honest final report containing last commit, completed step range, unresolved blockers and next safe action.

<a id="contract-implementation-test-plan"></a>

### Test strategy

Scheduled repository file: `implementation/TEST_PLAN.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

#### Test the right artifact

Registry authoring templates need static checks, but the decisive artifact is the **generated app produced by the installed tarball**. Maintain separate package/CLI unit tests, temp-directory integration tests, compiled generated-source fixtures, and browser tests. Shared test helpers must not accidentally bypass generation or read hidden source-tree assets.

#### Pure models and contracts

Validate strict schema errors, malformed values, duplicate IDs/paths/exports, independent versions, valid/invalid compatibility ranges, deterministic serialization/hashing, missing assets, graph cycles, root-versus-transitive provenance, and incompatible dependency intersections. Include negative examples, not just one canonical manifest.

#### Planning and ownership matrices

Exercise every B/L/I combination in sources and CSS, current=incoming adoption, untracked collisions, missing tracked files, preserved formatting, malformed markers, retired customized assets, needed transitive assets, aggregate source/style cohorts, metadata truth, and stale configs. Snapshots should be paired with semantic assertions about writes and retained bytes.

Test no writes for all read-only commands, dry runs and conflict outcomes by snapshotting the entire fixture, including hidden state, modes and temp/coordination files. Repeated commands should preserve the same semantic and byte-level state. Inspect JSON envelopes and process exit statuses from actual executable invocations.

#### Filesystem transactions

Use an injectable filesystem boundary for failure points and deterministic tests, supplemented by real-filesystem temp-directory tests. Test path traversal, prefix-confusion, overlap, symlinked ancestors, broken links, existing directories/nonregular targets, platform case handling, coordination contention and preimage changes. Inject termination/failure at each stage and ensure recovery does not overwrite post-crash user edits. Ambiguous journal state must refuse further mutation.

#### Structural patchers

CSS: missing/duplicate/mismatched/nested markers, quoted marker-like text, CRLF, comments, foreign/unmanaged rules, deterministic block order and removed blocks.

Exports: app-owned declarations/comments/imports, duplicate exported symbols, renamed imports, multiple managed regions, untracked existing barrels, sibling-path accuracy and cycle checks.

Svelte integration: absent layout/script, instance/module script separation, TypeScript, existing ordered/unordered imports, comments, alternate valid formatting and unsupported layouts. Assert preservation of route children/render behavior and script semantics.

#### Wrapper and browser tests

Use typed positive/negative fixtures for actual pinned primitive/native props. Test state/ref binding updates in both directions, optional controlled defaults, children/child forwarding or rejection, caller classes/attributes, event cancellation/order and discriminated unions. Avoid `any` casts as proof of compatibility.

Browser assertions cover focus navigation/return, required accessible names and relationships, activation/dismissal, form value/required/disabled/reset behavior, no duplicate hidden inputs, loading busy semantics, image fallback, progress state, RTL and reduced motion. Test overlays nested across families and interrupted open/close transitions. Accessibility tools are supplementary to behavioral assertions, not a substitute for manual semantic review.

#### CSS and theme verification

Check every public class and property in the mapped contract against real generated DOM. Use computed styles for radius fallback precedence, full border-radius grammar, indicator geometry, token overrides, theme changes and scoped portals. Record visual/contrast issues honestly. Verify ordinary CSS tooling succeeds without Tailwind or CSS-in-JS.

#### SSR/hydration and concurrency

Build the real SvelteKit app. Render multiple instances/requests and hydrate without unexpected warnings or server-global state leakage. Test initial open/checked/value states and portal hydration per the pinned primitive contract. No SSR-disabled fixture qualifies this requirement.

#### Package acceptance

Build and pack the CLI, inspect included assets/schemas and executable metadata, install tarball into an isolated harness, then make the authoring checkout/build state unavailable. Run information, install, sync and doctor commands against consumer fixtures. Network during explicit dependency setup is distinct from the registry's package-local operation requirement. No npm publication is necessary.

#### Matrix and evidence

Resolve supported Node/OS/browser/version/feature matrix at discovery and record exact lanes. Use Linux/macOS/Windows tests for advertised filesystem behavior, not an untested portability claim. Where Rust exists, preserve its baseline and valid render-feature lanes independently. Record actual commands, versions, exit statuses, commit hashes and unverified lanes after each commit.

<a id="contract-implementation-verification"></a>

### Verification commands and known-good commits

Scheduled repository file: `implementation/VERIFICATION.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

#### Discover before executing

The authorized target is this repository. At S001 record Git root/status, authorized target/reference roots, package manager and lockfile, Node/Svelte/Bits/TS versions, package scripts, CI workflows, OS support, and any Cargo workspaces. Use `git status --short`, `git log -12 --pretty=%s`, manifest inspection, and existing instructions. Do not execute application config or install dependencies merely to enumerate it.

The plan uses the following **proposed command categories for a new target**, not claims that these scripts already exist. Establish actual scripts or map existing equivalents during bootstrap and record the mapping in the implementation evidence. Use the detected package manager rather than replacing its lockfile. Commands must execute meaningful checks; placeholder scripts that always succeed are prohibited.

| Category                          | Proposed invocation                                        | Required meaning                                                                                                                                                       |
| --------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Documentation/contract validation | `node tools/check-contracts.mjs` (establish in S002)       | Validate repository contracts, links, checkpoint order and requirement coverage; allow truthful evolving implementation status. This does not verify product behavior. |
| Format                            | `pnpm run format:check`                                    | Nonmutating format check on scoped target code/docs.                                                                                                                   |
| Lint                              | `pnpm run lint`                                            | Real configured TS/Svelte lint, no ignored new violations.                                                                                                             |
| CLI typecheck                     | `pnpm run typecheck`                                       | TypeScript compiler checks for Node CLI and tests.                                                                                                                     |
| Unit                              | `pnpm run test:unit -- <test-file>`                        | Pinned unit runner with explicit file selection; map syntax if not supported.                                                                                          |
| Integration                       | `pnpm run test:integration -- <test-file>`                 | Temporary filesystem/CLI/registry integration suite.                                                                                                                   |
| Registry                          | `pnpm run test:registry -- <test-file>`                    | Manifest/asset/schema/contract/export integrity.                                                                                                                       |
| Components                        | `pnpm run test:components -- <test-file>`                  | Generated wrapper typing and render/component semantics.                                                                                                               |
| Consumer check                    | `pnpm run fixture:check`                                   | Real `svelte-check`/SvelteKit sync of generated app.                                                                                                                   |
| Consumer build                    | `pnpm run fixture:build`                                   | Real production SvelteKit build from generated app.                                                                                                                    |
| Browser                           | `pnpm run test:browser -- <test-file>`                     | Browser tests against generated app; runner file syntax discovered first.                                                                                              |
| CLI build                         | `pnpm run build`                                           | Build actual executable and bundle/retain required assets.                                                                                                             |
| Package                           | `pnpm pack --json`; `pnpm run test:package -- <test-file>` | Inspect and execute installed tarball outside authoring tree.                                                                                                          |
| Diff health                       | `git diff --check`; `git diff --cached --check`            | Whitespace and final staged-content review.                                                                                                                            |

In early steps before a lane exists, execute the meaningful already available baseline plus the current step's direct validator. Add the lane and its real test in the same step that introduces that capability. Do not report an unavailable script as passed. Every step lists its direct lane; component steps also need the app's check/build where the feature affects generated output.

#### Cargo guard — applies to every commit step

If an authorized target or in-place reference worktree contains Cargo manifests, keep the applicable Rust baseline known-good. A TS-only change does not authorize Rust modifications. A read-only external reference that is unavailable locally can be recorded unavailable; it must not be falsely reported as tested. No Cargo manifest in target/reference scope means Cargo is N/A, with manifest inventory evidence.

For the reviewed Leptos workspace, known commands are:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace --all-targets
```

The source contribution contract explicitly names fmt/test; cargo check is added to honor the user's specification requirement. Run at the actual Rust workspace root, not the TypeScript package root. Baseline toolchain declares Rust 1.92.0 / edition 2024; respect actual rust-toolchain.toml and lockfiles rather than upgrading them as part of the port.

When specific Rust files are affected, run `cargo check -p <affected-crate> --all-targets` and `cargo test -p <affected-crate> --all-targets`, plus dependent/workspace tests justified by the change. Do not literally pass angle-bracket placeholders: discover actual crate IDs first. Full workspace check/test are the safe default if scope cannot be established. If Rust is present but untouched, run/check the baseline guard at each step; an unchanged verified hash can be noted as supporting evidence but is not a fresh executed test.

Run the existing lint lane discovered from repository instructions/CI. A proposed `cargo clippy --workspace --all-targets -- -D warnings` is not assumed baseline-green or newly required without discovery. Do not enable `--all-features` blindly: CSR, SSR, hydrate and render-neutral libraries have mutually constrained combinations. Discover feature names, targets and commands from Cargo manifests and fixtures and test valid combinations separately. Do not invent feature flags or install a target just to silence failure.

For Rust packaging/provenance/install changes, the known reference package lane is:

```sh
cargo package --workspace --allow-dirty --no-verify --locked
cargo test -p leptos_ui_kit_registry --test package_source \
  packaged_sources_build_with_cargo_vcs_provenance_outside_and_inside_hostile_git -- \
  --ignored --exact --nocapture
cargo test -p leptos_ui_kit_cli --test packaged_runtime \
  installed_binaries_run_after_package_source_and_build_state_are_deleted -- \
  --ignored --exact --nocapture
```

The ignored tests are not executed by the ordinary workspace suite. The source contribution notes require them from a clean Git worktree because dirty VCS metadata is rejected. Use an isolated clean worktree/staging flow when needed; do not clean/reset unrelated user work. Transaction changes in that workspace require Linux/macOS/Windows qualification. These Rust lanes are conditional on actual Rust scope, not a requirement to rewrite Rust for a Svelte product.

#### Per-step minimum

Run the current step's unit/integration checks, relevant type/lint/format checks, `git diff --check`, self-review, and the conditional Cargo guard. Generated output changes require consumer check/build; browser-affecting changes require scoped browser tests. Filesystem/packaging changes require their acceptance/fault lanes. Run full cumulative suites at milestone and final boundaries, not only snapshots of the latest item.

A new relevant test failure stops the next commit step. A demonstrably pre-existing/out-of-scope failure can be recorded without blocking unrelated safe work only with baseline evidence, impact reasoning and a named blocker; it cannot be called a passing lane or silently waived at release. Environmental blockers (network/compiler/browser unavailable) mean unverified, not successful.

#### Final verification

Regenerate fixtures with the packed CLI; install declared consumer dependencies explicitly; run all cumulative lanes, supported OS variants, SSR/hydration/browser scenarios, package-source-unavailable test, safety/recovery tests, and applicable Cargo guards. Inspect packed file inventory and consumer runtime imports. Update traceability with actual test file names and results. Do not publish or push as part of verification.

<a id="contract-implementation-open-questions"></a>

### Open questions and safe discovery instructions

Scheduled repository file: `implementation/OPEN_QUESTIONS.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

These are not invitations to redesign approved product intent. Resolve in the scheduled contract/discovery step, record evidence, and proceed within scope. Do not repeatedly ask questions that repository inspection can answer.

| ID  | Question / status                                                                                                                                                          | Safe resolution and blocking boundary                                                                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q01 | Resolved: this standalone svelte-ui-kit repository is the authorized target.                                                                                               | Inspect operator-supplied worktree and instructions; distinguish source reference from target. Block filesystem modifications outside an authorized target.                                             |
| Q02 | Resolved: retain area: imperative summary, consistent with the target docs commit and reference fallback.                                                                  | Inspect recent subjects; use its consistent convention. Reference fallback is `area: imperative summary`.                                                                                               |
| Q03 | Partially resolved: pnpm 11.22.0, Node >=24 and Prettier 3.9.6 are established; exact framework/runtime selections still need S003/S011 evidence.                          | Inspect manifests/lockfiles; verify actual package metadata/peers and run a pinned compatibility probe before wrappers. Historical Bits source version is not a latest-release claim.                   |
| Q04 | Custom UI path and SvelteKit config support breadth not frozen.                                                                                                            | Support defaults first and explicit safe mapping. Determine how custom paths are discovered without arbitrary config execution; reject ambiguity.                                                       |
| Q05 | JSON schema initial values/hosting and precise field layout not frozen.                                                                                                    | Freeze independent local schemas during model commits. Do not emit invented hosted URLs; record optional publication as future operational work.                                                        |
| Q06 | Exact CLI exit-code map and export-region marker grammar not frozen.                                                                                                       | Compare existing target conventions with reference examples, document once and golden-test before handlers.                                                                                             |
| Q07 | Trusted-local path threat model and supported platforms need evidence.                                                                                                     | Adopt explicit narrow initial assumption or design stronger controls; qualify symlink/race/rename/durability limits before mutating commands.                                                           |
| Q08 | Tracked deletion and identical untracked adoption policies need freezing.                                                                                                  | Preserve user work by default, report missing content visibly, and never grant silent deletion rights. Test cases before planner integration.                                                           |
| Q09 | Cohort compatibility with locally customized but upstream-unchanged members needs a conservative rule.                                                                     | Freeze whole-component/expanded dependency safety policy; block a risky mixed update rather than guess semantic compatibility.                                                                          |
| Q10 | Exact wrapper signatures beyond Button/Switch/Dialog examples not supplied.                                                                                                | Read source manifest/API and pinned native/Bits types; complete each component worksheet and type tests. No unapproved upstream-part expansion.                                                         |
| Q11 | Useful generated identity helper/item unclear.                                                                                                                             | Verify stable Svelte/Bits identity and cross-request behavior. Prefer no generated Rust-style helper; document non-generated parity mapping if none is needed.                                          |
| Q12 | Router-link exact recipe/path behavior needs target evidence.                                                                                                              | Use native anchors and target SvelteKit link conventions; preserve separate optional install identity without inventing a router abstraction.                                                           |
| Q13 | Strict CSP/inline-style capability not verified.                                                                                                                           | Inspect/test actual pinned positioning output and real policy. Document limits; pure CSS is not a strict-CSP promise.                                                                                   |
| Q14 | Browser/accessibility/contrast matrix not fully specified.                                                                                                                 | Start with actual supported target lanes, add applicable keyboard/form/focus/RTL/motion/theme tests, and report baseline visual issues. Do not claim broad certification.                               |
| Q15 | Partially resolved: target licensing is MIT OR Apache-2.0. npm name ownership, publisher identity and release destination remain unverified; publication is outside scope. | Implement package shape without publication. Inspect target license, preserve source notices for copied CSS/code, and record any name conflict. Do not rename product or publish without authorization. |
| Q16 | Extension APIs for select/combobox/popover/date/higher-level patterns unspecified.                                                                                         | Preserve direction; final scope gate identifies inventory and contracts. No guessed code or fabricated date/timezone policy. Expanded release remains blocked.                                          |
| Q17 | Broader non-SvelteKit Svelte libraries or other build adapters not explicitly required.                                                                                    | Keep SvelteKit default. Do not copy the Leptos CSR/SSR/shared-library matrix as new product targets; add only supported evidence-backed fixture variants.                                               |

#### Unresolved does not mean incomplete execution instructions

The implementation sequence contains explicit steps to resolve these technical points before affected code. A blocker requiring new product intent is reported at that boundary; unrelated verified work may continue only if dependency order and safety permit. No agent may silently mark an unresolved decision “confirmed.”

<a id="contract-implementation-operations-runbook"></a>

### Installation, upgrade, and recovery runbook contract

Scheduled repository file: `implementation/OPERATIONS_RUNBOOK.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

Status: instructions for what the implementation must support and later verify. The new CLI is not supplied as a working binary in this specification. Replace command paths only with actual built/installed executable evidence; no npm publication is assumed.

#### Initial installation

Start at one authorized SvelteKit application root (or use --cwd). Preserve a clean known baseline or record existing changes. Run info to inspect integration/dependency state. Inspect an item's metadata/source with view. Review init/add dry runs and all proposed paths. Apply initialization and requested items. Install reported consumer dependencies explicitly using the actual project manager. Check the generated app with Svelte check, production build and relevant browser tests. Commit application source/CSS/config/lock/contract metadata; do not commit transient writer state.

The init contract does not preinstall the complete catalog. Component requests remain distinct from their dependencies. Existing themes.css/app.css/layouts are application-owned and must survive integration.

#### Customization

Use application theme/override styles for portable changes or edit generated source/managed blocks directly. Preserve class/property contracts as needed by related parts. A valid local edit is not a broken installation by itself. Record substantive source changes in application Git history; CLI lock baselines must not be rewritten manually just to hide drift.

#### Upgrades

Choose a tested CLI/registry version and review dependency compatibility. Run sync --dry-run. Untouched generated content can update, local-only edits remain, already-incoming content is satisfied, and genuine conflicts stop the batch. Inspect incoming source through view --source and reconcile deliberately. Source/CSS/export compatibility cohorts must update safely together. Rerun dry-run, apply, then typecheck/build/browser/doctor. Commit the result and metadata truthfully.

Do not use invented --force, auto-merge, accept-hash or dependency-install options. Hashes alone cannot reconstruct a merge base. An application's Git history is useful to review changes but must not be silently treated as authority to overwrite local content.

#### Removing desired items

Edit the explicit requested set in kit.json and inspect sync --dry-run. Shared dependencies remain while needed. Clean obsolete owned targets may retire under the frozen policy; customized assets remain with diagnostics and explicit ownership changes. Resolve remaining application imports manually; the CLI does not promise arbitrary source rewriting. No remove command is part of the approved interface.

#### Interrupted writes

Stop further mutation when a command reports pending/ambiguous recovery. Preserve current files and transaction evidence. Use read-only diagnosis to understand the state; do not delete lock/journal files based only on age, PID, or a guess. The implemented protocol must safely finish/revert a provable interrupted state or refuse with actionable guidance. It must not overwrite edits made after interruption.

The implementation must provide fixture-tested instructions for prepared, partially applied, published-but-not-cleaned, and invalid/ambiguous states. It may not claim safe recovery before those fixtures pass. A cleanup failure after publication is not the same as a failed uncommitted installation; command reports must distinguish them.

#### Agent specification after each commit

Use STEP_REPORT_TEMPLATE.md. State exact commands/working directories/results and unverified lanes, preserve failed evidence, commit only scoped changes, and name the next numbered step. Do not claim a final release when any required acceptance criterion remains blocked. Package construction/testing does not authorize publication or a remote push.

<a id="contract-implementation-step-report-template"></a>

### Commit-sized step report

Scheduled repository file: `implementation/STEP_REPORT_TEMPLATE.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

Step ID and title:
Contract/requirement IDs:
Actual target root and branch:
Starting commit / baseline status:

#### Implemented

Exact behavior added or changed:
Files changed (including generated fixtures/contracts):
How changes stay within the scheduled scope:

#### Verified

Commands executed verbatim, working directory, relevant tool versions, exit status and result:
Tests added/updated and what each demonstrates:
Generated-app/type/build/browser/package checks, as applicable:
Cargo check/test/fmt/repo checks, or explicit N/A with manifest inventory:
Self-review and staged-diff findings:

#### Exceptions

Pre-existing/out-of-scope/environmental failures with evidence:
Unverified behavior and release impact:
Deviations with record ID and repository evidence:
Unresolved issues:

#### Commit and next action

Actual commit hash and message:
Requirements/test evidence updated:
Next step ID:
Is the next step safe to begin? yes/no, with reason:

Never substitute “tests passed” for actual commands/results. Do not claim a CI/platform check ran locally if it did not. A report is evidence, not a waiver of acceptance.

<a id="contract-implementation-deviation-template"></a>

### Evidence-backed implementation deviation

Scheduled repository file: `implementation/DEVIATION_TEMPLATE.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

Deviation ID / date / current step:
Affected scheduled step(s):
Affected durable requirements:

Repository evidence proving obsolete or unsafe scope:
Why the original step cannot be executed as written:
Why this is not merely convenience or broader scope:
Proposed smallest replacement / explicit N/A disposition:
Dependencies and ordering impact:
Compatibility/ownership/security implications:
Required spec amendment, if any (new product intent cannot be self-approved):
Tests and verification proving replacement safety:
Actual changes and commit(s):
Remaining risk / reviewer or owner decision needed:

Record before skipping, merging, reordering or broadening a step. Retain the original step ID in the plan with a cross-reference; never silently erase it. Token/time constraints are not repository evidence.

<a id="contract-implementation-extension-gate"></a>

### Gated extension direction

Scheduled repository file: `implementation/EXTENSION_GATE.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

Status: approved direction; **not implemented and not yet API-specified**.

The review recommended extending the stable generator/wrapper architecture to select, combobox, popover, date-related components, and higher-level patterns after core and original-catalog parity. This direction remains part of project intent. The approved review did not supply enough public API or behavior detail to write a truthful complete coding sequence for these items.

#### Required next specification inputs

For select/combobox: exact item set and modes, values/generics, controlled/uncontrolled behavior, filtering/search ownership, form/validation behavior, rendering/snippet/ref policy, async behavior only if requested, disabled/empty/loading states, accessibility tests and styling contracts.

For popover: exact composition/defaults and relationship to already qualified portal/floating machinery; focus/dismissal semantics and CSS contract. Do not assume it is Dialog with a renamed class.

For date-related items: exact inventory (not every Bits date component), value types, locale/calendar/timezone responsibility, form serialization, formatting/validation, range behavior only if requested, and dependency/cross-request requirements. No date/timezone policy is invented by this specification.

For higher-level patterns: named examples and scope; distinguish composition recipes from new primitive/state/async systems. Existing accordion-like, alert/status, breadcrumb/pagination and native-table compositions stay lightweight.

#### Output of the scheduled gate

Record stable reusable infrastructure, remaining product questions, exact contracts to freeze, dependency/API evidence, and acceptance criteria. Only after the missing scope is settled should an agent create the next numbered commit sequence. Do not call the core release an implementation of these extensions. Do not substitute hundreds of speculative steps for the missing human intent.

<a id="contract-decisions-adr-0001-architecture"></a>

### ADR-0001 — Source-first TypeScript generator, not a styled runtime

Scheduled repository file: `decisions/ADR-0001-architecture.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

Status: accepted by user approval of the review. The authorized target is this standalone repository.

#### Context

The user wants a SvelteKit equivalent of the Leptos source-first installation/styling system. The source's value includes explicit manifests, local code ownership, CSS contracts, deterministic plans, locks and packaging rigor; its Rust primitives and module system are framework-specific.

#### Decision

Use one initially publishable npm package named `svelte-ui-kit`, modular TypeScript internals, and bundled JSON/Svelte/TS/CSS/schema assets. Generate local components and styles; use Bits UI for interaction and native markup for appropriate simple components. Consumer imports are local, not from a styled runtime package.

#### Consequences

The generator is a development/install tool, while Bits and Svelte are genuine consumer dependencies. Asset lookup must work from a tarball. Internal modules can evolve independently without inventing multiple public packages. Native semantic source remains editable. A Rust rewrite, runtime styling layer or remote registry would require a separate product decision.

#### Alternatives not selected

A runtime styled component package would undermine source ownership. A literal Rust-to-Svelte primitive translation would duplicate Bits responsibilities. A multi-package framework is unnecessary for the initial approved architecture.

<a id="contract-decisions-adr-0002-generated-css-and-layout"></a>

### ADR-0002 — Preserve recognizable source and CSS conventions

Scheduled repository file: `decisions/ADR-0002-generated-css-and-layout.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

Status: accepted by approval.

#### Decision

Use `src/lib/components/ui`, `_kit`, and `src/styles/kit.css` by default. Simple items use one component file plus optional types; compound items use directories and part files. Export flat PascalCase names through explicit manifest-driven barrels. Keep `.kit-*` and `--kit-*`; rename tool markers/layers to `svelte-ui-kit`.

Use one installed managed stylesheet with block-level ownership. Themes and application overrides stay app-owned and load afterward. Component custom properties and semantic tokens remain separately governed. Preserve radius fallback and shape-critical defaults.

#### Consequences

CSS from the reference can be mapped to Bits DOM without replacing the design vocabulary. Selectors still need verification. The aggregate stylesheet includes all installed blocks and does not promise per-route pruning. Managed export regions/layout imports must preserve application text. A second installed per-component CSS authority or a utility conversion pipeline is not part of the design.

<a id="contract-decisions-adr-0003-customization-aware-sync"></a>

### ADR-0003 — Three-way detection, truthful lineage, and cohorts

Scheduled repository file: `decisions/ADR-0003-customization-aware-sync.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

Status: accepted by approval. Missing-target/adoption and exact conservative cohort rules are scheduled technical freezes.

#### Decision

Compare base last-installed upstream content, current local content, and incoming registry content per source file and managed CSS block. Preserve local-only changes, update untouched targets, treat local=incoming as satisfied, and stop genuinely conflicting batches. No automatic text merging or force overwrite. Keep component source/styles/exports compatible as a cohort and record effective lineage truthfully.

Store explicit root requests separately from resolved transitive items. On retirement, preserve customized source/CSS and do not silently reacquire ownership. Strict doctor does not treat a legitimate customization as corruption.

#### Consequences

Editable source is a first-class supported state. Hashes support detection but do not reconstruct a merge base. Per-target metadata must not merely claim the latest registry version. Conservative cohorts can require explicit reconciliation rather than a risky partial upgrade. New automatic merge/storage/accept-hash workflows would require a separate contract.

<a id="contract-decisions-adr-0004-primitive-and-theme-boundaries"></a>

### ADR-0004 — Preserve primitive behavior and explicit portal theme scope

Scheduled repository file: `decisions/ADR-0004-primitive-and-theme-boundaries.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

Status: accepted by approval.

#### Decision

Keep complex interaction in Bits UI and preserve its typed state/ref/snippet/event interfaces through wrappers. Use Svelte-native bindings and native element types. Keep distinct Alert Dialog semantics. Preserve floating positioning wrapper structure. Do not copy Rust focus/layer/identity internals.

Application-wide themes can live at a document-level scope. Nested themes can use an explicitly suitable custom portal host, with documented stacking/clipping limits. Application code owns theme persistence and color-scheme. Pure CSS design styling is not a guarantee against runtime inline placement styles; CSP support must be measured.

#### Consequences

Small wrappers still require meaningful browser and type tests. Accepting and discarding a snippet is an API bug. Name/ref/event forwarding errors can undermine accessibility even when using an accessible primitive. There is no hidden theme store, computed-style-copy mechanism or unsupported CSP claim.

<a id="contract-decisions-adr-0005-rust-verification-boundary"></a>

### ADR-0005 — Reconcile the Rust specification language with the approved stack

Scheduled repository file: `decisions/ADR-0005-rust-verification-boundary.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

Status: necessary implementation assumption A01, explicitly recorded; not a user-requested stack change.

#### Context

The user approved a TypeScript/Svelte generator, then requested a rigorous specification using Rust-architect wording and per-step Cargo checks. No message explicitly requested replacing TypeScript with Rust.

#### Decision

Preserve the approved stack. At every step inventory any actual authorized target/in-place reference Cargo workspace and run its applicable check/test/format/repository lanes. Use exact workspace roots and discovered feature combinations. In a TS-only target mark Cargo N/A with evidence. Do not create Rust code, move the reference workspace, or claim npm checks verify Rust.

#### Consequences

The specification lists conditional Cargo commands in every step and the complete known reference package lane centrally. Target location is resolved to this repository; S001 still records the actual manifest inventory and conditional guard applicability. A truly Rust-based new CLI would be a new product decision, not a silent interpretation.

<a id="contract-decisions-adr-0006-scope-and-discovery-gates"></a>

### ADR-0006 — Preserve unspecified details as explicit gates

Scheduled repository file: `decisions/ADR-0006-scope-and-discovery-gates.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

Status: implementation assumptions A02–A09 and explicit unresolved questions; approved intent is unchanged.

#### Decision

Separate confirmed product contracts from exact technical choices not supplied in the conversation. Discover target roots/conventions/toolchain/scripts before code. Freeze schema fields, exit map, marker grammar, missing-file/adoption policy, cohort rules and component API worksheets at scheduled steps. Versioned schemas are implementation deliverables; this package does not fabricate published schema URLs or claim those schemas already compile.

The broader select/combobox/popover/date/higher-level direction is retained in a final specification gate. The first coding sequence delivers the fully defined generator/catalog adaptation and explicitly reports that the broader extension API scope remains undefined. An expanded v1 including those components is not called complete without their contracts and coding sequence.

#### Consequences

The specification is self-contained for intent and execution rules without pretending to know an undisclosed target repository or missing APIs. An agent can resolve ordinary technical details through source evidence, but cannot turn speculative new features into approved requirements. Plan deviations need repository proof; new intent needs a durable spec amendment.

<a id="contract-references-source-baseline"></a>

### Reference evidence and limits

Scheduled repository file: `references/SOURCE_BASELINE.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

#### Immutable source baseline

Repository: `https://github.com/triesap/leptos_ui_kit`
Commit: `a10fbf06334f4648f5755e05a7147414e4e5fc98`
Default branch observed: `master`.

Use immutable blob URLs of the form:

```
https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/<path>
```

The important review evidence is summarized below so product intent does not require fetching the repository. Implementers may still inspect original code for exact catalog API/CSS details not defined in the approved review; do not pretend those details were already frozen here.

| Source path                                                              | Observed evidence and relevance                                                                                                                                                                                  |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| README.md / AGENTS.md / CONTRIBUTING.md                                  | Source-first editable components, pure CSS, CLI workflow, supported Leptos modes, no Cargo.toml mutation, naming, theme policy, package validation.                                                              |
| Cargo.toml                                                               | Six workspace crates; package version 0.1.0; edition 2024; rust-version 1.92.0. Framework/schema target is separately observed as 0.9.0-alpha; do not confuse crate package SemVer with framework compatibility. |
| crates/leptos_ui_kit_registry/src/config.rs                              | Defaults `src/components/ui`, `_kit/kit.json`, `styles/kit.css`; strict camelCase config; several schema/framework constants share 0.9.0-alpha.                                                                  |
| crates/leptos_ui_kit_registry/src/builtin_registry.rs                    | Embedded asset snapshot and registry/schema/contract validation; package-local immutable asset model.                                                                                                            |
| crates/leptos_ui_kit_registry/registry/registry.json                     | 22-item inventory; primitive, identity, layer and portal compatibility metadata.                                                                                                                                 |
| crates/leptos_ui_kit_registry/registry/ui/button.json                    | button.rs export declarations; managed CSS block; tokens/spinner dependencies; accessibility/dependency metadata.                                                                                                |
| crates/leptos_ui_kit_registry/registry/ui/button.rs                      | Native button, primary/secondary/ghost, sm/md/lg, explicit native type, disabled/loading/busy behavior and decorative spinner.                                                                                   |
| crates/leptos_ui_kit_registry/registry/ui/dialog.json                    | Compound directory with explicit target files/exports and identity/tokens dependencies; external web_ui_primitives dependency.                                                                                   |
| crates/leptos_ui_kit_registry/registry/ui/dialog/content.rs              | Primitive-backed layers/dismissal/portal/presence and role switch; port should delegate to Bits, with separate Alert Dialog.                                                                                     |
| crates/leptos_ui_kit_registry/registry/styles/{tokens,button,switch}.css | kit class/property vocabulary, managed block markers, cascade layers, radius fallback, checked-state/RTL/motion behavior.                                                                                        |
| crates/leptos_ui_kit_codegen/src/install_lock.rs                         | File/CSS ownership, hashes and reverse indexes, strict lock constants/theme metadata.                                                                                                                            |
| crates/leptos_ui_kit_codegen/src/planning/files.rs                       | Refuses locally edited tracked source on differing incoming output; lock publication is last marker in nonempty cohorts. Not a text merge engine.                                                                |
| crates/leptos_ui_kit_codegen/src/planning/sync.rs                        | Rebuilds desired config from resolved closure, motivating separation of user roots from dependencies.                                                                                                            |
| crates/leptos_ui_kit_codegen/src/planning/init.rs                        | Plans config/CSS/modules/lock instead of scattered writes.                                                                                                                                                       |
| crates/leptos_ui_kit_cli/tests/exit_contract.rs                          | JSON stdout/stderr/exit contracts, idempotence, conflicts and unsafe paths.                                                                                                                                      |
| crates/leptos_ui_kit_cli/tests/{workflow,packaged_runtime}.rs            | End-to-end and packaged-runtime coverage; inspect actual commands before running.                                                                                                                                |
| crates/leptos_ui_kit_codegen/src/path_safety* and transaction*           | Strong filesystem protections; do not claim unqualified Node-equivalent security.                                                                                                                                |
| crates/leptos_ui_kit_codegen_platform                                    | Narrow Windows platform boundary, the exceptional unsafe-code scope in the reference. Not a required Svelte package.                                                                                             |

#### Commit convention evidence

The GitHub connector returned these recent reference subjects at specification preparation:

- `a10fbf0` — `switch: strengthen the unchecked track contrast`
- `db5635f` — `switch: animate track and thumb state`
- `705f972` — `checkbox: constrain svg indicator geometry`
- `494ef17` — `checkbox: render a canonical svg checkmark`
- `689cf8d` — `selection: stabilize white control indicators`
- `e4c128a` — `registry: complete desired item vocabulary`

Inferred convention: lowercase area, colon and space, imperative lower-case summary; optional body explains behavior/tests. Use this fallback only when the actual target has no stronger convention. Do not assume Conventional Commits `feat(scope):` was established by this source.

#### Current-doc checks and version limits

Official Svelte/Bits docs were read during the source review for project layout, bindings, dialog composition, child snippets, portals, handler merging, compiler parsing and request-local state. The [reference URL inventory](#reference-url-inventory) preserves those pointers for later adoption into `references/SOURCES.json`. These are mutable documentation pointers, not a lockfile or a validated compatibility matrix; recheck selected versions during implementation.

The historical Bits source package manifest observed in the review was version 2.19.3, Svelte peer `^5.33.0`, date peer `^3.8.1`, Node `>=20`; verify actual selected package metadata before using it. No current npm release or package-name availability claim is made.

#### Verification limitations

No Rust/Svelte project test suite ran during specification creation. The source specification validator checked document/plan integrity only. The exact reference revision was available for inspection during the target review; that access does not establish test execution or implementation correctness. Target code and third-party dependencies must still be implemented and verified in the authorized environment.

Retain required upstream license notices when copying CSS/code and inspect the actual target licensing policy before distribution. The reference declares MIT OR Apache-2.0; publisher identity and publication remain outside this implementation scope.

<a id="contract-references-token-baseline"></a>

### Reference token defaults and important component observations

Scheduled repository file: `references/TOKEN_BASELINE.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

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

<a id="contract-repo-agents"></a>

### Agent instructions — svelte-ui-kit

Scheduled repository file: `repo/AGENTS.md`. Until S002 adoption, this section supplies its approved content; read it together with the resolved baseline and approved review dispositions above.

This is the approved target instruction template for adoption at S002. Merge with the actual applicable instructions; it is not installed as AGENTS.md by this planning setup.

#### Product

Implement `svelte_ui_kit_v1` from `specs/`. Product/package/executable is `svelte-ui-kit`. One TypeScript CLI with bundled registry assets. Generated Svelte/TS/plain CSS belongs to the application. Bits UI owns behavioral primitives; simple native elements remain appropriate. No styled kit runtime dependency, Tailwind, CSS-in-JS, shadcn/React compatibility, remote registry, auto-install, auto-merge or extra unscoped APIs.

#### Architecture

Keep `src/cli`, `src/project`, `src/registry` and `src/codegen` separated. Authored templates/assets live under `registry`, schemas under the versioned `schema` directory. Planner is read-only; application happens through guarded recoverable transactions. Lock metadata is final publication. Consumer wrappers never import CLI/Node/registry internals.

Generated defaults: `src/lib/components/ui`, its `_kit`, and `src/styles/kit.css`. Preserve hybrid simple/compound files, PascalCase exports, kebab-case items/files, camelCase props, `.kit-*`, `--kit-*`, and tool-namespaced CSS markers/layers. Use direct sibling imports inside templates. Preserve unmanaged source/CSS/layout regions.

#### Ownership

Keep explicit requests separate from dependencies. Preserve local customizations with base/local/incoming comparison. Stop genuine conflicting batches. Keep component source/style/export cohorts compatible. Never delete customized retired assets or falsify base hashes to hide edits. Doctor distinguishes customization from breakage. Dry runs create no files, including hidden transaction state.

#### Components

Use actual pinned native/Bits types. Preserve bindings, refs, snippets, discriminated unions and event ordering/cancellation. Do not accept-and-drop rendering hooks. Keep SSR/hydration and request identity safe. Test keyboard/form/focus/disabled/reset and theme/portal behavior. Separate Alert Dialog semantics. Pure CSS is not a promise of zero runtime inline positioning styles.

#### Workflow

Read `implementation/COMMIT_SEQUENCE.md` and run one step/commit at a time. Spec first; write tests with changes; verify continuously; self-review staged diffs. No skipping/merging/reordering/broadening without repository proof of obsolete/unsafe scope and a deviation record. No unrelated cleanup, destructive Git operations, remote push or npm publish unless explicitly instructed.

Discover actual commands and commit convention before coding. Reference fallback is `area: imperative summary`. Follow `implementation/VERIFICATION.md`, including conditional Cargo guards for any present/affected Rust workspace. Do not create Rust code to satisfy a generic checklist.

After every step report exact files, commands/results, commit hash, unverified issues, deviations and next-step safety. New relevant failures block progress; evidence-backed pre-existing exceptions remain explicit and do not waive final done criteria. Never disable tests, weaken types, suppress accessibility failures, or turn off SSR to pass.

#### Documentation

Keep enduring intent in `specs/`; execution/status in `implementation/`; rationale in `decisions/`. Root README/CONTRIBUTING/AGENTS carry public developer guidance. Do not create an unnecessary docs tree or coordination database. Code, registry, schema, examples and tests move together when contracts change. Extension work needs its own specified API/sequence gate.

<a id="reference-url-inventory"></a>

## Reference URL inventory

These pointers preserve source-review provenance. Mutable documentation and source manifests must be rechecked against the versions selected at S003/S011; no current-version claim is made here. S002 can project this inventory into `references/SOURCES.json` without requiring an external planning document.

| ID    | Reference                                                                                                           | Evidence boundary                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| SRC01 | [Leptos immutable baseline](https://github.com/triesap/leptos_ui_kit/tree/a10fbf06334f4648f5755e05a7147414e4e5fc98) | Static reference inspection; no Rust test result implied.          |
| SRC02 | [Reference commit history](https://github.com/triesap/leptos_ui_kit/commits/master)                                 | Convention evidence; use immutable revision for source adaptation. |
| SRC03 | [Bits source manifest](https://github.com/huntabyte/bits-ui/blob/main/packages/bits-ui/package.json)                | Historical source observation, not an exact target dependency pin. |
| SRC04 | [Bits Switch](https://bits-ui.com/docs/components/switch)                                                           | Recheck types, forms and behavior at selected versions.            |
| SRC05 | [Bits Dialog](https://bits-ui.com/docs/components/dialog)                                                           | Composition reference; generated-app qualification required.       |
| SRC06 | [Bits child snippets](https://bits-ui.com/docs/child-snippet)                                                       | Preserve delegated and floating wrapper structure.                 |
| SRC07 | [Bits Portal](https://bits-ui.com/docs/utilities/portal)                                                            | Verify default/custom targets and theme scope.                     |
| SRC08 | [Bits mergeProps](https://bits-ui.com/docs/utilities/merge-props)                                                   | Verify event ordering/cancellation against pinned behavior.        |
| SRC09 | [SvelteKit project structure](https://svelte.dev/docs/kit/project-structure)                                        | Default layout reference; explicit custom mappings need fixtures.  |
| SRC10 | [Svelte bindable props](https://svelte.dev/docs/svelte/$bindable)                                                   | State/ref forwarding needs typed and behavioral tests.             |
| SRC11 | [Svelte compiler](https://svelte.dev/docs/svelte/svelte-compiler)                                                   | Parser API must match selected version.                            |
| SRC12 | [SvelteKit state management](https://svelte.dev/docs/kit/state-management)                                          | Preserve request-local state and SSR.                              |
| SRC13 | [Bits Alert Dialog](https://bits-ui.com/docs/components/alert-dialog)                                               | Freeze distinct primitive API; do not emulate via Dialog role.     |
| SRC14 | [Svelte TypeScript](https://svelte.dev/docs/svelte/typescript)                                                      | Derive native element types from pinned dependencies.              |
| SRC15 | [SvelteKit link options](https://svelte.dev/docs/kit/link-options)                                                  | Verify native routing/base/link behavior in the target fixture.    |
| SRC16 | [Bits styling](https://bits-ui.com/docs/styling)                                                                    | Plain CSS styling; runtime placement/CSP still needs measurement.  |

## Evidence and deviation record

Planning setup: governing plan created with all 203 checkpoint definitions, eleven ordered RCLD sequences, explicit scope/green/verification gates, 34 product requirements, 22 acceptance criteria, embedded contracts, review dispositions and pending-state ledger. No product checkpoint is marked complete.

Planning validation on 2026-09-28: `pnpm run format:check` passed. A read-only comparison against the approved checkpoint definitions verified all 203 IDs in order and 3,243 field values, allowing only the documented command/prose adaptations. Structural checks passed for every ledger predecessor, all eleven scope/green/verification gates, 34 requirements, 22 acceptance criteria, 27 embedded contract sections, internal links, unique anchors, balanced fences and repository portability. The new-file whitespace check produced no diagnostics. These planning checks are not product tests and do not complete an implementation checkpoint. The reusable repository contract validator remains scheduled for S002.

Implementation reports: S001 is independently accepted by Codex, with author report at `implementation/evidence/S001_REPORT.md`, baseline at `implementation/evidence/BASELINE.md`, and review at `implementation/evidence/S001_REVIEW.md`. Formatting, contract preservation, scaffold hashes and reference Rust fmt/check/test passed. Implementation deviations: none. Codex clarified runtime/test-count reporting and recorded the next dispatch. S001 awaits its commit; S002 may begin only after that commit is recorded. Record subsequent evidence with the report/deviation formats and update the ledger from real outcomes.
