# S153 step report — Generate the thin Router Link recipe

Author: Codex. Locally verified candidate; independent S181 acceptance pending.
Implementation commit will be recorded after the green commit.

Original R02, R06, R10, R28, R32, R33, R34.
Starting `68d46280f572e551cc862163a3274bd56de75cad` on `master`.

Generate the frozen optional recipe as direct sibling Anchor composition, with
explicit ref binding and unchanged native props/children/events. Register exactly
RouterLink/RouterLinkProps, two source files, Anchor as sole registry dependency
and no npm dependencies or independent stylesheet. Source kit-anchor design is
owned by Anchor; only tokens/anchor managed blocks are installed. No router
runtime import, route context/store, duplicate handler or wrapper element is added.

Real default/custom CLI installations validate explicit router-link request plus
transitive Anchor/tokens, exact four component/type source bytes, ownership/cohort
and lock source/style hashes, flat exports and no-effect dry run. Both applications
typecheck/build and render through their actual production handler with verified
handler identity. Native href/class/ref typing and omitted/default/explicit/empty
rel, targets and download attributes remain unchanged. Repeated add/sync preserve
the complete installed tree. Native request/navigation/base-path/link-options
behavior remains original S154.

Initial owning integration passed1/3: both real consumer check/build phases
completed, but the render fixture still requested the old installed-anchor route
and the strict owned-server guard correctly rejected its404stderr. Correct only
the request to the authored installed-router-link route. Fresh rerun passes3/3
without suppressing response status, handler identity or stderr assertions.

Changed: complete Router Link component/manifest and root registry, owning install
test, predecessor bookkeeping and this report. Tokens metadata/styles and all
other component source remain unchanged.

Verification through the configured build router:

- Owning install integration: final3/3, real default/custom check/build/SSR/replay.
- Full registry53/53 and real packed package3/3: exit0.
- Maintained fixture check/build and exact token projections: exit0, zero Svelte
  errors/warnings.
- Typecheck, lint, format and governing contracts: exit0.
- Source/staged diff and whitespace review pass. Cargo N/A; no affected Rust
  workspace. No native browser/base-path or complete-MVP acceptance claimed here.

No blocker. S152 remains a green candidate at its actual implementation anchor,
including the explicitly pending native-type repair assessment. Continue only
to original S154 after this green commit; separate S181 acceptance gates S182.
Reference source/original criteria remain intact; no push/publication/deployment.
