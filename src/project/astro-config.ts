/** Static Astro integration proof shares the literal plugin parser. */
import { inspectStaticPluginConfig } from "./static-plugin-config.js";
import type { ModelResult } from "../registry/errors.js";
export function inspectAstroConfig(
  source: string,
  file: string,
): ModelResult<null> {
  return inspectStaticPluginConfig(source, file, {
    title: "Astro",
    code: "PROJECT_ASTRO_CONFIG_UNSUPPORTED",
    help: "use a direct literal default object or defineConfig({ integrations: [svelte()] }) with imports from astro/config and @astrojs/svelte.",
    factoryModule: "astro/config",
    factoryName: "defineConfig",
    pluginModule: "@astrojs/svelte",
    pluginName: "default",
    arrayProperty: "integrations",
  });
}
