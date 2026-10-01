# Ownership and synchronization

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

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

#### Frozen disposition matrix (S043, closes Q08)

This table is the frozen, data-driven policy implemented by
`src/codegen/ownership-policy.ts` and `tests/fixtures/ownership-cases.json`.
Evaluate it in this exact order:

1. **Untracked, absent local:** a new absent target with incoming content is a
   planned `create`; with no incoming content it is `no_change`. Untracked
   absence is not a baseline.
2. **Untracked, existing local:** always `untracked_conflict`, even when the
   local bytes equal incoming. Untracked content is application-owned and
   confers no silent adoption or deletion rights.
3. **Tracked, missing local:** always a visible `conflict`. Absence never
   becomes a baseline; there is no silent restoration and no partial batch.
4. **Tracked, L = I:** `no_change`, including when the recorded base is
   missing. This precedence is evaluated before any conflict classification.
5. **Tracked, L = B:** safe incoming `update`.
6. **Tracked, I = B:** `customized`; preserve the local edit and its legitimate
   base.
7. **Tracked, otherwise:** `conflict`.

A conflict in any source, managed CSS block or integration record prevents the
entire batch, including config and lock updates. Report every deterministic
conflict cause rather than only the first.

#### Missing targets and removal

Absence is not a hash. The review did not fully define whether deletion of a tracked file is intentional. At its contract step choose a conservative, visible behavior: report the missing target and planned restoration or conflict explicitly; never silently adopt absence as an upstream baseline. The source tool restores missing tracked files, but target policy must be documented.

Configuration removals recalculate the closure from explicit requests. Assets still required transitively remain. Clean obsolete generated assets may be retired in the planned transaction after safety checks. Customized or untracked assets are retained with diagnostics; do not delete them. Remove ownership only through a truthful transition; subsequent commands must not silently reacquire a retained file.

A customized retired CSS block requires an explicit disposition (retain as application-owned text rather than continuing to claim current generated ownership). Likewise preserve unrelated exports and warn about application imports left behind. Do not promise arbitrary import rewriting or safe deletion based only on the registry graph.

#### Compatibility cohorts

Source shape, exported parts, CSS selectors, and dependent component APIs can be coupled. Treat a component's source files, managed block, and relevant exports as a compatibility unit. A conflict in one member must not leave the others newly installed while claiming the unit is updated. The default initial policy is to stop the write batch on a genuine conflict.

A local customization with unchanged upstream is not itself a conflict; however, if another member of its compatibility unit changes and compatibility cannot be established, preserve the whole unit or report a cohort conflict. Document the exact conservative rule and fixtures rather than guessing semantic compatibility from text hashes. Dependencies may require widening a cohort when exported APIs change; not every unrelated component belongs to one permanent giant cohort.

##### Frozen cohort rule (S059, Q09)

The component (item id) is the compatibility unit. Its source files, managed CSS
blocks and public export declarations are coupled members.

- A unit whose members are all already satisfied (`no_change`) is clean.
- A unit may adopt incoming content (`create`/`update`) while every other member
  is also adopting or already satisfied.
- If a unit mixes an adoption with a locally `customized` member, or with a
  `conflict`/`untracked_conflict` member, compatibility cannot be established by
  text hashes: the whole unit is blocked and reported as a cohort conflict. A
  standalone customization with unchanged upstream is not itself a conflict.
- A changed public export surface widens the unit to its transitive dependents
  (via the registry dependency edges) so a dependent unit is subject to the same
  rule. Unrelated, unchanged units are never merged into one permanent cohort.

`src/codegen/cohorts.ts` implements this table; `tests/unit/cohorts.test.ts`
holds the frozen examples.

#### Planning and lock truth

Resolve all requested items, read all current managed targets, calculate CSS/barrel/layout changes and dependency status, and detect every relevant conflict before applying any writes. A source conflict must not leave kit.json updated independently. Staging begins only after a safe complete plan exists.

The final lock identifies actual effective lineage, not merely the incoming registry's newest item version. Preserve base hashes when retaining customization. A no-content-write lineage update must still be planned and transactionally published if metadata really changes. Repeated add/sync after a satisfied state must have no semantic changes.

#### CSS and exports

Parse markers, validate unique owners, perform block-level comparison, preserve unmanaged text, and deterministic order. Reject malformed marker structure. Source formatting changes count as local edits unless a separately approved canonicalization policy says otherwise. Do not reformat whole stylesheets/barrels to simplify updates.

Use managed export regions and AST-aware conflict detection for colliding application declarations. Preserve unrelated aliases/imports/comments. Registry export declarations are the source of generated public exports; do not guess PascalCase names from arbitrary filenames.

#### Conflict resolution workflow

`sync --dry-run` reports old/local/incoming identifiers, affected logical paths, and why the batch cannot apply. `view <item> --source` supplies incoming source for inspection. The developer explicitly reconciles or moves conflicting material, then reruns the dry run and verification. No automatic text merge, force overwrite, or synthetic “accepted” hash updates are part of v1.

Hashes are enough for detection, not a three-way text merge. Base-byte retention can be a later feature only with a separate storage/migration/security contract. Transaction recovery backups do not imply a merge-history feature.
