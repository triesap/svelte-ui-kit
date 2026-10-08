# RCLD-10 force-mounted modal evidence repair — independent review

Reviewer: separate Codex acceptance reviewer. Date: 2026-10-08. Disposition: accepted for the narrow preliminary-review evidence and standalone-document repair at `1285154671e05e41f7d78feb1786042a523601c0`. This does not accept any original checkpoint, finalize S187 or S193, or supply a future evidence-commit anchor.

The reviewer inspected the qualification, actual native Dialog/Alert Dialog and ScrollLock implementation, new production consumer helper, fixture, browser assertions and report wording changes. No product source, dependency, default or original criterion changed. All 203 original definitions remain byte-identical to `a176387`; unrelated work and repository boundaries remain preserved.

Fresh independent owning verification:

- `pnpm exec playwright test --config playwright.config.ts tests/browser/modal-force-mount.spec.ts --max-failures=1 --output=implementation/evidence/logs/r10-force-mount-independent-artifacts`: 12/12 Chromium cases passed in 21.6 seconds, zero skips. Both actual default/custom CLI-installed consumers checked and built before runtime qualification. Strict lifecycle collectors and owned-server cleanup assertions remain active.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run check:contracts`: all exited 0; contract validation reported zero errors/warnings.
- `git diff --check`: passed. Final reviewer-document formatting and contract validation also pass.

The retained raw log is `implementation/evidence/logs/r10-force-mount-independent.log`. Twelve actual installed artifact records authenticate 432 generated source digests against current registry files with zero mismatches. Twelve paired `native-parity.json` records were independently read and compare exact native/generated before/after inline pointer, computed pointer and inline overflow values.

For each modal kind in each layout, default nondelegated closed force-mounted content yields inline/computed body pointer-events none and overflow hidden. An actual coordinate mouse click on the visible outside button does not activate it. Explicit preventScroll=false and delegated child rendering yield computed pointer-events auto with empty inline pointer/overflow; the same real click activates the button. A real F8 keyboard action destroys the mounted root. Every lane removes its content, restores empty inline pointer/overflow and computed pointer-events auto, and permits actual outside button activation. Native and generated measurements are identical. No synthetic dispatch supplies this pointer result.

The application fixture deliberately uses visibility:hidden on retained content and has no Overlay. Thus the evidence isolates body locking; it does not qualify unstyled retained overlay interception, arbitrary caller CSS, every force-mount animation/presence policy, nonzero restore delays or cross-browser behavior. This bounded result substantiates the native source explanation: nondelegated retained content mounts ScrollLock, while the delegated branch guards ScrollLock by open state. Preserving this pinned caller-policy behavior meets the examined native forwarding boundary without inventing a kit scroll-lock engine or masking teardown failure.

The S189/S190/S191 report wording now preserves standalone repository identity. S187 points to measured force-mount evidence while retaining its historical source-only inference and the separate acceptance requirement.

No blocking finding remains for this narrow evidence/document repair. The full original S182–S193 mandatory acceptance gate remains open; later platform/package/release and AC20 obligations remain open. Original checkpoint status and completion counts are unchanged by this review. All reviewer test/browser/static lanes are released.
