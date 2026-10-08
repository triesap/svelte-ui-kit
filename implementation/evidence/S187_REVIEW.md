# S187 independent review — Qualify catalog-wide themes and portal changes

Reviewer: separate Codex acceptance reviewer; no product or test repair authored for this batch. Date: 2026-10-08. Disposition: accepted against the original S187 criteria within the complete independent RCLD-10 gate.

The final independently tested head is `abeccabbdfda5aedb7be4f72e3b51a4675d3a609`; original S193 implementation is `ad7d1c38a3fcc3f84c1379e8a9c85939e5b55e1a`, original S192 repair is `6bdf06f4b59b039fd0e1486bc7abb12ea10dc47c`, and the initial bookkeeping freeze was `de45c55a45634ddf0878552d7f245b11ebb6dde0`. This plain review invents no evidence-commit anchor.

The complete 22-item catalog is qualified in document/nested themes with live body/custom portal changes and application-owned theme persistence. Fourteen browser cases and layout import probes passed; sync preserves theme, application CSS, layout and catalog bytes. Closed force-mounted nondelegated Dialog/AlertDialog body locking is directly paired with native Bits controls: default policy suppresses an outside coordinate click, preventScroll=false and delegated-child controls permit it, and real F8 teardown restores body pointer/overflow and click behavior. Twelve forceMount cases passed freshly. Their fixture hides retained content to isolate body locking and tests no Overlay; no broad overlay or caller-animation guarantee is inferred.

Relevant independently assessed probes: catalog themes and portal cases; modal-force-mount.spec.ts. Source, actual installed consumers, native controls and retained causal artifacts were inspected; author reports alone were not acceptance authority. Final-head cumulative checks passed 298 unit, 825 integration, 63 registry, 3 package, 155 contract, 719 Chromium browser and 27 consumer smoke cases, with zero failures or skipped cases. Build, typecheck, lint, formatting, contract validation and fixture check/build exited 0. Real packed offline complete default/custom catalogs checked, built, rendered, replayed and passed strict doctor. Unchanged component (440), harness (39) and CLI bootstrap (44) checks passed independently at the initial freeze, with accurate historical attribution.

See [RCLD-10 qualification](RCLD-10_QUALIFICATION.md) for exact commands, repaired findings, provenance and measured bounds. No blocking finding remains for this checkpoint. All 203 original definitions and accepted S001–S181 evidence are preserved; unrelated changes and repository boundaries are preserved. This accepts original S187, not full MVP/release or later S194–S203 and AC20 obligations. The coordinator must commit plain evidence and finalize the real anchored transition before S194 proceeds.

Independent acceptance is anchored at reachable evidence `8ab760dc4d674853b172126b2a3ec3a0434c678f`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S187","kind":"review","commit":"8ab760dc4d674853b172126b2a3ec3a0434c678f","disposition":"accepted"}
-->
