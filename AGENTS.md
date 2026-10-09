# Agent instructions — svelte-ui-kit

This repository is the standalone public `svelte-ui-kit` package. It implements
the specification identified as `svelte_ui_kit_v1`. All content in this
repository is repository-relative and self-contained; do not introduce
operator-machine paths, credentials, runtime state or external coordination
references.

## Authority and execution boundary

- The governing execution/status authority is
  `implementation/COMMIT_SEQUENCE.md`. The adopted `specs/`, `decisions/`,
  `implementation/` and `references/` documents govern product intent.
  `implementation/COMMIT_SEQUENCE.json` is a derived projection; never edit it
  independently of its Markdown source.
- The owner transferred implementation responsibility from Pi to Codex on
  2026-10-07. Codex now owns implementation and corrections as well as scope,
  contract/API decisions, dependency approval, deviations and coordination.
  Preserve required independent review: implementation self-review is not
  independent acceptance. Historical Pi dispatches/reports remain provenance.
  The owner activated `pfc all` on 2026-10-07 for all remaining original S064–S203
  work, with a separate reviewer at mandatory independent acceptance gates.
- Complete one checkpoint at a time in documented order. Current dispatch is
  `pfc all`: continue the original sequence through its independent gates.
  S001–S193 are independently accepted; S194–S202 are committed candidates.
  S201 full cumulative qualification passes at the repaired native candidate;
  S202 records the exact extension specification boundary. S203 freezes delivery
  and requires separate acceptance of the entire final sequence and repairs.
  The ledger is live authority.
  Earlier Q3-only/two-or-three-commit/Q4-later management limits are superseded.
  Continue after green slices and successful independent gates. Preserve accepted
  checkpoints and original criteria/statuses. Target-only coherent green commits
  are authorized within this scope; no parent/remote or reference-source changes.
- The separate reviewer accepted original S064–S077 on code `ce54d7d`, with
  committed review evidence at `fd1d0938d9ad188c5646c153b76fa2989438c727`.
  The separate reviewer accepted S078–S091 on `dbd5490`, with evidence at
  `c6aaf147dbf6316a96420fd5136a717f3665f711`. After the atomic transition,
  S092–S115/RCLD-06 is accepted on `5c235ee`, with independent review evidence at
  `6e087c10b441712d82c70230c3db7f8490ea787f`. S116–S128/RCLD-07 is accepted on `21c72d21fd78a34f12099b94b0d4fddff779d911`, with independent
  evidence at `f9dc56f1921024c426b8df59c0c08abb28e2af7c`. S129–S148/RCLD-08 is accepted on `aec5711b9d3368b1cc1f0416bca7f2f0ce5aa0a5`, with independent
  evidence at `bd2613c050c37cd883d4e2155a6eb264ce66c484`. S149–S181/RCLD-09 is accepted on `a79db79f78818797e2b3d541731797b5b19b60ce`, with independent
  evidence at `871c1945daf660d9f0f724fb949057b4fa3a1da6`. S182–S193/RCLD-10 is accepted on `abeccabbdfda5aedb7be4f72e3b51a4675d3a609`, with independent
  evidence at `8ab760dc4d674853b172126b2a3ec3a0434c678f`. S194–S203/RCLD-11 is current
  under `pfc all`; final separate S203 acceptance remains mandatory.
  Earlier RCLD-04 finding paragraphs below are historical and resolved by
  `implementation/evidence/RCLD-04_QUALIFICATION.md`. No new owner dispatch is
  required. Current local full platform/package/strict qualification passes;
  final MVP/AC20 acceptance remains with the separate reviewer.
- Preserve authenticated immutable export/cohort authority, actual import/render
  AST parsing, lexical child-render proof and equivalent-customization controls.
  Planned output must not certify itself. Earlier RCLD-04 return findings are
  resolved by its independent qualification; their reports remain provenance.
  Test inventories and author completion claims do not grant acceptance.
- Report new consequential decisions to Codex with evidence and bounded
  alternatives. Do not silently broaden, weaken, omit or defer requirements.
- Final release AC20 and separate acceptance remain open. R11-F02 adopts the
  authenticated local Bits 2.19.5-svelte-ui-kit.2 producer baseline; the
  maintained fixture requires raw strict zero errors/warnings. Historical
  upstream TS2590 failures and the former qualified exception remain evidence,
  not current qualification. The owner-approved 2026-10-08 completion
  amendment in `implementation/COMMIT_SEQUENCE.md` governs R11-F01–R11-F06
  before S201 completes. It permits a narrowly qualified source-level native
  fix in an isolated copy if supported releases cannot pass, with authentic
  generated declarations and reproducible local artifact delivery. Do not
  suppress errors, patch installed declarations/package stores, hide imports,
  change reference sources or silently change pins. Preserve every original
  criterion. Full acceptance-suite CI is required by that amendment; configured
  remote jobs are not execution evidence. Planning is not repair acceptance.
- No commit, push, publication, deployment or reference-repository mutation
  occurs without explicit authorization for that action.

