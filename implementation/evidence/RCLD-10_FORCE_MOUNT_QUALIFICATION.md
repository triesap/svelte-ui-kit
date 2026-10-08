# RCLD-10 force-mounted modal qualification repair

Codex author candidate, required by the separate reviewer's preliminary S193
assessment. This repairs an evidence gap; no original checkpoint is accepted
and no product wrapper, dependency or force-mount default is changed.

`tests/browser/modal-force-mount.spec.ts` builds real installed default/custom
Dialog and Alert Dialog consumers and compares each against direct pinned
Bits components on the same production route. Twelve cases cover both modal
kinds, both layouts, and three caller policies: omitted/default preventScroll,
explicit preventScroll=false, and delegated child rendering. The application
hides retained closed content with visibility:hidden to isolate body locking;
there is no Overlay in this probe and no claim about unstyled overlay pointer
interception. Native and generated parts remain force-mounted closed.

Default nondelegated content in both direct native and generated roots sets body
pointer-events:none and suppresses an actual outside coordinate pointer action.
Both explicit preventScroll=false and delegated child controls leave ordinary
outside pointer activation usable. A real F8 keyboard action removes the closed
root; every lane removes its content, restores body pointer/overflow state, and
permits another actual outside button click. Exact native/generated before and
after inline/computed body state must match. No synthetic event certifies pointer
activation. Strict browser lifecycle error collection remains active, with
artifact digests and measured paired states retained.

This runtime result supports the previous source inspection: pinned nondelegated
content mounts ScrollLock for retained content, while its delegated branch
guards ScrollLock on open state. It is a bounded native caller-policy limitation,
not a universal forceMount interaction guarantee. No wrapper divergence or
teardown failure was observed. Independent repair acceptance remains separate
from author success and the full S193 gate.

Public S189/S190/S191 reports use standalone repository-boundary/unrelated-work
wording. Original checkpoint
definitions, native limits and acceptance dependencies remain unchanged.

Validation through extbuild after green doctor/current guard:

- `pnpm exec playwright test --config playwright.config.ts tests/browser/modal-force-mount.spec.ts --max-failures=1 --output=implementation/evidence/logs/r10-force-mount-final2-artifacts`: 12/12 passed, zero skips; actual generated check/build pass as prerequisites. Log `logs/r10-force-mount-final2.log`; paired artifact/body state under the matching artifact directory.
- `pnpm run typecheck`, final `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts` and diff/staged review passed before the repair commit; contracts reported zero errors/warnings.

Initial fixture snippet-placement/type errors remain in diagnostic logs;
corrections use the actual native child contract and do not change product code.
Node 24.21.0, pnpm 11.22.0, Svelte 5.57.1, Bits 2.19.3, Chromium/macOS arm64
are the measured lane. No Rust changes: Cargo guards N/A. Existing declaration
exceptions and final AC20 obligations remain explicit. S192 stays active; this
repair does not bypass mandatory independent S193 acceptance.
