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
- Pi (the implementation agent) authors implementation and corrections and
  self-reviews within the dispatched checkpoint. Codex owns scope,
  contract/API decisions, dependency-selection approval, deviations,
  acceptance, checkpoint commits and dispatch between coding periods.
- Complete one checkpoint at a time in the documented order. The owner's
  current `pfc through RCLD-02` authorization delegates green implementation
  commits for S013–S032 to Pi, with independent Codex review after the sequence.
  RCLD-01/S001–S012 are independently accepted. Follow the current
  "Codex dispatch — complete RCLD-02 models and registry resolution" section,
  including its current "Independent review 4 — validate one complete lock ownership set".
  Complete both RCLD02-R4 groups and remaining original criteria; preserve
  closed findings and verified progress before returning for acceptance;
  S033 remains gated. The bounded batch authorization is already active.
  Follow the governing batch dispatch and its pending-review evidence rules;
  never label Pi self-review as Codex acceptance. Outside that explicit batch,
  return work unstaged/uncommitted and await predecessor acceptance/commit.
- Report new consequential decisions to Codex with evidence and bounded
  alternatives. Do not silently broaden, weaken, omit or defer requirements.
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
