# Test strategy

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

#### Test the right artifact

Registry authoring templates need static checks, but the decisive artifact is the **generated app produced by the installed tarball**. Maintain separate package/CLI unit tests, temp-directory integration tests, compiled generated-source fixtures, and browser tests. Shared test helpers must not accidentally bypass generation or read hidden source-tree assets.

#### Pure models and contracts

Validate strict schema errors, malformed values, duplicate IDs/paths/exports, independent versions, valid/invalid compatibility ranges, deterministic serialization/hashing, missing assets, graph cycles, root-versus-transitive provenance, and incompatible dependency intersections. Include negative examples, not just one canonical manifest.

#### Planning and ownership matrices

Exercise every B/L/I combination in sources and CSS, current=incoming adoption, untracked collisions, missing tracked files, preserved formatting, malformed markers, retired customized assets, needed transitive assets, aggregate source/style cohorts, metadata truth, and stale configs. Snapshots should be paired with semantic assertions about writes and retained bytes.

Test no writes for all read-only commands, dry runs and conflict outcomes by snapshotting the entire fixture, including hidden state, modes and temp/coordination files. Repeated commands should preserve the same semantic and byte-level state. Inspect JSON envelopes and process exit statuses from actual executable invocations.

#### Filesystem transactions

Use an injectable filesystem boundary for failure points and deterministic tests, supplemented by real-filesystem temp-directory tests. Test path traversal, prefix-confusion, overlap, symlinked ancestors, broken links, existing directories/nonregular targets, platform case handling, coordination contention and preimage changes. Inject termination/failure at each stage and ensure recovery does not overwrite post-crash user edits. Ambiguous journal state must refuse further mutation.

#### Structural patchers

CSS: missing/duplicate/mismatched/nested markers, quoted marker-like text, CRLF, comments, foreign/unmanaged rules, deterministic block order and removed blocks.

Exports: app-owned declarations/comments/imports, duplicate exported symbols, renamed imports, multiple managed regions, untracked existing barrels, sibling-path accuracy and cycle checks.

Svelte integration: absent layout/script, instance/module script separation, TypeScript, existing ordered/unordered imports, comments, alternate valid formatting and unsupported layouts. Assert preservation of route children/render behavior and script semantics.

#### Wrapper and browser tests

Use typed positive/negative fixtures for actual pinned primitive/native props. Test state/ref binding updates in both directions, optional controlled defaults, children/child forwarding or rejection, caller classes/attributes, event cancellation/order and discriminated unions. Avoid `any` casts as proof of compatibility.

Browser assertions cover focus navigation/return, required accessible names and relationships, activation/dismissal, form value/required/disabled/reset behavior, no duplicate hidden inputs, loading busy semantics, image fallback, progress state, RTL and reduced motion. Test overlays nested across families and interrupted open/close transitions. Accessibility tools are supplementary to behavioral assertions, not a substitute for manual semantic review.

#### CSS and theme verification

Check every public class and property in the mapped contract against real generated DOM. Use computed styles for radius fallback precedence, full border-radius grammar, indicator geometry, token overrides, theme changes and scoped portals. Record visual/contrast issues honestly. Verify ordinary CSS tooling succeeds without Tailwind or CSS-in-JS.

#### SSR/hydration and concurrency

Build the real SvelteKit app. Render multiple instances/requests and hydrate without unexpected warnings or server-global state leakage. Test initial open/checked/value states and portal hydration per the pinned primitive contract. No SSR-disabled fixture qualifies this requirement.

#### Package acceptance

Build and pack the CLI, inspect included assets/schemas and executable metadata, install tarball into an isolated harness, then make the authoring checkout/build state unavailable. Run information, install, sync and doctor commands against consumer fixtures. Network during explicit dependency setup is distinct from the registry's package-local operation requirement. No npm publication is necessary.

#### Matrix and evidence

Resolve supported Node/OS/browser/version/feature matrix at discovery and record exact lanes. Use Linux/macOS/Windows tests for advertised filesystem behavior, not an untested portability claim. Where Rust exists, preserve its baseline and valid render-feature lanes independently. Record actual commands, versions, exit statuses, commit hashes and unverified lanes after each commit.
