# Compatibility and measured limits

Compatibility is bounded by actual native checks and reviewed source. Current
pins and qualified distribution identity are below. The later behavior table
retains the original measured limits from revision
`ae136d7d08ac4efeffdd2056d49dd554557dd68d`; it is not a claim that all historical
browser/platform cases were repeated for each dependency update.

## Toolchain and distribution

The tested toolchain is Node 24.22.1, pnpm 12.16.1, Svelte 5.57.3,
Bits 2.20.2-svelte-ui-kit.1, date 3.12.4, TypeScript 6.0.3,
svelte-check 4.7.7, SvelteKit 2.70.3, Vite 8.3.5 and csstype 3.2.3.
Package engines admit Node >=24.22.1 <25; that is not a claim of testing every
Node 24 update. The package remains private and unpublished. No registry release
or automated dependency installation is assumed.

The authentic native archive is a local qualified source build, not an upstream
release. Its SHA-256 is
`1e952f7cb1edd822650384e9e30dd75e864b3848d4a20fc73cb8ccd5224d1f27`.
The producer recipe, patch, emitter inputs and locks own reproduction. Strict
checking uses skipLibCheck=false with zero errors/warnings; installed declaration
patching, hiding imports and diagnostic suppression do not qualify it. Positive
bindings, causal invalid controls and representative mutual type comparisons
complement runtime tests without claiming exhaustive type equivalence.

Application runtime qualification additionally requires the corrected Svelte
`5.57.3-reset-dispatch.2` archive, SHA-256
`a7c2bfa42a6827ba2ced3e281a6f1ed2e8e1cfd4b1cddf1698796089f411abc4`.
Its manifest honestly retains upstream version 5.57.3. Separate fixed provenance
and complete installed inventory distinguish it from upstream and causal controls.
Readiness requires both the installed proof and an authenticated
selected-package-owned archive. Guarded writes reauthenticate every present native
installation and its source; preinstall generation remains explicitly unready
and reports installation instructions. Ordinary registry SemVer compatibility is not
corrected-runtime proof. Library development installs use owned files while
published peer requirements retain SemVer.

Qualified pnpm 12.16.1 layouts include only the exact measured installer-generated
Acorn 8.18.0/8.19.0 executable shim alongside the fully authenticated distribution.
Other installation metadata or changed shims refuse. Broader npm/Yarn installation
layouts require separate native qualification; rendered commands alone are not
proof of their resulting installations.

Normal workspace dependency versions have one authored catalog in
`pnpm-workspace.yaml`; package-owned native archive locators remain explicit.
The following compatible stable exceptions are owned by this kit's maintainers:

| Role                             | Selected version | Compatibility reason                                                                                                        |
| -------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| TypeScript                       | 6.0.3            | Astro/Svelte/checker/emitter and typescript-eslint peers exclude current TypeScript7.                                       |
| SvelteKit                        | 2.70.3           | The supported legacy mapping contract uses svelte.config and Kit2 files/lib behavior; Kit3 changes configuration ownership. |
| Node adapter                     | 5.5.7            | Adapter6 requires Kit3.                                                                                                     |
| Native Runed                     | 0.35.1           | Bits' pinned upstream catalog requires ^0.35.1; latest0.38 also requires Kit3.                                              |
| Node declarations                | 24.19.2          | They match the selected Node24 runtime rather than a newer major.                                                           |
| Emitter build compiler framework | Svelte4.2.20     | The pinned upstream emitter build requires ~4.2.19; application/native consumers use Svelte5.57.3.                          |

