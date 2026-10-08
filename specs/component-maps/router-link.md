# Optional Router Link native recipe

Source: [component](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/router_link.rs)
and [manifest](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/router-link.json).
The source wraps Leptos Router A with required href/children, optional caller
class and kit-anchor presentation. It owns no CSS block and depends on Anchor.

## Exact target surface and ownership

Exports: RouterLink and RouterLinkProps. Two flat files, `router-link.svelte` and
`router-link.types.ts`, form the router-link source/export cohort. The component
directly imports sibling Anchor and binds its real anchor ref. RouterLinkProps
is exactly AnchorProps, preserving required string href/Snippet children and all
native attrs/events/classes, targets/rel/download and HTMLAnchorElement binding.
The recipe owns no wrapper element or navigation handler. Anchor supplies the
source kit-anchor class and source style; no duplicate or competing CSS block.

Registry dependency is Anchor, which transitively supplies tokens. No router
package, store, context, route subscription, active-link inference, compatibility
alias, kit runtime or npm dependency is introduced. SvelteKit already belongs to
the generated application's environment. Source Leptos A is replaced by the
application's native SvelteKit link handling; callers set aria-current/classes
explicitly when their application needs active-link presentation.

## Pinned SvelteKit URL and native link options

Inspected installed SvelteKit2.70.3 $app/paths public declarations and actual
server/client resolve implementations. Application code calls resolve() for
internal route IDs/pathnames, including parameters/query/fragment, then passes
the result as href. The component forwards it unchanged: it neither prefixes
base twice nor calls resolve() on external URLs. Server resolve can return a
request-relative base path; client resolve prefixes the configured base.
Assets use the application's asset() result; external/relative/native download
URLs remain caller-owned. S154 qualifies actual base-path behavior in production
consumers rather than certifying it from these inspected declarations alone.

Actual SvelteKit-generated Svelte HTMLAttributes augmentation supplies native
data-sveltekit options. Keepfocus, noscroll, reload and replacestate accept true,
empty string, off and null/undefined. Preload-code additionally supports eager,
viewport, hover and tap; preload-data supports hover and tap. These are native
data attributes; no camelCase recipe options are invented. Types inherit the
actual application augmentation, without a kit copy of its unions. Type fixtures
extract that actual module augmentation from a freshly synchronized owned
SvelteKit consumer and compile it with the real native type contract; invalid
known option values fail even though ordinary caller data attributes remain
native. The test augments only its owned type program; installed Svelte/SvelteKit
source remains unchanged.

The initial native-negative fixtures exposed Anchor's mapped Omit erasing three
known SvelteKit option constraints. A raw native anchor rejects the same invalid
value with the actual generated augmentation. Preserve the native interface by
intersecting compatible required href/children/ref props instead; Anchor's
source/type cohort becomes version0.1.1. Existing rendering and native API remain
unchanged. Requalify the registered dependency before this contract commit;
separate S181 review must independently assess the repair.

Native events and cancellation, target/rel safety defaults, refs/snippets and
SSR/hydration follow Anchor. SvelteKit handles internal navigation once; external,
target and download cases remain native. There is no kit event ordering layer,
button keyboard behavior, automatic href rewriting or route service.

S152 freezes this bounded API. S153 generates/installs it; S154 verifies actual
internal/external/target/download behavior, native link options and base paths,
then documents optional installation/composition. Separate S181 acceptance is
still required before later cross-catalog work.
