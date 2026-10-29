/** Immutable upstream runtime input; the upstream compiler remains untouched. */
export type SvelteRuntimeMode = "complete" | "dispatch-only" | "unpatched";

export const SVELTE_RUNTIME_RECIPE = Object.freeze({
  schemaVersion: 1,
  name: "svelte",
  sourceVersion: "5.57.3",
  buildId: "5.57.3-reset-dispatch.2",
  controlId: "5.57.3-reset-dispatch.2.control",
  dispatchControlId: "5.57.3-reset-dispatch.2.dispatch-control",
  sourceUrl: "https://registry.npmjs.org/svelte/-/svelte-5.57.3.tgz",
  sourceIntegrity:
    "sha512-5mAftM3SoDV9X0zdF386F9p2pv8iKOwi/KfBS1XnBAkVCKFzVOLHUoa8iGWAt4buoicLmyWVRpuuD5wplXOQsg==",
  sourceSha256:
    "afda776761670addcd6f4345c1b4b0665c8dd11b82961cbfee9696d5d9f4546a",
  compilerVersion: "5.57.3",
  compilerSha256:
    "53fd6de1a6932eda8da99820cfbd31766cc77e4ba2e9b51fb01540a3b293b9a7",
  node: "24.22.1",
  pnpm: "12.16.1",
});
