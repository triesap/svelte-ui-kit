/** Kit2 plugin options replace legacy configuration, even when the object is empty. */
import { inspectStaticPluginConfig } from "./static-plugin-config.js";
import type { ModelResult } from "../registry/errors.js";
export const VITE_CONFIG_FILES = [
  "vite.config.js",
  "vite.config.mjs",
  "vite.config.ts",
  "vite.config.mts",
  "vite.config.cjs",
  "vite.config.cts",
] as const;
export function inspectSvelteKitViteConfig(
  source: string,
  file: string,
): ModelResult<null> {
  return inspectStaticPluginConfig(source, file, {
    title: "SvelteKit Vite",
    code: "PROJECT_SVELTEKIT_VITE_UNSUPPORTED",
    help: "use a direct default object or imported defineConfig({ plugins: [sveltekit()] }) from vite and @sveltejs/kit/vite; put supported literal mappings in svelte.config.ts and omit all sveltekit arguments.",
    factoryModule: "vite",
    factoryName: "defineConfig",
    pluginModule: "@sveltejs/kit/vite",
    pluginName: "sveltekit",
    arrayProperty: "plugins",
  });
}
