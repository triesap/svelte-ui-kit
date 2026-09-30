# Data models and persistence contracts

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

This file fixes semantic responsibilities. Exact JSON spelling not already approved is a scheduled schema-design choice; there are intentionally no fabricated production `$schema` URLs or prevalidated example lockfiles in this specification.

#### Version axes

Track configuration/lock schema, CLI package, registry release/content digest, individual item/template versions, Svelte/Bits compatibility ranges, and token/customization contracts independently. A framework bump is not automatically a schema migration. Item version/digest identifies incoming content; baseline content must not be relabeled as updated when preserved due to customization/conflict.

Initial technical identities (recorded at S013, not user-provided constants):
local schema, protocol and CSS-contract revisions start at the positive integer
`1`; the tool/package release, the empty bundled registry release and an item
version start at strict SemVer `0.1.0`; the advertised compatibility range is
restricted to the qualified Svelte `^5.57.1` / Bits UI `^2.19.3` baseline with
Bits UI's real `@internationalized/date` `^3.8.1` peer. Content identity is an
exact-byte lowercase `sha256` 64-hex digest, named distinctly from a semantic
hash.

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
