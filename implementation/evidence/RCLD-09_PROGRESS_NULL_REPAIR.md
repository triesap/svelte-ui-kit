# RCLD-09 initial-null Progress repair candidate

Author: Codex. Mandatory separate repair acceptance pending.
Starting `8b82389851c6f1cef03c679967c5da54e8207d87` after the contract fixture repair.
Original S172 implementation remains `3a69123effc6b8d9b4640b72cec6f11ee01f114d`.

The separate reviewer verified that actual installed `<Progress value={null}/>`
throws during initial hydration and a fresh client-only mount. Pinned generic
set_attributes sees first VALUE:null with undefined previous attributes, reads
an input defaultValue property absent on native progress, and writes undefined
through progress.value. Its nonfinite WebIDL setter throws before the cleanup
effect. Hydration fails/empties content; fresh conditional mount fails. Existing
full601 browser cases, including14 owning Progress cases, passed but missed this
initial explicit-null state. This is an S170–S172/AC17 defect, not a waived API.

Normalize both nullish API values to undefined for initial absent VALUE markup;
keep numeric String serialization and the existing dynamic removal effect. Null
and undefined retain native indeterminate omission, while numeric zero/bounds/
nonfinite attribute parsing remain browser-owned. Preserve actual types, refs,
caller attrs/events, all source CSS/paint, and default/null max semantics. Record
Progress item0.1.2 and refreshed registry content identity for the source repair.
The existing worksheet's approved null/omission contract stays unchanged; this
report supplies the newly measured initial lifecycle boundary and correction.

Extend the owning real CLI consumer route with initial null/undefined/null-max
queries and an initially absent conditional source. Four new browser cases
(two per layout) first fail on the unchanged0.1.1 source with real page exceptions
and missing hydration/mount state; preserve raw failure logs/artifacts. The same
detectors then pass with0.1.2: six initial SSR-to-hydration matrices preserve
attribute absence, position-1, native max100/1, naming and actual refs against an
independent native progress; initially absent SSR stays absent, and eighteen
fresh client mount/remount cycles preserve native indeterminate state and ref
cleanup. Strict lifecycle collectors remain enforced without exceptions.

Author verification through the configured build router:

- Owning browser18/18, no failures/skips/TODOs; includes prior dynamic12-state,
  numeric setter controls, real painted theme samples and isolated SSR cases.
- Actual installed Progress3/3, complete registry58/58 and package3/3: exit0.
- Actual native types20 plus immutable CSS/paint/hidden3, total23/23: exit0.
- Maintained fixture check/build, typecheck, lint, format and contracts: exit0.
- Source/staged diff and whitespace review pass; Cargo N/A, no Rust affected.

Changed source/version/content identity, owning query fixture/browser regression
and this report. Original definitions, source reference, unrelated work and
previous accepted boundaries stay intact. Native paint/animation/ARIA and CSP
limits are preserved. These are author checks, not independent repair acceptance;
the reviewer must rerun its initial-null reproducer and owning/cumulative checks
on the actual green repair commit. S182 remains gated; all33 current checkpoints
are candidates until complete separately anchored S181 acceptance.
No push/publication/deployment or reference-source mutation.