These decisions follow the actual package peer/engine/source requirements. See
[Kit3 migration](https://svelte.dev/docs/kit/migrating-to-sveltekit-3) and the
producer contract at `docs/agents/native-dependency.md` in the development repository.
A version range does not qualify an arbitrary installed graph. Supported Kit
mapping additionally proves one direct zero-argument `sveltekit()` Vite plugin;
options, dynamic/ambiguous configurations and Kit3 installations refuse with
captured nonmutating diagnostics. New executable configuration uses TypeScript.

Follow [getting started](../getting-started.md) for explicit archive ownership.
Generated app source imports local siblings and supported native APIs; it has no
kit runtime dependency. The application still needs its Svelte/Bits/date and
framework/check/build tooling. The original license texts and attribution remain.

## Native behavior and browser boundaries

The table preserves historical upstream behavior. The selected corrected Svelte
runtime repairs the trusted text-reset cancellation defect through its separately
qualified dispatch and binding corrections. That correction does not close the
remaining browser, detached/shadow dispatch or arbitrary application boundaries.

| Boundary                | Supported interpretation                                                                                                                                                                                                                                                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reset cancellation      | Raw Svelte text and generated Field preserve values for canceled application-invoked form.reset(). Trusted reset-button clicks can restore native text defaults despite preventDefault. Switch/Checkbox/Radio's guarded native fields preserve cancellation and resolve current owners; no universal reset-cancellation claim or extra text engine is made.          |
| Closed forceMount modal | Both modal families' default nondelegated retained closed Content can lock body pointer interaction even without Overlay. Teardown restores it. Arbitrary caller overlays and animations need their own checks.                                                                                                                                                      |
| First opening           | Current Bits2.20.2-svelte-ui-kit.1 reports true then false for completed portal opening/closing; wrapper and direct-native controls require that exact sequence. This fixes the historical first-open omission measured on the prior graph. Callbacks remain forwarded without synthesized presence.                                                                 |
| SSR relationships       | Some inferred links register after earlier server evaluation and complete during hydration. Native caller aria-label is available when initial server naming is necessary. IDs alone do not prove naming.                                                                                                                                                            |
| Floating wrapper IDs    | Native Menu's nonsemantic floating wrapper useId() is a process counter. Equivalent SSR preserves semantic component/form IDs, state and valid relationships; it does not reset every native wrapper ID per request.                                                                                                                                                 |
| CSP                     | Denying style attributes rejects native initial floating/measurement styles; later CSSOM geometry does not establish strict SSR parity. Measured Menu policy permits style attributes with nonce scripts and self-hosted CSS. Svelte Avatar's server image event recorder attributes also exist before hydration. Plain CSS is not zero runtime inline styling.      |
| Portal themes           | Body portals inherit document scope; suitable explicit native Element hosts inherit nested scope. Transformed/overflow-clipped hosts retain actual clipping and stacking. There is no computed-theme copying or hidden relocation.                                                                                                                                   |
| Contrast                | Original Radio boundary ratio 1.4735129263833868 and Switch track/thumb 2.5388412065932826 are below 3:1. Separator baseline border on white and some dark overrides also fail that ratio. Source info/success normal-text pairs are below 4.5:1. Arbitrary themes and the entire token catalog are not certified.                                                   |
| Browser scope           | Baseline full qualification used Chromium, one worker, zero retries and strict console/page/hydration/teardown collection. Firefox/WebKit, Linux rendering, arbitrary themes and screen-reader speech remain unqualified. Browser roles/tree evidence does not measure speech.                                                                                       |
| Filesystem scope        | Baseline safety qualification covered macOS and unprivileged Linux with actual permission-denial controls. Trusted-local same-filesystem per-file replacement and lock-last publication are the model. Windows is explicitly unsupported; hostile syscall races, network filesystems and power loss remain unqualified. Hosted configuration alone is not execution. |

The application must review accessibility, themes, supported native defaults,
portal choices and production behavior for its actual use. Preserve SSR and
strict diagnostics when investigating defects; do not add blanket suppression
or alter source palettes to disguise an unresolved finding.

## Identity and SSR

Disposition: deliberately non-generated. The original source KitIdProvider and
use_kit_id counter/provider is not an installable item, helper, export or alias.
Pinned Svelte5.57.3 and Bits2.20.2-svelte-ui-kit.1 supply native per-instance
semantic identity. Field uses `$props.id()` and a per-Root context; its shared
Symbol is a key, not shared relationship state. Native Bits createId formats
the part's `$props.id()` result rather than allocating a kit counter.

FieldRoot's default base supplies control and keyed message IDs. Explicit caller
id/controlId wins; direct controls choose caller ID, then Root controlId, then
their own native ID. FieldLabel uses explicit for or current Root controlId.
Convenience field id belongs to the root/base. Align any overridden control ID
with its explicit label/root relation. Message keys must remain unique.

Switch/Checkbox/Radio/Tabs/Collapsible preserve native part IDs and registration.
Dialog/Alert Dialog/Menu guards retain only actual live description targets in
the bound Document/ShadowRoot and disconnect on teardown; they create no IDs.
Other native presentation items retain caller IDs without implicit relationships.

Semantic IDs are document-scoped: separate equivalent SSR responses can reuse
them without sharing mutable state. Explicit app IDs must be unique in the real
tree. Separately rendered roots embedded in one document can use Svelte's existing
render idPrefix option. Hydration requires the initial server tree to remain;
conditional changes afterward allocate new framework identities. Native floating
wrapper process IDs remain the distinct boundary in the table above.

Owning repository controls include
[combined forms](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/forms-composition.spec.ts),
[modal presence](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/modal-force-mount.spec.ts),
[catalog SSR](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/integration/catalog-ssr.test.ts),
[identity contracts](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/components/identity-contract.test.ts)
and [Menu CSP](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/browser/menu-csp.spec.ts).
