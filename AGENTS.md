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
  `pfc all`: first finish original S064–S077/R2 work and obtain independent S077
  acceptance, then continue the original S078–S203 sequence through its gates.
  Earlier Q3-only/two-or-three-commit/Q4-later management limits are superseded.
  Continue after green slices and successful independent gates. Preserve accepted
  checkpoints and original criteria/statuses. Target-only coherent green commits
  are authorized within this scope; no parent/remote or reference-source changes.
- The separate reviewer accepted original S064–S077 on code `ce54d7d`, with
  committed review evidence at `fd1d0938d9ad188c5646c153b76fa2989438c727`.
  After the atomic completion transition, S078–S091/RCLD-05 is the current
  implementation range under `pfc all`; separate S091 acceptance gates S092.
  Earlier RCLD-04 finding paragraphs below are historical and resolved by
  `implementation/evidence/RCLD-04_QUALIFICATION.md`. No new owner dispatch is
  required. Full MVP and later platform/package/AC20 acceptance remain open.
- The current return review at `6f2d877` preserves real import/render AST parsing,
  aliased children, post-composition export checks and consumer controls.
  Complete original independent export/cohort provenance, full source binding
  and reachable scoped child rendering. Planned output must not certify itself;
  unchanged content needs original relationship authority, not a blanket baseline
  byte-equality fallback. Preserve legitimate customization under frozen policies,
  qualify the complete lifecycle and finish remaining RCLD-04 evidence together.
  Test-name inventories and author completion claims do not grant acceptance.
- Report new consequential decisions to Codex with evidence and bounded
  alternatives. Do not silently broaden, weaken, omit or defer requirements.
- Latest independent review at `a176387` preserves the R9 source-binding and
  equivalent-customization repairs, but mutable export-authority substitution
  still publishes a dropped barrel. Object-destructured each bindings and each
  indices also bypass child shadowing proof, publishing layouts that omit the
  child or throw on rendering. Complete authenticated immutable authority and
  lexical render proof under the original criteria before S077 acceptance.
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
