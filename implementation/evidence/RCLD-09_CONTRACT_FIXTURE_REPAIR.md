# RCLD-09 isolated catalog fixture repair candidate

Author: Codex. Mandatory separate reassessment pending; no acceptance claim.
Starting frozen candidate `73ca2457fb5dcaadc452d4a0ce1b7b9313df03a4`.
Original S181 implementation remains `b55522dca4f48815fc10053f49cd475e47dad06f`.

The separate reviewer ran the full151-case contract regression suite and found
131 failures: valid owned fixtures lacked the new catalog provenance target and
23 component worksheets, producing24 BROKEN_LINK diagnostics before intended
scenario assertions. Actual checkout contracts passed, but that did not qualify
the isolated cumulative suite. Acceptance is withheld until this repair passes
fresh independent review; the original S182 dependency gate stays intact.

Add only the exact catalog-source JSON,23 worksheets and their linked MIT license
to the fixture's explicit input allowlist. Preserve fixture-owned ledger states,
synthetic Git history, bounded cleanup and exclusion of checkout Git/dependency/
build output. Do not bypass local links, remove provenance or change authority.
The first focused rerun identified the worksheets' previously unneeded license
link; its exact input is included rather than dropping attribution.

A causal isolated fixture test compares copied provenance/worksheet/license bytes
with their named inputs, validates successfully without mutation, removes only
its owned catalog-source/progress worksheet and requires the precise broken-link
failures with the remaining tree unchanged. Existing fixture isolation, valid
adopted documents, read-only broken-link validation, strict RCLD-09 scope and
pending predecessor rejection are rerun together.

Author focused contract selection passes7/7 with zero failures/skips/TODOs.
Lint, formatting and actual checkout contracts pass; source/staged whitespace
review passes. No new full author152-case pass is claimed; the separate
reviewer will rerun the entire cumulative suite and assess the exact repair on
its real green commit. Product/registry/style/type sources and all203 original
definitions remain unchanged. Cargo N/A; no Rust affected.
No reference or unrelated changes, push/publication/deployment or self-acceptance.
