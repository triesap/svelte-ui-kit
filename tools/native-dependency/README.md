# Native declaration producer

This directory contains portable producer inputs for the approved R11-F02
fallback and the selected local Bits `2.19.5-svelte-ui-kit.2` baseline.
Producer qualification does not grant release or independent acceptance.
The [governing plan](../../implementation/COMMIT_SEQUENCE.md#r11-f02--resolve-qualify-and-adopt-a-strict-green-native-baseline)
requires authentic packaged delivery and actual component/consumer/runtime
qualification as well.

## Source and correction

[recipe.json](recipe.json) pins the public Bits and language-tools Git revisions,
the producer toolchain and distinct build versions. The language-tools release
tag is `svelte2tsx-0.7.34`; its source manifest still says `0.7.25`. Provenance
records both facts instead of claiming the source manifest was already stamped
with the release version.

Both emitter and native archives use canonical gzip metadata: the operating
system marker is 255 (unspecified), the timestamp remains zero and authentic
tar content and CRC are preserved. The initial build `.1` differed between
macOS and Linux at the gzip OS byte and failed the frozen emitter integrity
check on Linux. Build `.2` records this packaging policy in the recipe and
uses newly qualified archive/provenance and frozen lock digests. Native runtime
source and the declaration correction are unchanged; historical `.1` evidence
does not certify this replacement.

[binding-signature.patch](binding-signature.patch) changes the real emitter's
source shim. The normal Svelte `Component` instantiation eagerly checks a
`keyof Props` binding constraint against the large Button and Calendar prop
unions. The correction emits the same function contract structurally: the
original props, Svelte internals, return exports, optional legacy methods,
custom element and exact `z_$$bindings` metadata remain present. It introduces
no constructor or additional bindable prop. Existing upstream annotations and
existing callback types are preserved.

The builder applies this patch only in an owned source copy, builds the actual
emitter, and verifies that the real package tool resolves that built emitter.
It then runs Bits' real `package` script. Native component sources and runtime
implementation remain unchanged. Installed declarations, reference checkouts
and package stores are never patched.

## Reproduce

Use Node 24.21.0, pnpm 11.22.0, Git and tar from the repository root:

```sh
node tools/build-native-dependency.mjs --output .native-build/reproduction
node --test tools/build-native-dependency.test.mjs
```

The output directory must be absent, with safe non-symlink ancestry. The builder
fetches the pinned public revisions into disposable trees and uses the two
checked-in frozen producer lockfiles. Optional `--native-source` and
`--emitter-source` arguments read matching clean Git checkouts through Git
archives; they never copy uncommitted files or modify those checkouts.
`--report` records bounded command outcomes. All temporary producer trees are
removed after success or failure. Output contains the authentic Bits tarball
and provenance with source, patch, recipe, actual producer-lock and emitter
archive digests, exact toolchain and final archive SHA-256.

The tarball retains the Bits package name, public exports, runtime requirements,
peer ranges and upstream README/license. It additionally carries the emitter
license and `NATIVE_PROVENANCE.json`. Producer-only scripts/dependencies are
removed from the distribution manifest so that local emitter transport is not
a consumer dependency. Generated artifacts are not committed.

`--record-locks` deliberately refreshes producer inputs and requires a new
qualification; ordinary builds always use frozen locks. `--baseline` is an
unpatched causal control, explicitly labeled in its provenance. It uses the
same sources/toolchain and changes only its owned native lock integrity to
install the unpatched emitter. Such a control is never a deliverable candidate.

The real producer regression builds two corrected archives independently,
compares their bytes, and builds the unpatched control. It compares every
runtime/non-component declaration file, checks native notices/metadata and
tests public type contracts with positive and authored negative controls.
Strict installation, raw checking/compiler exits, actual Svelte bindings and a
production consumer build are assessed separately. Qualification logs remain
under the ignored evidence log directory. These controls complement the
required full runtime and delivery acceptance; they do not claim exhaustive
type equivalence or independent acceptance.