## Product

Implement `svelte_ui_kit_v1` from `specs/`. Product/package/executable is
`svelte-ui-kit`. One TypeScript CLI with bundled registry assets. Generated
Svelte/TS/plain CSS belongs to the application. Bits UI owns behavioral
primitives; simple native elements remain appropriate. No styled kit runtime
dependency, Tailwind, CSS-in-JS, shadcn/React compatibility, remote registry,
auto-install, auto-merge or extra unscoped APIs.

## Architecture

Keep `src/cli`, `src/project`, `src/registry` and `src/codegen` separated.
CLI modules own arguments/envelopes/orchestration; project modules capture
environment/config/paths/dependencies; registry modules authenticate bundled
assets and resolve closure; codegen modules plan/compose/validate/apply/recover.
Authored templates/assets live under `registry`, schemas under the versioned
`schema` directory. Planner is read-only; application happens through guarded
recoverable transactions. Lock metadata is final publication. Consumer wrappers
never import CLI/Node/registry internals.

Generated defaults: `src/lib/components/ui`, its `_kit`, and
`src/styles/kit.css`. Preserve hybrid simple/compound files, PascalCase exports,
kebab-case items/files, camelCase props, `.kit-*`, `--kit-*`, and
tool-namespaced CSS markers/layers. Use direct sibling imports inside templates.
Preserve unmanaged source/CSS/layout regions.

## Ownership

Keep explicit requests separate from dependencies. Preserve local
customizations with base/local/incoming comparison. Stop genuine conflicting
batches. Keep component source/style/export cohorts compatible. Never delete
customized retired assets or falsify base hashes to hide edits. Doctor
distinguishes customization from breakage. Dry runs create no files, including
hidden transaction state.

## Components

Use actual pinned native/Bits types. Preserve bindings, refs, snippets,
discriminated unions and event ordering/cancellation. Do not accept-and-drop
rendering hooks. Keep SSR/hydration and request identity safe. Test
keyboard/form/focus/disabled/reset and theme/portal behavior. Separate Alert
Dialog semantics. Pure CSS is not a promise of zero runtime inline positioning
styles.

## Workflow

Read `implementation/COMMIT_SEQUENCE.md` and run one step/commit at a time. Spec
first; write tests with changes; verify continuously; self-review staged diffs.
No skipping/merging/reordering/broadening without repository proof of
obsolete/unsafe scope and a deviation record. No unrelated cleanup, destructive
Git operations, remote push or npm publish unless explicitly instructed.

Discover actual commands and commit convention before coding. Reference fallback
is `area: imperative summary`. Follow `implementation/VERIFICATION.md`,
including conditional Cargo guards for any present/affected Rust workspace. Do
not create Rust code to satisfy a generic checklist.

Use the [current command map](implementation/evidence/COMMANDS.md) and
[requirement evidence](implementation/TRACEABILITY.md). Focused typed suites use
`node tools/run-unit-tests.mjs --suite <suite> <test-file>` after the actual CLI
build when needed. Do not insert a literal `--` into runner arguments or overlap
shared fixture/compiler/package writers. Browser tests own their production
servers and enforce unexpected console/page/hydration failures.
Generated application sources import their own sibling files and supported
native/Bits APIs; test helpers and CLI internals are never consumer runtime APIs.
Transactions are qualified on macOS/Linux under the trusted-local threat model;
Windows remains unsupported and remote CI configuration is not execution evidence.
Follow the [recovery runbook](implementation/OPERATIONS_RUNBOOK.md), including
verified external backups and owner quarantine. A no-change replay does not
prove recovery occurred. Unspecified extension APIs remain behind their gate.

After every step report exact files, commands/results, commit hash, unverified
issues, deviations and next-step safety. New relevant failures block progress;
evidence-backed pre-existing exceptions remain explicit and do not waive final
done criteria. Never disable tests, weaken types, suppress accessibility
failures, or turn off SSR to pass.

## Contract and repository validation

- `pnpm run check:contracts` validates the adopted documents, local links and
  anchors, the fixed S001–S203 and RCLD-01–RCLD-11 identities, sequence gates,
  requirement/acceptance coverage, structured checkpoint completion evidence
  (resolved against the real Git history), the live owner-authorized batch
  record and its strict `committed_pending_review` pending-review evidence, and
  Markdown/JSON agreement without writing.
- `pnpm run test:contracts` runs the focused `node:test` regression suite for
  that validator.
- Regenerate projections explicitly with
  `node tools/check-contracts.mjs --generate` (checkpoint projection) and
  `node tools/check-contracts.mjs --generate-sources` (source inventory). The
  default validation path is read-only.

## Documentation

Keep enduring intent in `specs/`; execution/status in `implementation/`;
rationale in `decisions/`. Root README/CONTRIBUTING/AGENTS carry public
developer guidance. Do not create an unnecessary docs tree or coordination
database. Code, registry, schema, examples and tests move together when
contracts change. Extension work needs its own specified API/sequence gate.
