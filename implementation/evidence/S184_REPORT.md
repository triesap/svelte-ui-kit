# S184 implementation report — combined native forms and reset

Author: Codex. Independently accepted on code `abeccabbdfda5aedb7be4f72e3b51a4675d3a609` at evidence `8ab760dc4d674853b172126b2a3ec3a0434c678f`.
Original implementation commit: `e162489adba505730468a1361390a1aa42e3b900`. The candidate narrative below
is historical implementation and verification provenance.
Implementation commit: `e162489adba505730468a1361390a1aa42e3b900`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S184","kind":"report","commit":"8ab760dc4d674853b172126b2a3ec3a0434c678f","disposition":"implemented"}
-->

## Implementation and behavior

`tests/fixtures/qualification/forms-composition/+page.svelte` combines actual
Button, TextField, Checkbox, Radio and Switch in one form, including externally
associated Checkbox ownership. The generated-consumer helper installs the seven
explicit complete items and dependencies through the real CLI in default/custom
layouts, checks/builds both apps and retains actual installed/production digests.

`tests/browser/forms-composition.spec.ts` qualifies correct submission names,
values, ordering and submitter. Every named control has exactly one native input
owned by the intended form; no primitive creates duplicate hidden inputs. Field
label and message associations remain valid. Plain Button defaults do not
submit. Native required validity prevents submission for each invalid Field,
Checkbox, Radio and Switch control. Disabled controls are omitted; disabled and
loading submit buttons cannot implicitly activate from Enter. Loading retains
the correct accessible name, busy state and decorative spinner.

Uncancelled reset synchronizes every native/control value to its actual initial
default, including external ownership. Checkbox reset preserves the current
indeterminate state according to its frozen API. Application-invoked native
`form.reset()` cancellation preserves both raw Svelte and kit values. The fixture
avoids naming its button `reset`, which masks the native method through ordinary
HTML named-property lookup; the initial masked-call error was not filtered.

A trusted reset-button click exposes a pinned framework boundary: a raw native
Svelte text binding and the corresponding Field binding restore their defaults
despite the reset event being cancelable and default-prevented. Separately
guarded Radio/Switch/Checkbox states remain cancelled. Both trigger paths now
have explicit default/custom tests, retained diagnostic JSON and direct native
controls. The Field map records measured Svelte 5.57.1/Chromium bounds for S193
review and final AC20 qualification. No kit reset/validation engine, dependency
change, product repair or universal cancellation claim was introduced. Original
checkpoint definitions and criteria remain unchanged.

## Verification

All final owning commands used the configured build router and exited 0:

- `pnpm exec playwright test --config playwright.config.ts tests/browser/forms-composition.spec.ts`: 12/12 across both real installed layouts; zero lifecycle diagnostics.
- Focused corrected native cancellation probes: 2/2; earlier failed probes remain distinct.
- Final cancellation cases, additionally proving changed inside/external Checkbox values stay cancelled: 4/4 across both layouts.
- `pnpm run fixture:check`: zero errors and warnings; `pnpm run fixture:build`: passed.
- `pnpm run format:check`, `pnpm run lint`, `pnpm run typecheck`: passed after the equivalent DOM type-alias lint correction.
- `node tools/check-contracts.mjs`, diff whitespace and staged content review: passed before commit.

Owning raw logs use `s184-`; actual installed consumer, trusted-reset and
application-invoked reset diagnostics remain under
`implementation/evidence/logs/s184-browser-final-artifacts/`. Browser
qualification also retains the final Checkbox cancellation measurements under
`implementation/evidence/logs/s184-cancel-final-artifacts/`. Browser
qualification is Chromium. Rust checks are N/A: no Rust workspace is affected.
Qualified strict-declaration exceptions and final platform/package/AC20
obligations remain explicit. This candidate does not independently accept the
new native trigger boundary or the full sequence.

Next original checkpoint is S185, nested cross-family overlay interactions.
S184 awaits the mandatory separate S193 acceptance gate.
