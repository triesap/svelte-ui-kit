/** Drop invocation-local pnpm placement before repository lifecycle tooling.
 * Immutable native producers already allocate unique managed temporary roots;
 * they must not inherit the calling workspace's mutable virtual store.
 */
export function clearInheritedNodePlacement(env: NodeJS.ProcessEnv): void {
  if (!env.EXTBUILD_EXECUTABLE) return;
  for (const key of Object.keys(env)) {
    if (/^(p?npm)_config_virtual_store_dir$/i.test(key)) delete env[key];
  }
  delete env.EXTBUILD_NODE_WORKSPACE_ROOT;
  delete env.EXTBUILD_NODE_VIRTUAL_STORE_DIR;
}
clearInheritedNodePlacement(process.env);
