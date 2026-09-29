# Installation, upgrade, and recovery runbook contract

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

Status: instructions for what the implementation must support and later verify. The new CLI is not supplied as a working binary in this specification. Replace command paths only with actual built/installed executable evidence; no npm publication is assumed.

#### Initial installation

Start at one authorized SvelteKit application root (or use --cwd). Preserve a clean known baseline or record existing changes. Run info to inspect integration/dependency state. Inspect an item's metadata/source with view. Review init/add dry runs and all proposed paths. Apply initialization and requested items. Install reported consumer dependencies explicitly using the actual project manager. Check the generated app with Svelte check, production build and relevant browser tests. Commit application source/CSS/config/lock/contract metadata; do not commit transient writer state.

The init contract does not preinstall the complete catalog. Component requests remain distinct from their dependencies. Existing themes.css/app.css/layouts are application-owned and must survive integration.

#### Customization

Use application theme/override styles for portable changes or edit generated source/managed blocks directly. Preserve class/property contracts as needed by related parts. A valid local edit is not a broken installation by itself. Record substantive source changes in application Git history; CLI lock baselines must not be rewritten manually just to hide drift.

#### Upgrades

Choose a tested CLI/registry version and review dependency compatibility. Run sync --dry-run. Untouched generated content can update, local-only edits remain, already-incoming content is satisfied, and genuine conflicts stop the batch. Inspect incoming source through view --source and reconcile deliberately. Source/CSS/export compatibility cohorts must update safely together. Rerun dry-run, apply, then typecheck/build/browser/doctor. Commit the result and metadata truthfully.

Do not use invented --force, auto-merge, accept-hash or dependency-install options. Hashes alone cannot reconstruct a merge base. An application's Git history is useful to review changes but must not be silently treated as authority to overwrite local content.

#### Removing desired items

Edit the explicit requested set in kit.json and inspect sync --dry-run. Shared dependencies remain while needed. Clean obsolete owned targets may retire under the frozen policy; customized assets remain with diagnostics and explicit ownership changes. Resolve remaining application imports manually; the CLI does not promise arbitrary source rewriting. No remove command is part of the approved interface.

#### Interrupted writes

Stop further mutation when a command reports pending/ambiguous recovery. Preserve current files and transaction evidence. Use read-only diagnosis to understand the state; do not delete lock/journal files based only on age, PID, or a guess. The implemented protocol must safely finish/revert a provable interrupted state or refuse with actionable guidance. It must not overwrite edits made after interruption.

The implementation must provide fixture-tested instructions for prepared, partially applied, published-but-not-cleaned, and invalid/ambiguous states. It may not claim safe recovery before those fixtures pass. A cleanup failure after publication is not the same as a failed uncommitted installation; command reports must distinguish them.

#### Agent specification after each commit

Use STEP_REPORT_TEMPLATE.md. State exact commands/working directories/results and unverified lanes, preserve failed evidence, commit only scoped changes, and name the next numbered step. Do not claim a final release when any required acceptance criterion remains blocked. Package construction/testing does not authorize publication or a remote push.
