# Native dependency reproduction and qualification

Scope: the authentic local Bits 2.20.2-svelte-ui-kit.1 archive and its source/emitter producer. See [compatibility](../reference/compatibility.md) and [testing](testing.md) for consumer/runtime/delivery boundaries. Producer success alone is neither release nor independent acceptance.

## Source and correction

[recipe.json](../../tools/native-dependency/recipe.json) pins Bits 2.20.2 at
`33186c8cc7bb3e0fb8b665063fa29663b606c416` and language-tools 0.7.62 at
`b1ab06379bca7d96f64f4c2063ffc3c28c060148`, their exact toolchain and distinct
local build versions. The emitter tag and source manifest now agree on 0.7.62.
Upstream build-tool constraints remain frozen in its source and producer lock.

Both archives use canonical gzip metadata: operating-system marker 255 and zero
timestamp, with genuine tar content and CRC preserved. This policy was introduced
by the prior 2.19.5-svelte-ui-kit.2 build after its first packaging variant had
platform-dependent gzip metadata; the new 2.20.2-svelte-ui-kit.1 retains the policy.
Historical qualification does not qualify a new archive.

The current package3 CLI requires explicit aliases. Genuine upstream Kit2 sync
runs first with its original configuration. The isolated producer then preserves
that file as `.native-svelte-config.js` and uses the typed
[packaging adapter](../../tools/native-dependency/package.config.ts) to provide
`$lib` explicitly to the public package CLI. Its digest is in provenance. This
adapts build configuration without rewriting component/runtime source. `csstype`
is an explicit distribution dependency for the public declaration imports.

[binding-signature.patch](../../tools/native-dependency/binding-signature.patch) changes the real emitter's
source shim. The normal Svelte `Component` instantiation eagerly checks a
`keyof Props` binding constraint against the large Button and Calendar prop
unions. The correction emits the same function contract structurally: the
original props, Svelte internals, return exports, optional legacy methods,
custom element and exact `z_$$bindings` metadata remain present. It introduces
no constructor or additional bindable prop. Existing upstream annotations and
existing callback types are preserved.

The builder applies this patch only in an owned source copy, builds the actual
emitter, and verifies that the real package tool resolves that built emitter.
It then runs native Kit sync, the actual package3 CLI and publint. Native component sources and runtime
implementation remain unchanged. Installed declarations, reference checkouts
and package stores are never patched.

Readiness and guarded application require the exact raw qualified version,
positive installed provenance and full inventory authentication, and the selected
application's own authenticated archive declaration. Semver-equivalent v-prefixed
or build-metadata versions are refused. Captured proof cannot substitute for live
revalidation after a declaration, archive, runtime or provenance change. Hoisted
and pnpm installs remain supported; a parent application's archive cannot stand
in for the selected application's source. Installed-package tests exercise actual
CLI refusals with authoring-source, network and subprocess access blocked.

## Reproduce

Use Node 24.22.1, pnpm 12.16.1, Git and tar from the repository root:

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
production consumer build are assessed separately. Qualification logs remain in the ignored development artifact boundary. These controls complement the
required full runtime and delivery acceptance; they do not claim exhaustive
type equivalence or independent acceptance.
