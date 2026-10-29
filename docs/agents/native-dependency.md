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

Every installed verification still hashes the complete current distribution.
One inventory traversal replaces repeated full ancestor walks for each file;
descriptor reads refuse links, and closing checks bind every visited directory,
root, enclosing ancestry and selected alias. Retained directory receipts catch
changes introduced by a later sibling read. No successful authentication is
cached between mutation boundaries, and the archive/provenance/manifest and late
physical or byte checks remain live at their existing boundaries.

## Reproduce

Normal authoring bootstrap uses the typed aggregate:

```sh
node tools/prepare-native-artifacts.ts --fixture
pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict
pnpm run build
```

It authenticates both qualified archives before fixture or bundle delivery,
checks both compiled baselines when bundling and permits exactly the two archive
members in `dist/native`. Matching existing files retain their bytes, identity
and mode; foreign, linked or mismatched inputs refuse. The Svelte producer's
`report.json` remains regular diagnostic data in its source cache and is never
delivery authority or a bundled member. Shared preparation I/O keeps the legacy
synchronous Bits-only preparer available for focused controls. Copying archives
into fixture caches does not select them as installed dependencies; normal
corrected-Svelte capture, enforcement and consumer adoption require their own
integration qualification. The CLI's compiler dependency and public peer ranges
remain ordinary upstream SemVer declarations.

Existing fixture and bundle targets and their ancestry are preflighted as one
delivery set before creating delivery directories or files. A missing early
archive cannot be copied ahead of a known corrupt or linked later destination.
This is a static-state preservation check, not a cross-directory transaction:
storage faults after preflight can leave a subset, and subsequent preparation
authenticates existing bytes before completing delivery or refusing a mismatch.

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

## Svelte reset-runtime producer

[The runtime producer](../../tools/build-svelte-runtime.ts) authenticates the
official Svelte 5.57.3 npm archive against the immutable SHA-256 and SHA-512 in
[its typed recipe](../../tools/native-runtime/recipe.ts). The
[source patch](../../tools/native-runtime/reset-dispatch.patch) applies only in
an owned extraction. It waits for native reset dispatch to finish before reading
current DOM values, includes controls replaced during dispatch and moved original
controls, and makes destroyed binding callbacks inert. Already completed
programmatic dispatch keeps its microtask timing. It preserves the upstream
compiler, declarations, runtime dependencies, exports and MIT notice.

pnpm normalizes SemVer build metadata while packing. The manifest therefore
honestly retains upstream version 5.57.3 and carries a separate
`svelteUiKitNative.buildId`. Exact archive, provenance and installed-inventory
authentication must distinguish this variant from an unpatched same-version
installation; version compatibility alone cannot establish corrected behavior.
No peer override or installed/store patch is involved.

The `5.57.3-reset-dispatch.2` producer adds the separate
[binding correction](../../tools/native-runtime/bindings-reset.patch). Native
group reset reads the currently checked semantic values through Svelte's own
group helper. An empty radio selection remains `null`; a selected `undefined`
value remains `undefined`. This does not change group membership or invent
per-control group state. Equal checkbox values still share membership, and a
radio value of `null` still aliases Svelte's no-selection sentinel. Those raw
model constraints exist without reset. Generated Checkbox uses independent
checked state and must preserve separate controls' defaults and submission even
when their submitted values are equal.

Native file reset reads the current `FileList`. When it is still the same live
object as the bound value, reset can mutate its contents without invalidating
reactive state. The correction creates a genuine new list with the input
document's `DataTransfer`, preserving the actual `File` objects, bytes and
metadata. List identity can change on successful reset; canceled reset preserves
both list and file identity. A different current list passes through directly.
An absent owner-document `DataTransfer` throws an explicit error only when a
same-identity list requires refresh. Refused additions, truncated lists or
changed file identities also fail explicitly before publishing a partial copy.
No fake list, recreated file or silent
stale-state fallback is supplied. Destroyed bindings remain inert. Matched
nonempty-copy success and refusal controls dispatch synthetic reset events over
genuine selected files; those events have no browser reset default action and
isolate copying separately from actual native/programmatic form reset.

```sh
node tools/build-svelte-runtime.ts --output .native-build/svelte-reproduction
pnpm run native:runtime:check
pnpm exec playwright test tests/browser/reset-semantics.spec.ts
```

Output must be absent and have regular ancestry. `--source` optionally reads the
exact upstream archive locally; `--baseline` builds the unpatched causal control.
`--dispatch-control` applies only the earlier dispatch/teardown correction, so
group-default and same-identity file reactivity assertions can isolate the new
binding correction. These flags are mutually exclusive. Provenance and manifest
record distinct build IDs and a closed correction mode; controls are not
deliverables.
Actual streamed/file bytes are bounded before complete allocation. Real pnpm
packs select the distribution, followed by canonical gzip metadata, an inventory
of the actual selected files and a final pack containing its provenance. The
regression independently reproduces identical archives, checks every unchanged
source/compiler/type/notice input and exercises corrupt/unsafe source and output
refusals. Generated archives and reports remain development artifacts.

This is a producer qualification component. The normal CLI dependency graph,
installed-source authentication and bundled delivery still select their current
dependencies. The reset browser helper first generates real application-owned
Fields, then creates a fresh strict/frozen installation of the candidate. It
qualifies six TextInput types, TextArea and NativeSelect against plain DOM and raw
Svelte, synchronous cancellation, replacement, movement, intervening edits,
later mounts, teardown and detach-during-reset. Setting the test-only
`SUIK_RESET_CAUSAL_CONTROL=unpatched` builds the control through the identical
installation path; the cancellation assertions must genuinely fail there.

The additional browser suites compare numeric/range/checked/select/file/group
bindings with plain controls, including both binding orders, native and
programmatic reset, all synchronous cancellation phases and actual submission.
Separate group controls witness opaque value identity, empty selection, linked
duplicates and the null sentinel. File controls cover reactive versus direct
reads, multiple and directory files, intervening edits, teardown, owner-document
realms and explicit capability failure. Test-only control selection uses the
same fresh strict/frozen application installation path.

Normal runtime adoption additionally requires authentication/refusal and packed
consumer qualification. Already-detached/shadow-root reset dispatch and
asynchronous cancellation remain separate native boundaries; producer and Field
qualification do not qualify an arbitrary Svelte application. Fresh executable
results, rather than this scope description, establish which gates passed.

The separate Svelte authentication profile fixes the upstream raw version, native
build ID, complete archive and provenance digests. It shares current-file and
inventory verification with Bits while retaining a distinct closed provenance
schema. Official upstream, unpatched and dispatch-only distributions cannot
satisfy the corrected profile despite sharing the upstream version. Explicit
selected-application archive proof and installed proof remain separate. This
profile is an authentication mechanism; normal dependency capture, generation,
bundled delivery and consumer adoption require their own integration checks.

Invocation capture keeps a deeply immutable package-indexed archive collection.
The historical `nativeFile` accessor remains the same Bits observation. Each
authenticated source contributes its actual hash/mode and complete ancestry to
snapshot evidence; later byte, mode or physical-path changes cannot hide behind
an unchanged application manifest. Missing and invalid sources remain distinct
observations. Archive capture alone never establishes installed readiness or
selects a runtime variant for an application.
