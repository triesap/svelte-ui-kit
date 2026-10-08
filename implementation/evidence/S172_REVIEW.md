# S172 independent review — Progress bounds and painted state

Reviewer: separate Codex acceptance reviewer; no product or test repair authored for this batch. Date: 2026-10-08. Disposition: accepted against the original S172 criteria within the complete independent RCLD-09 gate.

Original S181 implementation/audit candidate: `b55522dca4f48815fc10053f49cd475e47dad06f`. Initial bookkeeping freeze: `73ca2457fb5dcaadc452d4a0ce1b7b9313df03a4`. Final product repair: `130b933d8e8f59e252c701ea95bedd9ffb51c558`. Final independently tested head: `a79db79f78818797e2b3d541731797b5b19b60ce`. This plain review invents no evidence-commit anchor.

Twelve live numeric/omitted/null/nonfinite states match direct native attributes/AX properties and retained node/name in both layouts; negative/NaN/Infinity SSR/hydration also pass. Causal setter-versus-attribute probes justify uppercase VALUE/string max and post-update absence restoration. Actual pixels confirm repaired native paint matches exact semantic indicator/track colors in three themes with >=3:1 ratios. Mozilla is declaration-only; browser-owned indeterminate animation and Chromium value-text AX limits remain explicit. Independent initial-null hydration and fresh-client probes exposed a real native numeric setter failure despite the earlier dynamic-null coverage. The owner’s nullish VALUE-to-undefined repair now passes initial null/undefined/default/null-max hydration and three fresh mount/remount cycles, with strict error collectors and four causal regression cases. Numeric serialization and dynamic absence behavior remain preserved.

Relevant independently executed probes: progress.spec.ts. Source, installed consumers, native controls and retained causal artifacts were inspected; author reports and counts alone were not acceptance authority. The final frozen-head cumulative gate passed 298 unit, 790 integration, 427 component, 605 Chromium browser, 58 registry, 3 package and 152 contract cases, without skipped cases. Typecheck, lint, formatting, contract validation and fixture check/build exited 0. Real packed offline default/custom catalog consumers checked, built, rendered, replayed and passed strict doctor.

Both blocking findings were reported for owner repair and independently reverified: isolated contract fixtures omitted catalog link targets, and initially null Progress crashed native mounting/hydration. Their repairs preserve original criteria and causal negative checks. See [RCLD-09 qualification](RCLD-09_QUALIFICATION.md) for exact evidence, repair history, source comparison and measured limits.

No blocking finding or repair remains for this checkpoint. All 203 original definitions and the accepted S001–S148 prefix remain preserved; unrelated changes and repository boundaries are preserved. Acceptance covers original S172, not later S182–S203 or full platform/package/release and AC20 obligations. The coordinator must commit plain evidence and finalize the real anchored transition before S182 proceeds.

Independent acceptance is anchored at reachable evidence `871c1945daf660d9f0f724fb949057b4fa3a1da6`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S172","kind":"review","commit":"871c1945daf660d9f0f724fb949057b4fa3a1da6","disposition":"accepted"}
-->
