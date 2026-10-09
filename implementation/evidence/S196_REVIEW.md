# S196 independent review — Verify advertised compatibility and release metadata

Separate reviewer: Codex independent acceptance reviewer. Date: 2026-10-09.
Disposition: accepted against the original S196 criteria within the complete
independent RCLD-11 final gate. The reviewer authored no product/test repair.

The independently reviewed candidate is
`b174b5ae8ffd4eead61df5e846ea4d39ac14ec74`; original S196 implementation is
`d9f3d733cadbc11bb3e9110a8f0e72a7ebb158c6`. Approved repair identities, precise fresh versus
reused results, all AC01–AC22 dispositions and qualification bounds are recorded
in [RCLD-11 qualification](RCLD-11_QUALIFICATION.md).

The reviewer inspected package metadata, the actual 241-file archive, notices/licenses, dependency roles, portable native provenance and compatibility guidance. Fresh full package 10/10, producer/delivery 5/5, integration native delivery 9/9 and raw strict 18/18 pass. Package 0.1.0 is private, ESM, with one CLI bin and Node >=24.21.0 <25; pnpm 11.22.0, TypeScript 6.0.3, Svelte 5.57.1 and actual Bits 2.19.5-svelte-ui-kit.2 are the selected baseline. Broader versions/platforms are not claimed. Consumer Bits setup is explicit and app-owned; there is no styled kit runtime dependency or automatic manifest install.

The historical two native TS2590 failures and `S196_STRICT_ASSESSMENT.md` are diagnostic provenance, not unresolved current debt. The approved source-level emitter repair genuinely reproduces those failures with the unpatched control, passes raw skipLibCheck:false with zero errors/warnings, preserves 694 runtime/prop files and produces exact reproducible licensed .2 archives. Native type fidelity/invalid controls pass without suppression or installed declaration patching. The historical npm-name lookup is reported as observed, not a name reservation or availability guarantee; no silent renaming or publication occurred. All original metadata, compatibility, notice and role criteria pass within these bounds.

No blocking finding remains for this original checkpoint. Unrelated changes and
repository boundaries are preserved. This is plain independent evidence; the
coordinator must commit it and finalize the real reachable acceptance anchor.
No structured acceptance record or future evidence hash is invented here.
