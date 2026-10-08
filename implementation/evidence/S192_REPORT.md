# S192 implementation report — real component upgrade cohorts

Author: Codex. Independently accepted on code `abeccabbdfda5aedb7be4f72e3b51a4675d3a609` at evidence `8ab760dc4d674853b172126b2a3ec3a0434c678f`.
Original implementation commit: `6bdf06f4b59b039fd0e1486bc7abb12ea10dc47c`. The candidate narrative below
is historical implementation and verification provenance.
the product repair in this slice.
Implementation commit: `6bdf06f4b59b039fd0e1486bc7abb12ea10dc47c`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S192","kind":"report","commit":"8ab760dc4d674853b172126b2a3ec3a0434c678f","disposition":"implemented"}
-->

## Qualification and implementation

The labeled `tests/fixtures/upgrades/components/revisions.json` defines owned
copies of actual Button, Dialog and Menu source. Its synthetic 1.0.0/1.1.0
labels are test revisions, not claims of shipped historical releases. Incoming
DOM classes, corresponding managed CSS, actual type exports and compound
source barrels change together. Every scenario runs the actual built/copied
CLI against default/custom owned consumers.

The matrix covers safe updates; local source, CSS and root export conflicts;
a customized Menu part with incoming changes elsewhere in its unit; unchanged
upstream Menu with preserved local part/base/version; unrelated customized
Badge; and a changed Spinner export surface expanding to its actual Button
dependent. Genuine conflicts retain the entire application tree and exact
old lock. Safe transitions verify incoming source/base hashes, CSS and exports,
unchanged unrelated lineage, per-target preserved bases and replay purity.
Safe default/custom consumers are actually checked, built and rendered by an
owned production server, including all revised native families/type exports.

## Root-cause repair and causal control

An incoming compound family mixing existing public declarations through its
authored index with a new direct type-file declaration exposed a real generator
defect. The planner previously generated a compound barrel whenever any direct
part declaration existed, replacing the complete authored barrel with only that
direct subset. Both actual consumer checks reported 32 missing Dialog/Menu
exports. The fixture remains as the regression rather than avoiding that shape.

`src/codegen/plan-add.ts` now generates/remaps a compound barrel only when every
declared export is a direct part. Any declaration through the authored barrel
preserves that complete source and exact declared root targets.
`src/codegen/exports.ts` applies the same complete-set predicate to independent
export authority. Existing all-authored shipped families and all-direct
generated families retain their shape. Source/export/final-composition guards
remain active. GENERATED_LAYOUT.md clarifies this source-preserving rule without
weakening original checkpoint definitions or authenticity requirements.

Two owned counterfactual controls restore the old two predicates in copied CLI
output. They must fail real Svelte check for specifically missing DialogRoot
and MenuRoot and fail real production build for missing exports. Production
source and authoring assets are untouched by the controls. These expected
failures are retained alongside the positive check/build/SSR evidence and
exact lock/transcript records; they are not claimed passing consumer builds.

Initial synthetic CSS outside the declared managed block was rejected with
REGISTRY_STYLE_BLOCK_INVALID; corrected revisions stay inside that block.
The export-conflict fixture uses actual named compound-root declarations.
All diagnostic logs remain retained. Only the two planner/authority predicates
change product code; registry assets, dependency versions and reference source
are unchanged. Independent S193 acceptance of this repair remains required.

The earlier narrow forceMount repair acceptance is recorded truthfully against
reviewed code `1285154671e05e41f7d78feb1786042a523601c0` and plain evidence
anchor `dfeb9b3d787b26e7cbd42dc5a8ccd5099ffae0b8`; it grants no original
checkpoint or full-sequence acceptance.

## Verification

Validation uses extbuild after green doctor/current guard; measured Node
24.21.0, pnpm 11.22.0, Svelte 5.57.1/Bits 2.19.3 and macOS arm64.

- `pnpm run build` passed after the product fix.
- `node tools/run-unit-tests.mjs --suite unit`: 298/298 passed, zero skips (`logs/s192-unit.log`).
- `node tools/run-unit-tests.mjs --suite integration` with component-upgrades, lock-projection, compound-exports, root-exports, compose-authority, review17-authority, semantic-authority, source-plan and source-targets: 85/85 passed, zero skips, including 18 owning upgrade/control cases (`logs/s192-integration-final.log`). Actual revision/lock/CLI/check/build/SSR records are retained in `logs/component-upgrades/`.
- Final `pnpm run fixture:check` found zero errors/warnings; `pnpm run fixture:build`, `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts` and diff/staged review passed before the candidate commit; contracts reported zero errors/warnings.

No public wrapper/CSS/dependency change requires a new runtime behavior matrix;
the repair's owning real-consumer builds/SSR and independent S193 full review
remain distinct. Cargo guards N/A: no Rust changes. Existing pinned declaration
exceptions/native boundaries remain explicit final AC20 obligations. Unrelated
changes and repository boundaries are preserved. Only a verified green candidate
enables S193; mandatory separate S193 acceptance gates S194.
