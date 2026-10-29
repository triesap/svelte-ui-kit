/** Explicit package3 aliases after genuine Kit2 sync has completed. */
import path from "node:path";
import config from "./.native-svelte-config.js";

export default { ...config, alias: { $lib: path.resolve("src/lib") } };
