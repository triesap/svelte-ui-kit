# Scope, assumptions, and decision authority

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

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

A repository-proven obsolete/unsafe plan step needs a deviation record before execution changes. A new product requirement needs a durable spec amendment; planning notes cannot approve it. Do not repeatedly request already supplied choices, and do not treat genuine technical uncertainty as permission to invent APIs. Ordinary technical discovery inside the dispatched checkpoint is the implementing agent's responsibility; consequential scope, contract/API and dependency-selection decisions return to Codex.

#### Checkpoint completion and review authority

Pi authors implementation and corrections and self-reviews within the dispatched
checkpoint; Codex independently verifies, accepts and commits. A checkpoint
reported by Pi stays `in_progress` until Codex assigns `verified_uncommitted`
and then `complete`. Completion evidence uses one structured
`checkpoint-evidence` record in `implementation/evidence/<ID>_REPORT.md` and
`<ID>_REVIEW.md`, always with schema version 1 and exactly
`schemaVersion`, `checkpoint`, `kind`, `commit`, `disposition`. The lifecycle is
fixed: before acceptance the records are optional with report `candidate`,
review `changes_requested` and a null commit; `verified_uncommitted` requires
both records with report `implemented`, review `accepted` and a null commit;
and `complete` requires both records with matching full lowercase 40-digit
hashes that resolve in the real repository, are reachable from HEAD and contain
both evidence paths. Malformed, non-object, duplicate and unterminated live
records are rejected in every state; an absent optional record is not
malformed. `steps[].completion`
stays null until `complete`, and only committed completion unlocks a successor.
An `not_applicable` status fails closed unless a separately approved,
evidence-backed deviation exists; none does at S002. Pi must never manufacture
review acceptance or a commit hash.
