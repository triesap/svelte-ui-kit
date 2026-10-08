# Public API and CLI contracts

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

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

Frozen v1 protocol: the envelope is `{ schemaVersion, command, status, diagnostics, changes, data }` with `schemaVersion` equal to the independent protocol version; diagnostics carry `code`, `level` (info/warn/error), `message`, an optional safe logical `locator` and `guidance`; changes carry `action` (create/update/retire), a logical `path` and `applied`. The frozen exit map is 0 for success/planned/no_change/non-strict warning, 1 ordinary error, 2 usage/unsupported, 3 strict-doctor broken/unsafe, 10 conflict, 11 unsafe path and 12 registry failure, with the most specific causal class winning deterministically.

Command schema version is independent from Svelte and package versions. Output is deterministic for equivalent logical inputs; avoid timestamps, random transaction identifiers, absolute sensitive paths, or filesystem iteration order in semantic output unless explicitly necessary and documented.

#### Approved unchanged-command safety contract — 2026-10-08

Before reporting `no_change`, init/add/sync inspect the approved mapping's
coordination and recovery state without project writes, including unchanged
dry-run paths. Only absent writer evidence and no retained transaction state
permit clean exit-0 `no_change`. Safe logical diagnostics and exactly one JSON
envelope remain mandatory. Physical safety precedes coordination, then journal
failure/pending state; existing argument, registry and configuration failure
precedence is preserved.

Present valid writer coordination produces `error` / `WRITER_BUSY` / exit 1.
Ambiguous or unreadable coordination produces `error` /
`WRITER_LOCK_UNAVAILABLE` / exit 1. Corrupt/foreign/ambiguous journal state uses
existing causal recovery diagnostics. Otherwise retained transactions, including
valid committed cleanup, produce `error` / `RECOVERY_PENDING` / exit 1 with
actionable evidence-preserving guidance. Existing more specific unsafe-path and
registry exit classes remain unchanged. `RECOVERY_PENDING` is a new stable
diagnostic code in the existing envelope, not a new command/schema/status.

This inspection grants no takeover, cleanup or proof of writer acquisition.
It does not modify state or manufacture a write. Genuine writes retain guarded
recovery and preimage revalidation; doctor/info/view and all dry runs remain
nonmutating. Normal clean replay retains its existing result. This is the
approved target contract; implementation/qualification remains R11-F03 in
[the governing plan](../implementation/COMMIT_SEQUENCE.md).

#### Dependency planning

Report direct package requirements, runtime versus tooling roles, relevant peer requirements, installed/declaration status, incompatible ranges, and an appropriate command for the detected package manager. Do not silently edit `package.json`/lockfiles, execute npm/pnpm/yarn, fetch mutable remote templates, or pretend missing peer dependencies are optional.

The initial Bits UI source observation was 2.19.3 with Svelte `^5.33.0`, a date peer `^3.8.1`, and Node `>=20` in that source manifest. This is historical evidence, not a validated distribution baseline. Before implementation choose installed, reproducible versions that pass fixtures and record actual peer metadata. Do not automatically adopt a newer major version.

The owner-approved native source-fix fallback requires truthful dependency
instructions for a real locally bundled archive with a distinct build identity,
authenticated provenance and upstream notices. Operator setup explicitly copies
the archive to an application-owned location and installs it as a local-file
Bits dependency. Do not render a registry-install command for an unpublished
version. No automatic package installation/manifest mutation or consumer kit
runtime is introduced. The resulting app must work without its CLI host or
authoring source. Prefer an unmodified supported released dependency when one
passes; no fallback artifact is selected merely by this contract amendment.

#### Component interface rules

Use Svelte 5 typed props and deliberate binding through wrappers. `open`, `checked`, `value`, and DOM `ref` are not made two-way merely by spreading props. Derive primitive props from the pinned Bits UI definitions; preserve union discrimination. Use native Svelte element types for native components. Do not replace a real prop contract with `any` or a generic attribute dictionary.

Own design classes without erasing caller classes. Use the existing variant vocabulary where defined: `ButtonVariant` primary/secondary/ghost and `ButtonSize` sm/md/lg. Default a native Button to `type="button"`; preserve disabled/loading/busy/label behavior and native submit/reset opt-in. Do not turn Anchor into a role-button or Button into an automatically polymorphic link.

For composed parts, support upstream `child`/`children` deliberately. A wrapper that owns internal markup, such as the proposed Switch with its Thumb, should exclude those customization hooks rather than accept and drop them. Floating delegated content must retain outer positioning `wrapperProps` and inner content `props` structure. Merge custom handlers only with an explicit ordering/cancellation policy; a spread is not a merge.

Dialog is an exposed compound family. Portal/overlay are explicit parts; preserve custom portal targets and document composition. Do not introduce an ambiguous `portalTo` convenience alias unless the API worksheet justifies it; the earlier name was illustrative camelCase, not a frozen prop signature. Use pinned primitive names for forwarded configuration where possible.

Alert Dialog gets a separate primitive-backed family, preserving accessible naming, focus and dismissal semantics. It is not Dialog with a role property. Native semantic content remains the default for tables/document structure.

#### API freezing procedure

Before each component family, document its source counterpart, exact pinned Bits/native types, exported names, binding/ref/snippet policy, forwarded attributes, classes/state selectors, native form behavior, accessibility expectations, dependencies, and source/CSS coupling. Add positive and negative type fixtures. Only then add wrappers. Undocumented upstream subcomponents or advanced variants are not automatically product scope.
